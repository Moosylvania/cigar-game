/**
 * Single source of truth for pipeline stage order and storage-key wiring.
 * batchEngine reads this table so it never hardcodes per-building logic.
 * Nursery's input is 'seeds' - a resource you buy from the Store (see
 * store.config.js), not one any building produces. Rolling's output
 * (cigars) is cappedOutput: unlike every other stage's storage, it's
 * bounded by the Distribution Depot's cigarStorageCapacity - a collect
 * that would exceed that cap is refused instead of overflowing and losing
 * the excess (see batchEngine.js). The Depot then exports/sells from that
 * capped pool over time at a throughput-limited rate instead of an instant
 * sell (see economy.js).
 * @type {{ type: import('../types/building.js').BuildingType, inputKey: string|null, outputKey: string|null, cappedOutput?: boolean }[]}
 */
export const PIPELINE_STAGES = [
  { type: 'nursery', inputKey: 'seeds', outputKey: 'nurserySeedlings' },
  { type: 'field', inputKey: 'nurserySeedlings', outputKey: 'fieldTobacco' },
  { type: 'curing', inputKey: 'fieldTobacco', outputKey: 'curedTobacco' },
  { type: 'steam', inputKey: 'curedTobacco', outputKey: 'steamedTobacco' },
  { type: 'fermentation', inputKey: 'steamedTobacco', outputKey: 'fermentedTobacco' },
  { type: 'rolling', inputKey: 'fermentedTobacco', outputKey: 'cigars', cappedOutput: true }
]

export function getPipelineStage(buildingType) {
  return PIPELINE_STAGES.find((stage) => stage.type === buildingType) ?? null
}

export function isPipelineBuilding(buildingType) {
  return getPipelineStage(buildingType) !== null
}
