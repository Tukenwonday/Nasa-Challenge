import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Wind, Zap } from 'lucide-react'
import { sfx } from '../lib/audio.js'

/** "Attempt Solar Panel Clearing": drag the slider to the end to trigger a dust burst. */
export default function DustWiper({ data, accent, onBurst, resetKey }) {
  const [val, setVal] = useState(0)
  const [cleared, setCleared] = useState(false)
  const valRef = useRef(0)
  const timers = useRef([])

  const set = (v) => {
    valRef.current = v
    setVal(v)
  }

  const clearTimers = () => {
    timers.current.forEach((t) => {
      clearTimeout(t)
      clearInterval(t)
    })
    timers.current = []
  }

  const springBack = () => {
    const iv = setInterval(() => {
      const next = valRef.current * 0.82
      if (next < 0.6) {
        clearInterval(iv)
        set(0)
      } else set(next)
    }, 16)
    timers.current.push(iv)
  }

  // Reset when switching relic
  useEffect(() => {
    clearTimers()
    set(0)
    setCleared(false)
    return clearTimers
  }, [resetKey])

  const release = () => {
    if (cleared) return
    if (valRef.current >= 95) {
      set(100)
      setCleared(true)
      onBurst()
      sfx.dust()
      timers.current.push(
        setTimeout(() => {
          setCleared(false)
          springBack()
        }, 5000),
      )
    } else springBack()
  }

  const f = (val / 100) * data.cleanFrac
  const watts = data.dustyW + (data.cleanW - data.dustyW) * f
  const volts = data.dustyV + (data.cleanV - data.dustyV) * f
  const ok = watts >= data.thresholdW && volts >= data.requiredV
  const pct = Math.min(100, (watts / data.cleanW) * 100)
  const thrPct = (data.thresholdW / data.cleanW) * 100

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-3.5" style={{ '--accent': accent }}>
      <div className="flex items-center justify-between mb-1">
        <span className="hud-label text-silver/70 flex items-center gap-1.5">
          <Wind size={12} /> Attempt Solar Panel Clearing
        </span>
        <span className="hud-label" style={{ color: cleared ? '#8fd6a3' : accent }}>
          {cleared ? 'Burst' : `${Math.round(val)}%`}
        </span>
      </div>
      <input
        type="range"
        className="wiper"
        min={0}
        max={100}
        step={1}
        value={val}
        disabled={cleared}
        aria-label="Drag to the end to clear dust from solar panels"
        onChange={(e) => set(Number(e.target.value))}
        onPointerUp={release}
        onKeyUp={release}
        onBlur={() => !cleared && springBack()}
      />
      <div className="grid grid-cols-2 gap-3 text-[11px]">
        <div>
          <div className="hud-label text-silver/50 mb-0.5">Array output</div>
          <div className="font-mono text-base text-white tabular-nums">{watts.toFixed(1)} W</div>
        </div>
        <div>
          <div className="hud-label text-silver/50 mb-0.5">Bus voltage</div>
          <div className="font-mono text-base text-white tabular-nums">
            {volts.toFixed(1)} V <span className="text-silver/40 text-[10px]">/ {data.requiredV} V req.</span>
          </div>
        </div>
      </div>
      <div className="relative h-1.5 rounded-full bg-white/10 mt-3 overflow-hidden">
        <motion.div className="h-full rounded-full" style={{ width: `${pct}%`, background: ok ? '#8fd6a3' : accent }} />
        <div className="absolute top-0 bottom-0 w-px bg-white/70" style={{ left: `${thrPct}%` }} />
      </div>
      <div className="flex items-center justify-between mt-2 text-[10px]">
        <span className={`hud-label flex items-center gap-1 ${ok ? 'text-[#8fd6a3]' : 'text-silver/60'}`} style={{ letterSpacing: '0.14em' }}>
          <Zap size={11} /> {ok ? 'Recharge threshold met' : 'Below recharge threshold'}
        </span>
        <span className="text-silver/40">sim · illustrative</span>
      </div>
    </div>
  )
}

