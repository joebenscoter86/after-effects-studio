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

// Stand-in graphic. ASSUMED: arc radii, angles and stroke width (the recipe says only "thin white circle arcs with dot ends").
var arcs = [
  [320, -150, 20],
  [320, 60, 200],
  [260, 110, 300]
];
var i, sh, ends = [];
for (i = 0; i < arcs.length; i++) {
  sh = P.shape(c, "arc " + (i + 1));
  arcPath(sh, arcs[i][0], arcs[i][1], arcs[i][2]);
  P.stroke(sh, [1, 1, 1, 1], 4, 2);
  ends.push(pointOn(arcs[i][0], arcs[i][1]));
  ends.push(pointOn(arcs[i][0], arcs[i][2]));
}
// Dot ends: one shape layer holding a filled circle at each arc end.
var dots = c.layers.addShape();
dots.name = "arc dots";
var root = dots.property("ADBE Root Vectors Group");
var g = root.addProperty("ADBE Vector Group");
var e;
for (i = 0; i < ends.length; i++) {
  e = dots.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Ellipse");
  e.property("ADBE Vector Ellipse Size").setValue([18, 18]);
  e.property("ADBE Vector Ellipse Position").setValue(ends[i]);
}
var f = dots.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill");
f.property("ADBE Vector Fill Color").setValue([1, 1, 1, 1]);

P.text(c, "Bloom", { size: 110, font: args.font || "Poppins-Light", color: [1, 1, 1], name: "word" });

// 1. Adjustment layer at the top of the comp.
var adj = P.solid(c, "TECH glow", [1, 1, 1]);
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

return { comp: c.name, id: c.id, layers: c.numLayers, techLayer: "TECH glow" };
