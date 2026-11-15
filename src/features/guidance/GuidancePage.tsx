import { useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Info,
  Plus,
  Shield,
} from 'lucide-react'
import { guidanceProtocols } from '../../data/mock'
import type { GuidanceProtocol, Mission, Notice } from '../../types'
import type { ActionGuide } from '../../data/actionGuides'

interface Props {
  mission?: Mission
  notices?: Notice[]
  guides?: ActionGuide[]
  onNavigate?: (screen: string) => void
}

export function GuidancePage({ mission, notices = [], guides = [], onNavigate }: Props) {
  const currentDay = mission?.day ?? 47
  const [selectedProtocolId, setSelectedProtocolId] = useState<string>(guidanceProtocols[0].id)
  const [addedTaskId, setAddedTaskId] = useState<string | null>(null)

  const activeProtocol: GuidanceProtocol =
    guidanceProtocols.find((p) => p.id === selectedProtocolId) || guidanceProtocols[0]

  const handleAddProtocolToRoutine = (protocol: GuidanceProtocol) => {
    if (!protocol.recommendedTaskTitle) return

    try {
      const saved = localStorage.getItem('orbit_health_routine_tasks')
      const existing = saved ? JSON.parse(saved) : []

      const newTask = {
        id: `guidance-task-${Date.now()}`,
        title: protocol.recommendedTaskTitle,
        description: `Contramedida recomendada por el protocolo: ${protocol.title}`,
        category: protocol.recommendedCategory || 'protocol',
        timeStr: '19:30',
        durationMin: protocol.recommendedDurationMin || 20,
        completed: false,
        mandatory: true,
        sourceRecommendation: protocol.id,
        impact: protocol.summary,
      }

      localStorage.setItem('orbit_health_routine_tasks', JSON.stringify([newTask, ...existing]))
      setAddedTaskId(protocol.id)

      setTimeout(() => {
        setAddedTaskId(null)
      }, 3500)
    } catch {
      // ignore
    }
  }

  return (
    <main className="min-w-0 px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Cabecera Principal */}
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#5cc98b]">
              <BookOpen className="h-3.5 w-3.5" />
              <span>Manual Clínico Aeroespacial Offline</span>
            </div>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-text sm:text-4xl">
              Orientación y Contramedidas
            </h1>
            <p className="mt-1 text-sm text-mute">
              Protocolos validados por la NASA y la CSA para mitigación de riesgos biomédicos en vuelo orbital (Día {currentDay}).
            </p>
          </div>

          {onNavigate && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('routine')}
                className="inline-flex items-center gap-2 rounded-xl border border-edge bg-panel px-3.5 py-2 text-xs font-semibold text-text transition-colors hover:border-[#5cc98b]/50 hover:bg-[#1c3f5e] cursor-pointer"
              >
                <span>Ir al Itinerario de Rutina</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#5cc98b]" />
              </button>
            </div>
          )}
        </header>

        {/* Notificación si hay alerta activa en el panel */}
        {notices.length > 0 && (
          <section
            aria-label="Aviso prioritario de salud"
            className="mb-8 rounded-2xl border border-notice-edge bg-notice p-5 shadow-lg"
          >
            <div className="flex items-start gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-watch/20 text-watch">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-watch/20 px-2 py-0.5 text-[10px] font-bold uppercase text-watch">
                    Intervención Médica Recomendada
                  </span>
                  <span className="text-xs text-mute">Alerta activa en cabina</span>
                </div>
                <h2 className="mt-1 text-lg font-bold text-text">
                  {notices[0].title} — {notices[0].summary}
                </h2>
                {(() => {
                  const guide = guides.find((g) => g.indicatorId === notices[0].indicatorId)
                  return guide ? (
                    <p className="mt-1 text-xs text-mute max-w-2xl">
                      Notificar a: <strong className="text-text">{guide.notify}</strong>
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-mute max-w-2xl">
                      Revisa los pasos de mitigación a continuación y aplica la contramedida circadiana para restaurar la capacidad cognitiva en la misión.
                    </p>
                  )
                })()}
              </div>
            </div>
          </section>
        )}

        {/* =========================================================================
            CATÁLOGO DE PROTOCOLOS Y CONTRAMEDIDAS CLÍNICAS
           ========================================================================= */}
        <section aria-label="Biblioteca de protocolos" className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Columna Izquierda: Lista de protocolos seleccionables */}
          <div className="space-y-3 lg:col-span-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-mute">
              Protocolos Disponibles ({guidanceProtocols.length}):
            </span>

            {guidanceProtocols.map((protocol) => {
              const isSelected = selectedProtocolId === protocol.id
              return (
                <button
                  key={protocol.id}
                  type="button"
                  onClick={() => setSelectedProtocolId(protocol.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#5cc98b] bg-[#143734]/40 ring-1 ring-[#5cc98b]/50'
                      : 'border-edge bg-[#14283d] hover:border-text/40 hover:bg-[#17324c]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={`font-semibold ${
                        protocol.severity === 'watch' ? 'text-watch' : 'text-[#5cc98b]'
                      }`}
                    >
                      {protocol.category}
                    </span>
                    <span className="rounded bg-rail px-2 py-0.5 text-[10px] font-medium text-mute">
                      NASA HRP
                    </span>
                  </div>

                  <h3 className="mt-1.5 text-sm font-bold text-text">
                    {protocol.title}
                  </h3>

                  <p className="mt-1 line-clamp-2 text-xs text-mute leading-relaxed">
                    {protocol.summary}
                  </p>
                </button>
              )
            })}
          </div>

          {/* Columna Derecha: Detalle ampliado del protocolo seleccionado */}
          <div className="rounded-2xl border border-edge bg-[#14283d] p-6 shadow-xl lg:col-span-2">
            <div className="border-b border-edge/60 pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-[#184840] px-2.5 py-1 text-xs font-bold text-[#5cc98b]">
                  {activeProtocol.category}
                </span>
                <span className="text-xs font-semibold text-mute">
                  {activeProtocol.targetRisk}
                </span>
              </div>

              <h2 className="mt-2 font-display text-2xl font-bold text-text">
                {activeProtocol.title}
              </h2>

              <p className="mt-1 text-xs text-mute leading-relaxed">
                {activeProtocol.summary}
              </p>
            </div>

            {/* Fundamento científico médico */}
            <div className="mt-4 rounded-xl border border-edge/60 bg-rail/60 p-4 text-xs">
              <h4 className="font-semibold text-text flex items-center gap-1.5">
                <Info className="h-4 w-4 text-[#38bdf8]" />
                <span>Fundamento Médico Aeroespacial (NASA / CSA)</span>
              </h4>
              <p className="mt-1 text-mute leading-relaxed">
                {activeProtocol.rationale}
              </p>
            </div>

            {/* Pasos de acción secuenciales */}
            <div className="mt-6">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text">
                Pasos de Intervención Recomendados:
              </h4>

              <ol className="mt-3 space-y-2.5">
                {activeProtocol.actionSteps.map((step, idx) => (
                  <li
                    key={step}
                    className="flex items-start gap-3 rounded-xl border border-edge/40 bg-panel/30 p-3 text-xs text-text"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#184840] font-mono text-[11px] font-bold text-[#5cc98b]">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Acción: Añadir a Rutina */}
            {activeProtocol.recommendedTaskTitle && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-edge/60 pt-4">
                <div>
                  <span className="text-xs font-semibold text-text">
                    Contramedida programable:
                  </span>
                  <p className="text-xs text-mute">
                    {activeProtocol.recommendedTaskTitle} ({activeProtocol.recommendedDurationMin} min)
                  </p>
                </div>

                {addedTaskId === activeProtocol.id ? (
                  <div className="inline-flex items-center gap-1.5 rounded-xl border border-[#5cc98b] bg-[#184840] px-4 py-2 text-xs font-bold text-[#5cc98b]">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>¡Añadida a tu Rutina!</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleAddProtocolToRoutine(activeProtocol)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#5cc98b] px-4 py-2 text-xs font-bold text-[#0c1e2f] transition-transform hover:bg-[#6edba0] active:scale-95 cursor-pointer"
                  >
                    <Plus className="h-4 w-4 stroke-[3]" />
                    <span>Incorporar a mi Rutina</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Pie de página */}
        <footer className="mt-10 rounded-2xl border border-edge/70 bg-panel/30 p-4 text-xs text-mute flex items-start gap-3">
          <Shield className="h-4 w-4 shrink-0 text-[#5cc98b] mt-0.5" />
          <p>
            Todos los protocolos operan bajo la premisa de nula dependencia de enlace a Tierra (Ground Link Zero). El astronauta dispone de autonomía clínica completa para implementar estas contramedidas.
          </p>
        </footer>
      </div>
    </main>
  )
}
