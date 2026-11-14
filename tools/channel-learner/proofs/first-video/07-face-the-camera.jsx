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
// Rebuild with artwork (2026-11-14): art from PROOF/07/art (brief.md). Pass args.artLib (art.jsx) and args.artDir.
// Layers, bottom to top: space plate (2D), ring, planet halo (blurred outline copy), planet outline, moon (cratered
// moon texture, 3D, in the small circle's place in the orbit rig, Auto-Orient Towards Camera), moon outline (white
// ring, fill off, also auto-oriented), glow adjustment layer, caption. The technique is unchanged: autoOrient on the
// orbiting layers; args.before leaves it off on both.
$.evalFile(args.artLib);
var ARTDIR = args.artDir;

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

var W = ART.hex("#F5F5F5").concat([1]);
var K = ART.hex("#050505").concat([1]);
var PLANET = 380;
var RING = args.ring || 650;        // 1.7 x planet
var MOON = args.moon || 154;        // brief: small circle about 154 px
var TILT = args.tilt !== undefined ? args.tilt : 38;
var ROLL = args.roll !== undefined ? args.roll : 6;
var DUR = 5;

var c = P.freshComp("07 face the camera", 1920, 1080, 24, DUR, ART.hex("#050505"));
(function () {
  var j, it;
  for (j = app.project.numItems; j >= 1; j--) {
    it = app.project.item(j);
    if (it instanceof FootageItem && it.usedIn.length === 0 && (it.name === "07 centre null" || it.name === "07 orbit null" || it.name === "07 glow")) it.remove();
  }
})();

var space = c.layers.add(ART.footage(ARTDIR, "space.png", "art 07"));
space.name = "space";

var centre = null3d(c, "centre null");
var orbit = null3d(c, "orbit null");

var ring = shapeLayer3d(c, "ring");
var gi = group(ring, "ring");
ellipse(ring, gi, [RING, RING]);
stroke(ring, gi, W, args.ringStroke || 3);

// Brief: soft halo, a copy of the planet outline with Gaussian Blur 60 at 40 %.
var halo = shapeLayer3d(c, "planet halo");
gi = group(halo, "halo");
ellipse(halo, gi, [PLANET, PLANET]);
stroke(halo, gi, W, 8);
var hb = P.effect(halo, "ADBE Gaussian Blur 2");
ART.setFx(hb, { "Blurriness": 60 });
P.tf(halo, "ADBE Opacity").setValue(40);

// Planet stays line art; its fill is the space black (#050505) so it hides the ring's back half and the moon behind it.
var planet = shapeLayer3d(c, "planet");
gi = group(planet, "planet");
ellipse(planet, gi, [PLANET, PLANET]);
stroke(planet, gi, W, 4);
fill(planet, gi, K);

// Moon texture in the small circle's place: 1010 px art at 15.2 % = 154 px.
var MS = MOON / 1010 * 100;
var moon = c.layers.add(ART.footage(ARTDIR, "moon.png", "art 07"));
moon.name = "moon";
moon.threeDLayer = true;
P.tf(moon, "ADBE Scale").setValue([MS, MS, MS]);

// Moon outline: the small circle's white stroke, fill off.
var rim = shapeLayer3d(c, "moon outline");
gi = group(rim, "rim");
ellipse(rim, gi, [MOON, MOON]);
stroke(rim, gi, W, 4);

var cam = c.layers.addCamera("Camera", [960, 540]);
cam.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([960, 540, 0]);
cam.property("ADBE Transform Group").property("ADBE Position").setValue([960, 540, -2666.7]);

orbit.parent = centre;
ring.parent = centre;
moon.parent = orbit;
rim.parent = orbit;

P.tf(centre, "ADBE Position").setValue([960, 540, 0]);
P.tf(planet, "ADBE Position").setValue([960, 540, 0]);
P.tf(halo, "ADBE Position").setValue([960, 540, 0]);
P.tf(orbit, "ADBE Position").setValue([0, 0, 0]);
P.tf(ring, "ADBE Position").setValue([0, 0, 0]);
P.tf(moon, "ADBE Position").setValue([RING / 2, 0, 0]);
P.tf(rim, "ADBE Position").setValue([RING / 2, 0, 0]);

P.tf(centre, "ADBE Rotate X").setValue(TILT);
P.tf(centre, "ADBE Rotate Z").setValue(ROLL);
P.tf(ring, "ADBE Rotate X").setValue(90);

var START = args.start !== undefined ? args.start : 80;
var ry = P.tf(orbit, "ADBE Rotate Y");
ry.setValueAtTime(0, START);
ry.setValueAtTime(DUR, START + 360);
ry.setInterpolationTypeAtKey(1, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
ry.setInterpolationTypeAtKey(2, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);

// The technique: Orient Towards Camera on the moon and its outline.
// Lift (toward the camera along the facing) clears the ring's line; it must exceed the circle's radius (77 px).
// The moon's anchor is in its own pixels, so its Z lift is divided by its scale; the outline sits 1 px nearer.
var LIFT = args.lift !== undefined ? args.lift : 90;
if (!args.before) {
  moon.autoOrient = AutoOrientType.CAMERA_OR_POINT_OF_INTEREST;
  rim.autoOrient = AutoOrientType.CAMERA_OR_POINT_OF_INTEREST;
  P.tf(moon, "ADBE Anchor Point").setValue([505, 505, LIFT / (MS / 100)]);
  P.tf(rim, "ADBE Anchor Point").setValue([0, 0, LIFT + 1]);
} else {
  P.tf(moon, "ADBE Anchor Point").setValue([505, 505, 0]);
  P.tf(rim, "ADBE Anchor Point").setValue([0, 0, 0]);
}

// Brief: Glow on an adjustment layer above everything but the space plate (threshold 50 %, radius 25, intensity 1).
// Run fix: an adjustment layer also glows the space plate below it (its grey dust blew out to white), so the same Glow
// sits on each line-art layer instead (ring, planet, moon outline); the moon texture keeps its crater detail.
var GT = args.glowThreshold || 50, GR = args.glowRadius || 25, GI = args.glowIntensity || 1.0;
ART.glow(ring, GT, GR, GI);
ART.glow(planet, GT, GR, GI);
ART.glow(rim, GT, GR, GI);

// Optional caption (brief: Space Mono 0.018 h, #F5F5F5 at 60 %, bottom-left at 0.05, 0.92).
var font = args.font || "Menlo-Regular";
var cap = P.text(c, "LUNAR ORBIT  /  27.3 DAYS", { size: args.capSize || 2 * Math.round(0.018 * 1080 / 0.72), color: ART.hex("#F5F5F5"), name: "caption", font: font, tracking: 120 });
var cd = cap.property("ADBE Text Properties").property("ADBE Text Document");
var tdv = cd.value; tdv.justification = ParagraphJustification.LEFT_JUSTIFY; cd.setValue(tdv);
var cr = cap.sourceRectAtTime(0, false);
P.tf(cap, "ADBE Anchor Point").setValue([cr.left, cr.top + cr.height]);
P.tf(cap, "ADBE Position").setValue([0.05 * 1920, 0.92 * 1080]);
// Polish (2026-11-14): the caption was tiny and faint on a phone; now twice the size (54 px) at 88 %.
P.tf(cap, "ADBE Opacity").setValue(args.capOpacity || 88);

var order = []; for (var li = 1; li <= c.numLayers; li++) order.push(c.layer(li).name);
return { comp: c.name, id: c.id, order: order, techLayers: [moon.name, rim.name], autoOrient: !args.before, lift: LIFT, moonScale: MS, font: cd.value.font };
