<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '~/stores/game.js'
import { createSaveAdapter } from '#game/persistence/index.js'
import { migrateSave } from '#game/persistence/migrations.js'
import { now } from '#game/util/time.js'

const emit = defineEmits(['close'])
const store = useGameStore()
const adapter = createSaveAdapter()

// Same wrapper shape the autosave plugin persists (see
// app/plugins/game-init.client.js) - reusing it here means an imported
// save goes through the exact same migrateSave/offline-catchup path on
// reload as any other save load, instead of a second copy of that logic.
const exportCode = computed(() => btoa(JSON.stringify({ version: 1, savedAt: now(), state: store.game })))

const copyFeedback = ref(null)
const importText = ref('')
const importError = ref(null)
const importBusy = ref(false)
const fileInput = ref(null)

function showCopyFeedback(message) {
  copyFeedback.value = message
  setTimeout(() => {
    if (copyFeedback.value === message) copyFeedback.value = null
  }, 2500)
}

async function copyCode() {
  try {
    await navigator.clipboard.writeText(exportCode.value)
    showCopyFeedback('Copied to clipboard!')
  } catch {
    showCopyFeedback('Could not copy automatically - select the text and copy it manually.')
  }
}

function downloadFile() {
  const blob = new Blob([JSON.stringify({ version: 1, savedAt: now(), state: store.game }, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `cigar-country-save-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}

// Accepts either the base64 save code from copyCode/showFeedback above, or
// raw JSON (from a downloaded file's contents, or someone pasting the file
// directly) - whichever one parses first.
function decodeSaveInput(text) {
  const trimmed = text.trim()
  if (!trimmed) throw new Error('empty')
  try {
    return JSON.parse(atob(trimmed))
  } catch {
    return JSON.parse(trimmed)
  }
}

async function applyImport(rawText) {
  importError.value = null
  let raw
  try {
    raw = decodeSaveInput(rawText)
  } catch {
    importError.value = "Couldn't read that - make sure you pasted the whole save code or picked the right file."
    return
  }

  let migrated
  try {
    migrated = migrateSave(raw)
  } catch {
    importError.value = "That doesn't look like a Cigar Country save."
    return
  }

  importBusy.value = true
  await adapter.save(migrated)
  // Also hydrate the live store, not just localStorage - otherwise the
  // running game loop is still mutating the OLD (pre-import) state, and
  // the autosave plugin's beforeunload handler (see game-init.client.js)
  // persists that stale state right as reload() triggers the unload,
  // clobbering the import a split second after we just wrote it. Hydrating
  // here means any autosave that fires during teardown just re-saves the
  // (now-current) imported state instead of overwriting it.
  store.hydrate(migrated.state)
  // A full reload (rather than relying on the hydrate above alone) reuses
  // the normal boot path in game-init.client.js as-is - offline catch-up,
  // autosave wiring, the game loop - instead of a second copy of that
  // setup logic.
  window.location.reload()
}

function importFromText() {
  applyImport(importText.value)
}

function onFilePicked(event) {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => applyImport(String(reader.result ?? ''))
  reader.readAsText(file)
}
</script>

<template>
  <div class="panel-backdrop" @click.self="emit('close')">
    <div class="panel">
      <div class="panel-header">
        <span class="header-icon"><Icon name="mdi:tray-arrow-down" /></span>
        <h3>Export / Import Save</h3>
        <button class="close" @click="emit('close')"><Icon name="mdi:close" /></button>
      </div>

      <div class="section">
        <h4>Export</h4>
        <p class="explainer">
          Copy this code (or download it as a file) and paste/upload it on another device or
          browser to bring your progress over.
        </p>
        <textarea class="code-box" readonly :value="exportCode" @focus="$event.target.select()" />
        <div class="button-row">
          <button class="primary" @click="copyCode"><Icon name="mdi:content-copy" /> Copy Code</button>
          <button @click="downloadFile"><Icon name="mdi:tray-arrow-down" /> Download File</button>
        </div>
        <p class="feedback" :class="{ visible: copyFeedback }">{{ copyFeedback || '&nbsp;' }}</p>
      </div>

      <div class="section">
        <h4>Import</h4>
        <p class="explainer warn-text">
          <Icon name="mdi:alert-outline" /> Importing replaces your current progress on this device. This can't be undone.
        </p>
        <textarea v-model="importText" class="code-box" placeholder="Paste a save code here…" />
        <div class="button-row">
          <button class="primary" :disabled="!importText.trim() || importBusy" @click="importFromText">
            <Icon name="mdi:tray-arrow-down" /> Import Code
          </button>
          <button :disabled="importBusy" @click="fileInput.click()"><Icon name="mdi:archive-outline" /> Choose File</button>
          <input ref="fileInput" type="file" accept=".json,application/json,text/plain" class="hidden-input" @change="onFilePicked" />
        </div>
        <p v-if="importError" class="note warn"><Icon name="mdi:alert-outline" /> {{ importError }}</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '~/assets/scss/variables' as *;

.panel-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;

  @include mobile {
    align-items: flex-end;
  }
}

.panel {
  width: 520px;
  max-width: 90vw;
  max-height: 85vh;
  overflow-y: auto;
  background: $color-panel;
  border: 1px solid $color-panel-border;
  border-radius: $radius-md;
  padding: $spacing-md;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;

  @include mobile {
    width: 100%;
    max-width: 100vw;
    max-height: 92dvh;
    border-radius: $radius-md $radius-md 0 0;
    padding: $spacing-sm;
  }
}

.panel-header {
  display: flex;
  align-items: center;
  gap: $spacing-sm;

  h3 {
    margin: 0;
    font-size: 1rem;
    flex: 1;
  }
}

.header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: $radius-sm;
  background: rgba(212, 169, 74, 0.15);
  color: $color-accent;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.close {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: $color-text-muted;
  font-size: 1.1rem;
  cursor: pointer;
  line-height: 1;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.section {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;

  h4 {
    margin: 0;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: $color-text-muted;
  }
}

.explainer {
  margin: 0;
  font-size: 0.74rem;
  color: $color-text-muted;
  line-height: 1.4;
}

.warn-text {
  display: flex;
  align-items: center;
  gap: 4px;
  color: $color-danger;
}

.code-box {
  width: 100%;
  min-height: 72px;
  resize: vertical;
  font: inherit;
  font-family: monospace;
  font-size: 0.7rem;
  padding: $spacing-sm;
  border-radius: $radius-sm;
  border: 1px solid $color-panel-border;
  background: rgba(0, 0, 0, 0.2);
  color: $color-text;
  word-break: break-all;
}

.button-row {
  display: flex;
  gap: $spacing-sm;
  flex-wrap: wrap;

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font: inherit;
    font-size: 0.8rem;
    font-weight: 600;
    padding: $spacing-xs $spacing-sm;
    border-radius: $radius-sm;
    border: 1px solid $color-panel-border;
    background: transparent;
    color: $color-text;
    cursor: pointer;

    &.primary {
      border-color: $color-accent;
      background: rgba(212, 169, 74, 0.2);
      color: $color-accent;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.hidden-input {
  display: none;
}

.feedback {
  margin: 0;
  font-size: 0.78rem;
  color: $color-money;
  min-height: 1em;
  opacity: 0;
  transition: opacity 0.2s ease;

  &.visible {
    opacity: 1;
  }
}

.note.warn {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.78rem;
  color: $color-danger;
}
</style>
