<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useGameStore } from '~/stores/game.js'
import { VEHICLE_TIERS, getVehicleTier, getVehicleSpritePath } from '#game/config/vehicles.config.js'

const props = defineProps({
  // null/undefined = filling an empty slot (buyVehicle); a tier id = the
  // slot already holds that tier, and picking another one here swaps it in
  // place instead of consuming a new slot (replaceVehicle).
  replacingTierId: { type: String, default: null }
})
const emit = defineEmits(['close'])
const store = useGameStore()

// Tracks which tier now occupies this slot - starts from the prop, but
// (unlike the prop, which the parent only sets once when opening the
// modal) updates after each successful in-place swap, so buying Box Truck
// while replacing a Pickup Truck immediately re-marks Box Truck as
// "current" instead of leaving the stale Pickup Truck highlighted until
// the modal is closed and reopened.
const currentSlotTierId = ref(props.replacingTierId)
watch(() => props.replacingTierId, (value) => {
  currentSlotTierId.value = value
})

const isReplaceMode = computed(() => !!currentSlotTierId.value)
const replacingTier = computed(() => (currentSlotTierId.value ? getVehicleTier(currentSlotTierId.value) : null))

const feedback = ref(null)

const rows = computed(() =>
  VEHICLE_TIERS.map((tier) => {
    const isCurrent = isReplaceMode.value && tier.id === currentSlotTierId.value
    const result = isCurrent
      ? { ok: false, reason: 'already_owned' }
      : isReplaceMode.value
        ? store.canReplaceVehicle(currentSlotTierId.value, tier.id)
        : store.canBuyVehicle(tier.id)
    return { tier, isCurrent, canBuy: result.ok, reason: result.reason }
  })
)

const reasonText = {
  no_distribution_building: 'Build a Distribution Depot first',
  no_fleet_slots: 'Fleet full - upgrade the depot for more slots',
  insufficient_funds: 'Not enough money',
  already_owned: 'Currently in this slot'
}

function buy(row) {
  const result = isReplaceMode.value
    ? store.replaceVehicle(currentSlotTierId.value, row.tier.id)
    : store.buyVehicle(row.tier.id)
  if (result.ok && isReplaceMode.value) {
    currentSlotTierId.value = row.tier.id
  }
  feedback.value = result.ok
    ? (isReplaceMode.value ? `Upgraded to ${row.tier.name}` : `Bought ${row.tier.name}`)
    : reasonText[result.reason] ?? null
  setTimeout(() => {
    if (feedback.value) feedback.value = null
  }, 1600)
}

function handleKeydown(event) {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <div class="panel-backdrop" @click.self="emit('close')">
    <div class="panel">
      <div class="panel-header">
        <span class="header-icon"><Icon name="mdi:truck-fast-outline" /></span>
        <h3>{{ isReplaceMode ? `Upgrade ${replacingTier?.name}` : 'Add Vehicle' }}</h3>
        <button class="close" @click="emit('close')"><Icon name="mdi:close" /></button>
      </div>

      <div class="summary">{{ store.fleetSlotsUsed }} / {{ store.fleetMaxSlots }} fleet slots used</div>
      <p class="feedback" :class="{ visible: feedback }">{{ feedback || '&nbsp;' }}</p>

      <div class="item-list">
        <div v-for="row in rows" :key="row.tier.id" class="item-row" :class="{ current: row.isCurrent }">
          <span class="item-icon"><img :src="getVehicleSpritePath(row.tier.id)" :alt="row.tier.name" /></span>
          <div class="info">
            <span class="name">{{ row.tier.name }}</span>
            <span class="detail">{{ row.tier.capacityPerHour.toLocaleString() }} cigars/hr</span>
            <span v-if="!row.canBuy && row.reason" class="warn" :class="{ current: row.isCurrent }">{{ reasonText[row.reason] ?? 'Unavailable' }}</span>
          </div>
          <button :disabled="!row.canBuy" @click="buy(row)">
            ${{ row.tier.cost.toLocaleString() }}
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
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 30;

  @include mobile {
    align-items: flex-end;
  }
}

.panel {
  width: 420px;
  max-width: 90vw;
  max-height: 85vh;
  overflow-y: auto;
  background: $color-panel;
  border: 1px solid $color-panel-border;
  border-radius: $radius-md;
  padding: $spacing-md;
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;

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

.summary {
  margin-top: -$spacing-xs;
  font-size: 0.78rem;
  color: $color-text-muted;
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

.item-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-sm;
  padding: $spacing-sm;
  border: 1px solid $color-panel-border;
  border-radius: $radius-sm;

  &.current {
    border-color: $color-accent;
    background: rgba(212, 169, 74, 0.08);
  }
}

.item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: $radius-sm;
  background: rgba(255, 255, 255, 0.08);
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
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

.warn {
  font-size: 0.72rem;
  color: $color-danger;

  &.current {
    color: $color-accent;
  }
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
</style>
