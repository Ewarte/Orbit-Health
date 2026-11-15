import type { Status, ZoneId } from '../../types'
import type { MessageKey } from '../../lib/i18n'

/** Datos comunes de las cinco zonas, compartidos por las dos versiones del holograma. */
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
  head: { top: '6%', right: '2.5%', originX: '55%', originY: '9%', align: 'right' },
  heart: { top: '22%', left: '2.5%', originX: '48%', originY: '30%', align: 'left' },
  metabolism: { top: '38%', right: '2.5%', originX: '50%', originY: '44%', align: 'right' },
  body: { top: '52%', left: '2.5%', originX: '55%', originY: '36%', align: 'left' },
  legs: { bottom: '10%', right: '2.5%', originX: '52%', originY: '71%', align: 'right' },
}

/* ═══ Asignación de zonas ═══
   Criterio aprobado:
   - head: cerebro (y cráneo).
   - heart: corazón, pulmones y tráquea.
   - metabolism: hígado, estómago, intestinos, páncreas, riñones, vejiga y esófago.
   - body: TODO el cuerpo (en B la piel; en A, al elegirla se resalta la malla entera).
   - legs («Huesos y músculos»): todo el esqueleto y las extremidades. El id interno sigue siendo 'legs'. */

/** Zona a la que pertenece cada malla de public/anatomia.glb (versión B). */
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
 * Versión A: reparte cada vértice de humano.glb (altura total 1,96) en una zona.
 * h es la altura (de -0,98 en los pies a +0,98 en la cabeza) y x el lado. Los brazos cuelgan
 * en diagonal hasta h = -0,15 y se separan del tronco a partir de |x| = 0,21.
 * Nunca devuelve 'body': esa zona es el cuerpo entero y se resalta completa (ver isZoneLit).
 */
export function getVertexZone(x: number, h: number): ZoneId {
  const ax = Math.abs(x)
  if (h > 0.74) return 'head'
  // Los brazos son parte de «Huesos y músculos», igual que las piernas.
  if (h > -0.2 && ax > 0.21) return 'legs'
  if (h > 0.26) return 'heart'
  if (h > -0.08) return 'metabolism'
  return 'legs'
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

export interface Alignment {
  scale: number
  position: Vec3
}

/**
 * Alinea el modelo anatómico al de alambre: misma altura (escala uniforme), centrado en x y z,
 * y pies al mismo nivel. `position` es donde hay que colocar el origen del modelo anatómico ya escalado.
 */
export function computeAlignment(human: Box, anatomy: Box): Alignment {
  const humanH = human.max[1] - human.min[1]
  const anatomyH = anatomy.max[1] - anatomy.min[1]
  const scale = anatomyH > 0 ? humanH / anatomyH : 1
  const hc = boxCenter(human)
  const ac = boxCenter(anatomy)
  return {
    scale,
    position: [hc[0] - scale * ac[0], human.min[1] - scale * anatomy.min[1], hc[2] - scale * ac[2]],
  }
}

/** Caja de una malla anatómica una vez aplicada la alineación y un desplazamiento extra. */
export function alignBox(box: Box, a: Alignment, offset: Vec3 = [0, 0, 0]): Box {
  const f = (v: Vec3): Vec3 => [v[0] * a.scale + a.position[0] + offset[0], v[1] * a.scale + a.position[1] + offset[1], v[2] * a.scale + a.position[2] + offset[2]]
  return { min: f(box.min), max: f(box.max) }
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
