import { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  Activity,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Database,
  Droplets,
  Eye,
  Filter,
  Heart,
  Info,
  Maximize2,
  Moon,
  Radiation,
  Smile,
  Thermometer,
  TrendingDown,
  TrendingUp,
  Wind,
} from 'lucide-react'
import { parseRecords, STORAGE_KEY } from '../measurements/dailyCheckData'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatDate, moodLabel } from '../../lib/domainText'
import type { I18n } from '../../lib/useI18n'
import { useI18n } from '../../lib/useI18n'
import type { Mission } from '../../types'
import { healthRanges } from '../evaluation/healthEngine'
import { evaluateTrend } from '../evaluation/trendRule'
import {
  buildSimulatedTelemetry,
  isRealValue,
  overlayRecords,
  parseStoredTelemetry,
  type MetricId,
  type TelemetryPoint,
} from './trendsData'

export type TimeRange = '7d' | '14d' | '30d' | 'all'
export type { MetricId, TelemetryPoint }

const TELEMETRY_KEY = 'orbit_health_mission_telemetry'

type T = I18n['t']

/*
  Los textos de cada indicador (nombre, rango seguro, descripción, explicación médica y riesgo NASA)
  viven en las claves trends.m.<id>.* del archivo de idiomas; aquí solo van los datos y los colores.
*/
interface MetricDefinition {
  id: MetricId
  unit: string
  icon: typeof Heart
  color: string
  colorSecondary?: string
  nominalMin: number
  nominalMax: number
  formatValue: (val: number, t: T, item?: TelemetryPoint) => string
}

const METRICS_CATALOG: MetricDefinition[] = [
  {
    id: 'bp',
    unit: 'mmHg',
    icon: Heart,
    color: 'var(--color-serie-sys)',
    colorSecondary: 'var(--color-serie-dia)',
    nominalMin: healthRanges.bloodPressureSys.min,
    nominalMax: healthRanges.bloodPressureSys.max,
    formatValue: (val, _t, item) => item ? `${item.bpSys}/${item.bpDia}` : `${val}`,
  },
  {
    id: 'hr',
    unit: 'bpm',
    icon: Activity,
    color: 'var(--color-serie-hr)',
    nominalMin: healthRanges.heartRate.min,
    nominalMax: healthRanges.heartRate.max,
    formatValue: (val) => `${Math.round(val)} bpm`,
  },
  {
    id: 'sleep',
    unit: 'hrs',
    icon: Moon,
    color: 'var(--color-serie-sleep)',
    nominalMin: healthRanges.sleepHours.min,
    nominalMax: healthRanges.sleepHours.max,
    formatValue: (val) => `${val.toFixed(1)} h`,
  },
  {
    id: 'glucose',
    unit: 'mg/dL',
    icon: Droplets,
    color: 'var(--color-serie-glucose)',
    nominalMin: healthRanges.bloodSugar.min,
    nominalMax: healthRanges.bloodSugar.max,
    formatValue: (val) => `${Math.round(val)} mg/dL`,
  },
  {
    id: 'temp',
    unit: '°C',
    icon: Thermometer,
    color: 'var(--color-serie-temp)',
    nominalMin: healthRanges.bodyTemperature.min,
    nominalMax: healthRanges.bodyTemperature.max,
    formatValue: (val) => `${val.toFixed(1)} °C`,
  },
  {
    id: 'mood',
    unit: 'pts',
    icon: Smile,
    color: 'var(--color-serie-mood)',
    nominalMin: healthRanges.mood.min,
    nominalMax: healthRanges.mood.max,
    formatValue: (val, t) => {
      const labels = ['', 'Bad', 'Fair', 'Neutral', 'Good', 'Great']
      const rounded = Math.round(val)
      return `${labels[rounded] ? moodLabel(t, labels[rounded]) : val.toFixed(1)} (${val.toFixed(1)})`
    },
  },
  {
    id: 'spo2',
    unit: '%',
    icon: Wind,
    color: 'var(--color-serie-spo2)',
    nominalMin: healthRanges.spo2.min,
    nominalMax: healthRanges.spo2.max,
    formatValue: (val) => `${Math.round(val)}%`,
  },
  {
    id: 'radiation',
    unit: 'mSv',
    icon: Radiation,
    color: 'var(--color-serie-radiation)',
    // La radiación no se evalúa en el chequeo (no está en healthEngine): este rango es solo de la simulación.
    nominalMin: 0.1,
    nominalMax: 0.5,
    formatValue: (val) => `${val.toFixed(2)} mSv`,
  },
]

/** Fondo tenue de un color de serie (los colores son variables CSS, no admiten sufijo hexadecimal de transparencia). */
function tint(color: string, percent: number): string {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`
}

/** Unidad lista para mostrar: «hrs» y «pts» se traducen; el resto es internacional. */
function unitText(def: MetricDefinition, t: T): string {
  if (def.unit === 'hrs') return t('trends.unit.hrs')
  if (def.unit === 'pts') return t('trends.unit.pts')
  return def.unit
}

interface Props {
  mission?: Mission
  onNavigate?: (screen: string) => void
  /** Instante «de hoy» (UTC); por defecto, el reloj del dispositivo al abrir la pantalla. */
  nowMs?: number
}

function readStored(key: string): unknown {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

/** Punto del gráfico: relleno si el valor viene de un chequeo real, vacío si es simulado. */
function makeDot(color: string, metric: MetricId) {
  return function Dot(props: { cx?: number; cy?: number; payload?: TelemetryPoint }) {
    const { cx, cy, payload } = props
    if (cx === undefined || cy === undefined || !payload) return <g />
    const real = isRealValue(payload, metric)
    return <circle cx={cx} cy={cy} r={3.5} stroke={color} strokeWidth={2} fill={real ? color : 'var(--color-rail)'} data-real={real ? 'true' : 'false'} />
  }
}

const RANGES: TimeRange[] = ['7d', '14d', '30d', 'all']

const BASIC_METRICS: Record<MetricId, boolean> = {
  bp: true,
  hr: true,
  sleep: true,
  glucose: true,
  temp: true,
  mood: true,
  spo2: false,
  radiation: false,
}

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--color-tooltip)',
  borderColor: 'var(--color-edge)',
  borderRadius: '0.75rem',
  color: 'var(--color-text)',
  fontSize: '12px',
}

export function TrendsPage({ mission, onNavigate, nowMs: nowProp }: Props) {
  const { t, lang } = useI18n()
  const currentDay = mission?.day ?? 47
  const [nowMs] = useState(() => nowProp ?? Date.now())
  // Chequeos reales (todos); se leen al abrir la pantalla.
  const records = useMemo(() => parseRecords(readStored(STORAGE_KEY)), [])
  // Base simulada: la guardada con el botón (si es válida y de hoy) o una recién generada.
  const [storedBase, setStoredBase] = useState<TelemetryPoint[] | null>(() => {
    try {
      return parseStoredTelemetry(localStorage.getItem(TELEMETRY_KEY), currentDay, nowMs)
    } catch {
      return null
    }
  })
  const simulated = useMemo(() => storedBase ?? buildSimulatedTelemetry(currentDay, nowMs), [storedBase, currentDay, nowMs])
  // Los chequeos reales se superponen SIEMPRE a la simulación, así que un chequeo nuevo nunca queda congelado.
  const allTelemetry = useMemo(() => overlayRecords(simulated, records), [simulated, records])
  const missionLoaded = storedBase !== null

  function loadSimulatedMission() {
    const generated = buildSimulatedTelemetry(currentDay, nowMs)
    setStoredBase(generated)
    try {
      localStorage.setItem(TELEMETRY_KEY, JSON.stringify(generated))
    } catch {
      // La gráfica sigue disponible en memoria si el navegador bloquea el almacenamiento.
    }
  }

  const [timeRange, setTimeRange] = useState<TimeRange>('7d')
  const [selectedMetric, setSelectedMetric] = useState<MetricId | 'all'>('all')
  const [focusedMetricId, setFocusedMetricId] = useState<MetricId>('bp')
  const [visibleMetrics, setVisibleMetrics] = useState<Record<MetricId, boolean>>({ ...BASIC_METRICS })
  const [showFilterDrawer, setShowFilterDrawer] = useState(false)

  // Referencia y lógica de desplazamiento y arrastre táctil / mouse para el carrusel de métricas
  const carouselRef = useRef<HTMLDivElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)
  const drawerButtonRef = useRef<HTMLButtonElement>(null)
  const drawerId = useId()

  // El panel de indicadores se cierra con Escape (devolviendo el foco al botón) y al tocar fuera.
  useEffect(() => {
    if (!showFilterDrawer) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setShowFilterDrawer(false)
      drawerButtonRef.current?.focus()
    }
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node
      if (drawerRef.current?.contains(target) || drawerButtonRef.current?.contains(target)) return
      setShowFilterDrawer(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [showFilterDrawer])
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  const handleScroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 200
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return
    setIsDragging(true)
    setStartX(e.pageX - carouselRef.current.offsetLeft)
    setScrollLeft(carouselRef.current.scrollLeft)
  }

  const handleMouseLeaveOrUp = () => {
    setIsDragging(false)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !carouselRef.current) return
    e.preventDefault()
    const x = e.pageX - carouselRef.current.offsetLeft
    const walk = (x - startX) * 1.5
    carouselRef.current.scrollLeft = scrollLeft - walk
  }

  const filteredData = useMemo(() => {
    switch (timeRange) {
      case '7d':
        return allTelemetry.slice(-7)
      case '14d':
        return allTelemetry.slice(-14)
      case '30d':
        return allTelemetry.slice(-30)
      case 'all':
      default:
        return allTelemetry
    }
  }, [allTelemetry, timeRange])

  const computeStats = (metricId: MetricId) => {
    if (filteredData.length === 0) return { current: 0, avg: 0, min: 0, max: 0, trendDelta: 0, isRising: false }

    const values = filteredData.map((d) => {
      if (metricId === 'bp') return d.bpSys
      return (d as unknown as Record<string, number>)[metricId] || 0
    })

    const current = values[values.length - 1]
    const first = values[0]
    const avg = values.reduce((acc, v) => acc + v, 0) / values.length
    const min = Math.min(...values)
    const max = Math.max(...values)
    const trendDelta = current - first
    const isRising = trendDelta > 0

    return {
      current,
      avg: Number(avg.toFixed(1)),
      min: Number(min.toFixed(1)),
      max: Number(max.toFixed(1)),
      trendDelta: Number(trendDelta.toFixed(1)),
      isRising,
    }
  }

  const openMetric = (id: MetricId) => {
    setFocusedMetricId(id)
    setSelectedMetric(id)
  }

  const toggleMetricVisibility = (id: MetricId) => {
    setVisibleMetrics((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      const hasAny = Object.values(next).some(Boolean)
      return hasAny ? next : prev
    })
  }

  const activeMetricDef = METRICS_CATALOG.find((m) => m.id === focusedMetricId) || METRICS_CATALOG[0]
  const focusedStats = computeStats(focusedMetricId)
  const focusedValues = filteredData.map((point) => focusedMetricId === 'bp' ? point.bpSys : point[focusedMetricId])
  const trendResult = evaluateTrend(focusedValues, activeMetricDef.nominalMin, activeMetricDef.nominalMax)
  const activeUnit = unitText(activeMetricDef, t)
  const visibleCount = Object.values(visibleMetrics).filter(Boolean).length
  const rangeLabel = (range: TimeRange) => t(`trends.range.${range}`, { n: allTelemetry.length })

  // La fecha de cada punto (UTC, relativa a hoy) se formatea con el idioma activo.
  const pointDate = (point?: TelemetryPoint) =>
    point ? formatDate(`${point.dateKey}T00:00:00Z`, lang, { month: 'short', day: '2-digit', timeZone: 'UTC' }) : ''
  const dateOfDay = (day: unknown) => pointDate(filteredData.find((p) => p.day === day))

  const segment = (on: boolean) =>
    `min-h-11 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
      on ? 'bg-ok-tint text-ok-soft shadow-sm ring-1 ring-ok-soft/40' : 'text-mute hover:text-text'
    }`

  return (
    <main className="min-w-0 px-4 py-4 sm:px-6 sm:py-6 lg:flex lg:h-screen lg:flex-col lg:overflow-hidden lg:px-5 lg:py-3">
      <div className="mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 flex-col">
        {/* Cabecera principal */}
        <header className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <p className="m-0 text-[11px] font-semibold uppercase tracking-wider text-ok-soft">
              {t('trends.eyebrow', { place: mission?.place ?? t('mission.simulationPlace') })}
            </p>
            <h1 className="m-0 font-display text-2xl font-bold tracking-tight text-text sm:text-3xl">
              {t('trends.title')}
            </h1>
            <p className="m-0 text-xs text-mute">{t('trends.subtitle', { day: currentDay })}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('check')}
                className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-edge bg-panel px-3.5 py-2 text-sm font-semibold text-text transition-colors hover:border-ok-soft/50 hover:bg-panel-hover"
              >
                <Clock className="h-4 w-4 text-ok-soft" />
                <span>{t('trends.goCheck')}</span>
              </button>
            )}
            <button
              type="button"
              onClick={loadSimulatedMission}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-ok bg-notice px-3.5 py-2 text-sm font-semibold text-ok hover:brightness-110"
            >
              <Database className="h-4 w-4" />
              {missionLoaded ? t('trends.reloadSim', { n: currentDay }) : t('trends.loadSim', { n: currentDay })}
            </button>
          </div>
        </header>

        {/* Aviso permanente: esta pantalla mezcla chequeos reales con una simulación de demostración. */}
        <div role="note" className="mb-3 flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-watch bg-notice px-3.5 py-2 text-sm text-text">
          <strong className="text-watch">{t('trends.demoNotice')}</strong>
          <span className="inline-flex items-center gap-3 text-xs text-mute">
            <span className="inline-flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="4.5" fill="var(--color-text)" stroke="var(--color-text)" strokeWidth="2" /></svg>
              {t('trends.legend.real')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="4.5" fill="var(--color-rail)" stroke="var(--color-text)" strokeWidth="2" /></svg>
              {t('trends.legend.sim')}
            </span>
          </span>
        </div>

        {/* Barra de control: período, vista y enfoque en dos filas compactas */}
        <section
          aria-label={t('trends.controls')}
          className="relative mb-3 shrink-0 rounded-2xl border border-edge bg-card p-3 shadow-lg shadow-black/20"
        >
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-mute">
                <Calendar className="h-3.5 w-3.5 text-ok-soft" />
                {t('trends.period')}
              </span>
              <div role="group" aria-label={t('trends.period')} className="inline-flex rounded-xl border border-edge bg-rail/80 p-1">
                {RANGES.map((range) => (
                  <button
                    key={range}
                    type="button"
                    aria-pressed={timeRange === range}
                    onClick={() => setTimeRange(range)}
                    className={segment(timeRange === range)}
                  >
                    {rangeLabel(range)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-mute">{t('trends.whatToSee')}</span>
              <button
                type="button"
                aria-pressed={selectedMetric === 'all'}
                onClick={() => setSelectedMetric('all')}
                className={`inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                  selectedMetric === 'all'
                    ? 'border-ok-soft bg-ok-tint text-ok-soft shadow-md shadow-ok-soft/10'
                    : 'border-edge bg-panel/70 text-mute hover:border-text/40 hover:text-text'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>{t('trends.overview')}</span>
              </button>

              <button
                ref={drawerButtonRef}
                type="button"
                aria-expanded={showFilterDrawer}
                aria-controls={drawerId}
                onClick={() => setShowFilterDrawer(!showFilterDrawer)}
                className={`inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  showFilterDrawer
                    ? 'border-ok-soft bg-ok-tint text-ok-soft'
                    : 'border-edge bg-panel/70 text-mute hover:text-text'
                }`}
                title={t('trends.pickTitle')}
              >
                <Filter className="h-3.5 w-3.5" />
                <span>{t('trends.pick', { n: visibleCount })}</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${showFilterDrawer ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Selector de indicadores visibles: flota sobre el contenido para no empujar la página */}
          {showFilterDrawer && (
            <div ref={drawerRef} id={drawerId} className="absolute inset-x-3 top-full z-30 mt-2 rounded-xl border border-edge/80 bg-rail p-4 shadow-2xl shadow-black/50">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-edge/60 pb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-text">
                  {t('trends.pickHeading')}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const allOn = METRICS_CATALOG.reduce((acc, m) => ({ ...acc, [m.id]: true }), {} as Record<MetricId, boolean>)
                      setVisibleMetrics(allOn)
                    }}
                    className="min-h-11 cursor-pointer px-2 text-xs text-ok-soft hover:underline"
                  >
                    {t('trends.selectAll')}
                  </button>
                  <span className="text-edge">|</span>
                  <button
                    type="button"
                    onClick={() => setVisibleMetrics({ ...BASIC_METRICS })}
                    className="min-h-11 cursor-pointer px-2 text-xs text-mute hover:text-text"
                  >
                    {t('trends.basics')}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {METRICS_CATALOG.map((m) => {
                  const Icon = m.icon
                  const isChecked = visibleMetrics[m.id]
                  return (
                    <button
                      key={m.id}
                      type="button"
                      aria-pressed={isChecked}
                      onClick={() => toggleMetricVisibility(m.id)}
                      className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border p-2 text-left text-xs transition-all ${
                        isChecked
                          ? 'border-ok-soft/60 bg-ok-tint-2/40 text-text'
                          : 'border-edge bg-panel/30 text-mute opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded"
                        style={{ backgroundColor: tint(m.color, 13), color: m.color }}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="truncate font-medium">{t(`trends.m.${m.id}.name`)}</span>
                      <div
                        className={`ml-auto flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          isChecked ? 'border-ok-soft bg-ok-soft text-rail' : 'border-edge'
                        }`}
                      >
                        {isChecked && <CheckCircle2 className="h-3 w-3 stroke-[3]" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Selector de indicador a enfocar, con flechas y arrastre táctil / mouse (sin barra de scroll) */}
          <div className="mt-2 flex items-center gap-2">
            <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-mute">
              {t('trends.focus')}
            </span>

            <button
              type="button"
              onClick={() => handleScroll('left')}
              aria-label={t('trends.prevMetrics')}
              title={t('trends.scrollLeft')}
              className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-edge bg-panel text-mute transition-all hover:border-ok-soft/50 hover:bg-ok-tint hover:text-ok-soft active:scale-95"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div
              ref={carouselRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeaveOrUp}
              onMouseUp={handleMouseLeaveOrUp}
              onMouseMove={handleMouseMove}
              className="flex flex-1 touch-pan-x cursor-grab items-center gap-2 overflow-x-auto py-0.5 select-none scroll-smooth active:cursor-grabbing [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {METRICS_CATALOG.map((m) => {
                const Icon = m.icon
                const isSelected = selectedMetric === m.id || (selectedMetric !== 'all' && focusedMetricId === m.id)
                return (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => {
                      setSelectedMetric(m.id)
                      setFocusedMetricId(m.id)
                    }}
                    className={`inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-ok-soft bg-ok-tint text-text ring-1 ring-ok-soft/50'
                        : 'border-edge bg-panel/50 text-mute hover:border-text/30 hover:text-text'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: m.color }} />
                    <span className="pointer-events-none">{t(`trends.m.${m.id}.name`)}</span>
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => handleScroll('right')}
              aria-label={t('trends.nextMetrics')}
              title={t('trends.scrollRight')}
              className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-edge bg-panel text-mute transition-all hover:border-ok-soft/50 hover:bg-ok-tint hover:text-ok-soft active:scale-95"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        {/* Contenido principal: ocupa el alto que queda; si no cabe, el scroll es interno */}
        <div className="flex min-h-0 flex-1 flex-col">
          {/* VISTA ENFOCADA */}
          {selectedMetric !== 'all' && (
            <section className="flex min-h-0 flex-1 flex-col gap-3">
              <div className={`shrink-0 rounded-xl border px-4 py-2 text-sm ${trendResult.status === 'critical' ? 'border-act bg-notice text-act' : trendResult.status === 'warning' ? 'border-watch bg-notice text-watch' : 'border-ok bg-notice text-ok'}`}>
                <strong>{t('trends.rule')}</strong>{t(trendResult.messageKey, trendResult.messageParams)}
              </div>
              <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-edge bg-card p-4 shadow-xl">
                <div className="flex shrink-0 flex-col gap-3 border-b border-edge/60 pb-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: tint(activeMetricDef.color, 15), color: activeMetricDef.color }}
                    >
                      <activeMetricDef.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h2 className="m-0 font-display text-xl font-bold text-text">
                          {t(`trends.m.${activeMetricDef.id}.name`)}
                        </h2>
                        <span className="rounded bg-ok-tint px-2 py-0.5 text-xs font-medium text-ok-soft">
                          {t('trends.optimal', { range: t(`trends.m.${activeMetricDef.id}.safe`) })}
                        </span>
                      </div>
                      <p className="mt-1 mb-0 max-w-2xl text-xs text-mute lg:line-clamp-2">{t(`trends.m.${activeMetricDef.id}.insight`)}</p>
                      <p className="mt-0.5 mb-0 text-[11px] font-semibold text-mute">
                        {t(`trends.m.${activeMetricDef.id}.risk`)}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3 self-end rounded-xl border border-edge bg-rail/80 px-3.5 py-2 sm:self-start">
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-mute">{t('trends.lastValue')}</span>
                      <p className="m-0 font-display text-2xl font-bold text-text">
                        {activeMetricDef.formatValue(focusedStats.current, t, filteredData[filteredData.length - 1])}
                      </p>
                    </div>
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        focusedStats.isRising
                          ? 'bg-ok-tint text-ok-soft'
                          : 'bg-amber-tint text-amber'
                      }`}
                    >
                      {focusedStats.isRising ? (
                        <TrendingUp className="h-5 w-5" />
                      ) : (
                        <TrendingDown className="h-5 w-5" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3 lg:flex-row lg:gap-4">
                  {/* GRÁFICO PRINCIPAL: ocupa el alto disponible */}
                  <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:order-1">
                    <div className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-x-3 text-xs text-mute">
                      <span>{t('trends.evolution', { from: pointDate(filteredData[0]), to: pointDate(filteredData[filteredData.length - 1]) })}</span>
                      <span className="font-medium text-ok-soft">{t('trends.nominalBand')}</span>
                    </div>

                    <div className="h-64 min-h-[200px] w-full rounded-xl border border-edge/70 bg-rail p-3 lg:h-auto lg:min-h-0 lg:flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        {activeMetricDef.id === 'bp' ? (
                          <LineChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-edge)" opacity={0.4} />
                            <XAxis
                              dataKey="day"
                              stroke="var(--color-mute)"
                              fontSize={11}
                              tickLine={false}
                              tickFormatter={(d) => t('trends.axisDay', { d })}
                            />
                            <YAxis stroke="var(--color-mute)" fontSize={11} domain={[50, 150]} tickLine={false} />
                            <Tooltip
                              contentStyle={TOOLTIP_STYLE}
                              labelFormatter={(d) => t('trends.tooltipDay', { d: String(d), date: dateOfDay(d) })}
                            />
                            <ReferenceArea
                              y1={healthRanges.bloodPressureSys.min}
                              y2={healthRanges.bloodPressureSys.max}
                              fill="var(--color-ok-soft)"
                              fillOpacity={0.08}
                              stroke="var(--color-ok-soft)"
                              strokeOpacity={0.3}
                            />
                            <Line
                              type="monotone"
                              name={t('trends.systolic')}
                              dataKey="bpSys"
                              stroke="var(--color-serie-sys)"
                              strokeWidth={2.5}
                              dot={makeDot('var(--color-serie-sys)', 'bp')}
                              activeDot={{ r: 6 }}
                            />
                            <Line
                              type="monotone"
                              name={t('trends.diastolic')}
                              dataKey="bpDia"
                              stroke="var(--color-serie-dia)"
                              strokeWidth={2.5}
                              dot={makeDot('var(--color-serie-dia)', 'bp')}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        ) : (
                          <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id={`grad-${activeMetricDef.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={activeMetricDef.color} stopOpacity={0.45} />
                                <stop offset="95%" stopColor={activeMetricDef.color} stopOpacity={0.02} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-edge)" opacity={0.4} />
                            <XAxis
                              dataKey="day"
                              stroke="var(--color-mute)"
                              fontSize={11}
                              tickLine={false}
                              tickFormatter={(d) => t('trends.axisDay', { d })}
                            />
                            <YAxis
                              stroke="var(--color-mute)"
                              fontSize={11}
                              domain={['dataMin - 1', 'dataMax + 1']}
                              tickLine={false}
                            />
                            <Tooltip
                              contentStyle={TOOLTIP_STYLE}
                              labelFormatter={(d) => t('trends.tooltipDay', { d: String(d), date: dateOfDay(d) })}
                              formatter={(value: unknown) => [
                                `${value} ${activeUnit}`,
                                t(`trends.m.${activeMetricDef.id}.name`),
                              ]}
                            />
                            <ReferenceLine
                              y={activeMetricDef.nominalMin}
                              stroke="var(--color-ok-soft)"
                              strokeDasharray="4 4"
                              strokeOpacity={0.6}
                            />
                            <ReferenceLine
                              y={activeMetricDef.nominalMax}
                              stroke="var(--color-ok-soft)"
                              strokeDasharray="4 4"
                              strokeOpacity={0.6}
                            />
                            <Area
                              type="monotone"
                              dataKey={activeMetricDef.id}
                              stroke={activeMetricDef.color}
                              strokeWidth={2.5}
                              fillOpacity={1}
                              fill={`url(#grad-${activeMetricDef.id})`}
                              dot={makeDot(activeMetricDef.color, activeMetricDef.id)}
                              activeDot={{ r: 6 }}
                            />
                          </AreaChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Resumen lateral: cuatro cifras clave */}
                  <div className="grid shrink-0 grid-cols-2 gap-2.5 sm:grid-cols-4 lg:order-2 lg:w-52 lg:grid-cols-1 lg:content-start">
                    <div className="rounded-xl border border-edge/60 bg-rail/60 px-3.5 py-2.5">
                      <span className="text-xs text-mute">{t('trends.avg', { range: t(`trends.rangeShort.${timeRange}`) })}</span>
                      <p className="m-0 mt-0.5 font-display text-xl font-bold text-text">
                        {focusedStats.avg} {activeUnit}
                      </p>
                    </div>
                    <div className="rounded-xl border border-edge/60 bg-rail/60 px-3.5 py-2.5">
                      <span className="text-xs text-mute">{t('trends.min')}</span>
                      <p className="m-0 mt-0.5 font-display text-xl font-bold text-text">
                        {focusedStats.min} {activeUnit}
                      </p>
                    </div>
                    <div className="rounded-xl border border-edge/60 bg-rail/60 px-3.5 py-2.5">
                      <span className="text-xs text-mute">{t('trends.max')}</span>
                      <p className="m-0 mt-0.5 font-display text-xl font-bold text-text">
                        {focusedStats.max} {activeUnit}
                      </p>
                    </div>
                    <div className="rounded-xl border border-edge/60 bg-rail/60 px-3.5 py-2.5">
                      <span className="text-xs text-mute">{t('trends.delta')}</span>
                      <p
                        className={`m-0 mt-0.5 font-display text-xl font-bold ${
                          focusedStats.trendDelta >= 0 ? 'text-ok-soft' : 'text-amber'
                        }`}
                      >
                        {focusedStats.trendDelta > 0 ? `+${focusedStats.trendDelta}` : focusedStats.trendDelta} {activeUnit}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* VISTA GENERAL: las tarjetas se desplazan dentro de su panel */}
          {selectedMetric === 'all' && (
            <section aria-label={t('trends.gridLabel')} className="flex min-h-0 flex-1 flex-col">
              <div className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-x-4">
                <h2 className="m-0 font-display text-lg font-semibold tracking-wide text-text">
                  {t('trends.overviewTitle', { range: rangeLabel(timeRange) })}
                </h2>
                <span className="text-xs text-mute">
                  {t('trends.showing', { n: visibleCount })}
                </span>
              </div>

              <div className="min-h-0 flex-1 lg:overflow-y-auto lg:pr-1 [scrollbar-width:thin] [scrollbar-color:var(--color-edge)_transparent]">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {METRICS_CATALOG.filter((m) => visibleMetrics[m.id]).map((metric) => {
                    const Icon = metric.icon
                    const stats = computeStats(metric.id)
                    const lastPoint = filteredData[filteredData.length - 1]
                    const unit = unitText(metric, t)

                    return (
                      <article
                        key={metric.id}
                        role="button"
                        tabIndex={0}
                        aria-label={t('trends.openDetail', { name: t(`trends.m.${metric.id}.name`) })}
                        onClick={() => openMetric(metric.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            openMetric(metric.id)
                          }
                        }}
                        className="group relative cursor-pointer rounded-2xl border border-edge bg-card p-3.5 shadow-md transition-all hover:border-ok-soft/60 hover:bg-card-hover"
                      >
                        <div className="-mt-1 -mr-1.5 flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-9 w-9 items-center justify-center rounded-xl"
                              style={{ backgroundColor: tint(metric.color, 13), color: metric.color }}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <h3 className="m-0 text-sm font-bold text-text transition-colors group-hover:text-ok-soft">
                              {t(`trends.m.${metric.id}.name`)}
                            </h3>
                          </div>

                          <span aria-hidden="true" className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-mute">
                            <Maximize2 className="h-4 w-4" />
                          </span>
                        </div>

                        <div className="mt-2 flex items-baseline justify-between">
                          <span className="font-display text-2xl font-bold tracking-tight text-text">
                            {metric.formatValue(stats.current, t, lastPoint)}
                          </span>

                          <div
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                              stats.trendDelta === 0
                                ? 'bg-panel text-mute'
                                : stats.isRising
                                ? 'bg-ok-tint text-ok-soft'
                                : 'bg-amber-tint text-amber'
                            }`}
                          >
                            {stats.trendDelta > 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : stats.trendDelta < 0 ? (
                              <TrendingDown className="h-3 w-3" />
                            ) : null}
                            <span>
                              {stats.trendDelta > 0 ? `+${stats.trendDelta}` : stats.trendDelta}
                            </span>
                          </div>
                        </div>

                        <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-mute">
                          <span className="min-w-0 break-words">{t('trends.safeRange', { range: t(`trends.m.${metric.id}.safe`) })}</span>
                          <span className="shrink-0">{t('trends.average', { v: stats.avg, unit })}</span>
                        </div>

                        <div className="mt-2 h-14 w-full rounded-lg bg-rail/80 p-1.5">
                          <ResponsiveContainer width="100%" height="100%">
                            {metric.id === 'bp' ? (
                              <LineChart data={filteredData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                <YAxis domain={[60, 140]} hide />
                                <Line
                                  type="monotone"
                                  dataKey="bpSys"
                                  stroke="var(--color-serie-sys)"
                                  strokeWidth={2}
                                  dot={false}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="bpDia"
                                  stroke="var(--color-serie-dia)"
                                  strokeWidth={2}
                                  dot={false}
                                />
                              </LineChart>
                            ) : (
                              <AreaChart data={filteredData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                <defs>
                                  <linearGradient id={`spark-${metric.id}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={metric.color} stopOpacity={0.4} />
                                    <stop offset="95%" stopColor={metric.color} stopOpacity={0.0} />
                                  </linearGradient>
                                </defs>
                                <YAxis domain={['dataMin', 'dataMax']} hide />
                                <Area
                                  type="monotone"
                                  dataKey={metric.id}
                                  stroke={metric.color}
                                  strokeWidth={2}
                                  fill={`url(#spark-${metric.id})`}
                                  dot={false}
                                />
                              </AreaChart>
                            )}
                          </ResponsiveContainer>
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-2 border-t border-edge/60 pt-1.5 text-[11px] text-mute">
                          <span className="min-w-0 break-words">{t(`trends.m.${metric.id}.risk`)}</span>
                          <span className="inline-flex min-h-11 shrink-0 items-center text-xs font-semibold text-ok-soft underline-offset-2 group-hover:underline">{t('trends.details')}</span>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Protocolo de evaluación sin conexión: plegado para no ocupar alto */}
        <details className="group/proto mt-3 shrink-0 rounded-2xl border border-edge/80 bg-panel/40 px-4 py-2 text-xs text-mute">
          <summary className="flex min-h-9 cursor-pointer list-none items-center gap-2.5 font-semibold text-text">
            <Info className="h-4 w-4 shrink-0 text-ok-soft" />
            <span>{t('trends.footerTitle')}</span>
          </summary>
          <p className="m-0 mt-1 mb-1 pl-[26px]">{t('trends.footerBody')}</p>
        </details>
      </div>
    </main>
  )
}
