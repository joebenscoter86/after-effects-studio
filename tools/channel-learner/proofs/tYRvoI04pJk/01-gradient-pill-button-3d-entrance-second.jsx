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
// VERIFY: layer.threeDLayer = true on shape/text layers gives the classic 3D renderer (comp renderer left at its default)
$.evalFile(args.prelude);

// Recipe is 3840x2160; this comp is 1080x1920. ASSUMED: button 960 px wide (recipe 1406.5), so all recipe sizes are multiplied by k.
var k = 960 / 1406.5;
var W = 1080, H = 1920, CX = 540, CY = 960;
var btnW = 960, btnH = 566.2 * k, radius = 147 * k;
// Perspective: default camera distance grows with comp width, so the recipe's z is scaled by comp-width ratio, the y offset by k.
var zStart = -3580 * (1080 / 3840);
var yStart = CY + (1489 - 1080) * k;

var c = P.freshComp("01 gradient pill button 3d entrance", W, H, 24, 5, [0, 0, 0]);

// --- Art (brief.md): backdrop and icon imported into project folder "art 01" ---
var ARTDIR = args.art || "~/Assets/comp-room-studies/channel-study/tYRvoI04pJk/proof/01/art/";
var artFolder = null, fi;
for (fi = app.project.numItems; fi >= 1; fi--) { if (app.project.item(fi) instanceof FolderItem && app.project.item(fi).name === "art 01") artFolder = app.project.item(fi); }
if (!artFolder) artFolder = app.project.items.addFolder("art 01");
function artItem(fname) {
  var j, it;
  for (j = 1; j <= app.project.numItems; j++) { it = app.project.item(j); if (it instanceof FootageItem && it.name === fname) return it; }
  it = app.project.importFile(new ImportOptions(new File(ARTDIR + fname)));
  it.parentFolder = artFolder;
  return it;
}
var bd = c.layers.add(artItem("backdrop.png"));
bd.name = "Backdrop";
P.tf(bd, "ADBE Position").setValue([CX, CY]);
P.tf(bd, "ADBE Scale").setValue([100, 100]);

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
gf.property("ADBE Vector Grad Start Pt").setValue([-1648, -60]); // SUBSTITUTE: far start so the left edge is ~55 % white, right edge ~18 % (see Tint below)
gf.property("ADBE Vector Grad End Pt").setValue([947, 60]);
// ASSUMED: stops brighter red (0.90,0.05,0.05) to a bit darker red (0.72,0.06,0.06) (rendered samples were ~221,11,12 and ~190,14,13).
// VERIFIED: ADBE Vector Grad Colors is NO_VALUE (not scriptable). Default white-to-black ramp kept; recoloured by Tint on the layer.
// Stroke: lighter red, 4 px.
var st = P.stroke(sh, [1, 1, 1, 1], 4, 2); // white: Tint maps it to the lighter rim red
btn = sh.layer;
var bt = P.effect(btn, "ADBE Tint");
bt.property("ADBE Tint-0001").setValue([0.69, 0.047, 0.047, 1]); // Map Black To
bt.property("ADBE Tint-0002").setValue([0.94, 0.22, 0.18, 1]); // Map White To
bt.property("ADBE Tint-0003").setValue(100);
btn = sh.layer;
// Shape group sits on the layer's anchor, so the layer's position is the button's middle.
P.tf(btn, "ADBE Anchor Point").setValue([0, 0]);
btn.threeDLayer = true;

// --- Icon: art PNG (dark glyph), Tint turns it white as the recipe does ---
var icon = c.layers.add(artItem("icon-upload.png"));
icon.name = "Upload icon";
var iconH = 0.34 * btnH; // brief: icon height about 34 % of button height
var iconS = iconH / 653 * 100;
P.tf(icon, "ADBE Scale").setValue([iconS, iconS, iconS]);
var tint = P.effect(icon, "ADBE Tint");
tint.property("ADBE Tint-0001").setValue([1, 1, 1, 1]); // Map Black To white
tint.property("ADBE Tint-0002").setValue([1, 1, 1, 1]); // Map White To white
tint.property("ADBE Tint-0003").setValue(100); // Amount to Tint
icon = c.layer("Upload icon");
icon.threeDLayer = true;

// --- Label ---
// ASSUMED: size 110 gives "Upload" about 30 % of button height (ascender to descender).
var label = P.text(c, "Upload", { size: 136, color: [1, 1, 1], font: args.font || "HelveticaNeue-Bold", name: "label" });
label.threeDLayer = true;

// --- Parenting (children offsets are from the button's middle) ---
var lr = label.sourceRectAtTime(0, false);
var lw = lr.width, iw = iconH, gap = 0.033 * W;
var pw = iw + gap + lw, left = -pw / 2;
icon.parent = btn;
label.parent = btn;
P.tf(icon, "ADBE Position").setValue([left + iw / 2, 0, 0]);
P.tf(label, "ADBE Position").setValue([left + iw + gap + lw / 2, 0, 0]);

// --- Motion: Position and X Rotation on the shape, 0 -> 28 frames ---
var tEnd = 28 / 24;
btn = c.layer("button"); // re-fetch: the earlier reference predates threeD
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

return { labelW: lw, font: label.property("ADBE Text Properties").property("ADBE Text Document").value.font, comp: c.name, id: c.id, layers: c.numLayers };
