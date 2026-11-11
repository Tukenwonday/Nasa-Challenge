// Subtle Web Audio synth: telemetry clicks, low hum, radio static, and signal locks.
let ctx = null
let master = null
let noiseBuf = null
let humOscs = []
let muted = false
const LEVEL = 0.5

export function init() {
  if (typeof window === 'undefined') return
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    try {
      ctx = new AC()
    } catch {
      return
    }
    master = ctx.createGain()
    master.gain.value = muted ? 0 : LEVEL
    master.connect(ctx.destination)

    // 1-second white noise buffer
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1, ctx.sampleRate)
    const data = noiseBuf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1

    startHum()
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
}

function startHum() {
  const g = ctx.createGain()
  g.gain.value = 0.05
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 260
  const lfo = ctx.createOscillator()
  const lfoGain = ctx.createGain()
  lfo.frequency.value = 0.11
  lfoGain.gain.value = 0.02
  lfo.connect(lfoGain).connect(g.gain)
  lfo.start()
  ;[55, 82.6].forEach((f, i) => {
    const o = ctx.createOscillator()
    o.type = i ? 'triangle' : 'sine'
    o.frequency.value = f
    o.connect(lp)
    o.start()
    humOscs.push(o)
  })
  lp.connect(g).connect(master)
}

export function setBody(body) {
  if (!ctx || humOscs.length < 2) return
  const [a, b] = body === 'mars' ? [49, 73.4] : [55, 82.6]
  humOscs[0].frequency.setTargetAtTime(a, ctx.currentTime, 0.8)
  humOscs[1].frequency.setTargetAtTime(b, ctx.currentTime, 0.8)
}

export function setMuted(m) {
  muted = m
  if (ctx && master) master.gain.setTargetAtTime(m ? 0 : LEVEL, ctx.currentTime, 0.05)
}

function ready() {
  return ctx && !muted && ctx.state === 'running'
}

function tone({ freq, type = 'sine', dur = 0.12, gain = 0.15, when = 0, slideTo }) {
  if (!ready()) return
  const t = ctx.currentTime + when
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(master)
  o.start(t)
  o.stop(t + dur + 0.05)
}

function noise({ dur = 0.4, gain = 0.08, freq = 2400, q = 0.8, when = 0 }) {
  if (!ready()) return
  const t = ctx.currentTime + when
  const src = ctx.createBufferSource()
  src.buffer = noiseBuf
  src.loop = true
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = freq
  bp.Q.value = q
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + 0.04)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(bp).connect(g).connect(master)
  src.start(t)
  src.stop(t + dur + 0.05)
}

export const sfx = {
  /** Sine blip on slide transitions. */
  blip(step = 0) {
    tone({ freq: 520 + step * 70, dur: 0.14, gain: 0.12 })
    tone({ freq: 780 + step * 70, dur: 0.1, gain: 0.06, when: 0.06 })
  },
  /** Short telemetry click. */
  click() {
    tone({ freq: 1800, type: 'square', dur: 0.025, gain: 0.04 })
  },
  /** Soft radio static followed by a rising lock chime. */
  lock() {
    noise({ dur: 0.45, gain: 0.06 })
    tone({ freq: 660, dur: 0.09, gain: 0.08, when: 0.4 })
    tone({ freq: 990, dur: 0.16, gain: 0.08, when: 0.5 })
  },
  dust() {
    noise({ dur: 0.9, gain: 0.1, freq: 900, q: 0.4 })
    tone({ freq: 220, dur: 0.6, gain: 0.07, slideTo: 90 })
  },
}
