// Technique 16: keep a chosen layer sharp while the camera travels (Link Focus Distance to Layer).
// A layered 3D landscape (sky, sun, clouds, far hill with trees, the figure's hill, near hills) and a
// one-node camera parented to a null; the null pushes in towards a small figure on a hilltop.
// The camera's Focus Distance carries an expression that follows the figure, so it stays sharp.
//
// VERIFY: camera Options match names: "ADBE Camera Options Group", "ADBE Camera Zoom", "ADBE Camera Depth of Field",
//         "ADBE Camera Focus Distance", "ADBE Camera Aperture", "ADBE Camera Blur Level"
// VERIFY: cam.autoOrient = AutoOrientType.NO_AUTO_ORIENT turns the new camera into a one-node camera (no Point of Interest)
// VERIFY: setting layer.parent = null layer keeps the camera's world position (camera position becomes [0,0,-2666.7])
// VERIFY: toWorld() is available inside an expression on a camera property (used to get the camera's world position)
// VERIFY: the expression the menu command writes; ours measures straight-line distance camera -> target anchor point
// VERIFY: Gradient Ramp display property names "Start of Ramp", "Start Color", "End of Ramp", "End Color"
// VERIFY: "ADBE Vector Ellipse Position", "ADBE Vector Rect Size", "ADBE Vector Rect Position", "ADBE Vector Rect Roundness"
// VERIFY: Aperture 200 px with Blur Level 100% gives clearly visible softness at these distances
//
// To see "before": set the Focus Distance expression's expressionEnabled to false; the static value left
// underneath is the distance at the start of the move, so the figure goes soft as the camera pushes in.
$.evalFile(args.prelude);

var Z = 2666.7; // ASSUMED: camera zoom (the 50 mm default for a 1920 comp); the recipe gives no lens values

function grp(layer) {
  return layer.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group");
}
function addEll(layer, size, pos) {
  var i = grp(layer).addProperty("ADBE Vector Shape - Ellipse").propertyIndex;
  grp(layer).property(i).property("ADBE Vector Ellipse Size").setValue(size);
  grp(layer).property(i).property("ADBE Vector Ellipse Position").setValue(pos);
}
function addRect(layer, size, pos, round) {
  var i = grp(layer).addProperty("ADBE Vector Shape - Rect").propertyIndex;
  grp(layer).property(i).property("ADBE Vector Rect Size").setValue(size);
  grp(layer).property(i).property("ADBE Vector Rect Position").setValue(pos);
  grp(layer).property(i).property("ADBE Vector Rect Roundness").setValue(round || 0);
}
function addFill(layer, color) {
  var i = grp(layer).addProperty("ADBE Vector Graphic - Fill").propertyIndex;
  grp(layer).property(i).property("ADBE Vector Fill Color").setValue(color);
}
// Layout (recipe's layout: line, shares of the whole comp). At the END of the push: figure centred at 50 % across, 50-65 % down
// (162 px tall), feet on the crest at 65 % down; trees at 25-34 % and 69-75 % across; sun 55 % of the width, centred. At the START:
// figure 5.5 % of the height tall (x 2.73 by the end), sun 27 % of the width (x 2.04), feet still at 64-65 % down.
// Those two growth factors fix the depths: with the figure at z 590 the push is D = 2064 and the sun sits at z 1381.
// The camera also sinks from y 540 to 659 so the feet stay at 64-65 % down. Everything below is drawn in END-frame pixels.
var D = 2064, CAMY1 = 659.3;
var PUSH0 = 0.5, PUSH1 = 3.5; // the recipe's push plays for about 3 s and then holds
// Make a 3D shape layer and place it so that at the END of the push it sits at screen point (ex, ey) at the size it was drawn.
function placed(comp, name, ex, ey, z) {
  var l = P.shape(comp, name).layer;
  l.threeDLayer = true;
  var k = (z + Z - D) / Z;
  var w = [960 + (ex - 960) * k, CAMY1 + (ey - 540) * k, z];
  P.tf(l, "ADBE Position").setValue(w);
  P.tf(l, "ADBE Scale").setValue([100 * k, 100 * k, 100 * k]);
  return { layer: l, world: w };
}

var c = P.freshComp("16 lock focus", 1920, 1080, 24, 5, [0.55, 0.75, 0.9]);
// Re-runs: freshComp removes the comp but not its solids; remove this script's unused ones.
(function () {
  var j, it;
  for (j = app.project.numItems; j >= 1; j--) {
    it = app.project.item(j);
    if (it instanceof FootageItem && it.mainSource instanceof SolidSource && it.usedIn.length === 0 &&
        (it.name === "16 sky" || it.name === "16 camera rig")) it.remove();
  }
})();

// Sky: a 2D gradient at the bottom of the stack, behind every 3D layer.
var sky = P.solid(c, "sky", [1, 1, 1]);
sky.source.name = "16 sky";
var ramp = P.effect(sky, "ADBE Ramp");
ramp.property("ADBE Ramp-0001").setValue([960, 0]);
ramp.property("ADBE Ramp-0002").setValue([0.98, 0.72, 0.45, 1]);
ramp.property("ADBE Ramp-0003").setValue([960, 1080]);
ramp.property("ADBE Ramp-0004").setValue([1, 0.9, 0.7, 1]);

// Far to near. Sizes are in end-frame screen pixels.
var sun = placed(c, "sun", 960, 430, 1381).layer;
addEll(sun, [1056, 1056], [0, 0]);
addFill(sun, [1, 0.82, 0.45, 1]);

var clouds = placed(c, "clouds", 960, 190, 1250).layer;
addEll(clouds, [300, 180], [-760, 20]);
addEll(clouds, [360, 250], [-560, -20]);
addEll(clouds, [260, 170], [-370, 30]);
addEll(clouds, [260, 160], [470, -30]);
addEll(clouds, [330, 220], [650, -60]);
addEll(clouds, [240, 150], [830, -20]);
addFill(clouds, [1, 0.97, 0.92, 1]);

var farHill = placed(c, "far hill", 960, 1050, 1200).layer;
addEll(farHill, [5000, 900], [0, 0]);
addFill(farHill, [0.55, 0.68, 0.5, 1]);

// Two trees either side of the figure (layout: 25-34 % and 69-75 % across at the end), standing on the far hill.
var treeSpec = [[566, 173], [1382, 115]]; // end-frame centre x, crown width
var t, ts;
for (t = 0; t < treeSpec.length; t++) {
  ts = treeSpec[t][1] / 60;
  var tree = placed(c, "far tree " + (t + 1), treeSpec[t][0], 610, 1100).layer;
  addEll(tree, [60 * ts, 70 * ts], [0, -60 * ts]);
  addRect(tree, [14 * ts, 40 * ts], [0, -20 * ts], 0);
  addFill(tree, [0.22, 0.4, 0.28, 1]);
}

var figHill = placed(c, "figure hill", 960, 1054, 600).layer;
addEll(figHill, [3000, 700], [0, 0]);
addFill(figHill, [0.36, 0.56, 0.36, 1]);

// The hero: a small silhouette standing on the crest, 162 px tall at the end of the push; its anchor is at its feet.
var fig = placed(c, "figure", 960, 702, 590);
addEll(fig.layer, [54, 54], [0, -135]);
addRect(fig.layer, [58, 108], [0, -54], 18);
addFill(fig.layer, [0.07, 0.07, 0.09, 1]);

// Near hills: at the end they are a soft band along the bottom; at the start they cover the bottom of the frame.
var nearL = placed(c, "near hill left", -386, 2189, 150).layer;
addEll(nearL, [7480, 2618], [0, 0]);
addFill(nearL, [0.2, 0.38, 0.25, 1]);
var nearR = placed(c, "near hill right", 2306, 2204, 150).layer;
addEll(nearR, [7480, 2618], [0, 0]);
addFill(nearR, [0.18, 0.35, 0.23, 1]);

// Camera rig. SUBSTITUTE: Layer > New > Camera (dialog) is replaced by addCamera plus property values.
var cam = c.layers.addCamera("camera", [960, 540]);
cam.autoOrient = AutoOrientType.NO_AUTO_ORIENT; // one-node camera, as the greyed "Point of Interest" option suggests
P.tf(cam, "ADBE Position").setValue([960, 540, -Z]);
var opts = cam.property("ADBE Camera Options Group");
opts.property("ADBE Camera Zoom").setValue(Z);
opts.property("ADBE Camera Depth of Field").setValue(1);
opts.property("ADBE Camera Aperture").setValue(args.aperture || 400); // ASSUMED: wide, so the softness is easy to judge (40 showed no blur at all; 200 only a little on the trees)
opts.property("ADBE Camera Blur Level").setValue(100); // ASSUMED

var rig = c.layers.addNull(c.duration);
rig.name = "camera rig";
rig.source.name = "16 camera rig";
rig.threeDLayer = true;
P.tf(rig, "ADBE Anchor Point").setValue([0, 0, 0]);
P.tf(rig, "ADBE Position").setValue([960, 540, 0]);
cam.parent = rig;

// ASSUMED: the push's easing (the recipe gives no keyframes). Distance and drop come from the layout line.
var fw = fig.world;
var rp = P.tf(rig, "ADBE Position");
rp.setValueAtTime(PUSH0, [960, 540, 0]);
rp.setValueAtTime(PUSH1, [960, CAMY1, D]);
var ease = new KeyframeEase(0, 60);
rp.setTemporalEaseAtKey(1, [ease], [ease]);
rp.setTemporalEaseAtKey(2, [ease], [ease]);

// The technique. SUBSTITUTE: Layer > Camera > Link Focus Distance to Layer (context menu) is replaced by
// writing the equivalent expression on Focus Distance. The static value underneath is the start distance.
var dx = fw[0] - 960, dy = fw[1] - 540, dz = fw[2] + Z;
var fd = cam.property("ADBE Camera Options Group").property("ADBE Camera Focus Distance");
var startFocus = Math.sqrt(dx * dx + dy * dy + dz * dz);
fd.setValue(startFocus);
fd.expression = 'var t = thisComp.layer("figure");\nlength(toWorld([0,0,0]), t.toWorld(t.anchorPoint));';
if (args.before) cam.property("ADBE Camera Options Group").property("ADBE Camera Focus Distance").expressionEnabled = false;

return {
  comp: c.name,
  layers: c.numLayers,
  focusTarget: "figure",
  tech: "camera > Camera Options > Focus Distance expression (expressionEnabled false = before)",
  staticFocus: startFocus
};
