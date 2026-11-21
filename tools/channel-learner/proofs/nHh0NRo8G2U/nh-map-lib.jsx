// Map scene for proofs 14 (pinned prints swaying) and 15 (ink-blend washes and a self-drawing border).
// Loaded after nh-core-lib.jsx. The map does not use the chart's uniform mapping: a map precomp the size of the map
// plate fills the tall frame (cover fit), and everything inside it is in map-plate pixels. Figures the recipes give
// relative to objects (print size relative to the frame, sway angle and rate, wash opacity, blend modes, stroke relative
// to the outline) are kept as written. ExtendScript (ES3).
//
// VERIFY: comp.layers.addNull() makes a 100 x 100 null; children parented after being placed keep their comp positions
// VERIFY: wiggle(.5,10) on each print's Rotation gives each print its own random path (seed per layer)
// VERIFY: Gradient Ramp display names "Start of Ramp", "Start Color", "End of Ramp", "End Color"
// VERIFY: layer.blendingMode = BlendingMode.MULTIPLY on shape layers
// VERIFY: a closed path's Trim Paths End 0 -> 100 starts drawing at vertex 0 and runs in vertex order
var NHM = {};
NHM.STAND_IN_PLATE = [2160, 3840];        // ASSUMED: stand-in plate, twice the tall frame each way
// Print width as a share of the frame's width (recipe 14 layout: "of the crop's width"): North America the smallest.
NHM.PRINT_FRAC = [0.035, 0.045, 0.043];   // NA 3.5 %, western Europe 4.4-4.6 %, Asia 4.2-4.4 %
NHM.PRINT_ASPECT = 1.18;                  // height = 1.18 x width
NHM.WINDOW = { w: 0.88, h: 0.75 };        // photo fills ~88 % of the width and the top ~75 % of the height
NHM.PIN_FRAC = 0.11;                      // pushpin about 11 % of the print's width
NHM.PIN_Y = 0.04;                         // ASSUMED: the pin's point sits 4 % of the print's height below its top edge
NHM.PLACE_NAMES = ["North America", "Western Europe", "Asia"];
// ASSUMED: stand-in places as shares of the plate (the brief gives args.places in plate pixels).
NHM.PLACE_FRAC = [[0.28, 0.40], [0.58, 0.32], [0.78, 0.46]];
NHM.PHOTO_COLORS = [[0.35, 0.45, 0.6], [0.3, 0.6, 0.3], [0.55, 0.65, 0.2]]; // stand-in photos: mountains, valley, jungle
NHM.CYAN = [0x1F / 255, 0xC9 / 255, 0xF8 / 255];   // #1FC9F8
NHM.MUSTARD = [0xE7 / 255, 0xC1 / 255, 0x4F / 255]; // #E7C14F

// The map precomp `nHh0 <n> map`, its grade, optional washes and border (15), and the three pinned prints.
// o: n (script number for comp names), frames, artDir, artFolder, places, washes ([[x, y, diameter], ...]),
// outline ([[x, y], ...]), borderWidth, prints (default true), highlights (recipe 15 on/off).
NHM.build = function (outer, o) {
  var n = o.n, rep = [], i;
  var mapItem = NH.art(o.artDir, "map.png", o.artFolder);
  var MW = mapItem ? mapItem.width : NHM.STAND_IN_PLATE[0];
  var MH = mapItem ? mapItem.height : NHM.STAND_IN_PLATE[1];
  var mc = P.freshComp("nHh0 " + n + " map", MW, MH, NH.FPS, o.frames / NH.FPS, [0, 0, 0]);
  // Cover fit into the tall frame; k = frame px per map px.
  var k = Math.max(NH.W / MW, NH.H / MH);
  var ml = outer.layers.add(mc);
  ml.name = "Map";
  P.tf(ml, "ADBE Scale").setValue([k * 100, k * 100]);
  P.tf(ml, "ADBE Position").setValue([NH.W / 2, NH.H / 2]);
  rep.push("plate " + MW + " x " + MH + " at " + NH.r1(k * 100) + " %" + (mapItem ? " (map.png)" : " (stand-in)"));

  // Map plate (bottom), then the grey grade above it (steps 3-4: Hue/Saturation -100, Levels 16-224 in 8-bit terms).
  if (mapItem) {
    var mp = mc.layers.add(mapItem);
    mp.name = "Map plate";
  } else {
    // SUBSTITUTE: a paper-coloured Gradient Ramp solid with a faint Grid of ink lines stands in for the scan,
    // so Multiply can be judged (the map's lines must show through the washes).
    var pl = P.solid(mc, "Map plate", [0.85, 0.8, 0.68], MW, MH);
    var rp = NH.addFx(pl, ["ADBE Ramp", "Gradient Ramp"]);
    NH.setFx(rp, { "Start of Ramp": [MW / 2, 0], "Start Color": [0.9, 0.86, 0.74], "End of Ramp": [MW / 2, MH], "End Color": [0.7, 0.64, 0.5] });
    var ink = P.solid(mc, "Map lines", [0, 0, 0], MW, MH);
    var gr = NH.addFx(ink, ["ADBE Grid", "Grid"]);
    NH.setFx(gr, { "Anchor": [MW / 2, MH / 2], "Size From": 1, "Corner": [MW / 2 + MW / 14, MH / 2 + MW / 14], "Border": Math.max(2, MW / 700), "Color": [0.25, 0.2, 0.14], "Opacity": 100 });
  }
  var g = NH.grade(mc, "Map grade", 16, 224);
  rep.push(g.read);

  // Places, in plate pixels.
  var places = o.places || [];
  var P3 = [];
  for (i = 0; i < 3; i++) P3.push(places[i] || [NHM.PLACE_FRAC[i][0] * MW, NHM.PLACE_FRAC[i][1] * MH]);
  // Print sizes in plate pixels, from the share of the frame's width.
  var pw = [], ph = [];
  for (i = 0; i < 3; i++) { pw.push(NHM.PRINT_FRAC[i] * NH.W / k); ph.push(pw[i] * NHM.PRINT_ASPECT); }

  var H = null;
  if (o.highlights) H = NHM.highlights(mc, o, P3, pw, ph, rep);

  // Pinned prints, above the grade (and above the washes and border). Per place: print precomp, pin, null (top).
  var prints = [];
  if (o.prints !== false) {
    for (i = 0; i < 3; i++) prints.push(NHM.pinnedPrint(mc, o, i, P3[i], pw[i], rep));
  }
  return { mapComp: mc, mapLayer: ml, k: k, report: rep.join(" || "), prints: prints, highlights: H, places: P3, printW: pw };
};

// One instant print (photo-<i+1>.png, or a white card with a coloured window) in its own precomp, hung from its pin:
// anchor at the pin point, Rotation wiggle(.5,10); the pin and the print parented to one null on the place.
NHM.pinnedPrint = function (mc, o, i, place, pw, rep) {
  var name = NHM.PLACE_NAMES[i];
  var photo = NH.art(o.artDir, "photo-" + (i + 1) + ".png", o.artFolder);
  var w = Math.max(4, Math.round(pw));
  var h = photo ? Math.max(4, Math.round(w * photo.height / photo.width)) : Math.max(4, Math.round(w * NHM.PRINT_ASPECT));
  var pc = P.freshComp("nHh0 " + o.n + " print " + (i + 1), w, h, NH.FPS, mc.duration, [1, 1, 1]);
  if (photo) {
    var pl = pc.layers.add(photo);
    var s = w / photo.width * 100;
    P.tf(pl, "ADBE Scale").setValue([s, s]);
    P.tf(pl, "ADBE Position").setValue([w / 2, h / 2]);
  } else {
    var card = P.solid(pc, "Print card", [0.97, 0.97, 0.95], w, h);
    var mrg = (1 - NHM.WINDOW.w) / 2 * w;
    var win = P.solid(pc, "Photo", NHM.PHOTO_COLORS[i], Math.max(2, Math.round(NHM.WINDOW.w * w)), Math.max(2, Math.round(NHM.WINDOW.h * h - mrg)));
    P.tf(win, "ADBE Position").setValue([w / 2, mrg + (NHM.WINDOW.h * h - mrg) / 2]);
  }
  var pr = mc.layers.add(pc);
  pr.name = "Print " + name;
  var pinPt = [w / 2, NHM.PIN_Y * h];
  P.tf(pr, "ADBE Anchor Point").setValue(pinPt);       // SUBSTITUTE: the Pan Behind drag is the anchor set by script
  P.tf(pr, "ADBE Position").setValue(place);
  P.tf(pr, "ADBE Rotate Z").expression = "wiggle(.5,10)";
  // Pin: pin.png scaled to 11 % of the print's width, centred on the pin point (ASSUMED: the PNG's centre is the pin's
  // point), or a small red disc.
  var pinItem = NH.art(o.artDir, "pin.png", o.artFolder), pin;
  var pinW = NHM.PIN_FRAC * w;
  if (pinItem) {
    pin = mc.layers.add(pinItem);
    var ps = pinW / pinItem.width * 100;
    P.tf(pin, "ADBE Scale").setValue([ps, ps]);
  } else {
    var sh = NH.shapeLayer(mc, "pin", [0, 0]);
    P.ellipse(sh, [pinW, pinW]);
    NH.fill(sh, [0.85, 0.08, 0.08]);
    pin = sh.layer;
  }
  pin.name = "Pin " + name;
  P.tf(pin, "ADBE Position").setValue(place);
  var nl = mc.layers.addNull();
  nl.name = "Null " + name;
  P.tf(nl, "ADBE Position").setValue(place);
  pin.parent = nl;
  pr.parent = nl;
  rep.push(name + " print " + w + " x " + h + " plate px at " + NH.r1(place[0]) + ", " + NH.r1(place[1]) + (photo ? " (art)" : " (stand-in)"));
  return { print: pr, pin: pin, nul: nl, comp: pc };
};

// Recipe 15: border (Multiply, Trim End 13 -> 45 f, S-curve) just above the grade, then three cyan ovals (Multiply) above it.
NHM.highlights = function (mc, o, P3, pw, ph, rep) {
  var i;
  // Border outline in plate pixels: args.outline, or a rough stand-in polygon around North America.
  // Stand-in: about 3 NA print widths wide (recipe 15: outline 60 % of the view, print 19.7 %), height 0.54 x width,
  // vertex order from the top middle, west along the top, down the west coast, east along the Gulf, up the east coast.
  var outline = o.outline;
  if (!outline) {
    var W = 3.04 * pw[0], Hh = 0.54 * W;
    var x0 = P3[0][0] - 0.35 * W, y0 = P3[0][1] - 0.3 * Hh;  // ASSUMED: the NA pin sits at 35 %, 30 % of the outline box
    var U = [[0.55, 0.05], [0.3, 0.0], [0.05, 0.02], [0.0, 0.35], [0.04, 0.62], [0.25, 0.78], [0.45, 0.85], [0.62, 0.8],
      [0.78, 1.0], [0.82, 0.72], [0.95, 0.45], [1.0, 0.12], [0.8, 0.15], [0.65, 0.2]];
    outline = [];
    for (i = 0; i < U.length; i++) outline.push([x0 + U[i][0] * W, y0 + U[i][1] * Hh]);
  }
  var bx0 = outline[0][0], bx1 = outline[0][0], by0 = outline[0][1], by1 = outline[0][1];
  for (i = 1; i < outline.length; i++) {
    bx0 = Math.min(bx0, outline[i][0]); bx1 = Math.max(bx1, outline[i][0]);
    by0 = Math.min(by0, outline[i][1]); by1 = Math.max(by1, outline[i][1]);
  }
  var bw = o.borderWidth || (bx1 - bx0) / 20;   // the stroke is about 1/20 of the outline's width (recipe 15 layout)
  var bd = NH.shapeLayer(mc, "Border", [0, 0]);
  P.path(bd, outline, null, null, true);
  P.stroke(bd, NHM.MUSTARD, bw);
  var ti = NH.trim(bd);
  rep.push("border End " + NH.keys(NH.trimProp(bd, ti, "End"), [[13, 0], [45, 100]], NH.SCURVE));
  bd.layer.blendingMode = BlendingMode.MULTIPLY;
  rep.push("border box " + NH.r1(bx1 - bx0) + " x " + NH.r1(by1 - by0) + " plate px, stroke " + NH.r1(bw));
  // Ovals: args.washes [[x, y, diameter] x3], or stand-ins. NA oval 0.75 x the NA print width, at 57 %, 72 % of the
  // outline box (recipe 15 layout); Europe ASSUMED 0.8 x the NA oval (the NA copy was scaled up); Asia ASSUMED = NA.
  var washes = o.washes;
  if (!washes) {
    var dNA = 0.75 * pw[0];
    washes = [
      [bx0 + 0.57 * (bx1 - bx0), by0 + 0.716 * (by1 - by0), dNA],
      [P3[1][0] + 0.9 * pw[1], P3[1][1] + 0.9 * ph[1], 0.8 * dNA],   // ASSUMED: below right of the print, so it shows
      [P3[2][0] + 0.9 * pw[2], P3[2][1] + 0.9 * ph[2], dNA]
    ];
  }
  var ovals = [];
  for (i = 0; i < 3; i++) {
    var ov = NH.shapeLayer(mc, "TECH Wash " + NHM.PLACE_NAMES[i], [washes[i][0], washes[i][1]]);
    P.ellipse(ov, [washes[i][2], washes[i][2]]);
    NH.fill(ov, NHM.CYAN);
    ov.layer.blendingMode = BlendingMode.MULTIPLY;
    ovals.push(ov.layer);
  }
  return { border: bd.layer, ovals: ovals };
};

// Brief-driven map scene (art run for 14 and 15): every placement comes from the brief in plate pixels, nothing from
// the recipe's stand-in fractions. o: n, frames, artDir, artFolder, plateFile ("map-plate.png"), sceneScale (precomp
// Scale %, the whole scene as one group), focus ([x, y] plate px put at the frame centre) or framePos ([x, y]),
// printAnchor ([470, 70]), pinAnchor ([339, 725]), cardWidth (800, canvas px), prints ([{ file, pin: [x, y], scale,
// pinScale, name }]), highlights ({ outline, borderColor, borderWidth, washes: [[x, y, d]], washColor }) or null,
// collapse (default true: the scene and the prints render from their own pixels).
NHM.buildBrief = function (outer, o) {
  var rep = [], i;
  var plate = NH.art(o.artDir, o.plateFile || "map-plate.png", o.artFolder);
  if (!plate) throw new Error("NHM.buildBrief: no " + (o.plateFile || "map-plate.png") + " in " + o.artDir);
  var MW = plate.width, MH = plate.height;
  var mc = P.freshComp("nHh0 " + o.n + " map", MW, MH, NH.FPS, o.frames / NH.FPS, [0, 0, 0]);
  var S = (o.sceneScale || 43.2) / 100;
  var ml = outer.layers.add(mc);
  ml.name = "Map";
  if (o.collapse !== false) ml.collapseTransformation = true;
  P.tf(ml, "ADBE Scale").setValue([S * 100, S * 100]);
  var pos = o.framePos || (o.focus ? [NH.W / 2 - S * (o.focus[0] - MW / 2), NH.H / 2 - S * (o.focus[1] - MH / 2)] : [NH.W / 2, NH.H / 2]);
  P.tf(ml, "ADBE Position").setValue(pos);
  rep.push("plate " + MW + " x " + MH + " at " + NH.r1(S * 100) + " %, Position " + NH.r1(pos[0]) + ", " + NH.r1(pos[1]) +
    "; frame shows plate x " + NH.r1(MW / 2 - pos[0] / S) + "-" + NH.r1(MW / 2 + (NH.W - pos[0]) / S) + ", y " + NH.r1(MH / 2 - pos[1] / S) + "-" + NH.r1(MH / 2 + (NH.H - pos[1]) / S));

  var mp = mc.layers.add(plate);
  mp.name = "Map plate";
  var g = NH.grade(mc, "Map grade", 16, 224);
  rep.push(g.read);

  var H = null;
  if (o.highlights) H = NHM.briefHighlights(mc, o.highlights, rep);

  var prints = [], specs = o.prints || [], PA = o.printAnchor || [470, 70], NA = o.pinAnchor || [339, 725], cw = o.cardWidth || 800;
  for (i = 0; i < specs.length; i++) {
    var sp = specs[i], nm = sp.name || ("place " + (i + 1));
    var photo = NH.art(o.artDir, sp.file, o.artFolder);
    if (!photo) { rep.push("missing " + sp.file); continue; }
    // SUBSTITUTE: Precompose of the card alone is a precomp the size of the print canvas holding the PNG at 100 %.
    var pc = P.freshComp("nHh0 " + o.n + " print " + (i + 1), photo.width, photo.height, NH.FPS, mc.duration, [1, 1, 1]);
    var pl = pc.layers.add(photo);
    pl.name = sp.file;
    var pr = mc.layers.add(pc);
    pr.name = "Print " + nm;
    if (o.collapse !== false) pr.collapseTransformation = true;
    P.tf(pr, "ADBE Anchor Point").setValue(PA);            // SUBSTITUTE: the Pan Behind drag is the anchor set by script
    P.tf(pr, "ADBE Position").setValue(sp.pin);
    P.tf(pr, "ADBE Scale").setValue([sp.scale, sp.scale]);
    P.tf(pr, "ADBE Rotate Z").expression = "wiggle(.5,10)";
    var pinItem = NH.art(o.artDir, "pin.png", o.artFolder);
    var pin = mc.layers.add(pinItem);
    pin.name = "Pin " + nm;
    P.tf(pin, "ADBE Anchor Point").setValue(NA);
    P.tf(pin, "ADBE Position").setValue(sp.pin);
    P.tf(pin, "ADBE Scale").setValue([sp.pinScale, sp.pinScale]);
    var nl = mc.layers.addNull();
    nl.name = "Null " + nm;
    P.tf(nl, "ADBE Position").setValue(sp.pin);
    pin.parent = nl;
    pr.parent = nl;
    var fw = cw * sp.scale / 100 * S;
    var fp = [pos[0] + S * (sp.pin[0] - MW / 2), pos[1] + S * (sp.pin[1] - MH / 2)];
    rep.push(nm + ": card " + NH.r1(cw * sp.scale / 100) + " plate px = " + NH.r1(fw) + " frame px, pin point at frame " + NH.r1(fp[0]) + ", " + NH.r1(fp[1]));
    prints.push({ print: pr, pin: pin, nul: nl, comp: pc, frameWidth: fw, framePin: fp });
  }
  return { mapComp: mc, mapLayer: ml, scale: S, pos: pos, report: rep.join(" || "), prints: prints, highlights: H };
};

// Recipe 15 from the brief: border (closed path, round joins and caps, Multiply, Trim End 13 -> 45 f S-curve) above the
// grade, then the washes (Multiply) above it.
NHM.briefHighlights = function (mc, h, rep) {
  var i, bd = NH.shapeLayer(mc, "Border", [0, 0]);
  P.path(bd, h.outline, null, null, true);
  var si = P.stroke(bd, NH.color(h.borderColor, NHM.MUSTARD), h.borderWidth, 2);
  P.contents(bd).property(si).property("ADBE Vector Stroke Line Join").setValue(2);
  var ti = NH.trim(bd);
  rep.push("border End " + NH.keys(NH.trimProp(bd, ti, "End"), [[13, 0], [45, 100]], NH.SCURVE));
  bd.layer.blendingMode = BlendingMode.MULTIPLY;
  rep.push("border " + h.outline.length + " points, stroke " + h.borderWidth + " plate px, cap " +
    P.contents(bd).property(si).property("ADBE Vector Stroke Line Cap").value + " join " + P.contents(bd).property(si).property("ADBE Vector Stroke Line Join").value);
  var ovals = [], names = h.washNames || ["west lobe", "central valley", "south-east highlands"];
  for (i = 0; i < h.washes.length; i++) {
    var w = h.washes[i];
    var ov = NH.shapeLayer(mc, "TECH Wash " + (names[i] || (i + 1)), [w[0], w[1]]);
    P.ellipse(ov, [w[2], w[2]]);
    NH.fill(ov, NH.color(h.washColor, NHM.CYAN));
    ov.layer.blendingMode = BlendingMode.MULTIPLY;
    ovals.push(ov.layer);
  }
  return { border: bd.layer, ovals: ovals };
};
