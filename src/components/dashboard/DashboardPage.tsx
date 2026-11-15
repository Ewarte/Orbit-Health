import { useState } from 'react'
import { NoticeCard } from '../../features/guidance/NoticeCard'
import { worstStatus } from '../../lib/status'
import type { Indicator, Mission, Notice, Status, Zone, ZoneId } from '../../types'
import { IndicatorTile } from './IndicatorTile'
import { Holograma3D } from '../health/Holograma3D'

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

  const [viewMode, setViewMode] = useState<'dynamic' | 'grid'>('dynamic')

  const figureZones = Object.fromEntries(
    zones.map((z) => [z.id, zoneStatus(z.id)]),
  ) as Record<ZoneId, Status | undefined>

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 space-y-5">
      {/* Cabecera de la Misión y Selector de Telemetría */}
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div>
          <h1 className="m-0 font-display text-2xl sm:text-3xl font-semibold">Mission day {mission.day}</h1>
          <p className="m-0 text-sm text-mute">
            {mission.place}, last check {mission.lastCheck}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Conmutador de vista de telemetría */}
          <div className="flex items-center rounded-xl border border-edge/60 bg-panel/50 p-1 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('dynamic')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1 font-medium transition-all ${
                viewMode === 'dynamic'
                  ? 'border border-cyan-400/50 bg-cyan-950/80 text-cyan-200 shadow-sm'
                  : 'text-mute hover:text-text'
              }`}
            >
              <span>🎯</span>
              <span>Telemetría Focalizada 3D</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1 font-medium transition-all ${
                viewMode === 'grid'
                  ? 'border border-cyan-400/50 bg-cyan-950/80 text-cyan-200 shadow-sm'
                  : 'text-mute hover:text-text'
              }`}
            >
              <span>📊</span>
              <span>Ver Todas ({indicators.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-edge/60 bg-panel/40 px-3.5 py-1.5 text-xs backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-ok animate-pulse" />
            <span className="font-mono uppercase tracking-wider text-ok">Live Telemetry</span>
          </div>
        </div>
      </header>

      {/* Escenario Central: Holograma 3D con Nubes Dinámicas alrededor del Cuerpo (Contenedor calibrado y elegante) */}
      <section aria-label="Holograma 3D Interactivo" className="mx-auto w-full max-w-3xl lg:max-w-4xl">
        <Holograma3D
          selectedZone={selected}
          onSelectZone={setSelected}
          zonesStatus={figureZones}
          indicators={indicators}
        />
      </section>

      {/* Modo Cuadrícula de Métricas Completa (Opcional bajo demanda) */}
      {viewMode === 'grid' && (
        <section aria-label="Todas las Métricas" className="space-y-3">
          <div className="flex items-center justify-between border-b border-edge/40 pb-2">
            <h2 className="m-0 font-display text-base font-semibold text-text">Todas las Métricas del Traje</h2>
            <span className="font-mono text-xs text-mute">{indicators.length} telemetrías registradas</span>
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

      {/* Notificaciones y avisos de guía médica */}
      {notices.length > 0 && (
        <section aria-label="Avisos Médicos" className="space-y-3">
          {notices.map((notice) => (
            <NoticeCard key={notice.indicatorId} notice={notice} onGuidance={onGuidance} />
          ))}
        </section>
      )}
    </div>
  )
}

function rank(status: Status | undefined) {
  return status === 'act' ? 3 : status === 'watch' ? 2 : status === 'ok' ? 1 : 0
}
