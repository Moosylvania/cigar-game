<script setup>
import { computed } from 'vue'
import { useGameStore } from '~/stores/game.js'
import { getDecorationDefinition } from '#game/config/decorations.config.js'

const props = defineProps({
  instanceId: { type: String, required: true }
})
const emit = defineEmits(['close'])
const store = useGameStore()

const decoration = computed(() => store.decorations.find((d) => d.id === props.instanceId) ?? null)
const definition = computed(() => (decoration.value ? getDecorationDefinition(decoration.value.decorationId) : null))

function remove() {
  if (!decoration.value) return
  store.removeDecoration(decoration.value.id)
  emit('close')
}
</script>

<template>
  <div v-if="definition" class="panel-backdrop" @click.self="emit('close')">
    <div class="panel">
      <div class="panel-header">
        <h3>{{ definition.name }}</h3>
        <button class="close" @click="emit('close')"><Icon name="mdi:close" /></button>
      </div>
      <p class="detail">{{ definition.description }}</p>
      <button class="remove-btn" @click="remove"><Icon name="mdi:delete-outline" /> Remove</button>
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
}

.panel {
  width: 320px;
  max-width: 90vw;
  background: $color-panel;
  border: 1px solid $color-panel-border;
  border-radius: $radius-md;
  padding: $spacing-md;
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
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

.detail {
  margin: 0;
  font-size: 0.8rem;
  color: $color-text-muted;
}

.remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font: inherit;
  font-size: 0.82rem;
  padding: $spacing-sm;
  border-radius: $radius-sm;
  border: 1px solid $color-danger;
  background: rgba(209, 106, 90, 0.15);
  color: $color-text;
  cursor: pointer;

  &:hover {
    background: rgba(209, 106, 90, 0.28);
  }
}
</style>
