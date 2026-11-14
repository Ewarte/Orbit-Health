import type { Indicator } from '../../types'
import { Sparkline } from '../charts/Sparkline'
import { statusUi } from '../../lib/status'

interface Props {
  indicator: Indicator
  selected: boolean
  onSelect: () => void
}

export function IndicatorTile({ indicator, selected, onSelect }: Props) {
  const ui = statusUi[indicator.status]
  const statusText = indicator.reason ? `${ui.label}: ${indicator.reason}` : ui.label

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex min-h-36 h-full w-full cursor-pointer touch-manipulation flex-col justify-start rounded-lg border border-t-4 bg-panel p-4 text-left transition-colors hover:border-mute ${ui.border} ${
        selected ? 'border-text' : 'border-edge'
      }`}
    >
      <span className="block text-sm font-medium text-mute">{indicator.name}</span>
      <span className="my-1 block font-display text-4xl leading-tight font-semibold tabular-nums">
        {indicator.value} <span className="font-sans text-base font-normal text-mute">{indicator.unit}</span>
      </span>
      <span className={`block text-sm font-semibold ${ui.text}`}>{statusText}</span>
      <Sparkline values={indicator.history} color={ui.cssVar} />
    </button>
  )
}
