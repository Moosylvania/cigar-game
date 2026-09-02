// Additional purchasable fleet slots, on top of the Distribution Depot's
// normal level-based slots (see buildings/distribution.config.js
// maxVehicleSlots, which already reaches 10 for free at Depot level 10).
// Unlocks once the Depot reaches its own max level, then lets the player
// buy up to maxPurchasable more slots one at a time (see
// DistributionPanel.vue - only the next unbought slot is ever shown), so a
// fully bought-out Depot tops out at 20 total fleet slots.
//
// Cost runs from baseCost (the first purchase) up to exactly topCost (the
// maxPurchasable-th purchase) - see distributionEngine.js
// getNextTrainSlotCost, which interpolates between the two in log space
// (baseCost * (topCost/baseCost)^(purchased/(maxPurchasable-1))) rather
// than compounding a fixed growth rate, so the last slot always lands
// exactly on topCost regardless of floating-point rounding along the way.
// topCost is 1 sextillion ($1e21, "1Sx" in this game's number formatting -
// see util/format.js).
export const TRAIN_SLOT_CONFIG = {
  unlockDepotLevel: 10,
  maxPurchasable: 10,
  baseCost: 1_000_000_000,
  topCost: 1e21
}
