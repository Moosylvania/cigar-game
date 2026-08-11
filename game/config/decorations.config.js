/**
 * Purely cosmetic map decorations, purchasable in the Store - place them on
 * any empty unlocked tile. No mechanical effect, just base-building flair.
 * All 1x1 - the sprite pack presents every decoration as a single icon-like
 * image sized to fit one tile.
 * @typedef {Object} DecorationDefinition
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} spriteFile - filename under sprites/decorations/ (no extension)
 * @property {number} cost
 */

/** @type {DecorationDefinition[]} */
export const DECORATIONS = [
  { id: 'sapling', name: 'Sapling', description: 'A young sapling, just getting started.', spriteFile: 'sapling', cost: 40 },
  { id: 'blank_signpost', name: 'Signpost', description: 'A rustic signpost - point the way around your farm.', spriteFile: 'blank_signpost', cost: 50 },
  { id: 'hay_bales', name: 'Hay Bales', description: 'Stacked hay bales.', spriteFile: 'hay_bales', cost: 60 },
  { id: 'tobacco_crates', name: 'Tobacco Crates', description: 'Crates of tobacco leaf, ready for shipping.', spriteFile: 'tobacco_crates', cost: 70 },
  { id: 'wood_fence', name: 'Wood Fence', description: 'A simple wooden fence section.', spriteFile: 'wood_fence', cost: 80 },
  { id: 'rounded_shrub', name: 'Rounded Shrub', description: 'A neatly rounded shrub.', spriteFile: 'rounded_shrub', cost: 90 },
  { id: 'flowering_shrub', name: 'Flowering Shrub', description: 'A shrub in full bloom.', spriteFile: 'flowering_shrub', cost: 100 },
  { id: 'trimmed_hedge', name: 'Trimmed Hedge', description: 'A tidy trimmed hedge.', spriteFile: 'trimmed_hedge', cost: 110 },
  { id: 'wildflower_bed', name: 'Wildflower Bed', description: 'A bed of wildflowers.', spriteFile: 'wildflower_bed', cost: 120 },
  { id: 'tobacco_planter', name: 'Tobacco Planter', description: 'A decorative planter growing ornamental tobacco.', spriteFile: 'tobacco_planter', cost: 140 },
  { id: 'stone_wall', name: 'Stone Wall', description: 'A short stone wall section.', spriteFile: 'stone_wall', cost: 150 },
  { id: 'park_bench', name: 'Park Bench', description: 'A place to sit and admire the harvest.', spriteFile: 'park_bench', cost: 160 },
  { id: 'barrel_handcart', name: 'Barrel Handcart', description: 'An old handcart loaded with barrels.', spriteFile: 'barrel_handcart', cost: 180 },
  { id: 'cypress_tree', name: 'Cypress Tree', description: 'A tall, slender cypress.', spriteFile: 'cypress_tree', cost: 220 },
  { id: 'palm_tree', name: 'Palm Tree', description: 'A palm tree - a little out of place, but charming.', spriteFile: 'palm_tree', cost: 240 },
  { id: 'shade_tree', name: 'Shade Tree', description: 'A broad shade tree.', spriteFile: 'shade_tree', cost: 260 },
  { id: 'oak_tree', name: 'Oak Tree', description: 'A sturdy old oak.', spriteFile: 'oak_tree', cost: 300 },
  { id: 'brass_streetlamp', name: 'Brass Streetlamp', description: 'A brass streetlamp for evening charm.', spriteFile: 'brass_streetlamp', cost: 350 },
  { id: 'ornamental_pond', name: 'Ornamental Pond', description: 'A small ornamental pond.', spriteFile: 'ornamental_pond', cost: 500 },
  { id: 'stone_fountain', name: 'Stone Fountain', description: 'A stone fountain, the centerpiece of any good farm.', spriteFile: 'stone_fountain', cost: 650 }
]

export function getDecorationDefinition(decorationId) {
  return DECORATIONS.find((d) => d.id === decorationId) ?? null
}
