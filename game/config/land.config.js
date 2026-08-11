/**
 * Land expansion tiers. Tier 0 is the free starting region (not purchasable).
 * Tiers 1-9 each require reaching a Town Hall level and paying a cost to
 * grow the unlocked grid region. Region bounds are inclusive grid coordinates.
 * @type {{ tier: number, cost: number, requiredTownHallLevel: number, region: import('../types/grid.js').LandRegion }[]}
 */
export const LAND_TIERS = [
  { tier: 0, cost: 0, requiredTownHallLevel: 1, region: { x0: 0, y0: 0, x1: 5, y1: 5 } },
  { tier: 1, cost: 200, requiredTownHallLevel: 2, region: { x0: 0, y0: 0, x1: 8, y1: 5 } },
  { tier: 2, cost: 500, requiredTownHallLevel: 3, region: { x0: 0, y0: 0, x1: 8, y1: 8 } },
  { tier: 3, cost: 1200, requiredTownHallLevel: 4, region: { x0: 0, y0: 0, x1: 11, y1: 8 } },
  { tier: 4, cost: 2800, requiredTownHallLevel: 5, region: { x0: 0, y0: 0, x1: 11, y1: 11 } },
  { tier: 5, cost: 6000, requiredTownHallLevel: 6, region: { x0: 0, y0: 0, x1: 14, y1: 11 } },
  { tier: 6, cost: 13000, requiredTownHallLevel: 7, region: { x0: 0, y0: 0, x1: 14, y1: 14 } },
  { tier: 7, cost: 28000, requiredTownHallLevel: 8, region: { x0: 0, y0: 0, x1: 17, y1: 14 } },
  { tier: 8, cost: 60000, requiredTownHallLevel: 9, region: { x0: 0, y0: 0, x1: 17, y1: 17 } },
  { tier: 9, cost: 130000, requiredTownHallLevel: 10, region: { x0: 0, y0: 0, x1: 20, y1: 17 } }
]

export function getLandTier(tier) {
  return LAND_TIERS.find((t) => t.tier === tier) ?? null
}

export const MAX_LAND_TIER = LAND_TIERS.length - 1
