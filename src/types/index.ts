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

// Tipos de presentaciÃ³n que usa el mockup actual del panel.
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
