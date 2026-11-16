import { describe, expect, it } from 'vitest'
import { construirListaPrecache, generarServiceWorker } from '../../scripts/pwaSw'

describe('construirListaPrecache', () => {
  it('normaliza rutas, quita duplicados, sw.js y mapas, y agrega la raíz', () => {
    const lista = construirListaPrecache([
      'index.html',
      'assets\\app-1.js',
      './assets/app-1.js',
      'assets/app-1.js.map',
      'sw.js',
      'manifest.webmanifest',
    ])
    expect(lista).toEqual(['./', 'assets/app-1.js', 'index.html', 'manifest.webmanifest'])
  })

  it('excluye las fuentes .woff (deja .woff2), ATRIBUCIONES.md e icons.svg', () => {
    const lista = construirListaPrecache([
      'assets/barlow-400.woff',
      'assets/barlow-400.woff2',
      'ATRIBUCIONES.md',
      'icons.svg',
      'icons/icon-192.png',
      'favicon.svg',
    ])
    expect(lista).toEqual(['./', 'assets/barlow-400.woff2', 'favicon.svg', 'icons/icon-192.png'])
  })
})

describe('generarServiceWorker', () => {
  const codigo = generarServiceWorker('abc123', ['index.html', 'assets/a.js'])

  it('incluye la versión y todos los archivos', () => {
    expect(codigo).toContain('"abc123"')
    expect(codigo).toContain('"assets/a.js"')
    expect(codigo).toContain('"index.html"')
  })

  it('precachea en install, limpia en activate y responde desde el caché', () => {
    expect(codigo).toContain("addEventListener('install'")
    expect(codigo).toContain("addEventListener('activate'")
    expect(codigo).toContain('caches.delete')
    expect(codigo).toContain('caches.match')
  })

  it('no usa skipWaiting automático: solo lo hace al recibir el mensaje de la app', () => {
    const install = codigo.slice(codigo.indexOf("addEventListener('install'"), codigo.indexOf("addEventListener('message'"))
    expect(install).not.toContain('skipWaiting')
    expect(codigo).toContain("addEventListener('message'")
    expect(codigo).toContain("'SKIP_WAITING'")
    expect(codigo).toContain('self.skipWaiting()')
  })

  it('en activate toma el control antes de borrar los cachés viejos', () => {
    const activate = codigo.slice(codigo.indexOf("addEventListener('activate'"), codigo.indexOf("addEventListener('fetch'"))
    expect(activate.indexOf('clients.claim')).toBeGreaterThan(-1)
    expect(activate.indexOf('clients.claim')).toBeLessThan(activate.indexOf('caches.delete'))
  })

  it('es JavaScript válido', () => {
    expect(() => new Function(codigo)).not.toThrow()
  })
})
