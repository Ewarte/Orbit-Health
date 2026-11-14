import { useEffect, useState } from 'react'
import {
  Activity,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Database,
  Droplets,
  HardDriveDownload,
  Heart,
  History,
  Moon,
  RotateCcw,
  SlidersHorizontal,
  Smile,
  Thermometer,
  TrendingUp,
  X,
} from 'lucide-react'
import type { Mission } from '../../types'

export interface DailyMetrics {
  bloodPressureSys: number
  bloodPressureDia: number
  heartRate: number
  bloodSugar: number
  bodyTemperature: number
  sleepHours: number
  mood: 'Bad' | 'Fair' | 'Neutral' | 'Good' | 'Great'
}

export interface SavedRecord {
  id: string
  timestamp: string
  timeStr: string
  dateStr: string
  metrics: DailyMetrics
  notes?: string
}

interface Props {
  mission?: Mission
  onComplete?: (metrics: DailyMetrics) => void
  onNavigate?: (screen: string) => void
}

const STORAGE_KEY = 'orbit_health_daily_records'

export function DailyCheckPage({ mission, onComplete, onNavigate }: Props) {
  // Estado inicial acorde a la imagen de referencia
  const [metrics, setMetrics] = useState<DailyMetrics>(() => {
    try {
      const saved = localStorage.getItem('orbit_health_current_metrics')
      if (saved) return JSON.parse(saved)
    } catch {
      // fallback
    }
    return {
      bloodPressureSys: 128,
      bloodPressureDia: 82,
      heartRate: 64,
      bloodSugar: 96,
      bodyTemperature: 36.7,
      sleepHours: 5.2,
      mood: 'Good',
    }
  })

  const [savedRecords, setSavedRecords] = useState<SavedRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch {
      // fallback
    }
    return [
      {
        id: 'rec-init-01',
        timestamp: new Date().toISOString(),
        dateStr: 'Nov 14, 2026',
        timeStr: '07:10',
        metrics: {
          bloodPressureSys: 128,
          bloodPressureDia: 82,
          heartRate: 64,
          bloodSugar: 96,
          bodyTemperature: 36.7,
          sleepHours: 5.2,
          mood: 'Good',
        },
      },
    ]
  })

  const [isCompleted, setIsCompleted] = useState(true)
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [lastSavedTime, setLastSavedTime] = useState('07:10')
  const [notification, setNotification] = useState<string | null>(null)

  // Asistente temporal de edición
  const [tempMetrics, setTempMetrics] = useState<DailyMetrics>(metrics)

  // Guardar en localStorage cada vez que cambien los registros
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedRecords))
      localStorage.setItem('orbit_health_current_metrics', JSON.stringify(metrics))
    } catch {
      // ignore in incognito or restricted mode
    }
  }, [savedRecords, metrics])

  // Desvanecer notificación tras 4 segundos
  useEffect(() => {
    if (!notification) return
    const timer = setTimeout(() => setNotification(null), 4000)
    return () => clearTimeout(timer)
  }, [notification])

  const openAssistant = (stepIndex = 0) => {
    setTempMetrics({ ...metrics })
    setCurrentStep(stepIndex)
    setIsAssistantOpen(true)
  }

  // Función principal para REGISTRAR TODOS LOS DATOS
  const handleRegisterAllData = () => {
    const now = new Date()
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const formattedTime = `${hours}:${minutes}`

    const newRecord: SavedRecord = {
      id: `rec-${Date.now()}`,
      timestamp: now.toISOString(),
      dateStr: 'Nov 14, 2026',
      timeStr: formattedTime,
      metrics: { ...metrics },
    }

    setSavedRecords((prev) => [newRecord, ...prev])
    setLastSavedTime(formattedTime)
    setIsCompleted(true)
    setNotification(
      `¡Datos registrados! Se guardaron exitosamente los 6 indicadores de salud en la telemetría local (${formattedTime}).`
    )

    if (onComplete) {
      onComplete(metrics)
    }
  }

  const handleSaveAssistant = () => {
    setMetrics(tempMetrics)
    setIsCompleted(true)
    setIsAssistantOpen(false)

    const now = new Date()
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const formattedTime = `${hours}:${minutes}`

    const newRecord: SavedRecord = {
      id: `rec-${Date.now()}`,
      timestamp: now.toISOString(),
      dateStr: 'Nov 14, 2026',
      timeStr: formattedTime,
      metrics: { ...tempMetrics },
    }

    setSavedRecords((prev) => [newRecord, ...prev])
    setLastSavedTime(formattedTime)
    setNotification(
      `¡Chequeo completado y registrado! Telemetría actualizada en el almacenamiento de la nave (${formattedTime}).`
    )

    if (onComplete) {
      onComplete(tempMetrics)
    }
  }

  const steps = [
    {
      id: 'bp',
      name: 'Blood pressure',
      icon: Heart,
      unit: 'mmHg',
      description: 'Record your systolic and diastolic pressure via cabin arm cuff.',
    },
    {
      id: 'hr',
      name: 'Heart rate',
      icon: Activity,
      unit: 'bpm',
      description: 'Resting pulse measured by bio-monitor telemetry.',
    },
    {
      id: 'glucose',
      name: 'Blood sugar',
      icon: Droplets,
      unit: 'mg/dL',
      description: 'Capillary glucose level before daily caloric intake.',
    },
    {
      id: 'temp',
      name: 'Body temperature',
      icon: Thermometer,
      unit: '°C',
      description: 'Core tympanic body temperature.',
    },
    {
      id: 'sleep',
      name: 'Sleep',
      icon: Moon,
      unit: 'hours',
      description: 'Total duration of rest in acoustic sleeping quarters.',
    },
    {
      id: 'mood',
      name: 'Mood',
      icon: Smile,
      unit: 'state',
      description: 'Cognitive and psychological self-assessment.',
    },
  ]

  const missionPlace = mission?.place ?? 'Lunar transit'
  const displayLastCheck = lastSavedTime || mission?.lastCheck || '07:10'

  return (
    <main className="min-w-0 px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Notificación flotante de confirmación de registro */}
        {notification && (
          <div
            role="status"
            className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-[#5cc98b] bg-[#12362c] px-4 py-3 text-sm font-medium text-[#5cc98b] shadow-xl animate-in fade-in slide-in-from-top-2"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 shrink-0 stroke-[2.5]" />
              <span>{notification}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="rounded p-1 text-[#5cc98b] hover:bg-[#184840]"
              aria-label="Cerrar notificación"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Encabezado superior */}
        <header className="mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-text sm:text-4xl">
              Daily check
            </h1>
          </div>
          <div className="flex items-center gap-3 text-right text-sm text-mute">
            <span>
              {missionPlace}, last check <span className="text-text font-medium">{displayLastCheck}</span>
            </span>
          </div>
        </header>

        {/* Tarjeta de Resumen / Estado Hero */}
        <section
          aria-label="Daily check status"
          className="relative mb-8 overflow-hidden rounded-2xl border border-edge bg-[#14283d] p-5 sm:p-6 shadow-lg shadow-black/20"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4 sm:gap-5">
              {/* Círculo verde con checkmark */}
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#184840] text-[#5cc98b] ring-2 ring-[#2d7d6b]/50"
                aria-hidden="true"
              >
                <Check className="h-8 w-8 stroke-[3]" />
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight text-text sm:text-2xl">
                  {isCompleted ? 'All good today!' : 'Check pending'}
                </h2>
                <p className="mt-0.5 text-sm text-mute sm:text-base">
                  {isCompleted
                    ? 'You completed your daily check'
                    : 'Record your 6 daily parameters to update telemetry'}
                </p>
              </div>
            </div>

            {/* Píldora de fecha y botones de acceso */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 sm:justify-end">
              <div className="inline-flex items-center gap-2 rounded-full border border-edge bg-rail/80 px-4 py-1.5 text-sm font-medium text-text backdrop-blur-sm">
                <Calendar className="h-4 w-4 text-[#5cc98b]" />
                <span>Nov 14, 2026</span>
              </div>

              {savedRecords.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(true)}
                  title="Ver registros guardados"
                  className="inline-flex items-center gap-1.5 rounded-full border border-edge bg-rail/90 px-3.5 py-1.5 text-xs font-medium text-mute transition-colors hover:border-[#5cc98b]/50 hover:text-text cursor-pointer"
                >
                  <History className="h-3.5 w-3.5 text-[#5cc98b]" />
                  <span>Historial ({savedRecords.length})</span>
                </button>
              )}

              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('trends')}
                  title="Ver tendencias y gráficos de salud"
                  className="inline-flex items-center gap-1.5 rounded-full border border-edge bg-rail/90 px-3.5 py-1.5 text-xs font-medium text-mute transition-colors hover:border-[#5cc98b]/50 hover:text-text cursor-pointer"
                >
                  <TrendingUp className="h-3.5 w-3.5 text-[#5cc98b]" />
                  <span>Tendencias (7d)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => openAssistant(0)}
                title="Edit readings"
                className="inline-flex items-center gap-1.5 rounded-full border border-edge bg-panel px-3 py-1.5 text-xs font-medium text-mute transition-colors hover:border-[#5cc98b]/50 hover:text-text cursor-pointer sm:hidden"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Edit</span>
              </button>
            </div>
          </div>
        </section>

        {/* Sección: Check your health */}
        <section aria-label="Health check metrics" className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold tracking-wide text-text">
              Check your health
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openAssistant(0)}
                className="hidden items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-mute transition-colors hover:text-text cursor-pointer sm:inline-flex"
              >
                <RotateCcw className="h-3.5 w-3.5 text-[#5cc98b]" />
                <span>Modificar valores</span>
              </button>
            </div>
          </div>

          {/* Grilla 3x2 de tarjetas */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {/* 1. Blood pressure */}
            <article
              onClick={() => openAssistant(0)}
              className="group relative cursor-pointer rounded-xl border border-edge bg-[#14283d] p-5 transition-all hover:border-[#5cc98b]/60 hover:bg-[#17324c]"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#184840]/60 text-[#5cc98b]">
                    <Heart className="h-5 w-5 fill-[#5cc98b]/20" />
                  </div>
                  <span className="text-sm font-medium text-mute group-hover:text-text">
                    Blood pressure
                  </span>
                </div>
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#184840] text-[#5cc98b]">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </div>
              </div>

              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="font-display text-2xl font-bold tracking-tight text-text sm:text-3xl">
                  {metrics.bloodPressureSys} / {metrics.bloodPressureDia}
                </span>
                <span className="text-sm font-normal text-mute">mmHg</span>
              </div>
            </article>

            {/* 2. Heart rate */}
            <article
              onClick={() => openAssistant(1)}
              className="group relative cursor-pointer rounded-xl border border-edge bg-[#14283d] p-5 transition-all hover:border-[#5cc98b]/60 hover:bg-[#17324c]"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#184840]/60 text-[#5cc98b]">
                    <Activity className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-mute group-hover:text-text">
                    Heart rate
                  </span>
                </div>
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#184840] text-[#5cc98b]">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </div>
              </div>

              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="font-display text-2xl font-bold tracking-tight text-text sm:text-3xl">
                  {metrics.heartRate}
                </span>
                <span className="text-sm font-normal text-mute">bpm</span>
              </div>
            </article>

            {/* 3. Blood sugar */}
            <article
              onClick={() => openAssistant(2)}
              className="group relative cursor-pointer rounded-xl border border-edge bg-[#14283d] p-5 transition-all hover:border-[#5cc98b]/60 hover:bg-[#17324c]"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#184840]/60 text-[#5cc98b]">
                    <Droplets className="h-5 w-5 fill-[#5cc98b]/20" />
                  </div>
                  <span className="text-sm font-medium text-mute group-hover:text-text">
                    Blood sugar
                  </span>
                </div>
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#184840] text-[#5cc98b]">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </div>
              </div>

              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="font-display text-2xl font-bold tracking-tight text-text sm:text-3xl">
                  {metrics.bloodSugar}
                </span>
                <span className="text-sm font-normal text-mute">mg/dL</span>
              </div>
            </article>

            {/* 4. Body temperature */}
            <article
              onClick={() => openAssistant(3)}
              className="group relative cursor-pointer rounded-xl border border-edge bg-[#14283d] p-5 transition-all hover:border-[#5cc98b]/60 hover:bg-[#17324c]"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#184840]/60 text-[#5cc98b]">
                    <Thermometer className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-mute group-hover:text-text">
                    Body temperature
                  </span>
                </div>
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#184840] text-[#5cc98b]">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </div>
              </div>

              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="font-display text-2xl font-bold tracking-tight text-text sm:text-3xl">
                  {metrics.bodyTemperature.toFixed(1)}
                </span>
                <span className="text-sm font-normal text-mute">°C</span>
              </div>
            </article>

            {/* 5. Sleep */}
            <article
              onClick={() => openAssistant(4)}
              className="group relative cursor-pointer rounded-xl border border-edge bg-[#14283d] p-5 transition-all hover:border-[#5cc98b]/60 hover:bg-[#17324c]"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#184840]/60 text-[#5cc98b]">
                    <Moon className="h-5 w-5 fill-[#5cc98b]/20" />
                  </div>
                  <span className="text-sm font-medium text-mute group-hover:text-text">
                    Sleep
                  </span>
                </div>
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#184840] text-[#5cc98b]">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </div>
              </div>

              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="font-display text-2xl font-bold tracking-tight text-text sm:text-3xl">
                  {metrics.sleepHours}
                </span>
                <span className="text-sm font-normal text-mute">hours</span>
              </div>
            </article>

            {/* 6. Mood */}
            <article
              onClick={() => openAssistant(5)}
              className="group relative cursor-pointer rounded-xl border border-edge bg-[#14283d] p-5 transition-all hover:border-[#5cc98b]/60 hover:bg-[#17324c]"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#184840]/60 text-[#5cc98b]">
                    <Smile className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-mute group-hover:text-text">
                    Mood
                  </span>
                </div>
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#184840] text-[#5cc98b]">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </div>
              </div>

              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="font-display text-2xl font-bold tracking-tight text-text sm:text-3xl">
                  {metrics.mood}
                </span>
              </div>
            </article>
          </div>
        </section>

        {/* ÁREA DE ACCIÓN: BOTÓN PARA REGISTRAR TODOS LOS DATOS GUARDADOS */}
        <section className="mt-8 flex flex-col gap-3 sm:flex-row">
          {/* Botón principal: Registrar todos los datos */}
          <button
            type="button"
            onClick={handleRegisterAllData}
            className="group flex flex-1 items-center justify-center gap-3 rounded-xl border-2 border-[#5cc98b] bg-[#143734]/50 px-6 py-4 text-base font-bold text-[#5cc98b] shadow-lg shadow-black/20 transition-all hover:bg-[#143734]/80 hover:shadow-[#5cc98b]/20 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <HardDriveDownload className="h-5 w-5 stroke-[2.5] transition-transform group-hover:translate-y-0.5" />
            <span>Registrar todos los datos guardados</span>
          </button>

          {/* Botón secundario: Estado completado / Asistente */}
          <button
            type="button"
            onClick={() => openAssistant(0)}
            className="flex items-center justify-center gap-2 rounded-xl border border-edge bg-[#14283d] px-5 py-4 text-sm font-semibold text-text transition-all hover:border-[#5cc98b]/60 hover:bg-[#17324c] cursor-pointer"
          >
            <CheckCircle2 className="h-5 w-5 text-[#5cc98b]" />
            <span>Daily check completed</span>
          </button>

          {/* Botón terciario: Ver tendencias */}
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('trends')}
              className="flex items-center justify-center gap-2 rounded-xl border border-edge bg-[#14283d] px-5 py-4 text-sm font-semibold text-text transition-all hover:border-[#5cc98b]/60 hover:bg-[#17324c] cursor-pointer"
            >
              <TrendingUp className="h-5 w-5 text-[#5cc98b]" />
              <span>Ver tendencias (7d)</span>
            </button>
          )}
        </section>
      </div>

      {/* Modal / Historial de registros guardados */}
      {showHistoryModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-2xl rounded-2xl border border-edge bg-[#102438] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-edge pb-4">
              <div className="flex items-center gap-2.5">
                <Database className="h-5 w-5 text-[#5cc98b]" />
                <h3 className="font-display text-xl font-bold text-text">
                  Registros de Telemetría Guardados ({savedRecords.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="rounded-lg p-1 text-mute hover:bg-panel hover:text-text cursor-pointer"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 max-h-96 overflow-y-auto space-y-3 pr-1">
              {savedRecords.map((rec) => (
                <div
                  key={rec.id}
                  className="rounded-xl border border-edge bg-[#14283d] p-4 text-sm"
                >
                  <div className="flex items-center justify-between border-b border-edge/60 pb-2 mb-2">
                    <span className="font-semibold text-text">
                      {rec.dateStr} — {rec.timeStr}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-[#184840] px-2 py-0.5 text-xs font-medium text-[#5cc98b]">
                      <Check className="h-3 w-3 stroke-[3]" /> Guardado local
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-mute">
                    <div>
                      Presión: <span className="text-text font-medium">{rec.metrics.bloodPressureSys}/{rec.metrics.bloodPressureDia} mmHg</span>
                    </div>
                    <div>
                      Frec. Cardíaca: <span className="text-text font-medium">{rec.metrics.heartRate} bpm</span>
                    </div>
                    <div>
                      Glucosa: <span className="text-text font-medium">{rec.metrics.bloodSugar} mg/dL</span>
                    </div>
                    <div>
                      Temperatura: <span className="text-text font-medium">{rec.metrics.bodyTemperature.toFixed(1)} °C</span>
                    </div>
                    <div>
                      Sueño: <span className="text-text font-medium">{rec.metrics.sleepHours} hrs</span>
                    </div>
                    <div>
                      Ánimo: <span className="text-text font-medium">{rec.metrics.mood}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-end border-t border-edge pt-4">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="rounded-lg bg-panel px-4 py-2 text-sm font-semibold text-text hover:bg-edge cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Asistente interactivo de 6 pasos para registro en cabina */}
      {isAssistantOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-lg rounded-2xl border border-edge bg-[#102438] p-6 shadow-2xl">
            {/* Cabecera del modal */}
            <div className="flex items-center justify-between border-b border-edge pb-4">
              <div className="flex items-center gap-2">
                <span className="rounded bg-[#184840] px-2 py-0.5 text-xs font-semibold uppercase text-[#5cc98b]">
                  Paso {currentStep + 1} de {steps.length}
                </span>
                <span className="text-xs text-mute">Telemetría Offline</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAssistantOpen(false)}
                className="rounded-lg p-1 text-mute transition-colors hover:bg-panel hover:text-text cursor-pointer"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Contenido del paso actual */}
            <div className="py-6">
              <div className="flex items-center gap-3">
                {(() => {
                  const CurrentIcon = steps[currentStep].icon
                  return (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#184840] text-[#5cc98b]">
                      <CurrentIcon className="h-6 w-6" />
                    </div>
                  )
                })()}
                <div>
                  <h3 className="font-display text-2xl font-bold text-text">
                    {steps[currentStep].name}
                  </h3>
                  <p className="text-xs text-mute">{steps[currentStep].description}</p>
                </div>
              </div>

              {/* Controles de entrada según el paso */}
              <div className="mt-6 rounded-xl border border-edge bg-panel/60 p-5">
                {currentStep === 0 && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold uppercase text-mute">
                        Presión Sistólica (mmHg)
                      </label>
                      <div className="mt-1 flex items-center gap-3">
                        <input
                          type="range"
                          min={90}
                          max={160}
                          value={tempMetrics.bloodPressureSys}
                          onChange={(e) =>
                            setTempMetrics({
                              ...tempMetrics,
                              bloodPressureSys: Number(e.target.value),
                            })
                          }
                          className="h-2 w-full cursor-pointer accent-[#5cc98b]"
                        />
                        <span className="w-16 font-display text-xl font-bold text-text">
                          {tempMetrics.bloodPressureSys}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase text-mute">
                        Presión Diastólica (mmHg)
                      </label>
                      <div className="mt-1 flex items-center gap-3">
                        <input
                          type="range"
                          min={60}
                          max={100}
                          value={tempMetrics.bloodPressureDia}
                          onChange={(e) =>
                            setTempMetrics({
                              ...tempMetrics,
                              bloodPressureDia: Number(e.target.value),
                            })
                          }
                          className="h-2 w-full cursor-pointer accent-[#5cc98b]"
                        />
                        <span className="w-16 font-display text-xl font-bold text-text">
                          {tempMetrics.bloodPressureDia}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 1 && (
                  <div>
                    <label className="text-xs font-semibold uppercase text-mute">
                      Frecuencia Cardíaca en Reposo (bpm)
                    </label>
                    <div className="mt-2 flex items-center gap-3">
                      <input
                        type="range"
                        min={45}
                        max={140}
                        value={tempMetrics.heartRate}
                        onChange={(e) =>
                          setTempMetrics({
                            ...tempMetrics,
                            heartRate: Number(e.target.value),
                          })
                        }
                        className="h-2 w-full cursor-pointer accent-[#5cc98b]"
                      />
                      <span className="w-16 font-display text-2xl font-bold text-text">
                        {tempMetrics.heartRate}
                      </span>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div>
                    <label className="text-xs font-semibold uppercase text-mute">
                      Nivel de Glucosa (mg/dL)
                    </label>
                    <div className="mt-2 flex items-center gap-3">
                      <input
                        type="range"
                        min={70}
                        max={180}
                        value={tempMetrics.bloodSugar}
                        onChange={(e) =>
                          setTempMetrics({
                            ...tempMetrics,
                            bloodSugar: Number(e.target.value),
                          })
                        }
                        className="h-2 w-full cursor-pointer accent-[#5cc98b]"
                      />
                      <span className="w-16 font-display text-2xl font-bold text-text">
                        {tempMetrics.bloodSugar}
                      </span>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div>
                    <label className="text-xs font-semibold uppercase text-mute">
                      Temperatura Corporal (°C)
                    </label>
                    <div className="mt-2 flex items-center gap-3">
                      <input
                        type="range"
                        min={35.0}
                        max={39.5}
                        step={0.1}
                        value={tempMetrics.bodyTemperature}
                        onChange={(e) =>
                          setTempMetrics({
                            ...tempMetrics,
                            bodyTemperature: Number(e.target.value),
                          })
                        }
                        className="h-2 w-full cursor-pointer accent-[#5cc98b]"
                      />
                      <span className="w-16 font-display text-2xl font-bold text-text">
                        {tempMetrics.bodyTemperature.toFixed(1)}
                      </span>
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div>
                    <label className="text-xs font-semibold uppercase text-mute">
                      Horas de Sueño (horas)
                    </label>
                    <div className="mt-2 flex items-center gap-3">
                      <input
                        type="range"
                        min={2.0}
                        max={10.0}
                        step={0.1}
                        value={tempMetrics.sleepHours}
                        onChange={(e) =>
                          setTempMetrics({
                            ...tempMetrics,
                            sleepHours: Number(e.target.value),
                          })
                        }
                        className="h-2 w-full cursor-pointer accent-[#5cc98b]"
                      />
                      <span className="w-16 font-display text-2xl font-bold text-text">
                        {tempMetrics.sleepHours}
                      </span>
                    </div>
                  </div>
                )}

                {currentStep === 5 && (
                  <div>
                    <label className="text-xs font-semibold uppercase text-mute">
                      Estado de Ánimo / Cognitivo
                    </label>
                    <div className="mt-3 grid grid-cols-5 gap-2">
                      {(['Bad', 'Fair', 'Neutral', 'Good', 'Great'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setTempMetrics({ ...tempMetrics, mood: m })}
                          className={`rounded-lg border py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                            tempMetrics.mood === m
                              ? 'border-[#5cc98b] bg-[#184840] text-[#5cc98b]'
                              : 'border-edge bg-panel/40 text-mute hover:border-text/40'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Navegación del modal */}
            <div className="flex items-center justify-between border-t border-edge pt-4">
              <button
                type="button"
                disabled={currentStep === 0}
                onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-edge px-3 py-2 text-sm text-mute transition-colors hover:text-text disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Anterior</span>
              </button>

              {currentStep < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#184840] px-4 py-2 text-sm font-semibold text-[#5cc98b] hover:bg-[#1d5950] cursor-pointer"
                >
                  <span>Siguiente paso</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveAssistant}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#5cc98b] px-5 py-2 text-sm font-bold text-[#0c1e2f] hover:bg-[#6edba0] cursor-pointer"
                >
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span>Guardar y registrar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}


