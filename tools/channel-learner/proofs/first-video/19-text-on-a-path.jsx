// Technique 19: text that runs round a drawn path.
// A repeated phrase on one text layer, a circular mask on that layer (mode None), Path Options pointing at the mask,
// and First Margin animated so the ring of words travels round a central title.
//
// VERIFY: font PostScript names "Poppins-Black" (ring) and "Poppins-Bold" (title) are installed; pass args.font / args.titleFont otherwise.
// VERIFY: text path group match names: "ADBE Text Path Options", "ADBE Text Path", "ADBE Text Reverse Path",
//         "ADBE Text Perpendicular To Path", "ADBE Text Force Align Path", "ADBE Text First Margin", "ADBE Text Last Margin".
// VERIFY: "ADBE Text Path" takes the mask's index (1) through setValue(1).
// VERIFY: mask vertex order top, left, bottom, right (counter-clockwise on screen) is assumed to match the Ellipse tool's,
//         so that Reverse Path On puts the letters on the outside reading clockwise. If they sit inside, pass args.reverse = 0.
// VERIFY: with a left-justified text layer whose anchor and position put its origin at the comp centre, mask coordinates
//         centred on [0,0] land on the comp centre.
// VERIFY: Fill effect display name "Fill" and its colour property "Color".
// VERIFY: the phrase repeated three times at 48.7 px fills the 300 px radius ring without overlapping; adjust args.size or args.radius.
$.evalFile(args.prelude);

// Candidate for the prelude: a closed elliptical mask on a layer, in layer coordinates.
function ellipseMask(layer, cx, cy, rx, ry) {
  var k = 0.5523;
  var s = new Shape();
  // top, left, bottom, right: counter-clockwise on screen (y down)
  s.vertices = [[cx, cy - ry], [cx - rx, cy], [cx, cy + ry], [cx + rx, cy]];
  s.inTangents = [[k * rx, 0], [0, -k * ry], [-k * rx, 0], [0, k * ry]];
  s.outTangents = [[-k * rx, 0], [0, k * ry], [k * rx, 0], [0, -k * ry]];
  s.closed = true;
  var m = layer.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
  var idx = m.propertyIndex;
  layer.property("ADBE Mask Parade").property(idx).property("ADBE Mask Shape").setValue(s);
  layer.property("ADBE Mask Parade").property(idx).maskMode = MaskMode.NONE;
  return idx;
}

var fps = 23.976; // the recipe's comp is 23.976 fps
var c = P.freshComp("19 text on a path", 1920, 1080, fps, 5, [0.03, 0.03, 0.035]);

// Layout (recipe's layout: line, shares of the whole comp): ring of type about 0.76 of the comp height across its outside
// (821 px), centred; ring letters about 4 % of the height tall (43 px); three repeats with about one word-space between;
// title block about 25 % of the width by 24 % of the height, centred at 51 % / 51 %, tilted 10-13 degrees anticlockwise.
var OUTER = args.outer || 821;
var CAP = 0.70; // cap height of the ring font as a share of its size (Montserrat Black; Poppins Black is not installed here)

// Example content: the bold two-line title in the centre (not part of the technique).
var title = P.text(c, "MAKE\rIT MOVE", { size: 100, font: args.titleFont || "Poppins-Bold", color: [1, 1, 1], name: "title" });
(function () {
  var prop = title.property("ADBE Text Properties").property("ADBE Text Document");
  var rr = title.sourceRectAtTime(0, false);
  var d0 = prop.value;
  d0.fontSize = Math.round(100 * 440 / rr.width); // about 440 px wide before the tilt, so the tilted block is about 480 x 260
  prop.setValue(d0);
  rr = title.sourceRectAtTime(0, false);
  P.tf(title, "ADBE Anchor Point").setValue([rr.left + rr.width / 2, rr.top + rr.height / 2]);
  P.tf(title, "ADBE Position").setValue([0.51 * c.width, 0.51 * c.height]);
  P.tf(title, "ADBE Rotate Z").setValue(-11.5);
})();

// 1. The repeated phrase on one line.
// ASSUMED: the phrase (recipe: "a short all-caps phrase repeated three times"; exact phrase not given).
var phrase = args.phrase || "KEEP IT MOVING ";
var str = phrase + phrase + phrase;
var t = c.layers.addText(str);
t.name = "ring text";
var docProp = t.property("ADBE Text Properties").property("ADBE Text Document");
var d = docProp.value;
d.resetCharStyle();
d.font = args.font || "Montserrat-Black"; // SUBSTITUTE: the script's Poppins-Black is not installed
// Recipe: 35 px raised to 48.7 px "so the phrase fills the circle". Here the size is found the same way: letters about 4 %
// of the height (61 px), then corrected so three repeats exactly fill the path (see below).
d.fontSize = args.size || 61;
d.tracking = 125;
d.fillColor = [1, 1, 1];
d.applyFill = true;
d.applyStroke = false;
d.justification = ParagraphJustification.LEFT_JUSTIFY; // ASSUMED: left; the recipe does not give the paragraph alignment
docProp.setValue(d);
// Fit: measure one repeat's pitch on the straight line (six repeats minus three, so the trailing space counts), then
// scale the size so three repeats equal the circle's circumference. Two passes, since the radius depends on the cap height.
var r, pass, w3, w6, pitch;
for (pass = 0; pass < 2 && !args.size; pass++) {
  d = docProp.value; d.text = str; docProp.setValue(d);
  w3 = t.sourceRectAtTime(0, false).width;
  d = docProp.value; d.text = str + str; docProp.setValue(d);
  w6 = t.sourceRectAtTime(0, false).width;
  pitch = (w6 - w3) / 3;
  d = docProp.value;
  r = OUTER / 2 - CAP * d.fontSize;
  d.fontSize = Math.round(d.fontSize * (2 * Math.PI * r) / (3 * pitch) * 10) / 10;
  d.text = str;
  docProp.setValue(d);
}
r = args.radius || (OUTER / 2 - CAP * docProp.value.fontSize);
// Put the text layer's origin at the comp centre so the mask can be drawn round [0,0].
P.tf(t, "ADBE Anchor Point").setValue([0, 0]);
P.tf(t, "ADBE Position").setValue([c.width / 2, c.height / 2]);

// The recipe's layer also carries a Fill effect set to white.
var fill = P.effect(t, "ADBE Fill");
fill.property("ADBE Fill-0002").setValue([1, 1, 1, 1]);

// 2 and 4. Closed circular mask on the text layer, mode None.
// Radius: the layout's outside diameter less the letters' height (they stand on the outside of the path).
var maskIdx = ellipseMask(t, 0, 0, r, r);

// 3, 6 and 7. Path Options.
var po = t.property("ADBE Text Properties").property("ADBE Text Path Options");
po.property("ADBE Text Path").setValue(maskIdx);
po = t.property("ADBE Text Properties").property("ADBE Text Path Options");
po.property("ADBE Text Reverse Path").setValue(args.reverse === undefined ? 1 : args.reverse);
po.property("ADBE Text Perpendicular To Path").setValue(1);
po.property("ADBE Text Force Align Path").setValue(0);
po.property("ADBE Text Last Margin").setValue(0);
var fm = po.property("ADBE Text First Margin");
fm.setValueAtTime(0, 0);
fm.setValueAtTime(3 + 1 / fps, 512); // 0:00:03:01 at 23.976 fps
// Keyframes left linear (the recipe's diamond icons look linear).

return { comp: c.name, id: c.id, layers: c.numLayers, chars: str.length, fontSize: docProp.value.fontSize, font: docProp.value.font, radius: r, pitch: pitch };
