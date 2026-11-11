import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Environment, Lightformer, Stars, Grid, Float } from '@react-three/drei'
import * as THREE from 'three'
import { RELICS, ACCENTS } from '../data/relics.js'
import { MODELS } from './Relics.jsx'
import Pedestal from './Pedestal.jsx'
import { AmbientDust, DustBurst } from './Particles.jsx'

const SPACING = 34
const OVERVIEW_DIST = 27
const OVERVIEW_DIST_PORTRAIT = 30
const Y_AXIS = new THREE.Vector3(0, 1, 0)
const FOCUS_DIST = 12


/** Year pin shown above each relic in the overview (canvas texture: no fonts / DOM needed). */
function Label({ relic, overview, hidden }) {
  const mat = useRef()
  const accent = ACCENTS[relic.body]
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 512
    c.height = 320
    const g = c.getContext('2d')
    g.textAlign = 'center'
    g.fillStyle = accent
    g.font = '600 46px ui-monospace, Consolas, monospace'
    if ('letterSpacing' in g) g.letterSpacing = '8px'
    g.fillText(String(relic.year), 256, 70)
    const grad = g.createLinearGradient(0, 100, 0, 320)
    grad.addColorStop(0, accent)
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = grad
    g.fillRect(255, 100, 2, 220)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 4
    return t
  }, [relic, accent])

  useFrame((_, dt) => {
    mat.current.opacity = THREE.MathUtils.damp(mat.current.opacity, overview && !hidden ? 0.75 : 0, 5, Math.min(dt, 0.05))
  })

  return (
    <sprite position={[0, 8, 0]} scale={[10, 6.25, 1]}>
      <spriteMaterial ref={mat} map={tex} transparent opacity={0} depthWrite={false} depthTest={false} toneMapped={false} />
    </sprite>
  )
}

function Relic({ relic, index, active, worldRef, overview, onRelicClick, onHover, hoverRef }) {
  const group = useRef()
  const lift = useRef()
  const [hot, setHot] = useState(false)
  const Model = MODELS[relic.model]

  useEffect(() => {
    group.current.traverse((o) => {
      if (o.isMesh && !o.userData.noShadow) {
        o.castShadow = true
        o.receiveShadow = true
      }
    })
    return () => (document.body.style.cursor = '')
  }, [])

  useFrame((_, dt) => {
    dt = Math.min(dt, 0.05)
    const w = worldRef.current
    const spread = w.userData.spread ?? 0.45
    group.current.position.x = index * SPACING * spread
    group.current.visible = Math.abs(w.position.x + group.current.position.x * w.scale.x) < 24
    // gentle "lift" when hovered in the overview
    const t = hot && overview
    lift.current.scale.setScalar(THREE.MathUtils.damp(lift.current.scale.x, t ? 1.14 : 1, 6, dt))
    lift.current.position.y = THREE.MathUtils.damp(lift.current.position.y, t ? 0.5 : 0, 6, dt)
  })

  const interactive = () => group.current.visible && (overview || active)

  return (
    <group ref={group} position={[index * SPACING, 0, 0]}>
      <Pedestal body={relic.body} />
      <group ref={lift}>
        <Model />
      </group>
      <Label relic={relic} overview={overview} hidden={hot} />
      {/* invisible hit volume for hover / click */}
      <mesh
        position={[0, 2.2, 0]}
        userData={{ noShadow: true }}
        onPointerOver={(e) => {
          if (!interactive()) return
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
          setHot(true)
          if (overview) {
            hoverRef.current = index
            onHover(index)
          }
        }}
        onPointerOut={() => {
          document.body.style.cursor = ''
          setHot(false)
          if (hoverRef.current === index) {
            hoverRef.current = -1
            onHover(null)
          }
        }}
        onClick={(e) => {
          if (!interactive()) return
          e.stopPropagation()
          onRelicClick(index)
        }}
      >
        <cylinderGeometry args={[3.4, 3.4, 5.4, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}

/** Slides/scales the world; also projects the hovered relic's head to screen space for the DOM hover card. */
function World({ index, overview, burstKey, onRelicClick, onHover, hoverRef, cardRef }) {
  const worldRef = useRef()
  const { size, camera } = useThree()
  const proj = useRef({ v: new THREE.Vector3(), x: 0, y: 0, had: false })
  const portrait = size.width / size.height < 0.8
  useFrame((_, dt) => {
    dt = Math.min(dt, 0.05)
    const s = overview ? (portrait ? 0.2 : 0.3) : 1
    const w = worldRef.current
    const spread = THREE.MathUtils.damp(w.userData.spread ?? 0.45, overview ? 0.45 : 1, 2.4, dt)
    w.userData.spread = spread
    const x = overview ? (-(RELICS.length - 1) / 2) * SPACING * spread * s : -index * SPACING * spread
    w.scale.setScalar(THREE.MathUtils.damp(w.scale.x, s, 2.4, dt))
    w.position.x = THREE.MathUtils.damp(w.position.x, x, 2.4, dt)

    const p = proj.current
    const el = cardRef.current
    const hi = hoverRef.current
    if (el) {
      if (hi >= 0 && overview) {
        w.updateMatrixWorld()
        p.v.set(hi * SPACING * spread, 4.6, 0)
        w.localToWorld(p.v)
        p.v.project(camera)
        const px = (p.v.x * 0.5 + 0.5) * size.width
        const py = (-p.v.y * 0.5 + 0.5) * size.height
        if (!p.had) {
          p.x = px
          p.y = py
          p.had = true
        } else {
          p.x = THREE.MathUtils.damp(p.x, px, 14, dt)
          p.y = THREE.MathUtils.damp(p.y, py, 14, dt)
        }
        el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`
      } else p.had = false
    }
  })
  return (
    <>
      <group ref={worldRef} scale={0.3} position={[-2.5 * SPACING * 0.45 * 0.3, 0, 0]}>
        {RELICS.map((r, i) => (
          <Relic
            key={r.id}
            relic={r}
            index={i}
            active={i === index}
            worldRef={worldRef}
            overview={overview}
            onRelicClick={onRelicClick}
            onHover={onHover}
            hoverRef={hoverRef}
          />
        ))}
      </group>
      <DustBurst burstKey={burstKey} />
    </>
  )
}
/** Cinematic zoom between overview and focus + HUD-aware viewport offset. */
function Rig({ overview, panel, controls }) {
  const { camera, size } = useThree()
  const off = useRef({ x: 0, y: 0 })
  useFrame((_, dt) => {
    dt = Math.min(dt, 0.05)
    const c = controls.current
    if (!c) return
    const d = camera.position.length()
    c.minDistance = 8
    c.enableZoom = !overview
    c.autoRotate = !overview
    if (overview) {
      // ease the view back to a frontal azimuth so the six relics line up cleanly
      camera.position.applyAxisAngle(Y_AXIS, -c.getAzimuthalAngle() * (1 - Math.exp(-dt * 2)))
      const portraitView = size.width / size.height < 0.8
      camera.position.setLength(THREE.MathUtils.damp(d, portraitView ? OVERVIEW_DIST_PORTRAIT : OVERVIEW_DIST, 2.2, dt))
      c.maxDistance = 60
    } else if (d > 15.05) {
      const nd = THREE.MathUtils.damp(d, FOCUS_DIST, 2.2, dt)
      camera.position.setLength(nd)
      c.maxDistance = Math.max(15, nd)
    } else c.maxDistance = 15

    const desktop = size.width >= 768
    const tx = overview || !desktop || !panel ? 0 : Math.min(230, size.width * 0.18)
    const ty = overview || desktop || !panel ? 0 : size.height * 0.16
    off.current.x = THREE.MathUtils.damp(off.current.x, tx, 3, dt)
    off.current.y = THREE.MathUtils.damp(off.current.y, ty, 3, dt)
    const fov = size.width / size.height < 0.8 ? 66 : size.width < 768 ? 48 : 36
    camera.fov = fov
    camera.setViewOffset(size.width, size.height, off.current.x, off.current.y, size.width, size.height)
  })
  return null
}

function Lights({ body }) {
  const key = useRef()
  const rim = useRef()
  const target = useRef(new THREE.Color())
  useFrame((_, dt) => {
    const mars = body === 'mars'
    target.current.set(mars ? '#ffd2b0' : '#f4f6ff')
    key.current.color.lerp(target.current, 1 - Math.exp(-dt * 3))
    key.current.intensity = THREE.MathUtils.damp(key.current.intensity, mars ? 2.4 : 3.2, 3, dt)
    target.current.set(mars ? '#c65d3b' : '#9fb4d8')
    rim.current.color.lerp(target.current, 1 - Math.exp(-dt * 3))
  })
  return (
    <>
      <ambientLight intensity={0.12} />
      <directionalLight
        ref={key}
        position={[6, 9, 5]}
        intensity={3}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-camera-near={1}
        shadow-camera-far={25}
        shadow-bias={-0.0004}
      />
      <pointLight ref={rim} position={[-6, 2.5, -6]} intensity={40} distance={22} decay={1.6} />
    </>
  )
}

export default function Scene({ index, burstKey, panel, onRelicClick, onHover, hoverRef, cardRef }) {
  const overview = index < 0
  const relic = RELICS[Math.max(index, 0)]
  const controls = useRef()
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [2, 14, 36], fov: 36, near: 0.1, far: 160 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      aria-label={overview ? 'Overview of all six relics' : `3D model of ${relic.name}`}
    >
      <color attach="background" args={['#08080A']} />
      <fog attach="fog" args={['#08080A', 40, 110]} />
      <Suspense fallback={null}>
        <Environment resolution={256} frames={1} environmentIntensity={0.7}>
          <Lightformer form="rect" intensity={3} position={[-6, 5, -3]} scale={[10, 4, 1]} color="#cfd6e4" />
          <Lightformer form="rect" intensity={2} position={[6, 3, 6]} scale={[8, 3, 1]} color="#ffe2cc" />
          <Lightformer form="ring" intensity={1.5} position={[0, 9, 0]} scale={6} color="#ffffff" />
          <Lightformer form="rect" intensity={0.8} position={[0, -3, 6]} scale={[12, 2, 1]} color="#c65d3b" />
        </Environment>
        <Lights body={relic.body} />
        <Stars radius={90} depth={50} count={1800} factor={2.6} saturation={0} fade speed={0.4} />
        <Grid
          position={[0, -0.72, 0]}
          infiniteGrid
          fadeDistance={overview ? 90 : 34}
          fadeStrength={2.5}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#2a2d34"
          sectionSize={5}
          sectionThickness={0.9}
          sectionColor={relic.body === 'mars' && !overview ? '#6a3322' : '#4a4f5a'}
        />
        <World index={index} overview={overview} burstKey={burstKey} onRelicClick={onRelicClick} onHover={onHover} hoverRef={hoverRef} cardRef={cardRef} />
        <AmbientDust body={relic.body} />
      </Suspense>
      <Rig overview={overview} panel={panel} controls={controls} />
      <OrbitControls
        ref={controls}
        enablePan={false}
        enableDamping
        dampingFactor={0.06}
        rotateSpeed={0.55}
        zoomSpeed={0.6}
        minPolarAngle={0.85}
        maxPolarAngle={1.5}
        autoRotate
        autoRotateSpeed={0.7}
      />
    </Canvas>
  )
}



