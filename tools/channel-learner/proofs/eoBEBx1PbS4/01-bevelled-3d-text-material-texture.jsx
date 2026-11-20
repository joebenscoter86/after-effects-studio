// eoBEBx1PbS4 technique 01: bevelled 3D text wrapped in a tiled material. Third run (2026-11-19), the material fallback
// re-tuned to recipe 01's corrected texture figures. Earlier versions: *-first.jsx (stops at the material), *-second.jsx.
// Run with args { prelude, scene, opts } (scene = tides-scene.jsx beside this file).
// RESOLVED (first run): Advanced 3D is "ADBE Calder" on AE 27.0; Bevel Style Convex = 4; no material can be assigned
//   by script, and the owner's AE shows no Material section for 3D text, so the owner chose the fallback.
// SUBSTITUTE: recipe steps 6-12 (a Substance material on every face, Scale, Randomize Offset): the art's tile on the
//   front faces through TIDES.faceTex (2D, Multiply over the 3D render), one chosen region per letter; the rust round
//   the edges and on the sides and bevels through TIDES.edgeRust (2D, Multiply). See tides-scene.jsx.
// VERIFY: Roughen Edges "Border" / "Scale"; BlendingMode.SILHOUETE_ALPHA (AE's own spelling); Fractal Noise Transform > Uniform Scaling / Scale.
$.evalFile(args.prelude);
$.evalFile(args.scene);
var opt = args.opts || {};
var main = P.freshComp("eoBE 01 tides", 1920, 1080, TIDES.FPS, 3, [0, 0, 0]); // 2D comp: 3D word + texture + edge rust
var c = P.freshComp("eoBE 01 tides 3D", 1920, 1080, TIDES.FPS, 3, [0, 0, 0]);
c.renderer = "ADBE Calder"; // Advanced 3D on AE 27.0 ("ADBE Advanced 3d" is Classic 3D and hides Geometry Options)
if (c.renderer !== "ADBE Calder") throw new Error("renderer did not take: " + c.renderer);
// Brief: word 50 % of the comp width, centred (450 px at 68 % = 100 px at 306 %). Fill: paint x 1.08 (see faceTex).
var w = TIDES.word(c, { scale: 306, fill: TIDES.PAINT_HI });
main.layers.add(c).name = "3D word";
// Recipe 01 layout (corrected): rust patches up to about two strokes across (the largest about 15 % of the word's
// width): one tile repeat 750 px. Per-letter paint 67, 83, 56, 47, 43 %: offsets chosen by measuring the tile's paint
// mask over each letter's footprint (search over a 20 x 20 grid of offsets, aiming a few points above each target,
// since the edge rust takes some off).
// Round 2 aims (inside footprint): 76, max, 64, 55, 51 %, so that with the edge rust the letters land near the targets.
var offsets = opt.offsets || [[0.25, 0.15], [0.0, 0.7], [0.25, 0.1], [0.65, 0.7], [0.2, 0.55]];
var f = TIDES.faceTex(main, { scale: 306, repeatPx: opt.repeatPx || 750, choke: 0, offsets: offsets, name: "TECH face texture", folder: "art eoBE 01" });
// Rust round the edges: the layout's outer 7-10 px band about 41 % paint against about 65 % inside.
var e = TIDES.edgeRust(main, c, { scale: 306, inset: opt.inset === undefined ? 2 : opt.inset, border: opt.border === undefined ? 6 : opt.border, roughScale: opt.roughScale || 60, noiseScale: opt.noiseScale, noiseBrightness: opt.noiseBrightness === undefined ? -9 : opt.noiseBrightness, name: "TECH edge rust" });
var names = [], i;
for (i = 1; i <= main.numLayers; i++) names.push(main.layer(i).name);
return { comp: main.name, layers: names.join(" / "), tileScale: f.tileScale };
