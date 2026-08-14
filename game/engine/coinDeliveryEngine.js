import {
  COIN_DELIVERY_INTERVAL_SECONDS,
  COIN_DELIVERY_JITTER_SECONDS,
  COIN_DELIVERY_MIN_AMOUNT,
  COIN_DELIVERY_MAX_AMOUNT
} from '../config/economy.config.js'
import { createId } from '../util/id.js'
import { now } from '../util/time.js'

// Tile offsets from the Depot's own position (its footprint is 2x2, so
// these all land just outside it, never on top of it) - picked randomly
// per spawn purely for a little visual variety, not for any placement
// logic (a delivery is a transient pickup, not a real placed object, so
// landing on a decoration/owned tile is harmless).
const SPAWN_OFFSETS = [
  { dx: -1, dy: 0 },
  { dx: 2, dy: 0 },
  { dx: 0, dy: -1 },
  { dx: 1, dy: -1 },
  { dx: -1, dy: 1 },
  { dx: 2, dy: 1 }
]

// Skewed toward the low end rather than uniform - most drops sit right
// near the minimum, with a long tail up to the max that's genuinely rare
// (not just "less common"). Raising a uniform roll to a power concentrates
// it near 0 before scaling back up into the min..max range; the exponent
// below was picked by simulation to land the average around 6 (with
// min=5, max=15) while the max itself only comes up under 1% of the time.
const AMOUNT_SKEW_EXPONENT = 7

function randomAmount() {
  const roll = Math.random() ** AMOUNT_SKEW_EXPONENT
  const range = COIN_DELIVERY_MAX_AMOUNT - COIN_DELIVERY_MIN_AMOUNT
  return COIN_DELIVERY_MIN_AMOUNT + Math.round(roll * range)
}

function scheduleNextSpawn(coinDelivery, atTime) {
  const jitter = (Math.random() * 2 - 1) * COIN_DELIVERY_JITTER_SECONDS
  coinDelivery.nextSpawnAt = atTime + (COIN_DELIVERY_INTERVAL_SECONDS + jitter) * 1000
}

/**
 * Spawns a new pending delivery next to the Depot if none is currently
 * waiting and it's time for the next one. Call once per tick and once on
 * offline catch-up, same as every other timer in this game.
 * @param {import('../types/state.js').GameState} state
 * @param {number} [atTime]
 */
export function updateCoinDelivery(state, atTime = now()) {
  const coinDelivery = state.coinDelivery
  if (coinDelivery.pending || atTime < coinDelivery.nextSpawnAt) return

  const depot = state.buildings.find((b) => b.type === 'distribution')
  if (!depot) return

  const offset = SPAWN_OFFSETS[Math.floor(Math.random() * SPAWN_OFFSETS.length)]
  coinDelivery.pending = {
    id: createId('coin'),
    x: depot.position.x + offset.dx,
    y: depot.position.y + offset.dy,
    amount: randomAmount(),
    spawnedAt: atTime
  }
}

/**
 * @param {import('../types/state.js').GameState} state
 * @param {number} [atTime]
 * @returns {{ ok: boolean, reason?: string, amount?: number }}
 */
export function collectCoinDelivery(state, atTime = now()) {
  const pending = state.coinDelivery.pending
  if (!pending) return { ok: false, reason: 'nothing_pending' }

  state.coins += pending.amount
  state.coinDelivery.pending = null
  scheduleNextSpawn(state.coinDelivery, atTime)

  return { ok: true, amount: pending.amount }
}
