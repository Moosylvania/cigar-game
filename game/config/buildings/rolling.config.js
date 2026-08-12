import { generateLevelCurve } from '../curve.js'

export const rollingConfig = {
  type: 'rolling',
  displayName: 'Rolling House',
  description: 'Fermented tobacco is hand-rolled into cigars, sent to the Depot to be exported and sold.',
  color: '#4a3a2a',
  icon: 'mdi:cigar',
  footprint: { width: 1, height: 1 },
  // Sale price used to come from the fleet - it now comes from here
  // instead: a better-run Rolling House earns more per cigar, compounding
  // with Lab's premium_blend research (see engine/economy.js).
  levels: generateLevelCurve({
    baseCost: 380,
    costGrowth: 1.76,
    // Level 1->2 (the first real upgrade - nothing upgrades into level 1
    // itself) lands on exactly 5 minutes: 222.2222 * 1.35 = 300.
    baseUpgradeDurationSec: 222.2222,
    upgradeDurationGrowth: 1.35,
    baseBatchSize: 10,
    batchSizeGrowth: 1.4,
    baseProcessingDurationSec: 60,
    processingDurationGrowth: 0.9,
    baseSalePriceMultiplier: 1,
    salePriceMultiplierGrowth: 1.07
  })
}
