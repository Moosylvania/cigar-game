/**
 * Distribution vehicle tiers, ordered low to high. The fleet holds exactly
 * one tier at a time (see types/distribution.js) - buy more of the current
 * tier to fill the depot's slots, then upgrade the whole fleet to the next
 * tier once it's unlocked, Egg-Inc style, instead of freely mixing tiers.
 * @type {import('../types/distribution.js').VehicleTierConfig[]}
 */
export const VEHICLE_TIERS = [
  { id: 'truck', name: 'Pickup Truck', cost: 100, unlockDistributionLevel: 1, capacityPerHour: 20, icon: 'mdi:truck-pickup' },
  { id: 'box_truck', name: 'Box Truck', cost: 800, unlockDistributionLevel: 3, capacityPerHour: 60, icon: 'mdi:truck' },
  { id: 'semi', name: 'Semi Trailer', cost: 5000, unlockDistributionLevel: 5, capacityPerHour: 150, icon: 'mdi:truck-trailer' },
  { id: 'cargo_train', name: 'Cargo Train', cost: 40000, unlockDistributionLevel: 7, capacityPerHour: 600, icon: 'mdi:train-car-box' },
  { id: 'freight_train', name: 'Freight Train', cost: 250000, unlockDistributionLevel: 9, capacityPerHour: 2500, icon: 'mdi:train-car-container' }
]

export function getVehicleTier(id) {
  return VEHICLE_TIERS.find((tier) => tier.id === id) ?? null
}

/**
 * @param {string} currentTierId
 * @returns {import('../types/distribution.js').VehicleTierConfig|null} the tier one step up, or null at the top of the ladder
 */
export function getNextVehicleTier(currentTierId) {
  const index = VEHICLE_TIERS.findIndex((tier) => tier.id === currentTierId)
  if (index === -1 || index === VEHICLE_TIERS.length - 1) return null
  return VEHICLE_TIERS[index + 1]
}
