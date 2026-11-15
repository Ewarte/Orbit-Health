// Estados de Alerta (Terminología aeroespacial)
export type AlertLevel = 'nominal' | 'warning' | 'critical';

// Estructura base de cada indicador
export interface AstronautMetric {
  value: number;
  unit: string;
  status: AlertLevel;
}

// Registro principal de Salud
export interface SpaceHealthRecord {
  id: string;             // Identificador único del registro (ej. UUID)
  timestamp: string;      // Fecha y hora del registro (ISO 8601)

  metrics: {
    heartRate: AstronautMetric;       // Frecuencia Cardíaca
    bloodOxygen: AstronautMetric;     // Saturación de Oxígeno
    radiationDose: AstronautMetric;   // Dosis de Radiación
    cognitiveStress: AstronautMetric; // Nivel de Estrés Cognitivo
    boneDensity: AstronautMetric;     // Densidad Ósea
    sleepQuality: AstronautMetric;    // Calidad del Sueño
  };

  overallStatus: AlertLevel; // Estado general consolidado
  protocolAction: string;    // Acción sugerida para emergencias offline
}

// Tipos de presentacion que usa el mockup actual del panel.
export type Status = 'ok' | 'watch' | 'act'
export type ZoneId = 'head' | 'heart' | 'metabolism' | 'body' | 'legs'

export interface Indicator {
  id: string
  name: string
  value: string
  unit: string
  status: Status
  reason: string
  zone: ZoneId
  history: number[]
}

export interface Mission {
  day: number
  place: string
  lastCheck: string
  phase?: string
  totalDays?: number
  distanceEarthKm?: number
  distanceTargetKm?: number
  cabinPressureKpa?: number
  cabinOxygenPercent?: number
  cabinCo2Percent?: number
  cabinTempCelsius?: number
  radiationDoseTotalMsv?: number
  crewReadinessIndex?: number
  crewMembersCount?: number
}

export type RoutineCategory = 'exercise' | 'medical' | 'nutrition' | 'cabin' | 'rest' | 'protocol'

export interface RoutineTask {
  id: string
  title: string
  description?: string
  category: RoutineCategory
  timeStr: string
  durationMin: number
  completed: boolean
  mandatory: boolean
  sourceRecommendation?: string
  targetIndicatorId?: string
  impact: string
  completedAt?: string
}

export interface MissionTrendPoint {
  day: number
  dateStr: string
  distanceEarthKm: number
  cumulativeRadiationMsv: number
  cabinPressureKpa: number
  cabinCo2Percent: number
  exerciseComplianceScore: number
  readinessIndex: number
}

export interface GuidanceProtocol {
  id: string
  title: string
  category: string
  targetRisk: string
  severity: Status
  summary: string
  rationale: string
  actionSteps: string[]
  recommendedTaskTitle?: string
  recommendedCategory?: RoutineCategory
  recommendedDurationMin?: number
}

export interface Zone {
  id: ZoneId
  name: string
  about: string
}

export interface Notice {
  indicatorId: string
  title: string
  summary: string
  steps: string[]
}
