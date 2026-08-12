/**
 * Drives the one remaining Town Hall gating mechanism: maxOtherBuildingLevel,
 * the highest level any non-Town-Hall building may reach at each Town Hall
 * level. (Land expansion used to be gated here too via unlockedLandTier,
 * back when land unlocked in whole rectangular tiers - it's bought one tile
 * at a time now, gated purely by adjacency + money, see land.config.js.)
 * @type {{ townHallLevel: number, maxOtherBuildingLevel: number }[]}
 */
export const TOWN_HALL_GATING = [
  { townHallLevel: 1, maxOtherBuildingLevel: 1 },
  { townHallLevel: 2, maxOtherBuildingLevel: 2 },
  { townHallLevel: 3, maxOtherBuildingLevel: 3 },
  { townHallLevel: 4, maxOtherBuildingLevel: 4 },
  { townHallLevel: 5, maxOtherBuildingLevel: 5 },
  { townHallLevel: 6, maxOtherBuildingLevel: 6 },
  { townHallLevel: 7, maxOtherBuildingLevel: 7 },
  { townHallLevel: 8, maxOtherBuildingLevel: 8 },
  { townHallLevel: 9, maxOtherBuildingLevel: 9 },
  { townHallLevel: 10, maxOtherBuildingLevel: 10 }
]
