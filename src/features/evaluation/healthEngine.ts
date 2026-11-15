import type { Indicator, Status, ZoneId } from '../../types'
import type { DailyMetrics } from '../measurements/dailyCheckTypes'

interface Range { min: number; max: number; warningMin: number; warningMax: number }

// BORRADOR: umbrales sin validación clínica; ver docs/INVESTIGACION-NASA.md
const ranges: Record<string, Range> = {
  bloodPressureSys: { min: 90, max: 130, warningMin: 85, warningMax: 140 },
  heartRate: { min: 55, max: 85, warningMin: 45, warningMax: 110 },
  bloodSugar: { min: 70, max: 110, warningMin: 60, warningMax: 140 },
  bodyTemperature: { min: 36.2, max: 37.3, warningMin: 35.5, warningMax: 38 },
  sleepHours: { min: 6.5, max: 9, warningMin: 5, warningMax: 10 },
  mood: { min: 3, max: 5, warningMin: 2, warningMax: 5 },
  spo2: { min: 95, max: 100, warningMin: 92, warningMax: 100 },
  respiratoryRate: { min: 12, max: 20, warningMin: 10, warningMax: 24 },
  // Menos de 60 min = vigilar, nunca «actuar».
  exerciseMinutes: { min: 60, max: 100000, warningMin: 0, warningMax: 100000 },
}

function evaluate(value: number, range: Range): Status {
  if (value < range.warningMin || value > range.warningMax) return 'act'
  if (value < range.min || value > range.max) return 'watch'
  return 'ok'
}

function metric(id: string, name: string, value: string, unit: string, status: Status, zone: ZoneId, history: number[], reason = ''): Indicator {
  return { id, name, value, unit, status, reason, zone, history }
}

/** Presión arterial media y presión de pulso, calculadas a partir de sistólica y diastólica. */
export function derivedBloodPressure(sys: number, dia: number) {
  return { meanArterial: Math.round(dia + (sys - dia) / 3), pulsePressure: sys - dia }
}

export function evaluateDailyMetrics(values: DailyMetrics): Indicator[] {
  const bpStatus = evaluate(values.bloodPressureSys, ranges.bloodPressureSys)
  const { meanArterial, pulsePressure } = derivedBloodPressure(values.bloodPressureSys, values.bloodPressureDia)
  const moodValue = { Bad: 1, Fair: 2, Neutral: 3, Good: 4, Great: 5 }[values.mood]
  const bp = metric('bp', 'Blood pressure', `${values.bloodPressureSys}/${values.bloodPressureDia}`, 'mmHg', bpStatus, 'heart', [values.bloodPressureSys], bpStatus === 'ok' ? '' : 'outside nominal range')
  bp.derived = [
    { id: 'map', label: 'Mean arterial pressure', value: String(meanArterial), unit: 'mmHg' },
    { id: 'pp', label: 'Pulse pressure', value: String(pulsePressure), unit: 'mmHg' },
  ]
  const result: Indicator[] = [
    bp,
    metric('hr', 'Heart rate', String(values.heartRate), 'bpm', evaluate(values.heartRate, ranges.heartRate), 'heart', [values.heartRate]),
    metric('spo2', 'Blood oxygen (SpO₂)', String(values.spo2), '%', evaluate(values.spo2, ranges.spo2), 'heart', [values.spo2]),
    metric('resp', 'Respiratory rate', String(values.respiratoryRate), 'breaths/min', evaluate(values.respiratoryRate, ranges.respiratoryRate), 'heart', [values.respiratoryRate]),
    metric('temp', 'Body temperature', values.bodyTemperature.toFixed(1), '°C', evaluate(values.bodyTemperature, ranges.bodyTemperature), 'body', [values.bodyTemperature]),
    metric('sleep', 'Sleep', String(values.sleepHours), 'hours', evaluate(values.sleepHours, ranges.sleepHours), 'head', [values.sleepHours], values.sleepHours < ranges.sleepHours.min ? 'below nominal range' : ''),
    metric('mood', 'Mood', values.mood, 'of 5', evaluate(moodValue, ranges.mood), 'head', [moodValue]),
    metric('vision', 'Vision', values.visionChange ? 'Change reported' : 'No change', '', values.visionChange ? 'watch' : 'ok', 'head', [], values.visionChange ? 'change reported' : ''),
    metric('exercise', 'Exercise', String(values.exerciseMinutes), 'min today', evaluate(values.exerciseMinutes, ranges.exerciseMinutes), 'legs', [values.exerciseMinutes], values.exerciseMinutes < ranges.exerciseMinutes.min ? 'below the ~90 min/day station reference' : ''),
  ]
  // La glucosa no es rutinaria: solo se evalúa si se midió.
  if (values.bloodSugar !== null) {
    result.push(metric('glucose', 'Blood sugar', String(values.bloodSugar), 'mg/dL', evaluate(values.bloodSugar, ranges.bloodSugar), 'metabolism', [values.bloodSugar]))
  }
  return result
}
