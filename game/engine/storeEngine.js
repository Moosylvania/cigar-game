import { DEFAULT_TOBACCO_ID, getTobacco, isTobaccoUnlocked } from '../config/tobacco.config.js'
import { addTobaccoResource } from './tobaccoEngine.js'
import { getStoreItem } from '../config/store.config.js'
import { getLevelStats } from '../config/buildings/index.js'
import { activateBoost } from './boostEngine.js'

/**
 * @typedef {Object} StorePurchaseResult
 * @property {boolean} ok
 * @property {string} [reason]
 */

/**
 * Seeds keep per-variety quantities alongside pooled totals. Nurseries consume a different
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
export function canBuyStoreItem(state, itemId, tobaccoId = DEFAULT_TOBACCO_ID) {
  const item = getStoreItem(itemId)
  if (!item) return { ok: false, reason: 'unknown_item' }
  if (item.type === 'seeds' && !isTobaccoUnlocked(state, tobaccoId)) return { ok: false, reason: 'tobacco_locked' }
  const cost = getStoreItemCost(item, tobaccoId)
  if (getBalance(state, item.currency) < cost) return { ok: false, reason: 'insufficient_funds' }
  return { ok: true }
}

/**
 * @param {import('../types/state.js').GameState} state
 * @param {string} itemId
 * @param {{ batchSizeMultipliers: Object<string, number> }} [labMultipliers]
 * @returns {StorePurchaseResult}
 */
export function buyStoreItem(state, itemId, labMultipliers, tobaccoId = DEFAULT_TOBACCO_ID) {
  const result = canBuyStoreItem(state, itemId, tobaccoId)
  if (!result.ok) return result

  const item = getStoreItem(itemId)
  spendBalance(state, item.currency, getStoreItemCost(item, tobaccoId))

  if (item.type === 'seeds') {
    const count = item.batches * getSeedsPerBatch(state, labMultipliers)
    addTobaccoResource(state, 'seeds', { [tobaccoId]: count }, count)
  } else if (item.type === 'speed_boost_processing') {
    activateBoost(state.boosts, 'processing', item)
  } else if (item.type === 'speed_boost_upgrade') {
    activateBoost(state.boosts, 'upgrade', item)
  } else if (item.type === 'money_boost') {
    activateBoost(state.boosts, 'money', item)
  }

  return { ok: true }
}

export function getStoreItemCost(item, tobaccoId = DEFAULT_TOBACCO_ID) {
  return item.type === 'seeds' ? Math.ceil(item.cost * (getTobacco(tobaccoId)?.seedCostMultiplier ?? 1)) : item.cost
}
