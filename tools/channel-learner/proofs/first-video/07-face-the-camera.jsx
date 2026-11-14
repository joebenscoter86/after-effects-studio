// Technique 7: keep an orbiting 3D layer turned towards the camera.
// A small black circle with a white outline orbits a planet on a tilted ring. Without the fix it turns
// edge-on and thins to a sliver at the front of the ring; with Auto-Orient (Orient Towards Camera) it stays round.
//
// VERIFY: AutoOrientType.CAMERA_OR_POINT_OF_INTEREST is the enum for "Orient Towards Camera" and layer.autoOrient accepts it on a 3D shape layer
// VERIFY: auto-orient towards camera works in world space when the layer is parented to a rotating null (it should ignore the parent's rotation)
// VERIFY: comp.layers.addCamera(name, [960, 540]) makes the active camera at the default distance, and the whole ring fits in frame
// VERIFY: setting layer.parent while every layer is still at identity transform leaves no compensating offsets (positions are set after parenting)
// VERIFY: a null's layer space puts [0,0,0] at its anchor once its anchor is set to [0,0,0], so children at [0,0,0] sit on it
// VERIFY: which side of the ring is the front (the edge-on point should fall at about frame 10, near the bottom of the ellipse; if it falls at the top, flip the tilt sign)
// VERIFY: match names ADBE Rotate X / ADBE Rotate Y on a 3D layer's transform group
//
// args.before = true builds the same scene without Auto-Orient, for the "before" frame.
// The technique is a layer setting, not an effect or a layer, so it cannot be switched off by a "TECH " name:
// the runner either rebuilds with args.before or sets autoOrient on the returned layer to AutoOrientType.NO_AUTO_ORIENT.
$.evalFile(args.prelude);

// Local helpers (candidates for the prelude: P.group, P.groupContents, P.fill, P.null3d).
function group(layer, name) {
  var g = layer.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
  g.name = name;
  return g.propertyIndex;
}
function groupContents(layer, gi) {
  return layer.property("ADBE Root Vectors Group").property(gi).property("ADBE Vectors Group");
}
function ellipse(layer, gi, size) {
  var e = groupContents(layer, gi).addProperty("ADBE Vector Shape - Ellipse");
  groupContents(layer, gi).property(e.propertyIndex).property("ADBE Vector Ellipse Size").setValue(size);
}
function stroke(layer, gi, color, width) {
  var s = groupContents(layer, gi).addProperty("ADBE Vector Graphic - Stroke");
  var idx = s.propertyIndex;
  groupContents(layer, gi).property(idx).property("ADBE Vector Stroke Color").setValue(color);
  groupContents(layer, gi).property(idx).property("ADBE Vector Stroke Width").setValue(width);
}
function fill(layer, gi, color) {
  var f = groupContents(layer, gi).addProperty("ADBE Vector Graphic - Fill");
  groupContents(layer, gi).property(f.propertyIndex).property("ADBE Vector Fill Color").setValue(color);
}
function null3d(comp, name) {
  var n = comp.layers.addNull(comp.duration);
  n.name = name;
  n.threeDLayer = true;
  P.tf(n, "ADBE Anchor Point").setValue([0, 0, 0]);
  return n;
}
function shapeLayer3d(comp, name) {
  var l = comp.layers.addShape();
  l.name = name;
  l.threeDLayer = true;
  P.tf(l, "ADBE Anchor Point").setValue([0, 0, 0]);
  return l;
}

var W = [1, 1, 1, 1];
var K = [0, 0, 0, 1];
var RING = 900;        // ring diameter; the orbit radius is half of it
var DUR = 5;

var c = P.freshComp("07 face the camera", 1920, 1080, 24, DUR, [0, 0, 0]);

// Rig, bottom of the stack first. All at identity until parenting is done.
var centre = null3d(c, "centre null");
var orbit = null3d(c, "orbit null");

var ring = shapeLayer3d(c, "ring");
var gi = group(ring, "ring");
ellipse(ring, gi, [RING, RING]);
stroke(ring, gi, W, 4);

// ASSUMED: planet is not parented (so it stays a full circle); it sits at the centre, 3D so the ring can pass behind it.
var planet = shapeLayer3d(c, "planet");
gi = group(planet, "planet");
ellipse(planet, gi, [380, 380]);
stroke(planet, gi, W, 5);
fill(planet, gi, K);

// ASSUMED: small circle 90 px, 5 px white stroke, black fill (recipe gives "black-filled, white-outlined", size unknown).
var moon = shapeLayer3d(c, "orbiting circle");
gi = group(moon, "moon");
ellipse(moon, gi, [90, 90]);
stroke(moon, gi, W, 5);
fill(moon, gi, K);

c.layers.addCamera("Camera", [960, 540]);

// Parenting: ring and orbit null to the centre null; the small circle to the orbit null.
orbit.parent = centre;
ring.parent = centre;
moon.parent = orbit;

// Transforms in parent space.
P.tf(centre, "ADBE Position").setValue([960, 540, 0]);
P.tf(planet, "ADBE Position").setValue([960, 540, 0]);
P.tf(orbit, "ADBE Position").setValue([0, 0, 0]);
P.tf(ring, "ADBE Position").setValue([0, 0, 0]);
P.tf(moon, "ADBE Position").setValue([RING / 2, 0, 0]);

// ASSUMED: the orbit plane is horizontal (ring laid flat with X Rotation 90) and tilted 18 degrees towards the camera,
// and the orbit spins about the centre's Y axis once every 5 s. The recipe does not show how the orbit is animated.
P.tf(centre, "ADBE Rotate X").setValue(-18);
P.tf(ring, "ADBE Rotate X").setValue(90);

// One turn over the comp, linear. Starts at 60 degrees so the circle is edge-on (90 degrees) at frame 10, the recipe's check time.
var ry = P.tf(orbit, "ADBE Rotate Y");
ry.setValueAtTime(0, 60);
ry.setValueAtTime(DUR, 420);
ry.setInterpolationTypeAtKey(1, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
ry.setInterpolationTypeAtKey(2, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);

// The technique: Layer > Transform > Auto-Orient > Orient Towards Camera.
if (!args.before) moon.autoOrient = AutoOrientType.CAMERA_OR_POINT_OF_INTEREST;

return { comp: c.name, id: c.id, layers: c.numLayers, techLayer: moon.name, autoOrient: !args.before, edgeOnFrame: 10 };
