import { generateLevelCurve } from '../curve.js'

export const nurseryConfig = {
  type: 'nursery',
  displayName: 'Tobacco Nursery',
  description: 'Grows tobacco seedlings, ready to be moved to the fields.',
  color: '#5c8a3a',
  icon: 'game-icons:plant-seed',
  footprint: { width: 1, height: 1 },
  levels: generateLevelCurve({
    baseCost: 50,
    costGrowth: 1.6,
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
