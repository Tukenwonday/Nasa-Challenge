import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, BookOpen } from 'lucide-react'
import { ACCENTS } from '../data/relics.js'

const EASE = [0.22, 1, 0.36, 1]

/**
 * Floating card that sits directly above the hovered relic's head in the 3D overview.
 * The outer div is positioned every frame by the 3D scene (via `cardRef`); the inner card animates in.
 */
export function HoverCard({ relic, visible, cardRef }) {
  if (!relic) return null
  const accent = ACCENTS[relic.body]

  return (
    <div ref={cardRef} className="pointer-events-none absolute left-0 top-0 z-30 will-change-transform" aria-hidden={!visible}>
      <div style={{ transform: 'translate(-50%, calc(-100% - 14px))' }}>
        <AnimatePresence>
          {visible && (
            <motion.div
              key="card"
              initial={{ opacity: 0, y: 18, scale: 0.9, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: 10, scale: 0.95, filter: 'blur(6px)' }}
              transition={{ type: 'spring', stiffness: 260, damping: 24, mass: 0.8 }}
              style={{ transformOrigin: '50% 100%' }}
              className="flex flex-col items-center"
            >
              <div
                className="glass relative w-[250px] sm:w-[280px] overflow-hidden rounded-2xl px-4 pt-3.5 pb-3 text-left shadow-2xl"
                style={{ background: 'rgba(12,12,16,0.85)' }}
              >
                <span className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
                <span className="pointer-events-none absolute -right-2 -top-3 select-none text-6xl font-extralight tracking-tighter" style={{ color: `${accent}18` }}>
                  {relic.year}
                </span>

                <div className="hud-label text-[9px]" style={{ color: accent }}>
                  {relic.year} · {relic.body === 'mars' ? 'Mars' : 'The Moon'}
                </div>

                <h3 className="mt-1.5 text-[17px] font-light leading-tight tracking-tight text-white">{relic.name}</h3>
                <p className="mt-1 text-[12px] italic text-silver/65">“{relic.title}”</p>

                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {relic.stats.slice(0, 2).map((s) => (
                    <span key={s.label} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10.5px] text-silver/80">
                      <s.icon size={10} style={{ color: accent }} /> {s.value}
                    </span>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2 text-[10.5px] text-silver/55">
                  <span className="truncate">{relic.place.split('·')[1]?.trim()}</span>
                  <span className="hud-label inline-flex items-center gap-1" style={{ color: accent, letterSpacing: '0.14em' }}>
                    Inspect <ArrowUpRight size={11} />
                  </span>
                </div>
              </div>

              {/* Glowing connector to the relic's 3D head */}
              <motion.span
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.08, duration: 0.35, ease: EASE }}
                className="block h-5 w-px origin-top"
                style={{ background: `linear-gradient(${accent}, transparent)` }}
              />
              <span className="block h-1.5 w-1.5 rounded-full" style={{ background: accent, boxShadow: `0 0 12px ${accent}` }} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/** Minimalist teaser shown when zoomed in and the full story panel is closed. */
export function Teaser({ relic, visible, onOpen }) {
  if (!relic) return null
  const accent = ACCENTS[relic.body]

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          key={relic.id}
          initial={{ opacity: 0, x: -24, filter: 'blur(8px)' }}
          animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, x: -16, filter: 'blur(6px)' }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.15 }}
          className="pointer-events-none absolute z-20 top-4 left-4 md:top-6 md:left-6 max-w-[280px] sm:max-w-xs"
        >
          <button
            onClick={onOpen}
            className="pointer-events-auto group glass relative overflow-hidden rounded-2xl p-4 text-left w-full shadow-2xl transition-all duration-300 hover:bg-white/[0.08] hover:border-white/20"
          >
            <span
              className="absolute inset-x-0 top-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
            />

            {/* Year & Celestial Destination */}
            <div className="flex items-center justify-between">
              <span
                className="hud-label text-[10px] tracking-widest font-semibold"
                style={{ color: accent }}
              >
                {relic.year} · {relic.body === 'mars' ? 'MARS' : 'THE MOON'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} />
            </div>

            {/* Machine Name */}
            <h2 className="mt-1.5 text-xl font-light tracking-tight text-white group-hover:text-white transition leading-snug">
              {relic.name}
            </h2>

            {/* Fun title / Nickname */}
            <p className="mt-0.5 text-[12px] italic text-silver/70">
              “{relic.title}”
            </p>

            {/* Minimalist interactive cue */}
            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-silver/60 group-hover:text-white transition">
              <span>Explore Mission</span>
              <ArrowUpRight
                size={13}
                style={{ color: accent }}
                className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
              />
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
