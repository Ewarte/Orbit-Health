# src/components/health

**Qué va aquí:** Piezas visuales de salud: el holograma del cuerpo.

**Quién:** R4 (Diego)

**Ahora hay:**
- `HologramaUnificado.tsx`: holograma 3D con un solo modelo (`src/assets/anatomia.glb`, BodyParts3D). Vista general con la piel como silueta de alambre; al elegir una zona o un órgano, zoom suave a sus órganos y huesos.
- `HoloShell.tsx`: marco del holograma (botones, tarjeta de lecturas de la zona, botonera de zonas, atribución).
- `holoZonas.ts`: lógica pura de zonas (qué malla pertenece a cada zona, qué se toca, encuadres de cámara). Con pruebas.
