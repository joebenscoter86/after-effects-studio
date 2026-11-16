// Technique 09: Camera Lens Blur at the frame sides (centre circle subtracted) plus fine monochrome Noise, over the 08 plate.
// args: prelude, artLib, discs, artDir (PROOF/08/art), screenMode.
// Camera Lens Blur: Repeat Edge Pixels is the checkbox named "Edge Behavior"; Iris Shape default 4 is Hexagon (checked on the run).
// Noise: Use Color Noise is the checkbox named "Noise Type", Clip Result Values the one named "Clipping" (checked on the run).
// Drop Shadow Opacity reads 0-255 by script: the recipe's 19 % is 48.45 (fix pass; 19 rendered 7.5 %).
// ASSUMED: pairs 9-11 start at 5.30, 5.90, 6.50 s (the recipe's finished example has eleven; starts not given).
$.evalFile(args.prelude);
$.evalFile(args.artLib);
$.evalFile(args.discs);
var r = PD.build("09 edge-lens-blur-and-noise-finish", 10, [0, 0.66, 1.37, 2.14, 2.90, 3.50, 4.10, 4.73, 5.30, 5.90, 6.50], args.artDir, args.screenMode);
var c = r.comp, i;
// Brief: the title group lifts softly off the plate (Drop Shadow from the finished example; no Invert, our ink is black).
for (i = 1; i < r.type.length; i++) {
  var ds = P.effect(r.type[i], "ADBE Drop Shadow");
  var md = ART.setFx(ds, { "Shadow Color": [0, 0, 0], "Opacity": args.dsOpacity !== undefined ? args.dsOpacity : 48.45, "Direction": 135, "Distance": 43, "Softness": 338 });
  if (md.length) throw new Error("drop shadow params: " + md.join(", "));
}
var lb = c.layers.addSolid([1, 1, 1], "TECH edge lens blur", 1920, 1080, 1, c.duration);
lb.adjustmentLayer = true;
var cb = P.effect(lb, "ADBE Camera Lens Blur");
var mb = ART.setFx(cb, { "Blur Radius": 5, "Edge Behavior": 1, "Use Linear Working Space": 1 });
var m = PD.ellipseMask(lb, 960, 540, 540);
m.maskMode = MaskMode.SUBTRACT;
lb.property("ADBE Mask Parade").property(1).property("ADBE Mask Feather").setValue([135, 135]);
var nz = c.layers.addSolid([1, 1, 1], "TECH grain", 1920, 1080, 1, c.duration);
nz.adjustmentLayer = true;
var ne = P.effect(nz, "ADBE Noise");
var mn = ART.setFx(ne, { "Amount of Noise": 8, "Noise Type": 0, "Clipping": 1 });
return { comp: c.name, id: c.id, layers: c.numLayers, bevelMiss: r.bevelMiss.join(", "), lensMiss: mb.join(", "), noiseMiss: mn.join(", "), fontSubs: PD.subs.join(" | ") };
