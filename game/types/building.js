/** @typedef {'town_hall'|'nursery'|'field'|'curing'|'steam'|'fermentation'|'rolling'|'distribution'} BuildingType */

/** @typedef {{ targetLevel: number, startedAt: number, completesAt: number }} UpgradeInProgress */

/** @typedef {'idle'|'processing'|'ready'} SlotStatus */

/**
 * @typedef {Object} ProcessingSlot
 * @property {SlotStatus} status
 * @property {number} batchSize
 * @property {number} [startedAt]
 * @property {number} [completesAt]
 */

/**
 * @typedef {Object} PlacedBuilding
 * @property {string} id
 * @property {BuildingType} type
 * @property {import('./grid.js').GridPosition} position
 * @property {number} level - 1..10
 * @property {UpgradeInProgress|null} upgrade
 * @property {ProcessingSlot|null} slot - null for town_hall and distribution (no manual batch step)
 */

export {}
