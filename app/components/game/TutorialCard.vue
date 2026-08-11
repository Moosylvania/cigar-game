<script setup>
import { computed, watch } from 'vue'
import { useGameStore } from '~/stores/game.js'
import { TUTORIAL_STEPS, BUILDING_LEGEND } from '#game/config/tutorial.config.js'

const store = useGameStore()

const stepIndex = computed(() => store.tutorial.currentStep)
const step = computed(() => store.currentTutorialStep)
const isFirstStep = computed(() => stepIndex.value <= 0)
const isLastStep = computed(() => stepIndex.value >= TUTORIAL_STEPS.length - 1)
const isAutoStep = computed(() => typeof step.value?.isComplete === 'function')
const isComplete = computed(() => store.isCurrentTutorialStepComplete)

// Auto-advance shortly after the tracked condition is met, so the player
// sees a brief "done" state instead of the card vanishing the instant they
// collect - same brief-confirmation pattern as the Store's purchase toast.
let advanceTimeout = null
watch(isComplete, (complete) => {
  if (!complete) return
  clearTimeout(advanceTimeout)
  advanceTimeout = setTimeout(() => store.nextTutorialStep(), 900)
})

function next() {
  clearTimeout(advanceTimeout)
  store.nextTutorialStep()
}

function previous() {
  clearTimeout(advanceTimeout)
  store.previousTutorialStep()
}

function skip() {
  clearTimeout(advanceTimeout)
  store.skipTutorial()
}

function skipTimer() {
  store.skipAllTimers()
}
</script>

<template>
  <div v-if="store.isTutorialVisible && step" class="tutorial-card" :class="{ complete: isComplete }">
    <div class="header">
      <span class="step-count">Step {{ stepIndex + 1 }} / {{ TUTORIAL_STEPS.length }}</span>
      <button class="skip" @click="skip">Skip tutorial</button>
    </div>

    <h4>{{ step.title }}</h4>
    <p class="body">{{ step.body }}</p>

    <div v-if="step.id === 'welcome'" class="legend">
      <div v-for="entry in BUILDING_LEGEND" :key="entry.type" class="legend-row">
        <span class="legend-icon"><Icon :name="entry.icon" /></span>
        <div class="legend-info">
          <span class="legend-name">{{ entry.displayName }}</span>
          <span class="legend-desc">{{ entry.description }}</span>
        </div>
      </div>
    </div>

    <div v-if="isAutoStep && !isComplete" class="auto-row">
      <p class="hint">
        <Icon name="mdi:cursor-default-click-outline" /> Do this in the game to continue automatically.
      </p>
      <button v-if="store.hasActiveTimers" class="skip-timer" title="Instantly finish any batch or upgrade currently in progress" @click="skipTimer">
        <Icon name="mdi:fast-forward" /> Skip Timer
      </button>
    </div>
    <p v-else-if="isComplete" class="hint done">
      <Icon name="mdi:check-circle-outline" /> Nice - moving on...
    </p>

    <div class="actions">
      <button class="previous" :disabled="isFirstStep" @click="previous">Previous</button>
      <button class="next" @click="next">{{ isLastStep ? 'Finish' : isAutoStep ? 'Skip this step' : 'Next' }}</button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '~/assets/scss/variables' as *;

.tutorial-card {
  position: absolute;
  left: $spacing-md;
  bottom: $spacing-md;
  width: 460px;
  max-width: calc(100vw - #{$spacing-md} * 2);
  max-height: 78vh;
  overflow-y: auto;
  background: $color-panel;
  border: 2px solid $color-accent;
  border-radius: $radius-md;
  padding: $spacing-lg;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  z-index: 25;
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  transition: border-color 0.2s ease;

  &.complete {
    border-color: $color-money;
  }

  @include mobile {
    left: $spacing-sm;
    right: $spacing-sm;
    bottom: $spacing-sm;
    width: auto;
    padding: $spacing-md;
  }
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.step-count {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: $color-text-muted;
}

.skip {
  font: inherit;
  font-size: 0.88rem;
  background: none;
  border: none;
  color: $color-text-muted;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;

  &:hover {
    color: $color-text;
  }
}

h4 {
  margin: 0;
  font-size: 1.35rem;
}

.body {
  margin: 0;
  font-size: 1.05rem;
  color: $color-text-muted;
  line-height: 1.45;
}

.legend {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  margin-top: $spacing-xs;
  padding-top: $spacing-sm;
  border-top: 1px solid $color-panel-border;
}

.legend-row {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.legend-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: $radius-sm;
  background: rgba(255, 255, 255, 0.08);
  color: $color-accent;
  font-size: 1.15rem;
  flex-shrink: 0;
}

.legend-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.legend-name {
  font-size: 1rem;
  font-weight: 600;
}

.legend-desc {
  font-size: 0.9rem;
  color: $color-text-muted;
}

.auto-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-sm;
  margin-top: $spacing-xs;
  flex-wrap: wrap;
}

.hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: $spacing-xs 0 0;
  font-size: 0.92rem;
  color: $color-accent;

  &.done {
    color: $color-money;
  }
}

.auto-row .hint {
  margin: 0;
  flex: 1;
  min-width: 0;
}

.skip-timer {
  display: flex;
  align-items: center;
  gap: 4px;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  border: 1px solid $color-accent;
  background: rgba(212, 169, 74, 0.15);
  color: $color-accent;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;

  &:hover {
    background: rgba(212, 169, 74, 0.28);
  }
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-sm;
  margin-top: $spacing-sm;
}

.previous,
.next {
  font: inherit;
  font-size: 0.95rem;
  padding: $spacing-sm $spacing-lg;
  border-radius: $radius-sm;
  border: 1px solid $color-panel-border;
  cursor: pointer;
}

.previous {
  background: transparent;
  color: $color-text-muted;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.06);
    color: $color-text;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.next {
  background: rgba(212, 169, 74, 0.12);
  color: $color-text;

  &:hover {
    background: rgba(212, 169, 74, 0.22);
  }
}
</style>
