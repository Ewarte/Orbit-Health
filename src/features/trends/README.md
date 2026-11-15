# src/features/trends

**Responsabilidad:** Visualización longitudinal e interactiva de tendencias biométricas del astronauta y adaptación al vuelo espacial.

**Componentes:**
- `TrendsPage.tsx`:
  - **Selector de Período:** Vista predeterminada de los **últimos 7 días**, con opciones para 14 días, 30 días o misión completa.
  - **Selector de Datos:** Panel desplegable para activar/desactivar exactamente qué métricas visualizar (Presión arterial, Frecuencia cardíaca, Sueño, Glucosa, Temperatura, Estado cognitivo, SpO2, Radiación).
  - **Carrusel Táctil sin Scrollbar:** Selector de métrica con botones de flecha (`<` y `>`) y soporte de arrastre con un dedo (`touch-pan-x`) o ratón.
  - **Gráficas Interactivas con Recharts:** Curvas de telemetría con áreas sombreadas y bandas de tolerancia nominal según estándares NASA HRP.
  - **Sincronización:** Refleja en tiempo real las lecturas guardadas localmente en `DailyCheckPage`.
