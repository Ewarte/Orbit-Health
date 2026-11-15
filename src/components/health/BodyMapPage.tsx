import { useState, type KeyboardEvent } from 'react'
import type { Indicator, Status, Zone, ZoneId } from '../../types'
import { statusUi, worstStatus } from '../../lib/status'
import { Sparkline } from '../charts/Sparkline'

/* ═══════════════════════════════════════════════════════════════════════
   TYPES & CLOUD POSITIONS
   ═══════════════════════════════════════════════════════════════════════ */

interface Props {
  zones: Zone[]
  indicators: Indicator[]
  className?: string
}

type CloudPosition = {
  top?: string
  bottom?: string
  left?: string
  right?: string
  lineFrom: { x: string; y: string }
  align: 'left' | 'right'
}

const cloudPositions: Record<ZoneId, CloudPosition> = {
  head:       { top: '3%',   right: '-54%', lineFrom: { x: '58%', y: '11%' }, align: 'right' },
  heart:      { top: '22%',  left: '-54%',  lineFrom: { x: '44%', y: '27%' }, align: 'left' },
  metabolism: { top: '38%',  right: '-54%', lineFrom: { x: '56%', y: '42%' }, align: 'right' },
  body:       { top: '54%',  left: '-54%',  lineFrom: { x: '34%', y: '46%' }, align: 'left' },
  legs:       { bottom: '8%', right: '-54%', lineFrom: { x: '56%', y: '75%' }, align: 'right' },
}

function statusColor(status?: Status): string {
  if (status === 'act') return '#ef4444'
  if (status === 'watch') return '#f97316'
  return '#00f2ff'
}

function rank(status: Status | undefined) {
  return status === 'act' ? 3 : status === 'watch' ? 2 : status === 'ok' ? 1 : 0
}

/* ═══════════════════════════════════════════════════════════════════════
   STAT CLOUD
   ═══════════════════════════════════════════════════════════════════════ */

function StatCloud({
  zone,
  indicators,
  position,
  visible,
}: {
  zone: Zone
  indicators: Indicator[]
  position: CloudPosition
  visible: boolean
}) {
  const worstSt = worstStatus(indicators.map((i) => i.status))
  const color = statusColor(worstSt)

  return (
    <div
      className="pointer-events-none absolute z-30 w-[210px] sm:w-[240px]"
      style={{
        top: position.top,
        bottom: position.bottom,
        left: position.left,
        right: position.right,
        transition: 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: visible ? 1 : 0,
        transform: visible
          ? 'translateY(0) scale(1)'
          : `translateY(${position.align === 'right' ? '12px' : '-12px'}) scale(0.94)`,
      }}
    >
      <div
        className="pointer-events-auto relative overflow-hidden rounded-2xl border p-3.5 shadow-2xl backdrop-blur-xl"
        style={{
          background: 'linear-gradient(145deg, rgba(5,16,28,0.92), rgba(10,30,48,0.85))',
          borderColor: `${color}40`,
          boxShadow: `0 0 24px ${color}20, 0 12px 36px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)`,
        }}
      >
        {/* Luminous top neon accent */}
        <div
          className="absolute top-0 left-0 h-[2px] w-full"
          style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
        />

        {/* Zone header */}
        <div className="mb-2.5 flex items-center justify-between border-b border-white/5 pb-2">
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 shrink-0 rounded-full animate-pulse"
              style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
            />
            <span className="font-display text-[13px] font-semibold uppercase tracking-wider text-text">
              {zone.name}
            </span>
          </div>
          <span className="font-mono text-[9px] uppercase tracking-widest text-mute">HUD-0{indicators.length}</span>
        </div>

        {/* Indicators */}
        {indicators.length === 0 ? (
          <p className="m-0 text-xs text-mute">No readings telemetry yet.</p>
        ) : (
          <div className="space-y-2">
            {indicators.map((ind) => {
              const ui = statusUi[ind.status]
              return (
                <div key={ind.id} className="rounded-xl bg-white/[0.03] p-2.5 transition-colors hover:bg-white/[0.05]">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-medium text-mute">{ind.name}</span>
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                      style={{
                        color: ind.status === 'ok' ? '#00f2ff' : ind.status === 'watch' ? '#fb923c' : '#f87171',
                        background: ind.status === 'ok' ? 'rgba(0,242,255,0.12)' : ind.status === 'watch' ? 'rgba(251,146,60,0.15)' : 'rgba(248,113,113,0.18)',
                        border: `1px solid ${ind.status === 'ok' ? 'rgba(0,242,255,0.3)' : ind.status === 'watch' ? 'rgba(251,146,60,0.3)' : 'rgba(248,113,113,0.3)'}`,
                      }}
                    >
                      {ui.label}
                    </span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="font-display text-xl font-semibold tabular-nums leading-none text-text">
                      {ind.value}
                    </span>
                    <span className="text-xs text-mute">{ind.unit}</span>
                  </div>
                  {ind.history.length >= 2 && (
                    <div className="mt-1.5">
                      <Sparkline values={ind.history} color={ind.status === 'ok' ? '#00f2ff' : ui.cssVar} />
                    </div>
                  )}
                  {ind.reason && (
                    <p className="m-0 mt-1 text-[10px] leading-tight text-mute/80 italic">
                      {ind.reason}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   CONNECTING LINES
   ═══════════════════════════════════════════════════════════════════════ */

function ConnectingLines({ selected }: { selected: ZoneId }) {
  const pos = cloudPositions[selected]
  if (!pos) return null

  const fromX = pos.lineFrom.x
  const fromY = pos.lineFrom.y
  const toX = pos.align === 'right' ? '76%' : '24%'
  const toY = pos.top ?? (pos.bottom ? `calc(100% - ${pos.bottom})` : '50%')

  return (
    <svg className="pointer-events-none absolute inset-0 z-20 h-full w-full" style={{ overflow: 'visible' }}>
      <circle cx={fromX} cy={fromY} r="4" fill="#00f2ff" opacity="0.9">
        <animate attributeName="r" values="3;6;3" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.9;0.3;0.9" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx={fromX} cy={fromY} r="8" fill="none" stroke="#00f2ff" strokeWidth="1" opacity="0.4">
        <animate attributeName="r" values="4;12;4" dur="2s" repeatCount="indefinite" />
      </circle>
      <line x1={fromX} y1={fromY} x2={toX} y2={toY} stroke="#00f2ff" strokeWidth="1.2" strokeDasharray="4 4" opacity="0.5">
        <animate attributeName="stroke-dashoffset" values="0;-16" dur="1.5s" repeatCount="indefinite" />
      </line>
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN BODY MAP PAGE: HOLOGRAPHIC HUMAN MESH MODEL
   ═══════════════════════════════════════════════════════════════════════ */

export function BodyMapPage({ zones, indicators, className }: Props) {
  const zoneStatus = (id: ZoneId): Status | undefined =>
    worstStatus(indicators.filter((i) => i.zone === id).map((i) => i.status))

  const [selected, setSelected] = useState<ZoneId>(() => {
    const ranked = [...zones].sort((a, b) => rank(zoneStatus(b.id)) - rank(zoneStatus(a.id)))
    return ranked[0]?.id ?? 'head'
  })

  const [hovered, setHovered] = useState<ZoneId | null>(null)

  const figureZones = Object.fromEntries(
    zones.map((z) => [z.id, { name: z.name, status: zoneStatus(z.id) }]),
  ) as Record<ZoneId, { name: string; status?: Status }>

  const activeZone = figureZones[selected]
  const activeColor = statusColor(activeZone?.status)

  function handleZoneSelect(id: ZoneId) {
    setSelected(id)
  }

  function handleKeyDown(id: ZoneId, e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setSelected(id)
    }
  }

  return (
    <div className={`relative flex min-h-[620px] items-center justify-center ${className ?? ''}`}>
      {/* Sci-fi background grid */}
      <div className="absolute inset-0 overflow-hidden opacity-[0.035] pointer-events-none">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="hologrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#00f2ff" strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hologrid)" />
        </svg>
      </div>

      {/* Central Holographic Container */}
      <div className="relative h-[540px] w-[340px] sm:h-[600px] sm:w-[380px] lg:h-[660px] lg:w-[420px]">
        {/* Animated Connecting Lines */}
        <ConnectingLines selected={selected} />

        {/* ═══ THE HOLOGRAPHIC HUMAN FIGURE ═══ */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            viewBox="0 0 260 480"
            className="h-full w-auto max-w-[240px] sm:max-w-[260px] lg:max-w-[290px] drop-shadow-[0_0_20px_rgba(0,242,255,0.2)]"
            role="group"
            aria-label="Interactive Holographic Body Map"
            style={{ overflow: 'visible' }}
          >
            <defs>
              {/* Cyan Holographic Shading Gradients */}
              <linearGradient id="holo-glow-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#00f2ff" stopOpacity="0.28" />
                <stop offset="50%" stopColor="#00bcd4" stopOpacity="0.14" />
                <stop offset="100%" stopColor="#007a8a" stopOpacity="0.04" />
              </linearGradient>

              <linearGradient id="holo-body-mesh" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#00f2ff" stopOpacity="0.8" />
                <stop offset="45%" stopColor="#00d8f0" stopOpacity="0.5" />
                <stop offset="85%" stopColor="#0099b0" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#005f70" stopOpacity="0.15" />
              </linearGradient>

              {/* Heart Beat Pulse Gradient */}
              <radialGradient id="cardiac-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
                <stop offset="40%" stopColor="#f43f5e" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#00f2ff" stopOpacity="0" />
              </radialGradient>

              {/* Holographic Scanline Filter */}
              <filter id="hologram-bloom" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Laser active zone glow */}
              <filter id="active-zone-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* ── 1. HOLOGRAPHIC EMITTER PLATFORM (BASE) ── */}
            <g pointerEvents="none" opacity="0.85">
              <ellipse cx="130" cy="460" rx="90" ry="14" fill="none" stroke="#00f2ff" strokeWidth="1.2" opacity="0.4">
                <animate attributeName="rx" values="90;96;90" dur="4s" repeatCount="indefinite" />
              </ellipse>
              <ellipse cx="130" cy="460" rx="72" ry="10" fill="none" stroke="#00bcd4" strokeWidth="1" strokeDasharray="4 6" opacity="0.6">
                <animate attributeName="stroke-dashoffset" values="0;20" dur="6s" repeatCount="indefinite" />
              </ellipse>
              <ellipse cx="130" cy="460" rx="46" ry="6" fill="#00f2ff" fillOpacity="0.08" stroke="#00f2ff" strokeWidth="1.5" opacity="0.9" />
              {/* Vertical light projector column */}
              <linearGradient id="emitter-beam" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#00f2ff" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#00f2ff" stopOpacity="0" />
              </linearGradient>
              <polygon points="84,460 176,460 160,340 100,340" fill="url(#emitter-beam)" />
            </g>

            {/* ── 2. BACKGROUND HUD MEASUREMENT RETICLES ── */}
            <g pointerEvents="none" opacity="0.35">
              <line x1="130" y1="10" x2="130" y2="450" stroke="#00f2ff" strokeWidth="0.8" strokeDasharray="3 6" opacity="0.3" />
              {/* Reticle ticks */}
              <path d="M 28 42 L 36 42 M 28 126 L 36 126 M 28 200 L 36 200 M 28 320 L 36 320 M 28 440 L 36 440" stroke="#00f2ff" strokeWidth="1" />
              <path d="M 232 42 L 224 42 M 232 126 L 224 126 M 232 200 L 224 200 M 232 320 L 224 320 M 232 440 L 224 440" stroke="#00f2ff" strokeWidth="1" />
            </g>

            {/* ── 3. ANATOMICAL HUMAN BODY SILHOUETTE (VOLUMETRIC FILL) ── */}
            <path
              d={`
                M 130 18
                C 114 18, 104 28, 104 44
                C 104 58, 112 68, 122 72
                L 122 82
                C 108 84, 94 90, 80 102
                L 58 136
                C 52 146, 44 172, 40 200
                C 38 212, 38 230, 42 242
                C 44 248, 48 252, 54 250
                C 60 248, 62 238, 64 228
                L 72 178
                L 82 144
                L 88 152
                L 88 190
                C 86 204, 88 220, 92 230
                L 92 242
                C 90 270, 86 310, 86 338
                C 86 360, 82 390, 84 426
                L 74 444
                C 72 448, 76 452, 82 452
                L 104 452
                C 110 452, 112 446, 110 440
                L 108 418
                C 110 380, 114 340, 116 310
                C 118 280, 122 254, 124 246
                L 130 246
                L 136 246
                C 138 254, 142 280, 144 310
                C 146 340, 150 380, 152 418
                L 150 440
                C 148 446, 150 452, 156 452
                L 178 452
                C 184 452, 188 448, 186 444
                L 176 426
                C 178 390, 174 360, 174 338
                C 174 310, 170 270, 168 242
                L 168 230
                C 172 220, 174 204, 172 190
                L 172 152
                L 178 144
                L 188 178
                L 196 228
                C 198 238, 200 248, 206 250
                C 212 252, 216 248, 218 242
                C 222 230, 222 212, 220 200
                C 216 172, 208 146, 202 136
                L 180 102
                C 166 90, 152 84, 138 82
                L 138 72
                C 148 68, 156 58, 156 44
                C 156 28, 146 18, 130 18
                Z
              `}
              fill="url(#holo-glow-grad)"
              stroke="none"
            />

            {/* ── 4. DETAILED ANATOMICAL WIREFRAME MESH ── */}
            <g pointerEvents="none" stroke="#00f2ff" strokeWidth="0.8" opacity="0.75" filter="url(#hologram-bloom)">
              {/* Outer Contour Outline */}
              <path
                d={`
                  M 130 18
                  C 114 18, 104 28, 104 44
                  C 104 58, 112 68, 122 72
                  L 122 82
                  C 108 84, 94 90, 80 102
                  L 58 136
                  C 52 146, 44 172, 40 200
                  C 38 212, 38 230, 42 242
                  C 44 248, 48 252, 54 250
                  C 60 248, 62 238, 64 228
                  L 72 178
                  L 82 144
                  L 88 152
                  L 88 190
                  C 86 204, 88 220, 92 230
                  L 92 242
                  C 90 270, 86 310, 86 338
                  C 86 360, 82 390, 84 426
                  L 74 444
                  C 72 448, 76 452, 82 452
                  L 104 452
                  C 110 452, 112 446, 110 440
                  L 108 418
                  C 110 380, 114 340, 116 310
                  C 118 280, 122 254, 124 246
                  L 130 246
                  L 136 246
                  C 138 254, 142 280, 144 310
                  C 146 340, 150 380, 152 418
                  L 150 440
                  C 148 446, 150 452, 156 452
                  L 178 452
                  C 184 452, 188 448, 186 444
                  L 176 426
                  C 178 390, 174 360, 174 338
                  C 174 310, 170 270, 168 242
                  L 168 230
                  C 172 220, 174 204, 172 190
                  L 172 152
                  L 178 144
                  L 180 102
                  C 166 90, 152 84, 138 82
                  L 138 72
                  C 148 68, 156 58, 156 44
                  C 156 28, 146 18, 130 18
                  Z
                `}
                fill="none"
                strokeWidth="1.2"
              />

              {/* Head & Facial Wireframe Latitude Rings */}
              <ellipse cx="130" cy="30" rx="20" ry="6" fill="none" strokeWidth="0.6" opacity="0.6" />
              <ellipse cx="130" cy="42" rx="24" ry="7" fill="none" strokeWidth="0.6" opacity="0.7" />
              <ellipse cx="130" cy="56" rx="19" ry="5" fill="none" strokeWidth="0.6" opacity="0.6" />
              <ellipse cx="130" cy="68" rx="12" ry="3" fill="none" strokeWidth="0.6" opacity="0.5" />
              {/* Facial Midline Axis */}
              <line x1="130" y1="20" x2="130" y2="72" strokeWidth="0.8" opacity="0.8" />

              {/* Neck rings */}
              <ellipse cx="130" cy="78" rx="10" ry="3" fill="none" strokeWidth="0.6" opacity="0.6" />
              <ellipse cx="130" cy="84" rx="12" ry="3.5" fill="none" strokeWidth="0.6" opacity="0.6" />

              {/* Clavicle & Shoulders Triangulation */}
              <line x1="82" y1="102" x2="130" y2="92" strokeWidth="0.8" opacity="0.7" />
              <line x1="178" y1="102" x2="130" y2="92" strokeWidth="0.8" opacity="0.7" />
              <line x1="82" y1="102" x2="130" y2="114" strokeWidth="0.6" opacity="0.5" />
              <line x1="178" y1="102" x2="130" y2="114" strokeWidth="0.6" opacity="0.5" />

              {/* Pectorals / Chest Contours */}
              <path d="M 96 112 Q 112 110, 130 114 Q 148 110, 164 112" fill="none" strokeWidth="0.7" opacity="0.7" />
              <path d="M 92 128 Q 112 134, 130 130 Q 148 134, 168 128" fill="none" strokeWidth="0.8" opacity="0.8" />
              <line x1="130" y1="92" x2="130" y2="152" strokeWidth="0.9" opacity="0.8" />

              {/* Ribcage Cross-Lines */}
              <path d="M 90 142 Q 112 148, 130 146 Q 148 148, 170 142" fill="none" strokeWidth="0.6" opacity="0.6" />
              <path d="M 90 156 Q 112 162, 130 160 Q 148 162, 170 156" fill="none" strokeWidth="0.6" opacity="0.6" />

              {/* Abdomen Grid / Navel Ring */}
              <ellipse cx="130" cy="180" rx="4" ry="2" fill="none" strokeWidth="0.8" opacity="0.8" />
              <path d="M 92 172 Q 112 176, 130 174 Q 148 176, 168 172" fill="none" strokeWidth="0.6" opacity="0.6" />
              <path d="M 90 190 Q 112 196, 130 194 Q 148 196, 170 190" fill="none" strokeWidth="0.7" opacity="0.7" />
              <line x1="130" y1="152" x2="130" y2="236" strokeWidth="0.9" opacity="0.8" />

              {/* Pelvis & Hips Arc */}
              <path d="M 88 214 Q 112 226, 130 224 Q 148 226, 172 214" fill="none" strokeWidth="0.8" opacity="0.7" />
              <path d="M 92 232 L 130 244 L 168 232" fill="none" strokeWidth="0.8" opacity="0.7" />

              {/* Left Arm Structure */}
              <line x1="82" y1="102" x2="52" y2="170" strokeWidth="0.6" opacity="0.6" />
              <line x1="52" y1="170" x2="42" y2="228" strokeWidth="0.6" opacity="0.6" />
              <ellipse cx="64" cy="136" rx="9" ry="4" transform="rotate(-54 64 136)" fill="none" strokeWidth="0.5" opacity="0.5" />
              <ellipse cx="50" cy="180" rx="7" ry="3.5" transform="rotate(-62 50 180)" fill="none" strokeWidth="0.5" opacity="0.5" />
              <ellipse cx="44" cy="224" rx="5" ry="3" transform="rotate(-70 44 224)" fill="none" strokeWidth="0.5" opacity="0.5" />

              {/* Right Arm Structure */}
              <line x1="178" y1="102" x2="208" y2="170" strokeWidth="0.6" opacity="0.6" />
              <line x1="208" y1="170" x2="218" y2="228" strokeWidth="0.6" opacity="0.6" />
              <ellipse cx="196" cy="136" rx="9" ry="4" transform="rotate(54 196 136)" fill="none" strokeWidth="0.5" opacity="0.5" />
              <ellipse cx="210" cy="180" rx="7" ry="3.5" transform="rotate(62 210 180)" fill="none" strokeWidth="0.5" opacity="0.5" />
              <ellipse cx="216" cy="224" rx="5" ry="3" transform="rotate(70 216 224)" fill="none" strokeWidth="0.5" opacity="0.5" />

              {/* Left Leg Structure */}
              <line x1="108" y1="246" x2="102" y2="336" strokeWidth="0.7" opacity="0.7" />
              <line x1="102" y1="336" x2="94" y2="430" strokeWidth="0.7" opacity="0.7" />
              <ellipse cx="106" cy="286" rx="16" ry="6" fill="none" strokeWidth="0.6" opacity="0.5" />
              {/* Knee circle */}
              <circle cx="102" cy="336" r="6" fill="none" strokeWidth="0.9" opacity="0.8" />
              <ellipse cx="98" cy="380" rx="13" ry="5" fill="none" strokeWidth="0.6" opacity="0.5" />
              <ellipse cx="94" cy="424" rx="9" ry="4" fill="none" strokeWidth="0.6" opacity="0.5" />

              {/* Right Leg Structure */}
              <line x1="152" y1="246" x2="158" y2="336" strokeWidth="0.7" opacity="0.7" />
              <line x1="158" y1="336" x2="166" y2="430" strokeWidth="0.7" opacity="0.7" />
              <ellipse cx="154" cy="286" rx="16" ry="6" fill="none" strokeWidth="0.6" opacity="0.5" />
              {/* Knee circle */}
              <circle cx="158" cy="336" r="6" fill="none" strokeWidth="0.9" opacity="0.8" />
              <ellipse cx="162" cy="380" rx="13" ry="5" fill="none" strokeWidth="0.6" opacity="0.5" />
              <ellipse cx="166" cy="424" rx="9" ry="4" fill="none" strokeWidth="0.6" opacity="0.5" />
            </g>

            {/* ── 5. PULSING VITAL ORGANS / SCI-FI NODES ── */}
            {/* Neural Brain Node (Head) */}
            <g pointerEvents="none" opacity={selected === 'head' ? 1 : 0.6}>
              <circle cx="130" cy="40" r="5" fill="#00f2ff" opacity="0.4" />
              <circle cx="130" cy="40" r="2.5" fill="#ffffff" />
              {selected === 'head' && (
                <circle cx="130" cy="40" r="16" fill="none" stroke="#00f2ff" strokeWidth="1" strokeDasharray="3 3">
                  <animate attributeName="r" values="8;24;8" dur="2.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.8;0.1;0.8" dur="2.4s" repeatCount="indefinite" />
                </circle>
              )}
            </g>

            {/* Cardiac Heart Node (Chest) */}
            <g pointerEvents="none" opacity={selected === 'heart' ? 1 : 0.85}>
              <circle cx="120" cy="120" r="14" fill="url(#cardiac-glow)" />
              <path
                d="M 120 115 C 117 110, 110 110, 110 116 C 110 122, 120 128, 120 128 C 120 128, 130 122, 130 116 C 130 110, 123 110, 120 115 Z"
                fill="#ff4d4d"
                filter="url(#hologram-bloom)"
              >
                <animateTransform attributeName="transform" type="scale" values="1;1.2;1" dur="0.95s" repeatCount="indefinite" />
              </path>
              {/* Cardiac Pulse Wave Rings */}
              <circle cx="120" cy="120" r="8" fill="none" stroke="#ff4d4d" strokeWidth="1">
                <animate attributeName="r" values="6;22;6" dur="0.95s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.9;0;0.9" dur="0.95s" repeatCount="indefinite" />
              </circle>
            </g>

            {/* Metabolic Core Node (Abdomen) */}
            <g pointerEvents="none" opacity={selected === 'metabolism' ? 1 : 0.6}>
              <circle cx="130" cy="180" r="4" fill="#00f2ff" opacity="0.7" />
              <circle cx="130" cy="180" r="1.8" fill="#ffffff" />
              {selected === 'metabolism' && (
                <circle cx="130" cy="180" r="12" fill="none" stroke="#00f2ff" strokeWidth="1" strokeDasharray="2 4">
                  <animate attributeName="r" values="6;20;6" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
            </g>

            {/* ── 6. INTERACTIVE ANATOMICAL CLICK ZONES (TOUCH TARGETS) ── */}
            {/* Zone 1: HEAD (Brain & Behavior) */}
            <g
              role="button"
              tabIndex={0}
              aria-label={`${figureZones.head?.name ?? 'Brain & behavior'}: ${figureZones.head?.status ?? 'nominal'}`}
              aria-pressed={selected === 'head'}
              onClick={() => handleZoneSelect('head')}
              onKeyDown={(e) => handleKeyDown('head', e)}
              onMouseEnter={() => setHovered('head')}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer outline-none"
            >
              <ellipse
                cx="130"
                cy="44"
                rx="30"
                ry="34"
                fill={selected === 'head' ? 'rgba(0,242,255,0.18)' : hovered === 'head' ? 'rgba(0,242,255,0.1)' : 'transparent'}
                stroke={selected === 'head' ? '#00f2ff' : hovered === 'head' ? 'rgba(0,242,255,0.6)' : 'transparent'}
                strokeWidth={selected === 'head' ? 1.8 : 1}
                strokeDasharray={selected === 'head' ? '4 4' : 'none'}
                filter={selected === 'head' ? 'url(#active-zone-glow)' : undefined}
                className="transition-all duration-200"
              />
            </g>

            {/* Zone 2: HEART / CHEST (Cardiovascular) */}
            <g
              role="button"
              tabIndex={0}
              aria-label={`Heart & circulation: ${figureZones.heart?.status ?? 'nominal'}`}
              aria-pressed={selected === 'heart'}
              onClick={() => handleZoneSelect('heart')}
              onKeyDown={(e) => handleKeyDown('heart', e)}
              onMouseEnter={() => setHovered('heart')}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer outline-none"
            >
              <path
                d="M 82 92 L 178 92 L 172 150 L 88 150 Z"
                fill={selected === 'heart' ? 'rgba(255,77,77,0.18)' : hovered === 'heart' ? 'rgba(0,242,255,0.1)' : 'transparent'}
                stroke={selected === 'heart' ? '#ff4d4d' : hovered === 'heart' ? 'rgba(0,242,255,0.6)' : 'transparent'}
                strokeWidth={selected === 'heart' ? 1.8 : 1}
                strokeDasharray={selected === 'heart' ? '4 4' : 'none'}
                filter={selected === 'heart' ? 'url(#active-zone-glow)' : undefined}
                className="transition-all duration-200"
              />
            </g>

            {/* Zone 3: METABOLISM / ABDOMEN */}
            <g
              role="button"
              tabIndex={0}
              aria-label={`Metabolism: ${figureZones.metabolism?.status ?? 'nominal'}`}
              aria-pressed={selected === 'metabolism'}
              onClick={() => handleZoneSelect('metabolism')}
              onKeyDown={(e) => handleKeyDown('metabolism', e)}
              onMouseEnter={() => setHovered('metabolism')}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer outline-none"
            >
              <path
                d="M 88 150 L 172 150 L 170 220 L 90 220 Z"
                fill={selected === 'metabolism' ? 'rgba(0,242,255,0.18)' : hovered === 'metabolism' ? 'rgba(0,242,255,0.1)' : 'transparent'}
                stroke={selected === 'metabolism' ? '#00f2ff' : hovered === 'metabolism' ? 'rgba(0,242,255,0.6)' : 'transparent'}
                strokeWidth={selected === 'metabolism' ? 1.8 : 1}
                strokeDasharray={selected === 'metabolism' ? '4 4' : 'none'}
                filter={selected === 'metabolism' ? 'url(#active-zone-glow)' : undefined}
                className="transition-all duration-200"
              />
            </g>

            {/* Zone 4: BODY / ARMS (Whole Body & Immune) */}
            <g
              role="button"
              tabIndex={0}
              aria-label={`Whole body: ${figureZones.body?.status ?? 'nominal'}`}
              aria-pressed={selected === 'body'}
              onClick={() => handleZoneSelect('body')}
              onKeyDown={(e) => handleKeyDown('body', e)}
              onMouseEnter={() => setHovered('body')}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer outline-none"
            >
              {/* Left arm hit area */}
              <path
                d="M 80 102 L 58 136 C 52 146, 44 172, 40 200 C 38 212, 38 230, 42 242 C 44 248, 48 252, 54 250 C 60 248, 62 238, 64 228 L 72 178 L 82 144 Z"
                fill={selected === 'body' ? 'rgba(0,242,255,0.18)' : hovered === 'body' ? 'rgba(0,242,255,0.1)' : 'transparent'}
                stroke={selected === 'body' ? '#00f2ff' : hovered === 'body' ? 'rgba(0,242,255,0.6)' : 'transparent'}
                strokeWidth={selected === 'body' ? 1.8 : 1}
                className="transition-all duration-200"
              />
              {/* Right arm hit area */}
              <path
                d="M 180 102 L 202 136 C 208 146, 216 172, 220 200 C 222 212, 222 230, 218 242 C 216 248, 212 252, 206 250 C 200 248, 198 238, 196 228 L 188 178 L 178 144 Z"
                fill={selected === 'body' ? 'rgba(0,242,255,0.18)' : hovered === 'body' ? 'rgba(0,242,255,0.1)' : 'transparent'}
                stroke={selected === 'body' ? '#00f2ff' : hovered === 'body' ? 'rgba(0,242,255,0.6)' : 'transparent'}
                strokeWidth={selected === 'body' ? 1.8 : 1}
                className="transition-all duration-200"
              />
            </g>

            {/* Zone 5: LEGS (Bones & Muscles) */}
            <g
              role="button"
              tabIndex={0}
              aria-label={`Bones & muscles: ${figureZones.legs?.status ?? 'nominal'}`}
              aria-pressed={selected === 'legs'}
              onClick={() => handleZoneSelect('legs')}
              onKeyDown={(e) => handleKeyDown('legs', e)}
              onMouseEnter={() => setHovered('legs')}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer outline-none"
            >
              <path
                d="M 90 220 L 170 220 L 188 454 L 74 454 Z"
                fill={selected === 'legs' ? 'rgba(0,242,255,0.18)' : hovered === 'legs' ? 'rgba(0,242,255,0.1)' : 'transparent'}
                stroke={selected === 'legs' ? '#00f2ff' : hovered === 'legs' ? 'rgba(0,242,255,0.6)' : 'transparent'}
                strokeWidth={selected === 'legs' ? 1.8 : 1}
                strokeDasharray={selected === 'legs' ? '4 4' : 'none'}
                filter={selected === 'legs' ? 'url(#active-zone-glow)' : undefined}
                className="transition-all duration-200"
              />
            </g>
          </svg>
        </div>

        {/* ═══ STAT CLOUDS ═══ */}
        {zones.map((z) => {
          const zoneIndicators = indicators.filter((i) => i.zone === z.id)
          const pos = cloudPositions[z.id]
          if (!pos) return null
          return (
            <StatCloud
              key={z.id}
              zone={z}
              indicators={zoneIndicators}
              position={pos}
              visible={selected === z.id}
            />
          )
        })}
      </div>

      {/* Floating Bottom HUD Status Chip */}
      <div
        className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-full border px-4 py-1.5 text-xs shadow-xl backdrop-blur-xl"
        style={{
          background: 'rgba(5,16,28,0.88)',
          borderColor: `${activeColor}40`,
          boxShadow: `0 0 16px ${activeColor}15`,
        }}
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: activeColor, boxShadow: `0 0 8px ${activeColor}` }}
        />
        <span className="font-display text-[12px] font-semibold uppercase tracking-wider text-text">
          {activeZone?.name ?? selected}
        </span>
        <span className="h-3 w-px bg-white/10" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-mute">
          [{activeZone?.status?.toUpperCase() ?? 'NOMINAL'}]
        </span>
        <span className="font-mono text-[10px] text-mute/80">
          {indicators.filter((i) => i.zone === selected).length} telemetry items
        </span>
      </div>
    </div>
  )
}
