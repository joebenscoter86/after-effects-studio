// nHh0NRo8G2U technique 13: the pyramid of 12, as a precomp, is split at 25 f (its fastest moment); the second piece is
// a 206 % close-up of the lower gap and its label. Both pieces drift up through the cut (keys 18 -> 34 f), the close-up
// holds, then glides down to the next label (69 -> 90 f); Posterize Time 12 on top (recipe 13).
// Tall comp 1080 x 1920, 23.976 fps, 5 s; precomp "nHh0 13 pyramid" (1080 x 1920) holds recipe 12's scene.
// args: prelude; optional scale, srcCentre, closeupLabelLeft (x where the close-up's lower label starts), artDir,
// tierBox, levels, font, labelPos (as in 12).
//
// VERIFY: the cut at 25 f is invisible as a transition: both pieces moving up on either side of it
// VERIFY: return.closeup: the lower label at rest (f40) starts at about x 136 and sits a little below centre; after the slide (f100) the upper label is where the lower one was
// VERIFY: layer.duplicate() puts the copy directly above the original; outPoint / inPoint trims match Split Layer
$.evalFile(args.prelude);
var DIR = args.libDir || (new File(args.prelude)).parent.fsName;   // the libraries sit beside the prelude
$.evalFile(DIR + "/art.jsx");
$.evalFile(DIR + "/nh-core-lib.jsx");
$.evalFile(DIR + "/nh-pyramid-lib.jsx");

var SCALE = (args.scale !== undefined) ? args.scale : 0.85;
var SRC_CENTRE = args.srcCentre || [960, 540];
var FRAME_CENTRE = args.frameCentre || [540, 960];  // where SRC_CENTRE lands in the tall frame
var FRAMES = 120; // ASSUMED: 5 s; the slide down ends at 90 f
var CUT = 25;
// The recipe's close-up is 206 % of the 16:9 precomp. In the 9:16 frame that shows the whole split pyramid (both gaps,
// both labels, an empty black band below), so the close-up is framed by what it shows instead (review run first):
// about 650-700 recipe px of the scene's height, centred between the middle tier's top and the settled base's bottom,
// so only the lower gap and its label are in view. args.closeupScale overrides (recipe value 206).
var CLOSEUP_SCALE = (args.closeupScale !== undefined) ? args.closeupScale : 330;
var FOCUS_Y = (args.closeupFocusY !== undefined) ? args.closeupFocusY : (399 + 1063) / 2;   // recipe px at the frame's vertical centre
var DRIFT = 199;   // recipe: the second piece drifts 333 -> 134, 199 px up, 18 -> 34 f
// The close-up in the recipe puts "level 1" at x 242 of 1920 (12.6 % of the width). Mapped uniformly that lands off the
// tall frame (about x -70), so the close-up piece alone is shifted sideways to keep the label's share of the width.
// Vertical positions, scale and every travel stay on the uniform mapping.
var CLOSEUP_LABEL_LEFT = (args.closeupLabelLeft !== undefined) ? args.closeupLabelLeft : 242 / 1920 * NH.W;
var FACES = [args.font || "Satoshi-Bold", "Poppins-Bold", "Montserrat-ExtraBold"];

var M = NH.mapper(SCALE, SRC_CENTRE, FRAME_CENTRE);
var c = NH.scene("nHh0 13 match cut", FRAMES);
var pc = P.freshComp("nHh0 13 pyramid", NH.W, NH.H, NH.FPS, FRAMES / NH.FPS, [0, 0, 0]);
var py = NHP.build(pc, M, { artDir: args.artDir, artFolder: "art 13", tierBox: args.tierBox, levels: args.levels, labelPos: args.labelPos, faces: FACES });

// Step 2. SUBSTITUTE: Split Layer is a duplicate with trimmed out and in points.
var first = c.layers.add(pc);
first.name = "first piece";
first.collapseTransformation = true;   // brief: the tiers render from the 2x files, so the 206 % close-up stays sharp
var second = first.duplicate();
second.name = "second piece";
first.outPoint = NH.t(CUT);
second.inPoint = NH.t(CUT);
P.tf(second, "ADBE Scale").setValue([CLOSEUP_SCALE, CLOSEUP_SCALE]);

// The lower label's left ink edge inside the precomp, and where the close-up puts it.
var lower = py.labels[0];                                  // labels[0] is the lower gap's label
var lb = NH.inkBox(lower, 40);
var k0 = CLOSEUP_SCALE / 100;
var REST = [CLOSEUP_LABEL_LEFT - k0 * (lb.left - NH.W / 2), NH.H / 2 - k0 * (M.pt(960, FOCUS_Y)[1] - NH.H / 2)];
// Slide down: the labels' spacing inside the precomp x the close-up scale, so the upper label lands where the lower sat
// (recipe: 432 x 2.06 = 890 px, "exactly the gap between the two labels"); measured from the labels' ink boxes.
var ub = NH.inkBox(py.labels[1], 40);
var SLIDE = k0 * ((lb.top + lb.bottom) / 2 - (ub.top + ub.bottom) / 2);
var SHIFT_X = REST[0] - M.pt(352, 134)[0];

// Step 4: the shared upward drift, 18 -> 34 f on both pieces, S-curve.
var e1 = NH.keys(P.tf(first, "ADBE Position"), [[18, M.pt(960, 540)], [34, M.pt(960, 387)]], NH.SCURVE);
// Steps 3, 4, 6: second piece drifts up to its rest, holds, then slides down by the labels' gap x the close-up scale.
var e2 = NH.keys(P.tf(second, "ADBE Position"), [[18, [REST[0], REST[1] + M.len(DRIFT)]], [34, REST], [69, REST], [90, [REST[0], REST[1] + SLIDE]]], NH.SCURVE);

// Step 5.
NH.posterize(c, "Posterize Time", 12);

var at = function (f, lab) {
  var t = NH.t(f), p = P.tf(second, "ADBE Position").valueAtTime(t, false), b = NH.inkBox(lab, f), k = CLOSEUP_SCALE / 100;
  return "x " + NH.r1(p[0] + k * (b.left - NH.W / 2)) + "-" + NH.r1(p[0] + k * (b.right - NH.W / 2)) + ", y " + NH.r1(p[1] + k * (b.top - NH.H / 2)) + "-" + NH.r1(p[1] + k * (b.bottom - NH.H / 2));
};
return {
  comp: c.name, id: c.id, layers: c.numLayers, scale: SCALE, art: py.art,
  closeup: "scale " + CLOSEUP_SCALE + " %, rest " + NH.r1(REST[0]) + ", " + NH.r1(REST[1]) + ", slide " + NH.r1(SLIDE) + ", shift x " + NH.r1(SHIFT_X) + "; lower label at f40 " + at(40, py.labels[0]) + "; upper label at f100 " + at(100, py.labels[1]),
  eases: "first " + e1 + " || second " + e2, fonts: NH.fontReport()
};
