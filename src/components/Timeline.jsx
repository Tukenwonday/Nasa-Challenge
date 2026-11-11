import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { RELICS, railPos, ACCENTS } from '../data/relics.js'

export function useSwipe(onPrev, onNext) {
  const start = useRef(null)
  return {
    onPointerDown: (e) => {
      if (e.pointerType === 'mouse') return
      start.current = { x: e.clientX, y: e.clientY }
    },
    onPointerUp: (e) => {
      const s = start.current
      start.current = null
      if (!s) return
      const dx = e.clientX - s.x
      const dy = e.clientY - s.y
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) (dx < 0 ? onNext : onPrev)()
    },
    onPointerCancel: () => (start.current = null),
    style: { touchAction: 'pan-y' },
  }
}

/** Minimal dot rail; hovering (or focusing) a dot reveals a small card. index -1 = overview. */
export default function Timeline({ index, onSelect, shifted }) {
  const [hover, setHover] = useState(null)
  const swipe = useSwipe(() => onSelect(index - 1), () => onSelect(index + 1))
  const accent = index >= 0 ? ACCENTS[RELICS[index].body] : '#C4C9D1'
  const fill = index >= 0 ? railPos(index) * 100 : 0

  return (
    <nav
      aria-label="Mission timeline"
      className={`pointer-events-none absolute z-20 bottom-4 left-0 right-0 md:bottom-6 flex justify-center transition-[right] duration-700 ${
        shifted ? 'md:right-[434px]' : ''
      }`}
    >
      <div className="pointer-events-auto glass rounded-full px-6 py-3 select-none" {...swipe}>
        <div className="relative h-4 w-[230px] sm:w-[280px]">
          <div className="absolute left-0 right-0 top-1/2 h-px bg-white/15" />
          <motion.div
            className="absolute left-0 top-1/2 h-px"
            style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
            animate={{ width: `${fill}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          />
          {RELICS.map((r, i) => {
            const active = i === index
            const c = ACCENTS[r.body]
            const lit = i <= index

            return (
              <div key={r.id} className="absolute top-1/2" style={{ left: `${railPos(i) * 100}%` }}>
                <button
                  onClick={() => onSelect(i)}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  aria-label={`${r.year} — ${r.name}`}
                  aria-current={active}
                  className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 grid place-items-center focus:outline-none"
                >
                  <motion.span
                    className="block rounded-full relative"
                    animate={{
                      width: active || hover === i ? 9 : 5,
                      height: active || hover === i ? 9 : 5,
                      backgroundColor: lit || hover === i ? c : 'rgba(255,255,255,0.3)',
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                    style={{
                      boxShadow: active
                        ? `0 0 0 4px ${c}30, 0 0 14px ${c}`
                        : 'none',
                    }}
                  />
                </button>
                <AnimatePresence>
                  {hover === i && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.94 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.96 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                      className="pointer-events-none absolute bottom-6 -translate-x-1/2 glass rounded-xl px-3.5 py-2 whitespace-nowrap text-center shadow-xl"
                      style={{ background: 'rgba(12,12,16,0.9)' }}
                    >
                      <div className="hud-label" style={{ color: c }}>
                        {r.year}
                      </div>
                      <div className="text-[12.5px] text-white mt-0.5">{r.name}</div>
                      <div className="text-[10.5px] text-silver/55">{r.place}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
