// Short-scale naming, largest first (the lookup below stops at the first
// unit the value clears). Two-letter abbreviations past Trillion match
// common idle-game convention - prestige multipliers (up to ~1000x per
// tier, multiplied across 10 tiers, see prestigeEngine.js) and Epic
// Research costs (up to ~2.5 sextillion, see epicResearch.config.js) both
// reach well past a trillion, so the named range needs real headroom
// rather than falling back to "e+21" scientific notation.
const UNITS = [
  { value: 1e36, suffix: 'Ud' }, // Undecillion
  { value: 1e33, suffix: 'Dc' }, // Decillion
  { value: 1e30, suffix: 'No' }, // Nonillion
  { value: 1e27, suffix: 'Oc' }, // Octillion
  { value: 1e24, suffix: 'Sp' }, // Septillion
  { value: 1e21, suffix: 'Sx' }, // Sextillion
  { value: 1e18, suffix: 'Qi' }, // Quintillion
  { value: 1e15, suffix: 'Qa' }, // Quadrillion
  { value: 1e12, suffix: 'T' }, // Trillion
  { value: 1e9, suffix: 'B' }, // Billion
  { value: 1e6, suffix: 'M' } // Million
]

function roundTo(value, decimals) {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/**
 * Formats a number with grouped commas below a million, and a K/M/B/T...
 * named-scale acronym at a million and above (one decimal place, trimmed
 * when whole) - so costs that run into the billions/trillions/sextillions
 * (see epicResearch.config.js) stay readable instead of turning into a
 * wall of digits or opaque scientific notation.
 * @param {number} value
 * @returns {string}
 */
export function formatCompactNumber(value) {
  const num = Math.floor(value)
  const abs = Math.abs(num)

  for (const unit of UNITS) {
    if (abs >= unit.value) {
      const rounded = roundTo(num / unit.value, 1)
      return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}${unit.suffix}`
    }
  }

  return num.toLocaleString()
}

/**
 * Same named-scale suffixes as formatCompactNumber, but for "Nx" multiplier
 * displays (prestige tiers, resource bar) - keeps fractional precision
 * below a million instead of flooring to an integer, since a multiplier
 * like 2.35x or 500.5x is meaningful at that scale in a way a money amount
 * isn't. Always includes the trailing "x".
 * @param {number} value
 * @returns {string}
 */
export function formatMultiplier(value) {
  const abs = Math.abs(value)

  for (const unit of UNITS) {
    if (abs >= unit.value) {
      const rounded = roundTo(value / unit.value, 1)
      return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}${unit.suffix}x`
    }
  }

  if (abs < 10) return `${roundTo(value, 2).toFixed(2)}x`
  if (abs < 1000) return `${roundTo(value, 1).toFixed(1)}x`
  return `${Math.round(value).toLocaleString()}x`
}
