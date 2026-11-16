import { describe, expect, it } from 'vitest'
import { defaultMetrics } from '../features/measurements/dailyCheckData'
import type { SavedRecord } from '../features/measurements/dailyCheckTypes'
import { healthRanges } from '../features/evaluation/healthEngine'
import {
  buildSimulatedTelemetry,
  isRealValue,
  overlayRecords,
  parseStoredTelemetry,
  utcDayKey,
} from '../features/trends/trendsData'

const DAY = 86_400_000
const now = Date.UTC(2031, 2, 9, 15, 30) // una fecha lejana de nov-2026 a propósito

const record = (iso: string, patch: Partial<typeof defaultMetrics> = {}, id = iso): SavedRecord => ({
  id, timestamp: iso, dateStr: '', timeStr: '', metrics: { ...defaultMetrics, ...patch },
})

describe('simulación de Tendencias', () => {
  it('las fechas son relativas a hoy: el último día es hoy y cada día anterior resta uno', () => {
    const points = buildSimulatedTelemetry(10, now)
    expect(points).toHaveLength(10)
    expect(points[9].dateKey).toBe('2031-03-09')
    expect(points[8].dateKey).toBe('2031-03-08')
    expect(points[0].dateKey).toBe(utcDayKey(now - 9 * DAY))
    expect(points.some((point) => point.dateKey.startsWith('2026-11'))).toBe(false)
    expect(points.map((point) => point.day)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })

  it('todos los puntos son simulados al principio', () => {
    for (const point of buildSimulatedTelemetry(5, now)) {
      expect(point.real).toBe(false)
      expect(isRealValue(point, 'hr')).toBe(false)
    }
  })

  it('limita a 365 días aunque la misión sea más larga', () => {
    const points = buildSimulatedTelemetry(1000, now)
    expect(points).toHaveLength(365)
    expect(points[364].day).toBe(1000)
  })
})

describe('chequeos reales sobre la simulación', () => {
  const base = buildSimulatedTelemetry(5, now)

  it('un día con chequeo toma los valores reales y se marca como real', () => {
    const result = overlayRecords(base, [record('2031-03-09T07:00:00Z', { heartRate: 100, spo2: 90, bloodPressureSys: 120, bloodPressureDia: 95, mood: 'Great' })])
    const today = result[4]
    expect(today).toMatchObject({ hr: 100, spo2: 90, bpSys: 120, bpDia: 95, mood: 5, real: true })
    expect(isRealValue(today, 'hr')).toBe(true)
    expect(isRealValue(today, 'radiation')).toBe(false)
    expect(result[3].real).toBe(false)
  })

  it('usa TODOS los registros, no solo el último: cada día con chequeo toma el suyo', () => {
    const result = overlayRecords(base, [
      record('2031-03-09T07:00:00Z', { heartRate: 90 }, 'c'),
      record('2031-03-08T07:00:00Z', { heartRate: 80 }, 'b'),
      record('2031-03-06T07:00:00Z', { heartRate: 70 }, 'a'),
    ])
    expect(result.map((point) => point.real)).toEqual([false, true, false, true, true])
    expect(result.map((point) => point.hr).slice(3)).toEqual([80, 90])
    expect(result[1].hr).toBe(70)
  })

  it('varios chequeos el mismo día UTC se promedian', () => {
    const result = overlayRecords(base, [record('2031-03-09T06:00:00Z', { heartRate: 60 }, 'a'), record('2031-03-09T18:00:00Z', { heartRate: 80 }, 'b')])
    expect(result[4].hr).toBe(70)
  })

  it('la glucosa no medida sigue siendo simulada aunque el día tenga chequeo', () => {
    const sinGlucosa = overlayRecords(base, [record('2031-03-09T07:00:00Z', { bloodSugar: null })])[4]
    expect(sinGlucosa.glucose).toBe(base[4].glucose)
    expect(isRealValue(sinGlucosa, 'glucose')).toBe(false)
    const conGlucosa = overlayRecords(base, [record('2031-03-09T07:00:00Z', { bloodSugar: 120 })])[4]
    expect(conGlucosa.glucose).toBe(120)
    expect(isRealValue(conGlucosa, 'glucose')).toBe(true)
  })

  it('ignora registros fuera del rango dibujado y no modifica la entrada', () => {
    const copy = JSON.stringify(base)
    const result = overlayRecords(base, [record('2020-01-01T00:00:00Z', { heartRate: 150 })])
    expect(result.every((point) => !point.real)).toBe(true)
    expect(JSON.stringify(base)).toBe(copy)
  })

  it('un chequeo nuevo no queda congelado por la simulación guardada', () => {
    const stored = parseStoredTelemetry(JSON.stringify(base), 5, now)!
    expect(stored).not.toBeNull()
    const before = overlayRecords(stored, [])
    const after = overlayRecords(stored, [record('2031-03-09T08:00:00Z', { heartRate: 111 })])
    expect(before[4].hr).toBe(base[4].hr)
    expect(after[4].hr).toBe(111)
  })
})

describe('telemetría guardada: validación al leerla', () => {
  const good = buildSimulatedTelemetry(5, now)

  it('acepta una simulación válida del día de hoy', () => {
    expect(parseStoredTelemetry(JSON.stringify(good), 5, now)).toEqual(good)
  })

  it('rechaza lo dañado, vacío o con datos fuera de rango', () => {
    expect(parseStoredTelemetry(null, 5, now)).toBeNull()
    expect(parseStoredTelemetry('no es json', 5, now)).toBeNull()
    expect(parseStoredTelemetry('{}', 5, now)).toBeNull()
    expect(parseStoredTelemetry('[]', 5, now)).toBeNull()
    expect(parseStoredTelemetry(JSON.stringify([null, null, null, null, null]), 5, now)).toBeNull()
    const bad = good.map((point, index) => (index === 2 ? { ...point, hr: 'rápido' } : point))
    expect(parseStoredTelemetry(JSON.stringify(bad), 5, now)).toBeNull()
    const outOfRange = good.map((point, index) => (index === 2 ? { ...point, spo2: 400 } : point))
    expect(parseStoredTelemetry(JSON.stringify(outOfRange), 5, now)).toBeNull()
    const nan = JSON.stringify(good.map((point, index) => (index === 1 ? { ...point, temp: null } : point)))
    expect(parseStoredTelemetry(nan, 5, now)).toBeNull()
  })

  it('rechaza una simulación vieja (de otro día) o de otra duración de misión', () => {
    expect(parseStoredTelemetry(JSON.stringify(good), 5, now + DAY)).toBeNull()
    expect(parseStoredTelemetry(JSON.stringify(good), 6, now)).toBeNull()
  })
})

describe('rangos normales compartidos con el motor de evaluación', () => {
  it('Tendencias lee sus rangos de healthEngine (no hay copias aparte)', () => {
    expect(healthRanges.bloodPressureSys).toMatchObject({ min: 90, max: 130 })
    expect(healthRanges.sleepHours).toMatchObject({ min: 6.5, max: 9 })
    expect(healthRanges.spo2).toMatchObject({ min: 95, max: 100 })
  })
})
