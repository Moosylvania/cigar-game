---
name: Cigar Country
description: An illustrated 2D production town
colors:
  ink: "#294844"
  panel: "#fcfdf8"
  border: "#b4c8be"
  muted: "#566e66"
  accent: "#b45148"
  money: "#2e794e"
  danger: "#b3423d"
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

Pale panels and dark green ink provide contrast against the meadow. Roof
colors distinguish production stages. Prestige changes wall and roof colors;
space tiers add antenna details. Money, warnings, and collectible states retain
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
each one. Existing dialog backdrops separate focused actions from the map.

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
Fleet artwork has moving wheel treads, suspension, exhaust, and cargo.
Upgrades add scaffolding and a working winch; completion and collection emit
bounded, transient spark/parcel bursts. Levels 3, 6, and 9 add building details.

## Do's and Don'ts

- Do preserve gameplay, save compatibility, and recognizable building roles.
- Do use existing MDI icons for controls and descriptive button titles.
- Do keep production and upgrade counters active when ambient motion is off.
- Don't move click targets with animation.
- Don't spend generation credits without checking the user's budget.
