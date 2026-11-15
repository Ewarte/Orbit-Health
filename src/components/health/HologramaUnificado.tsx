import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Html, OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { Indicator, Status, ZoneId } from '../../types'
import type { MessageKey } from '../../lib/i18n'
import anatomiaUrl from '../../assets/anatomia.glb'
import { useI18n } from '../../lib/useI18n'
import { HoloShell } from './HoloShell'
import {
  CLOUD_POSITIONS,
  HIGHLIGHT,
  ZONE_META,
  ZONE_OF_MESH,
  boxCenter,
  boxSize,
  easeInOutCubic,
  fitDistance,
  getStatusColor,
  getTouchZone,
  getVertexZone,
  isZoneLit,
  meshOpacity,
  meshesOfZone,
  normalizePoint,
  organId,
  shiftBox,
  unionBoxes,
  type Box,
  type Vec3,
} from './holoZonas'

/* ═══════════════════════════════════════════════════════════════════════
   HOLOGRAMA UNIFICADO
   Todo sale de src/assets/anatomia.glb (BodyParts3D), así silueta, órganos y huesos comparten postura.
   Vista general: la piel dibujada como malla de alambre, coloreada por zona.
   Al elegir una zona la cámara se acerca y aparecen sus órganos y huesos.
   Al tocar un órgano, el zoom se cierra sobre él y aparece su nombre.
   ═══════════════════════════════════════════════════════════════════════ */

const SKIN = 'piel'
const ANATOMY_URL = anatomiaUrl

/**
 * Posición de cada baliza en coordenadas normalizadas del cuerpo (lado, altura, profundidad; ver `normalizePoint`).
 * Van sobre la superficie y lejos de la cara: sien, lado izquierdo del pecho, abdomen, costado del tronco y rodilla.
 */
const BEACON_NORM: Record<ZoneId, Vec3> = {
  head: [0.052, 0.945, -0.005],
  heart: [0.032, 0.76, 0.075],
  metabolism: [0, 0.6, 0.075],
  body: [-0.066, 0.79, 0.02],
  legs: [-0.05, 0.27, 0.04],
}

/** Dirección de la cámara en la vista inicial (hacia el frente, algo elevada). */
const DEFAULT_DIR = new THREE.Vector3(0, 0.12, 1).normalize()
const FOV = 45
/** Duración de las transiciones (cámara y opacidades). */
const ANIM_SECONDS = 1.1

/** Opacidad de la silueta de alambre en cada situación. */
// La piel de BodyParts3D es una malla muy densa: las líneas se acumulan, así que la opacidad va baja.
const WIRE_OPACITY = { general: 0.035, zoom: 0.025, organ: 0.015, body: 0.06 }

interface View {
  /** Hay zoom a la zona elegida. */
  zoomed: boolean
  /** Malla de anatomia.glb tocada (zoom más cercano), o null. */
  organ: string | null
  /** Cambia en cada «Vista general» para volver a encuadrar de frente aunque la vista no cambie. */
  resetKey: number
}

type Controls = { target: THREE.Vector3; update: () => void }

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

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
  /** Desplazamiento que centra el cuerpo en el origen. */
  offset: Vec3
  /** Cajas de cada malla anatómica ya centradas. */
  boxes: Map<string, Box>
  /** Caja de la silueta (la piel), centrada. */
  body: Box
  /** Posición de cada baliza en el espacio centrado. */
  beacons: Record<ZoneId, Vec3>
}

function useLayout(anatomy: THREE.Object3D): Layout {
  return useMemo(() => {
    const raw = sceneBoxes(anatomy)
    const skin = raw.get(SKIN) ?? unionBoxes([...raw.values()])!
    const c = boxCenter(skin)
    const offset: Vec3 = [-c[0], -c[1], -c[2]]
    const boxes = new Map<string, Box>()
    raw.forEach((b, name) => boxes.set(name, shiftBox(b, offset)))
    const body = shiftBox(skin, offset)
    const height = boxSize(body)[1]
    const at = ([u, v, w]: Vec3): Vec3 => [u * height, body.min[1] + v * height, w * height]
    const beacons = {} as Record<ZoneId, Vec3>
    for (const z of ZONE_META) beacons[z.id] = at(BEACON_NORM[z.id])
    return { offset, boxes, body, beacons }
  }, [anatomy])
}

/* ─── Modelo ─── */

interface ModelProps {
  layout: Layout
  anatomy: THREE.Object3D
  /** null = vista general, sin zona elegida. */
  selectedZone: ZoneId | null
  view: View
  zonesStatus?: Record<ZoneId, Status | undefined>
  onSelectZone: (zone: ZoneId) => void
  onSelectOrgan: (mesh: string) => void
}

/** Asigna el material de alambre a la piel y colorea cada vértice según su zona. */
function paintSkin(skin: THREE.Mesh, material: THREE.Material, zones: Uint8Array, selected: ZoneId | null) {
  const ids = ZONE_META.map((z) => z.id)
  skin.material = material
  let attr = skin.geometry.attributes.color as THREE.BufferAttribute | undefined
  if (!attr || attr.count !== zones.length) {
    attr = new THREE.BufferAttribute(new Float32Array(zones.length * 3), 3)
    skin.geometry.setAttribute('color', attr)
  }
  const colors = attr.array as Float32Array
  for (let i = 0; i < zones.length; i++) {
    // En vista general (sin zona elegida) no se resalta nada.
    const on = selected !== null && isZoneLit(selected, ids[zones[i]])
    colors[i * 3] = on ? 1.0 : 0.1
    colors[i * 3 + 1] = on ? 0.12 : 0.8
    colors[i * 3 + 2] = on ? 0.3 : 0.95
  }
  attr.needsUpdate = true
}

/** Opacidad de una malla que se interpola con la curva de la transición. */
interface Tween {
  cur: number
  from: number
  to: number
  t0: number
  apply: (v: number) => void
}

function Model({ layout, anatomy, selectedZone, view, zonesStatus, onSelectZone, onSelectOrgan }: ModelProps) {
  const invalidate = useThree((s) => s.invalidate)
  const tweens = useRef(new Map<string, Tween>())

  /** Fija la opacidad que debe alcanzar `key`; si cambia, se interpola (o salta si se prefiere menos movimiento). */
  const setTarget = useCallback((key: string, to: number, apply: (v: number) => void) => {
    const tw = tweens.current.get(key)
    if (!tw) {
      tweens.current.set(key, { cur: to, from: to, to, t0: 0, apply })
      apply(to)
      return
    }
    tw.apply = apply
    if (tw.to === to) return
    tw.from = tw.cur
    tw.to = to
    tw.t0 = performance.now()
    if (prefersReducedMotion()) {
      tw.cur = to
      apply(to)
    }
  }, [])

  useFrame(() => {
    const now = performance.now()
    let active = false
    tweens.current.forEach((tw) => {
      if (tw.cur === tw.to) return
      const p = Math.min(1, (now - tw.t0) / (ANIM_SECONDS * 1000))
      tw.cur = p >= 1 ? tw.to : tw.from + (tw.to - tw.from) * easeInOutCubic(p)
      tw.apply(tw.cur)
      if (p < 1) active = true
    })
    if (active) invalidate()
  })

  // La piel es la silueta de alambre.
  const skin = useMemo(() => {
    let found: THREE.Mesh | null = null
    anatomy.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (mesh.isMesh && mesh.name === SKIN) found = mesh
    })
    return found as THREE.Mesh | null
  }, [anatomy])

  const wireMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        vertexColors: true,
        wireframe: true,
        transparent: true,
        opacity: WIRE_OPACITY.general,
        depthWrite: false,
      }),
    [],
  )

  // Caja de la piel en su propio espacio (con ella se normalizan los vértices) y zona de cada vértice.
  const skinData = useMemo(() => {
    if (!skin) return null
    const geo = skin.geometry
    if (!geo.boundingBox) geo.computeBoundingBox()
    const bb = geo.boundingBox!
    const box: Box = { min: [bb.min.x, bb.min.y, bb.min.z], max: [bb.max.x, bb.max.y, bb.max.z] }
    const pos = geo.attributes.position
    const ids = ZONE_META.map((z) => z.id)
    const zones = new Uint8Array(pos.count)
    for (let i = 0; i < pos.count; i++) {
      const n = normalizePoint([pos.getX(i), pos.getY(i), pos.getZ(i)], box)
      zones[i] = ids.indexOf(getVertexZone(n.u, n.v))
    }
    return { box, zones }
  }, [skin])

  // Colores de la silueta: la zona elegida en rojo y el resto en cian («Cuerpo entero» enciende todo).
  useEffect(() => {
    if (!skin || !skinData) return
    paintSkin(skin, wireMaterial, skinData.zones, selectedZone)
    invalidate()
  }, [skin, skinData, wireMaterial, selectedZone, invalidate])

  // Con zoom la silueta se atenúa para dejar ver los órganos; «Cuerpo entero» la resalta.
  useEffect(() => {
    const opacity = !view.zoomed
      ? WIRE_OPACITY.general
      : selectedZone === 'body'
        ? WIRE_OPACITY.body
        : view.organ
          ? WIRE_OPACITY.organ
          : WIRE_OPACITY.zoom
    setTarget('wire', opacity, (v) => {
      wireMaterial.opacity = v
    })
    invalidate()
  }, [wireMaterial, view.zoomed, view.organ, selectedZone, setTarget, invalidate])

  // Un material por malla anatómica (la piel usa el de alambre).
  const materials = useMemo(() => {
    const map = new Map<string, THREE.MeshStandardMaterial>()
    anatomy.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (!mesh.isMesh || mesh.name === SKIN) return
      map.set(mesh.name, new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.1, side: THREE.DoubleSide }))
    })
    return map
  }, [anatomy])

  useEffect(() => {
    anatomy.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (!mesh.isMesh || mesh.name === SKIN) return
      if (!mesh.geometry.attributes.normal) mesh.geometry.computeVertexNormals()
      mesh.material = materials.get(mesh.name) ?? mesh.material
    })
  }, [anatomy, materials])

  // Visibilidad, opacidad (interpolada) y color de cada órgano o hueso.
  useEffect(() => {
    const base = new THREE.Color()
    anatomy.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (!mesh.isMesh || mesh.name === SKIN) return
      const material = materials.get(mesh.name)
      if (!material) return
      const zone = ZONE_OF_MESH[mesh.name]
      base.set(getStatusColor(zone ? zonesStatus?.[zone] : undefined))
      material.color.copy(base)
      material.emissive.copy(base)
      material.emissiveIntensity = view.organ === mesh.name ? 0.75 : 0.3
      setTarget(mesh.name, meshOpacity(mesh.name, selectedZone ?? 'body', view.zoomed, view.organ), (v) => {
        const wasTransparent = material.transparent
        mesh.visible = v > 0.003
        material.opacity = v
        material.transparent = v < 0.99
        material.depthWrite = v >= 0.99
        if (wasTransparent !== material.transparent) material.needsUpdate = true
        mesh.renderOrder = v < 0.99 ? 2 : 1
      })
    })
    invalidate()
  }, [anatomy, materials, selectedZone, view.zoomed, view.organ, zonesStatus, setTarget, invalidate])

  /** Zona de la piel bajo el toque: se promedian los tres vértices de la cara tocada. */
  function skinZoneAt(hit: THREE.Intersection): ZoneId | null {
    if (!skinData || !skin || !hit.face) return null
    const pos = skin.geometry.attributes.position
    const { a, b, c } = hit.face
    const p: Vec3 = [
      (pos.getX(a) + pos.getX(b) + pos.getX(c)) / 3,
      (pos.getY(a) + pos.getY(b) + pos.getY(c)) / 3,
      (pos.getZ(a) + pos.getZ(b) + pos.getZ(c)) / 3,
    ]
    const n = normalizePoint(p, skinData.box)
    return getTouchZone(n.u, n.v, n.w)
  }

  /** Qué se tocó: un órgano visible de la zona (con zoom) o, si no, la zona de la piel. */
  function pick(e: ThreeEvent<PointerEvent | MouseEvent>): { organ?: string; zone?: ZoneId } | null {
    // Primero los órganos visibles (la piel de alambre solo es la envoltura)...
    for (const hit of e.intersections) {
      const obj = hit.object as THREE.Mesh
      if (obj === skin) continue
      // Las mallas ocultas o casi transparentes no se pueden tocar.
      const solid = obj.visible && meshOpacity(obj.name, selectedZone ?? 'body', view.zoomed, view.organ) >= 0.25
      if (solid) return { organ: obj.name }
    }
    // ...y si no hay ninguno, la zona de la piel.
    for (const hit of e.intersections) {
      if (hit.object !== skin) continue
      const zone = skinZoneAt(hit)
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
      <primitive object={anatomy} {...handlers} />
    </group>
  )
}

/* ─── Balizas (solo en la vista general) ─── */

function ZoneBeacon({
  id,
  position,
  isSelected,
  status,
  onSelect,
}: {
  id: ZoneId
  position: Vec3
  isSelected: boolean
  status?: Status
  onSelect: (id: ZoneId) => void
}) {
  const color = isSelected ? HIGHLIGHT : getStatusColor(status)
  return (
    <group position={position} scale={isSelected ? 1.25 : 1}>
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
        <sphereGeometry args={[0.013, 16, 16]} />
        <meshBasicMaterial color={isSelected ? '#ffffff' : color} transparent opacity={isSelected ? 1 : 0.85} depthTest={false} />
      </mesh>
      <mesh renderOrder={9}>
        <sphereGeometry args={[0.026, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={isSelected ? 0.3 : 0.16} depthWrite={false} depthTest={false} />
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
    const k = easeInOutCubic(a.t)
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
  /** null = vista general, sin zona elegida. */
  selectedZone: ZoneId | null
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
  const anatomy = useGLTF(ANATOMY_URL, false, true).scene
  const layout = useLayout(anatomy)
  const controlsRef = useRef<Controls | null>(null)

  const goal = useMemo<Goal>(() => {
    if (view.zoomed && view.organ) {
      const b = layout.boxes.get(view.organ)
      if (b) return { box: b, margin: 1.7, resetDir: false }
    }
    if (view.zoomed && selectedZone && selectedZone !== 'body') {
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
  const cloudSide = selectedZone ? CLOUD_POSITIONS[selectedZone].align : 'left'
  const shift = view.zoomed && selectedZone && selectedZone !== 'body' ? (cloudSide === 'left' ? 120 : -120) : 0

  return (
    <>
      <SideOffset shift={shift} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[2, 3, 4]} intensity={2.2} color="#bffcff" />
      <directionalLight position={[-3, 1, -2]} intensity={1.2} color="#7fd8ff" />
      <Model
        layout={layout}
        anatomy={anatomy}
        selectedZone={selectedZone}
        view={view}
        zonesStatus={zonesStatus}
        onSelectZone={onSelectZone}
        onSelectOrgan={onSelectOrgan}
      />
      {!view.zoomed &&
        ZONE_META.map((zone) => (
          <ZoneBeacon key={zone.id} id={zone.id} position={layout.beacons[zone.id]} isSelected={selectedZone === zone.id} status={zonesStatus?.[zone.id]} onSelect={onSelectZone} />
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

  // En vista general no hay zona elegida: ningún botón marcado, nada resaltado, sin tarjeta.
  const shownZone: ZoneId | null = view.zoomed ? selectedZone : null

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
      selectedZone={shownZone}
      onSelectZone={handleSelectZone}
      zonesStatus={zonesStatus}
      indicators={indicators}
      className={className}
      focused={view.zoomed}
      note={t('holo.attribution')}
      toolbar={
        <button
          type="button"
          onClick={goGeneral}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-950/60 px-4 font-mono text-xs uppercase tracking-wide text-cyan-200 transition-colors hover:border-cyan-300 hover:bg-cyan-900/70 focus-visible:outline-2 focus-visible:outline-cyan-300"
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
              selectedZone={shownZone}
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
