// Technique 11: soft embossed finish for white shapes on a pale background (rebuilt 2026-11-14 from the rescoped recipe).
// The whole look, not one disc: five white discs stacked on a pale page with a faint left-to-right gradient. EVERY disc
// carries the finish (a grey-blue linear gradient #F1F5F7 to #DAE1E7 at 40 degrees across its own diameter, and a
// Bevel and Emboss layer style: Inner Bevel, Smooth, Size 5, both modes Screen, both colours white, 100 %), and every
// disc has a long soft shadow layer directly under it, parented to it (recipe 12's method: black copy, CC Radial Fast
// Blur, Gaussian Blur). The four back discs and their shadows sit under an adjustment layer that softens them; the main
// disc's shadow sits above that layer, so it falls sharp across the back discs. A small dark two-line title on top.
//
// Stack, bottom to top: page; back discs, each above its "TECH shadow ..."; "TECH soften back discs" (adjustment);
// "TECH shadow main disc"; main disc; title line 2; title line 1.
// Not built: the five front discs (switched off while the tutorial's result plays), the top adjustment layer (its
// effects are not shown) and the credit lines.
//
// Before frame: run with args.before = true. That builds the same scene with every finish and shadow left out: plain
// white discs on the page (no gradient, no bevel, no shadow layers, no softening layer). Run again without it for the
// finished scene.
//
// SUBSTITUTE: the Gradient Overlay layer style's "Colors" cannot be set by script, so the gradient is a Gradient Ramp
// effect ("TECH gradient overlay substitute") on each disc, with the recipe's two colours along 40 degrees across the
// disc's own diameter, points in plain comp pixels. Bevel and Emboss is the real layer style.
// The shadow copy is duplicated from the disc BEFORE the disc gets its styles, so it has none to strip.
//
// Shadow values: the recipe gives none for this scene, only what to reach. Defaults below are the ones that came
// closest in the proof build (see PROOF/11/build-notes.md): args.amount (array of five CC Radial Fast Blur Amounts), args.dist (array of five: blur
// centre's distance from the disc's centre, in disc radii), args.gauss (Gaussian Blur), args.soften (back-disc blur),
// args.opacity (array of five shadow opacities: top, left, lower left, lower right, main), args.dir (array of five
// directions the shadows run, degrees anticlockwise from the right).
$.evalFile(args.prelude);
args = args || {};

function fill(sh, color) {
  var f = P.contents(sh).addProperty("ADBE Vector Graphic - Fill");
  var idx = f.propertyIndex;
  P.contents(sh).property(idx).property("ADBE Vector Fill Color").setValue(color);
  return idx;
}
function hex(h) {
  return [parseInt(h.substr(0, 2), 16) / 255, parseInt(h.substr(2, 2), 16) / 255, parseInt(h.substr(4, 2), 16) / 255];
}
function selectOnly(comp, layer) {
  var i;
  for (i = 1; i <= comp.numLayers; i++) comp.layer(i).selected = false;
  layer.selected = true;
}
function runMenu(name) {
  var id = app.findMenuCommandId(name);
  if (!id) throw new Error("menu command not found: " + name);
  app.executeCommand(id);
}
function sp(layer, styleName, prop) {
  var g = layer.property("Layer Styles") || layer.property("ADBE Layer Styles");
  if (!g) throw new Error("no Layer Styles group on " + layer.name);
  var s = g.property(styleName);
  if (!s) throw new Error("layer style not found after menu command: " + styleName);
  var p = s.property(prop);
  if (!p) throw new Error("layer style property not found: " + styleName + " > " + prop);
  return p;
}
function fxp(layer, effectName, prop) {
  var p = layer.property("ADBE Effect Parade").property(effectName).property(prop);
  if (!p) throw new Error("property not found: " + effectName + " > " + prop + " on " + layer.name);
  return p;
}

var BEFORE = (args.before === true);
var W = 1920, H = 1080;
var c = P.freshComp("11 white on light finish", W, H, 24, 4, hex("EBF5F6"));

// Remove this technique's own unused solids left by earlier runs (never anyone else's).
(function () {
  var i, it, col;
  for (i = app.project.numItems; i >= 1; i--) {
    it = app.project.item(i);
    if (!(it instanceof FootageItem) || !(it.mainSource instanceof SolidSource) || it.usedIn.length > 0) continue;
    col = it.mainSource.color;
    if (it.name === "11 page" || it.name === "11 TECH soften") it.remove();
    else if (it.name === "background" && Math.abs(col[0] - 0.9294) < 0.002 && Math.abs(col[1] - 0.9451) < 0.002 && Math.abs(col[2] - 0.9569) < 0.002) it.remove(); // the first build's #EDF1F4 page
  }
})();

// Step 7: the page, with a slow gradient: left edge #E8EFF2, centre #EBF5F6, right edge #EFFAFB, the bottom about 3
// levels darker than the top. One Gradient Ramp, tilted so that it gains 9 levels left to right and loses 3 top to bottom.
var page = P.solid(c, "11 page", hex("EBF5F6"));
page.name = "page";
(function () {
  var gx = 9 / W, gy = -3 / H; // levels per pixel
  var k = 4.5 / (gx * gx + gy * gy);
  var r = P.effect(page, "ADBE Ramp");
  r.name = "page gradient";
  r = page.property("ADBE Effect Parade").property("page gradient");
  r.property("Ramp Shape").setValue(1);
  r.property("Start of Ramp").setValue([W / 2 - gx * k, H / 2 - gy * k]);
  r.property("Start Color").setValue(hex("E8EFF2"));
  r.property("End of Ramp").setValue([W / 2 + gx * k, H / 2 + gy * k]);
  r.property("End Color").setValue(hex("EFFAFB"));
})();

// Shadow settings (see header). One Gaussian Blur for all five; Amount, centre distance, direction and opacity per disc.
var AMOUNT = args.amount || [97, 95, 96, 95, 95]; // per disc: top, left, lower left, lower right, main
var DIST = args.dist || [2, 2, 2, 3, 2]; // per disc, in disc radii; farther narrows the arc of the edge the shadow covers
var GAUSS = args.gauss === undefined ? 25 : args.gauss;
var SOFTEN = args.soften === undefined ? 11 : args.soften;
var OPAC = args.opacity || [24, 16, 18, 24, 27];
var DIRS = args.dir || [180, 250, 190, 230, 210];

// Layout line: centres and diameters as shares of the picture. Back discs first, main disc last.
var discs = [
  { name: "back disc top", x: 0.57 * W, y: 0.09 * H, d: 0.105 * W },
  { name: "back disc left", x: 0.25 * W, y: 0.50 * H, d: 0.165 * W },
  { name: "back disc lower left", x: 0.365 * W, y: 0.85 * H, d: 0.21 * W },
  { name: "back disc lower right", x: 0.645 * W, y: 0.81 * H, d: 0.18 * W },
  { name: "main disc", x: 0.50 * W, y: 0.505 * H, d: 0.375 * W }
];

var styled = [], shadowNames = [], centres = [];
function makeDisc(k) {
  var o = discs[k];
  var sh = P.shape(c, o.name);
  P.ellipse(sh, [o.d, o.d]);
  fill(sh, [1, 1, 1, 1]);
  P.tf(sh.layer, "ADBE Position").setValue([o.x, o.y]);
  var L = sh.layer;
  if (BEFORE) return L;

  // Step 5: the shadow layer directly under the disc, parented to it. Duplicated before the styles go on.
  var s = L.duplicate();
  s.name = "TECH shadow " + o.name;
  s.moveAfter(L);
  s.parent = L;
  P.effect(s, "ADBE Fill");
  fxp(s, "Fill", "Color").setValue([0, 0, 0, 1]);
  P.effect(s, "CC Radial Fast Blur");
  fxp(s, "CC Radial Fast Blur", "Amount").setValue(AMOUNT[k]);
  fxp(s, "CC Radial Fast Blur", "Zoom").setValue(1);
  // The streak runs away from the centre: the centre sits on the side opposite the shadow, DIST[k] radii from the disc's
  // centre. Plain comp pixels (on a comp-sized shape layer the point control reads comp pixels).
  var a = (DIRS[k] + 180) * Math.PI / 180;
  var cen = [o.x + DIST[k] * o.d / 2 * Math.cos(a), o.y - DIST[k] * o.d / 2 * Math.sin(a)];
  fxp(s, "CC Radial Fast Blur", "Center").setValue(cen);
  centres.push([Math.round(cen[0]), Math.round(cen[1])]);
  P.effect(s, "ADBE Gaussian Blur 2");
  fxp(s, "Gaussian Blur", "Blurriness").setValue(GAUSS);
  fxp(s, "Gaussian Blur", "Blur Dimensions").setValue(1);
  fxp(s, "Gaussian Blur", "Repeat Edge Pixels").setValue(1);
  P.tf(s, "ADBE Opacity").setValue(OPAC[k]);
  shadowNames.push(s.name);

  // Steps 1-2 (substitute): gradient #F1F5F7 (lower-left edge) to #DAE1E7 (upper-right edge) along 40 degrees.
  var ang = 40 * Math.PI / 180, dx = Math.cos(ang) * o.d / 2, dy = -Math.sin(ang) * o.d / 2;
  var ramp = P.effect(L, "ADBE Ramp");
  ramp.name = "TECH gradient overlay substitute";
  ramp = L.property("ADBE Effect Parade").property("TECH gradient overlay substitute");
  ramp.property("Ramp Shape").setValue(1);
  ramp.property("Start of Ramp").setValue([o.x - dx, o.y - dy]);
  ramp.property("Start Color").setValue(hex("F1F5F7"));
  ramp.property("End of Ramp").setValue([o.x + dx * 0.998, o.y + dy * 0.998]);
  ramp.property("End Color").setValue(hex("DAE1E7"));
  styled.push(L);
  return L;
}

var k;
for (k = 0; k < 4; k++) makeDisc(k);

// Step 6: an adjustment layer that softens everything beneath it (the back discs and their shadows).
if (!BEFORE) {
  var soft = P.solid(c, "11 TECH soften", [1, 1, 1]);
  soft.name = "TECH soften back discs";
  soft.adjustmentLayer = true;
  P.effect(soft, "ADBE Gaussian Blur 2");
  fxp(soft, "Gaussian Blur", "Blurriness").setValue(SOFTEN);
  fxp(soft, "Gaussian Blur", "Repeat Edge Pixels").setValue(1);
}

makeDisc(4);

// Small dark two-line title on top. ASSUMED words; Poppins (installed). Line 1 about 39-61 % across at 47 % down,
// line 2 about 42-58 % across at 52 % down.
var title = P.text(c, "Soft Finish", { size: args.titleSize || 82, color: [0.16, 0.19, 0.24], font: args.font || "Poppins-Bold", pos: [0.50 * W, 0.47 * H], name: "title line 1" });
var tr1 = title.sourceRectAtTime(0, false);
var sub = P.text(c, "white on light", { size: args.subSize || 46, color: [0.16, 0.19, 0.24], font: "Poppins-Regular", pos: [0.50 * W, 0.52 * H], name: "title line 2" });
var tr2 = sub.sourceRectAtTime(0, false);
title.moveToBeginning();

// Step 3-4: Bevel and Emboss on every disc. Layer styles need the comp open in the viewer and the layer selected.
var B = "Bevel and Emboss", rb = null, i, L2;
if (!BEFORE) {
  c.openInViewer();
  for (i = 0; i < styled.length; i++) {
    L2 = styled[i];
    selectOnly(c, L2);
    runMenu(B);
    sp(L2, B, "Style").setValue(2); // Inner Bevel
    sp(L2, B, "Technique").setValue(1); // Smooth
    sp(L2, B, "Depth").setValue(100);
    sp(L2, B, "Direction").setValue(1); // Up
    sp(L2, B, "Size").setValue(5);
    sp(L2, B, "Soften").setValue(0);
    sp(L2, B, "Use Global Light").setValue(0);
    sp(L2, B, "Angle").setValue(120);
    sp(L2, B, "Altitude").setValue(30);
    sp(L2, B, "Highlight Color").setValue([1, 1, 1, 1]);
    sp(L2, B, "Highlight Opacity").setValue(100);
    // The recipe's key point: the shadow becomes white in Screen mode, at 100 % (Highlight Mode is Screen by default).
    sp(L2, B, "Shadow Mode").setValue(sp(L2, B, "Highlight Mode").value);
    sp(L2, B, "Shadow Color").setValue([1, 1, 1, 1]);
    sp(L2, B, "Shadow Opacity").setValue(100);
  }
  selectOnly(c, styled[styled.length - 1]);
  styled[styled.length - 1].selected = false;
  rb = { style: sp(L2, B, "Style").value, highlightMode: sp(L2, B, "Highlight Mode").value, shadowMode: sp(L2, B, "Shadow Mode").value, shadowOpacity: sp(L2, B, "Shadow Opacity").value };
}

var order = [];
for (i = c.numLayers; i >= 1; i--) order.push(c.layer(i).name);
return {
  comp: c.name, before: BEFORE, layers: c.numLayers, order: order,
  title1: [tr1.width, tr1.height], title2: [tr2.width, tr2.height],
  shadows: shadowNames, centres: centres, amount: AMOUNT, dist: DIST, gauss: GAUSS, soften: SOFTEN, opacity: OPAC, dir: DIRS,
  readBack: rb
};
