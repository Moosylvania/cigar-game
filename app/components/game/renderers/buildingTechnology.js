// Technology follows level, while every finish follows the prestige palette.
// Attachments occupy roof edges, facade corners, and the plinth, not work bays.
export function drawBuildingTechnology(ctx, { type, level, left, right, eave, palette: p, time }, { box, line, ellipse, path }) {
  if (level < 5) return
  ctx.save()
  const glow = p.water
  const strip = (x, y, width, height = 1.2) => {
    ctx.fillStyle = glow; ctx.fillRect(x, y, width, height)
    ctx.fillStyle = p.wall; ctx.fillRect(x, y, width, height * 0.3)
  }
  // Flush foundation panels are the first hint of modernization.
  for (let x = left + 4; x < right - 3; x += 12) line(ctx, x, 79, x, 81)
  if (level >= 6) {
    strip(left + 3, 79, right - left - 6)
    for (const x of [left + 1, right - 3]) {
      box(ctx, x, eave + 3, 2, 8, p.material, 0.5)
      strip(x + 0.5, eave + 4, 1, 5)
    }
  }
  if (level >= 7 && type === 'field') {
    // An angled roof-mounted sensor array, with feet meeting the eave.
    const x = type === 'town_hall' ? left + 8 : right - 15
    line(ctx, x, eave, x, eave - 5)
    line(ctx, x + 10, eave, x + 10, eave - 5)
    path(ctx, [[x - 1, eave - 5], [x + 2, eave - 11], [x + 13, eave - 11], [x + 10, eave - 5]], p.material)
    ctx.strokeStyle = glow; ctx.lineWidth = 0.8
    for (let i = 0; i < 3; i++) line(ctx, x + 2 + i * 3, eave - 6, x + 4 + i * 3, eave - 10)
    ctx.strokeStyle = '#294844'; ctx.lineWidth = 1.7
  }
  if (level >= 8) {
    // Beveled corner armor stays outside the facade's usable interior.
    for (const x of [left - 1, right - 2]) {
      path(ctx, [[x, eave + 13], [x + 3, eave + 16], [x + 3, 76], [x, 78]], p.material)
      strip(x + 0.8, eave + 20, 1, Math.max(5, 50 - eave))
    }
  }
  if (level >= 9 && type === 'field') {
    const x = right - 2
    line(ctx, x, eave, x, eave - 19)
    ellipse(ctx, x, eave - 16, 4, 1.7, p.material)
    ellipse(ctx, x, eave - 21, 1.5, 1.5, glow)
  }
  if (level >= 10) {
    // Paired powered supports mark the final tier without covering equipment.
    for (const x of [left - 2, right + 2]) {
      box(ctx, x - 2, 63, 4, 15, p.material, 1)
      for (let y = 66; y < 76; y += 3) strip(x - 1.5, y, 3)
    }
    ctx.save()
    ctx.globalAlpha *= time ? 0.65 + Math.sin(time / 1100) * 0.2 : 0.8
    strip(left + 4, 81, right - left - 8, 0.8)
    ctx.restore()
  }
  ctx.restore()
}
