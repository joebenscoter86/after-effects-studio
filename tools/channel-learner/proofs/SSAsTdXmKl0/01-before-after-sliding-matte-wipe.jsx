// Technique 1: before/after reveal with a sliding rectangle matte and a thin edge line.
// "after" precomp sits over "before"; an Alpha Matte "Fill" rectangle slides across, "Line" (same rectangle, stroke only) rides its edge.
// args: prelude, artDir (folder holding before.png and after.png; args.art accepted as the same folder)
//
// VERIFY:
// VERIFY: Layer.setTrackMatte(layer, TrackMatteType.ALPHA) exists in this AE (2023+); fallback is after.trackMatteType = TrackMatteType.ALPHA
// VERIFY: "ADBE Vector Shape - Rect", "ADBE Vector Rect Size", "ADBE Vector Rect Roundness" match names
// VERIFY: "ADBE Vector Graphic - Fill" and "ADBE Vector Fill Color" match names
// VERIFY: setTemporalEaseAtKey on Position takes a one-item ease array (spatial property: 1 temporal dimension)
// VERIFY: font "Montserrat-SemiBold" is installed (PostScript name); text rect width includes trailing tracking
// VERIFY: a new shape layer's position starts at [0,0] (we set it anyway)
// VERIFY: the matte layer "Fill" hides itself once used as a matte (setTrackMatte should do it; else set enabled=false)
// VERIFY: layers.add(precomp) puts the layer at the top, so layers are added bottom-first
$.evalFile(args.prelude);

var W = 1080, H = 1920, FPS = 30;
var dir = args.artDir || args.art;

function importStill(name) {
  var io = new ImportOptions(new File(dir + "/" + name));
  return app.project.importFile(io);
}

// Pill + label, inside the comp it is passed (so it wipes with its picture).
function addLabel(comp, str, side) {
  var t = P.text(comp, str, { size: 43, font: "Montserrat-SemiBold", color: [1, 1, 1], tracking: 200, name: str + " label" }); // ASSUMED: size 43 gives ~30 px cap height
  var r = t.sourceRectAtTime(0, false);
  var capH = 30;
  var ph = capH + 2 * capH * 0.6;      // 66
  var pw = r.width + 2 * capH * 1.2;   // text width plus 36 each side
  var cx = (side === "right") ? (W - 64 - pw / 2) : (64 + pw / 2);
  var cy = 64 + ph / 2;
  t.property("ADBE Transform Group").property("ADBE Position").setValue([cx, cy]);
  var sh = P.shape(comp, str + " pill");
  var rc = P.contents(sh).addProperty("ADBE Vector Shape - Rect");
  rc.property("ADBE Vector Rect Size").setValue([pw, ph]);
  rc.property("ADBE Vector Rect Roundness").setValue(ph / 2);
  var f = P.contents(sh).addProperty("ADBE Vector Graphic - Fill");
  f.property("ADBE Vector Fill Color").setValue([17 / 255, 17 / 255, 17 / 255, 1]);
  sh.layer.property("ADBE Transform Group").property("ADBE Position").setValue([cx, cy]);
  sh.layer.property("ADBE Transform Group").property("ADBE Opacity").setValue(70);
  sh.layer.moveAfter(t); // pill under the text
}

function makePic(name, file, label, side) {
  var pc = P.freshComp(name, W, H, FPS, 6.5, [0, 0, 0]);
  var img = pc.layers.add(importStill(file));
  img.name = name + " picture";
  img.property("ADBE Transform Group").property("ADBE Position").setValue([W / 2, H / 2]);
  addLabel(pc, label, side);
  return pc;
}

// Rectangle layer: mode "line" = stroke only, "fill" = fill only. Same keys on both.
function makeRect(comp, name, mode) {
  var sh = P.shape(comp, name);
  var rc = P.contents(sh).addProperty("ADBE Vector Shape - Rect");
  rc.property("ADBE Vector Rect Size").setValue([1160, 2060]); // recipe 1160 wide; height 2060 per lead notes (~7 % over the comp)
  if (mode === "line") {
    P.stroke(sh, [160 / 255, 150 / 255, 115 / 255, 1], 1.5); // clip's measured amber, 1.5 px (lead notes)
  } else {
    var f = P.contents(sh).addProperty("ADBE Vector Graphic - Fill");
    f.property("ADBE Vector Fill Color").setValue([254 / 255, 152 / 255, 0, 1]);
  }
  var pos = sh.layer.property("ADBE Transform Group").property("ADBE Position");
  // Retimed to the finished clip (lead notes): edge = x + 580. Keys: t, x, in speed, in influence, out speed, out influence
  var K = args.keys || [
    [0, -529, 250, 33.33, 250, 33.33],
    [0.4, -411.5, 500, 33.33, 500, 33.33],
    [0.8, -126.4, 856, 33.33, 856, 33.33],
    [1.0, 73, 864, 33.33, 864, 33.33],
    [1.2, 219, 580, 33.33, 580, 33.33],
    [1.6, 392, 310, 33.33, 310, 33.33],
    [2.0, 468, 125, 33.33, 125, 33.33],
    [2.5, 530, 0, 50, 0, 33.33],
    [3.0, 530, 0, 33.33, 0, 33.33],
    [4.0, 273, 700, 33.33, 700, 33.33],
    [4.6, -245, 880, 33.33, 880, 33.33],
    [5.0, -600, 880, 33.33, 0, 33.33]
  ];
  var k, e1, e2;
  for (k = 0; k < K.length; k++) pos.setValueAtTime(K[k][0], [K[k][1], 960]);
  for (k = 0; k < K.length; k++) {
    e1 = new KeyframeEase(K[k][2], K[k][3]);
    e2 = new KeyframeEase(K[k][4], K[k][5]);
    pos.setTemporalEaseAtKey(k + 1, [e1], [e2]);
  }
  return sh.layer;
}

var pBefore = makePic("before", "before.png", "BEFORE", "right");
var pAfter = makePic("after", "after.png", "AFTER", "left");

var c = P.freshComp("01 before-after wipe", W, H, FPS, 6.5, [0, 0, 0]);
var lBefore = c.layers.add(pBefore);
lBefore.name = "before";
var lAfter = c.layers.add(pAfter);
lAfter.name = "after";
var lFill = makeRect(c, "Fill", "fill");
var lLine = makeRect(c, "Line", "line");
// Order now (top to bottom): Line, Fill, after, before.

lAfter.setTrackMatte(lFill, TrackMatteType.ALPHA);
// ASSUMED: if the line should show at rest, start x would be about -535 (recipe note); kept the build's -581 / 540 / -581, so the hairline is off-picture at the keys.

return { comp: c.name, id: c.id, layers: c.numLayers };
