/**
 * "Epic" research: same repeatable-level/costGrowth shape as regular Lab
 * research, bought with money only - no separate currency, no unlock
 * conditions. What makes it "epic" is pure cost: base prices run from
 * $50K up to $2.5T across the list, so early lines are a stretch goal
 * for a first prestige or two, and late lines are only realistic once
 * your prestige money-multiplier has compounded across several tiers -
 * the game prices you out until you go prestige, rather than gating
 * purchases behind a separate currency/threshold.
 * @type {{ id: string, name: string, description: string, icon: string, effect: { type: 'sale_price_multiplier'|'production_speed_multiplier'|'batch_size_multiplier'|'storage_capacity_multiplier'|'fleet_throughput_multiplier'|'prestige_multiplier_boost', stageTarget?: string }, perLevelValue: number, maxLevel: number, baseCost: number, costGrowth: number }[]}
 */
export const EPIC_RESEARCH = [
  {
    id: 'epic_soil_science',
    name: 'Soil Science Breakthrough',
    description: 'Advanced agronomy research speeds up every stage of production.',
    icon: 'mdi:test-tube',
    effect: { type: 'production_speed_multiplier', stageTarget: 'all' },
    perLevelValue: 0.03,
    maxLevel: 20,
    baseCost: 50000,
    costGrowth: 1.4
  },
  {
    id: 'epic_nursery_overdrive',
    name: 'Nursery Overdrive',
    description: "Overclocks the nursery's growing cycle.",
    icon: 'mdi:seedling',
    effect: { type: 'production_speed_multiplier', stageTarget: 'nursery' },
    perLevelValue: 0.04,
    maxLevel: 20,
    baseCost: 100000,
    costGrowth: 1.4
  },
  {
    id: 'epic_golden_leaf',
    name: 'Golden Leaf Cultivar',
    description: 'A prized cultivar that commands a premium price.',
    icon: 'mdi:leaf-circle',
    effect: { type: 'sale_price_multiplier' },
    perLevelValue: 0.04,
    maxLevel: 20,
    baseCost: 250000,
    costGrowth: 1.42
  },
  {
    id: 'epic_field_mechanization',
    name: 'Field Mechanization',
    description: 'Heavy machinery speeds up field harvesting.',
    icon: 'mdi:tractor',
    effect: { type: 'production_speed_multiplier', stageTarget: 'field' },
    perLevelValue: 0.04,
    maxLevel: 20,
    baseCost: 500000,
    costGrowth: 1.42
  },
  {
    id: 'epic_batch_engineering',
    name: 'Batch Engineering',
    description: 'Process engineering yields bigger batches everywhere.',
    icon: 'mdi:cog-outline',
    effect: { type: 'batch_size_multiplier', stageTarget: 'all' },
    perLevelValue: 0.03,
    maxLevel: 20,
    baseCost: 1000000,
    costGrowth: 1.44
  },
  {
    id: 'epic_curing_acceleration',
    name: 'Curing Acceleration',
    description: 'Climate-controlled curing barns work faster.',
    icon: 'mdi:barn',
    effect: { type: 'production_speed_multiplier', stageTarget: 'curing' },
    perLevelValue: 0.045,
    maxLevel: 20,
    baseCost: 2500000,
    costGrowth: 1.44
  },
  {
    id: 'epic_nursery_yield',
    name: 'Nursery Yield Program',
    description: 'Denser planting yields more seedlings per batch.',
    icon: 'mdi:sprout',
    effect: { type: 'batch_size_multiplier', stageTarget: 'nursery' },
    perLevelValue: 0.05,
    maxLevel: 20,
    baseCost: 5000000,
    costGrowth: 1.45
  },
  {
    id: 'epic_steam_innovation',
    name: 'Steam Innovation',
    description: 'Pressurized steaming cuts processing time.',
    icon: 'mdi:pot-steam',
    effect: { type: 'production_speed_multiplier', stageTarget: 'steam' },
    perLevelValue: 0.045,
    maxLevel: 20,
    baseCost: 10000000,
    costGrowth: 1.45
  },
  {
    id: 'epic_field_yield',
    name: 'Field Expansion Program',
    description: 'Expanded field rows yield more per harvest.',
    icon: 'mdi:wheat',
    effect: { type: 'batch_size_multiplier', stageTarget: 'field' },
    perLevelValue: 0.05,
    maxLevel: 20,
    baseCost: 25000000,
    costGrowth: 1.46
  },
  {
    id: 'epic_mega_warehouse',
    name: 'Mega Warehouse Blueprint',
    description: 'A sprawling warehouse complex for the Depot.',
    icon: 'mdi:warehouse',
    effect: { type: 'storage_capacity_multiplier' },
    perLevelValue: 0.06,
    maxLevel: 20,
    baseCost: 50000000,
    costGrowth: 1.46
  },
  {
    id: 'epic_fermentation_science',
    name: 'Fermentation Science',
    description: 'Precision fermentation control speeds up the cellar.',
    icon: 'mdi:barrel',
    effect: { type: 'production_speed_multiplier', stageTarget: 'fermentation' },
    perLevelValue: 0.045,
    maxLevel: 20,
    baseCost: 100000000,
    costGrowth: 1.47
  },
  {
    id: 'epic_rail_logistics',
    name: 'Rail Logistics Network',
    description: 'Dedicated rail lines raise export throughput.',
    icon: 'mdi:train',
    effect: { type: 'fleet_throughput_multiplier' },
    perLevelValue: 0.06,
    maxLevel: 20,
    baseCost: 250000000,
    costGrowth: 1.47
  },
  {
    id: 'epic_curing_capacity',
    name: 'Bigger Curing Racks',
    description: 'Bigger curing racks process more leaf at once.',
    icon: 'mdi:silo',
    effect: { type: 'batch_size_multiplier', stageTarget: 'curing' },
    perLevelValue: 0.05,
    maxLevel: 20,
    baseCost: 500000000,
    costGrowth: 1.48
  },
  {
    id: 'epic_rolling_precision',
    name: 'Rolling Precision',
    description: 'Precision rollers work faster without sacrificing quality.',
    icon: 'mdi:cigar',
    effect: { type: 'production_speed_multiplier', stageTarget: 'rolling' },
    perLevelValue: 0.05,
    maxLevel: 20,
    baseCost: 1000000000,
    costGrowth: 1.48
  },
  {
    id: 'epic_master_blenders_reserve',
    name: "Master Blender's Reserve",
    description: 'A reserve blend sold at a serious premium.',
    icon: 'mdi:glass-mug-variant',
    effect: { type: 'sale_price_multiplier' },
    perLevelValue: 0.06,
    maxLevel: 20,
    baseCost: 2500000000,
    costGrowth: 1.49
  },
  {
    id: 'epic_steam_capacity',
    name: 'High-Pressure Chambers',
    description: 'High-pressure chambers handle bigger batches.',
    icon: 'mdi:gauge',
    effect: { type: 'batch_size_multiplier', stageTarget: 'steam' },
    perLevelValue: 0.05,
    maxLevel: 20,
    baseCost: 5000000000,
    costGrowth: 1.49
  },
  {
    id: 'epic_fermentation_capacity',
    name: 'More Fermentation Barrels',
    description: 'More barrels means more tobacco fermenting at once.',
    icon: 'mdi:archive-outline',
    effect: { type: 'batch_size_multiplier', stageTarget: 'fermentation' },
    perLevelValue: 0.05,
    maxLevel: 20,
    baseCost: 10000000000,
    costGrowth: 1.5
  },
  {
    id: 'epic_rolling_capacity',
    name: 'Expanded Rolling Floor',
    description: 'An expanded rolling floor turns out bigger batches.',
    icon: 'mdi:package-variant',
    effect: { type: 'batch_size_multiplier', stageTarget: 'rolling' },
    perLevelValue: 0.055,
    maxLevel: 20,
    baseCost: 25000000000,
    costGrowth: 1.5
  },
  {
    id: 'epic_automated_pipeline',
    name: 'Automated Pipeline',
    description: 'Full pipeline automation - everything runs faster.',
    icon: 'mdi:robot-industrial-outline',
    effect: { type: 'production_speed_multiplier', stageTarget: 'all' },
    perLevelValue: 0.04,
    maxLevel: 20,
    baseCost: 50000000000,
    costGrowth: 1.5
  },
  {
    id: 'epic_global_distribution',
    name: 'Global Distribution',
    description: 'A worldwide distribution network moves more cigars.',
    icon: 'mdi:earth',
    effect: { type: 'fleet_throughput_multiplier' },
    perLevelValue: 0.07,
    maxLevel: 20,
    baseCost: 100000000000,
    costGrowth: 1.5
  },
  {
    id: 'epic_world_market',
    name: 'World Market Access',
    description: 'Access to the world market raises your price ceiling.',
    icon: 'mdi:currency-usd',
    effect: { type: 'sale_price_multiplier' },
    perLevelValue: 0.07,
    maxLevel: 20,
    baseCost: 250000000000,
    costGrowth: 1.5
  },
  {
    id: 'epic_fortress_warehouse',
    name: 'Fortress Warehouse',
    description: 'A fortified warehouse complex, built to never overflow.',
    icon: 'mdi:shield-home-outline',
    effect: { type: 'storage_capacity_multiplier' },
    perLevelValue: 0.07,
    maxLevel: 20,
    baseCost: 500000000000,
    costGrowth: 1.5
  },
  {
    id: 'epic_prestige_refinement',
    name: 'Prestige Refinement',
    description: "Refines every prestige tier's bonus even further.",
    icon: 'mdi:star-four-points-outline',
    effect: { type: 'prestige_multiplier_boost' },
    perLevelValue: 0.02,
    maxLevel: 15,
    baseCost: 1000000000000,
    costGrowth: 1.55
  },
  {
    id: 'epic_legacy_ascension',
    name: 'Legacy Ascension',
    description: "Your legacy compounds - every prestige tier's bonus, again.",
    icon: 'mdi:crown-outline',
    effect: { type: 'prestige_multiplier_boost' },
    perLevelValue: 0.03,
    maxLevel: 20,
    baseCost: 2500000000000,
    costGrowth: 1.55
  },

  // The ladder below keeps climbing - each line roughly 4x the previous
  // one's cost, reaching about a billion times the cost of Legacy Ascension
  // above by the last entry. Same categories on repeat (speed, batch size,
  // price, storage, throughput, prestige boost) - there's always another,
  // pricier rung once you've maxed what's below it.
  {
    id: 'epic_continental_soil_matrix',
    name: 'Continental Soil Matrix',
    description: 'A living soil network spanning entire continents speeds up every stage.',
    icon: 'mdi:dna',
    effect: { type: 'production_speed_multiplier', stageTarget: 'all' },
    perLevelValue: 0.04,
    maxLevel: 20,
    baseCost: 10000000000000,
    costGrowth: 1.55
  },
  {
    id: 'epic_platinum_reserve',
    name: 'Platinum Reserve',
    description: 'A blend so rare it is priced like a precious metal.',
    icon: 'mdi:diamond-stone',
    effect: { type: 'sale_price_multiplier' },
    perLevelValue: 0.08,
    maxLevel: 20,
    baseCost: 40000000000000,
    costGrowth: 1.55
  },
  {
    id: 'epic_nursery_singularity',
    name: 'Nursery Singularity',
    description: 'Seedlings sprout the instant they are planted.',
    icon: 'mdi:atom',
    effect: { type: 'production_speed_multiplier', stageTarget: 'nursery' },
    perLevelValue: 0.06,
    maxLevel: 20,
    baseCost: 160000000000000,
    costGrowth: 1.55
  },
  {
    id: 'epic_hyperbatch_protocol',
    name: 'Hyperbatch Protocol',
    description: 'Every stage runs enormous batches simultaneously.',
    icon: 'mdi:robot-outline',
    effect: { type: 'batch_size_multiplier', stageTarget: 'all' },
    perLevelValue: 0.04,
    maxLevel: 20,
    baseCost: 630000000000000,
    costGrowth: 1.55
  },
  {
    id: 'epic_orbital_supply_chain',
    name: 'Orbital Supply Chain',
    description: 'Cargo shuttles move cigars from orbit to market.',
    icon: 'mdi:rocket-launch',
    effect: { type: 'fleet_throughput_multiplier' },
    perLevelValue: 0.09,
    maxLevel: 20,
    baseCost: 2500000000000000,
    costGrowth: 1.55
  },
  {
    id: 'epic_field_accelerator',
    name: 'Field Accelerator',
    description: 'A particle accelerator ring under every field ripens leaf instantly.',
    icon: 'mdi:magnet',
    effect: { type: 'production_speed_multiplier', stageTarget: 'field' },
    perLevelValue: 0.06,
    maxLevel: 20,
    baseCost: 10000000000000000,
    costGrowth: 1.55
  },
  {
    id: 'epic_infinite_warehouse',
    name: 'Infinite Warehouse',
    description: 'A storage complex that folds space to hold more than it should.',
    icon: 'mdi:infinity',
    effect: { type: 'storage_capacity_multiplier' },
    perLevelValue: 0.09,
    maxLevel: 20,
    baseCost: 40000000000000000,
    costGrowth: 1.55
  },
  {
    id: 'epic_curing_reactor',
    name: 'Curing Reactor',
    description: 'Controlled fission cures leaf in seconds instead of weeks.',
    icon: 'mdi:radioactive',
    effect: { type: 'production_speed_multiplier', stageTarget: 'curing' },
    perLevelValue: 0.06,
    maxLevel: 20,
    baseCost: 160000000000000000,
    costGrowth: 1.55
  },
  {
    id: 'epic_galactic_trade_route',
    name: 'Galactic Trade Route',
    description: 'Every civilization in the galaxy wants a carton.',
    icon: 'mdi:orbit',
    effect: { type: 'sale_price_multiplier' },
    perLevelValue: 0.09,
    maxLevel: 20,
    baseCost: 630000000000000000,
    costGrowth: 1.6
  },
  {
    id: 'epic_steam_fusion_core',
    name: 'Steam Fusion Core',
    description: 'A fusion reactor powers the steaming house, and everything else nearby.',
    icon: 'mdi:weather-lightning',
    effect: { type: 'production_speed_multiplier', stageTarget: 'steam' },
    perLevelValue: 0.07,
    maxLevel: 20,
    baseCost: 2500000000000000000,
    costGrowth: 1.6
  },
  {
    id: 'epic_fermentation_hivemind',
    name: 'Fermentation Hivemind',
    description: 'A networked intelligence tends every barrel at once.',
    icon: 'mdi:creation',
    effect: { type: 'production_speed_multiplier', stageTarget: 'fermentation' },
    perLevelValue: 0.07,
    maxLevel: 20,
    baseCost: 10000000000000000000,
    costGrowth: 1.6
  },
  {
    id: 'epic_rolling_omnicell',
    name: 'Rolling Omnicell',
    description: 'A single cell that rolls, wraps, and boxes cigars faster than thought.',
    icon: 'mdi:cigar',
    effect: { type: 'production_speed_multiplier', stageTarget: 'rolling' },
    perLevelValue: 0.07,
    maxLevel: 20,
    baseCost: 40000000000000000000,
    costGrowth: 1.6
  },
  {
    id: 'epic_universal_batching',
    name: 'Universal Batching',
    description: 'Batches so large they are measured on a universal scale.',
    icon: 'mdi:robot-industrial-outline',
    effect: { type: 'batch_size_multiplier', stageTarget: 'all' },
    perLevelValue: 0.05,
    maxLevel: 20,
    baseCost: 160000000000000000000,
    costGrowth: 1.6
  },
  {
    id: 'epic_transcendent_refinement',
    name: 'Transcendent Refinement',
    description: "Reality itself refines your blend - every prestige tier's bonus, once more.",
    icon: 'mdi:star-four-points-outline',
    effect: { type: 'prestige_multiplier_boost' },
    perLevelValue: 0.03,
    maxLevel: 25,
    baseCost: 630000000000000000000,
    costGrowth: 1.6
  },
  {
    id: 'epic_omniscient_ascension',
    name: 'Omniscient Ascension',
    description: 'The final rung - every prestige tier\'s bonus, one last time.',
    icon: 'mdi:crown-outline',
    effect: { type: 'prestige_multiplier_boost' },
    perLevelValue: 0.04,
    maxLevel: 25,
    baseCost: 2500000000000000000000,
    costGrowth: 1.6
  }
]

export function getEpicResearchDefinition(researchId) {
  return EPIC_RESEARCH.find((r) => r.id === researchId) ?? null
}
