// nHh0NRo8G2U technique 11: a short stat line beside the pie of 10 rises in one word at a time: each word layer
// starts 49 px low and shoots up over 16 f (Fast In curve), 2 frames apart from frame 40, no fade (recipe 11). The
// optional stop-motion finish (Posterize Time 12 and a Transform jitter) is on unless args.finish is false.
// Tall comp 1080 x 1920, 23.976 fps, 4 s.
// args: prelude; optional scale, srcCentre, pieLabel (five words, number first), font, finish, artDir (unused).
// Brief options (art run): frameCentre, baseColor, sliceColor, pieFinished (pie static, swept and pushed out), labelSize
// (recipe px), labelColor, texts (static setting text).
//
// VERIFY: return.warn: at the default SCALE 1.6 centred on 960,540 the line starts at x ~749 and runs far past the right edge; the brief must shorten the line, lower SCALE or move SRC_CENTRE
// VERIFY: Satoshi-Black is not installed on this Mac; return.fonts says which face was used (Montserrat-Black next)
// VERIFY: the five word layers read as one line with ordinary word spaces at rest (x from measured widths of the line's own prefixes)
// VERIFY: SUBSTITUTE check: DecomposeText's per-word layers are built directly, one text layer per word
// VERIFY: Transform effect Position expression posterizeTime(6); wiggle(222, 4.8) shakes the whole frame about +/-5 px every 4 frames
$.evalFile(args.prelude);
var DIR = args.libDir || (new File(args.prelude)).parent.fsName;   // the libraries sit beside the prelude
$.evalFile(DIR + "/art.jsx");
$.evalFile(DIR + "/nh-core-lib.jsx");
$.evalFile(DIR + "/nh-chart-lib.jsx");

var SCALE = (args.scale !== undefined) ? args.scale : 1.6;
var SRC_CENTRE = args.srcCentre || [960, 540];
var FRAME_CENTRE = args.frameCentre || [540, 960];  // where SRC_CENTRE lands in the tall frame
var FRAMES = 96; // ASSUMED: 4 s; the last word lands at 64 f
var FACES = [args.font || "Satoshi-Black", "Montserrat-Black", "Poppins-Bold"];

var M = NH.mapper(SCALE, SRC_CENTRE, FRAME_CENTRE);
var c = NH.scene("nHh0 11 label word by word", FRAMES);
var pie = NHC.pie(c, M, { baseColor: args.baseColor, sliceColor: args.sliceColor, finished: args.pieFinished });
var lab = NHC.wordLabel(c, M, { label: args.pieLabel, faces: FACES, size: args.labelSize, color: args.labelColor });
var setting = NH.dressing(c, args.texts);
var fin = (args.finish === false) ? null : NHC.stopMotionFinish(c, M);

return {
  comp: c.name, id: c.id, layers: c.numLayers, scale: SCALE,
  line: lab.lineBox + " (recipe 1093-1493 x 375-402, mapped " + M.pt(1093, 375).join(",") + " to " + M.pt(1493, 402).join(",") + ")",
  finish: fin ? "TECH Posterize Time, TECH Jitter" : "off",
  warn: lab.warn.join(" | "), eases: lab.report, fonts: NH.fontReport()
};
