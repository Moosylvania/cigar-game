/**
 * The Store sells consumables - things you buy with money that either add
 * to a resource stockpile (seed packs) or apply an instant one-time effect
 * (fertilizer, rush delivery). This is separate from the Lab: Lab research
 * is a permanent, repeatable-per-level multiplier; Store items are
 * one-shot purchases you make again whenever you need more.
 *
 * Seed packs are sized in *batches*, not raw seed units - a "100" pack
 * buys enough seeds for 100 nursery batches at the reference nursery's
 * current batch size (see storeEngine.js), not a fixed unit count, so the
 * promise holds even as Premium Seeds research or nursery levels change
 * how many seeds a single batch actually consumes.
 * @typedef {Object} StoreItem
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} icon
 * @property {'seeds'|'speed_boost_processing'|'speed_boost_upgrade'} type
 * @property {number} [batches] - seeds items only
 * @property {number} [effectPercent] - speed-boost items only: fraction of remaining time removed
 * @property {number} cost
 */

/** @type {StoreItem[]} */
export const STORE_ITEMS = [
  {
    id: 'seeds_5',
    name: 'Seed Pack (5)',
    description: 'Enough tobacco seeds for 5 nursery batches.',
    icon: 'mdi:seed-outline',
    type: 'seeds',
    batches: 5,
    cost: 100
  },
  {
    id: 'seeds_10',
    name: 'Seed Pack (10)',
    description: 'Enough tobacco seeds for 10 nursery batches.',
    icon: 'mdi:seed-outline',
    type: 'seeds',
    batches: 10,
    cost: 180
  },
  {
    id: 'seeds_20',
    name: 'Seed Pack (20)',
    description: 'Enough tobacco seeds for 20 nursery batches.',
    icon: 'mdi:seed-outline',
    type: 'seeds',
    batches: 20,
    cost: 320
  },
  {
    id: 'seeds_100',
    name: 'Seed Pack (100)',
    description: 'Enough tobacco seeds for 100 nursery batches.',
    icon: 'mdi:seed-outline',
    type: 'seeds',
    batches: 100,
    cost: 1200
  },
  {
    id: 'fertilizer',
    name: 'Fertilizer',
    description: 'Instantly speeds up every batch currently processing by 30%.',
    icon: 'mdi:watering-can-outline',
    type: 'speed_boost_processing',
    effectPercent: 0.3,
    cost: 150
  },
  {
    id: 'rush_delivery',
    name: 'Rush Delivery',
    description: 'Instantly speeds up every building upgrade in progress by 30%.',
    icon: 'mdi:truck-fast-outline',
    type: 'speed_boost_upgrade',
    effectPercent: 0.3,
    cost: 250
  }
]

export function getStoreItem(itemId) {
  return STORE_ITEMS.find((item) => item.id === itemId) ?? null
}
