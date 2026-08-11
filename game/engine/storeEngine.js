import { getStoreItem } from '../config/store.config.js'
import { getLevelStats } from '../config/buildings/index.js'
import { now } from '../util/time.js'

/**
 * @typedef {Object} StorePurchaseResult
 * @property {boolean} ok
 * @property {string} [reason]
 */

/**
 * Seeds are a single pooled resource, but nurseries consume a different
 * amount per batch depending on level and Lab batch-size research - so
 * "one batch" has no single fixed seed count across a game with multiple
 * nurseries. Seed packs are priced in batch-equivalents, sized off the
 * hungriest nursery the player owns, so a "100" pack always covers at
 * least 100 starts on every nursery in play, never fewer.
 * @param {import('../types/state.js').GameState} state
 * @param {{ batchSizeMultipliers: Object<string, number> }} [labMultipliers]
 * @returns {number}
 */
export function getSeedsPerBatch(state, labMultipliers) {
  const batchSizeMultiplier = labMultipliers?.batchSizeMultipliers?.nursery ?? 1
  const nurseries = state.buildings.filter((b) => b.type === 'nursery')
  const levels = nurseries.length > 0 ? nurseries.map((n) => n.level) : [1]
  const capacities = levels.map((level) => Math.round(getLevelStats('nursery', level).batchSize * batchSizeMultiplier))
  return Math.max(...capacities)
}

function hasProcessingInProgress(state) {
  return state.buildings.some((b) => b.slot?.status === 'processing')
}

function hasUpgradeInProgress(state) {
  return Boolean(state.townHall.upgrade) || state.buildings.some((b) => b.upgrade)
}

/**
 * @param {import('../types/state.js').GameState} state
 * @param {string} itemId
 * @param {{ batchSizeMultipliers: Object<string, number> }} [labMultipliers]
 * @returns {StorePurchaseResult}
 */
export function canBuyStoreItem(state, itemId, labMultipliers) {
  const item = getStoreItem(itemId)
  if (!item) return { ok: false, reason: 'unknown_item' }
  if (state.resources.money < item.cost) return { ok: false, reason: 'insufficient_funds' }
  if (item.type === 'speed_boost_processing' && !hasProcessingInProgress(state)) {
    return { ok: false, reason: 'nothing_to_boost' }
  }
  if (item.type === 'speed_boost_upgrade' && !hasUpgradeInProgress(state)) {
    return { ok: false, reason: 'nothing_to_boost' }
  }
  return { ok: true }
}

/**
 * Shaves a flat percentage off the remaining time of every processing
 * batch in play - buying it with nothing processing would just burn
 * money, so canBuyStoreItem blocks that case.
 * @param {import('../types/state.js').GameState} state
 * @param {number} effectPercent
 */
function applyProcessingSpeedBoost(state, effectPercent) {
  const nowMs = now()
  for (const building of state.buildings) {
    if (building.slot?.status !== 'processing') continue
    const remaining = building.slot.completesAt - nowMs
    if (remaining > 0) building.slot.completesAt = nowMs + remaining * (1 - effectPercent)
  }
}

/**
 * Same idea as applyProcessingSpeedBoost, but for building upgrades.
 * @param {import('../types/state.js').GameState} state
 * @param {number} effectPercent
 */
function applyUpgradeSpeedBoost(state, effectPercent) {
  const nowMs = now()
  const allBuildings = [state.townHall, ...state.buildings]
  for (const building of allBuildings) {
    if (!building.upgrade) continue
    const remaining = building.upgrade.completesAt - nowMs
    if (remaining > 0) building.upgrade.completesAt = nowMs + remaining * (1 - effectPercent)
  }
}

/**
 * @param {import('../types/state.js').GameState} state
 * @param {string} itemId
 * @param {{ batchSizeMultipliers: Object<string, number> }} [labMultipliers]
 * @returns {StorePurchaseResult}
 */
export function buyStoreItem(state, itemId, labMultipliers) {
  const result = canBuyStoreItem(state, itemId, labMultipliers)
  if (!result.ok) return result

  const item = getStoreItem(itemId)
  state.resources.money -= item.cost

  if (item.type === 'seeds') {
    state.resources.storage.seeds += item.batches * getSeedsPerBatch(state, labMultipliers)
  } else if (item.type === 'speed_boost_processing') {
    applyProcessingSpeedBoost(state, item.effectPercent)
  } else if (item.type === 'speed_boost_upgrade') {
    applyUpgradeSpeedBoost(state, item.effectPercent)
  }

  return { ok: true }
}
