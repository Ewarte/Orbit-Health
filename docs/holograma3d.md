# Implementación del Holograma 3D Interactivo (Orbit-Health)

> **Nota (2026-11-15):** este documento describe la primera versión (`Holograma3D.tsx` con `humano.glb`); ambos ya no existen. Hoy la pantalla «Hoy» usa `src/components/health/HologramaUnificado.tsx` con un solo modelo, `anatomia.glb` (BodyParts3D): su piel como silueta de alambre y zoom a órganos y huesos. El motivo está en [DECISIONES.md §8](DECISIONES.md). Se conserva como historia del diseño.

Este documento detalla la integración del modelo biomédico tridimensional `/humano.glb` en la interfaz orbital de **Orbit-Health**, dotándolo de interactividad anatómica bidireccional en tiempo real mediante WebGL y Three.js.

---

## 1. Dependencias Requeridas

```bash
# Instalación de Three.js y el ecosistema React Three Fiber
npm install three @react-three/fiber @react-three/drei

# Tipos TypeScript para desarrollo
npm install -D @types/three
```

### Versiones Clave en `package.json`:
- `three`: `^0.187.0` (Motor gráfico WebGL)
- `@react-three/fiber`: `^9.8.2` (Reconciliador reactivo para Three.js)
- `@react-three/drei`: `^10.7.9` (Helpers, OrbitControls, useGLTF, Html 3D)
- `@types/three`: `^0.187.0`

---

## 2. Ubicación del Asset 3D

```
Orbit-Health/
└── public/
    └── humano.glb   (1.6 MB, glTF binario)
```

Servido estáticamente por Vite desde `/humano.glb`.

---

## 3. Arquitectura del Componente `Holograma3D.tsx`

**Ubicación**: `src/components/health/Holograma3D.tsx`

### A. Material Holográfico Sci-Fi
```tsx
const holoMaterial = useMemo(
  () =>
    new THREE.MeshStandardMaterial({
      color: '#00ffff',
      emissive: '#00eeff',
      emissiveIntensity: 2,
      wireframe: true,
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  [],
)
```

### B. Segmentación Espacial y Telemetría Rojiza por Vértices (Vertex Colors)
Dado que `humano.glb` es una malla continua de 7.056 vértices, se implementó una clasificación matemática espacial que colorea la geometría en tiempo real:

1. **Coloreado por Vértice Dinámico (`HumanModel`)**:
   - Cada vértice evalúa su posición tridimensional normalizada:
     - **`head`** ($yw > 0.62$): 2.788 vértices (cráneo, rostro, cuello).
     - **`heart`** ($yw > 0.32$ y $|xw| < 0.22$): 482 vértices (tórax, corazón, costillas).
     - **`metabolism`** ($yw > -0.05$ y $|xw| < 0.22$): 500 vértices (abdomen, cintura).
     - **`body`** ($|xw| \ge 0.22$ y $yw > -0.15$): 1.557 vértices (ambos brazos, hombros, manos).
     - **`legs`** ($yw \le -0.05$): 1.729 vértices (muslos, rodillas, piernas, pies).
   - Los vértices de la zona activa en medición se tiñen de **rojo carmesí neón vibrante** (`#ff204e`), mientras que el resto del cuerpo permanece en cyan cibernético (`#00ffff`).

2. **Volumen de Escaneo Holográfico (`ActiveZoneVolumeHighlight`)**:
   - Jaula volumétrica de alambre y prisma difuso que pulsa alrededor del área seleccionada, delimitando con precisión la región anatómica en análisis.

3. **Iluminación Focal Rojiza (`ActiveZoneSpotlight`)**:
   - Proyector de luz puntual (`pointLight`) en `#ff204e` con halo difuso que proyecta destellos sobre la zona medida.

4. **Hitboxes Anatómicos Invisibles (`BodyHitboxes`)**:
   - Geometrías invisibles calibradas al modelo (`transparent`, `opacity: 0`) que interceptan el puntero del ratón en tiempo real.

5. **Balizas Holográficas HUD 3D (`ZoneBeacon3D`)**:
   - Balizas de luz y ondas de pulso que se tornan rojas al ser seleccionadas para coordinar con las métricas del dashboard.

6. **Controles de Cámara**:
   - `<OrbitControls autoRotate />` con botón HUD para pausar/reanudar la auto-rotación 360°.

---

## 4. Nubes de Telemetría Dinámicas Alrededor del Cuerpo 3D

**Ubicación**: `src/components/health/Holograma3D.tsx` y `src/components/dashboard/DashboardPage.tsx`

Las estadísticas fijas se ocultan por defecto en favor de una experiencia espacial inmersiva:

1. **Aparición Focalizada por Órgano**:
   - Al tocar el **Abdomen** (`metabolism`) $\rightarrow$ Únicamente se despliega la tarjeta de **Blood sugar** (`96 mg/dL`) flotando a la derecha de la parte baja del abdomen.
   - Al tocar el **Pecho** (`heart`) $\rightarrow$ Se despliegan **Blood pressure** (`128/82 mmHg`) y **Heart rate** (`64 bpm`) a la izquierda del tórax.
   - Al tocar la **Cabeza** (`head`) $\rightarrow$ Se despliegan **Sleep** (`5.8 h`) y **Mood** (`3 of 5`) a la derecha de la cabeza.
   - Al tocar los **Brazos** (`body`) $\rightarrow$ Se despliega **Body temperature** (`36.7 °C`) a la izquierda del cuerpo.
   - Al tocar las **Piernas** (`legs`) $\rightarrow$ Se despliega **Bone session** (`45 min`) a la derecha de las piernas.

2. **Líneas Láser de Conexión (`ConnectingLines3D`)**:
   - Una guía SVG animada de trazos láser conecta el punto exacto de la anatomía 3D con su tarjeta flotante de telemetría.

3. **Modo Opcional de Cuadrícula**:
   - En la cabecera superior, el conmutador permite alternar entre `🎯 Telemetría Focalizada 3D` (por defecto) y `📊 Ver Todas (7)` para consultar simultáneamente toda la telemetría en cuadrícula si se desea.

---

## 5. Verificación

- **Servidor activo**: `http://localhost:5173/` $\rightarrow$ Pestaña **Today**
- **Build verificado**: `npm run build` (0 errores)
- **Linter & Tests**: `oxlint` (0 advertencias, 0 errores) y `vitest` (100% aprobadas)
