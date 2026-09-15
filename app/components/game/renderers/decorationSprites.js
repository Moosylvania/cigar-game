import { publicAsset } from '~/utils/publicAsset.js'
import { drawParcel, drawSpark } from './worldEffects.js'

const SPRITE_BASE = publicAsset('images/cigar_sprite_pack_topdown/sprites/decorations/')

const imageCache = new Map()

/**
 * @param {string} spriteFile - DecorationDefinition.spriteFile (no extension)
 * @returns {HTMLImageElement}
 */
export function getDecorationSpriteImage(spriteFile) {
  let img = imageCache.get(spriteFile)
  if (!img) {
    img = new Image()
    img.src = `${SPRITE_BASE}${spriteFile}.webp`
    imageCache.set(spriteFile, img)
  }
  return img
}

/**
 * Draws a decoration's sprite into rect, falling back to a soft placeholder
 * dot for the brief window before the image loads.
 */
export function drawDecoration(ctx, spriteFile, rect, time = 0) {
  ctx.save()
  ctx.translate(rect.x, rect.y)
  ctx.scale(rect.width / 100, rect.height / 100)
  ctx.strokeStyle = '#395951'
  ctx.lineWidth = 1.5
  ctx.lineCap = 'round'
  const phase = time / 1500 + rect.x * 0.013
  const oval = (x, y, rx, ry, fill) => {
    ctx.beginPath()
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
    ctx.fillStyle = fill; ctx.fill(); ctx.stroke()
  }
  const box = (x, y, w, h, fill) => {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 2)
    ctx.fillStyle = fill; ctx.fill(); ctx.stroke()
  }
  const line = (x, y, ex, ey) => {
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke()
  }
  ctx.save(); ctx.globalAlpha *= 0.15
  oval(50, 82, 30, 5, '#395951'); ctx.restore()
  const plant = /tree|sapling|shrub|hedge|flower|planter/.test(spriteFile)
  if (plant) {
    const tree = /tree|sapling/.test(spriteFile)
    const sway = Math.sin(phase) * (tree ? 2 : 1)
    if (spriteFile === 'tobacco_planter') box(24, 68, 53, 14, '#d39372')
    ctx.save()
    ctx.transform(1, 0, sway / 90, 1, -sway * 0.9, 0)
    if (tree) {
      box(47, 45, 6, 36, '#b99268')
      line(50, 64, 37, 51); line(50, 55, 61, 41)
    }
    if (spriteFile === 'cypress_tree') {
      oval(50, 45, 14, 31, '#4d9270'); oval(46, 38, 7, 19, '#72b07c')
    } else if (spriteFile === 'palm_tree') {
      for (let i = 0; i < 6; i++) {
        ctx.save(); ctx.translate(50, 33); ctx.rotate(i * Math.PI / 3)
        oval(13, 0, 19, 5, i % 2 ? '#84bb72' : '#50a07c'); ctx.restore()
      }
    } else {
      const y = tree ? 43 : 65, radius = tree ? (spriteFile === 'sapling' ? 13 : 24) : 15
      for (let i = 0; i < 3; i++) oval(30 + i * 19, y + (i % 2 ? -9 : 0), radius, radius * 0.84, ['#64a87b', '#85bd7e', '#59a17c'][i])
      if (/flower|planter/.test(spriteFile)) {
        for (let i = 0; i < 8; i++) oval(25 + (i * 13) % 52, 53 + (i * 7) % 22, 2.5, 2.5, i % 2 ? '#f7d376' : '#f3a4b3')
      }
      ctx.strokeStyle = '#b5d890'; line(29, y - 4, 34, y - 9); line(53, y - 13, 59, y - 15)
    }
    ctx.restore()
  } else if (/pond|fountain/.test(spriteFile)) {
    oval(50, 72, 37, 14, '#b4c4b5'); oval(50, 69, 31, 10, '#7cc2c5')
    if (spriteFile === 'stone_fountain') {
      box(47, 45, 6, 23, '#d5dfd5'); oval(50, 44, 17, 6, '#a8c5c1')
      oval(50, 40, 13, 3, '#96e0df')
      ctx.strokeStyle = '#e7ffff'
      for (let i = 0; i < 4; i++) {
        const p = (time / 900 + i / 4) % 1
        oval(50 + Math.sin(i * 2) * p * 20, 43 + p * 22, 1, 2, '#dbfbfa')
      }
    }
    ctx.strokeStyle = '#e2f8e5'
    for (let i = 0; i < 3; i++) {
      const p = (time / 1900 + i / 3) % 1
      ctx.globalAlpha = 1 - p
      ctx.beginPath(); ctx.ellipse(50, 70, 5 + p * 24, 2 + p * 6, 0, 0, Math.PI * 2); ctx.stroke()
    }
  } else if (spriteFile === 'brass_streetlamp') {
    box(47, 35, 5, 46, '#ac9458'); box(40, 78, 20, 5, '#c5b577')
    box(39, 24, 22, 19, '#f5da86'); box(35, 21, 30, 5, '#789184')
    ctx.globalAlpha = 0.5 + Math.sin(phase) * 0.25
    drawSpark(ctx, 50, 33, 7, '#fffbe2')
  } else if (/crates|handcart|hay/.test(spriteFile)) {
    const hay = spriteFile === 'hay_bales'
    drawParcel(ctx, 34, 69, 25, time, hay ? '#e4c96d' : '#ce996d')
    drawParcel(ctx, 63, 69, 25, time + (time ? 200 : 0), hay ? '#ebd382' : '#dfae78')
    drawParcel(ctx, 48, 49, 23, time + (time ? 400 : 0), hay ? '#f0d889' : '#e7bb89')
    if (spriteFile === 'barrel_handcart') {
      line(18, 79, 88, 79); oval(30, 82, 5, 5, '#6b8880'); oval(68, 82, 5, 5, '#6b8880')
    }
  } else if (spriteFile === 'blank_signpost') {
    box(46, 43, 6, 40, '#b3926e')
    ctx.save(); ctx.translate(49, 43); ctx.rotate(Math.sin(phase) * 0.025)
    box(-25, -13, 50, 20, '#ecd59b'); ctx.restore()
  } else if (spriteFile === 'park_bench') {
    box(23, 50, 54, 7, '#c5a172'); box(23, 61, 54, 7, '#dec08b')
    box(20, 71, 60, 6, '#c5a172'); line(28, 58, 28, 85); line(71, 58, 71, 85)
  } else {
    const stone = spriteFile === 'stone_wall'
    for (let i = 0; i < 4; i++) box(16 + i * 18, stone ? 59 : 49, 14, stone ? 24 : 34, stone ? '#bdc9bb' : '#ecdfb8')
    if (!stone) { box(12, 57, 77, 5, '#f4e8c9'); box(12, 72, 77, 5, '#f4e8c9') }
  }
  // Rigid props stay grounded; a restrained glint gives them an ambient cycle.
  if (!plant && !/pond|fountain|lamp/.test(spriteFile)) {
    ctx.globalAlpha = Math.max(0, Math.sin(phase * 0.6)) * 0.75
    drawSpark(ctx, 67, 54, 3, '#fff8db')
  }
  ctx.restore()
}
