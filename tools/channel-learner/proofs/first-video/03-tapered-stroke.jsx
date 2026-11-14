// Technique 03: fade both ends of an open stroke with Taper (recipe 03-tapered-stroke).
// A white ellipse, trimmed open to an arc over a centred headline, 16 px butt-cap stroke, with Gaussian Blur,
// CC Radial Fast Blur and Glow on the layer. Taper Start Length and End Length at 100% make it thin to nothing at both ends.
//
// Switch-off: Taper is a stroke property, not an effect or layer. Its Start/End Length are driven by an expression that
// reads a Slider Control named "TECH taper" and returns 0 when that effect is switched off. Disabling "TECH taper" gives
// the "before" frame (even width, hard ends).
//
// VERIFY: "ADBE Vector Stroke Taper" group and its "ADBE Vector Taper Length Units", "ADBE Vector Taper Start Length",
//         "ADBE Vector Taper End Length" match names (need After Effects 17.0 or later).
// VERIFY (run): "ADBE Vector Taper Length Units" value 1 = Percent, 2 = Pixels (the guess was the other way round).
// VERIFY: "ADBE Vector Stroke Line Cap" value 1 = Butt Cap.
// VERIFY: the expression Effect object's .active is false when the effect's eye is off, and effect(...)(1) reads the slider.
// VERIFY: effect display names "Slider Control", "Gaussian Blur", "CC Radial Fast Blur", "Glow", "Tint" and the property
//         display names used below (Blurriness, Repeat Edge Pixels, Center, Amount, Zoom, Glow Threshold, Glow Radius,
//         Glow Intensity, Map Black To, Map White To, Amount to Tint).
// VERIFY: CC Radial Fast Blur "Zoom" value 2 = Brightest (1 Standard, 3 Darkest assumed).
// VERIFY: Glow enums left at their defaults match the recipe: Glow Based On Color Channels, Composite Original Behind,
//         Glow Operation Add, Glow Colors Original Colors, Color Looping Triangle A>B>A, Color Loops 1, Color Phase 0.
//         Gaussian Blur's Blur Dimensions left at its default, Horizontal and Vertical.
// VERIFY: Glow Threshold takes 60 for 60%.
// VERIFY: effect point values on a shape layer at default transform are in comp pixels, so Center 962.4, 692.4 lands
//         just below the comp centre as in the recipe.
// VERIFY: "ADBE Vector Ellipse Position" moves the ellipse inside its group; "ADBE Vector Trim Offset" is in degrees.
$.evalFile(args.prelude);

var c = P.freshComp("03 tapered stroke", 1920, 1080, 24, 4, [0.02, 0.03, 0.09]); // dark navy

// ASSUMED: the arc's ellipse is unknown in size. A 1600 px circle centred at comp (960, 1100) puts its top at y 300,
// curving over the headline; the trim keeps the top quarter (Start 0, End 25, Offset -45 deg: from 10:30 to 1:30).
var D = args.diameter || 1600;

var sh = P.shape(c, "arc");
var el = P.ellipse(sh, [D, D]);
// Run fix (layout line): crest at (0.51w, 0.19h) = (979, 205), visible ends at x 0.18w..0.84w, y about 0.475h.
// A circle through those points has radius about 801 px, centre (980, 1006): ellipse offset [20, 466] from the layer centre.
P.contents(sh).property(1).property("ADBE Vector Ellipse Position").setValue([20, 466]);
// Step 1: white stroke, 16 px, Butt Cap, no fill.
var s = P.stroke(sh, [1, 1, 1, 1], 16, 1);
// Step 1: Trim Paths inside the shape's contents. ASSUMED values (not shown in the recipe).
var t = P.contents(sh).addProperty("ADBE Vector Filter - Trim");
var tIdx = t.propertyIndex;
P.contents(sh).property(tIdx).property("ADBE Vector Trim Start").setValue(0);
// Run fix (layout line): the visible arc spans about 104 deg (ends at +/-52 deg from the crest); trimmed a little
// longer, 30% = 108 deg, because the taper thins the last stretch to nothing.
P.contents(sh).property(tIdx).property("ADBE Vector Trim End").setValue(30);
P.contents(sh).property(tIdx).property("ADBE Vector Trim Offset").setValue(-54);

// Switch for the technique (see top). Its value is the taper length in percent.
var tech = P.effect(sh.layer, "Slider Control");
tech.name = "TECH taper";
sh.layer.property("ADBE Effect Parade").property("TECH taper").property(1).setValue(100);

// Steps 3-4: Taper, Length Units Percent, Start Length 100, End Length 100. Start/End Width and Ease stay at default 0.
var taperPath = function () {
  return P.contents(sh).property(s).property("ADBE Vector Stroke Taper");
};
// Run fix: Length Units 1 = Percent, 2 = Pixels (with 2, "Start Length"/"End Length" are hidden and the pixel
// versions "ADBE Vector Taper StartWidthPx"/"EndWidthPx" show instead).
taperPath().property("ADBE Vector Taper Length Units").setValue(1);
var expr = 'var e = effect("TECH taper"); e.active ? e(1) : 0;';
taperPath().property("ADBE Vector Taper Start Length").setValue(100);
taperPath().property("ADBE Vector Taper Start Length").expression = expr;
taperPath().property("ADBE Vector Taper End Length").setValue(100);
taperPath().property("ADBE Vector Taper End Length").expression = expr;

// Step 2: the look, effects all on (the recipe's finished state).
var gb = P.effect(sh.layer, "Gaussian Blur");
gb.property("Blurriness").setValue(9.9);
sh.layer.property("ADBE Effect Parade").property(gb.propertyIndex).property("Repeat Edge Pixels").setValue(1);

var rb = P.effect(sh.layer, "CC Radial Fast Blur");
rb.property("Center").setValue([962.4, 692.4]);
sh.layer.property("ADBE Effect Parade").property(rb.propertyIndex).property("Amount").setValue(62);
sh.layer.property("ADBE Effect Parade").property(rb.propertyIndex).property("Zoom").setValue(2); // Brightest

var gl = P.effect(sh.layer, "Glow");
var glIdx = gl.propertyIndex;
sh.layer.property("ADBE Effect Parade").property(glIdx).property("Glow Threshold").setValue(60);
sh.layer.property("ADBE Effect Parade").property(glIdx).property("Glow Radius").setValue(90);
sh.layer.property("ADBE Effect Parade").property(glIdx).property("Glow Intensity").setValue(1);

// ASSUMED: the recipe does not say where the blue tint comes from (Glow uses Original Colors on a white stroke).
// A Tint after the Glow maps white to pale blue so the arc reads blue-white as "what it looks like" describes.
var ti = P.effect(sh.layer, "Tint");
ti.name = "ASSUMED blue tint";
var tiIdx = ti.propertyIndex;
sh.layer.property("ADBE Effect Parade").property(tiIdx).property("Map Black To").setValue([0, 0, 0]);
sh.layer.property("ADBE Effect Parade").property(tiIdx).property("Map White To").setValue([0.62, 0.8, 1]);
sh.layer.property("ADBE Effect Parade").property(tiIdx).property("Amount to Tint").setValue(100);

// Stand-in: a centred multi-line headline above the arc layer. ASSUMED: words, size, font (default font unless args.font).
// Run fix (layout line): headline block about 0.40 of the width wide, centred at 0.50 across, from 0.39 to 0.75 down
// (centre y 0.57 = 616). ASSUMED three lines (the block's height fits three lines at this width).
var opts = { size: args.size || 112, color: [1, 1, 1], name: "headline", font: args.font || "Poppins-SemiBold", pos: [960, 0.57 * 1080] };
var hl = P.text(c, "Look past\rthe edge of\rthe horizon", opts);
var hr = hl.sourceRectAtTime(0, false);

return { comp: c.name, id: c.id, layers: c.numLayers, headlineW: hr.width, headlineH: hr.height };
