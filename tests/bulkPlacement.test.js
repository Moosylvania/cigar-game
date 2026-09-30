import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialState } from '../game/state/createInitialState.js'
import { getBuildingPurchaseCost, planBuildingBatch, placeBuildingBatch } from '../game/engine/placementEngine.js'

const tiles = [{x:0,y:3},{x:1,y:3},{x:4,y:3}]

test('bulk preview is read-only and purchase fills unique affordable tiles in row order', () => {
  const state = createInitialState()
  const cost = getBuildingPurchaseCost(state,'nursery')
  state.resources.money = cost*2+1
  const before = JSON.stringify(state)
  const selection = [...tiles].reverse().concat(tiles[0])
  const plan = planBuildingBatch(state,'nursery',selection)
  assert.equal(JSON.stringify(state),before)
  assert.equal(plan.count,2)
  assert.equal(plan.spent,cost*2)
  assert.deepEqual(plan.placements,tiles.slice(0,2))
  assert.equal(plan.skipped[0].reason,'insufficient_funds')
  const originalCount = state.buildings.length
  assert.deepEqual(placeBuildingBatch(state,'nursery',selection),plan)
  assert.equal(state.resources.money,1)
  assert.equal(state.buildings.length,originalCount+2)
  assert.equal(new Set(state.buildings.map(b=>b.id)).size,state.buildings.length)
})

test('bulk building skips unowned land, decorations, and the full footprint of complexes', () => {
  const state = createInitialState()
  state.buildings = [{id:'complex',type:'nursery',level:10,mergeGeneration:1,position:{x:0,y:0}}]
  state.decorations = [{id:'decor',decorationId:'oak_tree',position:{x:4,y:4}}]
  state.resources.money=1e9
  const result = placeBuildingBatch(state,'field',[{x:1,y:1},{x:2,y:2},{x:4,y:4},{x:6,y:6},{x:5,y:5}])
  assert.equal(result.count,1)
  assert.deepEqual(result.placements,[{x:5,y:5}])
  assert.deepEqual(new Set(result.skipped.map(s=>s.reason)),new Set(['overlaps_existing_building','overlaps_existing_decoration','outside_unlocked_land']))
})

test('bulk depot purchases preview and charge each escalating price', () => {
  const state=createInitialState()
  state.resources.money=1e21+1e24
  const plan=planBuildingBatch(state,'distribution',tiles)
  assert.equal(plan.count,2)
  assert.equal(plan.spent,1e21+1e24)
  const before=state.buildings.filter(b=>b.type==='distribution').length
  const result=placeBuildingBatch(state,'distribution',tiles)
  assert.equal(result.count,2)
  assert.equal(state.distribution.depotsBuilt,3)
  assert.equal(state.buildings.filter(b=>b.type==='distribution').length,before+2)
  assert.ok(state.resources.money>=0)
})

test('purchase revalidates stale previews and never spends on blocked or unaffordable tiles', () => {
  const state=createInitialState()
  assert.ok(planBuildingBatch(state,'nursery',tiles).count>0)
  state.resources.money=0
  const before=JSON.stringify(state)
  assert.equal(placeBuildingBatch(state,'nursery',tiles).count,0)
  assert.equal(JSON.stringify(state),before)
  assert.equal(planBuildingBatch(state,'town_hall',tiles).count,0)
})
