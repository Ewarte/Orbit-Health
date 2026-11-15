# src/features/mission

**Qué va aquí:** Ajustes de misión (día y ubicación) y rutina diaria con recordatorios.

**Quién:** R5

**Ahora hay:**
- `MissionPage.tsx`: día y ubicación de la misión, guardados en el dispositivo. Los leen Hoy, Chequeo diario y Tendencias.
- `RoutinePage.tsx`: tareas del día con marca de hecho y recordatorio por tarea. La rutina se reinicia al cambiar de fecha.
- `routineLogic.ts`: lista de tareas, lectura de lo guardado y cuándo toca avisar. Sin pantalla, con pruebas en `src/tests/routine.test.tsx`.

**Diferencia entre las dos:** Misión es el contexto (cambia poco y lo usan otras pantallas); Rutina es lo que se hace cada día (solo vive en su pantalla).

**Idiomas:** los textos de estas dos pantallas están en `src/lib/i18n.ts`, en español e inglés.

**No hay:** rachas (decisión del equipo) ni recordatorios con la app cerrada.
