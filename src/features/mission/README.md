# src/features/mission

**Qué va aquí:** Ajustes de misión (entorno, despegue en UTC, ubicación), reloj de la misión y rutina diaria con recordatorios.

**Quién:** R5

**Ahora hay:**
- `MissionPage.tsx`: entorno (cápsula, estación, tránsito, Luna, Marte), despegue y llegada en UTC, longitud en Marte, y el panel «Reloj de la misión» (UTC, MET, día de vuelo; ventana de sueño en estación; sol y hora solar local en Marte). Guardado en el dispositivo; lo leen Hoy, Chequeo diario y Tendencias.
- `RoutinePage.tsx`: tareas del día con marca de hecho y recordatorio por tarea. Recibe un reloj opcional (`clock`): la app le pasa el de la misión (UTC o LMST) y la hora de cada tarea muestra su etiqueta. Se reinicia al cambiar el día de ese reloj.
- `routineLogic.ts`: lista de tareas, lectura de lo guardado y cuándo toca avisar. Sin pantalla, con pruebas en `src/tests/routine.test.tsx`.
- Los cálculos de tiempo viven en `src/lib/missionTime.ts` (pruebas en `src/tests/missionTime.test.ts`). Fuente: `docs/INVESTIGACION-TIEMPO.md`.

**Regla de tiempo:** el reloj del dispositivo se lee siempre en UTC y se guarda el instante de despegue en UTC; la zona horaria del dispositivo no se usa. El día de vuelo se calcula, no se guarda.

**Diferencia entre las dos:** Misión es el contexto (cambia poco y lo usan otras pantallas); Rutina es lo que se hace cada día.

**Idiomas:** los textos de estas pantallas están en `src/lib/i18n.ts`, en español e inglés.

**No hay:** rachas (decisión del equipo), recordatorios con la app cerrada, hora lunar oficial (aún no existe).
