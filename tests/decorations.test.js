import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialState } from '../game/state/createInitialState.js'
import { canMoveDecoration, moveDecoration } from '../game/engine/decorationEngine.js'

test('decoration relocation is free, keeps identity, and rejects occupied or unowned land without mutation', () => {
  const state = createInitialState()
  state.decorations = [
    { id: 'a', decorationId: 'sapling', position: { x: 1, y: 0 } },
    { id: 'b', decorationId: 'hay_bales', position: { x: 1, y: 1 } }
  ]
  state.resources.money = 0
  assert.equal(canMoveDecoration(state, 'a', { x: 1, y: 0 }).ok, true)
  for (const position of [{ x: 1, y: 1 }, { x: 0, y: 0 }, { x: 2, y: 2 }, { x: 999, y: 999 }, { x: 1.5, y: 0 }]) {
    const before = JSON.stringify(state)
    assert.equal(moveDecoration(state, 'a', position).ok, false)
    assert.equal(JSON.stringify(state), before)
  }
  assert.equal(moveDecoration(state, 'missing', { x: 1, y: 0 }).ok, false)
  assert.equal(moveDecoration(state, 'a', { x: 3, y: 0 }).ok, true)
  assert.deepEqual(state.decorations[0], { id: 'a', decorationId: 'sapling', position: { x: 3, y: 0 } })
  assert.equal(state.resources.money, 0)
})
