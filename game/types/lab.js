/** @typedef {'sale_price_multiplier'|'production_speed_multiplier'|'batch_size_multiplier'} ResearchEffectType */

/**
 * @typedef {Object} ResearchEffect
 * @property {ResearchEffectType} type
 * @property {import('./building.js').BuildingType|'all'} [stageTarget]
 */

/**
 * @typedef {Object} ResearchDefinition
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {ResearchEffect} effect
 * @property {number} perLevelValue - effect magnitude per level, compounding
 * @property {number} maxLevel
 * @property {number} baseCost
 * @property {number} costGrowth
 */

/** @typedef {{ researchLevels: Object<string, number> }} LabState */

/**
 * @typedef {Object} LabMultipliers
 * @property {number} salePriceMultiplier
 * @property {Object<string, number>} speedMultipliers
 * @property {Object<string, number>} batchSizeMultipliers
 */

export {}
