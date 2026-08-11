import { TOBACCO_VARIETIES, MAX_TIER_MULTIPLIER, CURVE_HALF_POINT, POINTS_BASE, POINTS_EXPONENT } from '../config/prestige.config.js'
import { createInitialState } from '../state/createInitialState.js'
import { TROPHIES } from '../config/trophies.config.js'

/**
 * Points payable for a single prestige, from this run's lifetime money
 * earned (game.meta.lifetimeMoneyEarned, tracked in economy.js and reset to
 * 0 each prestige). Diminishing per-run rate on purpose - the grind lives
 * in prestiging repeatedly, not maximizing one huge run.
 * @param {number} lifetimeMoneyEarnedThisRun
 * @returns {number}
 */
export function calculatePrestigePoints(lifetimeMoneyEarnedThisRun) {
  if (lifetimeMoneyEarnedThisRun <= 0) return 0
  return Math.floor((lifetimeMoneyEarnedThisRun / POINTS_BASE) ** POINTS_EXPONENT)
}

/**
 * @param {import('../types/state.js').GameState} state
 * @returns {{ ok: boolean, reason?: string, points: number }}
 */
export function canPrestige(state) {
  const points = calculatePrestigePoints(state.meta.lifetimeMoneyEarned ?? 0)
  if (points < 1) return { ok: false, reason: 'insufficient_progress', points }
  return { ok: true, points }
}

/**
 * Diminishing-returns curve, capped asymptotically at MAX_TIER_MULTIPLIER -
 * "up to 1000x" per variety, never quite reached.
 * @param {number} points
 * @returns {number}
 */
export function getVarietyMultiplier(points) {
  if (points <= 0) return 1
  return 1 + (MAX_TIER_MULTIPLIER - 1) * (points / (points + CURVE_HALF_POINT))
}

/**
 * Product of every unlocked variety's own multiplier, times any epic
 * research prestigeMultiplierBoost - this is the number that ultimately
 * reaches economy.js's getEffectiveSalePrice.
 * @param {import('../types/prestige.js').PrestigeState} prestigeState
 * @param {number} [prestigeMultiplierBoost]
 * @returns {number}
 */
export function getTotalPrestigeMultiplier(prestigeState, prestigeMultiplierBoost = 1) {
  let total = 1
  for (let i = 0; i < prestigeState.unlockedCount; i++) {
    total *= getVarietyMultiplier(prestigeState.varietyPoints[i] ?? 0)
  }
  return total * prestigeMultiplierBoost
}

function unlockThresholdFor(varietyIndex) {
  const variety = TOBACCO_VARIETIES[varietyIndex]
  return variety ? variety.unlockThreshold : Infinity
}

/**
 * @param {import('../types/prestige.js').PrestigeState} prestige
 * @returns {string[]} newly-unlocked trophy ids
 */
export function checkTrophies(prestige) {
  const newlyUnlocked = []
  for (const trophy of TROPHIES) {
    if (prestige.unlockedTrophyIds.includes(trophy.id)) continue
    if (trophy.check(prestige)) {
      prestige.unlockedTrophyIds.push(trophy.id)
      newlyUnlocked.push(trophy.id)
    }
  }
  return newlyUnlocked
}

/**
 * Resets the run for prestige points, preserving state.prestige across the
 * reset (everything else - buildings, resources, land, lab, distribution,
 * meta - goes back to a fresh createInitialState()). Newly-earned points
 * go to whichever variety is currently active (the highest unlocked one);
 * if that pushes it past its unlock threshold, the next variety unlocks
 * for future prestiges - already-unlocked varieties keep what they have.
 * Mutates state in place so callers (the Pinia store) keep the same
 * object reference.
 * @param {import('../types/state.js').GameState} state
 * @returns {{ ok: boolean, reason?: string, pointsEarned?: number, varietyId?: string, unlockedNewVariety?: boolean, newTrophyIds?: string[] }}
 */
export function doPrestige(state) {
  const result = canPrestige(state)
  if (!result.ok) return result

  const pointsEarned = result.points
  const prestige = state.prestige
  const activeIndex = prestige.unlockedCount - 1
  prestige.varietyPoints[activeIndex] = (prestige.varietyPoints[activeIndex] ?? 0) + pointsEarned

  let unlockedNewVariety = false
  if (
    prestige.unlockedCount < TOBACCO_VARIETIES.length &&
    prestige.varietyPoints[activeIndex] >= unlockThresholdFor(activeIndex)
  ) {
    prestige.unlockedCount += 1
    unlockedNewVariety = true
  }

  prestige.totalPrestigeCount += 1
  prestige.lifetimeMoneyEarnedAllTime = (prestige.lifetimeMoneyEarnedAllTime ?? 0) + (state.meta.lifetimeMoneyEarned ?? 0)

  const newTrophyIds = checkTrophies(prestige)

  const fresh = createInitialState()
  state.townHall = fresh.townHall
  state.buildings = fresh.buildings
  state.resources = fresh.resources
  state.land = fresh.land
  state.lab = fresh.lab
  state.distribution = fresh.distribution
  state.decorations = fresh.decorations
  state.meta = fresh.meta
  // state.prestige is left as-is (already updated above) - everything else
  // above came from a fresh state.

  return {
    ok: true,
    pointsEarned,
    varietyId: TOBACCO_VARIETIES[activeIndex].id,
    unlockedNewVariety,
    newTrophyIds
  }
}
