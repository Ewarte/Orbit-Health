import type { Indicator } from '../../types'
import { Sparkline } from '../charts/Sparkline'
import { statusUi } from '../../lib/status'
import { indicatorName, indicatorReason, indicatorValue, statusLabel, unitLabel } from '../../lib/domainText'
import { useI18n } from '../../lib/useI18n'

interface Props {
  indicator: Indicator
  selected: boolean
  onSelect: () => void
}

export function IndicatorTile({ indicator, selected, onSelect }: Props) {
  const { t } = useI18n()
  const ui = statusUi[indicator.status]
  const label = statusLabel(t, indicator.status)
  const reason = indicatorReason(t, indicator)
  const statusText = reason ? `${label}: ${reason}` : label

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex min-h-36 h-full w-full cursor-pointer touch-manipulation flex-col justify-start rounded-xl border border-t-4 bg-panel p-4 text-left transition-all duration-200 hover:border-mute ${ui.border} ${
        selected ? 'border-red-400 ring-2 ring-red-500/80 shadow-[0_0_20px_rgba(255,32,78,0.35)] scale-[1.02]' : 'border-edge'
      }`}
    >
      <span className="block text-sm font-medium text-mute">{indicatorName(t, indicator)}</span>
      <span className="my-1 block font-display text-4xl leading-tight font-semibold tabular-nums">
        {indicatorValue(t, indicator)} <span className="font-sans text-base font-normal text-mute">{unitLabel(t, indicator.unit)}</span>
      </span>
      <span className={`block text-sm font-semibold ${ui.text}`}>{statusText}</span>
      <Sparkline values={indicator.history} color={ui.cssVar} />
    </button>
  )
}
