import { useEffect, useState } from 'react'
import { createRecord, CURRENT_METRICS_KEY, normalizeMetrics, STORAGE_KEY } from './dailyCheckData'
import type { DailyMetrics, SavedRecord } from './dailyCheckTypes'

function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) as T : fallback
  } catch {
    return fallback
  }
}

export function useDailyCheck(onComplete?: (metrics: DailyMetrics) => void) {
  const [metrics, setMetrics] = useState<DailyMetrics>(() => normalizeMetrics(readStorage<unknown>(CURRENT_METRICS_KEY, null)))
  const [savedRecords, setSavedRecords] = useState<SavedRecord[]>(() => {
    const raw = readStorage<unknown>(STORAGE_KEY, [])
    if (!Array.isArray(raw)) return []
    return raw.map((record: SavedRecord) => ({ ...record, metrics: normalizeMetrics(record?.metrics) }))
  })
  const [lastSavedTime, setLastSavedTime] = useState('07:10')
  /** Aviso tras guardar: se guarda el tipo y la hora, y la pantalla lo traduce al mostrarlo. */
  const [notification, setNotification] = useState<{ kind: 'all' | 'assistant'; time: string } | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedRecords))
      localStorage.setItem(CURRENT_METRICS_KEY, JSON.stringify(metrics))
    } catch {
      // El modo privado puede bloquear localStorage; la sesión continúa en memoria.
    }
  }, [metrics, savedRecords])

  useEffect(() => {
    if (!notification) return
    const timer = window.setTimeout(() => setNotification(null), 4000)
    return () => window.clearTimeout(timer)
  }, [notification])

  function save(metricsToSave: DailyMetrics, kind: 'all' | 'assistant') {
    const record = createRecord(metricsToSave)
    setMetrics(metricsToSave)
    setSavedRecords((records) => [record, ...records])
    setLastSavedTime(record.timeStr)
    setNotification({ kind, time: record.timeStr })
    onComplete?.(metricsToSave)
  }

  return {
    metrics,
    savedRecords,
    lastSavedTime,
    notification,
    dismissNotification: () => setNotification(null),
    saveAll: () => save(metrics, 'all'),
    saveAssistant: (nextMetrics: DailyMetrics) => save(nextMetrics, 'assistant'),
  }
}
