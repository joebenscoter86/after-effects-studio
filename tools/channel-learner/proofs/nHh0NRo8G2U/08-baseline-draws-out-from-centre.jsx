// nHh0NRo8G2U technique 08: the chart's baseline draws out to both ends from its middle over frames 0-12
// (Trim Start 50 -> 0 and End 50 -> 100, S-curve on all four keys), in its real setting: the bar chart of 07 builds
// on it from frame 7. Tall comp 1080 x 1920, 23.976 fps, 4 s.
// args: prelude; optional scale, srcCentre, values, font, artDir (unused).
// Brief options (art run): frameCentre, color, labelColor, labelSize (recipe px), texts (static setting text, see NH.dressing).
//
// VERIFY: baseline Start reads 50 at f0, about 25 at f6, 0 at f12; End mirrors it (both ends equidistant from the centre)
// VERIFY: the Start keys' speed is negative (falling value) and After Effects accepts it; return.eases shows the speeds set
// VERIFY: return.warn: labels past the left edge at the default SCALE 1.4 (see 07)
$.evalFile(args.prelude);
var DIR = args.libDir || (new File(args.prelude)).parent.fsName;   // the libraries sit beside the prelude
$.evalFile(DIR + "/art.jsx");
$.evalFile(DIR + "/nh-core-lib.jsx");
$.evalFile(DIR + "/nh-chart-lib.jsx");

var SCALE = (args.scale !== undefined) ? args.scale : 1.4;
var SRC_CENTRE = args.srcCentre || [960, 540];
var FRAME_CENTRE = args.frameCentre || [540, 960];  // where SRC_CENTRE lands in the tall frame
var FRAMES = 96; // ASSUMED: 4 s
var FACES = [args.font || "Satoshi-Bold", "Poppins-Bold", "Montserrat-ExtraBold"];

var M = NH.mapper(SCALE, SRC_CENTRE, FRAME_CENTRE);
var c = NH.scene("nHh0 08 baseline from centre", FRAMES);
var ch = NHC.barChart(c, M, { values: args.values, faces: FACES, animateBaseline: true,
  color: args.color, labelColor: args.labelColor, labelSize: args.labelSize });
var setting = NH.dressing(c, args.texts);

var trim = ch.baseline.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property("ADBE Vector Filter - Trim");
var st = trim.property("ADBE Vector Trim Start"), en = trim.property("ADBE Vector Trim End");
return {
  comp: c.name, id: c.id, layers: c.numLayers, scale: SCALE,
  checks: "Start f0/f6/f12 " + NH.r1(st.valueAtTime(0, false)) + "/" + NH.r1(st.valueAtTime(NH.t(6), false)) + "/" + NH.r1(st.valueAtTime(NH.t(12), false)) +
    "; End f0/f6/f12 " + NH.r1(en.valueAtTime(0, false)) + "/" + NH.r1(en.valueAtTime(NH.t(6), false)) + "/" + NH.r1(en.valueAtTime(NH.t(12), false)),
  warn: ch.warn.join(" | "), eases: ch.report, fonts: NH.fontReport()
};
