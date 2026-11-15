import { Languages } from 'lucide-react'
import type { ReactNode } from 'react'
import { useI18n } from '../../lib/useI18n'

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
  const { lang, setLang, t } = useI18n()
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[180px_1fr]">
      <nav aria-label={t('shell.navLabel')} className="flex min-w-0 flex-col gap-1 bg-rail px-3.5 py-3 sm:px-4 sm:py-4 lg:py-6">
        <strong className="mx-2 mb-2 font-display text-xl font-semibold lg:mb-4">{t('shell.title')}</strong>
        <ul className="m-0 flex list-none flex-nowrap gap-1 overflow-x-auto p-0 pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
          {nav.map((item) => {
            const isCurrent = item.id === current
            return (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={!item.ready}
                  aria-current={isCurrent ? 'page' : undefined}
                  title={item.ready ? undefined : t('shell.notBuilt')}
                  onClick={() => onNavigate(item.id)}
                  className={`min-h-11 w-max whitespace-nowrap rounded-md px-3 py-2 text-left text-sm sm:text-base lg:w-full ${
                    isCurrent ? 'bg-panel text-text' : 'text-mute enabled:cursor-pointer enabled:hover:text-text disabled:opacity-50'
                  }`}
                >
                  {item.label}
                </button>
              </li>
            )
          })}
        </ul>
        <button
          type="button"
          onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
          aria-label={t('shell.switchTo')}
          title={t('shell.switchTo')}
          className="mt-2 inline-flex min-h-11 w-max items-center gap-2 rounded-md border border-edge px-3 py-2 text-sm text-mute hover:text-text lg:mt-auto lg:w-full"
        >
          <Languages className="h-4 w-4" aria-hidden="true" />
          <span>{lang === 'es' ? 'Español · EN' : 'English · ES'}</span>
        </button>
        <p className="m-0 mt-2 hidden rounded-md border border-edge p-2.5 text-sm text-mute sm:block">
          {t('shell.offline')}
        </p>
      </nav>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
