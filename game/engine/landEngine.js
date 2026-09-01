import { STARTING_REGION, MAX_RING, getTileRing, getTileCost } from '../config/land.config.js'

export { getTileCost }

// How many rings ahead of the last *fully bought* ring a player can reach
// into - buying just the cheap corner of ring 1 shouldn't unlock shopping
// around in ring 5; ring 1 has to be entirely bought out (see
// isRingComplete/getHighestCompletedRing) before ring 3 opens up.
const RING_LOOKAHEAD = 2

function tileKey(x, y) {
  return `${x},${y}`
}

export function isStartingTile(x, y) {
  return x >= STARTING_REGION.x0 && x <= STARTING_REGION.x1 && y >= STARTING_REGION.y0 && y <= STARTING_REGION.y1
}

/**
 * A Set of "x,y" keys covering every owned tile - the starting region plus
 * every purchased tile - built once so repeated lookups (rendering every
 * visible tile, checking every tile of a multi-tile footprint) are O(1)
 * instead of re-scanning state.land.purchasedTiles per tile.
 * @param {import('../types/state.js').GameState} state
 * @returns {Set<string>}
 */
export function getOwnedTileSet(state) {
  const set = new Set()
  for (let x = STARTING_REGION.x0; x <= STARTING_REGION.x1; x++) {
    for (let y = STARTING_REGION.y0; y <= STARTING_REGION.y1; y++) {
      set.add(tileKey(x, y))
    }
  }
  for (const tile of state.land.purchasedTiles) {
    set.add(tileKey(tile.x, tile.y))
  }
  return set
}

/**
 * @param {Set<string>} ownedSet
 */
export function isOwnedTile(ownedSet, x, y) {
  return ownedSet.has(tileKey(x, y))
}

/**
 * Whether every tile at exactly this ring is owned - ring 0 (the starting
 * region itself) is always "complete" since it's free/fixed. Scans the
 * ring's full perimeter, so this is meant to be called once per relevant
 * state change (see getHighestCompletedRing/the store's memoized
 * maxPurchasableRing getter), not per rendered tile.
 * @param {Set<string>} ownedSet
 * @param {number} ring
 */
export function isRingComplete(ownedSet, ring) {
  if (ring <= 0) return true
  const bx0 = STARTING_REGION.x0 - ring
  const bx1 = STARTING_REGION.x1 + ring
  const by0 = STARTING_REGION.y0 - ring
  const by1 = STARTING_REGION.y1 + ring
  for (let x = bx0; x <= bx1; x++) {
    for (let y = by0; y <= by1; y++) {
      if (getTileRing(x, y) !== ring) continue
      if (!isOwnedTile(ownedSet, x, y)) return false
    }
  }
  return true
}

/**
 * The highest ring that's entirely bought out, scanning outward from the
 * (always-complete) starting region until it hits the first incomplete
 * ring. Combined with RING_LOOKAHEAD, this is what actually caps how far
 * out a tile can be purchased - see isTilePurchasable.
 * @param {Set<string>} ownedSet
 */
export function getHighestCompletedRing(ownedSet) {
  let ring = 0
  while (ring < MAX_RING && isRingComplete(ownedSet, ring + 1)) {
    ring++
  }
  return ring
}

/**
 * A locked tile is purchasable once any of its 8 surrounding tiles
 * (orthogonal or diagonal) is owned - diagonal counts too, otherwise the
 * corner tile of each new ring out would never become reachable (its only
 * owned neighbor at that point is the previous ring's own corner, which
 * touches it only diagonally) - AND its own ring is within RING_LOOKAHEAD
 * of the highest fully-completed ring, so a player can't cherry-pick a
 * single cheap far-out tile while skipping over everything closer in.
 * @param {Set<string>} ownedSet
 * @param {number} maxPurchasableRing - see getHighestCompletedRing; pass
 *   `getHighestCompletedRing(ownedSet) + RING_LOOKAHEAD` (the store exposes
 *   this pre-computed so per-tile rendering checks stay a cheap comparison
 *   instead of re-scanning rings for every visible tile every frame)
 */
export function isTilePurchasable(ownedSet, x, y, maxPurchasableRing) {
  if (isOwnedTile(ownedSet, x, y)) return false
  const ring = getTileRing(x, y)
  if (ring > MAX_RING || ring > maxPurchasableRing) return false
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue
      if (isOwnedTile(ownedSet, x + dx, y + dy)) return true
    }
  }
  return false
}

/**
 * @param {Set<string>} ownedSet
 */
export function getMaxPurchasableRing(ownedSet) {
  return getHighestCompletedRing(ownedSet) + RING_LOOKAHEAD
}

/**
 * @param {import('../types/state.js').GameState} state
 * @param {import('../types/grid.js').GridPosition} position
 * @param {{ width: number, height: number }} footprint
 * @returns {boolean} true only if every tile the footprint covers is owned
 */
export function isWithinUnlockedRegion(state, position, footprint) {
  const ownedSet = getOwnedTileSet(state)
  for (let dx = 0; dx < footprint.width; dx++) {
    for (let dy = 0; dy < footprint.height; dy++) {
      if (!isOwnedTile(ownedSet, position.x + dx, position.y + dy)) return false
    }
  }
  return true
}

/**
 * @param {import('../types/state.js').GameState} state
 * @param {number} x
 * @param {number} y
 * @returns {{ ok: boolean, reason?: string, cost?: number }}
 */
export function canBuyTile(state, x, y) {
  const ownedSet = getOwnedTileSet(state)
  if (isOwnedTile(ownedSet, x, y)) return { ok: false, reason: 'already_owned' }
  if (!isTilePurchasable(ownedSet, x, y, getMaxPurchasableRing(ownedSet))) return { ok: false, reason: 'not_adjacent' }
  const cost = getTileCost(x, y)
  if (state.resources.money < cost) return { ok: false, reason: 'insufficient_funds', cost }
  return { ok: true, cost }
}

/**
 * Bounding box (LandRegion-shaped) covering the starting region plus every
 * purchased tile - owned land is no longer always a rectangle (tiles can be
 * bought in any adjacency-connected order/shape), so this is an envelope
 * around it, not the true owned shape. Used for camera centering/framing,
 * where a loose bounding box is exactly what's wanted.
 * @param {import('../types/state.js').GameState} state
 * @returns {import('../types/grid.js').LandRegion}
 */
export function getOwnedBounds(state) {
  let { x0, y0, x1, y1 } = STARTING_REGION
  for (const tile of state.land.purchasedTiles) {
    if (tile.x < x0) x0 = tile.x
    if (tile.x > x1) x1 = tile.x
    if (tile.y < y0) y0 = tile.y
    if (tile.y > y1) y1 = tile.y
  }
  return { x0, y0, x1, y1 }
}

/**
 * @param {import('../types/state.js').GameState} state
 * @param {number} x
 * @param {number} y
 * @returns {{ ok: boolean, reason?: string, cost?: number }}
 */
export function buyTile(state, x, y) {
  const result = canBuyTile(state, x, y)
  if (!result.ok) return result
  state.resources.money -= result.cost
  state.land.purchasedTiles.push({ x, y })
  return { ok: true, cost: result.cost }
}

/**
 * Buys every purchasable/affordable tile inside a rectangular selection in
 * one action (the drag-select "bulk buy" gesture in expand mode). Runs
 * repeated passes over the rectangle because buying a tile can make its
 * neighbors newly adjacent-purchasable within the same rectangle (see
 * isTilePurchasable) - a single pass would miss a tile whose only owned
 * neighbor is one just bought earlier in this same drag. Stops once a pass
 * buys nothing new, or money runs out. Silently skips tiles that are
 * already owned, out of reach, or unaffordable rather than failing the
 * whole selection - that mirrors how a single buyTile click already
 * behaves for one tile, just applied per-tile across the box.
 * @param {import('../types/state.js').GameState} state
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 * @returns {{ ok: boolean, count: number, spent: number }}
 */
export function buyTilesInRect(state, x0, y0, x1, y1) {
  const loX = Math.min(x0, x1)
  const hiX = Math.max(x0, x1)
  const loY = Math.min(y0, y1)
  const hiY = Math.max(y0, y1)

  const ownedSet = getOwnedTileSet(state)
  let count = 0
  let spent = 0
  let progress = true

  while (progress) {
    progress = false
    const maxPurchasableRing = getMaxPurchasableRing(ownedSet)
    for (let x = loX; x <= hiX; x++) {
      for (let y = loY; y <= hiY; y++) {
        if (!isTilePurchasable(ownedSet, x, y, maxPurchasableRing)) continue
        const cost = getTileCost(x, y)
        if (state.resources.money < cost) continue
        state.resources.money -= cost
        state.land.purchasedTiles.push({ x, y })
        ownedSet.add(tileKey(x, y))
        count += 1
        spent += cost
        progress = true
      }
    }
  }

  return { ok: count > 0, count, spent }
}
