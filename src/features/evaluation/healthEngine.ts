import type { Indicator, Status, ZoneId } from '../../types'
import type { DailyMetrics } from '../measurements/dailyCheckTypes'

interface Range { min: number; max: number; warningMin: number; warningMax: number }

const ranges: Record<string, Range> = {
  bloodPressureSys: { min: 90, max: 130, warningMin: 85, warningMax: 140 },
  heartRate: { min: 55, max: 85, warningMin: 45, warningMax: 110 },
  bloodSugar: { min: 70, max: 110, warningMin: 60, warningMax: 140 },
  bodyTemperature: { min: 36.2, max: 37.3, warningMin: 35.5, warningMax: 38 },
  sleepHours: { min: 6.5, max: 9, warningMin: 5, warningMax: 10 },
  mood: { min: 3, max: 5, warningMin: 2, warningMax: 5 },
}

function evaluate(value: number, range: Range): Status {
  if (value < range.warningMin || value > range.warningMax) return 'act'
  if (value < range.min || value > range.max) return 'watch'
  return 'ok'
}

function metric(id: string, name: string, value: string, unit: string, status: Status, zone: ZoneId, history: number[], reason = ''): Indicator {
  return { id, name, value, unit, status, reason, zone, history }
}

export function evaluateDailyMetrics(values: DailyMetrics): Indicator[] {
  const bpStatus = evaluate(values.bloodPressureSys, ranges.bloodPressureSys)
  return [
    metric('bp', 'Blood pressure', `${values.bloodPressureSys}/${values.bloodPressureDia}`, 'mmHg', bpStatus, 'heart', [values.bloodPressureSys], bpStatus === 'ok' ? '' : 'outside nominal range'),
    metric('hr', 'Heart rate', String(values.heartRate), 'bpm', evaluate(values.heartRate, ranges.heartRate), 'heart', [values.heartRate]),
    metric('glucose', 'Blood sugar', String(values.bloodSugar), 'mg/dL', evaluate(values.bloodSugar, ranges.bloodSugar), 'metabolism', [values.bloodSugar]),
    metric('temp', 'Body temperature', values.bodyTemperature.toFixed(1), '°C', evaluate(values.bodyTemperature, ranges.bodyTemperature), 'body', [values.bodyTemperature]),
    metric('sleep', 'Sleep', String(values.sleepHours), 'hours', evaluate(values.sleepHours, ranges.sleepHours), 'head', [values.sleepHours], values.sleepHours < ranges.sleepHours.min ? 'below nominal range' : ''),
    metric('mood', 'Mood', values.mood, 'of 5', evaluate({ Bad: 1, Fair: 2, Neutral: 3, Good: 4, Great: 5 }[values.mood], ranges.mood), 'head', [{ Bad: 1, Fair: 2, Neutral: 3, Good: 4, Great: 5 }[values.mood]]),
  ]
}
