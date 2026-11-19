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
P.stroke(sh, ART.hex("#0082FF").concat([1]), 9);

// Vertex order: tip, upper wedge-to-lobe corner, upper lobe right end, top-right outside, top-left outside,
// bottom-left outside, bottom-right outside, lower lobe right end, lower corner. Upper/lower mirrored about y 540.
// The wedge edges: a cubic from the tip to the lobe corner. First run used a quadratic (cusp tip, handles horizontal);
// the tongue came out too dark and thin, so the handles were fitted (fix pass 1) to half-gaps of about 5, 11, 16, 26 and 52 px
// at 33, 125, 183, 279 and 413 px past the tip (pass 2: 4, 8, 12, 23, 52, tongue went pale too early): the tip is now a true corner (hard point, recipe step 3), the edges leave it
// at a shallow angle. Handle shares of the tip-to-corner run D and the corner's half-gap G: out (0.085 D, 0.105 G), in (0.578 D, 1.158 G).
function state(tipX, cornerX, cornerG, endX, endY) {
  var D = cornerX - tipX, a = 0.0846 * D, b = 0.1046 * cornerG, cc = 0.578 * D, dd = 1.158 * cornerG, slope = dd / cc;
  var cy = 540 - cornerG;
  // fix pass 2: lobe ends rounded, bulging furthest right at endY and receding above it (recipe: ends centred about 15 % down)
  var v = [[tipX, 540], [cornerX, cy], [endX, endY], [endX - 160, -120], [-300, -300],
           [-300, 1380], [endX - 160, 1200], [endX, 1080 - endY], [cornerX, 1080 - cy]];
  var ins = [[a, b], [-cc, dd], [0, 110], [90, 40], [0, 0],
             [0, 0], [0, 0], [0, 110], [60, 60 * slope]];
  var outs = [[a, -b], [60, -60 * slope], [0, -110], [0, 0], [0, 0],
              [0, 0], [90, -40], [0, -110], [-cc, -dd]];
  return { v: v, i: ins, o: outs };
}
function fixLower(s) { return s; } // tangents above already mirror the upper lobe for the lower one
// Measured state at 3:05 (recipe layout): tip under the ball (x 931), wedge half-gap 52 px at 70 % across,
// lobe ends at 90 % (1728), centred about 15 % from the top/bottom.
var M = fixLower(state(931, 1640, 153, args.endM || 1700, 162)); // fix pass 1: lobe ends 1728 -> 1700 (pale reached too late at row 861)
// End state 4.9 s: tip at the ball's last spot (467.3 = 24 %), wedge wide enough for the title (half-gap 110 at 0.68 W).
var E = fixLower(state(467.3, 1560, 187, 1650, 162));
// Start state, extrapolated: S = (M - f E) / (1 - f) with f = TM / T1.
var f = TM / T1;
function ex(a, b) { return [(a[0] - f * b[0]) / (1 - f), (a[1] - f * b[1]) / (1 - f)]; }
var S = { v: [], i: [], o: [] }, k;
for (k = 0; k < M.v.length; k++) { S.v.push(ex(M.v[k], E.v[k])); S.i.push(ex(M.i[k], E.i[k])); S.o.push(ex(M.o[k], E.o[k])); }
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
var mr = ART.setFx(rb, { "Center": [960, 540], "Amount": 95, "Zoom": 3 });
blurL.property("ADBE Effect Parade").property(1).property("Amount").expression = "wiggle(2,10)";
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

return { comp: c.name, id: c.id, layers: c.numLayers, glowThr: thrBack, glowMiss: glowMiss.join(", "), gbMiss: mg.join(", "),
         rbMiss: mr.join(", "), noiseMiss: mn.join(", "), fontSubs: subs.join(" | "), matte: matteMode,
         start: S.v[0][0] + "," + S.v[1][0] + "," + S.v[1][1] + "," + S.v[2][0] };
