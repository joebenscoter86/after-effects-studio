// Probe: 07's leaf particles alone in a 30 s comp, no pre-roll, to see where Twirl sends them. args.remove deletes it.
$.evalFile(args.prelude);
$.evalFile(args.artLib);
$.evalFile(args.scene);
var c = HW.comp("il_O probe leaves", 30);
if (args.remove) { c.remove(); return "removed"; }
var lv = HW.leaves(c, { preroll: 0, twirl: args.twirl, quad: 13, velocity: args.velocity, axis: args.axis, gravity: args.gravity, gravVec: args.gravVec, resistance: args.resistance, birthRate: args.birthRate });
var pw = lv.property("ADBE Effect Parade").property(1);
if (args.camDist) pw.property("CC Particle World-0033").setValue(args.camDist);
return { comp: c.name };
