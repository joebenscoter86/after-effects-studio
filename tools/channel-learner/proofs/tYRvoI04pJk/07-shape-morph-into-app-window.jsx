// Technique 07: four buttons slide together, a white card replaces them in one frame, the card grows into an app window.
// Art build (second): icons on the buttons, pastel banner and title on the card. Earlier script: 07-...-first.jsx
// VERIFY: match names for Rect Size / Roundness / Fill / Stroke; setTemporalEaseAtKey counts; parent keeps values;
// VERIFY: adjustmentLayer on a solid; Roundness clamp; inPoint on solids and shape layers; fonts present.
$.evalFile(args.prelude);

var ART = args.art; // folder holding the art files
var FPS = 24;
var T_REST = 0.6;
var T_SWAP = T_REST + 14 / FPS;
var T_END = 3.2;
var c = P.freshComp("07 shape morph into app window", 1080, 1920, FPS, 5, [14 / 255, 15 / 255, 20 / 255]);

function ease(prop, k, inf, outf) {
  var n = 1;
  if (!prop.isSpatial) {
    var v = prop.value;
    n = (v instanceof Array) ? v.length : 1;
  }
  var a = [], b = [], i;
  for (i = 0; i < n; i++) { a.push(new KeyframeEase(0, inf)); b.push(new KeyframeEase(0, outf)); }
  prop.setTemporalEaseAtKey(k, a, b);
}

function pickFont(list) {
  var i, f;
  for (i = 0; i < list.length; i++) {
    try { f = app.fonts.getFontsByPostScriptName(list[i]); if (f && f.length) return list[i]; } catch (e) {}
  }
  return null;
}
var F_SEMI = pickFont(["Inter-SemiBold", "Inter-Semibold", "InterTight-SemiBold", "HelveticaNeue-Medium"]);
var F_BOLD = pickFont(["Inter-Bold", "InterTight-Bold", "Inter-ExtraBold", "HelveticaNeue-Bold"]);

function roundRect(name, size, round, fill, strokeCol, strokeW) {
  var sh = P.shape(c, name);
  var cont = P.contents(sh);
  var r = cont.addProperty("ADBE Vector Shape - Rect");
  var ri = r.propertyIndex;
  cont.property(ri).property("ADBE Vector Rect Size").setValue(size);
  cont.property(ri).property("ADBE Vector Rect Roundness").setValue(round);
  var f = cont.addProperty("ADBE Vector Graphic - Fill");
  var fi = f.propertyIndex;
  cont.property(fi).property("ADBE Vector Fill Color").setValue(fill);
  if (strokeCol) P.stroke(sh, strokeCol, strokeW);
  return sh.layer;
}

// Art import into folder "art 07"
var folder = null, k, it;
for (k = 1; k <= app.project.numItems; k++) { it = app.project.item(k); if (it instanceof FolderItem && it.name === "art 07") folder = it; }
if (!folder) folder = app.project.items.addFolder("art 07");
function imp(fn) {
  var i2, e;
  for (i2 = 1; i2 <= app.project.numItems; i2++) {
    e = app.project.item(i2);
    if (e instanceof FootageItem && e.name === fn && e.parentFolder === folder) return e;
  }
  e = app.project.importFile(new ImportOptions(new File(ART + "/" + fn)));
  e.parentFolder = folder;
  return e;
}
var iconFiles = ["icon-note.png", "icon-calendar.png", "icon-tasks.png", "icon-saved.png"];
var iconNames = ["icon note", "icon calendar", "icon tasks", "icon saved"];
var bannerItem = imp("banner.png");
var iconItems = [], i, b, t, pos, p, ic;
for (i = 0; i < 4; i++) iconItems.push(imp(iconFiles[i]));

var dark = P.solid(c, "near-black ground", [14 / 255, 15 / 255, 20 / 255]);

var null1 = c.layers.addNull();
null1.name = "Null 1 (original)";
var null2 = c.layers.addNull();
null2.name = "Null 2 (scaler)";
P.tf(null1, "ADBE Anchor Point").setValue([0, 0]);
P.tf(null1, "ADBE Position").setValue([0, 0]);
P.tf(null2, "ADBE Anchor Point").setValue([0, 0]);
P.tf(null2, "ADBE Position").setValue([540, 960]);
null1.parent = null2;
// Setting .parent compensates the child's local values to keep its comp position: reset them after parenting.
P.tf(null1, "ADBE Position").setValue([0, 0]);

var names = ["Notes", "Calendar", "Tasks", "Saved"];
var BW = 320, BH = 200;
var rest = [[-190, -125], [190, -125], [-190, 125], [190, 125]];
var touch = [[-160, -100], [160, -100], [-160, 100], [160, 100]];
var buttons = [];
for (i = 0; i < 4; i++) {
  b = roundRect("button " + names[i], [BW, BH], 40, [42 / 255, 42 / 255, 92 / 255, 1], null, 0);
  b.parent = null1;
  P.tf(b, "ADBE Anchor Point").setValue([0, 0]);
  pos = P.tf(b, "ADBE Position");
  pos.setValueAtTime(T_REST, rest[i]);
  pos.setValueAtTime(T_SWAP, touch[i]);
  p = P.tf(b, "ADBE Position");
  ease(p, 1, 80, 80);
  ease(p, 2, 12, 12);
  buttons.push(b);
}
// labels and icons (children of their buttons); added after buttons so they sit above them
for (i = 0; i < 4; i++) {
  t = P.text(c, names[i], { size: 42, color: [245 / 255, 245 / 255, 250 / 255], font: F_SEMI, name: "label " + names[i] });
  t.parent = buttons[i];
  P.tf(t, "ADBE Position").setValue([0, 66]);
  ic = c.layers.add(iconItems[i]);
  ic.name = iconNames[i];
  P.tf(ic, "ADBE Anchor Point").setValue([512, 512]);
  ic.parent = buttons[i];
  P.tf(ic, "ADBE Position").setValue([0, -26]);
  P.tf(ic, "ADBE Scale").setValue([100 * 122 / 1024, 100 * 122 / 1024]); // 38% of button width
}

var adj = P.solid(c, "adjustment layer", [1, 1, 1]);
adj.adjustmentLayer = true;

var pale = P.solid(c, "white solid", [244 / 255, 244 / 255, 244 / 255]);
pale.inPoint = T_SWAP;

// Card: final on screen 920 x 1160 = size * 0.72 * null scale 3
var SW0 = 944, SH0 = 620, SW1 = 920 / 2.16, SH1 = 1160 / 2.16;
var card = roundRect("card", [SW0, SH0], 147, [252 / 255, 252 / 255, 252 / 255, 1], [200 / 255, 200 / 255, 200 / 255, 1], 1.7); // 1.7 x 2.16 = ~3.7 px rendered
card.parent = null1;
P.tf(card, "ADBE Anchor Point").setValue([0, 0]);
P.tf(card, "ADBE Position").setValue([0, 0]);
P.tf(card, "ADBE Scale").setValue([72, 72]);
var cont = P.contents({ layer: card });
var rr = cont.property("ADBE Vector Shape - Rect");
rr.property("ADBE Vector Rect Size").setValueAtTime(T_SWAP, [SW0, SH0]);
rr.property("ADBE Vector Rect Size").setValueAtTime(T_END, [SW1, SH1]);
rr = P.contents({ layer: card }).property("ADBE Vector Shape - Rect");
rr.property("ADBE Vector Rect Roundness").setValueAtTime(T_SWAP, 147);
rr.property("ADBE Vector Rect Roundness").setValueAtTime(T_END, 18); // review: radius ~4.3% of card width (~40 px on the 922 px card)
rr = P.contents({ layer: card }).property("ADBE Vector Shape - Rect");
ease(rr.property("ADBE Vector Rect Size"), 1, 75, 75);
ease(rr.property("ADBE Vector Rect Size"), 2, 75, 75);
ease(rr.property("ADBE Vector Rect Roundness"), 1, 75, 75);
ease(rr.property("ADBE Vector Rect Roundness"), 2, 75, 75);
card.inPoint = T_SWAP;

// Banner: child of null1 (so it scales with the card); keyed scale/position so it hugs the card top as the card grows
var ban = c.layers.add(bannerItem);
ban.name = "card banner";
ban.parent = null1;
P.tf(ban, "ADBE Anchor Point").setValue([512, 344]);
var halfW0 = SW0 * 0.72 / 2, halfH0 = SH0 * 0.72 / 2;          // card half size in null space at the swap
var halfW1 = SW1 * 0.72 / 2, halfH1 = SH1 * 0.72 / 2;          // at the end
var bw0 = halfW0 * 2 * 0.92, bw1 = halfW1 * 2 * 0.92;          // inset 4% each side
var by0 = -halfH0 + halfW0 * 2 * 0.04 + bw0 * 688 / 1024 / 2;   // centre y
var by1 = -halfH1 + halfW1 * 2 * 0.04 + bw1 * 688 / 1024 / 2;
var bs = P.tf(ban, "ADBE Scale"), bp = P.tf(ban, "ADBE Position");
bs.setValueAtTime(T_SWAP, [bw0 / 10.24, bw0 / 10.24]); bs.setValueAtTime(T_END, [bw1 / 10.24, bw1 / 10.24]);
bp.setValueAtTime(T_SWAP, [0, by0]); bp.setValueAtTime(T_END, [0, by1]);
bs = P.tf(ban, "ADBE Scale"); bp = P.tf(ban, "ADBE Position");
ease(bs, 1, 75, 75); ease(bs, 2, 75, 75); ease(bp, 1, 75, 75); ease(bp, 2, 75, 75);
var bo = P.tf(ban, "ADBE Opacity");
bo.setValueAtTime(T_SWAP + 0.3, 0); bo.setValueAtTime(T_SWAP + 0.9, 100);
// rounded-rect mask (radius ~ card corner on screen, in banner layer space)
var mk = ban.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
var mkp = ban.property("ADBE Mask Parade").property(mk.propertyIndex).property("ADBE Mask Shape");
var R = 34, W = 1024, H = 688, kk = R * 0.5523;
var sh = new Shape();
sh.vertices = [[R, 0], [W - R, 0], [W, R], [W, H - R], [W - R, H], [R, H], [0, H - R], [0, R]];
sh.inTangents = [[-kk, 0], [0, 0], [0, -kk], [0, 0], [kk, 0], [0, 0], [0, kk], [0, 0]];
sh.outTangents = [[0, 0], [kk, 0], [0, 0], [0, kk], [0, 0], [-kk, 0], [0, 0], [0, -kk]];
sh.closed = true;
mkp.setValue(sh);

// Title "Notes" under the banner, left aligned to the banner edge
var title = P.text(c, "Notes", { size: 58, color: [27 / 255, 27 / 255, 47 / 255], font: F_BOLD, name: "card title" });
var td = title.property("ADBE Text Properties").property("ADBE Text Document");
var tv = td.value; tv.justification = ParagraphJustification.LEFT_JUSTIFY; td.setValue(tv);
title.parent = null1;
var tr = title.sourceRectAtTime(0, false);
P.tf(title, "ADBE Anchor Point").setValue([tr.left, tr.top + tr.height / 2]);
P.tf(title, "ADBE Scale").setValue([100 / 3, 100 / 3]);          // 58 px on screen at null scale 300%
var tp = P.tf(title, "ADBE Position");
tp.setValueAtTime(T_SWAP, [-bw0 / 2, by0 + bw0 * 688 / 1024 / 2 + 30]);
tp.setValueAtTime(T_END, [-bw1 / 2, by1 + bw1 * 688 / 1024 / 2 + 22]);
tp = P.tf(title, "ADBE Position");
ease(tp, 1, 75, 75); ease(tp, 2, 75, 75);
var to = P.tf(title, "ADBE Opacity");
to.setValueAtTime(T_END - 0.9, 0); to.setValueAtTime(T_END - 0.2, 100);
title.inPoint = T_SWAP;
ban.inPoint = T_SWAP;

// Null 2: Scale 100 -> 300, Position 540,960 -> 540,950
var s2 = P.tf(null2, "ADBE Scale");
s2.setValueAtTime(T_SWAP, [100, 100]);
s2.setValueAtTime(T_END, [300, 300]);
var p2 = P.tf(null2, "ADBE Position");
p2.setValueAtTime(T_SWAP, [540, 960]);
p2.setValueAtTime(T_END, [540, 950]);
s2 = P.tf(null2, "ADBE Scale");
p2 = P.tf(null2, "ADBE Position");
ease(s2, 1, 75, 75); ease(s2, 2, 75, 75);
ease(p2, 1, 75, 75); ease(p2, 2, 75, 75);

// Final order: banner, title, card, pale, adjustment, icons/labels, buttons, ground
adj.moveToBeginning();
pale.moveToBeginning();
card.moveToBeginning();
title.moveToBeginning();
ban.moveToBeginning();
null1.enabled = false; null2.enabled = false;

return { comp: c.name, id: c.id, layers: c.numLayers, swap: T_SWAP, fonts: [F_SEMI, F_BOLD] };
