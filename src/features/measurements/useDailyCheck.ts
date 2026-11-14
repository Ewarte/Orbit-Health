import { useEffect, useState } from 'react'
import { createRecord, CURRENT_METRICS_KEY, defaultMetrics, STORAGE_KEY } from './dailyCheckData'
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
  const [metrics, setMetrics] = useState(() => readStorage(CURRENT_METRICS_KEY, defaultMetrics))
  const [savedRecords, setSavedRecords] = useState<SavedRecord[]>(() => readStorage(STORAGE_KEY, []))
  const [lastSavedTime, setLastSavedTime] = useState('07:10')
  const [notification, setNotification] = useState<string | null>(null)

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

  function save(metricsToSave: DailyMetrics, message: string) {
    const record = createRecord(metricsToSave)
    setMetrics(metricsToSave)
    setSavedRecords((records) => [record, ...records])
    setLastSavedTime(record.timeStr)
    setNotification(`${message} (${record.timeStr}).`)
    onComplete?.(metricsToSave)
  }

  return {
    metrics,
    savedRecords,
    lastSavedTime,
    notification,
    dismissNotification: () => setNotification(null),
    saveAll: () => save(metrics, 'Datos registrados correctamente en la telemetría local'),
    saveAssistant: (nextMetrics: DailyMetrics) => save(nextMetrics, 'Chequeo completado y registrado'),
  }
}
