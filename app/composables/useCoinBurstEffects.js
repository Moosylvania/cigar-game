import { useClock } from './useClock.js'

// Module-scoped, ephemeral, never persisted - same reasoning as useClock's
// nowMs and useFleetAnimation's vehicles: purely cosmetic "just collected"
// flair, not real game state (the coins themselves are already credited
// by the store action before this ever spawns - see GameCanvas.vue).
const bursts = []
let nextId = 1

const BURST_DURATION_MS = 700

export function useCoinBurstEffects() {
  const { nowMs } = useClock()

  function spawn(x, y, amount) {
    bursts.push({ id: nextId++, x, y, amount, spawnedAt: nowMs.value })
  }

  /** Call once per render() frame to prune finished bursts. */
  function update() {
    const t = nowMs.value
    for (let i = bursts.length - 1; i >= 0; i--) {
      if (t - bursts[i].spawnedAt >= BURST_DURATION_MS) bursts.splice(i, 1)
    }
  }

  function getActiveBursts() {
    return bursts
  }

  return { spawn, update, getActiveBursts, durationMs: BURST_DURATION_MS }
}
