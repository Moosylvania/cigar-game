import { TOBACCO_VARIETIES } from '../config/tobacco.config.js'
import { getResourceLots, getMarketReservedLots } from './tobaccoEngine.js'
import { takeTobaccoResource, getLotValue, getStockCigarMultiplier } from './tobaccoEngine.js'
import { getVehicleTier } from '../config/vehicles.config.js'
import { getLevelStats } from '../config/buildings/index.js'
import { BASE_CIGAR_SALE_PRICE } from '../config/economy.config.js'

/**
 * The fleet is pure throughput now - it sets how many cigars per hour the
 * Depot can export from storage.cigars, nothing about price (see
 * exportCigars). Sale price instead comes from Rolling's own level plus
 * Lab research (see getEffectiveSalePrice) - "upgrade the building that
 * makes the thing" rather than "buy trucks" is what makes cigars worth more.
 * The fleet can freely mix tiers, so this sums every owned entry.
 * @param {import('../types/distribution.js').DistributionState} distributionState
 * @param {{ fleetThroughputMultiplier?: number }} [labMultipliers]
 * @returns {number} combined fleet capacity, in cigars/hour
 */
export function getFleetCapacityPerHour(distributionState, labMultipliers) {
  const base = distributionState.fleet.reduce((sum, entry) => {
    const tier = getVehicleTier(entry.vehicleTierId)
    return sum + (tier ? tier.capacityPerHour * entry.count : 0)
  }, 0)
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
 * @returns {number} base money per cigar before its tobacco variety multiplier
 */
export function getBaseCigarSalePrice(state, labMultipliers) {
  return (
    BASE_CIGAR_SALE_PRICE *
    (labMultipliers?.salePriceMultiplier ?? 1) *
    getRollingSalePriceMultiplier(state) *
    (labMultipliers?.prestigeMultiplier ?? 1)
  )
}

// HUD quote: weighted average of stored cigars; base price when storage is empty.
// Actual exports value the specific (highest-value-first) lots sold.
export function getEffectiveSalePrice(state, labMultipliers) {
  return getBaseCigarSalePrice(state, labMultipliers) * getStockCigarMultiplier(state)
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

  const reserved = getMarketReservedLots(state)
  const stock = getResourceLots(state, 'cigars')
  const soldLots = {}
  let remaining = sellable
  for (const crop of [...TOBACCO_VARIETIES].reverse()) {
    const amount = Math.min(remaining, Math.max(0, (stock[crop.id] ?? 0) - (reserved[crop.id] ?? 0)))
    if (amount > 0) {
      Object.assign(soldLots, takeTobaccoResource(state, 'cigars', amount, crop.id))
      remaining -= amount
    }
  }
  const moneyEarned = getLotValue(soldLots) * getBaseCigarSalePrice(state, labMultipliers)
  state.resources.money += moneyEarned
  // Tracked separately from resources.money (which resets on prestige) -
  // this is the input to the prestige points formula, see prestigeEngine.js.
  state.meta.lifetimeMoneyEarned = (state.meta.lifetimeMoneyEarned ?? 0) + moneyEarned

  return { moneyEarned, cigarsSold: sellable - remaining }
}
