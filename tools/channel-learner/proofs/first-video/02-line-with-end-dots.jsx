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
// VERIFY (run): "Poppins-Light" is not installed (silently substituted); the script uses Poppins-Regular.
$.evalFile(args.prelude);
// Rebuild with artwork (2026-11-14): art from PROOF/02/art (brief.md). Pass args.artLib (art.jsx) and args.artDir.
$.evalFile(args.artLib);
var ARTDIR = args.artDir;
var COOL = ART.hex("#F4F6FA");
function glowCool(layer, radius) {
  var fx = ART.glow(layer, 60, radius, 0.6);
  // Brief, optional: tint the glow very slightly cool (#BFEFFF). Glow Colors 2 = A & B Colors.
  var miss = ART.setFx(fx, { "Glow Colors": 2 });
  fx = layer.property("ADBE Effect Parade").property(fx.propertyIndex);
  miss = miss.concat(ART.setFx(fx, { "Color A": ART.hex("#BFEFFF"), "Color B": ART.hex("#F4F6FA") }));
  return miss;
}

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

// Run fix (layout line): circle about 0.27 of the width and 0.47 of the height across (518 x 508 px), so D = 513.
var D = args.diameter || 513;
var TRIM_START = 77; // recipe
var GAP = (TRIM_START / 100) * Math.PI * D; // recipe build notes: Gap = Start% x circumference (about 1136.9 at 470 px)

var c = P.freshComp("02 line with end dots", 1920, 1080, 24, 4, ART.hex("#08080A"));
(function () { var i, it; for (i = app.project.numItems; i >= 1; i--) { it = app.project.item(i); if (it instanceof FootageItem && it.name === "02 arcs null" && it.usedIn.length === 0) it.remove(); } })();

// Brief: backdrop at 100 %, no offset, slow push-in 100 -> 103 %.
var bd = c.layers.add(ART.footage(ARTDIR, "backdrop.png", "art 02"));
bd.name = "backdrop";
P.tf(bd, "ADBE Scale").setValueAtTime(0, [100, 100]);
P.tf(bd, "ADBE Scale").setValueAtTime(c.duration, [103, 103]);

// Brief: Poppins Regular, cool white #F4F6FA, soft glow.
P.text(c, args.word || "Orbit", { size: args.size || 70, color: COOL, font: args.font || "Poppins-Regular", name: "label", pos: [960, 540] });
var glowMiss = glowCool(c.layer("label"), 18);

var l = c.layers.addShape();
l.name = "arc 1";

// Step 2: the solid line group, made first so it sits above the dot group ("Ellipse 2" above "Ellipse 1").
var gLine = addGroup(l, "Ellipse 2 line");
addEllipse(l, gLine, [D, D]);
addStroke(l, gLine, COOL.concat([1]), 3, 2); // Stroke Width 3, Round Cap, no dashes
// Step 3: Trim Paths inside the line group: Start 77, End 100, Offset 0.
var t = groupContents(l, gLine).addProperty("ADBE Vector Filter - Trim");
var tIdx = t.propertyIndex;
groupContents(l, gLine).property(tIdx).property("ADBE Vector Trim Start").setValue(TRIM_START);
groupContents(l, gLine).property(tIdx).property("ADBE Vector Trim End").setValue(100);
groupContents(l, gLine).property(tIdx).property("ADBE Vector Trim Offset").setValue(0);

// Step 1: the dotted group, as in technique 01 (Stroke Width 18, Round Cap, Dash 0).
var gDots = addGroup(l, "Ellipse 1 dots");
addEllipse(l, gDots, [D, D]);
var sDots = addStroke(l, gDots, COOL.concat([1]), 18, 2);
// Step 4: Gap raised until only the two end dots are left (worked out, not eyeballed).
groupContents(l, gDots).property(sDots).property("ADBE Vector Stroke Dashes").addProperty("ADBE Vector Stroke Dash 1");
groupContents(l, gDots).property(sDots).property("ADBE Vector Stroke Dashes").property("ADBE Vector Stroke Dash 1").setValue(0);
groupContents(l, gDots).property(sDots).property("ADBE Vector Stroke Dashes").addProperty("ADBE Vector Stroke Gap 1");
groupContents(l, gDots).property(sDots).property("ADBE Vector Stroke Dashes").property("ADBE Vector Stroke Gap 1").setValue(GAP);

// Step 5: three layers parented to one null, laid out around the centre.
// Run fix (layout line): arcs of about 82 deg with uneven gaps of 32, 38 and 44 deg, the 32 deg gap at the top
// between about 77 and 110 deg from the right. Unrotated, the 77-100% arc spans 90..172.8 deg (counter-clockwise from
// the right); layer Rotation r (clockwise on screen) moves it to 90-r..172.8-r. Arcs at 110-193, 231-314, 355-78 deg.
// ASSUMED: which of the 38 and 44 deg gaps comes first (not given).
// Glow on the arc layer before duplicating so all three carry it (dots must stay distinct).
glowMiss = glowMiss.concat(glowCool(l, args.arcGlowRadius || 15));
var l2 = l.duplicate();
l2.name = "arc 2";
var l3 = l.duplicate();
l3.name = "arc 3";
P.tf(l, "ADBE Rotate Z").setValue(-20);
P.tf(l2, "ADBE Rotate Z").setValue(-141);
P.tf(l3, "ADBE Rotate Z").setValue(-265);

var n = c.layers.addNull(c.duration);
n.name = "arcs null";
n.source.name = "02 arcs null";
P.tf(n, "ADBE Position").setValue([c.width / 2, c.height / 2]);
l.parent = n;
l2.parent = n;
l3.parent = n;

// ASSUMED: the finished arcs move, but no keyframes are shown.
// Polish (2026-11-14): the review measured the tutorial's set turning steadily clockwise at about 20 deg/s; the old
// eased 0 -> 90 deg ran 7 deg/s at the ends and 44 deg/s mid-move. The null now turns linearly at 20 deg/s through the
// whole comp (0 deg at 0 s, 80 deg at 4 s; linear keys, no ease).
var RATE = args.rate !== undefined ? args.rate : 20;
var rot = P.tf(n, "ADBE Rotate Z");
rot.setValueAtTime(0, 0);
rot.setValueAtTime(c.duration, RATE * c.duration);
rot.setInterpolationTypeAtKey(1, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
rot.setInterpolationTypeAtKey(2, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);

// Brief layer order: backdrop, arcs, word (word on top).
c.layer("label").moveToBeginning();
var lb = c.layer("label").sourceRectAtTime(0, false);
var order = []; for (var li = 1; li <= c.numLayers; li++) order.push(c.layer(li).name);
return { glowMiss: glowMiss, allOrder: order, comp: c.name, id: c.id, layers: c.numLayers, diameter: D, gap: GAP, labelW: lb.width, order: [c.layer(1).name, c.layer(2).name, c.layer(3).name, c.layer(4).name, c.layer(5).name], groups: [l.property("ADBE Root Vectors Group").property(1).name, l.property("ADBE Root Vectors Group").property(2).name], composite: groupContents(l, gLine).property(2).property("ADBE Vector Composite Order").value };
