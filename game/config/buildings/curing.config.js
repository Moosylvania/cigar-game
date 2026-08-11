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
    baseUpgradeDurationSec: 60,
    upgradeDurationGrowth: 1.35,
    baseBatchSize: 10,
    batchSizeGrowth: 1.4,
    baseProcessingDurationSec: 120,
    processingDurationGrowth: 0.9
  })
}
