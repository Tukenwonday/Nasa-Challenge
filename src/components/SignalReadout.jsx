import { useEffect, useState } from 'react'
import { Radio } from 'lucide-react'
import { getSignal, formatLatency } from '../lib/signal.js'

/** Passive live readout: distance from Earth and one-way radio latency. */
export default function SignalReadout({ body, accent }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(iv)
  }, [])
  const sig = getSignal(body, now)
  return (
    <div className="border-t border-white/10 pt-3 mt-1 flex items-center gap-3 text-[11px]">
      <span className="grid place-items-center w-8 h-8 rounded-full shrink-0" style={{ background: `${accent}1f`, color: accent }}>
        <Radio size={14} />
      </span>
      <div className="min-w-0 leading-tight">
        <div className="hud-label text-silver/45" style={{ letterSpacing: '0.16em' }}>
          Live Earth ↔ {body === 'mars' ? 'Mars' : 'Moon'} link
        </div>
        <div className="mt-1 text-silver/70 truncate">
          <span className="font-mono text-white tabular-nums">{Math.round(sig.km).toLocaleString('en-US')} km</span> · one-way{' '}
          <span className="font-mono text-white">{formatLatency(sig.oneWay)}</span>
        </div>
      </div>
    </div>
  )
}

