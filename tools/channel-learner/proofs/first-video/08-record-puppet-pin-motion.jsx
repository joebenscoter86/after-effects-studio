// Technique 8: perform puppet-pin motion live with the mouse.
// A stand-in character sits by a train window; her head sways gently while the body stays still,
// driven by a dozen irregularly spaced keyframes like the ones a live Ctrl/Cmd-drag recording writes.
//
// SUBSTITUTE: the whole performance. In the interface you place three Puppet Position Pins (head, two shoulders)
// and Cmd-drag the head pin to record it. Puppet pins cannot be created by script and live recording is hand-only,
// so the head is a separate layer pivoting at the neck, and its Rotation and Position carry a hand-written
// "recorded" take: 13 keys at irregular spacing from 0:00 to about 3:13, as the recipe describes for Puppet Pin 1.
// The two shoulder pins (which only hold the body still) are stood in for by the body layer having no keyframes.
//
// VERIFY: comp frame rate 23.976 is accepted by addComp (the recipe's comp runs at 23.976)
// VERIFY: a shape layer with anchor [0,0] and position [0,0] draws its contents in comp coordinates
// VERIFY: shape property match names ADBE Vector Shape - Rect / ADBE Vector Rect Size / ADBE Vector Rect Position / ADBE Vector Rect Roundness / ADBE Vector Ellipse Position
// VERIFY: layer.property("ADBE Mask Parade").addProperty("ADBE Mask Atom") then "ADBE Mask Shape" for the window mask
// VERIFY: setTemporalAutoBezierAtKey exists on the Rotation and Position properties (used to smooth the take)
$.evalFile(args.prelude);

// Local helpers (candidates for the prelude: P.group, P.groupContents, P.rect, P.ellipseAt, P.fill, P.mask, P.path in a named group).
function group(layer, name) {
  var g = layer.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
  g.name = name;
  return g.propertyIndex;
}
function groupContents(layer, gi) {
  return layer.property("ADBE Root Vectors Group").property(gi).property("ADBE Vectors Group");
}
function rect(layer, gi, center, size, round) {
  var r = groupContents(layer, gi).addProperty("ADBE Vector Shape - Rect");
  var idx = r.propertyIndex;
  groupContents(layer, gi).property(idx).property("ADBE Vector Rect Size").setValue(size);
  groupContents(layer, gi).property(idx).property("ADBE Vector Rect Position").setValue(center);
  groupContents(layer, gi).property(idx).property("ADBE Vector Rect Roundness").setValue(round || 0);
}
function ellipseAt(layer, gi, center, size) {
  var e = groupContents(layer, gi).addProperty("ADBE Vector Shape - Ellipse");
  var idx = e.propertyIndex;
  groupContents(layer, gi).property(idx).property("ADBE Vector Ellipse Size").setValue(size);
  groupContents(layer, gi).property(idx).property("ADBE Vector Ellipse Position").setValue(center);
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
// A shape layer whose contents are drawn in comp coordinates.
function flatShape(comp, name) {
  var l = comp.layers.addShape();
  l.name = name;
  P.tf(l, "ADBE Anchor Point").setValue([0, 0]);
  P.tf(l, "ADBE Position").setValue([0, 0]);
  return l;
}
function arc(layer, gi, verts, ins, outs) {
  var p = groupContents(layer, gi).addProperty("ADBE Vector Shape - Group");
  var sh = new Shape();
  sh.vertices = verts;
  sh.inTangents = ins;
  sh.outTangents = outs;
  sh.closed = false;
  groupContents(layer, gi).property(p.propertyIndex).property("ADBE Vector Shape").setValue(sh);
}
function rectMask(layer, left, top, right, bottom) {
  var m = layer.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
  var s = new Shape();
  s.vertices = [[left, top], [right, top], [right, bottom], [left, bottom]];
  s.closed = true;
  layer.property("ADBE Mask Parade").property(m.propertyIndex).property("ADBE Mask Shape").setValue(s);
}

var DUR = 5;
var c = P.freshComp("08 record puppet pin motion", 1920, 1080, 23.976, DUR, [0.16, 0.18, 0.24]);

// Layout (recipe's layout: line, shares of the comp): window opening 4-91% across, down to about 90%, a window post at
// 91-100% across; head with bun 10-72% down, face centre about 44% across; headphone ear cup centre about 30% across,
// 50% down; shoulders about 14-53% across where the bottom edge cuts them. Sizes below follow those shares.
// Window opening (comp coordinates). ASSUMED: top edge at 60 px (the layout gives no top).
var WL = 77, WT = 60, WR = 1747, WB = 972;

// Landscape outside the window, masked to the opening.
var land = flatShape(c, "landscape");
var gi = group(land, "near hill");
ellipseAt(land, gi, [900, 1010], [1900, 320]);
fill(land, gi, [0.33, 0.55, 0.36, 1]);
gi = group(land, "far hills");
ellipseAt(land, gi, [420, 900], [1100, 420]);
ellipseAt(land, gi, [1320, 920], [1200, 380]);
fill(land, gi, [0.55, 0.72, 0.52, 1]);
gi = group(land, "sky");
rect(land, gi, [(WL + WR) / 2, (WT + WB) / 2], [WR - WL, WB - WT], 0);
fill(land, gi, [0.62, 0.80, 0.93, 1]);
rectMask(land, WL, WT, WR, WB);

// Window frame and the post at the right edge.
var frame = flatShape(c, "window frame");
gi = group(frame, "post");
rect(frame, gi, [(WR + 1920) / 2 + 7, 540], [1920 - WR + 14, 1080], 0);
fill(frame, gi, [0.80, 0.81, 0.84, 1]);
gi = group(frame, "frame");
rect(frame, gi, [(WL + WR) / 2, (WT + WB) / 2], [WR - WL, WB - WT], 24);
stroke(frame, gi, [0.85, 0.86, 0.88, 1], 28);

// Body: the part the two shoulder pins hold still. No keyframes. Shoulders 14-53% across (269-1018 px) at the bottom edge.
var body = flatShape(c, "body");
gi = group(body, "neck");
rect(body, gi, [845, 800], [150, 170], 40);
fill(body, gi, [0.96, 0.80, 0.68, 1]);
gi = group(body, "torso");
rect(body, gi, [644, 1010], [750, 360], 170);
fill(body, gi, [0.93, 0.55, 0.42, 1]);

// Head with headphones: one layer, pivoting at the neck. Head with bun 108-778 px down, face centre 845 px across,
// ear cup centre 576, 540.
var PIVOT = [845, 790];
var head = c.layers.addShape();
head.name = "head";
P.tf(head, "ADBE Anchor Point").setValue(PIVOT);
P.tf(head, "ADBE Position").setValue(PIVOT);
// Groups render top to bottom in the order added (the first group is drawn on top): ear cups, band, face, hair.
gi = group(head, "ear cups");
rect(head, gi, [576, 540], [96, 180], 36);
rect(head, gi, [1114, 540], [96, 180], 36);
fill(head, gi, [0.15, 0.15, 0.18, 1]);
gi = group(head, "headphone band");
arc(head, gi, [[576, 480], [845, 210], [1114, 480]], [[0, 0], [-150, 0], [0, -150]], [[0, -150], [150, 0], [0, 0]]);
stroke(head, gi, [0.15, 0.15, 0.18, 1], 30);
gi = group(head, "face");
ellipseAt(head, gi, [860, 540], [430, 470]);
fill(head, gi, [0.96, 0.80, 0.68, 1]);
gi = group(head, "hair");
ellipseAt(head, gi, [840, 480], [540, 560]);
ellipseAt(head, gi, [900, 195], [175, 175]); // bun: top at about 10% down
fill(head, gi, [0.24, 0.16, 0.12, 1]);

// The "recorded" take for the head pin. Times in seconds at irregular spacing (as a live drag writes them),
// tilt in degrees and a small drift in pixels, the way dragging the top of the head moves it.
// ASSUMED: path, amplitude (up to about 7 degrees) and timing; the recipe says the drag path and Record Options are unknown.
var T = [0, 0.29, 0.54, 0.83, 1.13, 1.38, 1.71, 2.04, 2.25, 2.63, 2.92, 3.25, 3.54];
var A = [0, 2.5, 5.5, 7.0, 5.0, 1.5, -2.5, -5.0, -4.0, -1.0, 2.5, 4.0, 1.5];
var DX = [0, 5, 10, 13, 10, 3, -5, -10, -8, -2, 5, 8, 3];
var DY = [0, -1, -2, -1, 0, 1, 1, 0, -1, -2, -1, 0, 0];
var rot = P.tf(head, "ADBE Rotate Z");
var pos = P.tf(head, "ADBE Position");
var i;
for (i = 0; i < T.length; i++) {
  rot.setValueAtTime(T[i], A[i]);
  pos.setValueAtTime(T[i], [PIVOT[0] + DX[i], PIVOT[1] + DY[i]]);
}
// ASSUMED: smooth (auto-bezier) keys; the recipe says no easing was set by hand and does not say what the recording writes.
for (i = 1; i <= rot.numKeys; i++) {
  rot.setTemporalAutoBezierAtKey(i, true);
  pos.setTemporalAutoBezierAtKey(i, true);
}

return { comp: c.name, id: c.id, layers: c.numLayers, headKeys: rot.numKeys, lastKey: T[T.length - 1] };
