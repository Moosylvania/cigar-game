import { generateLevelCurve } from '../curve.js'

export const fermentationConfig = {
  type: 'fermentation',
  displayName: 'Fermentation Cellar',
  description: 'Steamed tobacco ferments here, developing flavor.',
  color: '#7a4a2a',
  icon: 'mdi:barrel',
  footprint: { width: 1, height: 1 },
  levels: generateLevelCurve({
    baseCost: 260,
    costGrowth: 1.74,
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
