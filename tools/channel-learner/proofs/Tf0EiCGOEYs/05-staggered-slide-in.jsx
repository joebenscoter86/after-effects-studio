// Tf0EiCGOEYs technique 05: the card's elements slide in from off the left edge in a 5-frame cascade (recipe 05).
// The end card of recipe 03 (button comp "Tf0E 05 button" with its shadows). Each of headline, button, web address gets
// two Position keys 47 frames apart, X only, start = rest - 1063 px; eased 65 % out / 65 % in at speed 0; motion blur on.
// Headline 0 -> 47, button 5 -> 52, address 10 -> 57. The tap cursor is parked off the picture at (1208, 980), unkeyed.
// 1080 x 1920, 60 fps, 3 s (180 frames). args: prelude, lib (tf0e-lib.jsx).
//
// VERIFY: return.checks: headline X at frame 27 = 217.2; address X at 27 = -322.5; button X at 27 = -86.7 (recipe's readouts)
// VERIFY: the parked cursor at (1208, 1400) is fully outside the 1080-wide frame (its left edge at 1108)
// VERIFY: motion blur renders (layer switches and comp switch both on)
$.evalFile(args.prelude);
$.evalFile(args.lib);
$.evalFile(args.artLib); // art run: args.artLib (art.jsx), args.art (PROOF/<n>/art), args.artFolder ("art <n>")

var BLOCK_X = 0, BLOCK_Y = 420; // the tutorial's square block: x unchanged, y + 420 in the 9:16 frame
var HEADLINE_POS = [541.2 + BLOCK_X, 255.7 + BLOCK_Y];
var BUTTON_POS = [540 + BLOCK_X, 540 + BLOCK_Y];
var ADDRESS_POS = [541.2 + BLOCK_X, 959.6 + BLOCK_Y];
var CURSOR_PARK = [1208 + BLOCK_X, 980 + BLOCK_Y]; // step 0: below and right of the square, out of the picture
var ENTRY_DX = -1063, ENTRY_FRAMES = 47, STAGGER = 5;
var FRAMES = 180; // ASSUMED: 3 s; the last element lands at frame 57 and the card then holds

var cc = T.cursorComp("Tf0E 05 cursor", FRAMES);
var b = T.buttonComp({ name: "Tf0E 05 button", frames: FRAMES, shadows: true, prefix: "" });
var c = T.scene("Tf0E 05 staggered slide in", FRAMES);
var L = T.card(c, b, { button: BUTTON_POS, address: ADDRESS_POS, headline: HEADLINE_POS });
var icon = T.icon(c, args.art, args.artFolder, L.headline);
T.artGround(c, args.art, args.artFolder);

var cl = c.layers.add(cc);
cl.name = "Cursor";
P.tf(cl, "ADBE Position").setValue(CURSOR_PARK);

// Steps 2-6. SUBSTITUTE: the stagger made by sliding layer bars is built by adding the offsets to the key times
// (the recipe's build notes allow either; the picture is the same and layer in-points stay at 0).
var order = [[L.headline, HEADLINE_POS[0]], [L.button, BUTTON_POS[0]], [L.address, ADDRESS_POS[0]]];
var i, f0;
for (i = 0; i < order.length; i++) {
  f0 = i * STAGGER;
  T.slideKeys(order[i][0], [[f0, order[i][1] + ENTRY_DX], [f0 + ENTRY_FRAMES, order[i][1]]]);
}
T.motionBlur(c, [L.headline, L.button, L.address, icon, cl]);
// Run second: the recipe's measured smear (full ramp about 120 comp px at peak speed) needs a long shutter.
// args.shutter sets comp.shutterAngle (0-720); args.samples sets motion-blur samples per frame. Phase left at the default.
if (args.shutter !== undefined) c.shutterAngle = args.shutter;
if (args.samples !== undefined) c.motionBlurSamplesPerFrame = args.samples;

return {
  comp: c.name, id: c.id, layers: c.numLayers, shutter: c.shutterAngle + " / phase " + c.shutterPhase + " / samples " + c.motionBlurSamplesPerFrame + " (limit " + c.motionBlurAdaptiveSampleLimit + ")",
  checks: "frame 27 X: headline " + T.xAt(L.headline, 27) + " (want 217.2), address " + T.xAt(L.address, 27) +
    " (want -322.5), button " + T.xAt(L.button, 27) + " (want -86.7); frame 2 headline " + T.xAt(L.headline, 2) + " (want -520.2)",
  fonts: T.fontReport(), fontSubstitute: T.anySubstitute()
};
