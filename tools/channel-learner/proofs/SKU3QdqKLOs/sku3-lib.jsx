// Shared helpers for the SKU3QdqKLOs art builds (loaded after prelude.jsx and art.jsx). ExtendScript (ES3).
// The helpers the five author-pass scripts each repeated (fontCheck, txt, rig, slider) plus the shared backdrop.
var FONT_WARN = [];
function fontCheck(layer) {
  var d = layer.property("ADBE Text Properties").property("ADBE Text Document").value;
  if (d.fontObject && d.fontObject.isSubstitute) FONT_WARN.push(layer.name + ": " + d.font + " is a substitute");
}
// Text placed by its ink box. o: size, color, font, tracking, leading, caps, just ("L" | "C" | "R"),
// x (left edge for L, centre for C, right edge for R), top (ink top), cy (ink vertical centre) or bottom (ink bottom), name.
function txt(c, str, o) {
  var l = c.layers.addText(str);
  var prop = l.property("ADBE Text Properties").property("ADBE Text Document");
  var d = prop.value;
  d.resetCharStyle();
  d.resetParagraphStyle();
  d.fontSize = o.size;
  d.fillColor = o.color;
  d.applyFill = true;
  d.applyStroke = false;
  if (o.font) d.font = o.font;
  if (o.tracking !== undefined) d.tracking = o.tracking;
  if (o.leading) { d.autoLeading = false; d.leading = o.leading; }
  d.justification = o.just === "L" ? ParagraphJustification.LEFT_JUSTIFY : (o.just === "R" ? ParagraphJustification.RIGHT_JUSTIFY : ParagraphJustification.CENTER_JUSTIFY);
  prop.setValue(d);
  if (o.name) l.name = o.name;
  var r = l.sourceRectAtTime(0, false);
  var ax = o.just === "L" ? r.left : (o.just === "R" ? r.left + r.width : r.left + r.width / 2);
  var ay = o.cy !== undefined ? r.top + r.height / 2 : (o.bottom !== undefined ? r.top + r.height : r.top);
  P.tf(l, "ADBE Anchor Point").setValue([ax, ay]);
  P.tf(l, "ADBE Position").setValue([o.x, o.cy !== undefined ? o.cy : (o.bottom !== undefined ? o.bottom : o.top)]);
  fontCheck(l);
  return l;
}
function ease(s, infl) {
  var k;
  for (k = 1; k <= s.numKeys; k++) {
    if (infl === "linear") {
      s.setInterpolationTypeAtKey(k, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
    } else {
      s.setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
      s.setTemporalEaseAtKey(k, [new KeyframeEase(0, infl)], [new KeyframeEase(0, infl)]);
    }
  }
}
// A Slider Control named `name` on null `n`, keyed 0 at t0 to `end` at t1.
function slider(n, name, end, t0, t1, infl) {
  var fx = P.effect(n, "ADBE Slider Control");
  fx.name = name;
  var s = n.property("ADBE Effect Parade").property(name).property("ADBE Slider Control-0001");
  s.setValueAtTime(t0, 0);
  s.setValueAtTime(t1, end);
  ease(s, infl);
  return s;
}
// The value rig: null "Controls" with Slider "Value 1", 0 at 0:00 to `end` at 3:00 (24 fps: 3.0 s).
function rig(c, end, infl) {
  var n = c.layers.addNull();
  n.name = "Controls";
  slider(n, "Value 1", end, 0, 3, infl);
  return n;
}
function sliderRef(name) { return 'thisComp.layer("Controls").effect("' + name + '")("Slider")'; }
var SLIDER = sliderRef("Value 1");
// The shared studio plate, full frame at the bottom of the stack.
function backdrop(c, dir, folder) {
  var l = c.layers.add(ART.footage(dir, "backdrop.png", folder));
  l.name = "Backdrop";
  P.tf(l, "ADBE Position").setValue([540, 960]);
  l.moveToEnd();
  return l;
}
// A filled rectangle shape layer covering x0..x1, y0..y1 in comp pixels.
function rect(c, name, x0, y0, x1, y1, color) {
  var sh = P.shape(c, name);
  var r = P.contents(sh).addProperty("ADBE Vector Shape - Rect");
  P.contents(sh).property(r.propertyIndex).property("ADBE Vector Rect Size").setValue([x1 - x0, y1 - y0]);
  var f = P.contents(sh).addProperty("ADBE Vector Graphic - Fill");
  P.contents(sh).property(f.propertyIndex).property("ADBE Vector Fill Color").setValue(color);
  P.tf(sh.layer, "ADBE Position").setValue([(x0 + x1) / 2, (y0 + y1) / 2]);
  return sh.layer;
}
