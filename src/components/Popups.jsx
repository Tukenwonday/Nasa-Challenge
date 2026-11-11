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

/** Compact 2-line docked mission capsule floating right above the timeline dots. */
export function Teaser({ relic, visible, onOpen }) {
  if (!relic) return null
  const accent = ACCENTS[relic.body]

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          key={relic.id}
          initial={{ opacity: 0, y: 14, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.96 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="pointer-events-none absolute z-20 bottom-[64px] md:bottom-[74px] left-0 right-0 flex justify-center px-4"
        >
          <button
            onClick={onOpen}
            aria-label={`Explore mission details for ${relic.name}`}
            className="pointer-events-auto group glass relative overflow-hidden rounded-2xl px-4 py-2 sm:px-5 sm:py-2.5 flex flex-col gap-0.5 w-full max-w-[420px] shadow-2xl transition hover:bg-white/[0.08] hover:border-white/20 select-none text-left"
          >
            <span
              className="absolute inset-x-0 top-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
            />

            {/* Line 1: Year & Destination on left, Explore action on right */}
            <div className="flex items-center justify-between">
              <span
                className="text-[11px] font-semibold tracking-wider uppercase font-sans"
                style={{ color: accent }}
              >
                {relic.year} · {relic.body === 'mars' ? 'MARS' : 'THE MOON'}
              </span>

              <span
                className="text-[11px] font-medium tracking-wide flex items-center gap-1 font-sans transition group-hover:text-white"
                style={{ color: accent }}
              >
                Explore
                <ArrowUpRight
                  size={12}
                  className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                />
              </span>
            </div>

            {/* Line 2: Machine Name and Nickname */}
            <div className="flex items-baseline gap-2 truncate">
              <span className="text-[14px] sm:text-[15px] font-medium text-white tracking-tight shrink-0 font-sans">
                {relic.name}
              </span>
              <span className="text-[12px] italic text-silver/65 truncate font-sans">
                “{relic.title}”
              </span>
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
