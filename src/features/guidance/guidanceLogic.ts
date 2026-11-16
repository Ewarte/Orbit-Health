import { guidanceEntries, type GuidanceEntry } from '../../data/guidance'
import type { Indicator } from '../../types'

export interface Alert {
  indicator: Indicator
  entry: GuidanceEntry | undefined
}

const severity = { act: 0, watch: 1, ok: 2 } as const

/**
 * Desempate entre alertas del mismo estado: primero lo más urgente para la vida
 * (aprobado por el equipo el 2026-11-16). Lo que no está en la lista va después, en su orden.
 */
export const ALERT_PRIORITY: readonly string[] = ['spo2', 'resp', 'hr', 'bp', 'temp']

function priority(id: string): number {
  const i = ALERT_PRIORITY.indexOf(id)
  return i === -1 ? ALERT_PRIORITY.length : i
}

/**
 * Alertas activas: los indicadores que no están normales, los críticos primero y,
 * a igual estado, según ALERT_PRIORITY (oxígeno › respiración › pulso › presión › temperatura › el resto).
 * Se calculan de los indicadores en vivo, no de avisos escritos a mano.
 * Si un indicador no tiene guía, igual aparece (con el texto genérico de la pantalla).
 */
export function activeAlerts(indicators: readonly Indicator[], entries: readonly GuidanceEntry[] = guidanceEntries): Alert[] {
  return indicators
    .filter((indicator) => indicator.status !== 'ok')
    .map((indicator) => ({ indicator, entry: entries.find((item) => item.indicatorId === indicator.id) }))
    .sort(
      (a, b) =>
        severity[a.indicator.status] - severity[b.indicator.status] || priority(a.indicator.id) - priority(b.indicator.id),
    )
}
