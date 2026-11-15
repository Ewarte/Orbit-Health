import { Activity, Check, Droplets, Dumbbell, Eye, Heart, Moon, Smile, Thermometer, Wind } from 'lucide-react'
import { moodLabel } from '../../lib/domainText'
import { useI18n } from '../../lib/useI18n'
import type { I18n } from '../../lib/useI18n'
import { derivedBloodPressure } from '../evaluation/healthEngine'
import type { StepId } from './dailyCheckData'
import type { DailyMetrics } from './dailyCheckTypes'

interface Props { metrics: DailyMetrics; onSelect: (step: StepId) => void }

type T = I18n['t']

interface Card {
  id: StepId
  icon: typeof Heart
  value: (m: DailyMetrics, t: T) => string
  unit: (m: DailyMetrics, t: T) => string
  extra?: (m: DailyMetrics, t: T) => string
}

/** El nombre de cada tarjeta sale de la clave step.<id>.name. */
const cards: Card[] = [
  {
    id: 'bp', icon: Heart, value: (m) => `${m.bloodPressureSys} / ${m.bloodPressureDia}`, unit: () => 'mmHg',
    extra: (m, t) => {
      const { meanArterial, pulsePressure } = derivedBloodPressure(m.bloodPressureSys, m.bloodPressureDia)
      return t('check.card.mapPp', { map: meanArterial, pp: pulsePressure })
    },
  },
  { id: 'hr', icon: Activity, value: (m) => `${m.heartRate}`, unit: () => 'bpm' },
  { id: 'spo2', icon: Droplets, value: (m) => `${m.spo2}`, unit: () => '%' },
  { id: 'resp', icon: Wind, value: (m) => `${m.respiratoryRate}`, unit: (_m, t) => t('unit.breathsMin') },
  { id: 'temp', icon: Thermometer, value: (m) => m.bodyTemperature.toFixed(1), unit: () => '°C' },
  { id: 'sleep', icon: Moon, value: (m) => `${m.sleepHours}`, unit: (_m, t) => t('unit.hours') },
  { id: 'mood', icon: Smile, value: (m, t) => moodLabel(t, m.mood), unit: () => '' },
  { id: 'exercise', icon: Dumbbell, value: (m) => `${m.exerciseMinutes}`, unit: (_m, t) => t('unit.minToday') },
  { id: 'vision', icon: Eye, value: (m, t) => (m.visionChange ? t('value.changeReported') : t('value.noChange')), unit: () => '' },
  { id: 'glucose', icon: Droplets, value: (m, t) => (m.bloodSugar === null ? t('value.notMeasured') : `${m.bloodSugar}`), unit: (m) => (m.bloodSugar === null ? '' : 'mg/dL') },
]

export function DailyMetricCards({ metrics, onSelect }: Props) {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5 lg:gap-3">
      {cards.map(({ id, icon: Icon, value, unit, extra }) => (
        <button key={id} type="button" onClick={() => onSelect(id)} className="group relative min-h-11 rounded-xl border border-edge bg-panel p-4 text-left lg:p-3.5 transition-colors hover:border-ok hover:bg-edge">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-notice text-ok"><Icon className="h-5 w-5" /></span>
              <span className="text-sm font-medium text-mute group-hover:text-text">{t(`step.${id}.name`)}</span>
            </div>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-notice text-ok lg:hidden xl:flex"><Check className="h-3.5 w-3.5 stroke-[3]" /></span>
          </div>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="font-display text-2xl font-bold tracking-tight text-text sm:text-3xl lg:text-2xl">{value(metrics, t)}</span>
            {unit(metrics, t) && <span className="text-sm text-mute">{unit(metrics, t)}</span>}
          </div>
          {extra && <p className="mt-1 text-xs text-mute">{extra(metrics, t)}</p>}
        </button>
      ))}
    </div>
  )
}
