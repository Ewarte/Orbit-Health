import { DashboardPage } from './components/dashboard/DashboardPage'
import { AppShell, type NavItem } from './components/layout/AppShell'
import { indicators, mission, notices, zones } from './data/mock'

const nav: NavItem[] = [
  { id: 'today', label: 'Today', ready: true },
  { id: 'check', label: 'Daily check', ready: false },
  { id: 'trends', label: 'Trends', ready: false },
  { id: 'routine', label: 'Routine', ready: false },
  { id: 'mission', label: 'Mission', ready: false },
]

export default function App() {
  return (
    <AppShell nav={nav} current="today" onNavigate={() => {}}>
      <DashboardPage mission={mission} zones={zones} indicators={indicators} notices={notices} />
    </AppShell>
  )
}
