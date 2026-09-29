# Late-game expansion

## Economy and research

- Legacy Leaves are retained. Their cash factor is now `1 + 5 × log10(1 + leafStrength × leaves)`; Leaf Tonic raises strength inside that curve.
- Active-tier cash factor is `1 + 0.5 × tierIndex`. Global Conglomerate is 3.5×, rather than 32×.
- Sale-price research and Epic prestige research add their bonuses across levels and lines, rather than multiplying every purchased level. Production and logistics research retain their existing compounding behavior.
- Foundation research prices grow 1.6–1.65× per level.
- 60 additional lines: Industrial, Orbital, Interstellar, Cosmic. Each includes yield and speed research for all six stages, plus storage, fleet throughput, and price research. Each line has 20 levels. Starting program prices are $100M, $100T, $1Sx, and $1Oc, with 2.1×, 2.5×, 3×, and 3.5× per-level growth respectively.
- Existing cash, leaves, and research purchases remain intact. Adjusted multipliers apply immediately, including offline earnings. No reset is required.

## Distribution and construction

- Cargo Rocket: $2T, 2 billion cigars/hour before research. Requires at least one level-10 distribution depot.
- Level-10 depots display a launch pad. Rockets ignite at its center and accelerate along north/east/south/west routes with animated exhaust.
- Fleet listings and the picker show throughput including normal and Epic research.
- Additional depots: second costs $1Sx, third $1Sp, fourth $1Oc, then ×1,000 each. All depots contribute storage and fleet slots. Merging depots does not reset the purchase price ladder.
- Finish All Construction: choose the existing 100-coin purchase or its $1B cash alternative. These finish upgrades already in progress, including Town Hall.

## Combining buildings

Use Select, select at least two matching buildings, then Combine buildings. The preview shows the footprint, location, and generation before combining.

- Combined production capacity and throughput are 1.5× their sums. Every selected building must be level 10, including previously merged complexes.
- Combined depots receive 1.5× summed storage and fleet slots (usable slots round down).
- Complexes occupy 2×2 tiles; fields occupy 4×4. Repeat combinations keep that footprint and have no generation cap.
- Original merged stat factors carry through subsequent level upgrades, offline production, seed-pack sizing, and save export/import.
- Processing/ready batch contents retain their tobacco varieties. Combined in-progress batches finish at the latest constituent completion time.
- Town Hall is excluded. Finish construction and use a common tobacco preference before combining. The merged footprint must fit on owned, unoccupied land near the selection; failure makes no changes.
- Production complexes use wider stage-specific silhouettes: conservatories, curing halls, horizontal steam vessels, sheltered casks, rolling floors, and greenhouse rows. Later generations add roof-mounted equipment and small indicators. Level-10 depots pair a low freight hangar and mission-control room with a separate octagonal launch apron; rockets render above roofs while launching upright from the pad and flying straight up and existing generated asset.

## Review and validation

`/?showcase=expansion` opens an unsaved review town. It never overwrites the player's save. The regular `/?showcase` art gallery remains available.

Run `node --test tests/*.test.js` and `npm run build`.

Browser review covered a live two-nursery merge, large field rendering, level-10 launch pads, vertical rocket animation, and research-adjusted rocket listings.

## Generated art

Built-in ImageGen was used (not the CLI). Final asset: `public/images/vehicles/cargo-rocket.png`. The launch pad and complex artwork extend the existing canvas illustration system.

Generation prompt:

> Use case: stylized-concept. Asset type: transparent game vehicle sprite for a cozy illustrated cigar factory management game. Primary request: one cargo rocket ship, nose pointing exactly RIGHT, clean side/top three-quarter view, elongated ivory fuselage, muted teal metal fins, gold cargo hatch with tiny leaf emblem, dark green ink outlines, softly shaded hand-painted cartoon shapes matching a friendly farm builder. Entire rocket fully visible centered with generous transparent margins. No launch pad, no background, no text, no flame (flame animated in code). Genuinely transparent background. Single isolated rocket only.

Final edit prompt:

> Use case: background-extraction. Edit this exact cargo rocket sprite. Remove the entire black backdrop and all green/gold ambient glow around the rocket. Background must be actual alpha transparency, fully empty outside the crisp silhouette, not black and not checkerboard. Preserve the exact rocket, its right-facing orientation, colors, shape and detail. No shadow, no glow, no exhaust, no new objects. This is a game sprite composited over grass.

Expansion buildings have animated human and robot crews scaled to their footprint. Rockets remain visible on the pad for their ignition phase before ascending.
