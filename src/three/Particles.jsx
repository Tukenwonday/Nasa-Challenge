import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const COUNT = 1400
const BOX = [34, 12, 34]

/** Ambient drifting lunar dust (slow sink) or Martian wind specks (lateral streaks). */
export function AmbientDust({ body }) {
  const ref = useRef()
  const matRef = useRef()
  const target = useMemo(() => new THREE.Color(), [])
  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3)
    const speeds = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * BOX[0]
      positions[i * 3 + 1] = Math.random() * BOX[1] - 1
      positions[i * 3 + 2] = (Math.random() - 0.5) * BOX[2]
      speeds[i] = 0.3 + Math.random()
    }
    return { positions, speeds }
  }, [])

  useFrame((_, dt) => {
    dt = Math.min(dt, 0.05)
    const mars = body === 'mars'
    const arr = ref.current.geometry.attributes.position.array
    for (let i = 0; i < COUNT; i++) {
      const s = speeds[i]
      if (mars) {
        arr[i * 3] += dt * (1.6 + s * 1.8)
        arr[i * 3 + 1] += Math.sin(arr[i * 3] * 0.7 + s * 6) * dt * 0.25
        arr[i * 3 + 2] += dt * 0.35 * s
      } else {
        arr[i * 3] += dt * 0.05 * s
        arr[i * 3 + 1] -= dt * 0.1 * s
        arr[i * 3 + 2] += dt * 0.04
      }
      if (arr[i * 3] > BOX[0] / 2) arr[i * 3] -= BOX[0]
      if (arr[i * 3 + 2] > BOX[2] / 2) arr[i * 3 + 2] -= BOX[2]
      if (arr[i * 3 + 1] < -1) arr[i * 3 + 1] += BOX[1]
      if (arr[i * 3 + 1] > BOX[1] - 1) arr[i * 3 + 1] -= BOX[1]
    }
    ref.current.geometry.attributes.position.needsUpdate = true
    target.set(mars ? '#d77a52' : '#c4c9d1')
    matRef.current.color.lerp(target, 1 - Math.exp(-dt * 2.5))
    matRef.current.opacity = THREE.MathUtils.damp(matRef.current.opacity, mars ? 0.55 : 0.4, 2, dt)
  })

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial ref={matRef} size={0.045} sizeAttenuation transparent opacity={0.4} depthWrite={false} color="#c4c9d1" />
    </points>
  )
}

const B_COUNT = 220

/** One-shot dust burst emitted from the active relic's solar panels. */
export function DustBurst({ burstKey }) {
  const ref = useRef()
  const matRef = useRef()
  const start = useRef(-1)
  const data = useMemo(() => {
    const pos = new Float32Array(B_COUNT * 3)
    const vel = new Float32Array(B_COUNT * 3)
    return { pos, vel }
  }, [])

  useEffect(() => {
    if (!burstKey) return
    const { pos, vel } = data
    for (let i = 0; i < B_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 2.4
      pos[i * 3 + 1] = 1.4 + Math.random() * 0.5
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2.4
      const a = Math.random() * Math.PI * 2
      const sp = 1.2 + Math.random() * 2.6
      vel[i * 3] = Math.cos(a) * sp
      vel[i * 3 + 1] = 0.8 + Math.random() * 2.0
      vel[i * 3 + 2] = Math.sin(a) * sp
    }
    start.current = 0
    if (ref.current) {
      ref.current.visible = true
      ref.current.geometry.attributes.position.needsUpdate = true
    }
  }, [burstKey, data])

  useFrame((_, dt) => {
    if (start.current < 0 || !ref.current) return
    dt = Math.min(dt, 0.05)
    start.current += dt
    const t = start.current
    const { pos, vel } = data
    for (let i = 0; i < B_COUNT; i++) {
      vel[i * 3] *= 0.985
      vel[i * 3 + 1] -= dt * 0.9
      vel[i * 3 + 2] *= 0.985
      pos[i * 3] += vel[i * 3] * dt
      pos[i * 3 + 1] += vel[i * 3 + 1] * dt
      pos[i * 3 + 2] += vel[i * 3 + 2] * dt
    }
    ref.current.geometry.attributes.position.needsUpdate = true
    matRef.current.opacity = Math.max(0, 1 - t / 2.2)
    if (t > 2.2) {
      start.current = -1
      ref.current.visible = false
    }
  })

  return (
    <points ref={ref} visible={false} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.pos, 3]} />
      </bufferGeometry>
      <pointsMaterial ref={matRef} size={0.09} sizeAttenuation transparent depthWrite={false} color="#e08a5e" />
    </points>
  )
}

