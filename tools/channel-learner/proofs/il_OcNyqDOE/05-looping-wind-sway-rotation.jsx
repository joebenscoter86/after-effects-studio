// il_OcNyqDOE technique 05: endless wind sway from two Z Rotation keys (+11 degrees over 23 frames, linear) and loopOut("pingpong").
// Scene: 08's third-run scene without rain or leaves (v2 art, near branches at Z -650, 04's camera at Aperture 400).
// args { prelude, artLib, scene, aperture, override, deg, frames, trees }. 96 frames (two full 46-frame swings and a bit).
// Anchors from proof/05/art/brief.md: Branch L (7,1167), Branch R (871,1167) - the stem bases; Position compensated so nothing jumps.
// ASSUMED: both branches get the same +11 / 23 frames with the loop (the recipe's second branch reads about +6 over 24 frames, unread,
//   and is not seen getting the expression; the art brief asks for both). The camera holds its 3 s key after 3 s.
$.evalFile(args.prelude);
$.evalFile(args.artLib);
$.evalFile(args.scene);
var c = HW.comp("il_O 05 sway", 96 / 23.976);
var L = HW.build(c, { depth: true, grade: true, prefix: "", v2: true, override: args.override });
var cam = HW.camera(c, "Woman", args.aperture);
HW.setAnchor(c.layer("Branch L"), [7, 1167]);
HW.setAnchor(c.layer("Branch R"), [871, 1167]);
HW.sway(c, c.layer("Branch L"), args.deg, args.frames);
HW.sway(c, c.layer("Branch R"), args.deg, args.frames);
var out = { comp: c.name, id: c.id, frames: Math.round(c.duration * c.frameRate) };
var rz = c.layer("Branch L").property("ADBE Transform Group").property("ADBE Rotate Z");
var s = [], f;
for (f = 0; f <= 92; f += 11) s.push(f + ":" + Math.round(rz.valueAtTime(f / c.frameRate, false) * 100) / 100);
out.branchL = s.join(" ");
out.posL = c.layer("Branch L").property("ADBE Transform Group").property("ADBE Position").value.join(",");
out.posR = c.layer("Branch R").property("ADBE Transform Group").property("ADBE Position").value.join(",");
return out;
