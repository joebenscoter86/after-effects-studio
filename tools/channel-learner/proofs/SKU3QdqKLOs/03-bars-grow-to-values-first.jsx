// SKU3QdqKLOs technique 03: round-capped bars that grow to their own values.
// Rig from 01 (null "Controls"), one Slider Control per bar named "Value 1", "Value 2", ..., each 0 at 0:00 to its
// figure at 3:00, Easy Ease. Per bar: a vertical two-point path drawn bottom first, 35 px Round-cap stroke, no fill;
// the dim track (#2C2837) under a yellow copy (#FFC600) whose Trim Paths End is that bar's slider, so it rises
// from the baseline as a pill. Columns 113 px apart. Stand-in scale, month labels, value labels and heading.
// Portrait 1080 x 1920 for a phone.
//
// VERIFY: font PostScript names "Montserrat-Bold", "Montserrat-Regular", "Oswald-SemiBold" are installed; substitutes are reported
// VERIFY: TextDocument.fontObject.isSubstitute exists (read guarded)
// VERIFY: match names ADBE Slider Control / ADBE Slider Control-0001, ADBE Vector Filter - Trim, ADBE Vector Trim End, ADBE Vector Stroke Line Cap (2 = Round)
// VERIFY: Trim End grows from the path's first vertex (the bottom one here), so the bar rises upward
// VERIFY: at Trim End 0 a Round-cap stroke draws as a dot at the baseline (recipe: "the bar starts as a dot")
// VERIFY: a second Slider Control added to the same null takes the name "Value 2" after .name is set (no clash with the auto name "Slider Control 2")
//
// args.prelude (required). Optional: args.count (bars, 1-7, default 6; 2 is the tutorial's own two-bar build),
// args.values (array of figures), args.stagger (frames between bars' keys, default 0 = the build's shared timing),
// args.ease (Easy Ease influence %, default 33.33), args.font, args.headFont, args.bodyFont.
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
function slider(nullLayer, name, end, t0, ease) {
  var fx = P.effect(nullLayer, "ADBE Slider Control");
  fx.name = name;
  var s = nullLayer.property("ADBE Effect Parade").property(name).property("ADBE Slider Control-0001");
  s.setValueAtTime(t0, 0);
  s.setValueAtTime(t0 + 3, end);
  var k;
  for (k = 1; k <= s.numKeys; k++) {
    s.setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
    s.setTemporalEaseAtKey(k, [new KeyframeEase(0, ease)], [new KeyframeEase(0, ease)]);
  }
  return s;
}
// One bar layer: a vertical path, bottom vertex first, in comp pixels (layer position 0,0 so layer space = comp space).
function barLine(c, name, x, yBottom, yTop, color, sliderName) {
  var sh = P.shape(c, name);
  P.path(sh, [[x, yBottom], [x, yTop]], null, null, false);
  if (sliderName) {
    var t = P.contents(sh).addProperty("ADBE Vector Filter - Trim");
    var ti = t.propertyIndex;
    P.contents(sh).property(ti).property("ADBE Vector Trim End").expression = 'thisComp.layer("Controls").effect("' + sliderName + '")("Slider")';
  }
  P.stroke(sh, color, 35, 2); // 35 px, Round cap, no fill
  P.tf(sh.layer, "ADBE Position").setValue([0, 0]);
  return sh.layer;
}

// ---- build ----
var W = 1080, H = 1920, FPS = 24, DUR = 5;
var ALL = args.values || [54, 64, 47, 81, 73, 67, 59]; // 54 and 64 built in the tip; the rest are the finished example's
var N = Math.max(1, Math.min(args.count || 6, 7));     // 7 columns at 113 px is the most a 1080-wide frame holds
var STAG = (args.stagger || 0) / FPS;
var EASE = args.ease || 33.33; // ASSUMED: default Easy Ease; the tip's influence is unknown
var GROUND = [17 / 255, 17 / 255, 20 / 255];
var TRACK = [44 / 255, 40 / 255, 55 / 255, 1];   // #2C2837
var BAR = [1, 198 / 255, 0, 1];                  // #FFC600
var LABEL = [0.55, 0.55, 0.6];                   // ASSUMED: scale and month labels mid grey
var c = P.freshComp("SKU3 03 bars", W, H, FPS, DUR, GROUND);
bgSolid(c, "SKU3 03 background", GROUND);

// Chart geometry in comp pixels, kept from the 1080-high measurements: stroke 35, path 496 long (track 531 with caps),
// columns 113 apart. Centred across with room for the scale at left; baseline below the middle so the heading fits above.
var GAP = 113, LEN = 496, BOTTOM = 1340, TOP = BOTTOM - LEN;
var X0 = W / 2 - (N - 1) * GAP / 2 + 40;

// Stand-in dressing: heading and two-line subtitle, scale 0-100 %, month and value labels (already in the tutorial's comp).
txt(c, "MONTHLY GROWTH", { size: 64, color: [0.86, 0.9, 1], font: args.headFont || "Oswald-SemiBold", tracking: 40, just: "C", pos: [W / 2, 520], name: "heading" });
txt(c, "Placeholder subtitle for the chart,\rsecond line of supporting copy.", { size: 30, color: [0.6, 0.6, 0.66], font: args.bodyFont || "Montserrat-Regular", just: "C", pos: [W / 2, 625], name: "subtitle" });
var p, i;
for (p = 0; p <= 100; p += 20) { // ASSUMED: scale rows every 20 %
  txt(c, p + "%", { size: 26, color: LABEL, font: args.bodyFont || "Montserrat-Regular", just: "R", pos: [X0 - 50, BOTTOM - LEN * p / 100], name: "scale " + p });
}
var MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL"];
for (i = 0; i < N; i++) {
  txt(c, MONTHS[i], { size: 26, color: LABEL, font: args.bodyFont || "Montserrat-Regular", just: "C", pos: [X0 + i * GAP, BOTTOM + 17 + 45], name: "month " + (i + 1) });
  txt(c, ALL[i] + "%", { size: 30, color: [1, 1, 1], font: args.font || "Montserrat-Bold", just: "C", pos: [X0 + i * GAP, TOP - 17 - 42], name: "value label " + (i + 1) });
}

// Rig first, so the Trim End expressions find their sliders.
var ctl = c.layers.addNull();
ctl.name = "Controls";
for (i = 0; i < N; i++) slider(ctl, "Value " + (i + 1), ALL[i], i * STAG, EASE);

for (i = 0; i < N; i++) {
  barLine(c, "bar " + (i + 1) + " track", X0 + i * GAP, BOTTOM, TOP, TRACK, null);
  barLine(c, "bar " + (i + 1) + " fill", X0 + i * GAP, BOTTOM, TOP, BAR, "Value " + (i + 1));
}
ctl.moveToBeginning();

return { comp: c.name, id: c.id, layers: c.numLayers, bars: N, firstX: X0, spacing: GAP, baseline: BOTTOM, top: TOP, fontWarnings: FONT_WARN.join("; ") };
