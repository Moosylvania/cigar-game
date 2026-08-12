<script setup>
import { computed, ref } from 'vue'
import { useGameStore } from '~/stores/game.js'
import { useClock } from '~/composables/useClock.js'
import { getPipelineStage } from '#game/config/pipeline.config.js'
import { getLevelStats, MAX_BUILDING_LEVEL } from '#game/config/buildings/index.js'
import { getAutomationTier, AUTO_COLLECT_LEVEL, AUTO_START_LEVEL } from '#game/config/automation.config.js'
import { TOWN_HALL_GATING } from '#game/config/townHallGating.config.js'
import { formatDuration } from '#game/util/time.js'
import { formatCompactNumber } from '#game/util/format.js'
import DistributionPanel from './DistributionPanel.vue'

const props = defineProps({
  buildingId: { type: String, required: true }
})
const emit = defineEmits(['close'])

const store = useGameStore()
const { nowMs } = useClock()

const RESOURCE_LABELS = {
  seeds: 'seeds',
  nurserySeedlings: 'seedlings',
  fieldTobacco: 'harvested tobacco',
  curedTobacco: 'cured tobacco',
  steamedTobacco: 'steamed tobacco',
  fermentedTobacco: 'fermented tobacco',
  cigars: 'cigars'
}

function gatingForTownHallLevel(level) {
  return TOWN_HALL_GATING.find((row) => row.townHallLevel === level) ?? TOWN_HALL_GATING[TOWN_HALL_GATING.length - 1]
}

/**
 * What a given level's stats actually mean for the player, factoring in
 * current Lab multipliers - used for both "current stats" and the
 * "next level brings" preview, so both read off the same numbers the
 * player will actually see in the Production section above.
 */
function getStatEntries(type, levelStats, labMultipliers) {
  if (type === 'town_hall') {
    const gating = gatingForTownHallLevel(levelStats.level)
    return [
      { key: 'otherMax', label: 'Other buildings unlock up to', value: `Lv ${gating.maxOtherBuildingLevel}` }
    ]
  }
  if (type === 'distribution') {
    const capacityMultiplier = labMultipliers?.depotCapacityMultiplier ?? 1
    const cigarStorageCapacity = Math.round(levelStats.cigarStorageCapacity * capacityMultiplier)
    return [
      { key: 'fleetSlots', label: 'Fleet slots', value: `${levelStats.maxVehicleSlots}` },
      { key: 'cigarCapacity', label: 'Cigar storage capacity', value: formatCompactNumber(cigarStorageCapacity) }
    ]
  }

  const batchSizeMultiplier = labMultipliers?.batchSizeMultipliers?.[type] ?? 1
  const speedMultiplier = labMultipliers?.speedMultipliers?.[type] ?? 1
  const batchSize = Math.round(levelStats.batchSize * batchSizeMultiplier)
  const durationSeconds = levelStats.processingDurationSeconds * speedMultiplier
  return [
    { key: 'batchSize', label: 'Batch size', value: `${batchSize}` },
    { key: 'duration', label: 'Processing time', value: formatDuration(durationSeconds) }
  ]
}

const building = computed(() => store.findBuilding(props.buildingId))
const config = computed(() => (building.value ? store.getBuildingConfig(building.value.type) : null))
const stage = computed(() => (building.value ? getPipelineStage(building.value.type) : null))

const isMaxLevel = computed(() => building.value && building.value.level >= MAX_BUILDING_LEVEL)
const maxAllowedLevel = computed(() => (building.value ? store.getMaxAllowedLevel(building.value.id) : 0))
const gatedByTownHall = computed(
  () => building.value && !isMaxLevel.value && building.value.level >= maxAllowedLevel.value
)

// For every building except Town Hall itself, the ceiling a single click
// could reach is the highest level Town Hall currently allows
// (maxAllowedLevel) - the summed cost/time of every intermediate level,
// charged and run as one upgrade, so catching a building up after Town
// Hall has pulled ahead doesn't take a separate click-and-wait per level
// (see startUpgradeToLevel). Town Hall gates that cap for everything else,
// so it keeps the normal one-level-at-a-time climb.
const upgradeCapLevel = computed(() => {
  if (!building.value) return 0
  return building.value.type === 'town_hall' ? building.value.level + 1 : maxAllowedLevel.value
})

// The button defaults to that full cap, but falls back to whatever's
// actually affordable right now - a player short on cash still gets a
// one-click upgrade (even if it's only +1 level) instead of a button
// disabled until they save up for the whole jump.
const affordableTargetLevel = computed(() => (building.value ? store.getAffordableUpgradeTarget(building.value.id) : 0))

const upgradeTargetLevel = computed(() => {
  if (!building.value) return 0
  return affordableTargetLevel.value > building.value.level ? affordableTargetLevel.value : upgradeCapLevel.value
})

const upgradePlan = computed(() => {
  if (!building.value || isMaxLevel.value || upgradeTargetLevel.value <= building.value.level) return null
  return store.getUpgradePlan(building.value.id, upgradeTargetLevel.value)
})

const isPartialCatchUp = computed(
  () => building.value && upgradePlan.value && upgradeTargetLevel.value < upgradeCapLevel.value
)

// However far the primary button jumps, a player who'd rather not spend
// on multiple levels at once - or save the rest for something else -
// can still choose just the next single level explicitly.
const singleLevelPlan = computed(() => {
  if (!building.value || isMaxLevel.value || gatedByTownHall.value) return null
  return store.getUpgradePlan(building.value.id, building.value.level + 1)
})

const canAffordSingleLevel = computed(() => singleLevelPlan.value && store.money >= singleLevelPlan.value.cost)

const showSingleLevelOption = computed(
  () => singleLevelPlan.value && upgradePlan.value && singleLevelPlan.value.targetLevel < upgradePlan.value.targetLevel
)

function doSingleLevelUpgrade() {
  if (!singleLevelPlan.value) return
  store.startBuildingUpgradeToLevel(props.buildingId, singleLevelPlan.value.targetLevel)
}

const currentStatEntries = computed(() => {
  if (!building.value) return []
  const entries = getStatEntries(building.value.type, getLevelStats(building.value.type, building.value.level), store.labMultipliers)
  // Sale price and Depot fullness aren't level stats of Rolling itself -
  // they're live/derived values worth surfacing here anyway, since
  // Rolling's cigars go straight into that capped Depot storage and
  // overflow if it's neglected.
  if (building.value.type === 'rolling') {
    const salePrice = store.effectiveSalePrice
    entries.push({
      key: 'salePrice',
      label: 'Sale price',
      value: `$${salePrice >= 1e6 ? formatCompactNumber(salePrice) : salePrice.toFixed(2)}/cigar`
    })
    entries.push({
      key: 'depotFullness',
      label: 'Depot storage',
      value: `${formatCompactNumber(store.storage.cigars)} / ${formatCompactNumber(store.cigarStorageCapacity)}`
    })
  }
  return entries
})

// Paired with currentStatEntries by array position (both come from the
// same getStatEntries call shape) so the template can show "current →
// target" without re-matching by key.
const nextStatEntries = computed(() => {
  if (!building.value || !upgradePlan.value) return []
  return getStatEntries(building.value.type, getLevelStats(building.value.type, upgradePlan.value.targetLevel), store.labMultipliers)
})

const upgradePreviewRows = computed(() =>
  currentStatEntries.value
    .map((entry, i) => ({ label: entry.label, from: entry.value, to: nextStatEntries.value[i]?.value }))
    .filter((row) => row.to !== undefined && row.to !== row.from)
)

const upgradeRemainingSeconds = computed(() => {
  if (!building.value?.upgrade) return 0
  return Math.max(0, (building.value.upgrade.completesAt - nowMs.value) / 1000)
})

const canAffordUpgrade = computed(
  () => upgradePlan.value && store.money >= upgradePlan.value.cost
)

const slotRemainingSeconds = computed(() => {
  if (!building.value?.slot?.completesAt) return 0
  return Math.max(0, (building.value.slot.completesAt - nowMs.value) / 1000)
})

const inputAvailable = computed(() => {
  if (!stage.value?.inputKey || !building.value) return true
  return store.storage[stage.value.inputKey] > 0
})

const automation = computed(() => (building.value ? getAutomationTier(building.value.level) : { autoCollect: false, autoStart: false }))

const collectFeedback = ref(null)

function doUpgrade() {
  if (!upgradePlan.value) return
  store.startBuildingUpgradeToLevel(props.buildingId, upgradePlan.value.targetLevel)
}

function doStartBatch() {
  store.startBatch(props.buildingId)
}

function doCollectBatch() {
  const result = store.collectBatch(props.buildingId)
  if (result.overflowed > 0) {
    const message = `${formatCompactNumber(result.overflowed)} cigars overflowed the Depot and were lost!`
    collectFeedback.value = message
    setTimeout(() => {
      if (collectFeedback.value === message) collectFeedback.value = null
    }, 3000)
  }
}
</script>

<template>
  <div v-if="building" class="panel-backdrop" @click.self="emit('close')">
    <div class="panel">
      <div class="panel-header">
        <span class="header-icon" :style="{ '--swatch': config.color }"><Icon :name="config.icon" /></span>
        <h3>{{ config.displayName }} — Lv {{ building.level }}</h3>
        <button class="close" @click="emit('close')"><Icon name="mdi:close" /></button>
      </div>

      <p class="description">{{ config.description }}</p>

      <section v-if="currentStatEntries.length" class="stats-section">
        <h4>Current Stats (Lv {{ building.level }})</h4>
        <div class="stat-row" v-for="entry in currentStatEntries" :key="entry.key">
          <span class="stat-label">{{ entry.label }}</span>
          <span class="stat-value">{{ entry.value }}</span>
        </div>
      </section>

      <section v-if="stage" class="batch-section">
        <h4>Production</h4>
        <div class="slot-status">
          <template v-if="building.slot.status === 'idle'">
            <span v-if="automation.autoStart">Idle — will auto-start when input is available</span>
            <template v-else>
              <span>Idle{{ stage.inputKey ? ` — needs ${RESOURCE_LABELS[stage.inputKey] ?? stage.inputKey}` : '' }}</span>
              <button :disabled="!inputAvailable" @click="doStartBatch">
                Start batch
              </button>
            </template>
          </template>
          <template v-else-if="building.slot.status === 'processing'">
            <span>Processing {{ Math.floor(building.slot.batchSize) }} units — {{ formatDuration(slotRemainingSeconds) }} left</span>
          </template>
          <template v-else-if="building.slot.status === 'ready'">
            <span class="ready">
              ● Ready to collect: {{ Math.floor(building.slot.batchSize) }} {{ RESOURCE_LABELS[stage.outputKey] ?? 'units' }}
            </span>
            <span v-if="automation.autoCollect" class="note">Auto-collecting…</span>
            <button v-else @click="doCollectBatch">Collect</button>
          </template>
        </div>
        <p v-if="collectFeedback" class="note warn">
          <Icon name="mdi:alert-outline" /> {{ collectFeedback }}
        </p>
        <p class="automation-hint">
          <span :class="{ unlocked: automation.autoCollect }">
            {{ automation.autoCollect ? '✓' : `Lv ${AUTO_COLLECT_LEVEL}` }} Auto-collect
          </span>
          &middot;
          <span :class="{ unlocked: automation.autoStart }">
            {{ automation.autoStart ? '✓' : `Lv ${AUTO_START_LEVEL}` }} Auto-start
          </span>
        </p>
      </section>

      <section v-if="building.type === 'distribution'" class="fleet-section">
        <h4>Fleet</h4>
        <DistributionPanel />
      </section>

      <section class="upgrade-section">
        <h4>Upgrade</h4>
        <template v-if="isMaxLevel">
          <p class="note">Max level reached.</p>
        </template>
        <template v-else-if="building.upgrade">
          <p class="note">Upgrading to Lv {{ building.upgrade.targetLevel }} — {{ formatDuration(upgradeRemainingSeconds) }} left</p>
        </template>
        <template v-else-if="gatedByTownHall">
          <p class="note warn">Requires Town Hall level {{ maxAllowedLevel + 1 }}</p>
        </template>
        <template v-else>
          <button :disabled="!canAffordUpgrade" @click="doUpgrade">
            <Icon name="mdi:arrow-up-bold-circle-outline" />
            Upgrade to Lv {{ upgradePlan.targetLevel }} — ${{ formatCompactNumber(upgradePlan.cost) }}
            ({{ formatDuration(upgradePlan.durationSeconds) }})
          </button>
          <button v-if="showSingleLevelOption" class="secondary" :disabled="!canAffordSingleLevel" @click="doSingleLevelUpgrade">
            <Icon name="mdi:chevron-up" />
            Just Lv {{ singleLevelPlan.targetLevel }} — ${{ formatCompactNumber(singleLevelPlan.cost) }}
            ({{ formatDuration(singleLevelPlan.durationSeconds) }})
          </button>
          <div v-if="upgradePreviewRows.length" class="upgrade-preview">
            <span class="preview-title">This upgrade brings:</span>
            <div class="stat-row" v-for="row in upgradePreviewRows" :key="row.label">
              <span class="stat-label">{{ row.label }}</span>
              <span class="stat-value">{{ row.from }} → {{ row.to }}</span>
            </div>
          </div>
          <p v-if="isPartialCatchUp" class="note">
            Affordable now — Town Hall allows up to Lv {{ upgradeCapLevel }}
          </p>
        </template>
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

  // Bottom sheet on mobile instead of a floating centered card.
  @include mobile {
    align-items: flex-end;
  }
}

.panel {
  width: 320px;
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
  background: var(--swatch);
  color: rgba(255, 255, 255, 0.95);
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

.description {
  margin: 0;
  font-size: 0.8rem;
  color: $color-text-muted;
}

section {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;

  h4 {
    margin: 0;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: $color-text-muted;
  }
}

.stat-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: $spacing-sm;
  font-size: 0.8rem;
}

.stat-label {
  color: $color-text-muted;
}

.stat-value {
  font-weight: 600;
}

.upgrade-preview {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: $spacing-sm;
  border: 1px dashed $color-panel-border;
  border-radius: $radius-sm;

  .preview-title {
    font-size: 0.72rem;
    color: $color-text-muted;
    margin-bottom: 2px;
  }

  .stat-value {
    color: $color-money;
  }
}

.slot-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-sm;
  font-size: 0.85rem;
  flex-wrap: wrap;

  .ready {
    color: $color-money;
  }
}

.automation-hint {
  margin: 0;
  font-size: 0.7rem;
  color: $color-text-muted;

  .unlocked {
    color: $color-money;
  }
}

.note {
  margin: 0;
  font-size: 0.85rem;
  color: $color-text-muted;

  &.warn {
    color: $color-danger;
  }
}

button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-xs;
  font: inherit;
  font-size: 0.82rem;
  padding: $spacing-sm;
  border-radius: $radius-sm;
  border: 1px solid $color-panel-border;
  background: rgba(212, 169, 74, 0.12);
  color: $color-text;
  cursor: pointer;
  min-height: 40px;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: transparent;
  }

  &.secondary {
    font-size: 0.76rem;
    min-height: 34px;
    background: transparent;
    color: $color-text-muted;
  }
}
</style>
