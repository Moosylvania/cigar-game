/**
 * @typedef {Object} VehicleTierConfig
 * @property {string} id
 * @property {string} name
 * @property {number} cost
 * @property {number} unlockDistributionLevel
 * @property {number} capacityPerHour
 */

/**
 * The fleet holds exactly one vehicle tier at a time - upgrading to the
 * next tier (see distributionEngine.js) replaces it outright rather than
 * accumulating a mixed fleet across tiers.
 * @typedef {{ vehicleTierId: string, count: number }} Fleet
 */

/** @typedef {{ fleet: Fleet }} DistributionState */

export {}
