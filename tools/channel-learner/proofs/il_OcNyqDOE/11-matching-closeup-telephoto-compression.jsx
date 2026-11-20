// il_OcNyqDOE technique 11: a long-lens close-up that reuses the wide shot's pieces: sky, far town and a tree pushed far back in Z
// and scaled up, the character sharp at Z 0, the wide shot's camera (depth of field on) and rain, and the grain layer brought in
// with its eye off. Values from proof/11/art/brief.md and layout.json. Still, 4 s.
// args { prelude, artLib, scene, aperture, charGamma, charOutWhite }.
// Camera as recipe 11 step 5: Two-Node, zoom 2666.7, Depth of Field on, Focus Distance 2343.7 (a plain value, as shown),
//   placed at (960,540,-2343.7) looking at (960,540,0) (ASSUMED: position not shown; layout.json is computed for it).
// Character grade = recipe 11 step 9 (as built in 13): Tritone white / #1C3C4C (ASSUMED hex) / black, Blend 32 %;
//   SUBSTITUTE Curves deep sag (0.56 -> 0.09, white point 0.36) by Levels Gamma args.charGamma, Output White args.charOutWhite; Tint 72 %.
//   Cartoon (present but switched off in the tutorial) is not added: it renders nothing.
// FOUND BY BUILDING (aim, not a recipe value): Aperture, set for the recipe's measured cypress trunk edge (about 0.75 % of the width).
$.evalFile(args.prelude);
$.evalFile(args.artLib);
$.evalFile(args.scene);
var A11 = "/Users/joeb/after-effects-studio/.claude/worktrees/agent-eyes-stage-7-f1d606/quality/renders/channel-study/il_OcNyqDOE/proof/11/art";
var A13 = "/Users/joeb/after-effects-studio/.claude/worktrees/agent-eyes-stage-7-f1d606/quality/renders/channel-study/il_OcNyqDOE/proof/13/art/cut";
var c = HW.comp("il_O 11 closeup", 4);
function put(item, name, z, x, y, s, mirror) {
  var l = c.layers.add(item);
  l.moveToBeginning();
  l.name = name;
  l.threeDLayer = true;
  P.tf(l, "ADBE Position").setValue([x, y, z]);
  P.tf(l, "ADBE Scale").setValue([mirror ? -s : s, s, s]);
  return c.layer(name);
}
put(ART.footage(A11, "sky-closeup.png", "art il_O 11"), "Sky", 7940, -983.6, 863.9, 462.8, false);
put(ART.footage(HW.ART, "town.png", HW.FOLDER), "Town", 4730, 2816.8, 969.7, 504, true);
var cy = put(ART.footage(HW.ART + "/cut", "cypress.png", HW.FOLDER), "Cypress", 4170, -915.9, 750.1, 305.3, false);
HW.grade(cy, "full", "");
var ch = put(ART.footage(A13, "character-v2.png", "art il_O 13"), "Character", 0, 953.0, 539.1, 127.4, false);
var tri = P.effect(ch, "ADBE Tritone");
tri = ch.property("ADBE Effect Parade").property(1);
HW.prop(tri, "Highlights").setValue([1, 1, 1, 1]);
HW.prop(tri, "Midtones").setValue([28 / 255, 60 / 255, 76 / 255, 1]);
HW.prop(tri, "Shadows").setValue([0, 0, 0, 1]);
HW.prop(tri, "Blend With Original").setValue(32);
var lv = P.effect(ch, "ADBE Easy Levels2");
lv.name = "Curves (Levels stand-in)";
lv = ch.property("ADBE Effect Parade").property(2);
HW.prop(lv, "Gamma").setValue(args.charGamma);
HW.prop(lv, "Output White").setValue(args.charOutWhite);
var tn = P.effect(ch, "ADBE Tint");
tn = ch.property("ADBE Effect Parade").property(3);
HW.prop(tn, "Map Black To").setValue([0, 0, 0, 1]);
HW.prop(tn, "Map White To").setValue([1, 1, 1, 1]);
HW.prop(tn, "Amount to Tint").setValue(72);
// The wide shot's rain and grain layers (recipe 11 step 4); the grain layer's eye is off, as shown.
var r = HW.rain(c, "Rain");
var g = HW.solid(c, "il_O Grain 11", [1, 1, 1], "Grain");
g.adjustmentLayer = true;
g.moveToBeginning();
var ag = P.effect(g, "VISINF Grain Implant");
ag = g.property("ADBE Effect Parade").property(1);
HW.prop(ag, "Viewing Mode").setValue(3);
ag.property("VISINF Grain Implant-0005").setValue(1);
c.layer("Grain").enabled = false;
// Camera.
var cam = c.layers.addCamera("Camera 1", [960, 540]);
cam.autoOrient = AutoOrientType.CAMERA_OR_POINT_OF_INTEREST;
var co = cam.property("ADBE Camera Options Group");
co.property("ADBE Camera Zoom").setValue(2666.7);
co.property("ADBE Camera Depth of Field").setValue(1);
co.property("ADBE Camera Focus Distance").setValue(2343.7);
co.property("ADBE Camera Aperture").setValue(args.aperture);
cam.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([960, 540, 0]);
cam.property("ADBE Transform Group").property("ADBE Position").setValue([960, 540, -2343.7]);
var names = [], i;
for (i = 1; i <= c.numLayers; i++) names.push(c.layer(i).name);
return { comp: c.name, id: c.id, order: names.join(" / ") };
