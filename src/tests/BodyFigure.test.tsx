import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BodyFigure } from '../components/health/BodyFigure'
import type { ZoneId, Status } from '../types'

describe('BodyFigure', () => {
  const dummyZones: Record<ZoneId, { name: string; status?: Status }> = {
    head: { name: 'Brain & behavior', status: 'watch' },
    heart: { name: 'Heart & circulation', status: 'ok' },
    metabolism: { name: 'Metabolism', status: 'ok' },
    body: { name: 'Whole body', status: 'ok' },
    legs: { name: 'Bones & muscles', status: 'watch' },
  }

  it('renders all 5 anatomical interactive zones', () => {
    const onSelect = vi.fn()
    render(<BodyFigure zones={dummyZones} selected="head" onSelect={onSelect} />)

    expect(screen.getByRole('button', { name: /Brain & behavior/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /Heart & circulation/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /Metabolism/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /Whole body/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /Bones & muscles/i })).toBeDefined()
  })

  it('indicates selected state with aria-pressed', () => {
    const onSelect = vi.fn()
    render(<BodyFigure zones={dummyZones} selected="heart" onSelect={onSelect} />)

    const heartZone = screen.getByRole('button', { name: /Heart & circulation/i })
    expect(heartZone.getAttribute('aria-pressed')).toBe('true')

    const headZone = screen.getByRole('button', { name: /Brain & behavior/i })
    expect(headZone.getAttribute('aria-pressed')).toBe('false')
  })

  it('calls onSelect when a zone is clicked', () => {
    const onSelect = vi.fn()
    render(<BodyFigure zones={dummyZones} selected="head" onSelect={onSelect} />)

    const chest = screen.getByRole('button', { name: /Heart & circulation/i })
    fireEvent.click(chest)
    expect(onSelect).toHaveBeenCalledWith('heart')

    const legs = screen.getByRole('button', { name: /Bones & muscles/i })
    fireEvent.click(legs)
    expect(onSelect).toHaveBeenCalledWith('legs')
  })

  it('supports keyboard navigation via Enter and Space', () => {
    const onSelect = vi.fn()
    render(<BodyFigure zones={dummyZones} selected="head" onSelect={onSelect} />)

    const abdomen = screen.getByRole('button', { name: /Metabolism/i })
    fireEvent.keyDown(abdomen, { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledWith('metabolism')

    const arms = screen.getByRole('button', { name: /Whole body/i })
    fireEvent.keyDown(arms, { key: ' ' })
    expect(onSelect).toHaveBeenCalledWith('body')
  })
})
