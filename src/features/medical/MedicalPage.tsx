import { AlertTriangle, CheckCircle2, ClipboardCheck, Download, Eye, FileJson, Stethoscope, type LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { statusLabel, unitLabel } from '../../lib/domainText'
import { formatMet, metParts, parseUtc } from '../../lib/missionTime'
import { useI18n } from '../../lib/useI18n'
import type { I18n } from '../../lib/useI18n'
import type { Mission, Status } from '../../types'
import { sourceOf } from '../measurements/dailyCheckData'
import type { SavedRecord } from '../measurements/dailyCheckTypes'
import { downloadTextFile } from './download'
import { buildCsv, buildJson, exportFileName, formatMetricValue, isoUtc, recordFlightDay } from './exportData'
import { VALUE_COLUMNS, cellStatus, filterRecords, summarizeIndicators, type IndicatorSummary, type RangeFilter, type SummaryDef } from './medicalData'

interface Props {
  mission: Mission
  /** Todos los chequeos guardados, del más reciente al más antiguo. */
  records: SavedRecord[]
  onNavigate: (screen: string) => void
}

type T = I18n['t']

const filters: RangeFilter[] = ['7d', '30d', 'all']

/** Ícono de cada estado: el estado siempre va con ícono y texto, nunca solo con color. */
const statusIcon: Record<Status, LucideIcon> = { ok: CheckCircle2, watch: Eye, act: AlertTriangle }
const statusText: Record<Status, string> = { ok: 'text-ok-soft', watch: 'text-watch', act: 'text-act' }

function StatusLabel({ status }: { status: Status }) {
  const { t } = useI18n()
  const Icon = statusIcon[status]
  return <span className={`inline-flex items-center gap-1 font-semibold ${statusText[status]}`}><Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{statusLabel(t, status)}</span>
}

function unitOf(unit: SummaryDef['unit'], t: T): string {
  return unit === '' ? '' : unitLabel(t, unit === 'breathsMin' ? 'breaths/min' : unit)
}

function fmt(value: number | null, decimals: number): string {
  return value === null ? '—' : value.toFixed(decimals)
}

export function MedicalPage({ mission, records, onNavigate }: Props) {
  const { t, lang } = useI18n()
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [filter, setFilter] = useState<RangeFilter>('30d')
  const [exported, setExported] = useState<string | null>(null)
  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const launchMs = parseUtc(mission.launchUtc)
  const shown = useMemo(() => filterRecords(records, filter, nowMs), [records, filter, nowMs])
  const summary = useMemo(() => summarizeIndicators(records, nowMs), [records, nowMs])

  function exportAs(kind: 'csv' | 'json') {
    const now = Date.now()
    const text = kind === 'csv' ? buildCsv(shown, mission, lang) : buildJson(shown, { mission, lang, nowMs: now })
    const name = exportFileName(mission.environment, now, kind)
    downloadTextFile(name, kind === 'csv' ? 'text/csv;charset=utf-8' : 'application/json;charset=utf-8', text)
    setExported(t('medical.export.done', { name, n: shown.length }))
  }

  return (
    <main className="min-w-0 px-4 py-5 sm:px-6 sm:py-8 lg:px-6 lg:py-5">
      <div className="mx-auto max-w-[1400px]">
        <header className="mb-4">
          <h1 className="flex items-center gap-3 font-display text-3xl font-semibold tracking-tight text-text sm:text-4xl"><Stethoscope className="h-8 w-8 text-ok" aria-hidden="true" />{t('medical.title')}</h1>
          <p className="mt-1 text-sm text-mute">{t('medical.subtitle')}</p>
        </header>

        <section aria-label={t('medical.header.label')} className="mb-4 grid grid-cols-2 gap-3 rounded-2xl border border-edge bg-panel p-4 sm:grid-cols-3 lg:grid-cols-5">
          <Fact label={t('medical.header.mission')} value={mission.place} />
          <Fact label={t('medical.header.environment')} value={t(`mission.env.${mission.environment}`)} />
          <Fact label={t('medical.header.flightDay')} value={String(mission.day)} />
          <Fact label={t('medical.header.met')} value={launchMs === null ? '—' : formatMet(metParts(nowMs, launchMs))} mono />
          <Fact label={t('medical.header.records')} value={String(records.length)} />
        </section>

        {records.length === 0 ? (
          <section className="rounded-2xl border border-edge bg-panel p-6 text-center">
            <h2 className="font-display text-xl font-semibold text-text">{t('medical.empty.title')}</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-mute">{t('medical.empty.body')}</p>
            <button type="button" onClick={() => onNavigate('check')} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-ok px-5 py-2 text-sm font-bold text-rail">
              <ClipboardCheck className="h-4 w-4" aria-hidden="true" /> {t('medical.empty.cta')}
            </button>
          </section>
        ) : (
          <>
            <SummaryTable summary={summary} />

            <section aria-labelledby="medical-records-title" className="mt-4 rounded-2xl border border-edge bg-panel p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 id="medical-records-title" className="font-display text-xl font-semibold text-text">{t('medical.table.title')}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <div role="group" aria-label={t('medical.filter.label')} className="flex gap-1">
                    {filters.map((id) => (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={filter === id}
                        onClick={() => { setFilter(id); setExported(null) }}
                        className={`min-h-11 rounded-lg border px-3 py-2 text-sm font-semibold ${filter === id ? 'border-ok bg-notice text-ok' : 'border-edge text-mute hover:text-text'}`}
                      >
                        {t(`medical.filter.${id}`)}
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={() => exportAs('csv')} disabled={shown.length === 0} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-edge bg-rail px-4 py-2 text-sm font-semibold text-text enabled:hover:border-ok disabled:opacity-50">
                    <Download className="h-4 w-4 text-ok" aria-hidden="true" /> {t('medical.export.csv')}
                  </button>
                  <button type="button" onClick={() => exportAs('json')} disabled={shown.length === 0} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-edge bg-rail px-4 py-2 text-sm font-semibold text-text enabled:hover:border-ok disabled:opacity-50">
                    <FileJson className="h-4 w-4 text-ok" aria-hidden="true" /> {t('medical.export.json')}
                  </button>
                </div>
              </div>
              <p className="m-0 mb-2 text-xs text-mute">{t('medical.filter.count', { n: shown.length, total: records.length })} {t('medical.export.note')}</p>
              <div role="status" className="min-h-5 text-sm text-ok-soft">{exported}</div>

              {shown.length === 0 ? (
                <p className="m-0 py-4 text-sm text-mute">{t('medical.noneInRange')}</p>
              ) : (
                <RecordsTable records={shown} mission={mission} />
              )}
            </section>
          </>
        )}
      </div>
    </main>
  )
}

function Fact({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="m-0 text-xs font-semibold uppercase text-mute">{label}</p>
      <p className={`m-0 mt-0.5 truncate text-base font-bold text-text ${mono ? 'font-mono tabular-nums' : ''}`} title={value}>{value}</p>
    </div>
  )
}

function SummaryTable({ summary }: { summary: IndicatorSummary[] }) {
  const { t } = useI18n()
  const head = 'px-2 py-1.5 text-left text-xs font-semibold uppercase text-mute'
  return (
    <section aria-labelledby="medical-summary-title" className="rounded-2xl border border-edge bg-panel p-4">
      <h2 id="medical-summary-title" className="font-display text-xl font-semibold text-text">{t('medical.summary.title')}</h2>
      <p className="m-0 mb-2 text-xs text-mute">{t('medical.summary.note')}</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-edge">
              <th scope="col" className={head}>{t('medical.summary.indicator')}</th>
              <th scope="col" className={head}>{t('medical.summary.latest')}</th>
              <th scope="col" className={head}>{t('medical.summary.status')}</th>
              <th scope="col" className={head}>{t('medical.summary.avg7')}</th>
              <th scope="col" className={head}>{t('medical.summary.minmax7')}</th>
              <th scope="col" className={head}>{t('medical.summary.consecutive')}</th>
              <th scope="col" className={head}>{t('medical.summary.range')}</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((row) => <SummaryRow key={row.def.id} row={row} />)}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function SummaryRow({ row }: { row: IndicatorSummary }) {
  const { t } = useI18n()
  const { def } = row
  const unit = unitOf(def.unit, t)
  const withUnit = (text: string) => (unit && text !== '—' ? `${text} ${unit}` : text)
  const cell = 'px-2 py-1.5 align-middle'
  return (
    <tr className="border-b border-edge/60 last:border-0">
      <th scope="row" className={`${cell} text-left font-semibold text-text`}>{t(def.labelKey)}</th>
      <td className={`${cell} font-bold tabular-nums text-text`}>{withUnit(fmt(row.latest, def.decimals))}</td>
      <td className={cell}>{row.status ? <StatusLabel status={row.status} /> : <span className="text-mute">{row.latest === null ? '—' : t('medical.summary.calculated')}</span>}</td>
      <td className={`${cell} tabular-nums text-text`}>{withUnit(fmt(row.avg, def.decimals === 0 ? 1 : def.decimals))}</td>
      <td className={`${cell} tabular-nums text-text`}>{row.min === null ? '—' : `${fmt(row.min, def.decimals)} – ${fmt(row.max, def.decimals)}${unit ? ` ${unit}` : ''}`}</td>
      <td className={cell}>
        {row.trend === null ? <span className="text-mute">—</span> : row.trend.status === 'critical'
          ? <span className="inline-flex items-center gap-1 font-semibold text-act"><AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />{t('medical.summary.consecutiveAlert', { n: row.trend.consecutiveOutside })}</span>
          : <span className="tabular-nums text-text">{row.trend.consecutiveOutside}</span>}
      </td>
      <td className={`${cell} text-text`}>
        {def.range
          ? <>{rangeText(def.range.min, def.range.max, def.decimals)} {unit} <span className="ml-1 rounded border border-edge px-1.5 py-0.5 text-[11px] font-semibold text-mute">{t('medical.draft')}</span></>
          : <span className="text-mute">{t('medical.summary.noRange')}</span>}
      </td>
    </tr>
  )
}

/** Texto del rango; los topes enormes (ejercicio) se muestran como «≥ mínimo». */
function rangeText(min: number, max: number, decimals: number): string {
  return max >= 100000 ? `≥ ${min.toFixed(decimals)}` : `${min.toFixed(decimals)} – ${max.toFixed(decimals)}`
}

function RecordsTable({ records, mission }: { records: SavedRecord[]; mission: Mission }) {
  const { t } = useI18n()
  const head = 'sticky top-0 z-10 bg-panel px-2 py-2 text-left align-bottom text-xs font-semibold uppercase text-mute'
  return (
    <div tabIndex={0} role="region" aria-label={t('medical.table.label')} className="max-h-[340px] overflow-auto rounded-lg border border-edge">
      <table className="w-full min-w-[1100px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-edge">
            <th scope="col" className={`${head} left-0 z-20`}>{t('medical.table.date')}</th>
            <th scope="col" className={head}>{t('medical.table.day')}</th>
            {VALUE_COLUMNS.map((column) => {
              const unit = column.unit === '' ? '' : unitOf(column.unit, t)
              return <th key={column.field} scope="col" className={head}>{t(column.labelKey)}{unit ? <span className="block font-normal normal-case">{unit}</span> : null}</th>
            })}
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const ms = Date.parse(record.timestamp)
            return (
              <tr key={record.id} className="border-b border-edge/60 align-top">
                <th scope="row" className="sticky left-0 bg-panel px-2 py-2 text-left font-semibold tabular-nums text-text">
                  <time dateTime={isoUtc(ms)}>{isoUtc(ms).slice(0, 10)} {isoUtc(ms).slice(11, 19)}</time>
                </th>
                <td className="px-2 py-2 tabular-nums text-text">{recordFlightDay(record, mission) ?? '—'}</td>
                {VALUE_COLUMNS.map((column) => {
                  const status = cellStatus(record.metrics, column.field)
                  const text = formatMetricValue(record.metrics, column.field, t)
                  return (
                    <td key={column.field} className="px-2 py-2">
                      <span className="font-bold text-text">{text === '' ? '—' : text}</span>
                      <span className="block text-xs">{status ? <StatusLabel status={status} /> : <span className="text-mute">{t('medical.table.notMeasured')}</span>}</span>
                      <span className="block text-[11px] text-mute">{t(`sensor.origin.${sourceOf(record, column.field)}`)}</span>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
