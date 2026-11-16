/*
  Cálculos de la Vista médica, sin pantalla: filtro por fechas, resumen por indicador y estado de
  cada celda. Los rangos son los del motor de evaluación (BORRADOR, sin validación clínica).
*/
import type { MessageKey } from '../../lib/i18n'
import type { Status } from '../../types'
import { evaluate, healthRanges, derivedBloodPressure, type Range } from '../evaluation/healthEngine'
import { evaluateTrend, type TrendRuleResult } from '../evaluation/trendRule'
import type { DailyMetrics, SavedRecord } from '../measurements/dailyCheckTypes'

export type RangeFilter = '7d' | '30d' | 'all'

const MS_PER_DAY = 86_400_000
const FILTER_DAYS: Record<Exclude<RangeFilter, 'all'>, number> = { '7d': 7, '30d': 30 }

/** Registros dentro del rango elegido, contados hacia atrás desde `nowMs`. Conserva el orden recibido. */
export function filterRecords(records: SavedRecord[], filter: RangeFilter, nowMs: number): SavedRecord[] {
  if (filter === 'all') return records
  const since = nowMs - FILTER_DAYS[filter] * MS_PER_DAY
  return records.filter((record) => Date.parse(record.timestamp) >= since)
}

/** Columnas de valores del registro: tabla en pantalla y exportación comparten esta lista. */
export interface ValueColumn {
  field: keyof DailyMetrics
  /** Clave de texto del nombre de la columna. */
  labelKey: MessageKey
  /** Unidad; 'breathsMin' se traduce con la clave unit.breathsMin; '' = sin unidad. */
  unit: 'mmHg' | 'bpm' | '%' | 'breathsMin' | '°C' | 'h' | 'min' | 'mg/dL' | ''
}

export const VALUE_COLUMNS: readonly ValueColumn[] = [
  { field: 'bloodPressureSys', labelKey: 'medical.col.bloodPressureSys', unit: 'mmHg' },
  { field: 'bloodPressureDia', labelKey: 'medical.col.bloodPressureDia', unit: 'mmHg' },
  { field: 'heartRate', labelKey: 'medical.col.heartRate', unit: 'bpm' },
  { field: 'spo2', labelKey: 'medical.col.spo2', unit: '%' },
  { field: 'respiratoryRate', labelKey: 'medical.col.respiratoryRate', unit: 'breathsMin' },
  { field: 'bodyTemperature', labelKey: 'medical.col.bodyTemperature', unit: '°C' },
  { field: 'sleepHours', labelKey: 'medical.col.sleepHours', unit: 'h' },
  { field: 'exerciseMinutes', labelKey: 'medical.col.exerciseMinutes', unit: 'min' },
  { field: 'bloodSugar', labelKey: 'medical.col.bloodSugar', unit: 'mg/dL' },
  { field: 'mood', labelKey: 'medical.col.mood', unit: '' },
  { field: 'visionChange', labelKey: 'medical.col.visionChange', unit: '' },
]

const rangeByField: Partial<Record<keyof DailyMetrics, Range>> = {
  bloodPressureSys: healthRanges.bloodPressureSys,
  bloodPressureDia: healthRanges.bloodPressureDia,
  heartRate: healthRanges.heartRate,
  spo2: healthRanges.spo2,
  respiratoryRate: healthRanges.respiratoryRate,
  bodyTemperature: healthRanges.bodyTemperature,
  sleepHours: healthRanges.sleepHours,
  exerciseMinutes: healthRanges.exerciseMinutes,
  bloodSugar: healthRanges.bloodSugar,
}

const moodValue = { Bad: 1, Fair: 2, Neutral: 3, Good: 4, Great: 5 } as const

/** Estado de una medida de un registro frente al rango del motor; undefined si no se midió (glucosa). */
export function cellStatus(metrics: DailyMetrics, field: keyof DailyMetrics): Status | undefined {
  if (field === 'visionChange') return metrics.visionChange ? 'watch' : 'ok'
  if (field === 'mood') return evaluate(moodValue[metrics.mood], healthRanges.mood)
  const value = metrics[field]
  const range = rangeByField[field]
  if (typeof value !== 'number' || !range) return undefined
  return evaluate(value, range)
}

/** Indicador del resumen: una medida con su rango (o un valor calculado, sin rango ni estado). */
export interface SummaryDef {
  id: string
  labelKey: MessageKey
  unit: ValueColumn['unit']
  decimals: number
  /** Rango del motor (borrador); undefined en los valores calculados. */
  range?: Range
  pick: (metrics: DailyMetrics) => number | null
}

export const SUMMARY_DEFS: readonly SummaryDef[] = [
  { id: 'sys', labelKey: 'medical.col.bloodPressureSys', unit: 'mmHg', decimals: 0, range: healthRanges.bloodPressureSys, pick: (m) => m.bloodPressureSys },
  { id: 'dia', labelKey: 'medical.col.bloodPressureDia', unit: 'mmHg', decimals: 0, range: healthRanges.bloodPressureDia, pick: (m) => m.bloodPressureDia },
  { id: 'map', labelKey: 'medical.summary.map', unit: 'mmHg', decimals: 0, pick: (m) => derivedBloodPressure(m.bloodPressureSys, m.bloodPressureDia).meanArterial },
  { id: 'pp', labelKey: 'medical.summary.pp', unit: 'mmHg', decimals: 0, pick: (m) => derivedBloodPressure(m.bloodPressureSys, m.bloodPressureDia).pulsePressure },
  { id: 'hr', labelKey: 'medical.col.heartRate', unit: 'bpm', decimals: 0, range: healthRanges.heartRate, pick: (m) => m.heartRate },
  { id: 'spo2', labelKey: 'medical.col.spo2', unit: '%', decimals: 0, range: healthRanges.spo2, pick: (m) => m.spo2 },
  { id: 'resp', labelKey: 'medical.col.respiratoryRate', unit: 'breathsMin', decimals: 0, range: healthRanges.respiratoryRate, pick: (m) => m.respiratoryRate },
  { id: 'temp', labelKey: 'medical.col.bodyTemperature', unit: '°C', decimals: 1, range: healthRanges.bodyTemperature, pick: (m) => m.bodyTemperature },
  { id: 'sleep', labelKey: 'medical.col.sleepHours', unit: 'h', decimals: 1, range: healthRanges.sleepHours, pick: (m) => m.sleepHours },
  { id: 'exercise', labelKey: 'medical.col.exerciseMinutes', unit: 'min', decimals: 0, range: healthRanges.exerciseMinutes, pick: (m) => m.exerciseMinutes },
  { id: 'glucose', labelKey: 'medical.col.bloodSugar', unit: 'mg/dL', decimals: 0, range: healthRanges.bloodSugar, pick: (m) => m.bloodSugar },
]

export interface IndicatorSummary {
  def: SummaryDef
  /** Último valor medido (el del registro más reciente que lo tenga). */
  latest: number | null
  /** Estado del último valor; undefined si no hay valor o el indicador es calculado. */
  status: Status | undefined
  /** Promedio, mínimo y máximo de los registros de los últimos 7 días; null si no hay ninguno. */
  avg: number | null
  min: number | null
  max: number | null
  /** Cuántos registros entran en esos 7 días. */
  countLast7: number
  /** Regla de tendencia (3 lecturas seguidas fuera de rango); null en los valores calculados. */
  trend: TrendRuleResult | null
}

/**
 * Resumen por indicador. `records` va del más reciente al más antiguo. El último valor y la regla de
 * tendencia usan todo el historial; el promedio, mínimo y máximo, solo los últimos 7 días.
 */
export function summarizeIndicators(records: SavedRecord[], nowMs: number): IndicatorSummary[] {
  const since = nowMs - 7 * MS_PER_DAY
  return SUMMARY_DEFS.map((def) => {
    const all = records
      .map((record) => ({ at: Date.parse(record.timestamp), value: def.pick(record.metrics) }))
      .filter((item): item is { at: number; value: number } => item.value !== null)
    const latest = all[0]?.value ?? null
    const week = all.filter((item) => item.at >= since).map((item) => item.value)
    const sum = week.reduce((total, value) => total + value, 0)
    return {
      def,
      latest,
      status: latest !== null && def.range ? evaluate(latest, def.range) : undefined,
      avg: week.length > 0 ? sum / week.length : null,
      min: week.length > 0 ? Math.min(...week) : null,
      max: week.length > 0 ? Math.max(...week) : null,
      countLast7: week.length,
      trend: def.range ? evaluateTrend([...all].reverse().map((item) => item.value), def.range.min, def.range.max) : null,
    }
  })
}
