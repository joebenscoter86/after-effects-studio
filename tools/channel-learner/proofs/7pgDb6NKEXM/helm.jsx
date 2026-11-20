// Shared scene for 03, 04 and 05: the "Meet the crew" ship's wheel with twelve cards (art in PROOF/03/art).
// Loaded after prelude.jsx and art.jsx. ExtendScript (ES3).
// VERIFY: PostScript names AvenirNext-DemiBold, AvenirNext-Regular.
// VERIFY: AVLayer.setTrackMatte(layer, TrackMatteType.ALPHA) (AE 2023+) lets the matte sit below the photo, hidden.
// VERIFY: layer.duplicate() keeps the parent; a duplicated photo's track matte may still point at the old matte (re-set).
var HELM = {};
HELM.W = 1920; HELM.H = 1080; HELM.FPS = 23.976;
HELM.HUB = [974, 1316.5];
HELM.subs = [];

// Card geometry, relative to the hub, for the upright card (brief: 346 x 432, centre 950 px above the hub).
HELM.CW = 346; HELM.CH = 432; HELM.R = 950;
HELM.TOP = -HELM.R - HELM.CH / 2;      // -1166
HELM.TABH = 130;
HELM.TABTOP = -HELM.R + HELM.CH / 2 - HELM.TABH; // -864

HELM.fill = function (sh, color) {
  var f = P.contents(sh).addProperty("ADBE Vector Graphic - Fill");
  P.contents(sh).property(f.propertyIndex).property("ADBE Vector Fill Color").setValue(color);
};
HELM.rect = function (sh, w, h, cx, cy, round) {
  var r = P.contents(sh).addProperty("ADBE Vector Shape - Rect");
  var idx = r.propertyIndex;
  P.contents(sh).property(idx).property("ADBE Vector Rect Size").setValue([w, h]);
  P.contents(sh).property(idx).property("ADBE Vector Rect Position").setValue([cx, cy]);
  P.contents(sh).property(idx).property("ADBE Vector Rect Roundness").setValue(round || 0);
};
// A shape layer whose origin is the hub, so its contents are drawn in hub-relative pixels.
HELM.hubShape = function (comp, name) {
  var sh = P.shape(comp, name);
  P.tf(sh.layer, "ADBE Anchor Point").setValue([0, 0]);
  P.tf(sh.layer, "ADBE Position").setValue(HELM.HUB);
  return sh;
};
HELM.text = function (comp, str, font, size, tracking, color, x, baseline, name) {
  var l = comp.layers.addText(str);
  var prop = l.property("ADBE Text Properties").property("ADBE Text Document");
  var d = prop.value;
  d.resetCharStyle();
  d.font = font;
  d.fontSize = size;
  d.fillColor = color;
  d.applyFill = true;
  d.applyStroke = false;
  d.tracking = tracking;
  d.justification = ParagraphJustification.CENTER_JUSTIFY;
  prop.setValue(d);
  var back = l.property("ADBE Text Properties").property("ADBE Text Document").value;
  var fo = null;
  try { fo = back.fontObject; } catch (e) { fo = null; }
  if (back.font !== font || (fo && fo.isSubstitute)) HELM.subs.push(name + ": asked " + font + ", got " + back.font);
  P.tf(l, "ADBE Anchor Point").setValue([0, 0]);
  P.tf(l, "ADBE Position").setValue([x, baseline]);
  l.name = name;
  return l;
};
HELM.setText = function (layer, str) {
  var prop = layer.property("ADBE Text Properties").property("ADBE Text Document");
  var d = prop.value;
  d.text = str;
  prop.setValue(d);
};
HELM.captions = function (artDir) {
  var f = new File(artDir + "/captions.txt");
  f.encoding = "UTF-8";
  if (!f.open("r")) throw new Error("captions.txt missing");
  var out = [], line;
  while (!f.eof) {
    line = f.readln();
    if (line.length) out.push(line.split("|"));
  }
  f.close();
  return out;
};
HELM.pad = function (i) { return (i < 10 ? "0" : "") + i; };

// Card 1, built upright at the top (recipe step 4). Returns its parts bottom to top.
HELM.card1 = function (comp, artDir, cap) {
  var hx = HELM.HUB[0], hy = HELM.HUB[1];
  var CW = HELM.CW, top = HELM.TOP;
  // backing panel: white 50 %, card size, radius 6, offset 26 up and left
  var bk = HELM.hubShape(comp, "Card 01 Backing");
  HELM.rect(bk, CW, HELM.CH, -26, -HELM.R - 26, 6);
  HELM.fill(bk, [1, 1, 1]);
  P.tf(bk.layer, "ADBE Opacity").setValue(50);
  // photo matte: window 346 x 302, top-right rounded r 30, top-left cut at 45 degrees, 48 px
  var mt = HELM.hubShape(comp, "Card 01 Photo Matte");
  var L = -CW / 2, Rr = CW / 2, T = top, B = HELM.TABTOP, k = 30 * 0.5523;
  P.path(mt,
    [[L + 48, T], [Rr - 30, T], [Rr, T + 30], [Rr, B], [L, B], [L, T + 48]],
    [[0, 0], [0, 0], [0, -k], [0, 0], [0, 0], [0, 0]],
    [[0, 0], [k, 0], [0, 0], [0, 0], [0, 0], [0, 0]], true);
  HELM.fill(mt, [1, 1, 1]);
  // photo: scale 39.3 % so it is the window's width; its top 20 px above the window's top
  var ph = comp.layers.add(ART.footage(artDir, "portrait-01.png", "art 03"));
  ph.name = "Card 01 Photo";
  var s = 100 * CW / ph.source.width;
  P.tf(ph, "ADBE Scale").setValue([s, s]);
  P.tf(ph, "ADBE Position").setValue([hx, hy + top - 20 + ph.source.height * s / 200]);
  ph.setTrackMatte(mt.layer, TrackMatteType.ALPHA);
  mt.layer.enabled = false;
  // white tab, the master. Stacked under the rule and text: the brief's order puts it on top, which hides the caption.
  var tb = HELM.hubShape(comp, "Card 01 Tab");
  HELM.rect(tb, CW, HELM.TABH, 0, HELM.TABTOP + HELM.TABH / 2, 0);
  HELM.fill(tb, [1, 1, 1]);
  // rule, name, role on the tab
  var tabTopY = hy + HELM.TABTOP;
  var ru = HELM.hubShape(comp, "Card 01 Rule");
  HELM.rect(ru, 32, 3, 0, HELM.TABTOP + 28, 0);
  HELM.fill(ru, ART.hex("#B8893E"));
  var nm = HELM.text(comp, cap[0], "AvenirNext-DemiBold", 29, 0, ART.hex("#1C2738"), hx, tabTopY + 70, "Card 01 Name");
  var ro = HELM.text(comp, cap[1].toUpperCase(), "AvenirNext-Regular", 17, 40, ART.hex("#5A6878"), hx, tabTopY + 100, "Card 01 Role");
  return { backing: bk.layer, matte: mt.layer, photo: ph, rule: ru.layer, name: nm, role: ro, tab: tb.layer };
};

HELM.build = function (compName, dur, artDir) {
  var comp = P.freshComp(compName, HELM.W, HELM.H, HELM.FPS, dur, ART.hex("#EDF2F1"));
  comp.time = 0;
  var ground = P.solid(comp, "Ground", ART.hex("#EDF2F1"));
  var wheel = comp.layers.add(ART.footage(artDir, "wheel.png", "art 03"));
  wheel.name = "Wheel";
  P.tf(wheel, "ADBE Anchor Point").setValue([3293.5, 3295.9]);
  P.tf(wheel, "ADBE Position").setValue(HELM.HUB);
  P.tf(wheel, "ADBE Scale").setValue([33.4, 33.4]);
  P.tf(wheel, "ADBE Rotate Z").expression = "time*-20";
  var caps = HELM.captions(artDir);
  var c1 = HELM.card1(comp, artDir, caps[0]);
  // parent every part of card 1 to its tab (step 4)
  var order = ["backing", "matte", "photo", "rule", "name", "role"];
  var j;
  for (j = 0; j < order.length; j++) c1[order[j]].parent = c1.tab;
  var cards = [c1];
  // SUBSTITUTE: Edit > Duplicate and the +30 degree rotation are done by script, card by card (steps 6-7).
  var i, prev, nc, parts, k;
  var all = ["backing", "matte", "photo", "tab", "rule", "name", "role"];
  for (i = 2; i <= 12; i++) {
    prev = cards[0];
    nc = {};
    for (k = 0; k < all.length; k++) {
      nc[all[k]] = prev[all[k]].duplicate();
      nc[all[k]].name = prev[all[k]].name.replace("Card 01", "Card " + HELM.pad(i));
    }
    for (k = 0; k < all.length; k++) nc[all[k]].moveToBeginning();
    for (k = 0; k < order.length; k++) nc[order[k]].parent = nc.tab;
    nc.photo.replaceSource(ART.footage(artDir, "portrait-" + HELM.pad(i) + ".png", "art 03"), false);
    nc.photo.setTrackMatte(nc.matte, TrackMatteType.ALPHA);
    nc.matte.enabled = false;
    HELM.setText(nc.name, caps[i - 1][0]);
    HELM.setText(nc.role, caps[i - 1][1].toUpperCase());
    P.tf(nc.tab, "ADBE Rotate Z").setValue(30 * (i - 1));
    cards.push(nc);
  }
  // step 8: masters to the wheel, at time 0 where the wheel's rotation is 0
  for (i = 0; i < cards.length; i++) cards[i].tab.parent = wheel;
  return { comp: comp, ground: ground, wheel: wheel, cards: cards };
};
