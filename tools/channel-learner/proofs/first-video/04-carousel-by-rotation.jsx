// Technique 04: text carousel from rotated copies around one pivot (recipe 04-carousel-by-rotation).
// One text layer, its anchor moved far to the left of the words (text stays put), duplicated to 55 copies;
// the top copy stays at 0 deg and each one below is turned a further -6.53 deg, so the words fan out around the anchor.
// All copies are parented to a null at the pivot, which turns to scroll the words past.
//
// VERIFY: font "PlusJakartaSans-Bold" (PostScript name) exists on the build machine; pass args.font otherwise.
// VERIFY: layer.duplicate() places the copy directly above the original, so the 55 text layers are indices 1..55.
// VERIFY: setting layer.parent keeps each copy's on-screen position and rotation (After Effects compensates).
// VERIFY: the text layer's anchor and position are in pixels with no scale or rotation applied, so shifting both by the same
//         amount leaves the words where they were.
$.evalFile(args.prelude);

var N = args.copies || 55;          // recipe: 55 copies
var STEP = args.step || 6.533;      // recipe: settles at -6.5 per layer (0, -6.5, -13.1, -19.6 ... -58.8)
var RADIUS = args.radius || 640;    // recipe: the anchor sits roughly a third of the frame width left of the text
// ASSUMED: text centre at (1600, 540), so the pivot is at (960, 540). The exact pivot is unknown.
var TEXT_POS = [1600, 540];
var PIVOT = [TEXT_POS[0] - RADIUS, TEXT_POS[1]];

// Rules: 1920 x 1080 at 24 fps (the example comp ran at 60 fps; see build notes).
var c = P.freshComp("04 carousel by rotation", 1920, 1080, 24, 5, [0.03, 0.04, 0.04]);

// Step 1: one text layer, a two-word phrase in a bold geometric sans, light mint.
// ASSUMED: the phrase, size 56 and the mint value.
var l = P.text(c, "Bold Moves", {
  size: 56,
  color: [0.78, 0.96, 0.86],
  font: args.font || "PlusJakartaSans-Bold",
  pos: TEXT_POS,
  name: "phrase"
});

// Step 2: move the anchor to the wheel's centre without moving the text.
// SUBSTITUTE: the Pan Behind (Anchor Point) tool drag; anchor and position are shifted by the same amount instead.
var ap = P.tf(l, "ADBE Anchor Point").value;
P.tf(l, "ADBE Anchor Point").setValue([ap[0] - RADIUS, ap[1]]);
P.tf(l, "ADBE Position").setValue(PIVOT);

// Step 3: duplicate to N copies in all.
var i;
for (i = 1; i < N; i++) {
  l.duplicate();
}

// Steps 4-6: top copy 0 deg, each one below a further -STEP.
// SUBSTITUTE: the Ctrl+Alt / Cmd+Option drag on Rotation across the selected layers; a loop sets the same values.
var k, lay, num;
for (k = 1; k <= N; k++) {
  lay = c.layer(k);
  num = (k < 10 ? "0" : "") + k;
  lay.name = "phrase " + num;
  P.tf(lay, "ADBE Rotate Z").setValue(-(k - 1) * STEP);
}

// Finished example: copies parented to a null; how the null is animated is not shown.
var n = c.layers.addNull(c.duration);
n.name = "carousel null";
P.tf(n, "ADBE Position").setValue(PIVOT);
for (k = 2; k <= N + 1; k++) {
  c.layer(k).parent = n;
}
// ASSUMED: the null turns +4 steps over the comp, eased, so four words scroll past the 0 deg slot.
var rot = P.tf(n, "ADBE Rotate Z");
rot.setValueAtTime(0, 0);
rot.setValueAtTime(c.duration, args.turn !== undefined ? args.turn : 4 * STEP);
var ease = new KeyframeEase(0, 50);
rot.setTemporalEaseAtKey(1, [ease], [ease]);
rot.setTemporalEaseAtKey(2, [ease], [ease]);

return { comp: c.name, id: c.id, layers: c.numLayers, copies: N, step: STEP, pivot: PIVOT };
