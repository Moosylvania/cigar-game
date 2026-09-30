/** @typedef {'town_hall'|'nursery'|'field'|'curing'|'steam'|'fermentation'|'rolling'|'distribution'} BuildingType */

/** @typedef {{ targetLevel: number, startedAt: number, completesAt: number, kind?: string, mergeFactors?: Object<string, number> }} UpgradeInProgress */

/** @typedef {'idle'|'processing'|'ready'} SlotStatus */

/**
 * @typedef {Object} ProcessingSlot
 * @property {SlotStatus} status
 * @property {number} batchSize
 * @property {Object<string, number>} [tobaccoLots] - variety quantities carried through this batch
 * @property {number} [startedAt]
 * @property {number} [completesAt]
 */

/**
 * @typedef {Object} PlacedBuilding
 * @property {string|null} [seedVarietyId] - Production tobacco preference (legacy field name); null means highest price first
 * @property {string} id
 * @property {BuildingType} type
 * @property {import('./grid.js').GridPosition} position
 * @property {number} level - 1..10
 * @property {number} [mergeGeneration] - repeated combination generation
 * @property {number} [mergedBuildingCount] - original structures represented
 * @property {Object<string, number>} [mergeFactors] - instance stat factors
 * @property {number} [investedValue] - cash investment retained for resale
 * @property {UpgradeInProgress|null} upgrade
 * @property {ProcessingSlot|null} slot - null for town_hall and distribution (no manual batch step)
 */

export {}
