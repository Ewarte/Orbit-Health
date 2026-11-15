import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RoutinePage } from '../features/routine/RoutinePage'
import { MissionPage } from '../features/mission/MissionPage'
import { mission, notices, indicators } from '../data/mock'

describe('RoutinePage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders routine header and tasks checklist', () => {
    render(<RoutinePage mission={mission} notices={notices} />)

    expect(screen.getByText(/Rutina y Contramedidas/i)).toBeDefined()
    expect(screen.getByText(/Contramedida de fuerza resistiva/i)).toBeDefined()
  })

  it('displays medical alert banner with actionable recommendation', () => {
    render(<RoutinePage mission={mission} notices={notices} />)

    expect(screen.getByText(/Alerta del Panel Clínico/i)).toBeDefined()
    expect(screen.getByRole('button', { name: /Aplicar recomendación a mi rutina/i })).toBeDefined()
  })

  it('allows applying the recommendation to routine tasks', () => {
    render(<RoutinePage mission={mission} notices={notices} />)

    const applyButton = screen.getByRole('button', { name: /Aplicar recomendación a mi rutina/i })
    fireEvent.click(applyButton)

    expect(screen.getByText(/Contramedida aplicada en rutina/i)).toBeDefined()
    expect(screen.getByText(/Atenuación de espectro lumínico/i)).toBeDefined()
  })

  it('toggles task completion and saves to localStorage', () => {
    render(<RoutinePage mission={mission} notices={notices} />)

    const toggleButton = screen.getAllByRole('button', { name: /Marcar como/i })[0]
    fireEvent.click(toggleButton)

    const saved = localStorage.getItem('orbit_health_routine_tasks')
    expect(saved).not.toBeNull()
  })
})

describe('MissionPage', () => {
  it('renders mission day context, flight trajectory and ECLSS telemetry', () => {
    render(<MissionPage mission={mission} indicators={indicators} notices={notices} />)

    expect(screen.getByText(/Misión Orbital: Día 47/i)).toBeDefined()
    expect(screen.getByText(/Trayectoria de Vuelo/i)).toBeDefined()
    expect(screen.getByText(/Dosimetría de Radiación/i)).toBeDefined()
    expect(screen.getByText(/Controles de Entorno y Soporte Vital/i)).toBeDefined()
  })

  it('allows simulating other flight phases', () => {
    render(<MissionPage mission={mission} indicators={indicators} notices={notices} />)

    const orbitPhaseButton = screen.getByRole('button', { name: /Inserción en Órbita Lunar/i })
    fireEvent.click(orbitPhaseButton)

    expect(screen.getByText(/Misión Orbital: Día 65/i)).toBeDefined()
  })
})
