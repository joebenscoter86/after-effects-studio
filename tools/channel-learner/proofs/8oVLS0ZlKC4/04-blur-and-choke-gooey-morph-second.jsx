// 8oVLS0ZlKC4 04: liquid merge of outlined circles. Pre-comp "8oVL 04 shapes": six navy circles (#020B17 fill, 9 px #0080FF stroke,
// stroke composite Below Previous in Same Group) under an adjustment layer with Gaussian Blur 100 (Horizontal and Vertical, Repeat Edge
// Pixels on) then Simple Choker (Final Output, Choke Matte 14.2). Parent "8oVL 04 confluence": pale #E1FBF9 solid, the pre-comp with
// Gaussian Blur 57.9 Vertical (Repeat Edge off) at Scale 109 %, a Glow layer (two Glows) and a Noise layer, then the "Confluence" art.
// args: prelude, artLib, artDir (PROOF/04/art), showType, before (pre-comp adjustment layer and its blur, and the finish, off).
// VERIFY: stroke composite property "ADBE Vector Composite Order" (1 Above, 2 Below); Simple Choker names "View" (1 Final Output) and
//   "Choke Matte"; read back.
// ASSUMED: 30 fps (not shown), 4 s (the preview loops at about 4.1 s comp time). Run second: circle sizes, positions and keys from the
//   recipe's fitted "Circles" sentence (the first run designed them; that text follows for the record):
//   designed from the recipe's layout (result frame at 0.5-0.65 s) and measured motion (comp seconds), all linear.
// Ground: #E4F4FF (corrected recipe; the first run's #E1FBF9 was the after-Glow colour).
// ASSUMED: the Glow radius expression is wiggle(2,100) on 331 (recipe 02; 04 shows only "an expression", 367.2 at one moment).
// ASSUMED: the stroke fade (9 -> 0 at 3.1-4.0 s) is on the top-left circle, the one that fuses at about 2.65 s.
$.evalFile(args.prelude);
$.evalFile(args.artLib);
var W = 1920, H = 1080, FPS = 30, DUR = 4, subs = [], miss = [], i, it;
for (i = app.project.numItems; i >= 1; i--) { it = app.project.item(i); if (it instanceof CompItem && it.name === "8oVL 04 confluence") it.remove(); }
for (i = app.project.numItems; i >= 1; i--) { it = app.project.item(i); if (it instanceof CompItem && it.name === "8oVL 04 shapes") it.remove(); }
for (i = app.project.numItems; i >= 1; i--) {
  it = app.project.item(i);
  if (it instanceof FootageItem && it.mainSource instanceof SolidSource && it.usedIn.length === 0 &&
      { "TECH Blur and choke": 1, "BG pale": 1, "TECH Glow": 1, "TECH Noise": 1 }[it.name]) it.remove();
}
function txt(c, str, fonts, size, tracking, color, x, base, name, opacity) {
  var l = c.layers.addText(str);
  var prop = l.property("ADBE Text Properties").property("ADBE Text Document");
  var d = prop.value, k, back, fo = null, ok = false;
  d.resetCharStyle();
  d.fontSize = size; d.fillColor = color; d.applyFill = true; d.applyStroke = false;
  d.tracking = tracking; d.justification = ParagraphJustification.LEFT_JUSTIFY;
  for (k = 0; k < fonts.length && !ok; k++) {
    d.font = fonts[k]; prop.setValue(d); back = prop.value;
    try { fo = back.fontObject; } catch (e) { fo = null; }
    ok = (back.font === fonts[k]) && !(fo && fo.isSubstitute);
  }
  if (!ok) subs.push(name + ": asked " + fonts.join("/") + ", got " + back.font);
  P.tf(l, "ADBE Anchor Point").setValue([0, 0]);
  P.tf(l, "ADBE Position").setValue([x, base]);
  if (opacity !== undefined) P.tf(l, "ADBE Opacity").setValue(opacity);
  l.name = name;
  return l;
}

// --- Pre-comp: the shapes and the blur/choke adjustment layer (steps 1-5) ---
var pc = app.project.items.addComp("8oVL 04 shapes", W, H, 1, DUR, FPS);
// Run second: the six circles from the corrected recipe's "Circles" sentence (fitted on the playback in the parent's coordinates;
// converted here into the pre-comp, which the parent shows at Scale 109 % about the centre: v_pre = centre + (v - centre) / 1.09).
// Layer order: the large circles on top, so a medium circle inside one is hidden with its stroke (recipe: "never wholly inside one
// while their stroke shows"). name, diameter (parent px), keys [[t, x, y], ...] in the parent's coordinates, linear.
var CP = [
  // (5) medium 490 px on the left, hidden inside circle 2 until it rises along the left edge at about 190 px a second
  ["Medium left (rising)", 490, [[0, 244, 1007], [3, 253, 428], [4, 256, 235]]],
  // (4) medium 485 px at the bottom right, left and slightly up at about 92 and 34 px a second
  ["Medium bottom right", 485, [[0, 1731, 1106], [1, 1640, 1071], [2, 1549, 1039], [3, 1459, 1004], [4, 1365, 968]]],
  // (3) medium 485 px along the top, right at about 226 px a second, fusing into circle 1 at about 2.65 s
  ["Medium top", 485, [[0, 94, 91], [4, 998, 131]]],
  // (6) small, 180-230 px (205), from (803, 648) into circle 1's left edge by about 0.65 s, then held
  ["Small circle", 205, [[0, 803, 648], [0.65, 1190, 610]]],
  // (2) large 1520 px, bottom left, still
  ["Large bottom left", 1520, [[0, 220, 1060]]],
  // (1) large 1520 px, top right, still (drifts about 14 px right over 4 s)
  ["Large top right", 1520, [[0, 1735, 30], [4, 1749, 30]]]
];
function toPre(v) { return [960 + (v[0] - 960) / 1.09, 540 + (v[1] - 540) / 1.09]; }
var CIRCLES = [], ci, kk, keys;
for (ci = 0; ci < CP.length; ci++) {
  keys = [];
  for (kk = 0; kk < CP[ci][2].length; kk++) { var pp = toPre([CP[ci][2][kk][1], CP[ci][2][kk][2]]); keys.push([CP[ci][2][kk][0], pp[0], pp[1]]); }
  CIRCLES.push([CP[ci][0], CP[ci][1] / 1.09, keys]);
}
var shapes = [], c, sh, k, pos, fl, si, compo;
for (c = 0; c < CIRCLES.length; c++) {
  sh = P.shape(pc, CIRCLES[c][0]);
  P.ellipse(sh, [CIRCLES[c][1], CIRCLES[c][1]]);
  fl = P.contents(sh).addProperty("ADBE Vector Graphic - Fill");
  P.contents(sh).property(fl.propertyIndex).property("ADBE Vector Fill Color").setValue([2 / 255, 11 / 255, 23 / 255, 1]);
  si = P.stroke(sh, [0, 128 / 255, 1, 1], 9);
  compo = P.contents(sh).property(si).property("ADBE Vector Composite Order");
  compo.setValue(2);
  pos = P.tf(sh.layer, "ADBE Position");
  if (CIRCLES[c][2].length === 1) pos.setValue([CIRCLES[c][2][0][1], CIRCLES[c][2][0][2]]);
  else {
    for (k = 0; k < CIRCLES[c][2].length; k++) pos.setValueAtTime(CIRCLES[c][2][k][0], [CIRCLES[c][2][k][1], CIRCLES[c][2][k][2]]);
    for (k = 1; k <= pos.numKeys; k++) pos.setInterpolationTypeAtKey(k, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
  }
  shapes.push(sh);
}
var compoRead = P.contents(shapes[0]).property(3).property("ADBE Vector Composite Order").value;
// Step 5: stroke fade on the top-left circle, 9 -> 0 at 3.1-4.0 s
var sw = P.contents(shapes[2]).property(3).property("ADBE Vector Stroke Width"); // the medium top circle, which fuses at about 2.65 s
sw.setValueAtTime(3.1, 9); sw.setValueAtTime(4.0, 0);
// Steps 2-3: the adjustment layer above all shapes
var bc = pc.layers.addSolid([1, 1, 1], "TECH Blur and choke", W, H, 1, DUR);
bc.adjustmentLayer = true;
var gb = P.effect(bc, "ADBE Gaussian Blur 2");
miss = miss.concat(ART.setFx(gb, { "Blurriness": 100, "Blur Dimensions": 1, "Repeat Edge Pixels": 1 }));
var ch = P.effect(bc, "ADBE Simple Choker");
miss = miss.concat(ART.setFx(ch, { "View": 1, "Choke Matte": 14.2 }));
bc.moveToBeginning();
if (args.before) bc.enabled = false;

// --- Parent comp (steps 6-9) ---
var pa = P.freshComp("8oVL 04 confluence", W, H, FPS, DUR, [0.894, 0.957, 1]);
// Run second (corrected recipe): ground #E4F4FF (blue at 255, so the Glow at Threshold 100 % acts); #E1FBF9 is the after-Glow colour.
var bg = P.solid(pa, "BG pale", ART.hex(args.ground || "#E4F4FF"));
var pl = pa.layers.add(pc);
pl.name = "8oVL 04 shapes (pre-comp)";
P.tf(pl, "ADBE Scale").setValue([109, 109]);
var pb = P.effect(pl, "ADBE Gaussian Blur 2");
pb.name = "TECH Gaussian Blur";
miss = miss.concat(ART.setFx(pl.property("ADBE Effect Parade").property(1), { "Blurriness": 57.9, "Blur Dimensions": 3, "Repeat Edge Pixels": 0 }));
var glowL = pa.layers.addSolid([1, 1, 1], "TECH Glow", W, H, 1, DUR); glowL.adjustmentLayer = true;
var gi, ge, g, q;
for (gi = 0; gi < 2; gi++) {
  ge = P.effect(glowL, "ADBE Glo2");
  miss = miss.concat(ART.setFx(ge, { "Glow Threshold": 255, "Glow Radius": 331, "Glow Intensity": 0.3, "Composite Original": 2 }));
  g = glowL.property("ADBE Effect Parade").property(ge.propertyIndex);
  for (q = 1; q <= g.numProperties; q++) if (g.property(q).name === "Glow Radius") g.property(q).expression = "wiggle(2,100)";
}
var noiseL = pa.layers.addSolid([1, 1, 1], "TECH Noise", W, H, 1, DUR); noiseL.adjustmentLayer = true;
var nz = P.effect(noiseL, "ADBE Noise");
miss = miss.concat(ART.setFx(nz, { "Amount of Noise": 9, "Noise Type": 0, "Clipping": 1 }));
bg.moveToEnd(); pl.moveBefore(bg); glowL.moveBefore(pl); noiseL.moveBefore(glowL);
if (args.before) { pl.property("ADBE Effect Parade").property(1).enabled = false; glowL.enabled = false; noiseL.enabled = false; }
// Art (brief): static, on top of everything.
if (args.showType !== false) {
  var ink = ART.hex("#E1FBF9");
  var icon = pa.layers.add(ART.footage(args.artDir, "confluence-icon.png", "art 8oVL 04"));
  icon.name = "Confluence Icon";
  P.tf(icon, "ADBE Position").setValue([0.05 * W + 38.5, 0.43 * H + 29]);
  P.tf(icon, "ADBE Opacity").setValue(85);
  txt(pa, "Confluence", ["InstrumentSerif-Regular"], 92, 0, ink, 0.05 * W, 0.575 * H, "Title", 95);
  txt(pa, "A STUDY OF MOVING WATER", ["IBMPlexMono", "IBMPlexMono-Regular"], 18, 200, ink, 0.05 * W, 0.63 * H, "Small print", 70);
}
var order = []; for (k = 1; k <= pa.numLayers; k++) order.push(pa.layer(k).name);
return { comp: pa.name, precomp: pc.name, compositeOrder: compoRead, miss: miss.join(", "), fontSubs: subs.join(" | "), order: order.join(" > ") };
