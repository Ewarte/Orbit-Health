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
    expect(bp?.derived?.map((d) => [d.id, d.value])).toEqual([['map', '95'], ['pp', '50']])
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

describe('presión arterial: sistólica y diastólica (rangos en borrador)', () => {
  it('evalúa la diastólica con los rangos borrador 60–80 / 50–89 / actuar fuera', () => {
    const bp = (dia: number) => status({ bloodPressureSys: 120, bloodPressureDia: dia }, 'bp')
    expect(bp(70)).toBe('ok')
    expect(bp(60)).toBe('ok')
    expect(bp(80)).toBe('ok')
    expect(bp(85)).toBe('watch')
    expect(bp(89)).toBe('watch')
    expect(bp(90)).toBe('act')
    expect(bp(55)).toBe('watch')
    expect(bp(50)).toBe('watch')
    expect(bp(49)).toBe('act')
  })

  it('el estado es el peor entre sistólica y diastólica', () => {
    expect(status({ bloodPressureSys: 120, bloodPressureDia: 95 }, 'bp')).toBe('act')
    expect(status({ bloodPressureSys: 150, bloodPressureDia: 70 }, 'bp')).toBe('act')
    expect(status({ bloodPressureSys: 135, bloodPressureDia: 95 }, 'bp')).toBe('act')
    expect(status({ bloodPressureSys: 135, bloodPressureDia: 70 }, 'bp')).toBe('watch')
  })

  it('dice cuál falla en la razón', () => {
    const reason = (patch: Partial<DailyMetrics>) => evaluateDailyMetrics({ ...defaultMetrics, ...patch }).find((i) => i.id === 'bp')?.reasonKey
    expect(reason({ bloodPressureSys: 120, bloodPressureDia: 70 })).toBeUndefined()
    expect(reason({ bloodPressureSys: 135, bloodPressureDia: 70 })).toBe('reason.bpSys')
    expect(reason({ bloodPressureSys: 120, bloodPressureDia: 95 })).toBe('reason.bpDia')
    expect(reason({ bloodPressureSys: 150, bloodPressureDia: 95 })).toBe('reason.bpBoth')
  })
})

describe('razón de todo indicador fuera de rango', () => {
  it('todo indicador que no está normal trae razón y clave de texto', () => {
    const bad: DailyMetrics = {
      ...defaultMetrics, bloodPressureSys: 150, bloodPressureDia: 95, heartRate: 120, spo2: 90, respiratoryRate: 30,
      bodyTemperature: 38.5, sleepHours: 10.5, mood: 'Bad', exerciseMinutes: 10, visionChange: true, bloodSugar: 200,
    }
    const list = evaluateDailyMetrics(bad)
    expect(list.filter((item) => item.status !== 'ok').length).toBe(list.length)
    for (const item of list) {
      expect(item.reason, item.id).not.toBe('')
      expect(item.reasonKey, item.id).toBeTruthy()
    }
  })

  it('dormir más de 9 horas dice «por encima del rango»', () => {
    const sleep = evaluateDailyMetrics({ ...defaultMetrics, sleepHours: 9.8 }).find((item) => item.id === 'sleep')!
    expect(sleep.status).toBe('watch')
    expect(sleep.reasonKey).toBe('reason.aboveRange')
  })

  it('los indicadores normales no llevan razón', () => {
    const ok = evaluateDailyMetrics({ ...defaultMetrics, bloodPressureDia: 75, sleepHours: 8, exerciseMinutes: 90 })
    for (const item of ok.filter((i) => i.status === 'ok')) expect(item.reason).toBe('')
  })
})
