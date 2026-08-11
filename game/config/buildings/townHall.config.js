import { generateLevelCurve } from '../curve.js'

export const townHallConfig = {
  type: 'town_hall',
  displayName: 'Town Hall',
  description: 'The heart of the farm. Its level gates every other building and land expansion.',
  color: '#b23a3a',
  icon: 'mdi:factory',
  footprint: { width: 2, height: 2 },
  levels: generateLevelCurve({
    baseCost: 500,
    costGrowth: 2.1,
    baseUpgradeDurationSec: 300,
    upgradeDurationGrowth: 1.5
  })
}
