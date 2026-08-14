<script setup>
import { computed, ref } from 'vue'
import { useGameStore } from '~/stores/game.js'
import { useClock } from '~/composables/useClock.js'
import { STORE_ITEMS } from '#game/config/store.config.js'
import { DECORATIONS } from '#game/config/decorations.config.js'
import { formatCompactNumber } from '#game/util/format.js'
import { formatDuration } from '#game/util/time.js'

const emit = defineEmits(['close', 'place-decoration'])
const store = useGameStore()
const { nowMs } = useClock()

const feedback = ref(null)
const activeTab = ref('items')

// speed_boost_* items activate a timed buff rather than an instant effect
// (see boostEngine.js) - this maps an item's type to the boosts state key
// its active/remaining-time display should read from.
const BOOST_KEY_BY_ITEM_TYPE = {
  speed_boost_processing: 'processing',
  speed_boost_upgrade: 'upgrade',
  money_boost: 'money'
}

function activeBoostFor(item) {
  const key = BOOST_KEY_BY_ITEM_TYPE[item.type]
  if (!key) return null
  const boost = store.boosts[key]
  if (!boost || boost.itemId !== item.id || boost.expiresAt <= nowMs.value) return null
  return boost
}

const rows = computed(() =>
  STORE_ITEMS.map((item) => {
    const result = store.canBuyStoreItem(item.id)
    const activeBoost = activeBoostFor(item)
    return {
      item,
      canBuy: result.ok,
      reason: result.reason,
      seedsGranted: item.type === 'seeds' ? item.batches * store.seedsPerBatch : null,
      activeRemaining: activeBoost ? formatDuration((activeBoost.expiresAt - nowMs.value) / 1000) : null
    }
  })
)

const decorationRows = computed(() =>
  DECORATIONS.map((decoration) => ({
    decoration,
    canAfford: store.money >= decoration.cost
  }))
)

function reasonLabel(reason, item) {
  if (reason === 'insufficient_funds') return item?.currency === 'coins' ? 'Not enough coins' : 'Not enough money'
  return null
}

function buy(row) {
  const result = store.buyStoreItem(row.item.id)
  const message = result.ok ? `Bought ${row.item.name}` : reasonLabel(result.reason, row.item)
  feedback.value = message
  setTimeout(() => {
    if (feedback.value === message) feedback.value = null
  }, 1800)
}

function placeDecoration(decoration) {
  emit('place-decoration', decoration.id)
  emit('close')
}
</script>

<template>
  <div class="panel-backdrop" @click.self="emit('close')">
    <div class="panel">
      <div class="panel-header">
        <span class="header-icon"><Icon name="mdi:storefront-outline" /></span>
        <h3>Store</h3>
        <button class="close" @click="emit('close')"><Icon name="mdi:close" /></button>
      </div>

      <p class="feedback" :class="{ visible: feedback }">{{ feedback || '&nbsp;' }}</p>

      <div class="tabs">
        <button class="tab" :class="{ active: activeTab === 'items' }" @click="activeTab = 'items'">Items</button>
        <button class="tab" :class="{ active: activeTab === 'decorations' }" @click="activeTab = 'decorations'">Decorations</button>
      </div>

      <div v-if="activeTab === 'items'" class="item-list">
        <div v-for="row in rows" :key="row.item.id" class="item-row" :class="{ active: row.activeRemaining }">
          <span class="item-icon"><Icon :name="row.item.icon" /></span>
          <div class="info">
            <span class="name">{{ row.item.name }}</span>
            <span class="detail">{{ row.item.description }}</span>
            <span v-if="row.seedsGranted !== null" class="current-effect">+{{ row.seedsGranted.toLocaleString() }} seeds</span>
            <span v-if="row.activeRemaining" class="current-effect active-boost">
              <Icon name="mdi:cigar" /> Active — {{ row.activeRemaining }} left
            </span>
            <span v-if="!row.canBuy && row.reason" class="warn">{{ reasonLabel(row.reason, row.item) }}</span>
          </div>
          <button :disabled="!row.canBuy" @click="buy(row)" class="buy-btn" :class="{ coins: row.item.currency === 'coins' }">
            <Icon v-if="row.item.currency === 'coins'" name="mdi:hand-coin-outline" />
            <template v-else>$</template>{{ formatCompactNumber(row.item.cost) }}
          </button>
        </div>
      </div>

      <div v-else class="item-list">
        <div v-for="row in decorationRows" :key="row.decoration.id" class="item-row">
          <img class="deco-thumb" :src="`/images/cigar_sprite_pack_topdown/sprites/decorations/${row.decoration.spriteFile}.png`" :alt="row.decoration.name" />
          <div class="info">
            <span class="name">{{ row.decoration.name }}</span>
            <span class="detail">{{ row.decoration.description }}</span>
          </div>
          <button :disabled="!row.canAfford" @click="placeDecoration(row.decoration)">
            ${{ formatCompactNumber(row.decoration.cost) }}
          </button>
        </div>
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
  width: 460px;
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
  padding: 0;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.feedback {
  margin: -$spacing-sm 0 0;
  font-size: 0.78rem;
  color: $color-money;
  min-height: 1em;
  opacity: 0;
  transition: opacity 0.2s ease;

  &.visible {
    opacity: 1;
  }
}

.tabs {
  display: flex;
  gap: $spacing-xs;
  margin: -$spacing-xs 0 0;
}

.tab {
  font: inherit;
  font-size: 0.8rem;
  padding: $spacing-xs $spacing-md;
  border-radius: $radius-sm;
  border: 1px solid $color-panel-border;
  background: transparent;
  color: $color-text-muted;
  cursor: pointer;

  &.active {
    border-color: $color-accent;
    background: rgba(212, 169, 74, 0.15);
    color: $color-text;
  }
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.deco-thumb {
  width: 30px;
  height: 30px;
  border-radius: $radius-sm;
  background: rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
  object-fit: cover;
}

.item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-sm;
  padding: $spacing-sm;
  border: 1px solid $color-panel-border;
  border-radius: $radius-sm;

  // A running Fertilizer/Rush Delivery buff gets a warm ember glow on its
  // own row - the same "something is active" language as the pulsing
  // ready-glow elsewhere, just cigar-colored instead of green.
  &.active {
    border-color: #e0862f;
    background: rgba(224, 134, 47, 0.08);
  }
}

.item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: $radius-sm;
  background: rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
  font-size: 1.05rem;
}

.info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;

  .name {
    font-size: 0.88rem;
  }
}

.detail {
  font-size: 0.72rem;
  color: $color-text-muted;
}

.current-effect {
  font-size: 0.72rem;
  color: $color-money;
  font-weight: 600;
}

.active-boost {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #e0862f;
  animation: ember-pulse 1.4s ease-in-out infinite;
}

@keyframes ember-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.warn {
  font-size: 0.72rem;
  color: $color-danger;
}

button {
  font: inherit;
  font-size: 0.78rem;
  line-height: 1.3;
  padding: $spacing-xs $spacing-md;
  border-radius: $radius-sm;
  border: 1px solid $color-panel-border;
  background: rgba(212, 169, 74, 0.12);
  color: $color-text;
  cursor: pointer;
  white-space: nowrap;
  text-align: center;
  min-height: 40px;
  flex-shrink: 0;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: transparent;
  }
}

.buy-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;

  &.coins {
    border-color: #e0862f;
    background: rgba(224, 134, 47, 0.15);
    color: #e0b23d;

    &:not(:disabled):hover {
      background: rgba(224, 134, 47, 0.28);
    }
  }
}
</style>
