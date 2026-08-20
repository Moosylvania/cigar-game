import { BUILDING_SPRITE_CROP } from '#game/config/buildingSpriteCrop.config.js'
import { publicAsset } from '~/utils/publicAsset.js'

const SPRITE_BASE = publicAsset('images/cigar_sprite_pack_topdown/sprites/buildings/')

/** @type {Object<import('#game/types/building.js').BuildingType, string>} */
const FOLDER_BY_TYPE = {
  town_hall: 'main_factory',
  nursery: 'seed_nursery',
  field: 'farm_field',
  curing: 'curing_barn',
  steam: 'steam_house',
  fermentation: 'fermentation_center',
  rolling: 'rolling_house',
  distribution: 'distribution_depot'
}

const imageCache = new Map()

/**
 * Lazy-loaded, cached per type+level - each of the 8 building types has 10
 * pre-rendered level sprites in the pack, so leveling up a building swaps
 * the whole image rather than drawing a level indicator on top of one.
 * @param {import('#game/types/building.js').BuildingType} type
 * @param {number} level
 * @returns {HTMLImageElement|null} null for a type with no sprite folder
 */
export function getBuildingSpriteImage(type, level) {
  const folder = FOLDER_BY_TYPE[type]
  if (!folder) return null

  const clampedLevel = Math.max(1, Math.min(10, level))
  const key = `${folder}_${clampedLevel}`
  let img = imageCache.get(key)
  if (!img) {
    const levelStr = String(clampedLevel).padStart(2, '0')
    img = new Image()
    img.src = `${SPRITE_BASE}${folder}/${folder}_level_${levelStr}.png`
    imageCache.set(key, img)
  }
  return img
}

/**
 * The source rect to crop from a building's sprite (see
 * buildingSpriteCrop.config.js) - the raw 512x512 images have a lot of
 * transparent padding around the actual artwork, so drawing the full
 * canvas into a building's tile rect left it looking small/sparse inside
 * its own footprint. Callers pass this as the 9-arg drawImage source rect
 * instead of the whole image. Falls back to the full image for a type
 * with no crop data.
 * @param {import('#game/types/building.js').BuildingType} type
 * @param {number} level
 * @returns {{ x: number, y: number, width: number, height: number }}
 */
export function getBuildingSpriteCrop(type, level) {
  const folder = FOLDER_BY_TYPE[type]
  const clampedLevel = Math.max(1, Math.min(10, level))
  const crop = folder && BUILDING_SPRITE_CROP[folder]?.[clampedLevel - 1]
  return crop ?? { x: 0, y: 0, width: 512, height: 512 }
}
