# Cigar Builder Top-Down Sprite Pack

This version is rebuilt for the supplied north-up, axis-aligned square grid. Every asset uses a strict overhead orthographic camera rather than an isometric or diagonal view.

## Contents

- 80 building sprites: 8 families × 10 upgrade levels
- 20 terrain sprites: 5 grass variants + 15 four-way road tiles
- 15 four-way rail tiles
- 20 top-down decorations
- 20 logistics sprites: 5 vehicle tiers × 4 cardinal directions
- 12 transparent sprite sheets and 12 chroma-key source sheets
- Labeled visual catalogs and an overview preview

Total individual PNGs: **155**

## Camera and grid rules

- Camera: true 90-degree overhead orthographic
- North: top of the image
- Grid: square cells with horizontal and vertical edges
- Roads and rails: fully opaque 256 × 256 tiles that fill the complete canvas edge-to-edge
- Buildings, decorations and vehicles: transparent 512 × 512 canvases
- Suggested pivot for every sprite: `(0.5, 0.5)`
- Upgrade levels stay within one consistent footprint per building family

## Suggested grid footprints

- Main Factory / Town Hall: 2 × 2 cells
- Distribution Depot: 2 × 2 cells
- Farm Field: 2 × 2 cells
- Seed Nursery: 1 × 1 or 2 × 2 cells, depending on your current placement rules
- Curing Barn: 1 × 1 cell
- Steam House: 1 × 1 cell
- Fermentation Center: 1 × 1 cell
- Rolling House: 1 × 1 cell

The large sprites can be scaled to the exact pixel size of your existing 2 × 2 placeholders without changing their logical collision footprints.

## Folder layout

```text
cigar_sprite_pack_topdown/
├── README.md
├── manifest.json
├── PROMPTS.md
├── catalog/             # labeled visual indexes
├── preview/
├── sheets/
│   ├── source/          # original magenta chroma-key sheets
│   └── transparent/     # alpha PNG sheets
└── sprites/
    ├── buildings/
    ├── decorations/
    ├── vehicles/
    ├── terrain/
    └── rails/
```

## Vehicle directions

Every vehicle tier is provided facing:

- `_n`: north / up
- `_e`: east / right
- `_s`: south / down
- `_w`: west / left

Vehicle tiers are Pickup Truck, Box Truck, Semi Trailer, Cargo Train and Freight Train.

## Road and rail adjacency naming

- Dead ends: `_dead_end_n`, `_dead_end_e`, `_dead_end_s`, `_dead_end_w`
- Straights: `_straight_ns`, `_straight_ew`
- Corners/curves: `_corner_ne`, `_corner_es`, `_corner_sw`, `_corner_wn`
- T junctions: `_t_missing_n`, `_t_missing_e`, `_t_missing_s`, `_t_missing_w`
- Four-way: `_cross`

## Production notes

- Built-in OpenAI image generation was used with the new map screenshot as the authoritative geometry reference.
- The previous sprite pack was used only to preserve building identities, palettes and upgrade concepts.
- Flat magenta backgrounds were removed locally and all alpha assets were validated.
- Road and rail tiles were normalized to fully opaque, seamless square canvases.
- No labels, level numbers, UI, logos or watermarks are baked into the sprites.

