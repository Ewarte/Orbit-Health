import { Activity, Dumbbell, Droplets, Eye, Heart, Moon, Smile, Thermometer, Wind } from 'lucide-react'
import type { DailyMetrics, Mood, SavedRecord } from './dailyCheckTypes'

export const STORAGE_KEY = 'orbit_health_daily_records'
export const CURRENT_METRICS_KEY = 'orbit_health_current_metrics'

/**
 * Valores por defecto: SOLO la posición inicial de los controles del asistente.
 * Nunca son una medida guardada ni se evalúan como si lo fueran.
 */
export const defaultMetrics: DailyMetrics = {
  bloodPressureSys: 128,
  bloodPressureDia: 78,
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

/** Máximo de chequeos que se conservan en el historial (los más recientes). */
export const MAX_RECORDS = 365

/** Rangos POSIBLES de cada medida (no son rangos de salud): fuera de ellos, el dato se considera dañado. */
export const POSSIBLE_RANGES = {
  bloodPressureSys: { min: 60, max: 260 },
  bloodPressureDia: { min: 30, max: 160 },
  heartRate: { min: 20, max: 250 },
  spo2: { min: 50, max: 100 },
  respiratoryRate: { min: 4, max: 60 },
  bodyTemperature: { min: 30, max: 45 },
  sleepHours: { min: 0, max: 24 },
  exerciseMinutes: { min: 0, max: 1440 },
  bloodSugar: { min: 10, max: 800 },
} as const

/** Número finito dentro del rango posible; si no, undefined. */
function validNumber(value: unknown, range: { min: number; max: number }): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= range.min && value <= range.max ? value : undefined
}

/**
 * Mezcla un registro guardado (posiblemente antiguo, sin los campos nuevos o dañado) con los
 * valores por defecto. Cada campo se valida por tipo y rango posible: lo inválido (NaN, null,
 * texto, fuera de rango) se reemplaza por el valor por defecto, sin lanzar excepciones.
 * bloodSugar queda en null si no es un número válido (no medido). Nunca deja la diastólica
 * mayor o igual que la sistólica.
 */
export function normalizeMetrics(raw: unknown): DailyMetrics {
  const source: Record<string, unknown> = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {}
  const sys = validNumber(source.bloodPressureSys, POSSIBLE_RANGES.bloodPressureSys) ?? defaultMetrics.bloodPressureSys
  let dia = validNumber(source.bloodPressureDia, POSSIBLE_RANGES.bloodPressureDia) ?? defaultMetrics.bloodPressureDia
  if (dia >= sys) dia = Math.max(POSSIBLE_RANGES.bloodPressureDia.min, sys - 1)
  return {
    bloodPressureSys: sys,
    bloodPressureDia: dia,
    heartRate: validNumber(source.heartRate, POSSIBLE_RANGES.heartRate) ?? defaultMetrics.heartRate,
    spo2: validNumber(source.spo2, POSSIBLE_RANGES.spo2) ?? defaultMetrics.spo2,
    respiratoryRate: validNumber(source.respiratoryRate, POSSIBLE_RANGES.respiratoryRate) ?? defaultMetrics.respiratoryRate,
    bodyTemperature: validNumber(source.bodyTemperature, POSSIBLE_RANGES.bodyTemperature) ?? defaultMetrics.bodyTemperature,
    sleepHours: validNumber(source.sleepHours, POSSIBLE_RANGES.sleepHours) ?? defaultMetrics.sleepHours,
    exerciseMinutes: validNumber(source.exerciseMinutes, POSSIBLE_RANGES.exerciseMinutes) ?? defaultMetrics.exerciseMinutes,
    visionChange: typeof source.visionChange === 'boolean' ? source.visionChange : defaultMetrics.visionChange,
    bloodSugar: validNumber(source.bloodSugar, POSSIBLE_RANGES.bloodSugar) ?? null,
    mood: (moodOptions as readonly unknown[]).includes(source.mood) ? (source.mood as Mood) : defaultMetrics.mood,
  }
}

/**
 * Lee el historial guardado: descarta lo que no sea un registro válido (sin objeto de medidas o
 * sin fecha legible), normaliza las medidas, ordena del más reciente al más antiguo y conserva
 * como máximo los MAX_RECORDS más recientes. Nunca lanza excepciones.
 */
export function parseRecords(raw: unknown): SavedRecord[] {
  if (!Array.isArray(raw)) return []
  const records: SavedRecord[] = []
  raw.forEach((item: unknown, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return
    const data = item as Record<string, unknown>
    const metrics = data.metrics
    if (!metrics || typeof metrics !== 'object' || Array.isArray(metrics) || Object.keys(metrics).length === 0) return
    if (typeof data.timestamp !== 'string' || Number.isNaN(Date.parse(data.timestamp))) return
    records.push({
      id: typeof data.id === 'string' && data.id ? data.id : `rec-recovered-${index}`,
      timestamp: data.timestamp,
      dateStr: typeof data.dateStr === 'string' ? data.dateStr : '',
      timeStr: typeof data.timeStr === 'string' ? data.timeStr : '',
      metrics: normalizeMetrics(metrics),
      ...(typeof data.notes === 'string' ? { notes: data.notes } : {}),
    })
  })
  records.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
  return records.slice(0, MAX_RECORDS)
}

/** Hora UTC de la misión en formato «HH:MM» a partir de una fecha ISO; null si no es legible. */
export function formatUtcHHMM(iso: string | null | undefined): string | null {
  if (!iso) return null
  const ms = Date.parse(iso)
  return Number.isNaN(ms) ? null : new Date(ms).toISOString().slice(11, 16)
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

/** Hora UTC «HH:MM» (la hora de la misión es siempre UTC). */
export function formatTime(date = new Date()) {
  return date.toISOString().slice(11, 16)
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
