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
var bg = P.solid(s, "night", [0.02, 0.05, 0.08]);

// Ground plane, lying flat from just in front of the camera to far back.
var ground = P.solid(s, "ground", [0.04, 0.09, 0.09], 6000, 7000);
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
  addFill(tr, [0.03, 0.07, 0.08, 1]);
}

// The character: orange cloak and head, feet on the ground (anchor at the feet), and a separate flame.
var hero = shape3d(s, "cloaked figure", [960, GROUND_Y, 0]);
P.path({ layer: hero }, [[-60, 0], [60, 0], [0, -170]], null, null, true);
addEll(hero, [50, 50], [0, -180]);
addFill(hero, [0.95, 0.45, 0.12, 1]);
var flame = shape3d(s, "flame", [1015, GROUND_Y - 110, -5]);
addEll(flame, [28, 44], [0, 0]);
addFill(flame, [1, 0.82, 0.3, 1]);

// SUBSTITUTE: Layer > New > Camera (dialog) is replaced by addCamera.
var cam = s.layers.addCamera("scene camera", [960, 540]);
P.tf(cam, "ADBE Position").setValue([960, 540, -2666.7]);
P.tf(cam, "ADBE Point of Interest").setValue([960, 540, 0]);

// Step 1. SUBSTITUTE: Layer > Pre-compose (dialog) is replaced by building the scene in its own comp
// and adding that comp as one layer of the outer comp.
var pre = c.layers.add(s);
pre.name = "fog scene";

// Steps 2 to 4: Fog 3D on the precomp layer with the recipe's values.
var fx = P.effect(pre, "Fog 3D");
fx.name = "TECH Fog 3D";
fx = pre.property("ADBE Effect Parade").property("TECH Fog 3D");
fx.property("Fog Color").setValue([12 / 255, 38 / 255, 55 / 255, 1]); // sampled from the video, approximate
fx.property("Fog Start Depth").setValue(51);
fx.property("Fog End Depth").setValue(-23);
fx.property("Fog Opacity").setValue(100);
fx.property("Scattering Density").setValue(24);
fx.property("Foggy Background").setValue(1);
fx.property("Layer Contribution").setValue(100);
// "Gradient Layer" left at its default (None, Source), as the recipe reads it.

return { comp: c.name, scene: s.name, sceneLayers: s.numLayers, tech: "fog scene > effect TECH Fog 3D" };
