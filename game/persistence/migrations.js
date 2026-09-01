import { PRESTIGE_TIERS } from '../config/prestige.config.js'
import { STARTING_REGION } from '../config/land.config.js'
import { COIN_DELIVERY_INTERVAL_SECONDS } from '../config/economy.config.js'
import { now } from '../util/time.js'
import { getLeavesEarned } from '../engine/prestigeEngine.js'

// Land expansion used to unlock in whole rectangular "tiers" (index ->
// region) instead of individual tiles - kept here, and only here, purely so
// an old save's `unlockedTier` can be converted into the equivalent set of
// purchasedTiles once, on load. Nothing else in the game reads this table.
const LEGACY_LAND_TIER_REGIONS = [
  { x0: 0, y0: 0, x1: 5, y1: 5 },
  { x0: -2, y0: 0, x1: 6, y1: 5 },
  { x0: -2, y0: -2, x1: 6, y1: 6 },
  { x0: -3, y0: -2, x1: 8, y1: 6 },
  { x0: -3, y0: -3, x1: 8, y1: 8 },
  { x0: -5, y0: -3, x1: 9, y1: 8 },
  { x0: -5, y0: -5, x1: 9, y1: 9 },
  { x0: -6, y0: -5, x1: 11, y1: 9 },
  { x0: -6, y0: -6, x1: 11, y1: 11 },
  { x0: -8, y0: -6, x1: 12, y1: 11 }
]

/**
 * Patches a loaded v1 save's state against shape changes made after it was
 * written, so an old save loads with safe defaults instead of crashing the
 * first time something reads a field that didn't exist yet (e.g. Lab's
 * researchLevels, added when research changed from a one-time purchased
 * list to repeatable per-line levels). Old/unrecognized fields are left in
 * place rather than stripped - harmless, and cheaper than being exhaustive.
 * @param {import('../types/state.js').GameState} state
 */
function repairState(state) {
  if (!state.lab || typeof state.lab.researchLevels !== 'object' || state.lab.researchLevels === null) {
    state.lab = { researchLevels: {} }
  }

  // Store speed-boost items used to apply an instant retroactive effect,
  // then a single-slot timed buff per kind (null | one ActiveBoost); now
  // each kind holds an array so several can stack concurrently (see
  // engine/boostEngine.js). Normalizes every shape a save could have:
  // missing entirely, null, a lone ActiveBoost object, or already an array.
  if (!state.boosts || typeof state.boosts !== 'object') state.boosts = {}
  for (const key of ['processing', 'upgrade', 'money']) {
    const value = state.boosts[key]
    if (Array.isArray(value)) continue
    state.boosts[key] = value ? [value] : []
  }

  // Coins are a separate currency added later (see engine/coinDeliveryEngine.js)
  // - a save from before that change has neither field yet.
  if (typeof state.coins !== 'number') state.coins = 0
  if (!state.coinDelivery || typeof state.coinDelivery !== 'object') {
    state.coinDelivery = { pending: null, nextSpawnAt: now() + COIN_DELIVERY_INTERVAL_SECONDS * 1000 }
  }

  // Nursery batches now consume 'seeds' (bought from the Store) instead of
  // costing money directly - a save from before that change has no seeds
  // stockpile, so give the same starter amount a fresh game gets.
  if (state.resources?.storage && typeof state.resources.storage.seeds !== 'number') {
    state.resources.storage.seeds = 30
  }

  // Rolling used to sell cigars instantly on collect (no storage). Cigars
  // are now a capped resource the Depot exports over time - a save from
  // before that change has no cigars field at all.
  if (state.resources?.storage && typeof state.resources.storage.cigars !== 'number') {
    state.resources.storage.cigars = 0
  }

  // The fleet briefly went through a single-tier { vehicleTierId, count }
  // shape (one tier owned at a time); it's back to an array of tier/count
  // entries now (freely mixed tiers again, capped by depot level instead
  // of by tier progression) - wrap a lingering single-tier save's fleet
  // back into array form. An already-array fleet (pre-single-tier saves,
  // or saves already on this shape) is left as-is.
  if (state.distribution?.fleet && !Array.isArray(state.distribution.fleet)) {
    state.distribution.fleet = [state.distribution.fleet]
  }

  if (!Array.isArray(state.decorations)) {
    state.decorations = []
  }

  // Land expansion switched from whole-rectangle "tiers" to individually
  // purchased tiles - an old save has `unlockedTier` instead of
  // `purchasedTiles`. Convert it once: every tile inside that tier's old
  // region, minus the (unchanged) starting region itself, becomes a
  // purchased tile, so previously-unlocked land - and anything built on
  // it - doesn't suddenly become locked territory again.
  if (!state.land || !Array.isArray(state.land.purchasedTiles)) {
    const legacyTier = typeof state.land?.unlockedTier === 'number' ? state.land.unlockedTier : 0
    const region = LEGACY_LAND_TIER_REGIONS[Math.min(legacyTier, LEGACY_LAND_TIER_REGIONS.length - 1)] ?? LEGACY_LAND_TIER_REGIONS[0]
    const purchasedTiles = []
    for (let x = region.x0; x <= region.x1; x++) {
      for (let y = region.y0; y <= region.y1; y++) {
        const withinStartingRegion = x >= STARTING_REGION.x0 && x <= STARTING_REGION.x1 && y >= STARTING_REGION.y0 && y <= STARTING_REGION.y1
        if (!withinStartingRegion) purchasedTiles.push({ x, y })
      }
    }
    state.land = { purchasedTiles }
  }

  // Tutorial system added after some saves already existed - an existing
  // player is not a first-time session, so backfill it already dismissed
  // rather than suddenly popping the onboarding card on their next load.
  if (!state.tutorial || typeof state.tutorial !== 'object') {
    state.tutorial = { active: false, dismissed: true, currentStep: 0 }
  }

  // Prestige/tier/trophy/epic-research system added after some
  // saves already existed - backfill the fields it reads/writes so an old
  // save doesn't crash the first time it's touched.
  if (state.meta && typeof state.meta.lifetimeMoneyEarned !== 'number') {
    state.meta.lifetimeMoneyEarned = 0
  }

  if (!state.prestige || typeof state.prestige !== 'object') {
    state.prestige = {
      unlockedCount: 1,
      activeTierIndex: 0,
      totalPrestigeCount: 0,
      lifetimeMoneyEarnedAllTime: 0,
      legacyLeaves: 0,
      leafBoostLevel: 0,
      lastLeafBoostPurchaseAt: null,
      epicResearchLevels: {},
      unlockedTrophyIds: []
    }
  } else {
    // Tier advancement used to be automatic (derived straight from
    // all-time earnings); it's now an explicit per-tier choice the player
    // makes (see prestigeEngine.js advanceTier), so unlockedCount is no
    // longer something to recompute here - whatever value an existing
    // save already has is preserved as-is (clamped to a sane range). Any
    // tiers their all-time earnings already qualify for beyond that just
    // show up as eligible-to-advance in the Prestige panel, same as a
    // player who earns their way there from now on.
    if (typeof state.prestige.unlockedCount !== 'number' || state.prestige.unlockedCount < 1) {
      state.prestige.unlockedCount = 1
    }
    state.prestige.unlockedCount = Math.min(state.prestige.unlockedCount, PRESTIGE_TIERS.length)
    if (typeof state.prestige.totalPrestigeCount !== 'number') state.prestige.totalPrestigeCount = 0
    if (typeof state.prestige.lifetimeMoneyEarnedAllTime !== 'number') state.prestige.lifetimeMoneyEarnedAllTime = 0
    if (!state.prestige.epicResearchLevels || typeof state.prestige.epicResearchLevels !== 'object') state.prestige.epicResearchLevels = {}
    if (!Array.isArray(state.prestige.unlockedTrophyIds)) state.prestige.unlockedTrophyIds = []
    delete state.prestige.varietyPoints

    // Legacy Leaves replaced the old per-tier band curve as the thing
    // that drives the money multiplier - a save from before that change
    // has no leaves yet. Backfill a one-time lump sum off its existing
    // all-time earnings (same curve a real prestige would have banked
    // incrementally) so an existing player's multiplier carries forward
    // instead of collapsing to 1x the moment they load in.
    if (typeof state.prestige.legacyLeaves !== 'number') {
      state.prestige.legacyLeaves = getLeavesEarned(state.prestige.lifetimeMoneyEarnedAllTime ?? 0)
    }
    if (typeof state.prestige.leafBoostLevel !== 'number') state.prestige.leafBoostLevel = 0
    if (typeof state.prestige.lastLeafBoostPurchaseAt !== 'number') state.prestige.lastLeafBoostPurchaseAt = null

    // activeTierIndex (free selection among already-unlocked tiers - see
    // prestigeEngine.js setActiveTier) added after some saves already had
    // several tiers unlocked - default an existing save to whatever tier
    // was implicitly "active" before this existed (the highest unlocked
    // one), and clamp in case unlockedCount shrank above (it can't, but a
    // hand-edited save could have an out-of-range value).
    if (typeof state.prestige.activeTierIndex !== 'number') {
      state.prestige.activeTierIndex = state.prestige.unlockedCount - 1
    }
    state.prestige.activeTierIndex = Math.max(0, Math.min(state.prestige.activeTierIndex, state.prestige.unlockedCount - 1))
  }
}

/**
 * Dispatches on the save file's version field, then repairs the state
 * against any shape drift since the save was written (see repairState).
 * The dispatcher structure exists so a future v2 shape has a home without
 * touching call sites.
 * @param {unknown} raw
 * @returns {import('../types/save.js').SaveFileV1}
 */
export function migrateSave(raw) {
  const version = raw && typeof raw === 'object' ? raw.version : undefined

  switch (version) {
    case 1: {
      const save = /** @type {import('../types/save.js').SaveFileV1} */ (raw)
      repairState(save.state)
      return save
    }
    default:
      throw new Error(`Unrecognized save version: ${version}`)
  }
}
