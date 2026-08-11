/**
 * "Epic" research: still bought with money like regular Lab research (same
 * repeatable-level/costGrowth shape), but each line is gated behind a
 * tobacco variety reaching a points threshold - invisible/unbuyable until
 * then. Because variety points only come from prestiging, and later
 * varieties don't even unlock until earlier ones are deep into their own
 * curve (see prestige.config.js), the later lines here are genuinely out
 * of reach on a low prestige - by design, Egg Inc's Epic Research gating.
 * requiredVariety refers to a TOBACCO_VARIETIES id.
 * @type {{ id: string, name: string, description: string, icon: string, effect: { type: 'sale_price_multiplier'|'production_speed_multiplier'|'batch_size_multiplier'|'storage_capacity_multiplier'|'fleet_throughput_multiplier'|'prestige_multiplier_boost', stageTarget?: string }, perLevelValue: number, maxLevel: number, baseCost: number, costGrowth: number, requiredVariety: string, requiredPoints: number }[]}
 */
export const EPIC_RESEARCH = [
  {
    id: 'epic_soil_science',
    name: 'Soil Science Breakthrough',
    description: 'Prestige-funded agronomy speeds up every stage of production.',
    icon: 'mdi:test-tube',
    effect: { type: 'production_speed_multiplier', stageTarget: 'all' },
    perLevelValue: 0.03,
    maxLevel: 20,
    baseCost: 5000,
    costGrowth: 1.4,
    requiredVariety: 'virginia',
    requiredPoints: 10
  },
  {
    id: 'epic_golden_leaf',
    name: 'Golden Leaf Cultivar',
    description: 'A prized Virginia cultivar that commands a premium price.',
    icon: 'mdi:leaf-circle',
    effect: { type: 'sale_price_multiplier' },
    perLevelValue: 0.04,
    maxLevel: 20,
    baseCost: 8000,
    costGrowth: 1.4,
    requiredVariety: 'virginia',
    requiredPoints: 25
  },
  {
    id: 'epic_batch_engineering',
    name: 'Batch Engineering',
    description: 'Burley-funded process engineering - bigger batches everywhere.',
    icon: 'mdi:cog-outline',
    effect: { type: 'batch_size_multiplier', stageTarget: 'all' },
    perLevelValue: 0.03,
    maxLevel: 20,
    baseCost: 25000,
    costGrowth: 1.42,
    requiredVariety: 'burley',
    requiredPoints: 50
  },
  {
    id: 'epic_mega_warehouse',
    name: 'Mega Warehouse Blueprint',
    description: 'Oriental-funded architecture drastically expands Depot storage.',
    icon: 'mdi:warehouse',
    effect: { type: 'storage_capacity_multiplier' },
    perLevelValue: 0.05,
    maxLevel: 20,
    baseCost: 80000,
    costGrowth: 1.42,
    requiredVariety: 'oriental',
    requiredPoints: 150
  },
  {
    id: 'epic_rail_logistics',
    name: 'Rail Logistics Network',
    description: 'Cavendish-funded rail lines dramatically raise export throughput.',
    icon: 'mdi:train',
    effect: { type: 'fleet_throughput_multiplier' },
    perLevelValue: 0.05,
    maxLevel: 20,
    baseCost: 250000,
    costGrowth: 1.45,
    requiredVariety: 'cavendish',
    requiredPoints: 400
  },
  {
    id: 'epic_master_blender_reserve',
    name: "Master Blender's Reserve",
    description: 'A Latakia-funded reserve blend, sold at a serious premium.',
    icon: 'mdi:glass-mug-variant',
    effect: { type: 'sale_price_multiplier' },
    perLevelValue: 0.06,
    maxLevel: 20,
    baseCost: 800000,
    costGrowth: 1.45,
    requiredVariety: 'latakia',
    requiredPoints: 1000
  },
  {
    id: 'epic_automated_curing',
    name: 'Automated Curing Systems',
    description: 'Perique-funded automation - the whole pipeline runs faster.',
    icon: 'mdi:robot-industrial-outline',
    effect: { type: 'production_speed_multiplier', stageTarget: 'all' },
    perLevelValue: 0.05,
    maxLevel: 20,
    baseCost: 2500000,
    costGrowth: 1.48,
    requiredVariety: 'perique',
    requiredPoints: 2500
  },
  {
    id: 'epic_prestige_refinement',
    name: 'Prestige Leaf Refinement',
    description: 'Kentucky-funded refinement techniques boost every tobacco tier\'s multiplier.',
    icon: 'mdi:star-four-points-outline',
    effect: { type: 'prestige_multiplier_boost' },
    perLevelValue: 0.02,
    maxLevel: 15,
    baseCost: 8000000,
    costGrowth: 1.5,
    requiredVariety: 'kentucky',
    requiredPoints: 6000
  },
  {
    id: 'epic_shade_grown_mastery',
    name: 'Shade-Grown Mastery',
    description: 'Connecticut Shade-funded mastery - much bigger batches everywhere.',
    icon: 'mdi:weather-partly-cloudy',
    effect: { type: 'batch_size_multiplier', stageTarget: 'all' },
    perLevelValue: 0.05,
    maxLevel: 20,
    baseCost: 25000000,
    costGrowth: 1.5,
    requiredVariety: 'connecticut',
    requiredPoints: 15000
  },
  {
    id: 'epic_habano_legacy',
    name: 'Habano Legacy Blend',
    description: 'The rarest leaf funds the deepest refinement - every tobacco tier\'s multiplier, again.',
    icon: 'mdi:crown-outline',
    effect: { type: 'prestige_multiplier_boost' },
    perLevelValue: 0.03,
    maxLevel: 25,
    baseCost: 100000000,
    costGrowth: 1.55,
    requiredVariety: 'habano',
    requiredPoints: 5000
  }
]

export function getEpicResearchDefinition(researchId) {
  return EPIC_RESEARCH.find((r) => r.id === researchId) ?? null
}
