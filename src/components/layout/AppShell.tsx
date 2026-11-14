import type { ReactNode } from 'react'

export interface NavItem {
  id: string
  label: string
  /** false = pantalla aún no construida */
  ready: boolean
}

interface Props {
  nav: NavItem[]
  current: string
  onNavigate: (id: string) => void
  children: ReactNode
}

/** Marco común de todas las pantallas: navegación lateral y aviso de trabajo sin enlace. */
export function AppShell({ nav, current, onNavigate, children }: Props) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[180px_1fr]">
      <nav aria-label="Main" className="flex flex-col gap-1 bg-rail px-3.5 py-4 lg:py-6">
        <strong className="mx-2 mb-2 font-display text-xl font-semibold lg:mb-4">Crew health</strong>
        <ul className="m-0 flex list-none flex-row flex-wrap gap-1 p-0 lg:flex-col">
          {nav.map((item) => {
            const isCurrent = item.id === current
            return (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={!item.ready}
                  aria-current={isCurrent ? 'page' : undefined}
                  title={item.ready ? undefined : 'Not built yet'}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full rounded-md px-2.5 py-2 text-left ${
                    isCurrent ? 'bg-panel text-text' : 'text-mute enabled:cursor-pointer enabled:hover:text-text disabled:opacity-50'
                  }`}
                >
                  {item.label}
                </button>
              </li>
            )
          })}
        </ul>
        <p className="m-0 mt-3 rounded-md border border-edge p-2.5 text-sm text-mute lg:mt-auto">
          No ground link. Everything runs on this device.
        </p>
      </nav>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
