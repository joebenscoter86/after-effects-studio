// Tf0EiCGOEYs technique 02: a soft blue lift under the pill and an inset label (recipe 02). A finish: every effect
// of the technique is named "TECH ..." inside the button comp "Tf0E 02 button", so the runner can switch them off for
// before.png: Pill > "TECH Drop Shadow"; Label > "TECH Label Shadow" and "TECH Label Light".
// Pill: Drop Shadow #0036FF, 50 %, 180 deg, Distance 48, Softness 248. Label: black 40 %, 180 deg, 4, 0; white 24 %, 0 deg, 9, 52.
// Scene "Tf0E 02 soft lift shadow": 1080 x 1920, 60 fps, 4 s, white Background (the surface the shadow falls on).
// args: prelude, lib (tf0e-lib.jsx). Optional: args.label, args.tech (false builds with the TECH effects disabled).
//
// VERIFY: Drop Shadow Opacity reads back 127.5 / 102 / 61.2 (0-255 scale) in return.shadows
// VERIFY: Softness 248 is within the control's range (an earlier build set 1164 without complaint)
// VERIFY: the pill's haze stays inside the 1040 x 530 button comp (about 150 px below the pill, the comp leaves 180)
$.evalFile(args.prelude);
$.evalFile(args.lib);
$.evalFile(args.artLib); // art run: args.artLib (art.jsx), args.art (PROOF/<n>/art), args.artFolder ("art <n>")

var BLOCK_X = 0, BLOCK_Y = 420; // the tutorial's square block: x unchanged, y + 420 in the 9:16 frame
var BUTTON_POS = [540 + BLOCK_X, 540 + BLOCK_Y];
var FRAMES = 240; // ASSUMED: 4 s; nothing animates

var b = T.buttonComp({ name: "Tf0E 02 button", frames: FRAMES, shadows: true, prefix: "TECH ", label: args.label });
if (args.tech === false) {
  b.pill.property("ADBE Effect Parade").property("TECH Drop Shadow").enabled = false;
  b.label.property("ADBE Effect Parade").property("TECH Label Shadow").enabled = false;
  b.label.property("ADBE Effect Parade").property("TECH Label Light").enabled = false;
}
var c = T.scene("Tf0E 02 soft lift shadow", FRAMES);
T.artGround(c, args.art, args.artFolder);
var bl = c.layers.add(b.comp);
bl.name = "Button";
P.tf(bl, "ADBE Position").setValue(BUTTON_POS);

return {
  comp: c.name, id: c.id, layers: c.numLayers, buttonComp: b.comp.name,
  techEffects: "in comp " + b.comp.name + ": Pill > TECH Drop Shadow; Label > TECH Label Shadow, TECH Label Light",
  shadows: b.shadows.join(" | "), labelInk: T.boxStr(T.inkBox(b.label, 0)),
  fonts: T.fontReport(), fontSubstitute: T.anySubstitute()
};
