/**
 * Warm, cinematic ambient synthesizer & tactile telemetry soundscape.
 * Replaces harsh legacy bleeps with organic resonant chimes, warm sub-bass transients,
 * and deep atmospheric decompression sweeps.
 */

let ctx = null
let master = null
let pinkNoiseBuf = null
let humOscs = []
let muted = false
const MASTER_LEVEL = 0.28

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
    master.gain.value = muted ? 0 : MASTER_LEVEL
    master.connect(ctx.destination)

    // Generate warm 2-second pink noise buffer (much softer and smoother than harsh white noise)
    pinkNoiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const data = pinkNoiseBuf.getChannelData(0)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.96900 * b2 + white * 0.1538520
      b3 = 0.86650 * b3 + white * 0.3104856
      b4 = 0.55000 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.0168980
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04
      b6 = white * 0.115926
    }

    startDeepSpaceHum()
  }

  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
  }
}

/**
 * Deep cosmic drone: warm, velvety sub-bass rumble without electrical buzz.
 */
function startDeepSpaceHum() {
  if (!ctx || !master) return

  const humGain = ctx.createGain()
  humGain.gain.value = 0.035

  const lowpass = ctx.createBiquadFilter()
  lowpass.type = 'lowpass'
  lowpass.frequency.value = 110 // Warm cutoff, removes all buzzing harmonics

  // Very slow, soothing breathing LFO (0.07Hz = ~14 second breathing cycle)
  const lfo = ctx.createOscillator()
  const lfoGain = ctx.createGain()
  lfo.frequency.value = 0.07
  lfoGain.gain.value = 0.012
  lfo.connect(lfoGain).connect(humGain.gain)
  lfo.start()

  // Warm harmonic fundamental pair (Moon defaults: ~43.6Hz F1 and ~65.4Hz C2)
  ;[43.65, 65.41].forEach((f) => {
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.value = f
    o.connect(lowpass)
    o.start()
    humOscs.push(o)
  })

  lowpass.connect(humGain).connect(master)
}

/**
 * Retunes the deep space drone based on celestial body:
 * Mars = slightly deeper, warm terracotta frequency
 * Moon = crystalline, airy silver tone
 */
export function setBody(body) {
  if (!ctx || humOscs.length < 2) return
  const [f1, f2] = body === 'mars' ? [38.89, 58.27] : [43.65, 65.41]
  humOscs[0].frequency.setTargetAtTime(f1, ctx.currentTime, 1.2)
  humOscs[1].frequency.setTargetAtTime(f2, ctx.currentTime, 1.2)
}

export function setMuted(m) {
  muted = m
  if (ctx && master) {
    master.gain.setTargetAtTime(m ? 0 : MASTER_LEVEL, ctx.currentTime, 0.08)
  }
}

function isReady() {
  return ctx && !muted && ctx.state === 'running'
}

// Pentatonic warm frequencies for milestone navigation (A minor pentatonic: A3, C4, D4, E4, G4, A4)
const NAV_FREQS = [220.0, 261.63, 293.66, 329.63, 392.0, 440.0]

export const sfx = {
  /**
   * Milestone Transition:
   * A warm, glassy marimba/rhodes harmonic note with soft sub-bass presence.
   * Completely replaces harsh, piercing digital sine beeps.
   */
  blip(step = 0) {
    if (!isReady()) return

    const now = ctx.currentTime
    const freq = NAV_FREQS[Math.min(Math.max(step, 0), NAV_FREQS.length - 1)]

    // 1. Warm primary tone (Rhodes-like bell warmth)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(freq, now)

    gain1.gain.setValueAtTime(0.0001, now)
    gain1.gain.exponentialRampToValueAtTime(0.12, now + 0.015) // Gentle anti-click attack
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.28) // Smooth musical decay

    // 2. Subtle soft 2nd harmonic for glassy presence
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(freq * 2, now)

    gain2.gain.setValueAtTime(0.0001, now)
    gain2.gain.exponentialRampToValueAtTime(0.025, now + 0.012)
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.18)

    // 3. Ultra-soft sub-bass tactile thud (adds high-end feel without harshness)
    const sub = ctx.createOscillator()
    const subGain = ctx.createGain()
    sub.type = 'sine'
    sub.frequency.setValueAtTime(95, now)
    sub.frequency.exponentialRampToValueAtTime(50, now + 0.08)

    subGain.gain.setValueAtTime(0.0001, now)
    subGain.gain.exponentialRampToValueAtTime(0.08, now + 0.008)
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09)

    osc1.connect(gain1).connect(master)
    osc2.connect(gain2).connect(master)
    sub.connect(subGain).connect(master)

    osc1.start(now)
    osc2.start(now)
    sub.start(now)

    osc1.stop(now + 0.3)
    osc2.stop(now + 0.2)
    sub.stop(now + 0.1)
  },

  /**
   * Soft Tactile Tap:
   * A delicate, organic ceramic/glass click (like Apple VisionOS or macOS haptic feedback),
   * replacing the harsh 1800Hz square buzzer.
   */
  click() {
    if (!isReady()) return

    const now = ctx.currentTime

    // Filtered wooden/haptic micro-transient
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    filter.type = 'bandpass'
    filter.frequency.value = 420 // Warm mid-range tap, no harsh high frequencies
    filter.Q.value = 1.2

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(320, now)
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.025)

    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.065, now + 0.003)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.028)

    osc.connect(filter).connect(gain).connect(master)

    osc.start(now)
    osc.stop(now + 0.035)
  },

  /**
   * Signal / Telemetry Lock:
   * An elegant two-tone celestial shimmer chime that blooms softly in space,
   * replacing the unpleasant screeching static noise.
   */
  lock() {
    if (!isReady()) return

    const now = ctx.currentTime

    // Two harmonious tones: E4 (329.6Hz) + B4 (493.8Hz) - a pure fifth
    const chords = [
      { f: 329.63, delay: 0, dur: 0.55, vol: 0.08 },
      { f: 493.88, delay: 0.08, dur: 0.65, vol: 0.06 },
    ]

    chords.forEach(({ f, delay, dur, vol }) => {
      const t = now + delay
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(f, t)

      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(vol, t + 0.04) // Gentle bloom
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur) // Long warm tail

      osc.connect(gain).connect(master)
      osc.start(t)
      osc.stop(t + dur + 0.05)
    })
  },

  /**
   * Solar Dust Wiper / Air Decompression:
   * A deep, cinematic air-pressure release whoosh with lowpass filter sweep and sub-bass resonance,
   * replacing the grating raw noise buzz.
   */
  dust() {
    if (!isReady()) return

    const now = ctx.currentTime

    // 1. Soft atmospheric air puff (pink noise swept down)
    if (pinkNoiseBuf) {
      const noise = ctx.createBufferSource()
      noise.buffer = pinkNoiseBuf
      noise.loop = false

      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(450, now)
      filter.frequency.exponentialRampToValueAtTime(75, now + 0.65) // Smooth downward sweep

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.09, now + 0.06)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7)

      noise.connect(filter).connect(gain).connect(master)
      noise.start(now)
      noise.stop(now + 0.75)
    }

    // 2. Cinematic sub-bass impulse
    const sub = ctx.createOscillator()
    const subGain = ctx.createGain()
    sub.type = 'sine'
    sub.frequency.setValueAtTime(78, now)
    sub.frequency.exponentialRampToValueAtTime(36, now + 0.5)

    subGain.gain.setValueAtTime(0.0001, now)
    subGain.gain.exponentialRampToValueAtTime(0.09, now + 0.03)
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55)

    sub.connect(subGain).connect(master)
    sub.start(now)
    sub.stop(now + 0.6)
  },
}
