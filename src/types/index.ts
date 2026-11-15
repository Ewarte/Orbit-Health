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
  /** Clave de texto del motivo, para mostrarlo traducido; si no existe se usa `reason`. */
  reasonKey?: string
  reasonParams?: Record<string, string | number>
  zone: ZoneId
  history: number[]
  /** Valores calculados a partir de este indicador (nunca cambian su estado). */
  derived?: { id: string; label: string; value: string; unit: string }[]
}

export interface Mission {
  environment: 'capsule' | 'station' | 'transit' | 'moon' | 'mars'
  /** Instante de despegue en UTC (texto ISO 8601). */
  launchUtc: string
  place: string
  lastCheck: string
  /** Día de vuelo: se CALCULA con flightDay a partir del despegue; otras pantallas lo leen. */
  day: number
  /** Llegada a la superficie en UTC (Luna o Marte, opcional). */
  arrivalUtc?: string
  /** Longitud este del sitio en Marte, en grados. */
  marsLongitudeEast?: number
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
