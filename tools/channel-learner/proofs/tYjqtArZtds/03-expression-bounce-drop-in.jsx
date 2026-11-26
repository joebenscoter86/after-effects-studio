// Technique 3: two-key drop-in that settles with an expression bounce (inertial bounce on Position and Scale).
// A notification card (Larkvault) built from a null hierarchy; each of the three child nulls gets two Position keys,
// two Scale keys and the same bounce expression on both. Card, text and logo are parented to their nulls.
//
// VERIFY:
// - app.fonts.getFontsByPostScriptName exists (AE 2024+) and Inter Tight's PostScript names are "InterTight-SemiBold" / "InterTight-Regular" (variable font instances).
// - Shape matchNames: "ADBE Vector Shape - Rect", "ADBE Vector Rect Size", "ADBE Vector Rect Roundness", "ADBE Vector Graphic - Fill", "ADBE Vector Fill Color", "ADBE Vector Fill Opacity", "ADBE Vector Stroke Opacity".
// - Setting layer.parent before setting local Position: child Position is then read in the parent's space (null anchor set to [0,0], scale 100 at rest, so local = comp - null position).
// - The expression: nearestKey(time).index, velocityAtTime on a 2D Position and on Scale (array + number maths), easeOut(t,0,time_max,1,0) multiplied in.
// - importFile of the two PNGs from args.artDir (or args.art) and reuse of an already imported item by name.
// - addNull(duration) signature, and a Null's anchor point being settable to [0,0].
// - Timeline: keys at 0.5 s (ASSUMED) rather than frame 0 so the drop can be seen after the comp starts.
$.evalFile(args.prelude);

var W = 1080, H = 1920, FPS = 30, DUR = 5;
var K = 0.72;                       // 1350 px tutorial card -> 970 px phone card
var T0 = (args.keyStart !== undefined) ? args.keyStart : 0.5;   // ASSUMED: recipe keys at frame 0; offset so the drop is visible in the proof
var T1 = T0 + 4 / FPS;              // four frames later
var artDir = args.artDir || args.art;

var c = P.freshComp("03 expression bounce drop-in", W, H, FPS, DUR, [0.9, 0.88, 0.92]);

var artFolder = null;
function importArt(name) {
  var i, it, f, io, fp;
  if (!artFolder) {
    for (i = 1; i <= app.project.numItems; i++) {
      it = app.project.item(i);
      if (it instanceof FolderItem && it.name === "art 03") { artFolder = it; break; }
    }
    if (!artFolder) artFolder = app.project.items.addFolder("art 03");
  }
  for (i = 1; i <= artFolder.numItems; i++) {
    if (artFolder.item(i).name === name) return artFolder.item(i);
  }
  f = new File(artDir + "/" + name);
  if (!f.exists) throw new Error("art missing: " + f.fsName);
  io = new ImportOptions(f);
  fp = app.project.importFile(io);
  fp.parentFolder = artFolder;
  return fp;
}

// Candidate for the prelude: a font by PostScript name, skipping substitutes.
function findFont(names) {
  var i, f;
  for (i = 0; i < names.length; i++) {
    f = app.fonts.getFontsByPostScriptName(names[i]);
    if (f.length > 0 && !f[0].isSubstitute) return names[i];
  }
  return null;
}
var semi = findFont(["InterTight-SemiBold", "InterTight-Regular_SemiBold"]);
var reg = findFont(["InterTight-Regular"]);
if (!semi) semi = findFont(["Inter-ExtraBold"]);   // fallback for the name only (noted in build-notes)
if (!reg) reg = findFont(["InterTight-Regular", "Inter-Regular"]);
if (!semi || !reg) throw new Error("Inter Tight / Inter not found");

// --- layout, all in comp pixels (share-of-card figures from the recipe, scaled by K)
var cardW = 970, cardH = Math.round(158 / 676 * cardW);   // 227
var cx = W / 2, cy = Math.round(H * 0.35);                  // card centre, 35 % down
var cardLeft = cx - cardW / 2;
var logoSize = Math.round(0.1405 * cardW);                  // 95 of 676 -> 136
var logoPos = [cardLeft + 0.235 * cardW, cy];
var textLeft = cardLeft + 0.32 * cardW;
var nowRight = cardLeft + 0.82 * cardW;

// --- backdrop
var wall = c.layers.add(importArt("wallpaper.png"));
wall.name = "wallpaper";
wall.property("ADBE Transform Group").property("ADBE Position").setValue([W / 2, H / 2]);

// --- nulls: outer parent, then card / text / logo nulls
function makeNull(name, pos) {
  var n = c.layers.addNull(DUR);
  n.name = name;
  P.tf(n, "ADBE Anchor Point").setValue([0, 0]);
  P.tf(n, "ADBE Position").setValue(pos);
  return n;
}
var outer = makeNull("outer null", [0, 0]);
var textNullPos = [textLeft + 300, cy];
var nCard = makeNull("TECH card null", [cx, cy]);
var nText = makeNull("TECH text null", textNullPos);
var nLogo = makeNull("TECH logo null", logoPos);
nCard.parent = outer; nText.parent = outer; nLogo.parent = outer;

// --- card: rounded rectangle, centred on its null
var card = P.shape(c, "card");
card.layer.parent = nCard;
var cont = P.contents(card);
var rect = cont.addProperty("ADBE Vector Shape - Rect");
rect.property("ADBE Vector Rect Size").setValue([cardW, cardH]);
rect.property("ADBE Vector Rect Roundness").setValue(Math.round(cardH / 3));
var fill = P.contents(card).addProperty("ADBE Vector Graphic - Fill");
var fi = fill.propertyIndex;
P.contents(card).property(fi).property("ADBE Vector Fill Color").setValue([0.96, 0.96, 0.98]);
P.contents(card).property(fi).property("ADBE Vector Fill Opacity").setValue(72);
var si = P.stroke(card, [1, 1, 1, 1], 2.5);
P.contents(card).property(si).property("ADBE Vector Stroke Opacity").setValue(80);
P.tf(card.layer, "ADBE Position").setValue([0, 0]);

// --- text, left aligned from a left edge (comp x), vertically at comp y; parented to the text null
function leftText(str, size, font, color, left, y, name, rightAlign) {
  var t = P.text(c, str, { size: size, font: font, color: color, name: name });
  t.parent = nText;
  var r = t.sourceRectAtTime(0, false);
  var x = rightAlign ? (left - r.width / 2) : (left + r.width / 2);
  P.tf(t, "ADBE Position").setValue([x - textNullPos[0], y - textNullPos[1]]);
  return t;
}
leftText("Larkvault", 44, semi, [0.11, 0.11, 0.118], textLeft, cy - 28, "app name", false);
leftText("Backup complete. 1,418 photos are safe.", 32, reg, [0.227, 0.227, 0.235], textLeft, cy + 26, "message", false);
leftText("now", 28, reg, [0.557, 0.557, 0.576], nowRight, cy - 66, "time label", true);

// --- logo from the shared art, parented to the logo null
var logo = c.layers.add(importArt("app-icon.png"));
logo.name = "logo";
logo.parent = nLogo;
P.tf(logo, "ADBE Position").setValue([0, 0]);
P.tf(logo, "ADBE Anchor Point").setValue([logo.width / 2, logo.height / 2]);
P.tf(logo, "ADBE Scale").setValue([logoSize / logo.width * 100, logoSize / logo.width * 100]);

// --- the technique: two keys, then the pasted expression on Position and on Scale
// The bounce expression word for word, as the recipe quotes it from the video's description (lead correction, lesson 51).
var EXPR = [
  "amp = .04;",
  "freq = 1.8;",
  "decay = 3;",
  "n = 0;",
  "time_max = 3;",
  "",
  "",
  "if (numKeys > 0) {",
  "    n = nearestKey(time).index;",
  "    if (key(n).time > time) {",
  "        n--;",
  "    }",
  "}",
  "",
  "",
  "if (n == 0) {",
  "    t = 0;",
  "} else {",
  "    t = time - key(n).time;",
  "}",
  "",
  "",
  "if (n > 0 && t < time_max) {",
  "    v = velocityAtTime(key(n).time - thisComp.frameDuration / 10);",
  "    ",
  "    // Ease Out Factor (starts at 1, gradually reduces to 0)",
  "    easeFactor = easeOut(t, 0, time_max, 1, 0);",
  "    ",
  "    value + v * amp * Math.sin(freq * t * 2 * Math.PI) / Math.exp(decay * t) * easeFactor;",
  "} else {",
  "    value;",
  "}"
].join("\n");

// args.stage: "card" = the stage the tutorial plays (steps 2-5: card null Position keys + expression only,
// logo and text standing, no Scale keys); "full" (default) = every step, all three nulls, Position and Scale.
var STAGE = args.stage || "full";
function drop(nul, rest, startOffset, startScale, withScale) {
  var pos = P.tf(nul, "ADBE Position");
  pos.setValueAtTime(T0, [rest[0], rest[1] + startOffset]);   // start pose above rest
  pos.setValueAtTime(T1, [rest[0], rest[1]]);
  P.tf(nul, "ADBE Position").expression = EXPR;
  if (withScale) {
    var sc = P.tf(nul, "ADBE Scale");
    sc.setValueAtTime(T0, [startScale, startScale]);
    sc.setValueAtTime(T1, [100, 100]);                           // 100 % inferred
    P.tf(nul, "ADBE Scale").expression = EXPR;
  }
}
var full = (STAGE === "full");
drop(nCard, [cx, cy], -Math.round(150 * K), 60, full);                   // recipe: -150 px, 60 %
if (full) {
  drop(nLogo, logoPos, -Math.round(241 * K), 84, true);                  // recipe: -241 px, 84 %
  drop(nText, textNullPos, -Math.round(150 * K), 80, true);              // ASSUMED: text null start position not read
}

// the outer null is not keyed (the recipe does not settle it)
return { comp: c.name, id: c.id, layers: c.numLayers, font: semi + " / " + reg, keys: [T0, T1], stage: STAGE };
