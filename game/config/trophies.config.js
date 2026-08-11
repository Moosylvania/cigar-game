import { TOBACCO_VARIETIES } from './prestige.config.js'

/**
 * Trophies tied to prestige progress - a handful of prestige-count
 * milestones plus one per tobacco variety, unlocked the moment that
 * variety unlocks. Purely collectible (no mechanical effect); see
 * prestigeEngine.checkTrophies for when these get evaluated.
 * @typedef {Object} TrophyDefinition
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} icon
 * @property {(prestige: import('../types/prestige.js').PrestigeState) => boolean} check
 */

/** @type {TrophyDefinition[]} */
export const TROPHIES = [
  {
    id: 'first_prestige',
    name: 'Fresh Start',
    description: 'Prestige for the first time.',
    icon: 'mdi:trophy-outline',
    check: (p) => p.totalPrestigeCount >= 1
  },
  {
    id: 'prestige_5',
    name: 'Seasoned Grower',
    description: 'Prestige 5 times.',
    icon: 'mdi:trophy-outline',
    check: (p) => p.totalPrestigeCount >= 5
  },
  {
    id: 'prestige_25',
    name: 'Tobacco Baron',
    description: 'Prestige 25 times.',
    icon: 'mdi:trophy-award',
    check: (p) => p.totalPrestigeCount >= 25
  },
  {
    id: 'prestige_100',
    name: 'Legacy Farmer',
    description: 'Prestige 100 times.',
    icon: 'mdi:trophy-award',
    check: (p) => p.totalPrestigeCount >= 100
  },
  ...TOBACCO_VARIETIES.map((variety, index) => ({
    id: `unlock_${variety.id}`,
    name: `${variety.name} Grower`,
    description: `Unlock the ${variety.name} tobacco tier.`,
    icon: 'mdi:leaf',
    check: (p) => p.unlockedCount > index
  }))
]

export function getTrophyDefinition(trophyId) {
  return TROPHIES.find((t) => t.id === trophyId) ?? null
}
