---
name: Cigar Country
description: An illustrated 2D production town
colors:
  ink: "#eee9dc"
  panel: "#202c28"
  border: "#4d6258"
  muted: "#b0bdb4"
  accent: "#dfb866"
  money: "#91cf91"
  danger: "#ed9383"
rounded:
  sm: "4px"
  md: "8px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
---

## Overview

**Creative North Star: "The Illustrated Production Town"**

The playable map leads. Buildings use crisp Canvas 2D silhouettes, dark
outlines, pale walls, and distinct coral, teal, blue, yellow, and mauve roofs.
Building and object art is authored in Canvas 2D. The meadow uses a local,
optimized Higgsfield Z Image texture, generated for 0.15 credits.

## Colors

Charcoal-green panels, warm ivory text, and gold controls frame a dusk meadow.
Backyard roof colors distinguish production stages. All ten prestige palettes
coordinate walls, roofs, crops, foliage, water, and decoration materials;
prestige changes materials without changing level geometry. Money, warnings, and collectible states retain
their semantic meaning.

## Typography

Compact readable labels keep the town visible. Interface text uses the local
font stack in `_variables.scss`. Canvas labels fit their footprint and truncate
when needed. A custom display face is not part of this implementation.

## Layout

Resources and actions sit above the map. The build menu is a 230px rail on
desktop and a 104px horizontal strip below the map at 700px and narrower.
Camera controls remain anchored in the lower left, in a horizontal row on
mobile. Mobile starts at 1.35x. Compact production tiles show progress arcs;
countdowns appear only when the available label space is sufficient.

## Elevation & Depth

Flat fills and outlines define the buildings. A small ground shadow anchors
each one. Existing dialog backdrops separate focused actions from the map. Buildings,
decorations, and vehicles share ground-position depth sorting; labels and action
indicators render in a separate foreground pass.

## Shapes

Shared controls use small corners. Building art uses a normalized 100-unit
coordinate space and is rendered directly at the current zoom.

## Components

**The Shared Artwork Rule.** The build menu, upgrade panels, fleet picker, and
decoration store use animated Canvas previews from the same renderers as the
map. Visible previews share one 20fps clock and skip offscreen/hidden painting.

**The Fixed Footprint Rule.** Motion affects artwork, never placement bounds,
labels, or status hit targets. Real production time remains independent of
ambient motion.

The canvas renders at up to 30fps and skips hidden-tab painting. Plants sway,
flags move, steam rises during production, and rolling conveyors advance.
The pause button persists its preference separately from game saves; the
system reduced-motion setting supplies the default.

All eight building types have idle motion and production-specific activity.
All twenty decorations have foliage, water, cargo, light, or surface cycles.
Fleet artwork uses six distinct transport silhouettes: open-bed pickup, enclosed
box truck, articulated semi, steam cargo train, diesel container train, and
streamlined electric bullet train. Coupled train cars and animated wheels
follow route direction; artwork remains inside its fixed rendering bounds.
Upgrades add scaffolding and a working winch; completion and collection emit
bounded, transient spark/parcel bursts. Every building has ten distinct level
designs. Level selects roof profile, facade proportions, work bays, and
type-specific equipment; prestige selects wall, roof, trim, glass/equipment,
and planting colors. The Field grows from a planted patch into a covered
growing house. Levels 5–10 progressively introduce panel seams, light strips,
sensor arrays, corner armor, antennae, and powered supports. These details
use prestige material colors and attach at roof edges and foundations.
From level 6, traditional roofs become angular technology decks. Levels 7–10
retain the full prestige wall palette without gray blending. Large,
type-specific landmarks grow across those levels: stepped civic spires,
ribbed conservatories, exposed turbines, graduated fermentation vessels,
sawtooth ventilation towers, articulated robot gantries, and flight decks
with freight control towers. Fields gain an enclosed growing canopy at level 8.
Decorative crews work in the foreground of each building. One human starts
at level 1; crews grow at levels 4 and 8. Robot helpers appear at level 7,
with fully robotic crews at level 10. Tools and tasks reflect the building
type. Human figures share a stylized golden face color. All crews alternate
approach, work, return, and unload stages at fixed, grounded stations.
Hands reach valves, planted beds, racks, vats, rolling tables, and terminals.
Cargo is carried to loading docks and crews return empty;
idle crews follow a slower cycle. Workers use the existing motion clock and freeze when motion is off;
they do not alter simulation state, placement, or interaction bounds.
Map and preview art use the same level renderer.

## Do's and Don'ts

- Do preserve gameplay, save compatibility, and recognizable building roles.
- Do use existing MDI icons for controls and descriptive button titles.
- Do keep production and upgrade counters active when ambient motion is off.
- Don't move click targets with animation.
- Don't spend generation credits without checking the user's budget.
