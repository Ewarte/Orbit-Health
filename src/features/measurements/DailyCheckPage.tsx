import {
  Calendar,
  Check,
  CheckCircle2,
  HardDriveDownload,
  History,
  RotateCcw,
  SlidersHorizontal,
  TrendingUp,
  X,
} from 'lucide-react'
import { useState } from 'react'
import type { Mission } from '../../types'
import { DailyCheckAssistant } from './DailyCheckAssistant'
import { DailyCheckHistory } from './DailyCheckHistory'
import { DailyMetricCards } from './DailyMetricCards'
import { steps, type StepId } from './dailyCheckData'
import type { DailyMetrics } from './dailyCheckTypes'
import { useDailyCheck } from './useDailyCheck'

interface Props {
  mission?: Mission
  onComplete?: (metrics: DailyMetrics) => void
  onNavigate?: (screen: string) => void
}

export function DailyCheckPage({ mission, onComplete, onNavigate }: Props) {
  const check = useDailyCheck(onComplete)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState(check.metrics)

  function openAssistant(stepId?: StepId) {
    setDraft({ ...check.metrics })
    setStep(Math.max(0, steps.findIndex((item) => item.id === stepId)))
    setAssistantOpen(true)
  }

  return (
    <main className="min-w-0 px-4 py-5 sm:px-6 sm:py-8 lg:px-6 lg:py-5">
      <div className="mx-auto max-w-[1400px]">
        {check.notification && (
          <Notification
            message={check.notification}
            onClose={check.dismissNotification}
          />
        )}

        <header className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-text sm:text-4xl">
            Daily check
          </h1>
          <p className="text-sm text-mute">
            {mission?.place ?? 'Lunar transit'}, last check{' '}
            <strong className="text-text">
              {check.lastSavedTime || mission?.lastCheck || '07:10'}
            </strong>
          </p>
        </header>

        <StatusHero
          completed={check.savedRecords.length > 0}
          recordCount={check.savedRecords.length}
          onHistory={() => setHistoryOpen(true)}
          onEdit={() => openAssistant()}
          onTrends={onNavigate ? () => onNavigate('trends') : undefined}
        />

        <section aria-label="Health check metrics" className="mb-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold tracking-wide text-text">
              Check your health
            </h2>
            <button
              type="button"
              onClick={() => openAssistant()}
              className="hidden min-h-11 items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium text-mute hover:text-text sm:inline-flex"
            >
              <RotateCcw className="h-3.5 w-3.5 text-ok" /> Modificar valores
            </button>
          </div>

          <DailyMetricCards metrics={check.metrics} onSelect={openAssistant} />
        </section>

        <section className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={check.saveAll}
            className="flex min-h-12 flex-1 items-center justify-center gap-3 rounded-xl border-2 border-ok bg-notice px-6 py-4 text-base font-bold text-ok hover:brightness-110"
          >
            <HardDriveDownload className="h-5 w-5" /> Registrar datos
          </button>

          <button
            type="button"
            onClick={() => openAssistant()}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-edge bg-panel px-5 py-4 text-sm font-semibold text-text hover:border-ok"
          >
            <CheckCircle2 className="h-5 w-5 text-ok" /> Daily check completed
          </button>

          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('trends')}
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-edge bg-panel px-5 py-4 text-sm font-semibold text-text hover:border-ok"
            >
              <TrendingUp className="h-5 w-5 text-ok" /> Ver tendencias
            </button>
          )}
        </section>
      </div>

      {historyOpen && (
        <DailyCheckHistory
          records={check.savedRecords}
          onClose={() => setHistoryOpen(false)}
        />
      )}

      {assistantOpen && (
        <DailyCheckAssistant
          metrics={draft}
          step={step}
          onChange={setDraft}
          onStep={setStep}
          onClose={() => setAssistantOpen(false)}
          onSave={() => {
            check.saveAssistant(draft)
            setAssistantOpen(false)
          }}
        />
      )}
    </main>
  )
}

function Notification({
  message,
  onClose,
}: {
  message: string
  onClose: () => void
}) {
  return (
    <div
      role="status"
      className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-ok bg-notice px-4 py-3 text-sm font-medium text-ok"
    >
      <div className="flex items-center gap-2.5">
        <Check className="h-5 w-5 shrink-0" />
        <span>{message}</span>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="rounded p-2 hover:bg-panel"
        aria-label="Cerrar notificación"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

function StatusHero({
  completed,
  recordCount,
  onHistory,
  onEdit,
  onTrends,
}: {
  completed: boolean
  recordCount: number
  onHistory: () => void
  onEdit: () => void
  onTrends?: () => void
}) {
  return (
    <section
      aria-label="Daily check status"
      className="relative mb-5 overflow-hidden rounded-2xl border border-edge bg-panel p-4 shadow-lg sm:p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-notice text-ok">
            <Check className="h-8 w-8 stroke-[3]" />
          </span>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-text sm:text-2xl">
              {completed ? 'All good today!' : 'Check pending'}
            </h2>
            <p className="text-sm text-mute sm:text-base">
              {completed
                ? 'You completed your daily check'
                : 'Record your daily parameters'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-edge bg-rail px-4 py-2 text-sm font-medium text-text">
            <Calendar className="h-4 w-4 text-ok" /> Nov 14, 2026
          </span>

          <button
            type="button"
            onClick={onHistory}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-edge bg-rail px-3.5 py-1.5 text-xs font-medium text-mute hover:text-text"
          >
            <History className="h-3.5 w-3.5 text-ok" /> Historial ({recordCount})
          </button>

          {onTrends && (
            <button
              type="button"
              onClick={onTrends}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-edge bg-rail px-3.5 py-1.5 text-xs font-medium text-mute hover:text-text"
            >
              <TrendingUp className="h-3.5 w-3.5 text-ok" /> Tendencias
            </button>
          )}

          <button
            type="button"
            onClick={onEdit}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-edge bg-panel px-3 py-1.5 text-xs font-medium text-mute hover:text-text sm:hidden"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" /> Editar
          </button>
        </div>
      </div>
    </section>
  )
}