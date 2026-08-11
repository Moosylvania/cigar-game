/**
 * @typedef {Object} ResourceStorage
 * @property {number} seeds - bought from the Store, input to Nursery
 * @property {number} nurserySeedlings - collected from Nursery, input to Field
 * @property {number} fieldTobacco - collected from Field, input to Curing
 * @property {number} curedTobacco
 * @property {number} steamedTobacco
 * @property {number} fermentedTobacco
 * @property {number} cigars - collected from Rolling, capped by the Distribution
 *   Depot's storage capacity (see distribution.config.js) - the Depot's fleet
 *   continuously exports/sells this pool at a throughput-limited rate rather
 *   than an instant sell, so producing faster than the fleet can export
 *   risks overflowing and losing cigars (see economy.js exportCigars).
 */

/**
 * @typedef {Object} ResourceState
 * @property {number} money
 * @property {ResourceStorage} storage
 */

export {}
