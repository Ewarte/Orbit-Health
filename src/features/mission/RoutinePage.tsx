import { Bell, BellOff, CheckCircle2, Clock3, Dumbbell, Moon, RotateCcw, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import type { MessageKey } from '../../lib/i18n'
import { useI18n } from '../../lib/useI18n'
import { ROUTINE_TASKS, type RoutineTaskId } from './routineLogic'
import type { RoutineReminders } from './useRoutineReminders'

const TASK_ICONS: Record<RoutineTaskId, LucideIcon> = {
  check: CheckCircle2,
  exercise: Dumbbell,
  review: Clock3,
  sleep: Moon,
}

type SystemAlerts = 'unsupported' | 'default' | 'granted' | 'denied'

function currentSystemAlerts(): SystemAlerts {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
}

interface RoutinePageProps {
  /** Estado de la rutina y sus recordatorios; lo calcula useRoutineReminders a nivel de App. */
  routine: RoutineReminders
}

/** Muestra la rutina del día; los avisos (banner y notificación del sistema) los maneja el hook global. */
export function RoutinePage({ routine }: RoutinePageProps) {
  const { t } = useI18n()
  const { reading, day, enabled, toggleDone, reset, toggleReminder } = routine
  const [systemAlerts, setSystemAlerts] = useState<SystemAlerts>(currentSystemAlerts)

  async function enableSystemAlerts() {
    if (typeof Notification === 'undefined') return
    setSystemAlerts(await Notification.requestPermission())
  }

  const taskLabel = (id: RoutineTaskId) => t(`routine.task.${id}` as MessageKey)

  return (
    <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-6 lg:py-5">
      <div className="mx-auto max-w-[1400px]">
        <header className="mb-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ok">
            <Clock3 className="h-4 w-4" /> {t('routine.eyebrow')}
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-text sm:text-4xl">{t('routine.title')}</h1>
          <p className="mt-2 text-mute">{t('routine.intro')}</p>
        </header>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
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
                    aria-label={t('routine.reminders.toggle', { task: label })}
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

        <section className="rounded-xl border border-edge bg-rail p-4 text-sm text-mute">
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
      </div>
    </main>
  )
}
