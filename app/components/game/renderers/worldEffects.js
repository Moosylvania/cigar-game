const TAU = Math.PI * 2

export function drawParcel(ctx, x, y, size, time = 0, color = '#dfad68') {
  ctx.save()
  ctx.translate(x, y + Math.sin(time / 230) * size * 0.045)
  ctx.rotate(Math.sin(time / 330) * 0.035)
  ctx.lineWidth = Math.max(1, size * 0.06)
  ctx.strokeStyle = '#395951'
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.roundRect(-size / 2, -size / 2, size, size * 0.8, size * 0.06)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#fae7b8'
  ctx.fillRect(-size * 0.09, -size / 2, size * 0.18, size * 0.8)
  ctx.fillStyle = '#fffdf0'
  ctx.fillRect(size * 0.16, -size * 0.12, size * 0.22, size * 0.15)
  ctx.restore()
}

export function drawSpark(ctx, x, y, radius, color = '#fff4be') {
  ctx.fillStyle = color
  ctx.beginPath()
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4
    const r = i % 2 ? radius * 0.24 : radius
    const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fill()
}

// Construction is anchored to the footprint; only its winch and work sparks move.
export function drawConstruction(ctx, rect, time) {
  ctx.save()
  ctx.translate(rect.x, rect.y)
  ctx.scale(rect.width / 100, rect.height / 100)
  ctx.lineWidth = 2
  ctx.strokeStyle = '#64898a'
  ctx.beginPath()
  for (const x of [11, 30, 72, 90]) {
    ctx.moveTo(x, 82); ctx.lineTo(x, 24)
  }
  for (const y of [40, 60, 79]) {
    ctx.moveTo(9, y); ctx.lineTo(92, y)
  }
  ctx.moveTo(11, 79); ctx.lineTo(30, 60); ctx.lineTo(11, 40)
  ctx.moveTo(90, 79); ctx.lineTo(72, 60); ctx.lineTo(90, 40)
  ctx.stroke()
  ctx.strokeStyle = '#f1c85c'
  ctx.lineWidth = 3
  ctx.beginPath(); ctx.moveTo(70, 80); ctx.lineTo(70, 20); ctx.lineTo(94, 20); ctx.stroke()
  const y = 44 + Math.sin(time / 700) * 9
  ctx.strokeStyle = '#395951'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(87, 20); ctx.lineTo(87, y); ctx.stroke()
  drawParcel(ctx, 87, y + 4, 9, time)
  ctx.fillStyle = '#f5c65e'; ctx.fillRect(9, 78, 84, 5)
  ctx.fillStyle = '#395951'
  for (let x = 12; x < 90; x += 10) ctx.fillRect(x, 78, 4, 5)
  if (time) for (let i = 0; i < 3; i++) {
    const p = (time / 550 + i / 3) % 1
    ctx.globalAlpha = 1 - p
    drawSpark(ctx, 30 + p * 13, 56 - Math.sin(p * Math.PI) * 12, 1.8, '#fff4be')
  }
  ctx.restore()
}

export function drawBuildingCelebration(ctx, rect, progress, kind) {
  if (progress == null) return
  ctx.save()
  ctx.globalAlpha *= 1 - progress
  const cx = rect.x + rect.width / 2, cy = rect.y + rect.height * 0.5
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * TAU
    const radius = rect.width * (0.12 + progress * 0.5)
    drawSpark(ctx, cx + Math.cos(a) * radius, cy + Math.sin(a) * radius * 0.6 - progress * rect.height * 0.2,
      rect.width * 0.035, ['#f6d46d', '#f8fff0', '#61c6b4'][i % 3])
  }
  if (kind === 'collect') drawParcel(ctx, cx, cy - progress * rect.height * 0.55, rect.width * 0.18)
  ctx.restore()
}
