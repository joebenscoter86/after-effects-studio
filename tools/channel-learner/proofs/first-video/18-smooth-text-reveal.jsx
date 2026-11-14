// Technique 18: soft word-by-word rise-and-fade text reveal.
// One text animator with Position (0,75) and Opacity 0, a Range Selector based on Words with Shape Ramp Up,
// Ease High -50 and Ease Low 100, and two linear Offset keyframes from -100 to 100.
//
// VERIFY: a script-made "ADBE Text Animator" has no Range Selector until "ADBE Text Selector" is added (guarded below)
// VERIFY: "ADBE Text Position 3D" takes a three-value array on a 2D text layer ([0,75,0])
// VERIFY: Range Selector match names: "ADBE Text Percent Start", "ADBE Text Percent End", "ADBE Text Percent Offset",
//         "ADBE Text Range Advanced", "ADBE Text Range Units", "ADBE Text Range Type2" (Based On),
//         "ADBE Text Selector Mode", "ADBE Text Selector Max Amount", "ADBE Text Range Shape",
//         "ADBE Text Levels Max Ease" (Ease High), "ADBE Text Levels Min Ease" (Ease Low), "ADBE Text Randomize Order"
// VERIFY: Based On enum 3 = Words (1 Characters, 2 Characters Excluding Spaces, 4 Lines); Shape enum 2 = Ramp Up
//         (1 Square, 3 Ramp Down, 4 Triangle, 5 Round, 6 Smooth); Units 1 = Percentage; Mode 1 = Add
// VERIFY: font PostScript name "Poppins-Bold" is installed (pass args.font to override)
$.evalFile(args.prelude);
// Rebuild with artwork (2026-11-14): art from PROOF/18/art (brief.md). Pass args.artLib (art.jsx) and args.artDir.
// Added round the unchanged technique: three portrait cards above the headline (white rounded card, rounded photo,
// soft drop shadow, own staggered entrance), a rust underline under "people", and a pill button. The reveal animator
// and the block's hold-then-drop are as before. The cards null is parented to the block null, so the whole hero holds
// high and settles together and the held headline never runs into the cards.
$.evalFile(args.artLib);
var ARTDIR = args.artDir;

var BG = ART.hex("#F3F0EA"), INK = ART.hex("#161616"), RUST = ART.hex("#B5532F");
var c = P.freshComp("18 smooth text reveal", 1920, 1080, 23.976, 5, BG);
// Re-runs: freshComp removes the comp but not its solids; remove this script's unused ones.
(function () {
  var j, it;
  for (j = app.project.numItems; j >= 1; j--) {
    it = app.project.item(j);
    if (it instanceof FootageItem && it.mainSource instanceof SolidSource && it.usedIn.length === 0 &&
        (it.name === "18 paper" || it.name === "18 block null" || it.name === "18 cards null")) it.remove();
  }
})();
var paper = P.solid(c, "paper", BG);
paper.source.name = "18 paper";

// ASSUMED: wording and font; the recipe names only "two-line bold sans, near-black".
// Layout (recipe's layout: line, finished state): line 1 spans 19.9-80.1 % across (1156 px), line 2 32.3-68.1 % (687 px),
// both centred; ink of line 1 at 55.2-61.9 % down, of line 2 at 66.3-73.1 %; line to line 11.1 % of the height (120 px).
// The wording is chosen so line 2 is about 0.6 of line 1; the size is then set from the measured width of line 1.
var LINE1_W = 1156, LEADING = 120, INK_TOP = 596, INK_BOTTOM = 790;
var LINE1 = "Meet the people behind", LINE2 = "our best work";
var txt = P.text(c, LINE1 + "\r" + LINE2, {
  size: 100, font: args.font || "Poppins-Bold", color: INK, name: "headline"
});
(function () {
  var prop = txt.property("ADBE Text Properties").property("ADBE Text Document");
  var r = txt.sourceRectAtTime(0, false);
  var d = prop.value;
  d.fontSize = args.size || Math.round(100 * LINE1_W / r.width * 10) / 10;
  d.autoLeading = false;
  d.leading = LEADING;
  prop.setValue(d);
  r = txt.sourceRectAtTime(0, false);
  P.tf(txt, "ADBE Anchor Point").setValue([r.left + r.width / 2, r.top + r.height / 2]);
  P.tf(txt, "ADBE Position").setValue([960, (INK_TOP + INK_BOTTOM) / 2]);
})();
var f = c.frameDuration;
txt.inPoint = 29 * f; // the layer's in point is 0:00:01:05, where the first Offset key sits

// Step 6 note: the recipe's text is parented to a null, and mid-reveal the block sits about 11 % of the height higher than
// when finished. Review correction: the block does not drift through the whole reveal (it was 238 px, eased lightly, over
// frames 29-78). It holds 126 px (11.7 % of the height) above its final place while the words arrive, then drops into place
// over about a third of a second as the last word settles, with an eased stop.
// args.still leaves it out; args.travel overrides the distance; args.dropStart / args.dropEnd override the frames.
if (!args.still) {
  var blockNull = c.layers.addNull(c.duration);
  blockNull.name = "block null";
  blockNull.source.name = "18 block null";
  txt.parent = blockNull;
  var np = P.tf(blockNull, "ADBE Position");
  var base = np.value;
  var TRAVEL = args.travel !== undefined ? args.travel : 126;
  var DROP_A = args.dropStart !== undefined ? args.dropStart : 53; // frame the drop starts (the last word begins to show)
  var DROP_B = args.dropEnd !== undefined ? args.dropEnd : 62;     // frame the block reaches its final place
  np.setValueAtTime(DROP_A * f, [base[0], base[1] - TRAVEL]); // before this key the value holds, so the block is still
  np.setValueAtTime(DROP_B * f, [base[0], base[1]]);
  np.setTemporalEaseAtKey(1, [new KeyframeEase(0, 25)], [new KeyframeEase(0, 25)]); // a short ease away
  np.setTemporalEaseAtKey(2, [new KeyframeEase(0, 75)], [new KeyframeEase(0, 75)]); // a long eased stop
}

// Steps 1 to 3: one animator with Position and Opacity.
var animators = txt.property("ADBE Text Properties").property("ADBE Text Animators");
var aIdx = animators.addProperty("ADBE Text Animator").propertyIndex;
function anim() { return txt.property("ADBE Text Properties").property("ADBE Text Animators").property(aIdx); }
anim().name = "Animator 1";
anim().property("ADBE Text Animator Properties").addProperty("ADBE Text Position 3D");
anim().property("ADBE Text Animator Properties").property("ADBE Text Position 3D").setValue([0, 75, 0]); // the end state's 75, not the first 115
anim().property("ADBE Text Animator Properties").addProperty("ADBE Text Opacity");
anim().property("ADBE Text Animator Properties").property("ADBE Text Opacity").setValue(0);

// Step 4: Range Selector 1 > Advanced.
if (anim().property("ADBE Text Selectors").numProperties === 0) {
  anim().property("ADBE Text Selectors").addProperty("ADBE Text Selector");
}
function sel() { return anim().property("ADBE Text Selectors").property(1); }
function adv() { return sel().property("ADBE Text Range Advanced"); }
sel().property("ADBE Text Percent Start").setValue(0);
sel().property("ADBE Text Percent End").setValue(100);
adv().property("ADBE Text Range Units").setValue(1);       // Percentage
adv().property("ADBE Text Range Type2").setValue(3);       // Based On: Words
adv().property("ADBE Text Selector Mode").setValue(1);     // Add
adv().property("ADBE Text Selector Max Amount").setValue(100);
adv().property("ADBE Text Range Shape").setValue(2);       // Ramp Up
adv().property("ADBE Text Levels Max Ease").setValue(-50); // Ease High
adv().property("ADBE Text Levels Min Ease").setValue(100); // Ease Low
adv().property("ADBE Text Randomize Order").setValue(0);

// Step 5: Offset -100 at 0:00:01:05 (frame 29) to 100 at 0:00:03:06 (frame 78), both linear.
var off = sel().property("ADBE Text Percent Offset");
off.setValueAtTime(29 * f, -100);
off.setValueAtTime(78 * f, 100);
off.setInterpolationTypeAtKey(1, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
off.setInterpolationTypeAtKey(2, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);


// ---- Artwork round the technique -------------------------------------------------------------------------------
function rrShape(w, h, r, cx, cy) { // rounded rectangle as a closed bezier Shape, centred on cx, cy
  var k = 0.5523 * r, x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2, s = new Shape();
  s.vertices = [[x0 + r, y0], [x1 - r, y0], [x1, y0 + r], [x1, y1 - r], [x1 - r, y1], [x0 + r, y1], [x0, y1 - r], [x0, y0 + r]];
  s.inTangents = [[-k, 0], [0, 0], [0, -k], [0, 0], [k, 0], [0, 0], [0, k], [0, 0]];
  s.outTangents = [[0, 0], [k, 0], [0, 0], [0, k], [0, 0], [-k, 0], [0, 0], [0, -k]];
  s.closed = true;
  return s;
}
function grpC(l, gi) { return l.property("ADBE Root Vectors Group").property(gi).property("ADBE Vectors Group"); }
function addGroup(l) { return l.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").propertyIndex; }

var cardsNull = c.layers.addNull(c.duration);
cardsNull.name = "cards null";
cardsNull.source.name = "18 cards null";
var PH = 1744 * 0.127, PV = 2336 * 0.127; // photo 221 x 297 px
var CW = PH + 20, CV = PV + 20;            // white border about 10 px
var cards = [
  { n: "L", file: "portrait-left.png", x: 0.415, y: 0.33, rot: -11, d: 0 },
  { n: "R", file: "portrait-right.png", x: 0.585, y: 0.335, rot: 12, d: 3 },
  { n: "C", file: "portrait-centre.png", x: 0.50, y: 0.30, rot: 2, d: 6 }
];
var SHOP = null;
var CARD_IN = args.cardIn !== undefined ? args.cardIn : 6; // first card starts at frame 6, each lasts 14 frames
for (var ci = 0; ci < cards.length; ci++) {
  var cd = cards[ci];
  var card = c.layers.addShape();
  card.name = "Card " + cd.n;
  var g = addGroup(card);
  var r = grpC(card, g).addProperty("ADBE Vector Shape - Rect");
  grpC(card, g).property(r.propertyIndex).property("ADBE Vector Rect Size").setValue([CW, CV]);
  grpC(card, g).property(r.propertyIndex).property("ADBE Vector Rect Roundness").setValue(18);
  var fl = grpC(card, g).addProperty("ADBE Vector Graphic - Fill");
  grpC(card, g).property(fl.propertyIndex).property("ADBE Vector Fill Color").setValue([1, 1, 1]);
  P.tf(card, "ADBE Anchor Point").setValue([0, 0]);
  // World position first, then parent to the (still unanimated) cards null, so the compensation is exact.
  P.tf(card, "ADBE Position").setValue([cd.x * 1920, cd.y * 1080]);
  card.parent = cardsNull;
  P.tf(card, "ADBE Rotate Z").setValue(cd.rot);
  var ds = P.effect(card, "ADBE Drop Shadow");
  var dsIdx = ds.propertyIndex;
  ART.setFx(card.property("ADBE Effect Parade").property(dsIdx), { "Shadow Color": ART.hex("#2A2118"), "Direction": 135 - cd.rot, "Distance": 14, "Softness": 40 });
  var op = null, pj;
  for (pj = 1; pj <= card.property("ADBE Effect Parade").property(dsIdx).numProperties; pj++) if (card.property("ADBE Effect Parade").property(dsIdx).property(pj).name === "Opacity") op = card.property("ADBE Effect Parade").property(dsIdx).property(pj);
  if (op) { SHOP = op.maxValue; op.setValue(op.maxValue > 100 ? 0.18 * 255 : 18); }

  var ph = c.layers.add(ART.footage(ARTDIR, cd.file, "art 18"));
  ph.name = "Card " + cd.n + " photo";
  ph.parent = card;
  P.tf(ph, "ADBE Position").setValue([0, 0]);
  P.tf(ph, "ADBE Rotate Z").setValue(0); // run fix: parenting had counter-rotated the photo upright inside its tilted card
  P.tf(ph, "ADBE Scale").setValue([12.7, 12.7]);
  var mk = ph.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
  ph.property("ADBE Mask Parade").property(mk.propertyIndex).property("ADBE Mask Shape").setValue(rrShape(1744, 2336, 12 / 0.127, 872, 1168));
  ph.moveBefore(card);
  P.tf(ph, "ADBE Opacity").expression = 'parent.transform.opacity';

  // Entrance: scale 92 -> 100 and fade in, 14 frames, staggered 3 frames, finished well before the first word lands.
  var t0 = (CARD_IN + cd.d) * f, t1 = (CARD_IN + cd.d + 14) * f;
  var sc = P.tf(card, "ADBE Scale"), oc = P.tf(card, "ADBE Opacity");
  sc.setValueAtTime(t0, [92, 92]); sc.setValueAtTime(t1, [100, 100]);
  oc.setValueAtTime(t0, 0); oc.setValueAtTime(t1, 100);
  var e33 = new KeyframeEase(0, 33), e80 = new KeyframeEase(0, 80); // Scale takes three eases even on a 2D layer
  sc.setTemporalEaseAtKey(1, [e33, e33, e33], [e33, e33, e33]);
  sc.setTemporalEaseAtKey(2, [e80, e80, e80], [e80, e80, e80]);
  oc.setTemporalEaseAtKey(2, [new KeyframeEase(0, 60)], [new KeyframeEase(0, 60)]);
}
// Run fix: parenting the cards null to the block null compensated for the block's held offset and left the cards
// about 90 px low. Instead the cards null copies the block's move by expression (added after the cards are parented).
if (!args.still) P.tf(cardsNull, "ADBE Position").expression =
  'var b = thisComp.layer("block null").transform.position; value + b - b.valueAtTime(thisComp.duration);';
// Stack: headline over the cards; centre card on top of the cards (added last, so it is above L and R already).

// Underline under "people", parented to the headline (layer space: line 1 is centred on x 0, its baseline at y 0).
function inkW(str) {
  var t = c.layers.addText(str), pr = t.property("ADBE Text Properties").property("ADBE Text Document"), d = pr.value;
  var hd = txt.property("ADBE Text Properties").property("ADBE Text Document").value;
  d.resetCharStyle(); d.fontSize = hd.fontSize; d.font = hd.font; d.justification = ParagraphJustification.LEFT_JUSTIFY; pr.setValue(d);
  var rr0 = t.sourceRectAtTime(0, false); t.remove();
  return { left: rr0.left, right: rr0.left + rr0.width };
}
var l1 = inkW(LINE1), upto = inkW("Meet the people"), word = inkW("people");
var L1L = -(l1.right - l1.left) / 2 - l1.left;           // shift from the left-justified measure to the centred line
var UX0 = L1L + upto.right - (word.right - word.left) - 4, UX1 = L1L + upto.right + 6;
var fsz = txt.property("ADBE Text Properties").property("ADBE Text Document").value.fontSize;
var ul = c.layers.addShape();
ul.name = "underline";
P.tf(ul, "ADBE Anchor Point").setValue([0, 0]);
ul.parent = txt;
P.tf(ul, "ADBE Position").setValue([0, 0]);
var ug = addGroup(ul);
var up = grpC(ul, ug).addProperty("ADBE Vector Shape - Group");
var uy = 0.2 * fsz, us = new Shape();
us.vertices = [[UX0, uy + 2], [UX1, uy - 3]];
us.inTangents = [[0, 0], [-(UX1 - UX0) * 0.4, 9]];
us.outTangents = [[(UX1 - UX0) * 0.4, 9], [0, 0]];
us.closed = false;
grpC(ul, ug).property(up.propertyIndex).property("ADBE Vector Shape").setValue(us);
var ust = grpC(ul, ug).addProperty("ADBE Vector Graphic - Stroke");
grpC(ul, ug).property(ust.propertyIndex).property("ADBE Vector Stroke Color").setValue(RUST);
grpC(ul, ug).property(ust.propertyIndex).property("ADBE Vector Stroke Width").setValue(6);
grpC(ul, ug).property(ust.propertyIndex).property("ADBE Vector Stroke Line Cap").setValue(2);
var utr = grpC(ul, ug).addProperty("ADBE Vector Filter - Trim");
var uend = grpC(ul, ug).property(utr.propertyIndex).property("ADBE Vector Trim End");
uend.setValueAtTime(2.75, 0); uend.setValueAtTime(3.25, 100);
uend.setTemporalEaseAtKey(1, [new KeyframeEase(0, 40)], [new KeyframeEase(0, 40)]);
uend.setTemporalEaseAtKey(2, [new KeyframeEase(0, 85)], [new KeyframeEase(0, 85)]);

// Button: pill outline, label and a rust arrow, centred under the headline, fades up after the drop.
var BY = 0.855 * 1080, BW = 236, BH = 56;
var pill = c.layers.addShape();
pill.name = "button";
P.tf(pill, "ADBE Anchor Point").setValue([0, 0]);
P.tf(pill, "ADBE Position").setValue([960, BY]);
var pg = addGroup(pill);
var pr2 = grpC(pill, pg).addProperty("ADBE Vector Shape - Rect");
grpC(pill, pg).property(pr2.propertyIndex).property("ADBE Vector Rect Size").setValue([BW, BH]);
grpC(pill, pg).property(pr2.propertyIndex).property("ADBE Vector Rect Roundness").setValue(BH / 2);
var pst = grpC(pill, pg).addProperty("ADBE Vector Graphic - Stroke");
grpC(pill, pg).property(pst.propertyIndex).property("ADBE Vector Stroke Color").setValue(INK);
grpC(pill, pg).property(pst.propertyIndex).property("ADBE Vector Stroke Width").setValue(2);
grpC(pill, pg).property(pst.propertyIndex).property("ADBE Vector Stroke Opacity").setValue(25);
var ag = addGroup(pill); // arrow
var ap = grpC(pill, ag).addProperty("ADBE Vector Shape - Group");
var as1 = new Shape(); as1.vertices = [[62, 0], [82, 0]]; as1.closed = false;
grpC(pill, ag).property(ap.propertyIndex).property("ADBE Vector Shape").setValue(as1);
var ap2 = grpC(pill, ag).addProperty("ADBE Vector Shape - Group");
var as2 = new Shape(); as2.vertices = [[75, -7], [82, 0], [75, 7]]; as2.closed = false;
grpC(pill, ag).property(ap2.propertyIndex).property("ADBE Vector Shape").setValue(as2);
var ast = grpC(pill, ag).addProperty("ADBE Vector Graphic - Stroke");
grpC(pill, ag).property(ast.propertyIndex).property("ADBE Vector Stroke Color").setValue(RUST);
grpC(pill, ag).property(ast.propertyIndex).property("ADBE Vector Stroke Width").setValue(2.5);
grpC(pill, ag).property(ast.propertyIndex).property("ADBE Vector Stroke Line Cap").setValue(2);
grpC(pill, ag).property(ast.propertyIndex).property("ADBE Vector Stroke Line Join").setValue(2);
var lbl = P.text(c, "Meet the team", { size: 18, color: INK, font: args.labelFont || "Poppins-Regular", name: "button label", tracking: 20 });
var lr = lbl.sourceRectAtTime(0, false);
P.tf(lbl, "ADBE Position").setValue([960 - 14, BY]);
lbl.parent = pill;
var po = P.tf(pill, "ADBE Opacity"), pp = P.tf(pill, "ADBE Position");
po.setValueAtTime(2.7, 0); po.setValueAtTime(3.2, 100);
pp.setValueAtTime(2.7, [960, BY + 14]); pp.setValueAtTime(3.2, [960, BY]);
pp.setTemporalEaseAtKey(2, [new KeyframeEase(0, 80)], [new KeyframeEase(0, 80)]);
P.tf(lbl, "ADBE Opacity").expression = 'parent.transform.opacity';

// Stack order: cards at the bottom (above paper), headline, underline, button on top; nulls first.
txt.moveToBeginning(); ul.moveBefore(txt); lbl.moveToBeginning(); pill.moveAfter(lbl);
var rr = txt.sourceRectAtTime(4, false);
return { comp: c.name, layer: txt.name, keys: off.numKeys, fontSize: txt.property("ADBE Text Properties").property("ADBE Text Document").value.fontSize, font: txt.property("ADBE Text Properties").property("ADBE Text Document").value.font, rect: [rr.left, rr.top, rr.width, rr.height].join(","), revealStart: 29 * f, revealEnd: 78 * f, shadowOpacityMax: SHOP, underline: [UX0, UX1], labelFont: lbl.property("ADBE Text Properties").property("ADBE Text Document").value.font };
