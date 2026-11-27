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

// ---------- ground: the brief's kitchen backdrop (art/backdrop.png), static, bottom layer ----------
var artFolder = app.project.items.addFolder("art 01");
var io = new ImportOptions(new File(args.art));
var footage = app.project.importFile(io);
footage.parentFolder = artFolder;
var kitchen = c.layers.add(footage);
kitchen.name = "kitchen";
kitchen.property("ADBE Transform Group").property("ADBE Position").setValue([W / 2, H / 2]);

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

// FIX: the expression was first evaluated with a stale JavaScript-engine error ("Unexpected token else"); re-applying it clears the error under Legacy ExtendScript.
var tdp = clock.property("ADBE Text Properties").property("ADBE Text Document");
tdp.expression = "";
tdp.expression = expr;

var cd = clock.property("ADBE Text Properties").property("ADBE Text Document").value;
return { comp: c.name, id: c.id, font: fontUsed, isSubstitute: cd.isSubstitute, sliderName: slName, engine: app.project.expressionEngine, layers: c.numLayers };
