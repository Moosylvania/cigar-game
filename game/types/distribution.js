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

/** @typedef {{ fleet: FleetEntry[] }} DistributionState */

export {}
