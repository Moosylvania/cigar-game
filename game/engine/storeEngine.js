import { getStoreItem } from '../config/store.config.js'
import { getLevelStats } from '../config/buildings/index.js'
import { activateBoost } from './boostEngine.js'

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

function getBalance(state, currency) {
  return currency === 'coins' ? state.coins : state.resources.money
}

function spendBalance(state, currency, amount) {
  if (currency === 'coins') {
    state.coins -= amount
  } else {
    state.resources.money -= amount
  }
}

/**
 * @param {import('../types/state.js').GameState} state
 * @param {string} itemId
 * @returns {StorePurchaseResult}
 */
export function canBuyStoreItem(state, itemId) {
  const item = getStoreItem(itemId)
  if (!item) return { ok: false, reason: 'unknown_item' }
  if (getBalance(state, item.currency) < item.cost) return { ok: false, reason: 'insufficient_funds' }
  return { ok: true }
}

/**
 * @param {import('../types/state.js').GameState} state
 * @param {string} itemId
 * @param {{ batchSizeMultipliers: Object<string, number> }} [labMultipliers]
 * @returns {StorePurchaseResult}
 */
export function buyStoreItem(state, itemId, labMultipliers) {
  const result = canBuyStoreItem(state, itemId)
  if (!result.ok) return result

  const item = getStoreItem(itemId)
  spendBalance(state, item.currency, item.cost)

  if (item.type === 'seeds') {
    state.resources.storage.seeds += item.batches * getSeedsPerBatch(state, labMultipliers)
  } else if (item.type === 'speed_boost_processing') {
    activateBoost(state.boosts, 'processing', item)
  } else if (item.type === 'speed_boost_upgrade') {
    activateBoost(state.boosts, 'upgrade', item)
  } else if (item.type === 'money_boost') {
    activateBoost(state.boosts, 'money', item)
  }

  return { ok: true }
}
