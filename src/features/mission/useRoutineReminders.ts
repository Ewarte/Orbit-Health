import { useEffect, useState } from 'react'
import { useI18n } from '../../lib/useI18n'
import type { MessageKey } from '../../lib/i18n'
import {
  NOTIFIED_STORAGE_KEY,
  REMINDERS_STORAGE_KEY,
  ROUTINE_STORAGE_KEY,
  dueReminders,
  emptyDay,
  localClock,
  parseEnabledReminders,
  parseRoutineDay,
  pendingNotifications,
  type RoutineClock,
  type RoutineDay,
  type RoutineTaskId,
} from './routineLogic'

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Sin almacenamiento: la rutina sigue funcionando mientras la app esté abierta.
  }
}

/**
 * Estado y recordatorios de la rutina. Vive a nivel de App (no de la pantalla Rutina) para que
 * los avisos funcionen en cualquier pantalla: revisa cada 30 s con el reloj de la misión,
 * expone los avisos pendientes y envía la notificación del sistema (si hay permiso) una sola
 * vez por tarea y día; lo ya avisado se guarda en localStorage.
 */
export function useRoutineReminders(clock: (now: Date) => RoutineClock = localClock) {
  const { t } = useI18n()
  const [now, setNow] = useState(() => new Date())
  const reading = clock(now)
  const [stored, setStored] = useState<RoutineDay>(() => {
    const start = new Date()
    return parseRoutineDay(readStorage(ROUTINE_STORAGE_KEY), start, clock(start).dayKey)
  })
  const [enabled, setEnabled] = useState<RoutineTaskId[]>(() => parseEnabledReminders(readStorage(REMINDERS_STORAGE_KEY)))

  // Al cambiar de fecha la rutina cuenta como un día en blanco (se guarda cuando la persona actúe).
  const day = stored.date === reading.dayKey ? stored : emptyDay(now, reading.dayKey)
  // Avisos pendientes: se calculan en cada vuelta, no se guardan.
  const due = dueReminders(now, day, enabled, reading.minutesOfDay)

  // El reloj avanza cada 30 s para detectar la hora de cada recordatorio.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  // Aviso del sistema, una sola vez por tarea y día (el banner de la app sale de `due`).
  const dueKey = due.map((task) => task.id).join(',')
  useEffect(() => {
    if (!dueKey || typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    const ids = dueKey.split(',') as RoutineTaskId[]
    const { fresh, next } = pendingNotifications(ids.map((id) => ({ id, time: '' })), day.date, readStorage(NOTIFIED_STORAGE_KEY))
    if (fresh.length === 0) return
    writeStorage(NOTIFIED_STORAGE_KEY, next)
    for (const id of fresh) new Notification(t('routine.reminders.dueTitle'), { body: t(`routine.task.${id}` as MessageKey) })
    // Solo reacciona a cambios de avisos o de día; `t` cambia únicamente con el idioma.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dueKey, day.date])

  function saveDay(next: RoutineDay) {
    setStored(next)
    writeStorage(ROUTINE_STORAGE_KEY, JSON.stringify(next))
  }

  return {
    reading,
    day,
    enabled,
    due,
    toggleDone(id: RoutineTaskId) {
      const done = day.done.includes(id) ? day.done.filter((item) => item !== id) : [...day.done, id]
      saveDay({ ...day, done })
    },
    dismiss(id: RoutineTaskId) {
      saveDay({ ...day, dismissed: [...day.dismissed, id] })
    },
    reset() {
      saveDay({ ...emptyDay(now, reading.dayKey), dismissed: day.dismissed })
    },
    toggleReminder(id: RoutineTaskId) {
      const next = enabled.includes(id) ? enabled.filter((item) => item !== id) : [...enabled, id]
      setEnabled(next)
      writeStorage(REMINDERS_STORAGE_KEY, JSON.stringify(next))
    },
  }
}

export type RoutineReminders = ReturnType<typeof useRoutineReminders>
