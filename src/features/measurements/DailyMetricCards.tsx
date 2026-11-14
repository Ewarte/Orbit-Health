import { Activity, Check, Droplets, Heart, Moon, Smile, Thermometer } from 'lucide-react'
import type { DailyMetrics } from './dailyCheckTypes'

interface Props { metrics: DailyMetrics; onSelect: (step: number) => void }

const cards = [
  { label: 'Blood pressure', icon: Heart, value: (m: DailyMetrics) => `${m.bloodPressureSys} / ${m.bloodPressureDia}`, unit: 'mmHg' },
  { label: 'Heart rate', icon: Activity, value: (m: DailyMetrics) => `${m.heartRate}`, unit: 'bpm' },
  { label: 'Blood sugar', icon: Droplets, value: (m: DailyMetrics) => `${m.bloodSugar}`, unit: 'mg/dL' },
  { label: 'Body temperature', icon: Thermometer, value: (m: DailyMetrics) => m.bodyTemperature.toFixed(1), unit: '°C' },
  { label: 'Sleep', icon: Moon, value: (m: DailyMetrics) => `${m.sleepHours}`, unit: 'hours' },
  { label: 'Mood', icon: Smile, value: (m: DailyMetrics) => m.mood, unit: '' },
]

export function DailyMetricCards({ metrics, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map(({ label, icon: Icon, value, unit }, index) => (
        <button key={label} type="button" onClick={() => onSelect(index)} className="group relative rounded-xl border border-edge bg-panel p-5 text-left transition-colors hover:border-ok hover:bg-edge">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-notice text-ok"><Icon className="h-5 w-5" /></span>
              <span className="text-sm font-medium text-mute group-hover:text-text">{label}</span>
            </div>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-notice text-ok"><Check className="h-3.5 w-3.5 stroke-[3]" /></span>
          </div>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="font-display text-2xl font-bold tracking-tight text-text sm:text-3xl">{value(metrics)}</span>
            {unit && <span className="text-sm text-mute">{unit}</span>}
          </div>
        </button>
      ))}
    </div>
  )
}
