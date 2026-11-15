import { useId, useMemo, useState } from 'react'
import {
  ArrowRight,
  Compass,
  Gauge,
  Globe2,
  HeartPulse,
  Info,
  Moon,
  Radiation,
  RefreshCw,
  Rocket,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Wind,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { generateMissionTrends } from '../../data/mock'
import type { Indicator, Mission, MissionTrendPoint, Notice } from '../../types'

interface Props {
  mission?: Mission
  indicators?: Indicator[]
  notices?: Notice[]
  onNavigate?: (screen: string) => void
  onSave?: (mission: Mission) => void
}

type SimulationPhase = 'launch' | 'transit' | 'orbit' | 'return'

interface FlightPhaseConfig {
  id: SimulationPhase
  day: number
  name: string
  distanceEarthKm: number
  distanceTargetKm: number
  phaseProgress: number
  radiationDailyMsv: number
  readinessIndex: number
  description: string
}

const PHASES_CONFIG: FlightPhaseConfig[] = [
  {
    id: 'launch',
    day: 3,
    name: 'Órbita Terrestre Baja (LEO)',
    distanceEarthKm: 420,
    distanceTargetKm: 384000,
    phaseProgress: 2,
    radiationDailyMsv: 0.22,
    readinessIndex: 96,
    description: 'Inserción orbital y verificación de subsistemas primarios de soporte vital.',
  },
  {
    id: 'transit',
    day: 47,
    name: 'Tránsito Translunar (TLI Coast)',
    distanceEarthKm: 342800,
    distanceTargetKm: 41600,
    phaseProgress: 89,
    radiationDailyMsv: 0.38,
    readinessIndex: 88,
    description: 'Fase actual de crucero profundo fuera del campo geomagnético protector.',
  },
  {
    id: 'orbit',
    day: 65,
    name: 'Inserción en Órbita Lunar y EVA',
    distanceEarthKm: 384400,
    distanceTargetKm: 100,
    phaseProgress: 100,
    radiationDailyMsv: 0.44,
    readinessIndex: 84,
    description: 'Actividades extravehiculares de superficie y acoplamiento en órbita lunar.',
  },
  {
    id: 'return',
    day: 135,
    name: 'Trayectoria de Retorno a la Tierra',
    distanceEarthKm: 180000,
    distanceTargetKm: 180000,
    phaseProgress: 75,
    radiationDailyMsv: 0.35,
    readinessIndex: 90,
    description: 'Fase de retorno balístico y readaptación a gravedad progresiva.',
  },
]

export function MissionPage({ mission, onNavigate, onSave }: Props) {
  const currentDay = mission?.day ?? 47
  const cabinSimulationSelectId = useId()

  // Selección de fase simulada interactiva (por defecto 'transit' actual)
  const [selectedPhaseId, setSelectedPhaseId] = useState<SimulationPhase>('transit')
  const activePhase = PHASES_CONFIG.find((p) => p.id === selectedPhaseId) || PHASES_CONFIG[1]

  // Selector de métrica de tendencias simuladas de la misión
  const [trendMetric, setTrendMetric] = useState<'radiation' | 'atmosphere' | 'readiness'>('radiation')

  // Datos simulados de la misión para los 47 días
  const missionTrendsData: MissionTrendPoint[] = useMemo(() => {
    return generateMissionTrends(currentDay)
  }, [currentDay])

  // Telemetría ambiental de cabina interactiva
  const [cabinPressure, setCabinPressure] = useState(mission?.cabinPressureKpa ?? 101.3)
  const [cabinCo2, setCabinCo2] = useState(mission?.cabinCo2Percent ?? 0.32)
  const [cabinO2] = useState(mission?.cabinOxygenPercent ?? 20.9)
  const [cabinTemp] = useState(mission?.cabinTempCelsius ?? 21.4)

  // Radiación acumulada simulada
  const cumulativeRadiation = Number((activePhase.day * 0.358).toFixed(1))

  // Persistir cambios de misión si onSave disponible
  const handleSavePhase = () => {
    if (onSave && mission) {
      onSave({ ...mission, day: activePhase.day })
    }
  }

  return (
    <main className="min-w-0 px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Cabecera Principal */}
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#5cc98b]">
              <Compass className="h-3.5 w-3.5" />
              <span>Contexto de Navegación y Soporte Vital</span>
            </div>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-text sm:text-4xl">
              Misión Orbital: Día {activePhase.day}
            </h1>
            <p className="mt-1 text-sm text-mute">
              Monitoreo contextual de vuelo espacial, entorno de cabina (ECLSS) e índice de preparación biológica.
            </p>
          </div>

          {/* Accesos rápidos hacia Rutina y Chequeo */}
          {onNavigate && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('routine')}
                className="inline-flex items-center gap-2 rounded-xl border border-edge bg-panel px-3.5 py-2 text-xs font-semibold text-text transition-colors hover:border-[#5cc98b]/50 hover:bg-[#1c3f5e] cursor-pointer"
              >
                <span>Ver Rutina del Día</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#5cc98b]" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('check')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#5cc98b] px-3.5 py-2 text-xs font-bold text-[#0c1e2f] transition-transform hover:bg-[#6edba0] active:scale-95 cursor-pointer"
              >
                <span>Daily Check</span>
              </button>
            </div>
          )}
        </header>

        {/* =========================================================================
            SELECTOR INTERACTIVO DE FASE DE MISIÓN SIMULADA
           ========================================================================= */}
        <section
          aria-label="Selector de fase de misión"
          className="mb-8 rounded-2xl border border-edge bg-[#14283d] p-4 sm:p-5 shadow-lg shadow-black/20"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-edge/60 pb-4">
            <div>
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#5cc98b]">
                <Rocket className="h-3.5 w-3.5" />
                <span>Simulador de fase de vuelo orbital</span>
              </span>
              <p className="text-xs text-mute mt-0.5">
                Modifica interactivamente la fase de la misión para proyectar el estado de salud y entorno:
              </p>
            </div>

            {/* Píldoras de selección de fases */}
            <div className="inline-flex flex-wrap rounded-xl border border-edge bg-rail/80 p-1">
              {PHASES_CONFIG.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { setSelectedPhaseId(p.id); }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    selectedPhaseId === p.id
                      ? 'bg-[#184840] text-[#5cc98b] shadow-sm ring-1 ring-[#5cc98b]/40'
                      : 'text-mute hover:text-text'
                  }`}
                >
                  {p.name.split(' (')[0]}
                  {p.id === 'transit' && (
                    <span className="ml-1 rounded bg-[#5cc98b]/20 px-1 py-0.2 text-[10px] text-[#5cc98b]">
                      Actual
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tarjeta de estado de la fase activa */}
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Traectoria y distancias */}
            <div className="rounded-xl border border-edge/60 bg-rail/60 p-4">
              <div className="flex items-center justify-between text-xs text-mute">
                <span className="flex items-center gap-1.5 font-semibold uppercase text-text">
                  <Globe2 className="h-4 w-4 text-[#38bdf8]" />
                  <span>Trayectoria de Vuelo</span>
                </span>
                <span>{activePhase.phaseProgress}% hacia el objetivo</span>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <span className="text-[11px] text-mute">Distancia de la Tierra</span>
                  <p className="font-display text-2xl font-bold text-text">
                    {activePhase.distanceEarthKm.toLocaleString()} <span className="text-xs font-normal text-mute">km</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-mute">A la Luna</span>
                  <p className="font-display text-2xl font-bold text-[#5cc98b]">
                    {activePhase.distanceTargetKm.toLocaleString()} <span className="text-xs font-normal text-mute">km</span>
                  </p>
                </div>
              </div>

              {/* Barra de progreso orbital */}
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-panel">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#38bdf8] to-[#5cc98b] transition-all duration-700"
                  style={{ width: `${Math.max(5, activePhase.phaseProgress)}%` }}
                />
              </div>
            </div>

            {/* Dosimetría y exposición acumulada */}
            <div className="rounded-xl border border-edge/60 bg-rail/60 p-4">
              <div className="flex items-center justify-between text-xs text-mute">
                <span className="flex items-center gap-1.5 font-semibold uppercase text-text">
                  <Radiation className="h-4 w-4 text-[#facc15]" />
                  <span>Dosimetría de Radiación</span>
                </span>
                <span className="text-[#5cc98b] font-medium">Margen seguro</span>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <span className="text-[11px] text-mute">Dosis acumulada</span>
                  <p className="font-display text-2xl font-bold text-text">
                    {cumulativeRadiation} <span className="text-xs font-normal text-mute">mSv</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-mute">Presupuesto límite</span>
                  <p className="font-display text-xl font-bold text-mute">
                    / 100 <span className="text-xs font-normal text-mute">mSv</span>
                  </p>
                </div>
              </div>

              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-panel">
                <div
                  className="h-full rounded-full bg-[#facc15] transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.round((cumulativeRadiation / 100) * 100))}%` }}
                />
              </div>
            </div>

            {/* Índice de preparación de la tripulación */}
            <div className="rounded-xl border border-edge/60 bg-rail/60 p-4">
              <div className="flex items-center justify-between text-xs text-mute">
                <span className="flex items-center gap-1.5 font-semibold uppercase text-text">
                  <HeartPulse className="h-4 w-4 text-[#5cc98b]" />
                  <span>Readiness Index</span>
                </span>
                <span className="rounded bg-[#184840] px-2 py-0.5 text-[10px] font-bold text-[#5cc98b]">
                  Apto para vuelo
                </span>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <span className="text-[11px] text-mute">Capacidad operativa</span>
                  <p className="font-display text-2xl font-bold text-text">
                    {activePhase.readinessIndex}%
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-mute">Tripulantes</span>
                  <p className="font-display text-xl font-bold text-mute">
                    4 / 4 activos
                  </p>
                </div>
              </div>

              <p className="mt-2 text-xs text-mute truncate">
                {activePhase.description}
              </p>
            </div>
          </div>

          {/* Botón para guardar la fase seleccionada */}
          {onSave && (
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleSavePhase}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#5cc98b] px-4 py-2 text-xs font-bold text-[#0c1e2f] transition-transform hover:bg-[#6edba0] active:scale-95 cursor-pointer"
              >
                Aplicar fase como contexto de misión
              </button>
            </div>
          )}
        </section>

        {/* =========================================================================
            ESTADO DE SALUD DEL ASTRONAUTA CONTEXTUALIZADO AL DÍA DE MISIÓN
           ========================================================================= */}
        <section aria-label="Desglose de salud de la misión" className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold tracking-wide text-text">
              Contexto de Salud y Adaptación Fisiológica (Día {activePhase.day})
            </h2>
            <span className="text-xs text-mute">
              Correlación con el Contrato de Datos NASA / CSA
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* 1. Cardiovascular */}
            <div className="rounded-2xl border border-edge bg-[#14283d] p-5 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-mute">
                  Cardiovascular
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-[#5cc98b]">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Nominal</span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="font-display text-2xl font-bold text-text">128/82</span>
                <span className="text-xs text-mute">mmHg</span>
              </div>
              <p className="mt-1 text-xs text-mute">
                Adaptación normal al desplazamiento cefálico de fluidos en microgravedad.
              </p>
            </div>

            {/* 2. Músculo-esquelético */}
            <div className="rounded-2xl border border-notice-edge bg-[#14283d] p-5 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-mute">
                  Músculo / Hueso
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-watch">
                  <ShieldAlert className="h-4 w-4" />
                  <span>Atención</span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="font-display text-2xl font-bold text-watch">45 / 80</span>
                <span className="text-xs text-mute">min de carga</span>
              </div>
              <p className="mt-1 text-xs text-mute">
                Faltan 35 min para completar el protocolo diario de protección ósea ARED.
              </p>
            </div>

            {/* 3. Neuro-conductual & Sueño */}
            <div className="rounded-2xl border border-notice-edge bg-[#14283d] p-5 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-mute">
                  Descanso & Fatiga
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-watch">
                  <Moon className="h-4 w-4" />
                  <span>Vigilancia</span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="font-display text-2xl font-bold text-watch">5.8</span>
                <span className="text-xs text-mute">h descanso (-2.2h deuda)</span>
              </div>
              <p className="mt-1 text-xs text-mute">
                3 noches cortas acumuladas; requiere ajuste circadiano en rutina.
              </p>
            </div>

            {/* 4. Soporte Vital Cabina */}
            <div className="rounded-2xl border border-edge bg-[#14283d] p-5 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-mute">
                  Atmósfera ECLSS
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-[#5cc98b]">
                  <Wind className="h-4 w-4" />
                  <span>Óptimo</span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="font-display text-2xl font-bold text-text">{cabinPressure}</span>
                <span className="text-xs text-mute">kPa / {cabinCo2}% CO2</span>
              </div>
              <p className="mt-1 text-xs text-mute">
                Filtros de regeneración de aire operando en parámetros ideales de cabina.
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================================
            TENDENCIAS DE MISIONES SIMULADAS (GRÁFICAS DE TRAYECTORIA Y AMBIENTE)
           ========================================================================= */}
        <section
          aria-label="Tendencias de misiones simuladas"
          className="mb-8 rounded-2xl border border-edge bg-[#14283d] p-5 sm:p-6 shadow-xl"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-edge/60 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#5cc98b]" />
                <h2 className="font-display text-xl font-bold text-text">
                  Tendencias de Misión Simulada (Días 1 a {currentDay})
                </h2>
              </div>
              <p className="mt-0.5 text-xs text-mute">
                Evolución proyectada de la misión lunar: radiación acumulada, atmósfera y preparación física.
              </p>
            </div>

            {/* Selector de gráfico de tendencias de misión */}
            <div className="inline-flex rounded-xl border border-edge bg-rail/80 p-1">
              <button
                type="button"
                onClick={() => setTrendMetric('radiation')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  trendMetric === 'radiation'
                    ? 'bg-[#184840] text-[#5cc98b] shadow-sm'
                    : 'text-mute hover:text-text'
                }`}
              >
                Radiación (mSv)
              </button>
              <button
                type="button"
                onClick={() => setTrendMetric('atmosphere')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  trendMetric === 'atmosphere'
                    ? 'bg-[#184840] text-[#5cc98b] shadow-sm'
                    : 'text-mute hover:text-text'
                }`}
              >
                Presión & CO2
              </button>
              <button
                type="button"
                onClick={() => setTrendMetric('readiness')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  trendMetric === 'readiness'
                    ? 'bg-[#184840] text-[#5cc98b] shadow-sm'
                    : 'text-mute hover:text-text'
                }`}
              >
                Readiness Index (%)
              </button>
            </div>
          </div>

          {/* Gráfico interactivo */}
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs text-mute">
              <span>Serie temporal por día de vuelo (Día 1 a Día {currentDay})</span>
              <span className="text-[#5cc98b] font-medium">Línea de tendencia de telemetría orbital</span>
            </div>

            <div className="h-72 w-full rounded-xl border border-edge/70 bg-[#0c1e2f] p-3 sm:p-4">
              <ResponsiveContainer width="100%" height="100%">
                {trendMetric === 'radiation' ? (
                  <AreaChart data={missionTrendsData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="grad-rad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#facc15" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#facc15" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#274b6b" opacity={0.4} />
                    <XAxis
                      dataKey="day"
                      stroke="#8fa9bd"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(d) => `D${d}`}
                    />
                    <YAxis stroke="#8fa9bd" fontSize={11} domain={[0, 25]} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#102438',
                        borderColor: '#274b6b',
                        borderRadius: '0.75rem',
                        color: '#e6eef4',
                        fontSize: '12px',
                      }}
                      labelFormatter={(d) => `Día de Misión ${d} (${missionTrendsData.find((p) => p.day === d)?.dateStr})`}
                      formatter={(v: unknown) => [`${v} mSv`, 'Radiación Acumulada']}
                    />
                    <ReferenceLine y={20} stroke="#f2b544" strokeDasharray="3 3" label={{ value: 'Alerta preliminar (20 mSv)', fill: '#f2b544', fontSize: 10 }} />
                    <Area
                      type="monotone"
                      dataKey="cumulativeRadiationMsv"
                      stroke="#facc15"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#grad-rad)"
                      dot={{ fill: '#facc15', r: 3 }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                ) : trendMetric === 'atmosphere' ? (
                  <LineChart data={missionTrendsData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#274b6b" opacity={0.4} />
                    <XAxis
                      dataKey="day"
                      stroke="#8fa9bd"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(d) => `D${d}`}
                    />
                    <YAxis stroke="#8fa9bd" fontSize={11} domain={[100, 102.5]} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#102438',
                        borderColor: '#274b6b',
                        borderRadius: '0.75rem',
                        color: '#e6eef4',
                        fontSize: '12px',
                      }}
                      labelFormatter={(d) => `Día de Misión ${d}`}
                    />
                    <ReferenceLine y={101.3} stroke="#5cc98b" strokeDasharray="3 3" />
                    <Line
                      type="monotone"
                      name="Presión de Cabina (kPa)"
                      dataKey="cabinPressureKpa"
                      stroke="#38bdf8"
                      strokeWidth={2.5}
                      dot={false}
                    />
                  </LineChart>
                ) : (
                  <AreaChart data={missionTrendsData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="grad-readiness" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5cc98b" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#5cc98b" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#274b6b" opacity={0.4} />
                    <XAxis
                      dataKey="day"
                      stroke="#8fa9bd"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(d) => `D${d}`}
                    />
                    <YAxis stroke="#8fa9bd" fontSize={11} domain={[70, 100]} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#102438',
                        borderColor: '#274b6b',
                        borderRadius: '0.75rem',
                        color: '#e6eef4',
                        fontSize: '12px',
                      }}
                      labelFormatter={(d) => `Día de Misión ${d}`}
                      formatter={(v: unknown) => [`${v}%`, 'Readiness Index']}
                    />
                    <ReferenceLine y={85} stroke="#f2b544" strokeDasharray="3 3" />
                    <Area
                      type="monotone"
                      dataKey="readinessIndex"
                      stroke="#5cc98b"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#grad-readiness)"
                      dot={{ fill: '#5cc98b', r: 3 }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* =========================================================================
            TELEMETRÍA AMBIENTAL INTERACTIVA DE CABINA (ECLSS)
           ========================================================================= */}
        <section aria-label="Soporte vital y telemetría de cabina" className="mb-8">
          <div className="rounded-2xl border border-edge bg-[#14283d] p-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-edge/60 pb-3">
              <div className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-[#38bdf8]" />
                <h3 className="font-display text-lg font-bold text-text">
                  Controles de Entorno y Soporte Vital (ECLSS)
                </h3>
              </div>
              <span className="text-xs text-mute">Cabina Presurizada Orion / Gateway</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-edge/60 bg-rail/60 p-3.5">
                <span className="text-xs text-mute">Presión Atmosférica</span>
                <p className="mt-1 font-display text-xl font-bold text-text">
                  {cabinPressure} kPa
                </p>
                <span className="text-[11px] text-[#5cc98b]">Nominal (101.3 ± 1.0)</span>
              </div>

              <div className="rounded-xl border border-edge/60 bg-rail/60 p-3.5">
                <span className="text-xs text-mute">Oxígeno (O2)</span>
                <p className="mt-1 font-display text-xl font-bold text-text">
                  {cabinO2}%
                </p>
                <span className="text-[11px] text-[#5cc98b]">Nivel a nivel del mar</span>
              </div>

              <div className="rounded-xl border border-edge/60 bg-rail/60 p-3.5">
                <span className="text-xs text-mute">Dióxido de Carbono (CO2)</span>
                <p className="mt-1 font-display text-xl font-bold text-text">
                  {cabinCo2}%
                </p>
                <span className="text-[11px] text-[#5cc98b]">&lt; 0.40% Límite seguro</span>
              </div>

              <div className="rounded-xl border border-edge/60 bg-rail/60 p-3.5">
                <span className="text-xs text-mute">Temperatura Ambiental</span>
                <p className="mt-1 font-display text-xl font-bold text-text">
                  {cabinTemp} °C
                </p>
                <span className="text-[11px] text-[#5cc98b]">Confort térmico</span>
              </div>
            </div>

            {/* Controles de ajuste de simulación para pruebas en cabina */}
            <div className="mt-4 rounded-xl border border-edge/60 bg-[#0c1e2f] p-3.5 text-xs text-mute">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-semibold text-text">
                  Simulación de fluctuación de presión de cabina para entrenamiento:
                </span>
                <div className="flex items-center gap-2">
                  <label htmlFor={cabinSimulationSelectId} className="sr-only">
                    Nivel de presión de cabina
                  </label>
                  <select
                    id={cabinSimulationSelectId}
                    value={cabinPressure}
                    onChange={(e) => setCabinPressure(Number(e.target.value))}
                    className="rounded-lg border border-edge bg-panel px-3 py-1.5 text-xs font-medium text-text focus:outline-none cursor-pointer"
                  >
                    <option value={101.3}>Estándar (101.3 kPa - 1 atm)</option>
                    <option value={98.5}>Despresurización leve (98.5 kPa)</option>
                    <option value={102.2}>Sobrepresión controlada (102.2 kPa)</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      setCabinPressure(101.3)
                      setCabinCo2(0.32)
                    }}
                    title="Restablecer parámetros nominales"
                    className="rounded-lg border border-edge p-1.5 text-mute hover:border-[#5cc98b] hover:text-text cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pie de página */}
        <footer className="mt-10 rounded-2xl border border-edge/70 bg-panel/30 p-4 text-xs text-mute flex items-start gap-3">
          <Info className="h-4 w-4 shrink-0 text-[#5cc98b] mt-0.5" />
          <p>
            El módulo Mission provee contexto general de la travesía cósmica y no duplica los registros biométricos individuales del Daily Check, garantizando coherencia en la telemetría offline de la nave.
          </p>
        </footer>
      </div>
    </main>
  )
}
