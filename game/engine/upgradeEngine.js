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
 * @param {number} [speedMultiplier] - from an active Rush Delivery boost (see boostEngine.js); 1 = no boost
 */
export function getUpgradePlan(type, fromLevel, targetLevel, speedMultiplier = 1) {
  let cost = 0
  let durationSeconds = 0
  for (let level = fromLevel + 1; level <= targetLevel; level++) {
    const stats = getLevelStats(type, level)
    cost += stats.upgradeCost
    durationSeconds += stats.upgradeDurationSeconds
  }
  return { targetLevel, cost, durationSeconds: durationSeconds * speedMultiplier }
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
 * @param {number} [speedMultiplier] - from an active Rush Delivery boost (see boostEngine.js); 1 = no boost
 * @returns {UpgradeResult}
 */
export function startUpgradeToLevel(building, state, targetLevel, speedMultiplier = 1) {
  if (building.upgrade) return { ok: false, reason: 'already_upgrading' }
  if (targetLevel <= building.level) return { ok: false, reason: 'not_above_current_level' }
  if (targetLevel > MAX_BUILDING_LEVEL) return { ok: false, reason: 'max_level' }

  const maxAllowed = getMaxAllowedLevel(building, state)
  if (targetLevel > maxAllowed) return { ok: false, reason: 'town_hall_gate' }

  const plan = getUpgradePlan(building.type, building.level, targetLevel, speedMultiplier)
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
 * Read-only plan for the "Upgrade All" bulk action on a drag-selected group
 * of buildings: greedily upgrades each as far as currently affordable, same
 * as getAffordableUpgradeTarget, but spends from one shared running budget
 * across the whole selection (cheapest buildings first) instead of letting
 * each building check the *full* current money independently - otherwise a
 * naive per-building check would let every building "afford" the same
 * dollars at once. Doesn't touch state - see commitSelectionUpgrade for the
 * version that actually spends and starts the upgrades.
 * @param {import('../types/building.js').PlacedBuilding[]} buildings
 * @param {import('../types/state.js').GameState} state
 * @returns {{ count: number, cost: number, results: { building: import('../types/building.js').PlacedBuilding, targetLevel: number, cost: number }[] }}
 */
export function planSelectionUpgrade(buildings, state) {
  const candidates = buildings.filter((b) => !b.upgrade).sort((a, b) => a.level - b.level)
  let budget = state.resources.money
  const results = []

  for (const building of candidates) {
    const maxAllowed = getMaxAllowedLevel(building, state)
    if (building.level >= maxAllowed) continue

    let targetLevel = building.level
    let spent = 0
    for (let level = building.level + 1; level <= maxAllowed; level++) {
      const cost = getLevelStats(building.type, level).upgradeCost
      if (spent + cost > budget) break
      spent += cost
      targetLevel = level
    }
    if (targetLevel <= building.level) continue

    budget -= spent
    results.push({ building, targetLevel, cost: spent })
  }

  return { count: results.length, cost: results.reduce((sum, r) => sum + r.cost, 0), results }
}

/**
 * Applies planSelectionUpgrade's plan for real - starts each upgrade
 * through the normal startUpgradeToLevel path (so cost/duration/slot
 * clearing all stay in one place) in the same cheapest-first order the
 * plan was computed in, so the actual spend matches the preview exactly.
 * @param {import('../types/building.js').PlacedBuilding[]} buildings
 * @param {import('../types/state.js').GameState} state
 * @param {number} [speedMultiplier]
 * @returns {{ count: number, cost: number }}
 */
export function commitSelectionUpgrade(buildings, state, speedMultiplier = 1) {
  const plan = planSelectionUpgrade(buildings, state)
  let count = 0
  for (const { building, targetLevel } of plan.results) {
    const result = startUpgradeToLevel(building, state, targetLevel, speedMultiplier)
    if (result.ok) count += 1
  }
  return { count, cost: plan.cost }
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
