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
