import type { Status, ZoneId } from '../../types'
import type { MessageKey } from '../../lib/i18n'

/** Datos comunes de las cinco zonas del holograma. */
export interface ZoneMeta {
  id: ZoneId
  icon: string
  labelKey: MessageKey
  nameKey: MessageKey
}

export const ZONE_META: ZoneMeta[] = [
  { id: 'head', icon: '🧠', labelKey: 'holo.zone.head.label', nameKey: 'holo.zone.head.name' },
  { id: 'heart', icon: '❤️', labelKey: 'holo.zone.heart.label', nameKey: 'holo.zone.heart.name' },
  { id: 'metabolism', icon: '⚡', labelKey: 'holo.zone.metabolism.label', nameKey: 'holo.zone.metabolism.name' },
  { id: 'body', icon: '🛡️', labelKey: 'holo.zone.body.label', nameKey: 'holo.zone.body.name' },
  { id: 'legs', icon: '🦴', labelKey: 'holo.zone.legs.label', nameKey: 'holo.zone.legs.name' },
]

export function getStatusColor(status?: Status): string {
  if (status === 'act') return '#ef4444'
  if (status === 'watch') return '#f97316'
  return '#00f2ff'
}

export const STATUS_KEY: Record<Status, MessageKey> = {
  ok: 'holo.status.ok',
  watch: 'holo.status.watch',
  act: 'holo.status.act',
}

/** Color con el que se resalta la zona que se está midiendo. */
export const HIGHLIGHT = '#ff204e'

export interface CloudPosition {
  top?: string
  bottom?: string
  left?: string
  right?: string
  originX: string
  originY: string
  align: 'left' | 'right'
}

/** Dónde aparece la nube de lecturas de cada zona y desde qué punto de la pantalla sale su línea. */
export const CLOUD_POSITIONS: Record<ZoneId, CloudPosition> = {
  head: { top: '6%', right: '2.5%', originX: '52.5%', originY: '12.5%', align: 'right' },
  heart: { top: '22%', left: '2.5%', originX: '51.5%', originY: '28%', align: 'left' },
  metabolism: { top: '38%', right: '2.5%', originX: '50%', originY: '42%', align: 'right' },
  body: { top: '52%', left: '2.5%', originX: '47%', originY: '26%', align: 'left' },
  legs: { bottom: '10%', right: '2.5%', originX: '47.5%', originY: '69%', align: 'right' },
}

/* ═══ Asignación de zonas ═══
   Criterio aprobado:
   - head: cerebro (y cráneo).
   - heart: corazón, pulmones y tráquea.
   - metabolism: hígado, estómago, intestinos, páncreas, riñones, vejiga y esófago.
   - body: TODO el cuerpo (la piel; al elegirla se resalta toda la silueta).
   - legs («Huesos y músculos»): todo el esqueleto y las extremidades. El id interno sigue siendo 'legs'. */

/** Zona a la que pertenece cada malla de public/anatomia.glb. */
export const ZONE_OF_MESH: Record<string, ZoneId> = {
  // Cerebro y conducta
  cerebro: 'head',
  // Corazón, pulmones y circulación
  corazon: 'heart',
  pulmon_der: 'heart',
  pulmon_izq: 'heart',
  traquea: 'heart',
  // Metabolismo y digestión
  higado: 'metabolism',
  estomago: 'metabolism',
  esofago: 'metabolism',
  intestino_delgado: 'metabolism',
  intestino_grueso: 'metabolism',
  pancreas: 'metabolism',
  rinon_der: 'metabolism',
  rinon_izq: 'metabolism',
  vejiga: 'metabolism',
  // Cuerpo entero e inmunidad: la piel envuelve todo
  piel: 'body',
  // Huesos y músculos: todo el esqueleto
  craneo: 'legs',
  columna: 'legs',
  costillas: 'legs',
  hombros: 'legs',
  humero_der: 'legs',
  humero_izq: 'legs',
  antebrazo_der: 'legs',
  antebrazo_izq: 'legs',
  mano_der: 'legs',
  mano_izq: 'legs',
  pelvis: 'legs',
  femur_der: 'legs',
  femur_izq: 'legs',
  rotula_der: 'legs',
  rotula_izq: 'legs',
  tibia_der: 'legs',
  tibia_izq: 'legs',
  pie_der: 'legs',
  pie_izq: 'legs',
}

/**
 * Coordenadas del cuerpo normalizadas con la caja de la piel: `u` es el lado (0 en el centro, positivo
 * hacia el lado izquierdo del cuerpo), `v` la altura (0 en los pies, 1 en la cabeza) y `w` la profundidad
 * (0 en el centro, positivo hacia el frente). Las tres se miden en alturas del cuerpo, así valen para cualquier escala.
 */
export interface BodyCoord {
  u: number
  v: number
  w: number
}

export function normalizePoint(p: Vec3, box: Box): BodyCoord {
  const height = box.max[1] - box.min[1] || 1
  const c = boxCenter(box)
  return { u: (p[0] - c[0]) / height, v: (p[1] - box.min[1]) / height, w: (p[2] - c[2]) / height }
}

/** Altura (normalizada) donde empieza la cabeza, la parte baja del abdomen y el pecho. */
const HEAD_V = 0.855
const CHEST_V = 0.66
const ABDOMEN_V = 0.47
/** Los brazos cuelgan pegados al cuerpo: desde esta distancia lateral hacia afuera ya no es tronco. */
const ARM_U = 0.087
const ARM_TOP_V = 0.84
const ARM_BOTTOM_V = 0.4

/**
 * Reparte cada vértice de la piel (modelo anatómico, brazos pegados al cuerpo) en una zona.
 * Se usa para colorear la silueta: cabeza, pecho, abdomen y «Huesos y músculos» (brazos, manos,
 * piernas y pies). Nunca devuelve 'body': esa zona es el cuerpo entero y se resalta completa (ver isZoneLit).
 */
export function getVertexZone(u: number, v: number): ZoneId {
  if (v > HEAD_V) return 'head'
  // Los brazos son parte de «Huesos y músculos», igual que las piernas.
  if (v > ARM_BOTTOM_V && v <= ARM_TOP_V && Math.abs(u) > ARM_U) return 'legs'
  if (v > CHEST_V) return 'heart'
  if (v > ABDOMEN_V) return 'metabolism'
  return 'legs'
}

/** Mitad del ancho central del pecho y el abdomen; más afuera (y por la espalda) es el costado del tronco. */
const TRUNK_CENTER_U = 0.05
/** Franja del cuello al tocar (normalizada): desde la base del cuello hasta justo bajo el mentón. */
const NECK_BOTTOM_V = HEAD_V - 0.04
const NECK_TOP_V = HEAD_V + 0.012

/**
 * Zona que se elige al tocar la piel en la vista general: igual que `getVertexZone`, pero el costado
 * del tronco, la espalda y el cuello (piel que no es de otra zona) eligen «Cuerpo entero».
 */
export function getTouchZone(u: number, v: number, w: number): ZoneId {
  // Cuello: franja algo más ancha que la geométrica (incluye la parte alta, bajo el mentón) para que
  // un toque en el cuello no se vaya a «Cerebro». La cara sigue siendo cabeza.
  if (v > NECK_BOTTOM_V && v <= NECK_TOP_V && Math.abs(u) < ARM_U) return 'body'
  const zone = getVertexZone(u, v)
  if (zone === 'legs' || zone === 'head') return zone
  if (Math.abs(u) > TRUNK_CENTER_U || w < 0) return 'body'
  return zone
}

/** Curva de entrada y salida suave (cúbica) para las transiciones, con t entre 0 y 1. */
export function easeInOutCubic(t: number): number {
  const x = Math.min(1, Math.max(0, t))
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}

/** ¿Debe resaltarse lo que pertenece a `itemZone` cuando está elegida `selected`? «Cuerpo entero» resalta todo. */
export function isZoneLit(selected: ZoneId, itemZone: ZoneId): boolean {
  return selected === 'body' || selected === itemZone
}

/* ═══ Holograma unificado: lógica pura (sin three.js, para poder probarla) ═══ */

export type Vec3 = [number, number, number]

/** Caja alineada a los ejes, con coordenadas simples. */
export interface Box {
  min: Vec3
  max: Vec3
}

export function boxCenter(b: Box): Vec3 {
  return [(b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, (b.min[2] + b.max[2]) / 2]
}

export function boxSize(b: Box): Vec3 {
  return [b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]]
}

/** Caja que contiene a todas las dadas; null si no hay ninguna. */
export function unionBoxes(boxes: Box[]): Box | null {
  if (boxes.length === 0) return null
  const min: Vec3 = [Infinity, Infinity, Infinity]
  const max: Vec3 = [-Infinity, -Infinity, -Infinity]
  for (const b of boxes) {
    for (let i = 0; i < 3; i++) {
      min[i] = Math.min(min[i], b.min[i])
      max[i] = Math.max(max[i], b.max[i])
    }
  }
  return { min, max }
}

/** Caja desplazada (para centrar el cuerpo en el origen). */
export function shiftBox(box: Box, offset: Vec3): Box {
  return {
    min: [box.min[0] + offset[0], box.min[1] + offset[1], box.min[2] + offset[2]],
    max: [box.max[0] + offset[0], box.max[1] + offset[1], box.max[2] + offset[2]],
  }
}

/** Distancia de la cámara para que `box` quepa en el encuadre (con un margen multiplicador). */
export function fitDistance(box: Box, fovDeg: number, aspect: number, margin = 1.2): number {
  const [w, h, d] = boxSize(box)
  const tanV = Math.tan((fovDeg * Math.PI) / 360)
  const tanH = tanV * Math.max(aspect, 0.1)
  const need = Math.max(h / 2 / tanV, w / 2 / tanH)
  return need * margin + d / 2
}

/* ─── Qué se ve en cada zona ─── */

const SKIN_MESH = 'piel'

/** Mallas que, al hacer zoom a una zona, se dejan como contexto casi transparente. */
const GHOST_OF_ZONE: Partial<Record<ZoneId, string[]>> = {
  head: ['craneo'],
  heart: ['costillas'],
}

export const GHOST_OPACITY = 0.12
/** Opacidad de los demás órganos de la zona cuando hay uno enfocado. */
export const DIMMED_OPACITY = 0.3

/** Nombres de las mallas de anatomia.glb que pertenecen a una zona (la piel nunca: la silueta es la malla de alambre). */
export function meshesOfZone(zone: ZoneId): string[] {
  return Object.keys(ZONE_OF_MESH).filter((n) => n !== SKIN_MESH && ZONE_OF_MESH[n] === zone)
}

/**
 * Opacidad con la que se dibuja una malla anatómica. 0 significa oculta.
 * `zoomed` indica si hay zoom a una zona; `focused` es la malla tocada (o null).
 * «Cuerpo entero» no muestra órganos: se ve la silueta completa.
 */
export function meshOpacity(name: string, zone: ZoneId, zoomed: boolean, focused: string | null = null): number {
  if (!zoomed || name === SKIN_MESH || zone === 'body') return 0
  if (GHOST_OF_ZONE[zone]?.includes(name)) return GHOST_OPACITY
  if (ZONE_OF_MESH[name] !== zone) return 0
  if (focused && focused !== name) return DIMMED_OPACITY
  return 1
}

/** Identificador del nombre visible: agrupa derecho e izquierdo («pulmon_der» y «pulmon_izq» son «pulmon»). */
export function organId(meshName: string): string {
  return meshName.replace(/_(der|izq)$/, '')
}
