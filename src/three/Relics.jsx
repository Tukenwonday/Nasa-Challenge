import { useMemo } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'

/* ---------- Shared PBR materials ---------- */
const Foil = (p) => <meshStandardMaterial color="#d6a52e" metalness={1} roughness={0.22} envMapIntensity={1.4} {...p} />
const Bronze = (p) => <meshStandardMaterial color="#6b4a22" metalness={0.9} roughness={0.4} {...p} />
const Alu = (p) => <meshStandardMaterial color="#b8bec8" metalness={0.95} roughness={0.32} {...p} />
const Dark = (p) => <meshStandardMaterial color="#2a2c31" metalness={0.7} roughness={0.55} {...p} />
const Panel = (p) => <meshStandardMaterial color="#1b2a4a" metalness={0.65} roughness={0.28} {...p} />
const DustPanel = (p) => <meshStandardMaterial color="#4a3138" metalness={0.5} roughness={0.55} {...p} />
const Paint = (p) => <meshStandardMaterial color="#d9dce1" metalness={0.3} roughness={0.6} {...p} />

const UP = new THREE.Vector3(0, 1, 0)

/** Cylinder strut between two points. */
function Strut({ a, b, r = 0.04, mat = <Alu /> }) {
  const { pos, len, quat } = useMemo(() => {
    const A = new THREE.Vector3(...a)
    const B = new THREE.Vector3(...b)
    const d = B.clone().sub(A)
    const len = d.length()
    const quat = new THREE.Quaternion().setFromUnitVectors(UP, d.normalize())
    return { pos: A.clone().add(B).multiplyScalar(0.5), len, quat }
  }, [a, b])
  return (
    <mesh position={pos} quaternion={quat}>
      <cylinderGeometry args={[r, r, len, 8]} />
      {mat}
    </mesh>
  )
}

/** Solid cleated wheel; axle along Z. */
function Wheel({ position, r = 0.35, w = 0.28 }) {
  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[r, r, w, 20]} />
        <Dark />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[r * 0.55, r * 0.55, w + 0.04, 12]} />
        <Alu />
      </mesh>
    </group>
  )
}

/** Wire-mesh wheel (Apollo LRV). Axle along Z. */
function MeshWheel({ position, r = 0.4, w = 0.24 }) {
  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[r, r, w, 28, 3, true]} />
        <meshStandardMaterial color="#aab0b9" metalness={0.9} roughness={0.45} wireframe side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[r * 0.97, r * 0.97, w * 0.9, 28, 1, true]} />
        <meshStandardMaterial color="#555a62" metalness={0.8} roughness={0.7} transparent opacity={0.28} side={THREE.DoubleSide} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, 0, (s * w) / 2]}>
          <torusGeometry args={[r, 0.022, 8, 32]} />
          <Alu />
        </mesh>
      ))}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, w + 0.06, 12]} />
        <Alu />
      </mesh>
    </group>
  )
}

/* ---------- 1. Surveyor 1 ---------- */
export function Surveyor() {
  const feet = [0, 1, 2].map((k) => {
    const ang = (k / 3) * Math.PI * 2 + Math.PI / 6
    return { c: Math.cos(ang), s: Math.sin(ang) }
  })
  return (
    <group scale={1.25}>
      {feet.map(({ c, s }, i) => (
        <group key={i}>
          <Strut a={[c * 1.5, 0.1, s * 1.5]} b={[c * 0.25, 1.0, s * 0.25]} r={0.045} />
          <Strut a={[c * 0.9, 0.55, s * 0.9]} b={[c * 0.1, 0.6, s * 0.1]} r={0.02} />
          <mesh position={[c * 1.5, 0.05, s * 1.5]}>
            <cylinderGeometry args={[0.2, 0.26, 0.1, 16]} />
            <Alu />
          </mesh>
        </group>
      ))}
      {/* Equipment bays */}
      <mesh position={[0, 0.95, 0]}>
        <cylinderGeometry args={[0.38, 0.45, 0.4, 3]} />
        <Paint />
      </mesh>
      <mesh position={[0, 1.15, 0]} rotation={[0, Math.PI / 6, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.6, 3]} />
        <Foil />
      </mesh>
      {/* Mast + hexagonal solar panel */}
      <Strut a={[0, 1.3, 0]} b={[0, 2.1, 0]} r={0.035} />
      <mesh position={[0, 2.15, 0]} rotation={[0.12, 0, 0.05]}>
        <cylinderGeometry args={[0.62, 0.62, 0.04, 6]} />
        <Panel />
      </mesh>
      <mesh position={[0, 2.18, 0]} rotation={[0.12, 0, 0.05]}>
        <cylinderGeometry args={[0.62, 0.62, 0.005, 6]} />
        <meshStandardMaterial color="#8fa6d8" wireframe />
      </mesh>
      {/* Planar antenna + camera */}
      <mesh position={[0.5, 1.5, 0.2]} rotation={[0, 0, -0.4]}>
        <boxGeometry args={[0.45, 0.03, 0.3]} />
        <Alu />
      </mesh>
      <Strut a={[0.15, 1.25, 0.05]} b={[0.45, 1.45, 0.2]} r={0.015} />
      <mesh position={[-0.2, 1.55, -0.1]}>
        <cylinderGeometry args={[0.08, 0.08, 0.28, 12]} />
        <Dark />
      </mesh>
    </group>
  )
}

/* ---------- Shared GLTF loader/normalizer ---------- */
function GltfRelic({ url, targetWidth = 3.4, position = [0, 0.02, 0], rotation = [0, 0, 0] }) {
  const { scene } = useGLTF(url)
  const { cloned, offset, scale } = useMemo(() => {
    const c = scene.clone(true)
    c.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true
        node.receiveShadow = true
        if (node.material) {
          node.material.roughness = Math.min(node.material.roughness ?? 0.5, 0.65)
          node.material.envMapIntensity = 1.2
        }
      }
    })

    // Compute precise bounding box to center horizontally & place lowest point flush on pedestal
    const box = new THREE.Box3().setFromObject(c)
    const center = new THREE.Vector3()
    const size = new THREE.Vector3()
    box.getCenter(center)
    box.getSize(size)

    const s = targetWidth / (Math.max(size.x, size.z) || 1)
    const ox = -center.x * s
    const oy = -box.min.y * s
    const oz = -center.z * s

    return { cloned: c, offset: [ox, oy, oz], scale: s }
  }, [scene, targetWidth])

  return (
    <group position={position} rotation={rotation}>
      <primitive object={cloned} scale={scale} position={offset} />
    </group>
  )
}

/* ---------- 2. Apollo 11 Lunar Module (3D GLTF) ---------- */
export function Apollo11() {
  return (
    <GltfRelic
      url="/models/apollo_11_lunar_module.glb"
      targetWidth={3.4}
      position={[0, 0.02, 0]}
      rotation={[0, -Math.PI / 4, 0]}
    />
  )
}
useGLTF.preload('/models/apollo_11_lunar_module.glb')

/* ---------- 3. Apollo 15 Lunar Roving Vehicle ---------- */
export function LunarRover() {
  return (
    <group scale={1.25} position={[0, 0.02, 0]}>
      {[
        [1.1, 0.4, 0.95],
        [1.1, 0.4, -0.95],
        [-1.1, 0.4, 0.95],
        [-1.1, 0.4, -0.95],
      ].map((p, i) => (
        <MeshWheel key={i} position={p} />
      ))}
      {/* chassis frame */}
      <mesh position={[0, 0.78, 0]}>
        <boxGeometry args={[2.5, 0.08, 1.15]} />
        <Alu />
      </mesh>
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[1.0, 0.18, 0.9]} />
        <Dark />
      </mesh>
      {[0.95, -0.95].map((z) => (
        <group key={z}>
          <Strut a={[1.1, 0.4, z]} b={[0.7, 0.78, z * 0.55]} r={0.03} />
          <Strut a={[-1.1, 0.4, z]} b={[-0.7, 0.78, z * 0.55]} r={0.03} />
          <mesh position={[1.1, 0.88, z]}>
            <boxGeometry args={[0.9, 0.025, 0.3]} />
            <Paint />
          </mesh>
          <mesh position={[-1.1, 0.88, z]}>
            <boxGeometry args={[0.9, 0.025, 0.3]} />
            <Paint />
          </mesh>
        </group>
      ))}
      {/* seats */}
      {[0.28, -0.28].map((z) => (
        <group key={z} position={[0.0, 0.9, z]}>
          <mesh>
            <boxGeometry args={[0.36, 0.05, 0.4]} />
            <meshStandardMaterial color="#8a97ad" roughness={0.8} metalness={0.2} />
          </mesh>
          <mesh position={[-0.2, 0.22, 0]} rotation={[0, 0, 0.15]}>
            <boxGeometry args={[0.05, 0.42, 0.4]} />
            <meshStandardMaterial color="#8a97ad" roughness={0.8} metalness={0.2} />
          </mesh>
        </group>
      ))}
      {/* control console, mast & high-gain dish */}
      <mesh position={[0.65, 1.05, 0]}>
        <boxGeometry args={[0.12, 0.3, 0.38]} />
        <Dark />
      </mesh>
      <Strut a={[0.9, 0.85, -0.05]} b={[0.9, 1.9, -0.05]} r={0.025} />
      <mesh position={[0.9, 1.95, -0.05]} rotation={[0.2, 0, -0.5]}>
        <sphereGeometry args={[0.5, 24, 8, 0, Math.PI * 2, 0, Math.PI / 2.6]} />
        <meshStandardMaterial color="#e1e4e9" metalness={0.6} roughness={0.25} side={THREE.DoubleSide} />
      </mesh>
      {/* TV camera on the front */}
      <Strut a={[1.3, 0.8, 0]} b={[1.3, 1.2, 0]} r={0.02} />
      <mesh position={[1.3, 1.28, 0]}>
        <boxGeometry args={[0.22, 0.16, 0.2]} />
        <Foil />
      </mesh>
      {/* tool rack */}
      <mesh position={[-1.0, 1.0, 0]}>
        <boxGeometry args={[0.5, 0.3, 0.7]} />
        <Foil color="#bfc4cd" metalness={0.8} />
      </mesh>
    </group>
  )
}

/* ---------- Rocker-bogie helper (Sojourner, Opportunity) ---------- */
function RockerBogie({ y = 0.35, zs = 0.9, xs = 0.85, body = 0.9, r = 0.32 }) {
  return (
    <group>
      {[zs, -zs].map((z) => (
        <group key={z}>
          <Wheel position={[-xs, y, z]} r={r} />
          <Wheel position={[0, y, z]} r={r} />
          <Wheel position={[xs, y, z]} r={r} />
          <Strut a={[-xs, y, z]} b={[-xs * 0.1, body * 0.85, z * 0.7]} r={0.035} />
          <Strut a={[xs, y, z]} b={[xs * 0.1, body * 0.7, z * 0.7]} r={0.035} />
          <Strut a={[0, y, z]} b={[xs * 0.1, body * 0.7, z * 0.7]} r={0.03} />
        </group>
      ))}
    </group>
  )
}

/* ---------- 4. Sojourner ---------- */
export function Sojourner() {
  return (
    <group scale={1.55} position={[0, 0.02, 0]}>
      <RockerBogie y={0.3} zs={0.62} xs={0.62} body={0.8} r={0.28} />
      <mesh position={[0, 0.88, 0]}>
        <boxGeometry args={[1.25, 0.45, 0.78]} />
        <Foil color="#c8a24a" roughness={0.38} />
      </mesh>
      {/* solar panel lid */}
      <mesh position={[0.02, 1.14, 0]} rotation={[0, 0, 0.04]}>
        <boxGeometry args={[1.25, 0.05, 0.8]} />
        <Panel />
      </mesh>
      <mesh position={[0.02, 1.175, 0]}>
        <boxGeometry args={[1.2, 0.004, 0.75]} />
        <meshStandardMaterial color="#8da2d2" wireframe />
      </mesh>
      {/* APXS spectrometer on the nose + whip antenna */}
      <mesh position={[-0.75, 0.78, 0]}>
        <boxGeometry args={[0.2, 0.2, 0.3]} />
        <Dark />
      </mesh>
      <Strut a={[0.55, 1.15, -0.3]} b={[0.55, 1.95, -0.3]} r={0.012} />
      <mesh position={[0.55, 1.97, -0.3]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <Alu />
      </mesh>
      {/* cameras */}
      <mesh position={[-0.65, 1.05, 0.25]}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <Dark />
      </mesh>
      <mesh position={[-0.65, 1.05, -0.25]}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <Dark />
      </mesh>
    </group>
  )
}

/* ---------- 5. Opportunity ---------- */
export function Opportunity() {
  return (
    <group scale={1.2} position={[0, 0.02, 0]}>
      <RockerBogie y={0.38} zs={1.15} xs={0.95} body={1.0} r={0.36} />
      {/* warm electronics box */}
      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={[1.7, 0.55, 1.2]} />
        <Paint color="#c9b79c" roughness={0.5} />
      </mesh>
      {/* deck + wings, dust-tinted */}
      <mesh position={[0, 1.32, 0]}>
        <boxGeometry args={[1.9, 0.05, 1.6]} />
        <DustPanel />
      </mesh>
      {[1, -1].map((s) => (
        <group key={s}>
          <mesh position={[0, 1.28, s * 1.2]} rotation={[s * 0.06, 0, 0]}>
            <boxGeometry args={[1.9, 0.04, 0.9]} />
            <DustPanel />
          </mesh>
          <mesh position={[0, 1.31, s * 1.2]} rotation={[s * 0.06, 0, 0]}>
            <boxGeometry args={[1.85, 0.004, 0.85]} />
            <meshStandardMaterial color="#9a7078" wireframe />
          </mesh>
        </group>
      ))}
      {/* Pancam mast */}
      <Strut a={[0.65, 1.35, 0.3]} b={[0.65, 2.45, 0.3]} r={0.04} />
      <mesh position={[0.65, 2.52, 0.3]}>
        <boxGeometry args={[0.2, 0.16, 0.55]} />
        <Dark />
      </mesh>
      {/* high-gain antenna */}
      <Strut a={[-0.55, 1.35, -0.3]} b={[-0.55, 1.75, -0.3]} r={0.03} />
      <mesh position={[-0.55, 1.85, -0.3]} rotation={[-0.5, 0, 0.4]}>
        <cylinderGeometry args={[0.32, 0.32, 0.04, 24]} />
        <Alu />
      </mesh>
      {/* robotic arm */}
      <Strut a={[-0.85, 0.95, 0.55]} b={[-1.3, 0.55, 0.4]} r={0.04} />
      <mesh position={[-1.35, 0.5, 0.4]}>
        <boxGeometry args={[0.22, 0.2, 0.2]} />
        <Dark />
      </mesh>
    </group>
  )
}

/* ---------- 6. InSight (3D GLTF) ---------- */
export function InSight() {
  return (
    <GltfRelic
      url="/models/insight_lander.glb"
      targetWidth={6.8}
      position={[0, 0.02, 0]}
    />
  )
}
useGLTF.preload('/models/insight_lander.glb')

export const MODELS = {
  surveyor: Surveyor,
  apollo11: Apollo11,
  rover: LunarRover,
  sojourner: Sojourner,
  opportunity: Opportunity,
  insight: InSight,
}

