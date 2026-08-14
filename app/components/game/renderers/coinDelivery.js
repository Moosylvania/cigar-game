/** Standard back-out: overshoots past 1 partway through, settles to 1 - reads as a small bounce. */
function easeOutBack(t) {
  const c1 = 1.70158
  const c3 = c1 + 1
  const x = t - 1
  return 1 + c3 * x ** 3 + c1 * x ** 2
}

const POP_DURATION_MS = 400

/** A small stack of two coins (not one), so it reads as "coins" at a glance even at low zoom. */
function drawCoinShape(ctx, cx, cy, radius) {
  ctx.save()

  ctx.fillStyle = '#a8791f'
  ctx.beginPath()
  ctx.arc(cx + radius * 0.18, cy + radius * 0.22, radius, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#e0b23d'
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#8a611a'
  ctx.lineWidth = Math.max(1, radius * 0.12)
  ctx.stroke()

  // A cigar-band-like stripe across the top coin - ties it back to the
  // game's own theme instead of reading as a generic gold coin.
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'
  ctx.lineWidth = Math.max(1, radius * 0.08)
  ctx.beginPath()
  ctx.arc(cx, cy, radius * 0.55, -0.6, 0.6)
  ctx.stroke()

  ctx.restore()
}

/**
 * Draws the currently-pending coin delivery: pops in with a small bounce,
 * then bobs gently with a rotating sparkle glint while it waits to be
 * clicked. Its value is shown above it at all times (not just on hover),
 * so it's obvious both that it's collectible and what it's worth.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ x: number, y: number, width: number, height: number }} rect
 * @param {number} tilePx
 * @param {number} nowMs
 * @param {import('#game/types/coinDelivery.js').PendingCoinDelivery} delivery
 */
export function drawCoinDelivery(ctx, rect, tilePx, nowMs, delivery) {
  const elapsed = nowMs - delivery.spawnedAt
  const popT = Math.min(1, Math.max(0, elapsed / POP_DURATION_MS))
  const popScale = easeOutBack(popT)

  const cx = rect.x + rect.width / 2
  const bobPhase = Math.max(0, elapsed - POP_DURATION_MS) / 1000
  const bob = Math.sin(bobPhase * 2.2) * tilePx * 0.06
  const cy = rect.y + rect.height / 2 + bob
  const radius = tilePx * 0.22

  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(popScale, popScale)
  ctx.translate(-cx, -cy)
  drawCoinShape(ctx, cx, cy, radius)
  ctx.restore()

  // Rotating glint sweeping around the coin - reads as "shiny, tap me"
  // from across the map, not just up close.
  const glintAngle = (nowMs / 900) % (Math.PI * 2)
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'
  ctx.lineWidth = Math.max(1, radius * 0.12)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(cx, cy, radius * 1.15, glintAngle, glintAngle + 0.5)
  ctx.stroke()
  ctx.restore()

  if (rect.width < 32) return
  const label = `+${delivery.amount}`
  const fontSize = Math.max(9, Math.min(15, tilePx * 0.16))
  ctx.font = `700 ${fontSize}px sans-serif`
  const paddingX = fontSize * 0.5
  const textWidth = ctx.measureText(label).width
  const chipWidth = textWidth + paddingX * 2
  const chipHeight = fontSize + fontSize * 0.5
  const chipX = cx - chipWidth / 2
  const chipY = cy - radius - chipHeight - 4

  ctx.fillStyle = 'rgba(12, 16, 10, 0.8)'
  ctx.beginPath()
  ctx.roundRect(chipX, chipY, chipWidth, chipHeight, chipHeight / 2)
  ctx.fill()

  ctx.fillStyle = '#e0b23d'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, cx, chipY + chipHeight / 2)
}

/**
 * Brief "+N coins" burst where a delivery was just collected - fades and
 * rises over `durationMs`, purely cosmetic (the coins are already
 * credited by the time this plays - see useCoinBurstEffects.js).
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ x: number, y: number, width: number, height: number }} rect
 * @param {number} nowMs
 * @param {{ amount: number, spawnedAt: number }} burst
 * @param {number} durationMs
 */
export function drawCoinCollectBurst(ctx, rect, nowMs, burst, durationMs) {
  const t = Math.min(1, (nowMs - burst.spawnedAt) / durationMs)
  const alpha = 1 - t
  const cx = rect.x + rect.width / 2
  const cy = rect.y + rect.height / 2 - t * rect.height * 0.6

  ctx.save()
  ctx.globalAlpha = alpha
  ctx.font = `700 ${Math.max(11, rect.width * 0.14)}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#e0b23d'
  ctx.fillText(`+${burst.amount} coins`, cx, cy)
  ctx.restore()
}
