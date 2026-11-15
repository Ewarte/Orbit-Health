import { describe, expect, it } from 'vitest'
import {
  DIMMED_OPACITY,
  GHOST_OPACITY,
  ZONE_OF_MESH,
  boxCenter,
  easeInOutCubic,
  fitDistance,
  meshOpacity,
  meshesOfZone,
  normalizePoint,
  organId,
  shiftBox,
  unionBoxes,
  type Box,
} from '../components/health/holoZonas'
import { messages } from '../lib/i18n'

describe('holograma unificado: qué se muestra por zona', () => {
  const visible = (zone: Parameters<typeof meshOpacity>[1], focused: string | null = null) =>
    Object.keys(ZONE_OF_MESH).filter((n) => meshOpacity(n, zone, true, focused) > 0)

  it('en la vista general no se muestra ningún órgano', () => {
    for (const name of Object.keys(ZONE_OF_MESH)) expect(meshOpacity(name, 'heart', false)).toBe(0)
  })

  it('«Corazón» muestra corazón, pulmones y tráquea a plena opacidad, y las costillas como contexto', () => {
    for (const n of ['corazon', 'pulmon_der', 'pulmon_izq', 'traquea']) expect(meshOpacity(n, 'heart', true)).toBe(1)
    expect(meshOpacity('costillas', 'heart', true)).toBe(GHOST_OPACITY)
    expect(meshOpacity('higado', 'heart', true)).toBe(0)
  })

  it('«Cerebro» muestra el cerebro y el cráneo casi transparente', () => {
    expect(visible('head').sort()).toEqual(['cerebro', 'craneo'])
    expect(meshOpacity('craneo', 'head', true)).toBe(GHOST_OPACITY)
  })

  it('«Huesos y músculos» muestra todo el esqueleto y ningún órgano', () => {
    expect(visible('legs').sort()).toEqual(meshesOfZone('legs').sort())
    expect(meshOpacity('corazon', 'legs', true)).toBe(0)
  })

  it('«Cuerpo entero» no muestra órganos ni piel: solo la silueta', () => {
    expect(visible('body')).toEqual([])
    expect(meshOpacity('piel', 'body', true)).toBe(0)
  })

  it('la piel nunca se dibuja', () => {
    for (const z of ['head', 'heart', 'metabolism', 'legs'] as const) expect(meshOpacity('piel', z, true)).toBe(0)
  })

  it('con un órgano enfocado, los otros de la zona se atenúan', () => {
    expect(meshOpacity('corazon', 'heart', true, 'corazon')).toBe(1)
    expect(meshOpacity('pulmon_der', 'heart', true, 'corazon')).toBe(DIMMED_OPACITY)
  })

  it('agrupa derecho e izquierdo en un solo nombre', () => {
    expect(organId('pulmon_der')).toBe('pulmon')
    expect(organId('pulmon_izq')).toBe('pulmon')
    expect(organId('corazon')).toBe('corazon')
    expect(organId('intestino_delgado')).toBe('intestino_delgado')
  })

  it('todas las mallas (salvo la piel) tienen nombre en español e inglés', () => {
    for (const name of Object.keys(ZONE_OF_MESH).filter((n) => n !== 'piel')) {
      const key = `holo.organ.${organId(name)}` as keyof typeof messages.es
      expect(messages.es[key], key).toBeTruthy()
      expect(messages.en[key], key).toBeTruthy()
    }
  })
})

describe('holograma unificado: encuadre y transición', () => {
  it('centra la caja del cuerpo desplazándola', () => {
    const skin: Box = { min: [-0.33, -0.08, -0.05], max: [0.33, 1.64, 0.25] }
    const c = boxCenter(skin)
    const centered = shiftBox(skin, [-c[0], -c[1], -c[2]])
    expect(boxCenter(centered)[0]).toBeCloseTo(0, 6)
    expect(boxCenter(centered)[1]).toBeCloseTo(0, 6)
    expect(boxCenter(centered)[2]).toBeCloseTo(0, 6)
    expect(centered.max[1] - centered.min[1]).toBeCloseTo(1.72, 6)
  })

  it('normaliza con la altura de la caja: pies en 0, cabeza en 1, centro lateral en 0', () => {
    const skin: Box = { min: [-0.33, -0.08, -0.05], max: [0.33, 1.64, 0.25] }
    expect(normalizePoint([0, -0.08, 0.1], skin)).toEqual({ u: 0, v: 0, w: 0 })
    expect(normalizePoint([0, 1.64, 0.1], skin).v).toBeCloseTo(1, 6)
    expect(normalizePoint([0.172, 0.78, 0.1], skin).u).toBeCloseTo(0.1, 6)
  })

  it('la transición es suave: empieza y termina en 0 y 1, y es simétrica', () => {
    expect(easeInOutCubic(0)).toBe(0)
    expect(easeInOutCubic(1)).toBe(1)
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 6)
    expect(easeInOutCubic(0.1)).toBeLessThan(0.1)
    expect(easeInOutCubic(0.9)).toBeGreaterThan(0.9)
    expect(easeInOutCubic(-1)).toBe(0)
    expect(easeInOutCubic(2)).toBe(1)
  })

  it('una caja de zona es la unión de las cajas de sus mallas', () => {
    const u = unionBoxes([
      { min: [0, 0, 0], max: [1, 1, 1] },
      { min: [-1, 0.5, 0], max: [0.5, 2, 3] },
    ])
    expect(u).toEqual({ min: [-1, 0, 0], max: [1, 2, 3] })
    expect(unionBoxes([])).toBeNull()
  })

  it('la cámara se acerca más a una caja pequeña que a una grande', () => {
    const small: Box = { min: [-0.05, -0.05, -0.05], max: [0.05, 0.05, 0.05] }
    const big: Box = { min: [-0.5, -1, -0.2], max: [0.5, 1, 0.2] }
    expect(fitDistance(small, 45, 1.4)).toBeLessThan(fitDistance(big, 45, 1.4))
  })

  it('en pantalla estrecha se aleja más para que quepa el ancho', () => {
    const wide: Box = { min: [-1, -0.1, -0.1], max: [1, 0.1, 0.1] }
    expect(fitDistance(wide, 45, 0.5)).toBeGreaterThan(fitDistance(wide, 45, 2))
  })
})
