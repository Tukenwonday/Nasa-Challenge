import { Component, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Volume2, VolumeX, ZoomOut, Monitor } from 'lucide-react'
import Scene from './three/Scene.jsx'
import Timeline from './components/Timeline.jsx'
import StoryCard from './components/StoryCard.jsx'
import { HoverCard, Teaser } from './components/Popups.jsx'
import { RELICS } from './data/relics.js'
import * as audio from './lib/audio.js'
import { useRemoteSync } from './lib/remoteSync.js'

class ErrorBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (this.state.failed)
      return (
        <div className="absolute inset-0 grid place-items-center text-center px-6 text-silver/70">
          <p className="hud-label">WebGL is unavailable on this device — the story panel still works.</p>
        </div>
      )
    return this.props.children
  }
}

/**
 * Mobile Blocker: Shown when user visits on a mobile screen or device.
 */
function MobileBlocker() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 text-center bg-[#08080A] text-silver select-none">
      <div className="w-16 h-16 rounded-2xl border border-terracotta/40 bg-terracotta/10 flex items-center justify-center text-terracotta mb-5 shadow-lg shadow-terracotta/10">
        <Monitor size={32} />
      </div>
      <p className="hud-label text-terracotta text-xs mb-2">Desktop Required</p>
      <h2 className="text-2xl font-light text-white tracking-tight max-w-xs">
        Can’t open on mobile
      </h2>
      <p className="text-sm text-silver/65 mt-2.5 max-w-xs leading-relaxed">
        Please open this experience from a desktop or laptop browser to view the 3D telemetry and timeline.
      </p>
      <div className="mt-8 border-t border-white/10 pt-4 text-[10px] hud-label text-silver/40">
        NASA Space Apps Challenge 2026
      </div>
    </div>
  )
}

/**
 * Opening typing animation on solid black void background:
 * Types out "Nasa Challenge" before the app and 3D world reveal.
 */
function TypeIntro({ onFinish }) {
  const fullText = 'Nasa Challenge'
  const [displayed, setDisplayed] = useState('')

  useEffect(() => {
    let index = 0
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        index++
        setDisplayed(fullText.slice(0, index))
        if (index >= fullText.length) {
          clearInterval(interval)
          setTimeout(() => {
            onFinish()
          }, 900)
        }
      }, 75)
      return () => clearInterval(interval)
    }, 300)

    return () => clearTimeout(timeout)
  }, [onFinish])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto select-none bg-[#08080A]"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extralight tracking-wider text-white">
          {displayed}
        </h1>
        <motion.span
          className="inline-block w-0.5 sm:w-1 h-7 sm:h-11 ml-2.5 bg-terracotta"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ repeat: Infinity, duration: 0.65 }}
        />
      </div>
    </motion.div>
  )
}

export default function App() {
  const [isMobile, setIsMobile] = useState(false)
  const [index, setIndex] = useState(-1)
  const [entered, setEntered] = useState(false)
  const [muted, setMuted] = useState(false)
  const [burstKey, setBurstKey] = useState(0)
  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState(null)

  // Mobile device and viewport detection
  useEffect(() => {
    const checkMobile = () => {
      const userAgentMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const smallScreen = window.innerWidth < 768
      setIsMobile(userAgentMobile || smallScreen)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const hoverRef = useRef(-1)
  const cardRef = useRef(null)
  const lastHover = useRef(0)
  if (hover !== null) lastHover.current = hover
  const lockTimer = useRef(null)
  const indexRef = useRef(-1)
  const controlsRef = useRef(null)
  const resumeAutoRotateTimer = useRef(null)
  const overview = index < 0
  const relic = RELICS[Math.max(index, 0)]

  const go = useCallback((i) => {
    const next = Math.max(-1, Math.min(RELICS.length - 1, i))
    if (next === indexRef.current) return
    indexRef.current = next
    setIndex(next)
    hoverRef.current = -1
    setHover(null)
    document.body.style.cursor = ''
    if (next < 0) setOpen(false)
    audio.sfx.blip(Math.max(next, 0))
    audio.setBody(RELICS[Math.max(next, 0)].body)
    clearTimeout(lockTimer.current)
    if (next >= 0) lockTimer.current = setTimeout(() => audio.sfx.lock(), 1100)
  }, [])

  useEffect(() => () => clearTimeout(lockTimer.current), [])

  const onRelicClick = useCallback(
    (i) => {
      if (indexRef.current < 0) {
        go(i)
      } else if (i === indexRef.current) {
        setOpen((o) => !o)
      }
    },
    [go],
  )

  const openRef = useRef(false)
  openRef.current = open

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || (e.key === 'Enter' && t.tagName === 'BUTTON'))) return
      if (e.key === 'Escape') {
        if (openRef.current) setOpen(false)
        else go(-1)
      } else if (e.key === 'Enter') {
        if (indexRef.current < 0) go(0)
        else setOpen((o) => !o)
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        go(indexRef.current + 1)
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        go(indexRef.current - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go])

  // Automatically start audio and reveal app when typing intro finishes
  const handleIntroFinish = useCallback(() => {
    audio.init()
    audio.setBody(RELICS[0].body)
    setEntered(true)
  }, [])

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev
      audio.setMuted(next)
      if (!next) {
        audio.init()
        setTimeout(() => audio.sfx.click(), 80)
      }
      return next
    })
  }, [])

  // Remote controller event handlers
  const handleRemoteNavigate = useCallback(
    (payload) => {
      const { action, targetIndex } = payload || {}
      if (action === 'NEXT') go(indexRef.current + 1)
      else if (action === 'PREV') go(indexRef.current - 1)
      else if (action === 'OVERVIEW') go(-1)
      else if (action === 'GO_TO_INDEX' && typeof targetIndex === 'number') go(targetIndex)
    },
    [go],
  )

  const handleRemoteRotate = useCallback((payload) => {
    const c = controlsRef.current
    if (!c) return
    const { dx, dy, phase } = payload || {}
    const SENSITIVITY = 1.6

    c.userData = c.userData || {}
    c.userData.manualRotating = true
    c.autoRotate = false

    clearTimeout(resumeAutoRotateTimer.current)
    if (phase === 'end') {
      resumeAutoRotateTimer.current = setTimeout(() => {
        if (controlsRef.current) {
          controlsRef.current.userData.manualRotating = false
          if (indexRef.current >= 0) {
            controlsRef.current.autoRotate = true
          }
        }
      }, 2500)
    }

    if (typeof dx === 'number' && typeof c.rotateLeft === 'function') {
      c.rotateLeft(dx * SENSITIVITY)
    }
    if (typeof dy === 'number' && typeof c.rotateUp === 'function') {
      c.rotateUp(dy * SENSITIVITY)
    }
    if (typeof c.update === 'function') {
      c.update()
    }
  }, [])

  const handleRemoteAction = useCallback(
    (action) => {
      audio.init()
      if (action === 'WIPE_DUST') {
        setBurstKey((k) => k + 1)
        audio.sfx.dust()
      } else if (action === 'PING_SIGNAL') {
        audio.sfx.lock()
      } else if (action === 'TOGGLE_AUDIO') {
        toggleMute()
      } else if (action === 'TOGGLE_DOSSIER') {
        if (indexRef.current >= 0) {
          setOpen((o) => !o)
          audio.sfx.click()
        }
      }
    },
    [toggleMute],
  )

  const syncPayload = useMemo(
    () => ({
      index,
      total: RELICS.length,
      overview: index < 0,
      relic: relic
        ? {
            id: relic.id,
            name: relic.name,
            year: relic.year,
            body: relic.body,
            title: relic.title,
            place: relic.place,
          }
        : null,
      panelOpen: open,
      muted,
    }),
    [index, relic, open, muted],
  )

  useRemoteSync({
    onNavigate: handleRemoteNavigate,
    onRotate: handleRemoteRotate,
    onAction: handleRemoteAction,
    state: syncPayload,
  })

  // If on mobile device or screen, block with dedicated message
  if (isMobile) {
    return <MobileBlocker />
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-void font-sans select-none">
      <ErrorBoundary>
        <div className="absolute inset-0">
          <Scene
            index={index}
            burstKey={burstKey}
            panel={open}
            onRelicClick={onRelicClick}
            onHover={setHover}
            hoverRef={hoverRef}
            cardRef={cardRef}
            controlsRef={controlsRef}
          />
        </div>
      </ErrorBoundary>

      {/* Cinematic vignette */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{ background: 'radial-gradient(ellipse at 38% 50%, transparent 40%, rgba(8,8,10,0.75) 100%)' }}
      />

      {/* Top Header Controls (Volume and Zoom-out) */}
      <header className="pointer-events-none absolute z-20 top-4 right-4 md:top-6 md:right-6 flex items-center gap-2">
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Zoom-Out to Overview button */}
          <AnimatePresence>
            {!overview && (
              <motion.button
                key="ov"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => go(-1)}
                aria-label="Back to overview (Esc)"
                title="Overview (Esc)"
                className="glass rounded-full w-10 h-10 grid place-items-center text-silver hover:text-white transition"
              >
                <ZoomOut size={16} />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Sound Toggle */}
          <button
            onClick={toggleMute}
            aria-label={muted ? 'Unmute audio' : 'Mute audio'}
            aria-pressed={muted}
            className="glass rounded-full w-10 h-10 grid place-items-center text-silver hover:text-white transition"
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      </header>

      {/* Story & Science Dossier Panel */}
      <StoryCard
        visible={!overview && open}
        onClose={() => setOpen(false)}
        relic={relic}
        index={Math.max(index, 0)}
        total={RELICS.length}
        onPrev={() => go(indexRef.current - 1)}
        onNext={() => go(indexRef.current + 1)}
        onBurst={() => setBurstKey((k) => k + 1)}
      />

      {/* Timeline Scrubber Rail */}
      <Timeline
        index={index}
        onSelect={go}
        shifted={!overview && open}
      />

      {/* Slim Teaser shown when zoomed in with panel closed */}
      <Teaser
        relic={relic}
        visible={!overview && !open}
        onOpen={() => setOpen(true)}
      />

      {/* 3D Overview Hover Popup directly above relic's head */}
      <HoverCard
        relic={RELICS[lastHover.current]}
        visible={overview && hover !== null}
        cardRef={cardRef}
      />

      {/* Typing Intro with solid black background before app loads */}
      <AnimatePresence>
        {!entered && <TypeIntro onFinish={handleIntroFinish} />}
      </AnimatePresence>
    </div>
  )
}
