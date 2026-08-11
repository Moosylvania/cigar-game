import { generateLevelCurve } from '../curve.js'

export const steamConfig = {
  type: 'steam',
  displayName: 'Steaming House',
  description: 'Cured tobacco is steamed to prepare it for fermentation.',
  color: '#6a7a8a',
  icon: 'mdi:pot-steam',
  footprint: { width: 1, height: 1 },
  levels: generateLevelCurve({
    baseCost: 180,
    costGrowth: 1.72,
    baseUpgradeDurationSec: 90,
    upgradeDurationGrowth: 1.35,
    baseBatchSize: 10,
    batchSizeGrowth: 1.4,
    baseProcessingDurationSec: 150,
    processingDurationGrowth: 0.9
  })
}
