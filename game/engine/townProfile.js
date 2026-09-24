export const DEFAULT_TOWN_NAME = 'Cigar Country'
export const MAX_TOWN_NAME_LENGTH = 40

export function normalizeTownName(value) {
  return typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim() : ''
}

export function renameTown(state, value) {
  const name = normalizeTownName(value)
  if (!name) return { ok: false, error: 'Enter a name for your town or farm.' }
  if ([...name].length > MAX_TOWN_NAME_LENGTH) return { ok: false, error: `Keep your name to ${MAX_TOWN_NAME_LENGTH} characters or fewer.` }
  state.townProfile = { ...state.townProfile, name }
  return { ok: true }
}

export function getTownStats(state) {
  const buildings = [state.townHall, ...state.buildings]
  return {
    allTimeEarnings: (state.prestige?.lifetimeMoneyEarnedAllTime ?? 0) + (state.meta.lifetimeMoneyEarned ?? 0),
    buildings: buildings.length,
    maxLevelBuildings: buildings.filter(b => b.level >= 10).length,
    processing: buildings.filter(b => b.slot?.status === 'processing').length,
    ready: buildings.filter(b => b.slot?.status === 'ready').length,
    idle: buildings.filter(b => b.slot?.status === 'idle' && !b.upgrade).length,
    upgrading: buildings.filter(b => b.upgrade).length,
    fleet: state.distribution.fleet.reduce((sum, row) => sum + row.count, 0),
    researchLevels: Object.values(state.lab.researchLevels).reduce((sum, n) => sum + n, 0)
  }
}
