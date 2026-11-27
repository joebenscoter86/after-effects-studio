// Technique 01 (composed): a red X on the wrong state, a straight-edge wipe to the fixed one, a tick on the result.
// VERIFY: Montserrat-SemiBold is the font's PostScript name here (P.text sets d.font from it); check the text is not a substitute.
// VERIFY: Position temporal ease via setTemporalEaseAtKey with ONE KeyframeEase per direction (spatial property); if AE wants 2 or 3 entries, change the arrays.
// VERIFY: layer.setTrackMatte(fillLayer, TrackMatteType.ALPHA) exists in this AE (2027); fallback is trackMatteType with the matte layer directly above.
// VERIFY: the matte layer "Fill" turns itself invisible once used as a matte; if it shows orange, set Fill.enabled = false.
// VERIFY: the stroke tracking value 200 on the label (d.tracking) and the pill width read from sourceRectAtTime (tracking may add a trailing space of width).
// VERIFY: args.pieces points at the plugin library's pieces folder (pcs-core.jsx, tick.jsx); args.artDir holds wrong.png and fixed.png.
// VERIFY: PCS.tick's own Trim Paths ease (PCS.ease) is accepted; the layer is placed at the top of the main comp.
// VERIFY: a rectangle path in a shape group is drawn about the layer's anchor (0,0), so layer Position is the rectangle's centre.
// VERIFY: import of PNGs: app.project.importFile(new ImportOptions(File)) returns FootageItem; two imports of same name are fine on re-run.
$.evalFile(args.prelude);

var W = 1080, H = 1920, FPS = 30, DUR = 6;
var artDir = args.artDir || args.art;
var FONT = args.font || "Montserrat-SemiBold";
var RED = [0xD7 / 255, 0x26 / 255, 0x3D / 255, 1];
var GREEN = [0x1F / 255, 0xA4 / 255, 0x63 / 255, 1];
var AMBER = [160 / 255, 150 / 255, 115 / 255, 1];
var XC = [560, 578];     // centre of the sign's lettering (lead notes)
var DISC = [540, 1590];  // disc centre (brief)

var c = P.freshComp("01 red x then wipe then tick", W, H, FPS, DUR, [0, 0, 0]);
var wrongComp = P.freshComp("wrong", W, H, FPS, DUR, [0, 0, 0]);
var fixedComp = P.freshComp("fixed", W, H, FPS, DUR, [0, 0, 0]);

function importArt(name) {
  var f = new File(artDir + "/" + name);
  if (!f.exists) throw new Error("art missing: " + f.fsName);
  return app.project.importFile(new ImportOptions(f));
}

// Picture, pill and label, same place in both precomps. Order bottom to top: picture, pill, text.
function pictureAndLabel(comp, file, word) {
  var txt = P.text(comp, "TEXT MODE · " + word, { size: 43, color: [1, 1, 1], font: FONT, tracking: 200, pos: [540, 1790], name: "label text" });
  var r = txt.sourceRectAtTime(0, false);
  var cap = 30;
  var ph = cap * 2.2;            // padding 0.6 x cap above and below
  var pw = r.width + 2 * 1.2 * cap;
  var pill = P.shape(comp, "label pill");
  var rc = P.contents(pill).addProperty("ADBE Vector Shape - Rect");
  rc.property("ADBE Vector Rect Size").setValue([pw, ph]);
  rc.property("ADBE Vector Rect Roundness").setValue(ph / 2);
  var fl = P.contents(pill).addProperty("ADBE Vector Graphic - Fill");
  P.contents(pill).property(fl.propertyIndex).property("ADBE Vector Fill Color").setValue([0x11 / 255, 0x11 / 255, 0x11 / 255, 1]);
  P.contents(pill).property(fl.propertyIndex).property("ADBE Vector Fill Opacity").setValue(100);
  pill.layer.property("ADBE Transform Group").property("ADBE Opacity").setValue(70);
  P.tf(pill.layer, "ADBE Position").setValue([540, 1790]);
  pill.layer.moveAfter(txt);
  var pic = comp.layers.add(importArt(file));
  pic.name = file;
  P.tf(pic, "ADBE Position").setValue([W / 2, H / 2]);
  pic.moveToEnd();
  return pic;
}

// ---- "wrong": picture, label, X (two arms with the same keys) ----
pictureAndLabel(wrongComp, "wrong.png", "OFF");
function xArm(comp, name, rot) {
  var sh = P.shape(comp, name);
  P.path(sh, [[-372, 0], [372, 0]], null, null, false);
  var s = P.stroke(sh, RED, 16.4, 2);
  var trim = P.contents(sh).addProperty("ADBE Vector Filter - Trim");
  var end = P.contents(sh).property(trim.propertyIndex).property("ADBE Vector Trim End");
  var t0 = 0.4, t1 = 0.4 + 17 / FPS;
  end.setValueAtTime(t0, 0);
  end.setValueAtTime(t1, 100);
  end.setTemporalEaseAtKey(1, [new KeyframeEase(0, 92)], [new KeyframeEase(0, 92)]);
  end.setTemporalEaseAtKey(2, [new KeyframeEase(0, 92)], [new KeyframeEase(0, 92)]);
  // Start stays 0, no keys: the X stays drawn until the wipe takes it.
  P.tf(sh.layer, "ADBE Position").setValue(XC);
  P.tf(sh.layer, "ADBE Rotate Z").setValue(rot);
  return sh.layer;
}
xArm(wrongComp, "X arm 1", 45);
xArm(wrongComp, "X arm 2", -45);

// ---- "fixed": picture, label, green disc ----
pictureAndLabel(fixedComp, "fixed.png", "ON");
var disc = P.shape(fixedComp, "disc");
P.ellipse(disc, [190, 190]);
var df = P.contents(disc).addProperty("ADBE Vector Graphic - Fill");
P.contents(disc).property(df.propertyIndex).property("ADBE Vector Fill Color").setValue(GREEN);
P.tf(disc.layer, "ADBE Position").setValue(DISC);

// ---- main comp: wrong, fixed (matte), Fill, Line ----
var wrongL = c.layers.add(wrongComp);
wrongL.name = "wrong";
var fixedL = c.layers.add(fixedComp);
fixedL.name = "fixed";

function rectLayer(name, isFill) {
  var sh = P.shape(c, name);
  var rc = P.contents(sh).addProperty("ADBE Vector Shape - Rect");
  rc.property("ADBE Vector Rect Size").setValue([1160, 2060]);
  if (isFill) {
    var f = P.contents(sh).addProperty("ADBE Vector Graphic - Fill");
    P.contents(sh).property(f.propertyIndex).property("ADBE Vector Fill Color").setValue([1, 0.596, 0, 1]);
  } else {
    P.stroke(sh, AMBER, 1.5, 1); // ASSUMED: butt caps on the hairline; no fill
  }
  return sh.layer;
}
var fillL = rectLayer("Fill", true);
var lineL = rectLayer("Line", false);
fixedL.setTrackMatte(fillL, TrackMatteType.ALPHA);

// Wipe: forward leg only. [seconds after 1.8, x, speed px/s]
var keys = [[0.0, -581, 0], [0.3, -529, 250], [0.7, -411.5, 500], [1.1, -126.4, 856], [1.3, 73, 864],
            [1.5, 219, 580], [1.9, 392, 310], [2.3, 468, 125], [2.8, 530, 0]];
function wipeKeys(layer) {
  var pos = P.tf(layer, "ADBE Position");
  var i;
  for (i = 0; i < keys.length; i++) pos.setValueAtTime(1.8 + keys[i][0], [keys[i][1], H / 2]);
  for (i = 0; i < keys.length; i++) {
    pos.setTemporalEaseAtKey(i + 1, [new KeyframeEase(keys[i][2], 33.33)], [new KeyframeEase(keys[i][2], 33.33)]);
  }
}
wipeKeys(fillL);
wipeKeys(lineL);

// ---- tick, above Line, on the disc ----
$.evalFile(args.pieces + "/pcs-core.jsx");
PCS.need("tick");
var tick = PCS.tick(c, { size: 150, color: [1, 1, 1], t: 4.45, dur: 0.3, name: "tick" });
P.tf(tick, "ADBE Position").setValue(DISC);
tick.moveToBeginning();

return { comp: c.name, id: c.id, layers: c.numLayers };
