<script setup>
import { computed } from 'vue'
import { useGameStore } from '~/stores/game.js'
import { formatDuration } from '#game/util/time.js'
import { formatCompactNumber } from '#game/util/format.js'

const store = useGameStore()

const earnings = computed(() => store.offlineEarnings)

const awaySummary = computed(() => {
  if (!earnings.value) return ''
  return formatDuration(earnings.value.elapsedSeconds)
})

function dismiss() {
  store.offlineEarnings = null
}
</script>

<template>
  <div v-if="earnings" class="panel-backdrop" @click.self="dismiss">
    <div class="panel">
      <span class="header-icon"><Icon name="mdi:cigar" /></span>
      <h3>Welcome back!</h3>
      <p class="note">You were away for {{ awaySummary }}.</p>
      <p class="earned">
        <Icon name="mdi:cash-multiple" />
        +${{ formatCompactNumber(earnings.moneyEarned) }}
      </p>
      <p class="note">from {{ formatCompactNumber(earnings.cigarsSold) }} cigars automatically rolled and sold.</p>
      <button @click="dismiss">Nice</button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '~/assets/scss/variables' as *;

.panel-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 30;
}

.panel {
  width: 300px;
  max-width: 90vw;
  background: $color-panel;
  border: 1px solid $color-panel-border;
  border-radius: $radius-md;
  padding: $spacing-lg;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-sm;
  text-align: center;

  h3 {
    margin: 0;
  }
}

.note {
  margin: 0;
  font-size: 0.85rem;
  color: $color-text-muted;
}

.header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(212, 169, 74, 0.15);
  color: $color-accent;
  font-size: 1.5rem;
}

.earned {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  margin: 0;
  font-size: 1.6rem;
  font-weight: 700;
  color: $color-money;
}

button {
  margin-top: $spacing-sm;
  font: inherit;
  padding: $spacing-sm $spacing-lg;
  border-radius: $radius-sm;
  border: 1px solid $color-panel-border;
  background: rgba(212, 169, 74, 0.12);
  color: $color-text;
  cursor: pointer;
  min-height: 44px;
  min-width: 120px;
}
</style>
