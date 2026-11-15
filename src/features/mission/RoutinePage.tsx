import { useEffect, useState } from 'react'
import {
  Apple,
  Award,
  Brain,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  HeartPulse,
  Moon,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Timer,
} from 'lucide-react'

export interface RoutineTask {
  id: string
  title: string
  category: 'countermeasure' | 'exercise' | 'nutrition' | 'cognitive' | 'sleep'
  time: string
  durationMinutes: number
  description: string
  completed: boolean
}

const DEFAULT_TASKS: RoutineTask[] = [
  {
    id: 'task-1',
    title: 'Daily Health Telemetry Check',
    category: 'countermeasure',
    time: '07:10',
    durationMinutes: 10,
    description: 'Record BP, resting pulse, blood sugar, core temperature, sleep and mood via cabin sensor cuff.',
    completed: true,
  },
  {
    id: 'task-2',
    title: 'ARED Heavy Resistive Exercise',
    category: 'exercise',
    time: '08:30',
    durationMinutes: 60,
    description: 'Squats, deadlifts and heel raises on the Advanced Resistive Exercise Device to counter 1-1.5%/month bone mineral density loss.',
    completed: true,
  },
  {
    id: 'task-3',
    title: 'CEVIS / T2 Aerobic Cardio Session',
    category: 'exercise',
    time: '10:45',
    durationMinutes: 45,
    description: 'Cycle ergometer interval training at 75-85% VO2max to preserve stroke volume and prevent cardiovascular deconditioning.',
    completed: false,
  },
  {
    id: 'task-4',
    title: 'Hydration & Micro-Nutrient Protocol',
    category: 'nutrition',
    time: '12:30',
    durationMinutes: 15,
    description: 'Consume 800 mL electrolyte-enriched water + 1000 IU Vitamin D3 + calcium citrate for radiation mitigation.',
    completed: false,
  },
  {
    id: 'task-5',
    title: 'WinSCAT / PVT Cognitive & Psychomotor Test',
    category: 'cognitive',
    time: '15:15',
    durationMinutes: 15,
    description: 'Psychomotor Vigilance Task (PVT) to assess neurobehavioral readiness, attention lapse, and confinement stress.',
    completed: false,
  },
  {
    id: 'task-6',
    title: 'Circadian Light Phase Shift (480nm Cut)',
    category: 'sleep',
    time: '21:30',
    durationMinutes: 30,
    description: 'Switch cabin solid-state lighting to low-intensity warm red-shifted spectrum. Engage acoustic sleep-mask isolation.',
    completed: false,
  },
]

const ROUTINE_STORAGE_KEY = 'orbit_health_routine_tasks'
const STREAK_STORAGE_KEY = 'orbit_health_routine_streak'

export function RoutinePage() {
  const [tasks, setTasks] = useState<RoutineTask[]>(() => {
    try {
      const saved = localStorage.getItem(ROUTINE_STORAGE_KEY)
      if (saved) return JSON.parse(saved) as RoutineTask[]
    } catch {
      // fallback
    }
    return DEFAULT_TASKS
  })

  const [streakDays, setStreakDays] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STREAK_STORAGE_KEY)
      if (saved) return Number(saved)
    } catch {
      // fallback
    }
    return 14 // 14 días consecutivos nominales
  })

  // Persistir tareas
  useEffect(() => {
    try {
      localStorage.setItem(ROUTINE_STORAGE_KEY, JSON.stringify(tasks))
    } catch {
      // fallback
    }
  }, [tasks])

  // Persistir racha
  useEffect(() => {
    try {
      localStorage.setItem(STREAK_STORAGE_KEY, String(streakDays))
    } catch {
      // fallback
    }
  }, [streakDays])

  const completedCount = tasks.filter((t) => t.completed).length
  const totalCount = tasks.length
  const progressPercent = Math.round((completedCount / totalCount) * 100)

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextCompleted = !t.completed
          // Si completa la última que faltaba, incrementa racha
          if (nextCompleted && completedCount + 1 === totalCount) {
            setStreakDays((s) => s + 1)
          }
          return { ...t, completed: nextCompleted }
        }
        return t
      })
    )
  }

  const resetAll = () => {
    setTasks(DEFAULT_TASKS.map((t) => ({ ...t, completed: false })))
  }

  const markAllComplete = () => {
    setTasks((prev) => prev.map((t) => ({ ...t, completed: true })))
    setStreakDays((s) => s + 1)
  }

  const getCategoryIcon = (category: RoutineTask['category']) => {
    switch (category) {
      case 'countermeasure':
        return <ShieldCheck className="h-4 w-4 text-[#5cc98b]" />
      case 'exercise':
        return <Dumbbell className="h-4 w-4 text-sky-400" />
      case 'nutrition':
        return <Apple className="h-4 w-4 text-amber-400" />
      case 'cognitive':
        return <Brain className="h-4 w-4 text-purple-400" />
      case 'sleep':
        return <Moon className="h-4 w-4 text-indigo-400" />
      default:
        return <Clock className="h-4 w-4 text-mute" />
    }
  }

  const getCategoryBadgeClass = (category: RoutineTask['category']) => {
    switch (category) {
      case 'countermeasure':
        return 'bg-[#184840]/60 text-[#5cc98b] border-[#2d7d6b]/40'
      case 'exercise':
        return 'bg-sky-950/60 text-sky-400 border-sky-700/40'
      case 'nutrition':
        return 'bg-amber-950/60 text-amber-400 border-amber-700/40'
      case 'cognitive':
        return 'bg-purple-950/60 text-purple-400 border-purple-700/40'
      case 'sleep':
        return 'bg-indigo-950/60 text-indigo-400 border-indigo-700/40'
    }
  }

  return (
    <main className="min-w-0 px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Cabecera */}
        <header className="mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#5cc98b]">
              <Sparkles className="h-3.5 w-3.5" /> NASA Human Research Countermeasures
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-text sm:text-4xl">
              Daily Routine & Countermeasures
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-mute">
            <Timer className="h-4 w-4 text-[#5cc98b]" />
            <span>MET 047 / 11:20 UTC</span>
          </div>
        </header>

        {/* Tarjetas Superiores: Racha y Progreso Gamificado */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Tarjeta de Racha Activa */}
          <div className="relative overflow-hidden rounded-2xl border border-edge bg-[#14283d] p-5 shadow-lg shadow-black/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-mute">Countermeasure Streak</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                <Flame className="h-5 w-5 fill-amber-400/20" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-4xl font-bold tracking-tight text-amber-400">
                {streakDays}
              </span>
              <span className="text-sm font-medium text-mute">consecutive days</span>
            </div>
            <p className="mt-1 text-xs text-mute">
              Completing daily tasks boosts mission resilience & bone retention.
            </p>
          </div>

          {/* Tarjeta de Progreso Diario */}
          <div className="relative overflow-hidden rounded-2xl border border-edge bg-[#14283d] p-5 shadow-lg shadow-black/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-mute">Today's Completion</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#184840] text-[#5cc98b]">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-4xl font-bold tracking-tight text-text">
                {progressPercent}%
              </span>
              <span className="text-sm font-medium text-mute">
                ({completedCount} of {totalCount} tasks)
              </span>
            </div>
            {/* Barra de progreso */}
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-rail">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-[#5cc98b] transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Tarjeta de Nivel de Preparación Operativa */}
          <div className="relative overflow-hidden rounded-2xl border border-edge bg-[#14283d] p-5 shadow-lg shadow-black/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-mute">Readiness Tier</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                <Award className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold tracking-tight text-sky-400">
                {progressPercent >= 80 ? 'Tier 1 Nominal' : progressPercent >= 40 ? 'Tier 2 Active' : 'Tier 3 Pending'}
              </span>
            </div>
            <p className="mt-1 text-xs text-mute">
              HRP Protocol: Minimum 2.5 hours daily physical & cognitive conditioning.
            </p>
          </div>
        </div>

        {/* Sección de Lista de Tareas */}
        <section aria-label="Scheduled Countermeasures" className="rounded-2xl border border-edge bg-[#14283d] p-5 sm:p-6 shadow-lg shadow-black/20">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-edge/60 pb-4">
            <div>
              <h2 className="font-display text-xl font-semibold text-text">Mission Schedule</h2>
              <p className="text-xs text-mute">Click on any protocol to toggle completion status</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={markAllComplete}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#2d7d6b] bg-[#143734]/30 px-3 py-1.5 text-xs font-medium text-[#5cc98b] hover:bg-[#143734]/60 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Mark all complete</span>
              </button>
              <button
                type="button"
                onClick={resetAll}
                className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-rail px-3 py-1.5 text-xs font-medium text-mute hover:text-text transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {tasks.map((task) => (
              <article
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={`group flex items-start gap-4 rounded-xl border p-4 transition-all cursor-pointer ${
                  task.completed
                    ? 'border-[#2d7d6b]/50 bg-[#122e2b]/30 hover:bg-[#122e2b]/50'
                    : 'border-edge bg-rail/60 hover:border-edge/80 hover:bg-rail'
                }`}
              >
                {/* Icono de Check */}
                <button
                  type="button"
                  aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ${
                    task.completed
                      ? 'bg-[#184840] text-[#5cc98b]'
                      : 'border-2 border-edge text-transparent group-hover:border-mute'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </button>

                {/* Detalles de la Tarea */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold ${getCategoryBadgeClass(
                        task.category
                      )}`}
                    >
                      {getCategoryIcon(task.category)}
                      <span className="capitalize">{task.category}</span>
                    </span>

                    <span className="inline-flex items-center gap-1 text-xs font-medium text-mute">
                      <Clock className="h-3 w-3" />
                      <span>{task.time}</span>
                      <span>({task.durationMinutes} min)</span>
                    </span>
                  </div>

                  <h3
                    className={`mt-2 font-display text-lg font-semibold tracking-tight transition-colors ${
                      task.completed ? 'text-mute line-through' : 'text-text'
                    }`}
                  >
                    {task.title}
                  </h3>

                  <p className="mt-1 text-xs text-mute sm:text-sm leading-relaxed">
                    {task.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Banner Informativo de Contramedidas NASA */}
        <aside className="mt-6 flex items-start gap-3 rounded-xl border border-edge bg-rail/80 p-4 text-xs text-mute sm:text-sm">
          <HeartPulse className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" />
          <p className="m-0 leading-relaxed">
            <strong className="text-text">NASA Standard Measure:</strong> Strict adherence to daily exercise countermeasures maintains muscular mass, bone density, and neurovestibular balance during long-duration Artemis & Mars transit profiles.
          </p>
        </aside>
      </div>
    </main>
  )
}
