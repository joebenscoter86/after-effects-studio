// Tf0EiCGOEYs technique 08: the card leaves to the right in the same 5-frame cascade (recipe 08), the whole scene.
// Entrance (05): 47-frame slide-ins from rest - 1063 px; headline 0-47, button 5-52, address 10-57.
// Exit: hold key at rest, end key at rest + 1051 px, 45 frames apart, eased 65 / 65 at speed 0: headline 220-265,
// button 225-270, address 230-275 (the last two end past the comp's last frame, 269, already off screen).
// The tap after the timing pass: cursor (Scale 80 %, recipe 07's curved route and Easy Ease) at 73, 99, 162, 190;
// button Scale 100 / 85 / 100 % at 125, 131, 137, linear. Motion blur on. 1080 x 1920, 60 fps, 270 frames (4.5 s).
// args: prelude, lib (tf0e-lib.jsx).
//
// VERIFY: return.checks: headline X at frame 242.5 near 1066.7 (half way); button X at 269 about 1590, address about 1575
// VERIFY: no drift on the card layers during the hold 57-220 (keys 2 and 3 share a value; spatial tangents are zeroed)
// VERIFY: the frame is empty white from about frame 265 (the address's left edge passes 1080 before 269)
$.evalFile(args.prelude);
$.evalFile(args.lib);
$.evalFile(args.artLib); // art run: args.artLib (art.jsx), args.art (PROOF/<n>/art), args.artFolder ("art <n>")

var BLOCK_X = 0, BLOCK_Y = 420; // the tutorial's square block: x unchanged, y + 420 in the 9:16 frame
var HEADLINE_POS = [541.2 + BLOCK_X, 255.7 + BLOCK_Y];
var BUTTON_POS = [540 + BLOCK_X, 540 + BLOCK_Y];
var ADDRESS_POS = [541.2 + BLOCK_X, 959.6 + BLOCK_Y];
var ENTRY_DX = -1063, ENTRY_FRAMES = 47, EXIT_DX = 1051, EXIT_START = 220, EXIT_FRAMES = 45, STAGGER = 5;
var ROUTE_PTS = [[-106 + BLOCK_X, 1180 + BLOCK_Y], [694 + BLOCK_X, 590 + BLOCK_Y], [694 + BLOCK_X, 590 + BLOCK_Y], [1474 + BLOCK_X, 80 + BLOCK_Y]];
var ROUTE_FRAMES = [73, 99, 162, 190]; // step 2: moved earlier from 89, 127, 190, 233
var TAP = [[125, 100], [131, 85], [137, 100]]; // step 2: moved earlier from about 151, 158, 166
var CURSOR_SCALE = 80;
var FRAMES = 270; // step 8: comp shortened to 270 frames

var cc = T.cursorComp("Tf0E 08 cursor", FRAMES);
var b = T.buttonComp({ name: "Tf0E 08 button", frames: FRAMES, shadows: true, prefix: "" });
// SUBSTITUTE: Trim Comp to Work Area (menu command, not on screen) is the comp built at 270 frames.
var c = T.scene("Tf0E 08 staggered slide out", FRAMES);
var L = T.card(c, b, { button: BUTTON_POS, address: ADDRESS_POS, headline: HEADLINE_POS });
var icon = T.icon(c, args.art, args.artFolder, L.headline);
T.artGround(c, args.art, args.artFolder);


// Steps 1 and 3-9. SUBSTITUTE: removing and restoring the stagger by sliding layer bars is built by adding the 5- and
// 10-frame offsets to all four key times of each layer (the result the recipe measures on f053284).
var order = [[L.headline, HEADLINE_POS[0]], [L.button, BUTTON_POS[0]], [L.address, ADDRESS_POS[0]]];
var i, o, x;
for (i = 0; i < order.length; i++) {
  o = i * STAGGER;
  x = order[i][1];
  T.slideKeys(order[i][0], [[o, x + ENTRY_DX], [o + ENTRY_FRAMES, x], [o + EXIT_START, x], [o + EXIT_START + EXIT_FRAMES, x + EXIT_DX]]);
}
var cl = c.layers.add(cc);
cl.name = "Cursor";
T.setScale(cl, CURSOR_SCALE);
var cp = P.tf(cl, "ADBE Position");
T.curvedRoute(cp, ROUTE_FRAMES, ROUTE_PTS);
var bs = P.tf(L.button, "ADBE Scale");
T.scaleKeys(bs, TAP);
T.linear(bs);
T.motionBlur(c, [L.headline, L.button, L.address, icon, cl]);
// Run second: the recipe's measured smear (full ramp about 120 comp px at peak speed) needs a long shutter.
// args.shutter sets comp.shutterAngle (0-720); args.samples sets motion-blur samples per frame. Phase left at the default.
if (args.shutter !== undefined) c.shutterAngle = args.shutter;
if (args.samples !== undefined) c.motionBlurSamplesPerFrame = args.samples;

var hx = T.round1(P.tf(L.headline, "ADBE Position").valueAtTime(242.5 / 60, false)[0]);
return {
  comp: c.name, id: c.id, layers: c.numLayers, shutter: c.shutterAngle + " / phase " + c.shutterPhase + " / samples " + c.motionBlurSamplesPerFrame + " (limit " + c.motionBlurAdaptiveSampleLimit + ")",
  checks: "headline X at 242.5 = " + hx + " (want about 1066.7); at 269 button X " + T.xAt(L.button, 269) + " (want about 1590), address X " +
    T.xAt(L.address, 269) + " (want about 1575); hold check headline X at 100 = " + T.xAt(L.headline, 100) + " (want 541.2); entry check headline X at 27 = " +
    T.xAt(L.headline, 27) + " (want 217.2); cursor at 99 " + T.ptAt(cl, 99) + ", 162 " + T.ptAt(cl, 162),
  fonts: T.fontReport(), fontSubstitute: T.anySubstitute()
};
