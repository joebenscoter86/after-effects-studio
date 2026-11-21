// Shared pieces for the Tf0EiCGOEYs proofs (loaded after prelude.jsx with $.evalFile(args.lib)). ExtendScript (ES3).
// The button comp (recipes 01, 02), the end-card text (03), the cursor comp (04), the white Background, fonts with
// fallback, and key helpers (65/65 ease, Easy Ease, linear, straight spatial paths).
// Every comp a script makes carries the script's number in its name, so re-running one script never removes
// another script's precomp (P.freshComp removes comps by name).
//
// VERIFY: TextDocument.font set to a missing PostScript name does not throw, and reads back as a different font or with fontObject.isSubstitute true
// VERIFY: TextDocument.horizontalScale default reads 1 (fraction) or 100 (percent); T.text multiplies the default by the wanted fraction, so either works
// VERIFY: Drop Shadow display names "Shadow Color", "Opacity", "Direction", "Distance", "Softness", "Shadow Only"; Opacity is 0-255 by script (lesson 17)
// VERIFY: renaming an effect (fx.name = "TECH ...") is allowed and the property can be found again by the new name
// VERIFY: Property.setValueAtTime and keyTime use comp time (all keys here are placed in comp time with startTime 0, so layer offsets never matter)
// VERIFY: setSpatialAutoBezierAtKey(k, false) before setSpatialTangentsAtKey; tangent arrays sized to the key value's length (2 or 3)
// VERIFY: KeyframeEase(0, 65) on Position (spatial) takes one ease per side; Scale (not spatial) takes one per dimension
var T = {};
T.W = 1080;
T.H = 1920;
T.FPS = 60;
T.BLUE = [0, 54 / 255, 1]; // #0036FF, as typed in the recipes' colour dialogs
// ASSUMED: placeholder copy. The recipes give only "two-word all-caps label", "three-word headline in sentence case"
// and "lower-case placeholder address"; these were picked to land near the measured widths (505, 660, 330 px).
T.COPY = { label: "LEARN MORE", headline: "Join us today", address: "yoursite.com" };
// Art run (2026-11-21): the art brief's copy replaces the stand-ins.
T.COPY = { label: "START FREE", headline: "Plan your day", address: "driftday.app" };
T.fontLog = [];

// Try each PostScript name in `faces` until one reads back as itself and not a substitute.
// Returns { wanted, used, isSubstitute }: isSubstitute is true when the recipe's face (faces[0]) was not the one used.
T.setFont = function (prop, faces, label) {
  var i, d, back, fo, ok = false, used = null;
  for (i = 0; i < faces.length && !ok; i++) {
    d = prop.value;
    d.font = faces[i];
    prop.setValue(d);
    back = prop.value;
    fo = null;
    try { fo = back.fontObject; } catch (e) { fo = null; } // fontObject is AE 24+; absent means only the name check counts
    ok = (back.font === faces[i]) && !(fo && fo.isSubstitute);
    used = back.font;
  }
  var r = { label: label, wanted: faces[0], used: used, isSubstitute: !(ok && used === faces[0]), found: ok };
  T.fontLog.push(r);
  return r;
};
T.fontReport = function () {
  var out = [], i, r;
  for (i = 0; i < T.fontLog.length; i++) {
    r = T.fontLog[i];
    out.push(r.label + ": wanted " + r.wanted + ", used " + r.used + (r.isSubstitute ? " (SUBSTITUTE)" : "") + (r.found ? "" : " (NO FACE FOUND)"));
  }
  return out.join(" | ");
};
T.anySubstitute = function () {
  var i;
  for (i = 0; i < T.fontLog.length; i++) if (T.fontLog[i].isSubstitute) return true;
  return false;
};

// Point text, centred paragraph. o: size, color, faces [recipe face, fallback], tracking, hScale (fraction, e.g. 0.99),
// pos [x, y], anchor "baseline" (Type tool default: layer origin on the baseline at the line's centre) or "ink" (ink-box centre),
// opacity (percent), name.
T.text = function (c, str, o) {
  var l = c.layers.addText(str);
  var prop = l.property("ADBE Text Properties").property("ADBE Text Document");
  var d = prop.value;
  d.resetCharStyle();
  d.resetParagraphStyle();
  d.fontSize = o.size;
  d.fillColor = o.color;
  d.applyFill = true;
  d.applyStroke = false;
  d.tracking = o.tracking;
  d.justification = ParagraphJustification.CENTER_JUSTIFY;
  if (o.hScale !== undefined) d.horizontalScale = d.horizontalScale * o.hScale;
  prop.setValue(d);
  l.name = o.name;
  var f = T.setFont(prop, o.faces, o.name);
  if (o.anchor === "ink") {
    var r = l.sourceRectAtTime(0, false);
    P.tf(l, "ADBE Anchor Point").setValue([r.left + r.width / 2, r.top + r.height / 2]);
  } else {
    P.tf(l, "ADBE Anchor Point").setValue([0, 0]);
  }
  P.tf(l, "ADBE Position").setValue(o.pos);
  if (o.opacity !== undefined) P.tf(l, "ADBE Opacity").setValue(o.opacity);
  return { layer: l, font: f };
};
// Ink box of a text layer in comp pixels at time t (no parenting, no rotation; scale 100 %).
T.inkBox = function (l, t) {
  var r = l.sourceRectAtTime(t || 0, false);
  var a = P.tf(l, "ADBE Anchor Point").valueAtTime(t || 0, false);
  var p = P.tf(l, "ADBE Position").valueAtTime(t || 0, false);
  var x0 = p[0] - a[0] + r.left, y0 = p[1] - a[1] + r.top;
  return { left: Math.round(x0 * 10) / 10, top: Math.round(y0 * 10) / 10, width: Math.round(r.width * 10) / 10, height: Math.round(r.height * 10) / 10, bottom: Math.round((y0 + r.height) * 10) / 10 };
};
T.boxStr = function (b) {
  return "x " + b.left + "-" + Math.round((b.left + b.width) * 10) / 10 + ", y " + b.top + "-" + b.bottom + " (" + b.width + " x " + b.height + ")";
};

// Set effect parameters by display name; throws on a missing name (nothing hidden).
T.setFx = function (fx, values) {
  var missing = [], k, j, found;
  for (k in values) {
    found = false;
    for (j = 1; j <= fx.numProperties; j++) {
      if (fx.property(j).name === k) { fx.property(j).setValue(values[k]); found = true; break; }
    }
    if (!found) missing.push(k);
  }
  if (missing.length) throw new Error(fx.name + ": parameters not found: " + missing.join(", "));
};
// Drop Shadow with percent opacity converted to the 0-255 script scale; renamed to `name`. Returns a read-back string.
T.dropShadow = function (layer, name, color, opacityPct, direction, distance, softness) {
  var fx = P.effect(layer, "ADBE Drop Shadow");
  T.setFx(fx, { "Shadow Color": color, "Opacity": opacityPct * 255 / 100, "Direction": direction, "Distance": distance, "Softness": softness, "Shadow Only": 0 });
  fx.name = name;
  fx = layer.property("ADBE Effect Parade").property(name);
  return layer.name + " / " + fx.name + ": op " + fx.property("Opacity").value + " (" + Math.round(fx.property("Opacity").value / 2.55 * 10) / 10 + " %), dir " +
    fx.property("Direction").value + ", dist " + fx.property("Distance").value + ", soft " + fx.property("Softness").value;
};

// White full-frame solid named Background at the bottom of the stack (recipe 03's white ground; the runner may swap it for art).
T.background = function (c) {
  var l = P.solid(c, "Background", [1, 1, 1], c.width, c.height);
  l.name = "Background";
  l.moveToEnd();
  return l;
};
// The scene comp: 1080 x 1920, 60 fps, white comp background (viewing aid only), white Background solid.
T.scene = function (name, frames) {
  var c = P.freshComp(name, T.W, T.H, T.FPS, frames / T.FPS, [1, 1, 1]);
  T.background(c);
  return c;
};

// Recipe 01 (and 02 when opts.shadows): the button comp, 1040 x 530, 60 fps, white bg (does not render nested).
// Pill: Rectangle Path 700 x 170, Roundness 451, Fill #0036FF, no stroke, at the comp centre.
// Label: Montserrat ExtraBold 60 px, white, tracking 157, centred, ink-box centre on the pill centre (520, 265).
// opts: name (comp name), frames, shadows (bool), prefix ("TECH " for technique 02, "" otherwise), label (string).
T.buttonComp = function (opts) {
  var bc = P.freshComp(opts.name, 1040, 530, T.FPS, opts.frames / T.FPS, [1, 1, 1]);
  var sh = P.shape(bc, "Pill");
  var rp = P.contents(sh).addProperty("ADBE Vector Shape - Rect");
  var ri = rp.propertyIndex;
  P.contents(sh).property(ri).property("ADBE Vector Rect Size").setValue([700, 170]);
  P.contents(sh).property(ri).property("ADBE Vector Rect Roundness").setValue(451);
  var fl = P.contents(sh).addProperty("ADBE Vector Graphic - Fill");
  P.contents(sh).property(fl.propertyIndex).property("ADBE Vector Fill Color").setValue(T.BLUE);
  P.tf(sh.layer, "ADBE Position").setValue([520, 265]);
  var lab = T.text(bc, opts.label || T.COPY.label, {
    size: 60, color: [1, 1, 1], faces: ["Montserrat-ExtraBold", "Montserrat-Black"], tracking: 157,
    pos: [520, 265], anchor: "ink", name: "Label"
  });
  var out = { comp: bc, pill: sh.layer, label: lab.layer, font: lab.font, shadows: [] };
  if (opts.shadows) {
    var p = opts.prefix || "";
    // Recipe 02 steps 3-4: the pill's own blue, 50 %, straight down, long and very soft.
    // SUBSTITUTE: the eyedropper sample of the pill's fill stands in as the typed value #0036FF the dialog read.
    out.shadows.push(T.dropShadow(sh.layer, p + "Drop Shadow", T.BLUE, 50, 180, 48, 248));
    // Step 5: hard dark edge under the letters. ASSUMED: black (the hex is never opened; the effect's default).
    out.shadows.push(T.dropShadow(lab.layer, p + "Label Shadow", [0, 0, 0], 40, 180, 4, 0));
    // Step 6: the second instance, a soft white light from above.
    out.shadows.push(T.dropShadow(lab.layer, p + "Label Light", [1, 1, 1], 24, 0, 9, 52));
  }
  return out;
};

// Recipe 03's two text layers. pos values are baseline positions (Type tool anchor) in scene pixels.
T.headline = function (c, pos) {
  return T.text(c, T.COPY.headline, {
    size: 98, color: T.BLUE, faces: ["Montserrat-SemiBold", "Montserrat-Medium"], tracking: 20, hScale: 0.99,
    pos: pos, anchor: "baseline", opacity: 100, name: "Headline"
  });
};
T.address = function (c, pos) {
  return T.text(c, T.COPY.address, {
    size: 40, color: T.BLUE, faces: ["Montserrat-ExtraBold", "Montserrat-Black"], tracking: 160, hScale: 0.99,
    pos: pos, anchor: "baseline", opacity: 40, name: "Web address"
  });
};

// Recipe 04: the cursor comp, 200 x 200, 60 fps, black comp background (viewing aid only).
// Outer disc 200 px, black fill, layer Opacity 25; inner disc 142 px, white fill, layer Opacity 40, on top. No strokes.
T.cursorComp = function (name, frames) {
  var cc = P.freshComp(name, 200, 200, T.FPS, frames / T.FPS, [0, 0, 0]);
  var discs = [["Outer disc", 200, [0, 0, 0], 25], ["Inner disc", 142, [1, 1, 1], 40]];
  var i, sh, fl;
  for (i = 0; i < discs.length; i++) {
    sh = P.shape(cc, discs[i][0]);
    P.ellipse(sh, [discs[i][1], discs[i][1]]);
    fl = P.contents(sh).addProperty("ADBE Vector Graphic - Fill");
    P.contents(sh).property(fl.propertyIndex).property("ADBE Vector Fill Color").setValue(discs[i][2]);
    P.tf(sh.layer, "ADBE Position").setValue([100, 100]);
    P.tf(sh.layer, "ADBE Opacity").setValue(discs[i][3]);
  }
  return cc;
};

// A value of length n from a 2-vector (pads with 0 for 3D-shaped values).
T.vec = function (v, n) {
  var out = [v[0], v[1]];
  while (out.length < n) out.push(0);
  return out;
};
T.dims = function (prop, k) {
  var v = prop.keyValue(k);
  return (v instanceof Array) ? v.length : 1;
};
// Zero spatial tangents on every key: straight segments, and no drift between two keys of the same value.
T.straight = function (prop) {
  var k, n;
  for (k = 1; k <= prop.numKeys; k++) {
    n = T.dims(prop, k);
    prop.setSpatialAutoBezierAtKey(k, false);
    prop.setSpatialContinuousAtKey(k, false);
    prop.setSpatialTangentsAtKey(k, T.vec([0, 0], n), T.vec([0, 0], n));
  }
};
// Temporal ease with `infl` % influence and speed 0 on both sides of every key (65 for the card, 33.33 for Easy Ease).
// SUBSTITUTE: the third-party easing panel's linked 65/65 sliders (or Animation > Keyframe Velocity) and the F9 Easy Ease
// are both set as KeyframeEase(0, influence).
T.ease = function (prop, infl) {
  var k, i, n, e;
  for (k = 1; k <= prop.numKeys; k++) {
    prop.setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
    n = prop.isSpatial ? 1 : T.dims(prop, k);
    e = [];
    for (i = 0; i < n; i++) e.push(new KeyframeEase(0, infl));
    prop.setTemporalEaseAtKey(k, e, e);
  }
};
T.linear = function (prop) {
  var k;
  for (k = 1; k <= prop.numKeys; k++) prop.setInterpolationTypeAtKey(k, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
};
// Key [frame, [x, y]] pairs onto a Position-like property (values sized to the property).
T.keys = function (prop, list) {
  var i, n = (prop.value instanceof Array) ? prop.value.length : 1;
  for (i = 0; i < list.length; i++) prop.setValueAtTime(list[i][0] / T.FPS, T.vec(list[i][1], n));
};
T.scaleKeys = function (prop, list) {
  var i, j, v, n = prop.value.length;
  for (i = 0; i < list.length; i++) {
    v = [];
    for (j = 0; j < n; j++) v.push(list[i][1]);
    prop.setValueAtTime(list[i][0] / T.FPS, v);
  }
};
T.round1 = function (v) { return Math.round(v * 10) / 10; };
T.xAt = function (l, frame) { return T.round1(P.tf(l, "ADBE Position").valueAtTime(frame / T.FPS, false)[0]); };
T.ptAt = function (l, frame) {
  var v = P.tf(l, "ADBE Position").valueAtTime(frame / T.FPS, false);
  return "(" + T.round1(v[0]) + ", " + T.round1(v[1]) + ")";
};

// The end card of recipe 03 in comp c: button layer (from button comp result b), web address, headline, bottom to top.
// pos: { button, address, headline } in scene pixels. Returns { button, address, headline } layers.
T.card = function (c, b, pos) {
  var bl = c.layers.add(b.comp);
  bl.name = "Button";
  P.tf(bl, "ADBE Position").setValue(pos.button);
  var ad = T.address(c, pos.address).layer;
  var hd = T.headline(c, pos.headline).layer;
  return { button: bl, address: ad, headline: hd };
};
// Horizontal moves on a card layer: list of [frame, x] keys, y held at the layer's resting y. Straight spatial path,
// every key eased 65 % in and out at speed 0 (recipes 05 and 08).
T.slideKeys = function (l, list) {
  var pos = P.tf(l, "ADBE Position"), y = pos.value[1], i, keys = [];
  for (i = 0; i < list.length; i++) keys.push([list[i][0], [list[i][1], y]]);
  T.keys(pos, keys);
  T.straight(pos);
  T.ease(pos, 65);
};
// Motion blur on the given layers and the comp. ASSUMED: shutter angle and phase left at the comp's defaults (never shown).
T.motionBlur = function (c, layers) {
  var i;
  for (i = 0; i < layers.length; i++) layers[i].motionBlur = true;
  c.motionBlur = true;
};

// Recipe 07's curved route on a cursor Position: four keys (enter start, arrive, leave, exit end) at `frames`,
// points `pts` (scene pixels), spatial tangents from the recipe, Easy Ease (33.33 %) on all four.
// SUBSTITUTE: the Convert Vertex Tool handle drags are set as spatial tangents.
// Key 1 out [39, -564] and key 4 in [-222, 399] were read from the viewer during the drags (approximate).
// ASSUMED (recipe's inferred values): key 2 in [-250, 0], key 3 out [250, 0]; keys 2 and 3 not continuous, their
// other sides zero so the hold between them cannot drift. Key 1 in and key 4 out are zero (nothing before or after).
T.ROUTE_TANGENTS = [
  [[0, 0], [39, -564]],
  // Art run 2026-11-21: the inferred hold tangents shortened from 250 to 100 so the path meets the recipe's measured
  // shape (entry crosses x 0 about 81 % down, bow about 19 %; exit bows 10 % and crosses x 1080 about 43 % down).
  // At 250 the exit crossed 45.6 % down with a 12.3 % bow, and the entry crossed 78.7 % with a 21 % bow.
  [[-100, 0], [0, 0]],
  [[0, 0], [100, 0]],
  [[-222, 399], [0, 0]]
];
T.curvedRoute = function (cp, frames, pts, tangents) {
  var TG = tangents || T.ROUTE_TANGENTS; // 07 run second passes its own; 08 keeps the lib default
  var k, n, keys = [];
  for (k = 0; k < 4; k++) keys.push([frames[k], pts[k]]);
  T.keys(cp, keys);
  for (k = 1; k <= 4; k++) {
    n = T.dims(cp, k);
    cp.setSpatialAutoBezierAtKey(k, false);
    cp.setSpatialContinuousAtKey(k, false);
    cp.setSpatialTangentsAtKey(k, T.vec(TG[k - 1][0], n), T.vec(TG[k - 1][1], n));
  }
  T.ease(cp, 33.33);
};
// Static uniform scale on a layer, sized to the property.
T.setScale = function (l, s) {
  var sc = P.tf(l, "ADBE Scale");
  sc.setValue(sc.value.length === 3 ? [s, s, s] : [s, s]);
};

// Art run: swap the white Background solid for the brief's backdrop.png (layer "Backdrop", full frame, bottom).
// dir: the technique's art folder; folder: project folder name ("art <n>"). Requires art.jsx (ART) loaded.
T.artGround = function (c, dir, folder) {
  var i, bg = null;
  for (i = 1; i <= c.numLayers; i++) if (c.layer(i).name === "Background") { bg = c.layer(i); break; }
  if (bg && bg.source) bg.source.remove(); // removes the solid item and its layer: no orphan solids
  var l = c.layers.add(ART.footage(dir, "backdrop.png", folder));
  l.name = "Backdrop";
  P.tf(l, "ADBE Position").setValue([540, 960]);
  T.setScale(l, 100);
  l.moveToEnd();
  return l;
};
// Art run: the app icon at (540, 440), Scale 25 %, directly above `headline`, parented to it.
// Call before the headline gets keys, so parenting keeps the icon exactly where it was placed.
T.icon = function (c, dir, folder, headline) {
  var l = c.layers.add(ART.footage(dir, "app-icon.png", folder));
  l.name = "App icon";
  T.setScale(l, 25);
  P.tf(l, "ADBE Position").setValue([540, 440]);
  l.moveBefore(headline);
  l.parent = headline;
  return l;
};
