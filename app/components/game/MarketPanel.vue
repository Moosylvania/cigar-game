<script setup>
import { computed, ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useGameStore } from '~/stores/game.js'
import { MARKET_CUSTOMERS, getOrderProgress } from '#game/engine/marketEngine.js'
import { getTobacco } from '#game/config/tobacco.config.js'
import { getResourceLots } from '#game/engine/tobaccoEngine.js'
import { formatCompactNumber } from '#game/util/format.js'
import MarketCustomer from './MarketCustomer.vue'
const emit = defineEmits(['close'])
const store = useGameStore()
store.openMarket()
const board = computed(() => store.game.market)
const stock = computed(() => getResourceLots(store.game, 'cigars'))
const dialog = ref(null)
const message = ref('')
let previousFocus
const progress = order => getOrderProgress(order, store.game)
function deliver(order) {
  const result = store.deliverMarketOrder(order.id)
  if (result.ok) nextTick(() => dialog.value?.focus())
  message.value = result.ok ? result.paid ? `Order complete! Earned $${formatCompactNumber(result.paid)}.${result.newSet ? ' Three new orders have arrived.' : ''}` : 'Cigars delivered. Keep producing to finish this order.' : 'No matching cigars in storage yet.'
}
onMounted(async () => { previousFocus = document.activeElement; await nextTick(); dialog.value?.focus() })
onBeforeUnmount(() => previousFocus?.isConnected && previousFocus.focus())
function keys(event) {
  if (event.key === 'Escape') { event.stopPropagation(); emit('close') }
  if (event.key !== 'Tab') return
  const items = [...dialog.value.querySelectorAll('button:not(:disabled), input')]
  const first = items[0], last = items.at(-1)
  if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.value)) { event.preventDefault(); last?.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
}
</script>
<template>
  <div class="market-backdrop" @click.self="emit('close')">
    <section ref="dialog" class="market-panel" role="dialog" aria-modal="true" aria-labelledby="market-title" tabindex="-1" @keydown="keys">
      <header class="market-header"><div><h2 id="market-title">Town Market</h2><p>Order set {{ board.round }} · {{ board.orders.filter(o => o.completed).length }} of 3 complete</p></div><button class="close" aria-label="Close market" @click="emit('close')"><Icon name="mdi:close" /></button></header>
      <p class="intro">Supply your neighbors with farm-made cigars. Finish all three orders to meet your next customers.</p>
      <label class="reservation"><input type="checkbox" :checked="board.reserve" @change="store.setMarketReservation($event.target.checked)" /> Reserve needed cigars from automatic exports</label>
      <p class="hint">Deliver in parts to free Depot space. Reserved stock stays in the Depot until you deliver it; extra cigars still export. Prices are fixed for this set. Prestige starts fresh orders.</p>
      <p class="feedback" role="status" aria-live="polite">{{ message }}</p>
      <article v-for="order in board.orders" :key="order.id" class="order" :class="{ fulfilled: order.completed }" :aria-labelledby="`order-${order.id}`">
        <div class="customer"><MarketCustomer :customer="order.customer" :completed="order.completed" /><div><h3 :id="`order-${order.id}`">{{ MARKET_CUSTOMERS[order.customer].name }}</h3><p>{{ MARKET_CUSTOMERS[order.customer].business }}</p><span class="difficulty">{{ order.difficulty }} · {{ Math.round((order.premium - 1) * 100) }}% premium</span></div><strong class="reward">${{ formatCompactNumber(order.reward) }}<small>{{ order.completed ? 'Paid' : 'On completion' }}</small></strong></div>
        <ul class="requirements"><li v-for="r in order.requirements" :key="r.tobaccoId"><span class="swatch" :style="{ background: getTobacco(r.tobaccoId).color }" aria-hidden="true"></span><span>{{ getTobacco(r.tobaccoId).cigarName }}<small>{{ getTobacco(r.tobaccoId).name }} · {{ Math.floor(stock[r.tobaccoId] ?? 0) }} in storage</small></span><strong>{{ r.delivered }} / {{ r.amount }}</strong></li></ul>
        <div class="order-footer"><div class="order-progress"><div class="progress-label"><span>{{ order.completed ? 'Order fulfilled' : `${progress(order).delivered} / ${progress(order).total} delivered` }}</span><span>{{ progress(order).percent }}%</span></div>
        <progress :value="progress(order).delivered" :max="progress(order).total" :aria-label="`${MARKET_CUSTOMERS[order.customer].name}'s order progress`"></progress></div>
        <button class="deliver" :disabled="order.completed || progress(order).available <= 0" @click="deliver(order)">{{ order.completed ? 'Completed' : progress(order).available > 0 ? `Deliver ${progress(order).available} cigars` : 'Waiting for cigars' }}</button></div>
      </article>
    </section>
  </div>
</template>
<style scoped lang="scss">
@use '~/assets/scss/variables' as *;
.market-backdrop { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.65); display: flex; align-items: center; justify-content: center; padding: $spacing-md; }
.market-panel { width: min(100%, 680px); max-height: 92dvh; overflow-y: auto; background: $color-panel; color: $color-text; border: 1px solid $color-panel-border; border-radius: $radius-md; padding: $spacing-lg; }
.market-header, .customer, .progress-label { display: flex; align-items: center; justify-content: space-between; gap: $spacing-sm; }
h2, h3, p { margin: 0; } h2 { font-size: 1.5rem; } h3 { font-size: 1rem; }
.market-header p, .customer p, .hint, small { color: $color-text-muted; font-size: 0.8rem; }
.intro { margin: $spacing-md 0; line-height: 1.5; }
.reservation { display: flex; align-items: center; gap: $spacing-sm; min-height: 44px; cursor: pointer; }
input { accent-color: $color-accent; width: 18px; height: 18px; flex-shrink: 0; }
.hint { line-height: 1.5; } .feedback { color: $color-money; margin-top: $spacing-sm; }
.order { border-top: 1px solid $color-panel-border; padding: 4px 0; margin-top: $spacing-xs; }
.customer { justify-content: flex-start; } .customer :deep(canvas) { width: 56px; height: 56px; } .reward { margin-left: auto; color: $color-money; font-size: 1.25rem; text-align: right; white-space: nowrap; } small { display: block; font-weight: normal; margin-top: 3px; }
.difficulty { display: inline-block; color: $color-accent; margin-top: 2px; font-size: 0.75rem; }
.requirements { list-style: none; padding: 0; margin: 4px 0 8px; }
li { display: flex; align-items: center; gap: $spacing-sm; padding: 4px 0; } li strong { margin-left: auto; white-space: nowrap; font-variant-numeric: tabular-nums; }
.swatch { width: 14px; height: 14px; flex-shrink: 0; border-radius: 3px; }
.progress-label { color: $color-text-muted; font-size: 0.8rem; }
progress { width: 100%; height: 6px; display: block; margin: 4px 0 8px; accent-color: $color-money; border: 0; border-radius: 5px; overflow: hidden; background: $color-bg; }
progress::-webkit-progress-bar { background: $color-bg; } progress::-webkit-progress-value { background: $color-money; } progress::-moz-progress-bar { background: $color-money; }
button { font: inherit; cursor: pointer; min-height: 44px; border-radius: $radius-sm; }
.close { background: transparent; border: 0; color: $color-text; min-width: 44px; }
.order-footer { display: flex; align-items: center; gap: $spacing-md; }
.order-progress { flex: 1; min-width: 0; }
.deliver { flex-shrink: 0; padding: 6px 12px; font-size: 0.8rem; background: $color-accent; color: $color-bg; border: 0; font-weight: bold; }
.deliver:hover:not(:disabled) { filter: brightness(1.1); } .deliver:disabled { background: $color-bg; color: $color-text-muted; cursor: default; }
button:focus-visible, input:focus-visible { outline: 2px solid $color-accent; outline-offset: 3px; }
@include mobile { .market-panel { padding: $spacing-md; } .customer { flex-wrap: wrap; } .customer :deep(canvas) { width: 44px; height: 44px; } .reward { font-size: 1.1rem; } }
</style>
