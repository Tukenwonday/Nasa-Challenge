import {
  Camera,
  Rocket,
  Mountain,
  Footprints,
  Gem,
  Layers,
  Route,
  Gauge,
  Droplets,
  Clock,
  Activity,
  Orbit,
} from 'lucide-react'
import rawRelics from './relics.json'

const ICON_MAP = {
  camera: Camera,
  rocket: Rocket,
  mountain: Mountain,
  footprints: Footprints,
  gem: Gem,
  layers: Layers,
  route: Route,
  gauge: Gauge,
  droplets: Droplets,
  clock: Clock,
  activity: Activity,
  orbit: Orbit,
}

export const COLORS = {
  void: '#08080A',
  silver: '#C4C9D1',
  terracotta: '#C65D3B',
}

/**
 * The six milestones. Content is loaded directly from /src/data/relics.json
 * so anyone can edit titles, blurbs, quotes, and mission logs in plain JSON.
 */
export const RELICS = rawRelics.map((r) => ({
  ...r,
  stats: (r.stats || []).map((s) => ({
    ...s,
    icon: (typeof s.icon === 'string' && ICON_MAP[s.icon.toLowerCase()]) || Activity,
  })),
}))

export const YEAR_MIN = RELICS[0]?.year || 1966
export const YEAR_MAX = RELICS[RELICS.length - 1]?.year || 2021

/** Rail position (0..1): blend of even spacing and true chronology so early pips don't collide. */
export function railPos(i) {
  if (RELICS.length <= 1) return 0
  const even = i / (RELICS.length - 1)
  const chrono = (RELICS[i].year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN || 1)
  return 0.5 * even + 0.5 * chrono
}

export const ACCENTS = { moon: '#C4C9D1', mars: '#C65D3B' }
