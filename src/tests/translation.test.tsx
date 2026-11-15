import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { DashboardPage } from '../components/dashboard/DashboardPage'
import { notices, zones } from '../data/mock'
import { defaultMetrics } from '../features/measurements/dailyCheckData'
import { DailyCheckPage } from '../features/measurements/DailyCheckPage'
import { evaluateDailyMetrics } from '../features/evaluation/healthEngine'
import { evaluateTrend } from '../features/evaluation/trendRule'
import { TrendsPage } from '../features/trends/TrendsPage'
import { LANG_STORAGE_KEY, messages, translate } from '../lib/i18n'
import { I18nProvider } from '../lib/I18nProvider'
import { indicatorName, indicatorReason, indicatorValue, moodLabel, unitLabel } from '../lib/domainText'
import type { Mission } from '../types'

// Los hologramas usan WebGL, que jsdom no tiene; aquí solo se prueba el texto de la pantalla.
vi.mock('../components/health/HologramaUnificado', () => ({ HologramaUnificado: () => null }))

const mission: Mission = { environment: 'transit', launchUtc: '2026-01-01T00:00:00Z', place: 'Tránsito lunar', lastCheck: '07:10', day: 47 }
const indicators = evaluateDailyMetrics(defaultMetrics)

const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort()

describe('claves de idioma', () => {
  it('español e inglés tienen exactamente las mismas claves', () => {
    expect(Object.keys(messages.en).sort()).toEqual(Object.keys(messages.es).sort())
  })

  it('ningún texto está vacío y los dos idiomas usan los mismos huecos {nombre}', () => {
    for (const key of Object.keys(messages.es) as (keyof typeof messages.es)[]) {
      expect(messages.es[key].trim(), key).not.toBe('')
      expect(messages.en[key].trim(), key).not.toBe('')
      expect(placeholders(messages.en[key]), key).toEqual(placeholders(messages.es[key]))
    }
  })
})

describe('textos de los datos', () => {
  const t = (lang: 'es' | 'en') => (key: Parameters<typeof translate>[1], params?: Record<string, string | number>) => translate(lang, key, params)

  it('traduce nombre, unidad, valor y motivo de un indicador', () => {
    const sleep = indicators.find((item) => item.id === 'sleep')!
    expect(indicatorName(t('es'), sleep)).toBe('Sueño')
    expect(indicatorName(t('en'), sleep)).toBe('Sleep')
    expect(unitLabel(t('es'), 'hours')).toBe('horas')
    expect(unitLabel(t('en'), 'hours')).toBe('hours')
    expect(unitLabel(t('es'), 'mmHg')).toBe('mmHg')
    expect(indicatorReason(t('es'), sleep)).toBe('por debajo del rango normal')
    expect(indicatorReason(t('en'), sleep)).toBe('below the normal range')
  })

  it('traduce el ánimo al mostrarlo y no cambia el valor guardado', () => {
    const mood = indicators.find((item) => item.id === 'mood')!
    expect(mood.value).toBe('Good')
    expect(indicatorValue(t('es'), mood)).toBe('Bien')
    expect(indicatorValue(t('en'), mood)).toBe('Good')
    expect(moodLabel(t('es'), 'Great')).toBe('Excelente')
  })

  it('usa el texto original si no hay clave', () => {
    expect(indicatorName(t('es'), { id: 'otro', name: 'Otro indicador' })).toBe('Otro indicador')
  })

  it('la regla de tendencia trae clave y parámetros para traducir el mensaje', () => {
    const result = evaluateTrend([3, 9, 9, 9], 2, 5)
    expect(result.status).toBe('critical')
    expect(translate('es', result.messageKey, result.messageParams)).toBe('3 lecturas seguidas fuera del rango normal.')
    expect(translate('en', result.messageKey, result.messageParams)).toBe('3 consecutive readings outside the normal range.')
  })
})

describe('pantallas traducidas', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['es-MX'])
  })
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  const withProvider = (node: React.ReactElement) => render(<I18nProvider>{node}</I18nProvider>)
  const today = () => withProvider(<DashboardPage mission={mission} zones={zones} indicators={indicators} notices={notices} />)
  const check = () => withProvider(<DailyCheckPage mission={mission} onNavigate={() => {}} />)

  it('Hoy: en español por defecto', () => {
    today()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Día 47 de la misión')
    expect(screen.getByText('Tránsito lunar, último chequeo 07:10')).toBeTruthy()
    expect(screen.getByText('Telemetría en vivo')).toBeTruthy()
    expect(screen.getByText('Telemetría focalizada 3D')).toBeTruthy()
    expect(screen.getByText('El sueño necesita atención.')).toBeTruthy()
    expect(screen.getByText('Ver qué hacer')).toBeTruthy()
    expect(screen.queryByText(/Mission day/)).toBeNull()
    expect(screen.queryByText('Sleep')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Ver todas/ }))
    expect(screen.getByText('Todas las métricas del traje')).toBeTruthy()
    expect(screen.getAllByText('Sueño').length).toBeGreaterThan(0)
    expect(screen.getByText('Bien')).toBeTruthy()
  })

  it('Hoy: en inglés al cambiar el idioma', () => {
    localStorage.setItem(LANG_STORAGE_KEY, 'en')
    today()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Mission day 47')
    expect(screen.getByText('Live telemetry')).toBeTruthy()
    expect(screen.getByText('3D focused telemetry')).toBeTruthy()
    expect(screen.getByText('Sleep needs attention.')).toBeTruthy()
    expect(screen.getByText('See what to do')).toBeTruthy()
    expect(screen.queryByText('Telemetría en vivo')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /View all/ }))
    expect(screen.getByText('All suit metrics')).toBeTruthy()
    expect(screen.getByText('Good')).toBeTruthy()
  })

  it('Chequeo diario: en español por defecto', () => {
    check()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Chequeo diario')
    expect(screen.getByText('Revisa tu salud')).toBeTruthy()
    expect(screen.getByText('Registrar datos')).toBeTruthy()
    expect(screen.getByText('Presión arterial')).toBeTruthy()
    expect(screen.getByText('Bien')).toBeTruthy()
    expect(screen.queryByText('Blood pressure')).toBeNull()
    expect(screen.queryByText(/Record data/)).toBeNull()
    fireEvent.click(screen.getAllByRole('button', { name: /Modificar valores/ })[0])
    expect(screen.getByText('Paso 1 de 10')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeTruthy()
  })

  it('Chequeo diario: en inglés al cambiar el idioma', () => {
    localStorage.setItem(LANG_STORAGE_KEY, 'en')
    check()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Daily check')
    expect(screen.getByText('Check your health')).toBeTruthy()
    expect(screen.getByText('Record data')).toBeTruthy()
    expect(screen.getByText('Blood pressure')).toBeTruthy()
    expect(screen.getByText('Good')).toBeTruthy()
    expect(screen.queryByText('Registrar datos')).toBeNull()
    fireEvent.click(screen.getAllByRole('button', { name: /Edit values/ })[0])
    expect(screen.getByText('Step 1 of 10')).toBeTruthy()
  })

  it('Chequeo diario: el aviso al guardar sale en el idioma activo', () => {
    check()
    fireEvent.click(screen.getByText('Registrar datos'))
    expect(screen.getByRole('status').textContent).toMatch(/Datos registrados correctamente en la telemetría local \(\d{2}:\d{2}\)\./)
  })

  it('Tendencias: en español por defecto y en inglés al cambiar', () => {
    withProvider(<TrendsPage mission={mission} />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Tendencias de salud')
    expect(screen.getByText('Últimos 7 días')).toBeTruthy()
    expect(screen.queryByText('Health trends')).toBeNull()
    cleanup()
    localStorage.setItem(LANG_STORAGE_KEY, 'en')
    withProvider(<TrendsPage mission={mission} />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Health trends')
    expect(screen.getByText('Last 7 days')).toBeTruthy()
  })
})
