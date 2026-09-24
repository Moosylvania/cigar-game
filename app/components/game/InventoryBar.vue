<script setup>
import { computed, ref } from 'vue'
import { useGameStore } from '~/stores/game.js'
import { useTweenedNumber } from '~/composables/useTweenedNumber.js'
import { BUILDING_CONFIGS } from '#game/config/buildings/index.js'
import { formatCompactNumber } from '#game/util/format.js'

import { TOBACCO_VARIETIES } from '#game/config/tobacco.config.js'
import { getResourceLots } from '#game/engine/tobaccoEngine.js'

const store = useGameStore()
const selectedKey = ref(null)
const selectedItem = computed(() => ITEMS.find(item => item.key === selectedKey.value))
const rows = computed(() => {
  if (!selectedKey.value) return []
  const lots = getResourceLots(store.game, selectedKey.value)
  return TOBACCO_VARIETIES.map(v => ({ ...v, quantity: lots[v.id] ?? 0 }))
})
const quantity = n => n.toLocaleString(undefined, { maximumFractionDigits: 2 })
function closeBreakdown() {
  const key = selectedKey.value
  selectedKey.value = null
  document.getElementById(`inventory-${key}`)?.focus()
}

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
  <div class="inventory-shell">
  <div class="inventory-bar">
    <button v-for="item in items" :id="`inventory-${item.key}`" :key="item.key" type="button" class="inventory-item" :class="{ warn: item.isNearFull }"
      :aria-expanded="selectedKey === item.key" aria-controls="inventory-breakdown"
      :title="`View ${item.label.toLowerCase()} by tobacco variety`"
      @click="selectedKey = selectedKey === item.key ? null : item.key">
      <span class="swatch" :style="{ '--swatch': item.color }"><Icon :name="item.icon" /></span>
      <span class="label">{{ item.label }}</span>
      <span class="amount">
        {{ formatCompactNumber(item.amount) }}<template v-if="item.capacity != null"> / {{ formatCompactNumber(item.capacity) }}</template>
      </span>
      <Icon v-if="item.isNearFull" name="mdi:alert-outline" class="warn-icon" />
    </button>
  </div>
  <section v-if="selectedItem" id="inventory-breakdown" class="inventory-breakdown" aria-labelledby="inventory-title" @keydown.esc.stop="closeBreakdown">
    <header><h3 id="inventory-title">{{ selectedItem.label }}</h3><button type="button" aria-label="Close inventory breakdown" @click="closeBreakdown"><Icon name="mdi:close" /></button></header>
    <p>In storage · {{ quantity(store.storage[selectedKey]) }} total</p>
    <div class="inventory-varieties">
      <div v-for="row in rows" :key="row.id" class="variety-row">
        <span class="crop-color" :style="{ background: row.color }" aria-hidden="true"></span>
        <span>{{ selectedKey === 'cigars' ? row.cigarName : row.name }}<small v-if="selectedKey === 'cigars'">{{ row.name }} tobacco</small></span>
        <strong>{{ quantity(row.quantity) }}</strong>
      </div>
    </div>
    <p v-if="!rows.some(row => row.quantity > 0)">No {{ selectedItem.label.toLowerCase() }} in storage yet.</p>
  </section>
  </div>
</template>

<style lang="scss" scoped>
@use '~/assets/scss/variables' as *;

.inventory-shell { flex-shrink: 0; }
.inventory-breakdown {
  background: $color-panel; color: $color-text; padding: $spacing-md; border-bottom: 1px solid $color-panel-border;
  max-height: 40vh; overflow-y: auto;
  header { display: flex; align-items: center; justify-content: space-between; }
  h3, p { margin: 0 0 $spacing-sm; }
  p, small { color: $color-text-muted; font-size: 0.8rem; }
  header button { background: transparent; color: $color-text; border: 0; min-width: 44px; min-height: 44px; cursor: pointer; }
  button:focus-visible { outline: 2px solid $color-accent; }
}
.inventory-varieties { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(260px, 100%), 1fr)); gap: $spacing-sm $spacing-lg; }
.variety-row { display: flex; align-items: center; gap: $spacing-sm; padding: $spacing-xs 0; small { display: block; } strong { margin-left: auto; font-variant-numeric: tabular-nums; } }
.crop-color { width: 14px; height: 14px; flex-shrink: 0; border-radius: 3px; }
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

button.inventory-item {
  font: inherit; background: transparent; border: 0; padding: 6px 0; cursor: pointer;
  .label { text-decoration: underline dotted; text-underline-offset: 3px; }
  &:hover { color: $color-text; }
  &:focus-visible { outline: 2px solid $color-accent; outline-offset: 2px; }
  &:disabled { opacity: 0.5; cursor: default; }
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
