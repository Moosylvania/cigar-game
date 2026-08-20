// Vite bakes app.baseURL (nuxt.config.js) into import.meta.env.BASE_URL at
// build time - '/' when served from a domain root (dev, Render), or
// '/cigar-game/' on GitHub Pages project sites (see
// .github/workflows/deploy.yml's NUXT_APP_BASE_URL). Public-folder assets
// referenced by a path built at runtime (building/vehicle/decoration/
// terrain sprites - see components/game/renderers/*.js) need that prefix
// applied explicitly: Vite's own asset-path rewriting only sees paths it
// can resolve statically at build time, not ones assembled from data.
export function publicAsset(path) {
  if (!path) return path
  return import.meta.env.BASE_URL + path.replace(/^\//, '')
}
