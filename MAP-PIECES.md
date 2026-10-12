# Map generation pieces

The Map pieces workbench decomposes the six user-supplied Metroid Prime top-down maps into original parametric abstractions. It does not trace raster outlines, import Nintendo meshes, or infer exact heights from top-down views.

## Structure before geometry

| Reference | Useful structure |
| --- | --- |
| Pirate Frigate | Aligned deck spine; utility bypass loop; short service branches; airlock thresholds; central reactor landmark; explicit lift shafts. |
| Tallon Overworld | Large clearing hubs; canyon connectors; short alcoves; natural-to-constructed transitions. |
| Chozo Ruins | Multi-entrance plazas; side courts; bent access halls; radial landmarks; loops around a central hub. |
| Magmoor Caverns | Long chamber–neck sequence; faceted basins; irregular tunnels; small one-entrance alcoves; embedded station. |
| Phendrana Drifts | Shore basins and branching caves transition to aligned research halls; return paths at different heights. |
| Phazon Mines | Industrial hubs and narrow access links; cavern transitions; elevator-separated strata. |

## Reusable pieces

`dist/map-pieces.mjs` exports 18 definitions. Each contains a normalized footprint, environment family, role, suggested entrance sockets with outward normals, source motif, and placement rule. `instantiatePiece` scales and rotates a footprint into metre-based room volumes and transforms its sockets. Suggested sockets are library attachment candidates. `boundarySocket` places an actual connection on the footprint boundary toward its neighbor.

Craft pieces: chamfered hall, stepped bay, cross junction, U-shaped court, radial core, lift cell, service pocket, straight hall, dogleg hall.

Natural pieces: faceted basin, lobed cavern, bent ravine, shore chamber, pinch tunnel, bent tunnel, rock alcove.

Mixed pieces: terraced atrium, embedded station.

The U court's recess is outside its footprint. The radial core's central machinery is a placement rule, not a modeled hole or imported asset. Roof heights in the study are illustrative. Terrain clearance in the main generator continues to constrain room heights.

## Generation and integration

`generatePieceLayout({family, seed, scale})` creates a deterministic connected two-level study with a return loop and a terminal side branch on each level. Lift footprints share X/Z coordinates across levels. Connections meet actual boundary points; variable-width natural passages have a 2.1 m minimum width at the smallest supported scale. The export includes metre-based polygons, volumes, doors, walking edges and explicit elevator links.

The main generator's `pieceStyle` selects existing, constructed, natural or mixed hall silhouettes for Plate-class, Systems-class and Orbital. It preserves existing transport and terrain constraints. Whole-ship room placement still uses the existing sparse hull-aware generator; the study demonstrates local topology independently.

The provided repository, https://github.com/JustinDMS/prime-map-tool, was inspected through its README, source and tree. It provides Randovania graph data, extracted room bounds and transparent per-room overhead renders. Its data can support future measurement of actual room proportions and door transforms, but no source code or game assets from that repository are incorporated here.

## Verification

- `node validate-pieces.mjs`: 18 piece instances and rotated sockets; 36 deterministic study configurations; graph connectivity and two return loops; vertically aligned elevators; wall-boundary entrances; finite volumes and export; all three new families in all three main envelopes.
- `node validate-ui.mjs`: all 18 piece selections, top-down and volume projections, all generation families and both levels, plus existing map controls.
- `node validate.mjs` and `node validate-garden.mjs`: existing clearance, connectivity and garden regressions.
- Existing `validate-plate.mjs` still expects the superseded 90 × 60 × 20 km plate. Existing `validate-volumes.mjs` expects hall heights above the current 130 m clamp. These assertions already fail on the unchanged source and are not changed in this patch.
