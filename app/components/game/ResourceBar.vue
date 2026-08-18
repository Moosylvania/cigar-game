<script setup>
import { computed } from 'vue'
import { useGameStore } from '~/stores/game.js'
import { useTweenedNumber } from '~/composables/useTweenedNumber.js'
import { useClock } from '~/composables/useClock.js'
import { getActiveBoosts, getBoostMultipliers } from '#game/engine/boostEngine.js'
import { formatCompactNumber, formatMultiplier } from '#game/util/format.js'
import { formatDuration } from '#game/util/time.js'

const store = useGameStore()
const { nowMs } = useClock()

const tweenedMoney = useTweenedNumber(() => store.money)
const tweenedCoins = useTweenedNumber(() => store.coins)

const formattedMoney = computed(() => {
  const value = Math.floor(tweenedMoney.value)
  return value >= 1e6
    ? `$${formatCompactNumber(value)}`
    : value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
})

const formattedCoins = computed(() => formatCompactNumber(Math.floor(tweenedCoins.value)))

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

// A cigar-themed pill per kind of active timed buff (see boostEngine.js) -
// the icon is a lit cigar regardless of which item is active, distinct
// from each Store item's own icon, so "a boost is running" reads at a
// glance without needing to name the specific item. Several of the same
// (or, for money, different-tier) boosts can stack concurrently now, so
// each pill shows the combined effect and a ×N count, counting down to
// whichever one expires soonest - once it drops off, the combined effect
// shown here drops too, even though others may still be running.
const BOOST_LABELS = { processing: 'Fertilizer', upgrade: 'Rush Delivery', money: 'Money Rush' }

const activeBoosts = computed(() => {
  const boosts = []
  const multipliers = getBoostMultipliers(store.boosts, nowMs.value)
  for (const key of ['processing', 'upgrade', 'money']) {
    const active = getActiveBoosts(store.boosts, key, nowMs.value)
    if (active.length === 0) continue
    const soonestExpiresAt = Math.min(...active.map((boost) => boost.expiresAt))
    const effectText =
      key === 'money'
        ? formatMultiplier(multipliers.salePriceMultiplier) + ' money'
        : Math.round((1 - multipliers[`${key}SpeedMultiplier`]) * 100) + '% faster'
    boosts.push({
      key,
      name: BOOST_LABELS[key],
      count: active.length,
      effectText,
      remaining: formatDuration((soonestExpiresAt - nowMs.value) / 1000)
    })
  }
  return boosts
})
</script>

<template>
  <div class="resource-bar">
    <div v-for="boost in activeBoosts" :key="boost.key" class="boost-badge">
      <Icon name="mdi:cigar" class="ember" />
      {{ boost.name }}{{ boost.count > 1 ? ` ×${boost.count}` : '' }} ({{ boost.effectText }}) — {{ boost.remaining }}
    </div>
    <div v-if="readyCount > 0" class="ready-banner">
      <span class="dot" />
      {{ readyCount }} building{{ readyCount > 1 ? 's' : '' }} ready to collect
      <button class="collect-all" @click="collectAll"><Icon name="mdi:tray-arrow-down" /> Collect All</button>
    </div>
    <div class="resource money">
      <span class="label"><Icon name="mdi:cash-multiple" /> Money</span>
      <span class="value">{{ formattedMoney }}</span>
    </div>
    <div class="resource coins">
      <span class="label"><Icon name="mdi:hand-coin-outline" /> Coins</span>
      <span class="value">{{ formattedCoins }}</span>
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

  &.coins .value {
    color: #e0b23d;
  }

  &.prestige .value {
    color: $color-accent;
  }
}

.boost-badge {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  background: rgba(224, 134, 47, 0.15);
  border: 1px solid rgba(224, 134, 47, 0.5);
  color: #e0862f;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;

  .ember {
    animation: ember-glow 1.4s ease-in-out infinite;
    flex-shrink: 0;
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

@keyframes ember-glow {
  0%,
  100% {
    opacity: 1;
    filter: drop-shadow(0 0 2px rgba(224, 134, 47, 0.8));
  }
  50% {
    opacity: 0.7;
    filter: drop-shadow(0 0 6px rgba(224, 134, 47, 0.9));
  }
}
</style>
