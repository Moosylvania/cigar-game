import { generateLevelCurve } from '../curve.js'

export const fieldConfig = {
  type: 'field',
  displayName: 'Field',
  description: 'Mature tobacco seedlings grow into full leaf here.',
  color: '#7a9c3f',
  icon: 'mdi:wheat',
  footprint: { width: 2, height: 2 },
  levels: generateLevelCurve({
    baseCost: 80,
    costGrowth: 1.65,
    baseUpgradeDurationSec: 45,
    upgradeDurationGrowth: 1.35,
    baseBatchSize: 10,
    batchSizeGrowth: 1.4,
    baseProcessingDurationSec: 90,
    processingDurationGrowth: 0.9
  })
}
