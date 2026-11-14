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
// Rebuild with artwork (2026-11-14): art from PROOF/19/art (brief.md). Pass args.artLib (art.jsx) and args.artDir.
// Layers, bottom to top: Backdrop (charcoal plate, 75 %), Grain (adjustment layer, Noise 4 %, moves every frame),
// title (Archivo Black, warm white, tilted), ring text (the technique, unchanged: mask mode None, Path Options,
// First Margin 0 -> 512). Ring phrase with a centred dot between repeats; size from the brief's 3.2 % cap height and
// tracking fitted so the three repeats fill the circle.
$.evalFile(args.artLib);
var ARTDIR = args.artDir;

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
var c = P.freshComp("19 text on a path", 1920, 1080, fps, 5, ART.hex("#0C0C0B"));
(function () { var j, it; for (j = app.project.numItems; j >= 1; j--) { it = app.project.item(j); if (it instanceof FootageItem && it.usedIn.length === 0 && it.name === "19 grain") it.remove(); } })();
var WARM = ART.hex("#F2F0EB");
var bd = c.layers.add(ART.footage(ARTDIR, "backdrop.png", "art 19"));
bd.name = "Backdrop";
P.tf(bd, "ADBE Scale").setValue([75, 75]);
var gr = P.solid(c, "19 grain", [1, 1, 1]);
gr.name = "Grain";
gr.adjustmentLayer = true;
var nz = P.effect(gr, "ADBE Noise");
var nzMiss = ART.setFx(nz, { "Amount of Noise": args.grain !== undefined ? args.grain : 4, "Noise Type": 0 /* the "Use Color Noise" checkbox */ });

// Layout (recipe's layout: line, shares of the whole comp): ring of type about 0.76 of the comp height across its outside
// (821 px), centred; ring letters about 4 % of the height tall (43 px); three repeats with about one word-space between;
// title block about 25 % of the width by 24 % of the height, centred at 51 % / 51 %, tilted 10-13 degrees anticlockwise.
var OUTER = args.outer || 821;
var CAP = 0.70; // cap height of the ring font as a share of its size (Montserrat Black; Poppins Black is not installed here)

// Example content: the bold two-line title in the centre (not part of the technique).
var title = P.text(c, "MAKE\rIT MOVE", { size: 100, font: args.titleFont || "ArchivoBlack-Regular", color: WARM, name: "title" });
(function () {
  var prop = title.property("ADBE Text Properties").property("ADBE Text Document");
  var rr = title.sourceRectAtTime(0, false);
  var d0 = prop.value;
  // Brief: capitals about 9 % of the height (97 px). Measure the cap height of one line at 100 px and scale.
  d0.text = "MAKE"; prop.setValue(d0);
  var capH = title.sourceRectAtTime(0, false).height;
  d0 = prop.value; d0.text = "MAKE\rIT MOVE";
  d0.fontSize = Math.round(100 * (args.titleCap || 0.072 * 1080) /* run: the brief's 9 % made the block 640 px wide and touched the ring; 7.2 % keeps the layout's ~25 % width */ / capH * 10) / 10;
  d0.autoLeading = false; d0.leading = Math.round(d0.fontSize * 0.98);
  prop.setValue(d0);
  rr = title.sourceRectAtTime(0, false);
  P.tf(title, "ADBE Anchor Point").setValue([rr.left + rr.width / 2, rr.top + rr.height / 2]);
  P.tf(title, "ADBE Position").setValue([0.51 * c.width, 0.51 * c.height]);
  P.tf(title, "ADBE Rotate Z").setValue(-11.5);
})();

// 1. The repeated phrase on one line.
// ASSUMED: the phrase (recipe: "a short all-caps phrase repeated three times"; exact phrase not given).
var phrase = args.phrase || "MOTION NEVER SLEEPS \u2022 " /* 22 characters: at the brief size three repeats fill the ring near tracking 125 */;
var str = phrase + phrase + phrase;
var t = c.layers.addText(str);
t.name = "ring text";
var docProp = t.property("ADBE Text Properties").property("ADBE Text Document");
var d = docProp.value;
d.resetCharStyle();
d.font = args.font || "Montserrat-Black"; // SUBSTITUTE: the script's Poppins-Black is not installed
// Recipe: 35 px raised to 48.7 px "so the phrase fills the circle". Here the size is found the same way: letters about 4 %
// of the height (61 px), then corrected so three repeats exactly fill the path (see below).
d.fontSize = args.size || Math.round(0.032 * 1080 / CAP * 10) / 10; // brief: capitals 3.2 % of the height
d.tracking = 125;
d.fillColor = WARM;
d.applyFill = true;
d.applyStroke = false;
d.justification = ParagraphJustification.LEFT_JUSTIFY; // ASSUMED: left; the recipe does not give the paragraph alignment
docProp.setValue(d);
// Fit: keep the size, find the tracking at which three repeats fill the circle. One repeat's pitch is measured on the
// straight line (six repeats minus three, so the trailing space counts); pitch is linear in tracking.
var r, w3, w6, pitch, p1, p2, n = phrase.length;
function measure() {
  d = docProp.value; d.text = str; docProp.setValue(d); w3 = t.sourceRectAtTime(0, false).width;
  d = docProp.value; d.text = str + str; docProp.setValue(d); w6 = t.sourceRectAtTime(0, false).width;
  d = docProp.value; d.text = str; docProp.setValue(d);
  return (w6 - w3) / 3;
}
r = OUTER / 2 - CAP * docProp.value.fontSize;
p1 = measure();
var target = 2 * Math.PI * r / 3, trk = 125;
if (!args.tracking) {
  trk = 125 + (target - p1) / (n * docProp.value.fontSize / 1000);
  d = docProp.value; d.tracking = Math.round(trk); docProp.setValue(d);
} else { d = docProp.value; d.tracking = args.tracking; docProp.setValue(d); }
pitch = measure();
r = args.radius || (OUTER / 2 - CAP * docProp.value.fontSize);
// Put the text layer's origin at the comp centre so the mask can be drawn round [0,0].
P.tf(t, "ADBE Anchor Point").setValue([0, 0]);
P.tf(t, "ADBE Position").setValue([c.width / 2, c.height / 2]);

// The recipe's layer also carries a Fill effect set to white.
var fill = P.effect(t, "ADBE Fill");
fill.property("ADBE Fill-0002").setValue(WARM.concat([1]));

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

title.moveToBeginning(); t.moveToBeginning();
return { comp: c.name, id: c.id, layers: c.numLayers, chars: str.length, fontSize: docProp.value.fontSize, font: docProp.value.font, tracking: docProp.value.tracking, radius: r, pitch: pitch, target: target, titleFont: title.property("ADBE Text Properties").property("ADBE Text Document").value.font, titleSize: title.property("ADBE Text Properties").property("ADBE Text Document").value.fontSize, noiseMissing: nzMiss };
