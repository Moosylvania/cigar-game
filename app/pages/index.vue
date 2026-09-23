<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import ResourceBar from '~/components/game/ResourceBar.vue'
import InventoryBar from '~/components/game/InventoryBar.vue'
import BuildMenu from '~/components/game/BuildMenu.vue'
import GameCanvas from '~/components/game/GameCanvas.vue'
import BuildingUpgradePanel from '~/components/game/BuildingUpgradePanel.vue'
import BulkActionPanel from '~/components/game/BulkActionPanel.vue'
import LabPanel from '~/components/game/LabPanel.vue'
import StorePanel from '~/components/game/StorePanel.vue'
import PrestigePanel from '~/components/game/PrestigePanel.vue'
import SaveTransferPanel from '~/components/game/SaveTransferPanel.vue'
import DecorationPanel from '~/components/game/DecorationPanel.vue'
import TutorialCard from '~/components/game/TutorialCard.vue'
import OfflineEarningsModal from '~/components/game/OfflineEarningsModal.vue'
import { useGameStore } from '~/stores/game.js'
import { getDecorationDefinition } from '#game/config/decorations.config.js'
import { formatCompactNumber } from '#game/util/format.js'

const store = useGameStore()
const isDev = import.meta.dev

const placingType = ref(null)
const placingDecorationId = ref(null)
const selectedBuildingId = ref(null)
const selectedDecorationInstanceId = ref(null)
const showLab = ref(false)
const showStore = ref(false)
const showPrestige = ref(false)
const showSaveTransfer = ref(false)
const expandMode = ref(false)
const expandFeedback = ref(null)
const selectMode = ref(false)
const selectedBuildingIds = ref([])
let expandFeedbackTimer = null

const placingDecorationName = computed(() => {
  if (!placingDecorationId.value) return null
  return getDecorationDefinition(placingDecorationId.value)?.name ?? null
})

const tutorialHighlightBuildingType = computed(() => {
  if (!store.isTutorialVisible) return null
  const highlight = store.currentTutorialStep?.highlight
  return highlight?.kind === 'building' ? highlight.type : null
})

const storeButtonHighlighted = computed(() => {
  if (!store.isTutorialVisible) return false
  const highlight = store.currentTutorialStep?.highlight
  return highlight?.kind === 'toolbar' && highlight.label === 'Store'
})

function onBuildingSelected(building) {
  selectedBuildingId.value = building.id
}

function onDecorationSelected(decoration) {
  selectedDecorationInstanceId.value = decoration.id
}

function startPlacingDecoration(decorationId) {
  showStore.value = false
  placingType.value = null
  placingDecorationId.value = decorationId
}

function cancelPlacingDecoration() {
  placingDecorationId.value = null
}

function onPlaced() {
  placingType.value = null
  placingDecorationId.value = null
}

function startExpand() {
  placingType.value = null
  selectedBuildingId.value = null
  selectMode.value = false
  selectedBuildingIds.value = []
  expandFeedback.value = null
  expandMode.value = true
}

function stopExpand() {
  expandMode.value = false
  expandFeedback.value = null
  if (expandFeedbackTimer) clearTimeout(expandFeedbackTimer)
}

function onExpandResult(result) {
  if (expandFeedbackTimer) clearTimeout(expandFeedbackTimer)
  expandFeedback.value = result.count > 0
    ? `Bought ${result.count} tile${result.count === 1 ? '' : 's'} for $${formatCompactNumber(result.spent)}`
    : 'No purchasable tiles there'
  expandFeedbackTimer = setTimeout(() => {
    expandFeedback.value = null
  }, 2500)
}

function startSelect() {
  placingType.value = null
  selectedBuildingId.value = null
  expandMode.value = false
  selectedBuildingIds.value = []
  selectMode.value = true
}

function stopSelect() {
  selectMode.value = false
  selectedBuildingIds.value = []
}

function onSelectionChanged(ids) {
  selectedBuildingIds.value = ids
}

// Keyboard shortcuts: 1-6 start a batch on every idle building of one
// pipeline type you already own (same per-building action as clicking
// "Start batch" on each, just all at once - see store.startAllIdleOfType),
// C collects every ready building at once (same as the ResourceBar
// "Collect All" button). Both are suppressed behind an open modal so a
// shortcut can never silently act on buildings the player can't see.
const NUMBER_KEY_BUILDING_TYPES = {
  1: 'nursery',
  2: 'field',
  3: 'curing',
  4: 'steam',
  5: 'fermentation',
  6: 'rolling'
}

const isModalOpen = computed(() =>
  showLab.value ||
  showStore.value ||
  showPrestige.value ||
  !!selectedBuildingId.value ||
  !!selectedDecorationInstanceId.value ||
  !!store.offlineEarnings
)

function closeAnyOpenModal() {
  selectedDecorationInstanceId.value = null
  selectedBuildingId.value = null
  showLab.value = false
  showStore.value = false
  showPrestige.value = false
  store.offlineEarnings = null
}

function handleKeydown(event) {
  if (event.metaKey || event.ctrlKey || event.altKey) return
  const target = event.target
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return

  if (event.key === 'Escape') {
    if (isModalOpen.value) closeAnyOpenModal()
    else if (expandMode.value) stopExpand()
    else if (selectMode.value) stopSelect()
    return
  }
  if (isModalOpen.value) return

  if (event.key === 'c' || event.key === 'C') {
    store.collectAllReady()
    return
  }

  const buildingType = NUMBER_KEY_BUILDING_TYPES[event.key]
  if (buildingType) store.startAllIdleOfType(buildingType)
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  if (expandFeedbackTimer) clearTimeout(expandFeedbackTimer)
})
</script>

<template>
  <div class="game-layout">
    <ResourceBar :class="{ 'tutorial-dim': store.isTutorialVisible }" />
    <InventoryBar :class="{ 'tutorial-dim': store.isTutorialVisible }" />

    <div class="toolbar">
      <template v-if="placingDecorationId">
        <span class="rearrange-hint">Placing {{ placingDecorationName }} - tap an empty tile</span>
        <button class="cancel" @click="cancelPlacingDecoration"><Icon name="mdi:close" /> Cancel</button>
      </template>
      <template v-else-if="expandMode">
        <span class="rearrange-hint">{{ expandFeedback || 'Tap a tile to buy it, or drag to buy many at once' }}</span>
        <button class="confirm" @click="stopExpand"><Icon name="mdi:check" /> Done</button>
      </template>
      <template v-else-if="selectMode">
        <span class="rearrange-hint">Drag over buildings to select them. With 2+ selected, drag one to move the group</span>
        <button class="confirm" @click="stopSelect"><Icon name="mdi:check" /> Done</button>
      </template>
      <template v-else>
        <button :class="{ 'tutorial-dim': store.isTutorialVisible }" title="Expand territory" @click="startExpand"><Icon name="mdi:map-plus" /> Expand</button>
        <button :class="{ 'tutorial-dim': store.isTutorialVisible }" title="Select buildings" @click="startSelect"><Icon name="mdi:selection-drag" /> Select</button>
        <button :class="{ 'tutorial-dim': store.isTutorialVisible }" @click="showLab = true"><Icon name="mdi:flask-outline" /> Research</button>
        <button class="store-btn" :class="{ 'tutorial-glow': storeButtonHighlighted, 'tutorial-dim': store.isTutorialVisible && !storeButtonHighlighted }" @click="showStore = true">
          <Icon name="mdi:storefront-outline" /> Store
        </button>
        <button :class="{ 'tutorial-dim': store.isTutorialVisible }" @click="showPrestige = true"><Icon name="mdi:crown" /> Prestige</button>
        <button :class="{ 'tutorial-dim': store.isTutorialVisible }" @click="showSaveTransfer = true"><Icon name="mdi:tray-arrow-down" /> Export/Import</button>
        <button v-if="isDev" class="dev" :class="{ 'tutorial-dim': store.isTutorialVisible }" @click="store.skipAllTimers()"><Icon name="mdi:fast-forward" /> Skip Timers (dev)</button>
        <button class="help" title="Replay tutorial" @click="store.reopenTutorial()"><Icon name="mdi:help-circle-outline" /></button>
      </template>
    </div>

    <div class="main-area">
      <BuildMenu
        :active-type="placingType"
        :class="{ disabled: placingDecorationId || expandMode || selectMode, 'tutorial-dim': store.isTutorialVisible }"
        @select="(type) => (placingType = type)"
      />
      <GameCanvas
        :placing-type="placingType"
        :placing-decoration-id="placingDecorationId"
        :expand-mode="expandMode"
        :select-mode="selectMode"
        :selected-building-ids="selectedBuildingIds"
        :tutorial-highlight-type="tutorialHighlightBuildingType"
        :tutorial-dim="store.isTutorialVisible"
        @building-selected="onBuildingSelected"
        @decoration-selected="onDecorationSelected"
        @placed="onPlaced"
        @expand-result="onExpandResult"
        @selection-changed="onSelectionChanged"
      />
      <BulkActionPanel
        v-if="selectedBuildingIds.length"
        :building-ids="selectedBuildingIds"
        @clear="selectedBuildingIds = []"
      />
      <TutorialCard />
    </div>

    <BuildingUpgradePanel
      v-if="selectedBuildingId"
      :building-id="selectedBuildingId"
      @close="selectedBuildingId = null"
    />
    <LabPanel v-if="showLab" @close="showLab = false" />
    <StorePanel v-if="showStore" @close="showStore = false" @place-decoration="startPlacingDecoration" />
    <PrestigePanel v-if="showPrestige" @close="showPrestige = false" />
    <SaveTransferPanel v-if="showSaveTransfer" @close="showSaveTransfer = false" />
    <DecorationPanel
      v-if="selectedDecorationInstanceId"
      :instance-id="selectedDecorationInstanceId"
      @close="selectedDecorationInstanceId = null"
    />
    <OfflineEarningsModal />
  </div>
</template>

<style lang="scss" scoped>
@use '~/assets/scss/variables' as *;

.game-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
}

.toolbar {
  display: flex;
  gap: $spacing-sm;
  align-items: center;
  padding: $spacing-sm $spacing-md;
  background: $color-panel;
  border-bottom: 1px solid $color-panel-border;
  flex-wrap: wrap;

  // Only a handful of buttons live here - wrapping to a second row reads
  // better on narrow screens than a scroll strip that cuts a button off
  // mid-word with no visual hint that more is off-screen.
  @include mobile {
    flex-wrap: wrap;
    padding: $spacing-xs $spacing-sm;
    gap: $spacing-xs;
  }

  button {
    display: flex;
    align-items: center;
    gap: 4px;
    font: inherit;
    font-size: 0.82rem;
    padding: $spacing-xs $spacing-md;
    border-radius: $radius-sm;
    border: 1px solid $color-panel-border;
    background: $color-panel;
    color: $color-text;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    min-height: 36px;

    &.confirm {
      border-color: $color-money;
      background: rgba(123, 201, 111, 0.15);
    }

    &.cancel {
      border-color: $color-danger;
      background: rgba(209, 106, 90, 0.15);
    }

    &.dev {
      margin-left: auto;
      border-style: dashed;
      border-color: $color-text-muted;
      background: transparent;
      color: $color-text-muted;
    }

    &.help {
      padding: $spacing-xs;
      min-width: 36px;
      justify-content: center;
    }

    &.tutorial-glow {
      border-color: $color-accent;
      animation: tutorial-pulse 1.4s ease-in-out infinite;
    }

    @include mobile {
      font-size: 0.72rem;
      padding: $spacing-xs $spacing-sm;

      &.dev {
        margin-left: 0;
      }
    }
  }
}

.rearrange-hint {
  font-size: 0.82rem;
  color: $color-text-muted;
  margin-right: auto;

  @include mobile {
    font-size: 0.72rem;
    white-space: nowrap;
  }
}

.main-area {
  flex: 1;
  display: flex;
  min-height: 0;
  position: relative;

  @include mobile {
    flex-direction: column-reverse;
  }
}

@keyframes tutorial-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(212, 169, 74, 0.5);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(212, 169, 74, 0);
  }
}

.build-menu {
  width: 230px;
  flex-shrink: 0;

  &.disabled {
    opacity: 0.4;
    pointer-events: none;
  }

  @include mobile {
    width: 100%;
    height: 104px;
  }
}
</style>
