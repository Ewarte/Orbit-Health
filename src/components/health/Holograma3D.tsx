import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber'
import { Center, OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { Indicator, Status, ZoneId } from '../../types'
import { statusUi } from '../../lib/status'
import { Sparkline } from '../charts/Sparkline'

/* ═══════════════════════════════════════════════════════════════════════
   CONFIGURACIÓN ANATÓMICA 3D DE LAS 5 ZONAS BIOMÉDICAS
   ═══════════════════════════════════════════════════════════════════════ */

export interface ZoneConfig3D {
  id: ZoneId
  label: string
  name: string
  icon: string
  /** Coordenadas relativas al modelo centrado */
  beaconPos: [number, number, number]
  /** Colliders para hit-testing primario y secundario (brazos/piernas bilaterales) */
  colliders: Array<{
    pos: [number, number, number]
    size: [number, number, number]
  }>
}

const ZONES_CONFIG: ZoneConfig3D[] = [
  {
    id: 'head',
    label: 'Cerebro',
    name: 'Brain & behavior',
    icon: '🧠',
    beaconPos: [0, 0.82, 0.08],
    colliders: [
      { pos: [0, 0.80, 0.02], size: [0.32, 0.32, 0.32] },
    ],
  },
  {
    id: 'heart',
    label: 'Corazón',
    name: 'Heart & circulation',
    icon: '❤️',
    beaconPos: [-0.07, 0.46, 0.15],
    colliders: [
      { pos: [0, 0.48, 0.05], size: [0.38, 0.28, 0.26] },
    ],
  },
  {
    id: 'metabolism',
    label: 'Metabolismo',
    name: 'Metabolism',
    icon: '⚡',
    beaconPos: [0, 0.18, 0.14],
    colliders: [
      { pos: [0, 0.18, 0.05], size: [0.34, 0.26, 0.24] },
    ],
  },
  {
    id: 'body',
    label: 'Cuerpo / Temp',
    name: 'Whole body',
    icon: '🛡️',
    beaconPos: [0.42, 0.25, 0.04],
    colliders: [
      { pos: [-0.42, 0.25, 0.0], size: [0.20, 0.55, 0.20] }, // Brazo izquierdo
      { pos: [0.42, 0.25, 0.0], size: [0.20, 0.55, 0.20] },  // Brazo derecho
    ],
  },
  {
    id: 'legs',
    label: 'Huesos / Piernas',
    name: 'Bones & muscles',
    icon: '🦴',
    beaconPos: [0.15, -0.42, 0.10],
    colliders: [
      { pos: [-0.15, -0.45, 0.02], size: [0.22, 0.85, 0.24] }, // Pierna izquierda
      { pos: [0.15, -0.45, 0.02], size: [0.22, 0.85, 0.24] },  // Pierna derecha
    ],
  },
]

function getStatusColor(status?: Status): string {
  if (status === 'act') return '#ef4444'
  if (status === 'watch') return '#f97316'
  return '#00f2ff'
}

/**
 * Clasifica cada vértice del modelo 3D en su zona biomédica anatómica.
 * En el modelo humano.glb centrado:
 *  - xw: transversal (-0.54 a +0.54)
 *  - yw: altura (-0.98 pies a +0.98 cabeza)
 */
function getVertexZone(xw: number, yw: number): ZoneId {
  if (yw > 0.62) return 'head'
  if (yw > 0.32 && Math.abs(xw) < 0.22) return 'heart'
  if (yw > -0.05 && Math.abs(xw) < 0.22) return 'metabolism'
  if (Math.abs(xw) >= 0.22 && yw > -0.15) return 'body'
  return 'legs'
}

/* ═══════════════════════════════════════════════════════════════════════
   MODELO GLTF CON MATERIAL HOLOGRÁFICO Y COLOREADO POR VÉRTICE
   ═══════════════════════════════════════════════════════════════════════ */

function HumanModel({ selectedZone }: { selectedZone: ZoneId }) {
  const { scene } = useGLTF('/humano.glb')

  const holoMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        vertexColors: true,
        wireframe: true,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  )

  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.material = holoMaterial

        const geometry = mesh.geometry
        const posAttr = geometry.attributes.position
        if (!posAttr) return

        const count = posAttr.count
        let colorAttr = geometry.attributes.color as THREE.BufferAttribute | undefined
        if (!colorAttr || colorAttr.count !== count) {
          colorAttr = new THREE.BufferAttribute(new Float32Array(count * 3), 3)
          geometry.setAttribute('color', colorAttr)
        }

        const colorArray = colorAttr.array as Float32Array

        // Paleta Sci-Fi de Telemetría Médica
        // 1. Cyan puro para partes en reposo
        const cyanR = 0.0
        const cyanG = 0.95
        const cyanB = 1.0

        // 2. Tono rojizo carmesí intenso (#ff204e) para el área que se está midiendo
        const redR = 1.0
        const redG = 0.12
        const redB = 0.3

        for (let i = 0; i < count; i++) {
          const xw = posAttr.getX(i)
          const yw = posAttr.getZ(i)

          const zone = getVertexZone(xw, yw)
          const isMeasured = zone === selectedZone

          const idx = i * 3
          colorArray[idx] = isMeasured ? redR : cyanR
          colorArray[idx + 1] = isMeasured ? redG : cyanG
          colorArray[idx + 2] = isMeasured ? redB : cyanB
        }

        colorAttr.needsUpdate = true
      }
    })
  }, [scene, holoMaterial, selectedZone])

  return <primitive object={scene} />
}

// Precargar el modelo para fluidez inmediata
useGLTF.preload('/humano.glb')

/* ═══════════════════════════════════════════════════════════════════════
   BALIZA Y NODO INTERACTIVO 3D (BEACON + HTML HUD CHIP)
   ═══════════════════════════════════════════════════════════════════════ */

function ZoneBeacon3D({
  zone,
  isSelected,
  isHovered,
  status,
  onSelect,
  onHover,
}: {
  zone: ZoneConfig3D
  isSelected: boolean
  isHovered: boolean
  status?: Status
  onSelect: (id: ZoneId) => void
  onHover: (id: ZoneId | null) => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const statusColor = getStatusColor(status)
  // La zona activa medida brilla en rojo neón intenso; las demás reflejan su estado
  const color = isSelected ? '#ff204e' : statusColor

  // Animación del halo pulsante
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (meshRef.current) {
      const s = isSelected
        ? 1.25 + Math.sin(t * 5) * 0.18
        : isHovered
          ? 1.15 + Math.sin(t * 4) * 0.12
          : 1 + Math.sin(t * 2) * 0.08
      meshRef.current.scale.set(s, s, s)
    }
    if (ringRef.current) {
      const sRing = isSelected
        ? 1.4 + Math.sin(t * 4) * 0.3
        : isHovered
          ? 1.2 + Math.sin(t * 3) * 0.2
          : 1 + Math.sin(t * 2) * 0.15
      ringRef.current.scale.set(sRing, sRing, sRing)
    }
  })

  return (
    <group position={zone.beaconPos}>
      {/* Esfera central de baliza */}
      <mesh
        ref={meshRef}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation()
          onSelect(zone.id)
        }}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          onHover(zone.id)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          onHover(null)
          document.body.style.cursor = 'auto'
        }}
      >
        <sphereGeometry args={[isSelected ? 0.046 : isHovered ? 0.038 : 0.032, 16, 16]} />
        <meshBasicMaterial
          color={isSelected ? '#ffffff' : color}
          transparent
          opacity={isSelected ? 1 : isHovered ? 0.95 : 0.85}
        />
      </mesh>

      {/* Anillo de onda expansiva */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.045, 0.065, 24]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isSelected ? 0.95 : isHovered ? 0.7 : 0.45}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   HITBOXES DE COLISIÓN DIRECTA EN EL CUERPO (RAYCASTING INVISIBLE)
   ═══════════════════════════════════════════════════════════════════════ */

function BodyHitboxes({
  onSelect,
  onHover,
}: {
  onSelect: (id: ZoneId) => void
  onHover: (id: ZoneId | null) => void
}) {
  return (
    <group>
      {ZONES_CONFIG.map((z) =>
        z.colliders.map((c, i) => (
          <mesh
            key={`${z.id}-${i}`}
            position={c.pos}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation()
              onSelect(z.id)
            }}
            onPointerOver={(e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation()
              onHover(z.id)
              document.body.style.cursor = 'pointer'
            }}
            onPointerOut={() => {
              onHover(null)
              document.body.style.cursor = 'auto'
            }}
          >
            <boxGeometry args={c.size} />
            {/* Material invisible para colisiones pero interceptable por el raycaster */}
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        )),
      )}
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   VOLUMEN HOLOGRÁFICO DE ESCANEO ROJIZO EN EL ÁREA MEDIDA
   ═══════════════════════════════════════════════════════════════════════ */

function ActiveZoneVolumeHighlight({ selectedZone }: { selectedZone: ZoneId }) {
  const config = ZONES_CONFIG.find((z) => z.id === selectedZone)
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime()
      const s = 1 + Math.sin(t * 3.5) * 0.03
      groupRef.current.scale.set(s, s, s)
    }
  })

  if (!config) return null

  return (
    <group ref={groupRef}>
      {config.colliders.map((c, i) => (
        <group key={`volume-highlight-${selectedZone}-${i}`} position={c.pos}>
          {/* Contorno de escáner volumétrico rojizo */}
          <mesh>
            <boxGeometry args={c.size} />
            <meshBasicMaterial
              color="#ff204e"
              wireframe
              transparent
              opacity={0.32}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          {/* Resplandor interno de telemetría activa */}
          <mesh>
            <boxGeometry args={[c.size[0] * 0.96, c.size[1] * 0.96, c.size[2] * 0.96]} />
            <meshBasicMaterial
              color="#ff1744"
              transparent
              opacity={0.07}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   LUZ FOCAL DINÁMICA QUE SIGUE A LA ZONA SELECCIONADA
   ═══════════════════════════════════════════════════════════════════════ */

function ActiveZoneSpotlight({ selectedZone }: { selectedZone: ZoneId }) {
  const config = ZONES_CONFIG.find((z) => z.id === selectedZone)
  const lightRef = useRef<THREE.PointLight>(null)

  useFrame(({ clock }) => {
    if (lightRef.current) {
      const t = clock.getElapsedTime()
      lightRef.current.intensity = 5 + Math.sin(t * 4) * 1.5
    }
  })

  if (!config) return null
  const redHighlight = '#ff204e'

  return (
    <group position={config.beaconPos}>
      <pointLight ref={lightRef} color={redHighlight} distance={1.4} decay={2} />
      {/* Halo de luz difusa 3D rojizo */}
      <mesh>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color={redHighlight} transparent opacity={0.16} depthWrite={false} />
      </mesh>
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   POSICIONAMIENTO Y NUBES DE TELEMETRÍA DINÁMICA ALREDEDOR DEL CUERPO
   ═══════════════════════════════════════════════════════════════════════ */

interface CloudPosition {
  top?: string
  bottom?: string
  left?: string
  right?: string
  originX: string
  originY: string
  align: 'left' | 'right'
}

const CLOUD_POSITIONS: Record<ZoneId, CloudPosition> = {
  head: { top: '6%', right: '2.5%', originX: '50%', originY: '18%', align: 'right' },
  heart: { top: '22%', left: '2.5%', originX: '48%', originY: '30%', align: 'left' },
  metabolism: { top: '38%', right: '2.5%', originX: '50%', originY: '44%', align: 'right' },
  body: { top: '52%', left: '2.5%', originX: '38%', originY: '46%', align: 'left' },
  legs: { bottom: '10%', right: '2.5%', originX: '52%', originY: '71%', align: 'right' },
}

function ConnectingLines3D({ selected }: { selected: ZoneId }) {
  const pos = CLOUD_POSITIONS[selected]
  if (!pos) return null

  const fromX = pos.originX
  const fromY = pos.originY
  const toX = pos.align === 'right' ? '76%' : '24%'
  const toY = pos.top ?? (pos.bottom ? `calc(100% - ${pos.bottom})` : '50%')

  return (
    <svg className="pointer-events-none absolute inset-0 z-20 h-full w-full" style={{ overflow: 'visible' }}>
      <circle cx={fromX} cy={fromY} r="4" fill="#ff204e" opacity="0.95">
        <animate attributeName="r" values="3;6;3" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.95;0.35;0.95" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx={fromX} cy={fromY} r="9" fill="none" stroke="#ff204e" strokeWidth="1.2" opacity="0.5">
        <animate attributeName="r" values="4;14;4" dur="2s" repeatCount="indefinite" />
      </circle>
      <line
        x1={fromX}
        y1={fromY}
        x2={toX}
        y2={toY}
        stroke="#ff204e"
        strokeWidth="1.2"
        strokeDasharray="4 4"
        opacity="0.65"
      >
        <animate attributeName="stroke-dashoffset" values="0;-16" dur="1.5s" repeatCount="indefinite" />
      </line>
    </svg>
  )
}

function StatCloud3D({
  zone,
  indicators,
  position,
  visible,
}: {
  zone: ZoneConfig3D
  indicators: Indicator[]
  position: CloudPosition
  visible: boolean
}) {
  return (
    <div
      className="pointer-events-none absolute z-30 transition-all duration-350 ease-out max-md:inset-x-3 max-md:bottom-12 max-md:w-auto md:w-[220px] xl:w-[240px]"
      style={{
        top: position.top,
        bottom: position.bottom,
        left: position.left,
        right: position.right,
        opacity: visible ? 1 : 0,
        transform: visible
          ? 'translateY(0) scale(1)'
          : `translateY(${position.align === 'right' ? '12px' : '-12px'}) scale(0.94)`,
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div
        className="relative overflow-hidden rounded-2xl border p-3.5 shadow-2xl backdrop-blur-xl"
        style={{
          background: 'linear-gradient(145deg, rgba(5,16,28,0.95), rgba(12,28,45,0.92))',
          borderColor: 'rgba(255, 32, 78, 0.45)',
          boxShadow: '0 0 25px rgba(255, 32, 78, 0.25), 0 12px 36px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
      >
        {/* Línea superior neón rojiza */}
        <div
          className="absolute top-0 left-0 h-[2px] w-full"
          style={{ background: 'linear-gradient(90deg, transparent, #ff204e, transparent)' }}
        />

        {/* Cabecera del órgano */}
        <div className="mb-2.5 flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-base">{zone.icon}</span>
            <span className="font-display text-[13px] font-semibold uppercase tracking-wider text-white">
              {zone.name}
            </span>
          </div>
          <span className="font-mono text-[9px] uppercase tracking-widest text-red-400 font-bold animate-pulse">
            MEDICIÓN ACTIVA
          </span>
        </div>

        {/* Indicadores clínicos de esta zona */}
        {indicators.length === 0 ? (
          <p className="m-0 text-xs text-mute">Sin lecturas de telemetría aún.</p>
        ) : (
          <div className="space-y-2">
            {indicators.map((ind) => {
              const ui = statusUi[ind.status]
              return (
                <div
                  key={ind.id}
                  className="rounded-xl border border-white/5 bg-white/[0.04] p-2.5 transition-colors hover:border-red-500/30 hover:bg-white/[0.07]"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-medium text-cyan-200">{ind.name}</span>
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                      style={{
                        color: ind.status === 'ok' ? '#00f2ff' : ind.status === 'watch' ? '#fb923c' : '#f87171',
                        background:
                          ind.status === 'ok'
                            ? 'rgba(0,242,255,0.12)'
                            : ind.status === 'watch'
                              ? 'rgba(251,146,60,0.15)'
                              : 'rgba(248,113,113,0.18)',
                        border: `1px solid ${ind.status === 'ok'
                          ? 'rgba(0,242,255,0.3)'
                          : ind.status === 'watch'
                            ? 'rgba(251,146,60,0.3)'
                            : 'rgba(248,113,113,0.3)'
                          }`,
                      }}
                    >
                      {ui.label}
                    </span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="font-display text-2xl font-bold tabular-nums leading-none text-white">
                      {ind.value}
                    </span>
                    <span className="text-xs text-cyan-300/80 font-mono">{ind.unit}</span>
                  </div>
                  {ind.history.length >= 2 && (
                    <div className="mt-1.5">
                      <Sparkline values={ind.history} color={ind.status === 'ok' ? '#00f2ff' : ui.cssVar} />
                    </div>
                  )}
                  {ind.reason && (
                    <p className="m-0 mt-1 text-[10px] leading-tight text-mute italic">
                      {ind.reason}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL HOLOGRAMA 3D
   ═══════════════════════════════════════════════════════════════════════ */

export interface Holograma3DProps {
  selectedZone?: ZoneId
  onSelectZone?: (zone: ZoneId) => void
  zonesStatus?: Record<ZoneId, Status | undefined>
  indicators?: Indicator[]
  className?: string
}

export function Holograma3D({
  selectedZone = 'heart',
  onSelectZone,
  zonesStatus,
  indicators,
  className,
}: Holograma3DProps) {
  const [hoveredZone, setHoveredZone] = useState<ZoneId | null>(null)
  const [autoRotate, setAutoRotate] = useState(true)

  function handleSelect(id: ZoneId) {
    onSelectZone?.(id)
  }

  const activeZoneConfig = ZONES_CONFIG.find((z) => z.id === selectedZone)

  return (
    <div
      className={`relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-[#051424]/95 via-[#071d33]/85 to-[#020b14]/95 p-4 shadow-[0_0_35px_rgba(0,255,255,0.12)] backdrop-blur-xl ${className ?? ''
        }`}
    >
      {/* Retículas y elementos HUD aeroespaciales */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent" />

      {/* Cabecera HUD con selector de rotación */}
      <div className="z-10 mb-2 flex w-full items-center justify-between border-b border-cyan-500/20 pb-2.5 text-xs">
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full animate-pulse shadow-[0_0_8px_#ff204e]"
            style={{ backgroundColor: '#ff204e' }}
          />
          <span className="font-display font-semibold uppercase tracking-widest text-cyan-300">
            Holograma Biométrico 3D
          </span>
        </div>
        <button
          type="button"
          onClick={() => setAutoRotate((prev) => !prev)}
          className="flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/50 px-2.5 py-1 font-mono text-[10px] uppercase text-cyan-300 transition-colors hover:border-cyan-400 hover:bg-cyan-900/60"
        >
          <span className={`h-1.5 w-1.5 rounded-full ${autoRotate ? 'bg-cyan-400 animate-ping' : 'bg-slate-500'}`} />
          {autoRotate ? '360° Activo' : 'Pausado'}
        </button>
      </div>

      {/* Canvas 3D Interactivo con Nubes Dinámicas Alrededor del Cuerpo */}
      <div className="relative h-[440px] w-full sm:h-[480px] lg:h-[530px]">
        {/* Líneas de telemetría láser conectando el órgano a su nube de métricas */}
        {indicators && indicators.length > 0 && (
          <div className="hidden md:block">
            <ConnectingLines3D selected={selectedZone} />
          </div>
        )}

        <Canvas
          camera={{ position: [0, 0.9, 3.2], fov: 45 }}
          gl={{ alpha: true, antialias: true }}
          style={{ background: 'transparent' }}
          className="h-full w-full cursor-grab active:cursor-grabbing"
        >
          {/* Iluminación Holográfica */}
          <ambientLight intensity={0.7} />
          <pointLight position={[5, 10, 5]} color="#00ffff" intensity={2.8} />
          <pointLight position={[-5, 5, -5]} color="#00eeff" intensity={1.8} />
          <pointLight position={[0, -5, 3]} color="#00ffff" intensity={1.2} />

          {/* Luz focal rojiza que sigue a la zona seleccionada */}
          <ActiveZoneSpotlight selectedZone={selectedZone} />

          {/* Modelo Centrado con Suspense */}
          <Suspense fallback={null}>
            <Center>
              <HumanModel selectedZone={selectedZone} />
              {/* Resalte volumétrico rojizo de la zona anatómica en medición */}
              <ActiveZoneVolumeHighlight selectedZone={selectedZone} />
              {/* Hitboxes invisibles para clic directo sobre el cuerpo */}
              <BodyHitboxes onSelect={handleSelect} onHover={setHoveredZone} />
              {/* Balizas y marcadores flotantes 3D */}
              {ZONES_CONFIG.map((zone) => (
                <ZoneBeacon3D
                  key={zone.id}
                  zone={zone}
                  isSelected={selectedZone === zone.id}
                  isHovered={hoveredZone === zone.id}
                  status={zonesStatus?.[zone.id]}
                  onSelect={handleSelect}
                  onHover={setHoveredZone}
                />
              ))}
            </Center>
          </Suspense>

          {/* Controles de cámara orbital */}
          <OrbitControls
            autoRotate={autoRotate}
            autoRotateSpeed={hoveredZone ? 0.3 : 1.6}
            enablePan={false}
            minDistance={1.4}
            maxDistance={5.2}
          />
        </Canvas>

        {/* Nubes dinámicas de estadísticas que aparecen alrededor del cuerpo solo al seleccionar la zona */}
        {indicators &&
          indicators.length > 0 &&
          ZONES_CONFIG.map((zone) => {
            const zoneIndicators = indicators.filter((i) => i.zone === zone.id)
            const pos = CLOUD_POSITIONS[zone.id]
            if (!pos) return null
            return (
              <StatCloud3D
                key={zone.id}
                zone={zone}
                indicators={zoneIndicators}
                position={pos}
                visible={selectedZone === zone.id}
              />
            )
          })}
      </div>

      {/* Selector de zonas rápido al pie del holograma */}
      <div className="z-10 mt-2 flex flex-wrap items-center justify-center gap-1.5 w-full border-t border-cyan-500/20 pt-2.5">
        {ZONES_CONFIG.map((z) => {
          const isSel = selectedZone === z.id
          const st = zonesStatus?.[z.id]
          const c = getStatusColor(st)
          return (
            <button
              key={z.id}
              type="button"
              onClick={() => handleSelect(z.id)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${isSel
                ? 'border border-red-500/80 bg-red-950/70 text-white shadow-[0_0_12px_rgba(255,32,78,0.5)]'
                : 'border border-white/5 bg-white/[0.02] text-mute hover:border-cyan-500/40 hover:text-cyan-200'
                }`}
            >
              <span>{z.icon}</span>
              <span>{z.label}</span>
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: isSel ? '#ff204e' : c }}
              />
            </button>
          )
        })}
      </div>

      {/* Pie con indicaciones de interacción */}
      <div className="z-10 mt-2 flex items-center justify-between w-full text-[10px] text-cyan-300/60 font-mono">
        <span>ZONA: {activeZoneConfig?.name.toUpperCase()}</span>
        <span>Haz clic en el cuerpo o baliza</span>
      </div>
    </div>
  )
}
