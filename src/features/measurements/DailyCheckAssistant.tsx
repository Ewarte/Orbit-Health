import { Check, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { moodOptions, steps, type StepId } from './dailyCheckData'
import type { DailyMetrics } from './dailyCheckTypes'

interface Props { metrics: DailyMetrics; step: number; onChange: (metrics: DailyMetrics) => void; onStep: (step: number) => void; onSave: () => void; onClose: () => void }

export function DailyCheckAssistant({ metrics, step, onChange, onStep, onSave, onClose }: Props) {
  const current = steps[step]
  const Icon = current.icon
  const update = <K extends keyof DailyMetrics>(key: K, value: DailyMetrics[K]) => onChange({ ...metrics, [key]: value })

  return <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-4">
    <div className="relative max-h-[95vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-edge bg-bg p-4 shadow-2xl sm:p-6">
      <header className="flex items-center justify-between border-b border-edge pb-4"><span className="rounded bg-notice px-2 py-0.5 text-xs font-semibold uppercase text-ok">Paso {step + 1} de {steps.length}</span><button type="button" onClick={onClose} className="rounded-lg p-2 text-mute hover:bg-panel hover:text-text" aria-label="Cerrar"><X className="h-5 w-5" /></button></header>
      <div className="py-6"><div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-notice text-ok"><Icon className="h-6 w-6" /></span><div><h2 className="font-display text-2xl font-bold text-text">{current.name}</h2><p className="text-xs text-mute">{current.description}</p></div></div><div className="mt-6 rounded-xl border border-edge bg-panel/60 p-4 sm:p-5"><StepInput id={current.id} metrics={metrics} update={update} /></div></div>
      <footer className="flex items-center justify-between gap-2 border-t border-edge pt-4"><button type="button" disabled={step === 0} onClick={() => onStep(Math.max(0, step - 1))} className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-edge px-3 py-2 text-sm text-mute hover:text-text disabled:opacity-40"><ChevronLeft className="h-4 w-4" /> Anterior</button>{step < steps.length - 1 ? <button type="button" onClick={() => onStep(step + 1)} className="inline-flex min-h-11 items-center gap-1 rounded-lg bg-notice px-4 py-2 text-sm font-semibold text-ok">Siguiente <ChevronRight className="h-4 w-4" /></button> : <button type="button" onClick={onSave} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-ok px-5 py-2 text-sm font-bold text-rail"><Check className="h-4 w-4" /> Guardar</button>}</footer>
    </div>
  </div>
}

function StepInput({ id, metrics, update }: { id: StepId; metrics: DailyMetrics; update: <K extends keyof DailyMetrics>(key: K, value: DailyMetrics[K]) => void }) {
  if (id === 'bp') return <div className="space-y-4"><Range label="Presión sistólica" value={metrics.bloodPressureSys} min={90} max={160} onChange={(value) => update('bloodPressureSys', value)} /><Range label="Presión diastólica" value={metrics.bloodPressureDia} min={60} max={100} onChange={(value) => update('bloodPressureDia', value)} /></div>
  if (id === 'hr') return <Range label="Frecuencia cardíaca en reposo" value={metrics.heartRate} min={45} max={140} onChange={(value) => update('heartRate', value)} />
  if (id === 'spo2') return <Range label="Oxígeno en sangre (SpO₂, %)" value={metrics.spo2} min={80} max={100} onChange={(value) => update('spo2', value)} />
  if (id === 'resp') return <Range label="Respiraciones por minuto" value={metrics.respiratoryRate} min={6} max={40} onChange={(value) => update('respiratoryRate', value)} />
  if (id === 'temp') return <Range label="Temperatura corporal" value={metrics.bodyTemperature} min={35} max={39.5} step={0.1} display={metrics.bodyTemperature.toFixed(1)} onChange={(value) => update('bodyTemperature', value)} />
  if (id === 'sleep') return <Range label="Horas de sueño" value={metrics.sleepHours} min={2} max={10} step={0.1} onChange={(value) => update('sleepHours', value)} />
  if (id === 'exercise') return <Range label="Minutos de ejercicio hoy" value={metrics.exerciseMinutes} min={0} max={180} step={5} onChange={(value) => update('exerciseMinutes', value)} />
  if (id === 'vision') return <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{[{ changed: false, label: 'Sin cambios' }, { changed: true, label: 'Noto un cambio' }].map((option) => <button key={option.label} type="button" onClick={() => update('visionChange', option.changed)} className={`min-h-11 rounded-lg border py-2.5 text-xs font-semibold ${metrics.visionChange === option.changed ? 'border-ok bg-notice text-ok' : 'border-edge bg-panel/40 text-mute hover:border-text/40'}`}>{option.label}</button>)}</div>
  if (id === 'glucose') {
    const notMeasured = metrics.bloodSugar === null
    return <div className="space-y-4"><label className="flex items-center gap-2 text-sm text-text"><input type="checkbox" checked={notMeasured} onChange={(event) => update('bloodSugar', event.target.checked ? null : 96)} className="h-4 w-4 accent-ok" /> No medido</label>{!notMeasured && <Range label="Nivel de glucosa" value={metrics.bloodSugar ?? 96} min={60} max={250} onChange={(value) => update('bloodSugar', value)} />}</div>
  }
  return <div><label className="text-xs font-semibold uppercase text-mute">Estado de ánimo</label><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">{moodOptions.map((mood) => <button key={mood} type="button" onClick={() => update('mood', mood)} className={`min-h-11 rounded-lg border py-2.5 text-xs font-semibold ${metrics.mood === mood ? 'border-ok bg-notice text-ok' : 'border-edge bg-panel/40 text-mute hover:border-text/40'}`}>{mood}</button>)}</div></div>
}

function Range({ label, value, min, max, step = 1, display = String(value), onChange }: { label: string; value: number; min: number; max: number; step?: number; display?: string; onChange: (value: number) => void }) {
  return <label className="block text-xs font-semibold uppercase text-mute">{label}<div className="mt-2 flex items-center gap-3"><input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="h-2 w-full cursor-pointer accent-ok" /><output className="w-16 shrink-0 text-right font-display text-xl font-bold text-text">{display}</output></div></label>
}
