// Technique 02: labels that rise out of their own bar segment (recipe 02-labels-rise-from-behind-the-bar).
// Builds on 01 (the bar, drawing on). Each label keys Position from 61 px lower (inside the bar) to its final place over
// 12 frames (label 1 at 10-22 f, label 2 at 32-44 f), eased cubic-bezier 0.04, 0.47, 0.53, 0.93, with an inverted alpha
// track matte to its own segment and its in-point at its first key. Step pictures sit still (recipe 01's setting).
// args: prelude, lib; optional artDir, artLib, artFolder, labels, scale, centre, segColors, labelColor, labelFaces, labelSize, stepHeights, ground.
//
// VERIFY: layer.setTrackMatte(segment, TrackMatteType.ALPHA_INVERTED) keeps the segment visible (recipe build notes)
// VERIFY: spatial Position eases: out of key 1 KeyframeEase(avg x 11.75, 4), into key 2 KeyframeEase(avg x 0.149, 47)
$.evalFile(args.prelude);
$.evalFile(args.lib);
NH.init(args, "02");
var c = NH.scene("02", "label rise", 96, "#000000"); // ASSUMED: 4 s, as 01
var r = NH.content(c, { rise: true, pop: false, arrows: false });
if (NH.artDir) NH.dress(c); // art brief: kicker, headline, source
var p1 = P.tf(r.labels[0], "ADBE Position"), p2 = P.tf(r.labels[1], "ADBE Position");
return NH.report(c, {
  label1Y: "f10 " + NH.r1(p1.valueAtTime(NH.t(10), false)[1]) + ", f13 " + NH.r1(p1.valueAtTime(NH.t(13), false)[1]) + ", f22 " + NH.r1(p1.valueAtTime(NH.t(22), false)[1]),
  label2Y: "f32 " + NH.r1(p2.valueAtTime(NH.t(32), false)[1]) + ", f44 " + NH.r1(p2.valueAtTime(NH.t(44), false)[1]),
  mattes: r.labels[0].trackMatteType + " / " + r.labels[1].trackMatteType
});
