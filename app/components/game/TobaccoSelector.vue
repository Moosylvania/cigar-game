<script setup>
import { computed } from 'vue'
import { useGameStore } from '~/stores/game.js'
import { TOBACCO_VARIETIES, getTobacco } from '#game/config/tobacco.config.js'
import { getResourceLots } from '#game/engine/tobaccoEngine.js'
import { getPipelineStage } from '#game/config/pipeline.config.js'
import { formatCompactNumber } from '#game/util/format.js'
const RESOURCE_LABELS = { seeds: 'seeds', nurserySeedlings: 'seedlings', fieldTobacco: 'harvested tobacco', curedTobacco: 'cured tobacco', steamedTobacco: 'steamed tobacco', fermentedTobacco: 'fermented tobacco' }
const props = defineProps({ building: { type: Object, required: true } })
const store = useGameStore()
const inputKey = computed(() => getPipelineStage(props.building.type).inputKey)
const inputLabel = computed(() => RESOURCE_LABELS[inputKey.value] ?? inputKey.value)
const seeds = computed(() => getResourceLots(store.game, inputKey.value))
// Keep native select options stable while production updates inventory.
const choices = TOBACCO_VARIETIES
const selected = computed(() => getTobacco(props.building.seedVarietyId))
</script>

<template>
  <div class="planting-choice">
    <label :for="`planting-${building.id}`">{{ building.type === 'nursery' ? 'Seeds to plant' : 'Tobacco to process' }}</label>
    <select :id="`planting-${building.id}`" :value="building.seedVarietyId ?? ''" @change="store.selectPlantingSeed(building.id, $event.target.value || null)">
      <option value="">Automatic — highest price first</option>
      <option v-for="crop in choices" :key="crop.id" :value="crop.id">{{ crop.name }}</option>
    </select>
    <p v-if="selected">{{ formatCompactNumber(seeds[selected.id] ?? 0) }} {{ inputLabel }} available · {{ selected.cigarName }} cigars</p>
    <p v-if="selected && !(seeds[selected.id] > 0)" role="status">Out of {{ selected.name }} {{ inputLabel }}. Replenish stock or choose another tobacco.</p>
    <p v-else-if="!Object.values(seeds).some(n => n > 0)">No {{ inputLabel }} in stock. {{ building.type === 'nursery' ? 'Purchase seed packs in the Store.' : 'Produce more in the previous stage.' }}</p>
    <p>{{ building.slot?.status !== 'idle' ? 'Applies to the next batch. The current crop stays unchanged.' : 'This building will use your choice for every new batch.' }} A selected crop waits for matching input when stock runs out.</p>
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
