import { useState, type KeyboardEvent, type ReactNode } from 'react'
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
 * Mapeo de gradientes de alta fidelidad según estado biomédico.
 */
function getZoneGradient(status?: Status, isSelected?: boolean): string {
  if (isSelected) return 'url(#grad-selected-red)'
  if (status === 'ok') return 'url(#grad-ok)'
  if (status === 'watch') return 'url(#grad-watch)'
  if (status === 'act') return 'url(#grad-act)'
  return 'url(#grad-fig)'
}

/**
 * Figura humana anatómica biomédica con estética orbital futurista.
 * Inspirada en interfaces médicas espaciales (VitalOrbit / NASA Telemetry HUD):
 * - Gradientes de color suaves y profundos (verde esmeralda, terracota aeroespacial, coral).
 * - Shading y relieve tridimensional táctil con brillo especular.
 * - Retículas y guías de telemetría de fondo (ejes de alineación, marcas de medición y radar orbital).
 * - Auras de selección dinámicas y halo de radar rotatorio para la zona activa.
 * - Micro-indicadores LED pulsantes para alertas médicas.
 */
export function BodyFigure({ zones, selected, onSelect, className }: Props) {
  const [hovered, setHovered] = useState<ZoneId | null>(null)

  function zone(
    id: ZoneId,
    shapes: ReactNode,
    center: { x: number; y: number },
    alertBadgePos?: { x: number; y: number },
  ) {
    const state = zones[id]
    const isSelected = selected === id
    const fill = getZoneGradient(state?.status, isSelected)
    const statusLabel = state?.status ? statusUi[state.status].label : 'No readings yet'
    const isHovered = hovered === id
    const isCritical = state?.status === 'act'
    const isWarning = state?.status === 'watch'

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onSelect(id)
      }
    }

    return (
      <g
        key={id}
        role="button"
        tabIndex={0}
        aria-label={`${state?.name ?? id}: ${statusLabel}`}
        aria-pressed={isSelected}
        onClick={() => onSelect(id)}
        onKeyDown={onKeyDown}
        onMouseEnter={() => setHovered(id)}
        onMouseLeave={() => setHovered((prev) => (prev === id ? null : prev))}
        className="group cursor-pointer outline-none select-none"
        style={{
          transformOrigin: `${center.x}px ${center.y}px`,
          transition: 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Silueta principal de la zona con fill gradiente y borde dinámico */}
        <g
          fill={fill}
          stroke={isSelected ? '#ff204e' : isHovered ? '#a5b4fc' : 'rgba(255,255,255,0.06)'}
          strokeWidth={isSelected ? 3.5 : isHovered ? 2.5 : 1}
          strokeLinejoin="round"
          filter={
            isSelected
              ? 'url(#glow-selected)'
              : isHovered
                ? 'url(#glow-hover)'
                : 'url(#shadow-subtle)'
          }
          className={`transition-all duration-300 ${
            isSelected
              ? 'brightness-110'
              : isHovered
                ? 'brightness-105 opacity-95'
                : 'hover:brightness-105'
          } ${isCritical ? 'animate-pulse' : ''}`}
        >
          {shapes}
        </g>

        {/* Capa de reflejo especular sutil para dar acabado táctil satinado */}
        <g
          fill="url(#grad-specular)"
          stroke="none"
          pointerEvents="none"
          className="opacity-60 transition-opacity duration-200 group-hover:opacity-80"
        >
          {shapes}
        </g>

        {/* Micro-indicador LED de advertencia/crítico */}
        {(isWarning || isCritical) && alertBadgePos && (
          <g pointerEvents="none" className="transition-transform duration-200">
            <circle
              cx={alertBadgePos.x}
              cy={alertBadgePos.y}
              r={3.5}
              fill={isCritical ? '#ef4444' : '#f97316'}
              stroke="#ffffff"
              strokeWidth={1}
            />
            <circle
              cx={alertBadgePos.x}
              cy={alertBadgePos.y}
              r={6}
              fill="none"
              stroke={isCritical ? '#ef4444' : '#f97316'}
              strokeWidth={1}
              opacity={0.6}
              className="animate-ping"
              style={{ transformOrigin: `${alertBadgePos.x}px ${alertBadgePos.y}px` }}
            />
          </g>
        )}
      </g>
    )
  }

  // Zona actualmente activa para la lectura del HUD
  const activeZoneState = zones[selected]
  const activeStatus = activeZoneState?.status
  const activeStatusColor = activeStatus === 'act' ? '#ef4444' : activeStatus === 'watch' ? '#f97316' : '#22c55e'

  return (
    <div className="relative flex flex-col items-center">
      <svg
        viewBox="0 0 200 410"
        className={className}
        role="group"
        aria-label="Body map. Select an area to see its readings."
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* 1. Gradiente Normal / Nominal (Verde Esmeralda Vital) */}
          <linearGradient id="grad-ok" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#48c774" />
            <stop offset="60%" stopColor="#35a960" />
            <stop offset="100%" stopColor="#258849" />
          </linearGradient>

          {/* 2. Gradiente Atención / Watch (Terracota cálido de alta fidelidad) */}
          <linearGradient id="grad-watch" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#d96c3b" />
            <stop offset="60%" stopColor="#bd5527" />
            <stop offset="100%" stopColor="#9a3c17" />
          </linearGradient>

          {/* 3. Gradiente Crítico / Act (Rojo coral intenso aeroespacial) */}
          <linearGradient id="grad-act" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="60%" stopColor="#e11d48" />
            <stop offset="100%" stopColor="#9f1239" />
          </linearGradient>

          {/* 4. Gradiente Reposo / Sin datos (Azul zafiro cabina) */}
          <linearGradient id="grad-fig" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38648c" />
            <stop offset="100%" stopColor="#1e3a54" />
          </linearGradient>

          {/* 5. Gradiente Selección Activa de Medición (Tono Rojizo Carmesí Vibrante) */}
          <linearGradient id="grad-selected-red" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ff4d6d" />
            <stop offset="45%" stopColor="#e11d48" />
            <stop offset="100%" stopColor="#881337" />
          </linearGradient>

          {/* 6. Reflejo especular superior suave para profundidad táctil */}
          <linearGradient id="grad-specular" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
            <stop offset="35%" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="70%" stopColor="#000000" stopOpacity="0.0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.18" />
          </linearGradient>

          {/* Filtro de resplandor rojizo para selección activa */}
          <filter id="glow-selected" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#ff204e" floodOpacity="0.8" />
            <feDropShadow dx="0" dy="2" stdDeviation="12" floodColor="#e11d48" floodOpacity="0.4" />
          </filter>

          {/* Filtro de resplandor para hover */}
          <filter id="glow-hover" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#818cf8" floodOpacity="0.5" />
          </filter>

          {/* Sombra suave ambiental */}
          <filter id="shadow-subtle" x="-15%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#000000" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* ============================================================== */}
        {/* FONDO HUD AEROESPACIAL: Retícula biomédica y líneas de telemetría */}
        {/* ============================================================== */}
        <g pointerEvents="none" className="opacity-40 transition-opacity duration-300">
          {/* Eje vertical central de simetría */}
          <line
            x1="100"
            y1="8"
            x2="100"
            y2="395"
            stroke="var(--color-edge, #274b6b)"
            strokeWidth="1"
            strokeDasharray="2 6"
            strokeOpacity="0.35"
          />

          {/* Círculo orbital de radar en el centro de gravedad */}
          <circle
            cx="100"
            cy="142"
            r="74"
            fill="none"
            stroke="var(--color-edge, #274b6b)"
            strokeWidth="1"
            strokeDasharray="3 8"
            strokeOpacity="0.25"
          />

          {/* Retículas laterales de medición (Altura / Zonas anatómicas) */}
          {/* Cabeza */}
          <line x1="14" y1="44" x2="22" y2="44" stroke="var(--color-edge, #274b6b)" strokeWidth="1.2" />
          <text x="10" y="46.5" textAnchor="end" fontSize="6.5" fill="var(--color-mute, #8fa9bd)" fontFamily="monospace" opacity="0.6">Z1</text>

          {/* Pecho */}
          <line x1="14" y1="108" x2="22" y2="108" stroke="var(--color-edge, #274b6b)" strokeWidth="1.2" />
          <text x="10" y="110.5" textAnchor="end" fontSize="6.5" fill="var(--color-mute, #8fa9bd)" fontFamily="monospace" opacity="0.6">Z2</text>

          {/* Abdomen */}
          <line x1="14" y1="172" x2="22" y2="172" stroke="var(--color-edge, #274b6b)" strokeWidth="1.2" />
          <text x="10" y="174.5" textAnchor="end" fontSize="6.5" fill="var(--color-mute, #8fa9bd)" fontFamily="monospace" opacity="0.6">Z3</text>

          {/* Piernas */}
          <line x1="14" y1="300" x2="22" y2="300" stroke="var(--color-edge, #274b6b)" strokeWidth="1.2" />
          <text x="10" y="302.5" textAnchor="end" fontSize="6.5" fill="var(--color-mute, #8fa9bd)" fontFamily="monospace" opacity="0.6">Z4</text>

          {/* Lado derecho: Marcas de cota */}
          <line x1="178" y1="44" x2="186" y2="44" stroke="var(--color-edge, #274b6b)" strokeWidth="1.2" />
          <line x1="178" y1="108" x2="186" y2="108" stroke="var(--color-edge, #274b6b)" strokeWidth="1.2" />
          <line x1="178" y1="172" x2="186" y2="172" stroke="var(--color-edge, #274b6b)" strokeWidth="1.2" />
          <line x1="178" y1="300" x2="186" y2="300" stroke="var(--color-edge, #274b6b)" strokeWidth="1.2" />
        </g>

        {/* ============================================================== */}
        {/* AURA DE SELECCIÓN DINÁMICA (Aparece alrededor de la zona activa) */}
        {/* ============================================================== */}
        {selected === 'head' && (
          <g pointerEvents="none">
            {/* Anillo de radar giratorio tenue */}
            <circle
              cx="100"
              cy="44"
              r="36"
              fill="none"
              stroke="#6366f1"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              strokeOpacity="0.65"
              className="animate-spin"
              style={{ animationDuration: '14s', transformOrigin: '100px 44px' }}
            />
            <circle cx="100" cy="44" r="32" fill="none" stroke="#818cf8" strokeWidth="1" strokeOpacity="0.4" />
          </g>
        )}

        {selected === 'heart' && (
          <g pointerEvents="none" stroke="#6366f1" strokeWidth="1.5" fill="none" opacity={0.7}>
            {/* Brackets esquineros de enfoque biomédico */}
            <path d="M 54 80 L 54 74 L 64 74" />
            <path d="M 146 80 L 146 74 L 136 74" />
            <path d="M 54 136 L 54 142 L 64 142" />
            <path d="M 146 136 L 146 142 L 136 142" />
          </g>
        )}

        {selected === 'metabolism' && (
          <g pointerEvents="none" stroke="#6366f1" strokeWidth="1.5" fill="none" opacity={0.7}>
            <path d="M 54 135 L 54 129 L 64 129" />
            <path d="M 146 135 L 146 129 L 136 129" />
            <path d="M 54 211 L 54 217 L 64 217" />
            <path d="M 146 211 L 146 217 L 136 217" />
          </g>
        )}

        {/* ============================================================== */}
        {/* PIEZAS ANATÓMICAS DEL CUERPO (Muñeco) */}
        {/* ============================================================== */}

        {/* 1. Cabeza: Círculo flotante satinado (Brain & behavior / Head & rest) */}
        {zone(
          'head',
          <circle cx="100" cy="44" r="28" />,
          { x: 100, y: 44 },
          { x: 122, y: 26 },
        )}

        {/* 2. Pecho / Torso superior: Rectángulo suavemente curvado (Heart & circulation) */}
        {zone(
          'heart',
          <rect x="61" y="84" width="78" height="49" rx="12" />,
          { x: 100, y: 108 },
          { x: 133, y: 92 },
        )}

        {/* 3. Abdomen / Torso inferior: Rectángulo con separación de 5px (Metabolism) */}
        {zone(
          'metabolism',
          <rect x="61" y="138" width="78" height="69" rx="12" />,
          { x: 100, y: 172 },
          { x: 133, y: 146 },
        )}

        {/* 4. Brazos: Cápsulas simétricas redondeadas independientes (Whole body) */}
        {zone(
          'body',
          <>
            <rect x="29" y="92" width="22" height="110" rx="11" />
            <rect x="149" y="92" width="22" height="110" rx="11" />
          </>,
          { x: 100, y: 147 },
        )}

        {/* 5. Piernas: Cápsulas verticales atléticas alineadas con el torso (Bones & muscles) */}
        {zone(
          'legs',
          <>
            <rect x="61" y="221" width="34" height="162" rx="17" />
            <rect x="105" y="221" width="34" height="162" rx="17" />
          </>,
          { x: 100, y: 302 },
          { x: 133, y: 231 },
        )}
      </svg>

      {/* Chip HUD elegante flotante con la zona activa */}
      <div className="mt-3 flex items-center gap-2 rounded-full border border-edge/60 bg-rail/80 px-3.5 py-1 text-xs shadow-sm backdrop-blur-md">
        <span
          className="h-2 w-2 rounded-full animate-pulse"
          style={{ backgroundColor: activeStatusColor }}
        />
        <span className="font-semibold uppercase tracking-wider text-text">
          {activeZoneState?.name ?? selected}
        </span>
        <span className="text-mute font-mono">
          [{activeZoneState?.status?.toUpperCase() ?? 'NOMINAL'}]
        </span>
      </div>
    </div>
  )
}
