// Probe: grass-thin.png flat at 100 % on grey, with (args.on) or without Wave Warp at 06's values, to measure the ripple
// in the layer's own pixels. Comp "il_O probe wave"; args.remove deletes it.
$.evalFile(args.prelude);
$.evalFile(args.artLib);
$.evalFile(args.scene);
var c = HW.comp("il_O probe wave", 2);
if (args.remove) { c.remove(); return "removed"; }
c.bgColor = [0.5, 0.5, 0.5];
var l = c.layers.add(ART.footage("/Users/joeb/after-effects-studio/.claude/worktrees/agent-eyes-stage-7-f1d606/quality/renders/channel-study/il_OcNyqDOE/proof/06/art", "grass-thin.png", "art il_O 06"));
P.tf(l, "ADBE Position").setValue([960, 540]);
var w = P.effect(l, "ADBE Wave Warp");
w = l.property("ADBE Effect Parade").property(1);
HW.prop(w, "Wave Width").setValue(65);
w.enabled = !!args.on;
return { comp: c.name, on: w.enabled };
