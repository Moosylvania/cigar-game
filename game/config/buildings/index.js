import { townHallConfig } from './townHall.config.js'
import { nurseryConfig } from './nursery.config.js'
import { fieldConfig } from './field.config.js'
import { curingConfig } from './curing.config.js'
import { steamConfig } from './steam.config.js'
import { fermentationConfig } from './fermentation.config.js'
import { rollingConfig } from './rolling.config.js'
import { distributionConfig } from './distribution.config.js'

/** @type {Object<import('../../types/building.js').BuildingType, any>} */
export const BUILDING_CONFIGS = {
  town_hall: townHallConfig,
  nursery: nurseryConfig,
  field: fieldConfig,
  curing: curingConfig,
  steam: steamConfig,
  fermentation: fermentationConfig,
  rolling: rollingConfig,
  distribution: distributionConfig
}

export function getBuildingConfig(type) {
  const config = BUILDING_CONFIGS[type]
  if (!config) throw new Error(`Unknown building type: ${type}`)
  return config
}

export function getLevelStats(type, level) {
  const config = getBuildingConfig(type)
  const stats = config.levels[level - 1]
  if (!stats) throw new Error(`No level ${level} stats for building type ${type}`)
  return stats
}

export const MAX_BUILDING_LEVEL = 10
