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
// - font name "Helvetica" exists (SF Pro may not); args.font overrides
$.evalFile(args.prelude);

var c = P.freshComp("09 typewriter rewrite", 1080, 1920, 24, 6, [0.88, 0.88, 0.89]);
var font = args.font || "Helvetica"; // ASSUMED: stand-in for SF Pro Regular
var typeStart = 0.8; // ASSUMED: recipe gives no seconds

// Ground
P.solid(c, "ground", [0.88, 0.88, 0.89]);

// Card: pale rounded rect (stand-in for the card from earlier tips)
var card = P.shape(c, "card");
var cont = P.contents(card);
var rect = cont.addProperty("ADBE Vector Shape - Rect");
rect.property("ADBE Vector Rect Size").setValue([900, 1000]);
rect.property("ADBE Vector Rect Position").setValue([540, 900]);
rect.property("ADBE Vector Rect Roundness").setValue(50);
var fill = P.contents(card).addProperty("ADBE Vector Graphic - Fill");
fill.property("ADBE Vector Fill Color").setValue([1, 1, 1, 1]);
P.tf(card.layer, "ADBE Anchor Point").setValue([0, 0]);
P.tf(card.layer, "ADBE Position").setValue([0, 0]);

// Traffic-light dots
var dots = P.shape(c, "dots");
var dcols = [[1, 0.37, 0.34], [1, 0.74, 0.18], [0.16, 0.79, 0.25]];
var i, dg, e, f;
for (i = 0; i < 3; i++) {
  e = P.contents(dots).addProperty("ADBE Vector Shape - Ellipse");
  e.property("ADBE Vector Ellipse Size").setValue([28, 28]);
  e.property("ADBE Vector Ellipse Position").setValue([150 + i * 50, 450]);
  f = P.contents(dots).addProperty("ADBE Vector Graphic - Fill");
  f.property("ADBE Vector Fill Color").setValue([dcols[i][0], dcols[i][1], dcols[i][2], 1]);
}
P.tf(dots.layer, "ADBE Anchor Point").setValue([0, 0]);
P.tf(dots.layer, "ADBE Position").setValue([0, 0]);

// Heading "Notes"
var head = c.layers.addBoxText([700, 100]);
var hp = head.property("ADBE Text Properties").property("ADBE Text Document");
var hd = hp.value;
hd.resetCharStyle();
hd.fontSize = 64;
hd.font = font;
hd.fillColor = [0.07, 0.07, 0.08];
hd.applyFill = true;
hd.justification = ParagraphJustification.LEFT_JUSTIFY;
hp.setValue(hd);
hp.setValue("Notes");
head.name = "heading";
P.tf(head, "ADBE Position").setValue([170, 560]);

// Typed block: paragraph (box) text, left aligned
var tx = c.layers.addBoxText([700, 220]);
var tp = tx.property("ADBE Text Properties").property("ADBE Text Document");
var td = tp.value;
td.resetCharStyle();
td.fontSize = 52;
td.font = font;
td.fillColor = [0.22, 0.22, 0.24];
td.applyFill = true;
td.justification = ParagraphJustification.LEFT_JUSTIFY;
tp.setValue(td);
tp.setValue("Video script\rThis video will be about");
tx.name = "typed text";
P.tf(tx, "ADBE Position").setValue([170, 680]);

// SUBSTITUTE: the stock preset "Blinking Cursor Typewriter Console" (Effects & Presets) stands in as
// expression controls with the preset's names + a Source Text expression that types and blinks a "|" cursor.
var fx1 = P.effect(tx, "ADBE Slider Control");
fx1.name = "Animation";
var fx2 = P.effect(tx, "ADBE Checkbox Control");
fx2.name = "Cursor On/Off";
var fx3 = P.effect(tx, "ADBE Slider Control");
fx3.name = "Cursor Blink Speed";
var fxp = tx.property("ADBE Effect Parade");
fxp.property("Cursor On/Off").property(1).setValue(1);
fxp.property("Cursor Blink Speed").property(1).setValue(4);
// Cursor Shape: Vertical Bar is the only shape built (the "|" character)
var ex = 'var s = value;\r' +
  'var n = Math.round(s.length * effect("Animation")(1) / 100);\r' +
  'var out = s.substr(0, n);\r' +
  'if (effect("Cursor On/Off")(1) == 1 && Math.floor(time * effect("Cursor Blink Speed")(1)) % 2 == 0) out += "|";\r' +
  'out;';
tx.property("ADBE Text Properties").property("ADBE Text Document").expression = ex;

// Slider keys: up, back to almost nothing, up again
var sl = tx.property("ADBE Effect Parade").property("Animation").property(1);
sl.setValueAtTime(typeStart, 0);
sl.setValueAtTime(2.0, 100);
sl.setValueAtTime(2.8, 8);   // ASSUMED: "almost to nothing"
sl.setValueAtTime(4.0, 100);
var ez = [new KeyframeEase(0, 33)];
for (i = 1; i <= 4; i++) sl.setTemporalEaseAtKey(i, ez, ez); // Easy Ease

// Opacity animator by words
var anims = tx.property("ADBE Text Properties").property("ADBE Text Animators");
var an = anims.addProperty("ADBE Text Animator");
an = tx.property("ADBE Text Properties").property("ADBE Text Animators").property(an.propertyIndex);
an.property("ADBE Text Animator Properties").addProperty("ADBE Text Opacity");
an = tx.property("ADBE Text Properties").property("ADBE Text Animators").property(1);
an.property("ADBE Text Animator Properties").property("ADBE Text Opacity").setValue(50);
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
var F = [420, 700];
var k = 1.57;
sc.setValueAtTime(tPush, [100, 100]);
sc.setValueAtTime(tPush + 1 / 24, [157, 157]);
p.setValueAtTime(tPush, [0, 0]);
p.setValueAtTime(tPush + 1 / 24, [F[0] * (1 - k), F[1] * (1 - k)]);
p.setValueAtTime(5.6, [F[0] * (1 - k) - 40, F[1] * (1 - k)]); // ASSUMED drift, scaled from 108 px of 3840
// Hold keys on the first keys: the move is a cut
sc.setInterpolationTypeAtKey(1, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD);
p.setInterpolationTypeAtKey(1, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD);

return { comp: c.name, id: c.id, layers: c.numLayers };
