import { ClipboardCheck, PanelRightClose, PanelRightOpen } from 'lucide-react'
import { useState } from 'react'
import { NoticeCard } from '../../features/guidance/NoticeCard'
import { activeAlerts } from '../../features/guidance/guidanceLogic'
import { formatUtcHHMM } from '../../features/measurements/dailyCheckData'
import { statusUi, worstStatus } from '../../lib/status'
import type { Indicator, Mission, Status, Zone, ZoneId } from '../../types'
import { HologramaUnificado } from '../health/HologramaUnificado'
import { useI18n } from '../../lib/useI18n'
import { indicatorName, indicatorValue, statusLabel, unitLabel } from '../../lib/domainText'

const PANEL_STORAGE_KEY = 'orbit_health_today_panel'

function readPanelOpen(): boolean {
  try {
    return localStorage.getItem(PANEL_STORAGE_KEY) !== 'closed'
  } catch {
    return true
  }
}

interface Props {
  mission: Mission
  zones: Zone[]
  /** Indicadores evaluados del último chequeo real; vacío si el usuario aún no ha hecho ninguno. */
  indicators: Indicator[]
  /** Fecha ISO del último chequeo real, o null si no hay. */
  lastCheckAt?: string | null
  onGuidance?: () => void
  /** Abre el asistente del primer chequeo (botón del estado vacío). */
  onStartCheck?: () => void
}

export function DashboardPage({ mission, zones, indicators, lastCheckAt = null, onGuidance, onStartCheck }: Props) {
  const zoneStatus = (id: ZoneId): Status | undefined =>
    worstStatus(indicators.filter((i) => i.zone === id).map((i) => i.status))

  const [selected, setSelected] = useState<ZoneId>(() => {
    const ranked = [...zones].sort((a, b) => rank(zoneStatus(b.id)) - rank(zoneStatus(a.id)))
    return ranked[0]?.id ?? 'head'
  })

  const { t } = useI18n()

  // Panel lateral plegable: al ocultarlo, el holograma ocupa todo el ancho. Se recuerda en el dispositivo.
  const [panelOpen, setPanelOpen] = useState(readPanelOpen)
  function togglePanel() {
    const next = !panelOpen
    setPanelOpen(next)
    try {
      localStorage.setItem(PANEL_STORAGE_KEY, next ? 'open' : 'closed')
    } catch {
      // Sin almacenamiento: la elección vale mientras la app esté abierta.
    }
  }

  const attention = indicators.filter((i) => i.status !== 'ok')
  // El aviso grande sale de las alertas en vivo: la más grave primero; sin alertas, no hay aviso.
  const topAlert = activeAlerts(indicators)[0]
  const empty = indicators.length === 0
  const lastCheckHHMM = formatUtcHHMM(lastCheckAt)

  const figureZones = Object.fromEntries(
    zones.map((z) => [z.id, zoneStatus(z.id)]),
  ) as Record<ZoneId, Status | undefined>

  const PanelIcon = panelOpen ? PanelRightClose : PanelRightOpen

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-3 px-4 py-4 sm:px-6 lg:px-5 lg:py-3">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div>
          <h1 className="m-0 font-display text-2xl sm:text-3xl font-semibold">{t('dash.missionDay', { day: mission.day })}</h1>
          <p className="m-0 text-sm text-mute">
            {lastCheckHHMM
              ? t('dash.lastCheck', { place: mission.place, time: `${lastCheckHHMM} UTC` })
              : t('dash.noCheckYet', { place: mission.place })}
          </p>
        </div>

        {/* Solo en tablet horizontal y escritorio, donde el panel va al costado. */}
        <button
          type="button"
          onClick={togglePanel}
          aria-expanded={panelOpen}
          aria-controls="today-panel"
          className="hidden min-h-11 items-center gap-2 rounded-xl border border-edge bg-panel px-4 text-sm font-medium text-mute hover:text-text lg:inline-flex"
        >
          <PanelIcon className="h-4 w-4" aria-hidden="true" />
          {t(panelOpen ? 'dash.panelHide' : 'dash.panelShow')}
          {!panelOpen && attention.length > 0 && (
            <span className="rounded-full bg-watch px-2 text-xs font-semibold text-on-watch">{attention.length}</span>
          )}
        </button>
      </header>

      {/* En horizontal: holograma en la columna principal y resumen al lado (plegable). En vertical y móvil: apilado. */}
      <div
        className={`grid gap-4 lg:items-start ${
          panelOpen ? 'lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]' : 'lg:grid-cols-1'
        }`}
      >
        <section aria-label={t('holo.sectionLabel')} className="mx-auto w-full min-w-0 max-w-3xl lg:max-w-none">
          <HologramaUnificado selectedZone={selected} onSelectZone={setSelected} zonesStatus={figureZones} indicators={indicators} />
        </section>

        <aside
          id="today-panel"
          aria-label={t('nav.today')}
          className={`min-w-0 space-y-3 [&_section]:mt-0 ${panelOpen ? '' : 'lg:hidden'}`}
        >
          {empty && (
            <section aria-label={t('dash.empty.title')} className="rounded-xl border border-edge bg-panel p-4">
              <h2 className="m-0 font-display text-lg font-semibold text-text">{t('dash.empty.title')}</h2>
              <p className="mb-0 mt-1 text-sm text-mute">{t('dash.empty.body')}</p>
              {onStartCheck && (
                <button
                  type="button"
                  onClick={onStartCheck}
                  className="mt-3 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border-2 border-ok bg-notice px-4 py-2 font-semibold text-ok hover:brightness-110"
                >
                  <ClipboardCheck className="h-4 w-4" aria-hidden="true" /> {t('dash.empty.cta')}
                </button>
              )}
            </section>
          )}

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

          {topAlert && (
            <section aria-label={t('dash.notices')} className="space-y-3">
              <NoticeCard key={topAlert.indicator.id} alert={topAlert} onGuidance={onGuidance} />
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}

function rank(status: Status | undefined) {
  return status === 'act' ? 3 : status === 'watch' ? 2 : status === 'ok' ? 1 : 0
}
