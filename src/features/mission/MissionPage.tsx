import { Database, Save, Satellite, WifiOff } from 'lucide-react'
import { useState } from 'react'
import type { Mission } from '../../types'

interface Props { mission: Mission; onSave: (mission: Mission) => void }

export function MissionPage({ mission, onSave }: Props) {
  const [draft, setDraft] = useState(mission)
  const [saved, setSaved] = useState(false)

  function saveMission() {
    onSave({ ...draft, day: Math.max(1, Math.round(draft.day)) })
    setSaved(true)
  }

  function loadSimulation() {
    const simulated = { day: 47, place: 'Lunar transit', lastCheck: '07:10' }
    setDraft(simulated)
    onSave(simulated)
    setSaved(true)
  }

  return <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8"><div className="mx-auto max-w-3xl">
    <header className="mb-6"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ok"><Satellite className="h-4 w-4" /> Mission configuration</p><h1 className="mt-1 font-display text-3xl font-semibold text-text sm:text-4xl">Mission context</h1><p className="mt-2 text-mute">This information is stored on the device and remains available without a ground link.</p></header>
    <section className="rounded-2xl border border-edge bg-panel p-5 sm:p-6"><div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-semibold text-text">Mission day<input type="number" min="1" value={draft.day} onChange={(event) => setDraft({ ...draft, day: Number(event.target.value) })} className="mt-2 min-h-11 w-full rounded-lg border border-edge bg-rail px-3 text-text" /></label><label className="text-sm font-semibold text-text">Location<input value={draft.place} onChange={(event) => setDraft({ ...draft, place: event.target.value })} className="mt-2 min-h-11 w-full rounded-lg border border-edge bg-rail px-3 text-text" /></label></div><div className="mt-5 flex flex-col gap-3 sm:flex-row"><button type="button" onClick={saveMission} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ok px-4 py-2 font-semibold text-rail hover:brightness-110"><Save className="h-4 w-4" /> Save mission</button><button type="button" onClick={loadSimulation} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-ok px-4 py-2 font-semibold text-ok hover:bg-notice"><Database className="h-4 w-4" /> Load 47-day simulation</button></div>{saved && <p role="status" className="mt-4 text-sm text-ok">Mission context saved locally.</p>}</section>
    <div className="mt-4 flex items-start gap-3 rounded-xl border border-edge bg-rail p-4 text-sm text-mute"><WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-watch" /><p className="m-0">Offline mode is active. Records, mission context and simulated telemetry stay on this device.</p></div>
  </div></main>
}
