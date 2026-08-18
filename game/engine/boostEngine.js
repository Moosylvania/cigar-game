import { now } from '../util/time.js'

const BOOST_KEYS = ['processing', 'upgrade', 'money']

/**
 * @param {import('../types/boost.js').BoostState} boosts
 * @param {'processing'|'upgrade'|'money'} key
 * @param {number} [atTime]
 * @returns {import('../types/boost.js').ActiveBoost[]} every currently-running boost of that kind
 */
export function getActiveBoosts(boosts, key, atTime = now()) {
  return (boosts?.[key] ?? []).filter((boost) => boost.expiresAt > atTime)
}

/**
 * Drops expired entries from every boost slot in place, so the arrays
 * don't grow forever with dead boosts. Call once per tick and once on
 * offline catch-up, same as every other timer in this game. Read paths
 * (getActiveBoosts/getBoostMultipliers) already filter live off expiresAt
 * too, so this is only about not accumulating garbage, not correctness.
 * @param {import('../types/boost.js').BoostState} boosts
 * @param {number} [atTime]
 */
export function pruneExpiredBoosts(boosts, atTime = now()) {
  for (const key of BOOST_KEYS) {
    boosts[key] = getActiveBoosts(boosts, key, atTime)
  }
}

function sumEffectPercent(activeBoosts) {
  return activeBoosts.reduce((sum, boost) => sum + (boost.effectPercent ?? 0), 0)
}

// A boost's "bonus" over baseline (1x) - a single 10x Money Rush
// contributes +9, so two stacked contribute +18 (1 + 18 = 19x total), the
// same additive-stacking model speed boosts use rather than compounding
// multiplicatively (which would blow up fast: 10x * 10x = 100x for two).
function sumEffectMultiplierBonus(activeBoosts) {
  return activeBoosts.reduce((sum, boost) => sum + ((boost.effectMultiplier ?? 1) - 1), 0)
}

/**
 * Folds every currently-active boost into multiplier form, same shape as
 * labEngine.js getMultipliers so callers can merge them the same way.
 * Boosts of the same kind stack additively - two 30%-faster Fertilizers
 * combine to 60% faster (processingSpeedMultiplier 0.4), not a compounded
 * 51% (0.7*0.7) - clamped at 0 so an absurd stack can't go negative
 * (four 30% boosts would be "free" instant, not sped up past instant).
 * salePriceMultiplier merges into the same field Lab's premium_blend and
 * Epic research already contribute to (see economy.js getEffectiveSalePrice).
 * @param {import('../types/boost.js').BoostState} boosts
 * @param {number} [atTime]
 * @returns {{ processingSpeedMultiplier: number, upgradeSpeedMultiplier: number, salePriceMultiplier: number }}
 */
export function getBoostMultipliers(boosts, atTime = now()) {
  const processingBonus = sumEffectPercent(getActiveBoosts(boosts, 'processing', atTime))
  const upgradeBonus = sumEffectPercent(getActiveBoosts(boosts, 'upgrade', atTime))
  const moneyBonus = sumEffectMultiplierBonus(getActiveBoosts(boosts, 'money', atTime))
  return {
    processingSpeedMultiplier: Math.max(0, 1 - processingBonus),
    upgradeSpeedMultiplier: Math.max(0, 1 - upgradeBonus),
    salePriceMultiplier: 1 + moneyBonus
  }
}

/**
 * Activates a timed buff by pushing a new, independently-expiring entry
 * onto that kind's array - buying a second Fertilizer while one is
 * already running adds a second entry (both count toward the stacked
 * total in getBoostMultipliers) rather than refreshing/replacing the
 * first. Copies whichever effect field the item actually has (speed-boost
 * items carry effectPercent, the money boost carries effectMultiplier -
 * see store.config.js) - the other stays undefined.
 * @param {import('../types/boost.js').BoostState} boosts
 * @param {'processing'|'upgrade'|'money'} key
 * @param {import('../config/store.config.js').StoreItem} item
 */
export function activateBoost(boosts, key, item) {
  if (!boosts[key]) boosts[key] = []
  boosts[key].push({
    itemId: item.id,
    effectPercent: item.effectPercent,
    effectMultiplier: item.effectMultiplier,
    expiresAt: now() + item.durationSeconds * 1000
  })
}
