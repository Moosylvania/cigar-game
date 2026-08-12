/**
 * Land expansion: a fixed free starting region (the same 6x6 area the
 * starter buildings are placed in - see createInitialState.js), plus
 * individually-purchasable tiles beyond it. Every tile's price is
 * TILE_BASE_COST times its "ring" - the Chebyshev distance from the tile to
 * the nearest edge of the starting region, so a tile directly touching the
 * starting region costs 200, one two tiles out costs 400, ten tiles out
 * costs 2000, and so on. MAX_RING bounds how far purchasing (and rendering)
 * can ever reach, so the play area stays finite.
 * @type {import('../types/grid.js').LandRegion}
 */
export const STARTING_REGION = { x0: 0, y0: 0, x1: 5, y1: 5 }

export const TILE_BASE_COST = 200
export const MAX_RING = 30

/**
 * Chebyshev distance from a tile to the starting region's nearest edge - 0
 * for any tile inside the region (already owned, free), 1 for a tile
 * orthogonally OR diagonally touching the region's border, 2 for the next
 * ring out, and so on. Using Chebyshev (not Manhattan) distance is what
 * makes this form clean concentric square rings around the starting
 * region, with corner tiles costing the same as edge tiles at the same
 * ring - the natural shape for "buy the next layer out."
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
export function getTileRing(x, y) {
  const dx = Math.max(STARTING_REGION.x0 - x, 0, x - STARTING_REGION.x1)
  const dy = Math.max(STARTING_REGION.y0 - y, 0, y - STARTING_REGION.y1)
  return Math.max(dx, dy)
}

/**
 * @param {number} x
 * @param {number} y
 * @returns {number} 0 for a tile already inside the starting region
 */
export function getTileCost(x, y) {
  return getTileRing(x, y) * TILE_BASE_COST
}

/**
 * The absolute furthest the map can ever be purchased/rendered out to - a
 * fixed square bound derived from the starting region + MAX_RING, replacing
 * the old fixed-tier system's "highest tier's region" as the outer clamp
 * for camera bounds and the locked-tile preview ring.
 * @type {import('../types/grid.js').LandRegion}
 */
export const MAX_REGION = {
  x0: STARTING_REGION.x0 - MAX_RING,
  y0: STARTING_REGION.y0 - MAX_RING,
  x1: STARTING_REGION.x1 + MAX_RING,
  y1: STARTING_REGION.y1 + MAX_RING
}
