import { bluetoothSensor } from './bluetoothSensor'
import { createSimulatedSensor } from './simulatedSensor'
import type { SensorSource } from './types'

/** Fuentes que ofrece el selector: simulada normal, simulada con valores fuera de rango (demo) y Bluetooth. */
export const sensorSources: readonly SensorSource[] = [
  createSimulatedSensor(),
  createSimulatedSensor({ outOfRange: true }),
  bluetoothSensor,
]

export { SensorError } from './types'
export type { SensorField, SensorReading, SensorSource } from './types'
export { sanitizeReading } from './readingUtils'
