import { describe, expect, it } from 'vitest'
import { MAX_RECORDS, defaultMetrics, formatUtcHHMM, normalizeMetrics, parseRecords } from '../features/measurements/dailyCheckData'
import { liveIndicators } from '../features/evaluation/liveIndicators'
import { evaluateDailyMetrics } from '../features/evaluation/healthEngine'
import type { SavedRecord } from '../features/measurements/dailyCheckTypes'

describe('normalizeMetrics con datos dañados', () => {
  it('reemplaza por el valor por defecto lo que no sea un número válido', () => {
    const result = normalizeMetrics({
      bloodPressureSys: NaN, bloodPressureDia: 'alto', heartRate: null, spo2: Infinity,
      respiratoryRate: undefined, bodyTemperature: {}, sleepHours: [], exerciseMinutes: '45',
    })
    expect(result).toEqual(defaultMetrics)
  })

  it('descarta números fuera del rango posible (no genera estados falsos)', () => {
    const result = normalizeMetrics({ heartRate: 9999, spo2: 140, bodyTemperature: -5, sleepHours: 80, exerciseMinutes: -1, bloodSugar: 0 })
    expect(result.heartRate).toBe(defaultMetrics.heartRate)
    expect(result.spo2).toBe(defaultMetrics.spo2)
    expect(result.bodyTemperature).toBe(defaultMetrics.bodyTemperature)
    expect(result.sleepHours).toBe(defaultMetrics.sleepHours)
    expect(result.exerciseMinutes).toBe(defaultMetrics.exerciseMinutes)
    expect(result.bloodSugar).toBeNull()
  })

  it('descarta un ánimo fuera de la lista y un visionChange que no es booleano', () => {
    expect(normalizeMetrics({ mood: 'Furioso' }).mood).toBe(defaultMetrics.mood)
    expect(normalizeMetrics({ mood: 3 }).mood).toBe(defaultMetrics.mood)
    expect(normalizeMetrics({ mood: 'Great' }).mood).toBe('Great')
    expect(normalizeMetrics({ visionChange: 'sí' }).visionChange).toBe(false)
    expect(normalizeMetrics({ visionChange: true }).visionChange).toBe(true)
  })

  it('conserva los valores válidos y la glucosa medida', () => {
    const valid = { bloodPressureSys: 120, bloodPressureDia: 78, heartRate: 70, bloodSugar: 96, mood: 'Good' }
    expect(normalizeMetrics(valid)).toMatchObject(valid)
  })

  it('la diastólica nunca queda mayor o igual que la sistólica', () => {
    const result = normalizeMetrics({ bloodPressureSys: 100, bloodPressureDia: 120 })
    expect(result.bloodPressureDia).toBeLessThan(result.bloodPressureSys)
  })

  it('no lanza excepciones con cualquier entrada rara', () => {
    for (const raw of [null, undefined, 5, 'texto', [], [1, 2], () => 1, NaN, true]) {
      expect(() => normalizeMetrics(raw)).not.toThrow()
      expect(normalizeMetrics(raw)).toEqual(defaultMetrics)
    }
  })

  it('un valor dañado no produce un indicador raro al evaluar', () => {
    const list = evaluateDailyMetrics(normalizeMetrics({ heartRate: NaN, spo2: 'x', mood: 'zzz' }))
    for (const item of list) expect(item.value).not.toMatch(/NaN|undefined|null/)
  })
})

describe('parseRecords (lectura del historial)', () => {
  const record = (n: number, extra: Record<string, unknown> = {}) => ({
    id: `r${n}`, timestamp: new Date(Date.UTC(2026, 0, 1) + n * 3_600_000).toISOString(), dateStr: '', timeStr: '', metrics: { heartRate: 70 }, ...extra,
  })

  it('devuelve lista vacía si lo guardado no es una lista', () => {
    for (const raw of [null, undefined, {}, 'x', 7]) expect(parseRecords(raw)).toEqual([])
  })

  it('filtra elementos inválidos y deja los válidos', () => {
    const raw = [
      record(1), null, 5, 'texto', [], { id: 'sin-medidas', timestamp: '2026-01-01T00:00:00Z' },
      record(2, { metrics: 'no' }), record(3, { metrics: {} }), record(4, { timestamp: 'ayer' }), record(5, { timestamp: 123 }), record(6),
    ]
    const result = parseRecords(raw)
    expect(result.map((r) => r.id)).toEqual(['r6', 'r1'])
  })

  it('normaliza las medidas de cada registro', () => {
    const [first] = parseRecords([record(1, { metrics: { heartRate: 'mucho', spo2: 97 } })])
    expect(first.metrics.heartRate).toBe(defaultMetrics.heartRate)
    expect(first.metrics.spo2).toBe(97)
  })

  it('ordena del más reciente al más antiguo y limita a los 365 más recientes', () => {
    const raw = Array.from({ length: MAX_RECORDS + 40 }, (_, n) => record(n))
    const result = parseRecords(raw)
    expect(result).toHaveLength(MAX_RECORDS)
    expect(result[0].id).toBe(`r${MAX_RECORDS + 39}`)
    expect(result[MAX_RECORDS - 1].id).toBe('r40')
  })
})

describe('hora UTC del último chequeo', () => {
  it('da HH:MM en UTC, sin importar la zona del dispositivo', () => {
    expect(formatUtcHHMM('2026-11-15T07:10:45.000Z')).toBe('07:10')
    expect(formatUtcHHMM('2026-11-15T23:59:00-05:00')).toBe('04:59')
  })

  it('da null si no hay fecha legible', () => {
    expect(formatUtcHHMM(null)).toBeNull()
    expect(formatUtcHHMM('')).toBeNull()
    expect(formatUtcHHMM('basura')).toBeNull()
  })
})

describe('usuario en blanco', () => {
  it('sin chequeos no hay indicadores (ni alertas ni estados)', () => {
    expect(liveIndicators([])).toEqual([])
    expect(liveIndicators([], null)).toEqual([])
  })

  it('con un chequeo, los indicadores salen de ese chequeo', () => {
    const records: SavedRecord[] = [{ id: 'a', timestamp: '2026-11-15T10:00:00Z', dateStr: '', timeStr: '', metrics: { ...defaultMetrics, spo2: 90 } }]
    expect(liveIndicators(records).find((item) => item.id === 'spo2')?.status).toBe('act')
  })

  it('migración: sin historial pero con medidas guardadas por versiones anteriores, se usan', () => {
    expect(liveIndicators([], { ...defaultMetrics, spo2: 90 }).find((item) => item.id === 'spo2')?.status).toBe('act')
  })

  it('la mini gráfica sale de los chequeos reales anteriores, del más antiguo al más reciente', () => {
    const at = (n: number, hr: number): SavedRecord => ({ id: `r${n}`, timestamp: `2026-11-1${n}T10:00:00Z`, dateStr: '', timeStr: '', metrics: { ...defaultMetrics, heartRate: hr } })
    const result = liveIndicators([at(3, 90), at(2, 80), at(1, 70)])
    expect(result.find((item) => item.id === 'hr')?.history).toEqual([70, 80, 90])
  })
})
