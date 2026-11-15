import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import type { Plugin } from 'vite'
import { generarServiceWorker } from './pwaSw.ts'

/** Lista todos los archivos de una carpeta, con rutas relativas y barras normales. */
function listarArchivos(raiz: string, actual = raiz): string[] {
  return readdirSync(actual).flatMap((nombre) => {
    const ruta = join(actual, nombre)
    return statSync(ruta).isDirectory()
      ? listarArchivos(raiz, ruta)
      : [relative(raiz, ruta).replace(/\\/g, '/')]
  })
}

/**
 * Emite `sw.js` al terminar el build, con todos los archivos de salida y una versión
 * calculada con el contenido (si algo cambia, cambia la versión y se renueva el caché).
 * No hace nada en modo `portable` (ese archivo se abre desde una carpeta, sin service worker).
 */
export function pwaPlugin(): Plugin {
  let carpetaSalida = ''
  let omitir = false
  return {
    name: 'orbit-health-pwa',
    apply: 'build',
    configResolved(config) {
      carpetaSalida = config.build.outDir
      omitir = config.mode === 'portable'
    },
    closeBundle() {
      if (omitir) return
      const archivos = listarArchivos(carpetaSalida).filter((a) => a !== 'sw.js')
      const hash = createHash('sha256')
      for (const a of [...archivos].sort()) {
        hash.update(a)
        hash.update(readFileSync(join(carpetaSalida, a)))
      }
      // El código del propio service worker también cuenta: si cambia, cambia la versión.
      hash.update(generarServiceWorker('', archivos))
      const version = hash.digest('hex').slice(0, 12)
      writeFileSync(join(carpetaSalida, 'sw.js'), generarServiceWorker(version, archivos))
    },
  }
}
