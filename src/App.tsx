import { useState } from 'react'
import { DashboardPage } from './components/dashboard/DashboardPage'
import { AppShell, type NavItem } from './components/layout/AppShell'
import { indicators, mission, notices, zones } from './data/mock'
import { DailyCheckPage } from './features/measurements/DailyCheckPage'

const nav: NavItem[] = [
  { id: 'today', label: 'Today', ready: true },
  { id: 'check', label: 'Daily check', ready: true },
  { id: 'trends', label: 'Trends', ready: true },
  { id: 'routine', label: 'Routine', ready: true },
  { id: 'mission', label: 'Mission', ready: true },
]

const screenCopy: Record<string, { title: string; description: string }> = {
  trends: { title: 'Trends', description: 'Review recent readings and changes over time.' },
  routine: { title: 'Routine', description: 'Keep the crew routine visible during the mission.' },
  mission: { title: 'Mission', description: 'Mission day and cabin context.' },
}

export default function App() {
  const [current, setCurrent] = useState('check')

  return (
    <AppShell nav={nav} current={current} onNavigate={setCurrent}>
      {current === 'today' ? (
        <DashboardPage mission={mission} zones={zones} indicators={indicators} notices={notices} />
      ) : current === 'check' ? (
        <DailyCheckPage mission={mission} />
      ) : (
        <main className="px-4 py-6 sm:px-6">
          <div className="max-w-2xl rounded-lg border border-edge bg-panel p-6">
            <p className="m-0 text-sm font-semibold uppercase tracking-wide text-watch">Prototype</p>
            <h1 className="mt-2 mb-2 font-display text-3xl font-semibold">{screenCopy[current].title}</h1>
            <p className="m-0 text-mute">{screenCopy[current].description}</p>
          </div>
        </main>
      )}
    </AppShell>
  )
}
