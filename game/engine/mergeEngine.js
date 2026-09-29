import { getBuildingFootprint, getBuildingStats, getLevelStats, getBuildingWorth } from '../config/buildings/index.js'
import { normalizeTobaccoLots } from './tobaccoEngine.js'
import { planRelocation } from './placementEngine.js'

export const MERGE_REASONS = {
  select_multiple: 'Select at least two buildings of the same type.',
  mixed_types: 'Only buildings of the same type can be combined.',
  town_hall: 'Town Hall cannot be combined.',
  busy: 'Finish construction before combining.',
  level_required: 'Upgrade every selected building to level 10 before combining.',
  different_tobacco: 'Set the same tobacco choice on all selected buildings first.',
  no_space: 'Clear an owned 2×2 area (4×4 for fields) near the selected buildings.',
  capacity_limit: 'This combination exceeds the supported production range.'
}

export function planMerge(state, buildingIds) {
  const ids = new Set(buildingIds)
  const buildings = state.buildings.filter(b => ids.has(b.id))
  if (ids.has(state.townHall.id)) return { ok: false, reason: 'town_hall' }
  if (buildings.length < 2 || buildings.length !== ids.size) return { ok: false, reason: 'select_multiple' }
  const type = buildings[0].type
  if (buildings.some(b => b.type !== type)) return { ok: false, reason: 'mixed_types' }
  if (buildings.some(b => b.upgrade)) return { ok: false, reason: 'busy' }
  if (buildings.some(b => b.level !== 10)) return { ok: false, reason: 'level_required' }
  if (new Set(buildings.map(b => b.seedVarietyId ?? null)).size > 1) return { ok: false, reason: 'different_tobacco' }
  const level = Math.max(...buildings.map(b => b.level))
  const base = getLevelStats(type, level)
  const stats = buildings.map(getBuildingStatsForMerge)
  const mergeFactors = {}
  if (base.batchSize) {
    const batch = stats.reduce((sum, s) => sum + s.batchSize, 0)
    const throughput = stats.reduce((sum, s) => sum + s.batchSize / s.processingDurationSeconds, 0)
    mergeFactors.batchSize = batch * 1.5 / base.batchSize
    mergeFactors.processingDurationSeconds = (batch / throughput) / base.processingDurationSeconds
  }
  for (const key of ['cigarStorageCapacity', 'maxVehicleSlots']) {
    if (base[key]) mergeFactors[key] = stats.reduce((sum, s) => sum + s[key], 0) * 1.5 / base[key]
  }
  if (Object.values(mergeFactors).some(n => !Number.isFinite(n) || n <= 0) ||
      Object.entries(mergeFactors).some(([key, factor]) => !Number.isFinite(factor * base[key]))) return { ok: false, reason: 'capacity_limit' }
  const building = {
    ...buildings[0], level, upgrade: null,
    slot: combineSlots(buildings),
    mergeGeneration: Math.max(...buildings.map(b => b.mergeGeneration ?? 0)) + 1,
    mergedBuildingCount: buildings.reduce((sum, b) => sum + (b.mergedBuildingCount ?? 1), 0),
    investedValue: buildings.reduce((sum, b) => sum + (b.investedValue ?? getBuildingWorth(b.type, b.level)), 0),
    mergeFactors
  }
  const remaining = state.buildings.filter(b => !ids.has(b.id))
  const footprint = getBuildingFootprint(building)
  // Prefer a selected origin, then nearby offsets. Never silently relocate across town.
  const candidates = buildings.map(b => b.position)
  const anchor = { x: Math.min(...buildings.map(b => b.position.x)), y: Math.min(...buildings.map(b => b.position.y)) }
  for (let radius = 0; radius <= 4; radius++) {
    for (let x = -radius; x <= radius; x++) for (let y = -radius; y <= radius; y++) {
      if (Math.max(Math.abs(x), Math.abs(y)) === radius) candidates.push({ x: anchor.x + x, y: anchor.y + y })
    }
  }
  for (const position of candidates) {
    building.position = { ...position }
    if ((state.decorations ?? []).some(d => d.position.x >= position.x && d.position.x < position.x + footprint.width && d.position.y >= position.y && d.position.y < position.y + footprint.height)) continue
    if (planRelocation({ ...state, buildings: [...remaining, building] }, []).ok) {
      return { ok: true, building, removedIds: [...ids], footprint }
    }
  }
  return { ok: false, reason: 'no_space' }
}

// Avoid Array.map passing its index as the optional level argument.
function getBuildingStatsForMerge(building) { return getBuildingStats(building) }

export function mergeBuildings(state, buildingIds) {
  const plan = planMerge(state, buildingIds)
  if (!plan.ok) return plan
  const ids = new Set(plan.removedIds)
  state.buildings = state.buildings.filter(b => !ids.has(b.id))
  state.buildings.push(plan.building)
  return plan
}

// Carry every in-flight cigar/leaf and its provenance into the new complex.
// A mixed batch finishes when its slowest constituent would have finished.
function combineSlots(buildings) {
  if (!buildings[0].slot) return null
  const active = buildings.map(b => b.slot).filter(s => s && s.status !== 'idle')
  if (!active.length) return { status: 'idle', batchSize: 0 }
  const processing = active.filter(s => s.status === 'processing')
  const tobaccoLots = {}
  for (const slot of active) {
    for (const [id, amount] of Object.entries(normalizeTobaccoLots(slot.tobaccoLots, slot.batchSize))) tobaccoLots[id] = (tobaccoLots[id] ?? 0) + amount
  }
  return {
    status: processing.length ? 'processing' : 'ready',
    batchSize: active.reduce((sum, s) => sum + s.batchSize, 0), tobaccoLots,
    ...(processing.length ? { startedAt: Math.min(...processing.map(s => s.startedAt)), completesAt: Math.max(...processing.map(s => s.completesAt)) } : {})
  }
}
