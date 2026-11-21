// SKU3QdqKLOs technique 05: map regions that fade up one by one. Art build (PROOF/05/art/brief.md).
// A base map (every province in slate) with six pre-aligned region layers over it, each one province in its colour;
// each region and its numbered list row fade 0 -> 100 % opacity, linear, in turn, starting at the finished example's
// in-points 0, 0.50, 1.05, 1.50, 2.00 and 2.69 s (recipe step 6). Region names sit on their own always-visible layer
// above the regions. The look is the brief's (dark plate, slate base, six tones of one accent), on purpose; the fade
// and stagger are the recipe's. The author-pass stand-in version is 05-map-regions-fade-up-first.jsx.
//
// args: prelude, artLib, lib, artDir. Optional: args.together (the tutorial's own build: every region fades at once
// over 0:00-0:01:01, list not faded), args.fade (seconds, default 0.4).
$.evalFile(args.prelude);
$.evalFile(args.artLib);
$.evalFile(args.lib);

var FADED = [];
function fadeUp(l, t, len) {
  var op = P.tf(l, "ADBE Opacity");
  op.setValueAtTime(t, 0);
  op.setValueAtTime(t + len, 100);
  ease(op, "linear");
  if (t > 0) l.inPoint = t; // the finished example staggers by in-point; the keys keep their comp times
  FADED.push(l.name + " @" + t);
}
function disc(c, name, center, d, color) {
  var sh = P.shape(c, name);
  P.ellipse(sh, [d, d]);
  var f = P.contents(sh).addProperty("ADBE Vector Graphic - Fill");
  P.contents(sh).property(f.propertyIndex).property("ADBE Vector Fill Color").setValue(color);
  P.tf(sh.layer, "ADBE Position").setValue(center);
  return sh.layer;
}

var W = 1080, H = 1920, FPS = 24, DUR = 5, FOLDER = "art SKU3 05", DIR = args.artDir;
var TOGETHER = !!args.together;
var FADE = TOGETHER ? 25 / 24 : (args.fade || 0.4);
var TIMES = TOGETHER ? [0, 0, 0, 0, 0, 0] : [0, 0.50, 1.05, 1.50, 2.00, 2.69];
var FILES = ["region-01-corran.png", "region-02-vell.png", "region-03-ostrum.png", "region-04-kessa.png", "region-05-drae.png", "region-06-marrow.png"];
var NAMES = ["Corran", "Vell", "Ostrum", "Kessa", "Drae", "Marrow"];
var COLORS = ["#FF6B3D", "#C8401F", "#FF9A6C", "#9E2F1C", "#FF8150", "#E0532E"];
var SUBS = ["Opens 4 March", "Opens 11 March", "Opens 18 March", "Opens 25 March", "Opens 1 April", "Opens 8 April"];
var MAPC = [540, 710];

var c = P.freshComp("SKU3 05 map", W, H, FPS, DUR, [16 / 255, 24 / 255, 33 / 255]);
backdrop(c, DIR, FOLDER);
var MONO = "IBMPlexMono-Medium", COND = "BarlowSemiCondensed-SemiBold", BODY = "Montserrat-Medium";

// Map: base, regions (06 at the bottom, 01 on top; they do not overlap), names.
var base = c.layers.add(ART.footage(DIR, "map-base.png", FOLDER));
base.name = "Map base";
P.tf(base, "ADBE Position").setValue(MAPC);
var regions = [], k, j;
for (k = 5; k >= 0; k--) {
  var rl = c.layers.add(ART.footage(DIR, FILES[k], FOLDER));
  rl.name = "Region 0" + (k + 1) + " " + NAMES[k];
  P.tf(rl, "ADBE Position").setValue(MAPC);
  regions[k] = rl;
}
var names = c.layers.add(ART.footage(DIR, "names.png", FOLDER));
names.name = "Names";
P.tf(names, "ADBE Position").setValue(MAPC);

// List: two columns of three, circles 86 px at a 170 px pitch; each row's parts fade with its region.
var rows = [];
for (k = 0; k < 6; k++) {
  var cx = k < 3 ? 123 : 593, cy = 1290 + (k % 3) * 170, col = ART.hex(COLORS[k]), row = [];
  row.push(disc(c, "List " + (k + 1) + " circle", [cx, cy], 86, col));
  row.push(txt(c, "0" + (k + 1), { size: 34, color: [1, 1, 1], font: "Montserrat-Black", just: "C", x: cx, cy: cy, name: "List " + (k + 1) + " number" }));
  row.push(txt(c, NAMES[k].toUpperCase(), { size: 44, color: col, font: COND, just: "L", x: cx + 70, bottom: cy - 6, name: "List " + (k + 1) + " title" }));
  row.push(txt(c, SUBS[k], { size: 28, color: ART.hex("#A9B3C4"), font: BODY, just: "L", x: cx + 70, top: cy + 10, name: "List " + (k + 1) + " sub" }));
  rows.push(row);
}
txt(c, "SIX REGIONS, ONE LAUNCH", { size: 68, color: ART.hex("#EEF2F8"), font: COND, just: "C", x: 540, top: 164, name: "Heading" });
txt(c, "SPRING ROLLOUT", { size: 30, color: ART.hex("#FF6B3D"), font: MONO, just: "C", x: 540, top: 100, name: "Kicker" });

// The technique: opacity fades, staggered in list order.
for (k = 0; k < 6; k++) {
  fadeUp(regions[k], TIMES[k], FADE);
  if (!TOGETHER) for (j = 0; j < rows[k].length; j++) fadeUp(rows[k][j], TIMES[k], FADE); // the build's list does not fade
}
return { comp: c.name, id: c.id, layers: c.numLayers, together: TOGETHER, fade: FADE, faded: FADED.length, fontWarnings: FONT_WARN.join("; ") };
