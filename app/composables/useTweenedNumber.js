import { ref, watch } from 'vue'
import { useClock } from './useClock.js'

const DEFAULT_DURATION_MS = 350

// easeOutCubic - fast start (reads as instant response), smooth settle.
function easeOutCubic(t) {
  return 1 - (1 - t) ** 3
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value))
}

/**
 * Tweens a numeric source value toward its latest target over `duration`ms,
 * driven by the shared per-frame clock (useClock's nowMs, already updated
 * every animation frame by useGameLoop) instead of a new raf loop.
 * Retargeting mid-flight redirects from wherever the displayed value
 * currently sits (not from the old target), so a source that changes again
 * before the previous tween finishes never jumps - it smoothly redirects.
 * @param {() => number} sourceGetter
 * @param {{ duration?: number }} [options]
 * @returns {import('vue').Ref<number>} raw (unfloored) interpolated value
 */
export function useTweenedNumber(sourceGetter, options = {}) {
  const duration = options.duration ?? DEFAULT_DURATION_MS
  const { nowMs } = useClock()

  let from = sourceGetter()
  let to = from
  let startedAt = nowMs.value
  const displayed = ref(to)

  // Detects a new target value - the immediate call on mount sees
  // target === to (both are sourceGetter()'s initial value), so the first
  // paint snaps straight to it rather than animating up from 0.
  watch(sourceGetter, (target) => {
    if (target === to) return
    from = displayed.value
    to = target
    startedAt = nowMs.value
  }, { immediate: true })

  // Per-frame interpolation, piggybacking on the existing raf-driven ref.
  watch(nowMs, (t) => {
    displayed.value = from === to ? to : from + (to - from) * easeOutCubic(clamp01((t - startedAt) / duration))
  })

  return displayed
}
