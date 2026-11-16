import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MedicalPage } from '../features/medical/MedicalPage'
import { CSV_BOM, buildCsv, buildJson, csvHeaders, escapeCsvField, exportFileName, formatMetricValue, isoUtc } from '../features/medical/exportData'
import { cellStatus, filterRecords, summarizeIndicators } from '../features/medical/medicalData'
import { defaultMetrics } from '../features/measurements/dailyCheckData'
import type { DailyMetrics, SavedRecord } from '../features/measurements/dailyCheckTypes'
import { I18nProvider } from '../lib/I18nProvider'
import { translate } from '../lib/i18n'
import type { Mission } from '../types'

const NOW = Date.parse('2026-11-16T12:00:00Z')
const mission: Mission = { environment: 'station', launchUtc: '2026-10-01T00:00:00Z', place: 'Estación', day: 47 }

function record(id: string, iso: string, metrics: Partial<DailyMetrics> = {}, sources?: SavedRecord['sources']): SavedRecord {
  return { id, timestamp: iso, dateStr: '', timeStr: '', metrics: { ...defaultMetrics, ...metrics }, ...(sources ? { sources } : {}) }
}

// Del más reciente al más antiguo, como los guarda la app.
const records: SavedRecord[] = [
  record('r3', '2026-11-16T10:00:00.000Z', { spo2: 89, heartRate: 118 }, { spo2: 'simulated', heartRate: 'simulated' }),
  record('r2', '2026-11-14T09:30:00.000Z', { spo2: 98, heartRate: 70 }, { heartRate: 'bluetooth' }),
  record('r1', '2026-10-20T08:00:00.000Z', { spo2: 97, heartRate: 66, bloodSugar: 95 }),
]

describe('escapeCsvField', () => {
  it('deja intacto el texto simple y los números', () => {
    expect(escapeCsvField('hola')).toBe('hola')
    expect(escapeCsvField(98)).toBe('98')
    expect(escapeCsvField(null)).toBe('')
  })

  it('entrecomilla campos con coma, comillas o saltos de línea y duplica las comillas', () => {
    expect(escapeCsvField('a,b')).toBe('"a,b"')
    expect(escapeCsvField('dijo "hola"')).toBe('"dijo ""hola"""')
    expect(escapeCsvField('línea1\nlínea2')).toBe('"línea1\nlínea2"')
    expect(escapeCsvField('a\r\nb')).toBe('"a\r\nb"')
  })
})

describe('buildCsv', () => {
  it('empieza con BOM, usa coma, CRLF y encabezados con unidades en el idioma activo', () => {
    const csv = buildCsv(records, mission, 'es')
    expect(csv.startsWith(CSV_BOM)).toBe(true)
    const lines = csv.slice(1).split('\r\n')
    expect(lines.at(-1)).toBe('')
    expect(lines[0].startsWith('"Fecha y hora (UTC, ISO 8601)",Día de vuelo,Presión sistólica (mmHg),Origen de: Presión sistólica,')).toBe(true)
    expect(lines[0]).toContain('Pulso (bpm)')
    expect(lines[0]).toContain('Frecuencia respiratoria (resp/min)')
    expect(lines[0]).toContain('Temperatura (°C)')
    expect(lines).toHaveLength(records.length + 2)
  })

  it('cada fila tiene tantos campos como encabezados, con fecha UTC ISO, día de vuelo y origen', () => {
    const csv = buildCsv(records, mission, 'es').slice(1).split('\r\n')
    const header = csvHeaders('es')
    const first = csv[1].split(',')
    expect(first).toHaveLength(header.length)
    expect(first[0]).toBe('2026-11-16T10:00:00Z')
    // Despegue el 1 de octubre: el 16 de noviembre es el día 47.
    expect(first[1]).toBe('47')
    const heart = header.findIndex((name) => name.startsWith('Pulso (bpm)'))
    expect(first[heart]).toBe('118')
    expect(first[heart + 1]).toBe('Simulado')
    const sys = header.findIndex((name) => name.startsWith('Presión sistólica'))
    expect(first[sys + 1]).toBe('Manual')
    expect(csv[2].split(',')[heart + 1]).toBe('Bluetooth')
  })

  it('la glucosa no medida queda vacía y los encabezados salen en inglés si el idioma es inglés', () => {
    const lines = buildCsv(records, mission, 'en').slice(1).split('\r\n')
    expect(lines[0].startsWith('"Date and time (UTC, ISO 8601)",Flight day,Systolic pressure (mmHg),Source of: Systolic pressure')).toBe(true)
    const sugar = csvHeaders('en').findIndex((name) => name.startsWith('Blood sugar'))
    expect(lines[1].split(',')[sugar]).toBe('')
    expect(lines[3].split(',')[sugar]).toBe('95')
  })

  it('sin registros solo lleva los encabezados', () => {
    expect(buildCsv([], mission, 'es').slice(1).split('\r\n')).toHaveLength(2)
  })
})

describe('buildJson', () => {
  const data = JSON.parse(buildJson(records, { mission, lang: 'es', nowMs: NOW }))

  it('lleva los metadatos y el aviso de borrador', () => {
    expect(data.app).toBe('Orbit Health')
    expect(typeof data.appVersion).toBe('string')
    expect(data.exportedAtUtc).toBe('2026-11-16T12:00:00Z')
    expect(data.mission).toMatchObject({ environment: 'station', place: 'Estación', launchUtc: '2026-10-01T00:00:00Z', flightDayAtExport: 47 })
    expect(data.thresholdsNotice).toContain('borrador')
    expect(data.thresholdsDraft.heartRate).toEqual({ min: 55, max: 85, warningMin: 45, warningMax: 110 })
    expect(data.recordCount).toBe(3)
  })

  it('cada registro lleva sus valores y el origen de todas las medidas (manual por defecto)', () => {
    expect(data.records).toHaveLength(3)
    const [latest, , oldest] = data.records
    expect(latest.timestampUtc).toBe('2026-11-16T10:00:00Z')
    expect(latest.flightDay).toBe(47)
    expect(latest.metrics.spo2).toBe(89)
    expect(latest.sources.spo2).toBe('simulated')
    expect(latest.sources.heartRate).toBe('simulated')
    expect(latest.sources.bloodPressureSys).toBe('manual')
    expect(data.records[1].sources.heartRate).toBe('bluetooth')
    expect(oldest.metrics.bloodSugar).toBe(95)
    expect(latest.metrics.bloodSugar).toBeNull()
  })
})

describe('nombre y formato de los archivos', () => {
  it('orbit-health_<entorno>_<AAAA-MM-DD>.<ext> con la fecha UTC', () => {
    expect(exportFileName('station', Date.parse('2026-11-16T23:59:59Z'), 'csv')).toBe('orbit-health_station_2026-11-16.csv')
    expect(exportFileName('mars', Date.parse('2026-01-02T00:00:00Z'), 'json')).toBe('orbit-health_mars_2026-01-02.json')
  })

  it('isoUtc quita los milisegundos', () => {
    expect(isoUtc(Date.parse('2026-11-16T10:00:00.123Z'))).toBe('2026-11-16T10:00:00Z')
  })

  it('formatMetricValue traduce ánimo y visión y deja la temperatura con un decimal', () => {
    const t = (key: Parameters<typeof translate>[1]) => translate('es', key)
    expect(formatMetricValue({ ...defaultMetrics, mood: 'Great' }, 'mood', t)).toBe('Excelente')
    expect(formatMetricValue({ ...defaultMetrics, visionChange: true }, 'visionChange', t)).toBe('Cambio notado')
    expect(formatMetricValue({ ...defaultMetrics, bodyTemperature: 37 }, 'bodyTemperature', t)).toBe('37.0')
  })
})

describe('cálculos de la Vista médica', () => {
  it('filtra por días hacia atrás desde ahora', () => {
    expect(filterRecords(records, '7d', NOW).map((r) => r.id)).toEqual(['r3', 'r2'])
    expect(filterRecords(records, '30d', NOW).map((r) => r.id)).toEqual(['r3', 'r2', 'r1'])
    expect(filterRecords(records, 'all', NOW)).toHaveLength(3)
  })

  it('resume último valor, promedio y mínimo/máximo de 7 días y lecturas seguidas fuera de rango', () => {
    const summary = summarizeIndicators(records, NOW)
    const spo2 = summary.find((row) => row.def.id === 'spo2')!
    expect(spo2.latest).toBe(89)
    expect(spo2.status).toBe('act')
    expect(spo2.avg).toBeCloseTo(93.5)
    expect([spo2.min, spo2.max]).toEqual([89, 98])
    expect(spo2.countLast7).toBe(2)
    expect(spo2.trend?.consecutiveOutside).toBe(1)
    const hr = summary.find((row) => row.def.id === 'hr')!
    expect(hr.status).toBe('act')
  })

  it('tres lecturas seguidas fuera de rango activan la alerta de tendencia', () => {
    const bad = [3, 2, 1].map((n) => record(`b${n}`, `2026-11-1${n}T10:00:00.000Z`, { spo2: 90 }))
    const spo2 = summarizeIndicators(bad, NOW).find((row) => row.def.id === 'spo2')!
    expect(spo2.trend?.status).toBe('critical')
    expect(spo2.trend?.consecutiveOutside).toBe(3)
  })

  it('incluye presión media y de pulso como valores calculados sin rango, y la glucosa usa el último valor medido', () => {
    const summary = summarizeIndicators(records, NOW)
    const map = summary.find((row) => row.def.id === 'map')!
    const pp = summary.find((row) => row.def.id === 'pp')!
    expect(map.latest).toBe(Math.round(78 + (128 - 78) / 3))
    expect(pp.latest).toBe(50)
    expect(map.status).toBeUndefined()
    expect(map.trend).toBeNull()
    expect(summary.find((row) => row.def.id === 'glucose')!.latest).toBe(95)
  })

  it('sin registros no hay valores ni promedios', () => {
    const row = summarizeIndicators([], NOW).find((item) => item.def.id === 'hr')!
    expect(row.latest).toBeNull()
    expect(row.avg).toBeNull()
  })

  it('el estado de cada celda sigue el rango del motor', () => {
    expect(cellStatus({ ...defaultMetrics, spo2: 89 }, 'spo2')).toBe('act')
    expect(cellStatus({ ...defaultMetrics, spo2: 94 }, 'spo2')).toBe('watch')
    expect(cellStatus(defaultMetrics, 'bloodSugar')).toBeUndefined()
    expect(cellStatus({ ...defaultMetrics, visionChange: true }, 'visionChange')).toBe('watch')
  })
})

describe('pantalla Vista médica', () => {
  beforeEach(() => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['es-MX'])
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    vi.setSystemTime(NOW)
  })
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })
  const show = (list: SavedRecord[], onNavigate = vi.fn()) => render(<I18nProvider><MedicalPage mission={mission} records={list} onNavigate={onNavigate} /></I18nProvider>)

  it('sin registros muestra el estado vacío y un botón que lleva al chequeo', () => {
    const onNavigate = vi.fn()
    show([], onNavigate)
    expect(screen.getByText('Todavía no hay registros')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Exportar/ })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Hacer un chequeo' }))
    expect(onNavigate).toHaveBeenCalledWith('check')
  })

  it('con registros muestra el encabezado, el resumen, la tabla con orígenes y el aviso de borrador', () => {
    show(records)
    expect(screen.getByText('Estación')).toBeTruthy()
    expect(screen.getByText('T+ 046/12:00:00')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Resumen por indicador' })).toBeTruthy()
    expect(screen.getAllByText('borrador').length).toBeGreaterThan(0)
    expect(screen.getByText('Presión arterial media')).toBeTruthy()
    const table = within(screen.getByRole('region', { name: /Tabla de registros/ }))
    expect(table.getAllByText('Simulado').length).toBeGreaterThan(0)
    expect(table.getAllByText('Bluetooth').length).toBe(1)
    expect(table.getAllByText('Actuar ya').length).toBeGreaterThan(0)
  })

  it('el filtro cambia cuántos registros se muestran', () => {
    show(records)
    expect(screen.getByText(/Mostrando 3 de 3 registros/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '7 días' }))
    expect(screen.getByText(/Mostrando 2 de 3 registros/)).toBeTruthy()
  })

  it('Exportar CSV descarga un archivo con el nombre esperado', () => {
    const create = vi.fn(() => 'blob:prueba')
    const revoke = vi.fn()
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke })
    const names: string[] = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { names.push(this.download) })
    show(records)
    fireEvent.click(screen.getByRole('button', { name: 'Exportar CSV' }))
    fireEvent.click(screen.getByRole('button', { name: 'Exportar JSON' }))
    expect(create).toHaveBeenCalledTimes(2)
    expect(names).toEqual(['orbit-health_station_2026-11-16.csv', 'orbit-health_station_2026-11-16.json'])
    expect(screen.getByRole('status').textContent).toContain('orbit-health_station_2026-11-16.json')
  })
})
