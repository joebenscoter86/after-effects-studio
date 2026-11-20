// il_OcNyqDOE technique 06: grass rippling with Wave Warp (Sine, Height 10, Width 65, Direction 90, Speed 1, Pinning None),
// added below each grass layer's Tritone and Curves.
// Scene: 05's comp (v2 art, near branches at Z -650 swaying, 04's camera at Aperture 400) with grass-thin.png on Grass 1-3
// (proof/06/art/brief.md). 72 frames (the tutorial's 3 s work area).
// args { prelude, artLib, scene, aperture, override, width }.
// VERIFY: Wave Warp display names "Wave Width", "Wave Height", "Direction", "Wave Speed", "Wave Type", "Pinning", "Phase".
// Not built: step 4's duplicated grass layer (inferred, never shown; our three tiles already make the band).
$.evalFile(args.prelude);
$.evalFile(args.artLib);
$.evalFile(args.scene);
var G = "~/Assets/comp-room-studies/channel-study/il_OcNyqDOE/proof/06/art";
var files = { "Grass 1": [G, "grass-thin.png", "art il_O 06"], "Grass 2": [G, "grass-thin.png", "art il_O 06"], "Grass 3": [G, "grass-thin.png", "art il_O 06"] };
var c = HW.comp("il_O 06 grass", 72 / 23.976);
var L = HW.build(c, { depth: true, grade: true, prefix: "", v2: true, override: args.override, files: files });
var cam = HW.camera(c, "Woman", args.aperture);
HW.setAnchor(c.layer("Branch L"), [7, 1167]);
HW.setAnchor(c.layer("Branch R"), [871, 1167]);
HW.sway(c, c.layer("Branch L"), 11, 23);
HW.sway(c, c.layer("Branch R"), 11, 23);
// Third run: args.tallFile = "grass-short-r.png", tallXY [1160, 755] (brief v3).
// Second run (06/art/brief.md v2): "Grass Tall R", grass-tall-r.png, 3D, Z -830, X,Y args.tallXY (1160, 770 in the brief), 54.9 %,
// 02's grade, then the same Wave Warp; just above Woman, below Grass 1-3 and the branches. Art only: same Z and Wave Warp.
var names = ["Grass 1", "Grass 2", "Grass 3"], i, w, read = [];
var TN = args.tallName || "Grass Tall R";
if (args.tallXY) {
  var gt = c.layers.add(ART.footage(G, args.tallFile || "grass-tall-r.png", "art il_O 06"));
  gt.name = TN;
  gt.threeDLayer = true;
  P.tf(gt, "ADBE Position").setValue([args.tallXY[0], args.tallXY[1], -830]);
  P.tf(gt, "ADBE Scale").setValue([54.9, 54.9, 54.9]);
  gt.moveBefore(c.layer("Woman"));
  HW.grade(c.layer(TN), "full", "");
  names.push(TN);
}
for (i = 0; i < names.length; i++) {
  w = P.effect(c.layer(names[i]), "ADBE Wave Warp");
  w = c.layer(names[i]).property("ADBE Effect Parade").property(w.propertyIndex);
  w.name = "TECH Wave Warp";
  w = c.layer(names[i]).property("ADBE Effect Parade").property("TECH Wave Warp");
  HW.prop(w, "Wave Width").setValue(args.width);
}
w = c.layer("Grass 2").property("ADBE Effect Parade").property("TECH Wave Warp");
for (i = 1; i <= w.numProperties; i++) { try { read.push(w.property(i).name + "=" + w.property(i).value); } catch (e) {} }
return { comp: c.name, id: c.id, frames: Math.round(c.duration * c.frameRate), waveWarp: read.join("; "), stack: c.layer("Grass 2").property("ADBE Effect Parade").property(1).name + " > " + c.layer("Grass 2").property("ADBE Effect Parade").property(2).name + " > " + c.layer("Grass 2").property("ADBE Effect Parade").property(3).name };
