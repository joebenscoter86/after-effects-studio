// eoBEBx1PbS4 technique 01, second half: recipe steps 11-12, run AFTER the owner's hand step (see 01-bevelled-3d-text-material-texture.jsx).
// args { prelude, scene, scale (default 17, the recipe's; the brief asks for one tile repeat of about 375 px of comp: tune), seed (default 0) }
$.evalFile(args.prelude);
$.evalFile(args.scene);
var c = null, i;
for (i = 1; i <= app.project.numItems; i++) if (app.project.item(i) instanceof CompItem && app.project.item(i).name === "eoBE 01 tides") c = app.project.item(i);
if (!c) throw new Error("run 01-bevelled-3d-text-material-texture.jsx first");
TIDES.texture(c.layer("TIDES"), args.scale || 17, args.seed || 0);
return { comp: c.name, scale: args.scale || 17, seed: args.seed || 0 };
