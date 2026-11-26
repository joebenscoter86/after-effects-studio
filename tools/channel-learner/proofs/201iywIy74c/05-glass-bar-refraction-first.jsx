// Technique 5: frosted glass pill refracting a smeared gradient star.
// BG (spinning gradient star, blurred, wave-warped) under an adjustment-layer pill (Bar) that blurs, brightens
// and displaces what lies behind it, using the hidden Edge layer (inner glow) as the displacement map.
//
// VERIFY:
// - Polystar match names: "ADBE Vector Shape - Star", "ADBE Vector Star Type" (1 = star), "ADBE Vector Star Points",
//   "ADBE Vector Star Inner Radius", "ADBE Vector Star Outer Radius".
// - Rect match names: "ADBE Vector Shape - Rect", "ADBE Vector Rect Size", "ADBE Vector Rect Roundness".
// - Group transform: "ADBE Vector Transform Group" / "ADBE Vector Position".
// - Effect display names: "4-Color Gradient", "Fast Box Blur", "Wave Warp", "Exposure", "Displacement Map".
// - 4-Color Gradient property names "Point 1".."Point 4", "Color 1".."Color 4", "Blend Mode"; Blend Mode enum index
//   used for Multiply (4) is a guess (list order None, Normal, Add, Multiply ...?). Goal: gradient only shows where the white star is.
// - Wave Warp "Wave Type" enum: Uncircle assumed index 7 (Sine1, Square2, Triangle3, Sawtooth4, Circle5, Semicircle6, Uncircle7, Noise8, Smooth Noise9, Sine2 10?).
// - Wave Warp property names "Wave Height", "Wave Width", "Direction", "Wave Speed".
// - Fast Box Blur property name "Blur Radius"; Exposure property name "Exposure".
// - Displacement Map property names: "Displacement Map Layer", "Use For Horizontal Displacement", "Max Horizontal Displacement",
//   "Use For Vertical Displacement", "Max Vertical Displacement", "Displacement Map Behavior", "Edge Behavior" group items
//   "Expand Output", "Wrap Pixels Around" (may be top-level, may be checkboxes at other names). Channel enum: Red=1? Green=2? (guess: 1 red, 2 green, 3 blue).
//   Map Behavior enum: Center Map assumed index 2 (Center Map, Stretch Map to Fit, Tile Map).
// - Layer styles: layer.property("ADBE Layer Styles") with "ADBE Inner Glow" and inner properties "innerGlow/mode2",
//   "innerGlow/opacity", "innerGlow/color", "innerGlow/size"; whether addProperty/enabled turns the style on.
// - Layer-styles blend mode Screen enum index guessed (see ASSUMED below); Technique Softer, Source Edge, Choke 0, Range 50 left to defaults.
// - A hidden (enabled=false) Edge layer still feeds Displacement Map.
// - Adjustment layer flag on a shape layer (layer.adjustmentLayer = true) limits the effect to the shape's alpha.
// - KeyframeEase with 2 ease objects for a 2D non-spatial property (Size).
// - Expression linking Edge size to Bar: group named "Pill", path named "Rectangle Path 1".
$.evalFile(args.prelude);

// ASSUMED: the recipe is in a ~1920 wide comp; this comp is 1080 wide portrait, so pixel values are scaled by S.
var S = 1.5;
var W = 1080, H = 1920, CX = 540, CY = 960;
var c = P.freshComp("05 glass bar refraction", W, H, 24, 5, [0, 0, 0]);

// Shape layer whose anchor/position sit at the comp centre and whose group is placed at the centre,
// so the layer rotates about the centre and effects see the whole shape inside the buffer.
function centredShape(name) {
  var sh = P.shape(c, name);
  sh.layer.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([CX, CY]);
  sh.layer.property("ADBE Transform Group").property("ADBE Position").setValue([CX, CY]);
  var g = sh.layer.property("ADBE Root Vectors Group").property(1);
  g.name = "Pill";
  g = sh.layer.property("ADBE Root Vectors Group").property(1);
  g.property("ADBE Vector Transform Group").property("ADBE Vector Position").setValue([CX, CY]);
  return sh;
}
function addRect(sh, size, round) {
  var contents = P.contents(sh);
  var r = contents.addProperty("ADBE Vector Shape - Rect");
  r.name = "Rectangle Path 1";
  r = P.contents(sh).property("Rectangle Path 1");
  r.property("ADBE Vector Rect Size").setValue(size);
  r.property("ADBE Vector Rect Roundness").setValue(round);
  var f = P.contents(sh).addProperty("ADBE Vector Graphic - Fill");
  P.contents(sh).property(f.propertyIndex).property("ADBE Vector Fill Color").setValue([0, 0, 0, 1]);
}

// ---- BG: star with gradient, spin, blur, wave warp
var bg = centredShape("BG");
var star = P.contents(bg).addProperty("ADBE Vector Shape - Star");
star = P.contents(bg).property(star.propertyIndex);
star.property("ADBE Vector Star Type").setValue(1);
star.property("ADBE Vector Star Points").setValue(8);
star.property("ADBE Vector Star Inner Radius").setValue(186.8 * S);
star.property("ADBE Vector Star Outer Radius").setValue(128.3 * S);
var bf = P.contents(bg).addProperty("ADBE Vector Graphic - G-Fill");
bf = P.contents(bg).property(bf.propertyIndex);
bf.property("ADBE Vector Grad Type").setValue(1); // linear
bf.property("ADBE Vector Grad Start Pt").setValue([-290, 0]);
bf.property("ADBE Vector Grad End Pt").setValue([290, 0]);
// SUBSTITUTE (colour stops only): gradient colours are not scriptable; the fill keeps its default white-to-black ramp
// (start = white, at left) and CC Toner (Pentone) recolours it with the brief palette in order.
var gl = bg.layer;
var tn = P.effect(gl, "CC Toner");
tn.name = "Gradient colours (CC Toner)";
tn.property("Tones").setValue(3); // Pentone (index verified in run)
tn.property("Highlights").setValue([0x55/255, 0xA4/255, 1]);
tn.property("Brights").setValue([1, 0xC6/255, 0x55/255]);
tn.property("Midtones").setValue([1, 0x55/255, 0x55/255]);
tn.property("Darktones").setValue([0xF5/255, 0xB0/255, 0xD0/255]);
tn.property("Shadows").setValue([0xF5/255, 0xB0/255, 0xD0/255]);
gl.property("ADBE Transform Group").property("ADBE Rotate Z").expression = "time*20";
var bb = P.effect(gl, "Fast Box Blur");
bb.property("Blur Radius").setValue(15 * S);
var ww = P.effect(gl, "Wave Warp");
ww.property("Wave Type").setValue(7); // Uncircle (guess)
ww.property("Wave Height").setValue(200 * S);
ww.property("Wave Width").setValue(200 * S);
ww.property("Direction").setValue(0);
ww.property("Wave Speed").setValue(0);

// ---- Bar: black rounded rect, size keyframed narrow to wide
var bar = centredShape("TECH Bar");
addRect(bar, [321 * S, 130 * S], 158 * S);
var barSize = P.contents(bar).property("Rectangle Path 1").property("ADBE Vector Rect Size");
barSize.setValueAtTime(0, [321 * S, 130 * S]);
// ASSUMED: wide key 500 wide at 1.5 s (recipe: end value and times unknown; pill ~498 at preview 2;13).
barSize.setValueAtTime(1.5, [500 * S, 130 * S]);
barSize = P.contents(bar).property("Rectangle Path 1").property("ADBE Vector Rect Size");
// ASSUMED: graph editor peak on the left = fast out of the first key, slow in at the second.
var eOut = new KeyframeEase(0, 80);
var eIn = new KeyframeEase(0, 30);
barSize.setTemporalEaseAtKey(1, [eIn, eIn], [eOut, eOut]);
barSize.setTemporalEaseAtKey(2, [eIn, eIn], [eOut, eOut]);

// ---- Edge: copy of Bar, Size linked by expression, inner glow
var edge = centredShape("TECH Edge");
addRect(edge, [321 * S, 130 * S], 158 * S);
P.contents(edge).property("Rectangle Path 1").property("ADBE Vector Rect Size").expression =
  'thisComp.layer("TECH Bar").content("Pill").content("Rectangle Path 1").size';
var el = edge.layer;
var ls = el.property("ADBE Layer Styles");
var ig;
if (ls.canAddProperty("ADBE Inner Glow")) ig = ls.addProperty("ADBE Inner Glow");
ig = el.property("ADBE Layer Styles").property("ADBE Inner Glow");
// Inner Glow is not addable by script (canAddProperty false): add it with menu command after this script (see notes), then set its values.
if (ig) {
ig.property("innerGlow/mode2").setValue(5); // Screen (guess index)
ig.property("innerGlow/opacity").setValue(75);
ig.property("innerGlow/color").setValue([1, 1, 1]); // white (recipe: said white; swatch was pale yellow)
ig.property("innerGlow/size").setValue(34 * S);
}
// Technique Softer, Source Edge, Choke 0 %, Range 50 % are the defaults in After Effects.
el.enabled = false; // eye off; the map still reads it

// ---- Bar becomes an adjustment layer with the glass effects
var bl = bar.layer;
bl.adjustmentLayer = true;
var gb = P.effect(bl, "Fast Box Blur");
gb.property("Blur Radius").setValue(9.1 * S);
var ex = P.effect(bl, "Exposure");
ex.property("Exposure").setValue(0.5);
var dm = P.effect(bl, "Displacement Map");
dm.property("Displacement Map Layer").setValue(el.index); // the Edge layer, not Bar (default)
dm.property("Use For Horizontal Displacement").setValue(1); // Red (guess)
dm.property("Max Horizontal Displacement").setValue(68 * S);
dm.property("Use For Vertical Displacement").setValue(2); // Green (guess)
dm.property("Max Vertical Displacement").setValue(46 * S);
dm.property("Displacement Map Behavior").setValue(2); // Center Map (guess)
dm.property("Expand Output").setValue(1);
// no "Wrap Pixels Around" property in this AE (Edge Behavior is a header with Expand Output only); wrap is off.

return { comp: c.name, id: c.id, layers: c.numLayers };
