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
| Criollo 98 (seco filler reference) | $22.99 | $5,000 | $140 | 1.5× | $30 |
| Corojo 99 (ligero filler reference) | $23.99 | $25,000 | $200 | 2.3× | $46 |
| Sumatra (binder reference) | $24.99 | $100,000 | $300 | 3.5× | $70 |
| Besuki (wrapper reference) | $32.99 | $500,000 | $450 | 5.5× | $110 |
| Habano 2000 (wrapper reference) | $52.99 | $2,000,000 | $700 | 9× | $180 |
| San Andrés (wrapper reference) | $58.99 | $10,000,000 | $1,100 | 15× | $300 |
| Ecuador Connecticut Shade (wrapper reference) | $59.99 | $50,000,000 | $1,700 | 25× | $500 |

Market examples: [Whole Leaf Tobacco's cigar leaf catalog](https://wholeleaftobacco.com/collections/cigar-tobaccos).
Game milestones, seed prices, and payout multipliers are balance decisions,
not claims about real-world seed costs or relative cigar retail prices.

## Rules

- Seed packs still contain 5, 10, 20, or 100 nursery batch-equivalents, sized to
  the largest nursery and current research. Existing bulk discounts apply.
- A crop's seed-price multiplier applies to every pack size.
- Higher-value varieties are processed and exported first. Batches may contain
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
