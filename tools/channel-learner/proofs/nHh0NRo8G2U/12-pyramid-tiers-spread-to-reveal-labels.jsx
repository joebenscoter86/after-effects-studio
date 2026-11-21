// nHh0NRo8G2U technique 12: a black-and-white pyramid of three registered tiers squeezes in for half a second, then
// the top shoots up and the base drops in a burst that eases to rest (keys 0, 13, 35 f; reshaped speed graph; inertial
// bounce), revealing "level" labels hidden behind the tiers in the opening gaps; Hue/Saturation and Levels grade on top
// (recipe 12). Tall comp 1080 x 1920, 23.976 fps, 3 s.
// args: prelude; optional scale, srcCentre, artDir (tier-top.png, tier-middle.png, tier-base.png), tierBox
// ([x0, y0, x1, y1]: the closed pyramid in art pixels; default the whole canvas), levels ([upper, lower]), font,
// labelPos ([[x, y], [x, y]] recipe px, upper then lower label centre; default the measured 959,327 / 959.5,759).
//
// VERIFY: closed pyramid spans about x 22-1058, y 704-1215 (recipe 351-1571 x 239-840 at SCALE 0.85)
// VERIFY: top tier Position y at f24 is moving fastest (about 1850 x 0.85 = 1570 px/s) and at f35 reads rest - 191; the bounce adds about 2 px past the key at f36
// VERIFY: labels hidden by the tiers until the gaps open (in-points 17 f); they sit below the tiers in the stack
// VERIFY: return.grade: Levels unit (1 or 255) read from the fresh effect, and the values read back as 27/255 and 196/255 of it
$.evalFile(args.prelude);
var DIR = args.libDir || (new File(args.prelude)).parent.fsName;   // the libraries sit beside the prelude
$.evalFile(DIR + "/art.jsx");
$.evalFile(DIR + "/nh-core-lib.jsx");
$.evalFile(DIR + "/nh-pyramid-lib.jsx");

var SCALE = (args.scale !== undefined) ? args.scale : 0.85;
var SRC_CENTRE = args.srcCentre || [960, 540];
var FRAME_CENTRE = args.frameCentre || [540, 960];  // where SRC_CENTRE lands in the tall frame
var FRAMES = 72; // ASSUMED: 3 s; the spread settles at 35 f
var FACES = [args.font || "Satoshi-Bold", "Poppins-Bold", "Montserrat-ExtraBold"]; // ASSUMED: "a heavy geometric sans"

var M = NH.mapper(SCALE, SRC_CENTRE, FRAME_CENTRE);
var c = NH.scene("nHh0 12 pyramid tiers", FRAMES);
var py = NHP.build(c, M, { artDir: args.artDir, artFolder: "art 12", tierBox: args.tierBox, levels: args.levels, labelPos: args.labelPos, faces: FACES });

var tp = P.tf(py.top, "ADBE Position");
return {
  comp: c.name, id: c.id, layers: c.numLayers, scale: SCALE, art: py.art,
  checks: "top y f0/f13/f24/f35/f36 " + NH.r1(tp.valueAtTime(0, false)[1]) + "/" + NH.r1(tp.valueAtTime(NH.t(13), false)[1]) + "/" +
    NH.r1(tp.valueAtTime(NH.t(24), false)[1]) + "/" + NH.r1(tp.valueAtTime(NH.t(35), false)[1]) + "/" + NH.r1(tp.valueAtTime(NH.t(36), false)[1]) +
    " (keys " + M.pt(960, 540)[1] + ", +" + NH.r1(M.len(15)) + ", -" + NH.r1(M.len(225)) + ")",
  labels: NH.boxStr(NH.inkBox(py.labels[0], 40)) + " / " + NH.boxStr(NH.inkBox(py.labels[1], 40)),
  warn: py.warn.join(" | "), eases: py.report, fonts: NH.fontReport()
};
