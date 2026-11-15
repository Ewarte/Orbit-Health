import { Activity, Droplets, Heart, Moon, Smile, Thermometer } from 'lucide-react'
import type { DailyMetrics, Mood } from './dailyCheckTypes'

export const STORAGE_KEY = 'orbit_health_daily_records'
export const CURRENT_METRICS_KEY = 'orbit_health_current_metrics'

export const defaultMetrics: DailyMetrics = {
  bloodPressureSys: 128,
  bloodPressureDia: 82,
  heartRate: 64,
  bloodSugar: 96,
  bodyTemperature: 36.7,
  sleepHours: 5.2,
  mood: 'Good',
}

export const moodOptions: Mood[] = ['Bad', 'Fair', 'Neutral', 'Good', 'Great']

export const steps = [
  { name: 'Blood pressure', icon: Heart, description: 'Record your systolic and diastolic pressure via cabin arm cuff.' },
  { name: 'Heart rate', icon: Activity, description: 'Resting pulse measured by bio-monitor telemetry.' },
  { name: 'Blood sugar', icon: Droplets, description: 'Capillary glucose level before daily caloric intake.' },
  { name: 'Body temperature', icon: Thermometer, description: 'Core tympanic body temperature.' },
  { name: 'Sleep', icon: Moon, description: 'Total duration of rest in acoustic sleeping quarters.' },
  { name: 'Mood', icon: Smile, description: 'Cognitive and psychological self-assessment.' },
] as const

export function formatTime(date = new Date()) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

export function createRecord(metrics: DailyMetrics, date = new Date()) {
  return {
    id: `rec-${Date.now()}`,
    timestamp: date.toISOString(),
    dateStr: date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
    timeStr: formatTime(date),
    metrics: { ...metrics },
  }
}
