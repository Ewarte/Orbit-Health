import { useEffect, useId, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  Dumbbell,
  Filter,
  Flame,
  Info,
  Moon,
  Plus,
  RefreshCw,
  Sparkles,
  Utensils,
  Wrench,
  X,
} from 'lucide-react'
import { defaultRoutineTasks } from '../../data/mock'
import type { Indicator, Mission, Notice, RoutineCategory, RoutineTask } from '../../types'

const STORAGE_KEY = 'orbit_health_routine_tasks'

interface Props {
  mission?: Mission
  indicators?: Indicator[]
  notices?: Notice[]
  onNavigate?: (screen: string) => void
}

const CATEGORY_CONFIG: Record<
  RoutineCategory,
  { label: string; icon: typeof Activity; color: string; bg: string }
> = {
  exercise: {
    label: 'Contramedida Física',
    icon: Dumbbell,
    color: '#5cc98b',
    bg: '#184840',
  },
  medical: {
    label: 'Telemetría Médica',
    icon: Activity,
    color: '#38bdf8',
    bg: '#0f3a4d',
  },
  nutrition: {
    label: 'Nutrición & Hidratación',
    icon: Utensils,
    color: '#fb923c',
    bg: '#3d2514',
  },
  cabin: {
    label: 'Sistemas & ECLSS',
    icon: Wrench,
    color: '#e879f9',
    bg: '#371842',
  },
  rest: {
    label: 'Descanso & Circadiano',
    icon: Moon,
    color: '#a78bfa',
    bg: '#271d47',
  },
  protocol: {
    label: 'Protocolo Especial',
    icon: Sparkles,
    color: '#facc15',
    bg: '#3b3112',
  },
}

export function RoutinePage({ mission, notices = [], onNavigate }: Props) {
  const currentDay = mission?.day ?? 47
  const newTaskIdPrefix = useId()

  // 1. Cargar tareas desde localStorage o valor inicial predeterminado
  const [tasks, setTasks] = useState<RoutineTask[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {
      // Fallback
    }
    return defaultRoutineTasks
  })

  // 2. Persistir cada cambio en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    } catch {
      // ignore
    }
  }, [tasks])

  // Filtro de categorías y estado
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'completed' | 'exercise'>('all')

  // Estado del modal para añadir nueva tarea
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskCategory, setNewTaskCategory] = useState<RoutineCategory>('exercise')
  const [newTaskTime, setNewTaskTime] = useState('15:00')
  const [newTaskDuration, setNewTaskDuration] = useState(30)
  const [newTaskImpact, setNewTaskImpact] = useState('')

  // Estado de alerta de panel y recomendación activa
  const [recommendationApplied, setRecommendationApplied] = useState(() => {
    return tasks.some((t) => t.sourceRecommendation === 'sleep-deficit')
  })
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Desvanecer toast tras 4 segundos
  useEffect(() => {
    if (!toastMessage) return
    const timer = setTimeout(() => setToastMessage(null), 4000)
    return () => clearTimeout(timer)
  }, [toastMessage])

  // Alternar estado de completitud de una tarea
  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextCompleted = !t.completed
          const now = new Date()
          const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
          return {
            ...t,
            completed: nextCompleted,
            completedAt: nextCompleted ? time : undefined,
          }
        }
        return t
      })
    )
  }

  // Aplicar la recomendación médica activa a la rutina diaria
  const handleApplyRecommendation = () => {
    const recommendedTask: RoutineTask = {
      id: `rec-task-${Date.now()}`,
      title: 'Atenuación de espectro lumínico a 450nm + Bloque de descanso reparador',
      description: 'Recomendación generada por el motor médico ante alerta de 3 noches con déficit de descanso.',
      category: 'rest',
      timeStr: '20:30',
      durationMin: 45,
      completed: false,
      mandatory: true,
      sourceRecommendation: 'sleep-deficit',
      targetIndicatorId: 'sleep',
      impact: 'Mitigación de fatiga acumulada e inducción oportuna de fase REM.',
    }

    setTasks((prev) => [recommendedTask, ...prev])
    setRecommendationApplied(true)
    setToastMessage('¡Recomendación médica añadida con éxito a tu rutina de hoy!')
  }

  // Guardar nueva tarea personalizada
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    const created: RoutineTask = {
      id: `custom-${Date.now()}`,
      title: newTaskTitle.trim(),
      category: newTaskCategory,
      timeStr: newTaskTime,
      durationMin: Number(newTaskDuration),
      completed: false,
      mandatory: false,
      impact: newTaskImpact.trim() || 'Actividad programada por la tripulación.',
    }

    setTasks((prev) => [...prev, created])
    setIsAddModalOpen(false)
    setNewTaskTitle('')
    setNewTaskImpact('')
    setToastMessage('Nueva actividad registrada en tu itinerario de cabina.')
  }

  // Restablecer rutina a valores por defecto
  const handleResetRoutine = () => {
    if (window.confirm('¿Deseas restablecer el itinerario de actividades del día a los valores de vuelo estándar?')) {
      setTasks(defaultRoutineTasks)
      setRecommendationApplied(false)
      setToastMessage('Itinerario restablecido a la configuración oficial.')
    }
  }

  // Cálculos de métricas de rutina
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.completed).length
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Minutos de contramedida física completados hoy
  const exerciseMinutesDone = tasks
    .filter((t) => t.category === 'exercise' && t.completed)
    .reduce((acc, t) => acc + t.durationMin, 0)
  const exerciseMinutesTarget = 80 // Protocolo oficial NASA/CSA en microgravedad

  // Filtrado de lista según pestaña activa
  const filteredTasks = tasks.filter((t) => {
    if (filterMode === 'pending') return !t.completed
    if (filterMode === 'completed') return t.completed
    if (filterMode === 'exercise') return t.category === 'exercise'
    return true
  })

  // Detección de alerta médica relevante (aviso de sueño o contramedida pendiente)
  const activeNotice = notices.find((n) => n.indicatorId === 'sleep')

  return (
    <main className="min-w-0 px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Toast de confirmación */}
        {toastMessage && (
          <div
            role="status"
            className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-[#5cc98b] bg-[#12362c] px-4 py-3 text-sm font-medium text-[#5cc98b] shadow-xl animate-in fade-in slide-in-from-top-2"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 shrink-0 stroke-[2.5]" />
              <span>{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="rounded p-1 text-[#5cc98b] hover:bg-[#184840] cursor-pointer"
              aria-label="Cerrar notificación"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Encabezado principal */}
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#5cc98b]">
              <Clock className="h-3.5 w-3.5" />
              <span>Itinerario de Vuelo Orbital</span>
            </div>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-text sm:text-4xl">
              Rutina y Contramedidas
            </h1>
            <p className="mt-1 text-sm text-mute">
              Gestión diaria de actividades, ejercicio resistivo obligatorio y protocolos de cabina (Misión Día {currentDay}).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#5cc98b] px-4 py-2.5 text-xs font-bold text-[#0c1e2f] shadow-md transition-transform hover:bg-[#6edba0] active:scale-95 cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>Añadir actividad</span>
            </button>

            <button
              type="button"
              onClick={handleResetRoutine}
              title="Restablecer actividades del día"
              className="inline-flex items-center gap-1.5 rounded-xl border border-edge bg-panel/70 px-3 py-2.5 text-xs font-medium text-mute transition-colors hover:border-[#5cc98b]/50 hover:text-text cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Restablecer</span>
            </button>
          </div>
        </header>

        {/* =========================================================================
            ALERTA BIOMÉDICA DEL PANEL CON RECOMENDACIÓN ACCIONABLE
           ========================================================================= */}
        {activeNotice && (
          <section
            aria-label="Alerta médica con recomendación de rutina"
            className="mb-8 overflow-hidden rounded-2xl border border-notice-edge bg-notice p-5 shadow-lg shadow-black/30"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-watch/20 text-watch ring-1 ring-watch/40">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-watch/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-watch">
                      Alerta del Panel Clínico
                    </span>
                    <span className="text-xs text-mute">Origen: Chequeo de Salud / Telemetría</span>
                  </div>
                  <h2 className="mt-1 font-display text-xl font-bold text-text">
                    {activeNotice.title} ({activeNotice.summary})
                  </h2>
                  <p className="mt-1 text-xs text-mute max-w-2xl leading-relaxed">
                    La telemetría detecta 3 noches consecutivas por debajo de 6h. El protocolo clínico NASA HRP sugiere insertar de inmediato una contramedida de atenuación lumínica y descanso en tu rutina de hoy.
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {activeNotice.steps.map((step) => (
                      <span
                        key={step}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-notice-edge bg-panel/60 px-2.5 py-1 text-mute"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-watch" />
                        {step}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Botón de acción para incorporar la recomendación a la rutina */}
              <div className="mt-2 shrink-0 md:mt-0">
                {recommendationApplied ? (
                  <div className="inline-flex items-center gap-2 rounded-xl border border-[#5cc98b] bg-[#184840] px-4 py-2.5 text-xs font-bold text-[#5cc98b]">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Contramedida aplicada en rutina</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleApplyRecommendation}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-watch px-4 py-2.5 text-xs font-bold text-on-watch shadow-lg transition-transform hover:brightness-110 active:scale-95 cursor-pointer md:w-auto"
                  >
                    <Plus className="h-4 w-4 stroke-[3]" />
                    <span>Aplicar recomendación a mi rutina</span>
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {/* =========================================================================
            PANEL DE ESTADÍSTICAS Y CUMPLIMIENTO DEL DÍA
           ========================================================================= */}
        <section aria-label="Progreso del día" className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* 1. Progreso general de actividades */}
          <div className="rounded-2xl border border-edge bg-[#14283d] p-5 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-mute">
                Cumplimiento del día
              </span>
              <span className="font-display text-lg font-bold text-[#5cc98b]">{progressPercent}%</span>
            </div>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-rail">
              <div
                className="h-full rounded-full bg-[#5cc98b] transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-mute">
              <strong className="text-text">{completedTasks}</strong> de {totalTasks} actividades registradas.
            </p>
          </div>

          {/* 2. Minutos de contramedida física obligatoria */}
          <div className="rounded-2xl border border-edge bg-[#14283d] p-5 shadow-md">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-mute">
                <Flame className="h-3.5 w-3.5 text-[#fb923c]" />
                <span>Ejercicio orbital</span>
              </span>
              <span
                className={`text-xs font-bold ${
                  exerciseMinutesDone >= exerciseMinutesTarget ? 'text-[#5cc98b]' : 'text-watch'
                }`}
              >
                {exerciseMinutesDone} / {exerciseMinutesTarget} min
              </span>
            </div>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-rail">
              <div
                className="h-full rounded-full bg-[#fb923c] transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((exerciseMinutesDone / exerciseMinutesTarget) * 100))}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-mute">
              {exerciseMinutesDone >= exerciseMinutesTarget
                ? 'Protocolo diario completado (ARED + T2).'
                : `Faltan ${exerciseMinutesTarget - exerciseMinutesDone} min para la meta de protección ósea.`}
            </p>
          </div>

          {/* 3. Tareas prioritarias pendientes */}
          <div className="rounded-2xl border border-edge bg-[#14283d] p-5 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-mute">
                Tareas obligatorias
              </span>
              <span className="font-display text-lg font-bold text-text">
                {tasks.filter((t) => t.mandatory && !t.completed).length} pendientes
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-watch animate-pulse" />
              <span className="text-xs text-mute">Próxima: T2 Supersonic cardio (12:00)</span>
            </div>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('mission')}
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#5cc98b] hover:underline cursor-pointer"
              >
                <span>Ver contexto de vuelo en Mission</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </section>

        {/* =========================================================================
            LISTA INTERACTIVA DE TAREAS Y ACTIVIDADES DIARIAS
           ========================================================================= */}
        <section aria-label="Lista de actividades de rutina">
          {/* Barra de filtros */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-edge pb-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-mute">
              <Filter className="h-3.5 w-3.5 text-[#5cc98b]" />
              <span>Filtro de itinerario:</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-[#184840] text-[#5cc98b] shadow-sm'
                    : 'bg-panel/50 text-mute hover:text-text'
                }`}
              >
                Todas ({tasks.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('pending')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  filterMode === 'pending'
                    ? 'bg-[#184840] text-[#5cc98b] shadow-sm'
                    : 'bg-panel/50 text-mute hover:text-text'
                }`}
              >
                Pendientes ({tasks.filter((t) => !t.completed).length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('completed')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  filterMode === 'completed'
                    ? 'bg-[#184840] text-[#5cc98b] shadow-sm'
                    : 'bg-panel/50 text-mute hover:text-text'
                }`}
              >
                Completadas ({tasks.filter((t) => t.completed).length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('exercise')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  filterMode === 'exercise'
                    ? 'bg-[#184840] text-[#5cc98b] shadow-sm'
                    : 'bg-panel/50 text-mute hover:text-text'
                }`}
              >
                Contramedidas ({tasks.filter((t) => t.category === 'exercise').length})
              </button>
            </div>
          </div>

          {/* Lista de tarjetas interactivas */}
          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="rounded-2xl border border-edge bg-panel/30 p-8 text-center text-sm text-mute">
                No hay actividades en esta vista.
              </div>
            ) : (
              filteredTasks.map((task) => {
                const cat = CATEGORY_CONFIG[task.category] || CATEGORY_CONFIG.protocol
                const CatIcon = cat.icon

                return (
                  <article
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className={`group relative flex cursor-pointer flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between transition-all ${
                      task.completed
                        ? 'border-edge/50 bg-[#102438]/50 opacity-80'
                        : 'border-edge bg-[#14283d] hover:border-[#5cc98b]/60 hover:bg-[#17324c]'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Checkbox táctil */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleTask(task.id)
                        }}
                        aria-label={task.completed ? 'Marcar como pendiente' : 'Marcar como completada'}
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-all cursor-pointer ${
                          task.completed
                            ? 'border-[#5cc98b] bg-[#5cc98b] text-[#0c1e2f]'
                            : 'border-edge bg-rail text-transparent hover:border-[#5cc98b]'
                        }`}
                      >
                        {task.completed ? (
                          <CheckCircle2 className="h-5 w-5 stroke-[2.5]" />
                        ) : (
                          <Circle className="h-4 w-4 text-mute/40" />
                        )}
                      </button>

                      {/* Información de la tarea */}
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold"
                            style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                          >
                            <CatIcon className="h-3 w-3" />
                            <span>{cat.label}</span>
                          </span>

                          <span className="font-mono text-xs text-mute">
                            {task.timeStr} ({task.durationMin} min)
                          </span>

                          {task.mandatory && (
                            <span className="rounded bg-rail px-1.5 py-0.2 text-[10px] font-bold uppercase tracking-wider text-watch border border-edge">
                              Mandatorio
                            </span>
                          )}

                          {task.sourceRecommendation && (
                            <span className="rounded bg-notice-edge/40 px-1.5 py-0.2 text-[10px] font-bold text-watch">
                              Recomendación médica
                            </span>
                          )}
                        </div>

                        <h3
                          className={`mt-1 text-sm font-semibold sm:text-base ${
                            task.completed ? 'text-mute line-through' : 'text-text'
                          }`}
                        >
                          {task.title}
                        </h3>

                        {task.description && (
                          <p className="mt-0.5 text-xs text-mute leading-relaxed max-w-2xl">
                            {task.description}
                          </p>
                        )}

                        <p className="mt-1 text-[11px] font-medium text-[#8fa9bd]">
                          Impacto: {task.impact}
                        </p>
                      </div>
                    </div>

                    {/* Estado de completado / hora */}
                    <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-center border-t border-edge/40 pt-2 sm:border-0 sm:pt-0">
                      {task.completed ? (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#5cc98b]">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Completada {task.completedAt ? `(${task.completedAt})` : ''}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-mute">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Pendiente de ejecución</span>
                        </div>
                      )}
                    </div>
                  </article>
                )
              })
            )}
          </div>
        </section>

        {/* =========================================================================
            MODAL DE REGISTRO DE ACTIVIDAD PERSONALIZADA
           ========================================================================= */}
        {isAddModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          >
            <div className="relative w-full max-w-lg rounded-2xl border border-edge bg-[#102438] p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-edge pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#184840] text-[#5cc98b]">
                    <Plus className="h-5 w-5 stroke-[2.5]" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-text">
                    Programar Actividad de Rutina
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg p-1 text-mute hover:bg-panel hover:text-text cursor-pointer"
                  aria-label="Cerrar modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="mt-4 space-y-4">
                <div>
                  <label htmlFor={`${newTaskIdPrefix}-title`} className="text-xs font-semibold uppercase text-mute">
                    Título de la actividad
                  </label>
                  <input
                    id={`${newTaskIdPrefix}-title`}
                    type="text"
                    required
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Ej. Inspección de escotilla presurizada o estiramientos"
                    className="mt-1 w-full rounded-xl border border-edge bg-[#0c1e2f] px-3.5 py-2.5 text-sm text-text placeholder:text-mute/50 focus:border-[#5cc98b] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor={`${newTaskIdPrefix}-cat`} className="text-xs font-semibold uppercase text-mute">
                      Categoría
                    </label>
                    <select
                      id={`${newTaskIdPrefix}-cat`}
                      value={newTaskCategory}
                      onChange={(e) => setNewTaskCategory(e.target.value as RoutineCategory)}
                      className="mt-1 w-full rounded-xl border border-edge bg-[#0c1e2f] px-3.5 py-2.5 text-sm text-text focus:border-[#5cc98b] focus:outline-none cursor-pointer"
                    >
                      <option value="exercise">Contramedida Física</option>
                      <option value="medical">Telemetría Médica</option>
                      <option value="nutrition">Nutrición & Hidratación</option>
                      <option value="cabin">Sistemas & ECLSS</option>
                      <option value="rest">Descanso & Circadiano</option>
                      <option value="protocol">Protocolo Especial</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor={`${newTaskIdPrefix}-time`} className="text-xs font-semibold uppercase text-mute">
                        Hora
                      </label>
                      <input
                        id={`${newTaskIdPrefix}-time`}
                        type="time"
                        value={newTaskTime}
                        onChange={(e) => setNewTaskTime(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-edge bg-[#0c1e2f] px-3 py-2 text-sm text-text focus:border-[#5cc98b] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor={`${newTaskIdPrefix}-dur`} className="text-xs font-semibold uppercase text-mute">
                        Duración
                      </label>
                      <input
                        id={`${newTaskIdPrefix}-dur`}
                        type="number"
                        min={5}
                        max={180}
                        step={5}
                        value={newTaskDuration}
                        onChange={(e) => setNewTaskDuration(Number(e.target.value))}
                        className="mt-1 w-full rounded-xl border border-edge bg-[#0c1e2f] px-3 py-2 text-sm text-text focus:border-[#5cc98b] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor={`${newTaskIdPrefix}-impact`} className="text-xs font-semibold uppercase text-mute">
                    Impacto / Objetivo operativo
                  </label>
                  <input
                    id={`${newTaskIdPrefix}-impact`}
                    type="text"
                    value={newTaskImpact}
                    onChange={(e) => setNewTaskImpact(e.target.value)}
                    placeholder="Ej. Prevención de atrofia o verificación de redundancia"
                    className="mt-1 w-full rounded-xl border border-edge bg-[#0c1e2f] px-3.5 py-2.5 text-sm text-text placeholder:text-mute/50 focus:border-[#5cc98b] focus:outline-none"
                  />
                </div>

                <div className="mt-6 flex items-center justify-end gap-3 border-t border-edge pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="rounded-lg px-4 py-2 text-xs font-semibold text-mute hover:bg-panel hover:text-text cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#5cc98b] px-5 py-2.5 text-xs font-bold text-[#0c1e2f] hover:bg-[#6edba0] cursor-pointer"
                  >
                    Guardar Actividad
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Pie de página informativo */}
        <footer className="mt-10 rounded-2xl border border-edge/70 bg-panel/30 p-4 text-xs text-mute flex items-start gap-3">
          <Info className="h-4 w-4 shrink-0 text-[#5cc98b] mt-0.5" />
          <p>
            Las actividades completadas se sincronizan localmente en el almacenamiento aislado de la cabina. Las contramedidas físicas computan directamente hacia el requerimiento orbital de 80 minutos diarios.
          </p>
        </footer>
      </div>
    </main>
  )
}
