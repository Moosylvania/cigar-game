/**
 * The Store sells consumables - things you buy that either add to a
 * resource stockpile (seed packs, paid in money) or activate a timed
 * speed buff (fertilizer, rush delivery) for durationSeconds (see
 * engine/boostEngine.js), paid in coins - the separate currency earned
 * from the periodic delivery pickup outside the Depot (see
 * engine/coinDeliveryEngine.js), not from anything money buys. A speed
 * buff only speeds up batches/upgrades that START while it's active -
 * like Lab research, its multiplier is baked in at start time, not
 * applied retroactively to whatever's already in flight. Buying one again
 * while already active refreshes the timer back to full duration rather
 * than stacking. This is separate from the Lab: Lab research is a
 * permanent, repeatable-per-level multiplier; Store items are one-shot
 * purchases you make again whenever you need more.
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
 * @property {'seeds'|'speed_boost_processing'|'speed_boost_upgrade'|'money_boost'} type
 * @property {'money'|'coins'} currency
 * @property {number} [batches] - seeds items only
 * @property {number} [effectPercent] - speed-boost items only: fraction faster while active
 * @property {number} [effectMultiplier] - money_boost only: cigar sale price multiplier while active
 * @property {number} [durationSeconds] - speed-boost/money_boost only: how long the buff runs once bought
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
    currency: 'money',
    batches: 5,
    cost: 100
  },
  {
    id: 'seeds_10',
    name: 'Seed Pack (10)',
    description: 'Enough tobacco seeds for 10 nursery batches.',
    icon: 'mdi:seed-outline',
    type: 'seeds',
    currency: 'money',
    batches: 10,
    cost: 180
  },
  {
    id: 'seeds_20',
    name: 'Seed Pack (20)',
    description: 'Enough tobacco seeds for 20 nursery batches.',
    icon: 'mdi:seed-outline',
    type: 'seeds',
    currency: 'money',
    batches: 20,
    cost: 320
  },
  {
    id: 'seeds_100',
    name: 'Seed Pack (100)',
    description: 'Enough tobacco seeds for 100 nursery batches.',
    icon: 'mdi:seed-outline',
    type: 'seeds',
    currency: 'money',
    batches: 100,
    cost: 1200
  },
  {
    id: 'fertilizer',
    name: 'Fertilizer',
    description: 'Every batch that starts in the next 10 minutes processes 30% faster.',
    icon: 'mdi:watering-can-outline',
    type: 'speed_boost_processing',
    currency: 'coins',
    effectPercent: 0.3,
    durationSeconds: 600,
    cost: 30
  },
  {
    id: 'rush_delivery',
    name: 'Rush Delivery',
    description: 'Every building upgrade started in the next 10 minutes runs 30% faster.',
    icon: 'mdi:truck-fast-outline',
    type: 'speed_boost_upgrade',
    currency: 'coins',
    effectPercent: 0.3,
    durationSeconds: 600,
    cost: 50
  },
  // Money Rush: cigars sell for 10x more while active - same "refreshes,
  // doesn't stack" boosts.money slot regardless of which duration tier is
  // bought (see boostEngine.js activateBoost), so buying a longer tier
  // simply replaces a shorter one still running instead of adding to it.
  // Cost scales with duration at a shrinking per-minute rate (25/22.5/20/15
  // coins per minute) so the longer tiers read as the better deal.
  {
    id: 'money_rush_2m',
    name: 'Money Rush (2 min)',
    description: 'Cigars sell for 10x more for the next 2 minutes.',
    icon: 'mdi:cash-fast',
    type: 'money_boost',
    currency: 'coins',
    effectMultiplier: 10,
    durationSeconds: 120,
    cost: 50
  },
  {
    id: 'money_rush_4m',
    name: 'Money Rush (4 min)',
    description: 'Cigars sell for 10x more for the next 4 minutes.',
    icon: 'mdi:cash-fast',
    type: 'money_boost',
    currency: 'coins',
    effectMultiplier: 10,
    durationSeconds: 240,
    cost: 90
  },
  {
    id: 'money_rush_10m',
    name: 'Money Rush (10 min)',
    description: 'Cigars sell for 10x more for the next 10 minutes.',
    icon: 'mdi:cash-fast',
    type: 'money_boost',
    currency: 'coins',
    effectMultiplier: 10,
    durationSeconds: 600,
    cost: 200
  },
  {
    id: 'money_rush_1h',
    name: 'Money Rush (1 hour)',
    description: 'Cigars sell for 10x more for the next hour.',
    icon: 'mdi:cash-fast',
    type: 'money_boost',
    currency: 'coins',
    effectMultiplier: 10,
    durationSeconds: 3600,
    cost: 900
  }
]

export function getStoreItem(itemId) {
  return STORE_ITEMS.find((item) => item.id === itemId) ?? null
}
