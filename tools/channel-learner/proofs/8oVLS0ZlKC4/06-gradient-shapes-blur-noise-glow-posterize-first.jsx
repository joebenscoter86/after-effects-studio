// Technique 06: a crude gradient disc pair turned into a grainy glowing orb (blur, Noise, huge Glow, Posterize, radial blur).
// args: prelude, artLib, artDir (PROOF/06/art), showType (default true), before (true: every TECH layer and effect off).
// VERIFY: a new shape Gradient Fill runs white at Start Point to black at End Point (recipe step 1 relies on it; check the render).
// VERIFY: Glow Threshold reads 0-255 by script (found on 05's run): 60 % is 153.
// VERIFY: CC Radial Fast Blur Zoom menu 1 Standard, 2 Brightest, 3 Darkest.
// VERIFY: Noise checkbox names "Noise Type" (Use Color Noise) and "Clipping" (Clip Result Values).
// VERIFY: Posterize's control is named "Level".
// SUBSTITUTE: none for the gradient: the default white-to-black stops are what the result needs (recipe step 1).
// ASSUMED: 24 fps, 4 s still; outer circle 885 px (46 % W, measured), centre (960, 594) (50 %, 55 %); copy Scale 71 %;
//   the copy carries the same Gaussian Blur (79.3, Horizontal and Vertical, Repeat Edge Pixels off); Blur Dimensions 1.
// ASSUMED: gradient Start/End at the disc's top and bottom edges (the off-screen change at the jump cut, recipe step 1).
// The white Fill on the background (step 7) is switched off and deleted in the tutorial; not built.
$.evalFile(args.prelude);
$.evalFile(args.artLib);
var W = 1920, H = 1080;
var showType = args.showType !== false, before = args.before === true;
var c = P.freshComp("8oVL 06 orb", W, H, 24, 4, [0, 0, 0]);
var subs = [];
(function () {
  var mine = { "BG black": 1, "TECH Adjustment Layer 17 (Noise Glow Posterize)": 1, "TECH Adjustment Layer 18 (Radial Blur)": 1 }, i, it;
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

// Step 7: black background solid.
var bg = P.solid(c, "BG black", [0, 0, 0]);

// Step 1: the outer circle, linear gradient fill, no stroke.
var D = args.size || 960, CY = args.cy || 594; // fix pass 1: 885 -> 960 so the blurred ring measures 51 % W, top at 9 % (885 gave 47 %, 12 %)
var out = P.shape(c, "Outer circle");
P.ellipse(out, [D, D]);
var gf = P.contents(out).addProperty("ADBE Vector Graphic - G-Fill");
var gi = gf.propertyIndex;
P.contents(out).property(gi).property("ADBE Vector Grad Type").setValue(1);
P.contents(out).property(gi).property("ADBE Vector Grad Start Pt").setValue([0, -D / 2]);
P.contents(out).property(gi).property("ADBE Vector Grad End Pt").setValue([0, D / 2]);
P.tf(out.layer, "ADBE Position").setValue([960, CY]);

// Step 2: duplicate, rotate 180, scale about 71 %, parent to the original.
var inner = out.layer.duplicate();
inner.name = "Inner disc";
P.tf(inner, "ADBE Rotate Z").setValue(180);
P.tf(inner, "ADBE Scale").setValue([args.innerScale || 66, args.innerScale || 66]); // fix pass 1: 71 -> 66 keeps the inner disc at the measured 33 % W with the larger circle
inner.parent = out.layer;

// Step 3: Gaussian Blur on both shapes.
function blur(l) {
  var e = P.effect(l, "ADBE Gaussian Blur 2");
  e.name = "TECH Gaussian Blur";
  return ART.setFx(l.property("ADBE Effect Parade").property(e.propertyIndex), { "Blurriness": 79.3, "Blur Dimensions": 1, "Repeat Edge Pixels": 0 });
}
var mb = blur(out.layer).concat(blur(inner));

// Step 8: second adjustment layer with CC Radial Fast Blur, below the Noise layer in the result.
var a18 = P.solid(c, "TECH Adjustment Layer 18 (Radial Blur)", [1, 1, 1]);
a18.adjustmentLayer = true;
var rb = P.effect(a18, "CC Radial Fast Blur");
var mr = ART.setFx(rb, { "Center": [960, 540], "Amount": 50, "Zoom": 2 });

// Steps 4-6: adjustment layer with Noise 24, Glow 832, Posterize 21, in that order.
var a17 = P.solid(c, "TECH Adjustment Layer 17 (Noise Glow Posterize)", [1, 1, 1]);
a17.adjustmentLayer = true;
var nz = P.effect(a17, "ADBE Noise");
var mn = ART.setFx(nz, { "Amount of Noise": 24, "Noise Type": 0, "Clipping": 1 });
var gl = P.effect(a17, "ADBE Glo2");
var mg = ART.setFx(gl, { "Glow Threshold": args.glowThr !== undefined ? args.glowThr : 153, "Glow Radius": 832, "Glow Intensity": 1, "Composite Original": 2 });
var ps = P.effect(a17, "ADBE Posterize");
var mp = ART.setFx(ps, { "Level": 21 });

// Type and icon (brief), above everything.
if (showType) {
  var icon = c.layers.add(ART.footage(args.artDir, "eclipse-icon.png", "art 8oVL 06"));
  icon.name = "Eclipse Icon";
  P.tf(icon, "ADBE Position").setValue([0.06 * W + 37, 0.70 * H + 38]);
  txt("PENUMBRA", ["Jost-Regular", "Jost"], 43, 600, ART.hex("#D0D0D0"), ParagraphJustification.LEFT_JUSTIFY, 0.06 * W, 0.86 * H, "Title", 90);
  txt("OBSERVATORY NIGHTS  ·  21 MARCH", ["IBMPlexMono", "IBMPlexMono-Regular"], 17, 200, ART.hex("#8C8C8C"), ParagraphJustification.LEFT_JUSTIFY, 0.06 * W, 0.90 * H, "Small print");
  txt("ALT 41°   AZ 128°", ["IBMPlexMono", "IBMPlexMono-Regular"], 17, 200, ART.hex("#8C8C8C"), ParagraphJustification.RIGHT_JUSTIFY, 0.94 * W, 0.09 * H, "Coordinate");
}
// Order bottom to top: BG, outer, inner, AL 18, AL 17, then the type (already on top).
bg.moveToEnd();
out.layer.moveBefore(bg);
inner.moveBefore(out.layer);
a18.moveBefore(inner);
a17.moveBefore(a18);

if (before) {
  a17.enabled = false; a18.enabled = false;
  out.layer.property("ADBE Effect Parade").property(1).enabled = false;
  inner.property("ADBE Effect Parade").property(1).enabled = false;
}
var thr = a17.property("ADBE Effect Parade").property(2).property("Glow Threshold");
return { comp: c.name, id: c.id, layers: c.numLayers, glowThr: thr.value, glowThrMax: thr.hasMax ? thr.maxValue : null,
         miss: mb.concat(mr, mn, mg, mp).join(", "), fontSubs: subs.join(" | "), before: before };
