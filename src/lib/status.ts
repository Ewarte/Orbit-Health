import type { Status } from '../types'

/** Texto y clases de cada estado. Único lugar donde se decide cómo se ve un estado. */
export const statusUi: Record<Status, { label: string; text: string; border: string; cssVar: string }> = {
  ok: { label: 'Normal', text: 'text-ok', border: 'border-t-ok', cssVar: 'var(--color-ok)' },
  watch: { label: 'Watch', text: 'text-watch', border: 'border-t-watch', cssVar: 'var(--color-watch)' },
  act: { label: 'Act now', text: 'text-act', border: 'border-t-act', cssVar: 'var(--color-act)' },
}

const order: Status[] = ['ok', 'watch', 'act']

/** El peor estado de una lista; undefined si está vacía. */
export function worstStatus(list: Status[]): Status | undefined {
  if (list.length === 0) return undefined
  return list.reduce((worst, s) => (order.indexOf(s) > order.indexOf(worst) ? s : worst))
}
