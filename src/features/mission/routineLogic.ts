/*
  Lógica de la rutina diaria, sin pantalla: qué tareas hay, qué se completó hoy
  y qué recordatorios toca avisar. Está aparte para poder probarla.
*/

export type RoutineTaskId = 'check' | 'exercise' | 'review' | 'sleep'

export interface RoutineTask {
  id: RoutineTaskId
  /** Hora local de la tarea, formato HH:MM. */
  time: string
}

export const ROUTINE_TASKS: readonly RoutineTask[] = [
  { id: 'check', time: '07:10' },
  { id: 'exercise', time: '10:00' },
  { id: 'review', time: '18:00' },
  { id: 'sleep', time: '22:00' },
]

/** Un recordatorio solo avisa si la tarea venció hace menos de esto. */
export const REMINDER_WINDOW_MINUTES = 60

export const ROUTINE_STORAGE_KEY = 'orbit_health_routine'
export const REMINDERS_STORAGE_KEY = 'orbit_health_routine_reminders'

/** Lo que se guarda de la rutina: es de un solo día y se reinicia al cambiar la fecha. */
export interface RoutineDay {
  date: string
  done: RoutineTaskId[]
  /** Avisos que la persona ya cerró hoy, para que no vuelvan a aparecer. */
  dismissed: RoutineTaskId[]
}

const ALL_IDS: readonly RoutineTaskId[] = ROUTINE_TASKS.map((task) => task.id)

function isTaskId(value: unknown): value is RoutineTaskId {
  return typeof value === 'string' && (ALL_IDS as readonly string[]).includes(value)
}

/** Fecha local en formato AAAA-MM-DD (no UTC: el día del astronauta es el del reloj de a bordo). */
export function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function emptyDay(now: Date): RoutineDay {
  return { date: dayKey(now), done: [], dismissed: [] }
}

/** Lee lo guardado; si está dañado, es de otro día o tiene el formato antiguo, empieza un día en blanco. */
export function parseRoutineDay(raw: string | null, now: Date): RoutineDay {
  if (!raw) return emptyDay(now)
  try {
    const data: unknown = JSON.parse(raw)
    if (typeof data !== 'object' || data === null || Array.isArray(data)) return emptyDay(now)
    const { date, done, dismissed } = data as Partial<Record<keyof RoutineDay, unknown>>
    if (date !== dayKey(now)) return emptyDay(now)
    return {
      date,
      done: Array.isArray(done) ? done.filter(isTaskId) : [],
      dismissed: Array.isArray(dismissed) ? dismissed.filter(isTaskId) : [],
    }
  } catch {
    return emptyDay(now)
  }
}

/** Lee qué recordatorios están activos. Por defecto, todos. */
export function parseEnabledReminders(raw: string | null): RoutineTaskId[] {
  if (!raw) return [...ALL_IDS]
  try {
    const data: unknown = JSON.parse(raw)
    return Array.isArray(data) ? data.filter(isTaskId) : [...ALL_IDS]
  } catch {
    return [...ALL_IDS]
  }
}

function minutesOfDay(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Tareas que hay que avisar ahora: su hora ya llegó (y no pasó más de la ventana),
 * tienen recordatorio activo, no están hechas y la persona no cerró ya el aviso.
 */
export function dueReminders(now: Date, day: RoutineDay, enabled: readonly RoutineTaskId[]): RoutineTask[] {
  const current = now.getHours() * 60 + now.getMinutes()
  return ROUTINE_TASKS.filter((task) => {
    const elapsed = current - minutesOfDay(task.time)
    return (
      elapsed >= 0 &&
      elapsed < REMINDER_WINDOW_MINUTES &&
      enabled.includes(task.id) &&
      !day.done.includes(task.id) &&
      !day.dismissed.includes(task.id)
    )
  })
}
