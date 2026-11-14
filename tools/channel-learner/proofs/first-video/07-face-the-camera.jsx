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
  n.source.name = "07 " + name; // named source, so a re-run can find and remove its own unused null solids
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
// Layout line (shares of the result crop): planet about 24% of the width; ring about 1.7 times the planet's diameter wide
// and 0.6 as tall as wide (spans 30-70% across, 27-70% down), long axis tilted slightly down to the right; small circle about
// a third of the planet. Sizes below follow those ratios.
var PLANET = 380;
var RING = args.ring || 650;        // ring diameter (1.7 x planet); the orbit radius is half of it
var MOON = args.moon || 125;        // about a third of the planet
var TILT = args.tilt !== undefined ? args.tilt : 38; // ring height / width about 0.6 -> about 38 degrees; positive puts the near side at the bottom (-38 put it at the top)
var ROLL = args.roll !== undefined ? args.roll : 6;   // long axis slightly down to the right
var DUR = 5;

var c = P.freshComp("07 face the camera", 1920, 1080, 24, DUR, [0, 0, 0]);
// Re-runs: freshComp removes the comp but not the null solids it made; remove this script's unused ones.
(function () {
  var j, it;
  for (j = app.project.numItems; j >= 1; j--) {
    it = app.project.item(j);
    if (it instanceof FootageItem && it.usedIn.length === 0 && (it.name === "07 centre null" || it.name === "07 orbit null")) it.remove();
  }
})();

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
ellipse(planet, gi, [PLANET, PLANET]);
stroke(planet, gi, W, 5);
fill(planet, gi, K);

// ASSUMED: small circle 90 px, 5 px white stroke, black fill (recipe gives "black-filled, white-outlined", size unknown).
var moon = shapeLayer3d(c, "orbiting circle");
gi = group(moon, "moon");
ellipse(moon, gi, [MOON, MOON]);
stroke(moon, gi, W, 5);
fill(moon, gi, K);

var cam = c.layers.addCamera("Camera", [960, 540]);
// Run fix: addCamera(name, [960, 540]) left the camera at [0, 0, -2666.7] (looking at the comp from its top-left corner,
// which skewed the ring into a diagonal). Place it in front of the comp centre explicitly.
cam.property("ADBE Transform Group").property("ADBE Anchor Point") /* the camera's Point of Interest */.setValue([960, 540, 0]);
cam.property("ADBE Transform Group").property("ADBE Position").setValue([960, 540, -2666.7]);

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
P.tf(centre, "ADBE Rotate X").setValue(TILT);
P.tf(centre, "ADBE Rotate Z").setValue(ROLL);
P.tf(ring, "ADBE Rotate X").setValue(90);

// One turn over the comp, linear. Starts at 80 degrees so at frame 10 (the recipe's check time) the circle is at the
// lower left of the ring's near side, turned about 110 degrees and seen as a thin sliver.
var START = args.start !== undefined ? args.start : 80;
var ry = P.tf(orbit, "ADBE Rotate Y");
ry.setValueAtTime(0, START);
ry.setValueAtTime(DUR, START + 360);
ry.setInterpolationTypeAtKey(1, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
ry.setInterpolationTypeAtKey(2, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);

// The technique: Layer > Transform > Auto-Orient > Orient Towards Camera.
if (!args.before) moon.autoOrient = AutoOrientType.CAMERA_OR_POINT_OF_INTEREST;
// Review correction: the ring's line cut through the small circle's fill where the two 3D planes cross. With the circle
// facing the camera its own Z axis runs along the line of sight, so an Anchor Point Z offset moves it along its facing.
// Positive Z brings it toward the camera. 10 px cleared the line only at the front of the orbit: at the sides the ring's
// line runs toward the camera inside the circle, so the offset has to exceed the circle's radius (62.5 px + stroke). args.lift overrides.
var LIFT = args.lift !== undefined ? args.lift : 70;
if (!args.before) P.tf(moon, "ADBE Anchor Point").setValue([0, 0, LIFT]);

return { comp: c.name, id: c.id, layers: c.numLayers, techLayer: moon.name, autoOrient: !args.before, lift: LIFT, edgeOnFrame: 10 };
