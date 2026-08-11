import { LocalStorageAdapter } from './LocalStorageAdapter.js'

/**
 * The single line that changes when swapping to a future SQL-backed
 * ApiSaveAdapter - no engine, store, or component code needs to change.
 * @returns {import('./SaveAdapter.js').SaveAdapter}
 */
export function createSaveAdapter() {
  return new LocalStorageAdapter()
}
