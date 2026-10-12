# Hull-adaptive room and hallway growth

`dist/interior-growth.mjs` adds connected, seeded room chains to the existing circulation network. Plate-class, Systems-class garden sectors and Orbital sectors use the same algorithm. Existing terrain, bridge, edge hangars, rail and garden paths are retained.

The UI exposes rooms added per deck (default 28), winding (70%), and large atriums (3). These are placement targets: finite attempts and conservative collision tests may produce fewer in narrow or occupied regions. Atriums reserve their entire vertical extent first; infill rooms and hallway segments cannot occupy those voids. Dry atriums may cut the terrain surface. Wet sites retain lakebed clearance. Existing rooms are never removed to force a fit.

## Applying it to another starship

Call `growInteriors(layout, envelope)` after constructing the hull's terrain and its initial connected concourses. It does not branch on ship class. Supply:

- `id`: adapter name for the exported generation record.
- `floors`: deck floor elevations in metres, indexed from upper to lower.
- `fits(box, openToSurface)`: conservative containment of the complete axis-aligned volume `{x,z,w,d,y,h,polygon}`. Reject hull cuts, obstructions and excluded regions, including concave notches between vertices. An intentional surface opening may bypass the roof constraint, but must still fit the hull walls and bottom.
- Optional `surface(box)`: `{dry, top}` for the terrain above the entire footprint. Omit it for ships without a garden surface.

`layout` uses the existing RFL schema: config, rooms, edges, doors, rails, lifts, skylights, lightWells and stats. Supply at least one connected concourse on each deck to grow from. Room `volumes` describe actual polygons and heights; transit `x/z/w/d/polygon` are broad bounds, while `volumes` and `centerline` are authoritative for passage geometry. The sample concave hull in `validate-growth.mjs` exercises another shape without changing the generator.

This is an adapter interface, not an arbitrary mesh-upload feature. A mesh-based ship supplies its own conservative volume-containment query. Disconnected hull components need explicitly linked seed concourses (rail, elevator or walking connections) before growth.

## Geometry and navigation

New rooms connect by continuous passages to an existing room wall. Dogleg segments are tested individually against the envelope and all existing room volumes, rail bounds and vertical shafts. A doorway overlap with its own endpoint room is intentional. Room paths form branching chains; existing transport retains its loops. Atriums are a single room ID with `decks` membership, visible and selectable on every intersected level; access is on the base floor, without invented upper-floor landings.

Open atriums export `surfaceOpenings` and an exactly clipped `terrain.surfaceMesh`. The original height field remains available for clearance and terrain constraints. Map, Plate and imported Systems hull views use the cut mesh. `interiorGrowth` reports actual room, winding passage, multi-deck and surface-opening counts. Garden navigation snapshots include the added rooms and edges.

Validation: `node validate-growth.mjs`, `node validate-ui.mjs`, `node validate-pieces.mjs`. The growth suite checks nine preset/seed combinations, hull/lakebed containment, unrelated-room intersections, reachability, seed determinism, control limits, multi-level map selection, exact terrain subtraction and a concave custom envelope. UI checks exercise phone/desktop canvas dimensions through the existing headless canvas harness; they are not browser screenshots.
