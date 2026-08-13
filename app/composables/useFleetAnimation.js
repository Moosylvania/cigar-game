import { useClock } from './useClock.js'

// Module-scoped, ephemeral, never persisted - same reasoning as useClock's
// nowMs: this must survive outside Pinia so per-frame updates never touch
// the autosave-triggering store, and every caller shares one source of
// truth (there's only ever one GameCanvas on screen).
const vehicles = []
let nextId = 1
let nextSpawnAt = 0

const SPAWN_INTERVAL_MS = 4500
const SPAWN_JITTER_MS = 1500
const TRAVEL_DURATION_MS = 3200
const TRAVEL_TILES = 12
// Deliberately NOT tied to real fleet size or the actual per-tick export
// math (see engine/economy.js/distributionEngine.js, untouched by this) -
// this is ambient flavor only, capped at a fixed concurrency regardless of
// how big the fleet actually is.
const MAX_CONCURRENT = 4

const DIRECTION_VECTORS = { n: [0, -1], e: [1, 0], s: [0, 1], w: [-1, 0] }
const DIRECTIONS = Object.keys(DIRECTION_VECTORS)

function easeInOutSine(t) {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

function pickWeightedTier(fleet) {
  const total = fleet.reduce((sum, entry) => sum + entry.count, 0)
  let r = Math.random() * total
  for (const entry of fleet) {
    r -= entry.count
    if (r <= 0) return entry.vehicleTierId
  }
  return fleet[0].vehicleTierId
}

/**
 * Spawner + lifecycle for the fleet's cosmetic driving animation. Purely
 * visual flavor representing exports happening - not wired to the real
 * export/sale math at all.
 */
export function useFleetAnimation() {
  const { nowMs } = useClock()

  /** Call once per render() frame. Prunes finished trips, maybe spawns one new vehicle. */
  function update(store) {
    const t = nowMs.value
    for (let i = vehicles.length - 1; i >= 0; i--) {
      if (t - vehicles[i].spawnedAt >= vehicles[i].durationMs) vehicles.splice(i, 1)
    }

    const depot = store.distributionBuilding
    const fleet = store.fleet
    const eligible = depot && fleet.length > 0 && store.storage.cigars > 0
    if (!eligible || vehicles.length >= MAX_CONCURRENT) return
    if (t < nextSpawnAt) return

    const direction = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)]
    const [dx, dy] = DIRECTION_VECTORS[direction]
    const startX = depot.position.x + 1
    const startY = depot.position.y + 1
    vehicles.push({
      id: nextId++,
      tierId: pickWeightedTier(fleet),
      direction,
      startX,
      startY,
      endX: startX + dx * TRAVEL_TILES,
      endY: startY + dy * TRAVEL_TILES,
      spawnedAt: t,
      durationMs: TRAVEL_DURATION_MS
    })
    nextSpawnAt = t + SPAWN_INTERVAL_MS + Math.random() * SPAWN_JITTER_MS
  }

  function getActiveVehicles() {
    return vehicles
  }

  return { update, getActiveVehicles }
}

/**
 * Pure function of elapsed time - safe to call every frame per vehicle.
 * @returns {{ x: number, y: number, alpha: number }}
 */
export function getVehicleWorldPosition(vehicle, nowMs) {
  const progress = Math.min(1, (nowMs - vehicle.spawnedAt) / vehicle.durationMs)
  const eased = easeInOutSine(progress)
  const x = vehicle.startX + (vehicle.endX - vehicle.startX) * eased
  const y = vehicle.startY + (vehicle.endY - vehicle.startY) * eased
  // Fade in over the first 10% and out over the last 15% of the trip -
  // avoids needing any camera/viewport-bounds awareness to look clean.
  const alpha = Math.min(progress / 0.1, (1 - progress) / 0.15, 1)
  return { x, y, alpha: Math.max(0, alpha) }
}
