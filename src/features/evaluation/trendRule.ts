export type TrendStatus = 'nominal' | 'warning' | 'critical'

export interface TrendRuleResult {
  status: TrendStatus
  consecutiveOutside: number
  message: string
}

/** Activa una alerta cuando una lectura queda fuera del rango durante 3 días seguidos. */
export function evaluateTrend(values: number[], min: number, max: number): TrendRuleResult {
  let consecutiveOutside = 0
  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (values[index] < min || values[index] > max) consecutiveOutside += 1
    else break
  }

  if (consecutiveOutside >= 3) {
    return { status: 'critical', consecutiveOutside, message: `${consecutiveOutside} consecutive readings outside the nominal range.` }
  }
  if (consecutiveOutside > 0) {
    return { status: 'warning', consecutiveOutside, message: 'Recent reading outside the nominal range; repeat and monitor.' }
  }
  return { status: 'nominal', consecutiveOutside: 0, message: 'Trend remains within the nominal range.' }
}
