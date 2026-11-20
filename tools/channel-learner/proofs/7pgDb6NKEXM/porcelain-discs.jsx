// Shared scene for 08 and 09: the "Porcelain" plate (art from PROOF/08/art) with staggered disc pairs.
// Loaded after prelude.jsx and art.jsx. ExtendScript (ES3).
// VERIFY: CC Radial Fast Blur match name "CC Radial Fast Blur"; params "Center", "Amount", "Zoom" (Standard = 1?).
// VERIFY: the radial blur Center in this layer setup (anchor = disc centre = 960,540 in layer space) scales with the layer.
// VERIFY: Gradient Fill default stops white -> black, start point = white; Tint maps them to #D7E0E4 / #F1F6F8.
// VERIFY: Bevel and Emboss by app.executeCommand(9004) on selected layers, comp open in the viewer; its property names and
//         the enum values for Highlight Mode / Shadow Mode = Screen (resolved at run time, see PD.bevel).
// SUBSTITUTE: Gradient Overlay (colour stops not scriptable) -> shape Gradient Fill (white to black, 40 deg, across the disc's box)
//             followed by Tint mapping black to #D7E0E4 and white to #F1F6F8. Same picture, and it scales with the disc.
var PD = {};
PD.W = 1920; PD.H = 1080; PD.FPS = 23.976;
PD.INK = [0x14 / 255, 0x14 / 255, 0x16 / 255];
PD.R = 450;           // disc radius at 100 % (diameter 0.84 H)
PD.END = 265;         // scale at the end key (inferred in the recipe)
PD.subs = [];

PD.disc = function (comp, name, black) {
  var l = comp.layers.addShape();
  l.name = name;
  l.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
  var cont = l.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group");
  cont.addProperty("ADBE Vector Shape - Ellipse");
  cont.property(1).property("ADBE Vector Ellipse Size").setValue([2 * PD.R, 2 * PD.R]);
  cont.property(1).property("ADBE Vector Ellipse Position").setValue([960, 540]);
  if (black) {
    cont.addProperty("ADBE Vector Graphic - Fill");
    cont.property(2).property("ADBE Vector Fill Color").setValue([0, 0, 0]);
  } else {
    cont.addProperty("ADBE Vector Graphic - G-Fill");
    var g = cont.property(2);
    var a = 40 * Math.PI / 180, k = PD.R * (Math.cos(a) + Math.sin(a));
    g.property("ADBE Vector Grad Start Pt").setValue([960 - k * Math.cos(a), 540 + k * Math.sin(a)]);
    l.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property(2).property("ADBE Vector Grad End Pt").setValue([960 + k * Math.cos(a), 540 - k * Math.sin(a)]);
  }
  P.tf(l, "ADBE Anchor Point").setValue([960, 540]);
  P.tf(l, "ADBE Position").setValue([960, 540]);
  return l;
};

PD.grow = function (l, t0) {
  var s = P.tf(l, "ADBE Scale");
  s.setValueAtTime(t0, [0, 0]);
  s.setValueAtTime(t0 + 5.0, [PD.END, PD.END]);
  s.setInterpolationTypeAtKey(1, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
  s.setInterpolationTypeAtKey(2, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
};

PD.text = function (comp, str, font, size, tracking, baseline, name) {
  var l = comp.layers.addText(str);
  var prop = l.property("ADBE Text Properties").property("ADBE Text Document");
  var d = prop.value;
  d.resetCharStyle();
  d.font = font; d.fontSize = size; d.fillColor = PD.INK; d.applyFill = true; d.applyStroke = false;
  d.tracking = tracking; d.justification = ParagraphJustification.CENTER_JUSTIFY;
  prop.setValue(d);
  var back = l.property("ADBE Text Properties").property("ADBE Text Document").value, fo = null;
  try { fo = back.fontObject; } catch (e) { fo = null; }
  if (back.font !== font || (fo && fo.isSubstitute)) PD.subs.push(name + ": asked " + font + ", got " + back.font);
  P.tf(l, "ADBE Anchor Point").setValue([0, 0]);
  P.tf(l, "ADBE Position").setValue([960, baseline]);
  l.name = name;
  return l;
};

// Set every property of a layer-style group by display name; enum modes passed as numbers.
PD.setByName = function (grp, values) {
  var miss = [], k, j, f;
  for (k in values) {
    f = false;
    for (j = 1; j <= grp.numProperties; j++) if (grp.property(j).name === k) { grp.property(j).setValue(values[k]); f = true; break; }
    if (!f) miss.push(k);
  }
  return miss;
};

PD.build = function (name, dur, starts, artDir, screenMode) {
  var c = P.freshComp(name, PD.W, PD.H, PD.FPS, dur, [0.92, 0.94, 0.95]);
  var bg = c.layers.add(ART.footage(artDir, "background.png", "art 08"));
  bg.name = "Background";
  var tops = [], i, b, t;
  for (i = 0; i < starts.length; i++) {
    b = PD.disc(c, "disc " + (i + 1) + " bottom", true);
    var rb = P.effect(b, "CC Radial Fast Blur");
    var m1 = ART.setFx(rb, { "Center": [-13.6, 569.2], "Amount": 95 });
    if (m1.length) throw new Error("radial blur params: " + m1.join(", "));
    var gb = P.effect(b, "ADBE Gaussian Blur 2");
    var m2 = ART.setFx(gb, { "Blurriness": 72.6, "Repeat Edge Pixels": 1 });
    if (m2.length) throw new Error("gaussian params: " + m2.join(", "));
    P.tf(b, "ADBE Opacity").setValue(20);
    PD.grow(b, starts[i]);
    t = PD.disc(c, "disc " + (i + 1) + " top", false);
    var tn = P.effect(t, "ADBE Tint");
    var m3 = ART.setFx(tn, { "Map Black To": [0xD7 / 255, 0xE0 / 255, 0xE4 / 255], "Map White To": [0xF1 / 255, 0xF6 / 255, 0xF8 / 255], "Amount to Tint": 100 });
    if (m3.length) throw new Error("tint params: " + m3.join(", "));
    PD.grow(t, starts[i]);
    tops.push(t);
  }
  // Bevel and Emboss on every top by menu command (opens no dialog).
  c.openInViewer();
  for (i = 1; i <= c.numLayers; i++) c.layer(i).selected = false;
  for (i = 0; i < tops.length; i++) tops[i].selected = true;
  app.executeCommand(9004);
  var bevelMiss = [];
  for (i = 0; i < tops.length; i++) {
    var ls = tops[i].property("ADBE Layer Styles");
    var bev = null, j;
    for (j = 1; j <= ls.numProperties; j++) if (ls.property(j).name === "Bevel and Emboss") bev = ls.property(j);
    if (!bev) throw new Error("no Bevel and Emboss on " + tops[i].name);
    var vals = { "Depth": 100, "Size": 5, "Soften": 0, "Use Global Light": 0, "Angle": 120, "Altitude": 30,
      "Highlight Color": [1, 1, 1], "Highlight Opacity": 100, "Shadow Color": [1, 1, 1], "Shadow Opacity": 100 };
    if (screenMode) { vals["Highlight Mode"] = screenMode; vals["Shadow Mode"] = screenMode; }
    bevelMiss = PD.setByName(bev, vals);
    tops[i].selected = false;
  }
  // Type and icon from the brief (a ready-made graphic in the recipe: static, faded in at 3 s).
  var icon = c.layers.add(ART.footage(artDir, "bowls-icon.png", "art 08"));
  icon.name = "Bowls Icon";
  P.tf(icon, "ADBE Scale").setValue([57, 57]);
  P.tf(icon, "ADBE Position").setValue([960, 0.293 * PD.H]);
  var type = [icon,
    PD.text(c, "Porcelain", "InstrumentSerif-Regular", 275, 7, 0.56 * PD.H, "Title"),
    PD.text(c, "A STUDY OF LIGHT ON WHITE", "Jost-Regular", 37, 320, 0.655 * PD.H, "Subline"),
    PD.text(c, "HALL THREE   ·   14 MARCH – 2 JUNE", "Jost-Regular", 21, 300, 0.85 * PD.H, "Bottom line")];
  for (i = 0; i < type.length; i++) {
    var op = P.tf(type[i], "ADBE Opacity");
    op.setValueAtTime(3.0, 0);
    op.setValueAtTime(3.5, 100);
  }
  return { comp: c, type: type, bevelMiss: bevelMiss };
};

PD.ellipseMask = function (layer, cx, cy, r) {
  layer.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
  var m = layer.property("ADBE Mask Parade").property(1);
  var k = 0.5523 * r, s = new Shape();
  s.vertices = [[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy]];
  s.inTangents = [[-k, 0], [0, -k], [k, 0], [0, k]];
  s.outTangents = [[k, 0], [0, k], [-k, 0], [0, -k]];
  s.closed = true;
  m.property("ADBE Mask Shape").setValue(s);
  return m;
};
