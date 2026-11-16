import { Bluetooth, FlaskConical, Radio } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../../lib/useI18n'
import type { DataSource } from '../measurements/dailyCheckTypes'
import { sensorSources } from './index'
import { sanitizeReading } from './readingUtils'
import { SensorError, type SensorField, type SensorReading, type SensorSource } from './types'

interface Props {
  /** Medida del paso actual: solo se ofrecen las fuentes que la entregan. */
  field: SensorField
  /** Recibe la lectura ya validada y el origen con el que se debe marcar. */
  onReading: (reading: SensorReading, origin: Exclude<DataSource, 'manual'>) => void
}

type Message = { kind: 'ok' | 'error'; text: string }

/** Botón «Leer del sensor» con el selector de fuente (simulado o Bluetooth) y el resultado de la lectura. */
export function SensorReadButton({ field, onReading }: Props) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<Message | null>(null)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const options = sensorSources.filter((source) => source.fields.includes(field))

  async function read(source: SensorSource) {
    setBusy(source.id)
    setMessage(null)
    try {
      const reading = sanitizeReading(await source.read())
      if (!mounted.current) return
      if (reading[field] === undefined) throw new SensorError('noData')
      onReading(reading, source.origin)
      setMessage({ kind: 'ok', text: t('sensor.done', { source: t(source.nameKey) }) })
      setOpen(false)
    } catch (error) {
      if (!mounted.current) return
      const code = error instanceof SensorError ? error.code : 'failed'
      setMessage({ kind: 'error', text: t(`sensor.error.${code}`) })
    } finally {
      if (mounted.current) setBusy(null)
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        aria-expanded={open}
        disabled={busy !== null}
        onClick={() => { setOpen((value) => !value); setMessage(null) }}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-edge bg-panel px-4 py-2 text-sm font-semibold text-text hover:border-ok disabled:opacity-60"
      >
        <Radio className="h-4 w-4 text-ok" aria-hidden="true" /> {t('sensor.read')}
      </button>

      {open && (
        <div role="group" aria-label={t('sensor.pickSource')} className="mt-3 rounded-lg border border-edge bg-bg/60 p-3">
          <p className="m-0 mb-2 text-xs font-semibold uppercase text-mute">{t('sensor.pickSource')}</p>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {options.map((source) => {
              const available = source.isAvailable()
              const Icon = source.origin === 'bluetooth' ? Bluetooth : FlaskConical
              return (
                <li key={source.id}>
                  <button
                    type="button"
                    disabled={!available || busy !== null}
                    onClick={() => void read(source)}
                    className="flex min-h-11 w-full items-center gap-2 rounded-lg border border-edge px-3 py-2 text-left text-sm text-text enabled:hover:border-ok disabled:opacity-60"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-ok" aria-hidden="true" />
                    <span>{busy === source.id ? t('sensor.reading', { source: t(source.nameKey) }) : t(source.nameKey)}</span>
                  </button>
                  {!available && <p className="m-0 mt-1 text-xs text-mute">{t('sensor.bluetooth.unavailable')}</p>}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div aria-live="polite" className="mt-2 min-h-5 text-sm">
        {message && (
          <p role={message.kind === 'error' ? 'alert' : undefined} className={`m-0 ${message.kind === 'error' ? 'font-semibold text-act' : 'text-ok-soft'}`}>
            {message.kind === 'error' ? `${t('sensor.errorPrefix')} ` : ''}{message.text}
          </p>
        )}
      </div>
    </div>
  )
}
