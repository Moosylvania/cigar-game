import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialState } from '../game/state/createInitialState.js'
import { getBuildingWorth, getBuildingStats } from '../game/config/buildings/index.js'
import { planMerge, mergeBuildings } from '../game/engine/mergeEngine.js'
import { resolveCompletedUpgrades } from '../game/engine/upgradeEngine.js'
import { startBatch, collectBatch } from '../game/engine/batchEngine.js'
import { runOfflineCatchUp } from '../game/engine/catchUp.js'
import { buyStoreItem } from '../game/engine/storeEngine.js'
import { migrateSave } from '../game/persistence/migrations.js'

function town() {
  const state=createInitialState()
  state.buildings=[0,1,2].map(i=>({id:String(i),type:'nursery',level:10,position:{x:i*3,y:0},upgrade:null,slot:{status:'idle',batchSize:0}}))
  state.townHall.position={x:14,y:14}
  for(let x=0;x<16;x++)for(let y=0;y<16;y++)state.land.purchasedTiles.push({x,y})
  state.resources.money=1e12
  return state
}

test('combination cost counts represented buildings and raises the target generation to itself',()=>{
  const state=town(), maxed=getBuildingWorth('nursery',10)
  const before=JSON.stringify(state)
  const plan=planMerge(state,['0','1'])
  assert.equal(plan.cost,2*maxed)
  assert.equal(JSON.stringify(state),before)
  const money=state.resources.money
  const result=mergeBuildings(state,['0','1'])
  const b=result.building
  assert.equal(state.resources.money,money-plan.cost)
  assert.equal(b.investedValue,4*maxed)
  assert.equal(b.upgrade.completesAt-b.upgrade.startedAt,20*60*1000)
  assert.equal(planMerge(state,['0','2']).reason,'busy')
  assert.equal(startBatch(b,state,{}).reason,'building_upgrading')
  const pendingCapacity=getBuildingStats(b).batchSize
  resolveCompletedUpgrades(state,b.upgrade.completesAt-1)
  assert.ok(b.upgrade)
  resolveCompletedUpgrades(state,b.upgrade.completesAt)
  assert.equal(b.upgrade,null)
  assert.equal(getBuildingStats(b).batchSize,pendingCapacity*1.5)
  assert.equal(planMerge(state,['0','2']).cost,3*maxed*2**2)
})

test('insufficient funds fail without changing buildings or money; exact balance succeeds',()=>{
  const state=town(),cost=planMerge(state,['0','1']).cost
  state.resources.money=cost-1
  const before=JSON.stringify(state)
  assert.equal(mergeBuildings(state,['0','1']).reason,'insufficient_funds')
  assert.equal(JSON.stringify(state),before)
  state.resources.money=cost
  assert.equal(mergeBuildings(state,['0','1']).ok,true)
  assert.equal(state.resources.money,0)
})

test('combination construction and preserved batches survive reload and finish-construction purchases',()=>{
  const state=town()
  state.buildings[0].slot={status:'ready',batchSize:12,tobaccoLots:{piloto:12}}
  const b=mergeBuildings(state,['0','1']).building
  assert.equal(collectBatch(b,state,{}).reason,'building_upgrading')
  const restored=migrateSave(JSON.parse(JSON.stringify({version:1,state}))).state
  const saved=restored.buildings.find(v=>v.id==='0')
  assert.deepEqual(saved.upgrade,b.upgrade)
  restored.coins=100
  assert.equal(buyStoreItem(restored,'finish_construction',{}).ok,true)
  assert.equal(saved.upgrade,null)
  assert.equal(collectBatch(saved,restored,{}).ok,true)
  assert.equal(restored.resources.storage.nurserySeedlings,12)
})

test('offline construction time cannot produce bonus batches before completion',()=>{
  const state=town()
  const b=mergeBuildings(state,['0','1']).building
  state.buildings=[b]
  state.resources.storage.seeds=100000
  state.resources.tobaccoLots.seeds={piloto:100000}
  runOfflineCatchUp(state,600)
  assert.ok(b.upgrade)
  assert.equal(state.resources.storage.nurserySeedlings,0)
  b.upgrade.completesAt=Date.now()
  runOfflineCatchUp(state,1200)
  assert.equal(b.upgrade,null)
  assert.equal(state.resources.storage.nurserySeedlings,0)
})

test('all five combination levels use g raised to g, without compounding past merge fees',()=>{
  for(let generation=1;generation<=5;generation++) {
    const state=town()
    state.buildings[0].mergeGeneration=generation-1
    state.buildings[0].mergedBuildingCount=8
    state.buildings[0].investedValue=1e15
    const plan=planMerge(state,['0','1'])
    assert.equal(plan.ok,true)
    assert.equal(plan.cost,9*getBuildingWorth('nursery',10)*generation**generation)
    assert.equal(plan.durationSeconds,1200)
  }
})
