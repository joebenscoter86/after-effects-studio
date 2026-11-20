// eoBEBx1PbS4 technique 01: bevelled 3D text wrapped in a tiled material. Second run (2026-11-19), the material fallback.
// Run with args { prelude, scene } (scene = tides-scene.jsx beside this file). The first run's script is *-first.jsx.
// RESOLVED (first run): Advanced 3D is "ADBE Calder" on AE 27.0; Bevel Style Convex = 4; the Material Assignment slots are
//   hidden to scripts and no property holds a material. The owner found no Material section for 3D text in this AE's
//   Properties panel, so a Substance material cannot be applied at all; he chose the fallback.
// SUBSTITUTE: recipe steps 6-12 (Add Override > All, a Substance material on every face, Scale 17 %, Randomize Offset):
//   the art's tile on the front faces through TIDES.faceTex (see tides-scene.jsx), one patch per letter; the extruded
//   word's own fill is the paint colour #ABC7A1 x 1.08, so the bevels and sides are the same painted metal, plain.
// VERIFY: Simple Choker "Choke Matte" in px; Motion Tile "Output Width"/"Output Height" in %.
$.evalFile(args.prelude);
$.evalFile(args.scene);
var c = P.freshComp("eoBE 01 tides", 1920, 1080, TIDES.FPS, 3, [0, 0, 0]);
c.renderer = "ADBE Calder"; // Advanced 3D on AE 27.0 ("ADBE Advanced 3d" is Classic 3D and hides Geometry Options)
if (c.renderer !== "ADBE Calder") throw new Error("renderer did not take: " + c.renderer);
var opt = args.opts || {};
// Brief: word 50 % of the comp width, centred (450 px at 68 % = 100 px at 306 %).
var w = TIDES.word(c, { scale: 306, fill: opt.fill || TIDES.PAINT_HI });
// One tile repeat about 375 px of comp (brief, from rust patches one letter stroke wide); no choke: under Multiply the bevel keeps its own shading, so the texture runs over the front bevel too, as the recipe has every face textured.
var f = TIDES.faceTex(c, { scale: 306, repeatPx: opt.repeatPx || 375, choke: opt.choke === undefined ? 0 : opt.choke, z: opt.z === undefined ? -0.5 : opt.z, name: "TECH face texture", folder: "art eoBE 01" });
return { comp: c.name, id: c.id, layers: c.numLayers, tileScale: f.tileScale };
