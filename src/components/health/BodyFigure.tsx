import type { KeyboardEvent, ReactNode } from 'react'
import type { Status, ZoneId } from '../../types'
import { statusUi } from '../../lib/status'

interface ZoneState {
  name: string
  /** undefined = sin mediciones todavía */
  status?: Status
}

interface Props {
  zones: Record<ZoneId, ZoneState>
  selected: ZoneId
  onSelect: (zone: ZoneId) => void
  className?: string
}

/**
 * Figura humana con zonas seleccionables.
 * Cada zona es un botón: se puede pulsar, tocar o recorrer con teclado.
 * El color indica el estado y el nombre accesible lo dice también en texto.
 */
export function BodyFigure({ zones, selected, onSelect, className }: Props) {
  function zone(id: ZoneId, shapes: ReactNode) {
    const state = zones[id]
    const fill = state.status ? statusUi[state.status].cssVar : 'var(--color-fig)'
    const statusLabel = state.status ? statusUi[state.status].label : 'No readings yet'
    const isSelected = selected === id

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onSelect(id)
      }
    }

    return (
      <g
        role="button"
        tabIndex={0}
        aria-label={`${state.name}: ${statusLabel}`}
        aria-pressed={isSelected}
        onClick={() => onSelect(id)}
        onKeyDown={onKeyDown}
        fill={fill}
        // El borde oscuro separa corazón y metabolismo del torso cuando comparten color.
        stroke={isSelected ? 'var(--color-text)' : 'var(--color-rail)'}
        strokeWidth={4}
        className="cursor-pointer transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:[stroke:var(--color-text)]"
      >
        {shapes}
      </g>
    )
  }

  return (
    <svg viewBox="-6 -6 212 438" className={className} role="group" aria-label="Body map. Select an area to see its readings.">
      {/* cuello: solo dibujo, no es zona */}
      <rect x="90" y="66" width="20" height="22" fill="var(--color-fig)" />

      {zone(
        'body',
        <>
          <rect x="26" y="88" width="24" height="134" rx="12" />
          <rect x="150" y="88" width="24" height="134" rx="12" />
          <rect x="56" y="84" width="88" height="136" rx="26" />
        </>,
      )}
      {zone('head', <circle cx="100" cy="40" r="30" />)}
      {zone('heart', <circle cx="113" cy="124" r="15" />)}
      {zone('metabolism', <ellipse cx="100" cy="182" rx="26" ry="17" />)}
      {zone(
        'legs',
        <>
          <rect x="60" y="226" width="36" height="190" rx="18" />
          <rect x="104" y="226" width="36" height="190" rx="18" />
        </>,
      )}
    </svg>
  )
}
