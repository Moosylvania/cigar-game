<script setup>
import { computed, ref } from 'vue'
import { useGameStore } from '~/stores/game.js'
import { getVehicleTier, getVehicleSpritePath } from '#game/config/vehicles.config.js'
import { formatCompactNumber } from '#game/util/format.js'
import { publicAsset } from '~/utils/publicAsset.js'
import VehiclePickerModal from './VehiclePickerModal.vue'

const store = useGameStore()
const showPicker = ref(false)
const replacingTierId = ref(null)

// One row per fleet slot - occupied slots show that vehicle (click to
// replace it in place), and any remaining slots up to the Depot's cap show
// an "Add Vehicle" placeholder (click to fill it) - same popup either way.
const slotRows = computed(() => {
  const rows = []
  for (const entry of store.fleet) {
    const tier = getVehicleTier(entry.vehicleTierId)
    if (!tier) continue
    for (let i = 0; i < entry.count; i++) rows.push({ occupied: true, tier })
  }
  const emptyCount = Math.max(0, store.fleetMaxSlots - rows.length)
  for (let i = 0; i < emptyCount; i++) rows.push({ occupied: false, tier: null })
  return rows
})

function openAddSlot() {
  replacingTierId.value = null
  showPicker.value = true
}

function openReplaceSlot(tierId) {
  replacingTierId.value = tierId
  showPicker.value = true
}

const cigarsStored = computed(() => Math.floor(store.storage.cigars))
const cigarCapacity = computed(() => Math.floor(store.cigarStorageCapacity))
const isNearFull = computed(() => cigarCapacity.value > 0 && cigarsStored.value / cigarCapacity.value >= 0.85)
</script>

<template>
  <div class="distribution-panel">
    <div class="fleet-summary">
      <span>{{ store.fleetSlotsUsed }} / {{ store.fleetMaxSlots }} fleet slots</span>
      <span>{{ formatCompactNumber(store.fleetCapacityPerHour) }} cigars/hr export rate</span>
    </div>

    <div class="depot-storage" :class="{ warn: isNearFull }">
      <Icon :name="isNearFull ? 'mdi:alert-outline' : 'mdi:warehouse'" />
      <span>Cigar storage: {{ formatCompactNumber(cigarsStored) }} / {{ formatCompactNumber(cigarCapacity) }}</span>
    </div>

    <div class="fleet-list">
      <button
        v-for="(row, index) in slotRows"
        :key="row.occupied ? `${row.tier.id}-${index}` : `empty-${index}`"
        class="vehicle-row"
        :class="{ 'add-row': !row.occupied }"
        @click="row.occupied ? openReplaceSlot(row.tier.id) : openAddSlot()"
      >
        <span class="vehicle-icon" :class="{ 'add-icon': !row.occupied }">
          <img v-if="row.occupied" :src="publicAsset(getVehicleSpritePath(row.tier.id))" :alt="row.tier.name" />
          <Icon v-else name="mdi:plus" />
        </span>
        <div class="vehicle-info">
          <template v-if="row.occupied">
            <span class="name">{{ row.tier.name }}</span>
            <span class="detail">+{{ formatCompactNumber(row.tier.capacityPerHour) }} cigars/hr &middot; tap to upgrade</span>
          </template>
          <template v-else>
            <span class="name">Add Vehicle</span>
            <span class="detail">Buy any truck or train, any time</span>
          </template>
        </div>
      </button>
    </div>

    <VehiclePickerModal
      v-if="showPicker"
      :replacing-tier-id="replacingTierId"
      @close="showPicker = false"
    />
  </div>
</template>

<style lang="scss" scoped>
@use '~/assets/scss/variables' as *;

.distribution-panel {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.fleet-summary {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: $color-text-muted;
  padding-bottom: $spacing-xs;
}

.depot-storage {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  font-size: 0.8rem;
  color: $color-text-muted;
  padding-bottom: $spacing-xs;
  border-bottom: 1px solid $color-panel-border;

  &.warn {
    color: $color-danger;
  }
}

.fleet-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.vehicle-row {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  width: 100%;
  font: inherit;
  text-align: left;
  padding: $spacing-xs;
  border: 1px solid $color-panel-border;
  border-radius: $radius-sm;
  background: rgba(255, 255, 255, 0.03);
  color: $color-text;
  cursor: pointer;

  &:hover {
    border-color: $color-accent;
    background: rgba(212, 169, 74, 0.1);
  }

  &.add-row {
    border-style: dashed;
    background: transparent;

    &:hover {
      background: rgba(212, 169, 74, 0.08);
    }
  }
}

.vehicle-icon {
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

  &.add-icon {
    color: $color-accent;
    font-size: 1.2rem;
  }
}

.vehicle-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;

  .name {
    font-size: 0.9rem;
  }

  .detail {
    font-size: 0.75rem;
    color: $color-text-muted;
  }
}
</style>
