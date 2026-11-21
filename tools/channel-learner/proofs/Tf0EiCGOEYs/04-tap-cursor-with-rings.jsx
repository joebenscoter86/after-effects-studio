// Tf0EiCGOEYs technique 04: a tap cursor from two translucent discs in its own 200 x 200 comp (recipe 04), still.
// Cursor comp "Tf0E 04 cursor": outer disc 200 px, black fill, layer Opacity 25; inner disc 142 px, white, Opacity 40,
// on top; no strokes; black comp background as a viewing aid only. Nested as the top layer of the end card (recipe 03)
// at (298, 640) in the square, scale 100 %, half over the button's lower-left edge and half over its blue haze.
// 1080 x 1920, 60 fps, 4 s. args: prelude, lib (tf0e-lib.jsx).
//
// VERIFY: the ring reads 0.75 x the ground and the disc 0.45 x ground + 102 (about 188 and 215 on white; about 49 and 128 on the blue)
// VERIFY: the cursor comp's black background does not render when nested
$.evalFile(args.prelude);
$.evalFile(args.lib);
$.evalFile(args.artLib); // art run: args.artLib (art.jsx), args.art (PROOF/<n>/art), args.artFolder ("art <n>")

var BLOCK_X = 0, BLOCK_Y = 420; // the tutorial's square block: x unchanged, y + 420 in the 9:16 frame
var HEADLINE_POS = [541.2 + BLOCK_X, 255.7 + BLOCK_Y];
var BUTTON_POS = [540 + BLOCK_X, 540 + BLOCK_Y];
var ADDRESS_POS = [541.2 + BLOCK_X, 959.6 + BLOCK_Y];
var CURSOR_POS = [298 + BLOCK_X, 640 + BLOCK_Y]; // measured centre on the result frame
var FRAMES = 240; // ASSUMED: 4 s; the cursor is static here

var cc = T.cursorComp("Tf0E 04 cursor", FRAMES);
var b = T.buttonComp({ name: "Tf0E 04 button", frames: FRAMES, shadows: true, prefix: "" });
var c = T.scene("Tf0E 04 tap cursor", FRAMES);
var bl = c.layers.add(b.comp);
bl.name = "Button";
P.tf(bl, "ADBE Position").setValue(BUTTON_POS);
T.address(c, ADDRESS_POS);
var hd = T.headline(c, HEADLINE_POS);
T.icon(c, args.art, args.artFolder, hd.layer);
T.artGround(c, args.art, args.artFolder);

var cl = c.layers.add(cc);
cl.name = "Cursor";
P.tf(cl, "ADBE Position").setValue(CURSOR_POS);

return {
  comp: c.name, id: c.id, layers: c.numLayers, cursorComp: cc.name, buttonComp: b.comp.name,
  fonts: T.fontReport(), fontSubstitute: T.anySubstitute()
};
