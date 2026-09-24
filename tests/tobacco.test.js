import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialState } from '../game/state/createInitialState.js'
import { TOBACCO_VARIETIES, isTobaccoUnlocked } from '../game/config/tobacco.config.js'
import { PIPELINE_STAGES } from '../game/config/pipeline.config.js'
import { buyStoreItem, getStoreItemCost, getSeedsPerBatch } from '../game/engine/storeEngine.js'
import { getStoreItem } from '../game/config/store.config.js'
import { addTobaccoResource, getResourceLots, getLotValue } from '../game/engine/tobaccoEngine.js'
import { startBatch, collectBatch, fastForwardAutomation } from '../game/engine/batchEngine.js'
import { exportCigars, getBaseCigarSalePrice, getEffectiveSalePrice } from '../game/engine/economy.js'
import { doPrestige } from '../game/engine/prestigeEngine.js'
import { migrateSave } from '../game/persistence/migrations.js'

const empty = () => { const s = createInitialState();for (const k of Object.keys(s.resources.storage)) s.resources.storage[k] = 0;return s }
const near = (a,b) => assert.ok(Math.abs(a-b) < 1e-7, `${a} != ${b}`)

test('milestones require earnings, validate variety, and never charge on failed purchases', () => {
  const s = createInitialState();s.resources.money=1e9
  const before=JSON.stringify(s)
  assert.equal(buyStoreItem(s,'seeds_5',{},'connecticut').reason,'tobacco_locked')
  assert.equal(buyStoreItem(s,'seeds_5',{},'unknown').reason,'tobacco_locked')
  assert.equal(JSON.stringify(s),before)
  s.meta.lifetimeMoneyEarned=5000
  assert.equal(isTobaccoUnlocked(s,'criollo'),true)
  assert.equal(isTobaccoUnlocked(s,'corojo'),false)
})

test('all eight packs charge their configured price and preserve purchased variety', () => {
  for(const v of TOBACCO_VARIETIES) {
    const s=empty();s.meta.lifetimeMoneyEarned=v.unlockAt;s.resources.money=1e7
    const cost=getStoreItemCost(getStoreItem('seeds_5'),v.id)
    assert.equal(buyStoreItem(s,'seeds_5',{},v.id).ok,true)
    assert.equal(s.resources.money,1e7-cost)
    assert.equal(getResourceLots(s,'seeds')[v.id],5*getSeedsPerBatch(s,{}))
  }
})

test('mixed tobacco retains provenance through every stage and pays the correct cigar value', () => {
  const s=empty()
  addTobaccoResource(s,'seeds',{san_andres:6,piloto:4},10)
  for(const stage of PIPELINE_STAGES) {
    const b=s.buildings.find(b=>b.type===stage.type)
    assert.equal(startBatch(b,s,{}).ok,true)
    assert.deepEqual(b.slot.tobaccoLots,{san_andres:6,piloto:4})
    b.slot.status='ready'
    assert.equal(collectBatch(b,s,{}).ok,true)
    assert.equal(s.resources.storage[stage.outputKey],10)
  }
  const base=getBaseCigarSalePrice(s,{})
  near(getEffectiveSalePrice(s,{}),base*9.4)
  const sale=exportCigars(s,900,{})
  near(sale.cigarsSold,10);near(sale.moneyEarned,base*(6*15+4));near(s.resources.storage.cigars,0)
})

test('premium purchases cannot retroactively revalue old crops and fractional exports consume best stock first', () => {
  const s=empty();s.meta.lifetimeMoneyEarned=1e8;s.resources.money=1e6
  addTobaccoResource(s,'cigars',{piloto:9,connecticut:1},10)
  buyStoreItem(s,'seeds_5',{},'connecticut')
  const base=getBaseCigarSalePrice(s,{})
  const first=exportCigars(s,45,{})
  near(first.cigarsSold,.5);near(first.moneyEarned,base*25*.5)
  near(getResourceLots(s,'cigars').connecticut,.5);near(getResourceLots(s,'cigars').piloto,9)
  const second=exportCigars(s,900,{})
  near(second.moneyEarned,base*(.5*25+9))
})

test('full offline automation conserves crop quantities and value including the in-flight remainder', () => {
  const s=empty()
  for(const b of s.buildings)b.level=10
  addTobaccoResource(s,'seeds',{connecticut:400,piloto:100},500)
  fastForwardAutomation(s,3600,{})
  let quantity=0,value=0
  for(const key of Object.keys(s.resources.storage)){quantity+=s.resources.storage[key];value+=getLotValue(getResourceLots(s,key))}
  for(const b of s.buildings)if(b.slot?.status!=='idle'&&b.slot){quantity+=b.slot.batchSize;value+=getLotValue(b.slot.tobaccoLots)}
  near(quantity,500);near(value,400*25+100)
  assert.ok(s.resources.storage.cigars>0)
})

test('old saves default to Piloto; import preserves premium in-flight batches', () => {
  const s=createInitialState();delete s.resources.tobaccoLots
  s.buildings[0].slot={status:'processing',batchSize:10,startedAt:0,completesAt:1}
  migrateSave({version:1,state:s})
  assert.equal(s.resources.tobaccoLots.seeds.piloto,30)
  assert.equal(s.buildings[0].slot.tobaccoLots.piloto,10)
  s.buildings[0].slot.tobaccoLots={criollo:10}
  const restored=migrateSave(JSON.parse(JSON.stringify({version:1,state:s}))).state
  assert.equal(restored.buildings[0].slot.tobaccoLots.criollo,10)
})

test('prestige clears crops but keeps earnings-based seed unlocks', () => {
  const s=empty();s.meta.lifetimeMoneyEarned=1e8
  addTobaccoResource(s,'seeds',{connecticut:50},50)
  assert.equal(doPrestige(s).ok,true)
  assert.equal(isTobaccoUnlocked(s,'connecticut'),true)
  assert.equal(getResourceLots(s,'seeds').connecticut,undefined)
  assert.equal(getResourceLots(s,'seeds').piloto,30)
})

test('full depot refuses collection without losing premium batch contents', () => {
  const s=empty();const b=s.buildings.find(b=>b.type==='rolling')
  b.slot={status:'ready',batchSize:100000,tobaccoLots:{connecticut:100000}}
  const before=JSON.stringify(s)
  assert.equal(collectBatch(b,s,{}).reason,'output_full')
  assert.equal(JSON.stringify(s),before)
})

for (const stage of PIPELINE_STAGES) test(`${stage.type} selection consumes only chosen input and changes only future batches`, async () => {
  const { setPlantingChoice } = await import('../game/engine/tobaccoEngine.js')
  const s = empty(), b = s.buildings.find(b => b.type === stage.type)
  addTobaccoResource(s, stage.inputKey, { piloto: 3, connecticut: 4 }, 7)
  assert.equal(setPlantingChoice(b, s, 'piloto'), true)
  assert.equal(startBatch(b, s, {}).ok, true)
  assert.deepEqual(b.slot.tobaccoLots, { piloto: 3 })
  assert.equal(setPlantingChoice(b, s, 'connecticut'), true)
  assert.deepEqual(b.slot.tobaccoLots, { piloto: 3 })
  b.slot.status = 'ready'; collectBatch(b, s, {})
  assert.equal(startBatch(b, s, {}).ok, true)
  assert.deepEqual(b.slot.tobaccoLots, { connecticut: 4 })
  b.slot.status = 'ready'; collectBatch(b, s, {})
  addTobaccoResource(s, stage.inputKey, { piloto: 10 }, 10)
  assert.equal(startBatch(b, s, {}).reason, 'no_input_available')
  assert.equal(s.resources.storage[stage.inputKey], 10)
  assert.equal(setPlantingChoice(b, s, 'bogus'), false)
  assert.equal(setPlantingChoice(b, s, null), true)
  assert.equal(startBatch(b, s, {}).ok, true)
})

for (const stage of PIPELINE_STAGES) test(`${stage.type} live and offline automation respect independent choices`, async () => {
  const { runAutomation } = await import('../game/engine/batchEngine.js')
  for (const run of [s => runAutomation(s, {}), s => fastForwardAutomation(s, 600, {})]) {
    const s = empty(), base = s.buildings.find(b => b.type === stage.type)
    s.buildings = [
      { ...structuredClone(base), id: 'auto', level: 10 },
      { ...structuredClone(base), id: 'chosen', level: 10, seedVarietyId: 'connecticut' },
      { ...structuredClone(base), id: 'empty', level: 10, seedVarietyId: 'criollo' }
    ]
    addTobaccoResource(s, stage.inputKey, { piloto: 1000, connecticut: 1000 }, 2000)
    run(s)
    const chosen = s.buildings[1]
    assert.ok(!chosen.slot.tobaccoLots?.piloto)
    assert.equal(s.buildings[2].slot.status, 'idle')
    const lots = [getResourceLots(s, stage.inputKey), getResourceLots(s, stage.outputKey), ...s.buildings.map(b => b.slot.tobaccoLots ?? {})]
    for (const id of ['piloto', 'connecticut']) near(lots.reduce((n, lot) => n + (lot[id] ?? 0), 0), 1000)
    const restored = migrateSave(JSON.parse(JSON.stringify({ version: 1, state: s }))).state
    assert.equal(restored.buildings.find(b => b.id === 'chosen').seedVarietyId, 'connecticut')
  }
})

test('every tobacco variety produces a distinct named cigar', () => {
  assert.equal(new Set(TOBACCO_VARIETIES.map(v => v.cigarName)).size, TOBACCO_VARIETIES.length)
  assert.ok(TOBACCO_VARIETIES.every(v => v.cigarName?.length > 0))
})

for (const stage of PIPELINE_STAGES) test(`${stage.type} automatic processing takes highest-priced stock first`, () => {
  const s = empty(), b = s.buildings.find(b => b.type === stage.type)
  addTobaccoResource(s, stage.inputKey, { piloto: 100, criollo: 100, connecticut: 100 }, 300)
  assert.equal(startBatch(b, s, {}, 5).ok, true)
  assert.deepEqual(b.slot.tobaccoLots, { connecticut: 5 })
  assert.equal(getResourceLots(s, stage.inputKey).piloto, 100)
})

for (const stage of PIPELINE_STAGES) test(`${stage.type} can select any tobacco before unlock or input arrives`, async () => {
  const { setPlantingChoice } = await import('../game/engine/tobaccoEngine.js')
  const s = empty(), b = s.buildings.find(b => b.type === stage.type)
  assert.equal(setPlantingChoice(b, s, 'connecticut'), true)
  addTobaccoResource(s, stage.inputKey, { piloto: 10 }, 10)
  assert.equal(startBatch(b, s, {}).reason, 'no_input_available')
  addTobaccoResource(s, stage.inputKey, { connecticut: 5 }, 5)
  assert.equal(startBatch(b, s, {}).ok, true)
  assert.deepEqual(b.slot.tobaccoLots, { connecticut: 5 })
})
