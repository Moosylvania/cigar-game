<script setup>
import { computed } from 'vue'
import { useGameStore } from '~/stores/game.js'
import { useTweenedNumber } from '~/composables/useTweenedNumber.js'
import { BUILDING_CONFIGS } from '#game/config/buildings/index.js'
import { formatCompactNumber } from '#game/util/format.js'

const store = useGameStore()

// storage key -> the building type whose output fills it, for a matching
// color swatch, plus a friendly label. Order mirrors the pipeline. Seeds
// are bought from the Store rather than produced by a building, so they
// carry their own fixed color/icon instead of a producedBy lookup.
const ITEMS = [
  { key: 'seeds', label: 'Seeds', color: '#8a6d3a', icon: 'mdi:seed-outline' },
  { key: 'nurserySeedlings', label: 'Seedlings', producedBy: 'nursery' },
  { key: 'fieldTobacco', label: 'Harvested Tobacco', producedBy: 'field' },
  { key: 'curedTobacco', label: 'Cured Tobacco', producedBy: 'curing' },
  { key: 'steamedTobacco', label: 'Steamed Tobacco', producedBy: 'steam' },
  { key: 'fermentedTobacco', label: 'Fermented Tobacco', producedBy: 'fermentation' },
  // Cigars are capped by the Depot's storage capacity, unlike every other
  // item here - shown as a fraction so it's obvious when it's at risk of
  // overflowing (see engine/batchEngine.js collectBatch).
  { key: 'cigars', label: 'Cigars', producedBy: 'rolling', capped: true }
]

// One tween per resource, called a fixed number of times at setup (not in
// a loop/computed) since ITEMS is a static list - keeps composable call
// order stable across renders.
const tweenedAmounts = Object.fromEntries(
  ITEMS.map((item) => [item.key, useTweenedNumber(() => store.storage[item.key])])
)

const items = computed(() =>
  ITEMS.map((item) => {
    const amount = Math.floor(tweenedAmounts[item.key].value)
    const capacity = item.capped ? Math.floor(store.cigarStorageCapacity) : null
    return {
      ...item,
      color: item.color ?? BUILDING_CONFIGS[item.producedBy].color,
      icon: item.icon ?? BUILDING_CONFIGS[item.producedBy].icon,
      amount,
      capacity,
      isNearFull: capacity != null && capacity > 0 && amount / capacity >= 0.85
    }
  })
)
</script>

<template>
  <div class="inventory-bar">
    <div v-for="item in items" :key="item.key" class="inventory-item" :class="{ warn: item.isNearFull }">
      <span class="swatch" :style="{ '--swatch': item.color }"><Icon :name="item.icon" /></span>
      <span class="label">{{ item.label }}</span>
      <span class="amount">
        {{ formatCompactNumber(item.amount) }}<template v-if="item.capacity != null"> / {{ formatCompactNumber(item.capacity) }}</template>
      </span>
      <Icon v-if="item.isNearFull" name="mdi:alert-outline" class="warn-icon" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '~/assets/scss/variables' as *;

.inventory-bar {
  display: flex;
  gap: $spacing-md;
  align-items: center;
  padding: $spacing-xs $spacing-md;
  background: rgba(0, 0, 0, 0.15);
  border-bottom: 1px solid $color-panel-border;
  flex-wrap: wrap;
  font-size: 0.75rem;

  @include mobile {
    gap: $spacing-sm;
    padding: $spacing-xs $spacing-sm;
    padding-right: $spacing-lg;
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    @include hide-scrollbar;
    @include scroll-fade-right;
  }
}

.inventory-item {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  color: $color-text-muted;
  white-space: nowrap;
  flex-shrink: 0;

  &.warn {
    color: $color-danger;

    .amount {
      color: $color-danger;
    }
  }
}

.warn-icon {
  color: $color-danger;
  font-size: 0.85rem;
}

.swatch {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 3px;
  background: var(--swatch);
  color: rgba(255, 255, 255, 0.95);
  flex-shrink: 0;
  font-size: 0.7rem;
}

.amount {
  color: $color-text;
  font-weight: 600;
}
</style>
