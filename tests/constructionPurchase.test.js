import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialState } from '../game/state/createInitialState.js'
import { buyStoreItem } from '../game/engine/storeEngine.js'
import { getStoreItem } from '../game/config/store.config.js'

const itemId = 'finish_construction'
const cost = getStoreItem(itemId).cost

test('construction purchase finishes all upgrades for coins and preserves production', () => {
  const state = createInitialState()
  state.coins = cost + 7
  state.townHall.upgrade = { targetLevel: 3, startedAt: 1, completesAt: Date.now() + 100000 }
  const building = state.buildings.find(b => b.slot)
  building.upgrade = { targetLevel: 2, startedAt: 1, completesAt: Date.now() + 200000 }
  building.slot = { status: 'processing', batchSize: 5, completesAt: Date.now() + 300000 }
  const slot = structuredClone(building.slot)
  const money = state.resources.money
  assert.equal(buyStoreItem(state, itemId, {}).ok, true)
  assert.equal(state.coins, 7)
  assert.equal(state.resources.money, money)
  assert.equal(state.townHall.level, 3)
  assert.equal(building.level, 2)
  assert.equal(state.townHall.upgrade, null)
  assert.equal(building.upgrade, null)
  assert.deepEqual(building.slot, slot)
  assert.equal(buyStoreItem(state, itemId, {}).reason, 'no_construction')
  assert.equal(state.coins, 7)
})

test('insufficient coins and no construction cannot charge or change state', () => {
  const state = createInitialState()
  state.coins = cost
  const before = JSON.stringify(state)
  assert.equal(buyStoreItem(state, itemId, {}).reason, 'no_construction')
  assert.equal(JSON.stringify(state), before)
  state.townHall.upgrade = { targetLevel: 2, startedAt: 1, completesAt: Date.now() + 100000 }
  state.coins = cost - 1
  const pending = JSON.stringify(state)
  assert.equal(buyStoreItem(state, itemId, {}).reason, 'insufficient_funds')
  assert.equal(JSON.stringify(state), pending)
})
