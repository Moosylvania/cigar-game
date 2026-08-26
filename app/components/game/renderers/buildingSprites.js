import { BUILDING_SPRITE_CROP } from '#game/config/buildingSpriteCrop.config.js'
import { publicAsset } from '~/utils/publicAsset.js'

const DEFAULT_SPRITE_BASE = publicAsset('images/cigar_sprite_pack_topdown/sprites/buildings/')

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

// 'backyard' (the starting tier) has no sprite pack of its own - it IS the
// default pack. Every other prestige tier id names a matching folder under
// public/images/prestige_themes/<id>/sprites/ (see PROMPTS.md there) -
// full replacements for the same buildings/decorations/rails/terrain/
// vehicles structure, generated to the same ten-level footprint
// progression as the default pack.
function spriteBaseFor(themeId) {
  if (!themeId || themeId === 'backyard') return DEFAULT_SPRITE_BASE
  return publicAsset(`images/prestige_themes/${themeId}/sprites/buildings/`)
}

const imageCache = new Map()

/**
 * Lazy-loaded, cached per theme+type+level - each of the 8 building types
 * has 10 pre-rendered level sprites in the pack, so leveling up a building
 * swaps the whole image rather than drawing a level indicator on top of
 * one. Switching prestige theme (see stores/game.js's activeThemeId) swaps
 * every building's sprite the same way, keyed separately per theme so
 * moving tiers doesn't reuse another theme's cached image.
 * @param {import('#game/types/building.js').BuildingType} type
 * @param {number} level
 * @param {string} [themeId] - active prestige tier id; defaults to the base pack
 * @returns {HTMLImageElement|null} null for a type with no sprite folder
 */
export function getBuildingSpriteImage(type, level, themeId) {
  const folder = FOLDER_BY_TYPE[type]
  if (!folder) return null

  const clampedLevel = Math.max(1, Math.min(10, level))
  const resolvedTheme = themeId || 'backyard'
  const key = `${resolvedTheme}_${folder}_${clampedLevel}`
  let img = imageCache.get(key)
  if (!img) {
    const levelStr = String(clampedLevel).padStart(2, '0')
    img = new Image()
    img.src = `${spriteBaseFor(resolvedTheme)}${folder}/${folder}_level_${levelStr}.webp`
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
