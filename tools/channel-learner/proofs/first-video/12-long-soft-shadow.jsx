// Technique 12: long soft shadow from a radially blurred black copy.
// Pale grey-blue bars, a block and a two-word title on a near-white background. Each object gets a copy underneath,
// parented to it, turned black with Fill, streaked with CC Radial Fast Blur (Amount 95, Zoom Standard, centre up and
// to the left of the object so the streak runs down and to the right), then softened with Gaussian Blur 25.6.
// Switch-off for a "before" frame: disable every layer whose name starts with "TECH shadow".
// Second 2026-11-14 correction: the title throws no shadow by default (the tutorial's letters throw none that can be
// measured; only the four shapes do). args.letterShadows = true brings back one black letter layer per letter
// ("TECH shadow letter ..."); with it, args.perLetter = false gives one copy per word instead.
//
// VERIFY: match names "ADBE Fill", "CC Radial Fast Blur", "ADBE Gaussian Blur 2" (given in the recipe).
// VERIFY: property display names: Fill "Color", "Opacity"; CC Radial Fast Blur "Center", "Amount", "Zoom"; Gaussian Blur "Blurriness", "Blur Dimensions", "Repeat Edge Pixels".
// VERIFY: effects are reachable after adding by display names "Fill", "CC Radial Fast Blur", "Gaussian Blur".
// VERIFY: Zoom popup 1 = Standard; Blur Dimensions 1 = Horizontal and Vertical; Repeat Edge Pixels 1 = on; Fill Opacity default is 100 % (read back in result.fillOpacity, not set).
// VERIFY: the Center expression fromComp(toComp(anchorPoint) + offset) lands up and to the left of each object on shape and text layers alike.
//   RUN: false. Center is read in comp pixels on these layers; the expression is now toComp(anchorPoint) + offset.
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

// Run fix (layout line): objects placed and sized from the layout's boxes (shares of 1920 x 1080), each with the
// direction its shadow runs (degrees below horizontal, measured in the tutorial): every shadow aims away from its
// own blur centre, so the direction differs per object.
var W = 1920, H = 1080;
var objects = [], angles = [], sizes = [];
function addRect(name, x0, x1, y0, y1, round, ang) {
  var sh = P.shape(c, name);
  var w = (x1 - x0) * W, h = (y1 - y0) * H;
  rect(sh, [w, h], round === undefined ? Math.min(w, h) * 0.2 : round);
  fill(sh, objColor);
  P.tf(sh.layer, "ADBE Position").setValue([(x0 + x1) / 2 * W, (y0 + y1) / 2 * H]);
  objects.push(sh.layer);
  angles.push(ang);
  sizes.push([w, h]);
}
addRect("top-left block", 0.12, 0.17, 0.10, 0.21, undefined, 10);
addRect("tall right bar", 0.87, 0.91, 0.21, 0.42, undefined, 38);
addRect("small lower block", 0.32, 0.35, 0.78, 0.83, undefined, 40);
addRect("left bar", 0.04, 0.18, 0.60, 0.66, undefined, 71);

// Title: upper word about 0.40-0.62w, 0.20-0.40h; lower word about 0.27-0.72w, 0.37-0.66h. Letters' shadows about 55-65 deg.
// ASSUMED: words "Long" / "Shadow", Poppins-Bold (installed), sized to the layout's widths (422 and 864 px).
var up = P.text(c, "Long", { size: args.upSize || 180, color: objColor.slice(0, 3), font: args.font || "Poppins-Bold", name: "title upper", pos: [0.51 * W, 0.30 * H] });
var lo = P.text(c, "Shadow", { size: args.loSize || 210, color: objColor.slice(0, 3), font: args.font || "Poppins-Bold", name: "title lower", pos: [0.495 * W, 0.515 * H] });
var upR = up.sourceRectAtTime(0, false), loR = lo.sourceRectAtTime(0, false);
// Correction (2026-11-14, from the review): one shadow copy and one blur centre per title letter, so each letter throws
// its own narrow band (a single centre for a whole word made the letters' rays fan out like a sunburst).
// Each letter is its own black text layer, placed over its letter in the word from measured rectangles.
function letterShadows(word, str, size) {
  var R = word.sourceRectAtTime(0, false);
  var wp = P.tf(word, "ADBE Position").value;
  var left = wp[0] - R.width / 2, base = wp[1] - (R.top + R.height / 2);
  var k, pre, pw, l, r, last = word;
  for (k = 0; k < str.length; k++) {
    pre = P.text(c, str.substr(0, k + 1), { size: size, color: [0, 0, 0], font: args.font || "Poppins-Bold", name: "probe" });
    pw = pre.sourceRectAtTime(0, false).width;
    pre.remove();
    l = P.text(c, str.charAt(k), { size: size, color: [0, 0, 0], font: args.font || "Poppins-Bold", name: "letter " + word.name + " " + str.charAt(k) + (k + 1) });
    r = l.sourceRectAtTime(0, false);
    P.tf(l, "ADBE Position").setValue([left + pw - r.width / 2, base + r.top + r.height / 2]);
    l.moveAfter(last);
    last = l;
    objects.push(l); angles.push(60); sizes.push([r.width, r.height]); isLetter.push(objects.length - 1); letterParent.push(word);
  }
}
var isLetter = [], letterParent = [];
var perLetter = (args.perLetter !== false);
// Second correction (2026-11-14, from the review): the title's shadows are off unless args.letterShadows is true.
var titleShadows = (args.letterShadows === true);
if (!titleShadows) {
  // no shadow for the title: the two words stay as they are
} else if (perLetter) {
  letterShadows(up, "Long", args.upSize || 180);
  letterShadows(lo, "Shadow", args.loSize || 210);
} else {
  objects.push(up); angles.push(60); sizes.push([upR.width, upR.height]);
  objects.push(lo); angles.push(60); sizes.push([loR.width, loR.height]);
}

// Correction (2026-11-14): the blur centre's distance is now worked out per object from the spread wanted. The rays from
// one centre across an object open by about 2 * atan(half the object's width across the shadow / centre distance), so
// distance = (width across / 2) / tan(spread / 2). args.spread is that spread in degrees; args.dist forces one distance.
// The first build used 220 px for shapes and 300 px for whole title words (spreads of about 25 to 110 degrees).
// Tried once (2026-11-14) and not kept: a centre twice as far for the left bar alone (2100 px against 1045, to halve how
// fast its band widens). The render came out identical pixel for pixel, although Center read back as (-472, -1305)
// against (-129, -308): both lie outside the frame, so the effect seems to stop the centre at the frame's edge. A centre
// placed past the edge of the frame therefore does not narrow the spread any further.
var SPREAD = (args.spread || 15) * Math.PI / 180;
function centreDistance(idx) {
  if (args.dist) return args.dist;
  var th = angles[idx] * Math.PI / 180;
  var across = sizes[idx][0] * Math.abs(Math.sin(th)) + sizes[idx][1] * Math.abs(Math.cos(th));
  return (across / 2) / Math.tan(SPREAD / 2);
}
// Shadow layer opacity (recipe: not shown). First build 40 %; the review asks for about 60 to 70 %.
var shadowOpacity = args.shadowOpacity === undefined ? 70 : args.shadowOpacity;

var i, o, s, names = [], dists = [];
for (i = 0; i < objects.length; i++) {
  o = objects[i];
  var li = -1, q;
  for (q = 0; q < isLetter.length; q++) if (isLetter[q] === i) li = q;
  if (li >= 0) {
    // A title letter: the black letter layer itself is the shadow copy, parented to its word (already below it).
    s = o;
    s.name = "TECH shadow " + o.name;
    s.parent = letterParent[li];
  } else {
    // Step 1: duplicate; the copy underneath is the shadow, parented to its object.
    s = o.duplicate();
    s.name = "TECH shadow " + o.name;
    s.moveAfter(o);
    s.parent = o;
  }
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
  var th = angles[i] * Math.PI / 180;
  var d = centreDistance(i);
  dists.push(Math.round(d));
  var off = [-d * Math.cos(th), -d * Math.sin(th)];
  // Run fix: on these shape and text layers (comp-sized, unscaled) CC Radial Fast Blur reads Center in COMP pixels, not
  // layer space: a fixed Center of (1100, 167) on the top-left block's shadow threw it straight left, and (979, 600) on the
  // title's threw it straight up. fromComp() therefore put every centre near the comp's top-left corner, so all shadows
  // fanned out from there. The expression now gives the comp point directly.
  fxp(s, "CC Radial Fast Blur", "Center").expression = "toComp(anchorPoint) + [" + off[0] + ", " + off[1] + "]";
  // Step 6: Gaussian Blur 25.6, both directions, repeat edge pixels.
  P.effect(s, "ADBE Gaussian Blur 2");
  fxp(s, "Gaussian Blur", "Blurriness").setValue(25.6);
  fxp(s, "Gaussian Blur", "Blur Dimensions").setValue(1);
  fxp(s, "Gaussian Blur", "Repeat Edge Pixels").setValue(1);
  P.tf(s, "ADBE Opacity").setValue(shadowOpacity);
  names.push(s.name);
}

return { comp: c.name, layers: c.numLayers, upper: [upR.width, upR.height], lower: [loR.width, loR.height], switchOff: names.join(", "), letterShadows: titleShadows, centreDistances: dists, shadowOpacity: shadowOpacity, fillOpacity: fxp(s, "Fill", "Opacity").value };
