import { useState } from 'react'
import { localizePlace } from './lib/i18n'
import { useI18n } from './lib/useI18n'
import { DashboardPage } from './components/dashboard/DashboardPage'
import { AppShell, type NavItem } from './components/layout/AppShell'
import { indicators, mission, notices, zones } from './data/mock'
import { DailyCheckPage } from './features/measurements/DailyCheckPage'
import type { DailyMetrics } from './features/measurements/dailyCheckTypes'
import { evaluateDailyMetrics } from './features/evaluation/healthEngine'
import { GuidancePage } from './features/guidance/GuidancePage'
import { MissionPage } from './features/mission/MissionPage'
import { RoutinePage } from './features/mission/RoutinePage'
import { TrendsPage } from './features/trends/TrendsPage'

const navIds = ['today', 'check', 'trends', 'guidance', 'routine', 'mission'] as const

export default function App() {
  const { t, lang } = useI18n()
  const nav: NavItem[] = navIds.map((id) => ({ id, label: t(`nav.${id}`), ready: true }))
  const [current, setCurrent] = useState('check')
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
    return { bloodPressureSys: 128, bloodPressureDia: 82, heartRate: 64, bloodSugar: 96, bodyTemperature: 36.7, sleepHours: 5.2, mood: 'Good' }
  })
  const missionView = { ...missionState, place: localizePlace(missionState.place, lang) }
  const liveIndicators = indicators.map((base) => evaluateDailyMetrics(liveMetrics).find((live) => live.id === base.id) ?? base)

  return (
    <AppShell nav={nav} current={current} onNavigate={setCurrent}>
      {current === 'today' ? (
        <DashboardPage mission={missionView} zones={zones} indicators={liveIndicators} notices={notices} onGuidance={() => setCurrent('guidance')} />
      ) : current === 'check' ? (
        <DailyCheckPage mission={missionView} onNavigate={setCurrent} onComplete={setLiveMetrics} />
      ) : current === 'trends' ? (
        <TrendsPage mission={missionView} onNavigate={setCurrent} />
      ) : current === 'guidance' ? (
        <GuidancePage indicators={liveIndicators} />
      ) : current === 'routine' ? (
        <RoutinePage />
      ) : current === 'mission' ? (
        <MissionPage key={lang} mission={missionView} onSave={(nextMission) => { setMissionState(nextMission); localStorage.setItem('orbit_health_mission_config', JSON.stringify(nextMission)) }} />
      ) : null}
    </AppShell>
  )
}
