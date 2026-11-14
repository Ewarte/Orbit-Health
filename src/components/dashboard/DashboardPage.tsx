import { useState } from 'react'
import { NoticeCard } from '../../features/guidance/NoticeCard'
import { statusUi, worstStatus } from '../../lib/status'
import type { Indicator, Mission, Notice, Status, Zone, ZoneId } from '../../types'
import { BodyFigure } from '../health/BodyFigure'
import { IndicatorTile } from './IndicatorTile'

interface Props {
  mission: Mission
  zones: Zone[]
  indicators: Indicator[]
  notices: Notice[]
}

export function DashboardPage({ mission, zones, indicators, notices }: Props) {
  const zoneStatus = (id: ZoneId): Status | undefined =>
    worstStatus(indicators.filter((i) => i.zone === id).map((i) => i.status))

  // Al abrir, se muestra la zona que más atención necesita.
  const [selected, setSelected] = useState<ZoneId>(() => {
    const ranked = [...zones].sort((a, b) => rank(zoneStatus(b.id)) - rank(zoneStatus(a.id)))
    return ranked[0]?.id ?? 'head'
  })

  const figureZones = Object.fromEntries(
    zones.map((z) => [z.id, { name: z.name, status: zoneStatus(z.id) }]),
  ) as Record<ZoneId, { name: string; status?: Status }>

  const zone = zones.find((z) => z.id === selected)
  const zoneIndicators = indicators.filter((i) => i.zone === selected)

  return (
    <div className="grid grid-cols-1 xl:min-h-screen xl:grid-cols-[1fr_320px]">
      <main className="min-w-0 px-4 py-5 sm:px-6 sm:py-6">
        <header className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h1 className="m-0 font-display text-3xl font-semibold">Mission day {mission.day}</h1>
          <p className="m-0 text-mute">
            {mission.place}, last check {mission.lastCheck}
          </p>
        </header>

        <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 2xl:grid-cols-4">
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

        {notices.map((notice) => (
          <NoticeCard key={notice.indicatorId} notice={notice} />
        ))}
      </main>

      <aside aria-label="Body map" className="bg-rail px-4 py-6 sm:px-6 xl:px-5">
        <BodyFigure zones={figureZones} selected={selected} onSelect={setSelected} className="mx-auto mb-4 block h-72 max-w-full sm:h-80 xl:h-96" />
        {zone && (
          <div aria-live="polite">
            <h2 className="m-0 font-display text-xl font-semibold">{zone.name}</h2>
            <p className="mt-1 mb-3 text-sm text-mute">{zone.about}</p>
            {zoneIndicators.length === 0 ? (
              <p className="m-0 text-sm text-mute">No readings yet for this area.</p>
            ) : (
              <ul className="m-0 list-none p-0">
                {zoneIndicators.map((i) => (
                  <li key={i.id} className="flex items-baseline justify-between gap-3 border-t border-edge py-2 text-sm">
                    <span>{i.name}</span>
                    <span className="tabular-nums text-mute">
                      {i.value} {i.unit}
                    </span>
                    <span className={`font-semibold ${statusUi[i.status].text}`}>{statusUi[i.status].label}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </aside>
    </div>
  )
}

function rank(status: Status | undefined) {
  return status === 'act' ? 3 : status === 'watch' ? 2 : status === 'ok' ? 1 : 0
}
