// Technique 9: slide a background endlessly with mirrored tiling.
// A stand-in landscape seen through a train window. Motion Tile with Mirror Edges on, and an expression on
// Tile Center that slides only X, makes the landscape scroll sideways forever with flipped copies at the joins.
//
// VERIFY: P.effect accepts the display name "Motion Tile" (match name ADBE Tile)
// VERIFY: Motion Tile property display names "Tile Center", "Tile Width", "Tile Height", "Output Width", "Output Height", "Mirror Edges", "Phase", "Horizontal Phase Shift"
// VERIFY: Motion Tile works on a shape layer whose bounds are the comp (anchor [0,0], position [0,0]); if it tiles an empty or wrong-sized buffer, precompose the landscape into a 1920x1080 comp and apply the effect to that layer
// VERIFY: a renamed effect ("TECH Motion Tile") is still reached by layer.property("ADBE Effect Parade").property(index)
// VERIFY: shape property match names ADBE Vector Shape - Rect / ADBE Vector Rect Size / ADBE Vector Rect Position / ADBE Vector Ellipse Position
$.evalFile(args.prelude);
// Rebuild with artwork (2026-11-14): art from PROOF/09/art (brief.md). Pass args.artLib (art.jsx) and args.artDir.
// The shape stand-ins are gone. Bottom to top: "landscape far" (watercolour valley, TECH Motion Tile, slow),
// "trees near" (foreground trees, a second Motion Tile, 2.5 times faster, slight blur), "reflection" (the passenger
// flipped, faint, Screen), "train wall" (window openings transparent), "passenger".
// The technique is the recipe's: Motion Tile, sizes 100, Mirror Edges on, an expression sliding only Tile Center X.
// Speed: the brief's glide (120 px/s far, 300 px/s near, comp pixels) instead of the recipe's fitted 1740 px/s, which strobes.
// Motion Tile moves pixels inside the effect, so layer motion blur never sees it; a Directional Blur after it, as long as
// half a frame's travel (a 180-degree shutter), stands in for motion blur.
$.evalFile(args.artLib);
var ARTDIR = args.artDir;
var FOLDER = "art 09";
var DUR = args.dur || 6, FPS = 24;
var c = P.freshComp("09 endless background tile", 1920, 1080, FPS, DUR, ART.hex("#F3E6CF"));
var techOn = (args.before !== true);

function tile(layer, name, scale, compSpeed, blurPx) {
  var fx = P.effect(layer, "ADBE Tile");
  var idx = fx.propertyIndex;
  fx.name = name;
  fx = layer.property("ADBE Effect Parade").property(idx);
  ART.setFx(fx, { "Tile Width": 100, "Tile Height": 100, "Output Width": 100, "Output Height": 100, "Mirror Edges": 1 });
  // Tile Center is in the layer's own pixels: comp speed / layer scale.
  var k = compSpeed / (scale / 100);
  fx.property("Tile Center").setValue([layer.source.width / 2 + (args.phase || 0), layer.source.height / 2]);
  fx.property("Tile Center").expression = "[value[0] - time * " + k.toFixed(3) + ", value[1]]";
  fx.enabled = techOn;
  if (blurPx > 0) {
    var db = P.effect(layer, "ADBE Motion Blur");   // Directional Blur
    ART.setFx(db, { "Direction": 90, "Blur Length": blurPx });
    layer.property("ADBE Effect Parade").property(db.propertyIndex).name = name + " shutter blur";
    db = layer.property("ADBE Effect Parade").property(db.propertyIndex);
    db.enabled = techOn;
  }
  return k;
}

var FAR = args.farSpeed || 120, NEAR = args.nearSpeed || 300;
var far = c.layers.add(ART.footage(ARTDIR, "landscape-far.png", FOLDER));
far.name = "landscape far";
P.tf(far, "ADBE Scale").setValue([41.67, 41.67]);
P.tf(far, "ADBE Position").setValue([960, 540]);
var kFar = tile(far, "TECH Motion Tile", 41.67, FAR, FAR / FPS / 2);

var near = c.layers.add(ART.footage(ARTDIR, "trees-near.png", FOLDER));
near.name = "trees near";
P.tf(near, "ADBE Scale").setValue([80, 80]);
// Run: at the brief's placement (bottom edge 1000 px, treetops 37 % down) the trees filled the whole window and hid the
// valley the far layer is there to show; lowered so the treetops start about 56 % down (args.nearTop).
var NEARTOP = (args.nearTop || 0.56) * 1080;
// The trees fill the lower 65 % of their image, so the layer top sits 35 % of its height above the treetops.
P.tf(near, "ADBE Position").setValue([960, NEARTOP - 0.35 * 0.8 * near.source.height + 0.8 * near.source.height / 2]);
var kNear = tile(near, "TECH Motion Tile near", 80, NEAR, NEAR / FPS / 2);
var gb = P.effect(near, "ADBE Gaussian Blur 2");
ART.setFx(gb, { "Blurriness": 3 });

// Run: the optional reflection read as a smudge over the trees, not as glass; off unless args.reflection.
if (args.reflection) {
var refl = c.layers.add(ART.footage(ARTDIR, "passenger.png", FOLDER));
refl.name = "reflection";
P.tf(refl, "ADBE Scale").setValue([-41, 41]);
P.tf(refl, "ADBE Position").setValue([0.66 * 1920, 560]);
P.tf(refl, "ADBE Opacity").setValue(14);
refl.blendingMode = BlendingMode.SCREEN;
ART.setFx(P.effect(refl, "ADBE Gaussian Blur 2"), { "Blurriness": 6 });
}

var wall = c.layers.add(ART.footage(ARTDIR, "train-wall.png", FOLDER));
wall.name = "train wall";
P.tf(wall, "ADBE Scale").setValue([71.43, 71.43]);
P.tf(wall, "ADBE Position").setValue([960, 540]);

var pas = c.layers.add(ART.footage(ARTDIR, "passenger.png", FOLDER));
pas.name = "passenger";
P.tf(pas, "ADBE Scale").setValue([41, 41]);
// Left edge at 15 % across, bottom on the comp's bottom edge.
P.tf(pas, "ADBE Position").setValue([0.15 * 1920 + 0.41 * pas.source.width / 2, 1080 - 0.41 * pas.source.height / 2]);
if (args.choke) ART.setFx(P.effect(pas, "ADBE Simple Choker"), { "Choke Matte": args.choke });

return { comp: c.name, id: c.id, layers: c.numLayers, techOn: techOn, kFar: kFar, kNear: kNear,
  far: [far.source.width, far.source.height], near: [near.source.width, near.source.height], pas: [pas.source.width, pas.source.height] };
