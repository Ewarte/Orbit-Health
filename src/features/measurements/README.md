# src/features/measurements

**Qué va aquí:** Chequeo diario: el asistente con el que el astronauta registra sus 9 indicadores (más la glucosa, opcional).

**Quién:** R5

**Ahora hay:** Chequeo diario con 10 pasos (presión, pulso, oxígeno, respiración, temperatura, sueño, ánimo, ejercicio, visión y glucosa opcional), tarjetas con presión arterial media y de pulso calculadas, historial y lectura segura de registros antiguos (`normalizeMetrics`). Cada medida guarda su origen (`sources`: manual, simulado o Bluetooth; sin dato = manual). Los umbrales con los que se evalúa son un borrador.
