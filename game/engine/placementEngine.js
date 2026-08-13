import { getBuildingConfig, getLevelStats, getBuildingWorth } from '../config/buildings/index.js'
import { isPipelineBuilding } from '../config/pipeline.config.js'
import { BUILDING_SELL_REFUND_RATE } from '../config/economy.config.js'
import { isWithinUnlockedRegion } from './landEngine.js'
import { createId } from '../util/id.js'

// Only one Distribution depot in v1 - its fleet is what scales, not the
// building count. Town Hall is placed once by createInitialState and is
// never placed through this path.
const SINGLETON_TYPES = new Set(['distribution'])

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
    const config = getBuildingConfig(building.type)
    const position = finalPositionOf(building)
    if (!isWithinUnlockedRegion(state, position, config.footprint)) {
      return { ok: false, reason: 'outside_unlocked_land', buildingId: building.id }
    }
  }

  for (let i = 0; i < allBuildings.length; i++) {
    for (let j = i + 1; j < allBuildings.length; j++) {
      const a = allBuildings[i]
      const b = allBuildings[j]
      const aConfig = getBuildingConfig(a.type)
      const bConfig = getBuildingConfig(b.type)
      if (footprintsOverlap(finalPositionOf(a), aConfig.footprint, finalPositionOf(b), bConfig.footprint)) {
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

  if (SINGLETON_TYPES.has(type) && state.buildings.some((b) => b.type === type)) {
    return { ok: false, reason: 'already_placed' }
  }

  if (!isWithinUnlockedRegion(state, position, config.footprint)) {
    return { ok: false, reason: 'outside_unlocked_land' }
  }

  const allBuildings = [state.townHall, ...state.buildings]
  const overlaps = allBuildings.some((existing) => {
    const existingConfig = getBuildingConfig(existing.type)
    return footprintsOverlap(position, config.footprint, existing.position, existingConfig.footprint)
  })
  if (overlaps) return { ok: false, reason: 'overlaps_existing_building' }

  const cost = getLevelStats(type, 1).upgradeCost
  if (state.resources.money < cost) return { ok: false, reason: 'insufficient_funds' }

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

  const cost = getLevelStats(type, 1).upgradeCost
  state.resources.money -= cost

  /** @type {import('../types/building.js').PlacedBuilding} */
  const building = {
    id: createId('bld'),
    type,
    position,
    level: 1,
    upgrade: null,
    slot: isPipelineBuilding(type) ? { status: 'idle', batchSize: 0 } : null
  }
  state.buildings.push(building)

  return { ok: true, building }
}

/**
 * @param {import('../types/building.js').PlacedBuilding} building
 * @returns {number}
 */
export function getBuildingSellValue(building) {
  return Math.round(getBuildingWorth(building.type, building.level) * BUILDING_SELL_REFUND_RATE)
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
