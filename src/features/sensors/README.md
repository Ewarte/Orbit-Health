# src/features/sensors

**Qué va aquí:** Origen de los datos del chequeo: capa de sensores con una interfaz común (`SensorSource`) y sus fuentes.

**Quién:** R5

**Ahora hay:**
- `types.ts`: `SensorSource` (id, nombre, medidas que entrega, `isAvailable()`, `read()`), `SensorReading` (lectura parcial) y `SensorError` con su código.
- `simulatedSensor.ts`: sensor simulado (pulso, oxígeno y respiración plausibles; opción de valor fuera de rango para la demostración). Siempre disponible; marca los datos como `simulated`.
- `bluetoothParsing.ts`: lectura **pura** de bytes (DataView) del Heart Rate (0x180D / 0x2A37) y del Pulse Oximeter (0x1822 / 0x2A5E y 0x2A5F, con SFLOAT). Probada con ejemplos de la especificación.
- `bluetoothSensor.ts`: sensor Bluetooth real con Web Bluetooth (solo Chromium/Edge en https o localhost). Maneja cancelación, dispositivo sin el servicio y tiempo de espera.
- `web-bluetooth.d.ts`: tipos mínimos de Web Bluetooth (sin paquetes de tipos).
- `readingUtils.ts`: `sanitizeReading` descarta valores imposibles.
- `SensorReadButton.tsx`: botón «Leer del sensor» y selector de fuente del asistente del chequeo.

**Límite:** el Bluetooth no se probó con hardware real; solo el análisis de bytes tiene pruebas. La respiración no tiene servicio Bluetooth estándar: solo la entrega el simulador.
