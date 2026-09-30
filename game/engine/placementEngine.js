import { getBuildingConfig, getLevelStats, getBuildingWorth, getBuildingFootprint } from '../config/buildings/index.js'
import { isPipelineBuilding } from '../config/pipeline.config.js'
import { BUILDING_SELL_REFUND_RATE } from '../config/economy.config.js'
import { isWithinUnlockedRegion, getOwnedTileSet, tileKey } from './landEngine.js'
import { createId } from '../util/id.js'

// Additional depots start at one sextillion and grow a thousandfold each.
export function getBuildingPurchaseCost(state, type) {
  if (type !== 'distribution') return getLevelStats(type, 1).upgradeCost
  return getDepotCost(getDepotCount(state))
}

/** Depots bought so far - merged depots count every original they absorbed. */
function getDepotCount(state) {
  const standing = state.buildings.filter(b => b.type === 'distribution').reduce((sum, b) => sum + (b.mergedBuildingCount ?? 1), 0)
  return Math.max(state.distribution?.depotsBuilt ?? 0, standing)
}

function getDepotCost(depotCount) {
  return depotCount === 0 ? getLevelStats('distribution', 1).upgradeCost : 1e21 * 1000 ** (depotCount - 1)
}

function footprintsOverlap(a, aFootprint, b, bFootprint) {
  return (
    a.x < b.x + bFootprint.width &&
    a.x + aFootprint.width > b.x &&
    a.y < b.y + bFootprint.height &&
    a.y + aFootprint.height > b.y
  )
}

/**
 * Validates a batch of building moves against the resulting final layout
 * (not one-at-a-time), so two buildings can swap positions in a single
 * commit without a spurious overlap rejection along the way.
 * @param {import('../types/state.js').GameState} state
 * @param {{ id: string, position: import('../types/grid.js').GridPosition }[]} moves
 * @returns {{ ok: boolean, reason?: string, buildingId?: string }}
 */
export function planRelocation(state, moves) {
  const allBuildings = [state.townHall, ...state.buildings]
  const movesById = new Map(moves.map((m) => [m.id, m.position]))
  const finalPositionOf = (building) => movesById.get(building.id) ?? building.position

  for (const building of allBuildings) {
    const position = finalPositionOf(building)
    if (!isWithinUnlockedRegion(state, position, getBuildingFootprint(building))) {
      return { ok: false, reason: 'outside_unlocked_land', buildingId: building.id }
    }
  }

  for (let i = 0; i < allBuildings.length; i++) {
    for (let j = i + 1; j < allBuildings.length; j++) {
      const a = allBuildings[i]
      const b = allBuildings[j]
      if (footprintsOverlap(finalPositionOf(a), getBuildingFootprint(a), finalPositionOf(b), getBuildingFootprint(b))) {
        return { ok: false, reason: 'overlaps_existing_building', buildingId: a.id }
      }
    }
  }

  return { ok: true }
}

/**
 * Applies a validated batch of moves atomically - either every building
 * lands at its new position, or (if any part of the layout is invalid)
 * nothing moves.
 * @param {import('../types/state.js').GameState} state
 * @param {{ id: string, position: import('../types/grid.js').GridPosition }[]} moves
 * @returns {{ ok: boolean, reason?: string, buildingId?: string }}
 */
export function relocateBuildings(state, moves) {
  const result = planRelocation(state, moves)
  if (!result.ok) return result

  const movesById = new Map(moves.map((m) => [m.id, m.position]))
  for (const building of [state.townHall, ...state.buildings]) {
    const newPosition = movesById.get(building.id)
    if (newPosition) building.position = newPosition
  }

  return { ok: true }
}

/**
 * @param {import('../types/state.js').GameState} state
 * @param {import('../types/building.js').BuildingType} type
 * @param {import('../types/grid.js').GridPosition} position
 * @returns {{ ok: boolean, reason?: string }}
 */
export function canPlaceBuilding(state, type, position) {
  if (type === 'town_hall') return { ok: false, reason: 'town_hall_is_fixed' }

  const config = getBuildingConfig(type)

  if (!isWithinUnlockedRegion(state, position, config.footprint)) {
    return { ok: false, reason: 'outside_unlocked_land' }
  }

  const allBuildings = [state.townHall, ...state.buildings]
  const overlaps = allBuildings.some((existing) => {
    return footprintsOverlap(position, config.footprint, existing.position, getBuildingFootprint(existing))
  })
  if (overlaps) return { ok: false, reason: 'overlaps_existing_building' }

  if ((state.decorations ?? []).some(d => footprintsOverlap(position, config.footprint, d.position, { width: 1, height: 1 }))) return { ok: false, reason: 'overlaps_existing_decoration' }

  const cost = getBuildingPurchaseCost(state, type)
  if (!Number.isFinite(cost) || state.resources.money < cost) return { ok: false, reason: 'insufficient_funds' }

  return { ok: true }
}

/**
 * @param {import('../types/state.js').GameState} state
 * @param {import('../types/building.js').BuildingType} type
 * @param {import('../types/grid.js').GridPosition} position
 * @returns {{ ok: boolean, reason?: string, building?: import('../types/building.js').PlacedBuilding }}
 */
export function placeBuilding(state, type, position) {
  const result = canPlaceBuilding(state, type, position)
  if (!result.ok) return result

  const cost = getBuildingPurchaseCost(state, type)
  state.resources.money -= cost

  const building = createPlacedBuilding(type, position)
  if (type === 'distribution') state.distribution.depotsBuilt = getDepotCount(state) + 1
  state.buildings.push(building)

  return { ok: true, building }
}

/** @returns {import('../types/building.js').PlacedBuilding} */
function createPlacedBuilding(type, position) {
  return {
    id: createId('bld'),
    type,
    position,
    level: 1,
    upgrade: null,
    slot: isPipelineBuilding(type) ? { status: 'idle', batchSize: 0 } : null
  }
}

/**
 * @param {import('../types/building.js').PlacedBuilding} building
 * @returns {number}
 */
export function getBuildingSellValue(building) {
  return Math.round((building.investedValue ?? getBuildingWorth(building.type, building.level)) * BUILDING_SELL_REFUND_RATE)
}

/**
 * @param {import('../types/state.js').GameState} state
 * @param {string} buildingId
 * @returns {{ ok: boolean, reason?: string }}
 */
export function canSellBuilding(state, buildingId) {
  if (state.townHall.id === buildingId) return { ok: false, reason: 'town_hall_cannot_be_sold' }
  const building = state.buildings.find((b) => b.id === buildingId)
  if (!building) return { ok: false, reason: 'not_found' }
  if (building.type === 'distribution') return { ok: false, reason: 'distribution_cannot_be_sold' }
  return { ok: true }
}

/**
 * Refunds a fraction of the building's total invested cost (see
 * getBuildingSellValue) and removes it from play, freeing its tile
 * immediately. Any in-progress upgrade's already-paid cost is forfeited,
 * not refunded - same as an upgrade forfeiting an in-progress batch with
 * no refund (see upgradeEngine.js startUpgradeToLevel).
 * @param {import('../types/state.js').GameState} state
 * @param {string} buildingId
 * @returns {{ ok: boolean, reason?: string, refund?: number }}
 */
export function sellBuilding(state, buildingId) {
  const result = canSellBuilding(state, buildingId)
  if (!result.ok) return result

  const index = state.buildings.findIndex((b) => b.id === buildingId)
  const refund = getBuildingSellValue(state.buildings[index])
  state.resources.money += refund
  state.buildings.splice(index, 1)

  return { ok: true, refund }
}

function markFootprint(tileSet, position, footprint) {
  for (let dx = 0; dx < footprint.width; dx++) {
    for (let dy = 0; dy < footprint.height; dy++) tileSet.add(tileKey(position.x + dx, position.y + dy))
  }
}

function footprintHits(tileSet, position, footprint) {
  for (let dx = 0; dx < footprint.width; dx++) {
    for (let dy = 0; dy < footprint.height; dy++) {
      if (tileSet.has(tileKey(position.x + dx, position.y + dy))) return true
    }
  }
  return false
}

function footprintOwned(ownedSet, position, footprint) {
  for (let dx = 0; dx < footprint.width; dx++) {
    for (let dy = 0; dy < footprint.height; dy++) {
      if (!ownedSet.has(tileKey(position.x + dx, position.y + dy))) return false
    }
  }
  return true
}

/**
 * Read-only, row-ordered preview; includes escalating depot prices. Same
 * checks and reasons as canPlaceBuilding, but owned land and occupied tiles
 * are indexed once up front instead of rescanned per tile - a big drag
 * selection on a big farm was O(tiles x (land + buildings)) and froze the UI.
 */
export function planBuildingBatch(state, type, positions) {
  const placements = []
  const skipped = []
  let spent = 0
  const sorted = [...positions].sort((a, b) => a.y - b.y || a.x - b.x)

  if (type === 'town_hall') {
    for (const position of sorted) skipped.push({ position: { ...position }, reason: 'town_hall_is_fixed' })
    return { count: 0, spent, placements, skipped }
  }

  const footprint = getBuildingConfig(type).footprint
  const ownedSet = getOwnedTileSet(state)
  const buildingTiles = new Set()
  for (const building of [state.townHall, ...state.buildings]) markFootprint(buildingTiles, building.position, getBuildingFootprint(building))
  const decorationTiles = new Set()
  for (const decoration of state.decorations ?? []) decorationTiles.add(tileKey(decoration.position.x, decoration.position.y))

  let money = state.resources.money
  let depotCount = type === 'distribution' ? getDepotCount(state) : 0
  const seen = new Set()
  for (const position of sorted) {
    if (!Number.isInteger(position.x) || !Number.isInteger(position.y)) continue
    const key = tileKey(position.x, position.y)
    if (seen.has(key)) continue
    seen.add(key)

    let reason = null
    if (!footprintOwned(ownedSet, position, footprint)) reason = 'outside_unlocked_land'
    else if (footprintHits(buildingTiles, position, footprint)) reason = 'overlaps_existing_building'
    else if (footprintHits(decorationTiles, position, footprint)) reason = 'overlaps_existing_decoration'
    const cost = type === 'distribution' ? getDepotCost(depotCount) : getLevelStats(type, 1).upgradeCost
    if (!reason && (!Number.isFinite(cost) || money < cost)) reason = 'insufficient_funds'
    if (reason) { skipped.push({ position: { ...position }, reason }); continue }

    money -= cost
    spent += cost
    if (type === 'distribution') depotCount += 1
    markFootprint(buildingTiles, position, footprint)
    placements.push({ ...position })
  }
  return { count: placements.length, spent, placements, skipped }
}

/**
 * Plans against the current state at purchase time (so a stale preview
 * never overspends), then applies the plan directly - it's already fully
 * validated, so there's no need to re-check each tile via placeBuilding.
 */
export function placeBuildingBatch(state, type, positions) {
  const plan = planBuildingBatch(state, type, positions)
  if (!plan.count) return plan
  if (type === 'distribution') state.distribution.depotsBuilt = getDepotCount(state) + plan.count
  state.resources.money -= plan.spent
  state.buildings.push(...plan.placements.map((position) => createPlacedBuilding(type, position)))
  return plan
}
