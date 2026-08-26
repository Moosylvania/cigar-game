import { PRESTIGE_TIERS, MAX_TIER_MULTIPLIER, CURVE_HALF_FRACTION, ACTIVE_TIER_PRICE_GROWTH } from '../config/prestige.config.js'
import { createInitialState } from '../state/createInitialState.js'
import { TROPHIES } from '../config/trophies.config.js'

/**
 * @param {import('../types/state.js').GameState} state
 * @returns {{ ok: boolean, reason?: string, dollarsEarned: number }}
 */
export function canPrestige(state) {
  const dollarsEarned = state.meta.lifetimeMoneyEarned ?? 0
  if (dollarsEarned < 1) return { ok: false, reason: 'insufficient_progress', dollarsEarned }
  return { ok: true, dollarsEarned }
}

/** Start of tier i's own dollar "band" - the previous tier's threshold, or 0 for the first tier. */
function tierStartThreshold(tierIndex) {
  return tierIndex <= 0 ? 0 : PRESTIGE_TIERS[tierIndex - 1].unlockThreshold
}

/**
 * Diminishing-returns curve for a single tier, based on how far your
 * all-time earnings have filled that tier's own dollar band - capped
 * asymptotically at MAX_TIER_MULTIPLIER, never quite reached. Once your
 * earnings cross into the *next* tier's band, this tier's progress is
 * clamped at 100% of its own band and its multiplier freezes there -
 * moving on locks in what you'd built up, same as every tier before it.
 * The last tier has no finite band (nothing past it), so its half-point
 * is scaled off its own starting threshold instead of a band width.
 * @param {number} tierIndex
 * @param {number} allTimeEarned
 * @returns {number}
 */
export function getVarietyMultiplier(tierIndex, allTimeEarned) {
  const start = tierStartThreshold(tierIndex)
  const end = PRESTIGE_TIERS[tierIndex]?.unlockThreshold ?? Infinity
  const bandWidth = end - start

  const progress = Number.isFinite(bandWidth)
    ? Math.max(0, Math.min(allTimeEarned - start, bandWidth))
    : Math.max(0, allTimeEarned - start)
  if (progress <= 0) return 1

  const halfPoint = Number.isFinite(bandWidth) ? bandWidth * CURVE_HALF_FRACTION : start * CURVE_HALF_FRACTION
  return 1 + (MAX_TIER_MULTIPLIER - 1) * (progress / (progress + halfPoint))
}

/**
 * Flat bonus for whichever tier is currently *active* (prestige.
 * activeTierIndex - see advanceTier), separate from and multiplicative
 * with getVarietyMultiplier's cumulative band-progress product below.
 * Rewards actually playing at a tier's scale, not just having earned past
 * it once - moving back to an earlier tier's look (a full reset, same as
 * any other tier move) drops this back down to that tier's own bonus,
 * even though the cumulative multiplier stays at its full locked-in value
 * regardless of which tier is active.
 * @param {number} activeTierIndex
 * @returns {number}
 */
export function getActiveTierMultiplier(activeTierIndex) {
  return ACTIVE_TIER_PRICE_GROWTH ** Math.max(0, activeTierIndex)
}

/**
 * Product of every *selected* tier's own cumulative multiplier (see
 * advanceTier - a tier earning enough to qualify isn't enough on its own,
 * the player has to explicitly move into it) times the active tier's flat
 * bonus (see getActiveTierMultiplier) times any epic research
 * prestigeMultiplierBoost - this is the number that ultimately reaches
 * economy.js's getEffectiveSalePrice.
 * @param {import('../types/prestige.js').PrestigeState} prestigeState
 * @param {number} [prestigeMultiplierBoost]
 * @returns {number}
 */
export function getTotalPrestigeMultiplier(prestigeState, prestigeMultiplierBoost = 1) {
  const allTimeEarned = prestigeState.lifetimeMoneyEarnedAllTime ?? 0
  let total = 1
  for (let i = 0; i < prestigeState.unlockedCount; i++) {
    total *= getVarietyMultiplier(i, allTimeEarned)
  }
  const activeTierIndex = prestigeState.activeTierIndex ?? prestigeState.unlockedCount - 1
  total *= getActiveTierMultiplier(activeTierIndex)
  return total * prestigeMultiplierBoost
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
 * Shared by doPrestige and advanceTier - everything except state.prestige
 * goes back to fresh, and even within state.prestige, epicResearchLevels
 * resets too (unlike the tier/trophy/all-time-earnings fields, which stay
 * permanent) - Epic Research is meant to be bought fresh each run, not
 * accumulated forever across prestiges.
 */
function resetBoard(state) {
  const fresh = createInitialState()
  state.townHall = fresh.townHall
  state.buildings = fresh.buildings
  state.resources = fresh.resources
  state.land = fresh.land
  state.lab = fresh.lab
  state.distribution = fresh.distribution
  state.boosts = fresh.boosts
  state.decorations = fresh.decorations
  state.meta = fresh.meta
  state.prestige.epicResearchLevels = {}
}

/**
 * Resets the run, banking this run's earnings into the permanent all-time
 * total - but deliberately does NOT change which tier is active. Earning
 * enough to qualify for the next tier only makes it *eligible*; moving
 * into it is a separate, explicit choice (see advanceTier) so a big
 * prestige can't silently jump the player through several tiers at once.
 * Mutates state in place so callers (the Pinia store) keep the same
 * object reference.
 * @param {import('../types/state.js').GameState} state
 * @returns {{ ok: boolean, reason?: string, dollarsEarned?: number, newTrophyIds?: string[] }}
 */
export function doPrestige(state) {
  const result = canPrestige(state)
  if (!result.ok) return result

  const dollarsEarned = result.dollarsEarned
  const prestige = state.prestige
  prestige.lifetimeMoneyEarnedAllTime = (prestige.lifetimeMoneyEarnedAllTime ?? 0) + dollarsEarned
  prestige.totalPrestigeCount += 1

  const newTrophyIds = checkTrophies(prestige)
  resetBoard(state)

  return { ok: true, dollarsEarned, newTrophyIds }
}

/**
 * A target tier is reachable one of two ways: it's brand new (index >=
 * unlockedCount) and its own threshold is met, or it's a tier the player
 * has already unlocked before (index < unlockedCount, including ones
 * behind their current active tier) - those need no threshold check since
 * they were already earned once. Either way advancing there always costs
 * the same full reset (see advanceTier) - going back to an old tier starts
 * it fresh from the beginning, it doesn't resume whatever was built there
 * last time.
 * @param {import('../types/state.js').GameState} state
 * @param {number} [targetIndex] - tier index to move to; defaults to the
 *   very next tier (unlockedCount) for backward-compat callers.
 * @returns {{ ok: boolean, reason?: string, projectedTotal?: number, targetIndex?: number }}
 */
export function canAdvanceTier(state, targetIndex) {
  const prestige = state.prestige
  const resolvedTarget = targetIndex ?? prestige.unlockedCount
  if (resolvedTarget < 0 || resolvedTarget >= PRESTIGE_TIERS.length) return { ok: false, reason: 'invalid_tier' }

  const activeIndex = prestige.activeTierIndex ?? prestige.unlockedCount - 1
  if (resolvedTarget === activeIndex) return { ok: false, reason: 'already_active' }

  const projectedTotal = (prestige.lifetimeMoneyEarnedAllTime ?? 0) + (state.meta.lifetimeMoneyEarned ?? 0)

  // Already unlocked (forward or back) - no threshold to clear again.
  if (resolvedTarget < prestige.unlockedCount) return { ok: true, projectedTotal, targetIndex: resolvedTarget }

  const threshold = PRESTIGE_TIERS[resolvedTarget - 1].unlockThreshold
  if (projectedTotal < threshold) return { ok: false, reason: 'insufficient_progress' }

  return { ok: true, projectedTotal, targetIndex: resolvedTarget }
}

/**
 * Moves to a chosen tier, only once the player explicitly chooses to (see
 * PrestigePanel.vue) - reaching a tier's dollar threshold only makes it
 * *available*, it never happens on its own. The player can jump straight
 * to any tier whose threshold they've already earned past, not just the
 * next one in line, and can just as freely move back to any tier they'd
 * already reached before (unlockedCount only ever grows, so once a tier's
 * been reached it stays pickable forever). Every move - forward to new
 * territory or back to familiar territory - resets the run (banking any of
 * this run's earnings first, same as doPrestige) and starts the target
 * tier fresh from the beginning: moving between tiers always costs the
 * current run's progress, the same as prestiging does.
 * @param {import('../types/state.js').GameState} state
 * @param {number} [targetIndex] - see canAdvanceTier
 * @returns {{ ok: boolean, reason?: string, dollarsEarned?: number, newTierName?: string, newTrophyIds?: string[] }}
 */
export function advanceTier(state, targetIndex) {
  const result = canAdvanceTier(state, targetIndex)
  if (!result.ok) return result

  const dollarsEarned = state.meta.lifetimeMoneyEarned ?? 0
  const prestige = state.prestige
  prestige.lifetimeMoneyEarnedAllTime = result.projectedTotal
  const newTier = PRESTIGE_TIERS[result.targetIndex]
  prestige.unlockedCount = Math.max(prestige.unlockedCount, result.targetIndex + 1)
  prestige.activeTierIndex = result.targetIndex
  prestige.totalPrestigeCount += 1

  const newTrophyIds = checkTrophies(prestige)
  resetBoard(state)

  return { ok: true, dollarsEarned, newTierName: newTier.name, newTrophyIds }
}
