import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import App from '../App'
import { DashboardPage } from '../components/dashboard/DashboardPage'
import { ErrorBoundary } from '../components/layout/ErrorBoundary'
import { zones } from '../data/mock'
import { evaluateDailyMetrics } from '../features/evaluation/healthEngine'
import { GuidancePage } from '../features/guidance/GuidancePage'
import { STORAGE_KEY, defaultMetrics } from '../features/measurements/dailyCheckData'
import { TrendsPage } from '../features/trends/TrendsPage'
import { I18nProvider } from '../lib/I18nProvider'
import type { Indicator, Mission } from '../types'

// Los hologramas usan WebGL, que jsdom no tiene.
vi.mock('../components/health/HologramaUnificado', () => ({ HologramaUnificado: () => null }))

const mission: Mission = { environment: 'station', launchUtc: '2026-10-01T00:00:00Z', place: 'Estación', day: 47 }
const withProvider = (node: React.ReactElement) => render(<I18nProvider>{node}</I18nProvider>)

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['es-MX'])
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('Hoy sin chequeos (usuario nuevo en blanco)', () => {
  it('muestra un estado vacío con un botón para el primer chequeo y ningún aviso', () => {
    const onStart = vi.fn()
    withProvider(<DashboardPage mission={mission} zones={zones} indicators={[]} lastCheckAt={null} onStartCheck={onStart} />)
    expect(screen.getByText('Aún no hay chequeos')).toBeTruthy()
    expect(screen.getByText('Estación, todavía sin chequeos')).toBeTruthy()
    expect(screen.queryByText('Ver qué hacer')).toBeNull()
    expect(screen.queryByText(/necesita atención/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Hacer mi primer chequeo/ }))
    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it('la app arranca en Hoy, en blanco, y el botón lleva al asistente del primer chequeo', () => {
    withProvider(<App />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/de la misión/)
    expect(screen.getByText('Aún no hay chequeos')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Hacer mi primer chequeo/ }))
    expect(screen.getByText('Paso 1 de 10')).toBeTruthy()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})

describe('aviso grande de Hoy: sale de las alertas en vivo', () => {
  const live = evaluateDailyMetrics({ ...defaultMetrics, spo2: 90, bloodPressureDia: 78 })

  it('muestra primero la alerta más grave, con título y pasos de la guía en el idioma activo', () => {
    withProvider(<DashboardPage mission={mission} zones={zones} indicators={live} lastCheckAt="2026-11-15T09:05:00Z" />)
    // Oxígeno (actuar) va antes que sueño y ejercicio (vigilar).
    expect(screen.getByText('Oxígeno en sangre: actúa ahora.')).toBeTruthy()
    expect(screen.queryByText('Sueño necesita atención.')).toBeNull()
    expect(screen.getByText('Estación, último chequeo 09:05 UTC')).toBeTruthy()
    fireEvent.click(screen.getByText('Ver qué hacer'))
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0)
  })

  it('sin alertas no hay aviso', () => {
    const ok = evaluateDailyMetrics({ ...defaultMetrics, bloodPressureDia: 75, sleepHours: 8, exerciseMinutes: 90 })
    expect(ok.every((item) => item.status === 'ok')).toBe(true)
    withProvider(<DashboardPage mission={mission} zones={zones} indicators={ok} lastCheckAt="2026-11-15T09:05:00Z" />)
    expect(screen.queryByText('Ver qué hacer')).toBeNull()
  })
})

describe('Orientación', () => {
  it('sin chequeos dice «aún no hay chequeos» en vez de alertas o «todo en orden»', () => {
    withProvider(<GuidancePage indicators={[]} />)
    expect(screen.getByText('Aún no hay chequeos')).toBeTruthy()
    expect(screen.queryByText('Todo en orden')).toBeNull()
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('«Valor actual» usa las unidades en español y muestra la razón', () => {
    const list: Indicator[] = [
      { id: 'sleep', name: 'Sleep', value: '5.2', unit: 'hours', status: 'watch', reason: 'below nominal range', reasonKey: 'reason.belowRange', zone: 'head', history: [] },
      { id: 'mood', name: 'Mood', value: 'Good', unit: 'of 5', status: 'watch', reason: '', zone: 'head', history: [] },
      { id: 'resp', name: 'Respiratory rate', value: '30', unit: 'breaths/min', status: 'act', reason: 'above nominal range', reasonKey: 'reason.aboveRange', zone: 'heart', history: [] },
    ]
    withProvider(<GuidancePage indicators={list} />)
    expect(screen.getByText('5.2 horas')).toBeTruthy()
    expect(screen.getByText('Bien de 5')).toBeTruthy()
    expect(screen.getByText('30 resp/min')).toBeTruthy()
    expect(screen.queryByText(/hours|Good|breaths/)).toBeNull()
    expect(screen.getByText('por debajo del rango normal')).toBeTruthy()
    expect(screen.getByText('por encima del rango normal')).toBeTruthy()
  })
})

describe('error boundary', () => {
  function Boom(): React.ReactElement {
    throw new Error('fallo de prueba')
  }

  it('muestra «Algo salió mal» con un botón para volver a Hoy en vez de dejar la app en blanco', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const onReset = vi.fn()
    withProvider(<ErrorBoundary onReset={onReset}><Boom /></ErrorBoundary>)
    expect(screen.getByText('Algo salió mal')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Volver a Hoy' }))
    expect(onReset).toHaveBeenCalledTimes(1)
  })
})

describe('Tendencias de demostración', () => {
  const nowMs = Date.UTC(2030, 5, 20, 12, 0)

  it('muestra siempre el aviso de demostración y la leyenda de puntos', () => {
    withProvider(<TrendsPage mission={mission} nowMs={nowMs} />)
    expect(screen.getByRole('note').textContent).toContain('Datos de demostración: los días sin chequeo se completan con una simulación')
    expect(screen.getByText('Punto relleno: chequeo real')).toBeTruthy()
    expect(screen.getByText('Punto vacío: simulación')).toBeTruthy()
  })

  it('el botón de simulación indica los días de la misión, no un 47 fijo', () => {
    withProvider(<TrendsPage mission={{ ...mission, day: 12 }} nowMs={nowMs} />)
    expect(screen.getByText('Cargar misión simulada (12 días)')).toBeTruthy()
  })

  it('el último día muestra los valores reales del chequeo (frecuencia cardíaca 111)', () => {
    const record = { id: 'x', timestamp: new Date(nowMs).toISOString(), dateStr: '', timeStr: '', metrics: { ...defaultMetrics, heartRate: 111 } }
    localStorage.setItem(STORAGE_KEY, JSON.stringify([record]))
    withProvider(<TrendsPage mission={mission} nowMs={nowMs} />)
    fireEvent.click(screen.getAllByText('Frecuencia cardíaca')[0])
    expect(screen.getAllByText('111 bpm').length).toBeGreaterThan(0)
  })
})

describe('recordatorios globales', () => {
  it('avisan en cualquier pantalla (aquí, Hoy) y se pueden descartar', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    vi.setSystemTime(Date.UTC(2026, 10, 15, 7, 5))
    withProvider(<App />)
    expect(screen.queryByRole('alert')).toBeNull()
    act(() => {
      vi.setSystemTime(Date.UTC(2026, 10, 15, 7, 10))
      vi.advanceTimersByTime(30_000)
    })
    expect(screen.getByRole('alert').textContent).toContain('Completar el chequeo diario de salud')
    fireEvent.click(screen.getByText('Entendido'))
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
