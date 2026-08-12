/**
 * @typedef {Object} PrestigeState
 * @property {number} unlockedCount - how many tiers (from index 0) are unlocked, 1-10 - derived from lifetimeMoneyEarnedAllTime each prestige, see prestigeEngine.js getUnlockedTierCount
 * @property {number} totalPrestigeCount - number of times the player has prestiged
 * @property {number} lifetimeMoneyEarnedAllTime - sum of every run's lifetime earnings, across all prestiges - the single source of truth for tier unlocks and multipliers
 * @property {Object<string, number>} epicResearchLevels - epic research id -> level, see epicResearch.config.js
 * @property {string[]} unlockedTrophyIds
 */

export {}
