// il_OcNyqDOE technique 10: one adjustment layer at the top of the finished rainy shot: Add Grain (Final Output,
// Kodak Vision 500T (5279), Monochromatic), Curves, Posterize 14, in that order.
// args { prelude, artLib, scene, aperture, twirl, quad, preroll, preset, viewMode }. Scene = 08's comp rebuilt (3 s).
// The stack is the layer "TECH Finish": switch it off for the before frame.
// VERIFY: Add Grain Viewing Mode Final Output = args.viewMode (3?); Preset Kodak Vision 500T (5279) = args.preset (9?: 8th after [None]).
// SUBSTITUTE: the Curves point (input 0.54 -> output 0.47) cannot be set by script; Levels Output White 217/255 (0.85) stands in
// (recipe build notes: about the curve's 11-19 % drop in a dark scene, but it also dims highlights the curve leaves alone).
$.evalFile(args.prelude);
$.evalFile(args.artLib);
$.evalFile(args.scene);
var c = HW.comp("il_O 10 grain", 72 / 23.976);
var L = HW.build(c, { depth: true, grade: true, prefix: "", v2: args.v2 });
var cam = HW.camera(c, "Woman", args.aperture);
var lv = HW.leaves(c, { preroll: args.preroll, twirl: args.twirl, quad: args.quad, gravity: args.gravity, gravVec: args.gravVec, birthRate: args.birthRate, birthSize: args.birthSize, deathSize: args.deathSize });
var r = HW.rain(c, "Rain");
var f = HW.solid(c, "il_O Finish", [1, 1, 1], "TECH Finish");
f.adjustmentLayer = true;
f.moveToBeginning();
var g = P.effect(f, "VISINF Grain Implant");
g = f.property("ADBE Effect Parade").property(1);
HW.prop(g, "Viewing Mode").setValue(args.viewMode);
HW.prop(g, "Preset").setValue(args.preset);
g.property("VISINF Grain Implant-0005").setValue(1); // Color > Monochromatic
var lv2 = P.effect(f, "ADBE Easy Levels2");
lv2.name = "Curves (Levels stand-in)";
lv2 = f.property("ADBE Effect Parade").property(2);
HW.prop(lv2, "Output White").setValue(217 / 255);
var po = P.effect(f, "ADBE Posterize");
po = f.property("ADBE Effect Parade").property(3);
HW.prop(po, "Level").setValue(14);
g = c.layer("TECH Finish").property("ADBE Effect Parade").property(1);
return { comp: c.name, id: c.id, layers: c.numLayers, top: c.layer(1).name, grainMode: HW.prop(g, "Viewing Mode").value, preset: HW.prop(g, "Preset").value, mono: g.property("VISINF Grain Implant-0005").value };
