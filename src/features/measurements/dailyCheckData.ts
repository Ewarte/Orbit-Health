import { Activity, Dumbbell, Droplets, Eye, Heart, Moon, Smile, Thermometer, Wind } from 'lucide-react'
import type { DailyMetrics, Mood } from './dailyCheckTypes'

export const STORAGE_KEY = 'orbit_health_daily_records'
export const CURRENT_METRICS_KEY = 'orbit_health_current_metrics'

export const defaultMetrics: DailyMetrics = {
  bloodPressureSys: 128,
  bloodPressureDia: 82,
  heartRate: 64,
  spo2: 98,
  respiratoryRate: 14,
  bodyTemperature: 36.7,
  sleepHours: 5.2,
  mood: 'Good',
  exerciseMinutes: 45,
  visionChange: false,
  bloodSugar: null,
}

/**
 * Mezcla un registro guardado (posiblemente antiguo, sin los campos nuevos) con los valores
 * por defecto. Conserva bloodSugar si es numérico; si no, queda en null (no medido).
 */
export function normalizeMetrics(raw: unknown): DailyMetrics {
  const source = raw && typeof raw === 'object' ? (raw as Partial<DailyMetrics>) : {}
  return {
    ...defaultMetrics,
    ...source,
    bloodSugar: typeof source.bloodSugar === 'number' ? source.bloodSugar : null,
  }
}

export const moodOptions: Mood[] = ['Bad', 'Fair', 'Neutral', 'Good', 'Great']

export type StepId = 'bp' | 'hr' | 'spo2' | 'resp' | 'temp' | 'sleep' | 'mood' | 'exercise' | 'vision' | 'glucose'

/** Pasos del asistente. Los textos de cada paso salen de las claves step.<id>.name y step.<id>.desc. */
export const steps = [
  { id: 'bp', icon: Heart },
  { id: 'hr', icon: Activity },
  { id: 'spo2', icon: Droplets },
  { id: 'resp', icon: Wind },
  { id: 'temp', icon: Thermometer },
  { id: 'sleep', icon: Moon },
  { id: 'mood', icon: Smile },
  { id: 'exercise', icon: Dumbbell },
  { id: 'vision', icon: Eye },
  { id: 'glucose', icon: Droplets },
] as const satisfies readonly { id: StepId; icon: unknown }[]

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
