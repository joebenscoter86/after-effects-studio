// Shared scene for 01 and 02: "THE LONG NOON" card (art from PROOF/01/art) and the window-light shadow solid.
// Loaded after prelude.jsx and art.jsx. ExtendScript (ES3).
// VERIFY: TextDocument.fontObject.isSubstitute exists in this AE version (guarded).
// VERIFY: PostScript names InstrumentSerif-Regular, InstrumentSerif-Italic, SpaceGrotesk-Light, Jost-Regular.
var SC = {};
SC.W = 1920; SC.H = 1080; SC.FPS = 23.976;
SC.INK = [0x12 / 255, 0x12 / 255, 0x14 / 255];
SC.subs = [];

// Point text with its origin on the baseline centre (centre-justified), so pos = [x, baseline].
SC.text = function (comp, str, font, size, tracking, x, baseline, name) {
  var l = comp.layers.addText(str);
  var prop = l.property("ADBE Text Properties").property("ADBE Text Document");
  var d = prop.value;
  d.resetCharStyle();
  d.font = font;
  d.fontSize = size;
  d.fillColor = SC.INK;
  d.applyFill = true;
  d.applyStroke = false;
  d.tracking = tracking;
  d.justification = ParagraphJustification.CENTER_JUSTIFY;
  prop.setValue(d);
  var back = l.property("ADBE Text Properties").property("ADBE Text Document").value;
  var fo = null;
  try { fo = back.fontObject; } catch (e) { fo = null; }
  if (back.font !== font || (fo && fo.isSubstitute)) SC.subs.push(name + ": asked " + font + ", got " + back.font + (fo && fo.isSubstitute ? " (substitute)" : ""));
  P.tf(l, "ADBE Anchor Point").setValue([0, 0]);
  P.tf(l, "ADBE Position").setValue([x, baseline]);
  l.name = name;
  return l;
};

// The flat card as one precomp, built bottom to top as the brief orders it.
SC.card = function (name, dur, artDir, animateTitle) {
  var W = SC.W, H = SC.H;
  var c = P.freshComp(name, W, H, SC.FPS, dur, [0.98, 0.976, 0.96]);
  var paper = c.layers.add(ART.footage(artDir, "paper.png", "art 01"));
  paper.name = "Paper";
  var br = c.layers.add(ART.footage(artDir, "lemon-branch.png", "art 01"));
  br.name = "Lemon Branch";
  P.tf(br, "ADBE Scale").setValue([42, 42]);
  P.tf(br, "ADBE Position").setValue([0.858 * W, 0.770 * H]);
  br.moveBefore(paper);
  // Date seal
  var seal = P.shape(c, "Date seal ring");
  P.ellipse(seal, [218, 162]);
  P.stroke(seal, [SC.INK[0], SC.INK[1], SC.INK[2], 1], 3);
  P.tf(seal.layer, "ADBE Position").setValue([0.085 * W, 0.13 * H]);
  var sx = 0.085 * W;
  SC.text(c, "14", "InstrumentSerif-Regular", 81, 0, sx, 0.142 * H + 12, "Seal 14");
  SC.text(c, "JULY", "SpaceGrotesk-Light", 22, 180, sx, 0.182 * H, "Seal JULY");
  SC.text(c, "PROGRAMME Nº 04", "SpaceGrotesk-Light", 21, 240, 0.88 * W, 0.105 * H, "Top right 1");
  SC.text(c, "SUMMER SERIES", "SpaceGrotesk-Light", 21, 240, 0.88 * W, 0.14 * H, "Top right 2");
  SC.text(c, "A FILM IN SIX AFTERNOONS", "SpaceGrotesk-Light", 26, 500, 0.5 * W, 0.36 * H, "Kicker");
  var t = SC.text(c, "THE LONG NOON", "InstrumentSerif-Regular", 221, 25, 0.5 * W, 0.575 * H, "Title");
  SC.text(c, "in cinemas this summer", "InstrumentSerif-Italic", 56, 0, 0.5 * W, 0.675 * H, "Italic line");
  SC.text(c, "WRITTEN AND DIRECTED BY THE NOON COLLECTIVE", "SpaceGrotesk-Light", 18, 275, 0.5 * W, 0.915 * H, "Credit");
  if (animateTitle) {
    // Per-character opacity fade, left to right, starting with the shadow (brief for 02).
    var anims = t.property("ADBE Text Properties").property("ADBE Text Animators");
    anims.addProperty("ADBE Text Animator");
    var a = t.property("ADBE Text Properties").property("ADBE Text Animators").property(1);
    a.name = "Title fade";
    a.property("ADBE Text Animator Properties").addProperty("ADBE Text Opacity");
    t.property("ADBE Text Properties").property("ADBE Text Animators").property(1).property("ADBE Text Animator Properties").property("ADBE Text Opacity").setValue(0);
    t.property("ADBE Text Properties").property("ADBE Text Animators").property(1).property("ADBE Text Selectors").addProperty("ADBE Text Selector");
    var sel = t.property("ADBE Text Properties").property("ADBE Text Animators").property(1).property("ADBE Text Selectors").property(1);
    var st = sel.property("ADBE Text Percent Start");
    st.setValueAtTime(0, 0);
    st.setValueAtTime(animateTitle, 100);
  }
  return c;
};

SC.mask = function (layer, verts, name) {
  layer.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
  var m = layer.property("ADBE Mask Parade").property(layer.property("ADBE Mask Parade").numProperties);
  var s = new Shape();
  s.vertices = verts;
  s.closed = true;
  m.property("ADBE Mask Shape").setValue(s);
  m.maskMode = MaskMode.ADD;
  m.inverted = false;
  m.property("ADBE Mask Feather").setValue([42, 42]);
  m.name = name;
  return m;
};

// A window bar: a thin parallelogram centred on c, its long side at right angles to strips at `deg` below horizontal.
SC.bar = function (cx, cy, halfLen, halfThick, deg) {
  var a = deg * Math.PI / 180;
  var v = [Math.cos(a), Math.sin(a)];       // along the strips
  var u = [Math.sin(a), -Math.cos(a)];      // across the strips
  return [
    [cx + u[0] * halfLen - v[0] * halfThick, cy + u[1] * halfLen - v[1] * halfThick],
    [cx + u[0] * halfLen + v[0] * halfThick, cy + u[1] * halfLen + v[1] * halfThick],
    [cx - u[0] * halfLen + v[0] * halfThick, cy - u[1] * halfLen + v[1] * halfThick],
    [cx - u[0] * halfLen - v[0] * halfThick, cy - u[1] * halfLen - v[1] * halfThick]
  ];
};

// The technique (recipe 01): comp-size grey solid, five Add masks feathered 42, Multiply, Fill 139 grey.
// Edge lines solved from the recipe's band figures along the picture edges (build, f004061):
//   lower strip A: upper edge (0,259)->(1363,1080), lower edge (0,497)->(806,1080)
//   upper strip B: lower-left edge (154,0)->(1555,1080), upper-right edge (461,0)->(1920,875)
//   corner shape: below edge (730,0)->(1920,702)
SC.shadow = function (comp, name) {
  var s = P.solid(comp, name, [0.5, 0.5, 0.5]);
  SC.mask(s, [[-200, 259 - 200 * 0.6024], [1800, 259 + 1800 * 0.6024], [1800, 497 + 1800 * 0.7234], [-200, 497 - 200 * 0.7234]], "strip A");
  SC.mask(s, SC.bar(430, 365, 170, 16, 34), "window bar 1");
  SC.mask(s, [[154 - 150 / 0.7709, -150], [461 - 150 / 0.5998, -150], [2200, 0.5998 * (2200 - 461)], [2200, 0.7709 * (2200 - 154)]], "strip B");
  SC.mask(s, SC.bar(820, 633, 170, 16, 34), "window bar 2");
  SC.mask(s, [[730 - 100 / 0.5899, -100], [2200, -100], [2200, 0.5899 * (2200 - 730)]], "corner");
  s.blendingMode = BlendingMode.MULTIPLY;
  var f = P.effect(s, "ADBE Fill");
  var miss = ART.setFx(f, { "Color": [139 / 255, 139 / 255, 139 / 255], "Opacity": 1 });
  if (miss.length) throw new Error("Fill params not found: " + miss.join(", "));
  return s;
};
