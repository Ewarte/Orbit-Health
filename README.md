# Orbit Health

Aplicación web para el reto NASA Space Apps 2026 «Health Monitoring». Ayuda a un astronauta a registrar y entender sus indicadores de salud, con avisos claros de qué hacer cuando un valor se sale de rango.

Los usuarios finales pueden no ser técnicos: se prioriza lo simple. Está pensada para **tablet en horizontal**, funciona **sin conexión** y está en **español e inglés**.

## Cómo correrlo

Requiere Node.js 20 o superior.

```bash
npm install
npm run dev      # servidor local en http://localhost:5173
npm run build    # revisa tipos y genera dist/
npm run lint     # revisa el código con Oxlint
npx vitest run   # pruebas automáticas
```

## Documentación y decisiones

Todo lo que se decidió y por qué, con su evidencia, está en [docs/DECISIONES.md](docs/DECISIONES.md). Los informes de respaldo:

- [docs/RETO.md](docs/RETO.md): el reto original.
- [docs/FUENTES.md](docs/FUENTES.md): los enlaces del reto y las fichas de riesgo de NASA.
- [docs/INVESTIGACION-NASA.md](docs/INVESTIGACION-NASA.md): cómo se controlan de verdad los signos vitales a bordo.
- [docs/INVESTIGACION-TIEMPO.md](docs/INVESTIGACION-TIEMPO.md): cómo se mide el tiempo en cohetes, estación, Luna y Marte.
- [docs/INVESTIGACION-TABLETS.md](docs/INVESTIGACION-TABLETS.md): qué tablets usan las tripulaciones.
- [docs/INVESTIGACION-MODELO3D.md](docs/INVESTIGACION-MODELO3D.md): modelos anatómicos gratuitos y licencias.

## Pantallas

| Pantalla | Qué hace |
|---|---|
| Hoy | Holograma del cuerpo: vista general y zoom a los órganos de cada zona, con sus lecturas. Al lado, lo que pide atención. |
| Chequeo diario | Registro guiado de los indicadores. |
| Tendencias | Evolución de cada indicador en los últimos días. |
| Orientación | Una tarjeta por cada indicador en «vigilar» o «actuar»: qué significa, qué hacer, cómo prevenir y a quién avisar. |
| Rutina | Tareas del día con recordatorios, según el reloj de la misión. |
| Misión | Entorno (cápsula, estación, tránsito, Luna, Marte), despegue en UTC y reloj de la misión (UTC, MET, sol marciano). |

## Indicadores

Presión arterial (con presión media y de pulso calculadas), frecuencia cardíaca, oxígeno en sangre, frecuencia respiratoria, temperatura, sueño, ánimo, ejercicio y visión. La glucosa es opcional porque no forma parte de los chequeos de rutina en la estación. Los umbrales son **borrador por revisar** (ver [DECISIONES.md §1 y §3](docs/DECISIONES.md)).

## Estructura de archivos

```
Orbit-Health/
├── index.html              Página base; carga src/main.tsx
├── package.json            Dependencias y comandos
├── vite.config.ts          Configuración de Vite (React + Tailwind) y de las pruebas
├── docs/                   Decisiones e informes de investigación
├── public/
│   ├── humano.glb          Silueta 3D (vista general del holograma)
│   ├── anatomia.glb        Órganos y esqueleto (BodyParts3D, CC BY 4.0)
│   └── ATRIBUCIONES.md     Licencia y partes del modelo anatómico
└── src/
    ├── main.tsx            Arranque de React y proveedor de idiomas
    ├── App.tsx             Navegación, misión e indicadores en vivo
    ├── index.css           Colores, fuentes y tema. Todos los colores salen de aquí
    │
    ├── types/              Contrato de datos (Indicator, Mission, Zone…)
    ├── data/               Datos de demostración (mock.ts) y guías de orientación (guidance.ts)
    ├── lib/                Sin pantalla: idiomas (i18n.ts, useI18n.ts, I18nProvider.tsx),
    │                       textos de dominio (domainText.ts), tiempo de misión (missionTime.ts), estados (status.ts)
    ├── tests/              Pruebas automáticas
    │
    ├── components/
    │   ├── layout/         Marco común: navegación lateral (AppShell.tsx)
    │   ├── dashboard/      Pantalla «Hoy»
    │   ├── health/         Holograma (HologramaUnificado.tsx, HoloShell.tsx, holoZonas.ts)
    │   └── charts/         Mini gráficas (Sparkline.tsx)
    │
    └── features/
        ├── evaluation/     Motor que decide si un valor es normal, a vigilar o crítico
        ├── guidance/       Orientación con alertas en vivo
        ├── measurements/   Chequeo diario
        ├── mission/        Misión y rutina con recordatorios
        └── trends/         Tendencias
```

Cada carpeta de `src/` tiene su propio `README.md` que explica qué va ahí.

## Reglas del equipo

- Los colores solo se definen en `src/index.css`; en los componentes no se escriben colores sueltos.
- El estado de salud siempre va acompañado de texto, nunca solo de color.
- Todo texto visible va en `src/lib/i18n.ts`, en español y en inglés con la misma clave.
- La app no puede depender de internet: fuentes y modelos viajan dentro del paquete, sin CDN.
- Botones de al menos 44 px (uso táctil con guantes).
- Trabajar en ramas propias (`feat/...`) y abrir un Pull Request hacia `develop`.
