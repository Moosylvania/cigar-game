import { ref } from 'vue'

// Module-scoped (not per-component) so every caller shares the exact same
// ref - a lightweight stand-in for a Pinia store, deliberately NOT part of
// the game store itself. It used to live on the game store as `nowMs`,
// updated every animation frame so countdown text stays smooth - but every
// store mutation (Pinia's whole-store $subscribe has no way to filter to
// specific fields) re-triggers the autosave debounce in
// game-init.client.js, so a once-per-frame store write meant the "save
// ~2s after activity settles" path never actually fired, only the 30s
// hard-interval fallback. Keeping the clock outside Pinia entirely avoids
// that interference without losing the smooth per-frame updates.
const nowMs = ref(Date.now())

export function useClock() {
  return { nowMs }
}
