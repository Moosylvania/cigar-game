import { generateLevelCurve } from '../curve.js'

export const townHallConfig = {
  type: 'town_hall',
  displayName: 'Town Hall',
  description: 'The heart of the farm. Its level gates every other building and land expansion.',
  color: '#b23a3a',
  icon: 'mdi:factory',
  footprint: { width: 2, height: 2 },
  // upgradeDurationGrowth/baseUpgradeDurationSec solved so the *first* real
  // upgrade (level 1->2, the shortest one that actually happens - nothing
  // ever upgrades into level 1 itself) takes exactly 5 minutes, and the
  // *last* one (level 9->10, the longest) takes exactly 24 hours:
  // 147.80774582825336 * 2.0296635898134046^1 = 300,
  // 147.80774582825336 * 2.0296635898134046^9 = 86400.
  levels: generateLevelCurve({
    baseCost: 500,
    costGrowth: 2.1,
    baseUpgradeDurationSec: 147.80774582825336,
    upgradeDurationGrowth: 2.0296635898134046
  })
}
