import {
  PRESTIGE_TIERS,
  ACTIVE_TIER_PRICE_GROWTH,
  LEAF_DOLLARS_PER_UNIT,
  LEAF_EARN_EXPONENT,
  BASE_LEAF_BONUS_PER_LEAF,
  LEAF_BOOST_BONUS_PER_LEVEL,
  LEAF_BOOST_BASE_COST,
  LEAF_BOOST_COST_GROWTH,
  LEAF_BOOST_COOLDOWN_MS
} from '../config/prestige.config.js'
import { createInitialState } from '../state/createInitialState.js'
import { TROPHIES } from '../config/trophies.config.js'
import { now } from '../util/time.js'

/**
 * @param {import('../types/state.js').GameState} state
 * @returns {{ ok: boolean, reason?: string, dollarsEarned: number }}
 */
export function canPrestige(state) {
  const dollarsEarned = state.meta.lifetimeMoneyEarned ?? 0
  if (dollarsEarned < 1) return { ok: false, reason: 'insufficient_progress', dollarsEarned }
  return { ok: true, dollarsEarned }
}

/**
 * How many Legacy Leaves a single prestige/advance banks, straight off
 * that run's lifetime earnings - a sub-1 exponent (see
 * prestige.config.js LEAF_EARN_EXPONENT) so a bigger run always earns
 * more leaves without earning proportionally more, and never caps: even
 * a run that only earns a few dollars past the last prestige's total
 * banks at least a fraction of a leaf's worth of progress toward the
 * next one.
 * @param {number} dollarsEarned
 * @returns {number}
 */
export function getLeavesEarned(dollarsEarned) {
  if (!(dollarsEarned > 0)) return 0
  return Math.floor((dollarsEarned / LEAF_DOLLARS_PER_UNIT) ** LEAF_EARN_EXPONENT)
}

/**
 * The money-multiplier bonus each individual Legacy Leaf is currently
 * worth - the store-bought base, raised permanently by Leaf Tonic levels
 * (see buyLeafBoost).
 * @param {import('../types/prestige.js').PrestigeState} prestigeState
 * @returns {number}
 */
export function getLeafBonusPerLeaf(prestigeState) {
  return BASE_LEAF_BONUS_PER_LEAF + (prestigeState.leafBoostLevel ?? 0) * LEAF_BOOST_BONUS_PER_LEVEL
}

/**
 * Uncapped money multiplier from every Legacy Leaf ever earned - unlike
 * the old per-tier band curve this replaces, this always grows with your
 * all-time earnings, however slightly, and never freezes.
 * @param {import('../types/prestige.js').PrestigeState} prestigeState
 * @returns {number}
 */
export function getLeafMultiplier(prestigeState) {
  const leaves = prestigeState.legacyLeaves ?? 0
  return 1 + getLeafBonusPerLeaf(prestigeState) * leaves
}

/**
 * Flat bonus for whichever tier is currently *active* (prestige.
 * activeTierIndex - see advanceTier), separate from and multiplicative
 * with getLeafMultiplier's uncapped Legacy Leaf bonus above. Rewards
 * actually playing at a tier's scale, not just having earned past it once
 * - moving back to an earlier tier's look (a full reset, same as any
 * other tier move) drops this back down to that tier's own bonus, even
 * though the leaf multiplier stays at its full accumulated value
 * regardless of which tier is active.
 * @param {number} activeTierIndex
 * @returns {number}
 */
export function getActiveTierMultiplier(activeTierIndex) {
  return ACTIVE_TIER_PRICE_GROWTH ** Math.max(0, activeTierIndex)
}

/**
 * Product of the uncapped Legacy Leaf multiplier (see getLeafMultiplier -
 * grows with all-time earnings, never freezes) times the active tier's
 * flat bonus (see getActiveTierMultiplier - rewards actually playing at a
 * tier's scale) times any epic research prestigeMultiplierBoost - this is
 * the number that ultimately reaches economy.js's getEffectiveSalePrice.
 * @param {import('../types/prestige.js').PrestigeState} prestigeState
 * @param {number} [prestigeMultiplierBoost]
 * @returns {number}
 */
export function getTotalPrestigeMultiplier(prestigeState, prestigeMultiplierBoost = 1) {
  const activeTierIndex = prestigeState.activeTierIndex ?? prestigeState.unlockedCount - 1
  return getLeafMultiplier(prestigeState) * getActiveTierMultiplier(activeTierIndex) * prestigeMultiplierBoost
}

/**
 * Cost in money of the next Leaf Tonic level - see buyLeafBoost. Grows
 * modestly per level (unlike Epic Research's steep curve) since the real
 * gate on this upgrade is the real-world cooldown below, not price.
 * @param {number} level
 * @returns {number}
 */
export function getLeafBoostCost(level) {
  return Math.round(LEAF_BOOST_BASE_COST * LEAF_BOOST_COST_GROWTH ** level)
}

/**
 * Milliseconds until Leaf Tonic can be bought again, or 0 if it's off
 * cooldown right now.
 * @param {import('../types/prestige.js').PrestigeState} prestigeState
 * @param {number} [timestamp]
 * @returns {number}
 */
export function getLeafBoostCooldownRemainingMs(prestigeState, timestamp = now()) {
  const last = prestigeState.lastLeafBoostPurchaseAt
  if (!last) return 0
  return Math.max(0, last + LEAF_BOOST_COOLDOWN_MS - timestamp)
}

/**
 * @param {import('../types/state.js').GameState} state
 * @returns {{ ok: boolean, reason?: string, cost?: number, cooldownRemainingMs?: number }}
 */
export function canBuyLeafBoost(state) {
  const prestige = state.prestige
  const cooldownRemainingMs = getLeafBoostCooldownRemainingMs(prestige)
  if (cooldownRemainingMs > 0) return { ok: false, reason: 'on_cooldown', cooldownRemainingMs }

  const cost = getLeafBoostCost(prestige.leafBoostLevel ?? 0)
  if (state.resources.money < cost) return { ok: false, reason: 'insufficient_funds', cost }

  return { ok: true, cost }
}

/**
 * Buys one permanent level of Leaf Tonic, raising getLeafBonusPerLeaf and
 * starting a fresh cooldown - paid from the current run's money (like
 * Epic Research), but the level itself and the cooldown timestamp both
 * live on state.prestige so they survive the reset like every other
 * prestige-permanent stat.
 * @param {import('../types/state.js').GameState} state
 * @returns {{ ok: boolean, reason?: string }}
 */
export function buyLeafBoost(state) {
  const result = canBuyLeafBoost(state)
  if (!result.ok) return result

  state.resources.money -= result.cost
  state.prestige.leafBoostLevel = (state.prestige.leafBoostLevel ?? 0) + 1
  state.prestige.lastLeafBoostPurchaseAt = now()

  return { ok: true }
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
 * @returns {{ ok: boolean, reason?: string, dollarsEarned?: number, leavesEarned?: number, newTrophyIds?: string[] }}
 */
export function doPrestige(state) {
  const result = canPrestige(state)
  if (!result.ok) return result

  const dollarsEarned = result.dollarsEarned
  const leavesEarned = getLeavesEarned(dollarsEarned)
  const prestige = state.prestige
  prestige.lifetimeMoneyEarnedAllTime = (prestige.lifetimeMoneyEarnedAllTime ?? 0) + dollarsEarned
  prestige.legacyLeaves = (prestige.legacyLeaves ?? 0) + leavesEarned
  prestige.totalPrestigeCount += 1

  const newTrophyIds = checkTrophies(prestige)
  resetBoard(state)

  return { ok: true, dollarsEarned, leavesEarned, newTrophyIds }
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
 * @returns {{ ok: boolean, reason?: string, dollarsEarned?: number, leavesEarned?: number, newTierName?: string, newTrophyIds?: string[] }}
 */
export function advanceTier(state, targetIndex) {
  const result = canAdvanceTier(state, targetIndex)
  if (!result.ok) return result

  const dollarsEarned = state.meta.lifetimeMoneyEarned ?? 0
  const leavesEarned = getLeavesEarned(dollarsEarned)
  const prestige = state.prestige
  prestige.lifetimeMoneyEarnedAllTime = result.projectedTotal
  prestige.legacyLeaves = (prestige.legacyLeaves ?? 0) + leavesEarned
  const newTier = PRESTIGE_TIERS[result.targetIndex]
  prestige.unlockedCount = Math.max(prestige.unlockedCount, result.targetIndex + 1)
  prestige.activeTierIndex = result.targetIndex
  prestige.totalPrestigeCount += 1

  const newTrophyIds = checkTrophies(prestige)
  resetBoard(state)

  return { ok: true, dollarsEarned, leavesEarned, newTierName: newTier.name, newTrophyIds }
}
