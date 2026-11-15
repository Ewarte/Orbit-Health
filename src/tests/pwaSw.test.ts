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

  it('es JavaScript válido', () => {
    expect(() => new Function(codigo)).not.toThrow()
  })
})
