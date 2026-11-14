// Technique 13: fine dot-grid background texture from CC Ball Action on a black solid.
// A black comp-size solid sits directly above the pale background, below all graphics.
// CC Ball Action with a small Grid Spacing and Ball Size turns it into an even grid of tiny dots;
// the black between the balls drops out, so only the dots sit over the background.
//
// VERIFY: P.effect(layer, "CC Ball Action") - display name accepted by canAddProperty/addProperty (match name believed to be "CC Ball Action" too).
// VERIFY: CC Ball Action property display names "Grid Spacing" and "Ball Size" (recipe's Effect Controls labels).
// VERIFY: Grid Spacing takes an integer 3; Ball Size takes 7 (shown as 7.0).
// VERIFY: dot tone after render - the recipe says the tutorial's dots render mid grey, not black (cause unknown). Nothing here forces grey.
// VERIFY: dots are barely visible at 100 %; judge on a crop around 180 % zoom, as the recipe advises.
// VERIFY: Font "Poppins-Bold" may be missing; After Effects substitutes a font, which does not affect the technique.
$.evalFile(args.prelude);

var c = P.freshComp("13 dot grid", 1920, 1080, 24, 4, [0.86, 0.89, 0.93]);

// Background: pale grey-blue solid (bottom layer).
// ASSUMED: background colour R0.86 G0.89 B0.93 ("pale grey-blue"; exact value not given).
var bg = P.solid(c, "background", [0.86, 0.89, 0.93]);

// Step 1: black solid, comp size, directly above the background. Added after the background, so it lands above it.
var dots = P.solid(c, "TECH dots", [0, 0, 0], 1920, 1080);

// Step 2-3: CC Ball Action, Grid Spacing 3, Ball Size 7. Coloring Medium and Shading -75 stay at default (step 4).
var fx = P.effect(dots, "CC Ball Action");
fx.name = "TECH CC Ball Action";
fx = dots.property("ADBE Effect Parade").property(1);
fx.property("Grid Spacing").setValue(3);
fx.property("Ball Size").setValue(7);

// Stand-in graphics above the texture: a title and two outline shapes, so the texture can be judged as a backdrop.
// ASSUMED: plain 2D text stands in for the tutorial's 3D-looking letters; the technique does not depend on them.
var ring = P.shape(c, "outline circle");
P.ellipse(ring, [260, 260]);
P.stroke(ring, [0.20, 0.24, 0.32, 1], 8, 2);
P.tf(ring.layer, "ADBE Position").setValue([520, 560]);

var box = P.shape(c, "outline square");
var r = P.contents(box).addProperty("ADBE Vector Shape - Rect");
P.contents(box).property(r.propertyIndex).property("ADBE Vector Rect Size").setValue([240, 240]);
P.contents(box).property(r.propertyIndex).property("ADBE Vector Rect Roundness").setValue(24);
P.stroke(box, [0.20, 0.24, 0.32, 1], 8, 2);
P.tf(box.layer, "ADBE Position").setValue([1400, 560]);

P.text(c, "TEXTURE", { size: 160, font: args.font || "Poppins-Bold", color: [0.16, 0.20, 0.28], name: "title", pos: [960, 540] });

// Order check: title, shapes on top; then TECH dots; background last.
dots.moveAfter(c.layer("outline circle"));
bg.moveToEnd();

return { comp: c.name, id: c.id, layers: c.numLayers, dotsIndex: dots.index, bgIndex: bg.index };
