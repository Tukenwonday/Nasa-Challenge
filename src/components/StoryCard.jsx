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

function LogTab({ relic, accent }) {
  return (
    <div className="space-y-3.5">
      {relic.log.map((p, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 * i }}
          className="relative pl-3.5 border-l-2 py-0.5 text-[13.5px] leading-relaxed text-silver/90 italic font-sans"
          style={{ borderColor: `${accent}70` }}
        >
          “{p}”
        </motion.div>
      ))}
      <p className="text-[11.5px] font-mono text-silver/50 pt-1 tracking-wider">
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
          className="flex items-center gap-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.025] hover:bg-white/[0.05] px-4 py-3 transition-colors shadow-sm"
        >
          <span
            className="grid place-items-center w-10 h-10 rounded-xl shrink-0"
            style={{ background: `${accent}16`, color: accent, border: `1px solid ${accent}33` }}
          >
            <s.icon size={18} strokeWidth={1.7} />
          </span>
          <span className="min-w-0">
            <span className="block text-white text-[17px] font-light tracking-tight">{s.value}</span>
            <span className="block text-[11.5px] text-silver/60 leading-snug">{s.label}</span>
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
      <div
        className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 backdrop-blur-md"
        style={{ borderColor: `${dot}55`, background: `${dot}12`, boxShadow: `0 0 16px ${dot}18` }}
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ background: dot }} />
          <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: dot }} />
        </span>
        <span className="text-[11px] font-semibold tracking-wider uppercase font-sans text-white">
          {c.status.startsWith('Condition') ? c.status : `Condition: ${c.status}`}
        </span>
      </div>
      <dl className="divide-y divide-white/[0.06] text-[12px] rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-1">
        {c.rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 py-2.5">
            <dt className="text-silver/55">{k}</dt>
            <dd className="font-mono text-white text-right font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="text-[12px] text-silver/65 leading-relaxed bg-white/[0.02] p-3.5 rounded-2xl border border-white/[0.06]">
        {c.note}
      </p>
      {relic.wiper && <DustWiper data={relic.wiper} accent={accent} onBurst={onBurst} resetKey={relic.id} />}
    </div>
  )
}

export default function StoryCard({ visible, relic, index, total, onPrev, onNext, onBurst, onClose }) {
  const [tab, setTab] = useState('log')
  const accent = ACCENTS[relic.body]
  const swipe = useSwipe(onPrev, onNext)
  useEffect(() => setTab('log'), [relic.id])

  return (
    <motion.aside
      aria-live="polite"
      aria-hidden={!visible}
      initial={false}
      animate={{ opacity: visible ? 1 : 0, x: visible ? 0 : 40 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: visible ? 0.4 : 0 }}
      style={{
        pointerEvents: visible ? 'auto' : 'none',
        '--panel-glow': `${accent}25`,
      }}
      className="absolute z-20 left-3 right-3 bottom-[76px] max-h-[52vh] md:left-auto md:right-6 md:top-20 md:bottom-6 md:w-[420px] md:max-h-none glass-panel rounded-3xl flex flex-col overflow-hidden"
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
          <header className="relative px-6 pt-5 pb-3.5 shrink-0 overflow-hidden" {...swipe}>
            <span
              className="absolute inset-x-0 top-0 h-[2px]"
              style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
            />
            <span
              className="pointer-events-none absolute -right-2 top-2 select-none text-9xl font-extralight tracking-tighter opacity-[0.06] font-mono leading-none"
              style={{ color: accent }}
            >
              {relic.year}
            </span>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wider font-sans uppercase" style={{ color: accent }}>
                {relic.year} · {relic.place}
              </span>
              <div className="flex items-center gap-2">
                <span className="glass-pill rounded-full px-2.5 py-0.5 font-mono text-[10px] text-silver/60">
                  {String(index + 1).padStart(2, '0')}/{String(total).padStart(2, '0')}
                </span>
                <button
                  onClick={onClose}
                  aria-label="Close story panel"
                  className="grid place-items-center w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.14] border border-white/10 text-silver/70 hover:text-white transition-all active:scale-95"
                >
                  <X size={13} />
                </button>
              </div>
            </div>
            <h2 className="mt-2.5 text-[26px] font-light tracking-tight text-white leading-tight font-sans">
              {relic.title}
            </h2>
            <p className="text-[12.5px] font-medium text-silver/50 mt-0.5 font-sans">{relic.name}</p>
            <p className="hidden sm:block text-[13px] text-silver/70 mt-3 leading-relaxed font-sans">{relic.blurb}</p>
          </header>

          <div role="tablist" className="mx-6 p-1 rounded-2xl bg-black/40 border border-white/[0.08] flex gap-1 shrink-0 backdrop-blur-md">
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
                  className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 text-[11.5px] font-medium rounded-xl transition-all duration-200 select-none ${
                    on ? 'text-white' : 'text-silver/55 hover:text-silver/90'
                  }`}
                >
                  {on && (
                    <motion.div
                      layoutId="active-tab-indicator"
                      className="absolute inset-0 rounded-xl bg-white/[0.12] border border-white/15 shadow-sm"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <t.icon size={13} style={{ color: on ? accent : 'currentColor' }} />
                    {t.label}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto scroll-thin px-6 py-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
              >
                {tab === 'log' && <LogTab relic={relic} accent={accent} />}
                {tab === 'science' && <ScienceTab relic={relic} accent={accent} />}
                {tab === 'condition' && <ConditionTab relic={relic} accent={accent} onBurst={onBurst} />}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="px-6 pb-5 shrink-0">
            <SignalReadout body={relic.body} accent={accent} />
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.aside>
  )
}
