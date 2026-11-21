// SKU3QdqKLOs technique 01: a counter driven by one slider on a control null.
// A null "Controls" carries a Slider Control named "Value 1", keyed 0 at 0:00 to 83 at 3:00, linear.
// The counter's Source Text expression rounds the slider and adds a "%" suffix. The counter is left-aligned:
// its left edge holds still and the figure grows to the right as digits are added. Portrait 1080 x 1920 for a phone.
//
// VERIFY: font PostScript names "Montserrat-Black" (counter), "Oswald-SemiBold" (heading), "Montserrat-Regular" (paragraph) are installed; the script reports any substitute
// VERIFY: TextDocument.fontObject.isSubstitute exists in this After Effects (read guarded; absent means unchecked)
// VERIFY: match names ADBE Slider Control and ADBE Slider Control-0001 (recipe build notes)
// VERIFY: setting the effect's .name to "Value 1" renames it so effect("Value 1") resolves in the expression
// VERIFY: sourceRectAtTime on the static "83%" placeholder gives the same bounds the expression's "83%" renders at 3:00
// VERIFY: ParagraphJustification.LEFT_JUSTIFY keeps the left edge fixed while the expression changes the text
//
// args.prelude (required). Optional: args.font, args.headFont, args.bodyFont, args.end (end figure, default 83).
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

// ---- build ----
var W = 1080, H = 1920, FPS = 24, DUR = 5;
var END = args.end || 83;
var GROUND = [26 / 255, 26 / 255, 32 / 255]; // measured, flat corner to corner
var c = P.freshComp("SKU3 01 counter", W, H, FPS, DUR, GROUND);
bgSolid(c, "SKU3 01 background", GROUND);

// Stand-in dressing (the example comp's heading and paragraph), stacked under the counter instead of beside it.
// ASSUMED: heading two lines of condensed caps at 44 px, pale blue-white; paragraph three lines at 30 px, grey.
txt(c, "MARKET SHARE\rTHIS QUARTER", { size: 44, color: [0.86, 0.9, 1], font: args.headFont || "Oswald-SemiBold", tracking: 40, just: "C", pos: [W / 2, 1000], name: "heading" });
txt(c, "Placeholder copy for the stat.\rA short paragraph sits under\rthe heading in three lines.", { size: 30, color: [0.6, 0.6, 0.66], font: args.bodyFont || "Montserrat-Regular", just: "C", pos: [W / 2, 1125], name: "paragraph" });

// Counter: Montserrat Black 111 px, white, left-aligned. Placed with the landed figure's bounds so the
// finished "83%" is centred across the frame; every value starts from the same left edge.
var CY = 840;
var counter = txt(c, END + "%", { size: 111, color: [1, 1, 1], font: args.font || "Montserrat-Black", just: "L", pos: [0, CY], name: "counter" });
var rr = counter.sourceRectAtTime(0, false);
P.tf(counter, "ADBE Position").setValue([W / 2 - rr.width / 2, CY]);

// The rig is made before any expression names it (an expression set on a missing layer errors).
var ctl = rig(c, END, "linear");
counter.property("ADBE Text Properties").property("ADBE Text Document").expression = "Math.round(" + SLIDER + ') + "%"';

return { comp: c.name, id: c.id, layers: c.numLayers, counterLeft: W / 2 - rr.width / 2, landedWidth: rr.width, fontWarnings: FONT_WARN.join("; ") };
