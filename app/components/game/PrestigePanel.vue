<script setup>
import { computed, ref } from 'vue'
import { useGameStore } from '~/stores/game.js'
import { formatCompactNumber, formatMultiplier } from '#game/util/format.js'

const emit = defineEmits(['close'])
const store = useGameStore()

// null = no pending confirmation; 'prestige' = plain reset+bank; 'advance'
// = reset+bank AND move up into the next eligible tier. Two distinct
// actions rather than one, so earning enough for the next tier never
// silently moves the player into it - they have to choose to.
const pendingAction = ref(null)
const feedback = ref(null)

const dollarsPreview = computed(() => store.lifetimeMoneyEarnedThisRun)
const canPrestigeResult = computed(() => store.canPrestige)
const canAdvanceResult = computed(() => store.canAdvanceTier)
const nextEligibleTier = computed(() => store.prestigeTiers.find((row) => row.eligible)?.tier ?? null)

const totalMultiplierLabel = computed(() => formatMultiplier(store.totalPrestigeMultiplier))

function requestPrestige() {
  if (!canPrestigeResult.value.ok) return
  pendingAction.value = 'prestige'
}

function requestAdvance() {
  if (!canAdvanceResult.value.ok) return
  pendingAction.value = 'advance'
}

function cancelAction() {
  pendingAction.value = null
}

function showFeedback(message) {
  feedback.value = message
  setTimeout(() => {
    if (feedback.value === message) feedback.value = null
  }, 3200)
}

function confirmAction() {
  if (pendingAction.value === 'advance') {
    const result = store.advanceTier()
    pendingAction.value = null
    if (!result.ok) return
    showFeedback(`Advanced to ${result.newTierName}! Your farm has reset.`)
  } else {
    const result = store.doPrestige()
    pendingAction.value = null
    if (!result.ok) return
    showFeedback(`Prestiged! +$${formatCompactNumber(result.dollarsEarned)} added to your all-time total.`)
  }
}
</script>

<template>
  <div class="panel-backdrop" @click.self="emit('close')">
    <div class="panel">
      <div class="panel-header">
        <span class="header-icon"><Icon name="mdi:crown" /></span>
        <h3>Prestige</h3>
        <button class="close" @click="emit('close')"><Icon name="mdi:close" /></button>
      </div>

      <p class="feedback" :class="{ visible: feedback }">{{ feedback || '&nbsp;' }}</p>

      <div class="overview">
        <div class="overview-row">
          <span class="overview-label">Total money multiplier</span>
          <span class="overview-value">{{ totalMultiplierLabel }}</span>
        </div>
        <div class="overview-row">
          <span class="overview-label">This run's lifetime earnings</span>
          <span class="overview-value">${{ formatCompactNumber(store.lifetimeMoneyEarnedThisRun) }}</span>
        </div>
        <div class="overview-row">
          <span class="overview-label">All-time earnings (across every prestige)</span>
          <span class="overview-value highlight">${{ formatCompactNumber(store.prestige.lifetimeMoneyEarnedAllTime) }}</span>
        </div>
        <div class="overview-row">
          <span class="overview-label">Times prestiged</span>
          <span class="overview-value">{{ store.prestige.totalPrestigeCount }}</span>
        </div>

        <p class="explainer">
          Prestiging resets your farm - buildings, money, land, and Lab research all go back to
          the start - in exchange for adding this run's earnings to your all-time total, which
          multiplies all future money earned forever. Your tier never changes just from earning
          enough - once a tier's threshold is reached it becomes available below, but moving up
          into it (and resetting again) is your call.
        </p>

        <template v-if="!pendingAction">
          <button class="prestige-btn" :disabled="!canPrestigeResult.ok" @click="requestPrestige">
            <Icon name="mdi:crown" />
            {{ canPrestigeResult.ok ? `Prestige Now (+$${formatCompactNumber(dollarsPreview)})` : 'Not enough progress yet' }}
          </button>
          <button v-if="nextEligibleTier" class="advance-btn" @click="requestAdvance">
            <Icon name="mdi:arrow-up-bold-circle-outline" />
            Advance to {{ nextEligibleTier.name }} (resets your farm)
          </button>
        </template>
        <template v-else-if="pendingAction === 'prestige'">
          <div class="confirm-row">
            <span>Reset your farm, adding +${{ formatCompactNumber(dollarsPreview) }} to your all-time total?</span>
            <div class="confirm-buttons">
              <button class="confirm" @click="confirmAction">Confirm</button>
              <button class="cancel" @click="cancelAction">Cancel</button>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="confirm-row">
            <span>Reset your farm and move up to {{ nextEligibleTier?.name }}? Every tier below stays locked in at its current bonus.</span>
            <div class="confirm-buttons">
              <button class="confirm" @click="confirmAction">Confirm</button>
              <button class="cancel" @click="cancelAction">Cancel</button>
            </div>
          </div>
        </template>
      </div>

      <div class="section">
        <h4>Prestige Tiers</h4>
        <div class="variety-list">
          <div
            v-for="row in store.prestigeTiers"
            :key="row.tier.id"
            class="variety-row"
            :class="{ locked: !row.unlocked, active: row.active, eligible: row.eligible }"
          >
            <span class="variety-icon" :style="{ background: row.unlocked ? `${row.tier.color}33` : undefined, color: row.unlocked ? row.tier.color : undefined }">
              <Icon :name="row.unlocked ? row.tier.icon : row.eligible ? 'mdi:arrow-up-bold-circle-outline' : 'mdi:lock-outline'" />
            </span>
            <div class="info">
              <div class="title-line">
                <span class="name">{{ row.tier.name }}</span>
                <span v-if="row.unlocked" class="multiplier">{{ formatMultiplier(row.multiplier) }}</span>
                <span v-else-if="row.eligible" class="multiplier eligible-label">Ready!</span>
              </div>
              <span class="detail">{{ row.tier.description }}</span>
              <div v-if="row.bandWidth" class="progress-track">
                <div class="progress-fill" :style="{ width: `${row.progress * 100}%`, background: row.tier.color }" />
              </div>
              <span v-if="row.unlocked" class="points">${{ formatCompactNumber(row.earnedInBand) }}<template v-if="row.bandWidth"> / ${{ formatCompactNumber(row.bandWidth) }} to next tier</template></span>
              <span v-else-if="row.eligible" class="points eligible-label">Earned enough - advance above when you're ready</span>
              <span v-else class="points locked-label">Locked - unlocks at ${{ formatCompactNumber(row.unlockAt) }} all-time earnings</span>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <h4>Trophies</h4>
        <div class="trophy-grid">
          <div v-for="row in store.trophyRows" :key="row.trophy.id" class="trophy" :class="{ locked: !row.unlocked }" :title="row.trophy.description">
            <Icon :name="row.unlocked ? row.trophy.icon : 'mdi:trophy-outline'" />
            <span class="trophy-name">{{ row.trophy.name }}</span>
          </div>
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
  width: 520px;
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
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.feedback {
  margin: -$spacing-sm 0 0;
  font-size: 0.78rem;
  color: $color-money;
  min-height: 1em;
  opacity: 0;
  transition: opacity 0.2s ease;

  &.visible {
    opacity: 1;
  }
}

.overview {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: $spacing-sm;
  border: 1px solid $color-panel-border;
  border-radius: $radius-sm;
  background: rgba(212, 169, 74, 0.05);
}

.overview-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.82rem;
}

.overview-label {
  color: $color-text-muted;
}

.overview-value {
  font-weight: 600;

  &.highlight {
    color: $color-money;
  }
}

.explainer {
  margin: $spacing-xs 0 0;
  font-size: 0.74rem;
  color: $color-text-muted;
  line-height: 1.4;
}

.prestige-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: $spacing-sm;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  padding: $spacing-sm;
  border-radius: $radius-sm;
  border: 1px solid $color-accent;
  background: rgba(212, 169, 74, 0.2);
  color: $color-accent;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.advance-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: $spacing-sm;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  padding: $spacing-sm;
  border-radius: $radius-sm;
  border: 1px solid $color-money;
  background: rgba(123, 201, 111, 0.18);
  color: $color-money;
  cursor: pointer;

  &:hover {
    background: rgba(123, 201, 111, 0.28);
  }
}

.confirm-row {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  margin-top: $spacing-sm;
  padding: $spacing-sm;
  border-radius: $radius-sm;
  border: 1px dashed $color-danger;
  font-size: 0.82rem;
  text-align: center;
}

.confirm-buttons {
  display: flex;
  gap: $spacing-sm;

  button {
    flex: 1;
    font: inherit;
    font-size: 0.8rem;
    font-weight: 600;
    padding: $spacing-xs;
    border-radius: $radius-sm;
    cursor: pointer;

    &.confirm {
      border: 1px solid $color-danger;
      background: rgba(209, 106, 90, 0.2);
      color: $color-text;
    }

    &.cancel {
      border: 1px solid $color-panel-border;
      background: transparent;
      color: $color-text-muted;
    }
  }
}

.section {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;

  h4 {
    margin: 0;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: $color-text-muted;
  }
}

.variety-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.variety-row {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm;
  border: 1px solid $color-panel-border;
  border-radius: $radius-sm;

  &.active {
    border-color: $color-accent;
  }

  &.locked {
    opacity: 0.55;
  }

  // Comes after .locked so it wins on opacity - an eligible tier is
  // technically still "locked" (not yet selected), but should read as
  // exciting/ready rather than dimmed out.
  &.eligible {
    opacity: 1;
    border-color: $color-money;
    border-style: dashed;
  }
}

.variety-icon {
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
  justify-content: space-between;
  gap: $spacing-sm;

  .name {
    font-size: 0.88rem;
  }

  .multiplier {
    font-size: 0.78rem;
    font-weight: 600;
    color: $color-money;
  }
}

.detail {
  font-size: 0.72rem;
  color: $color-text-muted;
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
}

.points {
  font-size: 0.7rem;
  color: $color-text-muted;

  &.locked-label {
    font-style: italic;
  }

  &.eligible-label {
    color: $color-money;
    font-weight: 600;
    font-style: normal;
  }
}

.multiplier.eligible-label {
  color: $color-money;
}

.trophy-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: $spacing-xs;
}

.trophy {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: $spacing-sm $spacing-xs;
  border: 1px solid $color-panel-border;
  border-radius: $radius-sm;
  font-size: 1.3rem;
  color: $color-accent;
  text-align: center;

  &.locked {
    opacity: 0.4;
    color: $color-text-muted;
  }

  .trophy-name {
    font-size: 0.66rem;
    color: $color-text;
    line-height: 1.2;
  }

  &.locked .trophy-name {
    color: $color-text-muted;
  }
}
</style>
