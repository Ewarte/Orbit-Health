import { AlertTriangle, CheckCircle2, ExternalLink, Phone, ShieldAlert, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { guidanceEntries } from '../../data/guidance'
import { indicatorReason, indicatorValue, unitLabel } from '../../lib/domainText'
import { useI18n } from '../../lib/useI18n'
import type { Indicator } from '../../types'
import { activeAlerts, type Alert } from './guidanceLogic'

interface Props {
  /** Indicadores en vivo, ya evaluados. Las alertas salen de aquí. */
  indicators: Indicator[]
}

export function GuidancePage({ indicators }: Props) {
  const { t } = useI18n()
  const alerts = activeAlerts(indicators)

  return (
    <main className="min-w-0 px-4 py-5 sm:px-6 sm:py-8 lg:px-6 lg:py-5">
      <div className="mx-auto max-w-[1400px]">
        <header className="mb-5">
          <p className="m-0 text-xs font-semibold uppercase tracking-wider text-watch">{t('guidance.eyebrow')}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-text sm:text-4xl">{t('guidance.title')}</h1>
          <p className="mt-2 max-w-2xl text-mute">{t('guidance.intro')}</p>
          {alerts.length > 0 && (
            <p role="status" className="mb-0 mt-3 text-sm font-semibold text-text">
              {alerts.length === 1 ? t('guidance.count.one') : t('guidance.count.other', { n: alerts.length })}
            </p>
          )}
        </header>

        {indicators.length === 0 ? <NoChecks /> : alerts.length === 0 ? <AllClear /> : (
          <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
            {alerts.map((alert) => <AlertCard key={alert.indicator.id} alert={alert} />)}
          </div>
        )}

        <section className="mt-5 rounded-xl border border-edge bg-panel p-4 text-sm text-mute">{t('guidance.footer')}</section>
      </div>
    </main>
  )
}

function AlertCard({ alert }: { alert: Alert }) {
  const { lang, t } = useI18n()
  const { indicator, entry } = alert
  const critical = indicator.status === 'act'
  const name = entry?.name[lang] ?? indicator.name
  const unit = unitLabel(t, indicator.unit)
  const value = `${indicatorValue(t, indicator)}${unit ? ` ${unit}` : ''}`
  const reason = indicatorReason(t, indicator)
  const titleId = `guidance-${indicator.id}`

  return (
    <article
      aria-labelledby={titleId}
      className={`rounded-2xl border p-5 sm:p-6 ${critical ? 'border-act bg-panel' : 'border-notice-edge bg-notice'}`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className={`mt-1 h-6 w-6 shrink-0 ${critical ? 'text-act' : 'text-watch'}`} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 id={titleId} className="m-0 font-display text-2xl font-semibold text-text">{name}</h2>
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${critical ? 'border-act text-act' : 'border-watch text-watch'}`}>
              {t(critical ? 'guidance.status.act' : 'guidance.status.watch')}
            </span>
          </div>
          <p className="mb-0 mt-1 text-sm text-mute">{t('guidance.current')}: <strong className="text-text">{value}</strong></p>
          {reason && <p className="mb-0 mt-1 text-sm text-mute">{t('guidance.reason')}: <span className="text-text">{reason}</span></p>}

          <p className="mb-0 mt-3 text-mute"><strong className="text-text">{t('guidance.meaning')}. </strong>{entry?.meaning[lang] ?? t('guidance.generic.meaning')}</p>

          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
            <ActionList title={t('guidance.doNow')} items={entry?.doNow[lang] ?? [t('guidance.generic.doNow')]} icon={<CheckCircle2 className="h-4 w-4 text-watch" aria-hidden="true" />} />
            <ActionList title={t('guidance.ifWorse')} items={entry?.ifWorse[lang] ?? [t('guidance.generic.ifWorse')]} icon={<ShieldAlert className="h-4 w-4 text-act" aria-hidden="true" />} />
          </div>

          {entry && <ActionList title={t('guidance.prevent')} items={entry.prevent[lang]} icon={<ShieldCheck className="h-4 w-4 text-ok" aria-hidden="true" />} className="mt-4" />}

          <div className="mt-4 flex items-center gap-2 rounded-lg border border-edge bg-rail p-3 text-sm text-text">
            <Phone className="h-4 w-4 shrink-0 text-ok" aria-hidden="true" />
            <span>{t('guidance.notify')}: <strong>{entry?.notify[lang] ?? t('guidance.generic.notify')}</strong></span>
          </div>

          {entry && (
            <p className="mb-0 mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-mute">
              <span className="rounded border border-edge px-2 py-0.5">{t('guidance.draft')}</span>
              <span>{t(entry.basis === 'nasa' ? 'guidance.basis.nasa' : 'guidance.basis.team')}</span>
              <a href={entry.source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-ok underline">
                {t('guidance.source')}: {entry.source.label} <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            </p>
          )}
        </div>
      </div>
    </article>
  )
}

/** Sin ningún chequeo: no hay alertas ni «todo en orden» (no se sabe aún), solo se invita a medir. */
function NoChecks() {
  const { t } = useI18n()
  return (
    <section className="rounded-2xl border border-edge bg-panel p-5 sm:p-6">
      <h2 className="m-0 font-display text-2xl font-semibold text-text">{t('guidance.noChecks.title')}</h2>
      <p className="mb-0 mt-1 text-mute">{t('guidance.noChecks.body')}</p>
    </section>
  )
}

/** Sin alertas: confirma que todo está bien y deja a mano cómo mantenerlo. */
function AllClear() {
  const { lang, t } = useI18n()
  return (
    <section className="rounded-2xl border border-ok bg-panel p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-ok" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 className="m-0 font-display text-2xl font-semibold text-text">{t('guidance.empty.title')}</h2>
          <p className="mt-1 text-mute">{t('guidance.empty.body')}</p>
          <ul className="m-0 mt-4 grid list-none gap-3 p-0 md:grid-cols-2">
            {guidanceEntries.map((entry) => (
              <li key={entry.indicatorId} className="rounded-xl border border-edge bg-panel/60 p-4">
                <h3 className="m-0 text-sm font-semibold text-text">{entry.name[lang]}</h3>
                <p className="m-0 mt-1 text-sm text-mute">{entry.prevent[lang][0]}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

function ActionList({ title, items, icon, className = '' }: { title: string; items: string[]; icon: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-edge bg-panel/60 p-4 ${className}`}>
      <h3 className="m-0 flex items-center gap-2 text-sm font-semibold text-text">{icon}{title}</h3>
      <ol className="mb-0 mt-2 list-decimal space-y-1 pl-5 text-sm text-mute">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ol>
    </div>
  )
}
