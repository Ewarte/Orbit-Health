/**
 * Registra el service worker que permite usar la app sin conexión.
 * Solo en producción y solo con http o https: desde una carpeta (file://) el navegador no lo permite,
 * y el archivo portátil ya lleva todo dentro.
 */
export function registrarServiceWorker(): void {
  if (!import.meta.env.PROD) return
  if (import.meta.env.MODE === 'portable') return
  if (!('serviceWorker' in navigator)) return
  if (location.protocol !== 'http:' && location.protocol !== 'https:') return

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch((error) => console.warn('No se pudo activar el modo sin conexión', error))
  })
}
