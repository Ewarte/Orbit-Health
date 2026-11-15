import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Html, OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { Indicator, Status, ZoneId } from '../../types'
import type { MessageKey } from '../../lib/i18n'
import { useI18n } from '../../lib/useI18n'
import { HoloShell } from './HoloShell'
import {
  CLOUD_POSITIONS,
  HIGHLIGHT,
  ZONE_META,
  ZONE_OF_MESH,
  alignBox,
  boxCenter,
  computeAlignment,
  fitDistance,
  getStatusColor,
  getVertexZone,
  isZoneLit,
  meshOpacity,
  meshesOfZone,
  organId,
  unionBoxes,
  type Alignment,
  type Box,
  type Vec3,
} from './holoZonas'

/* ═══════════════════════════════════════════════════════════════════════
   HOLOGRAMA UNIFICADO
   Vista general: silueta de alambre (humano.glb), coloreada por zona.
   Al elegir una zona la cámara se acerca y aparecen sus órganos y huesos (anatomia.glb).
   Al tocar un órgano, el zoom se cierra sobre él y aparece su nombre.
   ═══════════════════════════════════════════════════════════════════════ */

const SKIN = 'piel'
const HUMAN_URL = '/humano.glb'
const ANATOMY_URL = '/anatomia.glb'

/** Posición de la baliza de cada zona (coordenadas del cuerpo centrado), igual que en la versión A. */
const BEACON_POS: Record<ZoneId, [number, number, number]> = {
  head: [0.2, 0.84, 0],
  heart: [0.05, 0.48, 0],
  metabolism: [0, 0.1, 0],
  body: [0.18, 0.3, 0],
  legs: [0.1, -0.55, 0],
}

/** Dirección de la cámara en la vista inicial (hacia el frente, algo elevada). */
const DEFAULT_DIR = new THREE.Vector3(0, 0.12, 1).normalize()
const FOV = 45
const ANIM_SECONDS = 0.7

interface View {
  /** Hay zoom a la zona elegida. */
  zoomed: boolean
  /** Malla de anatomia.glb tocada (zoom más cercano), o null. */
  organ: string | null
  /** Cambia en cada «Reiniciar vista» para volver a encuadrar aunque la vista no cambie. */
  resetKey: number
}

type Controls = { target: THREE.Vector3; update: () => void }

/** Caja local de una malla, con las transformaciones de sus nodos hasta la raíz de la escena (inclusive). */
function meshBox(mesh: THREE.Mesh, root: THREE.Object3D): Box {
  if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()
  const m = new THREE.Matrix4()
  for (let o: THREE.Object3D | null = mesh; o; o = o.parent) {
    o.updateMatrix()
    m.premultiply(o.matrix)
    if (o === root) break
  }
  const b = mesh.geometry.boundingBox!.clone().applyMatrix4(m)
  return { min: [b.min.x, b.min.y, b.min.z], max: [b.max.x, b.max.y, b.max.z] }
}

function sceneBoxes(root: THREE.Object3D): Map<string, Box> {
  const map = new Map<string, Box>()
  root.traverse((child) => {
    const mesh = child as THREE.Mesh
    if (mesh.isMesh) map.set(mesh.name || mesh.uuid, meshBox(mesh, root))
  })
  return map
}

interface Layout {
  /** Desplazamiento que centra el cuerpo de alambre en el origen (igual que `Center` en la versión A). */
  offset: Vec3
  align: Alignment
  /** Cajas de cada malla anatómica en el espacio ya centrado y alineado. */
  boxes: Map<string, Box>
  /** Caja de toda la silueta de alambre, centrada. */
  body: Box
}

function useLayout(human: THREE.Object3D, anatomy: THREE.Object3D): Layout {
  return useMemo(() => {
    const humanBox = unionBoxes([...sceneBoxes(human).values()])!
    const raw = sceneBoxes(anatomy)
    // La piel es la silueta del modelo anatómico: con ella se iguala la altura con la malla de alambre.
    const anatomyBox = raw.get(SKIN) ?? unionBoxes([...raw.values()])!
    const align = computeAlignment(humanBox, anatomyBox)
    const c = boxCenter(humanBox)
    const offset: Vec3 = [-c[0], -c[1], -c[2]]
    const boxes = new Map<string, Box>()
    raw.forEach((b, name) => boxes.set(name, alignBox(b, align, offset)))
    const body = alignBox(humanBox, { scale: 1, position: [0, 0, 0] }, offset)
    return { offset, align, boxes, body }
  }, [human, anatomy])
}

/* ─── Modelo ─── */

interface ModelProps {
  layout: Layout
  human: THREE.Object3D
  anatomy: THREE.Object3D
  selectedZone: ZoneId
  view: View
  zonesStatus?: Record<ZoneId, Status | undefined>
  onSelectZone: (zone: ZoneId) => void
  onSelectOrgan: (mesh: string) => void
}

function Model({ layout, human, anatomy, selectedZone, view, zonesStatus, onSelectZone, onSelectOrgan }: ModelProps) {
  const invalidate = useThree((s) => s.invalidate)

  const wireMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        vertexColors: true,
        wireframe: true,
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  )

  // Zona de cada vértice de la malla de alambre, calculada una vez por malla.
  const zoneMaps = useMemo(() => {
    const maps = new Map<THREE.Mesh, Uint8Array>()
    const ids = ZONE_META.map((z) => z.id)
    human.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (!mesh.isMesh) return
      const pos = mesh.geometry.attributes.position
      const map = new Uint8Array(pos.count)
      for (let i = 0; i < pos.count; i++) map[i] = ids.indexOf(getVertexZone(pos.getX(i), pos.getZ(i)))
      maps.set(mesh, map)
    })
    return maps
  }, [human])

  // Colores de la malla de alambre: la zona elegida en rojo y el resto en cian («Cuerpo entero» enciende todo).
  useEffect(() => {
    const ids = ZONE_META.map((z) => z.id)
    zoneMaps.forEach((map, mesh) => {
      mesh.material = wireMaterial
      const count = map.length
      let attr = mesh.geometry.attributes.color as THREE.BufferAttribute | undefined
      if (!attr || attr.count !== count) {
        attr = new THREE.BufferAttribute(new Float32Array(count * 3), 3)
        mesh.geometry.setAttribute('color', attr)
      }
      const colors = attr.array as Float32Array
      for (let i = 0; i < count; i++) {
        const on = isZoneLit(selectedZone, ids[map[i]])
        colors[i * 3] = on ? 1.0 : 0.0
        colors[i * 3 + 1] = on ? 0.12 : 0.9
        colors[i * 3 + 2] = on ? 0.3 : 1.0
      }
      attr.needsUpdate = true
    })
    invalidate()
  }, [zoneMaps, wireMaterial, selectedZone, invalidate])

  // Con zoom la malla se atenúa para dejar ver los órganos; «Cuerpo entero» la resalta.
  useEffect(() => {
    const zoomedIn = view.zoomed && selectedZone !== 'body'
    const opacity = selectedZone === 'body' && view.zoomed ? 0.55 : zoomedIn ? (view.organ ? 0.05 : 0.09) : 0.28
    zoneMaps.forEach((_, mesh) => {
      ;(mesh.material as THREE.Material).opacity = opacity
    })
    invalidate()
  }, [zoneMaps, view.zoomed, view.organ, selectedZone, invalidate])

  // Un material por malla anatómica.
  const materials = useMemo(() => {
    const map = new Map<string, THREE.MeshStandardMaterial>()
    anatomy.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (!mesh.isMesh) return
      map.set(mesh.name, new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.1, side: THREE.DoubleSide }))
    })
    return map
  }, [anatomy])

  useEffect(() => {
    anatomy.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (!mesh.isMesh) return
      if (!mesh.geometry.attributes.normal) mesh.geometry.computeVertexNormals()
      mesh.material = materials.get(mesh.name) ?? mesh.material
    })
  }, [anatomy, materials])

  // Visibilidad, opacidad y color de cada órgano o hueso.
  useEffect(() => {
    const base = new THREE.Color()
    anatomy.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (!mesh.isMesh) return
      const material = materials.get(mesh.name)
      if (!material) return
      const opacity = meshOpacity(mesh.name, selectedZone, view.zoomed, view.organ)
      mesh.visible = opacity > 0
      material.opacity = opacity
      material.transparent = opacity < 1
      material.depthWrite = opacity >= 0.99
      const zone = ZONE_OF_MESH[mesh.name]
      base.set(getStatusColor(zone ? zonesStatus?.[zone] : undefined))
      material.color.copy(base)
      material.emissive.copy(base)
      material.emissiveIntensity = view.organ === mesh.name ? 0.75 : 0.3
      material.needsUpdate = true
      mesh.renderOrder = opacity < 1 ? 2 : 1
    })
    invalidate()
  }, [anatomy, materials, selectedZone, view.zoomed, view.organ, zonesStatus, invalidate])

  /** Qué se tocó: un órgano visible de la zona (con zoom) o, si no, la zona de la malla de alambre. */
  function pick(e: ThreeEvent<PointerEvent | MouseEvent>): { organ?: string; zone?: ZoneId } | null {
    // Primero los órganos visibles (la malla de alambre queda por delante pero es solo la envoltura)...
    for (const hit of e.intersections) {
      const obj = hit.object as THREE.Mesh
      if (zoneMaps.has(obj)) continue
      // Las mallas ocultas o casi transparentes no se pueden tocar.
      const solid = obj.visible && meshOpacity(obj.name, selectedZone, view.zoomed, view.organ) >= 0.25
      if (solid && obj.name !== SKIN) return { organ: obj.name }
    }
    // ...y si no hay ninguno, la zona de la malla de alambre.
    for (const hit of e.intersections) {
      const map = zoneMaps.get(hit.object as THREE.Mesh)
      const idx = hit.face?.a
      if (!map || idx === undefined) continue
      const zone = ZONE_META[map[idx]]?.id
      if (zone) return { zone }
    }
    return null
  }

  const handlers = {
    onClick: (e: ThreeEvent<MouseEvent>) => {
      const hit = pick(e)
      if (!hit) return
      e.stopPropagation()
      if (hit.organ) onSelectOrgan(hit.organ)
      else if (hit.zone) onSelectZone(hit.zone)
    },
    onPointerMove: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()
      document.body.style.cursor = pick(e) ? 'pointer' : 'auto'
    },
    onPointerOut: () => {
      document.body.style.cursor = 'auto'
    },
  }

  return (
    <group position={layout.offset}>
      <primitive object={human} {...handlers} />
      <group position={layout.align.position} scale={layout.align.scale}>
        <primitive object={anatomy} {...handlers} />
      </group>
    </group>
  )
}

/* ─── Balizas (solo en la vista general) ─── */

function ZoneBeacon({
  id,
  isSelected,
  status,
  onSelect,
}: {
  id: ZoneId
  isSelected: boolean
  status?: Status
  onSelect: (id: ZoneId) => void
}) {
  const color = isSelected ? HIGHLIGHT : getStatusColor(status)
  return (
    <group position={BEACON_POS[id]} scale={isSelected ? 1.2 : 1}>
      <mesh
        renderOrder={10}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation()
          onSelect(id)
        }}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto'
        }}
      >
        <sphereGeometry args={[isSelected ? 0.05 : 0.038, 16, 16]} />
        <meshBasicMaterial color={isSelected ? '#ffffff' : color} transparent opacity={isSelected ? 1 : 0.9} depthTest={false} />
      </mesh>
      <mesh renderOrder={9}>
        <sphereGeometry args={[isSelected ? 0.09 : 0.06, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={isSelected ? 0.3 : 0.18} depthWrite={false} depthTest={false} />
      </mesh>
    </group>
  )
}

/* ─── Cámara: zoom suave hacia una caja ─── */

interface Goal {
  box: Box
  margin: number
  /** Si es true, la cámara vuelve a mirar de frente; si no, conserva el ángulo actual. */
  resetDir: boolean
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

function CameraRig({ goal, controlsRef }: { goal: Goal; controlsRef: RefObject<Controls | null> }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const getState = useThree((s) => s.get)
  const invalidate = useThree((s) => s.invalidate)
  const anim = useRef<{
    t: number
    fromTarget: THREE.Vector3
    toTarget: THREE.Vector3
    fromDist: number
    toDist: number
    dir: THREE.Vector3
  } | null>(null)
  const first = useRef(true)
  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return
    // El tamaño del lienzo se lee al empezar la animación; no debe reiniciarla.
    const { width, height } = getState().size
    const aspect = width / Math.max(height, 1)
    const toTarget = new THREE.Vector3(...boxCenter(goal.box))
    const toDist = fitDistance(goal.box, camera.fov, aspect, goal.margin)
    const fromTarget = controls.target.clone()
    const fromVec = camera.position.clone().sub(fromTarget)
    const fromDist = fromVec.length() || toDist
    const dir = goal.resetDir || fromVec.lengthSq() === 0 ? DEFAULT_DIR.clone() : fromVec.normalize()
    if (first.current || prefersReducedMotion()) {
      first.current = false
      controls.target.copy(toTarget)
      camera.position.copy(toTarget).addScaledVector(dir, toDist)
      controls.update()
      anim.current = null
      invalidate()
      return
    }
    anim.current = { t: 0, fromTarget, toTarget, fromDist, toDist, dir }
    invalidate()
  }, [goal, camera, controlsRef, invalidate, getState])

  useFrame((_, delta) => {
    const a = anim.current
    const controls = controlsRef.current
    if (!a || !controls) return
    a.t = Math.min(1, a.t + delta / ANIM_SECONDS)
    const k = 1 - Math.pow(1 - a.t, 3)
    controls.target.lerpVectors(a.fromTarget, a.toTarget, k)
    const dist = a.fromDist + (a.toDist - a.fromDist) * k
    camera.position.copy(controls.target).addScaledVector(a.dir, dist)
    controls.update()
    if (a.t >= 1) anim.current = null
    else invalidate()
  })

  return null
}

/* ─── Escena ─── */

interface SceneProps {
  selectedZone: ZoneId
  view: View
  zonesStatus?: Record<ZoneId, Status | undefined>
  autoRotate: boolean
  onSelectZone: (zone: ZoneId) => void
  onSelectOrgan: (mesh: string) => void
  organLabel: string | null
}

/**
 * Con zoom, la tarjeta de lecturas ocupa un costado del lienzo. Desplaza la imagen hacia el
 * otro lado (sin mover la cámara) para que la tarjeta no tape el órgano.
 */
function SideOffset({ shift }: { shift: number }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    if (shift) camera.setViewOffset(size.width, size.height, -shift, 0, size.width, size.height)
    else camera.clearViewOffset()
    camera.updateProjectionMatrix()
    invalidate()
  }, [shift, size.width, size.height, camera, invalidate])
  return null
}

function Scene({ selectedZone, view, zonesStatus, autoRotate, onSelectZone, onSelectOrgan, organLabel }: SceneProps) {
  const human = useGLTF(HUMAN_URL).scene
  const anatomy = useGLTF(ANATOMY_URL, false, true).scene
  const layout = useLayout(human, anatomy)
  const controlsRef = useRef<Controls | null>(null)

  const goal = useMemo<Goal>(() => {
    if (view.zoomed && view.organ) {
      const b = layout.boxes.get(view.organ)
      if (b) return { box: b, margin: 1.7, resetDir: false }
    }
    if (view.zoomed && selectedZone !== 'body') {
      const boxes = meshesOfZone(selectedZone)
        .map((n) => layout.boxes.get(n))
        .filter((b): b is Box => !!b)
      const b = unionBoxes(boxes)
      if (b) return { box: b, margin: selectedZone === 'legs' ? 1.1 : 1.9, resetDir: false }
    }
    // Vista general y «Cuerpo entero»: silueta completa. Con `resetKey` se vuelve a mirar de frente.
    return { box: layout.body, margin: 1.12, resetDir: !view.zoomed && view.resetKey >= 0 }
  }, [layout, view.zoomed, view.organ, view.resetKey, selectedZone])

  const labelPos = useMemo<Vec3 | null>(() => {
    if (!view.organ) return null
    const b = layout.boxes.get(view.organ)
    if (!b) return null
    const c = boxCenter(b)
    return [c[0], b.max[1], c[2]]
  }, [layout, view.organ])

  // La tarjeta de lecturas mide ~220 px; con zoom se corre la imagen la mitad hacia el lado libre.
  const cloudSide = CLOUD_POSITIONS[selectedZone].align
  const shift = view.zoomed && selectedZone !== 'body' ? (cloudSide === 'left' ? 120 : -120) : 0

  return (
    <>
      <SideOffset shift={shift} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[2, 3, 4]} intensity={2.2} color="#bffcff" />
      <directionalLight position={[-3, 1, -2]} intensity={1.2} color="#7fd8ff" />
      <Model
        layout={layout}
        human={human}
        anatomy={anatomy}
        selectedZone={selectedZone}
        view={view}
        zonesStatus={zonesStatus}
        onSelectZone={onSelectZone}
        onSelectOrgan={onSelectOrgan}
      />
      {!view.zoomed &&
        ZONE_META.map((zone) => (
          <ZoneBeacon key={zone.id} id={zone.id} isSelected={selectedZone === zone.id} status={zonesStatus?.[zone.id]} onSelect={onSelectZone} />
        ))}
      {labelPos && organLabel && (
        <Html position={labelPos} center zIndexRange={[40, 0]} style={{ pointerEvents: 'none' }}>
          <div
            className="-translate-y-6 whitespace-nowrap rounded-lg border border-red-500/70 bg-[#05101c]/90 px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-wide text-white shadow-[0_0_14px_rgba(255,32,78,0.45)]"
            role="status"
          >
            {organLabel}
          </div>
        </Html>
      )}
      <CameraRig goal={goal} controlsRef={controlsRef} />
      <OrbitControls
        ref={controlsRef as never}
        autoRotate={autoRotate}
        autoRotateSpeed={1.2}
        enablePan={false}
        minDistance={0.15}
        maxDistance={6}
      />
    </>
  )
}

useGLTF.preload(HUMAN_URL)
// Sin Draco (que descarga su decodificador de internet): el archivo usa meshopt, que viene incluido.
useGLTF.preload(ANATOMY_URL, false, true)

/* ─── Componente principal ─── */

/** Props del holograma de «Hoy». */
export interface Holograma3DProps {
  selectedZone?: ZoneId
  onSelectZone?: (zone: ZoneId) => void
  zonesStatus?: Record<ZoneId, Status | undefined>
  indicators?: Indicator[]
  className?: string
}

export function HologramaUnificado({ selectedZone = 'heart', onSelectZone, zonesStatus, indicators, className }: Holograma3DProps) {
  const { t } = useI18n()
  const [view, setView] = useState<View>({ zoomed: false, organ: null, resetKey: 0 })
  const [prevZone, setPrevZone] = useState(selectedZone)

  // Si la zona cambia desde fuera (por ejemplo, otra pantalla), también se hace zoom.
  if (prevZone !== selectedZone) {
    setPrevZone(selectedZone)
    setView((v) => ({ ...v, zoomed: true, organ: null }))
  }

  const handleSelectZone = useCallback(
    (zone: ZoneId) => {
      setView((v) => ({ ...v, zoomed: true, organ: null }))
      onSelectZone?.(zone)
    },
    [onSelectZone],
  )

  const handleSelectOrgan = useCallback((mesh: string) => {
    setView((v) => ({ ...v, organ: mesh }))
  }, [])

  const goGeneral = useCallback(() => {
    setView((v) => ({ zoomed: false, organ: null, resetKey: v.resetKey + 1 }))
  }, [])

  const organLabel = view.organ ? t(`holo.organ.${organId(view.organ)}` as MessageKey) : null

  return (
    <HoloShell
      selectedZone={selectedZone}
      onSelectZone={handleSelectZone}
      zonesStatus={zonesStatus}
      indicators={indicators}
      className={className}
      onResetView={goGeneral}
      focused={view.zoomed}
      note={t('holo.attribution')}
      toolbar={
        <button
          type="button"
          onClick={goGeneral}
          disabled={!view.zoomed}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-950/60 px-4 font-mono text-xs uppercase tracking-wide text-cyan-200 transition-colors hover:border-cyan-300 hover:bg-cyan-900/70 focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:opacity-40 disabled:hover:border-cyan-500/40 disabled:hover:bg-cyan-950/60"
        >
          {t('holo.overview')}
        </button>
      }
    >
      {(autoRotate) => (
        <Canvas
          // Solo dibuja cuando algo cambia (o durante una animación); con el giro activo dibuja siempre.
          frameloop={autoRotate ? 'always' : 'demand'}
          camera={{ position: [0, 0.2, 2.6], fov: FOV, near: 0.02, far: 50 }}
          gl={{ alpha: true, antialias: true }}
          style={{ background: 'transparent' }}
          className="h-full w-full cursor-grab active:cursor-grabbing"
        >
          <Suspense fallback={null}>
            <Scene
              selectedZone={selectedZone}
              view={view}
              zonesStatus={zonesStatus}
              autoRotate={autoRotate}
              onSelectZone={handleSelectZone}
              onSelectOrgan={handleSelectOrgan}
              organLabel={organLabel}
            />
          </Suspense>
        </Canvas>
      )}
    </HoloShell>
  )
}
