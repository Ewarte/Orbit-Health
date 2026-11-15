import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { guidanceEntries } from '../data/guidance'
import { GuidancePage } from '../features/guidance/GuidancePage'
import { activeAlerts } from '../features/guidance/guidanceLogic'
import { LANG_STORAGE_KEY } from '../lib/i18n'
import { I18nProvider } from '../lib/I18nProvider'
import type { Indicator, Status } from '../types'

const make = (id: string, name: string, status: Status, value = '1'): Indicator => ({
  id, name, value, unit: 'u', status, reason: '', zone: 'head', history: [1],
})

const indicators: Indicator[] = [
  make('bp', 'Blood pressure', 'ok'),
  make('sleep', 'Sleep', 'watch', '5.2'),
  make('hr', 'Heart rate', 'act', '120'),
  make('desconocido', 'Unknown', 'watch'),
]

describe('alertas en vivo', () => {
  it('solo incluye lo que no está normal y pone lo crítico primero', () => {
    expect(activeAlerts(indicators).map((alert) => alert.indicator.id)).toEqual(['hr', 'sleep', 'desconocido'])
  })

  it('un indicador sin guía igual aparece, sin entrada', () => {
    expect(activeAlerts(indicators).find((alert) => alert.indicator.id === 'desconocido')?.entry).toBeUndefined()
  })

  it('no hay alertas si todo está normal', () => {
    expect(activeAlerts([make('bp', 'Blood pressure', 'ok')])).toEqual([])
  })
})

describe('contenido de las guías', () => {
  it('cubre los 8 indicadores reales y todo está en los dos idiomas', () => {
    expect(guidanceEntries.map((entry) => entry.indicatorId).sort()).toEqual(
      ['bp', 'exercise', 'glucose', 'hr', 'mood', 'sleep', 'temp', 'vision'],
    )
    for (const entry of guidanceEntries) {
      for (const lang of ['es', 'en'] as const) {
        expect(entry.name[lang].trim()).not.toBe('')
        expect(entry.meaning[lang].trim()).not.toBe('')
        expect(entry.notify[lang].trim()).not.toBe('')
        for (const list of [entry.doNow, entry.ifWorse, entry.prevent]) expect(list[lang].length).toBeGreaterThan(0)
      }
      expect(entry.source.url).toMatch(/^https:\/\//)
    }
  })
})

describe('pantalla de orientación', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['es-MX'])
  })
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  const view = (list: Indicator[]) => render(<I18nProvider><GuidancePage indicators={list} /></I18nProvider>)

  it('muestra una tarjeta por alerta, en español, con el conteo', () => {
    view(indicators)
    expect(screen.getByRole('status').textContent).toBe('3 indicadores necesitan atención')
    expect(screen.getByRole('heading', { name: 'Frecuencia cardíaca' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Sueño' })).toBeTruthy()
    expect(screen.getAllByText('Haz esto ahora').length).toBe(3)
    expect(screen.queryByRole('heading', { name: 'Presión arterial' })).toBeNull()
  })

  it('muestra «todo en orden» cuando no hay alertas', () => {
    view([make('bp', 'Blood pressure', 'ok')])
    expect(screen.getByText('Todo en orden')).toBeTruthy()
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('cambia al inglés con el idioma guardado', () => {
    localStorage.setItem(LANG_STORAGE_KEY, 'en')
    view([make('sleep', 'Sleep', 'watch', '5.2')])
    expect(screen.getByRole('status').textContent).toBe('1 indicator needs attention')
    expect(screen.getByText('Do this now')).toBeTruthy()
  })

  it('marca como borrador y dice en qué se basa cada guía', () => {
    view([make('glucose', 'Blood sugar', 'watch', '150')])
    expect(screen.getByText('Borrador por revisar')).toBeTruthy()
    expect(screen.getByText(/Deducción del equipo/)).toBeTruthy()
  })
})
