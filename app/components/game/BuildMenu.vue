<script setup>
import { computed } from 'vue'
import AnimatedGameArt from './AnimatedGameArt.vue'
import { useGameStore } from '~/stores/game.js'
import { BUILDING_CONFIGS } from '#game/config/buildings/index.js'
import { formatCompactNumber } from '#game/util/format.js'

const props = defineProps({
  activeType: { type: String, default: null }
})
const emit = defineEmits(['select'])

const store = useGameStore()

// Town Hall and Distribution are both placed for free at game start and
// can't be built again (there's only ever one of each) - only the
// pipeline buildings, which can be placed as many times as land allows,
// belong here.
const placeableTypes = ['nursery', 'field', 'curing', 'steam', 'fermentation', 'rolling']

const items = computed(() =>
  placeableTypes.map((type) => {
    const config = BUILDING_CONFIGS[type]
    const cost = config.levels[0].upgradeCost
    return { type, config, cost, disabled: store.money < cost }
  })
)

function toggle(type) {
  emit('select', props.activeType === type ? null : type)
}
</script>

<template>
  <div class="build-menu">
    <h2 class="build-heading"><Icon name="mdi:shovel" /> Build</h2>
    <button
      v-for="item in items"
      :key="item.type"
      class="build-item"
      :class="{ active: activeType === item.type }"
      :disabled="item.disabled"
      :aria-pressed="activeType === item.type"
      :style="{ '--swatch': item.config.color }"
      @click="toggle(item.type)"
    >
      <AnimatedGameArt class="building-art" :type="item.type" :theme="store.activeThemeId" />
      <span class="name">{{ item.config.displayName }}</span>
      <span class="cost">${{ formatCompactNumber(item.cost) }}</span>
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

.build-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 17px;
  margin: 0 0 10px;
  @include mobile { display: none; }
}

.building-art {
  width: 66px;
  height: 66px;
  object-fit: contain;
  flex-shrink: 0;
  @include mobile { width: 46px; height: 40px; }
}

.build-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  background: #f4f8f0;
  border: 1px solid $color-panel-border;
  border-radius: $radius-sm;
  color: $color-text;
  cursor: pointer;
  text-align: left;
  font: inherit;
  min-height: 44px;

  &:hover:not(:disabled) {
    border-color: $color-accent;
    background: #e3efe5;
  }

  &.active {
    border-color: $color-accent;
    background: rgba(212, 169, 74, 0.12);
  }

  &:disabled {
    opacity: 0.58;
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
  font-size: 0.8rem;
  font-weight: 700;

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
