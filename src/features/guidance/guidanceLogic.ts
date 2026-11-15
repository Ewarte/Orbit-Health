import { guidanceEntries, type GuidanceEntry } from '../../data/guidance'
import type { Indicator } from '../../types'

export interface Alert {
  indicator: Indicator
  entry: GuidanceEntry | undefined
}

const severity = { act: 0, watch: 1, ok: 2 } as const

/**
 * Alertas activas: los indicadores que no están normales, los críticos primero.
 * Se calculan de los indicadores en vivo, no de avisos escritos a mano.
 * Si un indicador no tiene guía, igual aparece (con el texto genérico de la pantalla).
 */
export function activeAlerts(indicators: readonly Indicator[], entries: readonly GuidanceEntry[] = guidanceEntries): Alert[] {
  return indicators
    .filter((indicator) => indicator.status !== 'ok')
    .map((indicator) => ({ indicator, entry: entries.find((item) => item.indicatorId === indicator.id) }))
    .sort((a, b) => severity[a.indicator.status] - severity[b.indicator.status])
}
