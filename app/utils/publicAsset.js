// import.meta.env.BASE_URL is Vite's *build-assets* base (Nuxt's
// buildAssetsDir, '/_nuxt/' by default) - not the app's site-root baseURL,
// even though it's tempting to assume otherwise. The real app.baseURL
// ('/' when served from a domain root (dev, Render), or '/cigar-game/' on
// GitHub Pages project sites - see .github/workflows/deploy.yml's
// NUXT_APP_BASE_URL) is what public-folder assets referenced by a path
// built at runtime (building/vehicle/decoration/terrain sprites - see
// components/game/renderers/*.js) need prepended. Nuxt inlines it on
// window.__NUXT__.config.app.baseURL in the initial HTML, so read it from
// there rather than from import.meta.env.BASE_URL.
export function publicAsset(path) {
  if (!path) return path
  const baseURL = (typeof window !== 'undefined' && window.__NUXT__?.config?.app?.baseURL) || '/'
  return baseURL.replace(/\/+$/, '') + '/' + path.replace(/^\/+/, '')
}
