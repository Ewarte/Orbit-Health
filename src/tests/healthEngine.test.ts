import { describe, expect, it } from 'vitest'
import { defaultMetrics, normalizeMetrics } from '../features/measurements/dailyCheckData'
import type { DailyMetrics } from '../features/measurements/dailyCheckTypes'
import { derivedBloodPressure, evaluateDailyMetrics } from '../features/evaluation/healthEngine'

const status = (patch: Partial<DailyMetrics>, id: string) =>
  evaluateDailyMetrics({ ...defaultMetrics, ...patch }).find((item) => item.id === id)?.status

describe('presión derivada', () => {
  it('calcula presión media y de pulso', () => {
    expect(derivedBloodPressure(128, 82)).toEqual({ meanArterial: 97, pulsePressure: 46 })
  })

  it('el indicador de presión lleva los derivados sin cambiar su estado', () => {
    const bp = evaluateDailyMetrics(defaultMetrics).find((item) => item.id === 'bp')
    expect(bp?.derived?.map((d) => [d.id, d.value])).toEqual([['map', '97'], ['pp', '46']])
    expect(bp?.status).toBe('ok')
  })
})

describe('indicadores nuevos', () => {
  it('oxígeno en sangre', () => {
    expect(status({ spo2: 98 }, 'spo2')).toBe('ok')
    expect(status({ spo2: 93 }, 'spo2')).toBe('watch')
    expect(status({ spo2: 90 }, 'spo2')).toBe('act')
  })

  it('frecuencia respiratoria', () => {
    expect(status({ respiratoryRate: 16 }, 'resp')).toBe('ok')
    expect(status({ respiratoryRate: 22 }, 'resp')).toBe('watch')
    expect(status({ respiratoryRate: 26 }, 'resp')).toBe('act')
  })

  it('la glucosa solo aparece si se midió', () => {
    expect(evaluateDailyMetrics({ ...defaultMetrics, bloodSugar: null }).some((item) => item.id === 'glucose')).toBe(false)
    expect(evaluateDailyMetrics({ ...defaultMetrics, bloodSugar: 96 }).some((item) => item.id === 'glucose')).toBe(true)
  })

  it('un cambio de visión es «vigilar»', () => {
    expect(status({ visionChange: true }, 'vision')).toBe('watch')
    expect(status({ visionChange: false }, 'vision')).toBe('ok')
  })

  it('poco ejercicio es «vigilar», nunca «actuar»', () => {
    expect(status({ exerciseMinutes: 45 }, 'exercise')).toBe('watch')
    expect(status({ exerciseMinutes: 0 }, 'exercise')).toBe('watch')
    expect(status({ exerciseMinutes: 90 }, 'exercise')).toBe('ok')
  })
})

describe('normalizeMetrics', () => {
  it('rellena los campos nuevos de un registro viejo y conserva la glucosa', () => {
    const old = { bloodPressureSys: 120, bloodPressureDia: 80, heartRate: 70, bloodSugar: 96, bodyTemperature: 36.5, sleepHours: 7, mood: 'Good' }
    expect(normalizeMetrics(old)).toEqual({ ...defaultMetrics, ...old })
  })

  it('devuelve los valores por defecto si no hay datos', () => {
    expect(normalizeMetrics(null)).toEqual(defaultMetrics)
  })
})
