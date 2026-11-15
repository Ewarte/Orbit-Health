import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber'
import { Center, OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { ZoneId } from '../../types'
import { useI18n } from '../../lib/useI18n'
import { HoloShell } from './HoloShell'
import { HIGHLIGHT, ZONE_OF_MESH, getStatusColor } from './holoZonas'
import type { Holograma3DProps } from './Holograma3D'

/* ═══════════════════════════════════════════════════════════════════════
   VERSIÓN B: modelo anatómico (BodyParts3D) con órganos con nombre.
   El archivo public/anatomia.glb lleva 34 mallas (esqueleto completo y 13 órganos); cada una pertenece a una zona.
   ═══════════════════════════════════════════════════════════════════════ */

const SKIN = 'piel'
/** El cráneo es translúcido para que se vea el cerebro que lleva dentro. */
const SKULL = 'craneo'

function zoneFromEvent(e: ThreeEvent<PointerEvent | MouseEvent>): ZoneId | null {
  // La piel y el cráneo envuelven a lo demás: se prefiere el órgano o hueso más cercano que no sean ellos.
  const hit =
    e.intersections.find((i) => i.object.name !== SKIN && i.object.name !== SKULL) ??
    e.intersections.find((i) => i.object.name !== SKIN) ??
    e.intersections[0]
  return hit ? (ZONE_OF_MESH[hit.object.name] ?? null) : null
}

function AnatomyModel({
  selectedZone,
  hoveredZone,
  zonesStatus,
  onSelect,
  onHover,
}: Pick<Holograma3DProps, 'zonesStatus'> & {
  selectedZone: ZoneId
  hoveredZone: ZoneId | null
  onSelect: (id: ZoneId) => void
  onHover: (id: ZoneId | null) => void
}) {
  // Sin Draco (que descarga su decodificador de internet): el archivo usa meshopt, que viene incluido.
  const { scene } = useGLTF('/anatomia.glb', false, true)
  const invalidate = useThree((state) => state.invalidate)

  // Un material por malla. Se crean sin tocar la escena (useMemo debe ser puro) y se asignan en el efecto de abajo.
  const materials = useMemo(() => {
    const map = new Map<string, THREE.MeshStandardMaterial>()
    scene.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return
      const isSkin = child.name === SKIN
      const isSkull = child.name === SKULL
      map.set(
        child.name,
        new THREE.MeshStandardMaterial({
          roughness: 0.55,
          metalness: 0.1,
          transparent: isSkin || isSkull,
          depthWrite: !(isSkin || isSkull),
          side: isSkin ? THREE.FrontSide : THREE.DoubleSide,
        }),
      )
    })
    return map
  }, [scene])

  useEffect(() => {
    scene.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (!mesh.isMesh) return
      if (!mesh.geometry.attributes.normal) mesh.geometry.computeVertexNormals()
      mesh.material = materials.get(mesh.name) ?? mesh.material
      mesh.renderOrder = mesh.name === SKIN ? 3 : mesh.name === SKULL ? 2 : 1
    })
  }, [scene, materials])

  // Cada órgano toma el color del estado de su zona; el de la zona medida brilla en rojo.
  useEffect(() => {
    const base = new THREE.Color()
    const glow = new THREE.Color(HIGHLIGHT)
    materials.forEach((material, name) => {
      const zone = ZONE_OF_MESH[name]
      if (!zone) return
      const selected = zone === selectedZone
      const hovered = zone === hoveredZone
      base.set(getStatusColor(zonesStatus?.[zone]))
      if (name === SKIN) {
        material.color.copy(base)
        material.emissive.copy(selected ? glow : base)
        material.emissiveIntensity = selected ? 0.5 : 0.25
        material.opacity = selected ? 0.38 : hovered ? 0.24 : 0.13
      } else if (name === SKULL) {
        material.color.copy(base).lerp(glow, selected ? 0.7 : 0)
        material.emissive.copy(selected ? glow : base)
        material.emissiveIntensity = selected ? 0.5 : hovered ? 0.35 : 0.1
        material.opacity = selected ? 0.5 : 0.28
      } else {
        // La zona medida se tiñe de rojo; las demás conservan el color de su estado, más tenue.
        if (selected) base.lerp(glow, 0.7)
        material.color.copy(base).multiplyScalar(selected ? 1 : 0.55)
        material.emissive.copy(selected ? glow : base)
        material.emissiveIntensity = selected ? 0.55 : hovered ? 0.4 : 0.12
      }
      material.needsUpdate = true
    })
    // Con el dibujo «bajo demanda» hay que pedir un cuadro nuevo tras cambiar los materiales.
    invalidate()
  }, [materials, selectedZone, hoveredZone, zonesStatus, invalidate])

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

useGLTF.preload('/anatomia.glb', false, true)

export function HologramaAnatomico({
  selectedZone = 'heart',
  onSelectZone,
  zonesStatus,
  indicators,
  className,
}: Holograma3DProps) {
  const { t } = useI18n()
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
      note={t('holo.attribution')}
    >
      {(autoRotate) => (
        <Canvas
          // Solo dibuja cuando algo cambia; con el giro activo dibuja siempre. Así una tablet no gasta batería en reposo.
          frameloop={autoRotate ? 'always' : 'demand'}
          camera={{ position: [0, 0.1, 2.4], fov: 45 }}
          gl={{ alpha: true, antialias: true }}
          style={{ background: 'transparent' }}
          className="h-full w-full cursor-grab active:cursor-grabbing"
        >
          <ambientLight intensity={0.9} />
          <directionalLight position={[2, 3, 4]} intensity={2.2} color="#bffcff" />
          <directionalLight position={[-3, 1, -2]} intensity={1.2} color="#7fd8ff" />
          <Suspense fallback={null}>
            <Center>
              <AnatomyModel
                selectedZone={selectedZone}
                hoveredZone={hoveredZone}
                zonesStatus={zonesStatus}
                onSelect={handleSelect}
                onHover={setHoveredZone}
              />
            </Center>
          </Suspense>
          <OrbitControls
            ref={controlsRef as never}
            autoRotate={autoRotate}
            autoRotateSpeed={1.2}
            enablePan={false}
            minDistance={1.2}
            maxDistance={5}
          />
        </Canvas>
      )}
    </HoloShell>
  )
}
