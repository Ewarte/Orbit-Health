/** Descarga un texto como archivo desde el navegador (Blob y enlace temporal): no usa internet. */
export function downloadTextFile(fileName: string, mimeType: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: mimeType }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Se libera el enlace un poco después para que el navegador alcance a iniciar la descarga.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
