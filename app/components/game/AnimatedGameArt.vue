<script setup>
import { useGameStore } from '~/stores/game.js'
import { getResourceLots } from '#game/engine/tobaccoEngine.js'
import { TOBACCO_VARIETIES } from '#game/config/tobacco.config.js'
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { subscribeArtFrame } from '~/composables/useArtFrames.js'
import { drawIllustratedBuilding } from './renderers/illustratedBuildings.js'
import { drawDecoration } from './renderers/decorationSprites.js'
import { drawVehicleSprite } from './renderers/vehicleSprites.js'
import { drawConstruction, drawParcel } from './renderers/worldEffects.js'

const props = defineProps({
  kind: { type: String, default: 'building' },
  type: { type: String, default: 'nursery' },
  level: { type: Number, default: 1 },
  status: { type: String, default: 'idle' },
  theme: { type: String, default: 'backyard' },
  upgrading: Boolean
})
const store = useGameStore()
const canvas = ref(null)
let unsubscribe, observer
let visible = true

onMounted(() => {
  const ctx = canvas.value.getContext('2d')
  const rect = { x: 0, y: 0, width: 160, height: 160 }
  const paint = (time) => {
    if (!visible) return
    ctx.clearRect(0, 0, 160, 160)
    if (props.kind === 'vehicle') drawVehicleSprite(ctx, props.type, 'e', rect, time)
    else if (props.kind === 'decoration') drawDecoration(ctx, props.type, rect, time, props.theme)
    else if (props.kind === 'parcel') drawParcel(ctx, 80, 90, 82, time)
    else {
      const lots = props.type === 'distribution' ? getResourceLots(store.game, 'cigars') : {}
      const cargoColors = [...TOBACCO_VARIETIES].reverse().filter(v => lots[v.id] > 0).map(v => v.color)
      drawIllustratedBuilding(ctx, { cargoColors, type: props.type, level: props.level, slot: { status: props.status }, upgrade: props.upgrading }, rect, time, props.theme)
      if (props.upgrading) drawConstruction(ctx, rect, time)
    }
  }
  paint(0)
  observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting })
  observer.observe(canvas.value)
  unsubscribe = subscribeArtFrame(paint)
})
onBeforeUnmount(() => { unsubscribe?.(); observer?.disconnect() })
</script>

<template>
  <canvas ref="canvas" class="animated-game-art" width="160" height="160" aria-hidden="true" />
</template>

<style scoped>
.animated-game-art { display: block; width: 100%; height: 100%; object-fit: contain; flex-shrink: 0; }
</style>
