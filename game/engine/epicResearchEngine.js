import { EPIC_RESEARCH, getEpicResearchDefinition } from '../config/epicResearch.config.js'

const PIPELINE_TYPES = ['nursery', 'field', 'curing', 'steam', 'fermentation', 'rolling']

/**
 * @param {import('../types/prestige.js').PrestigeState} prestigeState
 * @param {string} researchId
 * @returns {number}
 */
export function getEpicResearchLevel(prestigeState, researchId) {
  return prestigeState.epicResearchLevels[researchId] ?? 0
}

/**
 * @param {ReturnType<typeof getEpicResearchDefinition>} research
 * @param {number} currentLevel
 * @returns {number}
 */
export function getEpicNextLevelCost(research, currentLevel) {
  return Math.round(research.baseCost * research.costGrowth ** currentLevel)
}

/**
 * @param {import('../types/state.js').GameState} state
 * @param {string} researchId
 * @returns {{ ok: boolean, reason?: string, cost?: number }}
 */
export function canBuyEpicResearch(state, researchId) {
  const research = getEpicResearchDefinition(researchId)
  if (!research) return { ok: false, reason: 'unknown_research' }

  const level = getEpicResearchLevel(state.prestige, researchId)
  if (level >= research.maxLevel) return { ok: false, reason: 'max_level' }

  const cost = getEpicNextLevelCost(research, level)
  if (state.resources.money < cost) return { ok: false, reason: 'insufficient_funds' }

  return { ok: true, cost }
}

/**
 * @param {import('../types/state.js').GameState} state
 * @param {string} researchId
 * @returns {{ ok: boolean, reason?: string }}
 */
export function buyEpicResearch(state, researchId) {
  const result = canBuyEpicResearch(state, researchId)
  if (!result.ok) return result

  state.resources.money -= result.cost
  state.prestige.epicResearchLevels[researchId] = getEpicResearchLevel(state.prestige, researchId) + 1

  return { ok: true }
}

/**
 * Same merge pattern as labEngine.getMultipliers, plus
 * prestigeMultiplierBoost - an extra factor layered onto the prestige tier
 * product (see prestigeEngine.getTotalPrestigeMultiplier).
 * @param {import('../types/prestige.js').PrestigeState} prestigeState
 * @returns {{ salePriceMultiplier: number, speedMultipliers: Object<string, number>, batchSizeMultipliers: Object<string, number>, depotCapacityMultiplier: number, fleetThroughputMultiplier: number, prestigeMultiplierBoost: number }}
 */
export function getEpicMultipliers(prestigeState) {
  let salePriceMultiplier = 1
  let depotCapacityMultiplier = 1
  let fleetThroughputMultiplier = 1
  let prestigeMultiplierBoost = 1
  /** @type {Object<string, number>} */
  const speedMultipliers = {}
  /** @type {Object<string, number>} */
  const batchSizeMultipliers = {}

  for (const research of EPIC_RESEARCH) {
    const level = getEpicResearchLevel(prestigeState, research.id)
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
    } else if (effect.type === 'prestige_multiplier_boost') {
      prestigeMultiplierBoost *= (1 + perLevelValue) ** level
    }
  }

  return { salePriceMultiplier, speedMultipliers, batchSizeMultipliers, depotCapacityMultiplier, fleetThroughputMultiplier, prestigeMultiplierBoost }
}
