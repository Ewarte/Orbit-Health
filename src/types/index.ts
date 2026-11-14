/*
  CONTRATO DE DATOS — PROPUESTA
  La forma de los datos que se pasan entre las piezas de la app.
  Todos importan de aquí. Tras aprobarlo el equipo, solo lo cambia quien
  lleve la integración, avisando al grupo.

  Tres clases de información:
    1. Lo que la app sabe de antemano  → archivos en src/data (no cambia en uso)
    2. Lo que registra el astronauta   → base de datos del dispositivo (src/services)
    3. Lo que la app calcula           → no se guarda; lo produce src/features/evaluation
*/

export type Status = 'ok' | 'watch' | 'act'

export type ZoneId = 'head' | 'heart' | 'metabolism' | 'body' | 'legs'

export type IndicatorId =
  | 'bp'
  | 'hr'
  | 'glucose'
  | 'temp'
  | 'sleep'
  | 'mood'
  | 'vision'
  | 'exercise'

export type HazardId = 'radiation' | 'isolation' | 'distance' | 'gravity' | 'environment'

export type Environment = 'orbit' | 'transit' | 'moon' | 'mars'

/** A quién acudir, de menor a mayor gravedad. */
export type Escalation = 'self' | 'crew' | 'surgeon'

// ───────── 1. Lo que la app sabe de antemano (src/data) ─────────

export interface Zone {
  id: ZoneId
  name: string
  /** Qué vigila esta zona, en lenguaje llano. */
  about: string
}

/** Un tramo de valores y el estado que le corresponde. */
export interface Range {
  status: Status
  /** Límites inclusivos; sin límite si se omite. */
  min?: number
  max?: number
}

export interface IndicatorDefinition {
  id: IndicatorId
  name: string
  unit: string
  zone: ZoneId
  /** number: un valor · pair: dos valores (presión) · scale: 1 a 5 · yesno: pregunta */
  input: 'number' | 'pair' | 'scale' | 'yesno'
  howToMeasure: string
  whyItMatters: string
  hazards: HazardId[]
  /** Vacío en los indicadores de sí/no. */
  ranges: Range[]
  /** Enlace a la fuente de los rangos. Obligatorio si hay rangos. */
  rangeSource?: string
  /** Enlace a la fuente de la explicación. */
  source: string
}

export interface Guide {
  id: string
  indicator: IndicatorId
  status: Exclude<Status, 'ok'>
  title: string
  summary: string
  /** Qué hacer ahora, en orden. */
  steps: string[]
  prevention: string[]
  escalation: Escalation
  source: string
}

// ───────── 2. Lo que registra el astronauta (src/services) ─────────

export interface Measurement {
  id: string
  indicator: IndicatorId
  /** Valor principal. En sí/no: 1 = sí, 0 = no. */
  value: number
  /** Segundo valor, solo para presión (diastólica). */
  value2?: number
  /** Fecha y hora en formato ISO. */
  takenAt: string
  missionDay: number
  origin: 'manual' | 'demo'
}

export interface Mission {
  day: number
  place: string
  lastCheck: string
  environment?: Environment
}

export interface RoutineTask {
  id: string
  label: string
  /** Hora prevista, 'HH:MM'. */
  dueAt: string
  doneAt?: string
}

// ───────── 3. Lo que la app calcula (src/features/evaluation) ─────────

/** Un indicador ya evaluado, listo para pintarse. */
export interface Indicator {
  id: string
  name: string
  /** Valor ya formateado para mostrar: '128/82', '5.2', 'No change'. */
  value: string
  unit: string
  status: Status
  /** Frase corta que explica el estado. Vacía si es normal. */
  reason: string
  zone: ZoneId
  /** Últimos valores, del más antiguo al más reciente. Vacío si no aplica. */
  history: number[]
}

/** Aviso que se muestra cuando un indicador necesita atención. */
export interface Notice {
  indicatorId: string
  title: string
  summary: string
  steps: string[]
}
