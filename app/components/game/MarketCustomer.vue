<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { subscribeArtFrame } from '~/composables/useArtFrames.js'
import { MARKET_CUSTOMERS } from '#game/engine/marketEngine.js'
const props = defineProps({ customer: { type: Number, required: true }, completed: Boolean })
const canvas = ref(null)
let unsubscribe
onMounted(() => {
  const ctx = canvas.value.getContext('2d')
  function paint(time) {
    const color = MARKET_CUSTOMERS[props.customer].color
    const t = time ? time / 700 + props.customer : 0
    ctx.clearRect(0, 0, 120, 120)
    ctx.save(); ctx.translate(0, Math.sin(t) * 1.5)
    ctx.strokeStyle = '#294844'; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.lineCap = 'round'
    const box = (x, y, w, h, fill, r = 4) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); ctx.stroke() }
    const line = (x, y, a, b) => { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(a, b); ctx.stroke() }
    box(34, 78, 20, 30, '#71918e'); box(64, 78, 20, 30, '#71918e')
    box(30, 51, 57, 43, color, 12)
    box(42, 20, 34, 35, '#eee3bc', 12)
    // Neutral stylized faces, matching the town workers' cream features.
    const blink = time && (time + props.customer * 530) % 4700 < 160
    for (const x of [52, 66]) { if (blink) line(x - 2, 35, x + 2, 35); else box(x - 1, 33, 2, 4, '#294844', 1) }
    ctx.beginPath(); ctx.arc(59, 40, 6, 0.2, Math.PI - 0.2); ctx.stroke()
    if (props.customer % 3 === 0) { box(37, 17, 44, 9, color); box(46, 9, 26, 12, color) }
    else if (props.customer % 3 === 1) { box(40, 16, 38, 9, color); line(38, 24, 81, 24) }
    else { box(46, 9, 27, 15, '#eee9dc', 7); box(39, 19, 41, 7, '#eee9dc') }
    box(47, 60, 37, 38, '#eee3bc', 3); box(58, 57, 14, 6, '#91aaa0', 2)
    for (let y = 72; y < 92; y += 7) line(56, y, 75, y)
    box(76, 75, 12, 10, '#eee3bc', 5)
    ctx.save(); ctx.translate(34, 63); ctx.rotate(props.completed ? -0.7 + Math.sin(t * 2) * 0.18 : -0.18 + Math.sin(t) * 0.08)
    box(-13, -1, 16, 28, color, 6); box(-13, 21, 15, 11, '#eee3bc', 5)
    ctx.restore(); ctx.restore()
  }
  paint(0)
  unsubscribe = subscribeArtFrame(paint)
})
onBeforeUnmount(() => unsubscribe?.())
</script>
<template><canvas ref="canvas" width="120" height="120" class="customer-portrait" aria-hidden="true" /></template>
<style scoped>.customer-portrait { width: 100px; height: 100px; flex-shrink: 0; }</style>
