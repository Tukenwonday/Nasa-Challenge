import { useMemo } from 'react'
import * as THREE from 'three'

function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Procedural cratered regolith texture (used as colour + bump). */
function makeRegolithTexture(seed, base) {
  const size = 512
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')
  const rnd = mulberry32(seed)
  g.fillStyle = base
  g.fillRect(0, 0, size, size)
  for (let i = 0; i < 160; i++) {
    const x = rnd() * size
    const y = rnd() * size
    const r = 6 + rnd() * rnd() * 70
    const grad = g.createRadialGradient(x, y, r * 0.1, x, y, r)
    grad.addColorStop(0, 'rgba(0,0,0,0.42)')
    grad.addColorStop(0.72, 'rgba(0,0,0,0.12)')
    grad.addColorStop(0.88, 'rgba(255,255,255,0.28)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grad
    g.beginPath()
    g.arc(x, y, r, 0, Math.PI * 2)
    g.fill()
  }
  const img = g.getImageData(0, 0, size, size)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rnd() - 0.5) * 34
    img.data[i] += n
    img.data[i + 1] += n
    img.data[i + 2] += n
  }
  g.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.anisotropy = 4
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

const PALETTE = {
  moon: { base: '#7c7f86', tint: '#9a9da4', accent: '#C4C9D1', seed: 11 },
  mars: { base: '#8a4529', tint: '#a85a38', accent: '#C65D3B', seed: 29 },
}

/** Circular planetary pedestal with cratered regolith top, scattered rocks and a glowing rim. */
export default function Pedestal({ body, radius = 3.2 }) {
  const pal = PALETTE[body]
  const tex = useMemo(() => makeRegolithTexture(pal.seed, pal.base), [pal])
  const rocks = useMemo(() => {
    const rnd = mulberry32(pal.seed * 7)
    return Array.from({ length: 34 }, () => {
      const a = rnd() * Math.PI * 2
      const d = 2.0 + rnd() * (radius - 2.35)
      const s = 0.04 + rnd() * rnd() * 0.18
      return { p: [Math.cos(a) * d, s * 0.35, Math.sin(a) * d], s, r: [rnd() * 3, rnd() * 3, rnd() * 3] }
    })
  }, [pal, radius])

  return (
    <group>
      {/* top disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[radius, 96]} />
        <meshStandardMaterial map={tex} bumpMap={tex} bumpScale={2.2} color={pal.tint} roughness={0.95} metalness={0} />
      </mesh>
      {/* base column */}
      <mesh position={[0, -0.35, 0]} receiveShadow>
        <cylinderGeometry args={[radius, radius * 1.04, 0.7, 96, 1, true]} />
        <meshStandardMaterial color="#121216" metalness={0.8} roughness={0.35} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -0.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 1.04, 0.012, 8, 128]} />
        <meshBasicMaterial color={pal.accent} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.005, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.018, 8, 128]} />
        <meshBasicMaterial color={pal.accent} toneMapped={false} />
      </mesh>
      {/* outer wireframe orbit ring */}
      <mesh position={[0, -0.7, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius * 1.35, radius * 1.355, 160]} />
        <meshBasicMaterial color={pal.accent} transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
      {rocks.map((r, i) => (
        <mesh key={i} position={r.p} rotation={r.r} scale={[r.s, r.s * 0.65, r.s]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={pal.tint} roughness={1} flatShading />
        </mesh>
      ))}
    </group>
  )
}

