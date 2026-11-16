import {
  HEART_RATE_MEASUREMENT,
  HEART_RATE_SERVICE,
  PLX_CONTINUOUS_MEASUREMENT,
  PLX_SPOT_CHECK_MEASUREMENT,
  PULSE_OXIMETER_SERVICE,
  parseHeartRateMeasurement,
  parsePulseOximeterMeasurement,
} from './bluetoothParsing'
import { SensorError, type SensorReading, type SensorSource } from './types'

/** Tiempo máximo para conectar con el dispositivo. */
const CONNECT_TIMEOUT_MS = 15_000
/** Tiempo máximo de espera de la primera medición (el oxímetro puntual solo envía al medir). */
const MEASURE_TIMEOUT_MS = 20_000

/** ¿Este navegador tiene Web Bluetooth? (Chrome y Edge sí; Safari e iPad no.) */
export function bluetoothAvailable(): boolean {
  return typeof navigator !== 'undefined' && navigator.bluetooth !== undefined
}

function errorName(error: unknown): string {
  return typeof error === 'object' && error !== null && 'name' in error ? String((error as { name: unknown }).name) : ''
}

/** Rechaza con SensorError('timeout') si la promesa no termina a tiempo. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new SensorError('timeout')), ms)
    promise.then(
      (value) => { window.clearTimeout(timer); resolve(value) },
      (error: unknown) => { window.clearTimeout(timer); reject(error) },
    )
  })
}

/** Servicio del dispositivo, o null si no lo tiene. */
async function findService(server: BluetoothRemoteGATTServer, uuid: number): Promise<BluetoothRemoteGATTService | null> {
  try {
    return await server.getPrimaryService(uuid)
  } catch (error) {
    if (errorName(error) === 'NotFoundError') return null
    throw error
  }
}

/** Espera la primera medición de una característica y la entrega como DataView. */
async function firstValue(characteristic: BluetoothRemoteGATTCharacteristic): Promise<DataView> {
  const value = new Promise<DataView>((resolve) => {
    const onChange = (event: Event) => {
      const data = (event.target as BluetoothRemoteGATTCharacteristic).value
      if (!data) return
      characteristic.removeEventListener('characteristicvaluechanged', onChange)
      resolve(data)
    }
    characteristic.addEventListener('characteristicvaluechanged', onChange)
  })
  await characteristic.startNotifications()
  try {
    return await withTimeout(value, MEASURE_TIMEOUT_MS)
  } finally {
    characteristic.stopNotifications().catch(() => undefined)
  }
}

/** Primera característica que tenga el servicio entre las pedidas (puntual y, si no, continua). */
async function findCharacteristic(service: BluetoothRemoteGATTService, uuids: number[]): Promise<BluetoothRemoteGATTCharacteristic | null> {
  for (const uuid of uuids) {
    try {
      return await service.getCharacteristic(uuid)
    } catch (error) {
      if (errorName(error) !== 'NotFoundError') throw error
    }
  }
  return null
}

/** Traduce los errores del navegador a los motivos que explica la interfaz. */
function toSensorError(error: unknown): SensorError {
  if (error instanceof SensorError) return error
  const name = errorName(error)
  if (name === 'NotFoundError') return new SensorError('cancelled')
  if (name === 'SecurityError') return new SensorError('insecure')
  if (name === 'NotSupportedError') return new SensorError('unsupported')
  return new SensorError('failed')
}

async function readFromDevice(device: BluetoothDevice): Promise<SensorReading> {
  const gatt = device.gatt
  if (!gatt) throw new SensorError('failed')
  try {
    const server = await withTimeout(gatt.connect(), CONNECT_TIMEOUT_MS)
    const reading: SensorReading = {}
    let foundService = false

    // Oxímetro de pulso: oxígeno y pulso en una sola medición.
    const oximeter = await findService(server, PULSE_OXIMETER_SERVICE)
    if (oximeter) {
      const characteristic = await findCharacteristic(oximeter, [PLX_SPOT_CHECK_MEASUREMENT, PLX_CONTINUOUS_MEASUREMENT])
      if (characteristic) {
        foundService = true
        const values = parsePulseOximeterMeasurement(await firstValue(characteristic))
        if (values?.spo2 != null) reading.spo2 = values.spo2
        if (values?.heartRate != null) reading.heartRate = values.heartRate
      }
    }

    // Monitor de ritmo cardíaco: solo si el oxímetro no dio pulso.
    if (reading.heartRate === undefined) {
      const heartService = await findService(server, HEART_RATE_SERVICE)
      const characteristic = heartService ? await findCharacteristic(heartService, [HEART_RATE_MEASUREMENT]) : null
      if (characteristic) {
        foundService = true
        const bpm = parseHeartRateMeasurement(await firstValue(characteristic))
        if (bpm !== null) reading.heartRate = bpm
      }
    }

    if (!foundService) throw new SensorError('noService')
    if (Object.keys(reading).length === 0) throw new SensorError('noData')
    return reading
  } finally {
    if (gatt.connected) gatt.disconnect()
  }
}

/** Sensor Bluetooth real (Web Bluetooth): monitor de ritmo cardíaco y oxímetro de pulso estándar. */
export const bluetoothSensor: SensorSource = {
  id: 'bluetooth',
  origin: 'bluetooth',
  nameKey: 'sensor.source.bluetooth',
  fields: ['heartRate', 'spo2'],
  isAvailable: bluetoothAvailable,
  async read() {
    if (!bluetoothAvailable()) throw new SensorError('unsupported')
    if (typeof window !== 'undefined' && window.isSecureContext === false) throw new SensorError('insecure')
    try {
      const device = await navigator.bluetooth!.requestDevice({
        filters: [{ services: [HEART_RATE_SERVICE] }, { services: [PULSE_OXIMETER_SERVICE] }],
        optionalServices: [HEART_RATE_SERVICE, PULSE_OXIMETER_SERVICE],
      })
      return await readFromDevice(device)
    } catch (error) {
      throw toSensorError(error)
    }
  },
}
