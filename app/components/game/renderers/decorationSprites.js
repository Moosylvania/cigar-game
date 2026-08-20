import { publicAsset } from '~/utils/publicAsset.js'

const SPRITE_BASE = publicAsset('images/cigar_sprite_pack_topdown/sprites/decorations/')

const imageCache = new Map()

/**
 * @param {string} spriteFile - DecorationDefinition.spriteFile (no extension)
 * @returns {HTMLImageElement}
 */
export function getDecorationSpriteImage(spriteFile) {
  let img = imageCache.get(spriteFile)
  if (!img) {
    img = new Image()
    img.src = `${SPRITE_BASE}${spriteFile}.png`
    imageCache.set(spriteFile, img)
  }
  return img
}

/**
 * Draws a decoration's sprite into rect, falling back to a soft placeholder
 * dot for the brief window before the image loads.
 */
export function drawDecoration(ctx, spriteFile, rect) {
  const img = getDecorationSpriteImage(spriteFile)
  if (img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, rect.x, rect.y, rect.width, rect.height)
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    ctx.beginPath()
    ctx.arc(rect.x + rect.width / 2, rect.y + rect.height / 2, rect.width * 0.25, 0, Math.PI * 2)
    ctx.fill()
  }
}
