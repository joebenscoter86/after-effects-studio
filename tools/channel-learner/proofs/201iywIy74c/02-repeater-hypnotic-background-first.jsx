// Technique 2: concentric gradient discs from a Repeater with eased scale and rotation.
// VERIFY: "ADBE Vector Graphic - G-Fill" is the Gradient Fill match name.
// VERIFY: "ADBE Vector Grad Type" (1 = linear), "ADBE Vector Grad Start Pt", "ADBE Vector Grad End Pt", "ADBE Vector Grad Colors".
// VERIFY: setValue on "ADBE Vector Grad Colors" may be unsupported/throw in scripting. If so, fix by another route (e.g. 10 layers rig with Gradient Ramp + ellipse mask) and report it as a finding.
// VERIFY: if setValue accepts it, the value format assumed is the flat array [pos,r,g,b, ... ] for colour stops then [pos,opacity] for alpha stops (see GRAD below); may be a different layout.
// VERIFY: repeater match names: "ADBE Vector Filter - Repeater", "ADBE Vector Repeater Copies", "ADBE Vector Repeater Offset", "ADBE Vector Repeater Order" (2 = Below), "ADBE Vector Repeater Transform".
// VERIFY: repeater transform match names "ADBE Vector Repeater Anchor", "...Position", "...Scale", "...Rotation".
// VERIFY: repeater Order enum 1 = Above, 2 = Below.
// VERIFY: KeyframeEase arrays: Scale (2D) takes 2 KeyframeEase objects, Rotation takes 1; speed units are %/s and deg/s.
// VERIFY: Hue/Saturation display name "Hue/Saturation", property "Master Hue" (only used when args.hue is given).
// VERIFY: new repeater at the root of Contents repeats the group above it (as the Contents > Add menu does).
$.evalFile(args.prelude);
var c = P.freshComp("02 repeater hypnotic background", 1080, 1920, 24, 5, [0.949, 0.949, 0.949]);
var cx = c.width / 2, cy = c.height / 2;

// Ground: near-white grey F2F2F2 (the comp background colour is the same; a solid makes it a layer too).
var ground = P.solid(c, "ground", [0.949, 0.949, 0.949]);

// One circle, 410 x 410, centred. Shape layer anchor and group position stay at 0,0 so the repeater scales about the disc centre.
var sh = P.shape(c, "TECH rings");
P.ellipse(sh, [410, 410]);

// Gradient fill, linear, white (left) to C49FFF (right).
var con = P.contents(sh);
con.addProperty("ADBE Vector Graphic - G-Fill");
var gi = 0, k;
for (k = 1; k <= con.numProperties; k++) { if (con.property(k).matchName === "ADBE Vector Graphic - G-Fill") gi = k; }
var gf = con.property(gi);
gf.property("ADBE Vector Grad Type").setValue(1);
gf.property("ADBE Vector Grad Start Pt").setValue([-205, 0]);
gf.property("ADBE Vector Grad End Pt").setValue([205, 0]);
// C49FFF = 196,159,255. Two colour stops then two opacity stops.
var GRAD = [0, 1, 1, 1, 1, 0.7686, 0.6235, 1, 0, 1, 1, 1];
gf.property("ADBE Vector Grad Colors").setValue(GRAD);
// ASSUMED: step 3 (hand-dragging the gradient handles to soften the middle) is skipped; the two stops give a plain linear blend.

// Layer position at comp centre (portrait frame).
P.tf(sh.layer, "ADBE Position").setValue([cx, cy]);

// Repeater at the root of Contents.
var root = sh.layer.property("ADBE Root Vectors Group");
root.addProperty("ADBE Vector Filter - Repeater");
var ri = 0;
for (k = 1; k <= root.numProperties; k++) { if (root.property(k).matchName === "ADBE Vector Filter - Repeater") ri = k; }
var rep = root.property(ri);
rep.property("ADBE Vector Repeater Copies").setValue(10);
rep.property("ADBE Vector Repeater Offset").setValue(0);
rep.property("ADBE Vector Repeater Order").setValue(2); // Below
var rt = root.property(ri).property("ADBE Vector Repeater Transform");
rt.property("ADBE Vector Repeater Position").setValue([0, 0]);
rt = root.property(ri).property("ADBE Vector Repeater Transform");
var sc = rt.property("ADBE Vector Repeater Scale");
var ro = rt.property("ADBE Vector Repeater Rotation");
var tEnd = 2.9; // squeezed key gap
sc.setValueAtTime(0, [100, 100]);
sc.setValueAtTime(tEnd, [143.3, 143.3]);
ro.setValueAtTime(0, 0);
ro.setValueAtTime(tEnd, 34.3);
// Easy ease with a steep start: fast out of the first key, speed 0 into the last key.
// ASSUMED: influences 70 (out of first) and 80 (into last); speeds about 3x the average. Recipe gives only 2.31% on one handle, mid-drag.
var avgS = 43.3 / tEnd, avgR = 34.3 / tEnd;
sc.setTemporalEaseAtKey(1, [new KeyframeEase(0, 33), new KeyframeEase(0, 33)], [new KeyframeEase(avgS * 3, 70), new KeyframeEase(avgS * 3, 70)]);
sc.setTemporalEaseAtKey(2, [new KeyframeEase(0, 80), new KeyframeEase(0, 80)], [new KeyframeEase(0, 33), new KeyframeEase(0, 33)]);
ro.setTemporalEaseAtKey(1, [new KeyframeEase(0, 33)], [new KeyframeEase(avgR * 3, 70)]);
ro.setTemporalEaseAtKey(2, [new KeyframeEase(0, 80)], [new KeyframeEase(0, 33)]);

// Stand-in title with a simple overshoot pop-in (the full bounce is technique 01 of the recipe's source, not this one).
var t = P.text(c, "Hypnotic", { size: 150, color: [0.18, 0.1, 0.35], font: args.font || "Poppins-SemiBold", name: "title" });
var ts = P.tf(t, "ADBE Scale");
ts.setValueAtTime(0.3, [0, 0]);
ts.setValueAtTime(0.6, [118, 118]);
ts.setValueAtTime(0.8, [96, 96]);
ts.setValueAtTime(0.95, [100, 100]);

// Optional recolour (step 11): pass args.hue (e.g. 91).
if (args.hue !== undefined) {
  var hs = P.effect(sh.layer, "Hue/Saturation");
  hs.property("Master Hue").setValue(args.hue);
}
return { comp: c.name, id: c.id, layers: c.numLayers };
