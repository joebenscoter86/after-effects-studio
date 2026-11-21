// Tf0EiCGOEYs technique 06: the cursor glides in and taps the button (recipe 06).
// Cursor (recipe 04's two discs, comp "Tf0E 06 cursor") at a static Scale 80 %, Position keyed linear and straight:
// frame 89 (-106, 1180) -> frame 127 (694, 590). Button Scale keyed linear: 153 100 %, 159 85 %, 165 100 %.
// Motion blur on every layer and the comp. The card and its 05 entrance (0-57) are kept as the scene the tap plays in.
// 1080 x 1920, 60 fps, 4 s (240 frames). args: prelude, lib (tf0e-lib.jsx). Optional: args.entrance (false = card static).
//
// VERIFY: the button precomp layer scales about its default anchor, the button comp centre (520, 265) = the pill centre
// VERIFY: return.checks: at frame 108 the cursor is half way, about (294, 1305) in the 9:16 frame; at frame 159 the button scale is 85
// VERIFY: at frame 89 the 160 px cursor at (-106, 1600) is fully off the left edge (right edge at -26)
$.evalFile(args.prelude);
$.evalFile(args.lib);
$.evalFile(args.artLib); // art run: args.artLib (art.jsx), args.art (PROOF/<n>/art), args.artFolder ("art <n>")

var BLOCK_X = 0, BLOCK_Y = 420; // the tutorial's square block: x unchanged, y + 420 in the 9:16 frame
var HEADLINE_POS = [541.2 + BLOCK_X, 255.7 + BLOCK_Y];
var BUTTON_POS = [540 + BLOCK_X, 540 + BLOCK_Y];
var ADDRESS_POS = [541.2 + BLOCK_X, 959.6 + BLOCK_Y];
var CURSOR_FROM = [-106 + BLOCK_X, 1180 + BLOCK_Y]; // off screen, below left
var CURSOR_TO = [694 + BLOCK_X, 590 + BLOCK_Y];     // on the button's right half
var CURSOR_SCALE = 80;
var FRAMES = 240; // ASSUMED: 4 s; the press ends at 165

var cc = T.cursorComp("Tf0E 06 cursor", FRAMES);
var b = T.buttonComp({ name: "Tf0E 06 button", frames: FRAMES, shadows: true, prefix: "" });
var c = T.scene("Tf0E 06 cursor taps button", FRAMES);
var L = T.card(c, b, { button: BUTTON_POS, address: ADDRESS_POS, headline: HEADLINE_POS });
var icon = T.icon(c, args.art, args.artFolder, L.headline);
T.artGround(c, args.art, args.artFolder);

if (args.entrance !== false) {
  // Context from technique 05 (in the comp when this section starts): 47-frame slide-ins, 5-frame stagger.
  T.slideKeys(L.headline, [[0, HEADLINE_POS[0] - 1063], [47, HEADLINE_POS[0]]]);
  T.slideKeys(L.button, [[5, BUTTON_POS[0] - 1063], [52, BUTTON_POS[0]]]);
  T.slideKeys(L.address, [[10, ADDRESS_POS[0] - 1063], [57, ADDRESS_POS[0]]]);
}
var cl = c.layers.add(cc);
cl.name = "Cursor";

// Step 1: static Scale 80 %, never keyed.
T.setScale(cl, CURSOR_SCALE);
// Steps 2-4: two linear keys, a straight line.
var cp = P.tf(cl, "ADBE Position");
T.keys(cp, [[89, CURSOR_FROM], [127, CURSOR_TO]]);
T.straight(cp);
T.linear(cp);
// Step 5: the press, 6 frames down and 6 back, linear.
var bs = P.tf(L.button, "ADBE Scale");
T.scaleKeys(bs, [[153, 100], [159, 85], [165, 100]]);
T.linear(bs);
T.motionBlur(c, [L.headline, L.button, L.address, icon, cl]);

return {
  comp: c.name, id: c.id, layers: c.numLayers,
  checks: "cursor at 89 " + T.ptAt(cl, 89) + ", 108 " + T.ptAt(cl, 108) + ", 127 " + T.ptAt(cl, 127) +
    "; button scale at 159 = " + T.round1(bs.valueAtTime(159 / 60, false)[0]) + ", at 156 = " + T.round1(bs.valueAtTime(156 / 60, false)[0]) + " (want 92.5)",
  fonts: T.fontReport(), fontSubstitute: T.anySubstitute()
};
