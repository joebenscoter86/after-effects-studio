// ZqRE3ho8iP4 card helpers (recipe 01's shape-matte card), loaded after prelude.jsx and art.jsx.
// ExtendScript (ES3). Candidate for the prelude: ZC.ease (a KeyframeEase for any property's dimension count).
var ZC = {};
ZC.ART = "~/Assets/comp-room-studies/channel-study/ZqRE3ho8iP4/proof";
ZC.FPS = 23.976;
ZC.f = function (frames) { return frames / ZC.FPS; };

ZC.comp = function (name, frames, bgHex) {
  var c = P.freshComp(name, 1920, 1080, ZC.FPS, frames / ZC.FPS, [0, 0, 0]);
  var bg = P.solid(c, "Background", ART.hex(bgHex));
  bg.moveToEnd();
  return c;
};

// Number of ease entries a property's setTemporalEaseAtKey wants.
ZC.dims = function (prop) {
  var t = prop.propertyValueType;
  if (t === PropertyValueType.OneD || t === PropertyValueType.TwoD_SPATIAL || t === PropertyValueType.ThreeD_SPATIAL) return 1;
  if (t === PropertyValueType.TwoD) return 2;
  if (t === PropertyValueType.ThreeD) return 3;
  return 1;
};
// inInf / outInf in percent; null leaves that side linear-looking (speed kept, influence 0.1).
ZC.ease = function (prop, k, inInf, outInf) {
  var n = ZC.dims(prop), ie = [], oe = [], i;
  for (i = 0; i < n; i++) {
    ie.push(new KeyframeEase(0, inInf === null ? 0.1 : inInf));
    oe.push(new KeyframeEase(0, outInf === null ? 0.1 : outInf));
  }
  prop.setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
  prop.setTemporalEaseAtKey(k, ie, oe);
};

// A rectangle shape layer: the card's matte. Rect centred on the layer's origin; anchor [0,0]; position = centre.
ZC.matte = function (comp, name, size, round, centre) {
  var l = comp.layers.addShape();
  l.name = name;
  var g = l.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
  g.name = "Rectangle 1";
  var cts = l.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group");
  var r = cts.addProperty("ADBE Vector Shape - Rect");
  r = l.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property(1);
  r.property("ADBE Vector Rect Size").setValue(size);
  r.property("ADBE Vector Rect Roundness").setValue(round);
  var fl = l.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill");
  l.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property(2).property("ADBE Vector Fill Color").setValue([0, 0, 0, 1]);
  P.tf(l, "ADBE Anchor Point").setValue([0, 0]);
  P.tf(l, "ADBE Position").setValue(centre);
  return l;
};

// Footage layer centred at `centre`, scaled, matted to and parented to `matte`.
ZC.photo = function (comp, item, name, scale, centre, matte) {
  var l = comp.layers.add(item);
  l.name = name;
  P.tf(l, "ADBE Scale").setValue([scale, scale]);
  P.tf(l, "ADBE Position").setValue(centre);
  l.moveBefore(matte);
  l.setTrackMatte(matte, TrackMatteType.ALPHA);
  l.parent = matte;
  return l;
};

ZC.textLayer = function (comp, str, font, size, color, just, tracking, leading) {
  var l = comp.layers.addText(str);
  var prop = l.property("ADBE Text Properties").property("ADBE Text Document");
  var d = prop.value;
  d.resetCharStyle();
  d.font = font;
  d.fontSize = size;
  d.fillColor = color;
  d.applyFill = true;
  d.applyStroke = false;
  d.justification = just;
  d.tracking = tracking || 0;
  if (leading) { d.autoLeading = false; d.leading = leading; }
  prop.setValue(d);
  return l;
};

// Recipe 01's magazine card as 02's brief gives it: card 556 x 712 (Roundness 54) centred at `centre`, unrotated.
// o: { tag, photo (FootageItem), lines [l1, l2], pills [a, b], logo (FootageItem) }. Returns { matte, layers[] }.
ZC.coverCard = function (comp, o, centre) {
  var W = 556, H = 712, tl = [centre[0] - W / 2, centre[1] - H / 2];
  var white = [1, 1, 1], made = [];
  var m = ZC.matte(comp, "Matte " + o.tag, [W, H], 54, centre);
  var ph = ZC.photo(comp, o.photo, "Photo " + o.tag, 63.2, centre, m);
  var hd = ZC.textLayer(comp, o.lines[0] + "\r" + o.lines[1], "InterTight-Bold", 89, white, ParagraphJustification.LEFT_JUSTIFY, 0, 84);
  hd.name = "Headline " + o.tag;
  P.tf(hd, "ADBE Anchor Point").setValue([0, 0]);
  P.tf(hd, "ADBE Position").setValue([tl[0] + 39, tl[1] + 502]);
  made.push(hd);
  var x = tl[0] + 39, i, t, r, w, box;
  for (i = 0; i < 2; i++) {
    t = ZC.textLayer(comp, o.pills[i], "InterTight-Medium", 24, white, ParagraphJustification.CENTER_JUSTIFY, 0, 0);
    t.name = "Pill " + (i + 1) + " text " + o.tag;
    r = t.sourceRectAtTime(0, false);
    w = Math.round(r.width + 40);
    P.tf(t, "ADBE Anchor Point").setValue([r.left + r.width / 2, r.top + r.height / 2]);
    P.tf(t, "ADBE Position").setValue([x + w / 2, tl[1] + 612 + 21.5]);
    box = comp.layers.addShape();
    box.name = "Pill " + (i + 1) + " box " + o.tag;
    box.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    box.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Rect");
    box.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property(1).property("ADBE Vector Rect Size").setValue([w, 43]);
    box.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property(1).property("ADBE Vector Rect Roundness").setValue(21.5);
    box.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Stroke");
    box.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property(2).property("ADBE Vector Stroke Color").setValue([1, 1, 1, 1]);
    box.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property(2).property("ADBE Vector Stroke Width").setValue(2);
    P.tf(box, "ADBE Anchor Point").setValue([0, 0]);
    P.tf(box, "ADBE Position").setValue([x + w / 2, tl[1] + 612 + 21.5]);
    made.push(box); made.push(t);
    x += w + 12;
  }
  var lg = comp.layers.add(o.logo);
  lg.name = "Logo " + o.tag;
  P.tf(lg, "ADBE Scale").setValue([24.2, 24.2]);
  P.tf(lg, "ADBE Position").setValue([tl[0] + 39 + 252 * 0.242 / 2, tl[1] + 36 + 163 * 0.242 / 2]);
  made.push(lg);
  for (i = 0; i < made.length; i++) made[i].parent = m;
  made.push(ph);
  return { matte: m, layers: made };
};

// A 3D photo card (07/08/10/11): matte + photo, both 3D, photo matted and parented to the shape.
ZC.card3D = function (comp, tag, item, size, round, scale) {
  var m = ZC.matte(comp, "Matte " + tag, size, round, [960, 540]);
  m.threeDLayer = true;
  P.tf(m, "ADBE Position").setValue([960, 540, 0]);
  var ph = comp.layers.add(item);
  ph.name = "Photo " + tag;
  ph.threeDLayer = true;
  P.tf(ph, "ADBE Scale").setValue([scale, scale, scale]);
  P.tf(ph, "ADBE Position").setValue([960, 540, 0]);
  ph.moveBefore(m);
  ph.setTrackMatte(m, TrackMatteType.ALPHA);
  ph.parent = m;
  return { matte: m, photo: ph };
};
