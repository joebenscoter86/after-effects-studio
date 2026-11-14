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

// Example content: the bold two-line title in the centre (not part of the technique).
P.text(c, "MAKE\rIT MOVE", { size: 120, font: args.titleFont || "Poppins-Bold", color: [1, 1, 1], name: "title" });

// 1. The repeated phrase on one line.
// ASSUMED: phrase and three repeats (recipe: "a short all-caps phrase repeated three times"; exact phrase not given).
var phrase = args.phrase || "STAY CURIOUS • ";
var str = phrase + phrase + phrase;
var t = c.layers.addText(str);
t.name = "ring text";
var docProp = t.property("ADBE Text Properties").property("ADBE Text Document");
var d = docProp.value;
d.resetCharStyle();
d.font = args.font || "Poppins-Black";
d.fontSize = args.size || 48.7; // recipe: 35 px, raised to 48.7 px in step 5
d.tracking = 125;
d.fillColor = [1, 1, 1];
d.applyFill = true;
d.applyStroke = false;
d.justification = ParagraphJustification.LEFT_JUSTIFY; // ASSUMED: left; the recipe does not give the paragraph alignment
docProp.setValue(d);
// Put the text layer's origin at the comp centre so the mask can be drawn round [0,0].
P.tf(t, "ADBE Anchor Point").setValue([0, 0]);
P.tf(t, "ADBE Position").setValue([c.width / 2, c.height / 2]);

// The recipe's layer also carries a Fill effect set to white.
var fill = P.effect(t, "Fill");
fill.property("Color").setValue([1, 1, 1]);

// 2 and 4. Closed circular mask on the text layer, mode None.
// ASSUMED: radius 300 px (recipe: roughly 300 px at 43.5% view, not given).
var r = args.radius || 300;
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

return { comp: c.name, id: c.id, layers: c.numLayers, chars: str.length };
