// Technique 07: key a rough olive-green wall with a machine-learning keyer (art in PROOF/07/art).
// args: prelude, artLib, artDir, key ("corridor" | "keylight" | "none"), corridor (object of display-name values),
//       keylight (object of display-name values), backdrop (bool: graphics under him, recipe step 6; default false).
// The ML keyer is Corridor Key (Baskl), match name BsklCorKey. The bundled colour keyer of step 2 is Keylight (1.2), "Keylight 906".
// Checked on the run: the parameters are named as the recipe says. Defaults are Mode 1, Alpha Hint 0, Quality 2 (of 3), Auto Crop 1, Output 1 and Despill Strength 0.
//   The menu labels cannot be read by script; the render is a cutout on black.
// The build is run with key "corridor", corridor { "Despill Strength": 1 }.
// The stock try (before.png) was added to this comp by hand: Keylight with Screen Colour 55,62,35 (shadowed wall), then removed.
$.evalFile(args.prelude);
$.evalFile(args.artLib);
var c = P.freshComp("07 key-imperfect-green-screen", 1920, 1080, 24, 6, [0, 0, 0]);
c.parentFolder = ART.folder("art 07");
var plate = c.layers.add(ART.footage(args.artDir, "presenter.mp4", "art 07"));
plate.name = "plate";
plate.audioEnabled = false;
var out = { comp: c.name, id: c.id };
var fx, j, list = [], miss;
if (args.key === "corridor") {
  fx = P.effect(plate, "BsklCorKey");
  fx.name = "TECH Corridor Key";
  if (args.corridor) { miss = ART.setFx(fx, args.corridor); if (miss.length) throw new Error("Corridor Key params not found: " + miss.join(", ")); }
} else if (args.key === "keylight") {
  fx = P.effect(plate, "Keylight 906");
  fx.name = "Keylight (stock try)";
  if (args.keylight) { miss = ART.setFx(fx, args.keylight); if (miss.length) throw new Error("Keylight params not found: " + miss.join(", ")); }
}
if (fx) {
  fx = plate.property("ADBE Effect Parade").property(1);
  for (j = 1; j <= fx.numProperties; j++) {
    try { list.push(j + " " + fx.property(j).name + " = " + fx.property(j).value); } catch (e) { list.push(j + " " + fx.property(j).name); }
  }
  out.params = list.join(" | ");
}
return out;
