import { Check, Database, X } from 'lucide-react'
import type { SavedRecord } from './dailyCheckTypes'

interface Props { records: SavedRecord[]; onClose: () => void }

export function DailyCheckHistory({ records, onClose }: Props) {
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl border border-edge bg-bg p-4 shadow-2xl sm:p-6">
        <header className="flex items-center justify-between border-b border-edge pb-4">
          <h2 className="flex items-center gap-2.5 font-display text-xl font-bold text-text"><Database className="h-5 w-5 text-ok" /> Registros guardados ({records.length})</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-mute hover:bg-panel hover:text-text" aria-label="Cerrar"><X className="h-5 w-5" /></button>
        </header>
        <div className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          {records.map((record) => <RecordItem key={record.id} record={record} />)}
        </div>
        <footer className="mt-5 flex justify-end border-t border-edge pt-4"><button type="button" onClick={onClose} className="rounded-lg bg-panel px-4 py-2 text-sm font-semibold text-text hover:bg-edge">Cerrar</button></footer>
      </div>
    </div>
  )
}

function RecordItem({ record }: { record: SavedRecord }) {
  const { metrics } = record
  return <article className="rounded-xl border border-edge bg-panel p-4 text-sm">
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-edge pb-2"><strong>{record.dateStr} — {record.timeStr}</strong><span className="inline-flex items-center gap-1 rounded bg-notice px-2 py-0.5 text-xs text-ok"><Check className="h-3 w-3" /> Guardado local</span></div>
    <div className="grid grid-cols-1 gap-2 text-xs text-mute sm:grid-cols-2 lg:grid-cols-3">
      <span>Presión: <b className="text-text">{metrics.bloodPressureSys}/{metrics.bloodPressureDia} mmHg</b></span>
      <span>Frecuencia: <b className="text-text">{metrics.heartRate} bpm</b></span>
      <span>Oxígeno: <b className="text-text">{metrics.spo2} %</b></span>
      <span>Respiración: <b className="text-text">{metrics.respiratoryRate} resp/min</b></span>
      <span>Ejercicio: <b className="text-text">{metrics.exerciseMinutes} min</b></span>
      <span>Visión: <b className="text-text">{metrics.visionChange ? 'Cambio notado' : 'Sin cambios'}</b></span>
      <span>Glucosa: <b className="text-text">{metrics.bloodSugar === null ? '—' : `${metrics.bloodSugar} mg/dL`}</b></span>
      <span>Temperatura: <b className="text-text">{metrics.bodyTemperature.toFixed(1)} °C</b></span>
      <span>Sueño: <b className="text-text">{metrics.sleepHours} h</b></span>
      <span>Ánimo: <b className="text-text">{metrics.mood}</b></span>
    </div>
  </article>
}
