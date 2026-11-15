# src/features/guidance

**Qué va aquí:** Orientación: qué hacer ante una alerta, cómo prevenir y a quién avisar.

**Quién:** R4 (Diego), con textos de R2

**Ahora hay:**
- `GuidancePage.tsx`: una tarjeta por cada indicador en «vigilar» o «actuar» (los críticos primero), con qué significa, qué hacer, qué hacer si empeora, cómo prevenir y a quién avisar. Si todo está normal, muestra «Todo en orden» con una costumbre preventiva por indicador.
- `guidanceLogic.ts`: calcula las alertas a partir de los indicadores en vivo.
- `NoticeCard.tsx`: aviso desplegable que se usa en la pantalla Hoy.

**Contenido:** vive en `src/data/guidance.ts`, en español e inglés, con la fuente y en qué se basa (`nasa` o `team`). Es un **borrador por revisar**: NASA no da criterios de cuándo avisar ni rangos, y para glucosa y temperatura la explicación es una deducción del equipo (ver docs/FUENTES.md).

**Pruebas:** `src/tests/guidance.test.tsx`.
