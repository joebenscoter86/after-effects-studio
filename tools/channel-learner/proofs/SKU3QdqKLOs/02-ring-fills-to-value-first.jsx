// SKU3QdqKLOs technique 02: a ring that fills to the counter's value.
// Rig from 01 (null "Controls", Slider "Value 1", 0 at 0:00 to 83 at 3:00; here both keys Easy Ease at 100 % influence).
// Two identical ellipse rings, no fill, 100 px Butt-cap stroke: a dim track (#2A2733) under a yellow copy (#FFC200)
// whose Trim Paths End is the slider, so the arc grows clockwise from twelve o'clock to 83 %. The 01 counter
// (Montserrat Black 111 px, left-aligned, "%" suffix) sits in the ring's hole: only the landed "83%" is centred.
// Portrait 1080 x 1920 for a phone.
//
// VERIFY: font PostScript names "Montserrat-Black", "Oswald-SemiBold", "Montserrat-Regular" are installed; substitutes are reported
// VERIFY: TextDocument.fontObject.isSubstitute exists (read guarded)
// VERIFY: match names ADBE Slider Control / ADBE Slider Control-0001, ADBE Vector Filter - Trim, ADBE Vector Trim End, ADBE Vector Stroke Line Cap (1 = Butt)
// VERIFY: After Effects' parametric ellipse starts at twelve o'clock and runs clockwise (recipe build notes), so Trim End grows clockwise from the top with Offset 0
// VERIFY: Trim Paths placed between the ellipse and the stroke in the group trims that stroke (the interface puts it after the stroke; both should render the same)
// VERIFY: Slider expression wiggle(2,5) keeps the keys underneath it (only with args.wiggle)
//
// args.prelude (required). Optional: args.wiggle (true adds wiggle(2,5) to the slider), args.font, args.headFont, args.bodyFont, args.end.
$.evalFile(args.prelude);

// ---- local helpers (candidates for the prelude: rig, txt, bgSolid, fontCheck) ----
var FONT_WARN = [];
function fontCheck(layer) {
  var d = layer.property("ADBE Text Properties").property("ADBE Text Document").value;
  if (d.fontObject && d.fontObject.isSubstitute) FONT_WARN.push(layer.name + ": " + d.font + " is a substitute");
}
// Text with justification "L", "C" or "R"; the anchor sits on the text's bounds at that side, vertically centred.
function txt(c, str, o) {
  var l = c.layers.addText(str);
  var prop = l.property("ADBE Text Properties").property("ADBE Text Document");
  var d = prop.value;
  d.resetCharStyle();
  d.fontSize = o.size;
  d.fillColor = o.color;
  d.applyFill = true;
  d.applyStroke = false;
  if (o.font) d.font = o.font;
  if (o.tracking !== undefined) d.tracking = o.tracking;
  d.justification = o.just === "L" ? ParagraphJustification.LEFT_JUSTIFY : (o.just === "R" ? ParagraphJustification.RIGHT_JUSTIFY : ParagraphJustification.CENTER_JUSTIFY);
  prop.setValue(d);
  if (o.name) l.name = o.name;
  var r = l.sourceRectAtTime(0, false);
  var ax = o.just === "L" ? r.left : (o.just === "R" ? r.left + r.width : r.left + r.width / 2);
  P.tf(l, "ADBE Anchor Point").setValue([ax, r.top + r.height / 2]);
  P.tf(l, "ADBE Position").setValue(o.pos);
  fontCheck(l);
  return l;
}
// Remove unused solids of this exact name left by earlier runs, then add a full-frame one at the bottom.
function bgSolid(c, name, color) {
  var i, it;
  for (i = app.project.numItems; i >= 1; i--) {
    it = app.project.item(i);
    if (it instanceof FootageItem && it.name === name && it.mainSource instanceof SolidSource && it.usedIn.length === 0) it.remove();
  }
  var s = P.solid(c, name, color);
  s.moveToEnd();
  return s;
}
// The value rig shared by 01-04: a null "Controls" with a Slider Control "Value 1", 0 at 0:00 to `end` at 3:00.
// ease: "linear", or a number = Easy Ease influence in percent on both keys (speed 0).
function rig(c, end, ease) {
  var n = c.layers.addNull();
  n.name = "Controls";
  var fx = P.effect(n, "ADBE Slider Control");
  fx.name = "Value 1";
  var s = n.property("ADBE Effect Parade").property("Value 1").property("ADBE Slider Control-0001");
  s.setValueAtTime(0, 0);
  s.setValueAtTime(3, end); // 3:00 at 24 fps = 3.0 s exactly
  var k;
  for (k = 1; k <= s.numKeys; k++) {
    if (ease === "linear") {
      s.setInterpolationTypeAtKey(k, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
    } else {
      s.setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
      s.setTemporalEaseAtKey(k, [new KeyframeEase(0, ease)], [new KeyframeEase(0, ease)]);
    }
  }
  return n;
}
var SLIDER = 'thisComp.layer("Controls").effect("Value 1")("Slider")';

function ring(c, name, color, center, diameter, width, withTrim) {
  var sh = P.shape(c, name);
  P.ellipse(sh, [diameter, diameter]);
  if (withTrim) {
    var t = P.contents(sh).addProperty("ADBE Vector Filter - Trim");
    var ti = t.propertyIndex;
    P.contents(sh).property(ti).property("ADBE Vector Trim Start").setValue(0);
    P.contents(sh).property(ti).property("ADBE Vector Trim Offset").setValue(0);
    P.contents(sh).property(ti).property("ADBE Vector Trim End").expression = SLIDER;
  }
  P.stroke(sh, color, width, 1); // no fill; Butt cap (at 0 % the arc is a thin sliver, not a dot)
  P.tf(sh.layer, "ADBE Position").setValue(center);
  return sh.layer;
}

// ---- build ----
var W = 1080, H = 1920, FPS = 24, DUR = 5;
var END = args.end || 83;
var GROUND = [26 / 255, 26 / 255, 32 / 255];
var c = P.freshComp("SKU3 02 ring", W, H, FPS, DUR, GROUND);
bgSolid(c, "SKU3 02 background", GROUND);

// Ring: path diameter 515 px, stroke 100 px (outer 615 px, hole 415 px), centred across, raised above the middle
// so the stand-in heading and paragraph can stack under it (they sat to its right in the landscape example).
var RC = [W / 2, 800], DIAM = 515, BAND = 100;

txt(c, "MARKET SHARE\rTHIS QUARTER", { size: 44, color: [0.86, 0.9, 1], font: args.headFont || "Oswald-SemiBold", tracking: 40, just: "C", pos: [W / 2, RC[1] + 307 + 150], name: "heading" });
txt(c, "Placeholder copy for the stat.\rA short paragraph sits under\rthe heading in three lines.", { size: 30, color: [0.6, 0.6, 0.66], font: args.bodyFont || "Montserrat-Regular", just: "C", pos: [W / 2, RC[1] + 307 + 275], name: "paragraph" });

// Counter, left-aligned, its landed "83%" centred on the ring (recipe step 5: nudged so the landed figure centres).
var counter = txt(c, END + "%", { size: 111, color: [1, 1, 1], font: args.font || "Montserrat-Black", just: "L", pos: [0, RC[1]], name: "counter" });
var rr = counter.sourceRectAtTime(0, false);
P.tf(counter, "ADBE Position").setValue([RC[0] - rr.width / 2, RC[1]]);

var ctl = rig(c, END, 100); // Easy Ease, influence 100 % in and out, speed 0 (recipe: inferred from values)
// The rig is made before any expression names it (an expression set on a missing layer errors).
counter.property("ADBE Text Properties").property("ADBE Text Document").expression = "Math.round(" + SLIDER + ') + "%"';
if (args.wiggle) ctl.property("ADBE Effect Parade").property("Value 1").property("ADBE Slider Control-0001").expression = "wiggle(2,5)";

ring(c, "ring track", [42 / 255, 39 / 255, 51 / 255, 1], RC, DIAM, BAND, false);   // #2A2733
ring(c, "ring fill", [1, 194 / 255, 0, 1], RC, DIAM, BAND, true);                 // #FFC200, on top

return { comp: c.name, id: c.id, layers: c.numLayers, wiggle: !!args.wiggle, counterLeft: RC[0] - rr.width / 2, fontWarnings: FONT_WARN.join("; ") };
