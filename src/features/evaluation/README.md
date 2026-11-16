# src/features/evaluation

**Qué va aquí:** Motor de evaluación: decide si cada valor es normal, a vigilar o crítico, y por qué. Lógica pura, sin nada de pantalla.

**Quién:** R3

**Ahora hay:** `healthEngine.ts` con rangos para presión (sistólica y diastólica; vale la peor), pulso, oxígeno, respiración, temperatura, sueño, ánimo y ejercicio, visión y glucosa (solo si se midió), y `derivedBloodPressure` (presión media y de pulso, que no cambian el estado). Los umbrales son un borrador sin validación clínica.
