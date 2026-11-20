// il_OcNyqDOE technique 13: side-light a face with a Curves adjustment layer, a heavily feathered pen mask down the
// frame-right side of the face and hair, and an Alpha track matte to the character so only she is lit.
// args { prelude, artLib, scene, charOutWhite, charGamma, rgbGamma, redGamma, maskX }. Still, 4 s.
// The relight is the layer "TECH Relight": switch it off for the before frame.
// Character grade = recipe 11 step 9's pasted stack (Tritone white / slate / black, Blend 32 %; Curves deep sag; Tint 72 %).
// SUBSTITUTE (11's grade): the Curves sag (0.56 -> 0.09, white point -> about 0.36) by Levels Gamma args.charGamma, Output White args.charOutWhite,
//   tuned to land her skin near 11's measured (67, 65, 61); it is the scene's grade, not this technique.
// SUBSTITUTE (13): the Curves points (RGB 0.40 -> 0.485, Red 0.55 -> 0.42) by Levels (Individual Controls) Gamma args.rgbGamma
//   and Red Gamma args.redGamma, tuned to the recipe's measured shift: lit cheek (65,63,60) -> (60,75,72).
// VERIFY: Layer.setTrackMatte(layer, TrackMatteType.ALPHA) (AE 2023+); Mask Feather on "ADBE Mask Feather"; Tritone Midtones colour
//   for 11's stack is not given as hex: 02's #1C3C4C ASSUMED.
$.evalFile(args.prelude);
$.evalFile(args.artLib);
$.evalFile(args.scene);
var DIR = "~/Assets/comp-room-studies/channel-study/il_OcNyqDOE/proof/13/art";
var c = HW.comp("il_O 13 relight", 4);
var bd = c.layers.add(ART.footage(DIR, "backdrop.png", "art il_O 13"));
bd.name = "Backdrop";
var ch = c.layers.add(ART.footage(DIR + "/cut", "character.png", "art il_O 13"));
ch.moveToBeginning();
ch.name = "Character";
P.tf(ch, "ADBE Position").setValue([952, 539]);
P.tf(ch, "ADBE Scale").setValue([145, 145]);
// Recipe 11 step 9 stack on the character.
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
// The wide scene's rain, brought into the close-up (recipe 11 step 4).
var r = HW.rain(c, "Rain");
// Recipe 13 steps 1-5.
var a = HW.solid(c, "il_O Relight", [1, 1, 1], "TECH Relight");
a.adjustmentLayer = true;
a.moveToBeginning();
var cv = P.effect(a, "ADBE Pro Levels2");
cv.name = "Curves (Levels stand-in)";
cv = a.property("ADBE Effect Parade").property(1);
HW.prop(cv, "Gamma").setValue(args.rgbGamma);
HW.prop(cv, "Red Gamma").setValue(args.redGamma);
// Pen mask: a closed path down the frame-right side of the face and hair, off the top and bottom of the frame.
var m = a.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
m = a.property("ADBE Mask Parade").property(1);
var sh = new Shape();
sh.vertices = [[args.maskX, -200], [2120, -200], [2120, 1280], [args.maskX, 1280]];
sh.closed = true;
m.property("ADBE Mask Shape").setValue(sh);
m.property("ADBE Mask Feather").setValue([143, 143]);
m.maskMode = MaskMode.ADD;
m.inverted = false;
// Track matte: Alpha to the character, not inverted (the character stays visible).
a = c.layer("TECH Relight");
a.setTrackMatte(c.layer("Character"), TrackMatteType.ALPHA);
c.layer("Character").enabled = true; // setTrackMatte switches the matte layer's eye off; the character is the picture, so it stays on
return { comp: c.name, id: c.id, order: [c.layer(1).name, c.layer(2).name, c.layer(3).name, c.layer(4).name].join(" / "), matte: a.trackMatteType == TrackMatteType.ALPHA, charVisible: c.layer("Character").enabled };
