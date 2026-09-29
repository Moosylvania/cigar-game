import { createId } from '../util/id.js'
import { createInitialState } from './createInitialState.js'
import { MAX_BUILDING_LEVEL, getBuildingConfig } from '../config/buildings/index.js'
import { isPipelineBuilding } from '../config/pipeline.config.js'
import { STARTING_REGION, MAX_REGION } from '../config/land.config.js'
import { VEHICLE_TIERS } from '../config/vehicles.config.js'
import { DECORATIONS } from '../config/decorations.config.js'
import { TOBACCO_VARIETIES } from '../config/tobacco.config.js'

// Art review board (see game-init.client.js ?showcase): for each
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
  const variety = TOBACCO_VARIETIES[(level - 1) % TOBACCO_VARIETIES.length]
  const slot = !isPipelineBuilding(type) ? null
    : underConstruction ? { status: 'idle', batchSize: 0 }
    : {
        status: level === 9 ? 'ready' : 'processing',
        batchSize: 10,
        tobaccoLots: level === 10 ? { piloto: 6, criollo: 4 } : { [variety.id]: 10 },
        startedAt: startedAt - NEVER_MS / 2,
        completesAt: startedAt + NEVER_MS
      }
  return {
    id: createId('bld'),
    type,
    position,
    level,
    upgrade: underConstruction
      ? { targetLevel: Math.min(level + 1, MAX_BUILDING_LEVEL), startedAt, completesAt: startedAt + NEVER_MS }
      : null,
    slot
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

/** Compact, unsaved review town for late-game artwork and merge interactions. */
export function createExpansionShowcaseState() {
  const state = createInitialState()
  state.tutorial = { active: false, dismissed: true, currentStep: 0 }
  state.resources.money = 1e39
  state.resources.storage.cigars = 2e9
  state.resources.tobaccoLots = { cigars: { piloto: 2e9 } }
  state.coins = 1000
  state.townHall.level = 10
  state.townHall.position = { x: 8, y: 0 }
  state.buildings = []
  const add = (type, x, y, generation = 0) => {
    const building = createShowcaseBuilding(type, 10, { x, y }, false)
    building.slot = isPipelineBuilding(type) ? { status: 'idle', batchSize: 0 } : null
    if (generation) {
      building.mergeGeneration = generation
      building.mergedBuildingCount = 2 ** generation
      building.mergeFactors = { batchSize: 3 ** generation }
    }
    state.buildings.push(building)
  }
  add('field', 0, 0, 3)
  add('distribution', 4, 0)
  add('distribution', 6, 0, 2)
  for (const [i, type] of ['nursery', 'curing', 'steam', 'fermentation', 'rolling'].entries()) add(type, i*2, 4, i%3+1)
  add('nursery',4,2);add('nursery',5,2)
  state.distribution.fleet = [{ vehicleTierId: 'rocket', count: 2 }]
  state.lab.researchLevels = { logistics_optimization: 10, warehouse_expansion: 30 }
  for(let x=-1;x<=10;x++) for(let y=-1;y<=6;y++) state.land.purchasedTiles.push({x,y})
  return { state, vehicleLanes: null }
}
