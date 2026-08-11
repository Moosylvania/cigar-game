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
 * @returns {StartBatchResult}
 */
export function startBatch(building, state, labMultipliers) {
  const stage = getPipelineStage(building.type)
  if (!stage) return { ok: false, reason: 'not_a_pipeline_building' }
  if (!building.slot) return { ok: false, reason: 'no_slot' }
  if (building.slot.status !== 'idle') return { ok: false, reason: 'slot_not_idle' }

  const levelStats = getLevelStats(building.type, building.level)
  const batchSizeMultiplier = labMultipliers?.batchSizeMultipliers?.[building.type] ?? 1
  const capacity = Math.round(levelStats.batchSize * batchSizeMultiplier)

  let moved = capacity
  if (stage.inputKey) {
    const available = state.resources.storage[stage.inputKey]
    moved = Math.min(capacity, available)
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
 * Realtime automation: once a building has leveled up enough (see
 * game/config/automation.config.js), it auto-collects finished batches and
 * auto-starts new ones every tick instead of waiting for player clicks.
 * Runs in pipeline order so a freshly auto-collected upstream output is
 * available to auto-start a downstream batch in the same tick. An
 * automated Rolling House auto-collecting into a full Depot just overflows
 * silently each tick, same as a manual collect would.
 * @param {import('../types/state.js').GameState} state
 * @param {{ speedMultipliers: Object<string, number>, batchSizeMultipliers: Object<string, number> }} labMultipliers
 */
export function runAutomation(state, labMultipliers) {
  for (const building of buildingsInPipelineOrder(state)) {
    const { autoCollect, autoStart } = getAutomationTier(building.level)

    if (building.slot.status === 'ready' && autoCollect) {
      collectBatch(building, state, labMultipliers)
    }
    if (building.slot.status === 'idle' && autoStart) {
      startBatch(building, state, labMultipliers)
    }
  }
}

/**
 * Offline catch-up for fully-automated buildings (autoCollect + autoStart):
 * closed-form "how many cycles fit in the elapsed time and available
 * input" instead of stepping through simulated time. Buildings without
 * full automation are left alone here - resolveOfflineSlots already
 * handled their single in-flight batch, and the player collects/restarts
 * by hand. Runs in pipeline order so upstream cycles feed downstream
 * input, same as runAutomation. Rolling's cycles are additionally capped
 * by remaining Depot storage room (cappedOutput) - it can't produce more
 * offline than the Depot could ever hold, which is also why this no
 * longer earns money directly: selling now happens in a separate
 * throughput-limited pass (see economy.js exportCigars), called once over
 * the same elapsed window after this finishes producing.
 * @param {import('../types/state.js').GameState} state
 * @param {number} elapsedSeconds
 * @param {{ speedMultipliers: Object<string, number>, batchSizeMultipliers: Object<string, number> }} labMultipliers
 */
export function fastForwardAutomation(state, elapsedSeconds, labMultipliers) {
  if (elapsedSeconds <= 0) return

  for (const building of buildingsInPipelineOrder(state)) {
    const { autoCollect, autoStart } = getAutomationTier(building.level)
    if (!autoCollect || !autoStart) continue

    const stage = getPipelineStage(building.type)
    if (!stage) continue

    if (building.slot.status === 'ready') {
      collectBatch(building, state, labMultipliers)
    }
    if (building.slot.status !== 'idle') continue

    const levelStats = getLevelStats(building.type, building.level)
    const batchSizeMultiplier = labMultipliers?.batchSizeMultipliers?.[building.type] ?? 1
    const capacity = Math.round(levelStats.batchSize * batchSizeMultiplier)
    const speedMultiplier = labMultipliers?.speedMultipliers?.[building.type] ?? 1
    const durationSeconds = levelStats.processingDurationSeconds * speedMultiplier
    if (capacity <= 0 || durationSeconds <= 0) continue

    const cyclesByTime = Math.floor(elapsedSeconds / durationSeconds)
    const cyclesByInput = Math.floor(state.resources.storage[stage.inputKey] / capacity)
    let cycles = Math.max(0, Math.min(cyclesByTime, cyclesByInput))

    if (stage.cappedOutput) {
      const remainingCapacity = getCigarStorageCapacity(state, labMultipliers) - state.resources.storage[stage.outputKey]
      const cyclesByOutputCapacity = Math.floor(Math.max(0, remainingCapacity) / capacity)
      cycles = Math.min(cycles, cyclesByOutputCapacity)
    }

    let remainingSeconds = elapsedSeconds
    if (cycles > 0) {
      state.resources.storage[stage.inputKey] -= cycles * capacity
      state.resources.storage[stage.outputKey] += cycles * capacity
      remainingSeconds -= cycles * durationSeconds
    }

    // Leave one partial batch in progress so the player comes back to
    // something already underway rather than a fully idle building.
    if (remainingSeconds > 0) {
      const startResult = startBatch(building, state, labMultipliers)
      if (startResult.ok && building.slot.status === 'processing') {
        building.slot.completesAt -= remainingSeconds * 1000
      }
    }
  }
}
