# src/features/guidance

**Responsabilidad:** Manual clínico de vuelo y biblioteca de contramedidas médicas ante riesgos y alertas en cabina.

**Componentes:**
- `GuidancePage.tsx`:
  - Catálogo interactivo de contramedidas validadas por la NASA y la CSA (Higiene del sueño circadiana, contramedidas óseo-musculares en ARED/T2, redistribución de fluidos y sistema cardiovascular).
  - Pasos de acción estructurados ante desviaciones biomédicas.
  - Integración en 1 clic para añadir contramedidas sugeridas directamente al itinerario de `Routine`.
- `NoticeCard.tsx`:
  - Tarjeta de aviso de atención desplegable para el panel principal (`DashboardPage`), con accesos directos al manual clínico y a la rutina.
