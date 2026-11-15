import { useState } from 'react'
import { DashboardPage } from './components/dashboard/DashboardPage'
import { AppShell, type NavItem } from './components/layout/AppShell'
import { indicators, mission, notices, zones } from './data/mock'
import { GuidancePage } from './features/guidance/GuidancePage'
import { DailyCheckPage } from './features/measurements/DailyCheckPage'
import { MissionPage } from './features/mission/MissionPage'
import { RoutinePage } from './features/routine/RoutinePage'
import { TrendsPage } from './features/trends/TrendsPage'

const nav: NavItem[] = [
  { id: 'today', label: 'Today', ready: true },
  { id: 'check', label: 'Daily check', ready: true },
  { id: 'trends', label: 'Trends', ready: true },
  { id: 'routine', label: 'Routine', ready: true },
  { id: 'mission', label: 'Mission', ready: true },
  { id: 'guidance', label: 'Guidance', ready: true },
]

export default function App() {
  const [current, setCurrent] = useState('check')

  return (
    <AppShell nav={nav} current={current} onNavigate={setCurrent}>
      {current === 'today' ? (
        <DashboardPage
          mission={mission}
          zones={zones}
          indicators={indicators}
          notices={notices}
          onNavigate={setCurrent}
        />
      ) : current === 'check' ? (
        <DailyCheckPage mission={mission} onNavigate={setCurrent} />
      ) : current === 'trends' ? (
        <TrendsPage mission={mission} onNavigate={setCurrent} />
      ) : current === 'routine' ? (
        <RoutinePage
          mission={mission}
          indicators={indicators}
          notices={notices}
          onNavigate={setCurrent}
        />
      ) : current === 'mission' ? (
        <MissionPage
          mission={mission}
          indicators={indicators}
          notices={notices}
          onNavigate={setCurrent}
        />
      ) : current === 'guidance' ? (
        <GuidancePage
          mission={mission}
          notices={notices}
          onNavigate={setCurrent}
        />
      ) : (
        <DashboardPage
          mission={mission}
          zones={zones}
          indicators={indicators}
          notices={notices}
          onNavigate={setCurrent}
        />
      )}
    </AppShell>
  )
}
