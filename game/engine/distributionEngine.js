import { getVehicleTier } from '../config/vehicles.config.js'
import { getLevelStats } from '../config/buildings/index.js'

function getDistributionBuilding(state) {
  return state.buildings.find((b) => b.type === 'distribution') ?? null
}

function getMaxSlots(state) {
  const depot = getDistributionBuilding(state)
  if (!depot) return 0
  return getLevelStats('distribution', depot.level).maxVehicleSlots
}

/**
 * @param {import('../types/state.js').GameState} state
 * @returns {number} total vehicles owned across every tier
 */
function getTotalFleetCount(state) {
  return state.distribution.fleet.reduce((sum, entry) => sum + entry.count, 0)
}

function getFleetEntry(state, vehicleTierId) {
  return state.distribution.fleet.find((entry) => entry.vehicleTierId === vehicleTierId) ?? null
}

/**
 * How many cigars the Depot can hold before Rolling's output overflows and
 * is lost (see batchEngine.js collectBatch). Grows with Depot level and
 * with Lab's warehouse_expansion research.
 * @param {import('../types/state.js').GameState} state
 * @param {{ depotCapacityMultiplier?: number }} [labMultipliers]
 * @returns {number}
 */
export function getCigarStorageCapacity(state, labMultipliers) {
  const depot = getDistributionBuilding(state)
  if (!depot) return 0
  const base = getLevelStats('distribution', depot.level).cigarStorageCapacity
  return Math.round(base * (labMultipliers?.depotCapacityMultiplier ?? 1))
}

/**
 * Any vehicle tier is buyable any time you have the money - the Depot's
 * level only caps the *total* number of vehicles you can own across every
 * tier combined (see getMaxSlots), not which tiers are available.
 * @param {import('../types/state.js').GameState} state
 * @param {string} vehicleTierId
 * @returns {{ ok: boolean, reason?: string }}
 */
export function canBuyVehicle(state, vehicleTierId) {
  const depot = getDistributionBuilding(state)
  if (!depot) return { ok: false, reason: 'no_distribution_building' }

  const tier = getVehicleTier(vehicleTierId)
  if (!tier) return { ok: false, reason: 'unknown_vehicle' }

  if (getTotalFleetCount(state) >= getMaxSlots(state)) return { ok: false, reason: 'no_fleet_slots' }
  if (state.resources.money < tier.cost) return { ok: false, reason: 'insufficient_funds' }

  return { ok: true }
}

/**
 * @param {import('../types/state.js').GameState} state
 * @param {string} vehicleTierId
 * @returns {{ ok: boolean, reason?: string }}
 */
export function buyVehicle(state, vehicleTierId) {
  const result = canBuyVehicle(state, vehicleTierId)
  if (!result.ok) return result

  const tier = getVehicleTier(vehicleTierId)
  state.resources.money -= tier.cost

  const entry = getFleetEntry(state, vehicleTierId)
  if (entry) {
    entry.count += 1
  } else {
    state.distribution.fleet.push({ vehicleTierId, count: 1 })
  }

  return { ok: true }
}

function removeOneFromFleet(state, vehicleTierId) {
  const entry = getFleetEntry(state, vehicleTierId)
  if (!entry) return
  entry.count -= 1
  if (entry.count <= 0) {
    state.distribution.fleet = state.distribution.fleet.filter((e) => e !== entry)
  }
}

function addOneToFleet(state, vehicleTierId) {
  const entry = getFleetEntry(state, vehicleTierId)
  if (entry) {
    entry.count += 1
  } else {
    state.distribution.fleet.push({ vehicleTierId, count: 1 })
  }
}

/**
 * Swaps one owned vehicle for a different tier in place - doesn't consume
 * an extra slot the way buyVehicle does. No trade-in value: the full cost
 * of the new tier is charged and the old vehicle is simply discarded, same
 * no-refund convention as decoration removal elsewhere in the game.
 * @param {import('../types/state.js').GameState} state
 * @param {string} fromVehicleTierId - a tier you currently own at least one of
 * @param {string} toVehicleTierId
 * @returns {{ ok: boolean, reason?: string }}
 */
export function canReplaceVehicle(state, fromVehicleTierId, toVehicleTierId) {
  const depot = getDistributionBuilding(state)
  if (!depot) return { ok: false, reason: 'no_distribution_building' }

  const fromEntry = getFleetEntry(state, fromVehicleTierId)
  if (!fromEntry || fromEntry.count <= 0) return { ok: false, reason: 'not_owned' }

  const toTier = getVehicleTier(toVehicleTierId)
  if (!toTier) return { ok: false, reason: 'unknown_vehicle' }
  if (toVehicleTierId === fromVehicleTierId) return { ok: false, reason: 'already_owned' }

  if (state.resources.money < toTier.cost) return { ok: false, reason: 'insufficient_funds' }

  return { ok: true }
}

/**
 * @param {import('../types/state.js').GameState} state
 * @param {string} fromVehicleTierId
 * @param {string} toVehicleTierId
 * @returns {{ ok: boolean, reason?: string }}
 */
export function replaceVehicle(state, fromVehicleTierId, toVehicleTierId) {
  const result = canReplaceVehicle(state, fromVehicleTierId, toVehicleTierId)
  if (!result.ok) return result

  const toTier = getVehicleTier(toVehicleTierId)
  state.resources.money -= toTier.cost
  removeOneFromFleet(state, fromVehicleTierId)
  addOneToFleet(state, toVehicleTierId)

  return { ok: true }
}

export { getDistributionBuilding, getMaxSlots, getTotalFleetCount }
