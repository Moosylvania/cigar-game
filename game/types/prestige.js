/**
 * @typedef {Object} PrestigeState
 * @property {number} unlockedCount - how many tiers (from index 0) are unlocked, 1-10 - only grows via prestigeEngine.js advanceTier, never derived automatically from earnings alone
 * @property {number} activeTierIndex - which unlocked tier (0 to unlockedCount-1) is currently active - see prestigeEngine.js advanceTier. Only changes via an explicit advance (always a full reset); drives getActiveTierMultiplier's flat per-tier bonus and the board's theme.
 * @property {number} totalPrestigeCount - number of times the player has prestiged
 * @property {number} lifetimeMoneyEarnedAllTime - sum of every run's lifetime earnings, across all prestiges - the single source of truth for tier unlock thresholds (not for the money multiplier - see legacyLeaves)
 * @property {number} legacyLeaves - permanent prestige currency, earned once per prestige/advance off that run's earnings (see prestigeEngine.js getLeavesEarned) - never spent, drives getLeafMultiplier's uncapped money-multiplier bonus
 * @property {number} leafBoostLevel - Leaf Tonic upgrade levels bought from the Store (see prestigeEngine.js buyLeafBoost) - permanently raises the money-multiplier bonus each Legacy Leaf is worth
 * @property {number|null} lastLeafBoostPurchaseAt - timestamp (ms) of the last Leaf Tonic purchase, or null if never bought - gates the next purchase behind LEAF_BOOST_COOLDOWN_MS (see prestigeEngine.js getLeafBoostCooldownRemainingMs)
 * @property {Object<string, number>} epicResearchLevels - epic research id -> level, see epicResearch.config.js
 * @property {string[]} unlockedTrophyIds
 */

export {}
