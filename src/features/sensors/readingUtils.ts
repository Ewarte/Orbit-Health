import { POSSIBLE_RANGES } from '../measurements/dailyCheckData'
import type { SensorField, SensorReading } from './types'

const FIELDS: readonly SensorField[] = ['heartRate', 'spo2', 'respiratoryRate']

/**
 * Deja solo los valores plausibles de una lectura: números finitos dentro del rango posible de la
 * medida (los mismos con los que se validan los registros), redondeados al entero. Lo demás se
 * descarta, así un sensor defectuoso no guarda cifras imposibles.
 */
export function sanitizeReading(reading: SensorReading): SensorReading {
  const result: SensorReading = {}
  for (const field of FIELDS) {
    const value = reading[field]
    if (typeof value !== 'number' || !Number.isFinite(value)) continue
    const rounded = Math.round(value)
    const range = POSSIBLE_RANGES[field]
    if (rounded >= range.min && rounded <= range.max) result[field] = rounded
  }
  return result
}
