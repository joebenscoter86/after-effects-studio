// Tf0EiCGOEYs technique 03: headline, button and web address stacked on a white card (recipe 03), still.
// Background white solid (named "Background" for the art swap); button comp "Tf0E 03 button" (recipes 01 + 02, with
// shadows) at 100 %; web address Montserrat ExtraBold 40 px, tracking 160, h-scale 99 %, #0036FF at layer Opacity 40;
// headline Montserrat SemiBold 98 px, tracking 20, h-scale 99 %, #0036FF, Opacity 100. Text positions are baselines.
// Stack top to bottom: headline, address, button, background. 1080 x 1920, 60 fps, 4 s.
// args: prelude, lib (tf0e-lib.jsx).
//
// VERIFY: Montserrat-SemiBold installed; fallback Montserrat-Medium is lighter, so the headline will read thinner
// VERIFY: ink boxes in return (square-block figures + 420 in y): headline glyphs y 600-675, about 660 wide (x 210-870);
//         address y 1344-1380, about 330 wide (x 375-705); a substitute face shifts these
// VERIFY: horizontalScale read-back gives 99 % (see the lib's note on its units)
$.evalFile(args.prelude);
$.evalFile(args.lib);
$.evalFile(args.artLib); // art run: args.artLib (art.jsx), args.art (PROOF/<n>/art), args.artFolder ("art <n>")

var BLOCK_X = 0, BLOCK_Y = 420; // the tutorial's square block: x unchanged, y + 420 in the 9:16 frame
var HEADLINE_POS = [541.2 + BLOCK_X, 255.7 + BLOCK_Y];
var BUTTON_POS = [540 + BLOCK_X, 540 + BLOCK_Y];
var ADDRESS_POS = [541.2 + BLOCK_X, 959.6 + BLOCK_Y];
var FRAMES = 240; // ASSUMED: 4 s; the card is still

var b = T.buttonComp({ name: "Tf0E 03 button", frames: FRAMES, shadows: true, prefix: "" });
var c = T.scene("Tf0E 03 end card stack", FRAMES);
var bl = c.layers.add(b.comp);
bl.name = "Button";
P.tf(bl, "ADBE Position").setValue(BUTTON_POS); // ASSUMED (measured centred): Position 540, 540 and Scale 100 % are never opened
var ad = T.address(c, ADDRESS_POS);
var hd = T.headline(c, HEADLINE_POS);
var icon = T.icon(c, args.art, args.artFolder, hd.layer);
T.artGround(c, args.art, args.artFolder);
var hs = hd.layer.property("ADBE Text Properties").property("ADBE Text Document").value.horizontalScale;

return {
  comp: c.name, id: c.id, layers: c.numLayers, buttonComp: b.comp.name,
  headlineInk: T.boxStr(T.inkBox(hd.layer, 0)), addressInk: T.boxStr(T.inkBox(ad.layer, 0)),
  labelInk: T.boxStr(T.inkBox(b.label, 0)), headlineHScale: hs, iconLocal: P.tf(icon, "ADBE Position").value.toString(), shadows: b.shadows.join(" | "),
  fonts: T.fontReport(), fontSubstitute: T.anySubstitute()
};
