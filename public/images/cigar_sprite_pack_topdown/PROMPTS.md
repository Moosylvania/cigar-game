# Top-Down Generation Prompt Set

Mode: OpenAI built-in image generation.

## Reference roles

- The new map screenshot was the authoritative geometry reference: north-up, axis-aligned square cells.
- The prior sprite pack supplied only the building identities, color palette and progression concepts.
- The new Main Factory top-down sheet became the art-direction anchor for the remaining assets.

## Shared direction

```text
Use case: stylized-concept
Asset type: production-ready orthographic 2D game sprites for a vertical square-grid cigar-factory builder
Camera: strict 90-degree overhead orthographic top-down, camera directly above, north at top.
Geometry: roofs, plots, property boundaries, paths, roads and rails align horizontally or vertically with square cells.
Style: charming polished hand-painted mobile city-builder art, crisp outlines and slightly stylized realism.
Backdrop: perfectly flat uniform #ff00ff chroma-key background for local removal.
Constraints: no isometric or three-quarter view, no diagonal projection, no diamond tiles, no tilted footprint, no horizon, no cast shadows, no baked-in text, numbers, UI, logos or watermark.
```

## Buildings

Each building request specified exactly ten upgrades in a 5 × 2 sheet. Levels 1–5 occupy the top row and levels 6–10 the bottom row. Later levels become denser and more detailed within a consistent centered square footprint.

- Main Factory / Town Hall: workshop roof to landmark factory campus
- Distribution Depot: loading shed to major regional logistics complex
- Seed Nursery: seedbed to multi-glasshouse propagation complex
- Farm Field: young square plot to mature irrigated tobacco field
- Curing Barn: timber curing roof to multi-wing drying complex
- Steam House: boiler shed to advanced steam-processing works
- Fermentation Center: aging cellar to climate-controlled fermentation hall
- Rolling House: artisan workshop to stately rolling manufactory

## Roads

```text
Create five square grass variants and all fifteen non-empty four-way road adjacency tiles. Every tile is a true square viewed directly overhead. Gravel roads connect at the exact center of relevant square edges with identical width; dead ends terminate at the tile center.
```

## Rails

```text
Create all fifteen non-empty four-way rail adjacency tiles as true square overhead tiles. Rails use identical gauge and ballast width, connect at exact edge centers, use clean quarter-circle curves and include point hardware at junctions.
```

## Decorations

```text
Create twenty overhead decorations: five trees, five shrubs/planting assets, five civic objects and five agricultural/fence objects. Tree trunks are mostly hidden by top-down canopies; benches, walls and fences align to the cardinal grid.
```

## Vehicles

```text
Create Pickup Truck, Box Truck, Semi Trailer, Cargo Train and Freight Train in four consistent cardinal rotations: north, east, south and west. Show roofs and cargo tops directly overhead with no terrain, rails or road beneath them.
```

