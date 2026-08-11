import { formatDuration } from '#game/util/time.js'
import { getBuildingSpriteImage, getBuildingSpriteCrop } from './buildingSprites.js'

// Real building icons, downloaded as local static SVGs (see public/icons/buildings)
// so they render fully offline with no runtime fetch. Loaded lazily and
// cached per type; the hand-drawn vector glyphs below serve as an instant
// fallback for the brief window before an icon image finishes loading.
const ICON_BASE_PATH = '/icons/buildings/'
const iconImageCache = new Map()

function getIconImage(type) {
  let img = iconImageCache.get(type)
  if (!img) {
    img = new Image()
    img.src = `${ICON_BASE_PATH}${type}.svg`
    iconImageCache.set(type, img)
  }
  return img
}

function triangle(ctx, cx, cy, r) {
  ctx.beginPath()
  ctx.moveTo(cx, cy - r)
  ctx.lineTo(cx + r, cy + r)
  ctx.lineTo(cx - r, cy + r)
  ctx.closePath()
  ctx.fill()
}

function blob(ctx, cx, cy, r) {
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
}

function box(ctx, cx, cy, r) {
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
}

function houseShape(ctx, cx, cy, r) {
  ctx.beginPath()
  ctx.moveTo(cx - r, cy + r)
  ctx.lineTo(cx - r, cy)
  ctx.lineTo(cx, cy - r)
  ctx.lineTo(cx + r, cy)
  ctx.lineTo(cx + r, cy + r)
  ctx.closePath()
  ctx.fill()
}

function truckShape(ctx, cx, cy, r) {
  ctx.fillRect(cx - r, cy - r * 0.5, r * 1.6, r)
  ctx.fillRect(cx + r * 0.6, cy - r * 0.2, r * 0.8, r * 0.7)
}

function castle(ctx, cx, cy, r) {
  ctx.fillRect(cx - r, cy - r * 0.4, r * 2, r * 1.4)
  for (let i = -1; i <= 1; i++) {
    ctx.fillRect(cx + i * r * 0.6 - r * 0.15, cy - r, r * 0.3, r * 0.6)
  }
}

/** @type {Object<import('#game/types/building.js').BuildingType, (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) => void>} */
const GLYPHS = {
  town_hall: castle,
  nursery: triangle,
  field: triangle,
  curing: houseShape,
  steam: blob,
  fermentation: blob,
  rolling: box,
  distribution: truckShape
}

const SLOT_COLORS = {
  idle: 'rgba(255,255,255,0.55)',
  processing: '#d4a94a',
  ready: '#7bc96f'
}

/**
 * Screen-space hit target for the clickable status indicator (starts a
 * batch when idle, collects it when ready). Returns null for buildings
 * with no slot at all (Town Hall, Distribution). Shared by the drawing
 * code below and GameCanvas's pointer hit-testing so the visible circle
 * and the clickable area can never drift apart.
 * @param {import('#game/types/building.js').PlacedBuilding} building
 * @param {{ x: number, y: number, width: number, height: number }} rect
 * @param {number} tilePx - rendered size of a single grid tile in pixels
 *   (TILE_SIZE * camera.scale) - sized off this, not rect.width, so a 2x2
 *   building's indicator isn't twice the size of a 1x1 building's.
 * @returns {{ cx: number, cy: number, radius: number }|null}
 */
export function getStatusIndicatorHitbox(building, rect, tilePx) {
  if (!building.slot) return null

  // Same size and position regardless of status, so the indicator doesn't
  // jump around or change size as a batch goes idle -> processing -> ready.
  const size = Math.max(11, tilePx * 0.2)
  return { cx: rect.x + rect.width - size / 2, cy: rect.y + size / 2, radius: size / 3 }
}

/**
 * Draws a building's real sprite (per type+level), falling back to a
 * colored rect + glyph for the brief window before that image finishes
 * loading - same fallback pattern the SVG icon used before sprites existed.
 * Also draws level pips, an upgrade-in-progress overlay, and a slot status
 * indicator.
 * @param {number} tilePx - rendered size of a single grid tile in pixels
 */
export function drawBuilding(ctx, building, config, rect, tilePx) {
  const isReady = building.slot?.status === 'ready'

  if (isReady) drawReadyGlow(ctx, rect)

  const spriteImg = getBuildingSpriteImage(building.type, building.level)
  const spriteReady = spriteImg && spriteImg.complete && spriteImg.naturalWidth > 0

  if (spriteReady) {
    ctx.drawImage(spriteImg, rect.x, rect.y, rect.width, rect.height)
  } else {
    ctx.fillStyle = config.color
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'
    ctx.lineWidth = 2
    ctx.strokeRect(rect.x + 1, rect.y + 1, rect.width - 2, rect.height - 2)

    const cx = rect.x + rect.width / 2
    const cy = rect.y + rect.height / 2
    const r = Math.min(rect.width, rect.height) * 0.22

    const iconImg = getIconImage(building.type)
    if (iconImg.complete && iconImg.naturalWidth > 0) {
      const size = r * 2.3
      ctx.drawImage(iconImg, cx - size / 2, cy - size / 2, size, size)
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      const glyph = GLYPHS[building.type] ?? blob
      glyph(ctx, cx, cy, r)
    }
  }

  drawLevelPips(ctx, building.level, rect)
  drawNameLabel(ctx, config.displayName, rect)

  if (building.slot) {
    drawSlotIndicator(ctx, building, rect, tilePx)
  }

  if (building.upgrade) {
    drawUpgradeOverlay(ctx, building.upgrade, rect)
  }

  if (isReady) drawReadyBadge(ctx, building, rect, tilePx)
}

/** Pulsing bright border around the whole tile so a finished batch is
 * obvious at a glance across the map, not just up close. */
function drawReadyGlow(ctx, rect) {
  const pulse = (Math.sin(Date.now() / 220) + 1) / 2 // 0..1
  const pad = 3 + pulse * 3
  ctx.save()
  ctx.strokeStyle = `rgba(123, 201, 111, ${0.55 + pulse * 0.45})`
  ctx.lineWidth = 3
  ctx.strokeRect(rect.x - pad, rect.y - pad, rect.width + pad * 2, rect.height + pad * 2)
  ctx.restore()
}

/** Ready-to-collect button: green circle + checkmark, on top of everything else. */
function drawReadyBadge(ctx, building, rect, tilePx) {
  const hit = getStatusIndicatorHitbox(building, rect, tilePx)
  if (!hit) return
  const { cx: x, cy: y, radius } = hit
  const size = radius * 2

  ctx.save()
  ctx.fillStyle = '#7bc96f'
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.strokeStyle = '#153018'
  ctx.lineWidth = Math.max(1.5, size * 0.14)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(x - size * 0.22, y)
  ctx.lineTo(x - size * 0.05, y + size * 0.2)
  ctx.lineTo(x + size * 0.25, y - size * 0.22)
  ctx.stroke()
  ctx.restore()
}

function drawLevelPips(ctx, level, rect) {
  const maxPips = 10
  const pipSize = Math.max(2, rect.width / (maxPips * 2.2))
  const totalWidth = maxPips * pipSize * 1.6
  const startX = rect.x + (rect.width - totalWidth) / 2 + pipSize / 2
  const y = rect.y + rect.height - pipSize - 2

  for (let i = 0; i < maxPips; i++) {
    ctx.fillStyle = i < level ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.25)'
    ctx.beginPath()
    ctx.arc(startX + i * pipSize * 1.6, y, pipSize / 2, 0, Math.PI * 2)
    ctx.fill()
  }
}

/** Building type name, drawn along the top edge in white with a dark
 * outline so it stays legible over any sprite/background. */
function drawNameLabel(ctx, displayName, rect) {
  if (!displayName || rect.width < 34) return

  // Floor only, no cap - matches the pips/countdown text below, which
  // scale purely proportionally with the building's own on-screen size
  // rather than leveling off at high zoom.
  const fontSize = Math.min(18, rect.width * 0.08)
  ctx.save()
  ctx.beginPath()
  ctx.rect(rect.x, rect.y, rect.width, rect.height)
  ctx.clip()
  ctx.font = `600 ${fontSize}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.lineJoin = 'round'
  ctx.lineWidth = Math.max(2, fontSize * 0.28)
  ctx.strokeStyle = 'rgba(0,0,0,0.75)'
  ctx.fillStyle = '#ffffff'
  const x = rect.x + rect.width / 2
  const y = rect.y + 5
  ctx.strokeText(displayName, x, y)
  ctx.fillText(displayName, x, y)
  ctx.restore()
}

/** Idle/processing status button - a "+" hints "tap to start" when idle;
 * a countdown shows while processing. 'ready' is handled by drawReadyBadge
 * instead, so it isn't lost as a tiny corner dot. */
function drawSlotIndicator(ctx, building, rect, tilePx) {
  const slot = building.slot
  if (slot.status === 'ready') return

  const hit = getStatusIndicatorHitbox(building, rect, tilePx)
  if (!hit) return
  const { cx, cy, radius } = hit

  ctx.save()
  ctx.fillStyle = SLOT_COLORS[slot.status] ?? SLOT_COLORS.idle
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(0,0,0,0.45)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  if (slot.status === 'idle') {
    ctx.strokeStyle = 'rgba(25,25,25,0.85)'
    ctx.lineWidth = Math.max(1.5, radius * 0.3)
    ctx.lineCap = 'round'
    const armLen = radius * 0.5
    ctx.beginPath()
    ctx.moveTo(cx - armLen, cy)
    ctx.lineTo(cx + armLen, cy)
    ctx.moveTo(cx, cy - armLen)
    ctx.lineTo(cx, cy + armLen)
    ctx.stroke()
  }
  ctx.restore()

  if (slot.status === 'processing' && slot.completesAt) {
    const remaining = (slot.completesAt - Date.now()) / 1000
    if (remaining > 0 && rect.width > 40) {
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.font = `${Math.max(9, rect.width * 0.09)}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(formatDuration(remaining), rect.x + rect.width / 2, rect.y + rect.height / 2 + rect.height * 0.32)
    }
  }
}

function drawUpgradeOverlay(ctx, upgrade, rect) {
  ctx.fillStyle = 'rgba(0,0,0,0.45)'
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height * 0.3)

  if (rect.width > 40) {
    const remaining = (upgrade.completesAt - Date.now()) / 1000
    ctx.fillStyle = '#fff'
    ctx.font = `${Math.max(9, rect.width * 0.1)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(
      remaining > 0 ? formatDuration(remaining) : '...',
      rect.x + rect.width / 2,
      rect.y + rect.height * 0.2
    )
  }
}
