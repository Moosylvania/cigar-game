<script setup>
import { computed } from 'vue'
import { useGameStore } from '~/stores/game.js'
import { BUILDING_CONFIGS } from '#game/config/buildings/index.js'

const props = defineProps({
  activeType: { type: String, default: null }
})
const emit = defineEmits(['select'])

const store = useGameStore()

const placeableTypes = ['nursery', 'field', 'curing', 'steam', 'fermentation', 'rolling', 'distribution']

const items = computed(() =>
  placeableTypes.map((type) => {
    const config = BUILDING_CONFIGS[type]
    const cost = config.levels[0].upgradeCost
    const alreadyPlaced = type === 'distribution' && store.buildings.some((b) => b.type === type)
    return { type, config, cost, disabled: alreadyPlaced || store.money < cost }
  })
)

function toggle(type) {
  emit('select', props.activeType === type ? null : type)
}
</script>

<template>
  <div class="build-menu">
    <button
      v-for="item in items"
      :key="item.type"
      class="build-item"
      :class="{ active: activeType === item.type }"
      :disabled="item.disabled"
      :style="{ '--swatch': item.config.color }"
      @click="toggle(item.type)"
    >
      <span class="swatch"><Icon :name="item.config.icon" /></span>
      <span class="name">{{ item.config.displayName }}</span>
      <span class="cost">${{ item.cost.toLocaleString() }}</span>
    </button>
  </div>
</template>

<style lang="scss" scoped>
@use '~/assets/scss/variables' as *;

.build-menu {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  padding: $spacing-md;
  background: $color-panel;
  border-right: 1px solid $color-panel-border;
  overflow-y: auto;

  @include mobile {
    flex-direction: row;
    gap: $spacing-sm;
    padding: $spacing-sm;
    padding-right: $spacing-lg;
    border-right: none;
    border-top: 1px solid $color-panel-border;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    @include hide-scrollbar;
    @include scroll-fade-right;
  }
}

.build-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm;
  background: transparent;
  border: 1px solid $color-panel-border;
  border-radius: $radius-sm;
  color: $color-text;
  cursor: pointer;
  text-align: left;
  font: inherit;
  min-height: 44px;

  &:hover:not(:disabled) {
    border-color: $color-accent;
  }

  &.active {
    border-color: $color-accent;
    background: rgba(212, 169, 74, 0.12);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  @include mobile {
    flex-direction: column;
    justify-content: center;
    gap: 2px;
    min-width: 76px;
    flex-shrink: 0;
    text-align: center;
    padding: $spacing-xs;
  }
}

.swatch {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: $radius-sm;
  background: var(--swatch);
  color: rgba(255, 255, 255, 0.95);
  flex-shrink: 0;
  font-size: 1rem;
}

.name {
  flex: 1;
  font-size: 0.85rem;

  @include mobile {
    flex: none;
    font-size: 0.7rem;
    line-height: 1.15;
  }
}

.cost {
  font-size: 0.8rem;
  color: $color-text-muted;

  @include mobile {
    font-size: 0.68rem;
  }
}
</style>
