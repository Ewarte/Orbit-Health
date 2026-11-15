import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'

/** Evita que un «</script>» dentro del código cierre la etiqueta en línea. */
const protegerScript = (codigo: string) => codigo.replace(/<\/script/gi, '<\\/script')
const protegerEstilo = (css: string) => css.replace(/<\/style/gi, '<\\/style')
const nombreDe = (clave: string) => clave.split('/').pop() as string

/**
 * Deja todo el build en un único HTML (modo `portable`): JS y CSS en línea.
 * Las fuentes y el modelo 3D ya vienen como data URI por `assetsInlineLimit`.
 * No lleva manifiesto ni service worker: se abre con doble clic desde una carpeta.
 */
export function portablePlugin(): Plugin {
  return {
    name: 'orbit-health-portable',
    apply: 'build',
    enforce: 'post',
    generateBundle(_opciones, bundle) {
      const claveHtml = Object.keys(bundle).find((k) => k.endsWith('.html'))
      if (!claveHtml) throw new Error('No se encontró el HTML del build portátil')
      const html = bundle[claveHtml]
      if (html.type !== 'asset') throw new Error('El HTML del build portátil no es un archivo')

      let contenido = String(html.source)
      const aEliminar: string[] = []
      const favicon = readFileSync(resolve('public/favicon.svg')).toString('base64')

      for (const [clave, pieza] of Object.entries(bundle)) {
        if (pieza.type === 'chunk' && pieza.isEntry) {
          // El script clásico va al final del <body>, cuando el DOM ya existe.
          contenido = contenido.replace(
            new RegExp(`\\s*<script[^>]*src="[^"]*${nombreDe(clave)}"[^>]*></script>`),
            '',
          )
          contenido = contenido.replace(
            '</body>',
            () => `<script>${protegerScript(pieza.code)}</script>\n</body>`,
          )
          aEliminar.push(clave)
        } else if (pieza.type === 'asset' && clave.endsWith('.css')) {
          // Las fuentes en formato antiguo (woff) sobran: todo navegador actual usa woff2.
          const css = String(pieza.source).replace(
            /,\s*url\(data:font\/woff;base64,[^)]*\)\s*format\("woff"\)/g,
            '',
          )
          contenido = contenido.replace(
            new RegExp(`<link[^>]*href="[^"]*${nombreDe(clave)}"[^>]*>`),
            () => `<style>${protegerEstilo(css)}</style>`,
          )
          aEliminar.push(clave)
        }
      }

      contenido = contenido
        .replace(/\s*<link[^>]*rel="(manifest|apple-touch-icon)"[^>]*>/g, '')
        .replace(
          /(<link[^>]*rel="icon"[^>]*href=")[^"]*(")/,
          (_todo, antes: string, despues: string) =>
            `${antes}data:image/svg+xml;base64,${favicon}${despues}`,
        )
      this.emitFile({ type: 'asset', fileName: 'OrbitHealth.html', source: contenido })
      delete bundle[claveHtml]
      for (const clave of aEliminar) delete bundle[clave]
    },
  }
}
