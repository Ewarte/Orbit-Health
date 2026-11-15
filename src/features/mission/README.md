# src/features/mission

**Responsabilidad:** Administrar el contexto del día de viaje espacial, navegación orbital, entorno de cabina y estado de salud consolidado de la tripulación.

**Componentes:**
- `MissionPage.tsx`:
  - **Contexto de Vuelo:** Muestra el día de misión (MET), distancia recorrida desde la Tierra y distancia hacia el objetivo lunar.
  - **Simulador de Fases:** Permite alternar interactivamente entre LEO, Inyección Translunar (TLI), Órbita Lunar / EVA y Retorno.
  - **Telemetría Ambiental (ECLSS):** Monitoreo de presión de cabina (kPa), O2, CO2 y temperatura con simulador interactivo de fluctuaciones.
  - **Tendencias de Misión Simuladas:** Gráficas longitudinales de los 47 días de radiación acumulada (mSv), estabilidad atmosférica e índice de preparación biológica (*Readiness Index*).
  - **Sinergia sin duplicidad:** Comparte tipos y datos con `Routine`, `DailyCheck` y `Trends` sin replicar modelos biométricos.
