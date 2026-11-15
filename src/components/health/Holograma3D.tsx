import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, type ThreeEvent } from '@react-three/fiber'
import { Center, OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { Indicator, Status, ZoneId } from '../../types'
import { HoloShell } from './HoloShell'
import { HIGHLIGHT, ZONE_META, getStatusColor } from './holoZonas'

/* ═══════════════════════════════════════════════════════════════════════
   VERSIÓN A: modelo de malla de alambre (humano.glb) con zonas más fieles.
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * Posición de la baliza de cada zona, ya dentro de su región del cuerpo
 * (coordenadas del modelo centrado: x transversal, y altura, z profundidad).
 * La malla es de alambre y translúcida, así que se ve a través del cuerpo.
 */
const BEACON_POS: Record<ZoneId, [number, number, number]> = {
  head: [0, 0.86, 0],
  heart: [0.05, 0.48, 0],
  metabolism: [0, 0.1, 0],
  body: [0.34, 0.25, 0],
  legs: [0.1, -0.55, 0],
}

/**
 * Reparte cada vértice del modelo en una zona. En humano.glb (altura total 1,96):
 *  - h: altura (de -0,98 en los pies a +0,98 en la cabeza); x: lado.
 *  - Los brazos cuelgan en diagonal hasta h = -0,15 y se separan del tronco a partir de |x| = 0,21.
 *
 * Criterio:
 *  - cabeza: por encima del cuello (h > 0,74).
 *  - brazos y piel → «cuerpo»: fuera del tronco (|x| > 0,21) mientras haya brazos (h > -0,2).
 *  - pecho (corazón y pulmones): de los hombros a la base de las costillas (0,26 < h ≤ 0,74).
 *  - abdomen (metabolismo): de las costillas a la entrepierna (-0,08 < h ≤ 0,26).
 *  - piernas: de la entrepierna hacia abajo. Los pies cuentan como parte de las piernas: la app
 *    no tiene una zona de pies y separarlos mezclaría su estado con el de otra zona.
 */
function getVertexZone(x: number, h: number): ZoneId {
  const ax = Math.abs(x)
  if (h > 0.74) return 'head'
  if (h > -0.2 && ax > 0.21) return 'body'
  if (h > 0.26) return 'heart'
  if (h > -0.08) return 'metabolism'
  return 'legs'
}

function HumanModel({
  selectedZone,
  onSelect,
  onHover,
}: {
  selectedZone: ZoneId
  onSelect: (id: ZoneId) => void
  onHover: (id: ZoneId | null) => void
}) {
  const { scene } = useGLTF('/humano.glb')

  const holoMaterial = useMemo(
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

  // Zona de cada vértice, calculada una sola vez por malla.
  const zoneMaps = useMemo(() => {
    const maps = new Map<THREE.Mesh, Uint8Array>()
    const ids = ZONE_META.map((z) => z.id)
    scene.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (!mesh.isMesh) return
      const pos = mesh.geometry.attributes.position
      const map = new Uint8Array(pos.count)
      for (let i = 0; i < pos.count; i++) map[i] = ids.indexOf(getVertexZone(pos.getX(i), pos.getZ(i)))
      maps.set(mesh, map)
    })
    return maps
  }, [scene])

  // Colorea la propia malla: la zona medida en rojo y el resto en cian.
  useEffect(() => {
    const ids = ZONE_META.map((z) => z.id)
    const selectedIndex = ids.indexOf(selectedZone)
    zoneMaps.forEach((map, mesh) => {
      mesh.material = holoMaterial
      const geometry = mesh.geometry
      const count = map.length
      let colorAttr = geometry.attributes.color as THREE.BufferAttribute | undefined
      if (!colorAttr || colorAttr.count !== count) {
        colorAttr = new THREE.BufferAttribute(new Float32Array(count * 3), 3)
        geometry.setAttribute('color', colorAttr)
      }
      const colors = colorAttr.array as Float32Array
      for (let i = 0; i < count; i++) {
        const on = map[i] === selectedIndex
        colors[i * 3] = on ? 1.0 : 0.0
        colors[i * 3 + 1] = on ? 0.12 : 0.9
        colors[i * 3 + 2] = on ? 0.3 : 1.0
      }
      colorAttr.needsUpdate = true
    })
  }, [zoneMaps, holoMaterial, selectedZone])

  function zoneFromEvent(e: ThreeEvent<PointerEvent | MouseEvent>): ZoneId | null {
    const mesh = e.object as THREE.Mesh
    const map = zoneMaps.get(mesh)
    if (!map || !e.face) return null
    return ZONE_META[map[e.face.a]]?.id ?? null
  }

  return (
    <primitive
      object={scene}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        const zone = zoneFromEvent(e)
        if (zone) {
          e.stopPropagation()
          onSelect(zone)
        }
      }}
      onPointerMove={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        onHover(zoneFromEvent(e))
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        onHover(null)
        document.body.style.cursor = 'auto'
      }}
    />
  )
}

useGLTF.preload('/humano.glb')

/* ═══════════════════════════════════════════════════════════════════════
   BALIZA INTERACTIVA DE CADA ZONA
   ═══════════════════════════════════════════════════════════════════════ */

function ZoneBeacon({
  id,
  isSelected,
  isHovered,
  status,
  onSelect,
  onHover,
}: {
  id: ZoneId
  isSelected: boolean
  isHovered: boolean
  status?: Status
  onSelect: (id: ZoneId) => void
  onHover: (id: ZoneId | null) => void
}) {
  const color = isSelected ? HIGHLIGHT : getStatusColor(status)
  const scale = isSelected ? 1.2 : isHovered ? 1.15 : 1

  return (
    <group position={BEACON_POS[id]} scale={scale}>
      <mesh
        renderOrder={10}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation()
          onSelect(id)
        }}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          onHover(id)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          onHover(null)
          document.body.style.cursor = 'auto'
        }}
      >
        <sphereGeometry args={[isSelected ? 0.05 : 0.038, 16, 16]} />
        <meshBasicMaterial color={isSelected ? '#ffffff' : color} transparent opacity={isSelected ? 1 : 0.9} depthTest={false} />
      </mesh>
      {/* Halo suave del color de la zona, sin anillos sueltos */}
      <mesh renderOrder={9}>
        <sphereGeometry args={[isSelected ? 0.09 : 0.06, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={isSelected ? 0.3 : 0.18} depthWrite={false} depthTest={false} />
      </mesh>
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL (VERSIÓN A)
   ═══════════════════════════════════════════════════════════════════════ */

export interface Holograma3DProps {
  selectedZone?: ZoneId
  onSelectZone?: (zone: ZoneId) => void
  zonesStatus?: Record<ZoneId, Status | undefined>
  indicators?: Indicator[]
  className?: string
}

export function Holograma3D({ selectedZone = 'heart', onSelectZone, zonesStatus, indicators, className }: Holograma3DProps) {
  const [hoveredZone, setHoveredZone] = useState<ZoneId | null>(null)
  const controlsRef = useRef<{ reset: () => void } | null>(null)

  function handleSelect(id: ZoneId) {
    onSelectZone?.(id)
  }

  return (
    <HoloShell
      selectedZone={selectedZone}
      onSelectZone={handleSelect}
      zonesStatus={zonesStatus}
      indicators={indicators}
      className={className}
      onResetView={() => controlsRef.current?.reset()}
    >
      {(autoRotate) => (
        <Canvas
          // Solo dibuja cuando algo cambia; con el giro activo dibuja siempre. Así una tablet no gasta batería en reposo.
          frameloop={autoRotate ? 'always' : 'demand'}
          camera={{ position: [0, 0.5, 2.5], fov: 45 }}
          gl={{ alpha: true, antialias: true }}
          style={{ background: 'transparent' }}
          className="h-full w-full cursor-grab active:cursor-grabbing"
        >
          <Suspense fallback={null}>
            <Center>
              <HumanModel selectedZone={selectedZone} onSelect={handleSelect} onHover={setHoveredZone} />
              {ZONE_META.map((zone) => (
                <ZoneBeacon
                  key={zone.id}
                  id={zone.id}
                  isSelected={selectedZone === zone.id}
                  isHovered={hoveredZone === zone.id}
                  status={zonesStatus?.[zone.id]}
                  onSelect={handleSelect}
                  onHover={setHoveredZone}
                />
              ))}
            </Center>
          </Suspense>
          <OrbitControls
            ref={controlsRef as never}
            autoRotate={autoRotate}
            autoRotateSpeed={1.2}
            enablePan={false}
            minDistance={1.2}
            maxDistance={5.2}
          />
        </Canvas>
      )}
    </HoloShell>
  )
}
