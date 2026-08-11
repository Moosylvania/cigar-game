import { VEHICLE_TIERS } from '../config/vehicles.config.js'
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

  // The fleet used to be an array of tier/count entries (freely mixed
  // tiers); it's now a single { vehicleTierId, count } - only one tier
  // owned at a time, upgraded in place. Collapse an old mixed fleet down
  // to its highest tier, discarding lower-tier vehicles, since there's no
  // lossless way to represent "some trucks and some semis" in the new
  // single-tier model.
  if (Array.isArray(state.distribution?.fleet)) {
    const tierOrder = VEHICLE_TIERS.map((tier) => tier.id)
    const entries = state.distribution.fleet
    state.distribution.fleet = entries.length === 0
      ? { vehicleTierId: 'truck', count: 0 }
      : entries.reduce((best, entry) =>
          tierOrder.indexOf(entry.vehicleTierId) > tierOrder.indexOf(best.vehicleTierId) ? entry : best
        )
  }

  if (!Array.isArray(state.decorations)) {
    state.decorations = []
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
