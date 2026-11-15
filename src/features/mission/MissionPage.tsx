import { useState } from 'react'
import {
  AlertTriangle,
  Globe2,
  Gauge,
  Radio,
  Rocket,
  Save,
  Thermometer,
  WifiOff,
  Wind,
  Zap,
} from 'lucide-react'
import type { Mission } from '../../types'

export interface SpaceEnvironment {
  id: string
  name: string
  category: 'transit' | 'station' | 'surface' | 'eva'
  gravity: string
  radiationLevel: 'Moderate' | 'High' | 'Severe'
  commsDelay: string
  description: string
  primaryRisks: string[]
}

const ENVIRONMENTS: SpaceEnvironment[] = [
  {
    id: 'lunar-transit',
    name: 'Lunar Transit (Orion / Gateway)',
    category: 'transit',
    gravity: '0 g (Microgravity)',
    radiationLevel: 'Moderate',
    commsDelay: '1.3 seconds',
    description: 'En-route trajectory beyond Van Allen radiation belts. Cephalad fluid shift and continuous cosmic rays.',
    primaryRisks: ['Fluid redistribution / SANS', 'Galactic Cosmic Radiation (GCR)', 'Motion sickness (SMS)'],
  },
  {
    id: 'orbital-iss',
    name: 'Low Earth Orbit (ISS)',
    category: 'station',
    gravity: '0 g (Microgravity)',
    radiationLevel: 'Moderate',
    commsDelay: '< 0.5 seconds',
    description: 'Earth geomagnetic shielding mitigates solar particles. 90-minute circadian disruption cycles.',
    primaryRisks: ['Bone demineralization', 'Circadian desynchronosis', 'Muscle atrophy'],
  },
  {
    id: 'lunar-surface',
    name: 'Lunar Surface (Artemis Base Camp)',
    category: 'surface',
    gravity: '1/6 g (0.166 g)',
    radiationLevel: 'High',
    commsDelay: '1.3 seconds',
    description: 'Extreme 14-day thermal cycles (-130°C to +120°C). Highly abrasive toxic lunar regolith dust.',
    primaryRisks: ['Lunar dust toxicity / inhalation', 'Secondary neutron scatter', 'Hypogravity locomotion fatigue'],
  },
  {
    id: 'mars-transit',
    name: 'Deep Space Mars Transit (DST)',
    category: 'transit',
    gravity: '0 g (Microgravity)',
    radiationLevel: 'Severe',
    commsDelay: '4 to 22 minutes',
    description: 'Complete autonomous mission profile. High vulnerability to Solar Particle Events (SPEs). No medical evacuation.',
    primaryRisks: ['SPE lethal dose threat', 'Severe behavioral isolation', 'Cardiovascular deconditioning'],
  },
  {
    id: 'mars-surface',
    name: 'Mars Surface (Jezero Habitat)',
    category: 'surface',
    gravity: '3/8 g (0.38 g)',
    radiationLevel: 'High',
    commsDelay: '4 to 22 minutes',
    description: 'Hypobaric CO2-rich atmosphere. Global dust storms reduce solar power. Partial gravity rehabilitation.',
    primaryRisks: ['Perchlorate dust toxicity', 'Chronic low-dose GCR', 'Neurobehavioral confinement stress'],
  },
]

interface Props {
  mission: Mission
  onSave: (mission: Mission) => void
}

export function MissionPage({ mission, onSave }: Props) {
  const [draft, setDraft] = useState(mission)
  const [selectedEnvId, setSelectedEnvId] = useState('lunar-transit')
  const [savedNotification, setSavedNotification] = useState<string | null>(null)

  const activeEnv = ENVIRONMENTS.find((e) => e.id === selectedEnvId) ?? ENVIRONMENTS[0]

  const handleSave = () => {
    const updated = {
      ...draft,
      day: Math.max(1, Math.round(draft.day)),
      place: activeEnv.name,
    }
    onSave(updated)
    setSavedNotification(`Mission context saved: Day ${updated.day} — ${updated.place}`)
    setTimeout(() => setSavedNotification(null), 3500)
  }

  // Los 3 Casos del Guion de Demostración de la NASA
  const loadScenario = (caseNumber: 1 | 2 | 3) => {
    let scenarioMission: Mission
    let scenarioMetrics: Record<string, unknown>
    let toastMsg = ''

    if (caseNumber === 1) {
      // Caso 1: Nominal / Estable
      setSelectedEnvId('lunar-transit')
      scenarioMission = { day: 14, place: 'Lunar Transit (Orion / Gateway)', lastCheck: '07:10' }
      scenarioMetrics = {
        bloodPressureSys: 120,
        bloodPressureDia: 78,
        heartRate: 62,
        bloodSugar: 92,
        bodyTemperature: 36.6,
        sleepHours: 7.6,
        mood: 'Great',
      }
      toastMsg = 'Loaded Scenario 1: Nominal Profile (All indicators OK / Green)'
    } else if (caseNumber === 2) {
      // Caso 2: Fatiga acumulada y deuda de sueño
      setSelectedEnvId('mars-transit')
      scenarioMission = { day: 47, place: 'Deep Space Mars Transit (DST)', lastCheck: '07:10' }
      scenarioMetrics = {
        bloodPressureSys: 138,
        bloodPressureDia: 88,
        heartRate: 78,
        bloodSugar: 104,
        bodyTemperature: 36.8,
        sleepHours: 4.8,
        mood: 'Bad',
      }
      toastMsg = 'Loaded Scenario 2: Cumulative Sleep Debt & Behavioral Stress (Warning / Amber)'
    } else {
      // Caso 3: Evento SPE & Desacondicionamiento
      setSelectedEnvId('lunar-surface')
      scenarioMission = { day: 85, place: 'Lunar Surface (Artemis Base Camp)', lastCheck: '06:45' }
      scenarioMetrics = {
        bloodPressureSys: 146,
        bloodPressureDia: 94,
        heartRate: 88,
        bloodSugar: 118,
        bodyTemperature: 37.4,
        sleepHours: 4.2,
        mood: 'Fair',
      }
      toastMsg = 'Loaded Scenario 3: Solar Radiation Flare & Cardiovascular Spike (Action Required / Red)'
    }

    setDraft(scenarioMission)
    onSave(scenarioMission)
    try {
      localStorage.setItem('orbit_health_current_metrics', JSON.stringify(scenarioMetrics))
      localStorage.setItem('orbit_health_mission_config', JSON.stringify(scenarioMission))
    } catch {
      // ignore
    }

    setSavedNotification(toastMsg)
    setTimeout(() => setSavedNotification(null), 4000)
  }

  return (
    <main className="min-w-0 px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Notificación */}
        {savedNotification && (
          <div
            role="status"
            className="mb-4 flex items-center justify-between rounded-xl border border-[#5cc98b] bg-[#12362c] p-4 text-sm font-semibold text-[#5cc98b] shadow-xl animate-in fade-in"
          >
            <span>{savedNotification}</span>
          </div>
        )}

        {/* Cabecera */}
        <header className="mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#5cc98b]">
              <Rocket className="h-3.5 w-3.5" /> Mission Architecture & Telemetry
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-text sm:text-4xl">
              Mission Context & Environment
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-mute">
            <Radio className="h-4 w-4 text-[#5cc98b]" />
            <span>Autonomous Offline Telemetry</span>
          </div>
        </header>

        {/* Los 3 Casos del Guión de la NASA para Evaluación del Hackathon */}
        <section className="mb-8 rounded-2xl border border-edge bg-[#14283d] p-5 sm:p-6 shadow-lg shadow-black/20">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold text-text">
                Hackathon Simulation Scenarios
              </h2>
              <p className="text-xs text-mute">
                Load validated NASA flight profiles into memory to verify health engine responses
              </p>
            </div>
            <span className="rounded-full bg-[#184840] px-3 py-1 text-xs font-semibold text-[#5cc98b]">
              3 Preset Profiles
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => loadScenario(1)}
              className="flex flex-col items-start rounded-xl border border-[#2d7d6b]/50 bg-[#122e2b]/40 p-4 text-left transition-all hover:bg-[#122e2b]/70 hover:border-[#5cc98b] cursor-pointer"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-[#5cc98b]">
                <span className="h-2 w-2 rounded-full bg-[#5cc98b]" />
                <span>CASE 1: Nominal Flight</span>
              </div>
              <strong className="mt-2 text-sm text-text">Day 14 — Lunar Transit</strong>
              <span className="mt-1 text-xs text-mute">All metrics in green target ranges. Adequate sleep and normal circadian rhythm.</span>
            </button>

            <button
              type="button"
              onClick={() => loadScenario(2)}
              className="flex flex-col items-start rounded-xl border border-amber-600/40 bg-amber-950/20 p-4 text-left transition-all hover:bg-amber-950/40 hover:border-amber-400 cursor-pointer"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span>CASE 2: Sleep Debt & Fatigue</span>
              </div>
              <strong className="mt-2 text-sm text-text">Day 47 — Mars Transit</strong>
              <span className="mt-1 text-xs text-mute">3 short nights (&lt;5.2h). Elevated resting HR and drop in cognitive self-rating.</span>
            </button>

            <button
              type="button"
              onClick={() => loadScenario(3)}
              className="flex flex-col items-start rounded-xl border border-red-600/40 bg-red-950/20 p-4 text-left transition-all hover:bg-red-950/40 hover:border-red-400 cursor-pointer"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-red-400">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                <span>CASE 3: Solar Flare & Stress</span>
              </div>
              <strong className="mt-2 text-sm text-text">Day 85 — Lunar Surface</strong>
              <span className="mt-1 text-xs text-mute">SPE warning alert. Blood pressure spike (146/94) and elevated core temperature.</span>
            </button>
          </div>
        </section>

        {/* Selector de Entornos de Misión */}
        <section className="mb-8 rounded-2xl border border-edge bg-[#14283d] p-5 sm:p-6 shadow-lg shadow-black/20">
          <div className="mb-4">
            <h2 className="font-display text-xl font-semibold text-text">
              Operational Flight Environment
            </h2>
            <p className="text-xs text-mute">
              Space environment dictates radiation dose models, hypogravity adaptations, and communications latency.
            </p>
          </div>

          {/* Botones de selección de entorno */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {ENVIRONMENTS.map((env) => {
              const isSelected = env.id === selectedEnvId
              return (
                <button
                  key={env.id}
                  type="button"
                  onClick={() => {
                    setSelectedEnvId(env.id)
                    setDraft((d) => ({ ...d, place: env.name }))
                  }}
                  className={`flex flex-col rounded-xl border p-4 text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#5cc98b] bg-[#184840]/40 ring-1 ring-[#5cc98b]'
                      : 'border-edge bg-rail/60 hover:border-edge/80 hover:bg-rail'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase text-mute">{env.gravity}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        env.radiationLevel === 'Severe'
                          ? 'bg-red-950 text-red-400 border border-red-700/50'
                          : env.radiationLevel === 'High'
                          ? 'bg-amber-950 text-amber-400 border border-amber-700/50'
                          : 'bg-[#184840] text-[#5cc98b]'
                      }`}
                    >
                      {env.radiationLevel} Rad
                    </span>
                  </div>
                  <strong className="mt-2 font-display text-base text-text">{env.name}</strong>
                  <span className="mt-1 text-xs text-mute line-clamp-2">{env.description}</span>
                </button>
              )
            })}
          </div>

          {/* Ficha Detallada del Entorno Seleccionado */}
          <div className="mt-5 rounded-xl border border-edge/80 bg-rail/90 p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-edge/60 pb-3">
              <div className="flex items-center gap-2">
                <Globe2 className="h-5 w-5 text-[#5cc98b]" />
                <strong className="text-text">{activeEnv.name}</strong>
              </div>
              <div className="flex items-center gap-4 text-xs text-mute">
                <span>Gravity: <strong className="text-text">{activeEnv.gravity}</strong></span>
                <span>Comms Delay: <strong className="text-text">{activeEnv.commsDelay}</strong></span>
              </div>
            </div>

            <div className="mt-3">
              <span className="text-xs font-semibold uppercase text-mute">Dominant NASA HRP Flight Risks:</span>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {activeEnv.primaryRisks.map((risk) => (
                  <span
                    key={risk}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-panel px-2.5 py-1 text-xs font-medium text-text"
                  >
                    <AlertTriangle className="h-3 w-3 text-amber-400" />
                    <span>{risk}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Telemetría Ambiental de Cabina (ECLSS Life Support) */}
        <section className="mb-8 rounded-2xl border border-edge bg-[#14283d] p-5 sm:p-6 shadow-lg shadow-black/20">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold text-text">
                Cabin Environmental Telemetry (ECLSS)
              </h2>
              <p className="text-xs text-mute">Atmospheric and radiation status monitored by autonomous life support sensors</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[#5cc98b]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#5cc98b]" /> All nominal
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-edge bg-rail/70 p-4">
              <span className="flex items-center gap-1.5 text-xs text-mute">
                <Gauge className="h-3.5 w-3.5 text-sky-400" /> Cabin Pressure
              </span>
              <div className="mt-2 text-xl font-bold font-display text-text">
                101.3 <span className="text-xs font-normal text-mute">kPa (14.7 psi)</span>
              </div>
            </div>

            <div className="rounded-xl border border-edge bg-rail/70 p-4">
              <span className="flex items-center gap-1.5 text-xs text-mute">
                <Wind className="h-3.5 w-3.5 text-[#5cc98b]" /> Oxygen (FiO2)
              </span>
              <div className="mt-2 text-xl font-bold font-display text-text">
                20.9 <span className="text-xs font-normal text-mute">% O2</span>
              </div>
            </div>

            <div className="rounded-xl border border-edge bg-rail/70 p-4">
              <span className="flex items-center gap-1.5 text-xs text-mute">
                <Zap className="h-3.5 w-3.5 text-amber-400" /> Ambient Rad Dose
              </span>
              <div className="mt-2 text-xl font-bold font-display text-text">
                0.44 <span className="text-xs font-normal text-mute">mSv/day</span>
              </div>
            </div>

            <div className="rounded-xl border border-edge bg-rail/70 p-4">
              <span className="flex items-center gap-1.5 text-xs text-mute">
                <Thermometer className="h-3.5 w-3.5 text-purple-400" /> Cabin Temp
              </span>
              <div className="mt-2 text-xl font-bold font-display text-text">
                21.4 <span className="text-xs font-normal text-mute">°C (46% RH)</span>
              </div>
            </div>
          </div>
        </section>

        {/* Formulario de Configuración de Misión */}
        <section className="rounded-2xl border border-edge bg-[#14283d] p-5 sm:p-6 shadow-lg shadow-black/20">
          <h2 className="font-display text-xl font-semibold text-text mb-4">
            Mission Metadata Configuration
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase text-mute">
                Mission Elapsed Day (MET)
              </label>
              <input
                type="number"
                min={1}
                value={draft.day}
                onChange={(e) => setDraft({ ...draft, day: Number(e.target.value) })}
                className="mt-1.5 min-h-11 w-full rounded-lg border border-edge bg-rail px-3.5 text-text focus:border-[#5cc98b] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-mute">
                Designated Habitat / Spacecraft
              </label>
              <input
                type="text"
                value={draft.place}
                onChange={(e) => setDraft({ ...draft, place: e.target.value })}
                className="mt-1.5 min-h-11 w-full rounded-lg border border-edge bg-rail px-3.5 text-text focus:border-[#5cc98b] focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#5cc98b] px-6 py-2.5 font-bold text-[#0c1e2f] hover:bg-[#6edba0] transition-colors cursor-pointer"
            >
              <Save className="h-4 w-4 stroke-[2.5]" />
              <span>Save mission context</span>
            </button>
          </div>
        </section>

        {/* Aviso de Modo Offline */}
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-edge bg-rail/80 p-4 text-xs text-mute sm:text-sm">
          <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <p className="m-0 leading-relaxed">
            <strong className="text-text">Autonomous Operation:</strong> All environment thresholds, sensor history, and simulation profiles run completely locally on this flight terminal without dependency on ground telecommunication links.
          </p>
        </div>
      </div>
    </main>
  )
}
