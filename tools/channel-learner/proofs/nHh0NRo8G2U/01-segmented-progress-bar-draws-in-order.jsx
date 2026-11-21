// Technique 01: a two-colour phase bar that draws on segment after segment (recipe 01-segmented-progress-bar-draws-in-order).
// One open 60 px stroke duplicated; Trim Paths Start/End split it 0-70 % (lime) and 71-100 % (pale blue); each End is keyed
// from its own Start (0-24 f and 20-44 f) with the S-curve 0.88, 0.14, 0.12, 0.86. Labels and step pictures sit at their
// final positions (recipe 01 layout: "for this recipe alone"). Phone frame: the recipe layout fitted with NH.SCALE.
// args: prelude, lib; optional artDir (step-1..6.png, backdrop.png), artLib, artFolder, labels, scale, centre, segColors, labelColor, labelFaces, labelSize, stepHeights, ground.
//
// VERIFY: see the VERIFY block at the top of nh-phase-lib.jsx (Trim Paths at the root, 1D eases, butt cap enum, fonts)
// VERIFY: comp duration 96 / 23.976 s gives 96 frames
$.evalFile(args.prelude);
$.evalFile(args.lib);
NH.init(args, "01");
var c = NH.scene("01", "phase bar", 96, "#000000"); // ASSUMED: 4 s (the recipe's preview stops at 4:00; the work area is inferred)
var r = NH.content(c, { rise: false, pop: false, arrows: false });
if (NH.artDir) NH.dress(c); // art brief: kicker, headline, source
var e1 = r.bars[0].property("ADBE Root Vectors Group").property(2).property("ADBE Vector Trim End");
var e2 = r.bars[1].property("ADBE Root Vectors Group").property(2).property("ADBE Vector Trim End");
return NH.report(c, {
  labelInk: NH.inkTop(r.labels[0]) + " / " + NH.inkTop(r.labels[1]) + " px (brief: 32 x SCALE)",
  bar1End: "f0 " + e1.valueAtTime(0, false) + ", f12 " + NH.r1(e1.valueAtTime(NH.t(12), false)) + ", f24 " + e1.valueAtTime(NH.t(24), false),
  bar2End: "f20 " + e2.valueAtTime(NH.t(20), false) + ", f32 " + NH.r1(e2.valueAtTime(NH.t(32), false)) + ", f44 " + e2.valueAtTime(NH.t(44), false)
});
