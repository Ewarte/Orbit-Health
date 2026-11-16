import type { Indicator, Status, ZoneId } from '../../types'
import type { DailyMetrics } from '../measurements/dailyCheckTypes'

export interface Range { min: number; max: number; warningMin: number; warningMax: number }

// BORRADOR: umbrales sin validación clínica; ver docs/INVESTIGACION-NASA.md
// Los rangos se exportan para que otras pantallas (Tendencias) usen los mismos y no los dupliquen.
export const healthRanges = {
  bloodPressureSys: { min: 90, max: 130, warningMin: 85, warningMax: 140 },
  // BORRADOR POR REVISAR (diastólica): normal 60–80; vigilar de 50 a 59 y de 81 a 89; actuar <50 o ≥90.
  // Con valores enteros, 89 es el último «vigilar» (por eso el tope es 89,9).
  bloodPressureDia: { min: 60, max: 80, warningMin: 50, warningMax: 89.9 },
  heartRate: { min: 55, max: 85, warningMin: 45, warningMax: 110 },
  bloodSugar: { min: 70, max: 110, warningMin: 60, warningMax: 140 },
  bodyTemperature: { min: 36.2, max: 37.3, warningMin: 35.5, warningMax: 38 },
  sleepHours: { min: 6.5, max: 9, warningMin: 5, warningMax: 10 },
  mood: { min: 3, max: 5, warningMin: 2, warningMax: 5 },
  spo2: { min: 95, max: 100, warningMin: 92, warningMax: 100 },
  respiratoryRate: { min: 12, max: 20, warningMin: 10, warningMax: 24 },
  // Menos de 60 min = vigilar, nunca «actuar».
  exerciseMinutes: { min: 60, max: 100000, warningMin: 0, warningMax: 100000 },
} satisfies Record<string, Range>

const ranges = healthRanges

/** Estado de un valor frente a un rango (se exporta para la Vista médica). */
export function evaluate(value: number, range: Range): Status {
  if (value < range.warningMin || value > range.warningMax) return 'act'
  if (value < range.min || value > range.max) return 'watch'
  return 'ok'
}

/** Motivo del estado: texto en inglés de respaldo y clave para traducirlo al mostrarlo. */
type Reason = { text: string; key: string }

/** Motivo genérico de un valor fuera de su rango normal (por debajo o por encima); undefined si está dentro. */
function rangeReason(value: number, range: Range): Reason | undefined {
  if (value < range.min) return { text: 'below nominal range', key: 'reason.belowRange' }
  if (value > range.max) return { text: 'above nominal range', key: 'reason.aboveRange' }
  return undefined
}

/** El peor de dos estados. */
function worse(a: Status, b: Status): Status {
  const order: Status[] = ['ok', 'watch', 'act']
  return order.indexOf(a) >= order.indexOf(b) ? a : b
}

/** Todo indicador que no está normal lleva un motivo: si no se da uno concreto, el genérico «fuera del rango normal». */
function metric(id: string, name: string, value: string, unit: string, status: Status, zone: ZoneId, history: number[], reason?: Reason): Indicator {
  const shown = status === 'ok' ? undefined : (reason ?? { text: 'outside nominal range', key: 'reason.outsideRange' })
  return { id, name, value, unit, status, reason: shown?.text ?? '', reasonKey: shown?.key, zone, history }
}

/** Motivo de la presión: dice si falla la sistólica, la diastólica o las dos. */
function bloodPressureReason(sysStatus: Status, diaStatus: Status): Reason | undefined {
  if (sysStatus !== 'ok' && diaStatus !== 'ok') return { text: 'systolic and diastolic outside nominal range', key: 'reason.bpBoth' }
  if (sysStatus !== 'ok') return { text: 'systolic outside nominal range', key: 'reason.bpSys' }
  if (diaStatus !== 'ok') return { text: 'diastolic outside nominal range (draft range, under review)', key: 'reason.bpDia' }
  return undefined
}

/** Presión arterial media y presión de pulso, calculadas a partir de sistólica y diastólica. */
export function derivedBloodPressure(sys: number, dia: number) {
  return { meanArterial: Math.round(dia + (sys - dia) / 3), pulsePressure: sys - dia }
}

export function evaluateDailyMetrics(values: DailyMetrics): Indicator[] {
  const sysStatus = evaluate(values.bloodPressureSys, ranges.bloodPressureSys)
  const diaStatus = evaluate(values.bloodPressureDia, ranges.bloodPressureDia)
  // El estado de la presión es el peor entre sistólica y diastólica.
  const bpStatus = worse(sysStatus, diaStatus)
  const { meanArterial, pulsePressure } = derivedBloodPressure(values.bloodPressureSys, values.bloodPressureDia)
  const moodValue = { Bad: 1, Fair: 2, Neutral: 3, Good: 4, Great: 5 }[values.mood]
  const bp = metric('bp', 'Blood pressure', `${values.bloodPressureSys}/${values.bloodPressureDia}`, 'mmHg', bpStatus, 'heart', [values.bloodPressureSys], bloodPressureReason(sysStatus, diaStatus))
  bp.derived = [
    { id: 'map', label: 'Mean arterial pressure', value: String(meanArterial), unit: 'mmHg' },
    { id: 'pp', label: 'Pulse pressure', value: String(pulsePressure), unit: 'mmHg' },
  ]
  const result: Indicator[] = [
    bp,
    metric('hr', 'Heart rate', String(values.heartRate), 'bpm', evaluate(values.heartRate, ranges.heartRate), 'heart', [values.heartRate], rangeReason(values.heartRate, ranges.heartRate)),
    metric('spo2', 'Blood oxygen (SpO₂)', String(values.spo2), '%', evaluate(values.spo2, ranges.spo2), 'heart', [values.spo2], rangeReason(values.spo2, ranges.spo2)),
    metric('resp', 'Respiratory rate', String(values.respiratoryRate), 'breaths/min', evaluate(values.respiratoryRate, ranges.respiratoryRate), 'heart', [values.respiratoryRate], rangeReason(values.respiratoryRate, ranges.respiratoryRate)),
    metric('temp', 'Body temperature', values.bodyTemperature.toFixed(1), '°C', evaluate(values.bodyTemperature, ranges.bodyTemperature), 'body', [values.bodyTemperature], rangeReason(values.bodyTemperature, ranges.bodyTemperature)),
    metric('sleep', 'Sleep', String(values.sleepHours), 'hours', evaluate(values.sleepHours, ranges.sleepHours), 'head', [values.sleepHours], rangeReason(values.sleepHours, ranges.sleepHours)),
    metric('mood', 'Mood', values.mood, 'of 5', evaluate(moodValue, ranges.mood), 'head', [moodValue], rangeReason(moodValue, ranges.mood)),
    metric('vision', 'Vision', values.visionChange ? 'Change reported' : 'No change', '', values.visionChange ? 'watch' : 'ok', 'head', [], values.visionChange ? { text: 'change reported', key: 'reason.visionChange' } : undefined),
    metric('exercise', 'Exercise', String(values.exerciseMinutes), 'min today', evaluate(values.exerciseMinutes, ranges.exerciseMinutes), 'legs', [values.exerciseMinutes], values.exerciseMinutes < ranges.exerciseMinutes.min ? { text: 'below the ~90 min/day station reference', key: 'reason.exerciseBelowStation' } : undefined),
  ]
  // La glucosa no es rutinaria: solo se evalúa si se midió.
  if (values.bloodSugar !== null) {
    result.push(metric('glucose', 'Blood sugar', String(values.bloodSugar), 'mg/dL', evaluate(values.bloodSugar, ranges.bloodSugar), 'metabolism', [values.bloodSugar], rangeReason(values.bloodSugar, ranges.bloodSugar)))
  }
  return result
}
