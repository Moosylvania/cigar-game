/**
 * Prestige currency: 10 "tobacco varieties", unlocked one at a time in
 * order. Prestiging (resetting the farm) pays out points into whichever
 * variety is currently active (the highest unlocked one) based on this
 * run's lifetime money earned. Once the active variety's point total
 * crosses its unlockThreshold, the next variety unlocks and becomes active
 * for future payouts - already-unlocked varieties keep the points they
 * have and keep contributing their own multiplier forever. Colors darken
 * tier over tier, like a leaf curing further with each grade.
 * @type {{ id: string, name: string, description: string, icon: string, color: string, unlockThreshold: number }[]}
 */
export const TOBACCO_VARIETIES = [
  { id: 'virginia', name: 'Virginia', description: 'Bright, mild leaf - every grower starts here.', icon: 'mdi:leaf', color: '#d4a94a', unlockThreshold: 50 },
  { id: 'burley', name: 'Burley', description: 'Air-cured and nutty, burns clean.', icon: 'mdi:leaf', color: '#c99a4a', unlockThreshold: 150 },
  { id: 'oriental', name: 'Oriental', description: 'Small-leaf, sun-cured, intensely aromatic.', icon: 'mdi:leaf', color: '#bf8a3f', unlockThreshold: 400 },
  { id: 'cavendish', name: 'Cavendish', description: 'Heat-cured and pressed, sweet and dark.', icon: 'mdi:leaf', color: '#b37a38', unlockThreshold: 1000 },
  { id: 'latakia', name: 'Latakia', description: 'Fire-cured over smoldering hardwood.', icon: 'mdi:leaf', color: '#a66a30', unlockThreshold: 2500 },
  { id: 'perique', name: 'Perique', description: 'Pressure-fermented in oak, famously rare.', icon: 'mdi:leaf', color: '#8f5828', unlockThreshold: 6000 },
  { id: 'kentucky', name: 'Kentucky', description: 'Fire-cured, heavy-bodied dark leaf.', icon: 'mdi:leaf', color: '#7a4820', unlockThreshold: 15000 },
  { id: 'connecticut', name: 'Connecticut Shade', description: 'Shade-grown under cheesecloth for a silk-smooth wrapper.', icon: 'mdi:leaf', color: '#6b3c1c', unlockThreshold: 35000 },
  { id: 'corojo', name: 'Corojo', description: 'Cuban-seed wrapper leaf, full flavor.', icon: 'mdi:leaf', color: '#4f2c16', unlockThreshold: 80000 },
  { id: 'habano', name: 'Habano', description: 'The pinnacle wrapper leaf - the rarest tobacco there is.', icon: 'mdi:leaf', color: '#331c0f', unlockThreshold: Infinity }
]

// Each variety's own points-to-multiplier curve:
// multiplier(points) = 1 + (MAX_TIER_MULTIPLIER - 1) * points / (points + CURVE_HALF_POINT)
// Approaches MAX_TIER_MULTIPLIER asymptotically as points grows - "up to
// 1000x" per variety, never quite reaching it. CURVE_HALF_POINT is also
// the point count that yields exactly half of the max (500x), and not
// coincidentally matches Virginia's unlock threshold - by the time you
// unlock the next tier, the one you just filled is already worth ~500x.
export const MAX_TIER_MULTIPLIER = 1000
export const CURVE_HALF_POINT = 50

// Prestige point payout formula for a single prestige:
// points = floor((lifetimeMoneyEarnedThisRun / POINTS_BASE) ^ POINTS_EXPONENT)
// A square-root curve - diminishing per-run returns on purpose, so the
// grind lives in prestiging repeatedly rather than maximizing one huge run.
export const POINTS_BASE = 500000
export const POINTS_EXPONENT = 0.5
