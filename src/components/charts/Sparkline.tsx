interface Props {
  values: number[]
  color: string
}

/** Línea de tendencia mínima. Decorativa: el dato ya está escrito en la casilla. */
export function Sparkline({ values, color }: Props) {
  if (values.length < 2) return null

  const width = 100
  const height = 30
  const pad = 4
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width
      const y = height - pad - ((v - min) / range) * (height - pad * 2)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="mt-2 block h-8 w-full" aria-hidden="true">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" points={points} />
    </svg>
  )
}
