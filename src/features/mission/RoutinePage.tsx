import { Bell, BellOff, CheckCircle2, Clock3, Dumbbell, Moon, RotateCcw, type LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { MessageKey } from '../../lib/i18n'
import { useI18n } from '../../lib/useI18n'
import {
  REMINDERS_STORAGE_KEY,
  ROUTINE_STORAGE_KEY,
  ROUTINE_TASKS,
  dueReminders,
  emptyDay,
  localClock,
  parseEnabledReminders,
  parseRoutineDay,
  type RoutineClock,
  type RoutineDay,
  type RoutineTaskId,
} from './routineLogic'

const TASK_ICONS: Record<RoutineTaskId, LucideIcon> = {
  check: CheckCircle2,
  exercise: Dumbbell,
  review: Clock3,
  sleep: Moon,
}

type SystemAlerts = 'unsupported' | 'default' | 'granted' | 'denied'

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

function currentSystemAlerts(): SystemAlerts {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
}

interface RoutinePageProps {
  /** Reloj de la misión; por defecto, la hora local del dispositivo. */
  clock?: (now: Date) => RoutineClock
}

export function RoutinePage({ clock = localClock }: RoutinePageProps) {
  const { t } = useI18n()
  const [now, setNow] = useState(() => new Date())
  const reading = clock(now)
  const [stored, setStored] = useState<RoutineDay>(() => {
    const start = new Date()
    return parseRoutineDay(readStorage(ROUTINE_STORAGE_KEY), start, clock(start).dayKey)
  })
  const [enabled, setEnabled] = useState<RoutineTaskId[]>(() => parseEnabledReminders(readStorage(REMINDERS_STORAGE_KEY)))
  const [systemAlerts, setSystemAlerts] = useState<SystemAlerts>(currentSystemAlerts)
  const notified = useRef(new Set<string>())

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
  const dueKey = due.map((task) => `${day.date}:${task.id}`).join(',')
  useEffect(() => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    for (const key of dueKey ? dueKey.split(',') : []) {
      if (notified.current.has(key)) continue
      notified.current.add(key)
      const id = key.split(':')[1]
      new Notification(t('routine.reminders.dueTitle'), { body: t(`routine.task.${id}` as MessageKey) })
    }
  }, [dueKey, t])

  function saveDay(next: RoutineDay) {
    setStored(next)
    writeStorage(ROUTINE_STORAGE_KEY, JSON.stringify(next))
  }

  function toggleDone(id: RoutineTaskId) {
    const done = day.done.includes(id) ? day.done.filter((item) => item !== id) : [...day.done, id]
    saveDay({ ...day, done })
  }

  function dismiss(id: RoutineTaskId) {
    saveDay({ ...day, dismissed: [...day.dismissed, id] })
  }

  function reset() {
    saveDay({ ...emptyDay(now, reading.dayKey), dismissed: day.dismissed })
  }

  function toggleReminder(id: RoutineTaskId) {
    const next = enabled.includes(id) ? enabled.filter((item) => item !== id) : [...enabled, id]
    setEnabled(next)
    writeStorage(REMINDERS_STORAGE_KEY, JSON.stringify(next))
  }

  async function enableSystemAlerts() {
    if (typeof Notification === 'undefined') return
    setSystemAlerts(await Notification.requestPermission())
  }

  const taskLabel = (id: RoutineTaskId) => t(`routine.task.${id}` as MessageKey)

  return (
    <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ok">
            <Clock3 className="h-4 w-4" /> {t('routine.eyebrow')}
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-text sm:text-4xl">{t('routine.title')}</h1>
          <p className="mt-2 text-mute">{t('routine.intro')}</p>
        </header>

        {due.length > 0 && (
          <div role="alert" className="mb-4 space-y-2">
            {due.map(({ id }) => (
              <div key={id} className="flex items-center gap-3 rounded-xl border border-watch bg-notice p-4 text-text">
                <Bell className="h-5 w-5 shrink-0 text-watch" aria-hidden="true" />
                <p className="m-0 min-w-0 flex-1">
                  <span className="text-mute">{t('routine.reminders.dueTitle')}: </span>
                  <strong>{taskLabel(id)}</strong>
                </p>
                <button
                  type="button"
                  onClick={() => dismiss(id)}
                  className="min-h-11 rounded-md px-3 text-sm font-semibold text-watch hover:brightness-110"
                >
                  {t('routine.reminders.dismiss')}
                </button>
              </div>
            ))}
          </div>
        )}

        <section className="rounded-2xl border border-edge bg-panel p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="m-0 text-sm text-mute">
              {t('routine.progress', { done: day.done.length, total: ROUTINE_TASKS.length })}
            </p>
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 py-2 text-sm text-mute hover:text-text"
            >
              <RotateCcw className="h-4 w-4" /> {t('routine.reset')}
            </button>
          </div>

          <ul className="m-0 list-none space-y-3 p-0">
            {ROUTINE_TASKS.map(({ id, time }) => {
              const complete = day.done.includes(id)
              const remindOn = enabled.includes(id)
              const Icon = TASK_ICONS[id]
              const label = taskLabel(id)
              return (
                <li key={id} className="flex items-stretch gap-2">
                  <button
                    type="button"
                    onClick={() => toggleDone(id)}
                    aria-pressed={complete}
                    className={`flex min-h-16 min-w-0 flex-1 items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                      complete ? 'border-ok bg-notice' : 'border-edge bg-rail hover:border-ok'
                    }`}
                  >
                    <span className={complete ? 'text-ok' : 'text-mute'}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className={`block ${complete ? 'text-ok line-through' : 'text-text'}`}>{label}</strong>
                      <span className="text-sm text-mute">{time}{reading.label ? ` ${reading.label}` : ''}</span>
                    </span>
                    <CheckCircle2 className={`h-5 w-5 ${complete ? 'text-ok' : 'text-edge'}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleReminder(id)}
                    aria-pressed={remindOn}
                    aria-label={t(remindOn ? 'routine.reminders.on' : 'routine.reminders.off', { task: label })}
                    title={t(remindOn ? 'routine.reminders.on' : 'routine.reminders.off', { task: label })}
                    className={`flex min-h-16 w-14 shrink-0 items-center justify-center rounded-xl border ${
                      remindOn ? 'border-watch text-watch' : 'border-edge text-mute hover:text-text'
                    }`}
                  >
                    {remindOn ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="mt-4 rounded-xl border border-edge bg-rail p-4 text-sm text-mute">
          <h2 className="m-0 text-sm font-semibold text-text">{t('routine.reminders.title')}</h2>
          <p className="mb-0 mt-1">{t('routine.reminders.note')}</p>
          {systemAlerts === 'default' && (
            <button
              type="button"
              onClick={enableSystemAlerts}
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg border border-ok px-4 py-2 font-semibold text-ok hover:bg-notice"
            >
              <Bell className="h-4 w-4" /> {t('routine.reminders.enableSystem')}
            </button>
          )}
          {systemAlerts === 'granted' && <p role="status" className="mb-0 mt-3 text-ok">{t('routine.reminders.systemOn')}</p>}
          {systemAlerts === 'denied' && <p role="status" className="mb-0 mt-3 text-watch">{t('routine.reminders.systemDenied')}</p>}
          {systemAlerts === 'unsupported' && <p role="status" className="mb-0 mt-3">{t('routine.reminders.systemUnsupported')}</p>}
        </section>
      </div>
    </main>
  )
}
