// Bar chart (recipes 07, 08, 09) and pie (recipes 10, 11) for the nHh0NRo8G2U proofs. Loaded after nh-core-lib.jsx.
// Every figure below is the recipe's, in its 1920 x 1080 comp pixels; the scene's mapper `M` (NH.mapper) carries them
// into the tall frame. ExtendScript (ES3).
//
// VERIFY: a scripted "ADBE Vector Shape - Ellipse" starts at twelve o'clock and runs clockwise, so Trim End 0 -> 18 % sweeps the wedge from 12 to about 2 o'clock (recipe 10 step 8)
// VERIFY: Stroke Line Cap 1 = Butt (prelude: 1 butt, 2 round, 3 projecting)
// VERIFY: Grid display names "Anchor", "Size From", "Corner", "Border", "Color", "Opacity", "Blending Mode"; Size From 1 = Corner Point
// VERIFY: Grid "Blending Mode" 1 = None (lines only). The grid solid is black, so even Normal would look the same on the black ground
// VERIFY: layer.setTrackMatte(matte, TrackMatteType.ALPHA) (AE 2023+) and the matte still works with its video switched off
// VERIFY: Transform effect scale display name is "Scale" with Uniform Scale on ("Scale Height" tried second)
var NHC = {};

// ---------- bar chart (07) ----------
NHC.BASE = { x0: 657, x1: 1264, y: 735, width: 3 };            // recipe 07 step 2; width about 3 px (measured, never shown)
NHC.BAR_X = [724, 881, 1039, 1196.5];                         // centres, tallest (left) to shortest
NHC.BAR_TOP = [319.5, 462, 560, 708];
NHC.BAR_WIDTH = 60;
NHC.BAR_IN = [7, 17, 27, 37];                                  // layer in and first End key; 18-frame growth
NHC.BAR_FRAMES = 18;
NHC.LABEL_POS = [[628.1, 329.3], [628.1, 462.0], [629.0, 558.0], [628.1, 707.0]]; // right end of the baseline
NHC.LABEL_SIZE = 27;                                           // inferred from a 19 px capital
NHC.LABEL_DX = -113;                                           // enters 113 px left of its place
NHC.LABEL_FRAMES = 12;
NHC.YELLOW = [243 / 255, 190 / 255, 6 / 255];                  // swatch read; renders about 247,187,3
NHC.LABEL_COLOR = [0.97, 0.97, 0.97];
// ASSUMED: stand-in wording. The tutorial says "500 million", "350", "100", "5M" and shows "$500 M"-style figures;
// ours are our own until the art brief gives the value labels (args.values).
NHC.VALUES = ["$480 M", "$320 M", "$140 M", "$9 M"];

// Baseline, four bars, four labels, built bottom to top in the recipe's stack order.
// o: values, faces, animateBaseline (recipe 08); brief options: color (bars and baseline), labelColor, labelSize (recipe px).
// Returns { baseline, bars, labels, report, warn }.
NHC.barChart = function (c, M, o) {
  var values = o.values || NHC.VALUES, i, warn = [], rep = [];
  var YEL = NH.color(o.color, NHC.YELLOW), LCOL = NH.color(o.labelColor, NHC.LABEL_COLOR), LSIZE = o.labelSize || NHC.LABEL_SIZE;
  // Baseline: one open horizontal path, Butt cap (inferred), yellow.
  var bl = NH.shapeLayer(c, "Baseline", [0, 0]);
  P.path(bl, [M.pt(NHC.BASE.x0, NHC.BASE.y), M.pt(NHC.BASE.x1, NHC.BASE.y)], null, null, false);
  P.stroke(bl, YEL, M.len(NHC.BASE.width), 1);
  if (o.animateBaseline) {
    // Recipe 08: Trim Start 50 -> 0 and End 50 -> 100 over frames 0-12, S-curve on all four keys.
    var ti = NH.trim(bl);
    rep.push("baseline Start " + NH.keys(NH.trimProp(bl, ti, "Start"), [[0, 50], [12, 0]], NH.SCURVE));
    rep.push("baseline End " + NH.keys(NH.trimProp(bl, ti, "End"), [[0, 50], [12, 100]], NH.SCURVE));
  }
  // Bars: tallest lowest in the stack. Each path runs bottom -> top so Trim End grows it upwards.
  var bars = [];
  for (i = 0; i < 4; i++) {
    var b = NH.shapeLayer(c, "Bar " + (i + 1), [0, 0]);
    P.path(b, [M.pt(NHC.BAR_X[i], NHC.BASE.y), M.pt(NHC.BAR_X[i], NHC.BAR_TOP[i])], null, null, false);
    P.stroke(b, YEL, M.len(NHC.BAR_WIDTH), 1);
    var bt = NH.trim(b);
    var r = NH.keys(NH.trimProp(b, bt, "End"), [[NHC.BAR_IN[i], 0], [NHC.BAR_IN[i] + NHC.BAR_FRAMES, 100]], NH.SCURVE);
    if (i === 0) rep.push("bar 1 End " + r);
    NH.inPoint(b.layer, NHC.BAR_IN[i]);
    bars.push(b.layer);
  }
  // Labels: right-aligned point text, anchor at the right end of the baseline, slide in x only, same in-frames as the bars.
  var labels = [];
  for (i = 0; i < 4; i++) {
    var fin = M.pt(NHC.LABEL_POS[i][0], NHC.LABEL_POS[i][1]);
    var lab = NH.text(c, values[i], {
      size: M.len(LSIZE), color: LCOL, faces: o.faces, just: "right", anchor: "origin",
      pos: fin, name: "Label " + (i + 1)
    });
    var start = [fin[0] + M.len(NHC.LABEL_DX), fin[1]];
    var rl = NH.keys(P.tf(lab, "ADBE Position"), [[NHC.BAR_IN[i], start], [NHC.BAR_IN[i] + NHC.LABEL_FRAMES, fin]], NH.FASTIN);
    if (i === 0) rep.push("label 1 Position " + rl);
    NH.inPoint(lab, NHC.BAR_IN[i]);
    labels.push(lab);
    var w = NH.frameWarn(lab.name, NH.inkBox(lab, 60));
    if (w) warn.push(w);
  }
  return { baseline: bl.layer, bars: bars, labels: labels, report: rep.join(" || "), warn: warn,
    labelBoxes: NH.boxStr(NH.inkBox(labels[0], 60)) + " / " + NH.boxStr(NH.inkBox(labels[3], 60)) };
};

// ---------- grid clipped to the chart (09) ----------
// Matte rectangle then the Grid solid, both TECH, built before the chart so they sit under it (above Background).
NHC.gridUnderChart = function (c, M) {
  var mt = NH.shapeLayer(c, "TECH Grid matte", M.pt(960, 501));
  NH.rect(mt, [M.len(607), M.len(467)], [0, 0]);         // measured span; the shown size was 619 x 466
  NH.fill(mt, [1, 0, 1]);                                 // a loud fill; it never shows
  var g = P.solid(c, "TECH Grid", [0, 0, 0], c.width, c.height);
  g.name = "TECH Grid";
  var fx = NH.addFx(g, ["ADBE Grid", "Grid"]);
  NH.setFx(fx, {
    "Anchor": M.pt(960, 540), "Size From": 1, "Corner": M.pt(1004, 585), "Border": M.len(1),
    "Color": [0.71, 0.71, 0.71], "Opacity": 100, "Blending Mode": 1
  });
  g.setTrackMatte(mt.layer, TrackMatteType.ALPHA);
  mt.layer.enabled = false;
  return { grid: g, matte: mt.layer };
};

// ---------- pie (10) ----------
NHC.SLICE_COLOR = [0xFC / 255, 0xCE / 255, 0x02 / 255]; // #FCCE02
NHC.BASE_COLOR = [0xDA / 255, 0x87 / 255, 0xEF / 255];  // #DA87EF
NHC.SHARE = 18;                                           // percent
// One fat-stroked ring: Ellipse 127.9, Stroke 131 (wider than the ellipse, so it closes to a disc), Butt cap, Trim Paths.
NHC.ring = function (c, M, name, color) {
  var sh = NH.shapeLayer(c, name, M.pt(960, 540));
  P.ellipse(sh, [M.len(127.9), M.len(127.9)]);
  P.stroke(sh, color, M.len(131), 1);
  var ti = NH.trim(sh);
  return { sh: sh, trim: ti };
};
// Base (lilac, 82 %) under the slice (yellow, 18 %); both sweep on 0-24 f; the slice then pushes out 28-44 f.
// o: share; brief options: baseColor, sliceColor, finished (true: no keys, the pie sits swept and pushed out from frame 0).
NHC.pie = function (c, M, o) {
  o = o || {};
  var share = (o.share !== undefined) ? o.share : NHC.SHARE, rep = [];
  var base = NHC.ring(c, M, "base", NH.color(o.baseColor, NHC.BASE_COLOR));
  var slice = NHC.ring(c, M, "slice", NH.color(o.sliceColor, NHC.SLICE_COLOR));
  if (o.finished) {
    NH.trimProp(base.sh, base.trim, "Start").setValue(share);
    NH.trimProp(base.sh, base.trim, "End").setValue(100);
    NH.trimProp(slice.sh, slice.trim, "Start").setValue(0);
    NH.trimProp(slice.sh, slice.trim, "End").setValue(share);
    P.tf(slice.sh.layer, "ADBE Position").setValue(M.pt(980, 510));
    return { base: base.sh.layer, slice: slice.sh.layer, report: "finished (static)" };
  }
  rep.push("base Start " + NH.keys(NH.trimProp(base.sh, base.trim, "Start"), [[0, 0], [24, share]], NH.SCURVE));
  rep.push("base End " + NH.keys(NH.trimProp(base.sh, base.trim, "End"), [[0, 0], [24, 100]], NH.SCURVE));
  NH.trimProp(slice.sh, slice.trim, "Start").setValue(0);
  rep.push("slice End " + NH.keys(NH.trimProp(slice.sh, slice.trim, "End"), [[0, 0], [24, share]], NH.SCURVE));
  // Push along the wedge's centre line: +20, -30 (36 px at 34 degrees clockwise from up), keys about 28 -> 44 f.
  var rest = M.pt(960, 540), out = M.pt(980, 510);
  rep.push("slice Position " + NH.keys(P.tf(slice.sh.layer, "ADBE Position"), [[28, rest], [44, out]], NH.SCURVE));
  return { base: base.sh.layer, slice: slice.sh.layer, report: rep.join(" || ") };
};

// ---------- label rising word by word (11) ----------
// ASSUMED: stand-in wording (five words, the number first with its percent sign); the brief gives the pie label (args.pieLabel).
NHC.PIE_LABEL = "18% of all new homes";
// One text layer per word, each holding its word where it sat in the line (x from the line's own measured widths),
// rising 49 px over 16 f from frame 40, 2 frames apart, in-point at the first key. o: label, faces; brief options: size (recipe px), color.
NHC.wordLabel = function (c, M, o) {
  var words = (o.label || NHC.PIE_LABEL).split(" "), i, warn = [], rep = "";
  var line = M.pt(1090, 402);                     // left end of the line's baseline
  var opts = function (str, name) {
    return { size: M.len(o.size || 36.3), leading: M.len(30.4 * (o.size || 36.3) / 36.3), color: NH.color(o.color, [1, 1, 1]), faces: o.faces, just: "left", anchor: "origin", pos: line, name: name };
  };
  // Measure: the right ink edge of the words up to i in one line, and each word's own ink box, both at the line's start.
  var rights = [], own = [];
  for (i = 0; i < words.length; i++) {
    var pre = NH.text(c, words.slice(0, i + 1).join(" "), opts(words.slice(0, i + 1).join(" "), "measure"));
    var pr = pre.sourceRectAtTime(0, false);
    rights.push(pr.left + pr.width);
    pre.remove();
    var wl = NH.text(c, words[i], opts(words[i], "measure"));
    var wr = wl.sourceRectAtTime(0, false);
    own.push(wr.left + wr.width);
    wl.remove();
  }
  NH.fontLog = NH.fontLog.slice(0, NH.fontLog.length - 2 * words.length); // drop the measuring layers from the font report
  var layers = [], top = null;
  for (i = 0; i < words.length; i++) {
    var x = line[0] + rights[i] - own[i];
    var l = NH.text(c, words[i], opts(words[i], "Word " + (i + 1) + " " + words[i]));
    var f0 = 40 + 2 * i;
    var r = NH.keys(P.tf(l, "ADBE Position"), [[f0, [x, line[1] + M.len(49)]], [f0 + 16, [x, line[1]]]], NH.FASTIN);
    if (i === 0) rep = r;
    NH.inPoint(l, f0);
    // Reading order top to bottom in the stack: each later word goes under the earlier ones.
    if (top) l.moveAfter(top);
    top = l;
    layers.push(l);
  }
  var first = NH.inkBox(layers[0], 70), last = NH.inkBox(layers[layers.length - 1], 70);
  var lineBox = { left: first.left, top: Math.min(first.top, last.top), right: last.right, bottom: Math.max(first.bottom, last.bottom) };
  var w = NH.frameWarn("label line", lineBox);
  if (w) warn.push(w);
  return { layers: layers, report: "word 1 Position " + rep, warn: warn, lineBox: NH.boxStr(lineBox) };
};
// Recipe 11 step 8, optional finish: Posterize Time 12 and a Transform jitter (Scale 101 %, Position
// posterizeTime(6); wiggle(222, 3 px mapped)). Both TECH so a before frame can switch them off.
NHC.stopMotionFinish = function (c, M) {
  var pt = NH.posterize(c, "TECH Posterize Time", 12);
  var j = NH.adjust(c, "TECH Jitter");
  var tr = NH.addFx(j, ["ADBE Geometry2", "Transform"]);
  NH.setFx(tr, { "Scale|Scale Height": 101 });
  NH.fxProp(tr, "Position").expression = "posterizeTime(6); wiggle(222," + NH.r1(M.len(3)) + ")";
  j.moveBefore(pt);
  return { posterize: pt, jitter: j };
};
