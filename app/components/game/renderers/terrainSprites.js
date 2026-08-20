import { publicAsset } from '~/utils/publicAsset.js'

const SPRITE_BASE = publicAsset('images/cigar_sprite_pack_topdown/sprites/terrain/')

const imageCache = new Map()

function getImage(name) {
  let img = imageCache.get(name)
  if (!img) {
    img = new Image()
    img.src = `${SPRITE_BASE}${name}.png`
    imageCache.set(name, img)
  }
  return img
}

// Cheap deterministic hash so the same tile always picks the same grass
// variant across renders/reloads without persisting anything in state -
// weighted toward grass_clean/grass_lush/grass_mixed so wildflowers/dry
// patches read as occasional variation, not a checkerboard.
const WEIGHTED_VARIANTS = [
  'grass_clean', 'grass_clean', 'grass_clean',
  'grass_lush', 'grass_lush', 'grass_lush',
  'grass_mixed', 'grass_mixed',
  'grass_dry',
  'grass_wildflowers'
]

export function getGrassVariantFor(gx, gy) {
  const h = Math.abs(((gx * 374761393 + gy * 668265263) ^ (gx * 2246822519)) % WEIGHTED_VARIANTS.length)
  return WEIGHTED_VARIANTS[h]
}

/**
 * Draws a single grass tile, falling back to a flat color for the one
 * frame before its image finishes loading (same fallback pattern as
 * buildingSprites.js/decorationSprites.js).
 */
export function drawGrassTile(ctx, gx, gy, px, py, size, fallbackColor) {
  const variantName = getGrassVariantFor(gx, gy)
  const img = getImage(variantName)
  if (img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, px, py, size, size)
  } else {
    ctx.fillStyle = fallbackColor
    ctx.fillRect(px, py, size, size)
  }
}
