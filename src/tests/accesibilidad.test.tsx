import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { HoloShell } from '../components/health/HoloShell'
import { DailyCheckAssistant } from '../features/measurements/DailyCheckAssistant'
import { DailyCheckHistory } from '../features/measurements/DailyCheckHistory'
import { defaultMetrics } from '../features/measurements/dailyCheckData'
import type { DailyMetrics } from '../features/measurements/dailyCheckTypes'
import { TrendsPage } from '../features/trends/TrendsPage'
import { I18nProvider } from '../lib/I18nProvider'

const conIdioma = (nodo: React.ReactElement) => render(<I18nProvider>{nodo}</I18nProvider>)

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['es-MX'])
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

/** Pantalla mínima: un botón que abre el asistente, como en «Chequeo». */
function Prueba({ pasoInicial = 0 }: { pasoInicial?: number }) {
  const [abierto, setAbierto] = useState(false)
  const [paso, setPaso] = useState(pasoInicial)
  const [metricas, setMetricas] = useState<DailyMetrics>(defaultMetrics)
  return (
    <>
      <button type="button" onClick={() => setAbierto(true)}>Abrir asistente</button>
      {abierto && <DailyCheckAssistant metrics={metricas} step={paso} onChange={setMetricas} onStep={setPaso} onSave={() => setAbierto(false)} onClose={() => setAbierto(false)} />}
    </>
  )
}

describe('foco de los diálogos del chequeo', () => {
  it('al abrir mueve el foco al título, y el diálogo se nombra con él', () => {
    conIdioma(<Prueba />)
    fireEvent.click(screen.getByRole('button', { name: 'Abrir asistente' }))
    const dialogo = screen.getByRole('dialog')
    const titulo = screen.getByRole('heading', { level: 2 })
    expect(dialogo.getAttribute('aria-labelledby')).toBe(titulo.id)
    expect(document.activeElement).toBe(titulo)
  })

  it('Escape cierra y el foco vuelve al botón que lo abrió', () => {
    conIdioma(<Prueba />)
    const abrir = screen.getByRole('button', { name: 'Abrir asistente' })
    abrir.focus()
    fireEvent.click(abrir)
    expect(screen.queryByRole('dialog')).not.toBeNull()
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(abrir)
  })

  it('Tab y Shift+Tab se quedan dentro del diálogo', () => {
    conIdioma(<Prueba />)
    const abrir = screen.getByRole('button', { name: 'Abrir asistente' })
    abrir.focus()
    fireEvent.click(abrir)
    const dialogo = screen.getByRole('dialog')
    const lista = Array.from(dialogo.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])'))
    const ultimo = lista[lista.length - 1]
    ultimo.focus()
    fireEvent.keyDown(ultimo, { key: 'Tab' })
    expect(document.activeElement).toBe(lista[0])
    fireEvent.keyDown(lista[0], { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(ultimo)
  })

  it('al cambiar de paso el foco vuelve al título del paso nuevo', () => {
    conIdioma(<Prueba />)
    fireEvent.click(screen.getByRole('button', { name: 'Abrir asistente' }))
    const siguiente = screen.getByRole('button', { name: /Siguiente/ })
    siguiente.focus()
    fireEvent.click(siguiente)
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 2 }))
  })

  it('el historial también se cierra con Escape y se nombra con su título', () => {
    const alCerrar = vi.fn()
    conIdioma(<DailyCheckHistory records={[]} onClose={alCerrar} />)
    const dialogo = screen.getByRole('dialog')
    expect(dialogo.getAttribute('aria-labelledby')).toBe(screen.getByRole('heading', { level: 2 }).id)
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
    expect(alCerrar).toHaveBeenCalledTimes(1)
  })
})

describe('deslizadores con botones − y +', () => {
  it('los botones ajustan el valor de uno en uno y miden 44 px', () => {
    conIdioma(<Prueba pasoInicial={1} />)
    fireEvent.click(screen.getByRole('button', { name: 'Abrir asistente' }))
    const mas = screen.getAllByRole('button').find((b) => /^Aumentar/.test(b.getAttribute('aria-label') ?? ''))!
    const menos = screen.getAllByRole('button').find((b) => /^Disminuir/.test(b.getAttribute('aria-label') ?? ''))!
    expect(mas.className).toContain('h-11')
    expect(mas.className).toContain('w-11')
    const deslizador = screen.getByRole('slider') as HTMLInputElement
    const inicial = Number(deslizador.value)
    fireEvent.click(mas)
    expect(Number((screen.getByRole('slider') as HTMLInputElement).value)).toBe(inicial + 1)
    fireEvent.click(menos)
    fireEvent.click(menos)
    expect(Number((screen.getByRole('slider') as HTMLInputElement).value)).toBe(inicial - 1)
  })
})

describe('tarjetas de Tendencias sin depender del hover', () => {
  it('cada tarjeta es un botón con nombre, se abre con Enter y con Espacio y muestra su pista siempre', () => {
    conIdioma(<TrendsPage mission={{ environment: 'station', launchUtc: '2026-10-01T00:00:00Z', place: 'Estación', day: 47 }} />)
    const tarjetas = screen.getAllByRole('button', { name: /^Ver detalle de / })
    expect(tarjetas.length).toBeGreaterThan(0)
    expect(tarjetas[0].getAttribute('tabindex')).toBe('0')
    expect(screen.getAllByText('Detalles →').length).toBe(tarjetas.length)
    fireEvent.keyDown(tarjetas[0], { key: 'Enter' })
    expect(screen.queryAllByRole('button', { name: /^Ver detalle de / }).length).toBe(0)
  })

  it('el panel de indicadores declara aria-controls y se cierra con Escape y al tocar fuera', () => {
    conIdioma(<TrendsPage />)
    const abrir = screen.getByRole('button', { name: /Elegir datos/ })
    fireEvent.click(abrir)
    const idPanel = abrir.getAttribute('aria-controls')!
    expect(document.getElementById(idPanel)).not.toBeNull()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(document.getElementById(idPanel)).toBeNull()
    expect(abrir.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(abrir)
    expect(document.getElementById(idPanel)).not.toBeNull()
    fireEvent.pointerDown(document.body)
    expect(document.getElementById(idPanel)).toBeNull()
  })
})

describe('botonera de zonas del holograma', () => {
  it('cada botón dice zona y estado en texto accesible, con una señal que no es solo color', () => {
    conIdioma(
      <HoloShell
        selectedZone="heart"
        onSelectZone={() => {}}
        zonesStatus={{ head: 'ok', heart: 'act', metabolism: 'watch', body: undefined, legs: 'ok' }}
      >
        {() => null}
      </HoloShell>,
    )
    expect(screen.getByRole('button', { name: 'Corazón: Actuar ya' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Metabolismo: Vigilar' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Cerebro: Normal' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Cuerpo entero: sin lecturas' })).toBeTruthy()
    // La señal visible incluye el texto corto del estado, además del ícono.
    const corazon = screen.getByRole('button', { name: 'Corazón: Actuar ya' })
    expect(corazon.textContent).toContain('Actuar ya')
    expect(corazon.querySelectorAll('svg').length).toBeGreaterThanOrEqual(2)
    // Ya no hay emojis en la botonera.
    expect(corazon.textContent).not.toMatch(/\p{Extended_Pictographic}/u)
  })
})
