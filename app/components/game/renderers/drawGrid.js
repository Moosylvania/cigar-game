import { drawGrassTile } from './terrainSprites.js'
import { isTilePurchasable, getTileCost } from '#game/engine/landEngine.js'

const TILE_LOCKED = '#2a2a2a'
const TILE_UNLOCKED = '#3d4a3a'
const TILE_BORDER = '#232a24'
const LOCKED_BORDER = 'rgba(0,0,0,0.35)'
const TILE_PURCHASABLE = '#4a4530'
const PURCHASABLE_BORDER = 'rgba(212, 169, 74, 0.6)'

/**
 * Draws every tile in maxRegion. Owned tiles get a real grass sprite
 * (variant chosen per-tile, see terrainSprites.js). When `expandMode` is on
 * (the player has the Expand Territory toggle active), a locked tile
 * adjacent to owned land is shown as purchasable (gold-tinted, price
 * labeled) so its click-to-buy price is visible before tapping it; outside
 * expand mode every locked tile - purchasable or not - looks identically
 * locked, so land can't be bought by an accidental tap while just playing
 * normally. camera carries an explicit {offsetX, offsetY, scale} transform
 * so pan/zoom can be added later without restructuring this function.
 * @param {Set<string>} ownedTileSet - see landEngine.js getOwnedTileSet
 * @param {boolean} expandMode - whether purchasable tiles should be
 *   highlighted/priced right now
 * @param {number} maxPurchasableRing - see landEngine.js getMaxPurchasableRing
 */
export function drawGrid(ctx, { maxRegion, ownedTileSet, tileSize, camera, expandMode = false, maxPurchasableRing = 0 }) {
  for (let gx = maxRegion.x0; gx <= maxRegion.x1; gx++) {
    for (let gy = maxRegion.y0; gy <= maxRegion.y1; gy++) {
      const isOwned = ownedTileSet.has(`${gx},${gy}`)

      const px = camera.offsetX + gx * tileSize * camera.scale
      const py = camera.offsetY + gy * tileSize * camera.scale
      const size = tileSize * camera.scale

      if (isOwned) {
        drawGrassTile(ctx, gx, gy, px, py, size, TILE_UNLOCKED)
        ctx.strokeStyle = TILE_BORDER
        ctx.lineWidth = 1
      } else if (expandMode && isTilePurchasable(ownedTileSet, gx, gy, maxPurchasableRing)) {
        ctx.fillStyle = TILE_PURCHASABLE
        ctx.fillRect(px, py, size, size)
        ctx.strokeStyle = PURCHASABLE_BORDER
        ctx.lineWidth = 2
        if (size > 26) drawTilePrice(ctx, px, py, size, getTileCost(gx, gy))
      } else {
        ctx.fillStyle = TILE_LOCKED
        ctx.fillRect(px, py, size, size)
        ctx.strokeStyle = LOCKED_BORDER
        ctx.lineWidth = 1
      }
      ctx.strokeRect(px + 0.5, py + 0.5, size - 1, size - 1)
    }
  }
}

function drawTilePrice(ctx, px, py, size, cost) {
  ctx.save()
  ctx.font = `600 ${Math.max(9, size * 0.17)}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  ctx.lineWidth = Math.max(2, size * 0.05)
  ctx.strokeStyle = 'rgba(0,0,0,0.75)'
  ctx.fillStyle = '#f5f3ea'
  const label = `$${cost}`
  ctx.strokeText(label, px + size / 2, py + size / 2)
  ctx.fillText(label, px + size / 2, py + size / 2)
  ctx.restore()
}

/** Converts a screen-space point (canvas-relative) to grid coordinates. */
export function screenToGrid(screenX, screenY, { tileSize, camera }) {
  const gx = Math.floor((screenX - camera.offsetX) / (tileSize * camera.scale))
  const gy = Math.floor((screenY - camera.offsetY) / (tileSize * camera.scale))
  return { x: gx, y: gy }
}

export function gridToScreen(gridPosition, { tileSize, camera }) {
  return {
    x: camera.offsetX + gridPosition.x * tileSize * camera.scale,
    y: camera.offsetY + gridPosition.y * tileSize * camera.scale
  }
}
