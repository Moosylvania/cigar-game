import { LAND_TIERS, getLandTier } from '../config/land.config.js'
import { maxLandTierFor } from './townHallGating.js'

/**
 * @param {import('../types/state.js').GameState} state
 * @returns {import('../types/grid.js').LandRegion}
 */
export function getUnlockedRegion(state) {
  return getLandTier(state.land.unlockedTier).region
}

export function isWithinUnlockedRegion(state, position, footprint) {
  const region = getUnlockedRegion(state)
  return (
    position.x >= region.x0 &&
    position.y >= region.y0 &&
    position.x + footprint.width - 1 <= region.x1 &&
    position.y + footprint.height - 1 <= region.y1
  )
}

export function getNextLandTier(state) {
  return getLandTier(state.land.unlockedTier + 1)
}

/**
 * @param {import('../types/state.js').GameState} state
 * @returns {{ ok: boolean, reason?: string }}
 */
export function canExpandLand(state) {
  const next = getNextLandTier(state)
  if (!next) return { ok: false, reason: 'max_tier' }
  if (next.requiredTownHallLevel > state.townHall.level) return { ok: false, reason: 'town_hall_gate' }
  if (state.resources.money < next.cost) return { ok: false, reason: 'insufficient_funds' }
  return { ok: true }
}

/**
 * @param {import('../types/state.js').GameState} state
 * @returns {{ ok: boolean, reason?: string }}
 */
export function expandLand(state) {
  const result = canExpandLand(state)
  if (!result.ok) return result

  const next = getNextLandTier(state)
  state.resources.money -= next.cost
  state.land.unlockedTier = next.tier

  return { ok: true }
}

export { LAND_TIERS, maxLandTierFor }
