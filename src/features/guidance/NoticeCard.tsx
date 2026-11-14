import { useState } from 'react'
import type { Notice } from '../../types'

/** Aviso de atención con los pasos a seguir, desplegables. */
export function NoticeCard({ notice, onGuidance }: { notice: Notice; onGuidance?: () => void }) {
  const [open, setOpen] = useState(false)
  const stepsId = `steps-${notice.indicatorId}`

  return (
    <section className="mt-4 rounded-lg border border-notice-edge bg-notice px-4 py-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 max-w-[52ch]">
          <b>{notice.title}</b> {notice.summary}
        </p>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={stepsId}
          onClick={() => setOpen((v) => !v)}
          className="min-h-11 w-full cursor-pointer rounded-md bg-watch px-4 py-2.5 font-semibold text-on-watch hover:brightness-110 sm:w-auto"
        >
          {open ? 'Hide steps' : 'See what to do'}
        </button>
        {onGuidance && <button type="button" onClick={onGuidance} className="min-h-11 rounded-md border border-watch px-4 py-2.5 font-semibold text-watch hover:bg-watch hover:text-on-watch">Open guidance</button>}
      </div>
      {open && (
        <ol id={stepsId} className="mt-3 mb-1 list-decimal pl-6">
          {notice.steps.map((step) => (
            <li key={step} className="mb-1">
              {step}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
