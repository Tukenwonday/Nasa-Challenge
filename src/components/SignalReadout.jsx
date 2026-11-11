import { useEffect, useState } from 'react'
import { Radio } from 'lucide-react'
import { getSignal, formatLatency } from '../lib/signal.js'

/** Passive live telemetry readout: distance from Earth and one-way radio latency. */
export default function SignalReadout({ body, accent }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(iv)
  }, [])
  const sig = getSignal(body, now)

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] px-4 py-3 flex items-center gap-3.5 text-[11px] shadow-sm backdrop-blur-md">
      <span
        className="grid place-items-center w-8 h-8 rounded-xl shrink-0"
        style={{ background: `${accent}18`, color: accent, border: `1px solid ${accent}33` }}
      >
        <Radio size={14} className="animate-pulse" />
      </span>
      <div className="min-w-0 leading-tight">
        <div className="text-[10px] font-semibold font-sans tracking-wider uppercase text-silver/50">
          Live Earth ↔ {body === 'mars' ? 'Mars' : 'Moon'} Link
        </div>
        <div className="mt-1 text-silver/70 truncate text-[11.5px]">
          <span className="font-mono text-white tabular-nums font-medium">
            {Math.round(sig.km).toLocaleString('en-US')} km
          </span>
          <span className="text-silver/35 mx-1.5">·</span>
          <span className="font-mono text-silver/85">
            one-way {formatLatency(sig.oneWay)}
          </span>
        </div>
      </div>
    </div>
  )
}
