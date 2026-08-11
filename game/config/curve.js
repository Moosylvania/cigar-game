/**
 * @typedef {Object} CurveParams
 * @property {number} baseCost
 * @property {number} costGrowth - cost(level) = baseCost * costGrowth^(level-1)
 * @property {number} baseUpgradeDurationSec
 * @property {number} upgradeDurationGrowth
 * @property {number} [baseBatchSize] - omit for buildings with no batch step (town_hall, distribution)
 * @property {number} [batchSizeGrowth]
 * @property {number} [baseProcessingDurationSec] - omit for buildings with no batch step
 * @property {number} [processingDurationGrowth] - < 1 means faster processing at higher levels
 * @property {number} [baseSalePriceMultiplier] - omit for buildings that don't scale sale price (only Rolling does)
 * @property {number} [salePriceMultiplierGrowth] - compounds per level, same shape as the other growth curves
 * @property {number} [levelCount=10]
 */

/**
 * @typedef {Object} BuildingLevelStats
 * @property {number} level
 * @property {number} upgradeCost
 * @property {number} upgradeDurationSeconds
 * @property {number} [batchSize] - n/a for town_hall/distribution
 * @property {number} [processingDurationSeconds] - n/a for town_hall/distribution
 * @property {number} [salePriceMultiplier] - n/a except Rolling
 */

/**
 * Generates the 10-level stat table shared by every building config.
 * @param {CurveParams} params
 * @returns {BuildingLevelStats[]}
 */
export function generateLevelCurve(params) {
  const {
    baseCost,
    costGrowth,
    baseUpgradeDurationSec,
    upgradeDurationGrowth,
    baseBatchSize,
    batchSizeGrowth,
    baseProcessingDurationSec,
    processingDurationGrowth,
    baseSalePriceMultiplier,
    salePriceMultiplierGrowth,
    levelCount = 10
  } = params

  const levels = []
  for (let i = 0; i < levelCount; i++) {
    const level = i + 1
    /** @type {BuildingLevelStats} */
    const stats = {
      level,
      upgradeCost: Math.round(baseCost * costGrowth ** i),
      upgradeDurationSeconds: Math.round(baseUpgradeDurationSec * upgradeDurationGrowth ** i)
    }
    if (baseBatchSize != null) {
      stats.batchSize = Math.round(baseBatchSize * (batchSizeGrowth ?? 1) ** i)
    }
    if (baseProcessingDurationSec != null) {
      stats.processingDurationSeconds = Math.round(
        baseProcessingDurationSec * (processingDurationGrowth ?? 1) ** i
      )
    }
    if (baseSalePriceMultiplier != null) {
      stats.salePriceMultiplier = baseSalePriceMultiplier * (salePriceMultiplierGrowth ?? 1) ** i
    }
    levels.push(stats)
  }
  return levels
}
