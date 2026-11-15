export type Mood = 'Bad' | 'Fair' | 'Neutral' | 'Good' | 'Great'

export interface DailyMetrics {
  bloodPressureSys: number
  bloodPressureDia: number
  heartRate: number
  bloodSugar: number
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
