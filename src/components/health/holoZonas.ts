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
  head: { top: '6%', right: '2.5%', originX: '50%', originY: '18%', align: 'right' },
  heart: { top: '22%', left: '2.5%', originX: '48%', originY: '30%', align: 'left' },
  metabolism: { top: '38%', right: '2.5%', originX: '50%', originY: '44%', align: 'right' },
  body: { top: '52%', left: '2.5%', originX: '38%', originY: '46%', align: 'left' },
  legs: { bottom: '10%', right: '2.5%', originX: '52%', originY: '71%', align: 'right' },
}
