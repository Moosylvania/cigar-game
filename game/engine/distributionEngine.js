import { getVehicleTier, getNextVehicleTier } from '../config/vehicles.config.js'
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
 * Buys one more vehicle of the fleet's current tier (see upgradeFleet for
 * moving to the next tier instead).
 * @param {import('../types/state.js').GameState} state
 * @returns {{ ok: boolean, reason?: string }}
 */
export function canBuyVehicle(state) {
  const depot = getDistributionBuilding(state)
  if (!depot) return { ok: false, reason: 'no_distribution_building' }

  if (state.distribution.fleet.count >= getMaxSlots(state)) return { ok: false, reason: 'no_fleet_slots' }

  const tier = getVehicleTier(state.distribution.fleet.vehicleTierId)
  if (state.resources.money < tier.cost) return { ok: false, reason: 'insufficient_funds' }

  return { ok: true }
}

/**
 * @param {import('../types/state.js').GameState} state
 * @returns {{ ok: boolean, reason?: string }}
 */
export function buyVehicle(state) {
  const result = canBuyVehicle(state)
  if (!result.ok) return result

  const tier = getVehicleTier(state.distribution.fleet.vehicleTierId)
  state.resources.money -= tier.cost
  state.distribution.fleet.count += 1

  return { ok: true }
}

/**
 * Replaces the entire fleet with a single vehicle of the next tier up -
 * Egg-Inc style progression (truck -> box truck -> semi -> train) instead
 * of freely mixing tiers. Doesn't require the current fleet to be full
 * first: since upgrading discards it anyway, requiring that would just
 * push the player to waste money topping off a tier about to be retired.
 * @param {import('../types/state.js').GameState} state
 * @returns {{ ok: boolean, reason?: string }}
 */
export function canUpgradeFleet(state) {
  const depot = getDistributionBuilding(state)
  if (!depot) return { ok: false, reason: 'no_distribution_building' }

  const nextTier = getNextVehicleTier(state.distribution.fleet.vehicleTierId)
  if (!nextTier) return { ok: false, reason: 'max_tier' }
  if (depot.level < nextTier.unlockDistributionLevel) return { ok: false, reason: 'depot_level_too_low' }
  if (state.resources.money < nextTier.cost) return { ok: false, reason: 'insufficient_funds' }

  return { ok: true }
}

/**
 * @param {import('../types/state.js').GameState} state
 * @returns {{ ok: boolean, reason?: string }}
 */
export function upgradeFleet(state) {
  const result = canUpgradeFleet(state)
  if (!result.ok) return result

  const nextTier = getNextVehicleTier(state.distribution.fleet.vehicleTierId)
  state.resources.money -= nextTier.cost
  state.distribution.fleet = { vehicleTierId: nextTier.id, count: 1 }

  return { ok: true }
}

export { getDistributionBuilding, getMaxSlots }
