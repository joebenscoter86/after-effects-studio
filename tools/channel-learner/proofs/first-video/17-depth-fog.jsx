// Technique 17: tie a 3D scene together with Fog 3D applied to its precomp.
// Inner comp "17 fog scene": a dark night forest of 3D trunks receding over a ground plane, a small orange-cloaked
// figure with a flame in front, one camera. Outer comp "17 depth fog": that comp as one layer, Fog 3D on it.
//
// VERIFY: Fog 3D is found by its display name "Fog 3D" (match name thought to be "ADBE FOG3D")
// VERIFY: Fog 3D property display names "Fog Color", "Fog Start Depth", "Fog End Depth", "Fog Opacity",
//         "Scattering Density", "Foggy Background", "Layer Contribution" (and "Gradient Layer", left at None)
// VERIFY: whether Fog 3D gets any depth from a precomp of After Effects 3D layers; if it fogs the whole frame
//         evenly (or not at all), the recipe's step does not carry over and the fog is not depth fog
// VERIFY: Fog Start Depth 51 and End Depth -23 are in the effect's own units; whether they mean anything without a 3D channel
// VERIFY: "ADBE Vector Rect Size", "ADBE Vector Rect Position", "ADBE Vector Ellipse Position" match names
//
// To see "before": switch off the effect named "TECH Fog 3D" on the "fog scene" layer of "17 depth fog".
$.evalFile(args.prelude);

function grp(layer) {
  return layer.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group");
}
function addEll(layer, size, pos) {
  var i = grp(layer).addProperty("ADBE Vector Shape - Ellipse").propertyIndex;
  grp(layer).property(i).property("ADBE Vector Ellipse Size").setValue(size);
  grp(layer).property(i).property("ADBE Vector Ellipse Position").setValue(pos);
}
function addRect(layer, size, pos) {
  var i = grp(layer).addProperty("ADBE Vector Shape - Rect").propertyIndex;
  grp(layer).property(i).property("ADBE Vector Rect Size").setValue(size);
  grp(layer).property(i).property("ADBE Vector Rect Position").setValue(pos);
}
function addFill(layer, color) {
  var i = grp(layer).addProperty("ADBE Vector Graphic - Fill").propertyIndex;
  grp(layer).property(i).property("ADBE Vector Fill Color").setValue(color);
}
function shape3d(comp, name, pos) {
  var l = P.shape(comp, name).layer;
  l.threeDLayer = true;
  P.tf(l, "ADBE Position").setValue(pos);
  return l;
}

var fps = 23.976; // the recipe's example comp runs at 23.976
var GROUND_Y = 900;

// Outer first, so a re-run removes the comp that uses the scene before the scene itself.
var c = P.freshComp("17 depth fog", 1920, 1080, fps, 4, [0, 0, 0]);
var s = P.freshComp("17 fog scene", 1920, 1080, fps, 4, [0.02, 0.05, 0.08]);

// Night sky behind everything (2D, bottom of the stack).
// Re-runs: freshComp removes the comps but not their solids; remove this script's unused ones.
(function () {
  var j, it;
  for (j = app.project.numItems; j >= 1; j--) {
    it = app.project.item(j);
    if (it instanceof FootageItem && it.mainSource instanceof SolidSource && it.usedIn.length === 0 &&
        (it.name === "17 night" || it.name === "17 ground")) it.remove();
  }
})();
var bg = P.solid(s, "night", [0.04, 0.10, 0.14]); // lighter than the trunks, so trunks read as dark bars against the gaps
bg.source.name = "17 night";
// Run fix: as a 2D layer the sky carried no depth (Fog 3D read it as depth 0), so it was fogged or not as a block,
// apart from the trunks. It is now a 3D layer behind the last trunk, scaled up to fill the view, so it sits in the same depth range.
bg.threeDLayer = true;
P.tf(bg, "ADBE Position").setValue([960, 540, 5200]);
P.tf(bg, "ADBE Scale").setValue([320, 320, 320]);

// Ground plane, lying flat from just in front of the camera to far back.
var ground = P.solid(s, "ground", [0.04, 0.09, 0.09], 6000, 7000);
ground.source.name = "17 ground";
ground.threeDLayer = true;
P.tf(ground, "ADBE Position").setValue([960, GROUND_Y, 2500]);
P.tf(ground, "ADBE Rotate X").setValue(90);

// Trunks receding in depth: [world x, world z]. Each 80 wide and 2400 tall, standing on the ground.
var trunks = [[300, -300], [1550, 200], [700, 700], [1350, 1200], [450, 1800], [2000, 2200],
  [1100, 2500], [-100, 2800], [1650, 3200], [900, 3600], [200, 4200], [1900, 4600]];
var i;
for (i = 0; i < trunks.length; i++) {
  var tr = shape3d(s, "trunk " + (i + 1), [trunks[i][0], GROUND_Y - 1200, trunks[i][1]]);
  addRect(tr, [80, 2400], [0, 0]);
  addFill(tr, [0.02, 0.05, 0.06, 1]);
}

// Foliage (layout: the bottom 40 % of the picture is foliage): a row of bushes behind the figure and a row in front.
var bushBack = shape3d(s, "foliage back", [960, GROUND_Y, 400]);
var b;
for (b = 0; b < 9; b++) addEll(bushBack, [420, 330 + (b % 3) * 60], [-1300 + b * 325, -110]);
addFill(bushBack, [0.03, 0.12, 0.11, 1]);

// The character (layout: 39-57 % across, 34-83 % down, centred near 49 % across): orange cloak and head,
// feet on the ground (anchor at the feet), and a separate flame.
var hero = shape3d(s, "cloaked figure", [940, GROUND_Y, 0]);
P.path({ layer: hero }, [[-170, 0], [0, -440], [170, 0]], null, null, true);
addEll(hero, [130, 130], [0, -465]);
addFill(hero, [0.95, 0.45, 0.12, 1]);
var flame = shape3d(s, "flame", [1090, GROUND_Y - 290, -5]);
addEll(flame, [60, 96], [0, 0]);
addFill(flame, [1, 0.82, 0.3, 1]);

var bushFront = shape3d(s, "foliage front", [960, GROUND_Y + 130, -250]);
for (b = 0; b < 7; b++) addEll(bushFront, [460, 230 + (b % 2) * 50], [-1150 + b * 385, 0]);
addFill(bushFront, [0.02, 0.09, 0.08, 1]);

// SUBSTITUTE: Layer > New > Camera (dialog) is replaced by addCamera.
var cam = s.layers.addCamera("scene camera", [960, 540]);
P.tf(cam, "ADBE Position").setValue([960, 540, -2666.7]);
P.tf(cam, "ADBE Anchor Point").setValue([960, 540, 0]); // a camera's Point of Interest is ADBE Anchor Point

// Step 1. SUBSTITUTE: Layer > Pre-compose (dialog) is replaced by building the scene in its own comp
// and adding that comp as one layer of the outer comp.
var pre = c.layers.add(s);
pre.name = "fog scene";

// Steps 2 to 4: Fog 3D on the precomp layer with the recipe's values.
var fx = P.effect(pre, "ADBE FOG_3D");
fx.name = "TECH Fog 3D";
fx = pre.property("ADBE Effect Parade").property("TECH Fog 3D");
fx.property("ADBE FOG_3D-0001").setValue([12 / 255, 38 / 255, 55 / 255, 1]); // Fog Color: sampled from the video, approximate
// Run fix: the recipe's Fog Start Depth 51 and Fog End Depth -23 do not carry over. Here the depth Fog 3D reads from a
// precomp of 3D layers is the distance from the precomp's camera in pixels (the figure is 2667 away, the last trunk 7267,
// the sky 7867). With 51 / -23 every 3D layer stayed clear. The recipe says to tune these by eye, so the fog starts just
// behind the figure and is full at the sky. args.fogStart / args.fogEnd override.
fx.property("ADBE FOG_3D-0002").setValue(args.fogStart !== undefined ? args.fogStart : 2700); // Fog Start Depth
fx.property("ADBE FOG_3D-0003").setValue(args.fogEnd !== undefined ? args.fogEnd : 9000);     // Fog End Depth
fx.property("ADBE FOG_3D-0004").setValue(100); // Fog Opacity
fx.property("ADBE FOG_3D-0005").setValue(24);  // Scattering Density
fx.property("ADBE FOG_3D-0006").setValue(1);   // Foggy Background
fx.property("ADBE FOG_3D-0008").setValue(100); // Layer Contribution
// "Gradient Layer" left at its default (None, Source), as the recipe reads it.

return { comp: c.name, scene: s.name, sceneLayers: s.numLayers, tech: "fog scene > effect TECH Fog 3D" };
