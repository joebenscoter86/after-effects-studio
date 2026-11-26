// Technique 07: four buttons slide together, a white card replaces them in one frame, the card grows into an app window.
// VERIFY:
// VERIFY: "ADBE Vector Shape - Rect", "ADBE Vector Rect Size", "ADBE Vector Rect Roundness" match names
// VERIFY: "ADBE Vector Graphic - Fill" / "ADBE Vector Fill Color" match names
// VERIFY: KeyframeEase(0, influence) with setTemporalEaseAtKey on Position (spatial, 1 element), Scale (3), Rect Size (2), Roundness (1)
// VERIFY: layer.parent assignment keeps the child's property values (so children read in the parent's space, origin at the null's anchor)
// VERIFY: null anchor set to [0,0] so the nulls' origin is the comp centre when Null 2 sits at 540,960
// VERIFY: shape-layer text children: text parented to a shape layer whose anchor is [0,0]; text position [0,0] lands on the button centre
// VERIFY: adjustmentLayer = true on a solid layer
// VERIFY: rect Roundness is clamped by AE to half the shorter side (147 on a 500 px tall start size)
// VERIFY: layer.inPoint set to 1.2 s on a solid and a shape layer (shape layers have full-comp duration)
$.evalFile(args.prelude);

var FPS = 24;
var T_REST = 0.6;          // buttons start moving (ASSUMED; recipe gives only the 14 frame span)
var T_SWAP = T_REST + 14 / FPS; // card and pale ground start here (recipe: last button key)
var T_END = 3.2;           // card/null arrival (ASSUMED; recipe: keys dragged to align arrival)
var c = P.freshComp("07 shape morph into app window", 1080, 1920, FPS, 5, [0.04, 0.04, 0.05]);

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

// Rounded rectangle shape layer; returns the layer.
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

// Ground (dark)
var dark = P.solid(c, "dark ground", [0.04, 0.04, 0.05]);

// Nulls. Anchors at [0,0] so children are placed relative to the comp centre.
var null1 = c.layers.addNull();
null1.name = "Null 1 (original)";
var null2 = c.layers.addNull();
null2.name = "Null 2 (scaler)";
P.tf(null1, "ADBE Anchor Point").setValue([0, 0]);
P.tf(null1, "ADBE Position").setValue([0, 0]);
P.tf(null2, "ADBE Anchor Point").setValue([0, 0]);
P.tf(null2, "ADBE Position").setValue([540, 960]);
null1.parent = null2;

// Buttons: rest offsets and touching offsets from the centre (comp px, ASSUMED sizes; recipe gives only ratios)
var names = ["Notes", "Tasks", "Mail", "Plan"];
var rest = [[-190, -110], [190, -110], [-190, 110], [190, 110]];
var touch = [[-160, -85], [160, -85], [-160, 85], [160, 85]];
var i, b, t, pos, p;
for (i = 0; i < 4; i++) {
  b = roundRect("button " + names[i], [320, 170], 40, [0.11, 0.11, 0.14, 1], null, 0);
  t = P.text(c, names[i], { size: 56, color: [1, 1, 1], name: "label " + names[i] });
  b.parent = null1;
  P.tf(b, "ADBE Anchor Point").setValue([0, 0]);
  pos = P.tf(b, "ADBE Position");
  pos.setValueAtTime(T_REST, rest[i]);
  pos.setValueAtTime(T_SWAP, touch[i]);
  p = P.tf(b, "ADBE Position");
  // slow start, fast finish (reverse of the entrance); influence values ASSUMED
  ease(p, 1, 80, 80);
  ease(p, 2, 12, 12);
  // SUBSTITUTE: the bounce expression from the pinned comment is not in the recipe; not applied
  t.parent = b;
  P.tf(t, "ADBE Position").setValue([0, 0]);
}

// Adjustment layer (in the stack, empty)
var adj = P.solid(c, "adjustment layer", [1, 1, 1]);
adj.adjustmentLayer = true;

// Pale ground, starts at the swap frame
var pale = P.solid(c, "white solid", [244 / 255, 244 / 255, 244 / 255]);
pale.inPoint = T_SWAP;

// Card: white, light grey stroke, Scale 72, Size keyed, Roundness keyed
var card = roundRect("card", [944, 528], 147, [1, 1, 1, 1], [200 / 255, 200 / 255, 200 / 255, 1], 4);
card.parent = null1;
P.tf(card, "ADBE Anchor Point").setValue([0, 0]);
P.tf(card, "ADBE Position").setValue([0, 0]);
P.tf(card, "ADBE Scale").setValue([72, 72]);
var cont = P.contents({ layer: card });
var rr = cont.property("ADBE Vector Shape - Rect");
var sz = rr.property("ADBE Vector Rect Size");
var rd = rr.property("ADBE Vector Rect Roundness");
// Final on-screen card 880 x 620 = size * 0.72 * null scale 3
sz.setValueAtTime(T_SWAP, [944, 528]);
sz.setValueAtTime(T_END, [407.4, 287.0]);
rd.setValueAtTime(T_SWAP, 147);
rd.setValueAtTime(T_END, 48);
rr = P.contents({ layer: card }).property("ADBE Vector Shape - Rect");
ease(rr.property("ADBE Vector Rect Size"), 1, 75, 75);
ease(rr.property("ADBE Vector Rect Size"), 2, 75, 75);
ease(rr.property("ADBE Vector Rect Roundness"), 1, 75, 75);
ease(rr.property("ADBE Vector Rect Roundness"), 2, 75, 75);
card.inPoint = T_SWAP;

// Null 2: Scale 100 -> 300 and Position 540,960 -> 540,680 (the recipe's 1920,1080 -> 1920,765 scaled to this comp)
var s2 = P.tf(null2, "ADBE Scale");
s2.setValueAtTime(T_SWAP, [100, 100]);
s2.setValueAtTime(T_END, [300, 300]);
var p2 = P.tf(null2, "ADBE Position");
p2.setValueAtTime(T_SWAP, [540, 960]);
p2.setValueAtTime(T_END, [540, 680]);
s2 = P.tf(null2, "ADBE Scale");
p2 = P.tf(null2, "ADBE Position");
ease(s2, 1, 75, 75); ease(s2, 2, 75, 75);
ease(p2, 1, 75, 75); ease(p2, 2, 75, 75);

// Final order: card, pale solid, adjustment layer, ...
adj.moveToBeginning();
pale.moveToBeginning();
card.moveToBeginning();
null1.enabled = false; null2.enabled = false; // nulls are not drawn anyway; kept for clarity
null1.shy = false;

return { comp: c.name, id: c.id, layers: c.numLayers, swap: T_SWAP };
