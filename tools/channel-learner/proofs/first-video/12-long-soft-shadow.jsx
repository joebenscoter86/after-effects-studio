// Technique 12: long soft shadow from a radially blurred black copy.
// Pale grey-blue bars, a block and a two-word title on a near-white background. Each object gets a copy underneath,
// parented to it, turned black with Fill, streaked with CC Radial Fast Blur (Amount 95, Zoom Standard, centre up and
// to the left of the object so the streak runs down and to the right), then softened with Gaussian Blur 25.6.
// Switch-off for a "before" frame: disable every layer whose name starts with "TECH shadow".
//
// VERIFY: match names "ADBE Fill", "CC Radial Fast Blur", "ADBE Gaussian Blur 2" (given in the recipe).
// VERIFY: property display names: Fill "Color", "Opacity"; CC Radial Fast Blur "Center", "Amount", "Zoom"; Gaussian Blur "Blurriness", "Blur Dimensions", "Repeat Edge Pixels".
// VERIFY: effects are reachable after adding by display names "Fill", "CC Radial Fast Blur", "Gaussian Blur".
// VERIFY: Zoom popup 1 = Standard; Blur Dimensions 1 = Horizontal and Vertical; Repeat Edge Pixels 1 = on; Fill Opacity default is 100 % (read back in result.fillOpacity, not set).
// VERIFY: the Center expression fromComp(toComp(anchorPoint) + offset) lands up and to the left of each object on shape and text layers alike.
// VERIFY: the streak is not cut off at the layer's edge: shape and text layers are expected not to clip; if they do, add Grow Bounds first in the stack (see technique 15).
// VERIFY: layer.duplicate() of a shape or text layer places the copy directly above; moveAfter puts it below; setting parent keeps it in place.
$.evalFile(args.prelude);
args = args || {};

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
function hex(h) {
  return [parseInt(h.substr(0, 2), 16) / 255, parseInt(h.substr(2, 2), 16) / 255, parseInt(h.substr(4, 2), 16) / 255];
}
function fxp(layer, effectName, prop) {
  var p = layer.property("ADBE Effect Parade").property(effectName).property(prop);
  if (!p) throw new Error("property not found: " + effectName + " > " + prop + " on " + layer.name);
  return p;
}

// ASSUMED: background #F4F6F8, objects #CFD9E2 (pale grey-blue); the recipe gives neither.
var c = P.freshComp("12 long soft shadow", 1920, 1080, 24, 4, [0.957, 0.965, 0.973]);
P.solid(c, "background", hex("F4F6F8"));
var objColor = hex("CFD9E2").concat([1]);

var objects = [];
var b1 = P.shape(c, "bar 1");
rect(b1, [560, 70], 35);
fill(b1, objColor);
P.tf(b1.layer, "ADBE Position").setValue([640, 330]);
objects.push(b1.layer);

var b2 = P.shape(c, "bar 2");
rect(b2, [400, 70], 35);
fill(b2, objColor);
P.tf(b2.layer, "ADBE Position").setValue([560, 460]);
objects.push(b2.layer);

var blk = P.shape(c, "block");
rect(blk, [220, 220], 24);
fill(blk, objColor);
P.tf(blk.layer, "ADBE Position").setValue([1360, 380]);
objects.push(blk.layer);

// ASSUMED: font left to the default unless args.font is given.
var title = P.text(c, "LONG SHADOW", { size: 150, color: hex("CFD9E2"), font: args.font, name: "title", pos: [960, 760], tracking: 40 });
objects.push(title);

// ASSUMED: centre 260 px left and 170 px above each object's middle (recipe: "up and to the left"; its values are in an unknown layer's space).
var off = args.centerOffset || [-260, -170];
// ASSUMED: shadow layer opacity 60 % (recipe: not shown, "shadows read as mid grey").
var shadowOpacity = args.shadowOpacity === undefined ? 60 : args.shadowOpacity;

var i, o, s, names = [];
for (i = 0; i < objects.length; i++) {
  o = objects[i];
  // Step 1: duplicate; the copy underneath is the shadow, parented to its object.
  s = o.duplicate();
  s.name = "TECH shadow " + o.name;
  s.moveAfter(o);
  s.parent = o;
  // Step 2: no layer styles on the copy. The stand-ins have none, so there is nothing to remove.
  // Step 3: solid black with Fill.
  P.effect(s, "ADBE Fill");
  fxp(s, "Fill", "Color").setValue([0, 0, 0, 1]);
  // Fill Opacity is left at its default (100 %); its scripting range (0-1 or 0-100) is uncertain, so it is only read back.
  // Step 4: CC Radial Fast Blur, Amount 95, Zoom Standard.
  P.effect(s, "CC Radial Fast Blur");
  fxp(s, "CC Radial Fast Blur", "Amount").setValue(95);
  fxp(s, "CC Radial Fast Blur", "Zoom").setValue(1);
  // Step 5: aim the streak. SUBSTITUTE: the Center is dragged in the viewer in the tutorial; here an expression places it
  // up and to the left of the object, in comp pixels, converted to the layer's space.
  fxp(s, "CC Radial Fast Blur", "Center").expression = "fromComp(toComp(anchorPoint) + [" + off[0] + ", " + off[1] + "])";
  // Step 6: Gaussian Blur 25.6, both directions, repeat edge pixels.
  P.effect(s, "ADBE Gaussian Blur 2");
  fxp(s, "Gaussian Blur", "Blurriness").setValue(25.6);
  fxp(s, "Gaussian Blur", "Blur Dimensions").setValue(1);
  fxp(s, "Gaussian Blur", "Repeat Edge Pixels").setValue(1);
  P.tf(s, "ADBE Opacity").setValue(shadowOpacity);
  names.push(s.name);
}

return { comp: c.name, layers: c.numLayers, switchOff: names.join(", "), fillOpacity: fxp(s, "Fill", "Opacity").value };
