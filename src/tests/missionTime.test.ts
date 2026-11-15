import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { I18nProvider } from '../lib/I18nProvider'
import { MissionPage } from '../features/mission/MissionPage'
import {
  flightDay,
  formatMarsHours,
  formatMet,
  formatUtc,
  marsCoordinatedTime,
  marsLocalMeanSolarTime,
  marsSolDate,
  metParts,
  missionClock,
  normalizeMission,
  solNumber,
} from '../lib/missionTime'

const DAY = 86_400_000
const launch = Date.UTC(2026, 9, 1, 12, 0, 0)

describe('MET y día de vuelo', () => {
  it('formatea el MET', () => {
    expect(formatMet(metParts(launch, launch))).toBe('T+ 000/00:00:00')
    expect(formatMet(metParts(launch + DAY + 2 * 3_600_000, launch))).toBe('T+ 001/02:00:00')
    expect(formatMet(metParts(launch + 46 * DAY + 3 * 3_600_000 + 12 * 60_000 + 9_000, launch))).toBe('T+ 046/03:12:09')
    expect(formatMet(metParts(launch - 5_000, launch))).toBe('T− 000/00:00:05')
  })

  it('cuenta el día de vuelo desde 1', () => {
    expect(flightDay(launch, launch)).toBe(1)
    expect(flightDay(launch + 46 * DAY, launch)).toBe(47)
    expect(flightDay(launch - DAY, launch)).toBe(1)
  })

  it('da hora y fecha en UTC', () => {
    expect(formatUtc(Date.UTC(2026, 10, 15, 23, 5, 9))).toEqual({ time: '23:05:09', date: '2026-11-15' })
  })
})

describe('Marte', () => {
  it('coincide con el ejemplo oficial de Mars24 (MSD 44796,0 el 2000-01-06)', () => {
    expect(Math.abs(marsSolDate(Date.UTC(2000, 0, 6)) - 44796.0)).toBeLessThan(0.001)
  })

  it('la hora solar local suma longitud/15 a la MTC', () => {
    const msd = marsSolDate(Date.UTC(2026, 10, 15, 8, 30))
    const mtc = marsCoordinatedTime(msd)
    expect(marsLocalMeanSolarTime(msd, 15)).toBeCloseTo((mtc + 1) % 24, 9)
    expect(marsLocalMeanSolarTime(msd, -15)).toBeCloseTo((mtc + 23) % 24, 9)
    expect(formatMarsHours(13.5)).toBe('13:30:00')
  })

  it('numera los soles desde la llegada', () => {
    const arrival = Date.UTC(2026, 0, 1)
    expect(solNumber(arrival, arrival)).toBe(1)
    expect(solNumber(arrival + 88_775_244 * 3 + 1_000, arrival)).toBe(4)
    expect(solNumber(arrival + 88_775_244 * 3 - 60_000, arrival)).toBe(3)
  })
})

describe('misión guardada y reloj de la rutina', () => {
  const now = Date.UTC(2026, 10, 15, 8, 30)

  it('convierte el formato viejo a estación con el mismo día de vuelo', () => {
    const mission = normalizeMission({ day: 47, place: 'Lunar transit', lastCheck: '06:00' }, now)
    expect(mission.environment).toBe('station')
    expect(mission.place).toBe('Lunar transit')
    expect(mission.lastCheck).toBe('06:00')
    expect(flightDay(now, Date.parse(mission.launchUtc))).toBe(47)
  })

  it('conserva el formato nuevo y usa la demostración si lo guardado está dañado', () => {
    const saved = { environment: 'mars', launchUtc: '2026-01-01T00:00:00.000Z', place: 'Jezero', lastCheck: '07:10', marsLongitudeEast: 80 }
    expect(normalizeMission(saved, now)).toMatchObject({ environment: 'mars', marsLongitudeEast: 80, place: 'Jezero' })
    expect(normalizeMission('basura', now)).toMatchObject({ environment: 'station', day: 47 })
  })

  it('en estación da minutos y fecha UTC; en Marte, la clave de sol', () => {
    const base = { launchUtc: '2026-01-01T00:00:00.000Z' }
    expect(missionClock(now, { ...base, environment: 'station' })).toEqual({ minutesOfDay: 8 * 60 + 30, dayKey: '2026-11-15', label: 'UTC' })
    const mars = missionClock(now, { ...base, environment: 'mars', marsLongitudeEast: 77.45 })
    expect(mars.dayKey.startsWith('sol-')).toBe(true)
    expect(mars.label).toBe('LMST')
    expect(mars.minutesOfDay).toBeGreaterThanOrEqual(0)
    expect(mars.minutesOfDay).toBeLessThan(24 * 60)
  })
})

describe('pantalla de misión', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['es-MX'])
  })
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('muestra el reloj y cambia los campos al elegir Marte', () => {
    const mission = { environment: 'station' as const, launchUtc: '2026-09-30T06:00:00.000Z', day: 47, place: 'ISS', lastCheck: '07:10' }
    render(createElement(I18nProvider, null, createElement(MissionPage, { mission, onSave: () => {} })))
    expect(screen.getByText('Reloj de la misión')).toBeTruthy()
    expect(screen.getByText(/T\+ \d{3}\/\d{2}:\d{2}:\d{2}/)).toBeTruthy()
    expect(screen.queryByText(/Longitud este del sitio/)).toBeNull()
    fireEvent.click(screen.getByLabelText(/^Marte/))
    expect(screen.getByText(/Longitud este del sitio/)).toBeTruthy()
    expect(screen.getByText(/Llegada a la superficie/)).toBeTruthy()
    expect(screen.getByText(/Hora solar local \(LMST\)/)).toBeTruthy()
  })
})
