// Technique 22: tuck helper layers out of the Timeline with the shy switch.
// A ring of stand-in photo cards, each with image, box, matte, outline, decoration and text layers.
// Mattes, outlines, decorations and text are marked shy; then the comp's Hide All Shy Layers toggle is set.
// Shy changes only the Timeline layer list, never the render: judge the build by the layer list, not a frame.
// args.hide === false leaves the toggle off (the "before" state); args.cards sets the number of cards (default 12).
//
// VERIFY: layer.shy and comp.hideShyLayers are the scripting names (both documented in the AE scripting guide).
// VERIFY: assigning layer.parent keeps the child where it is on screen (setParentWithJump is the one that keeps values).
// VERIFY: layer.setTrackMatte(matte, TrackMatteType.ALPHA) exists in AE 2027 and the matte need not sit directly above.
// VERIFY: a matte layer with enabled = false still works as the matte.
// VERIFY: "Vibrance" is the display name of the effect and its property, accepted by P.effect.
// VERIFY: shape Rect and Fill match names: "ADBE Vector Shape - Rect", "ADBE Vector Rect Size/Position/Roundness", "ADBE Vector Graphic - Fill", "ADBE Vector Fill Color".
$.evalFile(args.prelude);
// Rebuild with artwork (2026-11-14): art from PROOF/22/art (brief.md). Pass args.artLib (art.jsx) and args.artDir.
// "A year in pictures": twelve framed month photos round a cream calendar dial on a warm umber ground.
// Per card, top to bottom: Label N (number), Month N (name), Dot N, Outline N, [month-NN.png], Matte N, Box N.
// The recipe's layout puts four shy layers above each image and one between image and box (88 layers); the brief's
// single label is split into number and month, and the matte sits under the photo (setTrackMatte needs no adjacency).
// Shy: everything except FX, Null 1, the twelve photos, the twelve boxes, Wheel and BG (60 shy, 28 showing).
// Movie: Null 1 pushes 100 -> 103 % linearly (still moving at the end); the Wheel turns 1 degree a second.
$.evalFile(args.artLib);
var ARTDIR = args.artDir;
var FOLDER = "art 22";

function addRect(sh, size, pos, round) {
  var r = P.contents(sh).addProperty("ADBE Vector Shape - Rect");
  var idx = r.propertyIndex;
  P.contents(sh).property(idx).property("ADBE Vector Rect Size").setValue(size);
  P.contents(sh).property(idx).property("ADBE Vector Rect Position").setValue(pos || [0, 0]);
  P.contents(sh).property(idx).property("ADBE Vector Rect Roundness").setValue(round || 0);
  return idx;
}
function addFill(sh, color) {
  var f = P.contents(sh).addProperty("ADBE Vector Graphic - Fill");
  var idx = f.propertyIndex;
  P.contents(sh).property(idx).property("ADBE Vector Fill Color").setValue(color);
  return idx;
}
function pickFont(list) {
  var i, fo;
  for (i = 0; i < list.length; i++) {
    try { fo = app.fonts.getFontsByPostScriptName(list[i]); if (fo.length && !fo[0].isSubstitute) return list[i]; } catch (e) {}
  }
  return list[list.length - 1];
}

var N = 12;
var CW = 1920, CH = 1080, DUR = args.dur || 6;
// Run: 0.36 (brief) left the 03/04 and 10/11 labels touching the next card's dot; 0.38 and tighter labels clear them.
var R = (args.radius || 0.38) * CH;
var BW = 108, BH = 140;      // box (brief)
var c = P.freshComp("22 hide layers shy", CW, CH, 24, DUR, ART.hex("#120E0B"));

var FNUM = pickFont(["Poppins-SemiBold", "Poppins-Bold"]);
var FMON = pickFont(["Poppins-Regular", "Poppins-SemiBold"]);
var MONTHS = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
var SEASON = ["#9DB4C8", "#9DB4C8", "#E7A9B4", "#E7A9B4", "#E7A9B4", "#E9C46A", "#E9C46A", "#E9C46A", "#D9773A", "#D9773A", "#D9773A", "#9DB4C8"];
var CREAM = ART.hex("#EADFC8");

// Background and wheel (added first: new layers land on top).
var bg = c.layers.add(ART.footage(ARTDIR, "backdrop.png", FOLDER));
bg.name = "BG";
P.tf(bg, "ADBE Scale").setValue([75, 75]);
var wheel = c.layers.add(ART.footage(ARTDIR, "dial-ring.png", FOLDER));
wheel.name = "Wheel";
// Run: at the brief's 54 % the rim ran through the labels under the top three cards; 46 % clears them.
var WS = 100 * (args.dial || 0.46) * CH / 2048;
P.tf(wheel, "ADBE Scale").setValue([WS, WS]);
var wr = P.tf(wheel, "ADBE Rotate Z");
wr.expression = "time * 1"; // one degree a second (brief)

var boxes = [];
var shyCount = 0;
var i, a, pos, nm, num, box, img, matte, outline, dot, lab, mon, hl, h, sidx;
for (i = N - 1; i >= 0; i--) {
  a = i * 2 * Math.PI / N;               // January at 12 o'clock, clockwise
  pos = [CW / 2 + R * Math.sin(a), CH / 2 - R * Math.cos(a)];
  num = (i < 9 ? "0" : "") + (i + 1);

  box = P.shape(c, "Box " + (i + 1));
  addRect(box, [BW, BH], [0, 0], 10);
  addFill(box, ART.hex("#1D1916").concat([1]));
  P.tf(box.layer, "ADBE Position").setValue(pos);
  // A soft shadow under each card so it sits on the ground (brief's optional Shadow N, done as an effect on the box).
  var ds = P.effect(box.layer, "ADBE Drop Shadow");
  ART.setFx(ds, { "Opacity": 140 /* VERIFY: 0..255 in script, about 55 % */, "Direction": 160, "Distance": 6, "Softness": 22 });

  matte = P.shape(c, "Matte " + (i + 1));
  addRect(matte, [BW - 12, BH - 12], [0, 0], 6);
  addFill(matte, [1, 1, 1, 1]);
  P.tf(matte.layer, "ADBE Position").setValue(pos);

  img = c.layers.add(ART.footage(ARTDIR, "month-" + num + ".png", FOLDER));
  P.tf(img, "ADBE Scale").setValue([11, 11]);
  P.tf(img, "ADBE Position").setValue(pos);
  img.setTrackMatte(matte.layer, TrackMatteType.ALPHA);
  matte.layer.enabled = false;

  outline = P.shape(c, "Outline " + (i + 1));
  addRect(outline, [BW, BH], [0, 0], 10);
  sidx = P.stroke(outline, CREAM.concat([1]), 1.5);
  P.contents(outline).property(sidx).property("ADBE Vector Stroke Opacity").setValue(45);
  P.tf(outline.layer, "ADBE Position").setValue(pos);

  dot = P.shape(c, "Dot " + (i + 1));
  P.ellipse(dot, [6, 6]);
  addFill(dot, ART.hex(SEASON[i]).concat([1]));
  P.tf(dot.layer, "ADBE Position").setValue([pos[0], pos[1] - BH / 2 - 6]);

  mon = P.text(c, MONTHS[i], { size: Math.round(0.011 * CH / 0.72), font: FMON, color: ART.hex("#B8AA94"), tracking: 200,
    pos: [pos[0], pos[1] + BH / 2 + 41], name: "Month " + (i + 1) });
  lab = P.text(c, num, { size: Math.round(0.022 * CH / 0.72), font: FNUM, color: ART.hex("#F3EBDD"),
    pos: [pos[0], pos[1] + BH / 2 + 19], name: "Label " + (i + 1) });

  hl = [lab, mon, dot.layer, outline.layer, matte.layer];
  for (h = 0; h < hl.length; h++) { hl[h].shy = true; shyCount++; }
  img.parent = box.layer;
  for (h = 0; h < hl.length; h++) hl[h].parent = box.layer;
  boxes.push(box.layer);
}

var ctl = c.layers.addNull(c.duration);
ctl.source.name = "22 Null 1";
ctl.name = "Null 1";
// Run: the set spans 62 to 1050 px down (dot of 01 to the JULY label); lifted 19 px to centre it in the frame.
P.tf(ctl, "ADBE Position").setValue([CW / 2, CH / 2]);
var k;
for (k = 0; k < boxes.length; k++) boxes[k].parent = ctl;
wheel.parent = ctl;
P.tf(ctl, "ADBE Position").setValue([CW / 2, CH / 2 - 19]); // after parenting, so the set moves with it
var ns = P.tf(ctl, "ADBE Scale");
ns.setValueAtTime(0, [100, 100]);
ns.setValueAtTime(DUR, [101.5, 101.5]); // linear: still moving on the last frame

// FX: a light vignette and Noise 3 % (brief).
var fxLayer = P.solid(c, "22 FX", [1, 1, 1]);
fxLayer.name = "FX";
fxLayer.adjustmentLayer = true;
var vg = null;
try { vg = P.effect(fxLayer, "CC Vignette"); ART.setFx(vg, { "Amount": 35 }); } catch (eV) { vg = null; }
var nz = P.effect(fxLayer, "ADBE Noise");
var nmiss = ART.setFx(nz, { "Amount of Noise": 3 });

c.hideShyLayers = (args.hide !== false);

var shown = [], shyIdx = [], li;
for (li = 1; li <= c.numLayers; li++) {
  if (c.layer(li).shy) shyIdx.push(li); else shown.push(li + " " + c.layer(li).name);
}
var oi, oit;
for (oi = app.project.numItems; oi >= 1; oi--) {
  oit = app.project.item(oi);
  if (oit instanceof FootageItem && oit.mainSource instanceof SolidSource && oit.usedIn.length === 0 &&
      (oit.name === "22 card image" || oit.name === "22 Null 1" || oit.name === "22 FX" || oit.name === "22 background")) oit.remove();
}
var lr = c.layer("Label 1").sourceRectAtTime(0, false), mr = c.layer("Month 1").sourceRectAtTime(0, false);
return { comp: c.name, id: c.id, layers: c.numLayers, shy: shyIdx.length, hideShyLayers: c.hideShyLayers,
  showingInTimeline: c.hideShyLayers ? shown.length : c.numLayers, notShy: shown, fonts: [FNUM, FMON], vignette: !!vg, noiseMissing: nmiss,
  labelH: lr.height, monthH: mr.height, monthW: mr.width };
