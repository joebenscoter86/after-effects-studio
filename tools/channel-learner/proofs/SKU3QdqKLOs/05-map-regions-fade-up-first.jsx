// SKU3QdqKLOs technique 05: map regions that fade up one by one.
// A grey base map on an off-white ground; six region layers, each in its own saturated colour, sit over their grey
// counterparts and fade 0 -> 100 % opacity in turn (the finished example's stagger: in-points about 0, 0.50, 1.05,
// 1.50, 2.00 and 2.69 s), each with its numbered list row. Region names sit on always-visible label layers above.
// Portrait 1080 x 1920 for a phone: map on top, the six-row list re-laid as two columns of three below it.
//
// Art: pass args.artLib (art.jsx) and args.artDir (PROOF/05/art). If args.artDir is given, the script imports, as
// full-frame 1080 x 1920 PNGs with alpha centred in the comp: base-map.png and region-01.png ... region-06.png
// (required, in order of appearance), names.png and list-01.png ... list-06.png (optional; absent ones are skipped
// and listed in the return). Without args.artDir it builds stand-in shapes and type.
//
// VERIFY: font PostScript names "Montserrat-Bold", "Montserrat-Regular" are installed; substitutes are reported
// VERIFY: TextDocument.fontObject.isSubstitute exists (read guarded)
// VERIFY: setting layer.inPoint after the opacity keys leaves the keys where they are (layer startTime stays 0)
// VERIFY: match names ADBE Vector Group, ADBE Vectors Group, ADBE Vector Shape - Group, ADBE Vector Graphic - Fill, ADBE Vector Fill Color
// VERIFY: a footage layer added with comp.layers.add sits centred in the comp at 100 % scale (art mode)
//
// args.prelude (required). Optional: args.together (true = the tutorial's own build: every region fades at once over
// 0:00-1:01 and the list does not fade), args.fade (seconds, default 0.4), args.artLib, args.artDir, args.font, args.bodyFont.
$.evalFile(args.prelude);

// ---- local helpers (candidates for the prelude: rig, txt, bgSolid, fontCheck) ----
var FONT_WARN = [];
function fontCheck(layer) {
  var d = layer.property("ADBE Text Properties").property("ADBE Text Document").value;
  if (d.fontObject && d.fontObject.isSubstitute) FONT_WARN.push(layer.name + ": " + d.font + " is a substitute");
}
// Text with justification "L", "C" or "R"; the anchor sits on the text's bounds at that side, vertically centred.
function txt(c, str, o) {
  var l = c.layers.addText(str);
  var prop = l.property("ADBE Text Properties").property("ADBE Text Document");
  var d = prop.value;
  d.resetCharStyle();
  d.fontSize = o.size;
  d.fillColor = o.color;
  d.applyFill = true;
  d.applyStroke = false;
  if (o.font) d.font = o.font;
  if (o.tracking !== undefined) d.tracking = o.tracking;
  d.justification = o.just === "L" ? ParagraphJustification.LEFT_JUSTIFY : (o.just === "R" ? ParagraphJustification.RIGHT_JUSTIFY : ParagraphJustification.CENTER_JUSTIFY);
  prop.setValue(d);
  if (o.name) l.name = o.name;
  var r = l.sourceRectAtTime(0, false);
  var ax = o.just === "L" ? r.left : (o.just === "R" ? r.left + r.width : r.left + r.width / 2);
  P.tf(l, "ADBE Anchor Point").setValue([ax, r.top + r.height / 2]);
  P.tf(l, "ADBE Position").setValue(o.pos);
  fontCheck(l);
  return l;
}
// Remove unused solids of this exact name left by earlier runs, then add a full-frame one at the bottom.
function bgSolid(c, name, color) {
  var i, it;
  for (i = app.project.numItems; i >= 1; i--) {
    it = app.project.item(i);
    if (it instanceof FootageItem && it.name === name && it.mainSource instanceof SolidSource && it.usedIn.length === 0) it.remove();
  }
  var s = P.solid(c, name, color);
  s.moveToEnd();
  return s;
}
// A shape layer in comp pixels (position 0,0); polyGroup adds one filled closed polygon as its own group.
function shapeLayer(c, name) {
  var l = c.layers.addShape();
  l.name = name;
  P.tf(l, "ADBE Position").setValue([0, 0]);
  return l;
}
function polyGroup(l, verts, color) {
  var g = l.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
  var gi = g.propertyIndex;
  var p = l.property("ADBE Root Vectors Group").property(gi).property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Group");
  var pi = p.propertyIndex;
  var s = new Shape();
  s.vertices = verts;
  s.closed = true;
  l.property("ADBE Root Vectors Group").property(gi).property("ADBE Vectors Group").property(pi).property("ADBE Vector Shape").setValue(s);
  var f = l.property("ADBE Root Vectors Group").property(gi).property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill");
  var fi = f.propertyIndex;
  l.property("ADBE Root Vectors Group").property(gi).property("ADBE Vectors Group").property(fi).property("ADBE Vector Fill Color").setValue(color);
  return gi;
}
function circleLayer(c, name, center, d, color) {
  var sh = P.shape(c, name);
  P.ellipse(sh, [d, d]);
  var f = P.contents(sh).addProperty("ADBE Vector Graphic - Fill");
  P.contents(sh).property(f.propertyIndex).property("ADBE Vector Fill Color").setValue(color);
  P.tf(sh.layer, "ADBE Position").setValue(center);
  return sh.layer;
}
var FADED = [];
function fadeUp(l, t, len) {
  var op = P.tf(l, "ADBE Opacity");
  op.setValueAtTime(t, 0);
  op.setValueAtTime(t + len, 100);
  op.setInterpolationTypeAtKey(1, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
  op.setInterpolationTypeAtKey(2, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
  if (t > 0) l.inPoint = t; // the finished example staggers by in-point; the keys keep their comp times
  FADED.push(l.name + " @" + t);
}
function rgb(r, g, b) { return [r / 255, g / 255, b / 255, 1]; }

// ---- build ----
var W = 1080, H = 1920, FPS = 24, DUR = 5;
var GROUND = [251 / 255, 251 / 255, 251 / 255];
var TOGETHER = !!args.together;
var FADE = TOGETHER ? 25 / 24 : (args.fade || 0.4);      // build: 0 -> 100 over 0:00-0:01:01; example: ASSUMED 0.4 s
var TIMES = TOGETHER ? [0, 0, 0, 0, 0, 0] : [0, 0.50, 1.05, 1.50, 2.00, 2.69];
// Order of appearance and colours as rendered in the recording (typed values unknown): amber, orange, coral, navy, sky blue, light cyan.
var COLORS = [rgb(255, 175, 7), rgb(255, 125, 0), rgb(236, 88, 83), rgb(0, 75, 127), rgb(42, 166, 228), rgb(90, 197, 218)];
var NAMES = ["NORVA", "ESTREL", "KALDOR", "MIRREN", "OSTARA", "VALEN"]; // our own invented region names
var c = P.freshComp("SKU3 05 map", W, H, FPS, DUR, GROUND);
bgSolid(c, "SKU3 05 background", GROUND);

// List geometry (comp pixels from the 1080-high measurements): circles 86 px across, rows 170 px apart.
// Landscape had one column of six down the left third; portrait has two columns of three under the map.
var LIST_Y0 = 1370, ROW = 170, COL_X = [110, 590], CIRCLE = 86;
function rowPos(k) { return [COL_X[Math.floor(k / 3)], LIST_Y0 + (k % 3) * ROW]; }

// Stand-in map geometry: a jittered grid of 12 "countries", 3 across and 4 down, sharing their borders.
var X = [90, 390, 690, 990], Y = [190, 440, 690, 940, 1190];
function jit(x, y) { return [x + 38 * Math.sin(x * 0.021 + y * 0.013), y + 34 * Math.cos(x * 0.017 - y * 0.023)]; }
function mid(a, b) { return jit((a[0] + b[0]) / 2 + 0.5, (a[1] + b[1]) / 2 + 0.5); }
function cell(col, row) {
  var a = jit(X[col], Y[row]), b = jit(X[col + 1], Y[row]), d = jit(X[col + 1], Y[row + 1]), e = jit(X[col], Y[row + 1]);
  return [a, mid([X[col], Y[row]], [X[col + 1], Y[row]]), b, mid([X[col + 1], Y[row]], [X[col + 1], Y[row + 1]]),
          d, mid([X[col], Y[row + 1]], [X[col + 1], Y[row + 1]]), e, mid([X[col], Y[row]], [X[col], Y[row + 1]])];
}
function centroid(v) { var sx = 0, sy = 0, j; for (j = 0; j < v.length; j++) { sx += v[j][0]; sy += v[j][1]; } return [sx / v.length, sy / v.length]; }
var i, k, regionLayers = [], rowLayers = [], missing = [];

if (args.artDir) {
  // ---- art mode ----
  $.evalFile(args.artLib);
  var DIR = args.artDir, FOLDER = "art 05";
  var base = c.layers.add(ART.footage(DIR, "base-map.png", FOLDER));
  base.name = "base map";
  for (k = 0; k < 6; k++) {
    var rl = c.layers.add(ART.footage(DIR, "region-0" + (k + 1) + ".png", FOLDER));
    rl.name = "region " + (k + 1);
    regionLayers.push(rl);
  }
  if (new File(DIR + "/names.png").exists) { c.layers.add(ART.footage(DIR, "names.png", FOLDER)).name = "names"; } else missing.push("names.png");
  for (k = 0; k < 6; k++) {
    var f = "list-0" + (k + 1) + ".png";
    if (new File(DIR + "/" + f).exists) {
      var ll = c.layers.add(ART.footage(DIR, f, FOLDER));
      ll.name = "list row " + (k + 1);
      rowLayers.push([ll]);
    } else { missing.push(f); rowLayers.push([]); }
  }
} else {
  // ---- stand-in map ----
  // Which cell each region is (index = row * 3 + col), in order of appearance.
  var REGION_CELL = [8, 9, 4, 2, 6, 0];
  var baseL = shapeLayer(c, "base map"), g;
  for (i = 0; i < 12; i++) {
    g = 210 + (i * 7) % 12; // greys 210-221, regions differ slightly
    polyGroup(baseL, cell(i % 3, Math.floor(i / 3)), rgb(g, g, g));
  }
  for (k = 0; k < 6; k++) {
    var reg = shapeLayer(c, "region " + (k + 1));
    polyGroup(reg, cell(REGION_CELL[k] % 3, Math.floor(REGION_CELL[k] / 3)), COLORS[k]);
    regionLayers.push(reg);
  }
  // Names: always visible, above the regions. White on the six regions, small dark grey on the other countries.
  for (i = 0; i < 12; i++) {
    var ri = -1;
    for (k = 0; k < 6; k++) if (REGION_CELL[k] === i) ri = k;
    var cc = centroid(cell(i % 3, Math.floor(i / 3)));
    if (ri >= 0) txt(c, NAMES[ri], { size: 30, color: [1, 1, 1], font: args.font || "Montserrat-Bold", tracking: 60, just: "C", pos: cc, name: "name " + NAMES[ri] });
    else txt(c, "COUNTRY", { size: 20, color: [0.4, 0.4, 0.42], font: args.bodyFont || "Montserrat-Regular", tracking: 60, just: "C", pos: cc, name: "name grey " + (i + 1) });
  }
  // Numbered list rows: circle and title in the region's colour, number in white, two grey placeholder lines.
  for (k = 0; k < 6; k++) {
    var rp = rowPos(k), row = [];
    row.push(circleLayer(c, "list " + (k + 1) + " circle", rp, CIRCLE, COLORS[k]));
    row.push(txt(c, "0" + (k + 1), { size: 32, color: [1, 1, 1], font: args.font || "Montserrat-Bold", just: "C", pos: rp, name: "list " + (k + 1) + " number" }));
    row.push(txt(c, NAMES[k], { size: 32, color: COLORS[k].slice(0, 3), font: args.font || "Montserrat-Bold", tracking: 40, just: "L", pos: [rp[0] + 70, rp[1] - 24], name: "list " + (k + 1) + " title" }));
    row.push(txt(c, "Placeholder line of copy\rand a second short line", { size: 22, color: [0.55, 0.55, 0.58], font: args.bodyFont || "Montserrat-Regular", just: "L", pos: [rp[0] + 70, rp[1] + 22], name: "list " + (k + 1) + " text" }));
    rowLayers.push(row);
  }
}

// ---- the technique: opacity fades, staggered in order of appearance ----
var j;
for (k = 0; k < 6; k++) {
  fadeUp(regionLayers[k], TIMES[k], FADE);
  if (!TOGETHER) for (j = 0; j < rowLayers[k].length; j++) fadeUp(rowLayers[k][j], TIMES[k], FADE); // the build's list does not fade
}

return { comp: c.name, id: c.id, layers: c.numLayers, mode: args.artDir ? "art" : "stand-in", together: TOGETHER,
  fade: FADE, artMissing: missing.join(", "), faded: FADED.length, fontWarnings: FONT_WARN.join("; ") };
