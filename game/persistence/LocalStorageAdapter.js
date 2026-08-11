const STORAGE_KEY = 'cw-game:save:v1'

/**
 * @implements {import('./SaveAdapter.js').SaveAdapter}
 */
export class LocalStorageAdapter {
  async load() {
    if (typeof localStorage === 'undefined') return null
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  }

  async save(data) {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  async clear() {
    if (typeof localStorage === 'undefined') return
    localStorage.removeItem(STORAGE_KEY)
  }
}
