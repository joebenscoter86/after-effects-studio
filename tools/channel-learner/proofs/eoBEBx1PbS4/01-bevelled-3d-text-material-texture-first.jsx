// eoBEBx1PbS4 technique 01: bevelled 3D text wrapped in a tiled material.
// Run with args { prelude, scene } (scene = tides-scene.jsx beside this file).
// VERIFY: Bevel Style enum (Convex = 4) — in tides-scene.jsx
// RESOLVED (run 2026-11-19): Advanced 3D is "ADBE Calder" on AE 27.0; Bevel Style Convex = 4 (reads back 4).
// RESOLVED: a fresh 3D text layer carries four hidden intrinsic slots (Front, Bevel, Side, Back, "ADBE3D Material Atom Intrin");
//   their Scale / Randomize Offset throw "property ... is hidden" until the override is made. addProperty("ADBE3D Material Atom")
//   adds a generic numbered override (" 1"), not the per-face All override, and no property anywhere holds the material itself.
// HAND STEP (not scriptable in AE 27.0, recipe steps 6 and 10): with TIDES selected, Properties panel > Material Assignment:
//   Add Override > All, then the Material dropdown > a painted-metal .sbsar (none is on this Mac: "Get Substance Community
//   Assets..." in the Material section's panel menu first). Then run 01b-texture-settings.jsx for steps 11-12.
$.evalFile(args.prelude);
$.evalFile(args.scene);
var c = P.freshComp("eoBE 01 tides", 1920, 1080, TIDES.FPS, 3, [0, 0, 0]);
c.renderer = "ADBE Calder"; // Advanced 3D on AE 27.0 ("ADBE Advanced 3d" is Classic 3D and hides Geometry Options)
if (c.renderer !== "ADBE Calder") throw new Error("renderer did not take: " + c.renderer);
// The tile, imported for the material (brief: art folder "art eoBE 01").
var fold = null, i, it;
for (i = 1; i <= app.project.numItems; i++) { it = app.project.item(i); if (it instanceof FolderItem && it.name === "art eoBE 01") fold = it; }
if (!fold) fold = app.project.items.addFolder("art eoBE 01");
var tile = null;
for (i = 1; i <= fold.numItems; i++) if (fold.item(i).name === "paint-tile-1024.png") tile = fold.item(i);
if (!tile) { tile = app.project.importFile(new ImportOptions(new File(TIDES.ART + "/paint-tile-1024.png"))); tile.parentFolder = fold; }
// Brief: word 50 % of the comp width, centred (450 px at 68 % = 100 px at 306 %).
var w = TIDES.word(c, { scale: 306 });
var r = w.sourceRectAtTime(0, false);
return { comp: c.name, id: c.id, tile: tile.id, rect: [r.left, r.top, r.width, r.height], font: w.property("ADBE Text Properties").property("ADBE Text Document").value.font };
