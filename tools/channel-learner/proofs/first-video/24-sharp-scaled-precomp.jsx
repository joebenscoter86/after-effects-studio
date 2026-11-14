// Technique 24: keep a scaled-up precomp of vector art crisp with the Collapse Transformations switch.
// A precomp "24 error dialog" built only from shape and text layers (black title bar, grey panel, X icon, FIX button)
// is placed in the main comp and pushed in from 100% to 2050% on the FIX button; the precomp layer's
// collapse/continuously rasterize switch makes the vectors redraw at that size instead of being enlarged as pixels.
// The technique is a layer switch, not a layer, so nothing is named TECH: for the "before" frame run with
// args.sharp = false (or set the "dialog" layer's collapseTransformation to false and back to true afterwards).
// Judge at about 4.5 s, where the scale holds at 2050%.
//
// VERIFY: layer.collapseTransformation is the scripting name of the sunburst switch on a precomp layer.
// VERIFY: items.addComp adds the precomp to the project and layers.add(compItem) places it as a precomp layer.
// VERIFY: the FIX button's centre in the precomp lands where expected (text anchors are centred by P.text); adjust ANCHOR if the zoom misses the letters.
// VERIFY: shape Rect and Fill match names as in 22.
$.evalFile(args.prelude);

function addRect(sh, size, pos, round) {
  var r = P.contents(sh).addProperty("ADBE Vector Shape - Rect");
  var idx = r.propertyIndex;
  P.contents(sh).property(idx).property("ADBE Vector Rect Size").setValue(size);
  P.contents(sh).property(idx).property("ADBE Vector Rect Position").setValue(pos || [0, 0]);
  P.contents(sh).property(idx).property("ADBE Vector Rect Roundness").setValue(round || 0);
  return idx;
}
function addFill(sh, color) {
  var f = P.contents(sh).addProperty("ADBE Vector Graphic - Fill");
  var idx = f.propertyIndex;
  P.contents(sh).property(idx).property("ADBE Vector Fill Color").setValue(color);
  return idx;
}
// A shape layer whose contents are drawn in comp coordinates (position and anchor at 0,0).
function originShape(comp, name) {
  var sh = P.shape(comp, name);
  P.tf(sh.layer, "ADBE Anchor Point").setValue([0, 0]);
  P.tf(sh.layer, "ADBE Position").setValue([0, 0]);
  return sh;
}

// ASSUMED: precomp 800 x 500 (recipe: precomp and comp sizes unknown), 24 fps, 5 s.
var PW = 800, PH = 500, DUR = 5;
var pre = P.freshComp("24 error dialog", PW, PH, 24, DUR, [0, 0, 0]);

// Grey panel.
var panel = originShape(pre, "panel");
addRect(panel, [PW, PH], [PW / 2, PH / 2], 0);
addFill(panel, [0.75, 0.75, 0.75, 1]);

// Black title bar with its caption.
var bar = originShape(pre, "title bar");
addRect(bar, [PW, 60], [PW / 2, 30], 0);
addFill(bar, [0, 0, 0, 1]);
P.text(pre, "System Error", { size: 30, color: [1, 1, 1], pos: [PW / 2, 30], name: "title" });

// X icon: a red disc with two crossed strokes.
var icon = originShape(pre, "x icon disc");
var disc = P.ellipse(icon, [120, 120]);
var discIdx = disc.propertyIndex;
P.contents(icon).property(discIdx).property("ADBE Vector Ellipse Position").setValue([150, 210]);
addFill(icon, [0.8, 0.1, 0.1, 1]);
var cross = originShape(pre, "x icon cross");
P.path(cross, [[115, 175], [185, 245]], null, null, false);
P.path(cross, [[185, 175], [115, 245]], null, null, false);
P.stroke(cross, [1, 1, 1, 1], 14, 2);

// Message text.
// Run fix: sized from the recipe's layout line, divided by the 2050% scale (x 20.5). In the main comp the word FIX has
// capitals 45% of the height tall (486 px -> 23.7 px here), spans 10.5% to 55% across (854 px -> 41.7 px here), with a gap
// of 11.6% of the width to the next word (223 px -> 10.9 px) and the line above on a baseline 61% of the height higher
// (659 px -> 32.1 px). So FIX is a word in a two-line message, not the button label the script first zoomed on.
// ASSUMED: the words ("CANNOT CONTINUE" / "FIX THE ERROR") and the face.
var K = 20.5;
var CAP = 0.45 * 1080 / K, FIXW = (0.55 - 0.105) * 1920 / K, GAP = 0.116 * 1920 / K, LEAD = 0.61 * 1080 / K;
// Run fix: Helvetica Neue Condensed Bold gave stems 5.1% of the width at 2050% (layout 3.3%); Arial Narrow is lighter.
var cand = [args.font || "ArialNarrow", "HelveticaNeue-CondensedBold", "DINCondensed-Bold", "Arial-BoldMT"];
var FONT = null, ci, fo;
for (ci = 0; ci < cand.length && !FONT; ci++) {
  try { fo = app.fonts.getFontsByPostScriptName(cand[ci]); if (fo.length && !fo[0].isSubstitute) FONT = cand[ci]; } catch (errFont) {}
}
if (!FONT) FONT = "Arial-BoldMT";
var probe = P.text(pre, "FIX", { size: 100, font: FONT, color: [0, 0, 0], name: "probe" });
var pr = probe.sourceRectAtTime(0, false);
var FS = 100 * CAP / pr.height;
var pd = probe.property("ADBE Text Properties").property("ADBE Text Document");
var pdoc = pd.value; pdoc.fontSize = FS; pd.setValue(pdoc);
pr = probe.sourceRectAtTime(0, false);
var TRK = Math.round((FIXW - pr.width) / 2 * 1000 / FS); // two letter gaps in FIX
probe.remove();
// Place a caps-only text layer by its left edge and baseline (P.text centres the anchor on the bounds).
function lineAt(str, left, base, name) {
  var l = P.text(pre, str, { size: FS, font: FONT, color: [0, 0, 0], tracking: TRK, name: name });
  var r = l.sourceRectAtTime(0, false);
  P.tf(l, "ADBE Position").setValue([left + r.width / 2, base - r.height / 2]);
  return { layer: l, w: r.width, h: r.height, cx: left + r.width / 2, cy: base - r.height / 2 };
}
var MX = 250, BASE = 250; // message block: left edge and the FIX line's baseline, to the right of the X icon
var fixT = lineAt("FIX", MX, BASE, "message FIX");
lineAt("THE ERROR", MX + fixT.w + GAP, BASE, "message rest");
lineAt("CANNOT CONTINUE", MX, BASE - LEAD, "message line 1");

// Button: outlined light box (kept from the first build; the zoom no longer lands on it).
var BTN = [PW / 2, 390];
var btn = originShape(pre, "fix button");
addRect(btn, [200, 70], BTN, 0);
addFill(btn, [0.88, 0.88, 0.88, 1]);
P.stroke(btn, [0, 0, 0, 1], 3);
P.text(pre, "OK", { size: 34, font: FONT, color: [0, 0, 0], pos: BTN, name: "button label" });

// Main comp: step 1, the precomp placed in the main comp.
// Run fix: background a flat light grey (layout); at 2050% the grey panel fills the frame anyway.
var c = P.freshComp("24 sharp scaled precomp", 1920, 1080, 24, DUR, [0.75, 0.75, 0.75]);
var L = c.layers.add(pre);
L.name = "dialog";
// Anchor so that at 2050% FIX spans 10.5% to 55% across (its centre at 32.75%) with its capitals centred at 54.5% down.
var ANCHOR = [fixT.cx + (0.5 - 0.3275) * 1920 / K, fixT.cy - (0.545 - 0.5) * 1080 / K];
P.tf(L, "ADBE Anchor Point").setValue(ANCHOR);
P.tf(L, "ADBE Position").setValue([960, 540]);

// Step 2: scale up a long way. 100% -> 670% -> 2050% (recipe), then hold.
// SUBSTITUTE: the author scrubbed the scale by hand; here it is keyframed so every stage is in one comp.
var sc = P.tf(L, "ADBE Scale");
sc.setValueAtTime(0, [100, 100]);
sc.setValueAtTime(2, [670, 670]);
sc.setValueAtTime(4, [2050, 2050]);

// Step 3: the sunburst switch.
L.collapseTransformation = (args.sharp !== false);

return { comp: c.name, id: c.id, precomp: pre.name, judgeTime: 4.5, collapseTransformation: L.collapseTransformation,
  font: FONT, fontSize: FS, tracking: TRK, fix: [fixT.w, fixT.h], anchor: ANCHOR };
