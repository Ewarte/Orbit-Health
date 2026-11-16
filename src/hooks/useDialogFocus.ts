import { useEffect, useRef } from 'react'

const ENFOCABLES =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface Opciones {
  /** Se llama al pulsar Escape. */
  onClose: () => void
  /** Cuando cambia (por ejemplo, el paso del asistente) el foco vuelve al título del diálogo. */
  claveDePaso?: unknown
}

/**
 * Manejo de foco de un diálogo modal:
 * - al abrir, el foco pasa al título (o al contenedor) y al cerrar vuelve al elemento que lo abrió;
 * - Escape cierra;
 * - Tab y Shift+Tab se quedan dentro del diálogo;
 * - al cambiar `claveDePaso`, el foco vuelve al título.
 * El título debe llevar `ref={tituloRef}`, `tabIndex={-1}` y un `id` para aria-labelledby.
 */
export function useDialogFocus<T extends HTMLElement = HTMLDivElement, H extends HTMLElement = HTMLHeadingElement>({
  onClose,
  claveDePaso,
}: Opciones) {
  const dialogoRef = useRef<T>(null)
  const tituloRef = useRef<H>(null)
  const cerrarRef = useRef(onClose)
  const primeraVez = useRef(true)
  const previoRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    cerrarRef.current = onClose
  })

  // Apertura y cierre: guarda quién tenía el foco, lo mueve dentro y lo devuelve al terminar.
  useEffect(() => {
    const dialogo = dialogoRef.current
    // Se guarda una sola vez (en desarrollo React monta dos veces y la segunda ya vería el foco dentro del diálogo).
    const actual = document.activeElement
    if (!previoRef.current && actual instanceof HTMLElement && !dialogo?.contains(actual)) previoRef.current = actual
    const inicial = tituloRef.current ?? dialogo
    inicial?.focus()

    function alPulsar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') {
        evento.preventDefault()
        evento.stopPropagation()
        cerrarRef.current()
        return
      }
      if (evento.key !== 'Tab' || !dialogo) return
      const lista = Array.from(dialogo.querySelectorAll<HTMLElement>(ENFOCABLES))
      if (lista.length === 0) {
        evento.preventDefault()
        return
      }
      const primero = lista[0]
      const ultimo = lista[lista.length - 1]
      const activo = document.activeElement
      if (evento.shiftKey && (activo === primero || activo === tituloRef.current || activo === dialogo)) {
        evento.preventDefault()
        ultimo.focus()
      } else if (!evento.shiftKey && (activo === ultimo || !dialogo.contains(activo))) {
        evento.preventDefault()
        primero.focus()
      }
    }

    document.addEventListener('keydown', alPulsar)
    return () => {
      document.removeEventListener('keydown', alPulsar)
      const previo = previoRef.current
      if (previo && document.contains(previo)) previo.focus()
    }
  }, [])

  // Cambio de paso: el foco vuelve al título para que el lector de pantalla anuncie el paso nuevo.
  useEffect(() => {
    if (primeraVez.current) {
      primeraVez.current = false
      return
    }
    tituloRef.current?.focus()
  }, [claveDePaso])

  return { dialogoRef, tituloRef }
}
