// Technique 24: keep a scaled-up precomp of vector art crisp with the Collapse Transformations switch.
// A precomp "24 error dialog" built only from shape and text layers (black title bar, grey panel, X icon, FIX button)
// is placed in the main comp and pushed in from 100% to 2050% on the FIX button; the precomp layer's
// collapse/continuously rasterize switch makes the vectors redraw at that size instead of being enlarged as pixels.
// The technique is a layer switch, not a layer, so nothing is named TECH: for the "before" frame run with
// args.sharp = false (or set the "dialog" layer's collapseTransformation to false and back to true afterwards).
// Judge at about 4.5 s, where the scale holds at 2050%.
//
// VERIFY: layer.collapseTransformation is the scripting name of the sunburst switch on a precomp layer.
// VERIFY: items.addComp adds the precomp to the project and layers.add(compItem) places it as a precomp layer.
// VERIFY: the FIX button's centre in the precomp lands where expected (text anchors are centred by P.text); adjust ANCHOR if the zoom misses the letters.
// VERIFY: shape Rect and Fill match names as in 22.
$.evalFile(args.prelude);
// Rebuild with artwork (2026-11-14): art from PROOF/24/art (brief.md). Pass args.artLib (art.jsx) and args.artDir.
// Main comp: Desktop (wallpaper.png 71.5 %), three desktop icons with labels, and the dialog precomp (Collapse
// Transformations on) with a hard 8 px retro shadow. The precomp is all vector: bevelled grey panel, black title bar
// "System Notice", the error badge redrawn as a shape layer from icon-error.svg (so it stays sharp at any scale),
// message "CANNOT CONTINUE" / "FIX" "THE ERROR", bevelled OK button. Wide hold for 1 s, then a dive to 2050 % at 5.2 s
// (eased in log space, so the zoom feels even), then a slow 1.2 %/s creep to the end so it never stops dead.
// The position is driven so the dive is a pure zoom about one screen point and lands with the anchor (on FIX) at the
// comp centre, as the layout measures.
$.evalFile(args.artLib);
var ARTDIR = args.artDir;

function grp(layer, name) {
  var g = layer.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
  g.name = name;
  return layer.property("ADBE Root Vectors Group").property(g.propertyIndex).property("ADBE Vectors Group");
}
function gRect(layer, name, size, pos, fill) {
  var c = grp(layer, name);
  var r = c.addProperty("ADBE Vector Shape - Rect");
  r = c.property(r.propertyIndex);
  r.property("ADBE Vector Rect Size").setValue(size);
  r.property("ADBE Vector Rect Position").setValue(pos);
  var f = c.addProperty("ADBE Vector Graphic - Fill");
  c.property(f.propertyIndex).property("ADBE Vector Fill Color").setValue(fill);
  return c;
}
function gPath(layer, name, verts, ins, outs, closed, fill, stroke, sw, cap) {
  var c = grp(layer, name);
  var p = c.addProperty("ADBE Vector Shape - Group");
  var s = new Shape(); s.vertices = verts; if (ins) s.inTangents = ins; if (outs) s.outTangents = outs; s.closed = !!closed;
  c.property(p.propertyIndex).property("ADBE Vector Shape").setValue(s);
  if (stroke) {
    var st = c.addProperty("ADBE Vector Graphic - Stroke"); st = c.property(st.propertyIndex);
    st.property("ADBE Vector Stroke Color").setValue(stroke); st.property("ADBE Vector Stroke Width").setValue(sw);
    if (cap) st.property("ADBE Vector Stroke Line Cap").setValue(cap);
  }
  if (fill) { var f = c.addProperty("ADBE Vector Graphic - Fill"); c.property(f.propertyIndex).property("ADBE Vector Fill Color").setValue(fill); }
  return c;
}
function gEllipse(layer, name, size, pos, fill, stroke, sw) {
  var c = grp(layer, name);
  var e = c.addProperty("ADBE Vector Shape - Ellipse"); e = c.property(e.propertyIndex);
  e.property("ADBE Vector Ellipse Size").setValue(size); e.property("ADBE Vector Ellipse Position").setValue(pos);
  if (stroke) {
    var st = c.addProperty("ADBE Vector Graphic - Stroke"); st = c.property(st.propertyIndex);
    st.property("ADBE Vector Stroke Color").setValue(stroke); st.property("ADBE Vector Stroke Width").setValue(sw);
  }
  var f = c.addProperty("ADBE Vector Graphic - Fill"); c.property(f.propertyIndex).property("ADBE Vector Fill Color").setValue(fill);
  return c;
}
// An empty shape layer drawn in its comp's coordinates.
function canvas(comp, name) {
  var l = comp.layers.addShape(); l.name = name;
  P.tf(l, "ADBE Anchor Point").setValue([0, 0]); P.tf(l, "ADBE Position").setValue([0, 0]);
  return l;
}
function pickFont(list) {
  var i, fo;
  for (i = 0; i < list.length; i++) {
    try { fo = app.fonts.getFontsByPostScriptName(list[i]); if (fo.length && !fo[0].isSubstitute) return list[i]; } catch (e) {}
  }
  return list[list.length - 1];
}
// Bevel: light on top and left, dark on bottom and right, 1 px, as two open paths.
function bevel(layer, name, x0, y0, x1, y1, inset) {
  var L = ART.hex("#FFFFFF"), D = ART.hex("#6E6E6E");
  gPath(layer, name + " dark", [[x0 + 0.5, y1 - 0.5], [x1 - 0.5, y1 - 0.5], [x1 - 0.5, y0 + 0.5]], null, null, false, null, inset ? L : D, 1, 1);
  gPath(layer, name + " light", [[x0 + 0.5, y1 - 0.5], [x0 + 0.5, y0 + 0.5], [x1 - 0.5, y0 + 0.5]], null, null, false, null, inset ? D : L, 1, 1);
}

// Run: 560 x 260 left a wide empty right half (the message ends at 330 px); 440 x 240 fits it with even margins.
var PW = 440, PH = 240, DUR = args.dur || 6, T0 = 1, T1 = 5.2;
var pre = P.freshComp("24 error dialog", PW, PH, 24, DUR, [0, 0, 0]);
var GREY = ART.hex("#C0C0C0");

// Panel with its bevel.
var panel = canvas(pre, "Panel");
bevel(panel, "bevel", 0, 0, PW, PH, false);
gRect(panel, "face", [PW, PH], [PW / 2, PH / 2], GREY);

// Title bar.
var bar = canvas(pre, "Title bar");
gRect(bar, "bar", [PW - 6, 26], [PW / 2, 3 + 13], ART.hex("#111111"));
var TFONT = pickFont(["SpaceMono-Bold", "Courier-Bold"]);
var title = P.text(pre, "System Notice", { size: 18, font: TFONT, color: [1, 1, 1], name: "Title" });
var trr = title.sourceRectAtTime(0, false);
P.tf(title, "ADBE Position").setValue([12 + trr.width / 2, 16]);

// Error icon redrawn from icon-error.svg (1024 viewBox), scaled so it is 48 px tall.
var icon = canvas(pre, "Error icon");
gPath(icon, "highlight", [[111, 356], [387, 112]], [[0, 0], [-123, 27]], [[36, -121], [0, 0]], false, null, [1, 1, 1], 48, 2);
gPath(icon, "white x", [[303, 227], [483, 409], [667, 228], [762, 324], [579, 506], [756, 686], [658, 784], [480, 604], [300, 784], [202, 684], [385, 507], [203, 325]],
  null, null, true, [1, 1, 1], null, 0);
gEllipse(icon, "red disc", [910, 930], [469, 493], ART.hex("#E8141B"), [0, 0, 0], 26);
gEllipse(icon, "hard shadow", [910, 930], [503, 522], [0, 0, 0]);
var IS = 100 * 48 / 970;
P.tf(icon, "ADBE Anchor Point").setValue([486, 507]);
P.tf(icon, "ADBE Scale").setValue([IS, IS]);
P.tf(icon, "ADBE Position").setValue([62, 112]);

// Message, sized from the layout divided by the 2050 % scale (as in the plain build).
var K = 20.5;
var CAP = 0.45 * 1080 / K, FIXW = (0.55 - 0.105) * 1920 / K, GAP = 0.116 * 1920 / K, LEAD = 0.61 * 1080 / K;
var FONT = pickFont([args.font || "ArialNarrow-Bold", "ArialNarrow", "HelveticaNeue-CondensedBold", "Arial-BoldMT"]);
var probe = P.text(pre, "FIX", { size: 100, font: FONT, color: [0, 0, 0], name: "probe" });
var pr = probe.sourceRectAtTime(0, false);
var FS = 100 * CAP / pr.height;
var pd = probe.property("ADBE Text Properties").property("ADBE Text Document");
var pdoc = pd.value; pdoc.fontSize = FS; pd.setValue(pdoc);
pr = probe.sourceRectAtTime(0, false);
var TRK = Math.round((FIXW - pr.width) / 2 * 1000 / FS);
probe.remove();
function lineAt(str, left, base, name) {
  var l = P.text(pre, str, { size: FS, font: FONT, color: [0, 0, 0], tracking: TRK, name: name });
  var r = l.sourceRectAtTime(0, false);
  P.tf(l, "ADBE Position").setValue([left + r.width / 2, base - r.height / 2]);
  return { layer: l, w: r.width, h: r.height, cx: left + r.width / 2, cy: base - r.height / 2 };
}
var MX = 112, BASE = 140;
var fixT = lineAt("FIX", MX, BASE, "Message FIX");
var restT = lineAt("THE ERROR", MX + fixT.w + GAP, BASE, "Message line 2");
var l1 = lineAt("CANNOT CONTINUE", MX, BASE - LEAD, "Message line 1");

// OK button, bevelled.
var btn = canvas(pre, "OK button");
bevel(btn, "bevel", PW / 2 - 44, 184, PW / 2 + 44, 216, false);
gRect(btn, "face", [88, 32], [PW / 2, 200], GREY);
var ok = P.text(pre, "OK", { size: 18, font: FONT, color: [0, 0, 0], pos: [PW / 2, 200], name: "OK label" });

// Main comp.
var CW = 1920, CH = 1080;
var c = P.freshComp("24 sharp scaled precomp", CW, CH, 24, DUR, ART.hex("#2A9D8F"));
var desk = c.layers.add(ART.footage(ARTDIR, "wallpaper.png", "art 24"));
desk.name = "Desktop";
P.tf(desk, "ADBE Scale").setValue([71.5, 71.5]);

var LFONT = pickFont(["SpaceMono-Bold", "Courier-Bold"]);
var icons = [["icon-folder.png", "Icon folder", "Projects", 0.14], ["icon-document.png", "Icon doc", "readme.txt", 0.30], ["icon-computer.png", "Icon computer", "My Machine", 0.46]];
var ii, il, lab, lr, ds;
for (ii = 0; ii < icons.length; ii++) {
  il = c.layers.add(ART.footage(ARTDIR, icons[ii][0], "art 24"));
  il.name = icons[ii][1];
  P.tf(il, "ADBE Scale").setValue([8, 8]);
  P.tf(il, "ADBE Position").setValue([0.06 * CW, icons[ii][3] * CH]);
  lab = P.text(c, icons[ii][2], { size: 20, font: LFONT, color: [1, 1, 1], pos: [0.06 * CW, icons[ii][3] * CH + 41 + 18], name: icons[ii][1] + " label" });
  ds = P.effect(lab, "ADBE Drop Shadow");
  ART.setFx(ds, { "Shadow Color": ART.hex("#0B3B36"), "Opacity": 255, "Direction": 135, "Distance": 1, "Softness": 0 });
}

var L = c.layers.add(pre);
L.name = "Dialog";
// Anchor on FIX so that at 2050 % FIX spans 10.5 % to 55 % across with its capitals centred 54.5 % down (plain build).
var A = [fixT.cx + (0.5 - 0.3275) * CW / K, fixT.cy - (0.545 - 0.5) * CH / K];
P.tf(L, "ADBE Anchor Point").setValue(A);
// Pure zoom about a fixed screen point Z: dialog centre D sits at the comp centre at 100 %, the anchor at 2050 %.
var C0 = [CW / 2, CH / 2], D = [PW / 2, PH / 2];
var XZ = [(K * A[0] - D[0]) / (K - 1), (K * A[1] - D[1]) / (K - 1)];
var Z = [C0[0] - D[0] + XZ[0], C0[1] - D[1] + XZ[1]];
P.tf(L, "ADBE Scale").expression =
  "var u = ease(time, " + T0 + ", " + T1 + ", 0, 1);\n" +
  "var s = 100 * Math.pow(" + K + ", u) * (1 + 0.012 * Math.max(0, time - " + T1 + "));\n[s, s]";
P.tf(L, "ADBE Position").expression =
  "var s = transform.scale[0] / 100;\n[" + Z[0] + " + s * (" + (A[0] - XZ[0]) + "), " + Z[1] + " + s * (" + (A[1] - XZ[1]) + ")]";
var dsh = P.effect(L, "ADBE Drop Shadow");
ART.setFx(dsh, { "Shadow Color": [0, 0, 0], "Opacity": Math.round(0.35 * 255), "Direction": 135, "Distance": 8, "Softness": 0 });
L.collapseTransformation = (args.sharp !== false);

return { comp: c.name, precomp: pre.name, judgeTime: T1, collapse: L.collapseTransformation, font: FONT, titleFont: TFONT, fontSize: FS, tracking: TRK,
  fix: [fixT.w, fixT.h], line1W: l1.w, line2End: MX + fixT.w + GAP + restT.w, anchor: A, Z: Z, XZ: XZ };
