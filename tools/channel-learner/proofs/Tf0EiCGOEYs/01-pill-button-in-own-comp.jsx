// Tf0EiCGOEYs technique 01: a flat pill button built in its own comp (recipe 01), placed in the 9:16 scene.
// Button comp "Tf0E 01 button": 1040 x 530, 60 fps; 700 x 170 rectangle, Roundness 451 (full round ends), Fill #0036FF,
// no stroke; label Montserrat ExtraBold 60 px, white, tracking 157, centred on the pill. Flat: no shadow at this stage.
// Scene "Tf0E 01 pill button": 1080 x 1920, 60 fps, 4 s, white Background solid, the button at 100 %.
// args: prelude, lib (tf0e-lib.jsx). Optional: args.label.
//
// VERIFY: "ADBE Vector Rect Roundness" 451 clamps to half the height (85) and draws half-round ends
// VERIFY: Montserrat-ExtraBold is installed; if not the label falls back to Montserrat-Black (see return.fonts)
// VERIFY: the label's ink box (return.labelInk) is about 505 x 44 px and centred on (520, 265) in the button comp
$.evalFile(args.prelude);
$.evalFile(args.lib);
$.evalFile(args.artLib); // art run: args.artLib (art.jsx), args.art (PROOF/<n>/art), args.artFolder ("art <n>")

// Placement of the tutorial's 1080 square inside the 1080 x 1920 frame: x unchanged, y + 420 (block centred).
var BLOCK_X = 0, BLOCK_Y = 420;
var BUTTON_POS = [540 + BLOCK_X, 540 + BLOCK_Y];
var FRAMES = 240; // ASSUMED: 4 s; the tutorial's comps run 20.5 s and nothing animates

// SUBSTITUTE: steps 2 and 9 (an 800 x 800 comp resized to 1040 x 530 in Composition Settings) are built straight at
// 1040 x 530, which the recipe says gives the same picture. The Align panel centring is done by the label's ink box.
var b = T.buttonComp({ name: "Tf0E 01 button", frames: FRAMES, shadows: false, label: args.label });
var c = T.scene("Tf0E 01 pill button", FRAMES);
T.artGround(c, args.art, args.artFolder);
var bl = c.layers.add(b.comp);
bl.name = "Button";
P.tf(bl, "ADBE Position").setValue(BUTTON_POS);

return {
  comp: c.name, id: c.id, layers: c.numLayers, buttonComp: b.comp.name,
  labelInk: T.boxStr(T.inkBox(b.label, 0)), fonts: T.fontReport(), fontSubstitute: T.anySubstitute()
};
