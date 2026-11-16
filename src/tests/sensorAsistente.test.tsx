import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useEffect, useState } from 'react'
import { DailyCheckAssistant } from '../features/measurements/DailyCheckAssistant'
import { defaultMetrics } from '../features/measurements/dailyCheckData'
import type { DailyMetrics, MetricSources } from '../features/measurements/dailyCheckTypes'
import { I18nProvider } from '../lib/I18nProvider'

// Última medida y último origen que vio el asistente, para comprobarlos desde las pruebas.
const probe: { sources: MetricSources; metrics: DailyMetrics } = { sources: {}, metrics: defaultMetrics }

function Asistente({ paso }: { paso: number }) {
  const [metrics, setMetrics] = useState<DailyMetrics>(defaultMetrics)
  const [sources, setSources] = useState<MetricSources>({})
  const [step, setStep] = useState(paso)
  useEffect(() => {
    probe.sources = sources
    probe.metrics = metrics
  })
  return <DailyCheckAssistant metrics={metrics} sources={sources} onSourcesChange={setSources} step={step} onChange={setMetrics} onStep={setStep} onSave={() => undefined} onClose={() => undefined} />
}

const show = (paso: number) => render(<I18nProvider><Asistente paso={paso} /></I18nProvider>)

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['es-MX'])
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('«Leer del sensor» en el asistente', () => {
  it('lee del sensor simulado, marca el origen y vuelve a manual al ajustar a mano', async () => {
    show(2) // paso de oxígeno
    expect(screen.getByText('Origen: Manual')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Leer del sensor' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sensor simulado' }))
    expect(await screen.findByText(/Lectura recibida de «Sensor simulado»/, {}, { timeout: 3000 })).toBeTruthy()
    expect(screen.getByText('Origen: Simulado')).toBeTruthy()
    // El simulador entrega pulso, oxígeno y respiración: los tres quedan marcados.
    expect(probe.sources).toEqual({ heartRate: 'simulated', spo2: 'simulated', respiratoryRate: 'simulated' })
    expect(probe.metrics.spo2).toBeGreaterThanOrEqual(97)

    fireEvent.click(screen.getByRole('button', { name: /Aumentar|Increase/ }))
    expect(screen.getByText('Origen: Manual')).toBeTruthy()
    expect(probe.sources).toEqual({ heartRate: 'simulated', respiratoryRate: 'simulated' })
  })

  it('la opción de demostración deja el oxígeno fuera de rango', async () => {
    show(2)
    fireEvent.click(screen.getByRole('button', { name: 'Leer del sensor' }))
    fireEvent.click(screen.getByRole('button', { name: /fuera de rango/ }))
    expect(await screen.findByText(/Lectura recibida/, {}, { timeout: 3000 })).toBeTruthy()
    expect(probe.metrics.spo2).toBeLessThan(92)
  })

  it('sin Web Bluetooth (Safari, iPad) explica por qué y no se puede elegir', () => {
    show(1) // paso de pulso
    fireEvent.click(screen.getByRole('button', { name: 'Leer del sensor' }))
    const bluetooth = screen.getByRole('button', { name: 'Sensor Bluetooth' }) as HTMLButtonElement
    expect(bluetooth.disabled).toBe(true)
    expect(screen.getByText(/Bluetooth no está disponible en este navegador/)).toBeTruthy()
  })

  it('en el paso de respiración no se ofrece Bluetooth (no mide respiración)', () => {
    show(3)
    fireEvent.click(screen.getByRole('button', { name: 'Leer del sensor' }))
    expect(screen.queryByRole('button', { name: 'Sensor Bluetooth' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Sensor simulado' })).toBeTruthy()
  })
})
