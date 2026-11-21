// nHh0NRo8G2U technique 09: a faint grey Grid behind the bar chart, held inside the chart's box by an alpha track
// matte, and the whole chart stepped to 12 fps with Posterize Time (recipe 09), on the chart of 07 with the baseline
// of 08. Tall comp 1080 x 1920, 23.976 fps, 4 s.
// Before frame: switch off TECH Grid (and TECH Posterize Time, which a still does not show).
// args: prelude; optional scale, srcCentre, values, font, artDir (unused).
// Brief options (art run): frameCentre, color, labelColor, labelSize (recipe px), texts (static setting text, see NH.dressing).
//
// VERIFY: the grid shows only inside the matte (x 657-1264, y 268-735 mapped) and the matte's magenta never shows
// VERIFY: Grid lines at 1.4 px Border render faint, clearly below the labels' brightness; if brighter, lower Grid Opacity (recipe build notes)
// VERIFY: Posterize Time "Frame Rate" 12 holds each picture for 2 frames
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
var c = NH.scene("nHh0 09 grid clipped", FRAMES);
var G = NHC.gridUnderChart(c, M);                 // steps 2-6, under every chart layer, above Background
var ch = NHC.barChart(c, M, { values: args.values, faces: FACES, animateBaseline: true,
  color: args.color, labelColor: args.labelColor, labelSize: args.labelSize });
var setting = NH.dressing(c, args.texts);
var pt = NH.posterize(c, "TECH Posterize Time", 12); // step 7, top of the stack

return {
  comp: c.name, id: c.id, layers: c.numLayers, scale: SCALE,
  grid: "cell " + NH.r1(M.len(44)) + " x " + NH.r1(M.len(45)) + " px, border " + NH.r1(M.len(1)) + ", matte " + NH.r1(M.len(607)) + " x " + NH.r1(M.len(467)) + " at " + M.pt(960, 501).join(","),
  matte: G.grid.trackMatteType + " / matte layer " + G.matte.name + " enabled " + G.matte.enabled,
  tech: "TECH Grid, TECH Grid matte, TECH Posterize Time",
  warn: ch.warn.join(" | "), fonts: NH.fontReport()
};
