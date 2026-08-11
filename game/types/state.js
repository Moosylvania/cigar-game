/** @typedef {{ unlockedTier: number }} LandState */

/**
 * @typedef {Object} GameState
 * @property {import('./building.js').PlacedBuilding} townHall
 * @property {import('./building.js').PlacedBuilding[]} buildings
 * @property {import('./resources.js').ResourceState} resources
 * @property {LandState} land
 * @property {import('./lab.js').LabState} lab
 * @property {import('./distribution.js').DistributionState} distribution
 * @property {import('./decoration.js').PlacedDecoration[]} decorations
 * @property {import('./tutorial.js').TutorialState} tutorial
 * @property {{ createdAt: number, lastSavedAt: number, lifetimeMoneyEarned: number }} meta
 * @property {import('./prestige.js').PrestigeState} prestige
 */

export {}
