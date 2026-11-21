// SKU3QdqKLOs technique 03: round-capped bars that grow to their own values. Art build (PROOF/03/art/brief.md).
// Null "Controls" with one Slider Control per bar ("Value 1" ... "Value 7"), each 0 at 0:00 to its figure at 3:00,
// Easy Ease. Per bar: a vertical two-point path drawn bottom first, 35 px Round-cap stroke, no fill; the dim track
// (#2C2837) under a copy in the brief's accent (#FF6B3D in place of the recipe's #FFC600) whose Trim Paths End is that
// bar's slider, so it rises from the baseline as a pill. Path 496 px, columns 112 px apart (recipe). Seven columns,
// Monday to Sunday, as the brief lays them out. The author-pass stand-in version is 03-bars-grow-to-values-first.jsx.
//
// args: prelude, artLib, lib, artDir. Optional: args.stagger (frames between bars' keys, default 0 = the build's
// shared timing), args.ease (Easy Ease influence %, default 33.33), args.countLabels (default true).
$.evalFile(args.prelude);
$.evalFile(args.artLib);
$.evalFile(args.lib);

function barLine(c, name, x, yBottom, yTop, color, sliderName) {
  var sh = P.shape(c, name);
  P.path(sh, [[x, yBottom], [x, yTop]], null, null, false); // bottom vertex first
  P.stroke(sh, color, 35, 2); // 35 px, Round cap, no fill
  if (sliderName) {
    var t = P.contents(sh).addProperty("ADBE Vector Filter - Trim");
    P.contents(sh).property(t.propertyIndex).property("ADBE Vector Trim End").expression = sliderRef(sliderName);
  }
  P.tf(sh.layer, "ADBE Position").setValue([0, 0]);
  P.tf(sh.layer, "ADBE Anchor Point").setValue([0, 0]);
  return sh.layer;
}

var W = 1080, H = 1920, FPS = 24, DUR = 5, FOLDER = "art SKU3 03";
var VALUES = [54, 64, 71, 58, 86, 41, 33], DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
var N = 7, GAP = 112, X0 = 204, TOP = 785.5, BOTTOM = 1281.5, LEN = BOTTOM - TOP;
var STAG = (args.stagger || 0) / FPS, EASE = args.ease || 33.33;
var COUNT = args.countLabels !== false;
var c = P.freshComp("SKU3 03 bars", W, H, FPS, DUR, [16 / 255, 24 / 255, 33 / 255]);
backdrop(c, args.artDir, FOLDER);
var MONO = "IBMPlexMono-Medium", COND = "BarlowSemiCondensed-SemiBold", BODY = "Montserrat-Medium";

txt(c, "Share of daily listening goal reached.", { size: 34, color: ART.hex("#A9B3C4"), font: BODY, just: "C", x: 540, top: 1436, name: "Caption" });
txt(c, "WEEKDAYS WIN", { size: 72, color: ART.hex("#EEF2F8"), font: COND, just: "C", x: 540, top: 507, name: "Heading" });
txt(c, "LISTENING HOURS, ONE WEEK", { size: 30, color: ART.hex("#FF6B3D"), font: MONO, just: "C", x: 540, top: 430, name: "Kicker" });
var p, i;
for (p = 0; p <= 100; p += 25) txt(c, p + "%", { size: 22, color: ART.hex("#5D6778"), font: MONO, just: "R", x: 150, cy: BOTTOM - LEN * p / 100, name: "Scale " + p });
for (i = 0; i < N; i++) txt(c, DAYS[i], { size: 26, color: ART.hex("#A9B3C4"), font: MONO, just: "C", x: X0 + i * GAP, cy: 1345, name: "Day " + DAYS[i] });

var ctl = c.layers.addNull();
ctl.name = "Controls";
for (i = 0; i < N; i++) slider(ctl, "Value " + (i + 1), VALUES[i], i * STAG, i * STAG + 3, EASE);
for (i = 0; i < N; i++) {
  barLine(c, "Track " + DAYS[i], X0 + i * GAP, BOTTOM, TOP, [44 / 255, 40 / 255, 55 / 255, 1], null); // #2C2837
  barLine(c, "Bar " + DAYS[i], X0 + i * GAP, BOTTOM, TOP, ART.hex("#FF6B3D").concat([1]), "Value " + (i + 1));
}
for (i = 0; i < N; i++) {
  var vl = txt(c, VALUES[i] + "%", { size: 30, color: [1, 1, 1], font: "Montserrat-Black", just: "C", x: X0 + i * GAP, cy: 722, name: "Value label " + DAYS[i] });
  // The finished example counts its labels up with the bars; the tip's labels are static. Counting is on by default.
  if (COUNT) vl.property("ADBE Text Properties").property("ADBE Text Document").expression = "Math.round(" + sliderRef("Value " + (i + 1)) + ') + "%"';
}
ctl.moveToBeginning();
return { comp: c.name, id: c.id, layers: c.numLayers, bars: N, fontWarnings: FONT_WARN.join("; ") };
