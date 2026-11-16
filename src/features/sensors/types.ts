import type { MessageKey } from '../../lib/i18n'
import type { DataSource } from '../measurements/dailyCheckTypes'

/** Medidas que un sensor puede entregar. */
export type SensorField = 'heartRate' | 'spo2' | 'respiratoryRate'

/** Lectura parcial: solo trae los campos que el sensor midió. */
export type SensorReading = Partial<Record<SensorField, number>>

/** Motivos de fallo de una lectura; cada uno tiene su mensaje en sensor.error.<código>. */
export type SensorErrorCode = 'unsupported' | 'insecure' | 'cancelled' | 'noService' | 'timeout' | 'noData' | 'failed'

export class SensorError extends Error {
  code: SensorErrorCode
  constructor(code: SensorErrorCode, message?: string) {
    super(message ?? code)
    this.name = 'SensorError'
    this.code = code
  }
}

/** Fuente de datos de un sensor: interfaz común del simulador y del Bluetooth. */
export interface SensorSource {
  id: string
  /** Origen con el que se marcan los datos que entrega. */
  origin: Exclude<DataSource, 'manual'>
  /** Clave de texto con el nombre que ve la persona. */
  nameKey: MessageKey
  /** Medidas que entrega. */
  fields: readonly SensorField[]
  /** ¿Se puede usar en este navegador? */
  isAvailable(): boolean
  /** Hace una lectura; rechaza con SensorError si falla. */
  read(): Promise<SensorReading>
}
