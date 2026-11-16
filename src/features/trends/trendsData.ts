/*
  Datos de la pantalla Tendencias, sin pantalla (para poder probarlos).

  La pantalla es de DEMOSTRACIÓN: los días sin chequeo se completan con una simulación.
  Los días con chequeos reales usan esos valores reales. Las fechas son siempre relativas a
  «hoy» (día UTC de la misión), nunca fijas.
*/
import type { DailyMetrics, SavedRecord } from '../measurements/dailyCheckTypes'

export type MetricId = 'bp' | 'hr' | 'glucose' | 'temp' | 'sleep' | 'mood' | 'spo2' | 'radiation'

export interface TelemetryPoint {
  /** Día de la misión (1 = despegue). */
  day: number
  /** Fecha del punto en UTC, AAAA-MM-DD. */
  dateKey: string
  bpSys: number
  bpDia: number
  hr: number
  glucose: number
  temp: number
  sleep: number
  mood: number // 1 a 5
  spo2: number
  radiation: number
  /** true si el día tiene al menos un chequeo real; false = todo simulado. */
  real: boolean
  /** true si la glucosa de este punto es simulada aunque el día tenga chequeo (la glucosa no es rutinaria). */
  glucoseSimulated: boolean
}

/** Máximo de días que se dibujan (los más recientes). */
export const MAX_TELEMETRY_DAYS = 365

const MS_PER_DAY = 86_400_000
const MOOD_VALUE = { Bad: 1, Fair: 2, Neutral: 3, Good: 4, Great: 5 } as const

/** Fecha UTC AAAA-MM-DD de un instante. */
export function utcDayKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

/** ¿El valor de este indicador en este punto viene de un chequeo real? (la radiación nunca se mide en el chequeo). */
export function isRealValue(point: Pick<TelemetryPoint, 'real' | 'glucoseSimulated'>, metric: MetricId): boolean {
  if (!point.real || metric === 'radiation') return false
  return !(metric === 'glucose' && point.glucoseSimulated)
}

/**
 * Misión simulada de `currentDay` días que termina HOY. El día d lleva la fecha de hoy menos
 * (currentDay − d) días. Los últimos tres días imitan una racha de poco sueño y ánimo bajo.
 */
export function buildSimulatedTelemetry(currentDay: number, nowMs: number): TelemetryPoint[] {
  const last = Math.max(1, Math.floor(currentDay))
  const first = Math.max(1, last - MAX_TELEMETRY_DAYS + 1)
  const points: TelemetryPoint[] = []

  for (let d = first; d <= last; d++) {
    const daysBack = last - d
    let sleepVal = 7.3 + Math.sin(d * 0.7) * 0.5
    if (daysBack === 2) sleepVal = 5.6
    if (daysBack === 1) sleepVal = 5.3
    if (daysBack === 0) sleepVal = 5.2

    let moodVal = 4.2 + Math.cos(d * 0.5) * 0.4
    if (daysBack <= 2) moodVal = 2.4 - daysBack * 0.2

    points.push({
      day: d,
      dateKey: utcDayKey(nowMs - daysBack * MS_PER_DAY),
      bpSys: Math.round(127 + Math.sin(d * 0.4) * 3 + (daysBack === 0 ? 1 : 0)),
      bpDia: Math.round(81 + Math.cos(d * 0.4) * 2 + (daysBack === 0 ? 1 : 0)),
      hr: Math.round(64 + Math.sin(d * 0.8) * 2.5),
      glucose: Math.round(95 + Math.cos(d * 0.6) * 3),
      temp: Number((36.6 + Math.sin(d * 0.3) * 0.15).toFixed(1)),
      sleep: Number(sleepVal.toFixed(1)),
      mood: Number(moodVal.toFixed(1)),
      spo2: Math.round(98 + Math.sin(d * 0.9) * 0.8),
      radiation: Number((0.36 + Math.sin(d * 0.2) * 0.05).toFixed(2)),
      real: false,
      glucoseSimulated: true,
    })
  }
  return points
}

const mean = (values: number[]) => values.reduce((total, value) => total + value, 0) / values.length

/**
 * Pone los chequeos reales sobre la simulación. Se usan TODOS los registros (no solo el último):
 * cada día con chequeos toma sus valores reales; si hay varios el mismo día UTC, se promedian.
 * Los registros de fechas fuera del rango dibujado se ignoran. No modifica la entrada.
 */
export function overlayRecords(points: readonly TelemetryPoint[], records: readonly SavedRecord[]): TelemetryPoint[] {
  const byDay = new Map<string, DailyMetrics[]>()
  for (const record of records) {
    const ms = Date.parse(record.timestamp)
    if (Number.isNaN(ms)) continue
    const key = utcDayKey(ms)
    byDay.set(key, [...(byDay.get(key) ?? []), record.metrics])
  }

  return points.map((point) => {
    const metrics = byDay.get(point.dateKey)
    if (!metrics) return { ...point }
    const measuredGlucose = metrics.flatMap((m) => (m.bloodSugar === null ? [] : [m.bloodSugar]))
    const round1 = (n: number) => Number(n.toFixed(1))
    return {
      ...point,
      bpSys: Math.round(mean(metrics.map((m) => m.bloodPressureSys))),
      bpDia: Math.round(mean(metrics.map((m) => m.bloodPressureDia))),
      hr: Math.round(mean(metrics.map((m) => m.heartRate))),
      temp: round1(mean(metrics.map((m) => m.bodyTemperature))),
      sleep: round1(mean(metrics.map((m) => m.sleepHours))),
      mood: round1(mean(metrics.map((m) => MOOD_VALUE[m.mood]))),
      spo2: Math.round(mean(metrics.map((m) => m.spo2))),
      glucose: measuredGlucose.length > 0 ? Math.round(mean(measuredGlucose)) : point.glucose,
      glucoseSimulated: measuredGlucose.length === 0,
      real: true,
    }
  })
}

const NUMERIC_FIELDS: Record<Exclude<keyof TelemetryPoint, 'dateKey' | 'real' | 'glucoseSimulated' | 'day'>, [number, number]> = {
  bpSys: [60, 260],
  bpDia: [30, 160],
  hr: [20, 250],
  glucose: [10, 800],
  temp: [30, 45],
  sleep: [0, 24],
  mood: [1, 5],
  spo2: [50, 100],
  radiation: [0, 100],
}

/**
 * Lee la simulación guardada con el botón «Cargar misión simulada» y la valida: debe ser una
 * lista de puntos con números finitos dentro de rango, con el largo y la fecha de HOY que se
 * esperan. Si algo no cuadra (dañada, vieja, de otro día), devuelve null y se vuelve a generar.
 * Solo guarda la parte simulada: los chequeos reales se superponen siempre al leer.
 */
export function parseStoredTelemetry(raw: string | null, currentDay: number, nowMs: number): TelemetryPoint[] | null {
  if (!raw) return null
  try {
    const data: unknown = JSON.parse(raw)
    const expected = buildSimulatedTelemetry(currentDay, nowMs)
    if (!Array.isArray(data) || data.length !== expected.length) return null
    const points: TelemetryPoint[] = []
    for (let index = 0; index < data.length; index += 1) {
      const item: unknown = data[index]
      if (!item || typeof item !== 'object') return null
      const record = item as Record<string, unknown>
      if (record.day !== expected[index].day || record.dateKey !== expected[index].dateKey) return null
      const point = { ...expected[index] } as TelemetryPoint
      for (const [field, [min, max]] of Object.entries(NUMERIC_FIELDS)) {
        const value = record[field]
        if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) return null
        ;(point as unknown as Record<string, number>)[field] = value
      }
      points.push(point)
    }
    return points
  } catch {
    return null
  }
}
