// Technique 01: slider-driven MM:SS countdown timer (Source Text expression), beat "Ready in 15 minutes".
// Slider Control sits on the text layer; keys 905 at 0 s and 900 at 5 s, linear; the clock lands on 15:00 and holds.
//
// VERIFY:
// - "ADBE Slider Control" is the match name of Slider Control; its first property is the "Slider" (fetched by index 1).
// - Expression engine must already be Legacy ExtendScript (lead set it); if the Source Text errors, read app.project.expressionEngine.
// - "Montserrat-Black" and "Montserrat-SemiBold" are the PostScript names; check d.font read back and isSubstitute (returned).
// - TextDocument.leading / autoLeading = false / tracking (1/1000 em) exist in this version.
// - "ADBE Ramp" match name and its property names "ADBE Ramp-0001".."ADBE Ramp-0005"; shape 1 = linear, 2 = radial (I use 1).
// - Vector rect names: "ADBE Vector Shape - Rect", "ADBE Vector Rect Size", "ADBE Vector Rect Position", "ADBE Vector Graphic - Fill", "ADBE Vector Fill Color".
// - Keyframe interpolation is linear by default for setValueAtTime keys (I also set it explicitly with LINEAR enum).
// - Centred paragraph point text keeps its origin at horizontal centre, so anchor x from sourceRect centre stays about 0 as digits change.
$.evalFile(args.prelude);

var W = 1080, H = 1920;
var c = P.freshComp("01 slider countdown", W, H, 30, 6.5, [0, 0, 0]);

// ---------- ground: dark kitchen scene (built first, so it ends up at the bottom after we move it) ----------
var wall = P.solid(c, "kitchen wall", [0.05, 0.04, 0.035]);
var ramp = P.effect(wall, "ADBE Ramp");
ramp.property("ADBE Ramp-0001").setValue([W / 2, 0]);
ramp.property("ADBE Ramp-0002").setValue([0.16, 0.11, 0.08]);
ramp.property("ADBE Ramp-0003").setValue([W / 2, H * 0.55]);
ramp.property("ADBE Ramp-0004").setValue([0.035, 0.03, 0.028]);
ramp.property("ADBE Ramp-0005").setValue(1);

// rectangles helper: one shape layer, many rects, one fill
function rectLayer(name, rects, color, opacity) {
  var sh = P.shape(c, name);
  var i, r, rp;
  for (i = 0; i < rects.length; i++) {
    r = P.contents(sh).addProperty("ADBE Vector Shape - Rect");
    r.property("ADBE Vector Rect Size").setValue([rects[i][2], rects[i][3]]);
    r.property("ADBE Vector Rect Position").setValue([rects[i][0], rects[i][1]]);
  }
  var f = P.contents(sh).addProperty("ADBE Vector Graphic - Fill");
  var idx = f.propertyIndex;
  P.contents(sh).property(idx).property("ADBE Vector Fill Color").setValue(color);
  sh.layer.property("ADBE Transform Group").property("ADBE Opacity").setValue(opacity);
  return sh.layer;
}

// backsplash tile grout lines (faint)
var grout = [];
var k;
for (k = 0; k < 14; k++) grout.push([W / 2, 160 + k * 95, W, 3]);
for (k = 0; k < 12; k++) grout.push([k * 100 + 20, 760, 3, 1520]);
rectLayer("tile grout", grout, [0.3, 0.22, 0.16], 35);

// window glow, top left (warm, far from the clock)
var win = rectLayer("window", [[250, 330, 340, 420]], [0.55, 0.42, 0.25], 30);
// shelf with jars silhouettes
rectLayer("shelf", [[W / 2, 640, 900, 14], [250, 590, 70, 90], [420, 580, 90, 110], [820, 595, 80, 80]], [0.09, 0.07, 0.06], 100);
// counter at the bottom (below the clock)
rectLayer("counter top", [[W / 2, 1560, W, 18]], [0.35, 0.25, 0.17], 100);
rectLayer("counter", [[W / 2, 1760, W, 320]], [0.07, 0.055, 0.045], 100);
// pot on the counter
rectLayer("pot", [[800, 1485, 220, 130], [800, 1405, 250, 14]], [0.12, 0.1, 0.09], 100);

// darken veil so the area behind the digits stays under about 15 % brightness
var veil = P.solid(c, "clock shade", [0, 0, 0]);
veil.property("ADBE Transform Group").property("ADBE Opacity").setValue(35);

// ---------- the clock ----------
var clock = P.text(c, "0", { size: 200, font: "Montserrat-Black", name: "clock", tracking: 0, pos: [W / 2, H * 0.52] });

// leading 160 px, tracking 0 (recipe)
var tp = clock.property("ADBE Text Properties").property("ADBE Text Document");
var d = tp.value;
d.autoLeading = false;
d.leading = 160;
d.tracking = 0;
tp.setValue(d);
var fontUsed = clock.property("ADBE Text Properties").property("ADBE Text Document").value.font;

// Slider Control on the text layer itself (recipe step 3)
var sl = P.effect(clock, "ADBE Slider Control");
var slName = sl.name;

// Source Text expression, exactly as the recipe quotes it (the missing semicolon before else is the author's)
var expr = "slider = Math.round(effect(\"Slider Control\")(\"Slider\"))  \n" +
  "    \n" +
  "sec = slider%60 \n" +
  "min = Math.floor(slider/60) \n" +
  "\n" +
  "function addZero(n){ if (n<10) return \"0\" + n else return n } \n" +
  "\n" +
  "addZero(min) + \":\" + addZero(sec)";
clock.property("ADBE Text Properties").property("ADBE Text Document").expression = expr;

// keys: 905 at 0 s, 900 at 5 s, linear (the beat's values; recipe keys 60 -> 0)
var slider = clock.property("ADBE Effect Parade").property(1).property(1);
slider.setValueAtTime(0, 905);
slider.setValueAtTime(5, 900);
slider = clock.property("ADBE Effect Parade").property(1).property(1);
slider.setInterpolationTypeAtKey(1, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
slider.setInterpolationTypeAtKey(2, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);

// ---------- label READY IN ----------
// digits ~147 px tall centred at y 998 -> top 925; baseline 0.35 * 147 = 51 px above -> 874. Cap height ~ 37 px -> size ~53.
var lab = P.text(c, "READY IN", { size: 53, font: "Montserrat-SemiBold", name: "label READY IN", tracking: 200, pos: [W / 2, 874] });
// anchor on the baseline (text origin) so position is the baseline
lab.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([0, 0]);
lab.property("ADBE Transform Group").property("ADBE Position").setValue([W / 2, 874]);
lab.property("ADBE Transform Group").property("ADBE Opacity").setValue(80);

// layer order: clock and label on top
clock.moveToBeginning();
lab.moveToBeginning();

var cd = clock.property("ADBE Text Properties").property("ADBE Text Document").value;
return { comp: c.name, id: c.id, font: fontUsed, isSubstitute: cd.isSubstitute, sliderName: slName, engine: app.project.expressionEngine, layers: c.numLayers };
