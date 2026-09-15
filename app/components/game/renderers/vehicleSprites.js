import { drawParcel } from './worldEffects.js'

const COLORS = {
  truck: '#e8bc57', box_truck: '#72b3bd', semi: '#e08473',
  cargo_train: '#75a775', freight_train: '#819ec6', bullet_train: '#e9e6d7'
}

/** Local, resolution-independent fleet art; direction follows the route. */
export function drawVehicleSprite(ctx, tierId, direction, rect, time = 0) {
  ctx.save()
  ctx.translate(rect.x + rect.width / 2, rect.y + rect.height / 2)
  ctx.rotate(({ e: 0, s: Math.PI / 2, w: Math.PI, n: -Math.PI / 2 })[direction] ?? 0)
  ctx.scale(rect.width / 100, rect.height / 100)
  const train = tierId.includes('train')
  const phase = time / 90
  ctx.save()
  ctx.globalAlpha *= 0.15
  ctx.fillStyle = '#294844'
  ctx.beginPath(); ctx.ellipse(0, 6, 45, 23, 0, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
  ctx.strokeStyle = '#294844'
  ctx.lineWidth = 2
  const box = (x, y, w, h, fill, r = 3) => {
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, r)
    ctx.fillStyle = fill
    ctx.fill()
    ctx.stroke()
  }
  for (const x of [-26, 22]) {
    box(x, -22, 10, 7, '#385750')
    box(x, 15, 10, 7, '#385750')
  }
  const color = COLORS[tierId] ?? COLORS.truck
  if (time) for (let i = 0; i < 3; i++) {
    const p = (time / 850 + i / 3) % 1
    ctx.save(); ctx.globalAlpha *= (1 - p) * 0.4
    ctx.fillStyle = '#f7efcf'
    ctx.beginPath(); ctx.ellipse(-43 - p * 25, Math.sin(i * 3) * 12, 2 + p * 5, 1 + p * 3, 0, 0, Math.PI * 2); ctx.fill()
    ctx.restore()
  }
  ctx.translate(0, time ? Math.sin(phase) * 0.6 : 0)
  box(-40, -18, 52, 36, color)
  box(15, -16, 25, 32, color, tierId === 'bullet_train' ? 12 : 5)
  box(24, -11, 7, 22, '#d8f3ed', 2)
  box(37, -12, 4, 5, '#fff0a8', 1)
  box(37, 7, 4, 5, '#fff0a8', 1)
  for (const x of [-22, 26]) for (const y of [-19, 18]) {
    ctx.strokeStyle = '#adcbc0'
    ctx.beginPath(); ctx.moveTo(x - 3 + Math.sin(phase) * 2, y); ctx.lineTo(x + 2 + Math.sin(phase) * 2, y); ctx.stroke()
  }
  ctx.strokeStyle = '#294844'
  if (tierId === 'truck') {
    box(-34, -12, 33, 24, '#ccaa72', 1)
    ctx.beginPath()
    ctx.moveTo(-34, -12)
    ctx.lineTo(-1, 12)
    ctx.moveTo(-1, -12)
    ctx.lineTo(-34, 12)
    ctx.stroke()
    drawParcel(ctx, -17, 0, 20, time)
  } else {
    ctx.strokeStyle = '#ffffff90'
    for (let x = -32; x < 5; x += 9) {
      ctx.beginPath()
      ctx.moveTo(x, -12)
      ctx.lineTo(x, 12)
      ctx.stroke()
    }
  }
  if (train) {
    box(-37, -21, 46, 5, '#a9c8bc', 1)
    box(-37, 16, 46, 5, '#a9c8bc', 1)
    box(7, -5, 8, 10, '#465f59', 1)
    if (tierId !== 'bullet_train') {
      box(17, -8, 6, 16, '#405d56', 2)
      ctx.strokeStyle = '#f4e4b4'
      ctx.beginPath(); ctx.moveTo(-31, -10); ctx.lineTo(-1, 10); ctx.stroke()
    }
  }
  ctx.restore()
}
