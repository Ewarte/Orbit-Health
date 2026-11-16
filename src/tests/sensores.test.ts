import { describe, expect, it } from 'vitest'
import { healthRanges } from '../features/evaluation/healthEngine'
import { createRecord, defaultMetrics, normalizeSources, parseRecords, sourceOf } from '../features/measurements/dailyCheckData'
import {
  parseHeartRateMeasurement,
  parsePulseOximeterMeasurement,
  sfloatToNumber,
} from '../features/sensors/bluetoothParsing'
import { sanitizeReading } from '../features/sensors/readingUtils'
import { createSimulatedSensor, simulateReading } from '../features/sensors/simulatedSensor'

const view = (bytes: number[]) => new DataView(new Uint8Array(bytes).buffer)

describe('origen de cada dato en los registros', () => {
  const base = { id: 'a', timestamp: '2026-11-10T10:00:00.000Z', dateStr: '', timeStr: '', metrics: defaultMetrics }

  it('un registro viejo sin origen sigue funcionando y todo es manual', () => {
    const [record] = parseRecords([base])
    expect(record.sources).toBeUndefined()
    expect(sourceOf(record, 'heartRate')).toBe('manual')
  })

  it('conserva los orígenes válidos y descarta los dañados', () => {
    const [record] = parseRecords([{ ...base, sources: { heartRate: 'bluetooth', spo2: 'simulated', mood: 'satélite', inventado: 'bluetooth', bloodSugar: 7 } }])
    expect(record.sources).toEqual({ heartRate: 'bluetooth', spo2: 'simulated' })
    expect(sourceOf(record, 'respiratoryRate')).toBe('manual')
  })

  it('un mapa que no es objeto se ignora sin lanzar errores', () => {
    expect(normalizeSources('bluetooth')).toBeUndefined()
    expect(normalizeSources(null)).toBeUndefined()
    expect(normalizeSources([1, 2])).toBeUndefined()
    expect(parseRecords([{ ...base, sources: 42 }])).toHaveLength(1)
  })

  it('al crear un registro no guarda los orígenes manuales', () => {
    const record = createRecord(defaultMetrics, new Date('2026-11-10T10:00:00Z'), { heartRate: 'simulated', spo2: 'manual' })
    expect(record.sources).toEqual({ heartRate: 'simulated' })
    expect(createRecord(defaultMetrics).sources).toBeUndefined()
  })
})

describe('Heart Rate Measurement (0x2A37)', () => {
  it('lee el pulso de 8 bits (flags con el bit 0 en 0)', () => {
    // Ejemplo habitual: flags 0x00, 72 bpm.
    expect(parseHeartRateMeasurement(view([0x00, 72]))).toBe(72)
  })

  it('ignora los demás bits de las flags en el formato de 8 bits', () => {
    // 0x16 = contacto detectado + soportado + energía; bit 0 en 0.
    expect(parseHeartRateMeasurement(view([0x16, 0x4b]))).toBe(75)
  })

  it('lee el pulso de 16 bits little-endian (flags con el bit 0 en 1)', () => {
    // 0x0101 en little-endian: 01 01 = 257; 0x00C8 = 200.
    expect(parseHeartRateMeasurement(view([0x01, 0xc8, 0x00]))).toBe(200)
    expect(parseHeartRateMeasurement(view([0x01, 0x01, 0x01]))).toBe(257)
  })

  it('devuelve null si faltan bytes', () => {
    expect(parseHeartRateMeasurement(view([]))).toBeNull()
    expect(parseHeartRateMeasurement(view([0x00]))).toBeNull()
    expect(parseHeartRateMeasurement(view([0x01, 0x48]))).toBeNull()
  })
})

describe('SFLOAT de IEEE-11073', () => {
  it('lee enteros con exponente 0', () => {
    expect(sfloatToNumber(0x0062)).toBe(98)
    expect(sfloatToNumber(0x0048)).toBe(72)
  })

  it('lee exponentes negativos (0xF3D4 = 980 × 10⁻¹ = 98,0)', () => {
    expect(sfloatToNumber(0xf3d4)).toBe(98)
    expect(sfloatToNumber(0xf3d5)).toBe(98.1)
    // 0xE000 | 0x3E8 = 1000 × 10⁻² = 10
    expect(sfloatToNumber(0xe3e8)).toBe(10)
  })

  it('lee mantisas negativas', () => {
    expect(sfloatToNumber(0x0fff)).toBe(-1)
  })

  it('los valores especiales (NaN, NRes, reservado, ±INFINITY) dan null', () => {
    for (const raw of [0x07ff, 0x0800, 0x0801, 0x07fe, 0x0802]) expect(sfloatToNumber(raw), raw.toString(16)).toBeNull()
  })
})

describe('Pulse Oximeter (0x2A5E puntual y 0x2A5F continua)', () => {
  it('lee SpO2 y pulso: flags, SpO2 98 (62 00) y pulso 72 (48 00)', () => {
    expect(parsePulseOximeterMeasurement(view([0x00, 0x62, 0x00, 0x48, 0x00]))).toEqual({ spo2: 98, heartRate: 72 })
  })

  it('ignora los campos opcionales que siguen (marca de tiempo, estado)', () => {
    const bytes = [0x03, 0x61, 0x00, 0x50, 0x00, 0xea, 0x07, 0x0b, 0x10, 0x0a, 0x1e, 0x00, 0x20, 0x00]
    expect(parsePulseOximeterMeasurement(view(bytes))).toEqual({ spo2: 97, heartRate: 80 })
  })

  it('lee valores con exponente (SpO2 98,0 = F3 D4 y pulso 72 = 48 00)', () => {
    expect(parsePulseOximeterMeasurement(view([0x00, 0xd4, 0xf3, 0x48, 0x00]))).toEqual({ spo2: 98, heartRate: 72 })
  })

  it('un campo sin dato (NaN = FF 07) queda en null', () => {
    expect(parsePulseOximeterMeasurement(view([0x00, 0x62, 0x00, 0xff, 0x07]))).toEqual({ spo2: 98, heartRate: null })
  })

  it('devuelve null si faltan bytes', () => {
    expect(parsePulseOximeterMeasurement(view([0x00, 0x62, 0x00]))).toBeNull()
  })
})

describe('sanitizeReading', () => {
  it('redondea y deja solo valores plausibles', () => {
    expect(sanitizeReading({ heartRate: 71.6, spo2: 97.2, respiratoryRate: 15 })).toEqual({ heartRate: 72, spo2: 97, respiratoryRate: 15 })
    expect(sanitizeReading({ heartRate: 0, spo2: 140, respiratoryRate: Number.NaN })).toEqual({})
  })
})

describe('sensor simulado', () => {
  const seeds = [0, 0.13, 0.5, 0.87, 0.9999]

  it('entrega valores normales dentro de los rangos del motor', () => {
    for (const seed of seeds) {
      const reading = simulateReading({ random: () => seed })
      expect(reading.heartRate!).toBeGreaterThanOrEqual(healthRanges.heartRate.min)
      expect(reading.heartRate!).toBeLessThanOrEqual(healthRanges.heartRate.max)
      expect(reading.spo2!).toBeGreaterThanOrEqual(healthRanges.spo2.min)
      expect(reading.spo2!).toBeLessThanOrEqual(healthRanges.spo2.max)
      expect(reading.respiratoryRate!).toBeGreaterThanOrEqual(healthRanges.respiratoryRate.min)
      expect(reading.respiratoryRate!).toBeLessThanOrEqual(healthRanges.respiratoryRate.max)
    }
  })

  it('con la opción de demostración entrega valores fuera de rango (y siguen siendo plausibles)', () => {
    for (const seed of seeds) {
      const reading = simulateReading({ outOfRange: true, random: () => seed })
      expect(reading.spo2!).toBeLessThan(healthRanges.spo2.warningMin)
      expect(reading.heartRate!).toBeGreaterThan(healthRanges.heartRate.max)
      expect(reading.respiratoryRate!).toBeGreaterThan(healthRanges.respiratoryRate.max)
      expect(Object.keys(sanitizeReading(reading))).toHaveLength(3)
    }
  })

  it('siempre está disponible, se marca como simulado y entrega pulso, oxígeno y respiración', async () => {
    const sensor = createSimulatedSensor({ delayMs: 0 })
    expect(sensor.isAvailable()).toBe(true)
    expect(sensor.origin).toBe('simulated')
    expect(sensor.fields).toEqual(['heartRate', 'spo2', 'respiratoryRate'])
    expect(Object.keys(await sensor.read()).sort()).toEqual(['heartRate', 'respiratoryRate', 'spo2'])
  })
})
