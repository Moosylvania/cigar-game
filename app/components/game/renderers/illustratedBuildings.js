import { drawBuildingWorkers } from './buildingWorkers.js'
import { drawBuildingTechnology } from './buildingTechnology.js'
import { getPrestigePalette } from './prestigePalette.js'
import { drawBuildingDesign } from './buildingDesigns.js'

const INK = '#294844'
const ROOFS = {
  town_hall: '#e77570', nursery: '#64c9bb', field: '#4a9760',
  curing: '#d86b62', steam: '#699cc4', fermentation: '#c58cb4',
  rolling: '#e6b650', distribution: '#719ec2'
}

function box(ctx, x, y, w, h, fill, radius = 2) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, radius)
  ctx.fillStyle = fill
  ctx.fill()
  ctx.stroke()
  if (w > 12 && h > 12) {
    ctx.save()
    ctx.clip()
    ctx.fillStyle = '#29484418'
    ctx.fillRect(x + w - Math.max(3, w * 0.12), y, w * 0.12 + 1, h)
    ctx.fillStyle = '#ffffff35'
    ctx.fillRect(x + 2, y + 2, w - 4, 2)
    ctx.restore()
  }
}

function path(ctx, points, fill) {
  ctx.beginPath()
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
  ctx.stroke()
}

function ellipse(ctx, x, y, rx, ry, color, stroke = true) {
  ctx.beginPath()
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  if (stroke) ctx.stroke()
}

function line(ctx, x, y, x2, y2) {
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x2, y2)
  ctx.stroke()
}

function plant(ctx, x, y, phase, ripe = false, palette = getPrestigePalette()) {
  const sway = Math.sin(phase) * 2.5
  ctx.save()
  ctx.translate(x, y)
  line(ctx, 0, 0, sway, -13)
  path(ctx, [[sway, -6], [sway - 9, -14], [sway - 8, -5], [0, -2]], ripe ? palette.leafLight : palette.leaf)
  path(ctx, [[sway, -9], [sway + 8, -18], [sway + 9, -9], [0, -4]], palette.leafLight)
  ctx.restore()
}

function flag(ctx, x, y, t, color) {
  line(ctx, x, y, x, y - 16)
  path(ctx, [[x, y - 16], [x + 11, y - 14 + Math.sin(t) * 2], [x + 10, y - 7], [x, y - 9]], color)
}

// Each upgrade changes the farm silhouette or a visible piece of infrastructure.
// Draw rear equipment first, beds back-to-front, then foreground rails/canopy.
function drawField(ctx, level, palette, time, phase, ready, processing) {
  const stage = Math.max(1, Math.min(10, level))
  const developed = stage >= 6
  const left = developed ? 28 : stage === 1 ? 27 : 14
  const right = stage === 1 ? 73 : 86
  const rows = stage === 1 ? 2 : 3
  const columns = stage === 1 ? 2 : developed ? 4 : 5
  const top = stage >= 7 ? 39 : 31
  const bottom = 78

  if (stage >= 7) {
    box(ctx, 10, 25, 24, 24, palette.wall, 1)
    path(ctx, [[7, 26], [22, 15], [37, 26]], palette.roof ?? '#b16f4f')
    box(ctx, 17, 33, 10, 16, palette.material, 1)
  }
  if (stage >= 9) {
    // Solar rack on the shed roof, behind crops and growing structure.
    path(ctx, [[9, 24], [16, 12], [35, 12], [28, 24]], '#395e80')
    ctx.strokeStyle = '#a5d7e6'
    line(ctx, 13, 20, 30, 20); line(ctx, 16, 16, 33, 16)
    line(ctx, 23, 13, 17, 23); line(ctx, 29, 13, 23, 23)
    ctx.strokeStyle = INK
  }
  if (stage >= 6) {
    // Tank occupies its own service lane, separate from the planted beds.
    box(ctx, 10, 56, 13, 22, palette.water, 4)
    ellipse(ctx, 16.5, 56, 6.5, 2.5, palette.wall)
    line(ctx, 11, 65, 22, 65)
    box(ctx, 14, 48, 5, 6, palette.material, 1)
    line(ctx, 22, 72, 28, 72)
  }

  box(ctx, left - 3, top - 2, right - left + 6, bottom - top + 5, palette.soil, 3)
  const rowHeight = (bottom - top) / rows
  for (let row = 0; row < rows; row++) {
    const y = top + rowHeight * (row + 1) - 3
    if (stage >= 3) {
      box(ctx, left, y - rowHeight + 4, right - left, rowHeight - 2, palette.material, 1)
      box(ctx, left + 2, y - rowHeight + 5, right - left - 4, rowHeight - 6, palette.soil, 0.5)
    } else {
      ctx.strokeStyle = '#785e43'
      line(ctx, left, y, right, y)
      ctx.strokeStyle = INK
    }
    if (stage >= 5) {
      ctx.strokeStyle = palette.water
      ctx.lineWidth = 1.6
      line(ctx, left + 2, y + 1, right - 2, y + 1)
      ctx.strokeStyle = INK
    }
    for (let col = 0; col < columns; col++) {
      const x = left + (right - left) * (col + 0.5) / columns
      ctx.save()
      ctx.translate(x, y - 2)
      ctx.scale(stage === 1 ? 0.6 : 0.68, stage >= 8 ? 0.82 : 0.68)
      plant(ctx, 0, 0, phase + col + row, ready, palette)
      ctx.restore()
    }
  }
  if (stage >= 5) {
    ctx.strokeStyle = palette.water
    ctx.lineWidth = 2
    line(ctx, right + 1, top + 4, right + 1, bottom - 3)
    ctx.strokeStyle = INK
    for (const y of [top + 8, bottom - 8]) {
      box(ctx, right - 2, y - 3, 6, 3, palette.water, 1)
      if (processing && time) {
        const pulse = (time / 900 + y / 100) % 1
        ctx.save(); ctx.globalAlpha = 1 - pulse
        for (let i = 0; i < 3; i++) ellipse(ctx, right - 5 - pulse * 10, y + i * 3, 0.7, 1.2, palette.water, false)
        ctx.restore()
      }
    }
  }
  if (stage === 7) {
    // Open trellises support the crop without concealing it.
    for (const x of [left + 1, right - 1]) {
      line(ctx, x, top + 3, x, top - 12)
      line(ctx, x, bottom, x, bottom - 17)
    }
    ctx.strokeStyle = palette.material
    line(ctx, left, top - 11, right, top - 11)
    line(ctx, left, bottom - 16, right, bottom - 16)
    ctx.strokeStyle = INK
  }
  if (stage >= 4 && stage < 8) {
    for (const x of [left - 5, right + 5]) box(ctx, x - 1.5, 67, 3, 16, palette.wall, 0.5)
    box(ctx, left - 6, 73, right - left + 12, 3, palette.wall, 0.5)
  }
  if (stage >= 8) {
    // A transparent growing house replaces the open fence at the final level.
    ctx.save()
    ctx.globalAlpha = stage >= 10 ? 0.25 : 0.16
    path(ctx, [[left - 4, 80], [left - 4, 42], [left + 7, 25], [right - 7, 25], [right + 4, 42], [right + 4, 80]], palette.water)
    ctx.restore()
    for (const x of [left - 4, (left + right) / 2, right + 4]) {
      ctx.strokeStyle = palette.wall
      ctx.lineWidth = 2.4
      line(ctx, x, 80, x, 42)
    }
    ctx.beginPath()
    ctx.moveTo(left - 4, 42); ctx.lineTo(left + 7, 25)
    ctx.lineTo(right - 7, 25); ctx.lineTo(right + 4, 42)
    ctx.moveTo(left - 4, 42); ctx.lineTo(right + 4, 42)
    ctx.stroke()
    if (stage >= 9) {
      ctx.strokeStyle = palette.water
      for (const y of [45, 58, 71]) line(ctx, left - 3, y, right + 3, y)
    }
    if (stage >= 10) {
      box(ctx, left + 9, 21, right - left - 18, 5, palette.material, 2)
      ctx.fillStyle = palette.water
      ctx.fillRect(left + 12, 22, right - left - 24, 2)
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 1.7
    box(ctx, left - 5, 79, right - left + 10, 3, palette.material, 0.5)
  }
}

// All art uses a 100-unit local space. Labels and hit targets are drawn
// separately so animation never moves a building's interaction footprint.
export function drawIllustratedBuilding(ctx, building, rect, time = 0, themeId = 'backyard') {
  const { type, level = 1 } = building
  const palette = getPrestigePalette(themeId)
  const { roof: accent } = palette
  const roof = accent ?? ROOFS[type] ?? '#6eb19b'
  const t = time / 800 + (building.position?.x ?? 0) * 0.8 + (building.position?.y ?? 0)
  const processing = building.slot?.status === 'processing' && !building.upgrade
  ctx.save()
  ctx.translate(rect.x, rect.y)
  ctx.scale(rect.width / 100, rect.height / 100)
  ctx.lineWidth = 1.7
  ctx.strokeStyle = INK
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ellipse(ctx, 51, 81, 39, 6, '#395e4428', false)
  if (type === 'field') {
    drawField(ctx, level, { ...palette, roof }, time, t, building.slot?.status === 'ready', processing)
    drawBuildingTechnology(ctx, { type, level, left: 25, right: 90, eave: level >= 8 ? 42 : 38, palette, time }, { box, line, ellipse, path })
  } else {
    drawBuildingDesign(ctx, type, level, { ...palette, roof, cargoColors: building.cargoColors }, time, processing, { box, path, ellipse, line, plant, flag })
  }
  drawBuildingWorkers(ctx, building, { ...palette, roof }, time)
  ctx.restore()
}

export function buildingThumbnail(type, themeId = 'backyard') {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  drawIllustratedBuilding(canvas.getContext('2d'), { type, level: 1 }, { x: 0, y: -13, width: 128, height: 145 }, 0, themeId)
  return canvas.toDataURL('image/png')
}
