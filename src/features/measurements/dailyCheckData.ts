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

export const steps = [
  { id: 'bp', name: 'Blood pressure', icon: Heart, description: 'Tensiómetro automático con manguito en el brazo; elige la talla del manguito.' },
  { id: 'hr', name: 'Heart rate', icon: Activity, description: 'Oxímetro de dedo: una sola lectura da oxígeno y pulso.' },
  { id: 'spo2', name: 'Blood oxygen', icon: Droplets, description: 'Oxímetro de dedo: una sola lectura da oxígeno y pulso.' },
  { id: 'resp', name: 'Respiratory rate', icon: Wind, description: 'Cuenta tus respiraciones durante 60 segundos en reposo.' },
  { id: 'temp', name: 'Body temperature', icon: Thermometer, description: 'Termómetro del botiquín.' },
  { id: 'sleep', name: 'Sleep', icon: Moon, description: 'Reloj de actividad o tu propia estimación.' },
  { id: 'mood', name: 'Mood', icon: Smile, description: 'Cognitive and psychological self-assessment.' },
  { id: 'exercise', name: 'Exercise', icon: Dumbbell, description: 'Minutos de ejercicio hoy.' },
  { id: 'vision', name: 'Vision', icon: Eye, description: '¿Notas algún cambio en tu visión hoy?' },
  { id: 'glucose', name: 'Blood sugar (optional)', icon: Droplets, description: 'Solo si tu misión lleva glucómetro; no es parte de los chequeos de rutina de la estación.' },
] as const satisfies readonly { id: StepId; name: string; icon: unknown; description: string }[]

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
