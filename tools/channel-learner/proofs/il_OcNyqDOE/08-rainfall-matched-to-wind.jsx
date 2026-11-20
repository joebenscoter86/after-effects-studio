// il_OcNyqDOE technique 08: CC Rainfall on a top adjustment layer, Wind 840 so the rain leans right with the leaves.
// Scene: 02's grade, 03's depths, 04's depth-of-field camera (dolly 0-3 s, focus linked to the figures) and 07's leaf particles.
// args { prelude, artLib, scene, aperture, twirl, quad, preroll }. 3 s at 23.976 (72 frames), the dolly's length.
// The rain layer is "TECH Rain": switch it off for a before frame (leaves without rain).
// Run with { aperture: 400, twirl: 5, quad: 13, preroll: 20 } (2026-11-19).
// RESOLVED: Animation Twirl = 5 (range 1-14, no separators); Particle Type Textured QuadPolygon = 13 (probe-particle-types.jsx:
//   12 untextured quads, 13 and 14 textured leaves, 17-23 blank; 13 shows edge-on tumbling, so QuadPolygon).
// RESOLVED: Texture Layer takes the leaf layer's index and follows the layer when others are added; a hidden layer feeds it.
// RESOLVED: camera matchNames ADBE Camera Zoom / Depth of Field / Aperture / Focus Distance all exist.
// FOUND BY BUILDING: Aperture 400 (not 04's 26.3) reaches the recipe's measured edge widths in this renderer (Classic 3D);
//   leaves pre-rolled 20 s (ASSUMED) - with 07's values they still hover at the left edge (see build notes).
// Second run (2026-11-19): { v2: true, aperture: 400, twirl: 5, quad: 13, preroll: 20, gravity: 0.005, gravVec: [1, 0, 0], birthRate: 0.15 }.
// CHANGED from 07's shown values so the leaves cross at 07's measured motion: Gravity Vector (0,1,0) -> (1,0,0) (gravity blows
//   sideways), Gravity 0.020 -> 0.005 (speed), Birth Rate 2.0 -> 0.15 (a dozen or so in view). Everything else as 07 shows.
// Third run (2026-11-19): + override { "Branch L": [-650, 410.1, 714.0, 40.1, 0], "Branch R": [-650, 1474.4, 291.9, 41.6, -90] }:
//   recipe 08's "Near branches" passage puts them at about Z -400 to -800, a leaf about 5 % of the width at frame 0, left 0-25 %
//   across, right 65-100 % across the upper right. Factor 2666.7 / (2666.7 - 650) = 1.322; X/Y/scale chosen for those screen places.
$.evalFile(args.prelude);
$.evalFile(args.artLib);
$.evalFile(args.scene);
var c = HW.comp("il_O 08 rain", 72 / 23.976);
var L = HW.build(c, { depth: true, grade: true, prefix: "", v2: args.v2, override: args.override });
var cam = HW.camera(c, "Woman", args.aperture);
var lv = HW.leaves(c, { preroll: args.preroll, twirl: args.twirl, quad: args.quad, gravity: args.gravity, gravVec: args.gravVec, birthRate: args.birthRate, birthSize: args.birthSize, deathSize: args.deathSize });
var r = HW.rain(c, "TECH Rain");
return { comp: c.name, id: c.id, layers: c.numLayers, top: c.layer(1).name, frames: Math.round(c.duration * c.frameRate) };
