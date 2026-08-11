import { resolveOfflineSlots, fastForwardAutomation } from './batchEngine.js'
import { resolveCompletedUpgrades } from './upgradeEngine.js'
import { getMultipliers } from './labEngine.js'
import { getEpicMultipliers } from './epicResearchEngine.js'
import { getTotalPrestigeMultiplier } from './prestigeEngine.js'
import { exportCigars } from './economy.js'
import { now } from '../util/time.js'

/**
 * Same merge the Pinia store's combinedMultipliers getter does, needed
 * here too since offline catch-up runs before the store is hydrated (see
 * app/plugins/game-init.client.js) and so has no access to that getter.
 * @param {import('../types/state.js').GameState} state
 */
function getCombinedMultipliers(state) {
  const lab = getMultipliers(state.lab)
  const epic = getEpicMultipliers(state.prestige)
  const speedMultipliers = {}
  for (const key of new Set([...Object.keys(lab.speedMultipliers), ...Object.keys(epic.speedMultipliers)])) {
    speedMultipliers[key] = (lab.speedMultipliers[key] ?? 1) * (epic.speedMultipliers[key] ?? 1)
  }
  const batchSizeMultipliers = {}
  for (const key of new Set([...Object.keys(lab.batchSizeMultipliers), ...Object.keys(epic.batchSizeMultipliers)])) {
    batchSizeMultipliers[key] = (lab.batchSizeMultipliers[key] ?? 1) * (epic.batchSizeMultipliers[key] ?? 1)
  }
  return {
    salePriceMultiplier: lab.salePriceMultiplier * epic.salePriceMultiplier,
    speedMultipliers,
    batchSizeMultipliers,
    depotCapacityMultiplier: lab.depotCapacityMultiplier * epic.depotCapacityMultiplier,
    fleetThroughputMultiplier: lab.fleetThroughputMultiplier * epic.fleetThroughputMultiplier,
    prestigeMultiplier: getTotalPrestigeMultiplier(state.prestige, epic.prestigeMultiplierBoost)
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
  const multipliers = getCombinedMultipliers(state)
  fastForwardAutomation(state, elapsedSeconds, multipliers)
  return exportCigars(state, elapsedSeconds, multipliers)
}
