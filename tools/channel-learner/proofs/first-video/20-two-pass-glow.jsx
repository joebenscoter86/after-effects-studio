// Technique 20: two stacked glows for a soft cinematic bloom.
// An adjustment layer at the top of the comp carries two Glow effects: a tight one (radius 39) and a very wide one (radius 242).
// Stand-in: thin white circle arcs with dot ends and a light word in the centre, on near-black.
// The technique is the layer "TECH glow" (and its effects "TECH glow tight" / "TECH glow wide"): switch that layer off for the before frame.
//
// VERIFY: Glow display name "Glow" adds the stock Stylize > Glow (match name "ADBE Glo2"), not another glow.
// VERIFY: Glow property display name "Glow Radius"; defaults Threshold 60%, Intensity 1.0, Based On Color Channels,
//         Composite Original Behind, Operation Add, Colors Original Colors are left as they are (not set here).
// VERIFY: renaming an effect through .name works and the effect can then be fetched by its index.
// VERIFY: a new shape layer sits at the comp centre with anchor [0,0], so shape coordinates are relative to the centre.
// VERIFY: font PostScript name "Poppins-Light" is installed; pass args.font otherwise.
$.evalFile(args.prelude);

// Candidate for the prelude: an open circular arc as a bezier path, angles in degrees, 0 = 3 o'clock, clockwise on screen.
function arcPath(sh, r, a0, a1) {
  var n = Math.ceil(Math.abs(a1 - a0) / 90);
  var step = (a1 - a0) / n;
  var rad = Math.PI / 180;
  var k = 4 / 3 * Math.tan(step * rad / 4) * r;
  var verts = [], ins = [], outs = [], i, a, x, y, tx, ty;
  for (i = 0; i <= n; i++) {
    a = (a0 + step * i) * rad;
    x = Math.cos(a) * r;
    y = Math.sin(a) * r;
    tx = -Math.sin(a) * k; // tangent along the direction of travel
    ty = Math.cos(a) * k;
    verts.push([x, y]);
    ins.push([-tx, -ty]);
    outs.push([tx, ty]);
  }
  return P.path(sh, verts, ins, outs, false);
}
function pointOn(r, a) {
  var rad = Math.PI / 180;
  return [Math.cos(a * rad) * r, Math.sin(a * rad) * r];
}

var c = P.freshComp("20 two-pass glow", 1920, 1080, 24, 4, [0.03, 0.03, 0.035]);

// Re-runs: freshComp removes the comp but not its solid; remove this script's unused one.
(function () {
  var j, it;
  for (j = app.project.numItems; j >= 1; j--) {
    it = app.project.item(j);
    if (it instanceof FootageItem && it.mainSource instanceof SolidSource && it.usedIn.length === 0 && it.name === "20 glow adjustment") it.remove();
  }
})();

// Stand-in graphic, sized from the recipe's layout: line (shares of the whole comp): arc ring about 26 % of the width and
// 47 % of the height across (radius 252 px), centred at 51 % across, 50 % down; three arcs of about 82 degrees centred
// 120 degrees apart (gaps about 38 degrees); dot ends about 1 % of the width (19 px); line about 0.2 % (4 px);
// centre word about 9 % of the width wide (173 px) and 5 % of the height tall.
var CEN = [0.51 * 1920, 540];
var R = 252;
var arcs = [
  [R, -131, -49],
  [R, -11, 71],
  [R, 109, 191]
];
var i, sh, ends = [];
for (i = 0; i < arcs.length; i++) {
  sh = P.shape(c, "arc " + (i + 1));
  arcPath(sh, arcs[i][0], arcs[i][1], arcs[i][2]);
  P.stroke(sh, [1, 1, 1, 1], 4, 2);
  P.tf(sh.layer, "ADBE Position").setValue(CEN);
  ends.push(pointOn(arcs[i][0], arcs[i][1]));
  ends.push(pointOn(arcs[i][0], arcs[i][2]));
}
// Dot ends: one shape layer holding a filled circle at each arc end.
var dots = c.layers.addShape();
dots.name = "arc dots";
P.tf(dots, "ADBE Position").setValue(CEN);
var root = dots.property("ADBE Root Vectors Group");
var g = root.addProperty("ADBE Vector Group");
var e, ei;
for (i = 0; i < ends.length; i++) {
  ei = dots.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Ellipse").propertyIndex;
  e = dots.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property(ei);
  e.property("ADBE Vector Ellipse Size").setValue([19, 19]);
  e.property("ADBE Vector Ellipse Position").setValue(ends[i]);
}
var fi = dots.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill").propertyIndex;
dots.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property(fi).property("ADBE Vector Fill Color").setValue([1, 1, 1, 1]);

// The centre word.
// Run fix: getFontsByPostScriptName finds "Poppins-Light" here, but as a substitute (isSubstitute true, drawn in Helvetica),
// so the first candidate that is really installed is used.
var FONT = null, cand = [args.font, "Poppins-Light", "Poppins-Regular", "HelveticaNeue-Light"], ci, fo;
for (ci = 0; ci < cand.length && !FONT; ci++) {
  if (!cand[ci]) continue;
  try { fo = app.fonts.getFontsByPostScriptName(cand[ci]); if (fo.length && !fo[0].isSubstitute) FONT = cand[ci]; } catch (errFont) {}
}
if (!FONT) FONT = "Poppins-Bold";
var word = P.text(c, "Bloom", { size: 100, font: FONT, color: [1, 1, 1], name: "word" });
(function () {
  var prop = word.property("ADBE Text Properties").property("ADBE Text Document");
  var rr = word.sourceRectAtTime(0, false);
  var d0 = prop.value;
  d0.fontSize = Math.round(100 * 173 / rr.width * 10) / 10;
  prop.setValue(d0);
  rr = word.sourceRectAtTime(0, false);
  P.tf(word, "ADBE Anchor Point").setValue([rr.left + rr.width / 2, rr.top + rr.height / 2]);
  P.tf(word, "ADBE Position").setValue(CEN);
})();

// 1. Adjustment layer at the top of the comp.
var adj = P.solid(c, "TECH glow", [1, 1, 1]);
adj.source.name = "20 glow adjustment";
adj.name = "TECH glow";
adj.adjustmentLayer = true;
adj.moveToBeginning();

// 2 and 3. First Glow, radius raised slightly to 39.
// ASSUMED: the tight glow (39) is first in the stack and the wide one (242) second; the recipe never shows the duplicate.
var g1 = P.effect(adj, "Glow");
var g1i = g1.propertyIndex;
adj.property("ADBE Effect Parade").property(g1i).property("Glow Radius").setValue(args.tight || 39);
adj.property("ADBE Effect Parade").property(g1i).name = "TECH glow tight";

// 4 and 5. Second Glow, radius 242.
// SUBSTITUTE: a second Glow added fresh stands in for Edit > Duplicate on the first; all other properties are defaults in both.
var g2 = P.effect(adj, "Glow");
var g2i = g2.propertyIndex;
adj.property("ADBE Effect Parade").property(g2i).property("Glow Radius").setValue(args.wide || 242);
adj.property("ADBE Effect Parade").property(g2i).name = "TECH glow wide";

var wd = word.property("ADBE Text Properties").property("ADBE Text Document").value;
return { comp: c.name, id: c.id, layers: c.numLayers, techLayer: "TECH glow", font: wd.font, fontSize: wd.fontSize,
  fx: adj.property("ADBE Effect Parade").property(1).name + " [" + adj.property("ADBE Effect Parade").property(1).matchName + "] " +
      adj.property("ADBE Effect Parade").property(1).property("Glow Radius").value + " | " +
      adj.property("ADBE Effect Parade").property(2).name + " " + adj.property("ADBE Effect Parade").property(2).property("Glow Radius").value };
