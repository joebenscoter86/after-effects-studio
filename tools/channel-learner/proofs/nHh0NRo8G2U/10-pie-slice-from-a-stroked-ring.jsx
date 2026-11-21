// nHh0NRo8G2U technique 10: a pie from one fat stroke (Stroke 131 over an Ellipse 127.9, so the ring closes to a
// disc): a lilac base and an 18 % yellow slice sweep on clockwise from twelve o'clock over 0-24 f, then the slice
// slides out along its own centre line over about 28-44 f (recipe 10). Tall comp 1080 x 1920, 23.976 fps, 3 s.
// args: prelude; optional scale, srcCentre, share (percent, default 18), artDir (unused).
// Brief options (art run): frameCentre, baseColor, sliceColor, texts (static setting text, e.g. the brief's static label).
//
// VERIFY: the disc renders about 259 x SCALE px across (127.9 + 131, mapped), solid, no hole at the centre
// VERIFY: the wedge runs from twelve o'clock clockwise to about 64.8 degrees, and the base's notch is exactly where it came from
// VERIFY: after the push the black gap along both straight edges of the wedge is even (about 20 x SCALE px)
$.evalFile(args.prelude);
var DIR = args.libDir || (new File(args.prelude)).parent.fsName;   // the libraries sit beside the prelude
$.evalFile(DIR + "/art.jsx");
$.evalFile(DIR + "/nh-core-lib.jsx");
$.evalFile(DIR + "/nh-chart-lib.jsx");

var SCALE = (args.scale !== undefined) ? args.scale : 1.6;
var SRC_CENTRE = args.srcCentre || [960, 540];
var FRAME_CENTRE = args.frameCentre || [540, 960];  // where SRC_CENTRE lands in the tall frame
var FRAMES = 72; // ASSUMED: 3 s; the push ends at 44 f (comp length unknown)

var M = NH.mapper(SCALE, SRC_CENTRE, FRAME_CENTRE);
var c = NH.scene("nHh0 10 pie slice", FRAMES);
var pie = NHC.pie(c, M, { share: args.share, baseColor: args.baseColor, sliceColor: args.sliceColor });
var setting = NH.dressing(c, args.texts);

return {
  comp: c.name, id: c.id, layers: c.numLayers, scale: SCALE,
  disc: "ellipse " + NH.r1(M.len(127.9)) + ", stroke " + NH.r1(M.len(131)) + ", disc about " + NH.r1(M.len(127.9 + 131)) + " px at " + M.pt(960, 540).join(","),
  push: "slice " + M.pt(960, 540).join(",") + " -> " + M.pt(980, 510).join(","),
  eases: pie.report
};
