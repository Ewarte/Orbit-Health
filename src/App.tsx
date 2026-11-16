import { useCallback, useEffect, useState } from 'react'
import { localizePlace } from './lib/i18n'
import { flightDay, missionClock, normalizeMission, parseUtc } from './lib/missionTime'
import { useI18n } from './lib/useI18n'
import { DashboardPage } from './components/dashboard/DashboardPage'
import { AppShell, type NavItem } from './components/layout/AppShell'
import { ErrorBoundary } from './components/layout/ErrorBoundary'
import { zones } from './data/mock'
import { DailyCheckPage } from './features/measurements/DailyCheckPage'
import { CURRENT_METRICS_KEY, STORAGE_KEY, normalizeMetrics, parseRecords } from './features/measurements/dailyCheckData'
import type { DailyMetrics, SavedRecord } from './features/measurements/dailyCheckTypes'
import { liveIndicators } from './features/evaluation/liveIndicators'
import { GuidancePage } from './features/guidance/GuidancePage'
import { MedicalPage } from './features/medical/MedicalPage'
import { MissionPage } from './features/mission/MissionPage'
import { UpdateNotice } from './components/layout/UpdateNotice'
import { ReminderBanner } from './features/mission/ReminderBanner'
import { RoutinePage } from './features/mission/RoutinePage'
import { useRoutineReminders } from './features/mission/useRoutineReminders'
import { TrendsPage } from './features/trends/TrendsPage'
import type { Mission } from './types'

const navIds = ['today', 'check', 'trends', 'medical', 'guidance', 'routine', 'mission'] as const

const MISSION_KEY = 'orbit_health_mission_config'

function readJson(key: string): unknown {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

/** Medidas guardadas por versiones anteriores sin historial de chequeos (migración); null si no hay. */
function readLegacyMetrics(): DailyMetrics | null {
  const raw = readJson(CURRENT_METRICS_KEY)
  return raw && typeof raw === 'object' && !Array.isArray(raw) && Object.keys(raw).length > 0 ? normalizeMetrics(raw) : null
}

export default function App() {
  const { t, lang } = useI18n()
  const nav: NavItem[] = navIds.map((id) => ({ id, label: t(`nav.${id}`), ready: true }))
  // La app abre en «Hoy».
  const [current, setCurrent] = useState('today')
  // true solo al venir del botón «Hacer mi primer chequeo» de Hoy: abre el asistente directamente.
  const [startAssistant, setStartAssistant] = useState(false)
  const navigate = useCallback((id: string) => {
    setStartAssistant(false)
    setCurrent(id)
  }, [])
  // Reloj que avanza cada 30 s: de él sale el día de vuelo.
  const [nowMs, setNowMs] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 30_000)
    return () => window.clearInterval(timer)
  }, [])
  const [missionState, setMissionState] = useState<Mission>(() => normalizeMission(readJson(MISSION_KEY), Date.now()))
  // Chequeos reales (del más reciente al más antiguo). Un usuario nuevo empieza sin ninguno.
  const [records, setRecords] = useState<SavedRecord[]>(() => parseRecords(readJson(STORAGE_KEY)))
  const [legacyMetrics] = useState(readLegacyMetrics)
  const lastCheckAt = records[0]?.timestamp ?? null
  const handleComplete = useCallback((_metrics: DailyMetrics, record: SavedRecord) => {
    setRecords((list) => [record, ...list.filter((item) => item.id !== record.id)])
  }, [])

  const missionView = {
    ...missionState,
    day: flightDay(nowMs, parseUtc(missionState.launchUtc) ?? nowMs),
    place: localizePlace(missionState.place, lang),
  }
  const routineClock = useCallback((now: Date) => missionClock(now.getTime(), missionState), [missionState])
  // Recordatorios de la rutina: se calculan aquí para que avisen en cualquier pantalla.
  const routine = useRoutineReminders(routineClock)
  // Indicadores del último chequeo real; sin chequeos, ninguno (no hay estados inventados).
  const indicators = liveIndicators(records, legacyMetrics)

  function saveMission(nextMission: Mission) {
    setMissionState(nextMission)
    try {
      localStorage.setItem(MISSION_KEY, JSON.stringify(nextMission))
    } catch {
      // El modo privado o un almacenamiento lleno no deben romper la app: la misión sigue en memoria.
    }
  }

  return (
    <AppShell nav={nav} current={current} onNavigate={navigate}>
      <ErrorBoundary key={current} onReset={() => navigate('today')}>
        {current === 'today' ? (
          <DashboardPage
            mission={missionView}
            zones={zones}
            indicators={indicators}
            lastCheckAt={lastCheckAt}
            onGuidance={() => navigate('guidance')}
            onStartCheck={() => {
              setStartAssistant(true)
              setCurrent('check')
            }}
          />
        ) : current === 'check' ? (
          <DailyCheckPage mission={missionView} onNavigate={navigate} onComplete={handleComplete} startWithAssistant={startAssistant} />
        ) : current === 'trends' ? (
          <TrendsPage mission={missionView} onNavigate={navigate} />
        ) : current === 'medical' ? (
          <MedicalPage mission={missionView} records={records} onNavigate={navigate} />
        ) : current === 'guidance' ? (
          <GuidancePage indicators={indicators} />
        ) : current === 'routine' ? (
          <RoutinePage routine={routine} />
        ) : current === 'mission' ? (
          <MissionPage key={lang} mission={missionView} onSave={saveMission} />
        ) : null}
      </ErrorBoundary>
      <ReminderBanner routine={routine} />
      <UpdateNotice />
    </AppShell>
  )
}
