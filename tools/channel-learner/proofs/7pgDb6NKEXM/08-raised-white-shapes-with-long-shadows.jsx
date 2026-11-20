// Technique 08: eight staggered white disc pairs growing from the centre, each with a long soft shadow to the right.
// args: prelude, artLib, discs (porcelain-discs.jsx), artDir (PROOF/08/art), screenMode (enum number for Screen, found at run time).
// ASSUMED: pair starts as measured (0, 0.66, 1.37, 2.14, 2.90, 3.50, 4.10, 4.73 s); comp 10 s as the recipe's timeline.
$.evalFile(args.prelude);
$.evalFile(args.artLib);
$.evalFile(args.discs);
var r = PD.build("08 raised-white-shapes-with-long-shadows", 10, [0, 0.66, 1.37, 2.14, 2.90, 3.50, 4.10, 4.73], args.artDir, args.screenMode);
return { comp: r.comp.name, id: r.comp.id, layers: r.comp.numLayers, bevelMiss: r.bevelMiss.join(", "), fontSubs: PD.subs.join(" | ") };
