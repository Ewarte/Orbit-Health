# src/types

**Qué va aquí:** Contrato de datos: la forma de la información que se pasan las piezas. Todos importan de `index.ts`.

**Quién:** R3

**Ahora hay:** `index.ts` con los tipos en uso:
- `Status`: `'ok' | 'watch' | 'act'` (normal, vigilar, actuar).
- `ZoneId` y `Zone`: las 5 zonas del cuerpo (cabeza, corazón, metabolismo, cuerpo entero, huesos y músculos).
- `Indicator`: un indicador evaluado (id, valor, unidad, estado, razón, zona, historial y derivados).
- `Mission`: entorno, despegue en UTC, ubicación y día de vuelo calculado.

`contrato_datos.md` es el contrato del primer día (con indicadores como radiación o densidad ósea). Se conserva como historia y **no** describe lo que usa la app hoy.
