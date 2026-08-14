// A full 10-cigar bundle (Rolling's level-1 batch size) sells for $80 at
// the starter fleet's 1x price multiplier, comfortably covering the ~$20
// cost of the seed pack needed to start that batch at the Nursery (see
// store.config.js).
export const BASE_CIGAR_SALE_PRICE = 20

// Selling a building refunds this fraction of its total invested cost (see
// buildings/index.js getBuildingWorth / placementEngine.js sellBuilding).
export const BUILDING_SELL_REFUND_RATE = 0.6

// Coins are a separate currency spent on power-ups in the Store (see
// store.config.js speed_boost_*/money_boost items). The only source is a
// small pickup that periodically appears next to the Distribution Depot
// (see engine/coinDeliveryEngine.js): every ~4 minutes (±1 min, so it's
// not perfectly predictable), waiting until clicked. Amount is skewed, not
// uniform, between the min and max below - most drops land near the
// minimum, averaging ~6, with the maximum genuinely rare (<1% of drops -
// see coinDeliveryEngine.js randomAmount).
export const COIN_DELIVERY_INTERVAL_SECONDS = 240
export const COIN_DELIVERY_JITTER_SECONDS = 60
export const COIN_DELIVERY_MIN_AMOUNT = 5
export const COIN_DELIVERY_MAX_AMOUNT = 15