// Shared "Still Water" scene for 8oVLS0ZlKC4 01, 02 and 03 (art brief proof/01/art/brief.md). Loaded after prelude and art.jsx.
// SW.build(name, n, opts) builds recipe 01's base, then 02's finish (opts.finish) and 03's light circles (opts.lights),
// then the art's type on top of every layer. Returns { comp, ... }.
// VERIFY (resolved on 05/06 runs): Glow Threshold reads 0-255 (100 % = 255); Composite Original 2 = Behind;
// CC Radial Fast Blur Zoom 3 = Darkest; Noise checkboxes "Noise Type" (colour noise) and "Clipping".
var SW = { W: 1920, H: 1080, FPS: 60, subs: [] };
SW.text = function (c, str, fonts, size, tracking, color, just, x, base, name, opacity) {
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
  if (!ok) SW.subs.push(name + ": asked " + fonts.join("/") + ", got " + back.font);
  P.tf(l, "ADBE Anchor Point").setValue([0, 0]);
  P.tf(l, "ADBE Position").setValue([x, base]);
  if (opacity !== undefined) P.tf(l, "ADBE Opacity").setValue(opacity);
  l.name = name;
  return l;
};
SW.cleanSolids = function (names) {
  var i, it;
  for (i = app.project.numItems; i >= 1; i--) {
    it = app.project.item(i);
    if (it instanceof FootageItem && it.mainSource instanceof SolidSource && names[it.name] && it.usedIn.length === 0) it.remove();
  }
};
// Recipe 01: a circle about 3520 px across, fill about RGB 2,11,23, stroke 9 px #0082FF, Gaussian Blur 103.6 Vertical, Repeat Edge off.
SW.circle = function (c, name, centre, opts) {
  var sh = P.shape(c, name);
  P.tf(sh.layer, "ADBE Position").setValue(centre);
  P.ellipse(sh, [3520, 3520]);
  var f = P.contents(sh).addProperty("ADBE Vector Graphic - Fill");
  P.contents(sh).property(f.propertyIndex).property("ADBE Vector Fill Color").setValue([2 / 255, 11 / 255, 23 / 255, 1]);
  var si = P.stroke(sh, [0, 130 / 255, 1, 1], 9);
  var gb = P.effect(sh.layer, "ADBE Gaussian Blur 2");
  gb.name = "TECH Gaussian Blur";
  var miss = ART.setFx(sh.layer.property("ADBE Effect Parade").property(1), { "Blurriness": 103.6, "Blur Dimensions": 3, "Repeat Edge Pixels": 0 });
  if (opts.before01) { // recipe 01's before frame: hard circles, no blur, no stroke
    sh.layer.property("ADBE Effect Parade").property(1).enabled = false;
    P.contents(sh).property(si).enabled = false;
  }
  return { layer: sh.layer, miss: miss };
};
SW.adj = function (c, name) { var l = P.solid(c, name, [1, 1, 1]); l.adjustmentLayer = true; return l; };
SW.build = function (name, n, opts) {
  var W = SW.W, H = SW.H, out = {}, miss = [], k, g, gi;
  SW.cleanSolids({ "BG": 1, "TECH Glow": 1, "TECH Blur": 1, "TECH Noise": 1 });
  var c = P.freshComp(name, W, H, SW.FPS, opts.dur || 5, [0.894, 0.957, 1]);
  var bg = P.solid(c, "BG", [228 / 255, 244 / 255, 1]);
  var lower = SW.circle(c, "Lower circle", [944, 2351], opts);
  var upper = SW.circle(c, "Upper circle", [943, -1298], opts);
  miss = miss.concat(lower.miss, upper.miss);
  var stack = [upper.layer]; // layers above the circles, bottom to top
  if (opts.finish) {
    // Recipe 02 steps 2-9, values as written (Amount 95 + wiggle(2,10) kept even though the slider stops at 100: measured, not changed).
    var glowL = SW.adj(c, "TECH Glow");
    for (gi = 0; gi < 2; gi++) {
      var ge = P.effect(glowL, "ADBE Glo2");
      miss = miss.concat(ART.setFx(ge, { "Glow Threshold": 255, "Glow Radius": 331, "Glow Intensity": 0.3, "Composite Original": 2 }));
      g = glowL.property("ADBE Effect Parade").property(ge.propertyIndex);
      for (k = 1; k <= g.numProperties; k++) if (g.property(k).name === "Glow Radius") g.property(k).expression = "wiggle(2,100)";
    }
    out.glowThr = glowL.property("ADBE Effect Parade").property(1).property("Glow Threshold").value;
    var blurL = SW.adj(c, "TECH Blur");
    var rb = P.effect(blurL, "CC Radial Fast Blur");
    miss = miss.concat(ART.setFx(rb, { "Center": [960, 540], "Amount": 95, "Zoom": 3 }));
    var amt = blurL.property("ADBE Effect Parade").property(1).property("Amount");
    amt.expression = "wiggle(2,10)";
    var reads = [], tt;
    for (tt = 0; tt <= (opts.dur || 5); tt += 0.25) reads.push(Math.round(amt.valueAtTime(tt, false) * 10) / 10);
    out.rbAmount = reads.join(" ");
    var noiseL = SW.adj(c, "TECH Noise");
    var nz = P.effect(noiseL, "ADBE Noise");
    miss = miss.concat(ART.setFx(nz, { "Amount of Noise": 9, "Noise Type": 0, "Clipping": 1 }));
    stack = stack.concat([glowL, blurL, noiseL]);
    if (opts.beforeFinish) { glowL.enabled = false; blurL.enabled = false; noiseL.enabled = false; }
  }
  if (opts.lights) {
    // Recipe 03: three #355EA0 circles about 18 % of the width (346 px) across, no stroke, above the finishing layers.
    var specs = [
      { name: "TECH Light top", pos: [0.48 * W, 0], scale: 70, blur: 555.6, dim: 1, expr: null },
      { name: "TECH Light bottom left", pos: [0.28 * W, H], scale: 100, blur: 599.6, dim: 3, expr: "wiggle(2,100)" },
      { name: "TECH Light bottom right", pos: [0.68 * W, H], scale: 100, blur: 600, dim: 3, expr: null }
    ], s, ls, lb;
    out.lights = [];
    for (s = 0; s < specs.length; s++) {
      ls = P.shape(c, specs[s].name);
      P.tf(ls.layer, "ADBE Position").setValue(specs[s].pos);
      P.tf(ls.layer, "ADBE Scale").setValue([specs[s].scale, specs[s].scale]);
      P.ellipse(ls, [346, 346]);
      var lf = P.contents(ls).addProperty("ADBE Vector Graphic - Fill");
      P.contents(ls).property(lf.propertyIndex).property("ADBE Vector Fill Color").setValue([53 / 255, 94 / 255, 160 / 255, 1]);
      lb = P.effect(ls.layer, "ADBE Gaussian Blur 2");
      // 03 run second: opts.lightBlurScale (default 1) scales every light blur together, to test the review's "spreads about 1.4 times too far".
      miss = miss.concat(ART.setFx(lb, { "Blurriness": specs[s].blur * (opts.lightBlurScale || 1), "Blur Dimensions": specs[s].dim, "Repeat Edge Pixels": 0 }));
      if (specs[s].expr) ls.layer.property("ADBE Effect Parade").property(1).property("Blurriness").expression = (opts.lightBlurScale && opts.lightBlurScale !== 1) ? "wiggle(2,100) * " + opts.lightBlurScale : specs[s].expr;
      ls.layer.parent = lower.layer; // step 6 (keeps its place on screen)
      if (opts.beforeLights) ls.layer.enabled = false;
      stack.push(ls.layer);
      out.lights.push(ls.layer.name);
    }
  }
  // Order bottom to top: BG, lower, upper, then the stack in order.
  bg.moveToEnd();
  lower.layer.moveBefore(bg);
  upper.layer.moveBefore(lower.layer);
  for (k = 1; k < stack.length; k++) stack[k].moveBefore(stack[k - 1]);
  // Art (brief): on top of every layer, static, never under the finish or tied to the shapes.
  if (opts.showType !== false) {
    var pale = [228 / 255, 244 / 255, 1];
    SW.text(c, "Still Water", ["CormorantGaramond-Medium", "CormorantGaramond-Regular"], 81, 40, [2 / 255, 11 / 255, 23 / 255], ParagraphJustification.CENTER_JUSTIFY, 0.5 * W, 0.515 * H, "Title");
    var icon = c.layers.add(ART.footage(opts.artDir, "moon-icon.png", "art 8oVL " + n));
    icon.name = "Moon Icon";
    P.tf(icon, "ADBE Position").setValue([0.05 * W + 25, 0.065 * H + 27]);
    P.tf(icon, "ADBE Opacity").setValue(75);
    SW.text(c, "NIGHT SESSIONS  /  " + n, ["IBMPlexMono", "IBMPlexMono-Regular"], 18, 200, pale, ParagraphJustification.LEFT_JUSTIFY, 0.05 * W + 50 + 22, 0.098 * H, "Label", 75);
    SW.text(c, "23:40 — 01:10", ["IBMPlexMono", "IBMPlexMono-Regular"], 18, 200, pale, ParagraphJustification.RIGHT_JUSTIFY, 0.95 * W, 0.93 * H, "Time", 75);
  }
  out.comp = c.name; out.id = c.id; out.layers = c.numLayers; out.miss = miss.join(", "); out.fontSubs = SW.subs.join(" | ");
  var order = []; for (k = 1; k <= c.numLayers; k++) order.push(c.layer(k).name); out.order = order.join(" > ");
  return out;
};
