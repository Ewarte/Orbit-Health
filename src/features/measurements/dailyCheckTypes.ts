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

export interface SavedRecord {
  id: string
  timestamp: string
  timeStr: string
  dateStr: string
  metrics: DailyMetrics
  notes?: string
}
