// Technique 03: twelve crew cards ride a spinning ship's wheel (art PROOF/03/art).
// args: prelude, artLib, helm, artDir.
// The scene is built in helm.jsx (shared with 04 and 05).
// ASSUMED: comp 6 s (proof rule 3-6 s) instead of the tutorial's 15 s; 23.976 fps as the recipe.
$.evalFile(args.prelude);
$.evalFile(args.artLib);
$.evalFile(args.helm);
var r = HELM.build("03 graphics-orbit-a-real-object", 6, args.artDir);
return { comp: r.comp.name, id: r.comp.id, layers: r.comp.numLayers, fontSubs: HELM.subs.join(" | ") };
