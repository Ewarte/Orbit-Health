import { useState } from 'react'
import { DashboardPage } from './components/dashboard/DashboardPage'
import { AppShell, type NavItem } from './components/layout/AppShell'
import { indicators, mission, notices, zones } from './data/mock'
import { actionGuides } from './data/actionGuides'
import { GuidancePage } from './features/guidance/GuidancePage'
import { DailyCheckPage } from './features/measurements/DailyCheckPage'
import type { DailyMetrics } from './features/measurements/dailyCheckTypes'
import { evaluateDailyMetrics } from './features/evaluation/healthEngine'
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
  const [current, setCurrent] = useState('today')

  const [missionState, setMissionState] = useState(() => {
    try {
      const saved = localStorage.getItem('orbit_health_mission_config')
      return saved ? JSON.parse(saved) as typeof mission : mission
    } catch { return mission }
  })

  const [liveMetrics, setLiveMetrics] = useState<DailyMetrics>(() => {
    try {
      const saved = localStorage.getItem('orbit_health_current_metrics')
      if (saved) return JSON.parse(saved) as DailyMetrics
    } catch {
      // Usar el panel nominal si no hay datos locales.
    }
    return {
      bloodPressureSys: 128,
      bloodPressureDia: 82,
      heartRate: 64,
      bloodSugar: 96,
      bodyTemperature: 36.7,
      sleepHours: 5.2,
      mood: 'Good',
    }
  })

  const liveIndicators = indicators.map(
    (base) => evaluateDailyMetrics(liveMetrics).find((live) => live.id === base.id) ?? base,
  )

  return (
    <AppShell nav={nav} current={current} onNavigate={setCurrent}>
      {current === 'today' ? (
        <DashboardPage
          mission={missionState}
          zones={zones}
          indicators={liveIndicators}
          notices={notices}
          onNavigate={setCurrent}
        />
      ) : current === 'check' ? (
        <DailyCheckPage
          mission={missionState}
          onNavigate={setCurrent}
          onComplete={(metrics) => {
            setLiveMetrics(metrics)
            localStorage.setItem('orbit_health_current_metrics', JSON.stringify(metrics))
          }}
        />
      ) : current === 'trends' ? (
        <TrendsPage mission={missionState} onNavigate={setCurrent} />
      ) : current === 'routine' ? (
        <RoutinePage
          mission={missionState}
          indicators={liveIndicators}
          notices={notices}
          onNavigate={setCurrent}
        />
      ) : current === 'mission' ? (
        <MissionPage
          mission={missionState}
          indicators={liveIndicators}
          notices={notices}
          onNavigate={setCurrent}
          onSave={(next) => {
            setMissionState(next)
            localStorage.setItem('orbit_health_mission_config', JSON.stringify(next))
          }}
        />
      ) : current === 'guidance' ? (
        <GuidancePage
          mission={missionState}
          notices={notices}
          guides={actionGuides}
          onNavigate={setCurrent}
        />
      ) : (
        <DashboardPage
          mission={missionState}
          zones={zones}
          indicators={liveIndicators}
          notices={notices}
          onNavigate={setCurrent}
        />
      )}
    </AppShell>
  )
}
