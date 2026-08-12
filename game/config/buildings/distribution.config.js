import { generateLevelCurve } from '../curve.js'

// Level 1->2 (the first real upgrade - nothing upgrades into level 1
// itself) lands on exactly 5 minutes: 214.2857 * 1.4 = 300.
const baseLevels = generateLevelCurve({
  baseCost: 300,
  costGrowth: 1.8,
  baseUpgradeDurationSec: 214.2857,
  upgradeDurationGrowth: 1.4
})

// Distribution has no batch/processing step - it has no slot at all. Its
// level gates how many fleet slots are available (which vehicle tiers can
// be upgraded to, see vehicles.config.js) and how many cigars it can hold
// in storage before they overflow and are lost - the fleet then exports
// (sells) from that storage at a throughput-limited rate (capacityPerHour),
// not instantly. Sale price no longer comes from the fleet at all - it
// scales with Rolling's own level and Lab research instead (see
// rolling.config.js / engine/economy.js).
export const distributionConfig = {
  type: 'distribution',
  displayName: 'Distribution Depot',
  description: 'Exports cigars from storage at a rate set by your vehicle fleet - let production outrun that rate and cigars overflow and are lost.',
  color: '#3a5a7a',
  icon: 'mdi:warehouse',
  footprint: { width: 2, height: 2 },
  // cigarStorageCapacity starts at a level-1 base of 100 (up from 40),
  // same growth rate as before so it still scales smoothly - level 10 now
  // lands on 62500 (100 * 2.04481^9) instead of the old 25000.
  levels: baseLevels.map((level, i) => ({
    ...level,
    maxVehicleSlots: 1 + i,
    cigarStorageCapacity: Math.round(100 * 2.04481 ** i)
  }))
}
