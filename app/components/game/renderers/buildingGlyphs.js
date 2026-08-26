import { formatDuration } from '#game/util/time.js'
import { publicAsset } from '~/utils/publicAsset.js'
import { getBuildingSpriteImage, getBuildingSpriteCrop } from './buildingSprites.js'

// Real building icons, downloaded as local static SVGs (see public/icons/buildings)
// so they render fully offline with no runtime fetch. Loaded lazily and
// cached per type; the hand-drawn vector glyphs below serve as an instant
// fallback for the brief window before an icon image finishes loading.
const ICON_BASE_PATH = publicAsset('icons/buildings/')
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

// Solid, fully-opaque hues instead of a washed-out translucent white for
// idle - a semi-transparent fill loses contrast fast depending on what
// sprite/terrain happens to sit under it. Warm off-white (not the earlier
// blue, which read as out of place next to the gold/green palette
// everywhere else) still stays clearly distinct from processing's gold and
// ready's green.
const SLOT_COLORS = {
  idle: '#f2ede0',
  processing: '#d4a94a',
  ready: '#7bc96f'
}

// Matches $color-danger in app/assets/scss/_variables.scss - the same
// warning color the inventory bar uses for its near-full alert icon (see
// InventoryBar.vue), reused here so a Rolling House whose collect is
// blocked reads as the same kind of warning.
const WARNING_COLOR = '#d16a5a'

// Shared by every on-tile chip (name, level, countdown) so they read as one
// consistent type scale instead of each picking its own multiplier and
// drifting apart at different zoom levels. Keeps growing well past the old
// 14px ceiling as you zoom in (rather than pinning early and effectively
// shrinking relative to the tile), but still has a cap - the bottom row's
// zone widths below are fixed fractions of the tile, and a truly uncapped
// font eventually needs more room than three chips packed into one row can
// ever provide, no matter how far you zoom in. chipHeightFor mirrors
// drawLabelChip's own padding math exactly (not an approximation) so
// anything that needs to know a chip's height up front - to bottom-anchor
// it, or to size the status circle to match, see getStatusIndicatorHitbox
// below - gets the real value instead of a guess that could drift out of
// sync if the padding constants change.
function chipFontSize(tilePx) {
  return Math.max(9, Math.min(26, tilePx * 0.1))
}

function chipHeightFor(tilePx) {
  const fontSize = chipFontSize(tilePx)
  return fontSize + fontSize * 0.38 * 2
}

/**
 * Shrinks fontSize toward a floor until `text` fits within `maxWidth` -
 * shared by drawLabelChip's own draw pass and by drawBuilding's up-front
 * "how small would the bottom row need to be" pass (see drawLevelBadge/
 * drawSlotIndicator), so two chips meant to share one row/size can agree
 * on a single shared size instead of each independently fitting itself and
 * landing on visibly different sizes whenever one has more text to shrink
 * around than the other.
 */
function fitChipFontSize(ctx, text, fontSize, maxWidth) {
  const paddingX = fontSize * 0.55
  const availableTextWidth = Math.max(20, maxWidth - paddingX * 2)
  ctx.font = `600 ${fontSize}px sans-serif`
  const minFontSize = Math.max(7, fontSize * 0.65)
  let size = fontSize
  while (ctx.measureText(text).width > availableTextWidth && size > minFontSize) {
    size -= 1
    ctx.font = `600 ${size}px sans-serif`
  }
  return size
}

/**
 * Small rounded pill behind light text - every on-tile label (name, batch
 * countdown) uses this instead of a bare stroked text, since a stroke alone
 * still loses contrast over light or busy patches of a sprite. anchorX/Y is
 * the point named by `corner` - 'top-left'/'bottom-left' hang the chip off
 * that corner, 'top-center'/'bottom-center' center it horizontally on
 * anchorX instead - so callers never do their own width/height math.
 * `maxWidth` keeps the chip from spilling past the tile's own edge (long
 * names on a small tile at high zoom otherwise blow right through the tile
 * boundary) - text first shrinks toward a floor size, then truncates with
 * an ellipsis as a last resort if it still won't fit even at that floor.
 * @returns {{ width: number, height: number }}
 */
function drawLabelChip(ctx, text, anchorX, anchorY, fontSize, corner = 'top-left', maxWidth = Infinity) {
  fontSize = fitChipFontSize(ctx, text, fontSize, maxWidth)
  const paddingX = fontSize * 0.55
  const paddingY = fontSize * 0.38

  ctx.font = `600 ${fontSize}px sans-serif`
  let displayText = text
  let textWidth = ctx.measureText(displayText).width
  const availableTextWidth = Math.max(20, maxWidth - paddingX * 2)
  while (textWidth > availableTextWidth && displayText.length > 1) {
    displayText = displayText.slice(0, -1)
    textWidth = ctx.measureText(`${displayText}…`).width
  }
  if (displayText !== text) displayText += '…'

  const width = Math.min(maxWidth, textWidth + paddingX * 2)
  const height = fontSize + paddingY * 2
  const x = corner.includes('center') ? anchorX - width / 2 : corner.includes('left') ? anchorX : anchorX - width
  const y = corner.includes('top') ? anchorY : anchorY - height

  ctx.fillStyle = 'rgba(12, 16, 10, 0.8)'
  roundRectPath(ctx, x, y, width, height, height / 2)
  ctx.fill()

  ctx.fillStyle = '#f5f3ea'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(displayText, x + paddingX, y + height / 2)

  return { width, height }
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
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
  // Bottom-right (not top-right) keeps it clear of the name label's chip up
  // top and out of the way of the sprite's own detail, which tends to be
  // busiest near the roofline. Diameter matches chipHeightFor exactly (not
  // an independent tilePx-based guess) and sits on the same bottom margin
  // the level/timer chips anchor to, so the circle's vertical center lines
  // up with theirs instead of visibly sitting off-row.
  const margin = tilePx * 0.06
  const diameter = Math.max(14, chipHeightFor(tilePx))
  const radius = diameter / 2
  const bottomRowY = rect.y + rect.height - margin
  return { cx: rect.x + rect.width - margin - radius, cy: bottomRowY - radius, radius }
}

/**
 * Draws a building's real sprite (per type+level), falling back to a
 * colored rect + glyph for the brief window before that image finishes
 * loading - same fallback pattern the SVG icon used before sprites existed.
 * Also draws level pips, an upgrade-in-progress overlay, and a slot status
 * indicator.
 * @param {number} tilePx - rendered size of a single grid tile in pixels
 * @param {number} nowMs - the store's shared clock, not a fresh Date.now()
 *   per building - every building's countdown text reads the same instant,
 *   so they all decrement together instead of each flipping to the next
 *   second whenever *its own* completesAt happens to cross real time (which
 *   drifts building to building based on when each batch was started).
 * @param {number} [popScale] - 1 = no animation (the common case, no
 *   transform overhead). <1 mid pop-in/level-up bounce - see
 *   useBuildingAnimations.js. Only the sprite/fallback-shape block is
 *   scaled, not the label chips/status indicator, so those stay legible.
 * @param {boolean} [collectBlocked] - true when this building is 'ready'
 *   but its batch can't be collected because the Depot has no room for it
 *   (Rolling House only - see batchEngine.js isCollectBlockedByOutputCap).
 *   Swaps the usual green "tap to collect" glow/badge for a warning-colored
 *   one instead, since tapping it won't do anything right now.
 * @param {string} [themeId] - active prestige tier id (store's
 *   activeThemeId) - see buildingSprites.js's getBuildingSpriteImage.
 */
export function drawBuilding(ctx, building, config, rect, tilePx, nowMs, popScale = 1, collectBlocked = false, themeId) {
  const isReady = building.slot?.status === 'ready'

  if (isReady) drawReadyGlow(ctx, rect, collectBlocked ? WARNING_COLOR : '#7bc96f')

  ctx.save()
  if (popScale !== 1) {
    const cx = rect.x + rect.width / 2
    const cy = rect.y + rect.height / 2
    ctx.translate(cx, cy)
    ctx.scale(popScale, popScale)
    ctx.translate(-cx, -cy)
  }

  const spriteImg = getBuildingSpriteImage(building.type, building.level, themeId)
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
  ctx.restore()

  const bottomRow = computeBottomRowLayout(ctx, building, rect, tilePx)
  drawLevelBadge(ctx, building.level, rect, bottomRow)
  drawNameLabel(ctx, config.displayName, rect, tilePx)

  if (building.slot) {
    drawSlotIndicator(ctx, building, rect, tilePx, nowMs, bottomRow)
    if (building.slot.status === 'processing') {
      drawProcessingPuff(ctx, building, rect, tilePx, nowMs, config.color)
    }
  }

  if (building.upgrade) {
    drawUpgradeOverlay(ctx, building.upgrade, rect, nowMs)
  }

  if (isReady) {
    if (collectBlocked) drawOutputFullBadge(ctx, building, rect, tilePx)
    else drawReadyBadge(ctx, building, rect, tilePx)
  }
}

/** Pulsing bright border around the whole tile so a finished batch is
 * obvious at a glance across the map, not just up close. `color` switches
 * to the warning color (see WARNING_COLOR) when the batch is ready but
 * can't actually be collected yet. */
function drawReadyGlow(ctx, rect, color) {
  const pulse = (Math.sin(Date.now() / 220) + 1) / 2 // 0..1
  const pad = 3 + pulse * 3
  ctx.save()
  ctx.strokeStyle = withAlpha(color, 0.55 + pulse * 0.45)
  ctx.lineWidth = 3
  ctx.strokeRect(rect.x - pad, rect.y - pad, rect.width + pad * 2, rect.height + pad * 2)
  ctx.restore()
}

function withAlpha(hexColor, alpha) {
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * Ambient "something is happening" cue drawn in addition to the numeric
 * countdown chip: two soft circles rise and fade on a repeating cycle,
 * offset half a cycle apart so one is always visible. Phased off the
 * batch's own real startedAt (not nowMs directly) so every building's
 * cycle is already staggered for free instead of every building on the
 * map pulsing in lockstep. Tinted with the building's own config.color for
 * a cheap per-type distinction without a full per-type particle system.
 */
function drawProcessingPuff(ctx, building, rect, tilePx, nowMs, color) {
  if (rect.width < 40) return // mirrors drawUpgradeOverlay's fine-detail cutoff
  const cycle = 1400
  const phaseOrigin = building.slot.startedAt ?? 0
  const cx = rect.x + rect.width * 0.5
  const baseY = rect.y + rect.height * 0.32

  ctx.save()
  ctx.beginPath()
  ctx.rect(rect.x - tilePx, rect.y - tilePx, rect.width + tilePx * 2, rect.height + tilePx * 2)
  ctx.clip()
  for (const offset of [0, cycle / 2]) {
    const t = (((nowMs - phaseOrigin + offset) % cycle) + cycle) % cycle / cycle
    const rise = tilePx * 0.55 * t
    const radius = tilePx * (0.07 + t * 0.09)
    ctx.beginPath()
    ctx.arc(cx, baseY - rise, radius, 0, Math.PI * 2)
    // Light ring first, then the color fill on top - same reasoning as the
    // status indicator/ready badge circles: holds contrast over both light
    // and dark sprite patches instead of a color fill alone risking
    // blending into a similarly-hued sprite.
    ctx.fillStyle = withAlpha('#ffffff', 0.35 * (1 - t))
    ctx.fill()
    ctx.beginPath()
    ctx.arc(cx, baseY - rise, radius * 0.7, 0, Math.PI * 2)
    ctx.fillStyle = withAlpha(color, 0.75 * (1 - t))
    ctx.fill()
  }
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
  // A light ring first, then a dark one on top of it - together they hold
  // up against both light and dark patches of whatever sprite/terrain the
  // badge happens to sit over, where a single dark stroke alone can vanish.
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.strokeStyle = 'rgba(0,0,0,0.55)'
  ctx.lineWidth = 1
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

/** Blocked-collect button: same circle as drawReadyBadge, but warning-
 * colored with an exclamation mark instead of a checkmark - shown when a
 * building is 'ready' yet collecting would overflow the Depot (see
 * batchEngine.js isCollectBlockedByOutputCap and drawBuilding's
 * collectBlocked param). Mirrors the inventory bar's own near-full alert
 * icon/color (see InventoryBar.vue) so the same warning reads consistently
 * in both places. */
function drawOutputFullBadge(ctx, building, rect, tilePx) {
  const hit = getStatusIndicatorHitbox(building, rect, tilePx)
  if (!hit) return
  const { cx: x, cy: y, radius } = hit
  const size = radius * 2

  ctx.save()
  ctx.fillStyle = WARNING_COLOR
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.strokeStyle = 'rgba(0,0,0,0.55)'
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.strokeStyle = '#3a1410'
  ctx.lineWidth = Math.max(1.5, size * 0.14)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x, y - size * 0.24)
  ctx.lineTo(x, y + size * 0.06)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(x, y + size * 0.26, Math.max(1, size * 0.05), 0, Math.PI * 2)
  ctx.fillStyle = '#3a1410'
  ctx.fill()
  ctx.restore()
}

// Widest realistic countdown text ("MM:SS left", worst-case digits) - used
// to size the bottom row instead of whatever the countdown actually says
// right now. Sizing off the live text made the whole row visibly resize as
// the countdown's own digit count changed (e.g. "12:31 left" -> "9:05
// left" -> "0:04 left" needs less and less room) and jump the instant a
// batch started or finished. Sizing off a fixed placeholder means the row
// only ever changes size with zoom, never with what state a building is in
// or how far along its countdown is.
const WORST_CASE_TIMER_TEXT = '88:88 left'

/**
 * Works out ONE font size shared by both bottom-row chips (level, batch
 * countdown) before either is drawn - fitting each independently (as
 * before) meant whichever one had more text to squeeze into its zone
 * shrank on its own, so a short "Lv 4" stayed full-size right next to a
 * "12:34 left" that had shrunk to fit - visibly different sizes on the
 * same row. The level chip's zone is sized off its own actual text at the
 * base size (it's always short - "Lv 1".."Lv 10" - so this is never the
 * binding constraint) rather than a fixed fraction of the tile, which
 * doesn't track font size the same way text metrics do and either wastes
 * space or starves whichever chip it wasn't tuned around.
 * @returns {{ fontSize: number, margin: number, levelZoneWidth: number, timerZoneWidth: number, bottomY: number }}
 */
function computeBottomRowLayout(ctx, building, rect, tilePx) {
  const baseFontSize = chipFontSize(tilePx)
  const margin = tilePx * 0.06

  ctx.font = `600 ${baseFontSize}px sans-serif`
  const levelPaddingX = baseFontSize * 0.55
  const levelZoneWidth = ctx.measureText(`Lv ${building.level}`).width + levelPaddingX * 2

  const indicatorReserve = Math.max(14, chipHeightFor(tilePx)) + margin
  const timerZoneLeft = rect.x + margin * 2 + levelZoneWidth
  const timerZoneWidth = Math.max(20, rect.x + rect.width - indicatorReserve - timerZoneLeft)

  const fontSize = fitChipFontSize(ctx, WORST_CASE_TIMER_TEXT, baseFontSize, timerZoneWidth)

  return { fontSize, margin, levelZoneWidth, timerZoneWidth, bottomY: rect.y + rect.height - margin }
}

/** A "Lv X" chip, bottom-left - replaces a 10-dot pip row that was too
 * faint/small to read at a glance. `bottomRow` (see computeBottomRowLayout)
 * carries the font size already agreed with the countdown chip, so the two
 * always render at the same size instead of each fitting independently. */
function drawLevelBadge(ctx, level, rect, bottomRow) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(rect.x, rect.y, rect.width, rect.height)
  ctx.clip()
  drawLabelChip(ctx, `Lv ${level}`, rect.x + bottomRow.margin, bottomRow.bottomY, bottomRow.fontSize, 'bottom-left', bottomRow.levelZoneWidth)
  ctx.restore()
}

/** Building type name, top-center on a dark chip - a stroke alone still
 * loses contrast over light or busy patches of a sprite, where a solid
 * backdrop reads cleanly regardless of what's underneath. Sized off
 * tilePx (not rect.width) so a 2x2 building's name isn't twice the size of
 * a 1x1 building's at the same zoom level. */
function drawNameLabel(ctx, displayName, rect, tilePx) {
  if (!displayName || rect.width < 34) return

  const fontSize = chipFontSize(tilePx)
  const margin = tilePx * 0.06
  ctx.save()
  ctx.beginPath()
  ctx.rect(rect.x, rect.y, rect.width, rect.height)
  ctx.clip()
  drawLabelChip(ctx, displayName, rect.x + rect.width / 2, rect.y + margin, fontSize, 'top-center', rect.width - margin * 2)
  ctx.restore()
}

/** Idle/processing status button - a "+" hints "tap to start" when idle;
 * a countdown shows while processing. 'ready' is handled by drawReadyBadge
 * instead, so it isn't lost as a tiny corner dot. `bottomRow` (see
 * computeBottomRowLayout) carries the font size/zone already agreed with
 * the level chip, so the two always render at the same size. */
function drawSlotIndicator(ctx, building, rect, tilePx, nowMs, bottomRow) {
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
  // Light ring then dark ring, same reasoning as the ready badge below -
  // holds contrast over both light and dark sprite/terrain patches instead
  // of relying on one dark stroke that can disappear over darker art.
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'
  ctx.lineWidth = 1
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

  if (slot.status === 'processing' && slot.completesAt && rect.width > 40) {
    // formatDuration already clamps to 0 rather than going negative, so
    // this keeps showing "0:00 left" instead of the chip vanishing for the
    // (up to ~1s) gap between the countdown reaching zero and tick()
    // actually resolving the batch to 'ready' - a blank gap there read as
    // the whole indicator flickering out and back.
    const remaining = Math.max(0, (slot.completesAt - nowMs) / 1000)
    // Right-aligned against the status button's own left edge (not
    // centered in the middle zone) so the two read as one paired unit -
    // countdown right next to the button it's counting down to.
    const gap = bottomRow.margin * 0.6
    const rightEdge = cx - radius - gap

    ctx.save()
    ctx.beginPath()
    ctx.rect(rect.x, rect.y, rect.width, rect.height)
    ctx.clip()
    drawLabelChip(
      ctx,
      `${formatDuration(remaining)} left`,
      rightEdge,
      bottomRow.bottomY,
      bottomRow.fontSize,
      'bottom-right',
      bottomRow.timerZoneWidth
    )
    ctx.restore()
  }
}

function drawUpgradeOverlay(ctx, upgrade, rect, nowMs) {
  ctx.fillStyle = 'rgba(0,0,0,0.45)'
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height * 0.3)

  if (rect.width > 40) {
    const remaining = (upgrade.completesAt - nowMs) / 1000
    ctx.fillStyle = '#fff'
    ctx.font = `${Math.min(16, Math.max(9, rect.width * 0.1))}px sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(
      remaining > 0 ? formatDuration(remaining) : '...',
      rect.x + rect.width / 2,
      rect.y + rect.height * 0.2
    )
  }
}
