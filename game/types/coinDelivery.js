/** @typedef {{ id: string, x: number, y: number, amount: number, spawnedAt: number }} PendingCoinDelivery */

/**
 * A small coin pickup that periodically appears just outside the
 * Distribution Depot (see engine/coinDeliveryEngine.js) - click it to
 * collect before the next one is scheduled. `pending` is null between
 * deliveries. Coins are a separate currency from money, spent on power-ups
 * in the Store (see store.config.js speed_boost_*/money_boost items).
 * @typedef {{ pending: PendingCoinDelivery|null, nextSpawnAt: number }} CoinDeliveryState
 */

export {}
