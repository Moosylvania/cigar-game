/**
 * Prestige currency: 10 tiers, unlocked in order purely by how much money
 * you've ever earned (all-time, across every prestige - see
 * prestige.lifetimeMoneyEarnedAllTime). unlockThreshold is a cumulative
 * dollar amount, not an abstract "points" currency - the moment your
 * all-time earnings cross a tier's threshold, it unlocks, however many
 * prestiges that took. No separate banking step, no risk of a big single
 * run "wasting" progress by not hitting a threshold exactly. The theme
 * escalates from a backyard hobby to a full cosmic ascension - each tier a
 * more absurd scale of tobacco empire than the last.
 * @type {{ id: string, name: string, description: string, icon: string, color: string, unlockThreshold: number }[]}
 */
export const PRESTIGE_TIERS = [
  { id: 'backyard', name: 'Backyard Grower', description: 'Where every empire starts: a few plants behind the house.', icon: 'mdi:sprout', color: '#8a9a5b', unlockThreshold: 5000000 },
  { id: 'county_fair', name: 'County Fair Champion', description: 'Blue ribbons and bragging rights at the county fair.', icon: 'mdi:medal-outline', color: '#c9a227', unlockThreshold: 5000000000 },
  { id: 'state_monopoly', name: 'State Monopoly', description: 'You control the market for the entire state.', icon: 'mdi:city-variant-outline', color: '#4a7a9a', unlockThreshold: 5000000000000 },
  { id: 'national_syndicate', name: 'National Syndicate', description: 'Coast to coast, your leaf is everywhere.', icon: 'mdi:flag-variant', color: '#8a4a9a', unlockThreshold: 5000000000000000 },
  { id: 'continental_empire', name: 'Continental Empire', description: 'An empire spanning the entire continent.', icon: 'mdi:earth', color: '#9a4a4a', unlockThreshold: 5000000000000000000 },
  { id: 'global_conglomerate', name: 'Global Conglomerate', description: 'Every nation smokes what you grow.', icon: 'mdi:domain', color: '#d4a94a', unlockThreshold: 5000000000000000000000 },
  { id: 'orbital_greenhouse', name: 'Orbital Greenhouse', description: 'Farming has left the atmosphere.', icon: 'mdi:satellite-variant', color: '#4a6a9a', unlockThreshold: 5000000000000000000000000 },
  { id: 'moon_base', name: 'Moon Base Harvest', description: 'Lunar soil, zero gravity, record yields.', icon: 'mdi:moon-waning-crescent', color: '#b8c4d4', unlockThreshold: 5000000000000000000000000000 },
  { id: 'heavenly_fields', name: 'Heavenly Fields', description: 'Even the angels are buying cartons.', icon: 'mdi:white-balance-sunny', color: '#f4e4b8', unlockThreshold: 5000000000000000000000000000000 },
  { id: 'cosmic_ascendant', name: 'Cosmic Ascendant', description: "You've transcended farming. You ARE the harvest.", icon: 'mdi:star-four-points-outline', color: '#9a4ad4', unlockThreshold: Infinity }
]

// Each tier's own multiplier grows from the fraction of its own dollar
// "band" (from the previous tier's threshold up to its own) that your
// all-time earnings have filled: multiplier(bandProgress) = 1 +
// (MAX_TIER_MULTIPLIER - 1) * bandProgress / (bandProgress + halfPoint),
// where halfPoint is CURVE_HALF_FRACTION of that band's width (or of the
// tier's own starting threshold, for the last tier, which has no finite
// band). Approaches MAX_TIER_MULTIPLIER asymptotically, never quite
// reaching it. Once your earnings cross into the *next* tier's band, this
// tier's own progress is capped at 100% (its multiplier freezes) - moving
// on locks in what you'd built up, same as the tiers before it.
// Kept deliberately modest (3x, not 10x) per tier - these multiply
// together across up to 10 tiers, so even 3x each still compounds to
// 3^10 (~59,000x) at full completion. 10x each was compounding to 10^10
// (10 billion) at full completion, which read as absurd rather than
// rewarding; 1000x each (an even earlier pass) was worse still, landing
// around 1e30.
export const MAX_TIER_MULTIPLIER = 3
export const CURVE_HALF_FRACTION = 0.15

// Separate from the cumulative multiplier above, and multiplicative with
// it: rewards actually playing at a tier, not just having once earned past
// it. Doubles the sale price of every cigar sold per step of
// prestige.activeTierIndex (see prestigeEngine.js getActiveTierMultiplier)
// - moving back to an earlier tier's look (see advanceTier) drops this
// back down to that tier's own bonus, even though the cumulative
// multiplier above stays at its full locked-in value regardless. Kept to
// a doubling (not the cumulative multiplier's already-large per-tier
// factor) since this one applies once per tier rather than compounding
// band-progress within each - backyard is 1x (no bonus), cosmic_ascendant
// (the 10th tier, index 9) is 2^9 = 512x.
export const ACTIVE_TIER_PRICE_GROWTH = 2
