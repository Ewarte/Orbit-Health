import { useId } from 'react'
import { Check, ChevronLeft, ChevronRight, Minus, Plus, X } from 'lucide-react'
import { useDialogFocus } from '../../hooks/useDialogFocus'
import { moodLabel } from '../../lib/domainText'
import { useI18n } from '../../lib/useI18n'
import type { I18n } from '../../lib/useI18n'
import { moodOptions, steps, type StepId } from './dailyCheckData'
import type { DailyMetrics } from './dailyCheckTypes'

interface Props { metrics: DailyMetrics; step: number; onChange: (metrics: DailyMetrics) => void; onStep: (step: number) => void; onSave: () => void; onClose: () => void }

type Update = <K extends keyof DailyMetrics>(key: K, value: DailyMetrics[K]) => void

export function DailyCheckAssistant({ metrics, step, onChange, onStep, onSave, onClose }: Props) {
  const { t } = useI18n()
  const current = steps[step]
  const Icon = current.icon
  const update: Update = (key, value) => onChange({ ...metrics, [key]: value })
  const titleId = useId()
  const { dialogoRef, tituloRef } = useDialogFocus({ onClose, claveDePaso: step })

  return <div role="dialog" aria-modal="true" aria-labelledby={titleId} ref={dialogoRef} tabIndex={-1} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-4">
    <div className="relative max-h-[95vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-edge bg-bg p-4 shadow-2xl sm:p-6 lg:max-w-3xl lg:p-8">
      <header className="flex items-center justify-between border-b border-edge pb-4"><span className="rounded bg-notice px-2 py-0.5 text-xs font-semibold uppercase text-ok">{t('check.step', { n: step + 1, total: steps.length })}</span><button type="button" onClick={onClose} className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-mute hover:bg-panel hover:text-text" aria-label={t('common.close')}><X className="h-5 w-5" /></button></header>
      <div className="py-6 lg:py-8"><div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-notice text-ok"><Icon className="h-6 w-6" /></span><div><h2 id={titleId} ref={tituloRef} tabIndex={-1} className="font-display text-2xl font-bold text-text focus:outline-none">{t(`step.${current.id}.name`)}</h2><p className="text-xs text-mute">{t(`step.${current.id}.desc`)}</p></div></div><div className="mt-6 rounded-xl border border-edge bg-panel/60 p-4 sm:p-5"><StepInput id={current.id} metrics={metrics} update={update} onChange={onChange} t={t} /></div></div>
      <footer className="flex items-center justify-between gap-2 border-t border-edge pt-4"><button type="button" disabled={step === 0} onClick={() => onStep(Math.max(0, step - 1))} className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-edge px-3 py-2 text-sm text-mute hover:text-text disabled:opacity-40"><ChevronLeft className="h-4 w-4" /> {t('check.prev')}</button>{step < steps.length - 1 ? <button type="button" onClick={() => onStep(step + 1)} className="inline-flex min-h-11 items-center gap-1 rounded-lg bg-notice px-4 py-2 text-sm font-semibold text-ok">{t('check.next')} <ChevronRight className="h-4 w-4" /></button> : <button type="button" onClick={onSave} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-ok px-5 py-2 text-sm font-bold text-rail"><Check className="h-4 w-4" /> {t('check.save')}</button>}</footer>
    </div>
  </div>
}

function StepInput({ id, metrics, update, onChange, t }: { id: StepId; metrics: DailyMetrics; update: Update; onChange: (metrics: DailyMetrics) => void; t: I18n['t'] }) {
  if (id === 'bp') return <div className="space-y-4"><Range label={t('input.sys')} value={metrics.bloodPressureSys} min={90} max={160} onChange={(value) => onChange({ ...metrics, bloodPressureSys: value, bloodPressureDia: Math.min(metrics.bloodPressureDia, value - 1) })} /><Range label={t('input.dia')} value={metrics.bloodPressureDia} min={60} max={Math.min(100, metrics.bloodPressureSys - 1)} onChange={(value) => update('bloodPressureDia', Math.min(value, metrics.bloodPressureSys - 1))} /></div>
  if (id === 'hr') return <Range label={t('input.hr')} value={metrics.heartRate} min={45} max={140} onChange={(value) => update('heartRate', value)} />
  if (id === 'spo2') return <Range label={t('input.spo2')} value={metrics.spo2} min={80} max={100} onChange={(value) => update('spo2', value)} />
  if (id === 'resp') return <Range label={t('input.resp')} value={metrics.respiratoryRate} min={6} max={40} onChange={(value) => update('respiratoryRate', value)} />
  if (id === 'temp') return <Range label={t('input.temp')} value={metrics.bodyTemperature} min={35} max={39.5} step={0.1} display={metrics.bodyTemperature.toFixed(1)} onChange={(value) => update('bodyTemperature', value)} />
  if (id === 'sleep') return <Range label={t('input.sleep')} value={metrics.sleepHours} min={2} max={10} step={0.1} onChange={(value) => update('sleepHours', value)} />
  if (id === 'exercise') return <Range label={t('input.exercise')} value={metrics.exerciseMinutes} min={0} max={180} step={5} onChange={(value) => update('exerciseMinutes', value)} />
  if (id === 'vision') return <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{[{ changed: false, label: t('input.visionNo') }, { changed: true, label: t('input.visionYes') }].map((option) => <button key={String(option.changed)} type="button" onClick={() => update('visionChange', option.changed)} className={`min-h-11 rounded-lg border py-2.5 text-xs font-semibold ${metrics.visionChange === option.changed ? 'border-ok bg-notice text-ok' : 'border-edge bg-panel/40 text-mute hover:border-text/40'}`}>{option.label}</button>)}</div>
  if (id === 'glucose') {
    const notMeasured = metrics.bloodSugar === null
    return <div className="space-y-4"><label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg text-sm text-text"><input type="checkbox" checked={notMeasured} onChange={(event) => update('bloodSugar', event.target.checked ? null : 96)} className="h-6 w-6 shrink-0 accent-ok" /> {t('input.notMeasured')}</label>{!notMeasured && <Range label={t('input.glucose')} value={metrics.bloodSugar ?? 96} min={60} max={250} onChange={(value) => update('bloodSugar', value)} />}</div>
  }
  return <div><label className="text-xs font-semibold uppercase text-mute">{t('input.mood')}</label><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">{moodOptions.map((mood) => <button key={mood} type="button" onClick={() => update('mood', mood)} className={`min-h-11 rounded-lg border py-2.5 text-xs font-semibold ${metrics.mood === mood ? 'border-ok bg-notice text-ok' : 'border-edge bg-panel/40 text-mute hover:border-text/40'}`}>{moodLabel(t, mood)}</button>)}</div></div>
}

function Range({ label, value, min, max, step = 1, display = String(value), onChange }: { label: string; value: number; min: number; max: number; step?: number; display?: string; onChange: (value: number) => void }) {
  const { t } = useI18n()
  const id = useId()
  // Se redondea al paso para que los decimales de coma flotante (0,1 + 0,2) no se acumulen.
  const mover = (delta: number) => onChange(Math.min(max, Math.max(min, Number((Math.round((value + delta) / step) * step).toFixed(2)))))
  const boton = 'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-edge bg-panel text-text hover:border-text/40 disabled:opacity-40'
  return <div className="block text-xs font-semibold uppercase text-mute"><label htmlFor={id}>{label}</label><div className="mt-2 flex items-center gap-2"><button type="button" onClick={() => mover(-step)} disabled={value <= min} aria-label={t('check.decrease', { label })} className={boton}><Minus className="h-5 w-5" aria-hidden="true" /></button><input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="rango-tactil w-full min-w-0" /><button type="button" onClick={() => mover(step)} disabled={value >= max} aria-label={t('check.increase', { label })} className={boton}><Plus className="h-5 w-5" aria-hidden="true" /></button><output htmlFor={id} className="w-16 shrink-0 text-right font-display text-xl font-bold text-text">{display}</output></div></div>
}
