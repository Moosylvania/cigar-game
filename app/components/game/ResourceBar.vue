<script setup>
import { computed } from 'vue'
import { useGameStore } from '~/stores/game.js'
import { formatCompactNumber, formatMultiplier } from '#game/util/format.js'

const store = useGameStore()

const formattedMoney = computed(() => {
  const value = Math.floor(store.money)
  return value >= 1e6
    ? `$${formatCompactNumber(value)}`
    : value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
})

const formattedCigarPrice = computed(() => {
  const value = store.effectiveSalePrice
  return value >= 1e6 ? formatCompactNumber(value) : value.toFixed(2)
})

const readyCount = computed(() => store.readyBuildingIds.length)

const prestigeMultiplierLabel = computed(() => {
  const value = store.totalPrestigeMultiplier
  return value <= 1 ? null : formatMultiplier(value)
})

function collectAll() {
  store.collectAllReady()
}
</script>

<template>
  <div class="resource-bar">
    <div v-if="readyCount > 0" class="ready-banner">
      <span class="dot" />
      {{ readyCount }} building{{ readyCount > 1 ? 's' : '' }} ready to collect
      <button class="collect-all" @click="collectAll"><Icon name="mdi:tray-arrow-down" /> Collect All</button>
    </div>
    <div class="resource money">
      <span class="label"><Icon name="mdi:cash-multiple" /> Money</span>
      <span class="value">{{ formattedMoney }}</span>
    </div>
    <div class="resource">
      <span class="label"><Icon name="mdi:tag-outline" /> Cigar price</span>
      <span class="value">${{ formattedCigarPrice }}</span>
    </div>
    <div class="resource">
      <span class="label"><Icon name="mdi:factory" /> Town Hall</span>
      <span class="value">Lv {{ store.townHall.level }}</span>
    </div>
    <div v-if="prestigeMultiplierLabel" class="resource prestige">
      <span class="label"><Icon name="mdi:crown" /> Prestige</span>
      <span class="value">{{ prestigeMultiplierLabel }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '~/assets/scss/variables' as *;

.resource-bar {
  display: flex;
  gap: $spacing-lg;
  align-items: center;
  padding: $spacing-sm $spacing-md;
  background: $color-panel;
  border-bottom: 1px solid $color-panel-border;
  flex-wrap: wrap;

  @include mobile {
    gap: $spacing-md;
    padding: $spacing-xs $spacing-sm;
    padding-right: $spacing-lg;
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    @include hide-scrollbar;
    @include scroll-fade-right;
  }
}

.resource {
  display: flex;
  flex-direction: column;
  min-width: 90px;

  @include mobile {
    min-width: 68px;
    flex-shrink: 0;
  }

  .label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.7rem;
    color: $color-text-muted;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .value {
    font-size: 1.05rem;
    font-weight: 600;
  }

  &.money .value {
    color: $color-money;
  }

  &.prestige .value {
    color: $color-accent;
  }
}

.ready-banner {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  background: rgba(123, 201, 111, 0.15);
  border: 1px solid rgba(123, 201, 111, 0.4);
  color: $color-money;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: $color-money;
    animation: ready-pulse 1.1s ease-in-out infinite;
    flex-shrink: 0;
  }
}

.collect-all {
  display: flex;
  align-items: center;
  gap: 4px;
  font: inherit;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px $spacing-sm;
  margin-left: $spacing-xs;
  border-radius: $radius-sm;
  border: 1px solid $color-money;
  background: rgba(123, 201, 111, 0.25);
  color: $color-money;
  cursor: pointer;

  &:hover {
    background: rgba(123, 201, 111, 0.4);
  }
}

@keyframes ready-pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(1.4);
  }
}
</style>
