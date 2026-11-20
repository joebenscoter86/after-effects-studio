// ZqRE3ho8iP4 technique 02: card swings round a pivot null below the frame, one 34-degree step at a time, forever.
// args { prelude, artLib, cards }. Art: proof/02/art (hero-1-rust, logo-sun-wave), "Salt Season" card 1.
// VERIFY: KeyframeEase on a 1D Rotation key takes arrays of one; loopOut("offset") adds -34 per cycle.
// VERIFY: addNull's anchor sits at the null's centre (100 x 100 source), so its Position is the pivot.
// SUBSTITUTE: the Pan Behind tool drags (matte anchor to the card's bottom edge, null anchor to the pivot) are set by script,
//   Position compensated so nothing jumps.
// ASSUMED: comp 96 frames (4 s): swing in, hold, swing to -34, hold, step to -68, hold, step to -102.
$.evalFile(args.prelude);
$.evalFile(args.artLib);
$.evalFile(args.cards);
var dir = ZC.ART + "/02/art";
var fold = "art ZqRE 02";
var c = ZC.comp("ZqRE 02 swing", 96, "#F7F4ED");
var card = ZC.coverCard(c, {
  tag: "1", photo: ART.footage(dir, "hero-1-rust.png", fold), logo: ART.footage(dir, "logo-sun-wave.png", fold),
  lines: ["Salt", "Season"], pills: ["Travel", "Coast"]
}, [960, 540]);
var m = card.matte;
m.name = "matte";
// Step 2: anchor on the card's bottom edge, centred (712 / 2 = 356), position compensated.
P.tf(m, "ADBE Anchor Point").setValue([0, 356]);
P.tf(m, "ADBE Position").setValue([960, 896]);
// Steps 3-5: null, card parented, null's anchor dragged down to the pivot (0.36 H below the frame's bottom edge).
var n = c.layers.addNull();
n.name = "Pivot null";
P.tf(n, "ADBE Position").setValue([960, 1080 * 1.36]);
m.parent = n;
// Steps 7-9 and 11-12: keys 0 f +34, 17 f 0, 24 f 0; Easy Ease then 77 % influence on keys 1 (out) and 2 (in).
var rot = P.tf(n, "ADBE Rotate Z");
rot.setValueAtTime(ZC.f(0), 34);
rot.setValueAtTime(ZC.f(17), 0);
rot.setValueAtTime(ZC.f(24), 0);
ZC.ease(rot, 1, 33.33, 76.71);
ZC.ease(rot, 2, 77, 33.33);
rot.setInterpolationTypeAtKey(3, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
// Step 10.
rot.expression = 'loopOut("offset")';
var out = { comp: c.name, id: c.id, frames: Math.round(c.duration * c.frameRate) };
var s = [], f;
for (f = 0; f <= 96; f += 4) s.push(f + ":" + Math.round(rot.valueAtTime(ZC.f(f) + 0.001, false) * 10) / 10);
out.rot = s.join(" ");
return out;
