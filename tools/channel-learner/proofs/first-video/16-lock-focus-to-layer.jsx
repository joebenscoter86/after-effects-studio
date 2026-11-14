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
// Make a 3D shape layer and place it so that at the start of the move it sits at screen point (sx, sy)
// at the size it was drawn: position and scale grow with depth to undo perspective. Returns its world position.
function placed(comp, name, sx, sy, z) {
  var l = P.shape(comp, name).layer;
  l.threeDLayer = true;
  var k = (z + Z) / Z;
  var w = [960 + (sx - 960) * k, 540 + (sy - 540) * k, z];
  P.tf(l, "ADBE Position").setValue(w);
  P.tf(l, "ADBE Scale").setValue([100 * k, 100 * k, 100 * k]);
  return { layer: l, world: w };
}

var c = P.freshComp("16 lock focus", 1920, 1080, 24, 5, [0.55, 0.75, 0.9]);

// Sky: a 2D gradient at the bottom of the stack, behind every 3D layer.
var sky = P.solid(c, "sky", [1, 1, 1]);
var ramp = P.effect(sky, "Gradient Ramp");
ramp.property("Start of Ramp").setValue([960, 0]);
ramp.property("Start Color").setValue([0.98, 0.72, 0.45, 1]);
ramp.property("End of Ramp").setValue([960, 1080]);
ramp.property("End Color").setValue([1, 0.9, 0.7, 1]);

// Far to near. Sizes are in start-frame screen pixels.
var sun = placed(c, "sun", 1250, 380, 3000).layer;
addEll(sun, [380, 380], [0, 0]);
addFill(sun, [1, 0.82, 0.45, 1]);

var clouds = placed(c, "clouds", 600, 300, 2400).layer;
addEll(clouds, [180, 110], [-90, 10]);
addEll(clouds, [220, 150], [30, -15]);
addEll(clouds, [160, 100], [150, 15]);
addFill(clouds, [1, 0.97, 0.92, 1]);

var farHill = placed(c, "far hill", 900, 800, 1800).layer;
addEll(farHill, [2600, 420], [0, 0]);
addFill(farHill, [0.55, 0.68, 0.5, 1]);

var treeX = [480, 640, 1480, 1640];
var t;
for (t = 0; t < treeX.length; t++) {
  var tree = placed(c, "far tree " + (t + 1), treeX[t], 575, 1700).layer;
  addEll(tree, [60, 70], [0, -30]);
  addRect(tree, [14, 40], [0, 10], 0);
  addFill(tree, [0.22, 0.4, 0.28, 1]);
}

var figHill = placed(c, "figure hill", 1150, 770, 600).layer;
addEll(figHill, [1100, 260], [0, 0]);
addFill(figHill, [0.36, 0.56, 0.36, 1]);

// The hero: a small silhouette standing on the top of the figure hill (feet at y +34, hill top at sy 640).
var fig = placed(c, "figure", 1150, 606, 590);
addEll(fig.layer, [24, 24], [0, -26]);
addRect(fig.layer, [26, 48], [0, 10], 8);
addFill(fig.layer, [0.07, 0.07, 0.09, 1]);

var nearL = placed(c, "near hill left", 350, 980, 100).layer;
addEll(nearL, [1400, 400], [0, 0]);
addFill(nearL, [0.2, 0.38, 0.25, 1]);
var nearR = placed(c, "near hill right", 1700, 1000, 100).layer;
addEll(nearR, [1300, 380], [0, 0]);
addFill(nearR, [0.18, 0.35, 0.23, 1]);

// Camera rig. SUBSTITUTE: Layer > New > Camera (dialog) is replaced by addCamera plus property values.
var cam = c.layers.addCamera("camera", [960, 540]);
cam.autoOrient = AutoOrientType.NO_AUTO_ORIENT; // one-node camera, as the greyed "Point of Interest" option suggests
P.tf(cam, "ADBE Position").setValue([960, 540, -Z]);
var opts = cam.property("ADBE Camera Options Group");
opts.property("ADBE Camera Zoom").setValue(Z);
opts.property("ADBE Camera Depth of Field").setValue(1);
opts.property("ADBE Camera Aperture").setValue(200); // ASSUMED: wide aperture so softness is easy to judge
opts.property("ADBE Camera Blur Level").setValue(100); // ASSUMED

var rig = c.layers.addNull(c.duration);
rig.name = "camera rig";
rig.threeDLayer = true;
P.tf(rig, "ADBE Position").setValue([960, 540, 0]);
cam.parent = rig;

// ASSUMED: the push (the recipe gives no keyframes): 0.5 s to 4.5 s, eased, ending a little above the figure.
var fw = fig.world;
var rp = P.tf(rig, "ADBE Position");
rp.setValueAtTime(0.5, [960, 540, 0]);
rp.setValueAtTime(4.5, [fw[0], fw[1] - 20, 1500]);
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

return {
  comp: c.name,
  layers: c.numLayers,
  focusTarget: "figure",
  tech: "camera > Camera Options > Focus Distance expression (expressionEnabled false = before)",
  staticFocus: startFocus
};
