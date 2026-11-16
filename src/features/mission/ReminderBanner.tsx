import { Bell } from 'lucide-react'
import type { MessageKey } from '../../lib/i18n'
import { useI18n } from '../../lib/useI18n'
import type { RoutineReminders } from './useRoutineReminders'

/** Aviso global de recordatorios: se ve en cualquier pantalla y se puede descartar. */
export function ReminderBanner({ routine }: { routine: Pick<RoutineReminders, 'due' | 'dismiss'> }) {
  const { t } = useI18n()
  if (routine.due.length === 0) return null
  return (
    <div role="alert" className="fixed bottom-4 right-4 z-40 w-[min(92vw,26rem)] space-y-2">
      {routine.due.map(({ id }) => (
        <div key={id} className="flex items-center gap-3 rounded-xl border border-watch bg-notice p-4 text-text shadow-lg">
          <Bell className="h-5 w-5 shrink-0 text-watch" aria-hidden="true" />
          <p className="m-0 min-w-0 flex-1">
            <span className="text-mute">{t('routine.reminders.dueTitle')}: </span>
            <strong>{t(`routine.task.${id}` as MessageKey)}</strong>
          </p>
          <button
            type="button"
            onClick={() => routine.dismiss(id)}
            className="min-h-11 rounded-md px-3 text-sm font-semibold text-watch hover:brightness-110"
          >
            {t('routine.reminders.dismiss')}
          </button>
        </div>
      ))}
    </div>
  )
}
