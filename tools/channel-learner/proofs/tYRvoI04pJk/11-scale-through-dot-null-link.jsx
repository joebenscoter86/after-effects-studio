// Technique 11: grow an orb out of a small dot through a chain of linked nulls. (art build: orb.png + window-plate.png)
// VERIFY: setTemporalEaseAtKey on Scale needs an array of 3 KeyframeEase; on Position (2D) I pass 1 -- if it throws, try 2 or 3
// VERIFY: layer.parent = other layer does NOT compensate position; values are set after parenting so none is needed
// VERIFY: child Position [50,50] lands on a null's centre (null default 100x100, anchor 50,50); a shape layer's origin is its anchor, so child of it uses [0,0]
// VERIFY: addNull() default size/anchor (100x100, anchor 50,50) and that comp.layers.addNull(duration) accepts one arg
// VERIFY: text sourceRectAtTime width gives the dot x so the dot sits at the text end
$.evalFile(args.prelude);
var W = 1080, H = 1920, FPS = 24, DUR = 5;
var ART = "~/Assets/comp-room-studies/channel-study/tYRvoI04pJk/proof/11/art/";

// --- project folder "art 11" and imports
var i, it, folder = null;
for (i = 1; i <= app.project.numItems; i++) {
  it = app.project.item(i);
  if (it instanceof FolderItem && it.name === "art 11") folder = it;
}
if (!folder) folder = app.project.items.addFolder("art 11");
function getArt(fname) {
  var j, f;
  for (j = 1; j <= app.project.numItems; j++) {
    f = app.project.item(j);
    if (f instanceof FootageItem && f.name === fname && f.parentFolder === folder) return f;
  }
  f = app.project.importFile(new ImportOptions(new File(ART + fname)));
  f.parentFolder = folder;
  return f;
}
var orbArt = getArt("orb.png");
var winArt = getArt("window-plate.png");

// --- main comp removed first (so the orb comp can be removed even if used), then orb pre-comp
P.freshComp("11 scale through dot", W, H, FPS, DUR);
var orb = P.freshComp("11 orb", 1024, 1024, FPS, DUR, [0, 0, 0]);
orb.layers.add(orbArt);
orb.parentFolder = folder;

// --- main comp
var c = P.freshComp("11 scale through dot", W, H, FPS, DUR, [17 / 255, 17 / 255, 17 / 255]);
c.parentFolder = folder;
var dotY = Math.round(H * 0.40);
var left = Math.round(W * 0.09);

var win = c.layers.add(winArt);
win.name = "Window";
// font: Helvetica Neue Medium, fall back to whatever sticks
var txt = P.text(c, "Watch it grow", { size: Math.round(H * 0.032), color: [28 / 255, 28 / 255, 30 / 255], font: "HelveticaNeue-Medium", pos: [W / 2, dotY], name: "Text line" });
var fontUsed = txt.property("ADBE Text Properties").property("ADBE Text Document").value.font;
var tr = txt.sourceRectAtTime(0, false);
P.tf(txt, "ADBE Position").setValue([left + tr.width / 2, dotY]);
var dotX = left + tr.width + 24;

var bg = P.solid(c, "background #111111", [17 / 255, 17 / 255, 17 / 255], W, H);

// nulls: Null 1 <- Null 2 <- Null 3 (Null 3 is the new one at the top of the chain)
var n1 = c.layers.addNull(DUR); n1.name = "Null 1";
var n2 = c.layers.addNull(DUR); n2.name = "Null 2";
var n3 = c.layers.addNull(DUR); n3.name = "Null 3";
var s8 = P.shape(c, "Shape Layer 8");
P.ellipse(s8, [20, 20]);
var orbL = c.layers.add(orb);
orbL.name = "Orb";

// order (top to bottom): Null 3, Null 2, Null 1, Shape Layer 8, Orb, Text line, Window, background
bg.moveToEnd();
win.moveBefore(bg);
txt.moveBefore(win);
orbL.moveBefore(txt);
s8.layer.moveBefore(orbL);
n1.moveBefore(s8.layer);
n2.moveBefore(n1);
n3.moveBefore(n2);

// Null 3 sits on the dot BEFORE anything is parented to it
P.tf(n3, "ADBE Position").setValue([dotX, dotY]);
P.tf(n3, "ADBE Scale").setValue([100, 100, 100]);
P.tf(n3, "ADBE Opacity").setValue(0);
P.tf(n2, "ADBE Opacity").setValue(0);
P.tf(n1, "ADBE Opacity").setValue(0);
// FIX: in this AE, layer.parent = X keeps the child's world position (it rewrites the child's local Position),
// so parent first, THEN set local positions so each child sits on its parent's centre.
n1.parent = n2;
n2.parent = n3;
s8.layer.parent = n1;
P.tf(n2, "ADBE Position").setValue([0, 0]);   // VERIFIED: addNull anchor is 0,0 here, so a child at [0,0] sits on the parent
P.tf(n1, "ADBE Position").setValue([0, 0]);
P.tf(s8.layer, "ADBE Position").setValue([0, 0]);
s8.layer.property("ADBE Transform Group").property("ADBE Opacity").setValue(0);
// orb linked to a layer already in the chain, not to Null 3 directly
orbL.parent = s8.layer;
P.tf(orbL, "ADBE Position").setValue([0, 0]);          // on the shape layer's origin, which sits on the null centre
P.tf(orbL, "ADBE Scale").setValue([3.5, 3.5, 100]);    // brief: blob 512 px wide * 3.5 % = 18 px dot

// Null 3 keys: Position and Scale, 1 s to 2 s (ASSUMED times; recipe: ~49 frames apart)
var pos = P.tf(n3, "ADBE Position");
var scl = P.tf(n3, "ADBE Scale");
var t2 = 1 + 49 / 24;
pos.setValueAtTime(1, [dotX, dotY]);
pos.setValueAtTime(t2, [dotX + 70, dotY + 60]); // ASSUMED end position, moved right
scl.setValueAtTime(1, [100, 100, 100]);
scl.setValueAtTime(t2, [3200, 3200, 100]);      // run third: recipe layout end-of-swell orb ~55-60 % of the short side (blob ~580 px wide); was 600 %
// Easy Ease then a spiky speed curve: high influence on both ends
for (i = 1; i <= 2; i++) {
  pos.setTemporalEaseAtKey(i, [new KeyframeEase(0, 85)], [new KeyframeEase(0, 85)]);
  scl.setTemporalEaseAtKey(i, [new KeyframeEase(0, 85), new KeyframeEase(0, 85), new KeyframeEase(0, 85)],
                              [new KeyframeEase(0, 85), new KeyframeEase(0, 85), new KeyframeEase(0, 85)]);
}

// window and text fade so the orb ends over the near-black ground
var wo = P.tf(win, "ADBE Opacity");
wo.setValueAtTime(1.3, 100); wo.setValueAtTime(2.2, 0);
var to = P.tf(txt, "ADBE Opacity");
to.setValueAtTime(1.3, 100); to.setValueAtTime(2.2, 0);

return { comp: c.name, id: c.id, layers: c.numLayers, dotX: dotX, dotY: dotY, font: fontUsed };
