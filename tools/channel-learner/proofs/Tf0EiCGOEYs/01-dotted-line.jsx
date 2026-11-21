// Technique 1: turn a stroke into a ring of dots.
// Stroke with a round cap, a dash of 0 and a gap: each zero-length dash draws as a dot the width of the stroke.
$.evalFile(args.prelude);
var c = P.freshComp("01 dotted line", 1920, 1080, 23.976, 4, [0.03, 0.04, 0.03]);
P.text(c, "Lines", { size: 72, font: args.font || "Poppins-Light", name: "label" });
var sh = P.shape(c, "dotted ring");
P.ellipse(sh, [args.diameter || 540, args.diameter || 540]);
var s = P.stroke(sh, [1, 1, 1, 1], 18, 2);
P.dashes(sh, s, 0, 67);
return { comp: c.name, id: c.id, layers: c.numLayers };
