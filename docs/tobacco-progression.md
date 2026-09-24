# Tobacco seed progression

Unlocks use money **earned across all runs**, including the current run. Spending
money or prestiging does not relock crops. Prices below are game currency except
for the explicitly labeled real-world reference column.

The ordering follows one supplier's listed prices for specific leaf grades,
checked September 24, 2026. It is not a universal rarity or quality ranking:
filler, binder, wrapper grade, origin, and crop conditions affect price. Several
reference products were out of stock. These are cured-leaf prices, not seed
prices. The game abstracts each tobacco family or origin into a purchasable crop;
real cigars commonly combine different filler, binder, and wrapper tobaccos.

| Crop | Reference leaf, USD/lb | Lifetime earnings unlock | Game price: 5-batch seed pack | Cigar multiplier | Base game sale/cigar |
| --- | ---: | ---: | ---: | ---: | ---: |
| Piloto (ligero filler reference) | $21.99 | Start | $100 | 1× | $20 |
| Criollo 98 (seco filler reference) | $22.99 | $5,000 | $500 | 1.5× | $30 |
| Corojo 99 (ligero filler reference) | $23.99 | $25,000 | $1,500 | 2.3× | $46 |
| Sumatra (binder reference) | $24.99 | $100,000 | $4,000 | 3.5× | $70 |
| Besuki (wrapper reference) | $32.99 | $500,000 | $10,000 | 5.5× | $110 |
| Habano 2000 (wrapper reference) | $52.99 | $2,000,000 | $22,000 | 9× | $180 |
| San Andrés (wrapper reference) | $58.99 | $10,000,000 | $45,000 | 15× | $300 |
| Ecuador Connecticut Shade (wrapper reference) | $59.99 | $50,000,000 | $80,000 | 25× | $500 |

Market examples: [Whole Leaf Tobacco's cigar leaf catalog](https://wholeleaftobacco.com/collections/cigar-tobaccos).
Game milestones, seed prices, and payout multipliers are balance decisions,
not claims about real-world seed costs or relative cigar retail prices.

## Rules

- Seed packs still contain 5, 10, 20, or 100 nursery batch-equivalents, sized to
  the largest nursery and current research. Existing bulk discounts apply.
- A crop's seed-price multiplier applies to every pack size.
- Each Nursery can select an owned seed variety, or use Automatic for highest-value
  seeds first. Explicit choices wait when depleted and apply only to future batches.
  Automatic Nurseries use stock remaining after explicit choices; Nurseries with the
  same choice share that stock. Preferences persist through saves and offline work.
- Downstream varieties are processed and exported highest-value first. Batches may contain
  multiple varieties, and their quantities remain tracked through the pipeline.
- Buying a premium seed never upgrades previously purchased crops or cigars.
- Actual revenue = sum of each exported variety's quantity × its multiplier ×
  the current base cigar sale price, including existing building/research/boost/
  prestige bonuses. Fleet capacity still limits units sold, not dollar value.
- The header reports the weighted average value of stored cigars. When empty,
  it reports the base cigar value. The Store previews the chosen crop's value.
- Existing saves and untagged batches become Piloto, preserving their prior 1×
  value. Prestige resets crop inventory but preserves earnings-based unlocks.
- Offline automation carries the same variety quantities as manual production.

Run `node --test tests/tobacco.test.js` for progression and accounting regression tests.

Click Seeds or Seedlings to open a Nursery selector, or open any Nursery to set
its own choice. Click Cigars to inspect the Depot. Rolling batches and Depot stock
show distinct farm product names derived from their tracked tobacco varieties;
mixed batches retain separate named products rather than becoming an invented blend.

Premium seed prices assume an upgraded Nursery: the top five-batch pack costs
$80,000. With no sale bonuses its 50 seeds at Nursery level 1 yield only $25,000,
while Nursery level 10 supplies 1,035 seeds worth $517,500 in finished cigars.
Unlocking a crop does not guarantee profitability with an early-game Nursery.
