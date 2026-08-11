<script setup>
import { computed } from 'vue'
import { useGameStore } from '~/stores/game.js'
import { VEHICLE_TIERS, getVehicleTier, getNextVehicleTier } from '#game/config/vehicles.config.js'
import { getLevelStats } from '#game/config/buildings/index.js'

const store = useGameStore()

const currentTier = computed(() => getVehicleTier(store.fleet.vehicleTierId))
const nextTier = computed(() => getNextVehicleTier(store.fleet.vehicleTierId))

// Maps a vehicle tier id to its sprite filename under sprites/vehicles/ -
// each tier has 4 directional sprites (n/e/s/w); "_s" (facing the viewer)
// reads best as a static store/panel icon.
const VEHICLE_SPRITE_FILE = {
  truck: 'pickup_truck',
  box_truck: 'box_truck',
  semi: 'semi_trailer',
  cargo_train: 'cargo_train',
  freight_train: 'freight_train'
}

function vehicleSpritePath(tierId) {
  const file = VEHICLE_SPRITE_FILE[tierId]
  return file ? `/images/cigar_sprite_pack_topdown/sprites/vehicles/${file}_s.png` : null
}

const maxSlots = computed(() => {
  if (!store.distributionBuilding) return 0
  return getLevelStats('distribution', store.distributionBuilding.level).maxVehicleSlots
})

const canBuy = computed(() => store.canBuyVehicle())
const canUpgrade = computed(() => store.canUpgradeFleet())

const cigarsStored = computed(() => Math.floor(store.storage.cigars))
const cigarCapacity = computed(() => Math.floor(store.cigarStorageCapacity))
const isNearFull = computed(() => cigarCapacity.value > 0 && cigarsStored.value / cigarCapacity.value >= 0.85)

// Tiers beyond the immediate next one, shown as a locked roadmap so the
// player can see what's coming without it being actionable yet.
const futureTiers = computed(() => {
  const currentIndex = VEHICLE_TIERS.findIndex((tier) => tier.id === store.fleet.vehicleTierId)
  return VEHICLE_TIERS.slice(currentIndex + 2)
})

function buy() {
  store.buyVehicle()
}

function upgrade() {
  store.upgradeFleet()
}

const buyReasonText = {
  no_distribution_building: 'Build a Distribution Depot first',
  no_fleet_slots: 'Fleet full — upgrade the depot for more slots',
  insufficient_funds: 'Not enough money'
}

const upgradeReasonText = {
  no_distribution_building: 'Build a Distribution Depot first',
  max_tier: 'Top tier reached',
  depot_level_too_low: 'Depot level too low',
  insufficient_funds: 'Not enough money'
}
</script>

<template>
  <div class="distribution-panel">
    <div class="fleet-summary">
      <span>{{ currentTier.name }} × {{ store.fleet.count }} / {{ maxSlots }}</span>
      <span>{{ store.fleetCapacityPerHour.toLocaleString() }} cigars/hr export rate</span>
    </div>

    <div class="depot-storage" :class="{ warn: isNearFull }">
      <Icon :name="isNearFull ? 'mdi:alert-outline' : 'mdi:warehouse'" />
      <span>Cigar storage: {{ cigarsStored.toLocaleString() }} / {{ cigarCapacity.toLocaleString() }}</span>
    </div>

    <div class="vehicle-row current">
      <span class="vehicle-icon"><img :src="vehicleSpritePath(currentTier.id)" :alt="currentTier.name" /></span>
      <div class="vehicle-info">
        <span class="name">{{ currentTier.name }}</span>
        <span class="detail">+{{ currentTier.capacityPerHour }} cigars/hr each &middot; owned {{ store.fleet.count }}/{{ maxSlots }}</span>
      </div>
      <button :disabled="!canBuy.ok" @click="buy">
        <template v-if="canBuy.ok">Buy ${{ currentTier.cost.toLocaleString() }}</template>
        <template v-else>{{ buyReasonText[canBuy.reason] ?? 'Unavailable' }}</template>
      </button>
    </div>

    <div v-if="nextTier" class="vehicle-row upgrade">
      <span class="vehicle-icon"><img :src="vehicleSpritePath(nextTier.id)" :alt="nextTier.name" /></span>
      <div class="vehicle-info">
        <span class="name">Upgrade to {{ nextTier.name }}</span>
        <span class="detail">+{{ nextTier.capacityPerHour }} cigars/hr each &middot; replaces current fleet</span>
      </div>
      <button :disabled="!canUpgrade.ok" @click="upgrade">
        <template v-if="canUpgrade.ok">Upgrade ${{ nextTier.cost.toLocaleString() }}</template>
        <template v-else>{{ upgradeReasonText[canUpgrade.reason] ?? 'Unavailable' }}</template>
      </button>
    </div>

    <div v-if="futureTiers.length" class="roadmap">
      <span class="roadmap-title">Future tiers</span>
      <div v-for="tier in futureTiers" :key="tier.id" class="roadmap-item">
        <img class="roadmap-icon" :src="vehicleSpritePath(tier.id)" :alt="tier.name" />
        <span>{{ tier.name }}</span>
        <span class="roadmap-req">Depot Lv {{ tier.unlockDistributionLevel }}</span>
      </div>
    </div>
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

.vehicle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-sm;

  &.upgrade {
    padding: $spacing-xs;
    border: 1px dashed $color-panel-border;
    border-radius: $radius-sm;
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
}

.roadmap-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
  flex-shrink: 0;
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

.roadmap {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: $spacing-xs;
  border-top: 1px solid $color-panel-border;
}

.roadmap-title {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: $color-text-muted;
  margin-bottom: 2px;
}

.roadmap-item {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  font-size: 0.78rem;
  color: $color-text-muted;
  opacity: 0.7;

  .roadmap-req {
    margin-left: auto;
  }
}

button {
  font: inherit;
  font-size: 0.72rem;
  line-height: 1.25;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  border: 1px solid $color-panel-border;
  background: rgba(212, 169, 74, 0.12);
  color: $color-text;
  cursor: pointer;
  white-space: normal;
  text-align: center;
  flex-shrink: 0;
  width: 100px;
  min-height: 40px;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: transparent;
  }
}
</style>
