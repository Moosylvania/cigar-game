/**
 * Egg-Inc style research: a handful of independent lines, each buyable
 * repeatedly up to maxLevel. Every purchase compounds perLevelValue onto
 * the effect (see engine/labEngine.js) and costs more than the last (cost
 * at level L = baseCost * costGrowth^L). All lines are purchasable in any
 * order/mix from the start - no sequential gating. Level caps are set high
 * on purpose so there's a lot of room to keep growing well past a
 * fully-built-out pipeline, rather than research running out early.
 * @type {{ id: string, name: string, description: string, effect: { type: 'sale_price_multiplier'|'production_speed_multiplier'|'batch_size_multiplier'|'storage_capacity_multiplier'|'fleet_throughput_multiplier', stageTarget?: string }, perLevelValue: number, maxLevel: number, baseCost: number, costGrowth: number }[]}
 */
export const LAB_RESEARCH = [
  {
    id: 'better_soil',
    name: 'Better Soil',
    description: 'Enriched soil speeds up every stage of production.',
    effect: { type: 'production_speed_multiplier', stageTarget: 'all' },
    icon: 'mdi:shovel',
    perLevelValue: 0.02,
    maxLevel: 30,
    baseCost: 150,
    costGrowth: 1.3
  },
  {
    id: 'premium_seeds',
    name: 'Premium Seeds',
    description: 'Bigger nursery batches per level.',
    effect: { type: 'batch_size_multiplier', stageTarget: 'nursery' },
    icon: 'mdi:seedling',
    perLevelValue: 0.05,
    maxLevel: 25,
    baseCost: 300,
    costGrowth: 1.35
  },
  {
    id: 'nursery_speed',
    name: 'Irrigation Lines',
    description: 'Nurseries process faster per level.',
    effect: { type: 'production_speed_multiplier', stageTarget: 'nursery' },
    icon: 'mdi:water',
    perLevelValue: 0.025,
    maxLevel: 25,
    baseCost: 200,
    costGrowth: 1.3
  },
  {
    id: 'field_speed',
    name: 'Mechanized Harvesting',
    description: 'Fields process faster per level.',
    effect: { type: 'production_speed_multiplier', stageTarget: 'field' },
    icon: 'mdi:tractor',
    perLevelValue: 0.03,
    maxLevel: 25,
    baseCost: 400,
    costGrowth: 1.3
  },
  {
    id: 'field_yield',
    name: 'Field Expansion',
    description: 'Bigger field batches per level.',
    effect: { type: 'batch_size_multiplier', stageTarget: 'field' },
    icon: 'mdi:wheat',
    perLevelValue: 0.04,
    maxLevel: 25,
    baseCost: 450,
    costGrowth: 1.32
  },
  {
    id: 'curing_efficiency',
    name: 'Curing Efficiency',
    description: 'Curing barns process faster per level.',
    effect: { type: 'production_speed_multiplier', stageTarget: 'curing' },
    icon: 'mdi:barn',
    perLevelValue: 0.03,
    maxLevel: 30,
    baseCost: 500,
    costGrowth: 1.3
  },
  {
    id: 'curing_capacity',
    name: 'Bigger Curing Racks',
    description: 'Bigger curing batches per level.',
    effect: { type: 'batch_size_multiplier', stageTarget: 'curing' },
    icon: 'mdi:silo',
    perLevelValue: 0.035,
    maxLevel: 25,
    baseCost: 900,
    costGrowth: 1.32
  },
  {
    id: 'steam_optimization',
    name: 'Steam Optimization',
    description: 'Steaming houses process faster per level.',
    effect: { type: 'production_speed_multiplier', stageTarget: 'steam' },
    icon: 'mdi:pot-steam',
    perLevelValue: 0.03,
    maxLevel: 30,
    baseCost: 700,
    costGrowth: 1.3
  },
  {
    id: 'steam_capacity',
    name: 'High-Pressure Chambers',
    description: 'Bigger steaming batches per level.',
    effect: { type: 'batch_size_multiplier', stageTarget: 'steam' },
    icon: 'mdi:gauge',
    perLevelValue: 0.035,
    maxLevel: 25,
    baseCost: 1300,
    costGrowth: 1.32
  },
  {
    id: 'master_fermentation',
    name: 'Master Fermentation',
    description: 'Fermentation cellars process faster per level.',
    effect: { type: 'production_speed_multiplier', stageTarget: 'fermentation' },
    icon: 'mdi:barrel',
    perLevelValue: 0.03,
    maxLevel: 30,
    baseCost: 1000,
    costGrowth: 1.3
  },
  {
    id: 'fermentation_capacity',
    name: 'More Fermentation Barrels',
    description: 'Bigger fermentation batches per level.',
    effect: { type: 'batch_size_multiplier', stageTarget: 'fermentation' },
    icon: 'mdi:archive-outline',
    perLevelValue: 0.035,
    maxLevel: 25,
    baseCost: 1800,
    costGrowth: 1.32
  },
  {
    id: 'expert_rollers',
    name: 'Expert Rollers',
    description: 'Rolling houses process faster per level.',
    effect: { type: 'production_speed_multiplier', stageTarget: 'rolling' },
    icon: 'mdi:cigar',
    perLevelValue: 0.04,
    maxLevel: 30,
    baseCost: 1500,
    costGrowth: 1.3
  },
  {
    id: 'cigar_press',
    name: 'Cigar Press Upgrade',
    description: 'Bigger rolling batches per level - produces way more cigars, so keep the Depot scaled up to match or they will overflow and be lost.',
    effect: { type: 'batch_size_multiplier', stageTarget: 'rolling' },
    icon: 'mdi:cigar',
    perLevelValue: 0.04,
    maxLevel: 25,
    baseCost: 2500,
    costGrowth: 1.3
  },
  {
    id: 'premium_blend',
    name: 'Premium Blend',
    description: 'A refined blend recipe raises cigar sale price per level.',
    effect: { type: 'sale_price_multiplier' },
    icon: 'mdi:currency-usd',
    perLevelValue: 0.05,
    maxLevel: 50,
    baseCost: 2000,
    costGrowth: 1.25
  },
  {
    id: 'warehouse_expansion',
    name: 'Warehouse Expansion',
    description: 'Raises the Depot\'s cigar storage capacity per level - more room to buffer against overflow.',
    effect: { type: 'storage_capacity_multiplier' },
    icon: 'mdi:warehouse',
    perLevelValue: 0.06,
    maxLevel: 30,
    baseCost: 1200,
    costGrowth: 1.28
  },
  {
    id: 'logistics_optimization',
    name: 'Logistics Optimization',
    description: 'Raises fleet export throughput per level, independent of buying more vehicles.',
    effect: { type: 'fleet_throughput_multiplier' },
    icon: 'mdi:truck-fast-outline',
    perLevelValue: 0.06,
    maxLevel: 30,
    baseCost: 1500,
    costGrowth: 1.28
  }
]

export function getResearchDefinition(researchId) {
  return LAB_RESEARCH.find((r) => r.id === researchId) ?? null
}
