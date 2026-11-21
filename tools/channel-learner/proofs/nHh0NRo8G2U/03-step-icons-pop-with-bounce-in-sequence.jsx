// Technique 03: step pictures that pop in one after another with a small bounce (recipe 03-step-icons-pop-with-bounce-in-sequence).
// Builds on 01 and 02 (bar drawing on, labels rising). Each picture keys Scale 0 -> full over 12 frames, S-curve ease
// (influence 88 %, speed 0.159 x full / 0.5 s), the inertial-bounce expression (amp .1, freq 2, decay 2) on Scale, and the
// six start 10 frames apart from frame 22 (keys 22-34 ... 72-84). SUBSTITUTE: Motion Tools' Sequence (offset 10) and Flow's
// curve are set as key times and KeyframeEase values.
// args: prelude, lib; optional artDir, artLib, artFolder, labels, scale, centre, segColors, labelColor, labelFaces, labelSize, stepHeights, ground.
//
// VERIFY: Scale on a 2D layer takes three values and three eases per side
// VERIFY: the bounce expression evaluates without error (array * number) and overshoots about 2.5 % 1-3 frames after the last key
$.evalFile(args.prelude);
$.evalFile(args.lib);
NH.init(args, "03");
var c = NH.scene("03", "step pop", 120, "#000000"); // ASSUMED: 5 s (the last picture settles near frame 100)
var r = NH.content(c, { rise: true, pop: true, arrows: false });
if (NH.artDir) NH.dress(c); // art brief: kicker, headline, source
var sc = P.tf(r.steps[2], "ADBE Scale"); // picture 3: keys 42-54
return NH.report(c, {
  step3Scale: "f42 " + NH.r1(sc.valueAtTime(NH.t(42), false)[0]) + ", f48 " + NH.r1(sc.valueAtTime(NH.t(48), false)[0]) +
    ", f54 " + NH.r1(sc.valueAtTime(NH.t(54), false)[0]) + ", f56 " + NH.r1(sc.valueAtTime(NH.t(56), false)[0]) + " (with expression)"
});
