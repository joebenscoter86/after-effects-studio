// Technique 1 (UehuuNiZVuk): round-capped line that draws on and wipes off with Trim Paths.
// Proof scene: a red strike passing through the wrong answer "8" on a quiz card (lead-notes.md).
//
// VERIFY:
// - "ADBE Vector Filter - Trim" with children "ADBE Vector Trim Start" / "ADBE Vector Trim End" (match names from memory)
// - "ADBE Vector Shape - Rect" children "ADBE Vector Rect Size" / "ADBE Vector Rect Roundness"
// - "ADBE Vector Graphic - Fill" and its "ADBE Vector Fill Color"
// - "ADBE Drop Shadow" effect and its display names Shadow Color / Opacity / Direction / Distance / Softness (Opacity 0-100; Direction 180 = straight down)
// - Montserrat PostScript names Montserrat-SemiBold / Montserrat-ExtraBold; P.text sets d.font = name. Substitution is not checked here (isSubstitute): read the returned fonts
// - setTemporalEaseAtKey on a 1-D property takes one-element arrays; keys must be set to BEZIER first
// - args.art: either the desk.png file or the folder holding it (script accepts both); args.artDir the folder
// - Text anchored on bounds centre: the "8" and "6" glyphs may look a few px off the tile centre
$.evalFile(args.prelude);

var FPS = 30;
var START = 18; // frames: the technique starts about 0.6 s in
function T(f) { return (START + f) / FPS; }

var c = P.freshComp("01 trim paths strike", 1080, 1920, FPS, 3.5, [0.92, 0.87, 0.82]);

// --- ground: the desk art, full frame
var artPath = args.art || (args.artDir + "/desk.png");
if (!/\.png$/i.test(artPath)) artPath = artPath + "/desk.png";
var io = new ImportOptions(new File(artPath));
var desk = app.project.importFile(io);
var deskLayer = c.layers.add(desk);
deskLayer.name = "desk";
deskLayer.property("ADBE Transform Group").property("ADBE Position").setValue([540, 960]);
deskLayer.property("ADBE Transform Group").property("ADBE Scale").setValue([100 * 1080 / desk.width, 100 * 1920 / desk.height]);

// --- tiles: white rounded rectangles with a soft shadow
function tile(name, cy) {
  var sh = P.shape(c, name);
  var r = P.contents(sh).addProperty("ADBE Vector Shape - Rect");
  r.property("ADBE Vector Rect Size").setValue([760, 460]);
  r.property("ADBE Vector Rect Roundness").setValue(48);
  var f = P.contents(sh).addProperty("ADBE Vector Graphic - Fill");
  var fi = f.propertyIndex;
  P.contents(sh).property(fi).property("ADBE Vector Fill Color").setValue([1, 1, 1, 1]);
  P.tf(sh.layer, "ADBE Position").setValue([540, cy]);
  var fx = P.effect(sh.layer, "ADBE Drop Shadow");
  fx.property("Shadow Color").setValue([0, 0, 0, 1]);
  fx.property("Opacity").setValue(12);
  fx.property("Direction").setValue(180);
  fx.property("Distance").setValue(10);
  fx.property("Softness").setValue(40);
  return sh.layer;
}
var yWrong = Math.round(1920 * 0.46); // 883
var yRight = Math.round(1920 * 0.74); // 1421
tile("tile wrong", yWrong);
tile("tile right", yRight);

// --- type
var tLabel = P.text(c, "QUICK QUIZ", { size: 34, font: "Montserrat-SemiBold", tracking: 200, color: [107 / 255, 97 / 255, 88 / 255], pos: [540, Math.round(1920 * 0.18)], name: "label" });
var tQ = P.text(c, "2 + 2 × 2 = ?", { size: 120, font: "Montserrat-ExtraBold", color: [30 / 255, 27 / 255, 24 / 255], pos: [540, Math.round(1920 * 0.26)], name: "question" });
var tA = P.text(c, "8", { size: 220, font: "Montserrat-ExtraBold", color: [30 / 255, 27 / 255, 24 / 255], pos: [540, yWrong], name: "answer 8" });
var tB = P.text(c, "6", { size: 220, font: "Montserrat-ExtraBold", color: [30 / 255, 27 / 255, 24 / 255], pos: [540, yRight], name: "answer 6" });

// --- the technique: one horizontal round-cap stroke with Trim Paths, on top
var sh = P.shape(c, "TECH strike line");
P.path(sh, [[-362, 0], [362, 0]], null, null, false); // path length 724 px, per the recipe (~725)
var si = P.stroke(sh, [215 / 255, 38 / 255, 61 / 255, 1], 16.4, 2); // #D7263D, round cap
// Line Join Miter (default) and Miter Limit 4 (default) are left as they are.
P.contents(sh).addProperty("ADBE Vector Filter - Trim");
var trim = null;
var k;
for (k = 1; k <= P.contents(sh).numProperties; k++) {
  if (P.contents(sh).property(k).matchName === "ADBE Vector Filter - Trim") trim = P.contents(sh).property(k);
}
var ti = trim.propertyIndex;
P.tf(sh.layer, "ADBE Position").setValue([540, yWrong]); // through the middle of the 8

function trimProp(name) { return P.contents(sh).property(ti).property(name); }

// End: 0 % -> 100 % over frames 0..29; Start: 0 % -> 100 % over frames 26..48 (relative to START)
trimProp("ADBE Vector Trim Start").setValue(0);
trimProp("ADBE Vector Trim End").setValue(0);
trimProp("ADBE Vector Trim End").setValueAtTime(T(0), 0);
trimProp("ADBE Vector Trim End").setValueAtTime(T(29), 100);
trimProp("ADBE Vector Trim Start").setValueAtTime(T(26), 0);
trimProp("ADBE Vector Trim Start").setValueAtTime(T(48), 100);

// Easy Ease (speed 0) then influences tuned to the played points in the recipe's layout.
// ASSUMED: head out 50 / in 70, tail out 50 / in 90 (solved on the cubic so head ~31 % at f10, ~94 % at f21; tail ~34 % at f33, ~94 % at f41).
function ease(propName, outInf, inInf) {
  var p = trimProp(propName);
  p.setInterpolationTypeAtKey(1, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
  p.setInterpolationTypeAtKey(2, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
  p.setTemporalEaseAtKey(1, [new KeyframeEase(0, 33.33)], [new KeyframeEase(0, outInf)]);
  p.setTemporalEaseAtKey(2, [new KeyframeEase(0, inInf)], [new KeyframeEase(0, 33.33)]);
}
ease("ADBE Vector Trim End", 50, 70);
ease("ADBE Vector Trim Start", 50, 90);

return { comp: c.name, id: c.id, layers: c.numLayers, fonts: [tLabel.property("ADBE Text Properties").property("ADBE Text Document").value.font, tA.property("ADBE Text Properties").property("ADBE Text Document").value.font] };
