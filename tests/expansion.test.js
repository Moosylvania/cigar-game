import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialState } from '../game/state/createInitialState.js'
import { planMerge, mergeBuildings } from '../game/engine/mergeEngine.js'
import { getBuildingStats, getBuildingFootprint } from '../game/config/buildings/index.js'
import { getBuildingPurchaseCost, placeBuilding, canPlaceBuilding, relocateBuildings } from '../game/engine/placementEngine.js'
import { getMaxSlots, getCigarStorageCapacity, buyVehicle, replaceVehicle } from '../game/engine/distributionEngine.js'
import { getFleetCapacityPerHour, exportCigars } from '../game/engine/economy.js'
import { startBatch, resolveOfflineSlots, collectBatch, fastForwardAutomation } from '../game/engine/batchEngine.js'
import { getSeedsPerBatch, buyStoreItem } from '../game/engine/storeEngine.js'
import { getLeafMultiplier, getActiveTierMultiplier, doPrestige } from '../game/engine/prestigeEngine.js'
import { getMultipliers, buyResearch, getNextLevelCost } from '../game/engine/labEngine.js'
import { getEpicMultipliers } from '../game/engine/epicResearchEngine.js'
import { LAB_RESEARCH } from '../game/config/lab.config.js'
import { migrateSave } from '../game/persistence/migrations.js'
import { addTobaccoResource } from '../game/engine/tobaccoEngine.js'

function estate(type = 'nursery', levels = [10,10]) {
  const s = createInitialState()
  s.townHall.position = { x: 10, y: 10 }; s.townHall.level = 10
  s.resources.money = 1e35
  for(let x=0;x<16;x++) for(let y=0;y<16;y++) s.land.purchasedTiles.push({x,y})
  s.buildings = levels.map((level,i) => ({ id: `test${i}`, type, level, position: {x:i*4,y:0}, upgrade:null, slot:type==='distribution'?null:{status:'idle',batchSize:0} }))
  return s
}
const near = (a,b) => assert.ok(Math.abs(a-b) <= Math.max(1,Math.abs(b))*1e-10, `${a} != ${b}`)

test('prestige has diminishing leaf returns and linear active-tier bonuses, including old balances', () => {
  const leaf = n => getLeafMultiplier({legacyLeaves:n})
  assert.equal(leaf(0),1)
  assert.ok(leaf(1e24)<120)
  assert.ok(leaf(1e12+1e6)-leaf(1e12)<leaf(2e6)-leaf(1e6))
  assert.equal(getActiveTierMultiplier(5),3.5)
  assert.equal(getActiveTierMultiplier(9),5.5)
  const original = createInitialState(); original.prestige.legacyLeaves = 1e24
  assert.equal(migrateSave({version:1,state:original}).state.prestige.legacyLeaves,1e24)
})

test('expanded research spans late-game prices and price research adds instead of compounding', () => {
  assert.equal(LAB_RESEARCH.length,76)
  assert.ok(Math.max(...LAB_RESEARCH.map(r=>getNextLevelCost(r,r.maxLevel-1)))>1e37)
  const s=createInitialState(); s.resources.money=1e30
  assert.equal(buyResearch(s,'orbital_rolling_yield').ok,true)
  assert.ok(getMultipliers(s.lab).batchSizeMultipliers.rolling>1)
  near(getMultipliers({researchLevels:{premium_blend:50,cosmic_quality:20}}).salePriceMultiplier,3.8)
  near(getEpicMultipliers({epicResearchLevels:{epic_golden_leaf:20,epic_master_blenders_reserve:20}}).salePriceMultiplier,3)
})

test('extra depots charge escalating sextillion prices and aggregate storage and slots', () => {
  const s=estate('distribution',[10]);s.distribution.fleet=[];s.resources.money=1e25
  assert.equal(getBuildingPurchaseCost(s,'distribution'),1e21)
  const capacity=getCigarStorageCapacity(s)
  const money=s.resources.money
  assert.equal(placeBuilding(s,'distribution',{x:4,y:0}).ok,true)
  near(money-s.resources.money,1e21)
  assert.equal(getBuildingPurchaseCost(s,'distribution'),1e24)
  assert.equal(getMaxSlots(s),11)
  assert.equal(getCigarStorageCapacity(s),capacity+100)
  s.buildings.forEach(b => { b.level = 10 })
  const merged=mergeBuildings(s,s.buildings.map(b=>b.id));assert.equal(merged.ok,true)
  assert.equal(getBuildingPurchaseCost(s,'distribution'),1e24)
  assert.equal(getMaxSlots(s),30)
  near(getCigarStorageCapacity(s),capacity*3)
})

test('rockets require a pad for purchases and replacements and export researched throughput', () => {
  const s=estate('distribution',[9]);s.resources.money=5e12;s.distribution.fleet=[{vehicleTierId:'truck',count:1}]
  assert.equal(buyVehicle(s,'rocket').reason,'launch_pad_required')
  assert.equal(replaceVehicle(s,'truck','rocket').reason,'launch_pad_required')
  assert.equal(s.resources.money,5e12)
  s.buildings[0].level=10
  assert.equal(buyVehicle(s,'rocket').ok,true)
  assert.equal(s.resources.money,3e12)
  s.distribution.fleet=[{vehicleTierId:'rocket',count:1}]
  assert.equal(getFleetCapacityPerHour(s.distribution,{fleetThroughputMultiplier:3}),6e9)
  addTobaccoResource(s,'cigars',{piloto:1e10},1e10)
  near(exportCigars(s,1,{fleetThroughputMultiplier:3}).cigarsSold,6e9/3600)
})

test('level-10 merges preserve sum throughput ×1.5 and can be merged repeatedly', () => {
  const s=estate('nursery',[10,10,10])
  const before=s.buildings.slice(0,2).map(b=>getBuildingStats(b))
  const snapshot=JSON.stringify(s)
  const plan=planMerge(s,['test0','test1']);assert.equal(plan.ok,true)
  assert.equal(JSON.stringify(s),snapshot)
  const first=mergeBuildings(s,['test0','test1']).building
  const a=getBuildingStats(first)
  near(a.batchSize,before.reduce((sum,b)=>sum+b.batchSize,0)*1.5)
  near(a.batchSize/a.processingDurationSeconds,before.reduce((sum,b)=>sum+b.batchSize/b.processingDurationSeconds,0)*1.5)
  const other=getBuildingStats(s.buildings.find(b=>b.id==='test2'))
  const second=mergeBuildings(s,['test0','test2']).building
  const b=getBuildingStats(second)
  near(b.batchSize,(a.batchSize+other.batchSize)*1.5)
  near(b.batchSize/b.processingDurationSeconds,(a.batchSize/a.processingDurationSeconds+other.batchSize/other.processingDurationSeconds)*1.5)
  assert.equal(second.mergeGeneration,2)
  assert.equal(second.mergedBuildingCount,3)
  assert.deepEqual(getBuildingFootprint(second),{width:2,height:2})
})

test('combined fields occupy 4×4 for placement, relocation, and save reload', () => {
  const s=estate('field',[10,10])
  const result=mergeBuildings(s,['test0','test1']);assert.equal(result.ok,true)
  assert.deepEqual(getBuildingFootprint(result.building),{width:4,height:4})
  assert.equal(canPlaceBuilding(s,'nursery',{x:3,y:3}).reason,'overlaps_existing_building')
  const before=JSON.stringify(s)
  assert.equal(relocateBuildings(s,[{id:result.building.id,position:{x:14,y:14}}]).ok,false)
  assert.equal(JSON.stringify(s),before)
  const restored=migrateSave(JSON.parse(JSON.stringify({version:1,state:s}))).state
  assert.deepEqual(getBuildingStats(restored.buildings[0]),getBuildingStats(result.building))
  assert.deepEqual(getBuildingFootprint(restored.buildings[0]),{width:4,height:4})
})

test('invalid selections and blocked land fail atomically', () => {
  const s=estate();s.buildings[1].type='rolling'
  assert.equal(planMerge(s,['test0','test1']).reason,'mixed_types')
  s.buildings[1].type='nursery';s.buildings[1].upgrade={targetLevel:2}
  assert.equal(planMerge(s,['test0','test1']).reason,'busy')
  s.buildings[1].upgrade=null
  assert.equal(planMerge(s,['test0','test0']).reason,'select_multiple')
  assert.equal(planMerge(s,[s.townHall.id,'test0']).reason,'town_hall')
  s.land.purchasedTiles=[];s.townHall.position={x:2,y:2}
  s.buildings=estate('field',[10,10]).buildings
  const before=JSON.stringify(s)
  assert.equal(mergeBuildings(s,['test0','test1']).reason,'no_space')
  assert.equal(JSON.stringify(s),before)
})

test('combining in-flight and finished batches preserves tobacco and the slowest finish time', () => {
  const s=estate('nursery',[10,10])
  s.buildings[0].slot={status:'processing',batchSize:10,tobaccoLots:{piloto:10},startedAt:1000,completesAt:5000}
  s.buildings[1].slot={status:'ready',batchSize:7,tobaccoLots:{criollo:7}}
  const b=mergeBuildings(s,['test0','test1']).building
  assert.equal(b.slot.batchSize,17);assert.equal(b.slot.completesAt,5000)
  resolveOfflineSlots(s,5000);assert.equal(collectBatch(b,s).ok,true)
  assert.deepEqual(s.resources.tobaccoLots.nurserySeedlings,{piloto:10,criollo:7})
})

test('merged capacity is used by batches, seed purchases, and offline automation', () => {
  const s=estate('nursery',[10,10]); const b=mergeBuildings(s,['test0','test1']).building
  const capacity=getBuildingStats(b).batchSize
  near(getSeedsPerBatch(s),Math.round(capacity))
  addTobaccoResource(s,'seeds',{piloto:capacity*10},capacity*10)
  assert.equal(startBatch(b,s,{}).ok,true);near(b.slot.batchSize,Math.round(capacity))
  b.slot={status:'idle',batchSize:0}
  const duration=getBuildingStats(b).processingDurationSeconds
  fastForwardAutomation(s,duration*2,{})
  near(s.resources.storage.nurserySeedlings,Math.round(capacity)*2)
})

test('finish all construction can use either currency without double charging', () => {
  for(const [id,currency,cost] of [['finish_construction','coins',100],['finish_construction_cash','money',1e9]]) {
    const s=createInitialState();s.coins=100;s.resources.money=1e9
    s.townHall.upgrade={targetLevel:2,startedAt:0,completesAt:1e20}
    assert.equal(buyStoreItem(s,id,{}).ok,true);assert.equal(s.townHall.level,2)
    assert.equal(s.coins,currency==='coins'?0:100)
    assert.equal(s.resources.money,currency==='money'?0:1e9)
    assert.equal(buyStoreItem(s,id,{}).reason,'no_construction')
  }
  const s=createInitialState();s.resources.money=1e9-1;s.townHall.upgrade={targetLevel:2,startedAt:0,completesAt:1e20}
  const before=JSON.stringify(s);assert.equal(buyStoreItem(s,'finish_construction_cash',{}).ok,false);assert.equal(JSON.stringify(s),before)
})

test('prestige resets merged structures and additional depot prices while preserving leaves', () => {
  const s=estate('distribution',[10,10]);mergeBuildings(s,['test0','test1']);s.distribution.depotsBuilt=2;s.meta.lifetimeMoneyEarned=1e10
  assert.equal(doPrestige(s).ok,true)
  assert.equal(s.buildings.some(b=>b.mergeGeneration),false)
  assert.equal(getBuildingPurchaseCost(s,'distribution'),1e21)
})

test('every selected building must be level 10, including previous merges', () => {
  for (const type of ['nursery','field','curing','steam','fermentation','rolling','distribution']) {
    for (let level=1;level<10;level++) {
      const s=estate(type,[10,level])
      s.buildings[1].mergeGeneration=2
      const before=JSON.stringify(s)
      assert.equal(planMerge(s,['test0','test1']).reason,'level_required')
      assert.equal(mergeBuildings(s,['test0','test1']).reason,'level_required')
      assert.equal(JSON.stringify(s),before)
    }
  }
})

test('rockets launch visibly from the pad and travel only north in game and gallery', async () => {
  const { useFleetAnimation, setShowcaseLanes, getVehicleWorldPosition } = await import('../app/composables/useFleetAnimation.js')
  const { useClock } = await import('../app/composables/useClock.js')
  const { LAUNCH_PAD } = await import('../app/components/game/renderers/expansionArt.js')
  const clock=useClock(), previousTime=clock.nowMs.value
  const animation=useFleetAnimation()
  const store={game:estate('distribution',[10]),fleet:[{vehicleTierId:'rocket',count:1}],storage:{cigars:100}}
  try {
    for (const lanes of [null,[{tierId:'rocket',direction:'e',x0:0,y0:0,x1:20,y1:0}]]) {
      setShowcaseLanes(lanes)
      for(let cycle=0;cycle<10;cycle++) {
        clock.nowMs.value=100000+cycle*20000
        animation.update(store)
        const vehicle=animation.getActiveVehicles()[0]
        assert.equal(vehicle.direction,'n')
        near(vehicle.startX,LAUNCH_PAD.x/50);near(vehicle.startY,LAUNCH_PAD.y/50)
        assert.equal(vehicle.endX,vehicle.startX);assert.ok(vehicle.endY<vehicle.startY)
        const ignition=getVehicleWorldPosition(vehicle,vehicle.spawnedAt+500)
        assert.equal(ignition.x,vehicle.startX);assert.equal(ignition.y,vehicle.startY);assert.equal(ignition.alpha,1)
        let lastY=vehicle.startY
        for(const fraction of [0,.2,.4,.6,.8,1]) {
          const pos=getVehicleWorldPosition(vehicle,vehicle.spawnedAt+fraction*vehicle.durationMs)
          assert.equal(pos.x,vehicle.startX);assert.ok(pos.y<=lastY);lastY=pos.y
        }
      }
    }
  } finally { setShowcaseLanes(null);clock.nowMs.value=previousTime }
})
