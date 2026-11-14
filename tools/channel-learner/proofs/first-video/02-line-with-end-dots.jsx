// Technique 02: an arc with a round dot at each end (recipe 02-line-with-end-dots).
// One shape layer, two groups on the same ellipse:
//   "Ellipse 2 line" (top): stroke 3, Round Cap, no dashes, Trim Paths Start 77 / End 100.
//   "Ellipse 1 dots" (below): stroke 18, Round Cap, Dash 0, Gap = 0.77 x circumference, so only two dots are left,
//   one at the path start (12 o'clock, where the arc ends) and one at 77% (where the arc begins).
// Three copies of the layer, turned 0 / 120 / 240 deg, are parented to one null that turns.
//
// VERIFY: "ADBE Vector Stroke Line Cap" value 2 = Round Cap.
// VERIFY: a new "ADBE Vector Group" is appended at the bottom of Contents, so the group made first sits on top.
// VERIFY: the stroke's Composite default is "Below Previous in Same Group" (recipe value); the script leaves it at default.
// VERIFY: "ADBE Vector Filter - Trim" with "ADBE Vector Trim Start" / "ADBE Vector Trim End"; Trim Multiple Shapes left at
//         its default, Simultaneously.
// VERIFY: an After Effects ellipse path starts at 12 o'clock and runs clockwise, so 77-100% is the arc from just above
//         9 o'clock to 12 o'clock and the two dots land on its ends (inferred in the recipe).
// VERIFY: the dash pattern starts at the path start with Offset 0, and no third dot appears at 100% (= 0%).
// VERIFY: layer.duplicate() keeps the shape contents and returns the new layer.
// VERIFY: font "Poppins-Light" exists; pass args.font otherwise.
$.evalFile(args.prelude);

// Own helpers: the prelude's P.shape / P.contents handle only the first group. Candidates for the prelude.
function addGroup(layer, name) {
  var root = layer.property("ADBE Root Vectors Group");
  var g = root.addProperty("ADBE Vector Group");
  var idx = g.propertyIndex;
  layer.property("ADBE Root Vectors Group").property(idx).name = name;
  return idx;
}
function groupContents(layer, gi) {
  return layer.property("ADBE Root Vectors Group").property(gi).property("ADBE Vectors Group");
}
function addEllipse(layer, gi, size) {
  var e = groupContents(layer, gi).addProperty("ADBE Vector Shape - Ellipse");
  groupContents(layer, gi).property(e.propertyIndex).property("ADBE Vector Ellipse Size").setValue(size);
}
function addStroke(layer, gi, color, width, cap) {
  var s = groupContents(layer, gi).addProperty("ADBE Vector Graphic - Stroke");
  var idx = s.propertyIndex;
  groupContents(layer, gi).property(idx).property("ADBE Vector Stroke Color").setValue(color);
  groupContents(layer, gi).property(idx).property("ADBE Vector Stroke Width").setValue(width);
  groupContents(layer, gi).property(idx).property("ADBE Vector Stroke Line Cap").setValue(cap);
  return idx;
}

// ASSUMED: ellipse diameter 470 px. The recipe treats the size as unknown; 470 is what the shown Gap 1136.3 implies.
var D = args.diameter || 470;
var TRIM_START = 77; // recipe
var GAP = (TRIM_START / 100) * Math.PI * D; // recipe build notes: Gap = Start% x circumference (about 1136.9 at 470 px)

var c = P.freshComp("02 line with end dots", 1920, 1080, 24, 4, [0.03, 0.04, 0.03]);

// Stand-in: a short white word in the middle. ASSUMED: word, size and font.
P.text(c, "Orbit", { size: 72, color: [1, 1, 1], font: args.font || "Poppins-Light", name: "label" });

var l = c.layers.addShape();
l.name = "arc 1";

// Step 2: the solid line group, made first so it sits above the dot group ("Ellipse 2" above "Ellipse 1").
var gLine = addGroup(l, "Ellipse 2 line");
addEllipse(l, gLine, [D, D]);
addStroke(l, gLine, [1, 1, 1, 1], 3, 2); // Stroke Width 3, Round Cap, no dashes
// Step 3: Trim Paths inside the line group: Start 77, End 100, Offset 0.
var t = groupContents(l, gLine).addProperty("ADBE Vector Filter - Trim");
var tIdx = t.propertyIndex;
groupContents(l, gLine).property(tIdx).property("ADBE Vector Trim Start").setValue(TRIM_START);
groupContents(l, gLine).property(tIdx).property("ADBE Vector Trim End").setValue(100);
groupContents(l, gLine).property(tIdx).property("ADBE Vector Trim Offset").setValue(0);

// Step 1: the dotted group, as in technique 01 (Stroke Width 18, Round Cap, Dash 0).
var gDots = addGroup(l, "Ellipse 1 dots");
addEllipse(l, gDots, [D, D]);
var sDots = addStroke(l, gDots, [1, 1, 1, 1], 18, 2);
// Step 4: Gap raised until only the two end dots are left (worked out, not eyeballed).
groupContents(l, gDots).property(sDots).property("ADBE Vector Stroke Dashes").addProperty("ADBE Vector Stroke Dash 1");
groupContents(l, gDots).property(sDots).property("ADBE Vector Stroke Dashes").property("ADBE Vector Stroke Dash 1").setValue(0);
groupContents(l, gDots).property(sDots).property("ADBE Vector Stroke Dashes").addProperty("ADBE Vector Stroke Gap 1");
groupContents(l, gDots).property(sDots).property("ADBE Vector Stroke Dashes").property("ADBE Vector Stroke Gap 1").setValue(GAP);

// Step 5: three layers parented to one null, laid out around the centre.
// ASSUMED: the copies are spaced by layer Rotation, 0 / 120 / 240 deg (the recipe does not show how they were offset).
var l2 = l.duplicate();
l2.name = "arc 2";
var l3 = l.duplicate();
l3.name = "arc 3";
P.tf(l, "ADBE Rotate Z").setValue(0);
P.tf(l2, "ADBE Rotate Z").setValue(120);
P.tf(l3, "ADBE Rotate Z").setValue(240);

var n = c.layers.addNull(c.duration);
n.name = "arcs null";
P.tf(n, "ADBE Position").setValue([c.width / 2, c.height / 2]);
l.parent = n;
l2.parent = n;
l3.parent = n;

// ASSUMED: the finished arcs move, but no keyframes are shown. The null turns 0 -> 90 deg over the comp, eased.
var rot = P.tf(n, "ADBE Rotate Z");
rot.setValueAtTime(0, 0);
rot.setValueAtTime(c.duration, args.endAngle !== undefined ? args.endAngle : 90);
var ease = new KeyframeEase(0, 50);
rot.setTemporalEaseAtKey(1, [ease], [ease]);
rot.setTemporalEaseAtKey(2, [ease], [ease]);

return { comp: c.name, id: c.id, layers: c.numLayers, diameter: D, gap: GAP };
