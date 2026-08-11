export function createId(prefix) {
  const random = Math.random().toString(36).slice(2, 10)
  const time = Date.now().toString(36)
  return prefix ? `${prefix}_${time}${random}` : `${time}${random}`
}
