<script setup>
import { computed, ref } from 'vue'
import { useGameStore } from '~/stores/game.js'

const emit = defineEmits(['close'])
const store = useGameStore()

const confirming = ref(false)
const feedback = ref(null)

const pointsPreview = computed(() => store.prestigePointsPreview)
const canPrestigeResult = computed(() => store.canPrestige)

function formatMultiplier(value) {
  if (value < 1000) return `${value.toFixed(value < 10 ? 2 : 1)}x`
  if (value < 1e6) return `${(value / 1000).toFixed(1)}Kx`
  return `${value.toExponential(2)}x`
}

const totalMultiplierLabel = computed(() => formatMultiplier(store.totalPrestigeMultiplier))

function requestPrestige() {
  if (!canPrestigeResult.value.ok) return
  confirming.value = true
}

function cancelPrestige() {
  confirming.value = false
}

function confirmPrestige() {
  const result = store.doPrestige()
  confirming.value = false
  if (!result.ok) return
  const varietyName = store.tobaccoVarieties.find((v) => v.variety.id === result.varietyId)?.variety.name
  feedback.value = result.unlockedNewVariety
    ? `Prestiged! +${result.pointsEarned} ${varietyName} points - new tobacco tier unlocked!`
    : `Prestiged! +${result.pointsEarned} ${varietyName} points.`
  setTimeout(() => {
    if (feedback.value) feedback.value = null
  }, 3200)
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
          <span class="overview-value">${{ Math.floor(store.lifetimeMoneyEarnedThisRun).toLocaleString() }}</span>
        </div>
        <div class="overview-row">
          <span class="overview-label">Prestige points if you prestige now</span>
          <span class="overview-value highlight">+{{ pointsPreview.toLocaleString() }}</span>
        </div>
        <div class="overview-row">
          <span class="overview-label">Times prestiged</span>
          <span class="overview-value">{{ store.prestige.totalPrestigeCount }}</span>
        </div>

        <p class="explainer">
          Prestiging resets your farm - buildings, money, land, and Lab research all go back to
          the start - in exchange for permanent tobacco points, which multiply all future money
          earned forever. Points always go to your currently active tobacco variety below.
        </p>

        <template v-if="!confirming">
          <button class="prestige-btn" :disabled="!canPrestigeResult.ok" @click="requestPrestige">
            <Icon name="mdi:crown" />
            {{ canPrestigeResult.ok ? `Prestige Now (+${pointsPreview.toLocaleString()} points)` : 'Not enough progress yet' }}
          </button>
        </template>
        <template v-else>
          <div class="confirm-row">
            <span>Reset your farm for +{{ pointsPreview.toLocaleString() }} points?</span>
            <div class="confirm-buttons">
              <button class="confirm" @click="confirmPrestige">Confirm</button>
              <button class="cancel" @click="cancelPrestige">Cancel</button>
            </div>
          </div>
        </template>
      </div>

      <div class="section">
        <h4>Tobacco Varieties</h4>
        <div class="variety-list">
          <div
            v-for="row in store.tobaccoVarieties"
            :key="row.variety.id"
            class="variety-row"
            :class="{ locked: !row.unlocked, active: row.active }"
          >
            <span class="variety-icon" :style="{ background: row.unlocked ? `${row.variety.color}33` : undefined, color: row.unlocked ? row.variety.color : undefined }">
              <Icon :name="row.unlocked ? row.variety.icon : 'mdi:lock-outline'" />
            </span>
            <div class="info">
              <div class="title-line">
                <span class="name">{{ row.variety.name }}</span>
                <span v-if="row.unlocked" class="multiplier">{{ formatMultiplier(row.multiplier) }}</span>
              </div>
              <span class="detail">{{ row.variety.description }}</span>
              <div v-if="row.unlocked && Number.isFinite(row.variety.unlockThreshold)" class="progress-track">
                <div class="progress-fill" :style="{ width: `${row.progress * 100}%`, background: row.variety.color }" />
              </div>
              <span v-if="row.unlocked" class="points">{{ Math.floor(row.points).toLocaleString() }}<template v-if="Number.isFinite(row.variety.unlockThreshold)"> / {{ row.variety.unlockThreshold.toLocaleString() }} to next tier</template></span>
              <span v-else class="points locked-label">Locked</span>
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
