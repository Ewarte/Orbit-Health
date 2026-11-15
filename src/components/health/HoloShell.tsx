import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import type { Indicator, Status, ZoneId } from '../../types'
import { statusUi } from '../../lib/status'
import { indicatorName, indicatorReason, indicatorValue, unitLabel } from '../../lib/domainText'
import { useI18n } from '../../lib/useI18n'
import { Sparkline } from '../charts/Sparkline'
import { CLOUD_POSITIONS, HIGHLIGHT, STATUS_KEY, ZONE_META, getStatusColor, type CloudPosition, type ZoneMeta } from './holoZonas'

/* Marco común de las dos versiones del holograma: cabecera con botones grandes,
   lienzo 3D (hijos), nubes de lecturas, selector de zonas y pie. */

/** Con zoom, la imagen se corre este tanto (en píxeles) hacia el lado contrario de la tarjeta (ver SideOffset). */
const ZOOM_SHIFT_PX = 120

function percentOf(value: string | undefined, total: number): number {
  return ((parseFloat(value ?? '') || 0) / 100) * total
}

function ConnectingLines({ selected, centered }: { selected: ZoneId; centered?: boolean }) {
  const pos = CLOUD_POSITIONS[selected]
  const ref = useRef<SVGSVGElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  // La línea se dibuja en píxeles para poder sumar el desplazamiento de la imagen.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Con zoom, lo medido queda en el centro del lienzo (corrido si hay tarjeta a un lado): la línea sale de ahí.
  const shifted = centered && selected !== 'body' ? (pos.align === 'right' ? -ZOOM_SHIFT_PX : ZOOM_SHIFT_PX) : 0
  const fromX = centered ? size.w / 2 + shifted : percentOf(pos.originX, size.w)
  const fromY = centered ? size.h / 2 : percentOf(pos.originY, size.h)
  const toX = pos.align === 'right' ? size.w * 0.76 : size.w * 0.24
  const toY = pos.top ? percentOf(pos.top, size.h) : pos.bottom ? size.h - percentOf(pos.bottom, size.h) : size.h / 2

  return (
    <svg ref={ref} className="pointer-events-none absolute inset-0 z-20 h-full w-full" style={{ overflow: 'visible' }} aria-hidden="true">
      <circle cx={fromX} cy={fromY} r="4" fill={HIGHLIGHT} opacity="0.95">
        <animate attributeName="r" values="3;6;3" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.95;0.35;0.95" dur="2s" repeatCount="indefinite" />
      </circle>
      <line x1={fromX} y1={fromY} x2={toX} y2={toY} stroke={HIGHLIGHT} strokeWidth="1.2" strokeDasharray="4 4" opacity="0.65" />
    </svg>
  )
}

const STATUS_STYLE: Record<Status, { color: string; background: string; border: string }> = {
  ok: { color: '#00f2ff', background: 'rgba(0,242,255,0.12)', border: '1px solid rgba(0,242,255,0.3)' },
  watch: { color: '#fb923c', background: 'rgba(251,146,60,0.15)', border: '1px solid rgba(251,146,60,0.3)' },
  act: { color: '#f87171', background: 'rgba(248,113,113,0.18)', border: '1px solid rgba(248,113,113,0.3)' },
}

function StatCloud({
  zone,
  indicators,
  position,
  visible,
}: {
  zone: ZoneMeta
  indicators: Indicator[]
  position: CloudPosition
  visible: boolean
}) {
  const { t } = useI18n()
  const compact = indicators.length > 3
  return (
    <div
      className="absolute z-30 transition-all duration-300 ease-out max-md:inset-x-3 max-md:bottom-12 max-md:w-auto md:w-[220px] xl:w-[240px]"
      style={{
        top: position.top,
        bottom: position.bottom,
        left: position.left,
        right: position.right,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : `translateY(${position.align === 'right' ? '12px' : '-12px'}) scale(0.94)`,
        pointerEvents: visible ? 'auto' : 'none',
        // La nube nunca sale del lienzo: si tiene muchas lecturas, se desplaza por dentro.
        maxHeight: `calc(100% - ${position.top ?? position.bottom ?? '0%'} - 8px)`,
        overflowY: 'auto',
        // Barra de desplazamiento fina y oscura, acorde al tema (la blanca del sistema desentonaba).
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(0, 242, 255, 0.35) transparent',
      }}
      aria-hidden={!visible}
    >
      <div
        className="relative rounded-2xl border p-3.5 shadow-2xl backdrop-blur-xl"
        style={{
          background: 'linear-gradient(145deg, rgba(5,16,28,0.95), rgba(12,28,45,0.92))',
          borderColor: 'rgba(255, 32, 78, 0.45)',
          boxShadow: '0 0 25px rgba(255, 32, 78, 0.25), 0 12px 36px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
      >
        <div className="absolute top-0 left-0 h-[2px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${HIGHLIGHT}, transparent)` }} />
        <div className="mb-2.5 flex items-center justify-between gap-2 border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-base">{zone.icon}</span>
            <span className="font-display text-[13px] font-semibold uppercase tracking-wider text-white">{t(zone.nameKey)}</span>
          </div>
          <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-red-400">{t('holo.active')}</span>
        </div>

        {indicators.length === 0 ? (
          <p className="m-0 text-xs text-mute">{t(zone.id === 'metabolism' ? 'holo.noGlucose' : 'holo.noReadings')}</p>
        ) : (
          // Con más de 3 lecturas (Corazón tiene 4) la tarjeta se compacta: sin mini gráfica ni razón,
          // para que todo quepa sin desplazamiento. La razón sigue visible en Orientación.
          <div className={compact ? 'grid grid-cols-2 gap-1.5' : 'space-y-2'}>
            {indicators.map((ind) => {
              const ui = statusUi[ind.status]
              const st = STATUS_STYLE[ind.status]
              return (
                <div key={ind.id} className={`rounded-xl border border-white/5 bg-white/[0.04] ${compact ? 'p-2' : 'p-2.5'}`}>
                  <div className={compact ? 'flex flex-col items-start gap-1' : 'flex items-baseline justify-between gap-2'}>
                    <span className="text-xs font-medium text-cyan-200">{indicatorName(t, ind)}</span>
                    <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider" style={st}>
                      {t(STATUS_KEY[ind.status])}
                    </span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className={`font-display font-bold tabular-nums leading-none text-white ${compact ? 'text-xl' : 'text-2xl'}`}>{indicatorValue(t, ind)}</span>
                    <span className="font-mono text-xs text-cyan-300/80">{unitLabel(t, ind.unit)}</span>
                  </div>
                  {!compact && ind.history.length >= 2 && (
                    <div className="mt-1.5">
                      <Sparkline values={ind.history} color={ind.status === 'ok' ? '#00f2ff' : ui.cssVar} />
                    </div>
                  )}
                  {!compact && (ind.reason || ind.reasonKey) && (
                    <p className="m-0 mt-1 text-[10px] italic leading-tight text-mute">{indicatorReason(t, ind)}</p>
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

export interface HoloShellProps {
  selectedZone: ZoneId
  onSelectZone: (zone: ZoneId) => void
  zonesStatus?: Record<ZoneId, Status | undefined>
  indicators?: Indicator[]
  className?: string
  /** Recibe si el giro automático está activo (pausado por defecto). */
  children: (autoRotate: boolean) => ReactNode
  /** Línea pequeña bajo el holograma (por ejemplo, una atribución). */
  note?: string
  /** Botones extra de la cabecera (por ejemplo, «Vista general»). */
  toolbar?: ReactNode
  /** Con zoom a la zona, la línea de la nube sale del centro del lienzo. */
  focused?: boolean
}

const BTN =
  'flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-950/60 px-4 font-mono text-xs uppercase tracking-wide text-cyan-200 transition-colors hover:border-cyan-300 hover:bg-cyan-900/70 focus-visible:outline-2 focus-visible:outline-cyan-300'

export function HoloShell({
  selectedZone,
  onSelectZone,
  zonesStatus,
  indicators,
  className,
  children,
  note,
  toolbar,
  focused,
}: HoloShellProps) {
  const { t } = useI18n()
  const [autoRotate, setAutoRotate] = useState(false)
  const active = ZONE_META.find((z) => z.id === selectedZone)

  return (
    <div
      className={`relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-[#051424]/95 via-[#071d33]/85 to-[#020b14]/95 p-4 shadow-[0_0_35px_rgba(0,255,255,0.12)] ${className ?? ''}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent" />

      <div className="z-10 mb-2 flex w-full flex-wrap items-center justify-between gap-2 border-b border-cyan-500/20 pb-2.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: HIGHLIGHT, boxShadow: `0 0 8px ${HIGHLIGHT}` }} />
          <span className="font-display font-semibold uppercase tracking-widest text-cyan-300">{t('holo.title')}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {toolbar}
          <button type="button" onClick={() => setAutoRotate((v) => !v)} aria-pressed={autoRotate} className={BTN}>
            <span className={`h-2 w-2 rounded-full ${autoRotate ? 'bg-cyan-400' : 'bg-slate-500'}`} />
            {autoRotate ? t('holo.pause') : t('holo.resume')}
          </button>
        </div>
      </div>

      {/* En tablet horizontal el lienzo se ajusta al alto de la pantalla para que «Hoy» quepa sin scroll. */}
      <div className="relative h-[440px] w-full sm:h-[480px] lg:h-[clamp(380px,calc(100dvh-324px),600px)]" role="group" aria-label={t('holo.canvasLabel')}>
        {indicators && indicators.length > 0 && (
          <div className="hidden md:block">
            <ConnectingLines selected={selectedZone} centered={focused} />
          </div>
        )}
        {children(autoRotate)}
        {indicators &&
          indicators.length > 0 &&
          ZONE_META.map((zone) => (
            <StatCloud
              key={zone.id}
              zone={zone}
              indicators={indicators.filter((i) => i.zone === zone.id)}
              position={CLOUD_POSITIONS[zone.id]}
              visible={selectedZone === zone.id}
            />
          ))}
      </div>

      <div className="z-10 mt-2 flex w-full flex-wrap items-center justify-center gap-1.5 border-t border-cyan-500/20 pt-2.5 lg:grid lg:grid-cols-5">
        {ZONE_META.map((z) => {
          const isSel = selectedZone === z.id
          const c = getStatusColor(zonesStatus?.[z.id])
          return (
            <button
              key={z.id}
              type="button"
              onClick={() => onSelectZone(z.id)}
              aria-pressed={isSel}
              className={`flex min-h-[44px] min-w-0 items-center gap-1.5 rounded-lg px-3 text-xs font-medium leading-tight transition-all lg:justify-center lg:px-2 ${
                isSel
                  ? 'border border-red-500/80 bg-red-950/70 text-white shadow-[0_0_12px_rgba(255,32,78,0.5)]'
                  : 'border border-white/5 bg-white/[0.02] text-mute hover:border-cyan-500/40 hover:text-cyan-200'
              }`}
            >
              <span>{z.icon}</span>
              <span>{t(z.labelKey)}</span>
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: isSel ? HIGHLIGHT : c }} />
            </button>
          )
        })}
      </div>

      <div className="z-10 mt-2 flex w-full flex-wrap items-center justify-between gap-x-3 font-mono text-[10px] text-cyan-300/60">
        <span>
          {t('holo.zone').toUpperCase()}: {active ? t(active.nameKey).toUpperCase() : ''}
        </span>
        <span>{t('holo.hint')}</span>
      </div>
      {note && <p className="z-10 m-0 mt-1.5 w-full text-center text-[10px] text-cyan-300/50">{note}</p>}
    </div>
  )
}
