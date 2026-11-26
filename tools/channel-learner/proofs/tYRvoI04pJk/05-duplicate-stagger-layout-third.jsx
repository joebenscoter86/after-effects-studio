// Technique 05: duplicate, mirror and stagger a button-and-line layout, all parented to one scrolling null.
// VERIFY: "CC Light Sweep" is accepted by canAddProperty as a match name (P.effect takes match names); else try "CC Light Sweep" display lookup
// VERIFY: CC Light Sweep property display names: Center, Direction, Shape, Width, Sweep Intensity, Edge Intensity, Edge Thickness, Light Color, Light Reception
// VERIFY: CC Light Sweep Shape enum Smooth = 2 (Linear 1, Smooth 2, Sharp 3); Light Reception Add = 1 (Add 1, Cutout 2, Composite 3)
// VERIFY: CC Light Sweep Direction 90 lights a horizontal line (top edge) and 270 the bottom one; recipe lists 0/180 but its look says top and bottom
// VERIFY: effect space of a shape layer has origin at the layer's top-left (comp-sized), so shapes are drawn at (540+x, 960+y) in layer space
// VERIFY: "ADBE Glo2" accepted; Glow property names: Glow Threshold (0-100), Glow Radius, Glow Intensity, Composite Original (Behind = 2; On Top 1, Behind 2, None 3)
// VERIFY: "ADBE Vector Filter - Trim" added after the path and before the stroke still trims that path; match "ADBE Vector Trim End"
// VERIFY: "ADBE Vector Rect Roundness", "ADBE Vector Rect Size", "ADBE Vector Rect Position", "ADBE Vector Fill Color", "ADBE Vector Fill Opacity" match names
// VERIFY: effect.name is settable on a returned effect property (TECH names)
// VERIFY: font "Helvetica" exists (args.font overrides)
// VERIFY: setting layer.parent = nullLayer after setting position keeps the position as a local value
// VERIFY: KeyframeEase(0, 85) on position keys is accepted (one-element array for the spatial property)
$.evalFile(args.prelude);

var c = P.freshComp("05 stagger layout", 1080, 1920, 24, 6, [0, 0, 0]);
c.motionBlur = true;

var CX = 540, CY = 960;            // layer space offset of the group origin
var U = 1900;                      // "picture width" per art brief (1900 px, recipe shares apply)
var PH = U * 566 / 1007;           // picture height
var BW = 0.228 * U, BH = 0.167 * PH, RAD = 0.29 * BH;
var COLX = 0.165 * U;
var ROWU = (0.425 - 0.5) * PH, ROWL = (0.685 - 0.5) * PH;
var BLUE = [0.10, 0.19, 0.51]; // round 4 (round 3 [0.21,0.10,0.18] read 0.37,0.10,0.21 magenta; round 2 [0.175,0.23,0.42] read 0.19,0.48,0.80, too cyan). Tuned: Glow x3 lifts the core ~1.65x, so the rendered core reads ~0.29,0.38,0.70 (was [0.29,0.38,0.70] -> read 0.48,0.58,0.90). Recipe measured core RGB ~74,96,178 (mid navy-blue), not the brief's #2F7BFF
var GS = BW / 1206;                // glow radii scale: tutorial button was 1206 px wide
var font = args.font || "Helvetica";

function easeAll(prop, infl) {
  var i, arr = [];
  for (i = 1; i <= prop.numKeys; i++) {
    arr = [];
    var n = (prop.isSpatial || !(prop.value instanceof Array)) ? 1 : prop.value.length;
    for (var q = 0; q < n; q++) arr.push(new KeyframeEase(0, infl));
    prop.setTemporalEaseAtKey(i, arr);
  }
}
function setKeys(prop, times, vals, infl) {
  var i;
  for (i = 0; i < times.length; i++) prop.setValueAtTime(times[i], vals[i]);
  easeAll(prop, infl);
}

// The parent null: two position keys, hard ease (SUBSTITUTE: graph-editor handle dragging -> influence 85 at both keys)
var nul = c.layers.addNull();
nul.name = "scroll null";
nul.threeDLayer = false;
var np = P.tf(nul, "ADBE Position");
// ASSUMED: scroll starts 700 px below rest and ends at rest (recipe numbers are for 4K and go off screen)
setKeys(np, [0.8, 1.9], [[540, 1780], [540, 1080]], 85);

function parentTo(l) {
  // VERIFY resolved: assigning .parent converts the position to keep the layer where it was (world), so restore the local value
  var pp = P.tf(l, "ADBE Position"), keep = pp.value;
  l.parent = nul; l.motionBlur = true;
  pp.setValue(keep);
}

function popScale(l, t0, dur) {
  var s = P.tf(l, "ADBE Scale");
  setKeys(s, [t0, t0 + dur], [[0, 0, 100], [100, 100, 100]], 33);
}

// ---- buttons ----
var cols = [-COLX, COLX, -COLX, COLX];
var rows = [ROWU, ROWU, ROWL, ROWL];
var words = ["Start", "Learn", "Build", "Ship"];
var bStart = [1.0, 2.0, 2.8, 3.3];
var wStart = [2.1, 3.1, 3.9, 4.4];
var sweepSpec = [
  // name, top?, edgeIntensity, thickness
  ["TECH Light Sweep top thin", true, 25, 4],
  ["TECH Light Sweep top wide", true, 7, 20],
  ["TECH Light Sweep bottom thin", false, 30, 4],
  ["TECH Light Sweep bottom wide", false, 9, 20]
];
var i, j, sh, l, e, fx, sp;
for (i = 0; i < 4; i++) {
  sh = P.shape(c, "button " + (i + 1));
  l = sh.layer;
  var cont = P.contents(sh);
  var r = cont.addProperty("ADBE Vector Shape - Rect");
  r = P.contents(sh).property(r.propertyIndex);
  r.property("ADBE Vector Rect Size").setValue([BW, BH]);
  r.property("ADBE Vector Rect Position").setValue([CX + cols[i], CY + rows[i]]);
  r.property("ADBE Vector Rect Roundness").setValue(RAD);
  var f = P.contents(sh).addProperty("ADBE Vector Graphic - Fill");
  f = P.contents(sh).property(f.propertyIndex);
  f.property("ADBE Vector Fill Color").setValue([0.043, 0.071, 0.133, 1]); // ASSUMED: flat near-black navy instead of a gradient
  P.contents(sh).property(f.propertyIndex).property("ADBE Vector Fill Opacity").setValue(90);
  P.stroke(sh, [0.45, 0.5, 0.8, 1], 2, 2);
  // anchor and position at the button centre so scale pops from the middle
  P.tf(l, "ADBE Anchor Point").setValue([CX + cols[i], CY + rows[i]]);
  P.tf(l, "ADBE Position").setValue([cols[i], rows[i]]);
  parentTo(l);
  // four CC Light Sweeps
  for (j = 0; j < 4; j++) {
    e = P.effect(l, "CC Light Sweep");
    e.name = sweepSpec[j][0];
    e = l.property("ADBE Effect Parade").property(e.propertyIndex);
    var top = sweepSpec[j][1];
    e.property("Center").setValue([CX + cols[i], CY + rows[i] + (top ? -BH / 2 : BH / 2)]);
    e.property("Direction").setValue(top ? 90 : 270);
    e.property("Shape").setValue(2);
    e.property("Width").setValue(140);
    e.property("Sweep Intensity").setValue(0);
    e.property("Edge Intensity").setValue(sweepSpec[j][2]);
    e.property("Edge Thickness").setValue(sweepSpec[j][3]);
    e.property("Light Color").setValue([0.725, 0.659, 1]);
    e.property("Light Reception").setValue(1);
  }
  popScale(l, bStart[i], 0.5);

  // word
  var t = P.text(c, words[i], { size: 64, font: font, name: "word " + (i + 1), pos: [cols[i], rows[i]] });
  parentTo(t);
  popScale(t, wStart[i], 0.4);
}

// ---- lines ----
function addGlow3(l) {
  var rad = [50 * GS, 100 * GS, 150 * GS], inten = [0.2, 1.0, 0.2];
  var k, g;
  for (k = 0; k < 3; k++) {
    g = P.effect(l, "ADBE Glo2");
    g.name = "TECH Glow " + (k + 1);
    g = l.property("ADBE Effect Parade").property(g.propertyIndex);
    g.property("Glow Threshold").setValue(60);
    g.property("Glow Radius").setValue(rad[k]);
    g.property("Glow Intensity").setValue(inten[k]);
    g.property("Composite Original").setValue(2);
    try { g.property("Glow Colors").setValue(1); } catch (ex) {} // Original Colors: halo keeps the line hue
  }
}
// verts relative to the null origin; drawn in layer space with (CX, CY) offset.
// endKeys: [times], [values]
function addLine(name, verts, ins, outs, width, tTimes, tVals) {
  var s = P.shape(c, name);
  var cont = P.contents(s);
  var ov = [], k;
  for (k = 0; k < verts.length; k++) ov.push([verts[k][0] + CX, verts[k][1] + CY]);
  P.path(s, ov, ins, outs, false);
  var tr = P.contents(s).addProperty("ADBE Vector Filter - Trim");
  tr = P.contents(s).property(tr.propertyIndex);
  setKeys(tr.property("ADBE Vector Trim End"), tTimes, tVals, 33);
  P.stroke(s, BLUE, width, 2);
  P.tf(s.layer, "ADBE Anchor Point").setValue([CX, CY]);
  P.tf(s.layer, "ADBE Position").setValue([0, 0]);
  parentTo(s.layer);
  addGlow3(s.layer);
  return s.layer;
}
var topY = ROWU - BH / 2;
// curve drawn from the top (up and right) down to the left button's top edge, so it finishes as the button pops
// arc: starts far up (off the top), crosses at ~1.7 button heights above the button tops, drops vertically into the button top
var crossY = topY - 1.7 * BH;
var v = [[0.30 * U, -1000], [0, crossY], [-COLX, topY]];
var ins = [[0, 0], [110, -110], [0, -0.06 * PH]];
var outs = [[-90, 90], [-110, 110], [0, 0]];
var lineL = addLine("line curve left", v, ins, outs, 7, [0.4, 0.7, 0.85, 1.1], [0, 41, 41, 100]);
// mirror: a flipped copy of the first curve, Scale -100 % about the null axis (layer anchor x = group origin)
var lineR = addLine("line curve right", v, ins, outs, 7, [1.4, 1.7, 1.85, 2.1], [0, 41, 41, 100]);
P.tf(lineR, "ADBE Scale").setValue([-100, 100, 100]);

var yA = ROWU + BH / 2, yB = ROWL - BH / 2;
addLine("link left", [[-COLX, yA], [-COLX, yB]], null, null, 7, [2.1, 2.4, 2.5, 2.8], [0, 41, 41, 100]);
addLine("link right", [[COLX, yA], [COLX, yB]], null, null, 7, [2.6, 2.9, 3.0, 3.3], [0, 41, 41, 100]);

return { comp: c.name, id: c.id, layers: c.numLayers };
