import { useClock } from './useClock.js'

// Module-scoped, single shared table - same reasoning as useClock's nowMs:
// there's only ever one GameCanvas, this must survive outside Pinia so
// per-frame reads never touch the autosave-triggering store, and every
// caller should share one source of truth.
const animState = new Map() // id -> { level, placedAt, levelUpAt }

const POP_DURATION_MS = 450

/** Standard back-out: overshoots past 1 partway through, settles to 1 - reads as a small bounce. */
function easeOutBack(t) {
  const c1 = 1.70158
  const c3 = c1 + 1
  const x = t - 1
  return 1 + c3 * x ** 3 + c1 * x ** 2
}

export function useBuildingAnimations() {
  const { nowMs } = useClock()

  /**
   * Call once per render() frame, before drawing, with the current
   * store.allBuildings array. O(n) - the same order as the draw loop
   * itself, so no added asymptotic cost. Buildings are never demolished
   * today (relocation keeps the same id), so pruning below is defensive
   * insurance rather than something currently reachable.
   */
  function sync(buildings) {
    const seen = new Set()
    for (const b of buildings) {
      seen.add(b.id)
      let entry = animState.get(b.id)
      if (!entry) {
        entry = { level: b.level, placedAt: nowMs.value, levelUpAt: null }
        animState.set(b.id, entry)
      } else if (b.level > entry.level) {
        entry.levelUpAt = nowMs.value
        entry.level = b.level
      }
    }
    for (const id of animState.keys()) {
      if (!seen.has(id)) animState.delete(id)
    }
  }

  /**
   * @returns {{ scale: number } | null} null when not mid-animation
   *   (caller draws at scale 1, no transform overhead most frames).
   */
  function getPopTransform(buildingId) {
    const entry = animState.get(buildingId)
    if (!entry) return null
    const isLevelUp = entry.levelUpAt != null
    const eventAt = isLevelUp ? entry.levelUpAt : entry.placedAt
    const elapsed = nowMs.value - eventAt
    if (elapsed < 0 || elapsed >= POP_DURATION_MS) return null
    const t = elapsed / POP_DURATION_MS
    // New placement: grow in from nothing (building wasn't visible a
    // moment ago anyway). Level-up: never fully vanish it mid-game, just a
    // small bounce around its resting scale.
    const floor = isLevelUp ? 0.82 : 0
    const eased = easeOutBack(t)
    return { scale: floor + (1 - floor) * eased }
  }

  return { sync, getPopTransform }
}
