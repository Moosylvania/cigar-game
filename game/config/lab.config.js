/**
 * Egg-Inc style research: a handful of independent lines, each buyable
 * repeatedly up to maxLevel. Production/logistics compound while price bonuses add to
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
    costGrowth: 1.6
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
    costGrowth: 1.65
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
    costGrowth: 1.6
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
    costGrowth: 1.6
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
    costGrowth: 1.65
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
    costGrowth: 1.6
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
    costGrowth: 1.65
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
    costGrowth: 1.6
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
    costGrowth: 1.65
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
    costGrowth: 1.6
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
    costGrowth: 1.65
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
    costGrowth: 1.6
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
    costGrowth: 1.6
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
    costGrowth: 1.6
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
    costGrowth: 1.6
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
    costGrowth: 1.6
  }
]

// New programs span industrial expansion through deep-space logistics.
// Each stage has dedicated yield and speed lines, plus shared logistics.
const ADVANCED_PROGRAMS = [
  { id: 'industrial', name: 'Industrial', baseCost: 1e8, costGrowth: 2.1 },
  { id: 'orbital', name: 'Orbital', baseCost: 1e14, costGrowth: 2.5 },
  { id: 'interstellar', name: 'Interstellar', baseCost: 1e21, costGrowth: 3 },
  { id: 'cosmic', name: 'Cosmic', baseCost: 1e27, costGrowth: 3.5 }
]
const STAGE_NAMES = { nursery: 'Propagation', field: 'Harvests', curing: 'Curing Racks', steam: 'Steam Chambers', fermentation: 'Fermentation Vats', rolling: 'Rolling Lines' }
for (const program of ADVANCED_PROGRAMS) {
  Object.entries(STAGE_NAMES).forEach(([stage, name], index) => {
    for (const [kind, label, effect, value] of [
      ['yield', 'Capacity', 'batch_size_multiplier', 0.12],
      ['speed', 'Automation', 'production_speed_multiplier', 0.025]
    ]) {
      LAB_RESEARCH.push({
        id: `${program.id}_${stage}_${kind}`, name: `${program.name} ${name} ${label}`, program: program.name,
        description: `${label === 'Capacity' ? 'Larger batches' : 'Faster processing'} for ${stage} buildings.`,
        effect: { type: effect, stageTarget: stage }, icon: kind === 'yield' ? 'mdi:factory' : 'mdi:cog',
        perLevelValue: value, maxLevel: 20, baseCost: program.baseCost * (index + 1), costGrowth: program.costGrowth
      })
    }
  })
  for (const [id, name, type, value] of [
    ['storage', 'Cargo Vaults', 'storage_capacity_multiplier', 0.35],
    ['fleet', 'Freight Networks', 'fleet_throughput_multiplier', 0.2],
    ['quality', 'Blend Certification', 'sale_price_multiplier', 0.015]
  ]) LAB_RESEARCH.push({
    id: `${program.id}_${id}`, name: `${program.name} ${name}`, program: program.name,
    description: `Expand ${name.toLowerCase()} across your empire.`,
    effect: { type }, icon: id === 'fleet' ? 'mdi:rocket-launch' : id === 'storage' ? 'mdi:warehouse' : 'mdi:certificate',
    perLevelValue: value, maxLevel: 20, baseCost: program.baseCost * 8, costGrowth: program.costGrowth
  })
}

export function getResearchDefinition(researchId) {
  return LAB_RESEARCH.find((r) => r.id === researchId) ?? null
}
