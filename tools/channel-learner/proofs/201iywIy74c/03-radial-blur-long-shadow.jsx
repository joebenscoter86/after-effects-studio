// Technique 3: long soft shadow from a blacked-out duplicate + CC Radial Fast Blur, on card.png art.
// Shadow lives in a comp-sized precomp so the blur is not clipped to the card's bounds (Center then reads comp px).
$.evalFile(args.prelude);
var ART = "~/Assets/comp-room-studies/channel-study/201iywIy74c/proof/03/art/card.png";
var folder = null, i, it, footage = null;
for (i = 1; i <= app.project.numItems; i++) { it = app.project.item(i); if (it instanceof FolderItem && it.name === "art 03") folder = it; }
if (!folder) folder = app.project.items.addFolder("art 03");
for (i = 1; i <= app.project.numItems; i++) { it = app.project.item(i); if (it instanceof FootageItem && it.name === "card.png" && it.parentFolder === folder) footage = it; }
if (!footage) { footage = app.project.importFile(new ImportOptions(new File(ART))); footage.parentFolder = folder; }

for (i = app.project.numItems; i >= 1; i--) { it = app.project.item(i); if (it instanceof CompItem && it.name === "03 shadow src") it.remove(); }
var c = P.freshComp("03 radial blur long shadow", 1080, 1920, 29.97, 4, [0.99, 0.99, 0.99]);
var src = app.project.items.addComp("03 shadow src", 1080, 1920, 1, 4, 29.97);
src.parentFolder = folder;

var S = 700 / 1344 * 100, POS = [540, 880];
function roundedMask(layer) {
  var w = 1344, h = 752, r = 54, k = r * 0.5523, x0 = 0, y0 = 0, x1 = w, y1 = h;
  var s = new Shape();
  s.vertices = [[x0 + r, y0], [x1 - r, y0], [x1, y0 + r], [x1, y1 - r], [x1 - r, y1], [x0 + r, y1], [x0, y1 - r], [x0, y0 + r]];
  s.inTangents = [[-k, 0], [0, 0], [0, -k], [0, 0], [k, 0], [0, 0], [0, k], [0, 0]];
  s.outTangents = [[0, 0], [k, 0], [0, 0], [0, k], [0, 0], [-k, 0], [0, 0], [0, -k]];
  s.closed = true;
  var m = layer.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
  layer.property("ADBE Mask Parade").property(m.propertyIndex).property("ADBE Mask Shape").setValue(s);
}
function place(comp, name) {
  var l = comp.layers.add(footage);
  l.name = name;
  P.tf(l, "ADBE Anchor Point").setValue([672, 376]);
  P.tf(l, "ADBE Position").setValue(POS);
  P.tf(l, "ADBE Scale").setValue([S, S]);
  roundedMask(l);
  return l;
}
place(src, "Card silhouette");

var ground = P.solid(c, "Ground", [253 / 255, 253 / 255, 253 / 255], 1080, 1920);
var shadow = c.layers.add(src);
shadow.name = "TECH Shadow";
shadow.moveBefore(ground); // above Ground (layers.add puts it on top; moveAfter(ground) buried it)
var card = place(c, "Card");
card.moveToBeginning();

var fill = P.effect(shadow, "ADBE Fill");
fill.property("Color").setValue([0, 0, 0, 1]);
fill.property("Opacity").setValue(1); // Fill Opacity reads 0..1
// Recipe offset (-522,-381) on a card ~614 wide at 1920 -> x1.14 for the 700 px card, from card centre (540,880).
var blur = P.effect(shadow, "CC Radial Fast Blur");
blur.property("Center").setValue([-55, 446]);
blur.property("Amount").setValue(85);
blur.property("Zoom").setValue(1);
P.tf(shadow, "ADBE Opacity").setValue(35);
return { comp: c.name, id: c.id, layers: c.numLayers, zoomItems: blur.property("Zoom").propertyValueType };
