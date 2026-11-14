// Technique 15: un-clip an effect with Grow Bounds.
// A shadow copy of a tree (a small precomp, so its layer bounds are tight) gets Fill (dark), CC Radial Fast Blur
// and Gaussian Blur. The radial streak runs past the layer's box and is cut off with a hard edge.
// Grow Bounds at the top of the effect stack, Pixels 2050, gives the effects room so the streak runs on.
// Switch-off for a "before" frame: disable the effect named "TECH Grow Bounds" on layer "tree shadow".
//
// VERIFY: P.effect accepts "Grow Bounds", "Fill", "CC Radial Fast Blur", "Gaussian Blur", "Gradient Ramp" as display names (match names believed "ADBE Grow Bounds", "ADBE Fill", "CC Radial Fast Blur", "ADBE Gaussian Blur 2", "ADBE Ramp").
// VERIFY: property display names: Grow Bounds "Pixels"; Fill "Color"; CC Radial Fast Blur "Center", "Amount"; Gaussian Blur "Blurriness", "Blur Dimensions", "Repeat Edge Pixels"; Gradient Ramp "Start of Ramp", "Start Color", "End of Ramp", "End Color".
// VERIFY: Blur Dimensions value 1 = Horizontal and Vertical; Repeat Edge Pixels takes 1 for on.
// VERIFY: effect.moveTo(1) puts Grow Bounds first in the stack; references are re-fetched by name after it.
// VERIFY: CC Radial Fast Blur Center is in layer space of the 300 x 400 precomp layer; the chosen centre makes the streak run right and down, out of the box.
// VERIFY: that the shadow is in fact clipped with Grow Bounds off (CC Radial Fast Blur should not grow the buffer on its own). If it is not, shrink the precomp further or move the centre.
// VERIFY: Pixels 2050 renders in reasonable time on a 300 x 400 layer; the recipe warns large values cost render time.
$.evalFile(args.prelude);

function rect(sh, size, round) {
  var r = P.contents(sh).addProperty("ADBE Vector Shape - Rect");
  var idx = r.propertyIndex;
  P.contents(sh).property(idx).property("ADBE Vector Rect Size").setValue(size);
  P.contents(sh).property(idx).property("ADBE Vector Rect Roundness").setValue(round);
  return idx;
}
function fill(sh, color) {
  var f = P.contents(sh).addProperty("ADBE Vector Graphic - Fill");
  var idx = f.propertyIndex;
  P.contents(sh).property(idx).property("ADBE Vector Fill Color").setValue(color);
  return idx;
}
function fx(layer, name) {
  return layer.property("ADBE Effect Parade").property(name);
}

// Tree art in its own small comp, so the layer's bounding box is tight around the tree.
// ASSUMED: a 300 x 400 precomp with a trunk and a round crown stands in for the tutorial's tree artwork.
var t = P.freshComp("15 tree art", 300, 400, 24, 4, [0, 0, 0]);
var trunk = P.shape(t, "trunk");
rect(trunk, [40, 160], 8);
fill(trunk, [0.40, 0.25, 0.15, 1]);
P.tf(trunk.layer, "ADBE Position").setValue([150, 320]);
var crown = P.shape(t, "crown");
P.ellipse(crown, [240, 240]);
fill(crown, [0.18, 0.55, 0.25, 1]);
P.tf(crown.layer, "ADBE Position").setValue([150, 140]);

var c = P.freshComp("15 grow bounds", 1920, 1080, 24, 4, [0.5, 0.6, 0.8]);

// Sunset sky from Gradient Ramp.
var sky = P.solid(c, "sky", [1, 1, 1]);
P.effect(sky, "Gradient Ramp");
fx(sky, "Gradient Ramp").property("Start of Ramp").setValue([960, 0]);
fx(sky, "Gradient Ramp").property("Start Color").setValue([0.98, 0.55, 0.35]);
fx(sky, "Gradient Ramp").property("End of Ramp").setValue([960, 700]);
fx(sky, "Gradient Ramp").property("End Color").setValue([1, 0.85, 0.55]);

// Rolling green hill.
var hill = P.shape(c, "hill");
P.ellipse(hill, [3200, 1200]);
fill(hill, [0.35, 0.70, 0.30, 1]);
P.tf(hill.layer, "ADBE Position").setValue([960, 1350]);

// Step 1: the shadow copy, below the tree, with Fill, CC Radial Fast Blur and Gaussian Blur.
var shadow = c.layers.add(t);
shadow.name = "tree shadow";
P.tf(shadow, "ADBE Position").setValue([760, 720]);
// ASSUMED: shadow copy sits at the same place as the tree (how the tutorial positioned it is not in the recipe); layer opacity 70 %.
P.tf(shadow, "ADBE Opacity").setValue(70);

P.effect(shadow, "Fill");
// ASSUMED: dark near-black grey; the exact Fill colour is unreadable in the recipe.
fx(shadow, "Fill").property("Color").setValue([0.08, 0.10, 0.08]);
// Fill Opacity 100 % and Feather 0 are the defaults; left alone.

P.effect(shadow, "CC Radial Fast Blur");
// ASSUMED: Center. The tutorial's 97.8,512.3 is in the tutorial tree's own layer space; here a point up and to the left
// of the tree (layer space) so the streak runs right and down across the hill, out of the 300 x 400 box.
fx(shadow, "CC Radial Fast Blur").property("Center").setValue([-150, -100]);
fx(shadow, "CC Radial Fast Blur").property("Amount").setValue(95);
// Zoom: Standard is the default; left alone.

P.effect(shadow, "Gaussian Blur");
fx(shadow, "Gaussian Blur").property("Blurriness").setValue(71.2);
fx(shadow, "Gaussian Blur").property("Blur Dimensions").setValue(1);
fx(shadow, "Gaussian Blur").property("Repeat Edge Pixels").setValue(1);

// The tree itself, above its shadow.
var tree = c.layers.add(t);
tree.name = "tree";
P.tf(tree, "ADBE Position").setValue([760, 720]);

// Step 2-3: Grow Bounds, moved to the top of the shadow's effect stack, Pixels 2050.
var gb = P.effect(shadow, "Grow Bounds");
gb.name = "TECH Grow Bounds";
fx(shadow, "TECH Grow Bounds").moveTo(1);
fx(shadow, "TECH Grow Bounds").property("Pixels").setValue(2050);

var order = [];
var i;
for (i = 1; i <= shadow.property("ADBE Effect Parade").numProperties; i++) order.push(shadow.property("ADBE Effect Parade").property(i).name);

return { comp: c.name, id: c.id, layers: c.numLayers, shadowEffects: order.join(" > ") };
