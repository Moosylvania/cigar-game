import { getPipelineStage, PIPELINE_STAGES } from '../config/pipeline.config.js'
import { getLevelStats } from '../config/buildings/index.js'
import { getAutomationTier } from '../config/automation.config.js'
import { getCigarStorageCapacity } from './distributionEngine.js'
import { now } from '../util/time.js'

/**
 * @typedef {Object} StartBatchResult
 * @property {boolean} ok
 * @property {string} [reason]
 */

/**
 * Starts processing a batch on a pipeline building: pulls input from the
 * upstream storage (capped by this building's level-based batch capacity)
 * and starts a timer. Every stage has an inputKey, including Nursery,
 * whose input is 'seeds' bought from the Store (see store.config.js) - so
 * this never needs a "no input" fallback in practice. Starting doesn't
 * check downstream output capacity (see collectBatch/cappedOutput) - a
 * batch can start even if the Depot happens to be full right now, since
 * it might have room again by the time this batch finishes.
 * @param {import('../types/building.js').PlacedBuilding} building
 * @param {import('../types/state.js').GameState} state
 * @param {{ speedMultipliers: Object<string, number>, batchSizeMultipliers: Object<string, number> }} labMultipliers
 * @param {number} [maxAmount] - caps how much this call may pull from input,
 *   on top of the building's own capacity/available-storage caps. Used by
 *   runAutomation/fastForwardAutomation to give same-type buildings a fair
 *   proportional share of shared input instead of first-come-first-served
 *   (see computeFairShares) - a manual player click never passes this, so
 *   it always defaults to "no extra cap".
 * @returns {StartBatchResult}
 */
export function startBatch(building, state, labMultipliers, maxAmount = Infinity) {
  const stage = getPipelineStage(building.type)
  if (!stage) return { ok: false, reason: 'not_a_pipeline_building' }
  if (!building.slot) return { ok: false, reason: 'no_slot' }
  if (building.upgrade) return { ok: false, reason: 'building_upgrading' }
  if (building.slot.status !== 'idle') return { ok: false, reason: 'slot_not_idle' }

  const levelStats = getLevelStats(building.type, building.level)
  const batchSizeMultiplier = labMultipliers?.batchSizeMultipliers?.[building.type] ?? 1
  const capacity = Math.round(levelStats.batchSize * batchSizeMultiplier)

  let moved = capacity
  if (stage.inputKey) {
    const available = state.resources.storage[stage.inputKey]
    moved = Math.min(capacity, available, maxAmount)
    if (moved <= 0) return { ok: false, reason: 'no_input_available' }
    state.resources.storage[stage.inputKey] -= moved
  }

  const speedMultiplier = labMultipliers?.speedMultipliers?.[building.type] ?? 1
  const durationSeconds = levelStats.processingDurationSeconds * speedMultiplier
  const startedAt = now()

  building.slot = {
    status: 'processing',
    batchSize: moved,
    startedAt,
    completesAt: startedAt + durationSeconds * 1000
  }

  return { ok: true }
}

/**
 * Moves a finished batch's output into this building's output storage,
 * making it available as the next stage's input. Rolling's output
 * (cigars) is cappedOutput - bounded by the Distribution Depot's storage
 * capacity - so collecting past that cap overflows and loses the excess
 * instead of piling up unbounded; every other stage's storage is
 * unlimited. Selling cigars happens separately and continuously in
 * economy.js's exportCigars, not here.
 * @param {import('../types/building.js').PlacedBuilding} building
 * @param {import('../types/state.js').GameState} state
 * @param {Object} [labMultipliers]
 * @returns {StartBatchResult & { overflowed?: number }}
 */
export function collectBatch(building, state, labMultipliers) {
  const stage = getPipelineStage(building.type)
  if (!stage) return { ok: false, reason: 'not_a_pipeline_building' }
  if (!building.slot) return { ok: false, reason: 'no_slot' }
  if (building.slot.status !== 'ready') return { ok: false, reason: 'slot_not_ready' }

  let overflowed = 0
  if (stage.cappedOutput) {
    const capacity = getCigarStorageCapacity(state, labMultipliers)
    const available = Math.max(0, capacity - state.resources.storage[stage.outputKey])
    const stored = Math.min(building.slot.batchSize, available)
    state.resources.storage[stage.outputKey] += stored
    overflowed = building.slot.batchSize - stored
  } else {
    state.resources.storage[stage.outputKey] += building.slot.batchSize
  }
  building.slot = { status: 'idle', batchSize: 0 }

  return { ok: true, overflowed }
}

/**
 * Flips any processing slot whose timer has completed to 'ready'. This is
 * the only per-tick engine work for pipeline buildings, and it's what
 * "advances" while the tab is closed - nothing else auto-cascades.
 * @param {import('../types/state.js').GameState} state
 * @param {number} atTime
 */
export function resolveOfflineSlots(state, atTime = now()) {
  for (const building of state.buildings) {
    if (building.slot?.status === 'processing' && building.slot.completesAt <= atTime) {
      building.slot = { ...building.slot, status: 'ready' }
    }
  }
}

function buildingsInPipelineOrder(state) {
  const order = PIPELINE_STAGES.map((stage) => stage.type)
  return state.buildings
    .filter((b) => b.slot)
    .sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type))
}

/**
 * Buildings aren't singleton - a player can place several of the same
 * pipeline type (e.g. 5 Fermentation Cellars), and they all draw from the
 * same shared input storage. Splitting input by array/placement order
 * (first-come-first-served) meant whichever building happened to iterate
 * last would systematically starve every tick once demand exceeded supply,
 * even though the others were running fine - not a fluke, a standing bias
 * toward whichever building placed first. This instead gives every
 * same-type building a share of the available input proportional to how
 * much it's asking for, so a shortfall is spread across all of them
 * (smaller batches for everyone) instead of concentrated on one building
 * getting nothing.
 * @param {number} availableInput
 * @param {import('../types/building.js').PlacedBuilding[]} buildings - same type, all idle
 * @param {Object} labMultipliers
 * @returns {Map<import('../types/building.js').PlacedBuilding, number>}
 */
function computeFairShares(availableInput, buildings, labMultipliers) {
  const batchSizeMultiplier = labMultipliers?.batchSizeMultipliers?.[buildings[0].type] ?? 1
  const desired = buildings.map((b) => Math.round(getLevelStats(b.type, b.level).batchSize * batchSizeMultiplier))
  const totalDesired = desired.reduce((sum, d) => sum + d, 0)

  const shares = new Map()
  if (totalDesired <= 0) {
    buildings.forEach((b) => shares.set(b, 0))
  } else if (totalDesired <= availableInput) {
    buildings.forEach((b, i) => shares.set(b, desired[i]))
  } else {
    const ratio = availableInput / totalDesired
    buildings.forEach((b, i) => shares.set(b, Math.floor(desired[i] * ratio)))
  }
  return shares
}

/**
 * Realtime automation: once a building has leveled up enough (see
 * game/config/automation.config.js), it auto-collects finished batches and
 * auto-starts new ones every tick instead of waiting for player clicks.
 * Collects run first for every building, then starts - so a freshly
 * auto-collected upstream output is available to every downstream start
 * this same tick regardless of type ordering. Starts are grouped by
 * building type so duplicate buildings of the same type share input
 * fairly (see computeFairShares) rather than first-come-first-served. An
 * automated Rolling House auto-collecting into a full Depot just overflows
 * silently each tick, same as a manual collect would.
 * @param {import('../types/state.js').GameState} state
 * @param {{ speedMultipliers: Object<string, number>, batchSizeMultipliers: Object<string, number> }} labMultipliers
 */
export function runAutomation(state, labMultipliers) {
  const ordered = buildingsInPipelineOrder(state)

  for (const building of ordered) {
    const { autoCollect } = getAutomationTier(building.level)
    if (building.slot.status === 'ready' && autoCollect) {
      collectBatch(building, state, labMultipliers)
    }
  }

  const idleByType = new Map()
  for (const building of ordered) {
    const { autoStart } = getAutomationTier(building.level)
    if (building.slot.status !== 'idle' || !autoStart || building.upgrade) continue
    const list = idleByType.get(building.type) ?? []
    list.push(building)
    idleByType.set(building.type, list)
  }

  for (const buildings of idleByType.values()) {
    const stage = getPipelineStage(buildings[0].type)
    const availableInput = state.resources.storage[stage.inputKey]
    const shares = computeFairShares(availableInput, buildings, labMultipliers)
    for (const building of buildings) {
      const share = shares.get(building)
      if (share > 0) startBatch(building, state, labMultipliers, share)
    }
  }
}

/**
 * Offline catch-up for fully-automated buildings (autoCollect + autoStart):
 * closed-form "how many cycles fit in the elapsed time and available
 * input" instead of stepping through simulated time. Buildings without
 * full automation are left alone here - resolveOfflineSlots already
 * handled their single in-flight batch, and the player collects/restarts
 * by hand. Collects run before any starts (same reasoning as
 * runAutomation), and same-type buildings split the shared input pool
 * evenly up front instead of the first ones in array order exhausting it
 * (see computeFairShares/runAutomation for the realtime version of this).
 * Rolling's cycles are additionally capped by remaining Depot storage room
 * (cappedOutput) - it can't produce more offline than the Depot could ever
 * hold, which is also why this no longer earns money directly: selling
 * now happens in a separate throughput-limited pass (see economy.js
 * exportCigars), called once over the same elapsed window after this
 * finishes producing.
 * @param {import('../types/state.js').GameState} state
 * @param {number} elapsedSeconds
 * @param {{ speedMultipliers: Object<string, number>, batchSizeMultipliers: Object<string, number> }} labMultipliers
 */
export function fastForwardAutomation(state, elapsedSeconds, labMultipliers) {
  if (elapsedSeconds <= 0) return

  const ordered = buildingsInPipelineOrder(state).filter((building) => {
    const { autoCollect, autoStart } = getAutomationTier(building.level)
    return autoCollect && autoStart && !building.upgrade
  })

  for (const building of ordered) {
    if (building.slot.status === 'ready') {
      collectBatch(building, state, labMultipliers)
    }
  }

  const idleByType = new Map()
  for (const building of ordered) {
    if (building.slot.status !== 'idle') continue
    const list = idleByType.get(building.type) ?? []
    list.push(building)
    idleByType.set(building.type, list)
  }

  for (const buildings of idleByType.values()) {
    const stage = getPipelineStage(buildings[0].type)
    if (!stage) continue

    // Even split of the shared input pool across same-type buildings, up
    // front - each then independently computes its own cycles/partial
    // batch against its share instead of the whole pool.
    const inputSharePerBuilding = state.resources.storage[stage.inputKey] / buildings.length

    for (const building of buildings) {
      const levelStats = getLevelStats(building.type, building.level)
      const batchSizeMultiplier = labMultipliers?.batchSizeMultipliers?.[building.type] ?? 1
      const capacity = Math.round(levelStats.batchSize * batchSizeMultiplier)
      const speedMultiplier = labMultipliers?.speedMultipliers?.[building.type] ?? 1
      const durationSeconds = levelStats.processingDurationSeconds * speedMultiplier
      if (capacity <= 0 || durationSeconds <= 0) continue

      const cyclesByTime = Math.floor(elapsedSeconds / durationSeconds)
      const cyclesByInput = Math.floor(inputSharePerBuilding / capacity)
      let cycles = Math.max(0, Math.min(cyclesByTime, cyclesByInput))

      if (stage.cappedOutput) {
        const remainingCapacity = getCigarStorageCapacity(state, labMultipliers) - state.resources.storage[stage.outputKey]
        const cyclesByOutputCapacity = Math.floor(Math.max(0, remainingCapacity) / capacity)
        cycles = Math.min(cycles, cyclesByOutputCapacity)
      }

      let remainingSeconds = elapsedSeconds
      let remainingShare = inputSharePerBuilding
      if (cycles > 0) {
        state.resources.storage[stage.inputKey] -= cycles * capacity
        state.resources.storage[stage.outputKey] += cycles * capacity
        remainingSeconds -= cycles * durationSeconds
        remainingShare -= cycles * capacity
      }

      // Leave one partial batch in progress so the player comes back to
      // something already underway rather than a fully idle building.
      if (remainingSeconds > 0) {
        const startResult = startBatch(building, state, labMultipliers, remainingShare)
        if (startResult.ok && building.slot.status === 'processing') {
          building.slot.completesAt -= remainingSeconds * 1000
        }
      }
    }
  }
}
