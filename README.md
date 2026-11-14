# Orbit Health

Aplicación web para el reto NASA Space Apps «Health Monitoring». Ayuda a un astronauta a registrar y entender 8 indicadores de salud, con avisos claros de qué hacer cuando un valor se sale de rango.

Los usuarios finales pueden no ser técnicos: se prioriza lo simple. El panel principal usa el sistema visual «Cabina de noche».

## Cómo correrlo

Requiere Node.js 20 o superior.

```bash
npm install
npm run dev      # servidor local en http://localhost:5173
npm run build    # revisa tipos y genera dist/
npm run lint     # revisa el código con Oxlint
```

## Estructura de archivos

```
Orbit-Health/
├── index.html              Página base; carga src/main.tsx
├── package.json            Dependencias y comandos
├── vite.config.ts          Configuración de Vite (React + Tailwind)
├── tsconfig*.json          Configuración de TypeScript
├── .oxlintrc.json          Reglas del linter
├── public/                 Archivos estáticos (favicon, iconos)
└── src/
    ├── main.tsx            Arranque de React
    ├── App.tsx             Navegación y pantalla actual
    ├── index.css           Colores, fuentes y tema. Todos los colores salen de aquí
    │
    ├── types/              Contrato de datos: la forma de la información (todos importan de aquí)
    ├── data/               Lo que la app sabe de antemano: indicadores, rangos, guías, datos de demostración (mock.ts)
    ├── lib/                Utilidades sin pantalla (status.ts: estado normal / vigilar / actuar)
    ├── hooks/              Funciones de React compartidas entre pantallas
    ├── services/           Guardado en el dispositivo (base de datos local)
    ├── tests/              Pruebas automáticas, sobre todo del motor de evaluación
    │
    ├── components/         Piezas visuales reutilizables
    │   ├── layout/         Marco común: navegación lateral (AppShell.tsx)
    │   ├── dashboard/      Pantalla «Hoy»: DashboardPage.tsx e IndicatorTile.tsx
    │   ├── health/         Figura humana (BodyFigure.tsx)
    │   ├── charts/         Gráficas de tendencia (Sparkline.tsx)
    │   └── ui/             Botones, campos, diálogos (aún vacío)
    │
    └── features/           Funciones completas de la app, una carpeta cada una
        ├── evaluation/     Motor que decide si un valor es normal, a vigilar o crítico
        ├── guidance/       Qué hacer ante una alerta (NoticeCard.tsx)
        ├── measurements/   Chequeo diario: registro de los 8 indicadores
        └── mission/        Ajustes de misión y rutina diaria
```

Cada carpeta de `src/` tiene su propio `README.md` que explica qué va ahí. Las carpetas sin código todavía están reservadas para las siguientes etapas.

## Los 8 indicadores

Los valores de ejemplo viven en `src/data/mock.ts`. Los rangos normales aún deben respaldarse con fuentes antes de usarse en la app final.

## Reglas del equipo

- Los colores solo se definen en `src/index.css`; en los componentes no se escriben colores sueltos.
- El estado de salud siempre va acompañado de texto, nunca solo de color.
- La app no puede depender de internet: las fuentes viajan dentro del paquete.
- Trabajar en ramas propias (`feat/...`) y abrir un Pull Request hacia `develop`.
