import { CheckCircle2, Clock3, Dumbbell, Moon, RotateCcw } from 'lucide-react'
import { useState } from 'react'

const initialTasks = [
  { id: 'check', label: 'Complete daily health check', time: '07:10', icon: CheckCircle2 },
  { id: 'exercise', label: 'Resistance and mobility session', time: '10:00', icon: Dumbbell },
  { id: 'review', label: 'Review alerts and guidance', time: '18:00', icon: Clock3 },
  { id: 'sleep', label: 'Cabin lights-down routine', time: '22:00', icon: Moon },
]

export function RoutinePage() {
  const [done, setDone] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('orbit_health_routine') ?? '[]') as string[] } catch { return [] }
  })

  function toggle(id: string) {
    const next = done.includes(id) ? done.filter((item) => item !== id) : [...done, id]
    setDone(next)
    try { localStorage.setItem('orbit_health_routine', JSON.stringify(next)) } catch { /* memory fallback */ }
  }

  function reset() {
    setDone([])
    try { localStorage.removeItem('orbit_health_routine') } catch { /* memory fallback */ }
  }

  return <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8"><div className="mx-auto max-w-3xl"><header className="mb-6"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ok"><Clock3 className="h-4 w-4" /> Daily routine</p><h1 className="mt-1 font-display text-3xl font-semibold text-text sm:text-4xl">Today’s routine</h1><p className="mt-2 text-mute">Keep the essential countermeasures visible and mark them as you complete them.</p></header><section className="rounded-2xl border border-edge bg-panel p-4 sm:p-6"><div className="mb-4 flex items-center justify-between"><p className="m-0 text-sm text-mute">{done.length} of {initialTasks.length} complete</p><button type="button" onClick={reset} className="inline-flex items-center gap-1.5 rounded-md px-2 py-2 text-sm text-mute hover:text-text"><RotateCcw className="h-4 w-4" /> Reset</button></div><ul className="m-0 list-none space-y-3 p-0">{initialTasks.map(({ id, label, time, icon: Icon }) => { const complete = done.includes(id); return <li key={id}><button type="button" onClick={() => toggle(id)} className={`flex min-h-16 w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors ${complete ? 'border-ok bg-notice' : 'border-edge bg-rail hover:border-ok'}`}><span className={complete ? 'text-ok' : 'text-mute'}><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><strong className={`block ${complete ? 'text-ok line-through' : 'text-text'}`}>{label}</strong><span className="text-sm text-mute">{time}</span></span><CheckCircle2 className={`h-5 w-5 ${complete ? 'text-ok' : 'text-edge'}`} /></button></li> })}</ul></section></div></main>
}
