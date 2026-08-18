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
 * Each array holds every currently-running boost of that kind - buying a
 * second Fertilizer while one is already active pushes a second,
 * independently-expiring entry rather than replacing the first, and their
 * effects stack additively (see boostEngine.js getBoostMultipliers). Empty
 * array (not null) when nothing of that kind is running.
 * @typedef {{ processing: ActiveBoost[], upgrade: ActiveBoost[], money: ActiveBoost[] }} BoostState
 */

export {}
