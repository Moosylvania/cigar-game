import { TOBACCO_VARIETIES, isTobaccoUnlocked, getTobacco } from '../config/tobacco.config.js'
import { getSeedsPerBatch } from './storeEngine.js'
import { getBaseCigarSalePrice } from './economy.js'
import { getMultipliers } from './labEngine.js'
import { getEpicMultipliers } from './epicResearchEngine.js'
import { getTotalPrestigeMultiplier } from './prestigeEngine.js'
import { getResourceLots, takeTobaccoResource } from './tobaccoEngine.js'

export const MARKET_CUSTOMERS = [
  { name: 'Alex', business: 'Corner tobacconist', color: '#719ec2' },
  { name: 'River', business: 'Garden club', color: '#58ac97' },
  { name: 'Morgan', business: 'Grand hotel', color: '#ab7fbc' },
  { name: 'Casey', business: 'Harbor shop', color: '#d4a858' },
  { name: 'Sam', business: 'Celebration planner', color: '#c8764c' },
  { name: 'Jamie', business: 'Collectors’ lounge', color: '#92ba63' }
]

export function createMarketSet(state, round = 1, reserve = false, completedOrders = 0) {
  const crops = TOBACCO_VARIETIES.filter(v => isTobaccoUnlocked(state, v.id))
  const lab = getMultipliers(state.lab), epic = getEpicMultipliers(state.prestige)
  const batchSizeMultipliers = { nursery: (lab.batchSizeMultipliers.nursery ?? 1) * (epic.batchSizeMultipliers.nursery ?? 1) }
  const batch = getSeedsPerBatch(state, { batchSizeMultipliers })
  const base = getBaseCigarSalePrice(state, {
    salePriceMultiplier: lab.salePriceMultiplier * epic.salePriceMultiplier,
    prestigeMultiplier: getTotalPrestigeMultiplier(state.prestige, epic.prestigeMultiplierBoost)
  })
  const orders = [0, 1, 2].map(index => {
    const count = Math.min(index + 1, crops.length)
    const requirements = Array.from({ length: count }, (_, j) => {
      const crop = crops[(round - 1 + index + j) % crops.length]
      const amount = Math.max(5, Math.ceil(batch * (index + 1) * (1 + Math.min(round - 1, 10) * 0.05) * (1 + ((round + index + j) % 3) * 0.1) / count))
      return { tobaccoId: crop.id, amount, delivered: 0 }
    })
    const premium = [1.4, 1.7, 2][index]
    const reward = Math.ceil(requirements.reduce((sum, r) => sum + r.amount * getTobacco(r.tobaccoId).cigarMultiplier * base, 0) * premium)
    return { id: `${round}-${index}`, customer: (round - 1 + index) % MARKET_CUSTOMERS.length, difficulty: ['Standard', 'Select', 'Prestige'][index], premium, requirements, reward, completed: false }
  })
  return { round, reserve, completedOrders, orders }
}

export function ensureMarket(state) {
  if (!state.market) state.market = createMarketSet(state)
  return state.market
}

export function getOrderProgress(order, state) {
  const lots = getResourceLots(state, 'cigars')
  const total = order.requirements.reduce((n, r) => n + r.amount, 0)
  const delivered = order.requirements.reduce((n, r) => n + r.delivered, 0)
  const available = order.completed ? 0 : order.requirements.reduce((n, r) => n + Math.min(r.amount - r.delivered, Math.floor(lots[r.tobaccoId] ?? 0)), 0)
  return { total, delivered, available, percent: Math.floor(delivered / total * 100) }
}

export function deliverMarketOrder(state, orderId) {
  const order = state.market?.orders.find(o => o.id === orderId)
  if (!order || order.completed) return { ok: false, reason: 'order_unavailable' }
  if (getOrderProgress(order, state).available <= 0) return { ok: false, reason: 'no_matching_cigars' }
  for (const r of order.requirements) {
    const amount = Math.min(r.amount - r.delivered, Math.floor(getResourceLots(state, 'cigars')[r.tobaccoId] ?? 0))
    if (amount > 0) {
      takeTobaccoResource(state, 'cigars', amount, r.tobaccoId)
      r.delivered += amount
    }
  }
  let paid = 0, newSet = false
  if (order.requirements.every(r => r.delivered === r.amount)) {
    order.completed = true
    paid = order.reward
    state.resources.money += paid
    state.meta.lifetimeMoneyEarned = (state.meta.lifetimeMoneyEarned ?? 0) + paid
    state.market.completedOrders++
    if (state.market.orders.every(o => o.completed)) {
      state.market = createMarketSet(state, state.market.round + 1, state.market.reserve, state.market.completedOrders)
      newSet = true
    }
  }
  return { ok: true, paid, newSet }
}

export function repairMarket(state) {
  const m = state.market
  if (!m) { state.market = null; return }
  const valid = Number.isInteger(m.round) && m.round > 0 && typeof m.reserve === 'boolean' && Number.isInteger(m.completedOrders) && m.completedOrders >= 0 &&
    Array.isArray(m.orders) && m.orders.length === 3 && new Set(m.orders.map(o => o?.id)).size === 3 && m.orders.every(o =>
      o && typeof o.id === 'string' && Number.isInteger(o.customer) && !!MARKET_CUSTOMERS[o.customer] && Number.isFinite(o.reward) && o.reward > 0 && typeof o.completed === 'boolean' && ['Standard', 'Select', 'Prestige'].includes(o.difficulty) && [1.4, 1.7, 2].includes(o.premium) &&
      Array.isArray(o.requirements) && o.requirements.length > 0 && new Set(o.requirements.map(r => r?.tobaccoId)).size === o.requirements.length && o.requirements.every(r =>
        r && getTobacco(r.tobaccoId) && Number.isInteger(r.amount) && r.amount > 0 && Number.isInteger(r.delivered) && r.delivered >= 0 && r.delivered <= r.amount) &&
      o.completed === o.requirements.every(r => r.delivered === r.amount))
  if (!valid) state.market = null
  else if (m.orders.every(o => o.completed)) state.market = createMarketSet(state, m.round + 1, m.reserve, m.completedOrders)
}
