export function now() {
  return Date.now()
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function formatDuration(seconds) {
  const total = Math.max(0, Math.ceil(seconds))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}
