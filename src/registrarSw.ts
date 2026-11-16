/** Evento que avisa a la interfaz que hay una versión nueva esperando. */
export const EVENTO_ACTUALIZACION = 'orbit-actualizacion-disponible'

let esperando: ServiceWorker | null = null
let actualizando = false

/** ¿Hay una versión nueva esperando a que el usuario la acepte? */
export function hayActualizacion(): boolean {
  return esperando !== null
}

/** Pide al service worker nuevo que tome el control; al cambiar, la página se recarga una sola vez. */
export function aplicarActualizacion(): void {
  if (!esperando) return
  actualizando = true
  esperando.postMessage({ type: 'SKIP_WAITING' })
}

function avisar(worker: ServiceWorker): void {
  esperando = worker
  window.dispatchEvent(new Event(EVENTO_ACTUALIZACION))
}

/**
 * Registra el service worker que permite usar la app sin conexión.
 * Solo en producción y solo con http o https: desde una carpeta (file://) el navegador no lo permite,
 * y el archivo portátil ya lleva todo dentro.
 * Cuando hay una versión nueva esperando, avisa a la app (no se activa sola: el usuario decide cuándo).
 */
export function registrarServiceWorker(): void {
  if (!import.meta.env.PROD) return
  if (import.meta.env.MODE === 'portable') return
  if (!('serviceWorker' in navigator)) return
  if (location.protocol !== 'http:' && location.protocol !== 'https:') return

  // Recarga una sola vez, y solo si el usuario pidió actualizar (no en la primera instalación).
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!actualizando) return
    actualizando = false
    location.reload()
  })

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then((registro) => {
        // Solo es una actualización si ya había un service worker controlando la página.
        if (registro.waiting && navigator.serviceWorker.controller) avisar(registro.waiting)
        registro.addEventListener('updatefound', () => {
          const nuevo = registro.installing
          nuevo?.addEventListener('statechange', () => {
            if (nuevo.state === 'installed' && navigator.serviceWorker.controller) avisar(nuevo)
          })
        })
      })
      .catch((error) => console.warn('No se pudo activar el modo sin conexión', error))
  })
}
