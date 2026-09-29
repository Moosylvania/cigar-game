<script setup>
import { computed, onBeforeUnmount } from 'vue'
import { useGameStore } from '~/stores/game.js'
import { LAB_RESEARCH } from '#game/config/lab.config.js'
import { EPIC_RESEARCH } from '#game/config/epicResearch.config.js'
import { formatCompactNumber } from '#game/util/format.js'

const emit = defineEmits(['close'])
const store = useGameStore()
function effectLabel(research, level) {
  if (level <= 0) return null
  if (research.effect.type === 'sale_price_multiplier') {
    const pct = (research.perLevelValue * level * 100).toFixed(0)
    return `+${pct}% cigar price`
  }
  if (research.effect.type === 'production_speed_multiplier') {
    const pct = ((1 - (1 - research.perLevelValue) ** level) * 100).toFixed(0)
    return `${pct}% faster`
  }
  if (research.effect.type === 'batch_size_multiplier') {
    const pct = (((1 + research.perLevelValue) ** level - 1) * 100).toFixed(0)
    return `+${pct}% batch size`
  }
  if (research.effect.type === 'storage_capacity_multiplier') {
    const pct = (((1 + research.perLevelValue) ** level - 1) * 100).toFixed(0)
    return `+${pct}% Depot storage`
  }
  if (research.effect.type === 'fleet_throughput_multiplier') {
    const pct = (((1 + research.perLevelValue) ** level - 1) * 100).toFixed(0)
    return `+${pct}% export rate`
  }
  return null
}

const rows = computed(() =>
  LAB_RESEARCH.map((research) => {
    const level = store.getResearchLevel(research.id)
    const maxed = level >= research.maxLevel
    const cost = maxed ? null : store.getNextResearchCost(research)
    return {
      research,
      level,
      maxed,
      cost,
      current: effectLabel(research, level),
      canBuy: !maxed && store.money >= cost
    }
  })
)

function buy(researchId) {
  return store.buyResearch(researchId)
}

// Tap buys one level. Holding for HOLD_DELAY_MS buys every further level
// you can afford at once, stopping at max level or when money runs out
// (buyResearch/buyEpicResearch return {ok: false} then).
const HOLD_DELAY_MS = 400
let holdTimeout = null

function startHold(action) {
  stopHold()
  action()
  holdTimeout = setTimeout(() => {
    holdTimeout = null
    while (action().ok);
    navigator.vibrate?.(15)
  }, HOLD_DELAY_MS)
}

function stopHold() {
  clearTimeout(holdTimeout)
  holdTimeout = null
}

function epicEffectLabel(research, level) {
  if (level <= 0) return null
  if (research.effect.type === 'prestige_multiplier_boost') {
    const pct = (research.perLevelValue * level * 100).toFixed(0)
    return `+${pct}% to every prestige tier's multiplier`
  }
  return effectLabel(research, level)
}

const epicRows = computed(() =>
  EPIC_RESEARCH.map((research) => {
    const level = store.getEpicResearchLevel(research.id)
    const maxed = level >= research.maxLevel
    const cost = maxed ? null : store.getNextEpicResearchCost(research)
    return {
      research,
      level,
      maxed,
      cost,
      current: epicEffectLabel(research, level),
      canBuy: !maxed && store.money >= cost
    }
  })
)

// Cheapest next level first; maxed lines sink to the bottom.
function byPrice(a, b) {
  return (a.maxed ? Infinity : a.cost) - (b.maxed ? Infinity : b.cost)
}

// Foundation lines have no `program`; advanced programs are tagged in
// lab.config.js. Sections keep config order, with Epic last, and rows are
// sorted by price within each section.
const sections = computed(() => {
  const byName = new Map()
  for (const row of rows.value) {
    const name = row.research.program ?? 'Foundation'
    if (!byName.has(name)) byName.set(name, [])
    byName.get(name).push(row)
  }
  return [
    ...Array.from(byName, ([name, sectionRows]) => ({ name, rows: sectionRows.sort(byPrice) })),
    { name: 'Epic', epic: true, rows: epicRows.value.map((row) => ({ ...row, epic: true })).sort(byPrice) }
  ]
})

function buyEpic(researchId) {
  return store.buyEpicResearch(researchId)
}

onBeforeUnmount(stopHold)
</script>

<template>
  <div class="panel-backdrop" @click.self="emit('close')">
    <div class="panel">
      <div class="panel-header">
        <span class="header-icon"><Icon name="mdi:flask-outline" /></span>
        <h3>Research Lab</h3>
        <button class="close" @click="emit('close')"><Icon name="mdi:close" /></button>
      </div>

      <p class="hint">Tap to buy a level. Hold to buy as many as you can afford.</p>

      <section v-for="section in sections" :key="section.name" class="research-section">
        <h4 class="section-header" :class="{ epic: section.epic }">
          <Icon v-if="section.epic" name="mdi:crown" />
          {{ section.name }}
        </h4>
        <div class="research-list">
          <div v-for="row in section.rows" :key="row.research.id" class="research-row" :class="{ maxed: row.maxed, epic: row.epic }">
            <span class="research-icon"><Icon :name="row.research.icon" /></span>
            <div class="info">
              <div class="title-line">
                <span class="name">{{ row.research.name }}</span>
                <span class="level">Lv {{ row.level }}/{{ row.research.maxLevel }}</span>
              </div>
              <span class="detail">{{ row.research.description }}</span>
              <span v-if="row.current" class="current-effect">{{ row.current }}</span>
              <div class="progress-track">
                <div class="progress-fill" :class="{ 'epic-fill': row.epic }" :style="{ width: `${(row.level / row.research.maxLevel) * 100}%` }" />
              </div>
            </div>
            <span v-if="row.maxed" class="status">MAX</span>
            <button
              v-else
              :disabled="!row.canBuy"
              @pointerdown="startHold(() => row.epic ? buyEpic(row.research.id) : buy(row.research.id))"
              @pointerup="stopHold"
              @pointerleave="stopHold"
              @pointercancel="stopHold"
              @contextmenu.prevent
            >
              +{{ Number((row.research.perLevelValue * 100).toFixed(1)) }}%<br />
              ${{ formatCompactNumber(row.cost) }}
            </button>
          </div>
        </div>
      </section>
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

.hint {
  margin: 0;
  font-size: 0.72rem;
  color: $color-text-muted;
}

.research-section {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.section-header {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  margin: 0;
  padding-top: $spacing-sm;
  border-top: 1px solid $color-panel-border;
  font-size: 0.85rem;
  color: $color-text-muted;

  &.epic {
    color: $color-accent;
  }
}

.research-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.research-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-sm;
  padding: $spacing-sm;
  border: 1px solid $color-panel-border;
  border-radius: $radius-sm;

  &.maxed {
    border-color: $color-money;
    background: rgba(123, 201, 111, 0.08);
  }
}

.research-icon {
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
}

.title-line {
  display: flex;
  align-items: baseline;
  gap: $spacing-sm;

  .name {
    font-size: 0.88rem;
  }

  .level {
    font-size: 0.72rem;
    color: $color-text-muted;
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

.progress-track {
  margin-top: 2px;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: $color-money;

  &.epic-fill { background: $color-accent; }
}

.status {
  font-size: 0.78rem;
  color: $color-money;
  white-space: nowrap;
  font-weight: 600;
}

button {
  font: inherit;
  font-size: 0.72rem;
  line-height: 1.3;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  border: 1px solid $color-panel-border;
  background: rgba(212, 169, 74, 0.12);
  color: $color-text;
  cursor: pointer;
  white-space: nowrap;
  text-align: center;
  min-height: 40px;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: transparent;
  }
}
</style>
