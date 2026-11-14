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
// Rebuild with artwork (2026-11-14): art from PROOF/04/art (brief.md). Pass args.artLib (art.jsx) and args.artDir.
// VERIFY (rebuild): SpaceMono-Regular is not installed; SpaceMono-Bold is. characterRange sets the index's font and size.
$.evalFile(args.artLib);
var ARTDIR = args.artDir;
var BG = ART.hex("#080C0A"), WORD = ART.hex("#BEF0D7");
// Index colour: #BEF0D7 at 60 % over the background (per-character opacity is not scriptable).
var IDX = [0.6 * WORD[0] + 0.4 * BG[0], 0.6 * WORD[1] + 0.4 * BG[1], 0.6 * WORD[2] + 0.4 * BG[2]];
// ASSUMED: phrases for the readout (the recipe's steps repeat one phrase; the brief asks for a readout of ideas).
var PHRASES = ["Bold Moves", "Clear Goals", "Fresh Ideas", "Quiet Focus", "Sharp Edits", "Big Picture", "Small Wins", "Next Steps", "Open Doors", "True North", "Deep Work"];

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
var c = P.freshComp("04 carousel by rotation", 1920, 1080, 24, 5, BG);
(function () { var i, it; for (i = app.project.numItems; i >= 1; i--) { it = app.project.item(i); if (it instanceof FootageItem && (it.name === "04 background" || it.name === "04 title shade") && it.usedIn.length === 0) it.remove(); } })();

// Brief: background solid #080C0A with a faint radial Ramp, #12201A at the hub fading to #080C0A by the right edge.
var bg = P.solid(c, "04 background", BG);
bg.name = "background";
var rp = P.effect(bg, "ADBE Ramp");
ART.setFx(rp, { "Start of Ramp": PIVOT, "Start Color": ART.hex("#12201A"), "End of Ramp": [1920, 540], "End Color": BG, "Ramp Shape": 2 });

// Brief: dial at 74.5 % centred on the hub, darkened (Exposure -0.4); parented to the null below so it turns with the words.
var dial = c.layers.add(ART.footage(ARTDIR, "dial.png", "art 04"));
dial.name = "dial";
P.tf(dial, "ADBE Scale").setValue([74.5, 74.5]);
P.tf(dial, "ADBE Position").setValue(PIVOT);
ART.setFx(P.effect(dial, "ADBE Exposure2"), { "Exposure": args.dialExposure !== undefined ? args.dialExposure : -0.4 });

// Step 1: one text layer, a two-word phrase in a bold geometric sans, light mint.
// Run fix (layout line): middle word about 0.32 of the width wide (614 px), cap height about 0.066h (71 px): size 107 measures 613 px wide.
// Run fix: Plus Jakarta Sans is not installed; Poppins-Bold (installed) stands in.
// Rebuild: brief type, Poppins Bold, cap height 0.066 h (size 102), #BEF0D7.
var l = P.text(c, "Bold Moves", {
  size: args.size || 102,
  color: WORD,
  font: args.font || "Poppins-Bold",
  pos: [960, 540],
  name: "phrase"
});
// Rebuild: left-justified so each copy can carry its own phrase and index with its left end on the arc.
var tdp0 = l.property("ADBE Text Properties").property("ADBE Text Document");
var td0 = tdp0.value;
td0.justification = ParagraphJustification.LEFT_JUSTIFY;
tdp0.setValue(td0);
var r0 = l.sourceRectAtTime(0, false);
var TEXT_W = r0.width;
// Place the words so their left end is at LEFT_END, centred 0.50 down.
P.tf(l, "ADBE Anchor Point").setValue([r0.left, r0.top + r0.height / 2]);
P.tf(l, "ADBE Position").setValue([LEFT_END, 540]);

// Step 2: move the anchor to the wheel's centre without moving the text.
// SUBSTITUTE: the Pan Behind (Anchor Point) tool drag; anchor and position are shifted by the same amount instead.
var ap = P.tf(l, "ADBE Anchor Point").value;
var SHIFT = LEFT_END - PIVOT[0];
P.tf(l, "ADBE Anchor Point").setValue([ap[0] - SHIFT, ap[1]]);
P.tf(l, "ADBE Position").setValue(PIVOT);

// Step 3: duplicate to N copies in all.
var i;
for (i = 1; i < N; i++) {
  l.duplicate();
}

// Steps 4-6: top copy 0 deg, each one below a further -STEP.
// SUBSTITUTE: the Ctrl+Alt / Cmd+Option drag on Rotation across the selected layers; a loop sets the same values.
var k, lay, num, indexNote = "ok";
for (k = 1; k <= N; k++) {
  lay = c.layer(k);
  num = (k < 10 ? "0" : "") + k;
  lay.name = "phrase " + num;
  P.tf(lay, "ADBE Rotate Z").setValue(-(k - 1) * STEP);
  // Rebuild: each copy reads its own phrase plus a small index (Space Mono, 0.016 h cap height, 60 %).
  var ph = PHRASES[(k - 1) % PHRASES.length];
  var tdp = lay.property("ADBE Text Properties").property("ADBE Text Document");
  var td = tdp.value;
  td.text = ph + "  " + num;
  tdp.setValue(td);
  try {
    td = tdp.value;
    // The two spaces take the index's small size too, so the number sits close after the phrase.
    var cr = td.characterRange(ph.length, ph.length + 4);
    cr.font = "SpaceMono-Bold";
    // Polish: 26 -> 40 px (cap height about 0.026 h): at the brief's 0.016 h the numbers read as texture.
    cr.fontSize = args.indexSize || 40;
    cr.fillColor = IDX;
    tdp.setValue(td);
  } catch (e) { indexNote = e.toString(); }
  // Brief: the middle (level) word at full opacity, falling to about 55 % by the frame edges (about 20 deg).
  P.tf(lay, "ADBE Opacity").expression = 'var a = transform.rotation + (hasParent ? parent.transform.rotation : 0);\na = ((a % 360) + 540) % 360 - 180;\nvar d = Math.abs(a);\nd <= 17 ? 100 - 45 * d / 17 : 55 * Math.max(0, 1 - (d - 17) / 10);';
  // Polish: 55 % is now reached at 17 deg and the words fade on to 0 at 27 deg, so the words the frame's top and bottom
  // edges cut (at about 26 deg) dissolve instead of being chopped.
}

// Finished example: copies parented to a null; how the null is animated is not shown.
var n = c.layers.addNull(c.duration);
n.name = "carousel null";
P.tf(n, "ADBE Position").setValue(PIVOT);
for (k = 2; k <= N + 1; k++) {
  c.layer(k).parent = n;
}
c.layer("dial").parent = n;
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
// Rebuild: brief places the title over the dial, 0.04 to 0.30 across, Poppins Bold cap height 0.07 h (size 108),
// #F5F5F5, two lines, left-aligned, centred 0.49 down; the pointer and a soft dark radial behind the title.
var pt = c.layers.add(ART.footage(ARTDIR, "pointer.png", "art 04"));
pt.name = "pointer";
// Polish: the chevron rendered near white and heavy. Now tinted to the word mint #BEF0D7 (Tint maps its white to
// the mint and its shading to a deep green), a little smaller (9 -> 7 %, about 32 x 49 px), and without its glow.
P.tf(pt, "ADBE Scale").setValue([args.pointerScale || 7, args.pointerScale || 7]);
P.tf(pt, "ADBE Position").setValue([0.55 * 1920, 540]);
var tn = P.effect(pt, "ADBE Tint");
var tnMiss = ART.setFx(tn, { "Map Black To": ART.hex("#2E5A47"), "Map White To": ART.hex("#BEF0D7"), "Amount to Tint": 100 });
if (tnMiss.length) throw new Error("tint params not found: " + tnMiss.join(", "));

var ts = P.solid(c, "04 title shade", BG);
ts.name = "title shade";
var mk = ts.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
// Polish: the title straddled the dial's hub cap. It now sits clear of the hub, below it at the lower left
// (left edge 0.04 w, block about 0.70-0.91 h); the shade moves with it.
var TY = args.titleY || 0.805 * 1080;
var ms = new Shape(), mx = 330, my = TY, rx = 360, ry = 170, kk = 0.5523;
ms.vertices = [[mx, my - ry], [mx + rx, my], [mx, my + ry], [mx - rx, my]];
ms.inTangents = [[-rx * kk, 0], [0, -ry * kk], [rx * kk, 0], [0, ry * kk]];
ms.outTangents = [[rx * kk, 0], [0, ry * kk], [-rx * kk, 0], [0, -ry * kk]];
ms.closed = true;
mk.property("ADBE Mask Shape").setValue(ms);
ts.property("ADBE Mask Parade").property(1).property("ADBE Mask Feather").setValue([200, 200]);
P.tf(ts, "ADBE Opacity").setValue(args.titleShade !== undefined ? args.titleShade : 50);

var tt = P.text(c, "Text\rCarousel", { size: args.titleSize || 108, color: ART.hex("#F5F5F5"), font: args.font || "Poppins-Bold", pos: [0.265 * 1920, 0.49 * 1080], name: "title" });
var ttp = tt.property("ADBE Text Properties").property("ADBE Text Document");
var ttd = ttp.value;
ttd.justification = ParagraphJustification.LEFT_JUSTIFY;
ttp.setValue(ttd);
var tr = tt.sourceRectAtTime(0, false);
P.tf(tt, "ADBE Anchor Point").setValue([tr.left, tr.top + tr.height / 2]);
P.tf(tt, "ADBE Position").setValue([0.04 * 1920, TY]);

// Brief layer order: background, dial, words, pointer, title (shade just under the title).
bg.moveToEnd();
c.layer("dial").moveBefore(bg);

var removed = 0;
for (k = 0; k < oldNullSrc.length; k++) {
  if (oldNullSrc[k] && oldNullSrc[k].usedIn.length === 0) { oldNullSrc[k].remove(); removed++; }
}

var order = []; for (k = 1; k <= c.numLayers; k++) if (k < 4 || k > c.numLayers - 4) order.push(k + " " + c.layer(k).name);
return { order: order, indexNote: indexNote, sample: c.layer("phrase 03").property("ADBE Text Properties").property("ADBE Text Document").value.text, removedOldNullSolids: removed, comp: c.name, id: c.id, layers: c.numLayers, copies: N, step: STEP, pivot: PIVOT, textW: TEXT_W, textH: r0.height, titleW: tr.width, titleH: tr.height, font: l.property("ADBE Text Properties").property("ADBE Text Document").value.font };
