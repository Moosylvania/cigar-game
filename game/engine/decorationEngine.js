import { getDecorationDefinition } from '../config/decorations.config.js'
import { getBuildingConfig } from '../config/buildings/index.js'
import { isWithinUnlockedRegion } from './landEngine.js'
import { createId } from '../util/id.js'

const DECORATION_FOOTPRINT = { width: 1, height: 1 }

function footprintsOverlap(a, aFootprint, b, bFootprint) {
  return (
    a.x < b.x + bFootprint.width &&
    a.x + aFootprint.width > b.x &&
    a.y < b.y + bFootprint.height &&
    a.y + aFootprint.height > b.y
  )
}

function occupiesTile(state, position) {
  const allBuildings = [state.townHall, ...state.buildings]
  const overlapsBuilding = allBuildings.some((building) => {
    const config = getBuildingConfig(building.type)
    return footprintsOverlap(position, DECORATION_FOOTPRINT, building.position, config.footprint)
  })
  if (overlapsBuilding) return true

  return state.decorations.some((deco) => deco.position.x === position.x && deco.position.y === position.y)
}

/**
 * @param {import('../types/state.js').GameState} state
 * @param {string} decorationId
 * @param {import('../types/grid.js').GridPosition} position
 * @returns {{ ok: boolean, reason?: string }}
 */
export function canPlaceDecoration(state, decorationId, position) {
  const definition = getDecorationDefinition(decorationId)
  if (!definition) return { ok: false, reason: 'unknown_decoration' }

  if (!isWithinUnlockedRegion(state, position, DECORATION_FOOTPRINT)) {
    return { ok: false, reason: 'outside_unlocked_land' }
  }

  if (occupiesTile(state, position)) return { ok: false, reason: 'tile_occupied' }

  if (state.resources.money < definition.cost) return { ok: false, reason: 'insufficient_funds' }

  return { ok: true }
}

/**
 * @param {import('../types/state.js').GameState} state
 * @param {string} decorationId
 * @param {import('../types/grid.js').GridPosition} position
 * @returns {{ ok: boolean, reason?: string, decoration?: import('../types/decoration.js').PlacedDecoration }}
 */
export function placeDecoration(state, decorationId, position) {
  const result = canPlaceDecoration(state, decorationId, position)
  if (!result.ok) return result

  const definition = getDecorationDefinition(decorationId)
  state.resources.money -= definition.cost

  /** @type {import('../types/decoration.js').PlacedDecoration} */
  const decoration = { id: createId('deco'), decorationId, position }
  state.decorations.push(decoration)

  return { ok: true, decoration }
}

/**
 * No refund - purely cosmetic, removal is a "change your mind" affordance
 * rather than a sell-back mechanic.
 * @param {import('../types/state.js').GameState} state
 * @param {string} instanceId
 * @returns {{ ok: boolean, reason?: string }}
 */
export function removeDecoration(state, instanceId) {
  const index = state.decorations.findIndex((deco) => deco.id === instanceId)
  if (index === -1) return { ok: false, reason: 'not_found' }

  state.decorations.splice(index, 1)
  return { ok: true }
}
