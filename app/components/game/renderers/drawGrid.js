import { drawGrassTile } from './terrainSprites.js'

const TILE_LOCKED = '#2a2a2a'
const TILE_UNLOCKED = '#3d4a3a'
const TILE_BORDER = '#232a24'
const LOCKED_BORDER = 'rgba(0,0,0,0.35)'

/**
 * Draws every tile in maxRegion. Unlocked tiles get a real grass sprite
 * (variant chosen per-tile, see terrainSprites.js); locked tiles stay a
 * flat dark placeholder so "not accessible yet" reads clearly against the
 * textured unlocked ground. camera carries an explicit
 * {offsetX, offsetY, scale} transform so pan/zoom can be added later
 * without restructuring this function.
 */
export function drawGrid(ctx, { maxRegion, unlockedRegion, tileSize, camera }) {
  for (let gx = maxRegion.x0; gx <= maxRegion.x1; gx++) {
    for (let gy = maxRegion.y0; gy <= maxRegion.y1; gy++) {
      const isUnlocked =
        gx >= unlockedRegion.x0 && gx <= unlockedRegion.x1 && gy >= unlockedRegion.y0 && gy <= unlockedRegion.y1

      const px = camera.offsetX + gx * tileSize * camera.scale
      const py = camera.offsetY + gy * tileSize * camera.scale
      const size = tileSize * camera.scale

      if (isUnlocked) {
        drawGrassTile(ctx, gx, gy, px, py, size, TILE_UNLOCKED)
        ctx.strokeStyle = TILE_BORDER
      } else {
        ctx.fillStyle = TILE_LOCKED
        ctx.fillRect(px, py, size, size)
        ctx.strokeStyle = LOCKED_BORDER
      }
      ctx.lineWidth = 1
      ctx.strokeRect(px + 0.5, py + 0.5, size - 1, size - 1)
    }
  }
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
