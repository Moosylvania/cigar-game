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
    baseUpgradeDurationSec: 30,
    upgradeDurationGrowth: 1.35,
    baseBatchSize: 10,
    batchSizeGrowth: 1.4,
    baseProcessingDurationSec: 60,
    processingDurationGrowth: 0.9
  })
}
