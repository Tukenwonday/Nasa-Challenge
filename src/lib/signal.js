const AU_KM = 149597870.7
const C_KM_S = 299792.458
const RAD = Math.PI / 180

// Mean orbital elements (JPL, J2000, ecliptic-plane approximation)
const EARTH = { a: 1.00000261, e: 0.01671123, L0: 100.46457166, Lr: 35999.37306, w: 102.93768193 }
const MARS = { a: 1.52371034, e: 0.0933941, L0: -4.55343205, Lr: 19140.30268499, w: -23.94362959 }

function helio(el, T) {
  const L = el.L0 + el.Lr * T
  const M = (((L - el.w) % 360) * Math.PI) / 180
  let E = M
  for (let i = 0; i < 8; i++) E = M + el.e * Math.sin(E)
  const x = el.a * (Math.cos(E) - el.e)
  const y = el.a * Math.sqrt(1 - el.e * el.e) * Math.sin(E)
  const w = el.w * RAD
  return [x * Math.cos(w) - y * Math.sin(w), x * Math.sin(w) + y * Math.cos(w)]
}

export function marsDistanceKm(date = new Date()) {
  const jd = date.getTime() / 86400000 + 2440587.5
  const T = (jd - 2451545.0) / 36525
  const [ex, ey] = helio(EARTH, T)
  const [mx, my] = helio(MARS, T)
  return Math.hypot(mx - ex, my - ey) * AU_KM
}

export function moonDistanceKm(date = new Date()) {
  const jd = date.getTime() / 86400000 + 2440587.5
  const d = jd - 2451545.0
  const M = (134.963 + 13.064993 * d) * RAD // anomalistic anomaly
  const D = (297.85 + 12.190749 * d) * RAD // mean elongation
  return 385001 - 20905 * Math.cos(M) - 3699 * Math.cos(2 * D - M) - 2956 * Math.cos(2 * D)
}

export function getSignal(body, date = new Date()) {
  const km = body === 'mars' ? marsDistanceKm(date) : moonDistanceKm(date)
  const oneWay = km / C_KM_S
  return { km, oneWay, roundTrip: oneWay * 2 }
}

export function formatLatency(seconds) {
  if (seconds < 60) return `${seconds.toFixed(2)} s`
  const total = Math.round(seconds)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}m ${String(s).padStart(2, '0')}s`
}

