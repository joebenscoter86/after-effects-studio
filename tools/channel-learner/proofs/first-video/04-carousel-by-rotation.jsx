// Technique 04: text carousel from rotated copies around one pivot (recipe 04-carousel-by-rotation).
// One text layer, its anchor moved far to the left of the words (text stays put), duplicated to 55 copies;
// the top copy stays at 0 deg and each one below is turned a further -6.53 deg, so the words fan out around the anchor.
// All copies are parented to a null at the pivot, which turns to scroll the words past.
//
// VERIFY (run): Plus Jakarta Sans is not installed on the build machine; Poppins-Bold stands in.
// VERIFY: layer.duplicate() places the copy directly above the original, so the 55 text layers are indices 1..55.
// VERIFY: setting layer.parent keeps each copy's on-screen position and rotation (After Effects compensates).
// VERIFY: the text layer's anchor and position are in pixels with no scale or rotation applied, so shifting both by the same
//         amount leaves the words where they were.
$.evalFile(args.prelude);

var N = args.copies || 55;          // recipe: 55 copies
var STEP = args.step || 6.533;      // recipe: settles at -6.5 per layer (0, -6.5, -13.1, -19.6 ... -58.8)
// Run fix (layout line): the words' left ends follow an arc of radius about 0.61 of the width (1171 px) whose hub sits
// just off the comp's left edge at 0.50 down; the middle (level) word's left end is the furthest right, at 0.57w (1094).
// So the hub is at (1094 - 1171, 540) = (-77, 540), and each word's left end sits 1171 px right of it.
// Review fix: the tutorial's row spacing (about 0.11h) fits a hub near x 170, radius about 0.48 of the width (922 px)
// to the middle word's left end; 0.61 gave rows 0.14-0.15h apart (7 words showing instead of 9).
var RADIUS = args.radius || 0.48 * 1920;
var LEFT_END = 0.57 * 1920;
var PIVOT = [LEFT_END - RADIUS, 540];

// Rules: 1920 x 1080 at 24 fps (the example comp ran at 60 fps; see build notes).
// Re-run tidy: remember the earlier build's null solid so it can be removed once its comp is gone.
var oldNullSrc = [];
(function () {
  var i, it, j;
  for (i = 1; i <= app.project.numItems; i++) {
    it = app.project.item(i);
    if (it instanceof CompItem && it.name === "04 carousel by rotation") {
      for (j = 1; j <= it.numLayers; j++) if (it.layer(j).nullLayer) oldNullSrc.push(it.layer(j).source);
    }
  }
})();
var c = P.freshComp("04 carousel by rotation", 1920, 1080, 24, 5, [0.03, 0.04, 0.04]);

// Step 1: one text layer, a two-word phrase in a bold geometric sans, light mint.
// Run fix (layout line): middle word about 0.32 of the width wide (614 px), cap height about 0.066h (71 px): size 107 measures 613 px wide.
// Run fix: Plus Jakarta Sans is not installed; Poppins-Bold (installed) stands in.
var l = P.text(c, "Bold Moves", {
  size: args.size || 107,
  color: [0.78, 0.96, 0.86],
  font: args.font || "Poppins-Bold",
  pos: [960, 540],
  name: "phrase"
});
var r0 = l.sourceRectAtTime(0, false);
var TEXT_W = r0.width;
// Place the words so their left end is at LEFT_END, centred 0.50 down.
P.tf(l, "ADBE Position").setValue([LEFT_END + TEXT_W / 2, 540]);

// Step 2: move the anchor to the wheel's centre without moving the text.
// SUBSTITUTE: the Pan Behind (Anchor Point) tool drag; anchor and position are shifted by the same amount instead.
var ap = P.tf(l, "ADBE Anchor Point").value;
var SHIFT = LEFT_END + TEXT_W / 2 - PIVOT[0];
P.tf(l, "ADBE Anchor Point").setValue([ap[0] - SHIFT, ap[1]]);
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
// ASSUMED: the null turns 4 steps over the comp, eased, so four words scroll past the 0 deg slot.
// Review fix: the turn is negative (anticlockwise), so the words on the right of the hub move up, as in the tutorial.
var rot = P.tf(n, "ADBE Rotate Z");
rot.setValueAtTime(0, 0);
rot.setValueAtTime(c.duration, args.turn !== undefined ? args.turn : -4 * STEP);
var ease = new KeyframeEase(0, 50);
rot.setTemporalEaseAtKey(1, [ease], [ease]);
rot.setTemporalEaseAtKey(2, [ease], [ease]);

// Layout: a title block on the left, 0.04 to 0.49 of the width, centred 0.49 down. Not part of the technique.
// ASSUMED: words, white, Poppins-Bold; sized to the block's width.
var tt = P.text(c, "Text\rCarousel", { size: args.titleSize || 150, color: [1, 1, 1], font: args.font || "Poppins-Bold", pos: [0.265 * 1920, 0.49 * 1080], name: "title" });
var tr = tt.sourceRectAtTime(0, false);

var removed = 0;
for (k = 0; k < oldNullSrc.length; k++) {
  if (oldNullSrc[k] && oldNullSrc[k].usedIn.length === 0) { oldNullSrc[k].remove(); removed++; }
}

return { removedOldNullSolids: removed, comp: c.name, id: c.id, layers: c.numLayers, copies: N, step: STEP, pivot: PIVOT, textW: TEXT_W, textH: r0.height, titleW: tr.width, titleH: tr.height, font: l.property("ADBE Text Properties").property("ADBE Text Document").value.font };
