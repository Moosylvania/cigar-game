// One clock for visible menu artwork, independent of gameplay and persistence.
const painters = new Set()
let frameId = null
let lastFrame = 0

function frame(time) {
  frameId = requestAnimationFrame(frame)
  if (document.hidden || time - lastFrame < 1000 / 20) return
  lastFrame = time
  const moving = document.documentElement.dataset.gameMotion === 'on'
  for (const paint of painters) paint(moving ? Date.now() : 0)
}

export function subscribeArtFrame(paint) {
  painters.add(paint)
  if (frameId == null) frameId = requestAnimationFrame(frame)
  return () => {
    painters.delete(paint)
    if (!painters.size && frameId != null) {
      cancelAnimationFrame(frameId)
      frameId = null
      lastFrame = 0
    }
  }
}
