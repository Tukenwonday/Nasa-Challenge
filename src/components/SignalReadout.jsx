import { useEffect, useState } from 'react'
import { getSignal, formatLatency } from '../lib/signal.js'

/** Passive live telemetry readout: distance from Earth and one-way radio latency. */
export default function SignalReadout({ body, accent }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(iv)
  }, [])
  const sig = getSignal(body, now)
  const targetLabel = body === 'mars' ? 'MARS RELAY' : 'LUNAR RELAY'

  return (
    <div className="rounded-xl border border-white/[0.08] bg-black/40 px-3.5 py-2.5 flex items-center justify-between text-[11px] shadow-sm backdrop-blur-md">
      <div className="flex items-center gap-2.5">
        {/* Pulsing signal status beacon */}
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping bg-[#8fd6a3]" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#8fd6a3]" />
        </span>
        <div className="leading-tight">
          <div className="text-[9.5px] font-mono tracking-widest uppercase text-silver/50">
            {targetLabel}
          </div>
          <div className="font-mono text-white text-[12px] font-medium tracking-tight mt-0.5">
            {Math.round(sig.km).toLocaleString('en-US')} km
          </div>
        </div>
      </div>

      <div className="text-right leading-tight border-l border-white/[0.08] pl-3">
        <div className="text-[9.5px] font-mono tracking-widest uppercase text-silver/50">
          ONE-WAY DELAY
        </div>
        <div className="font-mono text-[12px] font-medium tracking-tight mt-0.5" style={{ color: accent }}>
          {formatLatency(sig.oneWay)}
        </div>
      </div>
    </div>
  )
}
