import { createId } from '../util/id.js'
import { createInitialState } from './createInitialState.js'
import { MAX_BUILDING_LEVEL, getBuildingConfig } from '../config/buildings/index.js'
import { isPipelineBuilding } from '../config/pipeline.config.js'
import { STARTING_REGION, MAX_REGION } from '../config/land.config.js'
import { VEHICLE_TIERS } from '../config/vehicles.config.js'
import { DECORATIONS } from '../config/decorations.config.js'

// Dev-only art review board (see game-init.client.js ?showcase): for each
// building type, a row of levels 1..MAX_BUILDING_LEVEL left to right, then a
// second row of the same levels permanently under construction. Below that,
// a row with every decoration, then one lane per vehicle tier with that
// vehicle driving across on a loop.
// Town Halls and Depots are normally singletons - the extras live in
// state.buildings purely so they render; this state is never saved.
const LANE_SPACING = 2
// Starts above the free region so the whole board fits inside MAX_REGION.
const ORIGIN_Y = -20
const ROW_ORDER = ['town_hall', 'distribution', 'field', 'nursery', 'curing', 'steam', 'fermentation', 'rolling']
// Never finishes within a session, and still reads as a normal timer chip
// (99:59:59) rather than a giant hour count.
const NEVER_MS = (100 * 60 * 60 - 1) * 1000

function createShowcaseBuilding(type, level, position, underConstruction) {
  const startedAt = Date.now()
  return {
    id: createId('bld'),
    type,
    position,
    level,
    upgrade: underConstruction
      ? { targetLevel: Math.min(level + 1, MAX_BUILDING_LEVEL), startedAt, completesAt: startedAt + NEVER_MS }
      : null,
    slot: isPipelineBuilding(type) ? { status: 'idle', batchSize: 0 } : null
  }
}

export function createShowcaseState() {
  const state = createInitialState()
  state.buildings = []
  state.tutorial = { active: false, dismissed: true, currentStep: 0 }
  state.resources.money = 1e12

  let y = ORIGIN_Y
  for (const type of ROW_ORDER) {
    const { width, height } = getBuildingConfig(type).footprint
    for (const underConstruction of [false, true]) {
      for (let level = 1; level <= MAX_BUILDING_LEVEL; level++) {
        const position = { x: (level - 1) * width, y }
        const building = createShowcaseBuilding(type, level, position, underConstruction)
        if (type === 'town_hall' && level === 1 && !underConstruction) state.townHall = building
        else state.buildings.push(building)
      }
      y += height
    }
  }

  // Rightmost tile of the widest (2x2) rows.
  const boardX1 = MAX_BUILDING_LEVEL * 2 - 1
  const decorationY = y + 1
  state.decorations = DECORATIONS.map((decoration, i) => ({
    id: createId('deco'),
    decorationId: decoration.id,
    position: { x: i, y: decorationY }
  }))

  const vehicleLanes = VEHICLE_TIERS.map((tier, i) => {
    const laneY = decorationY + 2 + i * LANE_SPACING
    return { tierId: tier.id, direction: 'e', x0: -1, y0: laneY, x1: boardX1 + 1, y1: laneY }
  })
  const x1 = Math.max(boardX1 + 1, DECORATIONS.length - 1)
  const y1 = Math.min(MAX_REGION.y1, vehicleLanes[vehicleLanes.length - 1].y0 + 1)

  // Own every tile the board covers (anything outside the free region).
  for (let x = -1; x <= x1; x++) {
    for (let ty = ORIGIN_Y; ty <= y1; ty++) {
      const inStart = x >= STARTING_REGION.x0 && x <= STARTING_REGION.x1 && ty >= STARTING_REGION.y0 && ty <= STARTING_REGION.y1
      if (!inStart) state.land.purchasedTiles.push({ x, y: ty })
    }
  }

  return { state, vehicleLanes }
}
