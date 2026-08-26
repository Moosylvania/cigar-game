/**
 * Distribution vehicle tiers. Any tier is buyable any time you have the
 * money - there's no depot-level gate on *which* vehicles you can own, only
 * on how *many* total (see distributionEngine.js getMaxSlots, driven by
 * distribution.config.js maxVehicleSlots). The fleet freely mixes tiers -
 * buy whichever combination of trucks/trains you want up to your slot cap.
 * @type {import('../types/distribution.js').VehicleTierConfig[]}
 */
export const VEHICLE_TIERS = [
  { id: 'truck', name: 'Pickup Truck', cost: 100, capacityPerHour: 40, icon: 'mdi:truck-pickup' },
  { id: 'box_truck', name: 'Box Truck', cost: 800, capacityPerHour: 150, icon: 'mdi:truck' },
  { id: 'semi', name: 'Semi Trailer', cost: 3000, capacityPerHour: 320, icon: 'mdi:truck-trailer' },
  { id: 'cargo_train', name: 'Cargo Train', cost: 40000, capacityPerHour: 900, icon: 'mdi:train-car-box' },
  { id: 'freight_train', name: 'Freight Train', cost: 250000, capacityPerHour: 4200, icon: 'mdi:train-car-container' },
  { id: 'bullet_train', name: 'Bullet Train', cost: 2000000, capacityPerHour: 20000, icon: 'mdi:train-variant' }
]

export function getVehicleTier(id) {
  return VEHICLE_TIERS.find((tier) => tier.id === id) ?? null
}

// Each tier has 4 directional sprites (n/e/s/w) in the pack; "_s"
// (facing the viewer) reads best as a static store/panel icon. The pack
// has no dedicated bullet train art, so it borrows freight_train's sprite
// (the biggest train asset available) rather than showing a broken image.
const VEHICLE_SPRITE_FILE = {
  truck: 'pickup_truck',
  box_truck: 'box_truck',
  semi: 'semi_trailer',
  cargo_train: 'cargo_train',
  freight_train: 'freight_train',
  bullet_train: 'freight_train'
}

export function getVehicleSpritePath(tierId) {
  const file = VEHICLE_SPRITE_FILE[tierId]
  return file ? `/images/cigar_sprite_pack_topdown/sprites/vehicles/${file}_s.webp` : null
}

/** @param {string} tierId @param {'n'|'e'|'s'|'w'} direction */
export function getVehicleSpriteDirPath(tierId, direction) {
  const file = VEHICLE_SPRITE_FILE[tierId]
  return file ? `/images/cigar_sprite_pack_topdown/sprites/vehicles/${file}_${direction}.webp` : null
}
