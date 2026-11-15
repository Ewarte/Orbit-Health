# src/features/routine

**Responsabilidad:** Administración de las actividades diarias del astronauta, cumplimiento de contramedidas de ejercicio orbital y aplicación de recomendaciones médicas.

**Componentes:**
- `RoutinePage.tsx`:
  - **Gestión de Tareas Diarias:** Itinerario secuencial clasificado por categorías (Contramedida física, Telemetría médica, Nutrición, Cabina/ECLSS, Descanso).
  - **Persistencia Local:** Las tareas se completan interactivamente y se almacenan en `localStorage` (`orbit_health_routine_tasks`).
  - **Alerta del Panel con Recomendación Accionable:** Detecta alertas clínicas (ej. déficit de sueño de 3 noches) y genera una recomendación contextual con botón directo para incorporarla a las tareas del día.
  - **Contramedida de Ejercicio Orbital:** Computa en tiempo real los minutos completados frente a la meta reglamentaria de 80 minutos (ARED + T2).
  - **Añadir Actividades:** Modal interactivo para programar tareas personalizadas en cabina.
