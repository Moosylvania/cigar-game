import { resolveOfflineSlots, fastForwardAutomation } from './batchEngine.js'
import { resolveCompletedUpgrades } from './upgradeEngine.js'
import { getMultipliers } from './labEngine.js'
import { getEpicMultipliers } from './epicResearchEngine.js'
import { getTotalPrestigeMultiplier } from './prestigeEngine.js'
import { getBoostMultipliers } from './boostEngine.js'
import { updateCoinDelivery } from './coinDeliveryEngine.js'
import { exportCigars } from './economy.js'
import { PIPELINE_STAGES } from '../config/pipeline.config.js'
import { now } from '../util/time.js'

/**
 * Same merge the Pinia store's combinedMultipliers getter does, needed
 * here too since offline catch-up runs before the store is hydrated (see
 * app/plugins/game-init.client.js) and so has no access to that getter.
 * Boost multipliers are evaluated once at atTime (when the player
 * returns), same simplification the rest of this function already makes
 * treating the whole offline gap as one uniform block - a boost that
 * expired partway through the gap only stops contributing from atTime
 * onward, not retroactively for the portion of the gap it was still
 * running, but boosts are short (minutes) relative to the offline gaps
 * this exists for (hours+), so that imprecision is a rounding error here.
 * @param {import('../types/state.js').GameState} state
 * @param {number} atTime
 */
function getCombinedMultipliers(state, atTime) {
  const lab = getMultipliers(state.lab)
  const epic = getEpicMultipliers(state.prestige)
  const boost = getBoostMultipliers(state.boosts, atTime)
  const speedMultipliers = {}
  for (const stage of PIPELINE_STAGES) {
    const type = stage.type
    speedMultipliers[type] = (lab.speedMultipliers[type] ?? 1) * (epic.speedMultipliers[type] ?? 1) * boost.processingSpeedMultiplier
  }
  const batchSizeMultipliers = {}
  for (const key of new Set([...Object.keys(lab.batchSizeMultipliers), ...Object.keys(epic.batchSizeMultipliers)])) {
    batchSizeMultipliers[key] = (lab.batchSizeMultipliers[key] ?? 1) * (epic.batchSizeMultipliers[key] ?? 1)
  }
  return {
    salePriceMultiplier: lab.salePriceMultiplier * epic.salePriceMultiplier * boost.salePriceMultiplier,
    speedMultipliers,
    batchSizeMultipliers,
    depotCapacityMultiplier: lab.depotCapacityMultiplier * epic.depotCapacityMultiplier,
    fleetThroughputMultiplier: lab.fleetThroughputMultiplier * epic.fleetThroughputMultiplier,
    prestigeMultiplier: getTotalPrestigeMultiplier(state.prestige, epic.prestigeMultiplierBoost),
    upgradeSpeedMultiplier: boost.upgradeSpeedMultiplier
  }
}

/**
 * Runs the full offline catch-up: resolves any batch timers and upgrade
 * timers that finished while away, fast-forwards any fully-automated
 * buildings through as many additional cycles as elapsed time and
 * available input/Depot storage room allow, then runs the Depot's export
 * over that same elapsed window - a single throughput-limited sell pass
 * against whatever ended up in cigar storage, same formula as the
 * realtime tick just run once for the whole gap instead of every second.
 * A non-automated Rolling House just has its one in-flight batch left
 * 'ready' for the player to collect by hand, same as before.
 * @param {import('../types/state.js').GameState} state
 * @param {number} elapsedSeconds
 * @returns {{ cigarsSold: number, moneyEarned: number }}
 */
export function runOfflineCatchUp(state, elapsedSeconds) {
  const atTime = now()
  resolveOfflineSlots(state, atTime)
  resolveCompletedUpgrades(state, atTime)
  const multipliers = getCombinedMultipliers(state, atTime)
  fastForwardAutomation(state, elapsedSeconds, multipliers)
  updateCoinDelivery(state, atTime)
  return exportCigars(state, elapsedSeconds, multipliers)
}
