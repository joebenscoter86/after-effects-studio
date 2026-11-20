// Technique 06: graphics tucked behind a presenter with Object Matte (art in PROOF/06/art).
// args: prelude, artLib, artDir.
// Builds the stack only (recipe steps 1 and 8): presenter bg (no matte) at the bottom, the five graphics, presenter on top.
// SUBSTITUTE: none for the matte. The Object Matte click (steps 2-5) is the user's (subject.prepare, then the click);
//   its values (step 6) are set afterwards with subject.settings. Step 9 is built by never matting the bottom copy.
// WARNING: re-running this script removes the comp, and with it the clicked Object Matte. Run it once, before the click.
// VERIFY: none (import and layer order only).
$.evalFile(args.prelude);
$.evalFile(args.artLib);
var fps = 24, dur = 6; // footage is 145 frames (6.04 s); the comp holds 144
var c = P.freshComp("06 graphics-behind-subject-object-matte", 1920, 1080, fps, dur, [0, 0, 0]);
c.parentFolder = ART.folder("art 06");
var dir = args.artDir;
var vid = ART.footage(dir, "presenter.mp4", "art 06");
// bottom to top, as the brief's layer order
var bg = c.layers.add(vid); bg.name = "presenter bg";
var gfx = [["card-indigo.png", "card indigo"], ["card-cream.png", "card cream"], ["card-butter.png", "card butter"],
           ["text-left.png", "text left"], ["headline-right.png", "headline right"]];
var i, l, s, o, t0, ease;
var layers = [];
for (i = 0; i < gfx.length; i++) {
  l = c.layers.add(ART.footage(dir, gfx[i][0], "art 06"));
  l.name = gfx[i][1];
  l.outPoint = dur;
  P.tf(l, "ADBE Position").setValue([960, 540]);
  layers.push(l);
}
var top = c.layers.add(vid); top.name = "presenter";
bg.audioEnabled = false; top.audioEnabled = false;
// The graphics' own build-on (the recipe leaves type animation to the comp): a short staggered rise and fade,
// end state exactly at the brief's positions (Position 960,540, Scale 100) from 0.9 s on.
ease = new KeyframeEase(0, 75);
for (i = 0; i < layers.length; i++) {
  t0 = 0.2 + i * 0.1;
  o = P.tf(layers[i], "ADBE Opacity");
  o.setValueAtTime(t0, 0); o.setValueAtTime(t0 + 0.4, 100);
  s = P.tf(layers[i], "ADBE Position");
  s.setValueAtTime(t0, [960, 572]); s.setValueAtTime(t0 + 0.5, [960, 540]);
  s.setTemporalEaseAtKey(1, [ease], [ease]); s.setTemporalEaseAtKey(2, [ease], [ease]);
}
var names = [], k;
for (k = 1; k <= c.numLayers; k++) names.push(k + " " + c.layer(k).name);
return { comp: c.name, id: c.id, layers: names.join(" | "), frames: Math.round(c.duration * c.frameRate) };
