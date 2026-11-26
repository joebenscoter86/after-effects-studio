// Technique 11: grow an orb out of a small dot through a chain of linked nulls.
// VERIFY: P.effect(layer,"ADBE Ramp") is Gradient Ramp; props "ADBE Ramp-0001" start point, -0002 start colour, -0003 end point, -0004 end colour, -0005 shape (2 = radial)
// VERIFY: mask creation via property("ADBE Mask Parade").addProperty("ADBE Mask Atom"), then "ADBE Mask Shape" and "ADBE Mask Feather" fetched again by name
// VERIFY: setTemporalEaseAtKey on Scale needs an array of 3 KeyframeEase; on Position (2D) I pass 1 -- if it throws, try 2 or 3
// VERIFY: layer.parent = other layer does NOT compensate position; I set values after parenting so none is needed
// VERIFY: child Position [50,50] lands on parent's anchor (null default 100x100 layer, anchor 50,50) -- so orb sits on Null 3 position
// VERIFY: addNull() default size/anchor (100x100, anchor 50,50) and that comp.layers.addNull(duration) accepts one arg
// VERIFY: text sourceRectAtTime width gives the dot x so the dot sits at the text end
$.evalFile(args.prelude);
var W = 1080, H = 1920, FPS = 24, DUR = 5;

// --- orb pre-comp (stand-in for the "pre-made glowing orb"): teal core to violet edge, soft rim, taller than wide
P.freshComp("11 scale through dot", W, H, FPS, DUR);
var orb = P.freshComp("11 orb", 400, 500, FPS, DUR, [0, 0, 0]);
var os = P.solid(orb, "orb blob", [1, 1, 1], 400, 500);
var rp = P.effect(os, "ADBE Ramp");
rp.property("ADBE Ramp-0001").setValue([200, 230]);
rp.property("ADBE Ramp-0002").setValue([0.1, 0.85, 0.8]);   // teal
rp.property("ADBE Ramp-0003").setValue([200, 500]);
rp.property("ADBE Ramp-0004").setValue([0.35, 0.2, 0.85]);  // violet
rp.property("ADBE Ramp-0005").setValue(2);                   // radial
var mk = os.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
var mi = mk.propertyIndex;
var k = 0.5523, rx = 150, ry = 190, cx = 200, cy = 250;
var sh = new Shape();
sh.vertices = [[cx, cy - ry], [cx + rx, cy], [cx, cy + ry], [cx - rx, cy]];
sh.inTangents = [[-rx * k, 0], [0, -ry * k], [rx * k, 0], [0, ry * k]];
sh.outTangents = [[rx * k, 0], [0, ry * k], [-rx * k, 0], [0, -ry * k]];
sh.closed = true;
os.property("ADBE Mask Parade").property(mi).property("ADBE Mask Shape").setValue(sh);
os.property("ADBE Mask Parade").property(mi).property("ADBE Mask Feather").setValue([70, 70]); // ASSUMED soft rim

// --- main comp
var c = P.freshComp("11 scale through dot", W, H, FPS, DUR, [0.07, 0.07, 0.07]);
var dotY = 900;

var win = P.solid(c, "window", [0.95, 0.95, 0.94], 900, 460);
win.name = "window";
P.tf(win, "ADBE Position").setValue([W / 2, dotY]);
var txt = P.text(c, "Watch it grow", { size: 90, color: [0.1, 0.1, 0.12], pos: [W / 2 - 40, dotY], name: "text" });
var tr = txt.sourceRectAtTime(0, false);
var dotX = W / 2 - 40 + tr.width / 2 + 45;

var bg = P.solid(c, "background #111111", [17 / 255, 17 / 255, 17 / 255], W, H);

// nulls: Null 1 <- Null 2 <- Null 3 (Null 3 is the new one at the top of the chain)
var n1 = c.layers.addNull(DUR); n1.name = "Null 1";
var n2 = c.layers.addNull(DUR); n2.name = "Null 2";
var n3 = c.layers.addNull(DUR); n3.name = "Null 3";
var s8 = P.shape(c, "Shape Layer 8");
P.ellipse(s8, [20, 20]);
var orbL = c.layers.add(orb);
orbL.name = "orb";

// order: orb, shape 8, nulls, text, window, background
orbL.moveToBeginning();
s8.layer.moveAfter(orbL);
n1.moveAfter(s8.layer);
n2.moveAfter(n1);
n3.moveAfter(n2);
txt.moveAfter(n3);
win.moveAfter(txt);
bg.moveToEnd();

// Null 3 sits on the dot BEFORE anything is parented to it
P.tf(n3, "ADBE Position").setValue([dotX, dotY]);
P.tf(n3, "ADBE Scale").setValue([100, 100, 100]);
P.tf(n3, "ADBE Opacity").setValue(0);
P.tf(n2, "ADBE Position").setValue([50, 50]);   // SUBSTITUTE: parenting with Alt-style compensation; child sits at parent's anchor
P.tf(n1, "ADBE Position").setValue([50, 50]);
P.tf(n2, "ADBE Opacity").setValue(0);
P.tf(n1, "ADBE Opacity").setValue(0);
n1.parent = n2;
n2.parent = n3;
P.tf(s8.layer, "ADBE Position").setValue([50, 50]);
s8.layer.parent = n1;
s8.layer.property("ADBE Transform Group").property("ADBE Opacity").setValue(0);
// orb linked to a layer already in the chain, not to Null 3 directly
orbL.parent = s8.layer;
P.tf(orbL, "ADBE Position").setValue([50, 50]);
P.tf(orbL, "ADBE Scale").setValue([4.5, 4.5, 100]); // ASSUMED: 400px orb at 4.5% = 18px dot

// Null 3 keys: Position and Scale, 1 s to 2 s (ASSUMED times; recipe: ~49 frames apart at 25 fps)
var pos = P.tf(n3, "ADBE Position");
var scl = P.tf(n3, "ADBE Scale");
pos.setValueAtTime(1, [dotX, dotY]);
pos.setValueAtTime(1 + 49 / 24, [dotX + 70, dotY + 60]); // ASSUMED end position, moved right
scl.setValueAtTime(1, [100, 100, 100]);
scl.setValueAtTime(1 + 49 / 24, [800, 800, 100]);        // ASSUMED end scale
// Easy Ease then a spiky speed curve: high influence on both ends
var i;
for (i = 1; i <= 2; i++) {
  pos.setTemporalEaseAtKey(i, [new KeyframeEase(0, 85)], [new KeyframeEase(0, 85)]);
  scl.setTemporalEaseAtKey(i, [new KeyframeEase(0, 85), new KeyframeEase(0, 85), new KeyframeEase(0, 85)],
                              [new KeyframeEase(0, 85), new KeyframeEase(0, 85), new KeyframeEase(0, 85)]);
}
// SUBSTITUTE: pulling speed handles in the Graph Editor by hand -> influence 85 set by script

// window and text fade so the orb ends over the near-black ground (ASSUMED; the finished example's scene is not described)
var wo = P.tf(win, "ADBE Opacity");
wo.setValueAtTime(1.3, 100); wo.setValueAtTime(2.2, 0);
var to = P.tf(txt, "ADBE Opacity");
to.setValueAtTime(1.3, 100); to.setValueAtTime(2.2, 0);

return { comp: c.name, id: c.id, layers: c.numLayers };
