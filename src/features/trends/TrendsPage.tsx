import { useMemo, useRef, useState } from 'react'
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
  SlidersHorizontal,
  Smile,
  Sparkles,
  Thermometer,
  TrendingDown,
  TrendingUp,
  Wind,
} from 'lucide-react'
import { normalizeMetrics } from '../measurements/dailyCheckData'
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
import type { Mission } from '../../types'
import { evaluateTrend } from '../evaluation/trendRule'

export type TimeRange = '7d' | '14d' | '30d' | 'all'
export type MetricId = 'bp' | 'hr' | 'glucose' | 'temp' | 'sleep' | 'mood' | 'spo2' | 'radiation'

interface MetricDefinition {
  id: MetricId
  name: string
  shortName: string
  unit: string
  icon: typeof Heart
  color: string
  colorSecondary?: string
  nominalMin: number
  nominalMax: number
  safeLabel: string
  description: string
  medicalInsight: string
  nasaRisk: string
  formatValue: (val: number, item?: TelemetryPoint) => string
}

export interface TelemetryPoint {
  day: number
  dateStr: string
  timeStr: string
  bpSys: number
  bpDia: number
  hr: number
  glucose: number
  temp: number
  sleep: number
  mood: number // 1 to 5
  spo2: number
  radiation: number
}

const METRICS_CATALOG: MetricDefinition[] = [
  {
    id: 'bp',
    name: 'Blood Pressure',
    shortName: 'Presión Arterial',
    unit: 'mmHg',
    icon: Heart,
    color: '#f0645a',
    colorSecondary: '#f2b544',
    nominalMin: 90,
    nominalMax: 130,
    safeLabel: '90-120 / 60-80 mmHg',
    description: 'Tensión sistólica y diastólica en cabina.',
    medicalInsight: 'En microgravedad los fluidos corporales migran hacia el torso superior y la cabeza, pudiendo alterar la distensibilidad vascular.',
    nasaRisk: 'Cardiovascular Adaptations Risk (NASA HRP)',
    formatValue: (val, item) => item ? `${item.bpSys}/${item.bpDia}` : `${val}`,
  },
  {
    id: 'hr',
    name: 'Heart Rate',
    shortName: 'Frecuencia Cardíaca',
    unit: 'bpm',
    icon: Activity,
    color: '#5cc98b',
    nominalMin: 55,
    nominalMax: 85,
    safeLabel: '55 - 85 bpm',
    description: 'Ritmo cardíaco basal medido al despertar.',
    medicalInsight: 'El volumen plasmático reducido en vuelo orbital puede generar taquicardia refleja compensatoria durante ejercicio o estrés.',
    nasaRisk: 'Cardiac Rhythm Asynchrony (NASA/CSA)',
    formatValue: (val) => `${Math.round(val)} bpm`,
  },
  {
    id: 'sleep',
    name: 'Sleep Duration',
    shortName: 'Horas de Sueño',
    unit: 'hrs',
    icon: Moon,
    color: '#a78bfa',
    nominalMin: 6.5,
    nominalMax: 9.0,
    safeLabel: '6.5 - 8.5 horas',
    description: 'Tiempo total de descanso en cabina insonorizada.',
    medicalInsight: 'La falta de ciclo solar natural de 24h altera el ritmo circadiano. 3 noches seguidas por debajo de 6h disminuyen la agudeza cognitiva.',
    nasaRisk: 'Sleep Loss & Fatigue Risk (NASA HRP)',
    formatValue: (val) => `${val.toFixed(1)} h`,
  },
  {
    id: 'glucose',
    name: 'Blood Glucose',
    shortName: 'Glucosa en Sangre',
    unit: 'mg/dL',
    icon: Droplets,
    color: '#38bdf8',
    nominalMin: 70,
    nominalMax: 110,
    safeLabel: '70 - 100 mg/dL',
    description: 'Glucemia capilar pre-desayuno.',
    medicalInsight: 'El metabolismo hidrocarbonado y la sensibilidad a la insulina pueden fluctuar bajo cambios en el gasto calórico en microgravedad.',
    nasaRisk: 'Metabolic & Nutrition Changes (NASA HRP)',
    formatValue: (val) => `${Math.round(val)} mg/dL`,
  },
  {
    id: 'temp',
    name: 'Body Temperature',
    shortName: 'Temperatura Corporal',
    unit: '°C',
    icon: Thermometer,
    color: '#fb923c',
    nominalMin: 36.2,
    nominalMax: 37.3,
    safeLabel: '36.2 - 37.2 °C',
    description: 'Temperatura timpánica central.',
    medicalInsight: 'En hábitats cerrados sin convección térmica natural, pequeñas elevaciones ("space fever") son detectadas rápidamente.',
    nasaRisk: 'Host Microorganism & Immune Dysregulation',
    formatValue: (val) => `${val.toFixed(1)} °C`,
  },
  {
    id: 'mood',
    name: 'Cognitive & Mood',
    shortName: 'Estado de Ánimo',
    unit: 'pts',
    icon: Smile,
    color: '#e879f9',
    nominalMin: 3.0,
    nominalMax: 5.0,
    safeLabel: '3.0 - 5.0 pts (Good/Great)',
    description: 'Autoevaluación psicológica y estrés operativo.',
    medicalInsight: 'El confinamiento y la distancia a la Tierra influyen en la moral del astronauta; vital para la seguridad de la misión.',
    nasaRisk: 'Behavioral Medicine Risk (NASA/CSA)',
    formatValue: (val) => {
      const labels = ['', 'Bad', 'Fair', 'Neutral', 'Good', 'Great']
      const rounded = Math.round(val)
      return `${labels[rounded] || `${val.toFixed(1)}`} (${val.toFixed(1)})`
    },
  },
  {
    id: 'spo2',
    name: 'Blood Oxygen (SpO2)',
    shortName: 'Oxígeno en Sangre',
    unit: '%',
    icon: Wind,
    color: '#2dd4bf',
    nominalMin: 95,
    nominalMax: 100,
    safeLabel: '96% - 100%',
    description: 'Saturación periférica de oxígeno en cabina.',
    medicalInsight: 'Monitoreo crítico para verificar balance atmosférico O2/N2 de la cabina y prevenir hipoxia tisular silente.',
    nasaRisk: 'Hypoxia & Cabin Pressure (NASA)',
    formatValue: (val) => `${Math.round(val)}%`,
  },
  {
    id: 'radiation',
    name: 'Radiation Exposure',
    shortName: 'Radiación Diaria',
    unit: 'mSv',
    icon: Radiation,
    color: '#facc15',
    nominalMin: 0.1,
    nominalMax: 0.5,
    safeLabel: '< 0.50 mSv / día',
    description: 'Dosis absorbida por dosímetro personal de silicio.',
    medicalInsight: 'Tránsito lunar fuera de la magnetosfera terrestre expone al astronauta a rayos cósmicos galácticos (GCR).',
    nasaRisk: 'Space Radiation Cancer & CNS Risk (NASA/CSA)',
    formatValue: (val) => `${val.toFixed(2)} mSv`,
  },
]

function generateMissionTelemetry(currentDay = 47): TelemetryPoint[] {
  const points: TelemetryPoint[] = []

  for (let d = 1; d <= currentDay; d++) {
    const daysBack = currentDay - d
    const dateObj = new Date(2026, 10, 14 - daysBack)
    const monthStr = dateObj.toLocaleDateString('en-US', { month: 'short' })
    const dayNum = dateObj.getDate()
    const dateStr = `${monthStr} ${dayNum < 10 ? '0' : ''}${dayNum}`

    let sleepVal = 7.3 + Math.sin(d * 0.7) * 0.5
    if (d === 45) sleepVal = 5.6
    if (d === 46) sleepVal = 5.3
    if (d === 47) sleepVal = 5.2

    let moodVal = 4.2 + Math.cos(d * 0.5) * 0.4
    if (d >= 45) moodVal = 2.4 - (47 - d) * 0.2

    const bpSys = Math.round(127 + Math.sin(d * 0.4) * 3 + (d === 47 ? 1 : 0))
    const bpDia = Math.round(81 + Math.cos(d * 0.4) * 2 + (d === 47 ? 1 : 0))
    const hr = Math.round(64 + Math.sin(d * 0.8) * 2.5)
    const glucose = Math.round(95 + Math.cos(d * 0.6) * 3)
    const temp = Number((36.6 + Math.sin(d * 0.3) * 0.15).toFixed(1))
    const spo2 = Math.round(98 + Math.sin(d * 0.9) * 0.8)
    const radiation = Number((0.36 + Math.sin(d * 0.2) * 0.05).toFixed(2))

    points.push({
      day: d,
      dateStr,
      timeStr: '07:10',
      bpSys,
      bpDia,
      hr,
      glucose,
      temp,
      sleep: Number(sleepVal.toFixed(1)),
      mood: Number(moodVal.toFixed(1)),
      spo2,
      radiation,
    })
  }

  try {
    const saved = localStorage.getItem('orbit_health_daily_records')
    if (saved) {
      const records = JSON.parse(saved)
      if (Array.isArray(records) && records.length > 0) {
        const latest = records[0]
        if (latest.metrics) {
          const metrics = normalizeMetrics(latest.metrics)
          const lastPoint = points[points.length - 1]
          lastPoint.bpSys = metrics.bloodPressureSys
          lastPoint.bpDia = metrics.bloodPressureDia
          lastPoint.hr = metrics.heartRate
          if (metrics.bloodSugar !== null) lastPoint.glucose = metrics.bloodSugar
          lastPoint.temp = metrics.bodyTemperature
          lastPoint.sleep = metrics.sleepHours
          lastPoint.spo2 = metrics.spo2
          lastPoint.mood = { Bad: 1, Fair: 2, Neutral: 3, Good: 4, Great: 5 }[metrics.mood] ?? 4
          if (latest.timeStr) lastPoint.timeStr = latest.timeStr
        }
      }
    }
  } catch {
    // ignore
  }

  return points
}

interface Props {
  mission?: Mission
  onNavigate?: (screen: string) => void
}

export function TrendsPage({ mission, onNavigate }: Props) {
  const currentDay = mission?.day ?? 47
  const [missionTelemetry, setMissionTelemetry] = useState<TelemetryPoint[]>(() => {
    try {
      const saved = localStorage.getItem('orbit_health_mission_telemetry')
      return saved ? JSON.parse(saved) as TelemetryPoint[] : []
    } catch {
      return []
    }
  })
  const allTelemetry = useMemo(
    () => missionTelemetry.length > 0 ? missionTelemetry : generateMissionTelemetry(currentDay),
    [currentDay, missionTelemetry],
  )
  const [missionLoaded, setMissionLoaded] = useState(missionTelemetry.length > 0)

  function loadSimulatedMission() {
    const generated = generateMissionTelemetry(currentDay)
    setMissionTelemetry(generated)
    setMissionLoaded(true)
    try {
      localStorage.setItem('orbit_health_mission_telemetry', JSON.stringify(generated))
    } catch {
      // La gráfica sigue disponible en memoria si el navegador bloquea el almacenamiento.
    }
  }

  const [timeRange, setTimeRange] = useState<TimeRange>('7d')
  const [selectedMetric, setSelectedMetric] = useState<MetricId | 'all'>('all')
  const [focusedMetricId, setFocusedMetricId] = useState<MetricId>('bp')
  const [visibleMetrics, setVisibleMetrics] = useState<Record<MetricId, boolean>>({
    bp: true,
    hr: true,
    sleep: true,
    glucose: true,
    temp: true,
    mood: true,
    spo2: false,
    radiation: false,
  })
  const [showFilterDrawer, setShowFilterDrawer] = useState(false)

  // Referencia y lógica de desplazamiento y arrastre táctil / mouse para el carrusel de métricas
  const carouselRef = useRef<HTMLDivElement>(null)
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

  return (
    <main className="min-w-0 px-4 py-5 sm:px-6 sm:py-8 lg:px-6 lg:py-5">
      <div className="mx-auto max-w-[1400px]">
        {/* Cabecera Principal */}
        <header className="mb-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#5cc98b]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Bio-telemetría Lunar Transit</span>
            </div>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-text sm:text-4xl">
              Tendencias de Salud
            </h1>
            <p className="mt-1 text-sm text-mute">
              Monitoreo longitudinal de constantes vitales y adaptación aeroespacial (Misión Día {currentDay}).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
          {onNavigate && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('check')}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-edge bg-panel px-4 py-2.5 text-sm font-semibold text-text transition-colors hover:border-[#5cc98b]/50 hover:bg-[#1c3f5e] cursor-pointer"
              >
                <Clock className="h-4 w-4 text-[#5cc98b]" />
                <span>Ir al Chequeo Diario</span>
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={loadSimulatedMission}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-ok bg-notice px-4 py-2.5 text-sm font-semibold text-ok hover:brightness-110"
          >
            <Database className="h-4 w-4" />
            {missionLoaded ? 'Recargar misión simulada (47 días)' : 'Cargar misión simulada (47 días)'}
          </button>
          </div>
        </header>

        {/* BARRA DE CONTROL */}
        <section
          aria-label="Controles de tendencias"
          className="mb-5 rounded-2xl border border-edge bg-[#14283d] p-4 sm:p-5 shadow-lg shadow-black/20"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* 1. SELECCIONAR PERÍODO (Últimos 7 días por defecto) */}
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-mute">
                <Calendar className="h-3.5 w-3.5 text-[#5cc98b]" />
                <span>Período de observación</span>
              </label>
              <div className="inline-flex rounded-xl border border-edge bg-rail/80 p-1">
                <button
                  type="button"
                  onClick={() => setTimeRange('7d')}
                  className={`relative min-h-11 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    timeRange === '7d'
                      ? 'bg-[#184840] text-[#5cc98b] shadow-sm ring-1 ring-[#5cc98b]/40'
                      : 'text-mute hover:text-text'
                  }`}
                >
                  <span>Últimos 7 días</span>
                  {timeRange === '7d' && (
                    <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#5cc98b]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setTimeRange('14d')}
                  className={`min-h-11 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    timeRange === '14d'
                      ? 'bg-[#184840] text-[#5cc98b] shadow-sm ring-1 ring-[#5cc98b]/40'
                      : 'text-mute hover:text-text'
                  }`}
                >
                  14 días
                </button>

                <button
                  type="button"
                  onClick={() => setTimeRange('30d')}
                  className={`min-h-11 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    timeRange === '30d'
                      ? 'bg-[#184840] text-[#5cc98b] shadow-sm ring-1 ring-[#5cc98b]/40'
                      : 'text-mute hover:text-text'
                  }`}
                >
                  30 días
                </button>

                <button
                  type="button"
                  onClick={() => setTimeRange('all')}
                  className={`min-h-11 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    timeRange === 'all'
                      ? 'bg-[#184840] text-[#5cc98b] shadow-sm ring-1 ring-[#5cc98b]/40'
                      : 'text-mute hover:text-text'
                  }`}
                >
                  Misión total (47 d)
                </button>
              </div>
            </div>

            {/* 2. SELECCIONAR QUÉ DATOS VER */}
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-mute">
                <SlidersHorizontal className="h-3.5 w-3.5 text-[#5cc98b]" />
                <span>¿Qué datos quieres ver?</span>
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMetric('all')}
                  className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    selectedMetric === 'all'
                      ? 'border-[#5cc98b] bg-[#184840] text-[#5cc98b] shadow-md shadow-[#5cc98b]/10'
                      : 'border-edge bg-panel/70 text-mute hover:border-text/40 hover:text-text'
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Panel general (Todos)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowFilterDrawer(!showFilterDrawer)}
                  className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    showFilterDrawer
                      ? 'border-[#5cc98b] bg-[#184840] text-[#5cc98b]'
                      : 'border-edge bg-panel/70 text-mute hover:text-text'
                  }`}
                  title="Elegir indicadores visibles"
                >
                  <Filter className="h-3.5 w-3.5" />
                  <span>Escoger datos ({Object.values(visibleMetrics).filter(Boolean).length})</span>
                  <ChevronDown className={`h-3 w-3 transition-transform ${showFilterDrawer ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Menú de selección individual de datos visibles */}
          {showFilterDrawer && (
            <div className="mt-4 rounded-xl border border-edge/80 bg-rail/90 p-4 animate-in fade-in slide-in-from-top-1">
              <div className="mb-3 flex items-center justify-between border-b border-edge/60 pb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-text">
                  Selecciona los datos y constantes a visualizar:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const allOn = METRICS_CATALOG.reduce((acc, m) => ({ ...acc, [m.id]: true }), {} as Record<MetricId, boolean>)
                      setVisibleMetrics(allOn)
                    }}
                    className="text-xs text-[#5cc98b] hover:underline cursor-pointer"
                  >
                    Marcar todos
                  </button>
                  <span className="text-edge">|</span>
                  <button
                    type="button"
                    onClick={() => {
                      setVisibleMetrics({
                        bp: true,
                        hr: true,
                        sleep: true,
                        glucose: true,
                        temp: true,
                        mood: true,
                        spo2: false,
                        radiation: false,
                      })
                    }}
                    className="text-xs text-mute hover:text-text cursor-pointer"
                  >
                    Básicos de cabina (6)
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
                      onClick={() => toggleMetricVisibility(m.id)}
                      className={`flex min-h-11 items-center gap-2.5 rounded-lg border p-2 text-left text-xs transition-all cursor-pointer ${
                        isChecked
                          ? 'border-[#5cc98b]/60 bg-[#143734]/40 text-text'
                          : 'border-edge bg-panel/30 text-mute opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded"
                        style={{ backgroundColor: `${m.color}20`, color: m.color }}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="truncate font-medium">{m.shortName}</span>
                      <div
                        className={`ml-auto h-4 w-4 shrink-0 rounded border flex items-center justify-center ${
                          isChecked ? 'border-[#5cc98b] bg-[#5cc98b] text-[#0c1e2f]' : 'border-edge'
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

          {/* Selector de métricas con flechas de navegación y arrastre táctil/mouse (sin barra de scroll) */}
          <div className="mt-4 flex items-center gap-2">
            <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-mute">
              Enfocar métrica:
            </span>

            {/* Botón Flecha Izquierda */}
            <button
              type="button"
              onClick={() => handleScroll('left')}
              aria-label="Métricas anteriores"
              title="Desplazar a la izquierda"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-edge bg-panel text-mute transition-all hover:border-[#5cc98b]/50 hover:bg-[#184840] hover:text-[#5cc98b] active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Contenedor desplazable: permite arrastre con el dedo o mouse, sin barra visible */}
            <div
              ref={carouselRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeaveOrUp}
              onMouseUp={handleMouseLeaveOrUp}
              onMouseMove={handleMouseMove}
              className="flex flex-1 items-center gap-2 overflow-x-auto py-1 select-none touch-pan-x cursor-grab active:cursor-grabbing [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth"
            >
              {METRICS_CATALOG.map((m) => {
                const Icon = m.icon
                const isSelected = selectedMetric === m.id || (selectedMetric !== 'all' && focusedMetricId === m.id)
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setSelectedMetric(m.id)
                      setFocusedMetricId(m.id)
                    }}
                    className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#5cc98b] bg-[#184840] text-text ring-1 ring-[#5cc98b]/50'
                        : 'border-edge bg-panel/50 text-mute hover:border-text/30 hover:text-text'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: m.color }} />
                    <span className="pointer-events-none">{m.shortName}</span>
                  </button>
                )
              })}
            </div>

            {/* Botón Flecha Derecha */}
            <button
              type="button"
              onClick={() => handleScroll('right')}
              aria-label="Métricas siguientes"
              title="Desplazar a la derecha"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-edge bg-panel text-mute transition-all hover:border-[#5cc98b]/50 hover:bg-[#184840] hover:text-[#5cc98b] active:scale-95 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        {/* VISTA ENFOCADA */}
        {selectedMetric !== 'all' && (
          <section className="mb-6 space-y-4">
            <div className={`rounded-xl border p-4 text-sm ${trendResult.status === 'critical' ? 'border-act bg-notice text-act' : trendResult.status === 'warning' ? 'border-watch bg-notice text-watch' : 'border-ok bg-notice text-ok'}`}>
              <strong>Trend rule: </strong>{trendResult.message}
            </div>
            <div className="rounded-2xl border border-edge bg-[#14283d] p-5 sm:p-6 shadow-xl">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-edge/60 pb-5">
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${activeMetricDef.color}25`, color: activeMetricDef.color }}
                  >
                    <activeMetricDef.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-2xl font-bold text-text">
                        {activeMetricDef.name} ({activeMetricDef.shortName})
                      </h2>
                      <span className="rounded bg-[#184840] px-2 py-0.5 text-xs font-medium text-[#5cc98b]">
                        Rango óptimo: {activeMetricDef.safeLabel}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-mute max-w-2xl">{activeMetricDef.medicalInsight}</p>
                    <p className="mt-0.5 text-[11px] font-semibold text-[#8fa9bd]">
                      {activeMetricDef.nasaRisk}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-start bg-rail/80 rounded-xl border border-edge px-4 py-2.5">
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-mute">Último valor</span>
                    <p className="font-display text-2xl font-bold text-text">
                      {activeMetricDef.formatValue(focusedStats.current, filteredData[filteredData.length - 1])}
                    </p>
                  </div>
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      focusedStats.isRising
                        ? 'bg-[#184840] text-[#5cc98b]'
                        : 'bg-[#2a2a1c] text-[#f2b544]'
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

              <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_240px] lg:items-start lg:gap-5">
              {/* 4 KPIs */}
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:order-2 lg:mt-5 lg:grid-cols-1">
                <div className="rounded-xl border border-edge/60 bg-rail/60 p-3.5">
                  <span className="text-xs text-mute">Promedio ({timeRange})</span>
                  <p className="mt-1 font-display text-xl font-bold text-text">
                    {focusedStats.avg} {activeMetricDef.unit}
                  </p>
                </div>
                <div className="rounded-xl border border-edge/60 bg-rail/60 p-3.5">
                  <span className="text-xs text-mute">Valor Mínimo</span>
                  <p className="mt-1 font-display text-xl font-bold text-text">
                    {focusedStats.min} {activeMetricDef.unit}
                  </p>
                </div>
                <div className="rounded-xl border border-edge/60 bg-rail/60 p-3.5">
                  <span className="text-xs text-mute">Valor Máximo</span>
                  <p className="mt-1 font-display text-xl font-bold text-text">
                    {focusedStats.max} {activeMetricDef.unit}
                  </p>
                </div>
                <div className="rounded-xl border border-edge/60 bg-rail/60 p-3.5">
                  <span className="text-xs text-mute">Variación neta</span>
                  <p
                    className={`mt-1 font-display text-xl font-bold ${
                      focusedStats.trendDelta >= 0 ? 'text-[#5cc98b]' : 'text-[#f2b544]'
                    }`}
                  >
                    {focusedStats.trendDelta > 0 ? `+${focusedStats.trendDelta}` : focusedStats.trendDelta} {activeMetricDef.unit}
                  </p>
                </div>
              </div>

              {/* GRÁFICO PRINCIPAL */}
              <div className="mt-6 min-w-0 lg:order-1 lg:mt-5">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 text-xs text-mute">
                  <span>Evolución diaria por día de misión ({filteredData[0]?.dateStr} — {filteredData[filteredData.length - 1]?.dateStr})</span>
                  <span className="text-[#5cc98b] font-medium">Banda verde: Margen nominal seguro NASA</span>
                </div>

                <div className="h-72 w-full rounded-xl lg:h-[19rem] border border-edge/70 bg-[#0c1e2f] p-3 sm:p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    {activeMetricDef.id === 'bp' ? (
                      <LineChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#274b6b" opacity={0.4} />
                        <XAxis
                          dataKey="day"
                          stroke="#8fa9bd"
                          fontSize={11}
                          tickLine={false}
                          tickFormatter={(d) => `Día ${d}`}
                        />
                        <YAxis stroke="#8fa9bd" fontSize={11} domain={[50, 150]} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#102438',
                            borderColor: '#274b6b',
                            borderRadius: '0.75rem',
                            color: '#e6eef4',
                            fontSize: '12px',
                          }}
                          labelFormatter={(d) => `Misión Día ${d} (${filteredData.find((p) => p.day === d)?.dateStr})`}
                        />
                        <ReferenceArea
                          y1={90}
                          y2={125}
                          fill="#5cc98b"
                          fillOpacity={0.08}
                          stroke="#5cc98b"
                          strokeOpacity={0.3}
                        />
                        <Line
                          type="monotone"
                          name="Sistólica (Sys)"
                          dataKey="bpSys"
                          stroke="#f0645a"
                          strokeWidth={2.5}
                          dot={{ fill: '#f0645a', r: 3.5 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          name="Diastólica (Dia)"
                          dataKey="bpDia"
                          stroke="#f2b544"
                          strokeWidth={2.5}
                          dot={{ fill: '#f2b544', r: 3.5 }}
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
                        <CartesianGrid strokeDasharray="3 3" stroke="#274b6b" opacity={0.4} />
                        <XAxis
                          dataKey="day"
                          stroke="#8fa9bd"
                          fontSize={11}
                          tickLine={false}
                          tickFormatter={(d) => `Día ${d}`}
                        />
                        <YAxis
                          stroke="#8fa9bd"
                          fontSize={11}
                          domain={['dataMin - 1', 'dataMax + 1']}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#102438',
                            borderColor: '#274b6b',
                            borderRadius: '0.75rem',
                            color: '#e6eef4',
                            fontSize: '12px',
                          }}
                          labelFormatter={(d) => `Misión Día ${d} (${filteredData.find((p) => p.day === d)?.dateStr})`}
                          formatter={(value: unknown) => [
                            `${value} ${activeMetricDef.unit}`,
                            activeMetricDef.name,
                          ]}
                        />
                        <ReferenceLine
                          y={activeMetricDef.nominalMin}
                          stroke="#5cc98b"
                          strokeDasharray="4 4"
                          strokeOpacity={0.6}
                        />
                        <ReferenceLine
                          y={activeMetricDef.nominalMax}
                          stroke="#5cc98b"
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
                          dot={{ fill: activeMetricDef.color, r: 3.5 }}
                          activeDot={{ r: 6 }}
                        />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
              </div>
            </div>
          </section>
        )}

        {/* VISTA GENERAL / GRID */}
        {selectedMetric === 'all' && (
          <section aria-label="Cuadrícula de tendencias">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold tracking-wide text-text">
                Visión panorámica de biomonitoreo ({timeRange === '7d' ? 'Últimos 7 días' : timeRange})
              </h2>
              <span className="text-xs text-mute">
                Mostrando {Object.values(visibleMetrics).filter(Boolean).length} indicadores activos
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {METRICS_CATALOG.filter((m) => visibleMetrics[m.id]).map((metric) => {
                const Icon = metric.icon
                const stats = computeStats(metric.id)
                const lastPoint = filteredData[filteredData.length - 1]

                return (
                  <article
                    key={metric.id}
                    onClick={() => {
                      setFocusedMetricId(metric.id)
                      setSelectedMetric(metric.id)
                    }}
                    className="group relative cursor-pointer rounded-2xl border border-edge bg-[#14283d] p-5 shadow-md transition-all hover:border-[#5cc98b]/60 hover:bg-[#17324c] hover:scale-[1.01]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl"
                          style={{ backgroundColor: `${metric.color}20`, color: metric.color }}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-text group-hover:text-[#5cc98b] transition-colors">
                            {metric.name}
                          </h3>
                          <span className="text-xs text-mute">{metric.shortName}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        title="Ver detalle ampliado"
                        className="rounded-lg p-1 text-mute opacity-0 transition-opacity group-hover:opacity-100 hover:bg-panel hover:text-text"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-4 flex items-baseline justify-between">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-display text-3xl font-bold tracking-tight text-text">
                          {metric.formatValue(stats.current, lastPoint)}
                        </span>
                      </div>

                      <div
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                          stats.trendDelta === 0
                            ? 'bg-panel text-mute'
                            : stats.isRising
                            ? 'bg-[#184840] text-[#5cc98b]'
                            : 'bg-[#2a2a1c] text-[#f2b544]'
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

                    <div className="mt-1 flex items-center justify-between text-[11px] text-mute">
                      <span>Rango seguro: {metric.safeLabel}</span>
                      <span>Promedio: {stats.avg} {metric.unit}</span>
                    </div>

                    <div className="mt-3 h-24 w-full rounded-lg bg-[#0c1e2f]/80 p-1.5">
                      <ResponsiveContainer width="100%" height="100%">
                        {metric.id === 'bp' ? (
                          <LineChart data={filteredData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                            <YAxis domain={[60, 140]} hide />
                            <Line
                              type="monotone"
                              dataKey="bpSys"
                              stroke="#f0645a"
                              strokeWidth={2}
                              dot={false}
                            />
                            <Line
                              type="monotone"
                              dataKey="bpDia"
                              stroke="#f2b544"
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

                    <div className="mt-3 flex items-center justify-between border-t border-edge/60 pt-2 text-[11px] text-mute">
                      <span className="truncate">{metric.nasaRisk}</span>
                      <span className="text-[#5cc98b] font-medium group-hover:underline">Detalles →</span>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        )}

        {/* Protocolo de Evaluación Offline */}
        <footer className="mt-6 rounded-2xl border border-edge/80 bg-panel/40 p-5 text-xs text-mute">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 shrink-0 text-[#5cc98b] mt-0.5" />
            <div>
              <h4 className="font-semibold text-text">Protocolo de Evaluación Offline (Contrato de Datos NASA / CSA)</h4>
              <p className="mt-1">
                Las tendencias mostradas se calculan localmente en la memoria de la nave espacial sin dependencia de estaciones de tierra. Cualquier desviación prolongada (p. ej. más de 3 días con sueño &lt; 6h o presión &gt; 135 mmHg) activará automáticamente una recomendación de mitigación en el panel diario de la tripulación.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}
