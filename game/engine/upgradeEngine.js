import { getLevelStats, MAX_BUILDING_LEVEL } from '../config/buildings/index.js'
import { maxLevelFor } from './townHallGating.js'
import { now } from '../util/time.js'

/**
 * @typedef {Object} UpgradeResult
 * @property {boolean} ok
 * @property {string} [reason]
 */

/**
 * Highest level a building is currently allowed to reach, accounting for
 * both the global 10-level cap and Town Hall gating (Town Hall itself is
 * only bound by the global cap).
 * @param {import('../types/building.js').PlacedBuilding} building
 * @param {import('../types/state.js').GameState} state
 */
export function getMaxAllowedLevel(building, state) {
  if (building.type === 'town_hall') return MAX_BUILDING_LEVEL
  return Math.min(MAX_BUILDING_LEVEL, maxLevelFor(state.townHall.level))
}

/**
 * Total cost/time to go from a building's current level up through
 * targetLevel, one level's stats at a time - used to let a single upgrade
 * action jump several levels at once (see startUpgradeToLevel) instead of
 * forcing a separate click-and-wait per level.
 * @param {import('../types/building.js').BuildingType} type
 * @param {number} fromLevel - exclusive; the first level actually paid for is fromLevel + 1
 * @param {number} targetLevel - inclusive
 */
export function getUpgradePlan(type, fromLevel, targetLevel) {
  let cost = 0
  let durationSeconds = 0
  for (let level = fromLevel + 1; level <= targetLevel; level++) {
    const stats = getLevelStats(type, level)
    cost += stats.upgradeCost
    durationSeconds += stats.upgradeDurationSeconds
  }
  return { targetLevel, cost, durationSeconds }
}

/**
 * Highest level a building could jump straight to right now without
 * exceeding current money - greedily adds levels (cheapest/lowest first,
 * since cost only grows with level) until the next one would be
 * unaffordable or the Town Hall cap is hit. Lets the upgrade button
 * default to the biggest catch-up the player can actually afford instead
 * of an all-or-nothing jump to the cap, so a player short on cash still
 * has a one-click affordable upgrade rather than a disabled button.
 * Returns building.level unchanged if even the next level isn't affordable.
 * @param {import('../types/building.js').PlacedBuilding} building
 * @param {import('../types/state.js').GameState} state
 * @returns {number}
 */
export function getAffordableUpgradeTarget(building, state) {
  const maxAllowed = getMaxAllowedLevel(building, state)
  let targetLevel = building.level
  let spent = 0
  for (let level = building.level + 1; level <= maxAllowed; level++) {
    const cost = getLevelStats(building.type, level).upgradeCost
    if (spent + cost > state.resources.money) break
    spent += cost
    targetLevel = level
  }
  return targetLevel
}

/**
 * Starts an upgrade that jumps straight to targetLevel in one action,
 * charging the summed cost of every intermediate level and running for
 * their summed duration - same total cost/time as upgrading one level at
 * a time, just one click instead of many (e.g. "catch this building up to
 * where Town Hall allows" instead of clicking Upgrade repeatedly).
 * @param {import('../types/building.js').PlacedBuilding} building
 * @param {import('../types/state.js').GameState} state
 * @param {number} targetLevel
 * @returns {UpgradeResult}
 */
export function startUpgradeToLevel(building, state, targetLevel) {
  if (building.upgrade) return { ok: false, reason: 'already_upgrading' }
  if (targetLevel <= building.level) return { ok: false, reason: 'not_above_current_level' }
  if (targetLevel > MAX_BUILDING_LEVEL) return { ok: false, reason: 'max_level' }

  const maxAllowed = getMaxAllowedLevel(building, state)
  if (targetLevel > maxAllowed) return { ok: false, reason: 'town_hall_gate' }

  const plan = getUpgradePlan(building.type, building.level, targetLevel)
  if (state.resources.money < plan.cost) return { ok: false, reason: 'insufficient_funds' }

  state.resources.money -= plan.cost
  const startedAt = now()
  building.upgrade = {
    targetLevel,
    startedAt,
    completesAt: startedAt + plan.durationSeconds * 1000
  }

  // A building under construction can't also be producing - cancel
  // whatever batch (in-flight or finished-but-uncollected) it was running,
  // rather than letting it keep processing or sit there ready to collect
  // through the upgrade.
  if (building.slot && building.slot.status !== 'idle') {
    building.slot = { status: 'idle', batchSize: 0 }
  }

  return { ok: true }
}

/**
 * @param {import('../types/building.js').PlacedBuilding} building
 * @param {import('../types/state.js').GameState} state
 * @returns {UpgradeResult}
 */
export function startUpgrade(building, state) {
  return startUpgradeToLevel(building, state, building.level + 1)
}

/**
 * @param {import('../types/state.js').GameState} state
 * @param {number} atTime
 */
export function resolveCompletedUpgrades(state, atTime = now()) {
  const allBuildings = [state.townHall, ...state.buildings]
  for (const building of allBuildings) {
    if (building.upgrade && building.upgrade.completesAt <= atTime) {
      building.level = building.upgrade.targetLevel
      building.upgrade = null
    }
  }
}
