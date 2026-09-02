/**
 * @typedef {Object} VehicleTierConfig
 * @property {string} id
 * @property {string} name
 * @property {number} cost
 * @property {number} capacityPerHour
 */

/**
 * One owned entry per vehicle tier - the fleet freely mixes tiers (buy any
 * tier any time you have the money, see distributionEngine.js), capped in
 * total count by the Depot's level.
 * @typedef {{ vehicleTierId: string, count: number }} FleetEntry
 */

/**
 * purchasedTrainSlots is the count of additional fleet slots bought with
 * money on top of the Depot's normal level-based slots (see
 * trainSlots.config.js) - 0 until unlocked/bought, capped at
 * TRAIN_SLOT_CONFIG.maxPurchasable.
 * @typedef {{ fleet: FleetEntry[], purchasedTrainSlots: number }} DistributionState
 */

export {}
