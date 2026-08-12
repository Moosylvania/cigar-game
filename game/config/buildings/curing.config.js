import { generateLevelCurve } from '../curve.js'

export const curingConfig = {
  type: 'curing',
  displayName: 'Curing Barn',
  description: 'Harvested tobacco leaf is cured before steaming.',
  color: '#8a6a3a',
  icon: 'mdi:barn',
  footprint: { width: 1, height: 1 },
  levels: generateLevelCurve({
    baseCost: 120,
    costGrowth: 1.7,
    // Level 1->2 (the first real upgrade - nothing upgrades into level 1
    // itself) lands on exactly 5 minutes: 222.2222 * 1.35 = 300.
    baseUpgradeDurationSec: 222.2222,
    upgradeDurationGrowth: 1.35,
    baseBatchSize: 10,
    batchSizeGrowth: 1.4,
    baseProcessingDurationSec: 60,
    processingDurationGrowth: 0.9
  })
}
