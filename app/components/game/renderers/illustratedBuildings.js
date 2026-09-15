import { drawParcel, drawSpark } from './worldEffects.js'

const INK = '#294844'
const ROOFS = {
  town_hall: '#e77570', nursery: '#64c9bb', field: '#4a9760',
  curing: '#d86b62', steam: '#699cc4', fermentation: '#c58cb4',
  rolling: '#e6b650', distribution: '#719ec2'
}
const THEMES = {
  backyard: ['#fff7df', null], county_fair: ['#fff2cf', '#d89051'],
  state_monopoly: ['#e9f2f8', '#5785af'], national_syndicate: ['#f4eaf2', '#ab6c97'],
  continental_empire: ['#f7e4df', '#b95d68'], global_conglomerate: ['#fff3c7', '#b59942'],
  orbital_greenhouse: ['#d7eef1', '#578fa8'], moon_base: ['#ecedf5', '#8e96b7'],
  heavenly_fields: ['#fffbe2', '#c1aa59'], cosmic_ascendant: ['#e5e4f5', '#9380bc']
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

function plant(ctx, x, y, phase, ripe = false) {
  const sway = Math.sin(phase) * 2.5
  ctx.save()
  ctx.translate(x, y)
  line(ctx, 0, 0, sway, -13)
  path(ctx, [[sway, -6], [sway - 9, -14], [sway - 8, -5], [0, -2]], ripe ? '#b5c95f' : '#53aa6c')
  path(ctx, [[sway, -9], [sway + 8, -18], [sway + 9, -9], [0, -4]], '#85cc82')
  ctx.restore()
}

function flag(ctx, x, y, t, color) {
  line(ctx, x, y, x, y - 16)
  path(ctx, [[x, y - 16], [x + 11, y - 14 + Math.sin(t) * 2], [x + 10, y - 7], [x, y - 9]], color)
}

// All art uses a 100-unit local space. Labels and hit targets are drawn
// separately so animation never moves a building's interaction footprint.
export function drawIllustratedBuilding(ctx, building, rect, time = 0, themeId = 'backyard') {
  const { type, level = 1 } = building
  const [wall, accent] = THEMES[themeId] ?? THEMES.backyard
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
  if (type !== 'field') {
    path(ctx, [[11, 76], [81, 76], [93, 83], [23, 83]], '#d3d9b5')
    ctx.strokeStyle = '#a4b191'
    for (let x = 27; x < 88; x += 13) line(ctx, x, 78, x + 3, 82)
    ctx.strokeStyle = INK
  }

  if (type === 'field') {
    box(ctx, 9, 33, 82, 45, '#bfa275', 5)
    for (let row = 0; row < 3; row++) {
      ctx.strokeStyle = '#967950'
      line(ctx, 16, 43 + row * 14, 84, 43 + row * 14)
      ctx.strokeStyle = INK
      for (let col = 0; col < 4; col++) plant(ctx, 23 + col * 18, 46 + row * 14, t + col + row, building.slot?.status === 'ready')
    }
    for (const x of [8, 92]) {
      box(ctx, x - 2, 60, 4, 22, '#fff3d7', 1)
    }
    box(ctx, 7, 67, 86, 4, '#fff3d7', 1)
  } else if (type === 'nursery') {
    box(ctx, 14, 43, 72, 35, '#bce5ce', 3)
    path(ctx, [[10, 44], [29, 24], [72, 24], [91, 44]], roof)
    ctx.strokeStyle = '#f1fff1'
    for (const x of [30, 50, 70]) line(ctx, x, 28, x, 72)
    line(ctx, 18, 47, 82, 47)
    ctx.strokeStyle = INK
    for (let i = 0; i < 3; i++) {
      box(ctx, 23 + i * 21, 63, 13, 11, '#d88e68')
      plant(ctx, 29 + i * 21, 65, t + i)
    }
    box(ctx, 12, 76, 76, 4, '#f3e6bc')
  } else if (type === 'town_hall') {
    box(ctx, 19, 45, 63, 32, wall)
    path(ctx, [[12, 46], [26, 31], [74, 31], [89, 46]], roof)
    box(ctx, 40, 24, 22, 31, wall)
    path(ctx, [[36, 25], [51, 14], [66, 25]], roof)
    ellipse(ctx, 51, 36, 7, 7, '#ffffff')
    line(ctx, 51, 36, 51, 31)
    line(ctx, 51, 36, 51 + Math.sin(time / 6000) * 5, 36 - Math.cos(time / 6000) * 5)
    box(ctx, 45, 60, 13, 18, '#6f9ea0')
    for (const x of [27, 66]) box(ctx, x, 54, 9, 12, '#a9d9e2')
    box(ctx, 17, 78, 68, 4, '#dae2d0')
    flag(ctx, 73, 32, t, '#f3c956')
    for (const x of [17, 86]) ellipse(ctx, x, 73, 7, 7, '#6fb478')
  } else if (type === 'steam') {
    box(ctx, 14, 39, 72, 39, wall)
    box(ctx, 20, 24, 10, 21, '#6d9599')
    path(ctx, [[10, 43], [26, 29], [73, 29], [91, 43]], roof)
    for (const x of [30, 66]) {
      box(ctx, x - 10, 52, 20, 26, '#b4d9dc', 8)
      ellipse(ctx, x, 53, 10, 4, '#d9f1ed')
      ellipse(ctx, x, 64, 5, 5, '#fff5d2')
      line(ctx, x, 64, x + Math.sin(processing ? t * 4 : 0) * 3, 61)
    }
    if (processing) for (let i = 0; i < 4; i++) {
      const p = ((time / 1800 + i / 3) % 1 + 1) % 1
      ctx.globalAlpha = 0.7 * (1 - p)
      ellipse(ctx, 25 + Math.sin(p * 5) * 3, 23 - p * 17, 3 + p * 4, 3 + p * 3, '#ffffff', false)
    }
    ctx.globalAlpha = 1
  } else {
    box(ctx, 17, 44, 66, 34, wall)
    path(ctx, [[11, 45], [26, 27], [73, 27], [90, 45]], roof)
    ctx.strokeStyle = '#ffffff65'
    for (let x = 29; x < 76; x += 11) line(ctx, x, 31, x - 7, 41)
    ctx.strokeStyle = INK
    if (type === 'curing') {
      box(ctx, 34, 51, 33, 27, '#97694e')
      for (let i = 0; i < 4; i++) {
        const x = 39 + i * 8
        line(ctx, x, 53, x, 69)
        ellipse(ctx, x + Math.sin(t + i) * 1.3, 64, 3, 7, '#dfb65b')
      }
      box(ctx, 21, 52, 8, 10, '#b8dcdf')
      box(ctx, 73, 52, 7, 10, '#b8dcdf')
      ctx.save()
      ctx.translate(51, 37)
      ctx.rotate(processing ? time / 700 : time / 4000)
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2)
        path(ctx, [[0, 0], [2, -7], [5, -5], [3, 0]], '#f6d99a')
      }
      ctx.restore()
    } else if (type === 'fermentation') {
      box(ctx, 42, 49, 15, 28, '#647d80')
      for (const x of [28, 70]) {
        box(ctx, x - 9, 57, 18, 21, '#c79760', 6)
        line(ctx, x - 9, 62, x + 9, 62)
        line(ctx, x - 9, 73, x + 9, 73)
        line(ctx, x, 59, x, 76)
      }
      ellipse(ctx, 50, 36, 4, 4, '#ffe0aa')
      for (const x of [28, 70]) {
        ctx.strokeStyle = '#f3d9a8'
        ctx.beginPath()
        ctx.ellipse(x, 58, 6, 2, 0, time / 800, time / 800 + Math.PI)
        ctx.stroke()
        if (processing) for (let i = 0; i < 3; i++) {
          const p = (time / 1700 + i / 3 + x / 100) % 1
          ctx.globalAlpha = 1 - p
          ellipse(ctx, x + Math.sin(p * 7) * 3, 55 - p * 14, 1.5 + p, 1.5 + p, '#ffe6ae', false)
        }
        ctx.globalAlpha = 1
      }
      ctx.strokeStyle = INK
    } else if (type === 'rolling') {
      box(ctx, 24, 49, 52, 24, '#749fa0')
      box(ctx, 13, 69, 75, 10, '#a6cbc6', 5)
      for (let i = 0; i < 5; i++) {
        const x = 18 + ((i * 14 + (processing ? time / 100 : 0)) % 63)
        box(ctx, x, 69, 9, 4, '#bf8159', 2)
      }
      for (const x of [25, 72]) {
        ellipse(ctx, x, 77, 3, 3, '#52767a')
        const a = processing ? time / 180 : 0
        ctx.strokeStyle = '#e9f2d9'
        line(ctx, x, 77, x + Math.cos(a) * 2, 77 + Math.sin(a) * 2)
        ctx.strokeStyle = INK
      }
      box(ctx, 33, 53, 33, 8, '#f8e6ac')
    } else {
      box(ctx, 28, 49, 42, 29, '#65888b')
      for (let y = 53; y < 77; y += 5) line(ctx, 31, y, 67, y)
      box(ctx, 20, 76, 66, 5, '#6c9696', 2)
      for (let i = 0; i < 3; i++) {
        const p = (time / 6000 + i / 3) % 1
        drawParcel(ctx, 28 + p * 49, 71, 10, time + i * 600)
      }
      flag(ctx, 78, 29, t, '#f3ca60')
    }
  }
  // Every building keeps an individual idle cycle; production adds specific machinery.
  if (type === 'nursery' || type === 'field') {
    if (processing) for (let i = 0; i < 5; i++) {
      const p = (time / 1100 + i / 5) % 1
      ctx.globalAlpha = Math.sin(p * Math.PI) * 0.8
      ellipse(ctx, 24 + i * 12, 37 + p * 32, 1, 2.8, '#d4f5f3', false)
    }
    ctx.globalAlpha = 1
  } else {
    const shine = (Math.sin(t * 0.65) + 1) / 2
    ctx.globalAlpha = shine * 0.7
    drawSpark(ctx, type === 'town_hall' ? 31 : 25, 56, 2.5, '#fff9d5')
    ctx.globalAlpha = 1
  }
  if (level >= 3 && type !== 'field') {
    box(ctx, 78, 58, 15, 20, wall, 1)
    path(ctx, [[75, 59], [82, 51], [96, 59]], roof)
    box(ctx, 82, 65, 6, 8, '#a9d9e2', 1)
  }
  if (level >= 6 && type !== 'field') {
    box(ctx, 7, 48, 8, 29, '#7e9c9f', 2)
    box(ctx, 5, 45, 12, 5, '#d6e8dc', 1)
  }
  if (level >= 9 && type !== 'field') flag(ctx, 19, 34, t + 1, '#edbc4d')
  if (level > 1) {
    for (let i = 0; i < Math.min(5, Math.ceil(level / 2)); i++) {
      ellipse(ctx, 37 + i * 6, 84, 1.8, 1.8, level >= 6 ? '#edbc4d' : '#faf4d9')
    }
  }
  // Later prestige tiers retain a distinct technological silhouette.
  if (['orbital_greenhouse', 'moon_base', 'cosmic_ascendant'].includes(themeId)) {
    line(ctx, 85, 54, 85, 30)
    ellipse(ctx, 85, 29, 5, 3, roof)
    ellipse(ctx, 85, 22, 2, 2, '#e9c766')
  }
  ctx.restore()
}

export function buildingThumbnail(type, themeId = 'backyard') {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  drawIllustratedBuilding(canvas.getContext('2d'), { type, level: 1 }, { x: 0, y: -13, width: 128, height: 145 }, 0, themeId)
  return canvas.toDataURL('image/png')
}
