import { useState } from 'react'
import { indicatorName } from '../../lib/domainText'
import { useI18n } from '../../lib/useI18n'
import type { Alert } from './guidanceLogic'

/** Textos del aviso a partir de una alerta en vivo: título, resumen y pasos de la guía, en el idioma activo. */
function useNoticeText(alert: Alert) {
  const { lang, t } = useI18n()
  const { indicator, entry } = alert
  const name = entry?.name[lang] ?? indicatorName(t, indicator)
  return {
    title: t(indicator.status === 'act' ? 'notice.title.act' : 'notice.title.watch', { name }),
    summary: entry?.meaning[lang] ?? t('guidance.generic.meaning'),
    steps: entry?.doNow[lang] ?? [t('guidance.generic.doNow')],
  }
}

/** Aviso de atención con los pasos a seguir, desplegables. Sale de una alerta en vivo (no de avisos escritos a mano). */
export function NoticeCard({ alert, onGuidance }: { alert: Alert; onGuidance?: () => void }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const { title, summary, steps } = useNoticeText(alert)
  const stepsId = `steps-${alert.indicator.id}`

  return (
    <section className="mt-4 rounded-lg border border-notice-edge bg-notice px-4 py-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 max-w-[52ch]">
          <b>{title}</b> {summary}
        </p>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={stepsId}
          onClick={() => setOpen((v) => !v)}
          className="min-h-11 w-full cursor-pointer rounded-md bg-watch px-4 py-2.5 font-semibold text-on-watch hover:brightness-110 sm:w-auto"
        >
          {open ? t('notice.hide') : t('notice.show')}
        </button>
        {onGuidance && <button type="button" onClick={onGuidance} className="min-h-11 rounded-md border border-watch px-4 py-2.5 font-semibold text-watch hover:bg-watch hover:text-on-watch">{t('notice.openGuidance')}</button>}
      </div>
      {open && (
        <ol id={stepsId} className="mt-3 mb-1 list-decimal pl-6">
          {steps.map((step) => (
            <li key={step} className="mb-1">
              {step}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
