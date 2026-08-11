// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'node:url'

// Icon names used anywhere in the app - building/vehicle/research config
// data and Vue components alike. Listed explicitly (rather than relying on
// @nuxt/icon's static-usage scan) because most of these are referenced via
// dynamic bindings (icon names coming from game/config/*.js), which the
// scanner can't see. This forces every one of them into the client bundle
// at build time so icons render offline with no runtime Iconify API call.
const ICON_NAMES = [
  'mdi:factory',
  'game-icons:plant-seed',
  'mdi:wheat',
  'mdi:barn',
  'mdi:pot-steam',
  'mdi:barrel',
  'mdi:cigar',
  'mdi:warehouse',
  'mdi:truck-pickup',
  'mdi:truck',
  'mdi:truck-trailer',
  'mdi:train-car-box',
  'mdi:train-car-container',
  'mdi:shovel',
  'mdi:seedling',
  'mdi:currency-usd',
  'mdi:cash-multiple',
  'mdi:tag-outline',
  'mdi:map-plus',
  'mdi:flask-outline',
  'mdi:cursor-move',
  'mdi:fast-forward',
  'mdi:check',
  'mdi:close',
  'mdi:tray-arrow-down',
  'mdi:arrow-up-bold-circle-outline',
  'mdi:plus',
  'mdi:minus',
  'mdi:fit-to-screen-outline',
  'mdi:storefront-outline',
  'mdi:seed-outline',
  'mdi:watering-can-outline',
  'mdi:truck-fast-outline',
  'mdi:chevron-up',
  'mdi:water',
  'mdi:tractor',
  'mdi:silo',
  'mdi:gauge',
  'mdi:archive-outline',
  'mdi:alert-outline',
  'mdi:crown',
  'mdi:leaf',
  'mdi:lock-outline',
  'mdi:trophy-outline',
  'mdi:trophy-award',
  'mdi:test-tube',
  'mdi:leaf-circle',
  'mdi:cog-outline',
  'mdi:train',
  'mdi:glass-mug-variant',
  'mdi:robot-industrial-outline',
  'mdi:star-four-points-outline',
  'mdi:weather-partly-cloudy',
  'mdi:crown-outline',
  'mdi:delete-outline'
]

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', '@nuxt/icon'],
  icon: {
    clientBundle: {
      icons: ICON_NAMES,
      scan: true
    }
  },
  // The game is entirely client-side state (localStorage save, canvas
  // rendering, real-time timers) - SSR would just render a throwaway
  // default game state and cause a hydration mismatch against it.
  ssr: false,
  alias: {
    '#game': fileURLToPath(new URL('./game', import.meta.url))
  }
})
