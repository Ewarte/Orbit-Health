import { describe, expect, it } from 'vitest'
import { ZONE_META, ZONE_OF_MESH, getVertexZone, isZoneLit } from '../components/health/holoZonas'

describe('asignación de zonas del holograma', () => {
  const meshesOf = (zone: string) => Object.entries(ZONE_OF_MESH).filter(([, z]) => z === zone).map(([n]) => n)

  it('versión B: todo el esqueleto y las extremidades van a «legs»', () => {
    for (const name of [
      'craneo', 'columna', 'costillas', 'hombros', 'humero_der', 'humero_izq', 'antebrazo_der', 'antebrazo_izq',
      'mano_der', 'mano_izq', 'pelvis', 'femur_der', 'femur_izq', 'rotula_der', 'rotula_izq', 'tibia_der', 'tibia_izq',
      'pie_der', 'pie_izq',
    ]) {
      expect(ZONE_OF_MESH[name], name).toBe('legs')
    }
  })

  it('versión B: órganos en su zona y la piel en «body»', () => {
    expect(ZONE_OF_MESH.cerebro).toBe('head')
    for (const n of ['corazon', 'pulmon_der', 'pulmon_izq', 'traquea']) expect(ZONE_OF_MESH[n]).toBe('heart')
    for (const n of ['higado', 'estomago', 'esofago', 'intestino_delgado', 'intestino_grueso', 'pancreas', 'rinon_der', 'rinon_izq', 'vejiga']) {
      expect(ZONE_OF_MESH[n]).toBe('metabolism')
    }
    expect(meshesOf('body')).toEqual(['piel'])
  })

  it('versión A: brazos y piernas son «legs»; nunca se reparte «body» por vértice', () => {
    expect(getVertexZone(0.4, 0.0)).toBe('legs') // brazo
    expect(getVertexZone(0.3, 0.5)).toBe('legs') // brazo a la altura del hombro
    expect(getVertexZone(0.1, -0.6)).toBe('legs') // pierna
    expect(getVertexZone(0, 0.9)).toBe('head')
    expect(getVertexZone(0, 0.5)).toBe('heart')
    expect(getVertexZone(0, 0.1)).toBe('metabolism')
    for (let h = -1; h <= 1; h += 0.05) for (let x = -0.6; x <= 0.6; x += 0.05) expect(getVertexZone(x, h)).not.toBe('body')
  })

  it('«body» cubre todo el cuerpo y las demás zonas solo lo suyo', () => {
    for (const z of ZONE_META) expect(isZoneLit('body', z.id)).toBe(true)
    expect(isZoneLit('legs', 'legs')).toBe(true)
    expect(isZoneLit('legs', 'heart')).toBe(false)
    expect(isZoneLit('heart', 'legs')).toBe(false)
  })
})
