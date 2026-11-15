import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BodyMapPage } from '../components/health/BodyMapPage'
import type { Indicator, Zone } from '../types'

const zones: Zone[] = [
  { id: 'head', name: 'Brain & behavior', about: 'Sleep, mood and vision.' },
  { id: 'heart', name: 'Heart & circulation', about: 'Blood pressure and heart rate.' },
  { id: 'metabolism', name: 'Metabolism', about: 'Blood sugar.' },
  { id: 'body', name: 'Whole body', about: 'Body temperature.' },
  { id: 'legs', name: 'Bones & muscles', about: 'Bone density.' },
]

const indicators: Indicator[] = [
  { id: 'sleep', name: 'Sleep', value: '5.8', unit: 'h', status: 'watch', reason: '3 short nights', zone: 'head', history: [7, 6, 5.8] },
  { id: 'mood', name: 'Mood', value: '3', unit: 'of 5', status: 'watch', reason: 'below usual', zone: 'head', history: [4, 3, 3] },
  { id: 'bp', name: 'Blood pressure', value: '128/82', unit: 'mmHg', status: 'ok', reason: '', zone: 'heart', history: [126, 128] },
  { id: 'hr', name: 'Heart rate', value: '64', unit: 'bpm', status: 'ok', reason: '', zone: 'heart', history: [65, 64] },
  { id: 'glucose', name: 'Blood sugar', value: '96', unit: 'mg/dL', status: 'ok', reason: '', zone: 'metabolism', history: [98, 96] },
  { id: 'temp', name: 'Body temperature', value: '36.7', unit: '°C', status: 'ok', reason: '', zone: 'body', history: [36.6, 36.7] },
  { id: 'exercise', name: 'Bone session', value: '45', unit: 'min', status: 'watch', reason: 'Below protocol', zone: 'legs', history: [90, 45] },
]

describe('BodyMapPage', () => {
  it('renders all 5 interactive body zones', () => {
    render(<BodyMapPage zones={zones} indicators={indicators} />)

    expect(screen.getByRole('button', { name: /Cerebro y conducta/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /Corazón, pulmones y circulación/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /Metabolismo y digestión/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /Cuerpo entero e inmunidad/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /Huesos y músculos/i })).toBeDefined()
  })

  it('shows stat cloud for the initially selected zone (worst status)', () => {
    render(<BodyMapPage zones={zones} indicators={indicators} />)

    // Head has "watch" status so it starts selected — its indicators should be visible
    expect(screen.getByText('Sueño')).toBeDefined()
    expect(screen.getByText('5.8')).toBeDefined()
    expect(screen.getByText('Ánimo')).toBeDefined()
  })

  it('switches stat cloud when clicking another zone', () => {
    render(<BodyMapPage zones={zones} indicators={indicators} />)

    // Click on heart zone
    const heartZone = screen.getByRole('button', { name: /Corazón, pulmones y circulación/i })
    fireEvent.click(heartZone)

    // Heart indicators should be visible
    expect(screen.getByText('Presión arterial')).toBeDefined()
    expect(screen.getByText('Frecuencia cardíaca')).toBeDefined()
  })

  it('supports keyboard navigation', () => {
    render(<BodyMapPage zones={zones} indicators={indicators} />)

    const metabolismZone = screen.getByRole('button', { name: /Metabolismo y digestión/i })
    fireEvent.keyDown(metabolismZone, { key: 'Enter' })

    expect(screen.getByText('Glucosa en sangre')).toBeDefined()
  })
})
