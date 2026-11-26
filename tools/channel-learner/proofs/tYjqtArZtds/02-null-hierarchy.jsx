// Technique 2: three group nulls (shapes, text, logo) under one master null.
// The picture is the same with or without the parenting; only the parent column records it.
// VERIFY:
// - args.artDir: folder holding app-icon.png and wallpaper.png (falls back to args.art, then PROOF/shared-art is NOT guessed)
// - PostScript names "InterTight-SemiBold" / "InterTight-Regular" for the variable font instances
// - TextDocument.isSubstitute exists (guarded with typeof); fallback "Inter-ExtraBold" for the name only
// - comp.layers.addNull(duration) signature; layer.parent = otherLayer keeps local transform values (not world position)
// - Null layers: anchor point settable to [0,0] via ADBE Anchor Point
// - Match names: ADBE Vector Shape - Rect, ADBE Vector Rect Size, ADBE Vector Rect Roundness, ADBE Vector Graphic - Fill, ADBE Vector Fill Color
// - Gaussian Blur display name "Gaussian Blur" and its "Blurriness" property
// - app.project.importFile(new ImportOptions(File)) returns a FootageItem; layer.name set after addLayer
// - fps 24 given by house rule (the recipe is silent)
$.evalFile(args.prelude);

var artDir = args.artDir || args.art;
function importArt(fname) {
  var i, it;
  for (i = 1; i <= app.project.numItems; i++) {
    it = app.project.item(i);
    if (it instanceof FootageItem && it.name === fname) return it;
  }
  var io = new ImportOptions(new File(artDir + "/" + fname));
  return app.project.importFile(io);
}

var W = 1080, H = 1920;
var c = P.freshComp("02 null hierarchy", W, H, 30, 6, [0.96, 0.96, 0.96]);

// Card geometry: the recipe's 1354 x 318 pill scaled by 0.72 (lead notes), centred 35% down.
var K = 0.72;
var cardW = 970, cardH = 228;
var cx = W / 2, cy = Math.round(H * 0.35);
var ox = cx - W / 2, oy = cy - H / 2; // card centre relative to the master null (which sits on the comp centre)
var cardLeft = -cardW / 2; // relative to card centre

// Local helper (candidate for the prelude): rounded-rect shape layer, centred on its own origin.
function pill(name, fill, stroke, strokeW) {
  var sh = P.shape(c, name);
  var r = P.contents(sh).addProperty("ADBE Vector Shape - Rect");
  r.property("ADBE Vector Rect Size").setValue([cardW, cardH]);
  r.property("ADBE Vector Rect Roundness").setValue(79); // lead notes: Roundness 79 on a 228 px card (corner radius ~0.33 of height)
  if (fill) {
    var f = P.contents(sh).addProperty("ADBE Vector Graphic - Fill");
    var fi = f.propertyIndex;
    P.contents(sh).property(fi).property("ADBE Vector Fill Color").setValue(fill);
  }
  if (stroke) P.stroke(sh, stroke, strokeW);
  return sh.layer;
}
function nullLayer(name, pos) {
  var n = c.layers.addNull(c.duration);
  n.name = name;
  P.tf(n, "ADBE Anchor Point").setValue([0, 0]);
  P.tf(n, "ADBE Position").setValue(pos);
  return n;
}
// Text with its left edge on x (relative to the master null) and vertical middle on y.
function textLeft(str, size, color, font, x, y, name) {
  var t = P.text(c, str, { size: size, color: color, font: font, name: name });
  var tdp = t.property("ADBE Text Properties").property("ADBE Text Document");
  var dd = tdp.value; dd.justification = ParagraphJustification.LEFT_JUSTIFY; tdp.setValue(dd);
  var r = t.sourceRectAtTime(0, false);
  P.tf(t, "ADBE Anchor Point").setValue([r.left, r.top + r.height / 2]);
  P.tf(t, "ADBE Position").setValue([x, y]);
  return t;
}

// --- build bottom to top ---
var wp = c.layers.add(importArt("wallpaper.png"));
wp.name = "Wallpaper";
P.tf(wp, "ADBE Position").setValue([W / 2, H / 2]); // not parented: ground

var depth = pill("Depth", [0.75, 0.75, 0.78], null, 0);
P.tf(depth, "ADBE Position").setValue([ox, oy + 8]);
P.effect(depth, "Gaussian Blur").property("Blurriness").setValue(6);
var card = pill("Notification", [0.925, 0.925, 0.925], null, 0);
P.tf(card, "ADBE Position").setValue([ox, oy]);
card.property("ADBE Transform Group").property("ADBE Opacity").setValue(90); // ASSUMED: technique 01 values not in this recipe
var outline = pill("Stroke", null, [0.8, 0.8, 0.82, 1], 2);
P.tf(outline, "ADBE Position").setValue([ox, oy]);

var shapeNull = nullLayer("Null Notification", [0, 0]);

var icon = c.layers.add(importArt("app-icon.png"));
icon.name = "Logo";
var logoD = 188 * K; // 135 px
P.tf(icon, "ADBE Scale").setValue([100 * logoD / icon.source.width, 100 * logoD / icon.source.height]);
P.tf(icon, "ADBE Position").setValue([ox + cardLeft + 0.056 * cardW + logoD / 2, oy]);
var logoNull = nullLayer("Logo Null", [0, 0]);

var gray1 = [0.11, 0.11, 0.118], gray2 = [0.227, 0.227, 0.235], gray3 = [0.557, 0.557, 0.576];
var tx = ox + cardLeft + 0.24 * cardW;
// ASSUMED: message at 34 px (recipe share 60*0.72 = 43 px) so "Backup complete. 1,418 photos are safe." fits one line inside the pill.
var msg = textLeft("Backup complete.\r1,418 photos are safe.", 43, gray2, "InterTight-Regular", tx, oy + 38, "message");
var nameL = textLeft("Larkvault", 52, gray1, "InterTight-SemiBold", tx, oy - 62, "name");
var now = textLeft("now", 27, gray3, "InterTight-Regular", ox + cardW / 2 - 0.06 * cardW - 0, oy - cardH / 2 + 62, "NOW");
// right-align "now": anchor on its right edge
var rn = now.sourceRectAtTime(0, false);
P.tf(now, "ADBE Anchor Point").setValue([rn.left + rn.width, rn.top + rn.height / 2]);
var textNull = nullLayer("Text Null", [0, 0]);

var master = nullLayer("main", [W / 2, H / 2]);

// Fallback for the name font if Inter Tight is not installed.
var fontInfo = nameL.property("ADBE Text Properties").property("ADBE Text Document").value;
var substituted = false;
if (typeof fontInfo.isSubstitute !== "undefined") substituted = fontInfo.isSubstitute;
if (substituted || fontInfo.font.indexOf("InterTight") < 0) {
  var td = nameL.property("ADBE Text Properties").property("ADBE Text Document");
  var d2 = td.value;
  d2.font = "Inter-ExtraBold";
  td.setValue(d2);
}

// --- parenting (after every null is named and filled) ---
outline.parent = shapeNull;
card.parent = shapeNull;
depth.parent = shapeNull;
icon.parent = logoNull;
msg.parent = textNull;
nameL.parent = textNull;
now.parent = textNull;
shapeNull.parent = master;
textNull.parent = master;
logoNull.parent = master;

// Parenting a null compensated its position to keep world place (-540,-960): reset to 0,0 under main.
P.tf(textNull, "ADBE Position").setValue([0, 0]);
P.tf(logoNull, "ADBE Position").setValue([0, 0]);
P.tf(shapeNull, "ADBE Position").setValue([0, 0]);

// Step 8: a Position key at time 0 on the shape-controller null, value 0,0 (relative to its parent).
P.tf(shapeNull, "ADBE Position").setValueAtTime(0, [0, 0]);

// Demonstration (not in the recipe, added so the parent chain can be seen): the held frame is t=0..1 s.
// 1.0-2.0 s main moves (whole card), 2.0-3.0 shapes alone, 3.0-4.0 text alone, 4.0-5.0 logo alone, each out and back.
function bump(layer, t0, base, d) {
  var pr = P.tf(layer, "ADBE Position");
  var ts = [t0, t0 + 0.5, t0 + 1.0];
  var vs = [base, [base[0] + d[0], base[1] + d[1]], base];
  var i;
  for (i = 0; i < 3; i++) pr.setValueAtTime(ts[i], vs[i]);
  var ez = new KeyframeEase(0, 60);
  var k0 = pr.nearestKeyIndex(t0), k1 = pr.nearestKeyIndex(t0 + 0.5), k2 = pr.nearestKeyIndex(t0 + 1.0);
  pr.setInterpolationTypeAtKey(k0, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
  pr.setInterpolationTypeAtKey(k1, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
  pr.setInterpolationTypeAtKey(k2, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
  pr.setTemporalEaseAtKey(k0, [ez], [ez]); pr.setTemporalEaseAtKey(k1, [ez], [ez]); pr.setTemporalEaseAtKey(k2, [ez], [ez]);
}
bump(master, 1.0, [W / 2, H / 2], [0, 200]);
bump(shapeNull, 2.0, [0, 0], [0, -110]);
bump(textNull, 3.0, [0, 0], [0, -110]);
bump(logoNull, 4.0, [0, 0], [0, -110]);

return { comp: c.name, id: c.id, layers: c.numLayers, nameFont: nameL.property("ADBE Text Properties").property("ADBE Text Document").value.font };
