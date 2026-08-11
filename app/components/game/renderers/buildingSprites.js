const SPRITE_BASE = '/images/cigar_sprite_pack_topdown/sprites/buildings/'

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
