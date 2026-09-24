import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialState } from '../game/state/createInitialState.js'
import { createMarketSet, ensureMarket, deliverMarketOrder, getOrderProgress } from '../game/engine/marketEngine.js'
import { addTobaccoResource, getResourceLots } from '../game/engine/tobaccoEngine.js'
import { exportCigars } from '../game/engine/economy.js'
import { runOfflineCatchUp } from '../game/engine/catchUp.js'
import { migrateSave } from '../game/persistence/migrations.js'
import { doPrestige } from '../game/engine/prestigeEngine.js'

const load = s => migrateSave(JSON.parse(JSON.stringify({ version: 1, state: s }))).state

test('market generates three feasible unlocked orders and scales with production, variety, and difficulty', () => {
  const s = createInitialState(), board = ensureMarket(s)
  assert.equal(board.orders.length, 3)
  assert.ok(board.orders.every(o => o.requirements.every(r => r.tobaccoId === 'piloto')))
  assert.ok(board.orders[2].reward > board.orders[1].reward && board.orders[1].reward > board.orders[0].reward)
  const before = JSON.stringify(board)
  assert.equal(JSON.stringify(ensureMarket(s)), before)
  s.meta.lifetimeMoneyEarned = 5e7
  s.buildings.find(b => b.type === 'nursery').level = 10
  const advanced = createMarketSet(s, 3)
  assert.deepEqual(advanced.orders.map(o => o.requirements.length), [1, 2, 3])
  assert.ok(advanced.orders[0].reward > board.orders[0].reward)
  assert.ok(advanced.orders[0].requirements[0].amount > board.orders[0].requirements[0].amount)
  s.boosts.money = [{ effectMultiplier: 100, expiresAt: Date.now() + 999999 }]
  assert.deepEqual(createMarketSet(s, 3), advanced, 'temporary boosts do not inflate fixed quotes')
})

test('partial deliveries persist, consume exact varieties, pay once, and refresh only after all three', () => {
  let s = createInitialState(); s.meta.lifetimeMoneyEarned = 50000
  ensureMarket(s)
  const order = s.market.orders[2], r = order.requirements[0], money = s.resources.money
  const before = JSON.stringify(s)
  assert.equal(deliverMarketOrder(s, order.id).ok, false)
  assert.equal(JSON.stringify(s), before)
  addTobaccoResource(s, 'cigars', { [r.tobaccoId]: 1, connecticut: 7 }, 8)
  assert.equal(deliverMarketOrder(s, order.id).paid, 0)
  assert.equal(order.requirements[0].delivered, 1)
  assert.equal(getResourceLots(s, 'cigars').connecticut, 7)
  assert.equal(s.resources.money, money)
  s = load(s)
  assert.equal(s.market.orders[2].requirements[0].delivered, 1)
  const oldIds = s.market.orders.map(o => o.id)
  let totalPaid = 0
  for (const o of [...s.market.orders]) {
    for (const need of o.requirements) {
      const amount = need.amount - need.delivered
      addTobaccoResource(s, 'cigars', { [need.tobaccoId]: amount }, amount)
    }
    assert.equal(getOrderProgress(o, s).available, getOrderProgress(o, s).total - getOrderProgress(o, s).delivered)
    const result = deliverMarketOrder(s, o.id)
    assert.equal(result.paid, o.reward)
    totalPaid += result.paid
    const paidBalance = s.resources.money
    assert.equal(deliverMarketOrder(s, o.id).ok, false)
    assert.equal(s.resources.money, paidBalance)
  }
  assert.equal(s.market.round, 2)
  assert.equal(s.market.completedOrders, 3)
  assert.ok(s.market.orders.every(o => !oldIds.includes(o.id) && !o.completed))
  assert.equal(s.resources.money, money + totalPaid)
  assert.equal(s.meta.lifetimeMoneyEarned, 50000 + totalPaid)
})

test('reservations protect outstanding demand during live and offline export while allowing surplus sales', () => {
  for (const sell of [s => exportCigars(s, 86400, {}), s => runOfflineCatchUp(s, 86400)]) {
    const s = createInitialState(); ensureMarket(s); s.market.reserve = true
    const needed = s.market.orders.reduce((n, o) => n + o.requirements[0].amount, 0)
    addTobaccoResource(s, 'cigars', { piloto: needed + 5 }, needed + 5)
    assert.equal(sell(s).cigarsSold, 5)
    assert.equal(s.resources.storage.cigars, needed)
    const first = s.market.orders[0]
    deliverMarketOrder(s, first.id)
    assert.equal(sell(s).cigarsSold, 0)
    s.market.reserve = false
    assert.equal(sell(s).cigarsSold, needed - first.requirements[0].amount)
  }
})

test('legacy saves lazily gain a board, malformed orders repair safely, and prestige resets orders', () => {
  const s = createInitialState(); delete s.market
  assert.equal(load(s).market, null)
  ensureMarket(s)
  s.market.orders[0].requirements[0].amount = -1
  assert.equal(load(s).market, null)
  s.market = null; ensureMarket(s)
  s.meta.lifetimeMoneyEarned = 1000
  assert.equal(doPrestige(s).ok, true)
  assert.equal(s.market, null)
})
