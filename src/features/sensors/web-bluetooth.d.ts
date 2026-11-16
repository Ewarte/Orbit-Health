/*
  Tipos mínimos de Web Bluetooth (solo lo que usa esta app), para no agregar paquetes de tipos.
  Web Bluetooth existe en Chrome y Edge (https o localhost); no en Safari ni en iPad.
*/
interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  value?: DataView
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>
  stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>
}

interface BluetoothRemoteGATTService {
  getCharacteristic(characteristic: number | string): Promise<BluetoothRemoteGATTCharacteristic>
}

interface BluetoothRemoteGATTServer {
  connected: boolean
  connect(): Promise<BluetoothRemoteGATTServer>
  disconnect(): void
  getPrimaryService(service: number | string): Promise<BluetoothRemoteGATTService>
}

interface BluetoothDevice extends EventTarget {
  id: string
  name?: string
  gatt?: BluetoothRemoteGATTServer
}

interface BluetoothRequestDeviceOptions {
  filters?: { services?: (number | string)[]; name?: string }[]
  optionalServices?: (number | string)[]
  acceptAllDevices?: boolean
}

interface Bluetooth {
  requestDevice(options: BluetoothRequestDeviceOptions): Promise<BluetoothDevice>
}

interface Navigator {
  /** Solo existe en navegadores con Web Bluetooth. */
  bluetooth?: Bluetooth
}
