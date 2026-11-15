import { useState } from 'react'
import { NoticeCard } from '../../features/guidance/NoticeCard'
import { statusUi, worstStatus } from '../../lib/status'
import type { Indicator, Mission, Notice, Status, Zone, ZoneId } from '../../types'
import { IndicatorTile } from './IndicatorTile'
import { HologramaUnificado } from '../health/HologramaUnificado'
import { useI18n } from '../../lib/useI18n'
import { indicatorName, indicatorValue, statusLabel, unitLabel } from '../../lib/domainText'

interface Props {
  mission: Mission
  zones: Zone[]
  indicators: Indicator[]
  notices: Notice[]
  onGuidance?: () => void
}

export function DashboardPage({ mission, zones, indicators, notices, onGuidance }: Props) {
  const zoneStatus = (id: ZoneId): Status | undefined =>
    worstStatus(indicators.filter((i) => i.zone === id).map((i) => i.status))

  const [selected, setSelected] = useState<ZoneId>(() => {
    const ranked = [...zones].sort((a, b) => rank(zoneStatus(b.id)) - rank(zoneStatus(a.id)))
    return ranked[0]?.id ?? 'head'
  })

  const { t } = useI18n()

  const [viewMode, setViewMode] = useState<'dynamic' | 'grid'>('dynamic')

  const attention = indicators.filter((i) => i.status !== 'ok')

  const figureZones = Object.fromEntries(
    zones.map((z) => [z.id, zoneStatus(z.id)]),
  ) as Record<ZoneId, Status | undefined>

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-3 px-4 py-4 sm:px-6 lg:px-5 lg:py-3">
      {/* Cabecera de la Misión y Selector de Telemetría */}
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div>
          <h1 className="m-0 font-display text-2xl sm:text-3xl font-semibold">{t('dash.missionDay', { day: mission.day })}</h1>
          <p className="m-0 text-sm text-mute">
            {t('dash.lastCheck', { place: mission.place, time: mission.lastCheck })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Conmutador de vista de telemetría */}
          <div role="group" aria-label={t('dash.viewMode')} className="flex items-center rounded-xl border border-edge/60 bg-panel/50 p-1 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('dynamic')}
              className={`flex min-h-11 items-center gap-1.5 rounded-lg px-3 py-1 font-medium transition-all ${
                viewMode === 'dynamic'
                  ? 'border border-cyan-400/50 bg-cyan-950/80 text-cyan-200 shadow-sm'
                  : 'text-mute hover:text-text'
              }`}
            >
              <span aria-hidden="true">🎯</span>
              <span>{t('dash.focused')}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex min-h-11 items-center gap-1.5 rounded-lg px-3 py-1 font-medium transition-all ${
                viewMode === 'grid'
                  ? 'border border-cyan-400/50 bg-cyan-950/80 text-cyan-200 shadow-sm'
                  : 'text-mute hover:text-text'
              }`}
            >
              <span aria-hidden="true">📊</span>
              <span>{t('dash.viewAll', { n: indicators.length })}</span>
            </button>
          </div>

          <div className="flex lg:max-xl:hidden items-center gap-2 rounded-full border border-edge/60 bg-panel/40 px-3.5 py-1.5 text-xs backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-ok animate-pulse" />
            <span className="font-mono uppercase tracking-wider text-ok">{t('dash.live')}</span>
          </div>
        </div>
      </header>

      {/* En horizontal: holograma en la columna principal y resumen al lado. En vertical y móvil: apilado. */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start xl:grid-cols-[minmax(0,1fr)_380px]">
        <section aria-label={t('holo.sectionLabel')} className="mx-auto w-full min-w-0 max-w-3xl lg:max-w-none">
          {/* Un solo holograma: vista general de alambre y, al elegir una zona, zoom a sus órganos. */}
          <HologramaUnificado selectedZone={selected} onSelectZone={setSelected} zonesStatus={figureZones} indicators={indicators} />
        </section>

        <aside aria-label={t('nav.today')} className="min-w-0 space-y-3 [&_section]:mt-0">
          {attention.length > 0 && (
            <section aria-label={t('dash.attention')} className="rounded-xl border border-edge bg-panel p-3">
              <ul className="m-0 grid list-none gap-2 p-0">
                {attention.map((indicator) => {
                  const ui = statusUi[indicator.status]
                  return (
                    <li key={indicator.id}>
                      <button
                        type="button"
                        onClick={() => setSelected(indicator.zone)}
                        aria-pressed={indicator.zone === selected}
                        className={`flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-l-4 border-edge bg-bg px-3 py-2 text-left ${ui.border.replace('border-t-', 'border-l-')}`}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-mute">{indicatorName(t, indicator)}</span>
                          <span className={`block text-sm font-semibold ${ui.text}`}>{statusLabel(t, indicator.status)}</span>
                        </span>
                        <span className="shrink-0 font-display text-xl font-semibold tabular-nums">
                          {indicatorValue(t, indicator)} <span className="font-sans text-xs font-normal text-mute">{unitLabel(t, indicator.unit)}</span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {/* Notificaciones y avisos de guía médica */}
          {notices.length > 0 && (
            <section aria-label={t('dash.notices')} className="space-y-3">
              {notices.map((notice) => (
                <NoticeCard key={notice.indicatorId} notice={notice} onGuidance={onGuidance} />
              ))}
            </section>
          )}
        </aside>
      </div>

      {/* Modo Cuadrícula de Métricas Completa (Opcional bajo demanda) */}
      {viewMode === 'grid' && (
        <section aria-label={t('dash.allMetrics')} className="space-y-3">
          <div className="flex items-center justify-between border-b border-edge/40 pb-2">
            <h2 className="m-0 font-display text-base font-semibold text-text">{t('dash.allMetricsTitle')}</h2>
            <span className="font-mono text-xs text-mute">{t('dash.telemetryCount', { n: indicators.length })}</span>
          </div>
          <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 lg:grid-cols-4">
            {indicators.map((indicator) => (
              <li key={indicator.id}>
                <IndicatorTile
                  indicator={indicator}
                  selected={indicator.zone === selected}
                  onSelect={() => setSelected(indicator.zone)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function rank(status: Status | undefined) {
  return status === 'act' ? 3 : status === 'watch' ? 2 : status === 'ok' ? 1 : 0
}
