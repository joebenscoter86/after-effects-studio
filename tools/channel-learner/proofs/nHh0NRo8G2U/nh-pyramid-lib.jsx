// Pyramid tiers that dip, then spread to reveal labels (recipe 12), for proofs 12 and 13. Loaded after nh-core-lib.jsx.
// Figures are the recipe's 1920 x 1080 comp pixels, carried into the tall frame by the scene's mapper M. ExtendScript (ES3).
//
// VERIFY: footage layers from args.artDir are the same canvas size and registered (recipe 12 ingredients); args.tierBox, if given, is the closed pyramid's box in art pixels [x0, y0, x1, y1]
// VERIFY: the inertial-bounce expression (recipe 12 step 6, decay 2.0 inferred) evaluates without error on a layer with no keys (the middle tier)
// VERIFY: Hue/Saturation "Master Saturation" and Levels "Input Black" / "Input White" / "Gamma" display names; Levels unit read from the fresh effect
var NHP = {};
NHP.BOUNCE = [
  "amp = .1;",
  "freq = 2.0;",
  "decay = 2.0;",
  "n = 0;",
  "if (numKeys > 0){ n = nearestKey(time).index; if (key(n).time > time){ n--; } }",
  "if (n == 0){ t = 0; } else { t = time - key(n).time; }",
  "if (n > 0 && t < 1){",
  "  v = velocityAtTime(key(n).time - thisComp.frameDuration/10);",
  "  value + v*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t);",
  "} else { value; }"
].join("\n");
// Closed pyramid box (measured) and the stand-in tiers' closed extents. The apex and base corners give the sides.
NHP.BOX = [351, 239, 1571, 840];
NHP.APEX = [961, 239];
// Stand-in tiers, closed: [stone top, stone bottom (= next tier's top), band bottom]. The band is the painted cut face,
// hidden by the tier below while closed. From the settled boxes minus each tier's move (top -225, base +221).
NHP.TIERS = {
  top: [239, 399, 483],
  middle: [399, 600, 663],
  base: [600, 840, 840]
};
NHP.STONE = [0.62, 0.60, 0.55];   // stand-in stone, graded to grey
NHP.BAND = [0.22, 0.22, 0.20];    // flat dark face; about level 44/255 after the grade (in 56/255 through Levels 27-196)
// ASSUMED: stand-in wording until the brief gives the level names (args.levels: [upper gap, lower gap]).
NHP.LEVELS = ["level 2", "level 1"];

NHP.halfWidth = function (y) {
  return (NHP.BOX[2] - NHP.BOX[0]) / 2 * (y - NHP.APEX[1]) / (NHP.BOX[3] - NHP.APEX[1]);
};
// A trapezoid (or the apex triangle) between y0 and y1, in layer space around the closed pyramid's registration point (960, 540).
NHP.slab = function (M, y0, y1) {
  var h0 = NHP.halfWidth(y0), h1 = NHP.halfWidth(y1), s = M.s;
  var v = function (x, y) { return [s * (x - 960), s * (y - 540)]; };
  if (h0 < 0.5) return [v(NHP.APEX[0], y0), v(NHP.APEX[0] + h1, y1), v(NHP.APEX[0] - h1, y1)];
  return [v(NHP.APEX[0] - h0, y0), v(NHP.APEX[0] + h0, y0), v(NHP.APEX[0] + h1, y1), v(NHP.APEX[0] - h1, y1)];
};
NHP.standInTier = function (c, M, name, ext) {
  var l = c.layers.addShape();
  l.name = name;
  P.tf(l, "ADBE Anchor Point").setValue([0, 0]);
  P.tf(l, "ADBE Position").setValue(M.pt(960, 540));
  if (ext[2] > ext[1]) NH.polyGroup(l, "cut face", NHP.slab(M, ext[1], ext[2]), NHP.BAND);
  NH.polyGroup(l, "stone", NHP.slab(M, ext[0], ext[1]), NHP.STONE);
  return { layer: l, rest: M.pt(960, 540) };
};
// An art tier scaled so the closed pyramid fills the mapped box (fit by width), its box centre on the mapped centre.
NHP.artTier = function (c, M, item, name, box) {
  var l = c.layers.add(item);
  l.name = name;
  var b = box || [0, 0, item.width, item.height];
  var tgt0 = M.pt(NHP.BOX[0], NHP.BOX[1]), tgt1 = M.pt(NHP.BOX[2], NHP.BOX[3]);
  var sc = (tgt1[0] - tgt0[0]) / (b[2] - b[0]) * 100;
  var rest = [(tgt0[0] + tgt1[0]) / 2, (tgt0[1] + tgt1[1]) / 2];
  P.tf(l, "ADBE Anchor Point").setValue([(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]);
  P.tf(l, "ADBE Scale").setValue([sc, sc]);
  P.tf(l, "ADBE Position").setValue(rest);
  return { layer: l, rest: rest, scale: sc };
};

// Build the whole recipe-12 scene into comp `c` (above whatever is already there).
// o: artDir, artFolder, tierBox, levels, faces. Returns { top, middle, base, labels, grade, report, warn, art }.
NHP.build = function (c, M, o) {
  var levels = o.levels || NHP.LEVELS, warn = [], rep = [], i;
  // Labels first so they sit below the tiers (step 7): "level 1" then "level 2" above it; centred, white, bold, lower case.
  var LP = o.labelPos || [[959, 327], [959.5, 759]];            // recipe px; default the centres of the measured boxes (upper gap, lower gap)
  var labelPos = [M.pt(LP[0][0], LP[0][1]), M.pt(LP[1][0], LP[1][1])];
  var labels = [];
  for (i = 1; i >= 0; i--) {
    var lab = NH.text(c, levels[i], { size: M.len(40), color: [1, 1, 1], faces: o.faces, just: "center", anchor: "ink", pos: labelPos[i], name: "Label " + levels[i] });
    NH.inPoint(lab, 17);
    labels.push(lab);
  }
  // Tiers, bottom of the stack first: top, middle, base (the stack reads base, middle, top from the top).
  var files = { top: "tier-top.png", middle: "tier-middle.png", base: "tier-base.png" };
  var names = ["top", "middle", "base"], T = {}, art = [], item;
  for (i = 0; i < 3; i++) {
    item = NH.art(o.artDir, files[names[i]], o.artFolder);
    if (item) { T[names[i]] = NHP.artTier(c, M, item, "Tier " + names[i], o.tierBox); art.push(files[names[i]]); }
    else T[names[i]] = NHP.standInTier(c, M, "Tier " + names[i], NHP.TIERS[names[i]]);
  }
  // Keys at 0, 13 and 35 f: a small opposite move (anticipation), then the spread. The middle tier has none.
  var off = function (r, dy) { return [r[0], r[1] + M.len(dy)]; };
  // Speed graph as shaped in step 5: key 1 out 0 px/s at 24.57 %; key 2 about 37.5 px/s each side; key 3 in about 30 px/s at 88 %.
  var ov = {
    "1": { outSpeed: 0, outInf: 24.57 },
    "2": { inSpeed: M.len(37.5), outSpeed: M.len(37.5) },
    "3": { inSpeed: M.len(30), inInf: 88 }
  };
  var rt = T.top.rest, rb = T.base.rest;
  rep.push("top " + NH.keys(P.tf(T.top.layer, "ADBE Position"), [[0, rt], [13, off(rt, 15)], [35, off(rt, -225)]], NH.SCURVE, ov));
  rep.push("base " + NH.keys(P.tf(T.base.layer, "ADBE Position"), [[0, rb], [13, off(rb, -19)], [35, off(rb, 221)]], NH.SCURVE, ov));
  for (i = 0; i < 3; i++) P.tf(T[names[i]].layer, "ADBE Position").expression = NHP.BOUNCE;
  // Grade on top: Hue/Saturation -100, Levels 27-196 (8-bit terms of the 16 bpc values shown).
  var g = NH.grade(c, "Grade", 27, 196);
  for (i = 0; i < labels.length; i++) {
    var w = NH.frameWarn(labels[i].name, NH.inkBox(labels[i], 40));
    if (w) warn.push(w);
  }
  return { top: T.top.layer, middle: T.middle.layer, base: T.base.layer, labels: labels, grade: g.layer,
    report: rep.join(" || ") + " || " + g.read, warn: warn, art: art.length ? art.join(", ") : "stand-in trapezoids" };
};
