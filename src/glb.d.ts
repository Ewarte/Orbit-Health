/* Tipo del modelo 3D: Vite lo entrega como la dirección (o data URI) del archivo. */
declare module '*.glb' {
  const direccion: string
  export default direccion
}
