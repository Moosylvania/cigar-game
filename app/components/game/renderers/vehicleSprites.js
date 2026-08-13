import { getVehicleSpriteDirPath } from '#game/config/vehicles.config.js'

const imageCache = new Map()

function getImage(src) {
  let img = imageCache.get(src)
  if (!img) {
    img = new Image()
    img.src = src
    imageCache.set(src, img)
  }
  return img
}

// The sprite pack's own n/e/s/w files turned out inconsistently oriented
// per vehicle (verified by inspecting each PNG) - some duplicate one
// direction under two filenames, some have east/west swapped. Every
// tier's "_e" file reliably shows a front-left orientation though (even
// where mislabeled), so it's used as the sole horizontal source, mirrored
// for east - no per-tier horizontal table needed. "_s" reliably shows
// front-down for truck/box_truck/semi, but front-up (duplicated from
// "_n") for the two trains - this records which, so the vertical axis can
// use the same single-source-plus-mirror approach instead of trusting a
// filename that might be showing the wrong thing.
const SOUTH_FILE_IS_DOWN = {
  truck: true,
  box_truck: true,
  semi: true,
  cargo_train: false,
  freight_train: false,
  bullet_train: false
}

function getSourceForDirection(tierId, direction) {
  if (direction === 'e' || direction === 'w') {
    return { src: getVehicleSpriteDirPath(tierId, 'e'), flip: direction === 'e' ? 'h' : null }
  }
  const nativeDirection = (SOUTH_FILE_IS_DOWN[tierId] ?? true) ? 's' : 'n'
  return { src: getVehicleSpriteDirPath(tierId, nativeDirection), flip: direction === nativeDirection ? null : 'v' }
}

/**
 * Draws one vehicle's directional sprite into an already-computed screen
 * rect, mirroring a single reliable source image rather than trusting the
 * asset pack's own directional filenames (see SOUTH_FILE_IS_DOWN above).
 * No fallback shape while loading, unlike buildings/decorations - these
 * are transient ambient flavor, not always-visible map fixtures.
 */
export function drawVehicleSprite(ctx, tierId, direction, rect) {
  const { src, flip } = getSourceForDirection(tierId, direction)
  if (!src) return
  const img = getImage(src)
  if (!(img.complete && img.naturalWidth > 0)) return

  if (!flip) {
    ctx.drawImage(img, rect.x, rect.y, rect.width, rect.height)
    return
  }
  ctx.save()
  const cx = rect.x + rect.width / 2
  const cy = rect.y + rect.height / 2
  ctx.translate(cx, cy)
  ctx.scale(flip === 'h' ? -1 : 1, flip === 'v' ? -1 : 1)
  ctx.translate(-cx, -cy)
  ctx.drawImage(img, rect.x, rect.y, rect.width, rect.height)
  ctx.restore()
}
