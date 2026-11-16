export type Mood = 'Bad' | 'Fair' | 'Neutral' | 'Good' | 'Great'

export interface DailyMetrics {
  bloodPressureSys: number
  bloodPressureDia: number
  heartRate: number
  /** null = no medido (la glucosa no es rutinaria; no hay glucómetro en el botiquín). */
  bloodSugar: number | null
  /** Saturación de oxígeno en sangre (%). */
  spo2: number
  /** Respiraciones por minuto. */
  respiratoryRate: number
  exerciseMinutes: number
  visionChange: boolean
  bodyTemperature: number
  sleepHours: number
  mood: Mood
}

/** De dónde salió un dato: escrito a mano, de un sensor simulado o de un sensor Bluetooth real. */
export type DataSource = 'manual' | 'simulated' | 'bluetooth'

/** Origen de cada medida. Una medida sin entrada se considera 'manual' (registros antiguos). */
export type MetricSources = Partial<Record<keyof DailyMetrics, DataSource>>

export interface SavedRecord {
  id: string
  timestamp: string
  timeStr: string
  dateStr: string
  metrics: DailyMetrics
  notes?: string
  /** Origen de cada medida; si falta, todas son manuales. */
  sources?: MetricSources
}
