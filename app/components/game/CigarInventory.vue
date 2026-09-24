<script setup>
import { computed } from 'vue'
import { useGameStore } from '~/stores/game.js'
import { TOBACCO_VARIETIES } from '#game/config/tobacco.config.js'
import { getResourceLots } from '#game/engine/tobaccoEngine.js'
import { getBaseCigarSalePrice } from '#game/engine/economy.js'
import { formatCompactNumber } from '#game/util/format.js'
const store = useGameStore()
const products = computed(() => {
  const lots = getResourceLots(store.game, 'cigars')
  const base = getBaseCigarSalePrice(store.game, store.combinedMultipliers)
  return TOBACCO_VARIETIES.filter(v => lots[v.id] > 0).map(v => ({ ...v, quantity: lots[v.id], price: base * v.cigarMultiplier }))
})
</script>
<template>
  <section class="cigar-products" aria-label="Cigar varieties in storage">
    <h4>Your cigars</h4>
    <p v-if="!products.length">No finished cigars yet. Your tobacco variety determines the cigar produced.</p>
    <div v-for="product in products" :key="product.id" class="product">
      <strong>{{ product.cigarName }}</strong>
      <span>{{ formatCompactNumber(product.quantity) }} · ${{ formatCompactNumber(product.price) }} each</span>
      <small>Made from {{ product.name }} tobacco</small>
    </div>
  </section>
</template>
<style scoped lang="scss">
@use '~/assets/scss/variables' as *;
h4, p { margin: 0 0 $spacing-xs; }
.product { display: grid; gap: 4px; padding: $spacing-sm 0; border-bottom: 1px solid $color-panel-border; }
span { color: $color-money; font-size: 0.85rem; }
small, p { color: $color-text-muted; }
</style>
