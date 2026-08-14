import { now } from '../util/time.js'

/**
 * @param {import('../types/boost.js').BoostState} boosts
 * @param {'processing'|'upgrade'|'money'} key
 * @param {number} [atTime]
 * @returns {boolean}
 */
export function isBoostActive(boosts, key, atTime = now()) {
  const boost = boosts?.[key]
  return Boolean(boost && boost.expiresAt > atTime)
}

/**
 * @param {import('../types/boost.js').BoostState} boosts
 * @param {'processing'|'upgrade'|'money'} key
 * @param {number} [atTime]
 * @returns {number} seconds remaining, 0 if not active
 */
export function getBoostRemainingSeconds(boosts, key, atTime = now()) {
  if (!isBoostActive(boosts, key, atTime)) return 0
  return (boosts[key].expiresAt - atTime) / 1000
}

/**
 * Folds the currently-active boosts into multiplier form, same shape as
 * labEngine.js getMultipliers so callers can merge them the same way.
 * processingSpeedMultiplier applies to every pipeline stage uniformly (no
 * per-type targeting, unlike Lab); upgradeSpeedMultiplier is a single flat
 * multiplier since upgradeEngine has no per-type speed concept at all;
 * salePriceMultiplier merges into the same field Lab's premium_blend and
 * Epic research already contribute to (see economy.js getEffectiveSalePrice).
 * @param {import('../types/boost.js').BoostState} boosts
 * @param {number} [atTime]
 * @returns {{ processingSpeedMultiplier: number, upgradeSpeedMultiplier: number, salePriceMultiplier: number }}
 */
export function getBoostMultipliers(boosts, atTime = now()) {
  const processing = isBoostActive(boosts, 'processing', atTime) ? boosts.processing.effectPercent : 0
  const upgrade = isBoostActive(boosts, 'upgrade', atTime) ? boosts.upgrade.effectPercent : 0
  const salePriceMultiplier = isBoostActive(boosts, 'money', atTime) ? boosts.money.effectMultiplier : 1
  return {
    processingSpeedMultiplier: 1 - processing,
    upgradeSpeedMultiplier: 1 - upgrade,
    salePriceMultiplier
  }
}

/**
 * Activates (or refreshes) a timed buff - buying one while already active
 * resets its clock to full duration rather than stacking/extending, so
 * effectPercent/effectMultiplier can never compound past what a single
 * purchase promises. Copies whichever effect field the item actually has
 * (speed-boost items carry effectPercent, the money boost carries
 * effectMultiplier - see store.config.js) - the other stays undefined.
 * @param {import('../types/boost.js').BoostState} boosts
 * @param {'processing'|'upgrade'|'money'} key
 * @param {import('../config/store.config.js').StoreItem} item
 */
export function activateBoost(boosts, key, item) {
  boosts[key] = {
    itemId: item.id,
    effectPercent: item.effectPercent,
    effectMultiplier: item.effectMultiplier,
    expiresAt: now() + item.durationSeconds * 1000
  }
}
