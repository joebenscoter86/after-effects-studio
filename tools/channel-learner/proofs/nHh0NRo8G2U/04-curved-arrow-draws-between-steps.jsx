// Technique 04: a small swept-head arrow that draws itself between steps (recipe 04-curved-arrow-draws-between-steps).
// Builds on 01-03 (bar, labels, picture pops). Arrow precomp "nHh0 04 arrow": a 3 px white shaft whose Trim Start goes
// 100 -> 0 at 35-47 f (grows from the tip back) and two curled barbs whose Trim End goes 0 -> 100 at 36-49 f (open from the
// tip), all on the S-curve. Five copies sit in the gaps between pictures, in-points offset 0, 8, 17, 29, 39 frames.
// SUBSTITUTE: Pen-tool drawing at 400 % (paths by vertices and tangents), Pre-compose, Duplicate and Shift+arrow nudges.
// args: prelude, lib; optional artDir, artLib, artFolder, labels, scale, centre, segColors, labelColor, labelFaces, labelSize, stepHeights, ground.
//
// VERIFY: a precomp layer's startTime shifts its contents (the arrow keys at 35 f land at 35 + offset in the main comp)
// VERIFY: the barb's in/out tangents (ASSUMED, nh-phase-lib.jsx NH.arrowComp) give a curl whose free end points up/down
$.evalFile(args.prelude);
$.evalFile(args.lib);
NH.init(args, "04");
var c = NH.scene("04", "arrows", 120, "#000000"); // ASSUMED: 5 s (the last arrow finishes near frame 87)
var r = NH.content(c, { rise: true, pop: true, arrows: true });
if (NH.artDir) NH.dress(c); // art brief: kicker, headline, source
var starts = [], k;
for (k = 0; k < r.arrows.layers.length; k++) starts.push(Math.round(r.arrows.layers[k].startTime * NH.FPS) + 35);
return NH.report(c, { arrowComp: r.arrows.comp.name, arrowDrawStarts: starts.join(", "), easeSpeeds: r.arrows.speeds });
