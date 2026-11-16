import type { Indicator } from '../../types'
import type { DailyMetrics, SavedRecord } from '../measurements/dailyCheckTypes'
import { evaluateDailyMetrics } from './healthEngine'

/** Cuántos chequeos se usan para la mini gráfica de cada indicador. */
export const HISTORY_LENGTH = 7

/**
 * Indicadores del último chequeo real. La mini gráfica (history) sale de los chequeos reales
 * anteriores (del más antiguo al más reciente), nunca de datos de demostración.
 * Sin chequeos devuelve una lista vacía: el usuario nuevo empieza en blanco.
 * `records` va del más reciente al más antiguo; `fallback` son las medidas de versiones anteriores sin historial.
 */
export function liveIndicators(records: readonly SavedRecord[], fallback: DailyMetrics | null = null): Indicator[] {
  const latest = records[0]?.metrics ?? fallback
  if (!latest) return []
  const previous = records.slice(1, HISTORY_LENGTH).map((record) => evaluateDailyMetrics(record.metrics)).reverse()
  return evaluateDailyMetrics(latest).map((indicator) => {
    if (indicator.history.length === 0) return indicator
    const past = previous.flatMap((list) => list.find((item) => item.id === indicator.id)?.history ?? [])
    return { ...indicator, history: [...past, ...indicator.history] }
  })
}
