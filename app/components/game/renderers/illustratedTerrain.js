import { publicAsset } from '~/utils/publicAsset.js'

let meadowImage
function getMeadowImage() {
  if (!meadowImage && typeof Image !== 'undefined') {
    meadowImage = new Image()
    meadowImage.src = publicAsset('images/higgsfield-meadow.webp')
  }
  return meadowImage
}

export function drawMeadow(ctx, gx, gy, x, y, size, owned, time = 0) {
  const seed = Math.abs((gx * 73856093) ^ (gy * 19349663))
  ctx.fillStyle = owned ? ['#3e5942', '#425e46', '#3b5540'][seed % 3] : '#253b30'
  ctx.fillRect(x, y, size + 0.5, size + 0.5)
  const texture = getMeadowImage()
  if (texture?.complete && texture.naturalWidth) {
    const section = texture.naturalWidth / 4
    ctx.save()
    ctx.globalAlpha = owned ? 0.12 : 0.06
    ctx.drawImage(texture, ((gx % 4 + 4) % 4) * section, ((gy % 4 + 4) % 4) * section,
      section, section, x, y, size + 0.5, size + 0.5)
    ctx.restore()
  }
  if (size < 15) return
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(size / 100, size / 100)
  ctx.lineWidth = 1.5
  ctx.lineCap = 'round'
  ctx.strokeStyle = owned ? '#69805a' : '#45664c'
  for (let i = 0; i < 3; i++) {
    const bx = 13 + ((seed + i * 23) % 74)
    const by = 15 + ((seed * 3 + i * 37) % 70)
    ctx.beginPath()
    const breeze = Math.sin(time / 1300 + seed + i) * 2
    ctx.moveTo(bx - 3 + breeze, by - 3)
    ctx.lineTo(bx, by)
    ctx.lineTo(bx + 2 + breeze, by - 5)
    ctx.stroke()
  }
  if (!owned && seed % 5 === 0) {
    const sway = Math.sin(time / 1800 + seed % 10) * 1.5
    ctx.fillStyle = '#5b8a6533'
    ctx.beginPath()
    ctx.ellipse(51, 75, 17, 4, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#547e55'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(50, 75)
    ctx.lineTo(50 + sway, 44)
    ctx.stroke()
    ctx.fillStyle = seed % 2 ? '#6f9f68' : '#79aa6a'
    ctx.lineWidth = 1.3
    ctx.beginPath()
    ctx.moveTo(50 + sway, 27)
    ctx.bezierCurveTo(24 + sway, 43, 26 + sway, 67, 50 + sway, 65)
    ctx.bezierCurveTo(75 + sway, 68, 75 + sway, 42, 50 + sway, 27)
    ctx.fill()
    ctx.stroke()
    ctx.strokeStyle = '#94bf7e'
    ctx.beginPath()
    ctx.moveTo(48 + sway, 37)
    ctx.quadraticCurveTo(38 + sway, 44, 39 + sway, 53)
    ctx.stroke()
  } else if (seed % 4 === 1) {
    ctx.fillStyle = '#fff4c5'
    for (let i = 0; i < 3; i++) {
      const fx = 17 + i * 5
      const fy = 75 + (i % 2) * 5
      ctx.fillRect(fx - 1, fy - 3, 2, 6)
      ctx.fillRect(fx - 3, fy - 1, 6, 2)
    }
  }
  ctx.restore()
}
