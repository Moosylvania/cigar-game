// Market-inspired ordering, not a universal rarity scale. Examples are retail
// prices for particular cured-leaf grades, not seed prices or commodity quotes.
// Source: wholeleaftobacco.com/collections/cigar-tobaccos, checked 2026-09-24.
export const TOBACCO_VARIETIES = [
  { id: 'piloto', cigarName: 'Piloto Classic', name: 'Piloto', unlockAt: 0, seedCostMultiplier: 1, cigarMultiplier: 1, marketPrice: 21.99, referenceGrade: 'Piloto ligero filler', description: 'Your dependable starter crop.' },
  { id: 'criollo', cigarName: 'Criollo Heritage', name: 'Criollo 98', unlockAt: 5000, seedCostMultiplier: 5, cigarMultiplier: 1.5, marketPrice: 22.99, referenceGrade: 'Criollo 98 seco filler', description: 'A richer heritage crop for your growing farm.' },
  { id: 'corojo', cigarName: 'Corojo Reserve', name: 'Corojo 99', unlockAt: 25000, seedCostMultiplier: 15, cigarMultiplier: 2.3, marketPrice: 23.99, referenceGrade: 'Corojo 99 ligero filler', description: 'A higher-value Cuban-seed family.' },
  { id: 'sumatra', cigarName: 'Sumatra Signature', name: 'Sumatra', unlockAt: 100000, seedCostMultiplier: 40, cigarMultiplier: 3.5, marketPrice: 24.99, referenceGrade: 'Sumatra binder', description: 'A distinctive Indonesian-origin crop.' },
  { id: 'besuki', cigarName: 'Besuki Select', name: 'Besuki', unlockAt: 500000, seedCostMultiplier: 100, cigarMultiplier: 5.5, marketPrice: 32.99, referenceGrade: 'Besuki wrapper', description: 'A specialty wrapper-inspired harvest.' },
  { id: 'habano', cigarName: 'Habano Prestige', name: 'Habano 2000', unlockAt: 2000000, seedCostMultiplier: 220, cigarMultiplier: 9, marketPrice: 52.99, referenceGrade: 'Habano 2000 wrapper', description: 'Premium wrapper stock for a serious operation.' },
  { id: 'san_andres', cigarName: 'San Andrés Grand Reserve', name: 'San Andrés', unlockAt: 10000000, seedCostMultiplier: 450, cigarMultiplier: 15, marketPrice: 58.99, referenceGrade: 'Genuine San Andrés wrapper', description: 'A prized Mexican-origin specialty crop.' },
  { id: 'connecticut', cigarName: 'Connecticut Crown', name: 'Ecuador Connecticut Shade', unlockAt: 50000000, seedCostMultiplier: 800, cigarMultiplier: 25, marketPrice: 59.99, referenceGrade: 'Ecuador CT Shade wrapper', description: 'Your top-tier shade-wrapper-inspired crop.' }
]
export const DEFAULT_TOBACCO_ID = TOBACCO_VARIETIES[0].id
export const getTobacco = id => TOBACCO_VARIETIES.find(t => t.id === id)
export const getLifetimeTobaccoEarnings = state => (state.prestige?.lifetimeMoneyEarnedAllTime ?? 0) + (state.meta?.lifetimeMoneyEarned ?? 0)
export const isTobaccoUnlocked = (state, id) => !!getTobacco(id) && getLifetimeTobaccoEarnings(state) >= getTobacco(id).unlockAt
