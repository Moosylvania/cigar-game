import { createId } from '../util/id.js'
import { now } from '../util/time.js'
import { isPipelineBuilding } from '../config/pipeline.config.js'
import { COIN_DELIVERY_INTERVAL_SECONDS } from '../config/economy.config.js'

// One of each pipeline building plus the depot, pre-placed and free, laid
// out around the fixed Town Hall on the starting 6x6 (0-5, 0-5) region so a
// new player has the whole chain to work with immediately instead of having
// to save up for and place seven buildings before producing anything.
const STARTER_LAYOUT = [
  { type: 'nursery', position: { x: 0, y: 0 } },
  { type: 'field', position: { x: 0, y: 1 } },
  { type: 'curing', position: { x: 4, y: 0 } },
  { type: 'steam', position: { x: 5, y: 0 } },
  { type: 'fermentation', position: { x: 4, y: 1 } },
  { type: 'rolling', position: { x: 5, y: 1 } },
  { type: 'distribution', position: { x: 0, y: 4 } }
]

function createStarterBuilding(type, position) {
  return {
    id: createId('bld'),
    type,
    position,
    level: 1,
    upgrade: null,
    slot: isPipelineBuilding(type) ? { status: 'idle', batchSize: 0 } : null
  }
}

/**
 * @returns {import('../types/state.js').GameState}
 */
export function createInitialState() {
  const timestamp = now()

  return {
    townHall: {
      id: createId('bld'),
      type: 'town_hall',
      position: { x: 2, y: 2 },
      level: 1,
      upgrade: null,
      slot: null
    },
    buildings: STARTER_LAYOUT.map(({ type, position }) => createStarterBuilding(type, position)),
    resources: {
      money: 800,
      storage: {
        // A small free starter stockpile (3 batches at level 1) so a new
        // game is playable immediately - after that, seeds come from the
        // Store.
        seeds: 30,
        nurserySeedlings: 0,
        fieldTobacco: 0,
        curedTobacco: 0,
        steamedTobacco: 0,
        fermentedTobacco: 0,
        cigars: 0
      }
    },
    // Starting territory is the fixed free region defined by
    // STARTING_REGION in land.config.js - nothing to list here since it's
    // implicit/always-owned. purchasedTiles holds every tile bought beyond
    // that region one at a time (see landEngine.js).
    land: {
      purchasedTiles: []
    },
    lab: {
      researchLevels: {}
    },
    distribution: {
      fleet: [{ vehicleTierId: 'truck', count: 1 }]
    },
    // Timed store-item buffs (see store.config.js speed_boost_*/money_boost
    // items) - each array holds every currently-running boost of that
    // kind, stacking additively while active (see engine/boostEngine.js).
    boosts: {
      processing: [],
      upgrade: [],
      money: []
    },
    // Separate currency spent on power-ups in the Store. Lives outside
    // `resources` (which resetBoard wipes on
    // prestige) and is never touched by resetBoard itself, so it survives
    // prestige like the rest of the prestige-adjacent meta-progression.
    coins: 0,
    coinDelivery: {
      pending: null,
      nextSpawnAt: timestamp + COIN_DELIVERY_INTERVAL_SECONDS * 1000
    },
    decorations: [],
    // Only meaningful for a genuinely brand-new game (see game-init.client.js) -
    // a prestige reset discards this fresh copy and keeps the player's
    // existing tutorial state instead (see prestigeEngine.js doPrestige),
    // and migrations.js backfills existing saves with it already dismissed.
    tutorial: {
      active: true,
      dismissed: false,
      currentStep: 0
    },
    meta: {
      createdAt: timestamp,
      lastSavedAt: timestamp,
      // This run's lifetime money earned - resets to 0 each prestige, and
      // is added to prestige.lifetimeMoneyEarnedAllTime when you do (see
      // prestigeEngine.js). Not the same as resources.money, which can
      // also be spent.
      lifetimeMoneyEarned: 0
    },
    // Survives prestige resets (see prestigeEngine.js doPrestige) - unlike
    // every other top-level field above, which goes back to fresh.
    prestige: {
      unlockedCount: 1,
      activeTierIndex: 0,
      totalPrestigeCount: 0,
      lifetimeMoneyEarnedAllTime: 0,
      epicResearchLevels: {},
      unlockedTrophyIds: []
    }
  }
}
