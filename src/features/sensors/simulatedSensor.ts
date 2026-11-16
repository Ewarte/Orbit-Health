import { SensorError, type SensorReading, type SensorSource } from './types'

export interface SimulatedOptions {
  /** Simula un valor fuera de rango (para la demostración): oxígeno bajo, pulso y respiración altos. */
  outOfRange?: boolean
  /** Fuente de números aleatorios entre 0 y 1 (se cambia en las pruebas). */
  random?: () => number
  /** Espera simulada antes de entregar la lectura, en milisegundos. */
  delayMs?: number
}

/** Número entero cercano a `center`, con una variación de ±`spread`. */
function around(center: number, spread: number, random: () => number): number {
  return Math.round(center + (random() * 2 - 1) * spread)
}

/**
 * Lectura simulada. Normal: pulso 62–74, oxígeno 97–99 y respiración 13–17, dentro de los rangos
 * del motor. Fuera de rango (demo): oxígeno 88–90, pulso 118–124 y respiración 26–28.
 */
export function simulateReading({ outOfRange = false, random = Math.random }: SimulatedOptions = {}): SensorReading {
  if (outOfRange) {
    return { heartRate: around(121, 3, random), spo2: around(89, 1, random), respiratoryRate: around(27, 1, random) }
  }
  return { heartRate: around(68, 6, random), spo2: Math.min(100, around(98, 1, random)), respiratoryRate: around(15, 2, random) }
}

/** Crea el sensor simulado: siempre disponible, sin hardware. */
export function createSimulatedSensor(options: SimulatedOptions = {}): SensorSource {
  const { outOfRange = false, delayMs = 700 } = options
  return {
    id: outOfRange ? 'simulated-alert' : 'simulated',
    origin: 'simulated',
    nameKey: outOfRange ? 'sensor.source.simulatedAlert' : 'sensor.source.simulated',
    fields: ['heartRate', 'spo2', 'respiratoryRate'],
    isAvailable: () => true,
    read: () =>
      new Promise<SensorReading>((resolve, reject) => {
        window.setTimeout(() => {
          try {
            resolve(simulateReading(options))
          } catch {
            reject(new SensorError('failed'))
          }
        }, delayMs)
      }),
  }
}
