import { getVehicleTier } from '../config/vehicles.config.js'
import { getLevelStats } from '../config/buildings/index.js'
import { BASE_CIGAR_SALE_PRICE } from '../config/economy.config.js'

/**
 * The fleet is pure throughput now - it sets how many cigars per hour the
 * Depot can export from storage.cigars, nothing about price (see
 * exportCigars). Sale price instead comes from Rolling's own level plus
 * Lab research (see getEffectiveSalePrice) - "upgrade the building that
 * makes the thing" rather than "buy trucks" is what makes cigars worth more.
 * @param {import('../types/distribution.js').DistributionState} distributionState
 * @param {{ fleetThroughputMultiplier?: number }} [labMultipliers]
 * @returns {number} combined fleet capacity, in cigars/hour
 */
export function getFleetCapacityPerHour(distributionState, labMultipliers) {
  const tier = getVehicleTier(distributionState.fleet.vehicleTierId)
  const base = tier ? tier.capacityPerHour * distributionState.fleet.count : 0
  return base * (labMultipliers?.fleetThroughputMultiplier ?? 1)
}

function getRollingSalePriceMultiplier(state) {
  const rolling = state.buildings.find((b) => b.type === 'rolling')
  if (!rolling) return 1
  return getLevelStats('rolling', rolling.level).salePriceMultiplier ?? 1
}

/**
 * @param {import('../types/state.js').GameState} state
 * @param {{ salePriceMultiplier: number, prestigeMultiplier?: number }} labMultipliers
 * @returns {number} money earned per cigar right now
 */
export function getEffectiveSalePrice(state, labMultipliers) {
  return (
    BASE_CIGAR_SALE_PRICE *
    (labMultipliers?.salePriceMultiplier ?? 1) *
    getRollingSalePriceMultiplier(state) *
    (labMultipliers?.prestigeMultiplier ?? 1)
  )
}

/**
 * Exports (sells) from storage.cigars at a rate capped by the fleet's
 * combined capacityPerHour - the only place cigars turn into money now
 * that Rolling deposits into capped storage instead of instant-selling on
 * collect (see batchEngine.js). Same closed-form shape as the rest of the
 * engine's offline catch-up: called with elapsedSeconds=1 every realtime
 * tick, and with the full gap once for offline catch-up.
 * @param {import('../types/state.js').GameState} state
 * @param {number} elapsedSeconds
 * @param {{ salePriceMultiplier: number }} labMultipliers
 * @returns {{ moneyEarned: number, cigarsSold: number }}
 */
export function exportCigars(state, elapsedSeconds, labMultipliers) {
  if (elapsedSeconds <= 0) return { moneyEarned: 0, cigarsSold: 0 }

  const capacityPerHour = getFleetCapacityPerHour(state.distribution, labMultipliers)
  const sellable = Math.min(state.resources.storage.cigars, capacityPerHour * (elapsedSeconds / 3600))
  if (sellable <= 0) return { moneyEarned: 0, cigarsSold: 0 }

  state.resources.storage.cigars -= sellable
  const moneyEarned = sellable * getEffectiveSalePrice(state, labMultipliers)
  state.resources.money += moneyEarned
  // Tracked separately from resources.money (which resets on prestige) -
  // this is the input to the prestige points formula, see prestigeEngine.js.
  state.meta.lifetimeMoneyEarned = (state.meta.lifetimeMoneyEarned ?? 0) + moneyEarned

  return { moneyEarned, cigarsSold: sellable }
}
