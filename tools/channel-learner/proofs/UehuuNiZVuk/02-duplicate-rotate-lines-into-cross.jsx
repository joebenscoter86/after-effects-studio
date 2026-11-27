// Technique 2: one travelling round-cap line (Trim Paths) duplicated and turned +45 / -45 into an X, struck once over a wrong answer.
// args: prelude, art (full path to desk.png) or artDir (folder holding desk.png), font (optional)
// VERIFY: Drop Shadow match names "ADBE Drop Shadow-0001..0005" (colour, opacity, direction, distance, softness)
// VERIFY: Drop Shadow Opacity scale in scripting (assumed 0-255, so 12% = 30.6); if it reads 0-100 the shadow is far too strong
// VERIFY: Drop Shadow Direction 180 = straight down
// VERIFY: "ADBE Vector Filter - Trim" and its "ADBE Vector Trim Start" / "ADBE Vector Trim End"
// VERIFY: "ADBE Vector Shape - Rect" with "ADBE Vector Rect Size" and "ADBE Vector Rect Roundness"; "ADBE Vector Graphic - Fill" with "ADBE Vector Fill Color"
// VERIFY: Easy Ease via KeyframeEase(0, 33.333) in and out on a 1-value property
// VERIFY: layer.duplicate() puts the copy above the original and keeps the keys
// VERIFY: Montserrat face names Montserrat-SemiBold / Montserrat-ExtraBold; the returned fonts must equal these (a substitute shows a different name)
// VERIFY: "ADBE Rotate Z" is the shape layer's Rotation; text document tracking 200
// VERIFY: ImportOptions on a png without alpha; layer.add(footage) fits 1080x1920 at 100%
$.evalFile(args.prelude);

function hex(h) {
  return [parseInt(h.substr(1, 2), 16) / 255, parseInt(h.substr(3, 2), 16) / 255, parseInt(h.substr(5, 2), 16) / 255];
}

var W = 1080, H = 1920, FPS = 30, START = 0.6; // technique starts about 0.6 s in
var c = P.freshComp("02 duplicate rotate lines into cross", W, H, FPS, 3.5, [0.92, 0.87, 0.82]);

// Ground
var artPath = args.art || (args.artDir + "/desk.png");
var io = new ImportOptions(new File(artPath));
var desk = c.layers.add(app.project.importFile(io));
desk.name = "desk";
desk.property("ADBE Transform Group").property("ADBE Position").setValue([W / 2, H / 2]);
var ds = Math.max(W / desk.source.width, H / desk.source.height) * 100;
desk.property("ADBE Transform Group").property("ADBE Scale").setValue([ds, ds]);

// Answer tiles
function tile(name, cy) {
  var sh = P.shape(c, name);
  var r = P.contents(sh).addProperty("ADBE Vector Shape - Rect");
  r.property("ADBE Vector Rect Size").setValue([760, 460]);
  r.property("ADBE Vector Rect Roundness").setValue(48);
  var fillG = P.contents(sh).addProperty("ADBE Vector Graphic - Fill");
  P.contents(sh).property(fillG.propertyIndex).property("ADBE Vector Fill Color").setValue([1, 1, 1, 1]);
  P.tf(sh.layer, "ADBE Position").setValue([W / 2, cy]);
  var ds = P.effect(sh.layer, "ADBE Drop Shadow");
  ds.property("ADBE Drop Shadow-0001").setValue([0, 0, 0, 1]);
  ds.property("ADBE Drop Shadow-0002").setValue(30.6); // 12 % on an assumed 0-255 scale
  ds.property("ADBE Drop Shadow-0003").setValue(180);
  ds.property("ADBE Drop Shadow-0004").setValue(10);
  ds.property("ADBE Drop Shadow-0005").setValue(40);
  return sh.layer;
}
var yWrong = H * 0.46, yRight = H * 0.74;
tile("tile wrong", yWrong);
tile("tile right", yRight);

// Type
var semi = "Montserrat-SemiBold", xbold = "Montserrat-ExtraBold";
var t1 = P.text(c, "QUICK QUIZ", { size: 34, color: hex("#6B6158"), font: semi, tracking: 200, pos: [W / 2, H * 0.18], name: "label" });
var t2 = P.text(c, "2 + 2 × 2 = ?", { size: 120, color: hex("#1E1B18"), font: xbold, pos: [W / 2, H * 0.26], name: "question" });
var t3 = P.text(c, "8", { size: 220, color: hex("#1E1B18"), font: xbold, pos: [W / 2, yWrong], name: "answer 8" });
var t4 = P.text(c, "6", { size: 220, color: hex("#1E1B18"), font: xbold, pos: [W / 2, yRight], name: "answer 6" });
function fontOf(l) { return l.property("ADBE Text Properties").property("ADBE Text Document").value.font; }

// The travelling line: horizontal path, round-cap stroke, Trim Paths with eased keys
var HALF = 372; // ASSUMED: path vertices +-372 so the X is about 545 px across with caps (recipe: +-362 for 530 px)
var sh = P.shape(c, "TECH X arm");
P.path(sh, [[-HALF, 0], [HALF, 0]], null, null, false);
P.stroke(sh, hex("#D7263D"), 16.4, 2);
var trim = P.contents(sh).addProperty("ADBE Vector Filter - Trim");
trim = P.contents(sh).property("ADBE Vector Filter - Trim");
var tEnd = trim.property("ADBE Vector Trim End");
var tStart = trim.property("ADBE Vector Trim Start");
// Recipe keys in 30 fps frames: End 0 -> 18, Start 15 -> 31; values 0 -> 100. Converted to seconds, offset by START.
function f(n) { return START + n / 30; }
tEnd.setValueAtTime(f(0), 0);
tEnd.setValueAtTime(f(17), 100); // odd span (17 f) so one frame carries the snap
tStart.setValueAtTime(f(15), 0);
tStart.setValueAtTime(f(32), 100);
var INF = (args.inf || 92);
var ease = new KeyframeEase(0, INF);
var k;
for (k = 1; k <= 2; k++) {
  tEnd.setTemporalEaseAtKey(k, [ease], [ease]);
  tStart.setTemporalEaseAtKey(k, [ease], [ease]);
}
var orig = sh.layer;
P.tf(orig, "ADBE Position").setValue([W / 2, yWrong]);
P.tf(orig, "ADBE Rotate Z").setValue(-45); // original: "/"
var dup = orig.duplicate();
dup.name = "TECH X arm 2";
orig.name = "TECH X arm 1";
P.tf(dup, "ADBE Rotate Z").setValue(45); // duplicate: "\"
P.tf(dup, "ADBE Position").setValue([W / 2, yWrong]);

return { comp: c.name, id: c.id, layers: c.numLayers, fonts: [fontOf(t1), fontOf(t2), fontOf(t3), fontOf(t4)] };
