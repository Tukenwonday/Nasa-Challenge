import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ScrollText, FlaskConical, Activity, X } from 'lucide-react'
import { ACCENTS } from '../data/relics.js'
import { useSwipe } from './Timeline.jsx'
import DustWiper from './DustWiper.jsx'
import SignalReadout from './SignalReadout.jsx'
import { sfx } from '../lib/audio.js'

const TABS = [
  { id: 'log', label: 'Final Log', icon: ScrollText },
  { id: 'science', label: 'Science', icon: FlaskConical },
  { id: 'condition', label: 'Condition', icon: Activity },
]

function LogTab({ relic }) {
  return (
    <div className="space-y-3 text-[14px] leading-relaxed text-silver/90">
      {relic.log.map((p, i) => (
        <motion.p key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i }} className="italic">
          “{p}”
        </motion.p>
      ))}
      <p className="hud-label text-silver/50 pt-1" style={{ letterSpacing: '0.12em', textTransform: 'none' }}>
        {relic.sign}
      </p>
    </div>
  )
}

function ScienceTab({ relic, accent }) {
  return (
    <div className="grid gap-2.5">
      {relic.stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.08 * i }}
          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3"
        >
          <span className="grid place-items-center w-9 h-9 rounded-full shrink-0" style={{ background: `${accent}1f`, color: accent }}>
            <s.icon size={17} strokeWidth={1.6} />
          </span>
          <span className="min-w-0">
            <span className="block text-white text-[17px] font-light tracking-tight">{s.value}</span>
            <span className="block text-[11px] text-silver/60 leading-snug">{s.label}</span>
          </span>
        </motion.div>
      ))}
    </div>
  )
}

function ConditionTab({ relic, accent, onBurst }) {
  const c = relic.condition
  const dot = c.tone === 'ok' ? '#8fd6a3' : accent
  return (
    <div className="space-y-3.5">
      <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5" style={{ borderColor: `${dot}66`, background: `${dot}12` }}>
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full opacity-70 animate-ping" style={{ background: dot }} />
          <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: dot }} />
        </span>
        <span className="hud-label text-white" style={{ letterSpacing: '0.14em' }}>
          {c.status.startsWith('Condition') ? c.status : `Condition: ${c.status}`}
        </span>
      </div>
      <dl className="divide-y divide-white/5 text-[12px]">
        {c.rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 py-2">
            <dt className="text-silver/55">{k}</dt>
            <dd className="font-mono text-white text-right">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="text-[12px] text-silver/60 leading-relaxed">{c.note}</p>
      {relic.wiper && <DustWiper data={relic.wiper} accent={accent} onBurst={onBurst} resetKey={relic.id} />}
    </div>
  )
}

export default function StoryCard({ visible, relic, index, total, onPrev, onNext, onBurst, onClose }) {
  const [tab, setTab] = useState('log')
  const accent = ACCENTS[relic.body]
  const swipe = useSwipe(onPrev, onNext) // swipe left → next, right → previous
  useEffect(() => setTab('log'), [relic.id])

  return (
    <motion.aside
      aria-live="polite"
      aria-hidden={!visible}
      initial={false}
      animate={{ opacity: visible ? 1 : 0, x: visible ? 0 : 40 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: visible ? 0.5 : 0 }}
      style={{ pointerEvents: visible ? 'auto' : 'none' }}
      className="absolute z-20 left-3 right-3 bottom-[76px] max-h-[48vh] md:left-auto md:right-6 md:top-24 md:bottom-6 md:w-[410px] md:max-h-none glass rounded-2xl flex flex-col overflow-hidden"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={relic.id}
          className="flex flex-col min-h-0 flex-1"
          initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -8, filter: 'blur(6px)' }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <header className="relative px-5 pt-4 pb-3 shrink-0 overflow-hidden" {...swipe}>
            <span className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
            <span className="pointer-events-none absolute -right-3 top-6 select-none text-8xl font-extralight tracking-tighter" style={{ color: `${accent}12` }}>
              {relic.year}
            </span>
            <div className="flex items-center justify-between">
              <span className="hud-label" style={{ color: accent }}>
                {relic.year} · {relic.place}
              </span>
              <span className="flex items-center gap-2">
                <span className="hud-label text-silver/40">
                  {String(index + 1).padStart(2, '0')}/{String(total).padStart(2, '0')}
                </span>
                <button onClick={onClose} aria-label="Close story panel" className="grid place-items-center w-6 h-6 rounded-full text-silver/60 hover:text-white hover:bg-white/10 transition">
                  <X size={13} />
                </button>
              </span>
            </div>
            <h2 className="mt-2 text-2xl font-light tracking-tight text-white">{relic.title}</h2>
            <p className="text-[12px] text-silver/50 mt-0.5">{relic.name}</p>
            <p className="hidden sm:block text-[12.5px] text-silver/70 mt-2.5 leading-relaxed">{relic.blurb}</p>
          </header>

          <div role="tablist" className="flex gap-1 px-4 shrink-0 border-b border-white/10">
            {TABS.map((t) => {
              const on = tab === t.id
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={on}
                  onClick={() => {
                    setTab(t.id)
                    sfx.click()
                  }}
                  className={`relative flex items-center gap-1.5 px-3 py-2.5 text-[11.5px] transition-colors ${on ? 'text-white' : 'text-silver/50 hover:text-silver'}`}
                >
                  <t.icon size={13} />
                  {t.label}
                  {on && <motion.span layoutId="tab-underline" className="absolute left-2 right-2 -bottom-px h-px" style={{ background: accent }} />}
                </button>
              )
            })}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto scroll-thin px-5 py-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
              >
                {tab === 'log' && <LogTab relic={relic} />}
                {tab === 'science' && <ScienceTab relic={relic} accent={accent} />}
                {tab === 'condition' && <ConditionTab relic={relic} accent={accent} onBurst={onBurst} />}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="px-5 pb-4 shrink-0">
            <SignalReadout body={relic.body} accent={accent} />
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.aside>
  )
}
