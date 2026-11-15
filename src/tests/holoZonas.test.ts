import { describe, expect, it } from 'vitest'
import { ZONE_META, ZONE_OF_MESH, getTouchZone, getVertexZone, isZoneLit } from '../components/health/holoZonas'

describe('asignación de zonas del holograma', () => {
  const meshesOf = (zone: string) => Object.entries(ZONE_OF_MESH).filter(([, z]) => z === zone).map(([n]) => n)

  it('todo el esqueleto y las extremidades van a «legs»', () => {
    for (const name of [
      'craneo', 'columna', 'costillas', 'hombros', 'humero_der', 'humero_izq', 'antebrazo_der', 'antebrazo_izq',
      'mano_der', 'mano_izq', 'pelvis', 'femur_der', 'femur_izq', 'rotula_der', 'rotula_izq', 'tibia_der', 'tibia_izq',
      'pie_der', 'pie_izq',
    ]) {
      expect(ZONE_OF_MESH[name], name).toBe('legs')
    }
  })

  it('órganos en su zona y la piel en «body»', () => {
    expect(ZONE_OF_MESH.cerebro).toBe('head')
    for (const n of ['corazon', 'pulmon_der', 'pulmon_izq', 'traquea']) expect(ZONE_OF_MESH[n]).toBe('heart')
    for (const n of ['higado', 'estomago', 'esofago', 'intestino_delgado', 'intestino_grueso', 'pancreas', 'rinon_der', 'rinon_izq', 'vejiga']) {
      expect(ZONE_OF_MESH[n]).toBe('metabolism')
    }
    expect(meshesOf('body')).toEqual(['piel'])
  })

  it('silueta (piel con los brazos pegados al cuerpo): brazos y piernas son «legs»; nunca se reparte «body» por vértice', () => {
    expect(getVertexZone(0.12, 0.5)).toBe('legs') // brazo, a la altura del antebrazo
    expect(getVertexZone(-0.12, 0.45)).toBe('legs') // mano
    expect(getVertexZone(0.11, 0.8)).toBe('legs') // hombro
    expect(getVertexZone(0.04, 0.25)).toBe('legs') // pierna
    expect(getVertexZone(0.03, 0.02)).toBe('legs') // pie
    expect(getVertexZone(0, 0.93)).toBe('head')
    expect(getVertexZone(0, 0.75)).toBe('heart')
    expect(getVertexZone(0, 0.58)).toBe('metabolism')
    for (let v = 0; v <= 1; v += 0.02) for (let u = -0.2; u <= 0.2; u += 0.02) expect(getVertexZone(u, v)).not.toBe('body')
  })

  it('al tocar la piel: extremidades «legs», cabeza «head», pecho «heart», abdomen «metabolism»', () => {
    expect(getTouchZone(0.12, 0.5, 0.03)).toBe('legs') // brazo
    expect(getTouchZone(-0.12, 0.44, 0.05)).toBe('legs') // mano
    expect(getTouchZone(0.05, 0.2, 0.03)).toBe('legs') // pierna
    expect(getTouchZone(0, 0.97, 0.05)).toBe('head')
    expect(getTouchZone(0.02, 0.76, 0.06)).toBe('heart')
    expect(getTouchZone(0, 0.58, 0.06)).toBe('metabolism')
  })

  it('al tocar el costado, la espalda o el cuello se elige «body»', () => {
    expect(getTouchZone(0.07, 0.75, 0.02)).toBe('body') // costado del pecho
    expect(getTouchZone(-0.07, 0.58, 0.02)).toBe('body') // costado del abdomen
    expect(getTouchZone(0, 0.75, -0.05)).toBe('body') // espalda
    expect(getTouchZone(0, 0.84, 0.02)).toBe('body') // cuello
    expect(getTouchZone(0, 0.86, 0.02)).toBe('body') // cuello alto, bajo el mentón
    expect(getTouchZone(0, 0.9, 0.05)).toBe('head') // la cara sigue siendo cabeza
  })

  it('«body» cubre todo el cuerpo y las demás zonas solo lo suyo', () => {
    for (const z of ZONE_META) expect(isZoneLit('body', z.id)).toBe(true)
    expect(isZoneLit('legs', 'legs')).toBe(true)
    expect(isZoneLit('legs', 'heart')).toBe(false)
    expect(isZoneLit('heart', 'legs')).toBe(false)
  })
})
