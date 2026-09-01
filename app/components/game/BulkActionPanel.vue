<script setup>
import { computed, ref } from 'vue'
import { useGameStore } from '~/stores/game.js'
import { formatCompactNumber } from '#game/util/format.js'

const props = defineProps({
  buildingIds: { type: Array, required: true }
})
const emit = defineEmits(['clear'])

const store = useGameStore()
const lastResult = ref(null)

const buildings = computed(() => props.buildingIds.map((id) => store.findBuilding(id)).filter(Boolean))

const idleCount = computed(() => buildings.value.filter((b) => b.slot?.status === 'idle').length)
const readyCount = computed(() => buildings.value.filter((b) => b.slot?.status === 'ready').length)

// Read-only preview of what "Upgrade All" would actually do - see
// upgradeEngine.js planSelectionUpgrade. Recomputes reactively off the
// selection and store.money, so the button label always matches what a
// click would spend right now.
const upgradePreview = computed(() => store.previewSelectionUpgrade(props.buildingIds))

function doUpgradeAll() {
  const result = store.upgradeSelection(props.buildingIds)
  lastResult.value = result.count > 0 ? `Upgraded ${result.count} building${result.count === 1 ? '' : 's'} for $${formatCompactNumber(result.cost)}` : null
}

function doStartAll() {
  const result = store.startBatchForSelection(props.buildingIds)
  lastResult.value = result.count > 0 ? `Started ${result.count} batch${result.count === 1 ? '' : 'es'}` : null
}

function doCollectAll() {
  const result = store.collectReadyForSelection(props.buildingIds)
  lastResult.value = result.count > 0 ? `Collected ${result.count} building${result.count === 1 ? '' : 's'}` : null
}
</script>

<template>
  <div class="bulk-panel">
    <div class="bulk-header">
      <span class="header-icon-spacer"><Icon name="mdi:selection-drag" /></span>
      <span class="title">{{ buildingIds.length }} building{{ buildingIds.length === 1 ? '' : 's' }} selected</span>
      <button class="close" title="Clear selection" @click="emit('clear')"><Icon name="mdi:close" /></button>
    </div>

    <p v-if="lastResult" class="feedback">{{ lastResult }}</p>

    <div class="bulk-actions">
      <button :disabled="upgradePreview.count === 0" @click="doUpgradeAll">
        <span class="btn-main"><Icon name="mdi:arrow-up-bold-circle-outline" /> Upgrade All</span>
        <span class="detail">{{ upgradePreview.count ? `${upgradePreview.count} · $${formatCompactNumber(upgradePreview.cost)}` : '—' }}</span>
      </button>
      <button :disabled="idleCount === 0" @click="doStartAll">
        <span class="btn-main"><Icon name="mdi:play-circle-outline" /> Start Batches</span>
        <span class="detail">{{ idleCount || '—' }}</span>
      </button>
      <button :disabled="readyCount === 0" @click="doCollectAll">
        <span class="btn-main"><Icon name="mdi:tray-full" /> Collect Ready</span>
        <span class="detail">{{ readyCount || '—' }}</span>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '~/assets/scss/variables' as *;

.bulk-panel {
  position: absolute;
  left: 50%;
  bottom: $spacing-md;
  transform: translateX(-50%);
  z-index: 15;
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  width: 360px;
  max-width: calc(100vw - #{$spacing-md * 2});
  background: $color-panel;
  border: 1px solid $color-panel-border;
  border-radius: $radius-md;
  padding: $spacing-sm $spacing-md;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);

  @include mobile {
    width: calc(100vw - #{$spacing-md * 2});
  }
}

.bulk-header {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  font-size: 0.82rem;
  font-weight: 600;

  .title {
    flex: 1;
    text-align: center;
  }

  // Matches the close button's width so the title's flex:1 centering
  // balances against two equal-width ends, instead of centering in
  // whatever space happens to be left next to the icon's natural size.
  .header-icon-spacer {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    flex-shrink: 0;
  }
}

.close {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: $color-text-muted;
  font-size: 1rem;
  cursor: pointer;
  line-height: 1;
  width: 26px;
  height: 26px;
  flex-shrink: 0;
}

.feedback {
  margin: 0;
  font-size: 0.76rem;
  color: $color-money;
}

.bulk-actions {
  display: flex;
  gap: $spacing-xs;

  @include mobile {
    flex-direction: column;
  }

  button {
    flex: 1;
    // Without this, a flex child's default min-width:auto keeps it at its
    // full content width (nowrap text included) even when that's wider
    // than the fixed-width panel has room for, pushing it past the
    // rounded border instead of shrinking to fit.
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1px;
    font: inherit;
    font-size: 0.76rem;
    padding: $spacing-xs $spacing-sm;
    border-radius: $radius-sm;
    border: 1px solid $color-panel-border;
    background: rgba(212, 169, 74, 0.12);
    color: $color-text;
    cursor: pointer;
    min-height: 36px;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: transparent;
    }

    .btn-main {
      display: flex;
      align-items: center;
      gap: 4px;
      max-width: 100%;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .detail {
      color: $color-text-muted;
      font-size: 0.68rem;
    }
  }
}
</style>
