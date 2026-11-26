// Technique 09: typed-on note text that deletes and retypes, word-by-word opacity fade, hold-key null push.
// VERIFY:
// - addBoxText([w,h]) returns paragraph text with left justification when set via TextDocument.justification
// - match names "ADBE Slider Control", "ADBE Checkbox Control" via P.effect; their inner property indexes (1) work with effect("x")(1)
// - Source Text expression using `value` and `\r` line break behaves as a string
// - Animator match names: "ADBE Text Animators", "ADBE Text Animator", "ADBE Text Animator Properties", "ADBE Text Opacity", "ADBE Text Selectors"
// - Range selector: "ADBE Text Selector", Start "ADBE Text Percent Start", Advanced group "ADBE Text Range Advanced", Based On "ADBE Text Range Type2" (enum Words = 3)
// - Animator Opacity property value 50 is in percent
// - setValue on the Opacity animator after addProperty needs a fresh fetch
// - KeyframeEase / HOLD interpolation via setInterpolationTypeAtKey(k, HOLD, HOLD) on Position and Scale
// - Rectangle path roundness match name "ADBE Vector Rect Roundness"; shape layer position/anchor [0,0] set explicitly
// - Parenting by `.parent =` keeps values (both nulls/card are identity, so no jump expected)
// - Box text position is the box centre (boxTextPos [-w/2,-h/2]), so set x = left + w/2
// - font name "Helvetica" exists (SF Pro may not); args.font overrides
$.evalFile(args.prelude);

var c = P.freshComp("09 typewriter rewrite", 1080, 1920, 24, 6, [0.88, 0.88, 0.89]);
var font = args.font || "Helvetica"; // ASSUMED: stand-in for SF Pro Regular
var typeStart = 0.8; // ASSUMED: recipe gives no seconds

// Ground
var artFolder = null, ai;
for (ai = 1; ai <= app.project.numItems; ai++) { if (app.project.item(ai) instanceof FolderItem && app.project.item(ai).name == "art 09") artFolder = app.project.item(ai); }
if (!artFolder) artFolder = app.project.items.addFolder("art 09");
var bdItem = null;
for (ai = 1; ai <= artFolder.numItems; ai++) { if (artFolder.item(ai).name == "backdrop.png") bdItem = artFolder.item(ai); }
if (!bdItem) { bdItem = app.project.importFile(new ImportOptions(new File(args.art + "/backdrop.png"))); bdItem.parentFolder = artFolder; }
var ground = c.layers.add(bdItem);
ground.name = "Ground";
ground.property("ADBE Transform Group").property("ADBE Position").setValue([540, 960]);

// Card
var card = P.shape(c, "card");
var cont = P.contents(card);
var rect = cont.addProperty("ADBE Vector Shape - Rect");
rect.property("ADBE Vector Rect Size").setValue([702, 900]);
rect.property("ADBE Vector Rect Position").setValue([540, 960]);
rect.property("ADBE Vector Rect Roundness").setValue(36);
var fill = P.contents(card).addProperty("ADBE Vector Graphic - Fill");
fill.property("ADBE Vector Fill Color").setValue([1, 1, 1, 1]);
P.tf(card.layer, "ADBE Anchor Point").setValue([0, 0]);
P.tf(card.layer, "ADBE Position").setValue([0, 0]);

// Card shadow: Drop Shadow effect on the card (a blurred shape layer clipped at its own bounds)
var ds = P.effect(card.layer, "ADBE Drop Shadow");
ds.property("ADBE Drop Shadow-0002").setValue(30.6); // opacity 12 % (0-255 scale)
ds.property("ADBE Drop Shadow-0003").setValue(180);
ds.property("ADBE Drop Shadow-0004").setValue(36);
ds.property("ADBE Drop Shadow-0005").setValue(70);

// Traffic-light dots
var dots = P.shape(c, "dots");
var dcols = [[1, 0.37, 0.34], [1, 0.74, 0.18], [0.16, 0.79, 0.25]];
var i, dg, e, f;
for (i = 0; i < 3; i++) {
  e = P.contents(dots).addProperty("ADBE Vector Shape - Ellipse");
  e.property("ADBE Vector Ellipse Size").setValue([20, 20]);
  e.property("ADBE Vector Ellipse Position").setValue([235 + i * 38, 560]);
  f = P.contents(dots).addProperty("ADBE Vector Graphic - Fill");
  f.property("ADBE Vector Fill Color").setValue([dcols[i][0], dcols[i][1], dcols[i][2], 1]);
}
P.tf(dots.layer, "ADBE Anchor Point").setValue([0, 0]);
P.tf(dots.layer, "ADBE Position").setValue([0, 0]);

// Heading "Notes"
var head = c.layers.addBoxText([560, 100]);
var hp = head.property("ADBE Text Properties").property("ADBE Text Document");
var hd = hp.value;
hd.resetCharStyle();
hd.fontSize = 72;
hd.font = font;
hd.fillColor = [0.07, 0.07, 0.08];
hd.applyFill = true;
hd.justification = ParagraphJustification.LEFT_JUSTIFY;
hp.setValue(hd);
hp.setValue("Notes");
head.name = "heading";
P.tf(head, "ADBE Position").setValue([522, 662]);

// Typed block: paragraph (box) text, left aligned
var tx = c.layers.addBoxText([560, 220]);
var tp = tx.property("ADBE Text Properties").property("ADBE Text Document");
var td = tp.value;
td.resetCharStyle();
td.fontSize = 40;
td.leading = 50;
td.autoLeading = false;
td.font = font;
td.fillColor = [0.22, 0.22, 0.24];
td.applyFill = true;
td.justification = ParagraphJustification.LEFT_JUSTIFY;
tp.setValue(td);
tp.setValue("Video script\rThis video will be about");
tx.name = "typed text";
P.tf(tx, "ADBE Position").setValue([522, 842]);

// Real stock preset "Blinking Cursor Typewriter Console" (Text > Animate In), applied to the text layer.
var presetFile = new File(args.preset || "/Applications/Adobe After Effects 2027/Presets/Text/Animate In/Blinking Cursor Typewriter Console.ffx");
tx.applyPreset(presetFile);
var fxp = tx.property("ADBE Effect Parade");
var sl = fxp.property("Animation").property(1);
while (sl.numKeys > 0) sl.removeKey(1);
sl.setValueAtTime(typeStart, 0);
sl.setValueAtTime(2.0, 100);
sl.setValueAtTime(2.8, 8);   // ASSUMED: "almost to nothing"
sl.setValueAtTime(4.0, 100);
var ez = [new KeyframeEase(0, 33)];
for (i = 1; i <= 4; i++) sl.setTemporalEaseAtKey(i, ez, ez); // Easy Ease
var presetInfo = [];
for (i = 1; i <= fxp.numProperties; i++) presetInfo.push(fxp.property(i).name + ":" + fxp.property(i).matchName);
var anims0 = tx.property("ADBE Text Properties").property("ADBE Text Animators");
for (i = 1; i <= anims0.numProperties; i++) presetInfo.push("animator " + i + ":" + anims0.property(i).name);
presetInfo.push("srcExpr:" + tx.property("ADBE Text Properties").property("ADBE Text Document").expression.substr(0, 80));

// Opacity animator by words
var anims = tx.property("ADBE Text Properties").property("ADBE Text Animators");
var an = anims.addProperty("ADBE Text Animator");
var anIdx = an.propertyIndex;
an = tx.property("ADBE Text Properties").property("ADBE Text Animators").property(anIdx);
an.property("ADBE Text Animator Properties").addProperty("ADBE Text Opacity");
an = tx.property("ADBE Text Properties").property("ADBE Text Animators").property(anIdx);
an.property("ADBE Text Animator Properties").property("ADBE Text Opacity").setValue(50);
if (an.property("ADBE Text Selectors").numProperties == 0) an.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
var rs = an.property("ADBE Text Selectors").property(1);
rs.property("ADBE Text Range Advanced").property("ADBE Text Range Type2").setValue(3); // Words
var st = rs.property("ADBE Text Percent Start");
st.setValueAtTime(typeStart, 0);
st.setValueAtTime(typeStart + 0.64, 100); // ASSUMED later value: recipe unknown
st.setTemporalEaseAtKey(1, ez, ez);
st.setTemporalEaseAtKey(2, [new KeyframeEase(0, 75)], [new KeyframeEase(0, 75)]); // stronger ease

// Trim so no cursor shows before typing (Alt+[)
tx.inPoint = typeStart;

// Null chain: Null 2 (root, keyed) <- Null 1 <- card <- text, heading, dots
var n1 = c.layers.addNull();
n1.name = "Null 1";
var n2 = c.layers.addNull();
n2.name = "Null 2";
P.tf(n1, "ADBE Anchor Point").setValue([0, 0]);
P.tf(n1, "ADBE Position").setValue([0, 0]);
P.tf(n2, "ADBE Anchor Point").setValue([0, 0]);
P.tf(n2, "ADBE Position").setValue([0, 0]);
n1.parent = n2;
card.layer.parent = n1;
dots.layer.parent = card.layer;
head.parent = card.layer;
tx.parent = card.layer;

// Push: zoom about the text (focus F), scale 100 -> 157 (the recipe's 300 -> 472 ratio), then a small drift left
var tPush = 4.2; // ASSUMED
var p = P.tf(n2, "ADBE Position");
var sc = P.tf(n2, "ADBE Scale");
var F = [480, 790];
var k = 1.57;
sc.setValueAtTime(tPush, [100, 100]);
sc.setValueAtTime(tPush + 1 / 24, [157, 157]);
p.setValueAtTime(tPush, [0, 0]);
p.setValueAtTime(tPush + 1 / 24, [F[0] * (1 - k), F[1] * (1 - k)]);
p.setValueAtTime(5.6, [F[0] * (1 - k) - 40, F[1] * (1 - k)]); // ASSUMED drift, scaled from 108 px of 3840
// Hold keys on the first keys: the move is a cut
sc.setInterpolationTypeAtKey(1, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD);
p.setInterpolationTypeAtKey(1, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD);

return { comp: c.name, id: c.id, layers: c.numLayers, presetInfo: presetInfo };
