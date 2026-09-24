<script setup>
import { computed } from 'vue'
import { useGameStore } from '~/stores/game.js'
import { TOBACCO_VARIETIES, getTobacco } from '#game/config/tobacco.config.js'
import { getResourceLots } from '#game/engine/tobaccoEngine.js'
import { formatCompactNumber } from '#game/util/format.js'
const props = defineProps({ building: { type: Object, required: true } })
const store = useGameStore()
const seeds = computed(() => getResourceLots(store.game, 'seeds'))
const choices = computed(() => TOBACCO_VARIETIES.filter(v => seeds.value[v.id] > 0 || props.building.seedVarietyId === v.id))
const selected = computed(() => getTobacco(props.building.seedVarietyId))
</script>

<template>
  <div class="planting-choice">
    <label :for="`planting-${building.id}`">Seeds to plant</label>
    <select :id="`planting-${building.id}`" :value="building.seedVarietyId ?? ''" @change="store.selectPlantingSeed(building.id, $event.target.value || null)">
      <option value="">Automatic — highest value available</option>
      <option v-for="crop in choices" :key="crop.id" :value="crop.id" :disabled="!(seeds[crop.id] > 0)">{{ crop.name }} · {{ formatCompactNumber(seeds[crop.id] ?? 0) }} seeds</option>
    </select>
    <p v-if="selected">{{ selected.name }} → {{ selected.cigarName }} cigars</p>
    <p v-if="selected && !(seeds[selected.id] > 0)" role="status">Out of {{ selected.name }} seeds. Buy more or choose another crop to continue.</p>
    <p v-else-if="!Object.values(seeds).some(n => n > 0)">No seeds in stock. Purchase seed packs in the Store.</p>
    <p>{{ building.slot?.status !== 'idle' ? 'Applies to the next batch. The current crop stays unchanged.' : 'This Nursery will use your choice for every new batch.' }} A selected crop waits for matching seeds when stock runs out.</p>
  </div>
</template>

<style scoped lang="scss">
@use '~/assets/scss/variables' as *;
.planting-choice { display: grid; gap: $spacing-xs; margin-bottom: $spacing-sm; }
label { font-weight: 600; }
select { width: 100%; min-height: 44px; background: $color-bg; color: $color-text; border: 1px solid $color-panel-border; border-radius: $radius-sm; padding: $spacing-xs; font: inherit; }
select:focus-visible { outline: 2px solid $color-accent; outline-offset: 2px; }
p { margin: 0; font-size: 0.8rem; color: $color-text-muted; }
</style>
