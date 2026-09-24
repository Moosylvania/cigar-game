<script setup>
import { computed } from 'vue'
import { useGameStore } from '~/stores/game.js'
import { TOBACCO_VARIETIES, getLifetimeTobaccoEarnings, isTobaccoUnlocked, getTobacco } from '#game/config/tobacco.config.js'
import { getBaseCigarSalePrice } from '#game/engine/economy.js'
import { getResourceLots } from '#game/engine/tobaccoEngine.js'
import { formatCompactNumber as number } from '#game/util/format.js'
const selected = defineModel({ type: String, default: 'piloto' })
const store = useGameStore()
const crop = computed(() => getTobacco(selected.value) ?? TOBACCO_VARIETIES[0])
const lifetime = computed(() => getLifetimeTobaccoEarnings(store.game))
const salePrice = computed(() => getBaseCigarSalePrice(store.game, store.combinedMultipliers) * crop.value.cigarMultiplier)
const holdings = computed(() => {
  const seeds = getResourceLots(store.game, 'seeds'), cigars = getResourceLots(store.game, 'cigars')
  return TOBACCO_VARIETIES.filter(v => seeds[v.id] > 0 || cigars[v.id] > 0).map(v => ({ ...v, seeds: seeds[v.id] ?? 0, cigars: cigars[v.id] ?? 0 }))
})
</script>
<template>
  <section class="seed-catalog" aria-label="Tobacco seeds">
    <label for="seed-variety">Choose your tobacco</label>
    <select id="seed-variety" v-model="selected">
      <option v-for="variety in TOBACCO_VARIETIES" :key="variety.id" :value="variety.id" :disabled="!isTobaccoUnlocked(store.game, variety.id)">
        {{ variety.name }} · {{ variety.cigarMultiplier }}×{{ isTobaccoUnlocked(store.game, variety.id) ? '' : ` · unlock at $${number(variety.unlockAt)}` }}
      </option>
    </select>
    <p>{{ crop.description }} <strong>{{ crop.cigarMultiplier }}× cigar value</strong> · ${{ number(salePrice) }} per cigar with your current bonuses.</p>
    <p class="muted">Seed packs below contain {{ crop.name }}. Choose which seeds to plant by clicking Seedlings or opening a Nursery. Automatic mode uses your highest-value seeds. Existing stock keeps its original variety.</p>
    <details>
      <summary>Seed unlocks · ${{ number(lifetime) }} lifetime earned</summary>
      <div v-for="variety in TOBACCO_VARIETIES" :key="variety.id" class="crop-row">
        <span>{{ variety.name }}<small>{{ variety.cigarMultiplier }}× cigar value</small></span>
        <span>{{ isTobaccoUnlocked(store.game, variety.id) ? 'Unlocked' : `$${number(variety.unlockAt)}` }}</span>
      </div>
      <p class="muted">Earnings across all prestige runs count. Spending money never relocks a seed.</p>
    </details>
    <details>
      <summary>Seed &amp; cigar inventory by variety</summary>
      <p v-if="!holdings.length" class="muted">No seeds or finished cigars in storage. Crops in production will appear here when they become cigars.</p>
      <div v-for="variety in holdings" :key="variety.id" class="crop-row">
        <span>{{ variety.name }}</span><span>{{ number(variety.seeds) }} seeds<small>{{ number(variety.cigars) }} cigars</small></span>
      </div>
    </details>
  </section>
</template>
<style scoped lang="scss">
@use '~/assets/scss/variables' as *;
.seed-catalog { padding-bottom: 16px; border-bottom: 1px solid $color-panel-border; }
label { display: block; font-weight: 600; margin-bottom: 8px; }
select { width: 100%; min-height: 44px; padding: 8px; color: $color-text; background: $color-bg; border: 1px solid $color-panel-border; border-radius: $radius-sm; font: inherit; font-size: .85rem; }
p { font-size: .8rem; line-height: 1.5; margin: 10px 0; } strong { color: $color-money; }
.muted, small { color: $color-text-muted; } small { display: block; font-size: .75rem; }
details { margin-top: 12px; font-size: .8rem; } summary { cursor: pointer; padding: 6px 0; color: $color-accent; }
.crop-row { display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px solid $color-panel-border; }
.crop-row > span:last-child { text-align: right; white-space: nowrap; }
</style>
