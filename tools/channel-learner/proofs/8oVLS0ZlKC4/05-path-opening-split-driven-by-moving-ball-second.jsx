// Technique 05: a dark mass split open behind a travelling ball, under recipe 02's finishing stack (values in 05 step 1).
// args: prelude, artLib, artDir (PROOF/05/art), showType (default true), fill (hex, optional), tipDx (optional).
// VERIFY (resolved on the run): Glow Threshold reads 0-255 by script (max 255); 100 % is 255.
// VERIFY: Glow "Composite Original" menu: 1 On Top, 2 Behind, 3 None.
// VERIFY: CC Radial Fast Blur "Zoom" menu: 1 Standard, 2 Brightest, 3 Darkest (recipe 02 build notes).
// VERIFY: Noise checkbox names "Noise Type" (Use Color Noise) and "Clipping" (Clip Result Values), as 7pgDb6NKEXM 09 found.
// VERIFY: font PostScript names InstrumentSerif-Italic and IBMPlexMono / IBMPlexMono-Regular (substitutes reported in fontSubs).
// SUBSTITUTE: the Pen Tool drawing and the hand-pulled path keys (steps 2, 3, 8) are Shape values set by script.
//   The 3.08 s state (recipe's measured result, comp time 3:05 at 60 fps) and the 4.9 s end state are designed;
//   the 0 s key is extrapolated from them so linear path interpolation passes exactly through the measured state.
// ASSUMED: 60 fps (recipe 01's comp; 3:05 = 3.083 s matches the recipe's ball position), 5 s, Path keys linear.
// ASSUMED: ball Ellipse Size 52 px (recipe: about 50-55 px at 100 %).
$.evalFile(args.prelude);
$.evalFile(args.artLib);
var W = 1920, H = 1080, FPS = 60, T1 = 4.9, TM = 3 + 5 / 60;
var showType = args.showType !== false;
var c = P.freshComp("8oVL 05 split", W, H, FPS, 5, [0.878, 0.969, 0.965]);
var subs = [];
// Remove this script's orphan solids left by earlier runs (unused solids with our names only).
(function () {
  var mine = { "BG": 1, "Glow": 1, "Blur": 1, "Noise": 1 }, i, it;
  for (i = app.project.numItems; i >= 1; i--) {
    it = app.project.item(i);
    if (it instanceof FootageItem && it.mainSource instanceof SolidSource && mine[it.name] && it.usedIn.length === 0) it.remove();
  }
})();

function txt(str, fonts, size, tracking, color, just, x, base, name, opacity) {
  var l = c.layers.addText(str);
  var prop = l.property("ADBE Text Properties").property("ADBE Text Document");
  var d = prop.value, i, back, fo = null, ok = false;
  d.resetCharStyle();
  d.fontSize = size; d.fillColor = color; d.applyFill = true; d.applyStroke = false;
  d.tracking = tracking; d.justification = just;
  for (i = 0; i < fonts.length && !ok; i++) {
    d.font = fonts[i];
    prop.setValue(d);
    back = prop.value;
    try { fo = back.fontObject; } catch (e) { fo = null; }
    ok = (back.font === fonts[i]) && !(fo && fo.isSubstitute);
  }
  if (!ok) subs.push(name + ": asked " + fonts.join("/") + ", got " + back.font);
  P.tf(l, "ADBE Anchor Point").setValue([0, 0]);
  P.tf(l, "ADBE Position").setValue([x, base]);
  if (opacity !== undefined) P.tf(l, "ADBE Opacity").setValue(opacity);
  l.name = name;
  return l;
}
function shapeVal(v, ins, outs) {
  var s = new Shape();
  s.vertices = v; s.inTangents = ins; s.outTangents = outs; s.closed = true;
  return s;
}

// Background solid, recipe's measured pale ground (brief: keep exact).
var bg = P.solid(c, "BG", ART.hex("#E0F7F6"));

// Title (brief): under the split shape, revealed by the opening.
var title = null;
if (showType) {
  title = txt("First Light", ["InstrumentSerif-Italic"], 108, 0, ART.hex("#071931"), ParagraphJustification.RIGHT_JUSTIFY, 0.885 * W, 0.528 * H, "Title");
}

// Split shape (Shape Layer 1). Path coordinates are comp pixels (layer at 0,0).
var sh = P.shape(c, "Shape Layer 1 (split)");
P.tf(sh.layer, "ADBE Position").setValue([0, 0]);
var pathProp = P.path(sh, [[0, 0], [10, 0], [0, 10]], null, null, true);
var fillHex = args.fill || "#04101F";
var fl = P.contents(sh).addProperty("ADBE Vector Graphic - Fill");
P.contents(sh).property(fl.propertyIndex).property("ADBE Vector Fill Color").setValue(ART.hex(fillHex).concat([1]));
// SUBSTITUTE (run second): the rim's lift is not made by the Glow at Threshold 100 %; the recipe names a stroke of about #00A8F0.
P.stroke(sh, ART.hex(args.stroke || "#0096FF").concat([1]), 9); // #0096FF: more blue than the named #00A8F0 (the rim reads short of the blue targets with either)

// Run second: the path is drawn to the corrected recipe's measured opening profile and lobe ends (layout).
// The 3:05 state M is a contour: tip under the ball, the wedge's half-gap at each column (path px, measured pale half-height
// plus the stroke's half width plus a correction found by rendering), the upper lobe's finger and the flatter lower lobe,
// and two fixed corners far off frame. Tangents are Catmull-Rom (smooth) except at the tip (hard point, step 3) and corners.
// End state E (4.9 s): x stretched from the tip (467.3) by s; the wedge (columns up to 80 %, tapering to none at 88 %) opened
// by v; lobe and off-frame y unchanged. Start S extrapolated so the linear path passes through M at 3:05.
var TIPX = 931, CW = W / 100, CH = H / 100;
// wedge columns, % across; path half-gap, px; centre, % down
var COLS = args.cols || [51.5, 53, 55, 58, 60, 62.5, 65, 67.5, 70, 72.5, 75, 77.5, 80, 82.5, 85, 88];
var HALF = args.half || [2, 3, 5, 10, 22.9, 31, 39, 49.3, 59.6, 74.7, 89.8, 111.7, 133.6, 166.5, 198.9, 263.7];
function cen(x) { var q = (x - 48.5) / 39.5; return 50 + 2.05 * q * q; }
// lobe ends (pale-start, % across, % down), shifted 4.5 px into the dark for the stroke
var UPL = args.upl || [[89.7, 25], [91.7, 20], [92.8, 15], [92.8, 10], [91.8, 5], [90.8, 2]];
var LOL = args.lol || [[88.9, 80], [89.7, 85], [90.2, 90], [90.5, 95], [90.5, 99]];
var LSH = args.lobeShift !== undefined ? args.lobeShift : 22; // pass 2: 4.5 -> 22 px, the finish pushed the measured ends about 1 % right
function contour() {
  var pts = [], kind = [], i; // kind: 0 tip/corner, 1 smooth wedge, 2 smooth lobe, 3 fixed
  pts.push([TIPX, 540]); kind.push(0);
  for (i = 0; i < COLS.length; i++) { pts.push([COLS[i] * CW, cen(COLS[i]) * CH - HALF[i]]); kind.push(1); }
  for (i = 0; i < UPL.length; i++) { pts.push([UPL[i][0] * CW - LSH, UPL[i][1] * CH]); kind.push(2); }
  pts.push([89.5 * CW, -60]); kind.push(2);
  pts.push([-400, -400]); kind.push(3);
  pts.push([-400, 1480]); kind.push(3);
  pts.push([90.5 * CW - LSH, 1140]); kind.push(2);
  for (i = LOL.length - 1; i >= 0; i--) { pts.push([LOL[i][0] * CW - LSH, LOL[i][1] * CH]); kind.push(2); }
  for (i = COLS.length - 1; i >= 0; i--) { pts.push([COLS[i] * CW, cen(COLS[i]) * CH + HALF[i]]); kind.push(1); }
  return { p: pts, k: kind };
}
function tangents(pts, kind) {
  var n = pts.length, ins = [], outs = [], i, a, b, t;
  for (i = 0; i < n; i++) {
    a = pts[(i - 1 + n) % n]; b = pts[(i + 1) % n];
    if (kind[i] === 3) { ins.push([0, 0]); outs.push([0, 0]); continue; }
    if (kind[i] === 0) { // hard tip: each handle a third of the way towards its neighbour, independent
      ins.push([(a[0] - pts[i][0]) / 3, (a[1] - pts[i][1]) / 3]); outs.push([(b[0] - pts[i][0]) / 3, (b[1] - pts[i][1]) / 3]); continue; }
    if (kind[(i - 1 + n) % n] === 3) a = [pts[i][0] - (b[0] - pts[i][0]), pts[i][1] - (b[1] - pts[i][1])];
    if (kind[(i + 1) % n] === 3) b = [pts[i][0] - (a[0] - pts[i][0]), pts[i][1] - (a[1] - pts[i][1])];
    t = [(b[0] - a[0]) / 6, (b[1] - a[1]) / 6];
    ins.push([-t[0], -t[1]]); outs.push(t);
  }
  return { i: ins, o: outs };
}
var C = contour();
// Stretch chosen so the lobes' furthest point stays put at all three keys (x_E = x_M there): in the tutorial's playback the pale
// ground at 94-97 % across never darkens, so the lobes must not sweep across it at the start (first run: they reached 99.9 % at 0 s).
var LMAX = 92.8 * CW - LSH;
var SX = args.stretch || (LMAX - 467.3) / (LMAX - TIPX), VY = args.open || 1.5;
var Mv = C.p, Ev = [], k, w, xx;
for (k = 0; k < Mv.length; k++) {
  if (C.k[k] === 3) { Ev.push([Mv[k][0], Mv[k][1]]); continue; }
  xx = Mv[k][0] / CW;
  // smooth taper of the end-state opening from full at 70 % to none at 92 % (a linear taper 80-88 % left a kink in the lobes)
  w = C.k[k] === 2 ? 0 : (xx <= 70 ? 1 : (xx >= 92 ? 0 : 0.5 + 0.5 * Math.cos(Math.PI * (xx - 70) / 22)));
  Ev.push([467.3 + (Mv[k][0] - TIPX) * SX, 540 + (Mv[k][1] - 540) * (1 + (VY - 1) * w)]);
}
var f = TM / T1;
function ex(a, b) { return [(a[0] - f * b[0]) / (1 - f), (a[1] - f * b[1]) / (1 - f)]; }
var Sv = [];
for (k = 0; k < Mv.length; k++) Sv.push(C.k[k] === 3 ? [Mv[k][0], Mv[k][1]] : ex(Mv[k], Ev[k]));
var MT = tangents(Mv, C.k), ET = tangents(Ev, C.k), ST = tangents(Sv, C.k);
var M = { v: Mv, i: MT.i, o: MT.o }, E = { v: Ev, i: ET.i, o: ET.o }, S = { v: Sv, i: ST.i, o: ST.o };
var pth = P.contents(sh).property(1).property("ADBE Vector Shape"); // the Path is the group's first item
pth.setValueAtTime(0, shapeVal(S.v, S.i, S.o));
pth.setValueAtTime(T1, shapeVal(E.v, E.i, E.o));
pth.setInterpolationTypeAtKey(1, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
pth.setInterpolationTypeAtKey(2, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
// Step 9: Gaussian Blur on the split shape, 30, Vertical, Repeat Edge Pixels off.
var gb = P.effect(sh.layer, "ADBE Gaussian Blur 2");
var mg = ART.setFx(gb, { "Blurriness": 30, "Blur Dimensions": 3, "Repeat Edge Pixels": 0 });

// Finishing stack (recipe 02 values, 05 step 1): Glow, Blur, Noise adjustment layers bottom to top.
function adj(name) { var l = P.solid(c, name, [1, 1, 1]); l.adjustmentLayer = true; return l; }
var glowL = adj("Glow");
var gIdx, gl, glowMiss = [], g;
for (gIdx = 0; gIdx < 2; gIdx++) {
  gl = P.effect(glowL, "ADBE Glo2");
  glowMiss = glowMiss.concat(ART.setFx(gl, { "Glow Threshold": args.glowThr !== undefined ? args.glowThr : 255, "Glow Radius": 331, "Glow Intensity": 0.3, "Composite Original": 2 }));
  g = glowL.property("ADBE Effect Parade").property(gl.propertyIndex);
  for (k = 1; k <= g.numProperties; k++) if (g.property(k).name === "Glow Radius") g.property(k).expression = "wiggle(2,100)";
}
var thrBack = glowL.property("ADBE Effect Parade").property(1).property("Glow Threshold").value;
var blurL = adj("Blur");
var rb = P.effect(blurL, "CC Radial Fast Blur");
// Run second: Amount 95 (recipe 02) is doubtful here (recipe 05 step 1). Read back: the slider stops at 100, and 95 + wiggle(2,10) sits at 100
// around 0.75, 2.25-2.5 and 4.0 s, the dark dips. With the Blur layer off the pale band is clean (right 3 % 243-244) and the dips are gone.
// 50 left the lobe-end ramp at 1 % of the width; 80 (wiggle kept, 72-87) gives about 2.2-3.2 % and keeps the right 3 % at 216+ in every sample.
var RBA = args.rbAmount !== undefined ? args.rbAmount : 80, RBW = args.rbWiggle !== undefined ? args.rbWiggle : 10;
var mr = ART.setFx(rb, { "Center": [960, 540], "Amount": RBA, "Zoom": 3 });
var rbAmt = blurL.property("ADBE Effect Parade").property(1).property("Amount");
if (RBW > 0) rbAmt.expression = "wiggle(2," + RBW + ")";
var amtRead = [], tt;
for (tt = 0; tt <= 5; tt += 0.25) amtRead.push(Math.round(rbAmt.valueAtTime(tt, false) * 10) / 10);
var amtMax = rbAmt.hasMax ? rbAmt.maxValue : null;
if (args.blurOff) blurL.enabled = false;
var noiseL = adj("Noise");
var nz = P.effect(noiseL, "ADBE Noise");
var mn = ART.setFx(nz, { "Amount of Noise": 9, "Noise Type": 0, "Clipping": 1 });

// Ball (Shape Layer 2), on top of the stack, crisp.
var ball = P.shape(c, "Shape Layer 2 (ball)");
P.ellipse(ball, [args.ballSize || 52, args.ballSize || 52]);
var bf = P.contents(ball).addProperty("ADBE Vector Graphic - Fill");
P.contents(ball).property(bf.propertyIndex).property("ADBE Vector Fill Color").setValue([1, 1, 1, 1]);
var bp = P.tf(ball.layer, "ADBE Position");
bp.setValueAtTime(0, [1717.3, 538.3]); bp.setValueAtTime(T1, [467.3, 538.3]);
var bs = P.tf(ball.layer, "ADBE Scale");
bs.setValueAtTime(0, [169, 169]); bs.setValueAtTime(T1, [100, 100]);
for (k = 1; k <= 2; k++) {
  bp.setInterpolationTypeAtKey(k, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
  bs.setInterpolationTypeAtKey(k, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
}

// Corner type and icon (brief), above everything.
if (showType) {
  var icon = c.layers.add(ART.footage(args.artDir, "horizon-icon.png", "art 8oVL 05"));
  icon.name = "Horizon Icon";
  P.tf(icon, "ADBE Position").setValue([0.05 * W + 80.5, 0.07 * H + 27]);
  P.tf(icon, "ADBE Opacity").setValue(80);
  var pale = ART.hex("#DDF4F5");
  txt("NO. 05  —  FIRST CROSSING", ["IBMPlexMono", "IBMPlexMono-Regular"], 18, 200, pale, ParagraphJustification.LEFT_JUSTIFY, 0.05 * W + 161 + 22, 0.103 * H, "Label", 80);
  txt("THE HOURS BEFORE DAWN", ["IBMPlexMono", "IBMPlexMono-Regular"], 18, 200, pale, ParagraphJustification.LEFT_JUSTIFY, 0.05 * W, 0.93 * H, "Bottom line", 80);
}
// Order check: layers were added bottom-up except where AE puts new layers on top; enforce the brief's order.
// top to bottom: Bottom line, Label, Horizon Icon, ball, Noise, Blur, Glow, split, Title, BG.
bg.moveToEnd();
sh.layer.moveBefore(bg);
glowL.moveBefore(sh.layer);
blurL.moveBefore(glowL);
noiseL.moveBefore(blurL);
ball.layer.moveBefore(noiseL);
// Fix pass 3 (brief's fallback): under the stack the radial blur (Darkest) smeared the italic into streaks. The Title now sits
// just under the ball, above Noise, revealed through an Alpha Inverted track matte from an effect-free copy of the split shape.
var matteMode = "none";
if (title) {
  var mt = sh.layer.duplicate();
  mt.name = "Split matte (title)";
  var fxp = mt.property("ADBE Effect Parade");
  while (fxp.numProperties > 0) fxp.property(1).remove();
  title.moveBefore(noiseL);
  mt.moveBefore(title);
  if (title.setTrackMatte) { title.setTrackMatte(mt, TrackMatteType.ALPHA_INVERTED); matteMode = "setTrackMatte"; }
  else { title.trackMatteType = TrackMatteType.ALPHA_INVERTED; matteMode = "legacy"; }
  mt.enabled = false;
}

return { comp: c.name, verts: Mv.length, startLobe: Math.round(Sv[COLS.length + 3][0]), id: c.id, layers: c.numLayers, glowThr: thrBack, glowMiss: glowMiss.join(", "), gbMiss: mg.join(", "),
         rbMiss: mr.join(", "), noiseMiss: mn.join(", "), fontSubs: subs.join(" | "), matte: matteMode,
         rbAmountEvery250ms: amtRead.join(" "), rbMax: amtMax };
