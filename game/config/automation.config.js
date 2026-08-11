/**
 * Manual-to-automatic progression: every pipeline building starts fully
 * manual (player must click Start and Collect). Leveling it up unlocks
 * automation in two steps so the game teaches the loop before automating it.
 */
export const AUTO_COLLECT_LEVEL = 4
export const AUTO_START_LEVEL = 7

/**
 * @param {number} level
 * @returns {{ autoCollect: boolean, autoStart: boolean }}
 */
export function getAutomationTier(level) {
  return {
    autoCollect: level >= AUTO_COLLECT_LEVEL,
    autoStart: level >= AUTO_START_LEVEL
  }
}
