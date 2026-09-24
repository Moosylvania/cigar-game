import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialState } from '../game/state/createInitialState.js'
import { renameTown, getTownStats, DEFAULT_TOWN_NAME } from '../game/engine/townProfile.js'
import { migrateSave } from '../game/persistence/migrations.js'
import { doPrestige, advanceTier } from '../game/engine/prestigeEngine.js'

test('town names normalize whitespace and reject empty or oversized names without losing the saved name', () => {
  const state = createInitialState()
  assert.equal(renameTown(state, '  Moon\n  Leaf Farm  ').ok, true)
  assert.equal(state.townProfile.name, 'Moon Leaf Farm')
  for (const bad of ['', '  ', null, 'x'.repeat(41)]) assert.equal(renameTown(state, bad).ok, false)
  assert.equal(state.townProfile.name, 'Moon Leaf Farm')
  assert.equal(renameTown(state, '🌱'.repeat(40)).ok, true)
})

test('old saves get a default name and renamed saves survive JSON export/import', () => {
  const state = createInitialState()
  delete state.townProfile
  assert.equal(migrateSave({ version: 1, state }).state.townProfile.name, DEFAULT_TOWN_NAME)
  renameTown(state, 'Emerald Acres')
  const loaded = migrateSave(JSON.parse(JSON.stringify({ version: 1, state }))).state
  assert.equal(loaded.townProfile.name, 'Emerald Acres')
})

test('renaming survives prestige and all-time earnings do not double count a reset', () => {
  const state = createInitialState()
  renameTown(state, 'Evergreen')
  state.meta.lifetimeMoneyEarned = 1e9
  const before = getTownStats(state).allTimeEarnings
  assert.equal(doPrestige(state).ok, true)
  assert.equal(state.townProfile.name, 'Evergreen')
  assert.equal(state.meta.lifetimeMoneyEarned, 0)
  assert.equal(getTownStats(state).allTimeEarnings, before)
})

test('town name survives advancing to a new prestige tier', () => {
  const state = createInitialState()
  renameTown(state, 'Evergreen')
  state.meta.lifetimeMoneyEarned = 1e10
  assert.equal(advanceTier(state, 1).ok, true)
  assert.equal(state.townProfile.name, 'Evergreen')
})

test('town stats count actual buildings, fleet, research, and production states', () => {
  const state = createInitialState()
  state.prestige.lifetimeMoneyEarnedAllTime = 200
  state.meta.lifetimeMoneyEarned = 50
  state.buildings[0].slot.status = 'processing'
  state.buildings[1].slot.status = 'ready'
  state.buildings[2].upgrade = { completesAt: 1 }
  state.townHall.level = 10
  state.lab.researchLevels = { a: 2, b: 3 }
  state.distribution.fleet = [{ count: 2 }, { count: 3 }]
  const stats = getTownStats(state)
  assert.equal(stats.allTimeEarnings, 250)
  assert.equal(stats.buildings, 8)
  assert.equal(stats.maxLevelBuildings, 1)
  assert.equal(stats.processing, 1)
  assert.equal(stats.ready, 1)
  assert.equal(stats.upgrading, 1)
  assert.equal(stats.idle, 3)
  assert.equal(stats.fleet, 5)
  assert.equal(stats.researchLevels, 5)
})
