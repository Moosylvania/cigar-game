// Shared by world art and shop previews. Unknown/legacy tiers use Backyard.
const palettes = {
  backyard: ['#fff7df', null, '#53aa6c', '#85cc82', '#bfa275', '#d39372', '#7cc2c5'],
  county_fair: ['#ffe5bc', '#d78036', '#999c41', '#d7c568', '#98704d', '#cf9850', '#6eb9a7'],
  state_monopoly: ['#d6e8f2', '#387dab', '#398b87', '#83c4b4', '#647d85', '#7b9fae', '#65b9dd'],
  national_syndicate: ['#ebdaef', '#9750a7', '#8b619e', '#c799cc', '#7a6589', '#b486b6', '#a694dd'],
  continental_empire: ['#f3d5ca', '#b94c4f', '#a16c51', '#e4a278', '#906052', '#cf7564', '#77b8ac'],
  global_conglomerate: ['#f7e7b6', '#af8b29', '#778d48', '#c4cc75', '#8a7950', '#d3b85b', '#71bcb8'],
  orbital_greenhouse: ['#c5eef0', '#299eaa', '#39ada9', '#8ce5d1', '#526f80', '#6caec0', '#65dbec'],
  moon_base: ['#e2e7f5', '#788bb5', '#7f8cb8', '#c6d1ef', '#798397', '#a6b4d3', '#a6d3f3'],
  heavenly_fields: ['#fff5d6', '#d0aa52', '#b7b76c', '#f1e7a7', '#b2a17b', '#e7c77d', '#c6ebec'],
  cosmic_ascendant: ['#e2d6ff', '#8952d0', '#9158bf', '#db98ec', '#675086', '#b27cdb', '#be9bff']
}
export function getPrestigePalette(themeId = 'backyard') {
  const [wall, roof, leaf, leafLight, soil, material, water] = palettes[themeId] ?? palettes.backyard
  return { wall, roof, leaf, leafLight, soil, material, water }
}
