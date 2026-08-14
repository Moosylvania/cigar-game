/**
 * effectPercent is used by processing/upgrade boosts (fraction faster);
 * effectMultiplier is used by the money boost (sale price multiplier) -
 * only whichever one matches the boost's own item is ever populated (see
 * engine/boostEngine.js activateBoost).
 * @typedef {{ itemId: string, expiresAt: number, effectPercent?: number, effectMultiplier?: number }} ActiveBoost
 */

/**
 * Timed store-item buffs (see store.config.js speed_boost_*/money_boost
 * items / engine/boostEngine.js) - 'processing' speeds up pipeline batches
 * that start while active, 'upgrade' speeds up building upgrades that
 * start while active, 'money' multiplies cigar sale price while active.
 * null means no boost of that kind is currently running.
 * @typedef {{ processing: ActiveBoost|null, upgrade: ActiveBoost|null, money: ActiveBoost|null }} BoostState
 */

export {}
