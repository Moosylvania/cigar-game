import { useGameStore } from '~/stores/game.js'
import { useClock } from './useClock.js'
import { now } from '#game/util/time.js'

/**
 * Fixed-timestep game loop: accumulates real elapsed time and calls the
 * store's tick() once per simulated second, so realtime ticking uses the
 * same 1-second granularity as offline catch-up.
 */
export function useGameLoop() {
  const store = useGameStore()
  const { nowMs } = useClock()
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

    // The shared display clock updates every frame, independent of the
    // once-per-simulated-second tick() above - tying it to the same
    // once-a-second cadence made any countdown under ~2s effectively freeze
    // (only one or two nowMs values ever landed inside a short batch's
    // lifetime before it finished). Game logic itself still only resolves
    // once per second; this only makes the *readout* smooth. Lives outside
    // the game store entirely (see useClock.js) so this per-frame write
    // doesn't retrigger the store's autosave debounce every single frame.
    nowMs.value = now()

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
