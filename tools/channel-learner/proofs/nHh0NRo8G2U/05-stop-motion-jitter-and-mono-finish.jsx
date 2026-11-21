// Technique 05: stepped jitter and black-and-white photos for a hand-made finish (recipe 05-stop-motion-jitter-and-mono-finish).
// Builds on 01-04 (the whole phase scene). The six pictures live in "nHh0 05 photos" under an adjustment layer "TECH Mono"
// (Hue/Saturation, Master Saturation -100); each carries posterizeTime(6) wiggle(222, 3 x SCALE) on Position, switchable
// by its effect "TECH Photo Jitter". In the main comp, on top: "TECH Posterize Time" (12 fps), then "TECH Frame Jitter"
// (Transform, Scale 101 uniform, Position posterizeTime(6) wiggle(222, 3 x SCALE)).
// Before frame: switch off every layer and effect whose name starts with "TECH " (main comp and the photos precomp).
// args: prelude, lib; optional artDir, artLib, artFolder, labels, scale, centre, segColors, labelColor, labelFaces, labelSize, stepHeights, ground.
//
// VERIFY: see nh-phase-lib.jsx (Hue/Saturation, Posterize Time, Transform names; effect .active in the photo expression)
// VERIFY: the wiggle amplitude is a travel distance, so it is scaled (3 -> 2.4 at SCALE 0.8); frequency 222 is not
$.evalFile(args.prelude);
$.evalFile(args.lib);
NH.init(args, "05");
var c = NH.scene("05", "jitter mono", 144, "#000000"); // ASSUMED: 6 s (the recipe's loop plays to 0:00:05:04)
var r = NH.content(c, { rise: true, pop: true, arrows: true, photoComp: true });
if (NH.artDir) NH.dress(c); // art brief: kicker, headline, source (05: inside the finish, which goes on top)
var f = NH.finish(c);
return NH.report(c, {
  photosComp: r.photos.comp.name + ": " + NH.stack(r.photos.comp),
  saturation: r.photos.saturation,
  wiggleAmp: f.amp,
  tech: "main: TECH Posterize Time, TECH Frame Jitter; photos: TECH Mono; each Step: effect TECH Photo Jitter"
});
