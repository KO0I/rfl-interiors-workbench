# Imported RFL geometry and scale

## Plate-class (90 × 60 × 20 km)

The separate Plate-class entry uses SI metres and a full chamfered deck boundary, with stepped perimeter terraces based on the user-supplied reference. Its design envelope is 90,000 × 60,000 × 20,000 m, spanning y = −18,000 to +2,000 m. The garden occupies an inset 90% footprint. The inhabited deck bands occupy the 96% hull footprint; these are sparse selected levels, not a fully populated ship.

`dist/climate-terrain.js` is copied from `KO0I/rfl-climate-workbench`, `dist/terrain.js`, Git blob `5b40d12d06995e3b7f62ff7f455167e7a6ce2cd0`. Its existing provenance notice is retained; no new license is assigned. Plate terrain calls the original `ExoTerrain.fbm` implementation (four octaves of hash3/value noise) with planar coordinates. This does not run the climate workbench's atmospheric solver. Procedural lake and engineered level-river channels are an Interiors addition, not a fluid/erosion simulation.

Stages separate terrain, carved water, and edge interiors/rail. Water exports contain closed per-triangle bed-to-surface prisms with calculated volumes. Room roofs clear conservative height-field cell minima; rail runs below the deepest allowed basin. Rooms, rail and level outlines fit the chamfered cross-section. Forward quarters have actual edge windows; aft hangars have hull apertures. Rail loops, inward hall spurs, walking links and elevators form one connected graph. Tiny room markers are enlarged only for map selection; exported dimensions and third-person views retain metre scale.

Validation: `node validate-plate.mjs`, `node validate-ui.mjs`, plus the unchanged GSV/Orbital regression suite `node validate.mjs`.

The requested GitHub repository `KO0I/rasd-fastwalker-league-js` was inspected at main commit `ecaa4b4200dddfe61519c198081341c5d4602592`. Its tree did not contain the GSV or third-person avatar assets. These are therefore copied from the existing Rasd Fastwalker League Site source, commit `d9b0884a5d6539b05504b0a79378b6f3610e746e`:

- `dist/gsv-geometry.js` → `dist/gsv-geometry.mjs`, byte-identical imported hull.
- `dist/assets/characters/faceted.bin` → `dist/assets/player.bin`, byte-identical avatar.
- `dist/assets/characters/faceted.png` → `dist/assets/player.png`, byte-identical atlas.

The GSV catalog radius is 27,000,000, divided by 1,000 and multiplied by 0.5 in `rfl-scenes.js`: 13,500 gameplay units per normalized mesh unit. `avatar-motion.js` specifies a 1.95-unit avatar and a 1.8-unit eye height. Interiors uses that relative scale, naming one avatar-scale gameplay unit one interior metre. It deliberately does not apply flight-scale.js's astronomical kilometre conversion to the avatar. Ship and player never receive independent visual rescaling.

Garden selection uses upward-facing flat triangles from the imported mesh, matching the game's four garden deck levels. The editable room envelope is a small section under a garden, not a replacement full-ship hull. Bounds are checked against the imported slab above and hull below. JSON exports retain the ship-local origin, scale, source commit, and avatar height. Ship overview shows its placement; the third-person cutaway shows the selected or pinned room at player scale. No vertical exaggeration is applied to the room view.

## Terrain and spacious interiors (October 2 update)

`terrain.mjs` builds a deterministic triangular height field in a bounded garden sector. `hull-terrain.mjs` removes the original top faces inside that sector and inserts the new terrain, preserving the remaining imported hull. The identical sampled height field determines the rendered lakebeds and conservative room roof clearances. The lake surface is clipped at water level; roofs clear the lakebed, not just the water surface.

Generation now uses separate octagonal/stepped public halls and small residential clusters, with most of the sector left unbuilt. Walking corridors, elevator shafts and long rail lines are separate connections. The upper-level hall sites avoid deep lakebeds; terrain elevation governs available hall height. Lower levels have shared daylight wells with clerestory-gallery paths. Surface daylight lanterns are 4–4.5 m tall, while elevator terminals are 9 m tall and within 45 m of a rail station. The ground view and third-person cutaway retain the imported 1.95 m avatar.

The v2 JSON export includes the height field, ship-local origin, room polygons, stone-frame specifications, skylights, light wells and galleries, surface terminals, elevator connections, and rail fast-travel edges. This is a procedural design workbench: E/R controls preview map travel, and generated layouts are not automatically installed into the RFL game.

## Personal-site visual style

Controls use the Inter family (400/500/700/900), near-black `#0f0e15`, dark plum `#1b101e`, muted purple `#a67ca8`, hover purple `#a860ff`, heavy headings and 8 px button corners from `KO0I/KO0I.github.io` (`master`, commit `788dc19db681495a80cd0ab5d103830af76ef213`). Sources: `_includes/head.html`, `css/_0-settings/variables.scss`, `css/_2-base/base.scss`, `css/_3-modules/buttons.scss`. Terrain and room colours retain their functional meanings.

## Hull edges and landscape architecture

Schema v3 adds actual side-face hangars aft and viewing galleries forward, rail links, embedded angular surface stonework and sealed lake crossings. The imported mesh does not declare a bow; +X is the default and the UI can reverse it. Edge volumes fit triangle boundaries and extend inward. Windows require both room-boundary and actual exterior-face contact; distant daylight shafts are not exterior room windows. Sector density statistics exclude the separately generated hull-edge volumes.

## Layered garden prototype

`garden-layer.mjs` is an original bounded JavaScript implementation inspired by LayerProcGen's one-way generation dependencies, not a port or bundled copy of that C# framework. Plate-class has an optional 15 × 15 km garden study adjoining the existing lake. It uses unchanged climate-derived terrain and closed water volumes, then plans dry A* walking routes on a 150 m grid with <=25 m edge sampling and an 18% maximum grade. Routes are exported as ground-following polylines. A buried stone hall clears conservative terrain minima and connects by a physical floor corridor and elevator to its surface entrance. A second elevator reaches a sealed rail spur below the maximum basin depth, connecting existing perimeter rail and edge quarters.

The bounded generation is eager, not chunk streaming; runtime NPC locomotion, avoidance, and train animation remain future work. The navigation export supplies destinations, graph connections and route geometry; existing legacy edges can still lack detailed paths. Walking route samples use the exact shared triangular terrain height function. `validate-garden.mjs` covers three seeds, slope/water clearance, hall cover, all-room reachability, below-basin rail, deterministic output and unchanged upstream terrain/water. Automated UI smoke covers focused/full-ship rendering. Browser visual QA was unavailable in this environment.

## Room volumes and ship compass — October 2, 2026

- Plate-class now renders floors, walls and roofs as selectable translucent volumes. Surface overlay remains translucent and does not disable rooms. Startup and Populate rooms open Volume; Focus space frames a selected room at its actual metric size.
- Shared shapes: octagonal, stepped, cruciform, elbow, hexagonal, tapered and T-shaped; terraced ceilings export as non-overlapping `volumes` with an aggregate cubic-metre `volume`. Halls in the full Plate envelope range up to several kilometres across; conventional GSV/Orbital sections retain their local scale.
- The Plate garden has a 16 km winding canyon carved during terrain generation, outside the existing lake and layered garden section. Stage 3 registers it as a connected `openToSky` map room. Its exported `floorMesh` clips the same terrain triangles exactly; the upper boundary is a map envelope, not a physical roof. Enclosed rooms still require stone cover and never treat open-sky exemptions as a window allowance.
- The compass uses the same yaw/pitch projection as each view. With +Y up and bow at +X, port is −Z and starboard is +Z. Reversing the bow reverses both pairs; B/A/P/S labels apply to Plate and GSV. Orbital cardinal labels also remain on the structural XZ plane.
- `validate-volumes.mjs` covers shape/ceiling geometry, terrain-matching canyon floors, connectivity, visible Plate walls with the overlay enabled, focused views at desktop/mobile sizes, exports and compass orientation.

## Plate landscape, bow bridge, hangar deck and scale comparison — October 2, 2026

- The 90 × 60 × 20 km core hull retains its dimensions. A tapered central bow extension projects 3 km beyond it (93 km overall). Its enclosed bridge has a bow-facing window, a walking access gallery, and a rail interchange. The projection follows the bow setting; its envelope and room volumes export with the layout.
- Plate-class defaults to four selected deck bands. The lowest band has 6 × 4.5 km aft hangars, forward service bays, freight assembly spaces, and rail/elevator connections. These bands still leave most of the hull empty.
- `plate-landscape.mjs` uses a 500 m height grid, seeded quintic value noise, domain-warped ridged mountain belts, imported ExoTerrain foothill noise, twelve thermal relaxation passes, and downhill D8 accumulation for valley incision. Water uses irregular harmonic lake shores and meandering/branching engineered channels. This is approximate landscape synthesis, not a climate, rainfall, or fluid solver. The same triangulated terrain still controls water beds, canyon floors, navigation, and conservative interior clearance.
- `comparison.mjs` renders both objects with the same km-to-pixel scale. Plate-class uses the exact union outline of the chamfered core and bridge projection: 5,355.3 km², 93 × 60 km overall. The imported RFL GSV uses a polygon union of projected hull triangles at the existing gameplay scale, not a claimed canonical Culture ship size. Rotation and dragging never change ship size.
- Offline geographic silhouettes are derived from Natural Earth 1:50m countries and US state/province polygons. Each feature is projected to local WGS84 Lambert azimuthal equal-area coordinates in kilometres, simplified at 250 m, and rounded to metres. Displayed areas are approximate mapped silhouette areas, not official statistical land/total areas. Country/territory labels and boundaries follow the source data. Source URLs, input SHA-256 hashes and retrieval date are retained in `dist/assets/comparison.json`; the reproducible geometry conversion is in `scripts/build-comparison-data.py` (build-only Shapely/PyProj).
- Country comparison defaults to the largest landmass and islands connected by gaps below 300 km. The All mapped territory option includes distant territories. When a main-region subset is used, both displayed area and the area ratio use only that subset. States always retain all mapped pieces. Both views use equal-area projection; very distant islands can have visible shape distortion.
- Validation: `validate-update.mjs` checks bridge/deck connectivity for both bow directions, union area, terrain resolution, all 293 geographic outlines, the GSV union, and identical ship/region scaling. Existing Plate, garden path, volume, UI and GSV/Orbital suites also run. Canvas renderer previews were inspected at desktop and phone sizes; no browser visual QA was available for this static Site.

## Systems-class selector

The imported RFL GSV is exposed as Systems-class GSV in the envelope selector, ship view, and scale comparison. Its existing `gsv` preset key, imported geometry, gameplay scale, garden slabs, and procedural interiors are retained for compatibility. Plate-class remains a separate entry.

## Adjustable Systems-class

The original `gsv` entry is named Systems-class throughout the interface. Its whole hull is normalized to 128 km long by default, adjustable from 64 to 200 km, preserving hull proportions. Garden positions, hull geometry, ship-view framing, export configuration, and the scale-comparison silhouette follow that length. Working-sector dimensions and the 1.95 m player remain in metres. This supersedes the imported gameplay-scale sizing above.

## Interiors frog icon

Bright blue `#00BFFF` 𓆏 (U+1318F), extracted as an SVG outline from Noto Sans Egyptian Hieroglyphs. A path avoids missing-font boxes and preserves the requested hieroglyph across browsers. Source: https://github.com/notofonts/noto-fonts/tree/main/hinted/ttf/NotoSansEgyptianHieroglyphs . SIL Open Font License 1.1 is retained at `dist/assets/interiors-icon-LICENSE.txt`.
