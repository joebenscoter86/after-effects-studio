// Technique 01: round dots from a shape stroke (recipe 01-dotted-stroke).
// A white ellipse stroke, no fill, Round Cap, Dash 0, Gap 67: each zero-length dash draws as a dot as wide as the stroke.
// The ring turns on layer Rotation keyframes (0 s and 3 s).
//
// VERIFY: "ADBE Vector Stroke Line Cap" value 2 = Round Cap (the prelude and 01-dotted-line.jsx rely on it).
// VERIFY: dashes added in the order Dash 1 then Gap 1 by P.dashes; the recipe's Offset is left out (optional, 0).
// VERIFY (run): "Poppins-Light" is NOT installed (AE substituted a sans); Poppins-Regular is, so the script uses it.
// VERIFY: P.shape adds no fill, so there is no "Fill 1" to switch off (the recipe asks a script to remove or disable it).
// VERIFY: with diameter 30*67/pi the dots close evenly with no bunching at the path start (inferred in the recipe).
$.evalFile(args.prelude);

var WIDTH = 18;    // recipe: Stroke Width 18 (layout: dots about 0.009 of the width = 17 px)
// Run fix (layout line): 28 dots, outer diameter 0.29 of the width, so the path diameter is 0.29*1920 - 18 = 539 px.
// The recipe's Gap 67 gives only 25 dots on that circle; the layout measures 28 dots about 0.033w (63 px) apart,
// so the gap is set from the circle: circumference / 28 = 60.5 px, which also closes evenly.
var DOTS = args.dots || 28;
var D = args.diameter || (0.29 * 1920 - WIDTH);
var GAP = args.gap || (Math.PI * D / DOTS);

// Recipe: the example comp runs at 23.976 fps.
var c = P.freshComp("01 dotted stroke", 1920, 1080, 23.976, 4, [0.03, 0.04, 0.03]);

// Stand-in: a short white word in the middle. ASSUMED: the word and font; the recipe's glow layer is not part of the tip.
P.text(c, "Lines", { size: args.size || 70, color: [1, 1, 1], font: args.font || "Poppins-Regular", name: "label", pos: [960, 540] });

// Step 1: ellipse on a new shape layer, white stroke, no fill.
var sh = P.shape(c, "dotted ring");
P.ellipse(sh, [D, D]);
// Steps 1 and 3: Stroke Width 18, white, Round Cap.
var s = P.stroke(sh, [1, 1, 1, 1], WIDTH, 2);
// Steps 2, 4, 5: Dashes with Dash 0 and Gap 67.
P.dashes(sh, s, 0, GAP);
// Layout: ring centre at 0.50 across, 0.51 down.
P.tf(sh.layer, "ADBE Position").setValue([960, 0.51 * 1080]);

// Step 6: the ring turns. First key 0 deg at 0 s, second key at 3 s.
// ASSUMED: end angle 90 deg and linear interpolation (the recipe gives neither).
var rot = P.tf(sh.layer, "ADBE Rotate Z");
rot.setValueAtTime(0, 0);
rot.setValueAtTime(3, args.endAngle !== undefined ? args.endAngle : 90);

var lb = c.layer("label").sourceRectAtTime(0, false);
return { comp: c.name, id: c.id, layers: c.numLayers, diameter: D, gap: GAP, dots: DOTS, font: c.layer("label").property("ADBE Text Properties").property("ADBE Text Document").value.font, labelW: lb.width, labelH: lb.height };
