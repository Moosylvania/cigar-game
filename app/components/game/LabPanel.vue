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
    const pct = (((1 + research.perLevelValue) ** level - 1) * 100).toFixed(0)
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
  store.buyResearch(researchId)
}

// Click-and-hold to keep buying levels without a separate click per level -
// fires once immediately (so a plain tap/click still works normally),
// waits HOLD_DELAY_MS to make sure it's a hold and not just a click, then
// repeats every HOLD_REPEAT_MS. A no-op past max level or when unaffordable
// (buyResearch/buyEpicResearch just return {ok: false}) so holding down on
// a maxed-out or too-expensive row is harmless, not an error.
const HOLD_DELAY_MS = 400
const HOLD_REPEAT_MS = 120
let holdTimeout = null
let holdInterval = null

function startHold(action) {
  stopHold()
  action()
  holdTimeout = setTimeout(() => {
    holdInterval = setInterval(action, HOLD_REPEAT_MS)
  }, HOLD_DELAY_MS)
}

function stopHold() {
  clearTimeout(holdTimeout)
  clearInterval(holdInterval)
  holdTimeout = null
  holdInterval = null
}

function epicEffectLabel(research, level) {
  if (level <= 0) return null
  if (research.effect.type === 'prestige_multiplier_boost') {
    const pct = (((1 + research.perLevelValue) ** level - 1) * 100).toFixed(0)
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

function buyEpic(researchId) {
  store.buyEpicResearch(researchId)
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

      <div class="research-list">
        <div v-for="row in rows" :key="row.research.id" class="research-row" :class="{ maxed: row.maxed }">
          <span class="research-icon"><Icon :name="row.research.icon" /></span>
          <div class="info">
            <div class="title-line">
              <span class="name">{{ row.research.name }}</span>
              <span class="level">Lv {{ row.level }}/{{ row.research.maxLevel }}</span>
            </div>
            <span class="detail">{{ row.research.description }}</span>
            <span v-if="row.current" class="current-effect">{{ row.current }}</span>
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: `${(row.level / row.research.maxLevel) * 100}%` }" />
            </div>
          </div>
          <span v-if="row.maxed" class="status">MAX</span>
          <button
            v-else
            :disabled="!row.canBuy"
            @pointerdown="startHold(() => buy(row.research.id))"
            @pointerup="stopHold"
            @pointerleave="stopHold"
            @pointercancel="stopHold"
          >
            +{{ (row.research.perLevelValue * 100).toFixed(0) }}%<br />
            ${{ formatCompactNumber(row.cost) }}
          </button>
        </div>
      </div>

      <div class="epic-header">
        <Icon name="mdi:crown" />
        <h4>Epic Research</h4>
      </div>

      <div class="research-list">
        <div v-for="row in epicRows" :key="row.research.id" class="research-row epic" :class="{ maxed: row.maxed }">
          <span class="research-icon"><Icon :name="row.research.icon" /></span>
          <div class="info">
            <div class="title-line">
              <span class="name">{{ row.research.name }}</span>
              <span class="level">Lv {{ row.level }}/{{ row.research.maxLevel }}</span>
            </div>
            <span class="detail">{{ row.research.description }}</span>
            <span v-if="row.current" class="current-effect">{{ row.current }}</span>
            <div class="progress-track">
              <div class="progress-fill epic-fill" :style="{ width: `${(row.level / row.research.maxLevel) * 100}%` }" />
            </div>
          </div>
          <span v-if="row.maxed" class="status">MAX</span>
          <button
            v-else
            :disabled="!row.canBuy"
            @pointerdown="startHold(() => buyEpic(row.research.id))"
            @pointerup="stopHold"
            @pointerleave="stopHold"
            @pointercancel="stopHold"
          >
            +{{ (row.research.perLevelValue * 100).toFixed(0) }}%<br />
            ${{ formatCompactNumber(row.cost) }}
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

.epic-header {
  display: flex;
  align-items: baseline;
  gap: $spacing-xs;
  margin-top: $spacing-xs;
  padding-top: $spacing-sm;
  border-top: 1px solid $color-panel-border;
  color: $color-accent;

  h4 {
    margin: 0;
    font-size: 0.85rem;
  }
}

.epic-fill {
  background: $color-accent;
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

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: transparent;
  }
}
</style>
