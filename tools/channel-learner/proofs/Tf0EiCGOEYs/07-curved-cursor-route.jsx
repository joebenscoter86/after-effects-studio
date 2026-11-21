// Tf0EiCGOEYs technique 07: a curved, eased cursor route in and out (recipe 07).
// Cursor (comp "Tf0E 07 cursor", static Scale 80 %) on four Position keys, all Easy Ease:
// 89 (-106, 1180) -> 127 (694, 590), hold to 190 (694, 590), exit to 233 (1474, 80). The entry leaves the start nearly
// straight up and bows up-left; the exit runs level from the button then curls up-right off the right edge (an S).
// The button's tap from 06 stays linear (153 / 159 / 165: 100 / 85 / 100 %). Card and 05 entrance kept as the scene.
// Motion blur on all layers and the comp. 1080 x 1920, 60 fps, 4.5 s (270 frames).
// args: prelude, lib (tf0e-lib.jsx). Optional: args.entrance (false = card static).
//
// VERIFY: setSpatialTangentsAtKey takes the tangents as offsets from the key in comp pixels (the recipe's figures are offsets)
// VERIFY: return.path samples: the entry crosses the left edge (x 0) about 80-83 % down the square (y about 1284-1316 here)
//         and the exit crosses the right edge (x 1080) about 39-40 % down (y about 841-852); the entry bows up-left of its chord
// VERIFY: no drift during the hold (frames 127-190 read (694, 1010))
// VERIFY: Easy Ease's influence is 33.33 (the recipe says the default; not seen whether it was changed)
$.evalFile(args.prelude);
$.evalFile(args.lib);
$.evalFile(args.artLib); // art run: args.artLib (art.jsx), args.art (PROOF/<n>/art), args.artFolder ("art <n>")

var BLOCK_X = 0, BLOCK_Y = 420; // the tutorial's square block: x unchanged, y + 420 in the 9:16 frame
var HEADLINE_POS = [541.2 + BLOCK_X, 255.7 + BLOCK_Y];
var BUTTON_POS = [540 + BLOCK_X, 540 + BLOCK_Y];
var ADDRESS_POS = [541.2 + BLOCK_X, 959.6 + BLOCK_Y];
var ROUTE_PTS = [[-106 + BLOCK_X, 1180 + BLOCK_Y], [694 + BLOCK_X, 590 + BLOCK_Y], [694 + BLOCK_X, 590 + BLOCK_Y], [1474 + BLOCK_X, 80 + BLOCK_Y]];
var ROUTE_FRAMES = [89, 127, 190, 233];
var TAP = [[153, 100], [159, 85], [165, 100]];
var CURSOR_SCALE = 80;
var FRAMES = 270; // ASSUMED: 4.5 s, the length technique 08 trims the scene to; the exit ends at 233

var cc = T.cursorComp("Tf0E 07 cursor", FRAMES);
var b = T.buttonComp({ name: "Tf0E 07 button", frames: FRAMES, shadows: true, prefix: "" });
var c = T.scene("Tf0E 07 curved cursor route", FRAMES);
var L = T.card(c, b, { button: BUTTON_POS, address: ADDRESS_POS, headline: HEADLINE_POS });
var icon = T.icon(c, args.art, args.artFolder, L.headline);
T.artGround(c, args.art, args.artFolder);

if (args.entrance !== false) {
  T.slideKeys(L.headline, [[0, HEADLINE_POS[0] - 1063], [47, HEADLINE_POS[0]]]);
  T.slideKeys(L.button, [[5, BUTTON_POS[0] - 1063], [52, BUTTON_POS[0]]]);
  T.slideKeys(L.address, [[10, ADDRESS_POS[0] - 1063], [57, ADDRESS_POS[0]]]);
}
var cl = c.layers.add(cc);
cl.name = "Cursor";
T.setScale(cl, CURSOR_SCALE);
// Steps 3-9: the rebuilt route (the first attempt of step 2 is not built).
var cp = P.tf(cl, "ADBE Position");
// Run second: recipe 07's corrected entry. Key 1 out [136, -296] and key 2 in [-87, 50] are the recipe's fit to the
// eleven played points (inferred); key 3 out [100, 0] (inferred, from the first run); key 4 in [-222, 399] (measured mid-drag).
var ROUTE_TANGENTS_07 = [
  [[0, 0], [136, -296]],
  [[-87, 50], [0, 0]],
  [[0, 0], [100, 0]],
  [[-222, 399], [0, 0]]
];
T.curvedRoute(cp, ROUTE_FRAMES, ROUTE_PTS, ROUTE_TANGENTS_07);
// Step 10: the button's tap stays linear.
var bs = P.tf(L.button, "ADBE Scale");
T.scaleKeys(bs, TAP);
T.linear(bs);
T.motionBlur(c, [L.headline, L.button, L.address, icon, cl]);
// Run second: shutter angle and phase from args (recipe: about 360-540 deg, phase about -180 to -270, centred).
if (args.shutter !== undefined) c.shutterAngle = args.shutter;
if (args.phase !== undefined) c.shutterPhase = args.phase;
var dense = [], tq;
for (tq = 89; tq <= 127; tq += 0.25) { var dv = cp.valueAtTime(tq / 60, false); dense.push(T.round1(dv[0]) + "," + T.round1(dv[1])); }

var samples = [], f;
for (f = 89; f <= 127; f += 4) samples.push(f + " " + T.ptAt(cl, f));
samples.push("150 " + T.ptAt(cl, 150));
for (f = 190; f <= 233; f += 4) samples.push(f + " " + T.ptAt(cl, f));
samples.push("233 " + T.ptAt(cl, 233));
return {
  comp: c.name, id: c.id, layers: c.numLayers,
  path: samples.join("; "),
  dense: dense.join(";"), shutter: c.shutterAngle + " / phase " + c.shutterPhase,
  fonts: T.fontReport(), fontSubstitute: T.anySubstitute()
};
