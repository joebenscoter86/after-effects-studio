// nHh0NRo8G2U technique 07: four thick stroked bars grow up from a shared baseline 10 frames apart, tallest first,
// while right-aligned value labels slide in from the left (recipe 07). The baseline is drawn and static here (its
// draw-on is technique 08). Tall comp 1080 x 1920, 23.976 fps, 4 s.
// args: prelude; optional scale, srcCentre, values (four strings, largest first), font, artDir (unused: no art files
// for this scene; the black `Background` layer is the one to swap).
// Brief options (art run): frameCentre, color, labelColor, labelSize (recipe px), texts (static setting text, see NH.dressing).
//
// VERIFY: return.warn: at the default SCALE 1.4 centred on 960,540 the labels' left ends fall left of the frame (about x -60); the brief may change SCALE or SRC_CENTRE (chart block centre x 898 fits at 1.4)
// VERIFY: Satoshi-Bold is not installed on this Mac; return.fonts says which face was used (Poppins-Bold next)
// VERIFY: bar 1 End reads about 50 % at frame 16 (half way, symmetric S-curve) and 100 % at 25
// VERIFY: label 1 x at frame 14 (7 frames into its 12) is about 20 px x SCALE short of its place (recipe layout)
// VERIFY: right-justified point text with anchor 0,0 puts Position at the right end of the baseline
$.evalFile(args.prelude);
var DIR = args.libDir || (new File(args.prelude)).parent.fsName;   // the libraries sit beside the prelude
$.evalFile(DIR + "/art.jsx");
$.evalFile(DIR + "/nh-core-lib.jsx");
$.evalFile(DIR + "/nh-chart-lib.jsx");

// Layout mapping: one uniform scale about the recipe frame's centre, placed on the tall frame's centre.
var SCALE = (args.scale !== undefined) ? args.scale : 1.4;
var SRC_CENTRE = args.srcCentre || [960, 540];
var FRAME_CENTRE = args.frameCentre || [540, 960];  // where SRC_CENTRE lands in the tall frame
var FRAMES = 96; // ASSUMED: 4 s; the build is done at frame 55 (comp length unknown in the recipe)
var FACES = [args.font || "Satoshi-Bold", "Poppins-Bold", "Montserrat-ExtraBold"];

var M = NH.mapper(SCALE, SRC_CENTRE, FRAME_CENTRE);
var c = NH.scene("nHh0 07 stroked bars", FRAMES);
var ch = NHC.barChart(c, M, { values: args.values, faces: FACES, animateBaseline: false,
  color: args.color, labelColor: args.labelColor, labelSize: args.labelSize });
var setting = NH.dressing(c, args.texts);

var end = ch.bars[0].property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property("ADBE Vector Filter - Trim").property("ADBE Vector Trim End");
var lp = P.tf(ch.labels[0], "ADBE Position");
return {
  comp: c.name, id: c.id, layers: c.numLayers, scale: SCALE, srcCentre: SRC_CENTRE.join(","),
  checks: "bar 1 End f16 " + NH.r1(end.valueAtTime(NH.t(16), false)) + " % (want ~50), f25 " + NH.r1(end.valueAtTime(NH.t(25), false)) +
    "; label 1 x f14 " + NH.r1(lp.valueAtTime(NH.t(14), false)[0]) + " vs final " + NH.r1(lp.valueAtTime(NH.t(19), false)[0]) + " (want ~" + NH.r1(20 * SCALE) + " short)",
  labelBoxes: ch.labelBoxes, warn: ch.warn.join(" | "), eases: ch.report, fonts: NH.fontReport()
};
