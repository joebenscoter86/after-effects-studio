// Technique 13: fine dot-grid background texture from CC Ball Action on a black solid.
// A black comp-size solid sits directly above the pale background, below all graphics.
// CC Ball Action with a small Grid Spacing and Ball Size turns it into an even grid of tiny dots;
// the black between the balls drops out, so only the dots sit over the background.
// Before frame: run with args.before = true (no TECH dots layer), or switch off "TECH dots".
//
// Rebuild with artwork (2026-11-14): art from PROOF/13/art (brief.md). Pass args.artLib (art.jsx) and args.artDir.
// Ground solid #E5E4EE; TECH dots (the recipe's black solid, CC Ball Action Grid Spacing 3, Ball Size 7, defaults
// otherwise); then four clay cut-outs (arch, ball, ring, squiggle) and "playful" in Poppins Bold navy.
// Each cut-out has a very soft Drop Shadow effect (brief: distance 18, softness 40, 15 %, #4A4766, light from the upper
// left); the effect works in the layer's own pixels, so distance and softness are divided by the layer's scale.
// Movie: the four shapes float on slow sine expressions (never stop); the ground and dots stay still so the 1 px dots
// are never resampled (a scale push would make the grid shimmer).
// Earlier VERIFY items resolved in the first run: "CC Ball Action", "Grid Spacing", "Ball Size" all by display name.
// VERIFY (rebuild): Drop Shadow effect ("ADBE Drop Shadow") property names "Shadow Color", "Opacity", "Direction",
//   "Distance", "Softness"; Opacity range read back (0..255 or 0..100).
$.evalFile(args.prelude);
$.evalFile(args.artLib);
args = args || {};
var ARTDIR = args.artDir;
var FOLDER = "art 13";
var W = 1920, H = 1080, FPS = 24, DUR = args.dur || 6;
var BEFORE = (args.before === true);

var c = P.freshComp("13 dot grid", W, H, FPS, DUR, ART.hex("#E5E4EE"));
// Remove this technique's own unused solids from earlier builds (never anyone else's).
(function () {
  var i, it;
  for (i = app.project.numItems; i >= 1; i--) {
    it = app.project.item(i);
    if (!(it instanceof FootageItem) || !(it.mainSource instanceof SolidSource) || it.usedIn.length > 0) continue;
    if (it.name === "13 ground" || it.name === "TECH dots") it.remove();
    else if (it.name === "background" && Math.abs(it.mainSource.color[0] - 0.86) < 0.002 && Math.abs(it.mainSource.color[2] - 0.93) < 0.002) it.remove();
  }
})();

var bg = P.solid(c, "13 ground", ART.hex("#E5E4EE"));
bg.name = "ground";

var dots = null, dotInfo = null;
if (!BEFORE) {
  // Step 1: black solid, comp size, directly above the ground.
  dots = P.solid(c, "TECH dots", [0, 0, 0], W, H);
  // Steps 2-4: CC Ball Action, Grid Spacing 3, Ball Size 7; Coloring Medium and Shading -75 left at default.
  var fx = P.effect(dots, "CC Ball Action");
  fx.name = "TECH CC Ball Action";
  fx = dots.property("ADBE Effect Parade").property(1);
  fx.property("Grid Spacing").setValue(3);
  fx.property("Ball Size").setValue(7);
  // Brief: the dots kept faint, about #9A98AE on the ground. The effect's own shading gives a neutral mid grey; a Fill
  // tints it toward the ground's lilac and the layer opacity keeps it quiet (args.dotOpacity).
  if (args.tint !== false) {
    var fl = P.effect(dots, "ADBE Fill");
    dots.property("ADBE Effect Parade").property(fl.propertyIndex).property("Color").setValue(ART.hex(args.dotColor || "#6E6B8A").concat([1]));
  }
  // Run: #8C89A6 at 70 % left the darkest dot pixel at 0.82 on a 0.90 ground (invisible even on a crop); #7E7B98 at 100 %
  // gives 0.78: the 1 px dots only partly cover a pixel, so this reads as the brief's faint #9A98AE.
  // Polish: at #7E7B98 an open patch darkened 0.2 % overall, invisible on a phone (reference crop 0.9 %). The 1 px
  // balls are mostly transparent (antialiased), so colour alone cannot lift it (#45425F reached only 0.3 %). Levels on
  // the dots' alpha (Alpha Input White, args.alphaWhite) makes each 1 px dot solid without growing it; the recipe's
  // Grid Spacing 3 and Ball Size 7 stay.
  if (args.alphaWhite !== 0) {
    var lv = P.effect(dots, "ADBE Pro Levels2");
    lv = dots.property("ADBE Effect Parade").property(lv.propertyIndex);
    lv.property("ADBE Pro Levels2-0033").setValue(args.alphaWhite || 0.3);
  }
  P.tf(dots, "ADBE Opacity").setValue(args.dotOpacity === undefined ? 100 : args.dotOpacity);
}

var SH = [
  // Polish: the arch at 0.19, 0.38 sat beside the "p" in the x-height band and read as a letter ("nplayful"); moved up
  // and left, clear of the word.
  { file: "arch.png", name: "arch", s: 17, x: args.archX || 0.15, y: args.archY || 0.245, ph: 0.0 },
  { file: "sphere.png", name: "ball", s: 12, x: 0.80, y: 0.26, ph: 1.7 },
  { file: "ring.png", name: "ring", s: 13, x: 0.84, y: 0.72, ph: 3.1 },
  { file: "squiggle.png", name: "squiggle", s: 15, x: 0.30, y: 0.78, ph: 4.4 }
];
var k, L, ds, dsi, opMax;
for (k = 0; k < SH.length; k++) {
  L = c.layers.add(ART.footage(ARTDIR, SH[k].file, FOLDER));
  L.name = SH[k].name;
  P.tf(L, "ADBE Scale").setValue([SH[k].s, SH[k].s]);
  P.tf(L, "ADBE Position").setValue([SH[k].x * W, SH[k].y * H]);
  // Slow float: about 7 px up and down, each on its own phase and period; keeps moving through the last frame.
  P.tf(L, "ADBE Position").expression = "value + [0, 7 * Math.sin(time * 2 * Math.PI / " + (4.5 + k * 0.6) + " + " + SH[k].ph + ")]";
  P.tf(L, "ADBE Rotate Z").expression = "1.2 * Math.sin(time * 2 * Math.PI / " + (6 + k * 0.7) + " + " + SH[k].ph + ")";
  ds = P.effect(L, "ADBE Drop Shadow");
  dsi = ds.propertyIndex;
  ds = L.property("ADBE Effect Parade").property(dsi);
  ds.property("Shadow Color").setValue(ART.hex("#4A4766"));
  opMax = ds.property("Opacity").maxValue;
  ds.property("Opacity").setValue(opMax > 100 ? 0.15 * 255 : 15);
  ds.property("Direction").setValue(135);
  ds.property("Distance").setValue(18 * 100 / SH[k].s);
  ds.property("Softness").setValue(40 * 100 / SH[k].s);
}

var title = P.text(c, "playful", { size: args.size || 230, font: "Poppins-Bold", color: ART.hex("#2B3263"), tracking: -20, name: "playful", pos: [0.50 * W, 0.52 * H] });
var fo = app.fonts.getFontsByPostScriptName("Poppins-Bold");
title.moveToBeginning();
if (dots) dots.moveAfter(c.layer("arch"));
bg.moveToEnd();
var tr = title.sourceRectAtTime(0, false);
return { alphaWhite: dots ? dots.property("ADBE Effect Parade").property("ADBE Pro Levels2").property("ADBE Pro Levels2-0033").value : null, comp: c.name, layers: c.numLayers, before: BEFORE, poppinsReal: fo.length > 0 && !fo[0].isSubstitute, title: [tr.width, tr.height], dropShadowOpacityMax: opMax };
