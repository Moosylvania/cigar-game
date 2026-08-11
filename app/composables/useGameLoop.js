import { useGameStore } from '~/stores/game.js'

/**
 * Fixed-timestep game loop: accumulates real elapsed time and calls the
 * store's tick() once per simulated second, so realtime ticking uses the
 * same 1-second granularity as offline catch-up.
 */
export function useGameLoop() {
  const store = useGameStore()
  let rafId = null
  let lastFrameTime = null
  let accumulator = 0
  const TICK_SECONDS = 1

  function frame(timestamp) {
    if (lastFrameTime == null) lastFrameTime = timestamp
    const deltaMs = timestamp - lastFrameTime
    lastFrameTime = timestamp
    accumulator += deltaMs / 1000

    while (accumulator >= TICK_SECONDS) {
      store.tick()
      accumulator -= TICK_SECONDS
    }

    rafId = requestAnimationFrame(frame)
  }

  function start() {
    if (rafId != null) return
    lastFrameTime = null
    rafId = requestAnimationFrame(frame)
  }

  function stop() {
    if (rafId != null) cancelAnimationFrame(rafId)
    rafId = null
  }

  return { start, stop }
}
