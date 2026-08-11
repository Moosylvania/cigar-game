import { TOBACCO_VARIETIES } from '../config/prestige.config.js'

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

  // Tutorial system added after some saves already existed - an existing
  // player is not a first-time session, so backfill it already dismissed
  // rather than suddenly popping the onboarding card on their next load.
  if (!state.tutorial || typeof state.tutorial !== 'object') {
    state.tutorial = { active: false, dismissed: true, currentStep: 0 }
  }

  // Prestige/tobacco-variety/trophy/epic-research system added after some
  // saves already existed - backfill the fields it reads/writes so an old
  // save doesn't crash the first time it's touched.
  if (state.meta && typeof state.meta.lifetimeMoneyEarned !== 'number') {
    state.meta.lifetimeMoneyEarned = 0
  }

  if (!state.prestige || typeof state.prestige !== 'object') {
    state.prestige = {
      varietyPoints: new Array(TOBACCO_VARIETIES.length).fill(0),
      unlockedCount: 1,
      totalPrestigeCount: 0,
      lifetimeMoneyEarnedAllTime: 0,
      epicResearchLevels: {},
      unlockedTrophyIds: []
    }
  } else {
    if (!Array.isArray(state.prestige.varietyPoints)) state.prestige.varietyPoints = new Array(TOBACCO_VARIETIES.length).fill(0)
    if (typeof state.prestige.unlockedCount !== 'number') state.prestige.unlockedCount = 1
    if (typeof state.prestige.totalPrestigeCount !== 'number') state.prestige.totalPrestigeCount = 0
    if (typeof state.prestige.lifetimeMoneyEarnedAllTime !== 'number') state.prestige.lifetimeMoneyEarnedAllTime = 0
    if (!state.prestige.epicResearchLevels || typeof state.prestige.epicResearchLevels !== 'object') state.prestige.epicResearchLevels = {}
    if (!Array.isArray(state.prestige.unlockedTrophyIds)) state.prestige.unlockedTrophyIds = []
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
