// A full 10-cigar bundle (Rolling's level-1 batch size) sells for $80 at
// the starter fleet's 1x price multiplier, comfortably covering the ~$20
// cost of the seed pack needed to start that batch at the Nursery (see
// store.config.js).
export const BASE_CIGAR_SALE_PRICE = 20

// Selling a building refunds this fraction of its total invested cost (see
// buildings/index.js getBuildingWorth / placementEngine.js sellBuilding).
export const BUILDING_SELL_REFUND_RATE = 0.6