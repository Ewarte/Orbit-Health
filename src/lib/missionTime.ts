/*
  Tiempo de misión, sin pantalla. Fuente de todo: docs/INVESTIGACION-TIEMPO.md.
  Regla aprobada: se lee el reloj del dispositivo SIEMPRE en UTC, se guarda el
  instante de despegue en UTC y lo demás se calcula. La zona horaria del
  dispositivo no se usa para nada de la misión.
*/
import type { Mission } from '../types'

export type MissionEnvironment = 'capsule' | 'station' | 'transit' | 'moon' | 'mars'

export const ENVIRONMENTS: readonly MissionEnvironment[] = ['capsule', 'station', 'transit', 'moon', 'mars']

/** Longitud este de Jezero (sitio de Perseverance), valor por defecto en Marte. */
export const DEFAULT_MARS_LONGITUDE = 77.45

const MS_PER_DAY = 86_400_000
const MS_PER_SECOND = 1_000

// ---------------------------------------------------------------------------
// Tiempo transcurrido de misión (MET)
// ---------------------------------------------------------------------------

export interface MetParts {
  negative: boolean
  days: number
  hours: number
  minutes: number
  seconds: number
}

/** Descompone el tiempo desde el despegue. Fuente: MET de NASA (D/HH:MM:SS desde el despegue). */
export function metParts(nowMs: number, launchMs: number): MetParts {
  const diff = nowMs - launchMs
  const total = Math.floor(Math.abs(diff) / MS_PER_SECOND)
  return {
    negative: diff < 0,
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3_600),
    minutes: Math.floor((total % 3_600) / 60),
    seconds: total % 60,
  }
}

const two = (n: number) => String(n).padStart(2, '0')

/** 'T+ 046/03:12:09'; 'T−' (signo menos real) si aún no despegó. */
export function formatMet(parts: MetParts): string {
  const sign = parts.negative ? 'T−' : 'T+'
  return `${sign} ${String(parts.days).padStart(3, '0')}/${two(parts.hours)}:${two(parts.minutes)}:${two(parts.seconds)}`
}

/**
 * Día de vuelo = días completos transcurridos + 1 (el día 1 es el del despegue); mínimo 1.
 * Convención DEDUCIDA: la regla exacta no se verificó en una fuente oficial.
 */
export function flightDay(nowMs: number, launchMs: number): number {
  return Math.max(1, Math.floor((nowMs - launchMs) / MS_PER_DAY) + 1)
}

/** Hora 'HH:MM:SS' y fecha 'AAAA-MM-DD', ambas en UTC. */
export function formatUtc(nowMs: number): { time: string; date: string } {
  const iso = new Date(nowMs).toISOString()
  return { date: iso.slice(0, 10), time: iso.slice(11, 19) }
}

// ---------------------------------------------------------------------------
// Marte
// Algoritmo de Mars24 (NASA GISS). La duración del sol, 88 775,244 s (1,0274912517
// días terrestres), es la cifra oficial. El término de corrección (0,0009626) y
// TT−UTC = 69,184 s vienen del algoritmo de Mars24.
// ---------------------------------------------------------------------------

/** Fecha solar marciana (MSD) en el instante dado. */
export function marsSolDate(nowMs: number): number {
  const jdUt = nowMs / MS_PER_DAY + 2_440_587.5
  const jdTt = jdUt + 69.184 / 86_400
  return (jdTt - 2_451_549.5) / 1.0274912517 + 44_796.0 - 0.0009626
}

const mod24 = (hours: number) => ((hours % 24) + 24) % 24

/** Hora de Marte coordinada (MTC) en horas marcianas, de 0 a 24. */
export function marsCoordinatedTime(msd: number): number {
  return 24 * (msd - Math.floor(msd))
}

/** Hora solar media local (LMST) en horas marcianas para una longitud este en grados. */
export function marsLocalMeanSolarTime(msd: number, eastLongitudeDeg: number): number {
  return mod24(marsCoordinatedTime(msd) + eastLongitudeDeg / 15)
}

/** 'HH:MM:SS' en horas marcianas. */
export function formatMarsHours(hours: number): string {
  const total = Math.floor(mod24(hours) * 3_600)
  return `${two(Math.floor(total / 3_600))}:${two(Math.floor((total % 3_600) / 60))}:${two(total % 60)}`
}

/** Número de sol desde la llegada: el sol de la llegada es el 1. */
export function solNumber(nowMs: number, arrivalMs: number): number {
  return Math.floor(marsSolDate(nowMs) - marsSolDate(arrivalMs)) + 1
}

// ---------------------------------------------------------------------------
// Datos de la misión guardados
// ---------------------------------------------------------------------------

export function parseUtc(value: string | undefined): number | null {
  if (!value) return null
  const ms = Date.parse(value)
  return Number.isNaN(ms) ? null : ms
}

export const DEFAULT_PLACE = 'International Space Station'

/** Misión de demostración: estación, despegue 46 días antes (día 47). */
export function defaultMission(nowMs: number): Mission {
  return {
    environment: 'station',
    launchUtc: new Date(nowMs - 46 * MS_PER_DAY).toISOString(),
    place: DEFAULT_PLACE,
    lastCheck: '07:10',
    day: 47,
  }
}

/**
 * Lee lo guardado en localStorage. Formato viejo {day, place, lastCheck}: entorno
 * 'station' y despegue = ahora − (day−1) días. Cualquier cosa dañada da la demostración.
 */
export function normalizeMission(raw: unknown, nowMs: number): Mission {
  const fallback = defaultMission(nowMs)
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return fallback
  const data = raw as Record<string, unknown>
  const place = typeof data.place === 'string' ? data.place : fallback.place
  const lastCheck = typeof data.lastCheck === 'string' ? data.lastCheck : fallback.lastCheck

  const env = data.environment
  const launchMs = typeof data.launchUtc === 'string' ? parseUtc(data.launchUtc) : null
  if (typeof env === 'string' && (ENVIRONMENTS as readonly string[]).includes(env) && launchMs !== null) {
    const mission: Mission = {
      environment: env as MissionEnvironment,
      launchUtc: new Date(launchMs).toISOString(),
      place,
      lastCheck,
      day: flightDay(nowMs, launchMs),
    }
    const arrival = typeof data.arrivalUtc === 'string' ? parseUtc(data.arrivalUtc) : null
    if (arrival !== null) mission.arrivalUtc = new Date(arrival).toISOString()
    if (typeof data.marsLongitudeEast === 'number' && Number.isFinite(data.marsLongitudeEast)) {
      mission.marsLongitudeEast = data.marsLongitudeEast
    }
    return mission
  }

  // Formato viejo.
  const oldDay = typeof data.day === 'number' && Number.isFinite(data.day) ? Math.max(1, Math.round(data.day)) : 47
  const launch = nowMs - (oldDay - 1) * MS_PER_DAY
  return { environment: 'station', launchUtc: new Date(launch).toISOString(), place, lastCheck, day: oldDay }
}

// ---------------------------------------------------------------------------
// Reloj de la rutina
// ---------------------------------------------------------------------------

export interface MissionClockReading {
  minutesOfDay: number
  dayKey: string
  /** 'UTC' o 'LMST'. */
  label: string
}

/**
 * Hora y día que usa la rutina. Cápsula, estación, tránsito y Luna: hora UTC y fecha UTC.
 * Marte: hora solar media local en la longitud de la misión; el día es el sol local.
 */
export function missionClock(
  nowMs: number,
  mission: Pick<Mission, 'environment' | 'launchUtc' | 'arrivalUtc' | 'marsLongitudeEast'>,
): MissionClockReading {
  if (mission.environment === 'mars') {
    const lon = mission.marsLongitudeEast ?? DEFAULT_MARS_LONGITUDE
    const msd = marsSolDate(nowMs)
    const lmst = marsLocalMeanSolarTime(msd, lon)
    const refMs = parseUtc(mission.arrivalUtc) ?? parseUtc(mission.launchUtc) ?? nowMs
    // El sol local cambia a la medianoche local (LMST), no a la de MTC.
    const sol = Math.floor(msd + lon / 360) - Math.floor(marsSolDate(refMs) + lon / 360) + 1
    return { minutesOfDay: Math.floor(lmst * 60), dayKey: `sol-${sol}`, label: 'LMST' }
  }
  const d = new Date(nowMs)
  return {
    minutesOfDay: d.getUTCHours() * 60 + d.getUTCMinutes(),
    dayKey: d.toISOString().slice(0, 10),
    label: 'UTC',
  }
}
