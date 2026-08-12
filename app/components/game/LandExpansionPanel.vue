<script setup>
import { computed } from 'vue'
import { useGameStore } from '~/stores/game.js'
import { formatCompactNumber } from '#game/util/format.js'

const emit = defineEmits(['close'])
const store = useGameStore()

const next = computed(() => store.nextLandTier)
const result = computed(() => store.canExpandLand())

const reasonText = {
  max_tier: 'Territory fully expanded',
  town_hall_gate: 'Requires a higher Town Hall level',
  insufficient_funds: 'Not enough money'
}

function doExpand() {
  store.expandLand()
}
</script>

<template>
  <div class="panel-backdrop" @click.self="emit('close')">
    <div class="panel">
      <div class="panel-header">
        <span class="header-icon"><Icon name="mdi:map-plus" /></span>
        <h3>Expand Territory</h3>
        <button class="close" @click="emit('close')"><Icon name="mdi:close" /></button>
      </div>

      <template v-if="next">
        <p class="note">
          Next tier requires Town Hall level {{ next.requiredTownHallLevel }} and costs
          ${{ formatCompactNumber(next.cost) }}.
        </p>
        <button :disabled="!result.ok" @click="doExpand">
          <template v-if="result.ok"><Icon name="mdi:map-plus" /> Expand for ${{ formatCompactNumber(next.cost) }}</template>
          <template v-else>{{ reasonText[result.reason] ?? 'Unavailable' }}</template>
        </button>
      </template>
      <p v-else class="note">Territory is fully expanded.</p>
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
  width: 320px;
  max-width: 90vw;
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
    border-radius: $radius-md $radius-md 0 0;
    padding: $spacing-sm;
    padding-bottom: $spacing-lg;
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

.note {
  margin: 0;
  font-size: 0.85rem;
  color: $color-text-muted;
}

button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-xs;
  font: inherit;
  font-size: 0.85rem;
  padding: $spacing-sm;
  border-radius: $radius-sm;
  border: 1px solid $color-panel-border;
  background: rgba(212, 169, 74, 0.12);
  color: $color-text;
  cursor: pointer;
  min-height: 44px;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: transparent;
  }
}
</style>
