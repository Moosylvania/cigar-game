<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useGameStore } from '~/stores/game.js'
import { useClock } from '~/composables/useClock.js'
import { drawGrid, screenToGrid } from './renderers/drawGrid.js'
import { drawBuilding, getStatusIndicatorHitbox } from './renderers/buildingGlyphs.js'
import { drawDecoration } from './renderers/decorationSprites.js'
import { MAX_REGION } from '#game/config/land.config.js'
import { getDecorationDefinition } from '#game/config/decorations.config.js'

const props = defineProps({
  placingType: { type: String, default: null },
  placingDecorationId: { type: String, default: null },
  editMode: { type: Boolean, default: false },
  expandMode: { type: Boolean, default: false },
  tutorialHighlightType: { type: String, default: null },
  tutorialDim: { type: Boolean, default: false }
})

const emit = defineEmits(['building-selected', 'decoration-selected', 'placed', 'place-failed'])

const store = useGameStore()
const { nowMs } = useClock()
const canvasRef = ref(null)
const containerRef = ref(null)

const TILE_SIZE = 48
const maxRegion = MAX_REGION

// Land is bought one tile at a time now (see land.config.js/landEngine.js),
// centered on the Town Hall's starting tile - drawing the *entire* possible
// territory out to maxRegion every time would swamp the view with locked
// tiles at low ring counts, so instead this shows a modest ring of "coming
// soon" locked/purchasable tiles around the current owned bounding box.
// Clamped to maxRegion on every side (not just the far side) since the
// bounding box can extend in the negative direction.
const LOCKED_PREVIEW_PADDING = 3

function getVisibleRegion() {
  const owned = store.ownedBounds
  return {
    x0: Math.max(maxRegion.x0, owned.x0 - LOCKED_PREVIEW_PADDING),
    y0: Math.max(maxRegion.y0, owned.y0 - LOCKED_PREVIEW_PADDING),
    x1: Math.min(maxRegion.x1, owned.x1 + LOCKED_PREVIEW_PADDING),
    y1: Math.min(maxRegion.y1, owned.y1 + LOCKED_PREVIEW_PADDING)
  }
}

let ctx = null
let rafId = null
let hoverGrid = null
let canvasWidth = 0
let canvasHeight = 0

// Camera: zoomLevel is relative to the auto "fit whole territory" scale
// (1 = fully zoomed out to fit, since there's no point zooming out further
// than that). panX/panY are extra pixel offsets on top of the auto-center.
let zoomLevel = 1
let panX = 0
let panY = 0
const MIN_ZOOM = 1
const MAX_ZOOM = 4

// Multi-touch tracking for pinch-to-zoom, keyed by pointerId -> {x, y}
// (canvas-relative). Pointer Events unify mouse/touch/pen so this same code
// path handles a trackpad pinch or two-finger touch identically.
const activePointers = new Map()
let pinchStartDistance = 0
let pinchStartZoom = 1

// Single-pointer interaction: distinguishes a tap/click (select or place a
// building) from a drag (pan the camera, or move a building in edit mode)
// by how far the pointer travels before release.
let singlePointerId = null
let pointerDownPos = null
let lastPanPos = null
let isPanning = false
const CLICK_THRESHOLD = 6

// Rearrange mode: positions are staged here (not written to the store)
// until the parent calls commitLayout(). Includes Town Hall - it can be
// dragged like any other building, subject to the same overlap/bounds checks.
let workingPositions = new Map()
let draggingId = null
let dragOffset = { x: 0, y: 0 }
let dragValid = true

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function baseCamera(zoom) {
  const visible = getVisibleRegion()
  const regionWidthTiles = visible.x1 - visible.x0 + 1
  const regionHeightTiles = visible.y1 - visible.y0 + 1
  const fitScale = Math.min(canvasWidth / (regionWidthTiles * TILE_SIZE), canvasHeight / (regionHeightTiles * TILE_SIZE))
  const scale = fitScale * zoom
  const usedWidth = regionWidthTiles * TILE_SIZE * scale
  const usedHeight = regionHeightTiles * TILE_SIZE * scale

  // Center on the owned bounding box's own midpoint, not the padded preview
  // region's midpoint - the preview ring gets clamped against maxRegion
  // near the outer edge of the map (see getVisibleRegion), which can make
  // it lopsided even though the owned area itself is always centered on
  // the Town Hall. Centering on the preview box in that situation would
  // drag the camera off the actual buildings toward whichever side still
  // has room to show locked tiles.
  const owned = store.ownedBounds
  const ownedCenterX = (owned.x0 + owned.x1 + 1) / 2
  const ownedCenterY = (owned.y0 + owned.y1 + 1) / 2
  const baseOffsetX = canvasWidth / 2 - ownedCenterX * TILE_SIZE * scale
  const baseOffsetY = canvasHeight / 2 - ownedCenterY * TILE_SIZE * scale

  return {
    scale,
    usedWidth,
    usedHeight,
    baseOffsetX,
    baseOffsetY,
    // Actual rendered screen-space bounds of the padded preview region,
    // for pan clamping below (not the same as baseOffsetX/Y once centering
    // is based on the unlocked region instead of the preview region).
    regionLeft: baseOffsetX + visible.x0 * TILE_SIZE * scale,
    regionTop: baseOffsetY + visible.y0 * TILE_SIZE * scale
  }
}

function computeCamera() {
  const { scale, baseOffsetX, baseOffsetY } = baseCamera(zoomLevel)
  return {
    scale,
    offsetX: baseOffsetX + panX,
    offsetY: baseOffsetY + panY
  }
}

/** Keeps at least a margin's worth of the territory on-screen so panning/zooming can't lose the grid entirely. */
function clampPan() {
  const { usedWidth, usedHeight, regionLeft, regionTop } = baseCamera(zoomLevel)
  const margin = 60

  const minPanX = margin - usedWidth - regionLeft
  const maxPanX = canvasWidth - margin - regionLeft
  panX = clamp(panX, Math.min(minPanX, maxPanX), Math.max(minPanX, maxPanX))

  const minPanY = margin - usedHeight - regionTop
  const maxPanY = canvasHeight - margin - regionTop
  panY = clamp(panY, Math.min(minPanY, maxPanY), Math.max(minPanY, maxPanY))
}

/** Adjusts pan so the world point currently under (screenX, screenY) stays there after zooming to targetZoom. */
function setZoomAt(screenX, screenY, targetZoom) {
  const before = computeCamera()
  const newZoom = clamp(targetZoom, MIN_ZOOM, MAX_ZOOM)
  const worldX = (screenX - before.offsetX) / before.scale
  const worldY = (screenY - before.offsetY) / before.scale
  zoomLevel = newZoom
  const after = computeCamera()
  panX += screenX - (after.offsetX + worldX * after.scale)
  panY += screenY - (after.offsetY + worldY * after.scale)
  clampPan()
}

function zoomAt(screenX, screenY, factor) {
  setZoomAt(screenX, screenY, zoomLevel * factor)
}

function zoomIn() {
  zoomAt(canvasWidth / 2, canvasHeight / 2, 1.35)
}

function zoomOut() {
  zoomAt(canvasWidth / 2, canvasHeight / 2, 1 / 1.35)
}

function resetView() {
  zoomLevel = 1
  panX = 0
  panY = 0
}

function positionFor(building) {
  if (props.editMode) {
    return workingPositions.get(building.id) ?? building.position
  }
  return building.position
}

function getBuildingRect(building, camera) {
  const config = store.getBuildingConfig(building.type)
  const position = positionFor(building)
  return {
    x: camera.offsetX + position.x * TILE_SIZE * camera.scale,
    y: camera.offsetY + position.y * TILE_SIZE * camera.scale,
    width: config.footprint.width * TILE_SIZE * camera.scale,
    height: config.footprint.height * TILE_SIZE * camera.scale
  }
}

function render() {
  if (!ctx) return
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  const camera = computeCamera()

  drawGrid(ctx, {
    maxRegion: getVisibleRegion(),
    ownedTileSet: store.ownedTileSet,
    tileSize: TILE_SIZE,
    camera,
    expandMode: props.expandMode,
    maxPurchasableRing: store.maxPurchasableRing
  })

  for (const decoration of store.decorations) {
    const definition = getDecorationDefinition(decoration.decorationId)
    if (!definition) continue
    const rect = {
      x: camera.offsetX + decoration.position.x * TILE_SIZE * camera.scale,
      y: camera.offsetY + decoration.position.y * TILE_SIZE * camera.scale,
      width: TILE_SIZE * camera.scale,
      height: TILE_SIZE * camera.scale
    }
    drawDecoration(ctx, definition.spriteFile, rect)
  }

  if ((props.placingType || props.placingDecorationId) && hoverGrid) {
    const px = camera.offsetX + hoverGrid.x * TILE_SIZE * camera.scale
    const py = camera.offsetY + hoverGrid.y * TILE_SIZE * camera.scale
    const size = TILE_SIZE * camera.scale
    ctx.fillStyle = 'rgba(212, 169, 74, 0.35)'
    ctx.fillRect(px, py, size, size)
  }

  const tilePx = TILE_SIZE * camera.scale
  for (const building of store.allBuildings) {
    const config = store.getBuildingConfig(building.type)
    const rect = getBuildingRect(building, camera)

    const isDragging = props.editMode && building.id === draggingId
    if (isDragging) ctx.globalAlpha = 0.7
    drawBuilding(ctx, building, config, rect, tilePx, nowMs.value)
    if (isDragging) {
      ctx.globalAlpha = 1
      ctx.strokeStyle = dragValid ? '#7bc96f' : '#d16a5a'
      ctx.lineWidth = 3
      ctx.strokeRect(rect.x - 2, rect.y - 2, rect.width + 4, rect.height + 4)
    }
  }

  if (props.tutorialDim) {
    const target = props.tutorialHighlightType
      ? store.allBuildings.find((b) => b.type === props.tutorialHighlightType)
      : null

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // A canvas has no real layers - erasing a hole in the dim overlay
    // would reveal nothing (transparent), not "the building underneath",
    // since that pixel data was already blended away. Redrawing the
    // target fresh on top of the dim layer achieves the same spotlight
    // effect correctly. With no target (welcome/buy_seeds/done steps),
    // the whole canvas just stays dimmed.
    if (target) {
      const config = store.getBuildingConfig(target.type)
      const rect = getBuildingRect(target, camera)
      drawBuilding(ctx, target, config, rect, tilePx, nowMs.value)
      drawTutorialRing(ctx, rect)
    }
  }

  rafId = requestAnimationFrame(render)
}

/** Pulsing gold ring around the tutorial's current target building. */
function drawTutorialRing(ctx, rect) {
  const pulse = (Math.sin(Date.now() / 260) + 1) / 2 // 0..1
  const pad = 5 + pulse * 4
  ctx.save()
  ctx.strokeStyle = `rgba(212, 169, 74, ${0.6 + pulse * 0.4})`
  ctx.lineWidth = 3
  ctx.setLineDash([8, 5])
  ctx.strokeRect(rect.x - pad, rect.y - pad, rect.width + pad * 2, rect.height + pad * 2)
  ctx.restore()
}

function findBuildingAt(gridPos) {
  for (const building of store.allBuildings) {
    const config = store.getBuildingConfig(building.type)
    const position = positionFor(building)
    if (
      gridPos.x >= position.x &&
      gridPos.x < position.x + config.footprint.width &&
      gridPos.y >= position.y &&
      gridPos.y < position.y + config.footprint.height
    ) {
      return building
    }
  }
  return null
}

function findDecorationAt(gridPos) {
  return store.decorations.find((deco) => deco.position.x === gridPos.x && deco.position.y === gridPos.y) ?? null
}

/** Hit-tests a screen point against every building's status-indicator
 * circle (the start/collect button), with a slightly generous tap radius
 * beyond the visual circle for easier tapping. */
function findIndicatorHitAt(screenPos) {
  const camera = computeCamera()
  const tilePx = TILE_SIZE * camera.scale
  for (const building of store.allBuildings) {
    if (!building.slot) continue
    const rect = getBuildingRect(building, camera)
    const hit = getStatusIndicatorHitbox(building, rect, tilePx)
    if (!hit) continue
    const tapRadius = hit.radius * 1.8
    const dx = screenPos.x - hit.cx
    const dy = screenPos.y - hit.cy
    if (dx * dx + dy * dy <= tapRadius * tapRadius) return building
  }
  return null
}

function handleIndicatorClick(building) {
  if (building.slot.status === 'idle') {
    store.startBatch(building.id)
  } else if (building.slot.status === 'ready') {
    store.collectBatch(building.id)
  }
}

function screenPosFromEvent(event) {
  const rectBounds = canvasRef.value.getBoundingClientRect()
  return { x: event.clientX - rectBounds.left, y: event.clientY - rectBounds.top }
}

function gridPosFromScreen(screenPos) {
  const camera = computeCamera()
  return screenToGrid(screenPos.x, screenPos.y, { tileSize: TILE_SIZE, camera })
}

function currentWorkingMoves() {
  return Array.from(workingPositions.entries()).map(([id, position]) => ({ id, position }))
}

function cancelBuildingDrag() {
  if (!draggingId) return
  const building = store.allBuildings.find((b) => b.id === draggingId)
  workingPositions.delete(draggingId)
  if (building) workingPositions.set(draggingId, { ...building.position })
  draggingId = null
}

function pinchDistance() {
  const [p1, p2] = Array.from(activePointers.values())
  return Math.hypot(p2.x - p1.x, p2.y - p1.y)
}

function pinchMidpoint() {
  const [p1, p2] = Array.from(activePointers.values())
  return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
}

function handlePointerDown(event) {
  const screenPos = screenPosFromEvent(event)
  activePointers.set(event.pointerId, screenPos)
  canvasRef.value.setPointerCapture(event.pointerId)

  if (activePointers.size === 2) {
    cancelBuildingDrag()
    isPanning = false
    singlePointerId = null
    pinchStartDistance = pinchDistance()
    pinchStartZoom = zoomLevel
    return
  }

  if (activePointers.size > 2) return

  singlePointerId = event.pointerId
  pointerDownPos = screenPos
  lastPanPos = screenPos
  isPanning = false

  if (props.editMode) {
    const gridPos = gridPosFromScreen(screenPos)
    const building = findBuildingAt(gridPos)
    if (building) {
      draggingId = building.id
      const position = positionFor(building)
      dragOffset = { x: gridPos.x - position.x, y: gridPos.y - position.y }
      dragValid = true
    }
  }
}

function handlePointerMove(event) {
  if (activePointers.has(event.pointerId)) {
    activePointers.set(event.pointerId, screenPosFromEvent(event))
  }

  if (activePointers.size === 2) {
    const distance = pinchDistance()
    if (pinchStartDistance > 0) {
      const mid = pinchMidpoint()
      setZoomAt(mid.x, mid.y, pinchStartZoom * (distance / pinchStartDistance))
    }
    return
  }

  if (event.pointerId !== singlePointerId) return
  const screenPos = screenPosFromEvent(event)

  if (props.editMode && draggingId) {
    const gridPos = gridPosFromScreen(screenPos)
    workingPositions.set(draggingId, { x: gridPos.x - dragOffset.x, y: gridPos.y - dragOffset.y })
    dragValid = store.canRelocateBuildings(currentWorkingMoves()).ok
    return
  }

  const movedDistance = Math.hypot(screenPos.x - pointerDownPos.x, screenPos.y - pointerDownPos.y)
  if (props.editMode) {
    // Empty-space drag in edit mode pans instead of doing nothing.
    if (movedDistance > CLICK_THRESHOLD || isPanning) {
      isPanning = true
      panX += screenPos.x - lastPanPos.x
      panY += screenPos.y - lastPanPos.y
      clampPan()
    }
    lastPanPos = screenPos
    return
  }

  if (movedDistance > CLICK_THRESHOLD || isPanning) {
    isPanning = true
    panX += screenPos.x - lastPanPos.x
    panY += screenPos.y - lastPanPos.y
    clampPan()
    hoverGrid = null
  } else if (props.placingType || props.placingDecorationId) {
    hoverGrid = gridPosFromScreen(screenPos)
  }
  lastPanPos = screenPos
}

function handlePointerUp(event) {
  if (activePointers.has(event.pointerId)) {
    activePointers.delete(event.pointerId)
  }

  if (event.pointerId !== singlePointerId) {
    // A pointer from an active pinch lifted - end the gesture cleanly
    // rather than risk a jump by resuming single-pointer pan mid-motion.
    if (activePointers.size < 2) {
      pinchStartDistance = 0
    }
    return
  }

  if (props.editMode && draggingId) {
    if (!dragValid) cancelBuildingDrag()
    draggingId = null
    dragValid = true
    singlePointerId = null
    return
  }

  const wasClick = !isPanning
  const clickScreenPos = pointerDownPos
  const clickGridPos = wasClick && clickScreenPos ? gridPosFromScreen(clickScreenPos) : null
  isPanning = false
  singlePointerId = null
  pointerDownPos = null

  if (!wasClick || !clickGridPos) return

  if (props.placingType) {
    const result = store.placeBuilding(props.placingType, clickGridPos)
    if (result.ok) {
      emit('placed', result.building)
    } else {
      emit('place-failed', result.reason)
    }
    return
  }

  if (props.placingDecorationId) {
    const result = store.placeDecoration(props.placingDecorationId, clickGridPos)
    if (result.ok) {
      emit('placed', result.decoration)
    } else {
      emit('place-failed', result.reason)
    }
    return
  }

  if (props.expandMode) {
    // Only the Expand Territory toggle makes locked tiles buyable - a
    // normal tap elsewhere in the game never spends money on land by
    // accident. Tapping an already-owned tile while in this mode is a
    // harmless no-op (buyLandTile rejects it as already_owned).
    if (!store.isTileOwned(clickGridPos.x, clickGridPos.y)) {
      const result = store.buyLandTile(clickGridPos.x, clickGridPos.y)
      if (!result.ok) emit('place-failed', result.reason)
    }
    return
  }

  if (!props.editMode) {
    // The status indicator (start/collect button) intercepts idle/ready
    // clicks; a processing indicator has nothing to do by clicking it, so
    // that falls through to opening the panel like anywhere else on the tile.
    const indicatorHit = findIndicatorHitAt(clickScreenPos)
    if (indicatorHit && indicatorHit.slot.status !== 'processing') {
      handleIndicatorClick(indicatorHit)
      return
    }

    const building = findBuildingAt(clickGridPos)
    if (building) {
      emit('building-selected', building)
      return
    }

    const decoration = findDecorationAt(clickGridPos)
    if (decoration) emit('decoration-selected', decoration)
  }
}

function handleWheel(event) {
  const screenPos = screenPosFromEvent(event)
  const factor = event.deltaY < 0 ? 1.15 : 1 / 1.15
  zoomAt(screenPos.x, screenPos.y, factor)
}

function resizeCanvas() {
  if (!canvasRef.value || !containerRef.value) return
  const dpr = window.devicePixelRatio || 1
  canvasWidth = containerRef.value.clientWidth
  canvasHeight = containerRef.value.clientHeight
  canvasRef.value.width = canvasWidth * dpr
  canvasRef.value.height = canvasHeight * dpr
  canvasRef.value.style.width = `${canvasWidth}px`
  canvasRef.value.style.height = `${canvasHeight}px`
  ctx = canvasRef.value.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  clampPan()
}

let resizeObserver = null

onMounted(() => {
  resizeCanvas()
  resizeObserver = new ResizeObserver(resizeCanvas)
  resizeObserver.observe(containerRef.value)
  rafId = requestAnimationFrame(render)
})

onBeforeUnmount(() => {
  if (rafId != null) cancelAnimationFrame(rafId)
  if (resizeObserver) resizeObserver.disconnect()
})

watch(
  () => props.placingType,
  (value) => {
    if (!value) hoverGrid = null
  }
)

watch(
  () => props.placingDecorationId,
  (value) => {
    if (!value) hoverGrid = null
  }
)

watch(
  () => props.editMode,
  (isEditing) => {
    if (isEditing) {
      workingPositions = new Map(store.allBuildings.map((b) => [b.id, { ...b.position }]))
    } else {
      workingPositions = new Map()
    }
    draggingId = null
    dragValid = true
  }
)

function commitLayout() {
  const result = store.relocateBuildings(currentWorkingMoves())
  workingPositions = new Map()
  draggingId = null
  return result
}

function cancelLayout() {
  workingPositions = new Map()
  draggingId = null
}

defineExpose({ commitLayout, cancelLayout })
</script>

<template>
  <div ref="containerRef" class="canvas-container">
    <canvas
      ref="canvasRef"
      class="game-canvas"
      :class="{ 'is-placing': placingType, 'is-editing': editMode }"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointercancel="handlePointerUp"
      @pointerleave="handlePointerUp"
      @wheel.prevent="handleWheel"
    />
    <div class="zoom-controls">
      <button title="Zoom in" @click="zoomIn"><Icon name="mdi:plus" /></button>
      <button title="Zoom out" @click="zoomOut"><Icon name="mdi:minus" /></button>
      <button title="Reset view" @click="resetView"><Icon name="mdi:fit-to-screen-outline" /></button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '~/assets/scss/variables' as *;

.canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.game-canvas {
  display: block;
  cursor: pointer;
  // Without this, touch drags (panning, placing/rearranging buildings) get
  // hijacked by the browser's default scroll/pinch-zoom gesture handling
  // instead of reaching our pointer handlers.
  touch-action: none;

  &.is-placing {
    cursor: crosshair;
  }

  &.is-editing {
    cursor: grab;
  }
}

.zoom-controls {
  position: absolute;
  left: $spacing-sm;
  bottom: $spacing-sm;
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: rgba(38, 48, 40, 0.85);
  border: 1px solid $color-panel-border;
  border-radius: $radius-sm;
  padding: 2px;

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border: none;
    border-radius: $radius-sm;
    background: transparent;
    color: $color-text;
    font-size: 1.1rem;
    cursor: pointer;

    &:hover {
      background: rgba(212, 169, 74, 0.18);
    }
  }
}
</style>
