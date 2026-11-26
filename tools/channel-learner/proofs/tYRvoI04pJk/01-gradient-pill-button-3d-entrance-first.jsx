// Technique 01: glossy red rounded-rectangle button swings up from below in 3D, tipped back, and settles flat.
// VERIFY:
// VERIFY: "ADBE Vector Graphic - G-Fill" match name and its children "ADBE Vector Grad Type" (1 = linear), "ADBE Vector Grad Start Pt", "ADBE Vector Grad End Pt", "ADBE Vector Grad Colors"
// VERIFY: setValue on "ADBE Vector Grad Colors" (gradient stops are often NOT scriptable; if it is a no-op or throws, the fill keeps the default gradient and the red stops must be set by hand or swapped for a Gradient Ramp matte)
// VERIFY: "ADBE Vector Shape - Rect", "ADBE Vector Rect Size", "ADBE Vector Rect Roundness"
// VERIFY: P.effect(layer, "ADBE Tint") match name; Tint properties "ADBE Tint-0001" (Map Black To), "ADBE Tint-0002" (Map White To), "ADBE Tint-0003" (Amount to Tint)
// VERIFY: "ADBE Rotate X" is the X Rotation property on a 3D layer
// VERIFY: shape layer's default Position (assumed reset here to the values set below) and that parent offsets read from the parent's anchor [0,0]
// VERIFY: setTemporalEaseAtKey with a one-element array on 3D Position (temporal dimension count 1)
// VERIFY: font "Poppins-Medium" exists (otherwise AE falls back; label width changes the by-eye pair placement)
// VERIFY: layer.threeD = true on shape/text layers gives the classic 3D renderer (comp renderer left at its default)
$.evalFile(args.prelude);

// Recipe is 3840x2160; this comp is 1080x1920. ASSUMED: button 960 px wide (recipe 1406.5), so all recipe sizes are multiplied by k.
var k = 960 / 1406.5;
var W = 1080, H = 1920, CX = 540, CY = 960;
var btnW = 960, btnH = 566.2 * k, radius = 147 * k;
// Perspective: default camera distance grows with comp width, so the recipe's z is scaled by comp-width ratio, the y offset by k.
var zStart = -3580 * (1080 / 3840);
var yStart = CY + (1489 - 1080) * k;

var c = P.freshComp("01 gradient pill button 3d entrance", W, H, 24, 5, [0, 0, 0]);

// Layers are added bottom-up: icon, label, then the shape added last sits on top; order does not matter for parenting.
// --- Button shape ---
var sh = P.shape(c, "button");
var btn = sh.layer;
var cont = P.contents(sh);
var rect = cont.addProperty("ADBE Vector Shape - Rect");
rect.property("ADBE Vector Rect Size").setValue([btnW, btnH]);
rect.property("ADBE Vector Rect Roundness").setValue(radius);
var gf = cont.addProperty("ADBE Vector Graphic - G-Fill");
var gfIdx = gf.propertyIndex;
gf = P.contents(sh).property(gfIdx);
gf.property("ADBE Vector Grad Type").setValue(1); // linear
// Gradient runs along the long axis: start just inside left edge and a little above centre, end past the right edge and a little below.
gf.property("ADBE Vector Grad Start Pt").setValue([-btnW / 2 + 40 * k, -35 * k]);
gf.property("ADBE Vector Grad End Pt").setValue([btnW / 2 + 60 * k, 45 * k]);
// ASSUMED: stops brighter red (0.90,0.05,0.05) to a bit darker red (0.72,0.06,0.06) (rendered samples were ~221,11,12 and ~190,14,13).
gf.property("ADBE Vector Grad Colors").setValue([0.90, 0.05, 0.05, 0.72, 0.06, 0.06]); // SUBSTITUTE-risk: see VERIFY
// Stroke: lighter red, 4 px.
var st = P.stroke(sh, [1.0, 0.38, 0.34, 1], 4, 2);
btn = sh.layer;
// Shape group sits on the layer's anchor, so the layer's position is the button's middle.
P.tf(btn, "ADBE Anchor Point").setValue([0, 0]);
btn.threeD = true;

// --- Icon: stand-in for the upload PNG, drawn dark grey and turned white by Tint (as the recipe does to the PNG) ---
var ic = P.shape(c, "upload icon");
var icon = ic.layer;
P.path(ic, [[0, 70], [0, -150]], null, null, false);
P.path(ic, [[-80, -70], [0, -150], [80, -70]], null, null, false);
P.path(ic, [[-130, 20], [-130, 150], [130, 150], [130, 20]], null, null, false);
P.stroke(ic, [0.5, 0.5, 0.5, 1], 28, 2);
icon = ic.layer;
P.tf(icon, "ADBE Anchor Point").setValue([0, 0]);
P.tf(icon, "ADBE Scale").setValue([42, 42, 42]); // recipe: 42 %. Drawn ~312 high so it reads ~131 high (about 34 % of button height).
var tint = P.effect(icon, "ADBE Tint");
tint.property("ADBE Tint-0001").setValue([1, 1, 1, 1]); // Map Black To white
tint.property("ADBE Tint-0002").setValue([1, 1, 1, 1]); // Map White To white
tint.property("ADBE Tint-0003").setValue(100); // Amount to Tint
icon = ic.layer;
icon.name = "upload icon";
icon.threeD = true;

// --- Label ---
// ASSUMED: size 110 gives "Upload" about 30 % of button height (ascender to descender).
var label = P.text(c, "Upload", { size: 110, color: [1, 1, 1], font: args.font || "Poppins-Medium", name: "label" });
label.threeD = true;

// --- Parenting (children offsets are from the button's middle) ---
// Pair centred by eye: icon ~131 wide, gap ~87 (3.3 % of picture width, scaled), label ~330 wide (ASSUMED font width).
icon.parent = btn;
label.parent = btn;
P.tf(icon, "ADBE Position").setValue([-209, 0, 0]);
P.tf(label, "ADBE Position").setValue([109, 0, 0]);

// --- Motion: Position and X Rotation on the shape, 0 -> 28 frames ---
var tEnd = 28 / 24;
var pos = P.tf(btn, "ADBE Position");
pos.setValueAtTime(0, [CX, yStart, zStart]);
pos.setValueAtTime(tEnd, [CX, CY, 0]);
var rx = P.tf(btn, "ADBE Rotate X");
rx.setValueAtTime(0, -77); // ASSUMED: kept at the recipe's -77 (not flat)
rx.setValueAtTime(tEnd, 0);

// Strong ease-out (the plugin's look): fast out of the first key, long slow tail into the last. Influence/speed are ASSUMED.
function easeOut(prop, avgSpeed) {
  var i;
  for (i = 1; i <= 2; i++) {
    prop.setInterpolationTypeAtKey(i, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
  }
  prop.setTemporalEaseAtKey(1, [new KeyframeEase(0, 0.1)], [new KeyframeEase(avgSpeed * 2.5, 30)]);
  prop.setTemporalEaseAtKey(2, [new KeyframeEase(0, 90)], [new KeyframeEase(0, 33)]);
}
var dy = yStart - CY;
var dist = Math.sqrt(dy * dy + zStart * zStart);
easeOut(pos, dist / tEnd);
easeOut(rx, 77 / tEnd);

return { comp: c.name, id: c.id, layers: c.numLayers };
