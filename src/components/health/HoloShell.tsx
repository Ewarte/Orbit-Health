import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, CircleDashed, Eye, type LucideIcon } from 'lucide-react'
import type { Indicator, Status, ZoneId } from '../../types'
import { statusUi } from '../../lib/status'
import { indicatorName, indicatorReason, indicatorValue, unitLabel } from '../../lib/domainText'
import { useI18n } from '../../lib/useI18n'
import { Sparkline } from '../charts/Sparkline'
import { CLOUD_POSITIONS, STATUS_KEY, ZONE_META, type CloudPosition, type ZoneMeta } from './holoZonas'

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
      <circle cx={fromX} cy={fromY} r="4" fill="var(--color-holo-hi)" opacity="0.95">
        <animate attributeName="r" values="3;6;3" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.95;0.35;0.95" dur="2s" repeatCount="indefinite" />
      </circle>
      <line x1={fromX} y1={fromY} x2={toX} y2={toY} stroke="var(--color-holo-hi)" strokeWidth="1.2" strokeDasharray="4 4" opacity="0.65" />
    </svg>
  )
}

/** Estado de una lectura: color del token y forma del ícono (el estado nunca va solo en color). */
const STATUS_CHIP: Record<Status, string> = {
  ok: 'border-ok/40 bg-ok/15 text-ok',
  watch: 'border-watch/50 bg-watch/15 text-watch',
  act: 'border-act/50 bg-act/20 text-act',
}

/** Señal de cada estado en la botonera de zonas: ícono de forma distinta y color de su token. */
const ZONE_STATUS: Record<Status, { Icon: LucideIcon; border: string; text: string }> = {
  ok: { Icon: CheckCircle2, border: 'border-ok', text: 'text-ok' },
  watch: { Icon: Eye, border: 'border-watch', text: 'text-watch' },
  act: { Icon: AlertTriangle, border: 'border-act', text: 'text-act' },
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
        scrollbarColor: 'color-mix(in srgb, var(--color-holo) 35%, transparent) transparent',
      }}
      aria-hidden={!visible}
    >
      <div
        className="relative rounded-2xl border p-3.5 shadow-2xl backdrop-blur-xl"
        style={{
          background: 'linear-gradient(145deg, color-mix(in srgb, var(--color-holo-deep) 95%, transparent), color-mix(in srgb, var(--color-rail) 92%, transparent))',
          borderColor: 'color-mix(in srgb, var(--color-holo-hi) 45%, transparent)',
          boxShadow: '0 0 25px color-mix(in srgb, var(--color-holo-hi) 25%, transparent), 0 12px 36px color-mix(in srgb, var(--color-holo-low) 60%, transparent), inset 0 1px 0 color-mix(in srgb, var(--color-text) 10%, transparent)',
        }}
      >
        <div className="absolute top-0 left-0 h-[2px] w-full" style={{ background: 'linear-gradient(90deg, transparent, var(--color-holo-hi), transparent)' }} />
        <div className="mb-2.5 flex items-center justify-between gap-2 border-b border-text/10 pb-2">
          <div className="flex items-center gap-2">
            <zone.icon className="h-5 w-5 text-holo-text" aria-hidden="true" />
            <span className="font-display text-[13px] font-semibold uppercase tracking-wider text-text">{t(zone.nameKey)}</span>
          </div>
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-holo-hi">{t('holo.active')}</span>
        </div>

        {indicators.length === 0 ? (
          <p className="m-0 text-xs text-mute">{t(zone.id === 'metabolism' ? 'holo.noGlucose' : 'holo.noReadings')}</p>
        ) : (
          // Con más de 3 lecturas (Corazón tiene 4) la tarjeta se compacta: sin mini gráfica ni razón,
          // para que todo quepa sin desplazamiento. La razón sigue visible en Orientación.
          <div className={compact ? 'grid grid-cols-2 gap-1.5' : 'space-y-2'}>
            {indicators.map((ind) => {
              const ui = statusUi[ind.status]
              const StatusIcon = ZONE_STATUS[ind.status].Icon
              return (
                <div key={ind.id} className={`rounded-xl border border-text/5 bg-text/5 ${compact ? 'p-2' : 'p-2.5'}`}>
                  <div className={compact ? 'flex flex-col items-start gap-1' : 'flex items-baseline justify-between gap-2'}>
                    <span className="text-xs font-medium text-holo-text">{indicatorName(t, ind)}</span>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs font-bold uppercase tracking-wide ${STATUS_CHIP[ind.status]}`}>
                      <StatusIcon className="h-3 w-3" aria-hidden="true" />
                      {t(STATUS_KEY[ind.status])}
                    </span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className={`font-display font-bold tabular-nums leading-none text-text ${compact ? 'text-xl' : 'text-2xl'}`}>{indicatorValue(t, ind)}</span>
                    <span className="font-mono text-xs text-holo-text/80">{unitLabel(t, ind.unit)}</span>
                  </div>
                  {!compact && ind.history.length >= 2 && (
                    <div className="mt-1.5">
                      <Sparkline values={ind.history} color={ui.cssVar} />
                    </div>
                  )}
                  {!compact && (ind.reason || ind.reasonKey) && (
                    <p className="m-0 mt-1 text-[11px] italic leading-tight text-mute">{indicatorReason(t, ind)}</p>
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
  /** null = vista general: ningún botón de zona marcado ni tarjeta de lecturas. */
  selectedZone: ZoneId | null
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
  'flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl border border-holo-edge bg-holo-panel/60 px-4 font-mono text-xs uppercase tracking-wide text-holo-text transition-colors hover:border-holo hover:bg-holo-panel focus-visible:outline-2 focus-visible:outline-holo'

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
      className={`relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-holo-edge/50 bg-gradient-to-b from-holo-deep/95 via-holo-mid/85 to-holo-low/95 p-4 shadow-[0_0_35px_color-mix(in_srgb,var(--color-holo)_12%,transparent)] ${className ?? ''}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-holo/10 via-transparent to-transparent" />

      <div className="z-10 mb-2 flex w-full flex-wrap items-center justify-between gap-2 border-b border-holo-edge/30 pb-2.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-holo-hi shadow-[0_0_8px_var(--color-holo-hi)]" />
          <span className="font-display font-semibold uppercase tracking-widest text-holo">{t('holo.title')}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {toolbar}
          <button type="button" onClick={() => setAutoRotate((v) => !v)} aria-pressed={autoRotate} className={BTN}>
            <span className={`h-2 w-2 rounded-full ${autoRotate ? 'bg-holo' : 'bg-mute'}`} aria-hidden="true" />
            {autoRotate ? t('holo.pause') : t('holo.resume')}
          </button>
        </div>
      </div>

      {/* En tablet horizontal el lienzo se ajusta al alto de la pantalla para que «Hoy» quepa sin scroll. */}
      <div className="relative h-[440px] w-full sm:h-[480px] lg:h-[clamp(380px,calc(100dvh-324px),600px)]" role="group" aria-label={t('holo.canvasLabel')}>
        {indicators && indicators.length > 0 && (
          <div className="hidden md:block">
            {selectedZone && <ConnectingLines selected={selectedZone} centered={focused} />}
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

      <div className="z-10 mt-2 flex w-full flex-wrap items-center justify-center gap-1.5 border-t border-holo-edge/30 pt-2.5 lg:grid lg:grid-cols-5">
        {ZONE_META.map((z) => {
          const isSel = selectedZone === z.id
          const status = zonesStatus?.[z.id]
          const info = status ? ZONE_STATUS[status] : undefined
          const StatusIcon = info?.Icon ?? CircleDashed
          const statusText = status ? t(STATUS_KEY[status]) : ''
          return (
            <button
              key={z.id}
              type="button"
              onClick={() => onSelectZone(z.id)}
              aria-pressed={isSel}
              aria-label={status ? t('holo.zoneAria', { zone: t(z.labelKey), status: statusText }) : t('holo.zoneNoData', { zone: t(z.labelKey) })}
              title={status ? statusText : undefined}
              className={`flex min-h-[44px] min-w-0 items-center gap-1.5 rounded-lg border-2 px-3 text-xs font-medium leading-tight transition-all lg:justify-center lg:gap-1 lg:px-1.5 ${
                isSel
                  ? `${info?.border ?? 'border-holo'} bg-holo-deep text-text`
                  : 'border-text/10 bg-text/5 text-mute hover:border-holo-edge hover:text-holo-text'
              }`}
            >
              <z.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{t(z.labelKey)}</span>
              <StatusIcon className={`h-4 w-4 shrink-0 ${info?.text ?? 'text-mute'}`} aria-hidden="true" />
              {/* En tablet el ícono (forma distinta por estado) ya indica el estado sin depender del color;
                  la palabra va en el nombre accesible y el texto emergente, y se ve completa en pantallas muy anchas. */}
              {status && <span className={`hidden text-xs font-semibold 2xl:inline ${info?.text}`} aria-hidden="true">{statusText}</span>}
            </button>
          )
        })}
      </div>

      <div className="z-10 mt-2 flex w-full flex-wrap items-center justify-between gap-x-3 font-mono text-xs text-holo-text/70">
        <span>
          {t('holo.zone').toUpperCase()}: {active ? t(active.nameKey).toUpperCase() : t('holo.overview').toUpperCase()}
        </span>
        <span>{t('holo.hint')}</span>
      </div>
      {note && <p className="z-10 m-0 mt-1.5 w-full text-center text-[11px] text-holo-text/70">{note}</p>}
    </div>
  )
}
