/*
  Armado de los archivos de exportación (CSV y JSON) a partir de los registros. Funciones puras:
  devuelven texto; la descarga vive en download.ts. Todo se genera en el dispositivo.
*/
import type { Lang, MessageKey } from '../../lib/i18n'
import { translate } from '../../lib/i18n'
import { flightDay, parseUtc } from '../../lib/missionTime'
import type { Mission } from '../../types'
import { healthRanges } from '../evaluation/healthEngine'
import { METRIC_FIELDS, sourceOf } from '../measurements/dailyCheckData'
import type { DailyMetrics, SavedRecord } from '../measurements/dailyCheckTypes'
import { VALUE_COLUMNS, type ValueColumn } from './medicalData'

export const APP_NAME = 'Orbit Health'
export const APP_VERSION = '0.0.0'

/** Marca de orden de bytes UTF-8 al inicio del CSV: así Excel reconoce los acentos. */
export const CSV_BOM = '﻿'
/** Fin de línea del CSV (RFC 4180). */
const CSV_EOL = '\r\n'

type T = (key: MessageKey, params?: Record<string, string | number>) => string

function translator(lang: Lang): T {
  return (key, params) => translate(lang, key, params)
}

/** Escapa un campo CSV: lo entrecomilla si lleva coma, comillas o salto de línea, y duplica las comillas. */
export function escapeCsvField(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? '' : String(value)
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function unitText(unit: ValueColumn['unit'], t: T): string {
  return unit === 'breathsMin' ? t('unit.breathsMin') : unit
}

/** Valor de una medida tal como se ve en pantalla y en el CSV (texto del idioma activo). */
export function formatMetricValue(metrics: DailyMetrics, field: keyof DailyMetrics, t: T): string {
  if (field === 'mood') return t(`mood.${metrics.mood}`)
  if (field === 'visionChange') return metrics.visionChange ? t('history.visionChanged') : t('history.visionNone')
  const value = metrics[field]
  if (value === null) return ''
  return field === 'bodyTemperature' ? (value as number).toFixed(1) : String(value)
}

/** Fecha y hora UTC en ISO 8601 con segundos, por ejemplo «2026-11-16T14:05:09Z». */
export function isoUtc(ms: number): string {
  return new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z')
}

/** Día de vuelo de un registro según el despegue de la misión; vacío si la misión no tiene un despegue legible. */
export function recordFlightDay(record: SavedRecord, mission: Pick<Mission, 'launchUtc'>): number | null {
  const launch = parseUtc(mission.launchUtc)
  return launch === null ? null : flightDay(Date.parse(record.timestamp), launch)
}

/** Encabezados del CSV: valor con su unidad y, a continuación, su origen. */
export function csvHeaders(lang: Lang): string[] {
  const t = translator(lang)
  const headers = [t('medical.csv.timestamp'), t('medical.csv.flightDay')]
  for (const column of VALUE_COLUMNS) {
    const unit = unitText(column.unit, t)
    headers.push(unit ? `${t(column.labelKey)} (${unit})` : t(column.labelKey))
    headers.push(t('medical.csv.sourceOf', { name: t(column.labelKey) }))
  }
  return headers
}

/** CSV completo (con BOM, separador coma, fin de línea CRLF). `records` se escribe en el orden recibido. */
export function buildCsv(records: SavedRecord[], mission: Pick<Mission, 'launchUtc'>, lang: Lang): string {
  const t = translator(lang)
  const lines = [csvHeaders(lang).map(escapeCsvField).join(',')]
  for (const record of records) {
    const cells: (string | number | null)[] = [isoUtc(Date.parse(record.timestamp)), recordFlightDay(record, mission)]
    for (const column of VALUE_COLUMNS) {
      cells.push(formatMetricValue(record.metrics, column.field, t))
      cells.push(t(`sensor.origin.${sourceOf(record, column.field)}`))
    }
    lines.push(cells.map(escapeCsvField).join(','))
  }
  return CSV_BOM + lines.join(CSV_EOL) + CSV_EOL
}

export interface JsonExportOptions {
  mission: Pick<Mission, 'environment' | 'place' | 'launchUtc' | 'arrivalUtc'>
  lang: Lang
  /** Instante de la exportación, en milisegundos. */
  nowMs: number
}

/** JSON con metadatos y los registros, cada medida con su origen. */
export function buildJson(records: SavedRecord[], { mission, lang, nowMs }: JsonExportOptions): string {
  const t = translator(lang)
  const launch = parseUtc(mission.launchUtc)
  const data = {
    app: APP_NAME,
    appVersion: APP_VERSION,
    exportedAtUtc: isoUtc(nowMs),
    language: lang,
    thresholdsNotice: t('medical.json.notice'),
    mission: {
      environment: mission.environment,
      place: mission.place,
      launchUtc: launch === null ? null : isoUtc(launch),
      ...(mission.arrivalUtc ? { arrivalUtc: mission.arrivalUtc } : {}),
      flightDayAtExport: launch === null ? null : flightDay(nowMs, launch),
    },
    thresholdsDraft: healthRanges,
    recordCount: records.length,
    records: records.map((record) => ({
      id: record.id,
      timestampUtc: isoUtc(Date.parse(record.timestamp)),
      flightDay: recordFlightDay(record, mission),
      metrics: record.metrics,
      sources: Object.fromEntries(METRIC_FIELDS.map((field) => [field, sourceOf(record, field)])),
      ...(record.notes ? { notes: record.notes } : {}),
    })),
  }
  return JSON.stringify(data, null, 2)
}

/** Nombre del archivo: orbit-health_<entorno>_<AAAA-MM-DD>.<extensión>, con la fecha UTC de la exportación. */
export function exportFileName(environment: string, nowMs: number, extension: 'csv' | 'json'): string {
  return `orbit-health_${environment}_${new Date(nowMs).toISOString().slice(0, 10)}.${extension}`
}
