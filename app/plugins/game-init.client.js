import { createSaveAdapter } from '#game/persistence/index.js'
import { migrateSave } from '#game/persistence/migrations.js'
import { createInitialState } from '#game/state/createInitialState.js'
import { runOfflineCatchUp } from '#game/engine/catchUp.js'
import { clamp, now } from '#game/util/time.js'
import { useGameStore } from '~/stores/game.js'
import { useGameLoop } from '~/composables/useGameLoop.js'

const MAX_OFFLINE_SECONDS = 60 * 60 * 24 * 30 // cap at 30 days

export default defineNuxtPlugin(async () => {
  const store = useGameStore()
  const adapter = createSaveAdapter()

  const persist = () => {
    adapter.save({ version: 1, savedAt: now(), state: store.game })
  }

  // Registered before the first hydrate() below so that hydration itself -
  // whether a fresh game or a loaded save - schedules an initial autosave
  // instead of only reacting to the player's first subsequent action.
  let saveTimeout = null
  store.$subscribe(() => {
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(persist, 2000)
  })

  const raw = await adapter.load()

  if (!raw) {
    store.hydrate(createInitialState())
  } else {
    const save = migrateSave(raw)
    const elapsedSeconds = clamp((now() - save.savedAt) / 1000, 0, MAX_OFFLINE_SECONDS)
    const { cigarsSold, moneyEarned } = runOfflineCatchUp(save.state, elapsedSeconds)
    store.hydrate(save.state)
    if (moneyEarned > 0 || elapsedSeconds > 60) {
      store.offlineEarnings = { elapsedSeconds, cigarsSold, moneyEarned }
    }
  }

  setInterval(persist, 30000)

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') persist()
    })
    window.addEventListener('beforeunload', persist)
  }

  const { start } = useGameLoop()
  start()
})
