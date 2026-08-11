import { LAB_RESEARCH, getResearchDefinition } from '../config/lab.config.js'

const PIPELINE_TYPES = ['nursery', 'field', 'curing', 'steam', 'fermentation', 'rolling']

/**
 * @param {import('../types/lab.js').LabState} labState
 * @param {string} researchId
 * @returns {number}
 */
export function getResearchLevel(labState, researchId) {
  return labState.researchLevels[researchId] ?? 0
}

/**
 * Cost to buy the NEXT level of a research line, given its current level.
 * @param {import('../config/lab.config.js').LAB_RESEARCH[number]} research
 * @param {number} currentLevel
 * @returns {number}
 */
export function getNextLevelCost(research, currentLevel) {
  return Math.round(research.baseCost * research.costGrowth ** currentLevel)
}

/**
 * @param {import('../types/state.js').GameState} state
 * @param {string} researchId
 * @returns {{ ok: boolean, reason?: string, cost?: number }}
 */
export function canBuyResearch(state, researchId) {
  const research = getResearchDefinition(researchId)
  if (!research) return { ok: false, reason: 'unknown_research' }

  const level = getResearchLevel(state.lab, researchId)
  if (level >= research.maxLevel) return { ok: false, reason: 'max_level' }

  const cost = getNextLevelCost(research, level)
  if (state.resources.money < cost) return { ok: false, reason: 'insufficient_funds' }

  return { ok: true, cost }
}

/**
 * @param {import('../types/state.js').GameState} state
 * @param {string} researchId
 * @returns {{ ok: boolean, reason?: string }}
 */
export function buyResearch(state, researchId) {
  const result = canBuyResearch(state, researchId)
  if (!result.ok) return result

  state.resources.money -= result.cost
  state.lab.researchLevels[researchId] = getResearchLevel(state.lab, researchId) + 1

  return { ok: true }
}

/**
 * Folds every research line's current level into a flat multiplier object.
 * Engine modules consume this without knowing anything about Lab internals.
 * Each level compounds perLevelValue onto the previous one (e.g. 5 levels
 * of a 5%/level price line = 1.05^5 ≈ 1.28x, not a flat 25%).
 * depotCapacityMultiplier and fleetThroughputMultiplier exist specifically
 * to give the Lab a way to counter Rolling outpacing the Depot (see
 * distributionEngine.js / economy.js) - research the overflow problem away
 * instead of only being able to buy more vehicles or upgrade the depot.
 * @param {import('../types/lab.js').LabState} labState
 * @returns {{ salePriceMultiplier: number, speedMultipliers: Object<string, number>, batchSizeMultipliers: Object<string, number>, depotCapacityMultiplier: number, fleetThroughputMultiplier: number }}
 */
export function getMultipliers(labState) {
  let salePriceMultiplier = 1
  let depotCapacityMultiplier = 1
  let fleetThroughputMultiplier = 1
  /** @type {Object<string, number>} */
  const speedMultipliers = {}
  /** @type {Object<string, number>} */
  const batchSizeMultipliers = {}

  for (const research of LAB_RESEARCH) {
    const level = getResearchLevel(labState, research.id)
    if (level <= 0) continue

    const { effect, perLevelValue } = research

    if (effect.type === 'sale_price_multiplier') {
      salePriceMultiplier *= (1 + perLevelValue) ** level
    } else if (effect.type === 'production_speed_multiplier') {
      const factor = (1 - perLevelValue) ** level
      const targets = effect.stageTarget === 'all' ? PIPELINE_TYPES : [effect.stageTarget]
      for (const key of targets) speedMultipliers[key] = (speedMultipliers[key] ?? 1) * factor
    } else if (effect.type === 'batch_size_multiplier') {
      const factor = (1 + perLevelValue) ** level
      const targets = effect.stageTarget === 'all' ? PIPELINE_TYPES : [effect.stageTarget]
      for (const key of targets) batchSizeMultipliers[key] = (batchSizeMultipliers[key] ?? 1) * factor
    } else if (effect.type === 'storage_capacity_multiplier') {
      depotCapacityMultiplier *= (1 + perLevelValue) ** level
    } else if (effect.type === 'fleet_throughput_multiplier') {
      fleetThroughputMultiplier *= (1 + perLevelValue) ** level
    }
  }

  return { salePriceMultiplier, speedMultipliers, batchSizeMultipliers, depotCapacityMultiplier, fleetThroughputMultiplier }
}
