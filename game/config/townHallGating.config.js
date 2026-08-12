/**
 * Single table driving both gating mechanisms:
 * - maxOtherBuildingLevel: the highest level any non-Town-Hall building may reach
 * - unlockedLandTier: the highest land expansion tier purchasable
 * @type {{ townHallLevel: number, maxOtherBuildingLevel: number, unlockedLandTier: number }[]}
 */
export const TOWN_HALL_GATING = [
  { townHallLevel: 1, maxOtherBuildingLevel: 1, unlockedLandTier: 0 },
  { townHallLevel: 2, maxOtherBuildingLevel: 2, unlockedLandTier: 1 },
  { townHallLevel: 3, maxOtherBuildingLevel: 3, unlockedLandTier: 2 },
  { townHallLevel: 4, maxOtherBuildingLevel: 4, unlockedLandTier: 3 },
  { townHallLevel: 5, maxOtherBuildingLevel: 5, unlockedLandTier: 4 },
  { townHallLevel: 6, maxOtherBuildingLevel: 6, unlockedLandTier: 5 },
  { townHallLevel: 7, maxOtherBuildingLevel: 7, unlockedLandTier: 6 },
  { townHallLevel: 8, maxOtherBuildingLevel: 8, unlockedLandTier: 7 },
  { townHallLevel: 9, maxOtherBuildingLevel: 9, unlockedLandTier: 8 },
  { townHallLevel: 10, maxOtherBuildingLevel: 10, unlockedLandTier: 9 }
]
