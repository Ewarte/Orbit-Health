import { AlertTriangle, CheckCircle2, Phone, ShieldAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Notice } from '../../types'
import type { ActionGuide } from '../../data/actionGuides'

interface Props { notices: Notice[]; guides: ActionGuide[] }

export function GuidancePage({ notices, guides }: Props) {
  return <main className="min-w-0 px-4 py-5 sm:px-6 sm:py-8 lg:px-8"><div className="mx-auto max-w-4xl">
    <header className="mb-6"><p className="m-0 text-xs font-semibold uppercase tracking-wider text-watch">Offline protocol</p><h1 className="mt-1 font-display text-3xl font-semibold text-text sm:text-4xl">What to do next</h1><p className="mt-2 max-w-2xl text-mute">Follow the steps in order. If symptoms are severe, use the crew medical protocol immediately.</p></header>
    <div className="space-y-4">{notices.map((notice) => { const guide = guides.find((item) => item.indicatorId === notice.indicatorId); return <article key={notice.indicatorId} className="rounded-2xl border border-notice-edge bg-notice p-5 sm:p-6"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-watch" /><div className="min-w-0 flex-1"><h2 className="font-display text-2xl font-semibold text-text">{notice.title}</h2><p className="mt-1 text-mute">{notice.summary}</p><div className="mt-5 grid gap-4 md:grid-cols-2"><ActionList title="Do this now" items={guide?.watch ?? notice.steps} icon={<CheckCircle2 className="h-4 w-4 text-watch" />} /><ActionList title="If it gets worse" items={guide?.actNow ?? ['Follow the crew medical protocol.']} icon={<ShieldAlert className="h-4 w-4 text-act" />} /></div>{guide && <div className="mt-5 flex items-center gap-2 rounded-lg border border-edge bg-rail p-3 text-sm text-text"><Phone className="h-4 w-4 shrink-0 text-ok" /><span>Notify: <strong>{guide.notify}</strong></span></div>}</div></div></article> })}</div>
    <section className="mt-6 rounded-xl border border-edge bg-panel p-4 text-sm text-mute"><strong className="text-text">Offline reminder:</strong> the guidance is stored on this device and does not replace the approved medical protocol.</section>
  </div></main>
}

function ActionList({ title, items, icon }: { title: string; items: string[]; icon: ReactNode }) { return <div className="rounded-xl border border-edge bg-panel/60 p-4"><h3 className="flex items-center gap-2 font-semibold text-text">{icon}{title}</h3><ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-mute">{items.map((item) => <li key={item}>{item}</li>)}</ol></div> }
