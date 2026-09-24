import { TOBACCO_VARIETIES, DEFAULT_TOBACCO_ID, getTobacco } from '../config/tobacco.config.js'

// Numeric storage remains the source of truth for quantity; these bounded
// per-variety ledgers preserve provenance across mixed batches and offline work.
export function normalizeTobaccoLots(lots, total) {
  const result = {}
  let sum = 0
  for (const variety of TOBACCO_VARIETIES) {
    const n = lots?.[variety.id]
    if (Number.isFinite(n) && n > 0) { result[variety.id] = n; sum += n }
  }
  const quantity = Math.max(0, Number.isFinite(total) ? total : 0)
  if (sum > quantity) for (const id of Object.keys(result)) result[id] *= quantity / sum
  else if (sum < quantity) result[DEFAULT_TOBACCO_ID] = (result[DEFAULT_TOBACCO_ID] ?? 0) + quantity - sum
  return result
}

export function getResourceLots(state, key) {
  return normalizeTobaccoLots(state.resources.tobaccoLots?.[key], state.resources.storage[key])
}
export function addTobaccoResource(state, key, lots, total) {
  const current = getResourceLots(state, key)
  for (const [id, count] of Object.entries(normalizeTobaccoLots(lots, total))) current[id] = (current[id] ?? 0) + count
  state.resources.tobaccoLots ??= {}
  state.resources.tobaccoLots[key] = current
  state.resources.storage[key] += total
}
export function takeTobaccoResource(state, key, requested) {
  const current = getResourceLots(state, key), taken = {}
  let remaining = Math.min(Math.max(0, requested), state.resources.storage[key])
  const amount = remaining
  // Use the best available crop first. Existing crops never change their value.
  for (const variety of [...TOBACCO_VARIETIES].reverse()) {
    const count = Math.min(current[variety.id] ?? 0, remaining)
    if (count > 0) { taken[variety.id] = count; current[variety.id] -= count; remaining -= count }
  }
  state.resources.tobaccoLots ??= {}
  state.resources.tobaccoLots[key] = current
  state.resources.storage[key] = Math.max(0, state.resources.storage[key] - amount)
  return taken
}
export function getLotValue(lots) {
  return Object.entries(lots).reduce((sum, [id, n]) => sum + n * (getTobacco(id)?.cigarMultiplier ?? 1), 0)
}
export function getStockCigarMultiplier(state) {
  const quantity = state.resources.storage.cigars
  return quantity > 0 ? getLotValue(getResourceLots(state, 'cigars')) / quantity : 1
}
