/*
  Textos de los datos (indicadores, zonas, estados, estado de ánimo) en el idioma activo.
  Los datos conservan su texto original; aquí se traduce solo al mostrarlo.
*/
import { messages, type Lang, type MessageKey } from './i18n'
import type { I18n } from './useI18n'
import type { Indicator, Status, Zone } from '../types'

type T = I18n['t']

/** ¿Existe esta clave de texto? Sirve para usar el texto original cuando no hay traducción. */
function isKey(key: string): key is MessageKey {
  return key in messages.es
}

/** Traduce con la clave si existe; si no, devuelve el texto de respaldo. */
export function tOr(t: T, key: string, fallback: string, params?: Record<string, string | number>): string {
  return isKey(key) ? t(key, params) : fallback
}

/** Código de idioma para Intl. */
export function localeOf(lang: Lang): string {
  return lang === 'es' ? 'es-ES' : 'en-US'
}

export function statusLabel(t: T, status: Status): string {
  return t(`status.${status}`)
}

export function indicatorName(t: T, indicator: Pick<Indicator, 'id' | 'name'>): string {
  return tOr(t, `indicator.${indicator.id}.name`, indicator.name)
}

const unitKeys: Record<string, MessageKey> = {
  hours: 'unit.hours',
  'breaths/min': 'unit.breathsMin',
  'of 5': 'unit.of5',
  'min today': 'unit.minToday',
}

/** Unidades con texto (horas, resp/min...). Las internacionales (mmHg, bpm, %) no cambian. */
export function unitLabel(t: T, unit: string): string {
  const key = unitKeys[unit]
  return key ? t(key) : unit
}

const moodKeys = { Bad: 'mood.Bad', Fair: 'mood.Fair', Neutral: 'mood.Neutral', Good: 'mood.Good', Great: 'mood.Great' } as const

/** Estado de ánimo guardado ('Bad'...'Great') mostrado en el idioma activo. */
export function moodLabel(t: T, mood: string): string {
  return mood in moodKeys ? t(moodKeys[mood as keyof typeof moodKeys]) : mood
}

/** Valor del indicador: traduce las palabras (ánimo, visión); las cifras quedan igual. */
export function indicatorValue(t: T, indicator: Pick<Indicator, 'id' | 'value'>): string {
  if (indicator.id === 'mood') return moodLabel(t, indicator.value)
  if (indicator.id === 'vision') {
    if (indicator.value === 'No change') return t('value.noChange')
    if (indicator.value === 'Change reported') return t('value.changeReported')
  }
  return indicator.value
}

/** Motivo del estado: usa la clave y los parámetros si existen; si no, el texto original. */
export function indicatorReason(t: T, indicator: Pick<Indicator, 'reason' | 'reasonKey' | 'reasonParams'>): string {
  if (indicator.reasonKey) return tOr(t, indicator.reasonKey, indicator.reason, indicator.reasonParams)
  return indicator.reason
}

export function zoneName(t: T, zone: Pick<Zone, 'id' | 'name'>): string {
  return tOr(t, `holo.zone.${zone.id}.name`, zone.name)
}

export function zoneAbout(t: T, zone: Pick<Zone, 'id' | 'about'>): string {
  return tOr(t, `zone.${zone.id}.about`, zone.about)
}

/** Fecha corta con el idioma activo (por ejemplo «14 nov 2026» o «Nov 14, 2026»). */
export function formatDate(value: Date | string | number, lang: Lang, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }): string {
  return new Intl.DateTimeFormat(localeOf(lang), options).format(new Date(value))
}

/** Hora de 24 horas con el idioma activo. */
export function formatClock(value: Date | string | number, lang: Lang): string {
  return new Intl.DateTimeFormat(localeOf(lang), { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value))
}
