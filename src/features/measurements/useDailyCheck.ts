import { useEffect, useState } from 'react'
import { createRecord, CURRENT_METRICS_KEY, defaultMetrics, formatUtcHHMM, MAX_RECORDS, normalizeMetrics, parseRecords, STORAGE_KEY } from './dailyCheckData'
import type { DailyMetrics, MetricSources, SavedRecord } from './dailyCheckTypes'

function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) as T : fallback
  } catch {
    return fallback
  }
}

/**
 * Última medida real guardada: el chequeo más reciente del historial o, si no hay historial,
 * las medidas actuales que guardaron versiones anteriores (migración). Sin nada guardado, null:
 * un usuario nuevo empieza en blanco.
 */
export function readMeasuredMetrics(): DailyMetrics | null {
  const records = parseRecords(readStorage<unknown>(STORAGE_KEY, []))
  if (records.length > 0) return records[0].metrics
  const legacy = readStorage<unknown>(CURRENT_METRICS_KEY, null)
  return legacy && typeof legacy === 'object' && !Array.isArray(legacy) && Object.keys(legacy).length > 0 ? normalizeMetrics(legacy) : null
}

/** Aviso tras guardar: se guarda el tipo y la hora UTC, y la pantalla lo traduce al mostrarlo. */
export type SaveNotification = { kind: 'all' | 'assistant'; time: string }

export function useDailyCheck(onComplete?: (metrics: DailyMetrics, record: SavedRecord) => void) {
  const [savedRecords, setSavedRecords] = useState<SavedRecord[]>(() => parseRecords(readStorage<unknown>(STORAGE_KEY, [])))
  /** Última medida real; null mientras no haya ningún chequeo. */
  const [measured, setMeasured] = useState<DailyMetrics | null>(() => readMeasuredMetrics())
  const [notification, setNotification] = useState<SaveNotification | null>(null)

  useEffect(() => {
    if (!notification) return
    const timer = window.setTimeout(() => setNotification(null), 4000)
    return () => window.clearTimeout(timer)
  }, [notification])

  function save(metricsToSave: DailyMetrics, kind: 'all' | 'assistant', sources?: MetricSources) {
    const record = createRecord(metricsToSave, new Date(), sources)
    const next = [record, ...savedRecords].slice(0, MAX_RECORDS)
    setMeasured(metricsToSave)
    setSavedRecords(next)
    setNotification({ kind, time: `${formatUtcHHMM(record.timestamp)} UTC` })
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      localStorage.setItem(CURRENT_METRICS_KEY, JSON.stringify(metricsToSave))
    } catch {
      // El modo privado puede bloquear localStorage; la sesión continúa en memoria.
    }
    onComplete?.(metricsToSave, record)
  }

  return {
    /** Última medida real (null si aún no hay chequeos). */
    measured,
    /** Posición inicial de los controles: la última medida o, sin ella, los valores por defecto. */
    metrics: measured ?? defaultMetrics,
    savedRecords,
    /** Fecha ISO del último chequeo real, o null. */
    lastCheckAt: savedRecords[0]?.timestamp ?? null,
    notification,
    dismissNotification: () => setNotification(null),
    saveAssistant: (nextMetrics: DailyMetrics, sources?: MetricSources) => save(nextMetrics, 'assistant', sources),
    /** Guarda las medidas actuales; sin chequeo previo no guarda nada y devuelve false (la pantalla abre el asistente). */
    saveAll: (): boolean => {
      if (!measured) return false
      save(measured, 'all', savedRecords[0]?.sources)
      return true
    },
  }
}
