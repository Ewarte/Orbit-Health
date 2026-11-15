import { useState } from 'react'
import type { Notice } from '../../types'

interface Props {
  notice: Notice
  onNavigate?: (screen: string) => void
}

/** Aviso de atención con los pasos a seguir, desplegables y enlace a protocolo. */
export function NoticeCard({ notice, onNavigate }: Props) {
  const [open, setOpen] = useState(false)
  const stepsId = `steps-${notice.indicatorId}`

  return (
    <section className="mt-4 rounded-xl border border-notice-edge bg-notice px-4 py-3.5 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 max-w-[52ch] text-sm text-text">
          <b className="text-watch">{notice.title}</b> {notice.summary}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('guidance')}
              className="min-h-10 cursor-pointer rounded-lg border border-notice-edge bg-panel/70 px-3 py-1.5 text-xs font-semibold text-text hover:border-[#5cc98b]/50 hover:bg-[#184840] hover:text-[#5cc98b]"
            >
              Manual Clínico
            </button>
          )}
          <button
            type="button"
            aria-expanded={open}
            aria-controls={stepsId}
            onClick={() => setOpen((v) => !v)}
            className="min-h-10 w-full cursor-pointer rounded-lg bg-watch px-4 py-2 text-xs font-bold text-on-watch hover:brightness-110 sm:w-auto"
          >
            {open ? 'Ocultar pasos' : 'Ver qué hacer'}
          </button>
        </div>
      </div>
      {open && (
        <div className="mt-3 border-t border-notice-edge/60 pt-3">
          <ol id={stepsId} className="mb-2 list-decimal space-y-1.5 pl-5 text-xs text-mute">
            {notice.steps.map((step) => (
              <li key={step} className="leading-relaxed text-text">
                {step}
              </li>
            ))}
          </ol>
          {onNavigate && (
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => onNavigate('routine')}
                className="text-xs font-semibold text-watch hover:underline cursor-pointer"
              >
                Ajustar contramedida en mi Rutina diaria →
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
