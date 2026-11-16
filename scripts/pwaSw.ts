/*
  Lógica pura del service worker (sin acceso a archivos ni a Node), para poder probarla.
  El plugin de Vite (scripts/pwaPlugin.ts) la usa al terminar el build.
*/

/**
 * Archivos que nunca se precachean: el propio service worker, los mapas de código,
 * las fuentes .woff (basta .woff2, que usan todos los navegadores actuales),
 * el documento de atribuciones y el sprite de íconos, que la app no usa.
 */
const EXCLUIDOS = /(^|\/)sw\.js$|\.map$|\.woff$|(^|\/)ATRIBUCIONES\.md$|(^|\/)icons\.svg$/

/**
 * Arma la lista de archivos a precachear a partir de las rutas de salida del build.
 * Normaliza separadores, quita duplicados y excluidos, ordena y agrega «./» (la raíz de la app).
 */
export function construirListaPrecache(archivos: string[]): string[] {
  const limpios = archivos
    .map((a) => a.replace(/\\/g, '/').replace(/^\.?\//, ''))
    .filter((a) => a !== '' && !EXCLUIDOS.test(a))
  return ['./', ...Array.from(new Set(limpios)).sort()]
}

/** Devuelve el código completo de sw.js para una versión y una lista de archivos. */
export function generarServiceWorker(version: string, archivos: string[]): string {
  const lista = JSON.stringify(construirListaPrecache(archivos), null, 2)
  return `/* Service worker de Orbit Health. Generado en el build: no editar a mano. */
const VERSION = ${JSON.stringify(version)}
const CACHE = 'orbit-health-' + VERSION
const ARCHIVOS = ${lista}

// Todas las rutas son relativas a la ubicación de este archivo, así funciona en cualquier subcarpeta.
const aUrl = (ruta) => new URL(ruta, self.location).href

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ARCHIVOS.map(aUrl))),
  )
  // La versión nueva espera hasta que el usuario pulse «Actualizar» (no se activa sola).
})

self.addEventListener('message', (evento) => {
  if (evento.data && evento.data.type === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('activate', (evento) => {
  // Primero toma el control; los cachés viejos se borran solo después.
  evento.waitUntil(
    Promise.resolve(self.clients.claim())
      .then(() => caches.keys())
      .then((nombres) =>
        Promise.all(
          nombres
            .filter((n) => n.startsWith('orbit-health-') && n !== CACHE)
            .map((n) => caches.delete(n)),
        ),
      ),
  )
})

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request
  if (peticion.method !== 'GET') return
  if (new URL(peticion.url).origin !== self.location.origin) return

  evento.respondWith(
    caches.match(peticion, { ignoreSearch: true, ignoreVary: true }).then((guardada) => {
      if (guardada) return guardada
      return fetch(peticion).catch(() => {
        // Sin conexión y sin copia guardada: para navegar se entrega la página principal.
        if (peticion.mode === 'navigate') return caches.match(aUrl('index.html'))
        return Response.error()
      })
    }),
  )
})
`
}
