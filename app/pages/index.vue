<script setup>
import { computed, ref } from 'vue'
import ResourceBar from '~/components/game/ResourceBar.vue'
import InventoryBar from '~/components/game/InventoryBar.vue'
import BuildMenu from '~/components/game/BuildMenu.vue'
import GameCanvas from '~/components/game/GameCanvas.vue'
import BuildingUpgradePanel from '~/components/game/BuildingUpgradePanel.vue'
import LabPanel from '~/components/game/LabPanel.vue'
import StorePanel from '~/components/game/StorePanel.vue'
import LandExpansionPanel from '~/components/game/LandExpansionPanel.vue'
import PrestigePanel from '~/components/game/PrestigePanel.vue'
import DecorationPanel from '~/components/game/DecorationPanel.vue'
import TutorialCard from '~/components/game/TutorialCard.vue'
import OfflineEarningsModal from '~/components/game/OfflineEarningsModal.vue'
import { useGameStore } from '~/stores/game.js'
import { getDecorationDefinition } from '#game/config/decorations.config.js'

const store = useGameStore()
const isDev = import.meta.dev

const placingType = ref(null)
const placingDecorationId = ref(null)
const selectedBuildingId = ref(null)
const selectedDecorationInstanceId = ref(null)
const showLab = ref(false)
const showStore = ref(false)
const showLand = ref(false)
const showPrestige = ref(false)
const layoutEditMode = ref(false)
const gameCanvasRef = ref(null)

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

function startRearrange() {
  placingType.value = null
  selectedBuildingId.value = null
  layoutEditMode.value = true
}

function saveLayout() {
  gameCanvasRef.value?.commitLayout()
  layoutEditMode.value = false
}

function cancelRearrange() {
  gameCanvasRef.value?.cancelLayout()
  layoutEditMode.value = false
}
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
      <template v-else-if="!layoutEditMode">
        <button :class="{ 'tutorial-dim': store.isTutorialVisible }" @click="showLand = true"><Icon name="mdi:map-plus" /> Expand Territory</button>
        <button :class="{ 'tutorial-dim': store.isTutorialVisible }" @click="showLab = true"><Icon name="mdi:flask-outline" /> Research Lab</button>
        <button class="store-btn" :class="{ 'tutorial-glow': storeButtonHighlighted, 'tutorial-dim': store.isTutorialVisible && !storeButtonHighlighted }" @click="showStore = true">
          <Icon name="mdi:storefront-outline" /> Store
        </button>
        <button :class="{ 'tutorial-dim': store.isTutorialVisible }" @click="showPrestige = true"><Icon name="mdi:crown" /> Prestige</button>
        <button :class="{ 'tutorial-dim': store.isTutorialVisible }" @click="startRearrange"><Icon name="mdi:cursor-move" /> Rearrange Buildings</button>
        <button v-if="isDev" class="dev" :class="{ 'tutorial-dim': store.isTutorialVisible }" @click="store.skipAllTimers()"><Icon name="mdi:fast-forward" /> Skip Timers (dev)</button>
        <button class="help" title="Replay tutorial" @click="store.reopenTutorial()"><Icon name="mdi:help-circle-outline" /></button>
      </template>
      <template v-else>
        <span class="rearrange-hint">Drag buildings to move them</span>
        <button class="confirm" @click="saveLayout"><Icon name="mdi:check" /> Save Layout</button>
        <button class="cancel" @click="cancelRearrange"><Icon name="mdi:close" /> Cancel</button>
      </template>
    </div>

    <div class="main-area">
      <BuildMenu
        :active-type="placingType"
        :class="{ disabled: layoutEditMode || placingDecorationId, 'tutorial-dim': store.isTutorialVisible }"
        @select="(type) => (placingType = type)"
      />
      <GameCanvas
        ref="gameCanvasRef"
        :placing-type="placingType"
        :placing-decoration-id="placingDecorationId"
        :edit-mode="layoutEditMode"
        :tutorial-highlight-type="tutorialHighlightBuildingType"
        :tutorial-dim="store.isTutorialVisible"
        @building-selected="onBuildingSelected"
        @decoration-selected="onDecorationSelected"
        @placed="onPlaced"
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
    <LandExpansionPanel v-if="showLand" @close="showLand = false" />
    <PrestigePanel v-if="showPrestige" @close="showPrestige = false" />
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
    background: rgba(212, 169, 74, 0.12);
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
  width: 220px;
  flex-shrink: 0;

  &.disabled {
    opacity: 0.4;
    pointer-events: none;
  }

  @include mobile {
    width: 100%;
    height: 92px;
  }
}
</style>
