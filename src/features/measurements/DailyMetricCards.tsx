import { Activity, Check, Droplets, Dumbbell, Eye, Heart, Moon, Smile, Thermometer, Wind } from 'lucide-react'
import { derivedBloodPressure } from '../evaluation/healthEngine'
import type { StepId } from './dailyCheckData'
import type { DailyMetrics } from './dailyCheckTypes'

interface Props { metrics: DailyMetrics; onSelect: (step: StepId) => void }

interface Card {
  id: StepId
  label: string
  icon: typeof Heart
  value: (m: DailyMetrics) => string
  unit: (m: DailyMetrics) => string
  extra?: (m: DailyMetrics) => string
}

const cards: Card[] = [
  {
    id: 'bp', label: 'Blood pressure', icon: Heart, value: (m) => `${m.bloodPressureSys} / ${m.bloodPressureDia}`, unit: () => 'mmHg',
    extra: (m) => {
      const { meanArterial, pulsePressure } = derivedBloodPressure(m.bloodPressureSys, m.bloodPressureDia)
      return `MAP ${meanArterial} · PP ${pulsePressure} mmHg`
    },
  },
  { id: 'hr', label: 'Heart rate', icon: Activity, value: (m) => `${m.heartRate}`, unit: () => 'bpm' },
  { id: 'spo2', label: 'Blood oxygen', icon: Droplets, value: (m) => `${m.spo2}`, unit: () => '%' },
  { id: 'resp', label: 'Respiratory rate', icon: Wind, value: (m) => `${m.respiratoryRate}`, unit: () => 'breaths/min' },
  { id: 'temp', label: 'Body temperature', icon: Thermometer, value: (m) => m.bodyTemperature.toFixed(1), unit: () => '°C' },
  { id: 'sleep', label: 'Sleep', icon: Moon, value: (m) => `${m.sleepHours}`, unit: () => 'hours' },
  { id: 'mood', label: 'Mood', icon: Smile, value: (m) => m.mood, unit: () => '' },
  { id: 'exercise', label: 'Exercise', icon: Dumbbell, value: (m) => `${m.exerciseMinutes}`, unit: () => 'min today' },
  { id: 'vision', label: 'Vision', icon: Eye, value: (m) => (m.visionChange ? 'Change reported' : 'No change'), unit: () => '' },
  { id: 'glucose', label: 'Blood sugar (optional)', icon: Droplets, value: (m) => (m.bloodSugar === null ? 'Not measured' : `${m.bloodSugar}`), unit: (m) => (m.bloodSugar === null ? '' : 'mg/dL') },
]

export function DailyMetricCards({ metrics, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5 lg:gap-3">
      {cards.map(({ id, label, icon: Icon, value, unit, extra }) => (
        <button key={id} type="button" onClick={() => onSelect(id)} className="group relative min-h-11 rounded-xl border border-edge bg-panel p-4 text-left lg:p-3.5 transition-colors hover:border-ok hover:bg-edge">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-notice text-ok"><Icon className="h-5 w-5" /></span>
              <span className="text-sm font-medium text-mute group-hover:text-text">{label}</span>
            </div>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-notice text-ok lg:hidden xl:flex"><Check className="h-3.5 w-3.5 stroke-[3]" /></span>
          </div>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="font-display text-2xl font-bold tracking-tight text-text sm:text-3xl lg:text-2xl">{value(metrics)}</span>
            {unit(metrics) && <span className="text-sm text-mute">{unit(metrics)}</span>}
          </div>
          {extra && <p className="mt-1 text-xs text-mute">{extra(metrics)}</p>}
        </button>
      ))}
    </div>
  )
}
