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
  // Run third (lesson 22: the art bends, not the technique): the end state keeps the recipe's narrow trumpet, so the title is
  // set at the brief's smallest size, 0.085 H (92 px), and moved right to end at 0.93 W, where the opening is widest.
  title = txt("First Light", ["InstrumentSerif-Italic"], args.titleSize || 92, 0, ART.hex("#071931"), ParagraphJustification.RIGHT_JUSTIFY, (args.titleRight || 0.93) * W, (args.titleBase || 0.528) * H, "Title");
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

// Run third: three designed states, each a contour with the same vertex structure, keyed linearly at 0 s, 3:05 and 4.9 s.
// SUBSTITUTE: the tutorial shows Path keys only at 0 s and about 4.9 s. Its measured 3:05 state (lobes about 92.8 % across) and its
// end-state frame f017899 (lobes about 97 %, narrow trumpet) cannot both sit on one straight line from a start whose lobes are
// pushed to the right, so a middle key at 3:05 holds the measured state. The tip moves at the same speed on both legs
// (1718 -> 931 -> 467.3 px, 255 px a second), so it stays under the linearly moving ball.
// Vertices: tip (hard point, step 3); 16 wedge columns, upper edge; upper lobe (4 points) and one point off the top;
// two fixed corners far off frame; one point off the bottom and the lower lobe (3 points); the wedge's lower edge back to the tip.
// Lobe points are written where the path goes (about 1.15 % left of the measured pale start: the finish pushes the edge right).
// Run third smoothing: fewer, evenly spaced lobe points (the second run's 6 + 5 points, offset from the wedge, dented the outline).
var CW = W / 100, CH = H / 100;
var COLS = [51.5, 53, 55, 58, 60, 62.5, 65, 67.5, 70, 72.5, 75, 77.5, 80, 82.5, 85, 88];
function cen(x) { var q = (x - 48.5) / 39.5; return 50 + 2.05 * q * q; }
// 3:05 (measured): half-gaps in path px. Run third: the four nearest the ball widened (2, 3, 5, 10 -> 3.5, 5.5, 8, 12.5) to brighten the tongue.
var M_HALF = args.half || [3.5, 5.5, 8, 12.5, 22.9, 31, 39, 49.3, 59.6, 74.7, 89.8, 111.7, 133.6, 166.5, 198.9, 263.7];
var M_ST = { tip: 931, cols: COLS, half: M_HALF,
  upl: [[90.0, 22], [91.4, 15], [91.6, 8], [90.3, 1.5]], top: [88.8, -6], // convex run (no inflection): the 25 % point dented the edge
  lol: [[88.5, 82], [89.0, 89], [89.3, 97]], bot: [89.4, 106] };
// 4:90 end state, from the corrected recipe (f017899): tip at 467.3, opening 11.5 % of the height at 70 % across and 19 % at 80 %
// (pale height h = 11.5 (dx / 45.7) ^ 2.53, dx in % from the tip at 24.3 %), lobes reaching about 97 % on the 15-30 % rows.
// The lower lobe is not measured there; it mirrors the upper (ASSUMED).
function eHalf(x) { var dx = x - 24.34; if (dx <= 0) return 1; return Math.max(1.5, 11.5 * Math.pow(dx / 45.7, 2.53) * CH / 2 + 4.5); }
var E_COLS = [], E_HALF = [], i;
for (i = 0; i < COLS.length; i++) { E_COLS.push(24.34 + (COLS[i] - 48.49) * (88 - 24.34) / (88 - 48.49)); E_HALF.push(eHalf(E_COLS[i])); }
var E_ST = { tip: 467.3, cols: E_COLS, half: E_HALF,
  upl: [[95.8, 31], [96.9, 23], [97.1, 14], [96.2, 4]], top: [95.2, -6],
  lol: [[96.9, 77], [97.1, 86], [96.8, 97]], bot: [96.4, 106] };
// 0 s start: tip under the ball (1718), the wedge squeezed between the tip and about 93 % with small gaps, lobes about 95.5 %:
// a thin pale strip at the right edge (step 8).
var S_COLS = [], S_HALF = [];
for (i = 0; i < COLS.length; i++) { S_COLS.push(1718 / CW + (COLS[i] - 48.49) * (93.2 - 1718 / CW) / (88 - 48.49)); S_HALF.push(Math.max(1, M_HALF[i] * 0.12)); }
var S_ST = { tip: 1718, cols: S_COLS, half: S_HALF,
  upl: [[93.9, 25], [94.3, 18.5], [94.5, 11], [94.5, 3.5]], top: [94.4, -6],
  lol: [[94.2, 82], [94.4, 89], [94.5, 97]], bot: [94.5, 106] }; // near-straight edge (a copy of M's finger here crinkled 0-1 s)
function contour(st) {
  var pts = [], kind = [], j;
  pts.push([st.tip, 540]); kind.push(0);
  for (j = 0; j < st.cols.length; j++) { pts.push([st.cols[j] * CW, cen(st.cols[j]) * CH - st.half[j]]); kind.push(1); }
  for (j = 0; j < st.upl.length; j++) { pts.push([st.upl[j][0] * CW, st.upl[j][1] * CH]); kind.push(2); }
  pts.push([st.top[0] * CW, st.top[1] * CH]); kind.push(2);
  pts.push([-400, -400]); kind.push(3);
  pts.push([-400, 1480]); kind.push(3);
  pts.push([st.bot[0] * CW, st.bot[1] * CH]); kind.push(2);
  for (j = st.lol.length - 1; j >= 0; j--) { pts.push([st.lol[j][0] * CW, st.lol[j][1] * CH]); kind.push(2); }
  for (j = st.cols.length - 1; j >= 0; j--) { pts.push([st.cols[j] * CW, cen(st.cols[j]) * CH + st.half[j]]); kind.push(1); }
  return { p: pts, k: kind };
}
function tangents(pts, kind) {
  var n = pts.length, ins = [], outs = [], j, a, b, t;
  for (j = 0; j < n; j++) {
    a = pts[(j - 1 + n) % n]; b = pts[(j + 1) % n];
    if (kind[j] === 3) { ins.push([0, 0]); outs.push([0, 0]); continue; }
    if (kind[j] === 0) { ins.push([(a[0] - pts[j][0]) / 3, (a[1] - pts[j][1]) / 3]); outs.push([(b[0] - pts[j][0]) / 3, (b[1] - pts[j][1]) / 3]); continue; }
    if (kind[(j - 1 + n) % n] === 3) a = [pts[j][0] - (b[0] - pts[j][0]), pts[j][1] - (b[1] - pts[j][1])];
    if (kind[(j + 1) % n] === 3) b = [pts[j][0] - (a[0] - pts[j][0]), pts[j][1] - (a[1] - pts[j][1])];
    t = [(b[0] - a[0]) / 6, (b[1] - a[1]) / 6];
    ins.push([-t[0], -t[1]]); outs.push(t);
  }
  return { i: ins, o: outs };
}
function stateShape(st) { var cc = contour(st), tg = tangents(cc.p, cc.k); return { v: cc.p, i: tg.i, o: tg.o }; }
var S = stateShape(S_ST), M = stateShape(M_ST), E = stateShape(E_ST), Mv = M.v, Sv = S.v;
var pth = P.contents(sh).property(1).property("ADBE Vector Shape"); // the Path is the group's first item
pth.setValueAtTime(0, shapeVal(S.v, S.i, S.o));
pth.setValueAtTime(TM, shapeVal(M.v, M.i, M.o));
pth.setValueAtTime(T1, shapeVal(E.v, E.i, E.o));
for (i = 1; i <= 3; i++) pth.setInterpolationTypeAtKey(i, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
var COLS_N = COLS.length, k;
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
  // Run third: the matte's stroke widened to 40 px so the title is revealed only well inside the visible (blurred) opening;
  // with the 9 px stroke, letters showed over parts of the lobes that still read dark (second review, 1.0 s and 2.2 s).
  mt.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property(3).property("ADBE Vector Stroke Width").setValue(args.matteStroke || 40);
  title.moveBefore(noiseL);
  mt.moveBefore(title);
  if (title.setTrackMatte) { title.setTrackMatte(mt, TrackMatteType.ALPHA_INVERTED); matteMode = "setTrackMatte"; }
  else { title.trackMatteType = TrackMatteType.ALPHA_INVERTED; matteMode = "legacy"; }
  mt.enabled = false;
}

return { comp: c.name, verts: Mv.length, startLobe: Math.round(Sv[COLS_N + 3][0]), id: c.id, layers: c.numLayers, glowThr: thrBack, glowMiss: glowMiss.join(", "), gbMiss: mg.join(", "),
         rbMiss: mr.join(", "), noiseMiss: mn.join(", "), fontSubs: subs.join(" | "), matte: matteMode,
         rbAmountEvery250ms: amtRead.join(" "), rbMax: amtMax };
