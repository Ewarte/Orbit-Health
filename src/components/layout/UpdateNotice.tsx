import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useI18n } from '../../lib/useI18n'
import { EVENTO_ACTUALIZACION, aplicarActualizacion, hayActualizacion } from '../../registrarSw'

/** Aviso discreto de versión nueva (app instalable). Al pulsar «Actualizar» la página se recarga una vez. */
export function UpdateNotice() {
  const { t } = useI18n()
  const [visible, setVisible] = useState(hayActualizacion)

  useEffect(() => {
    const mostrar = () => setVisible(true)
    window.addEventListener(EVENTO_ACTUALIZACION, mostrar)
    return () => window.removeEventListener(EVENTO_ACTUALIZACION, mostrar)
  }, [])

  if (!visible) return null
  return (
    <div role="status" className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-edge bg-panel px-4 py-2 text-sm text-text shadow-lg">
      <span>{t('update.available')}</span>
      <button
        type="button"
        onClick={aplicarActualizacion}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-notice px-3 font-semibold text-ok hover:brightness-110"
      >
        <RefreshCw className="h-4 w-4" aria-hidden="true" /> {t('update.action')}
      </button>
    </div>
  )
}
