/*
  Lectura de los datos de los sensores Bluetooth de salud (GATT). Funciones puras: reciben un
  DataView y devuelven números; no usan Bluetooth ni el navegador.
  Formatos: Bluetooth SIG, Heart Rate Service 1.0 (0x180D, característica 0x2A37) y Pulse Oximeter
  Service 1.0 (0x1822, característica puntual 0x2A5E y continua 0x2A5F). Todo va en little-endian.
*/

/** UUID cortos de los servicios y características que se usan. */
export const HEART_RATE_SERVICE = 0x180d
export const HEART_RATE_MEASUREMENT = 0x2a37
export const PULSE_OXIMETER_SERVICE = 0x1822
export const PLX_SPOT_CHECK_MEASUREMENT = 0x2a5e
export const PLX_CONTINUOUS_MEASUREMENT = 0x2a5f

/**
 * Convierte un SFLOAT de IEEE-11073 (16 bits: exponente de 4 bits con signo y mantisa de 12 bits
 * con signo) en número. Los valores especiales (NaN, NRes, ±INFINITY, reservado) devuelven null.
 */
export function sfloatToNumber(raw: number): number | null {
  const word = raw & 0xffff
  if (word === 0x07ff || word === 0x0800 || word === 0x07fe || word === 0x0802 || word === 0x0801) return null
  let mantissa = word & 0x0fff
  if (mantissa >= 0x0800) mantissa -= 0x1000
  let exponent = word >> 12
  if (exponent >= 0x08) exponent -= 0x10
  // toPrecision evita restos binarios como 97.99999999999999.
  return Number((mantissa * 10 ** exponent).toPrecision(10))
}

/**
 * Heart Rate Measurement (0x2A37). Byte 0 = flags; el bit 0 indica si el pulso ocupa 8 bits
 * (valor 0) o 16 bits (valor 1) a partir del byte 1. Devuelve el pulso en bpm, o null si faltan bytes.
 */
export function parseHeartRateMeasurement(view: DataView): number | null {
  if (view.byteLength < 2) return null
  const sixteenBit = (view.getUint8(0) & 0x01) !== 0
  if (sixteenBit) return view.byteLength >= 3 ? view.getUint16(1, true) : null
  return view.getUint8(1)
}

export interface PulseOximeterValues {
  spo2: number | null
  heartRate: number | null
}

/**
 * Medición del oxímetro, puntual (0x2A5E) o continua (0x2A5F): byte 0 = flags, luego SpO2 (SFLOAT)
 * y pulso (SFLOAT). Los campos opcionales que siguen no se usan. Devuelve null si faltan bytes.
 */
export function parsePulseOximeterMeasurement(view: DataView): PulseOximeterValues | null {
  if (view.byteLength < 5) return null
  return { spo2: sfloatToNumber(view.getUint16(1, true)), heartRate: sfloatToNumber(view.getUint16(3, true)) }
}
