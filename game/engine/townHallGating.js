import { TOWN_HALL_GATING } from '../config/townHallGating.config.js'

function entryFor(townHallLevel) {
  // Highest gating entry whose townHallLevel is <= the current level.
  let best = TOWN_HALL_GATING[0]
  for (const entry of TOWN_HALL_GATING) {
    if (entry.townHallLevel <= townHallLevel) best = entry
    else break
  }
  return best
}

export function maxLevelFor(townHallLevel) {
  return entryFor(townHallLevel).maxOtherBuildingLevel
}

export function maxLandTierFor(townHallLevel) {
  return entryFor(townHallLevel).unlockedLandTier
}
