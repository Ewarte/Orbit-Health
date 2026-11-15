import { Clock, Database, Save, Satellite, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { MessageKey } from '../../lib/i18n'
import {
  DEFAULT_MARS_LONGITUDE,
  ENVIRONMENTS,
  flightDay,
  formatMarsHours,
  formatMet,
  formatUtc,
  marsCoordinatedTime,
  marsLocalMeanSolarTime,
  marsSolDate,
  metParts,
  parseUtc,
  solNumber,
  type MissionEnvironment,
} from '../../lib/missionTime'
import { useI18n } from '../../lib/useI18n'
import type { Mission } from '../../types'

interface Props {
  mission: Mission
  onSave: (mission: Mission) => void
}

const inputClass = 'mt-2 min-h-11 w-full rounded-lg border border-edge bg-rail px-3 text-text'
const DAY_MS = 86_400_000

/** ISO -> 'AAAA-MM-DDTHH:mm' en UTC, para el campo datetime-local (se interpreta como UTC). */
function toInput(iso: string | undefined): string {
  const ms = parseUtc(iso)
  return ms === null ? '' : new Date(ms).toISOString().slice(0, 16)
}

/** 'AAAA-MM-DDTHH:mm' (UTC) -> ISO, o undefined si está vacío o no es válido. */
function fromInput(value: string): string | undefined {
  if (!value) return undefined
  const ms = Date.parse(`${value}:00Z`)
  return Number.isNaN(ms) ? undefined : new Date(ms).toISOString()
}

function parseLongitude(value: string): number {
  const number = Number(value.replace(',', '.'))
  return value.trim() !== '' && Number.isFinite(number) ? number : DEFAULT_MARS_LONGITUDE
}

interface Draft {
  environment: MissionEnvironment
  launch: string
  arrival: string
  longitude: string
  place: string
}

function draftFrom(mission: Mission): Draft {
  return {
    environment: mission.environment,
    launch: toInput(mission.launchUtc),
    arrival: toInput(mission.arrivalUtc),
    longitude: String(mission.marsLongitudeEast ?? DEFAULT_MARS_LONGITUDE),
    place: mission.place,
  }
}

function ClockRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-edge bg-rail p-3">
      <dt className="text-xs text-mute">{label}</dt>
      <dd className="m-0 mt-1 font-mono text-lg font-semibold text-text">{value}</dd>
    </div>
  )
}

/** Panel que se actualiza cada segundo con el reloj del dispositivo, siempre leído en UTC. */
function MissionClock({ draft }: { draft: Draft }) {
  const { t } = useI18n()
  const [nowMs, setNowMs] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1_000)
    return () => window.clearInterval(timer)
  }, [])

  const utc = formatUtc(nowMs)
  const launchMs = parseUtc(fromInput(draft.launch))
  const arrivalMs = parseUtc(fromInput(draft.arrival))
  const { environment } = draft
  const minutes = Number(utc.time.slice(0, 2)) * 60 + Number(utc.time.slice(3, 5))
  const sleeping = minutes >= 21 * 60 + 30 || minutes < 6 * 60

  const msd = marsSolDate(nowMs)
  const longitude = parseLongitude(draft.longitude)

  return (
    <section aria-labelledby="mission-clock-title" className="mt-4 rounded-2xl border border-edge bg-panel p-5 sm:p-6">
      <h2 id="mission-clock-title" className="m-0 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-ok">
        <Clock className="h-4 w-4" /> {t('mission.clock.title')}
      </h2>
      <dl className="m-0 mt-4 grid gap-3 sm:grid-cols-2">
        <ClockRow label={t(environment === 'station' ? 'mission.clock.utcStation' : 'mission.clock.utc')} value={`${utc.time} UTC`} />
        <ClockRow label={t('mission.clock.date')} value={utc.date} />
        {launchMs !== null && (
          <>
            <ClockRow label={t('mission.clock.met')} value={formatMet(metParts(nowMs, launchMs))} />
            <ClockRow label={t('mission.clock.flightDay')} value={String(flightDay(nowMs, launchMs))} />
          </>
        )}
        {environment === 'mars' && (
          <>
            <ClockRow
              label={t('mission.clock.sol')}
              value={arrivalMs !== null ? String(solNumber(nowMs, arrivalMs)) : t('mission.clock.solNone')}
            />
            <ClockRow label={t('mission.clock.mtc')} value={`${formatMarsHours(marsCoordinatedTime(msd))} (${t('mission.clock.marsHours')})`} />
            <ClockRow
              label={`${t('mission.clock.lmst')} · ${longitude}° E`}
              value={`${formatMarsHours(marsLocalMeanSolarTime(msd, longitude))} (${t('mission.clock.marsHours')})`}
            />
          </>
        )}
      </dl>

      {environment === 'station' && (
        <p className="mb-0 mt-4 text-sm text-mute">
          {t('mission.clock.sleep')}.{' '}
          <strong className={sleeping ? 'text-watch' : 'text-ok'}>{t(sleeping ? 'mission.clock.sleepIn' : 'mission.clock.sleepOut')}</strong>{' '}
          {t('mission.clock.sleepSource')}
        </p>
      )}
      {environment === 'moon' && <p className="mb-0 mt-4 text-sm text-watch">{t('mission.clock.moonNotice')}</p>}
      <p className="mb-0 mt-4 text-xs text-mute">{t('mission.clock.note')}</p>
    </section>
  )
}

export function MissionPage({ mission, onSave }: Props) {
  const { t } = useI18n()
  const [draft, setDraft] = useState<Draft>(() => draftFrom(mission))
  const [saved, setSaved] = useState(false)

  const surface = draft.environment === 'moon' || draft.environment === 'mars'

  function build(): Mission {
    const now = Date.now()
    const launchUtc = fromInput(draft.launch) ?? mission.launchUtc
    const next: Mission = {
      environment: draft.environment,
      launchUtc,
      place: draft.place,
      lastCheck: mission.lastCheck,
      day: flightDay(now, parseUtc(launchUtc) ?? now),
    }
    const arrival = surface ? fromInput(draft.arrival) : undefined
    if (arrival) next.arrivalUtc = arrival
    if (draft.environment === 'mars') next.marsLongitudeEast = parseLongitude(draft.longitude)
    return next
  }

  function saveMission() {
    onSave(build())
    setSaved(true)
  }

  function loadSimulation() {
    const now = Date.now()
    const simulated: Mission = {
      environment: 'station',
      launchUtc: new Date(now - 46 * DAY_MS).toISOString(),
      place: t('mission.stationPlace'),
      lastCheck: '07:10',
      day: 47,
    }
    setDraft(draftFrom(simulated))
    onSave(simulated)
    setSaved(true)
  }

  return (
    <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-6 lg:py-5">
      <div className="mx-auto max-w-[1400px]">
        <header className="mb-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ok">
            <Satellite className="h-4 w-4" /> {t('mission.eyebrow')}
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-text sm:text-4xl">{t('mission.title')}</h1>
          <p className="mt-2 text-mute">{t('mission.intro')}</p>
        </header>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-start">
        <section className="rounded-2xl border border-edge bg-panel p-5 sm:p-6">
          <fieldset className="m-0 border-0 p-0">
            <legend className="text-sm font-semibold text-text">{t('mission.environment')}</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {ENVIRONMENTS.map((env) => {
                const active = draft.environment === env
                return (
                  <label
                    key={env}
                    className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border p-3 ${
                      active ? 'border-ok bg-notice' : 'border-edge bg-rail hover:border-ok'
                    }`}
                  >
                    <input
                      type="radio"
                      name="mission-environment"
                      value={env}
                      checked={active}
                      onChange={() => setDraft({ ...draft, environment: env })}
                      className="mt-1 h-4 w-4 accent-ok"
                    />
                    <span>
                      <strong className="block text-text">{t(`mission.env.${env}` as MessageKey)}</strong>
                      <span className="text-sm text-mute">{t(`mission.env.${env}.about` as MessageKey)}</span>
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold text-text">
              {t('mission.launch')}
              <input
                type="datetime-local"
                value={draft.launch}
                onChange={(event) => setDraft({ ...draft, launch: event.target.value })}
                className={inputClass}
              />
            </label>
            <label className="text-sm font-semibold text-text">
              {t('mission.place')}
              <input
                value={draft.place}
                onChange={(event) => setDraft({ ...draft, place: event.target.value })}
                className={inputClass}
              />
            </label>
            {surface && (
              <label className="text-sm font-semibold text-text">
                {t('mission.arrival')}
                <input
                  type="datetime-local"
                  value={draft.arrival}
                  onChange={(event) => setDraft({ ...draft, arrival: event.target.value })}
                  className={inputClass}
                />
              </label>
            )}
            {draft.environment === 'mars' && (
              <label className="text-sm font-semibold text-text">
                {t('mission.marsLongitude')}
                <input
                  type="number"
                  step="any"
                  value={draft.longitude}
                  onChange={(event) => setDraft({ ...draft, longitude: event.target.value })}
                  className={inputClass}
                />
                <span className="mt-1 block text-xs font-normal text-mute">{t('mission.marsLongitudeHelp')}</span>
              </label>
            )}
          </div>
          <p className="mb-0 mt-3 text-xs text-mute">{t('mission.launchHelp')}</p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={saveMission}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ok px-4 py-2 font-semibold text-rail hover:brightness-110"
            >
              <Save className="h-4 w-4" /> {t('mission.save')}
            </button>
            <button
              type="button"
              onClick={loadSimulation}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-ok px-4 py-2 font-semibold text-ok hover:bg-notice"
            >
              <Database className="h-4 w-4" /> {t('mission.loadSimulation')}
            </button>
          </div>

          {saved && (
            <p role="status" className="mt-4 text-sm text-ok">
              {t('mission.saved')}
            </p>
          )}
        </section>

        <div className="space-y-4 [&>section]:mt-0">
        <MissionClock draft={draft} />

        <div className="flex items-start gap-3 rounded-xl border border-edge bg-rail p-4 text-sm text-mute">
          <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-watch" />
          <p className="m-0">{t('mission.offline')}</p>
        </div>
        </div>
        </div>
      </div>
    </main>
  )
}
