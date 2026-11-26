// Technique 04: stagger the groups of one notification card by sliding whole layer bars later (logo group 2 f, text group 4 f at 30 fps).
// Each group = a null plus its child layers, every null keyed (drop + scale) with the bounce expression; keys travel with the bars (layer.startTime).
// "Before" frame: run with args.logoOffset = 0 and args.textOffset = 0 (offsets are in frames; the stagger is not an effect that can be switched off).
// VERIFY: app.fonts.getFontsByPostScriptName exists and returns Font objects with .isSubstitute (needs AE 24+); PostScript names "InterTight-SemiBold", "InterTight-Regular", fallback "Inter-ExtraBold"
// VERIFY: "ADBE Box Blur2" is Fast Box Blur; properties "Blur Radius"
// VERIFY: "ADBE Vector Rect Size", "ADBE Vector Rect Roundness", "ADBE Vector Shape - Rect", "ADBE Vector Graphic - Fill", "ADBE Vector Fill Color"
// VERIFY: assigning layer.parent in a script does NOT move the child (values kept); here the group nulls have anchor = position = pivot and sit at rest, so either way nothing jumps
// VERIFY: setting layer.startTime after keys exist moves the keys with the layer (layer-time keys), and setting inPoint afterwards only trims the bar start
// VERIFY: expression key(n).time / time / velocityAtTime stay consistent when the layer's startTime is not 0 (the expression assumes they share one clock)
// VERIFY: the bounce expression pasted on Scale and Position of a null that has a parent null works as usual
// VERIFY: layer.inPoint assignment after startTime accepts a value greater than the old inPoint
// VERIFY: args.artDir holds wallpaper.png AND app-icon.png (or args.art = wallpaper path and args.icon = icon path)
// VERIFY: ParagraphJustification.LEFT_JUSTIFY / RIGHT_JUSTIFY; TextDocument.font assignment by PostScript name
// VERIFY: null.enabled = false still lets the null be a parent and carry keys
$.evalFile(args.prelude);
var K = 0.72; // tutorial card 1350 px -> 972 px
var FPS = 30;
var T0 = 18 / FPS; // ASSUMED: the card's keys start 0.6 s in so the start pose is held first (the played preview holds about 0.6 s); layer bars still start at 0
var logoOff = (args.logoOffset !== undefined) ? args.logoOffset : 2; // frames
var textOff = (args.textOffset !== undefined) ? args.textOffset : 4; // frames

var c = P.freshComp("04 staggered element offsets", 1080, 1920, FPS, 5, [250 / 255, 250 / 255, 250 / 255]);

// ---- art
var wpPath = args.art ? args.art : (args.artDir + "/wallpaper.png");
var icPath = args.icon ? args.icon : (args.artDir + "/app-icon.png");
var wpFile = new File(wpPath);
var icFile = new File(icPath);
if (!wpFile.exists) throw new Error("wallpaper not found: " + wpPath);
if (!icFile.exists) throw new Error("icon not found: " + icPath);
var artFolder = null, fi2;
for (fi2 = 1; fi2 <= app.project.numItems; fi2++) { if (app.project.item(fi2) instanceof FolderItem && app.project.item(fi2).name === "art 04") artFolder = app.project.item(fi2); }
if (!artFolder) artFolder = app.project.items.addFolder("art 04");
var wpItem = app.project.importFile(new ImportOptions(wpFile));
wpItem.parentFolder = artFolder;
var wp = c.layers.add(wpItem);
wp.name = "wallpaper";
P.tf(wp, "ADBE Position").setValue([540, 960]);

// ---- card geometry (recipe 01 values x 0.72)
var W = 1350 * K, H = 315 * K; // 972 x 227
var ROUND = 79; // lead notes: Roundness 79 at the 972 px card (corner radius about 0.33 of height)
var CX = 540, CY = 1920 * 0.35; // 672
var LEFT = CX - W / 2; // 54

function pill(name, withFill, strokeColor, strokeW) {
  var sh = P.shape(c, name);
  P.contents(sh).addProperty("ADBE Vector Shape - Rect");
  P.contents(sh).property("ADBE Vector Shape - Rect").property("ADBE Vector Rect Size").setValue([W, H]);
  P.contents(sh).property("ADBE Vector Shape - Rect").property("ADBE Vector Rect Roundness").setValue(ROUND);
  if (withFill) {
    var f = P.contents(sh).addProperty("ADBE Vector Graphic - Fill");
    var fi = f.propertyIndex;
    P.contents(sh).property(fi).property("ADBE Vector Fill Color").setValue([0, 0, 0, 1]);
  }
  if (strokeW) P.stroke(sh, strokeColor, strokeW, 1);
  P.tf(sh.layer, "ADBE Position").setValue([CX, CY]);
  return sh.layer;
}

// ---- fonts
function pickFont(ps, fallbackPs) {
  var a = app.fonts.getFontsByPostScriptName(ps);
  if (a && a.length > 0 && !a[0].isSubstitute) return ps;
  return fallbackPs;
}
var fSemi = pickFont("InterTight-SemiBold", "Inter-ExtraBold"); // Inter Tight stands in for SF Pro
var fReg = pickFont("InterTight-Regular", "Inter-Regular");

// Left- or right-aligned text with the anchor on the aligned edge, mid-height.
function line(str, size, color, font, x, y, right, name) {
  var l = c.layers.addText(str);
  var prop = l.property("ADBE Text Properties").property("ADBE Text Document");
  var d = prop.value;
  d.resetCharStyle();
  d.fontSize = size;
  d.fillColor = color;
  d.applyFill = true;
  d.applyStroke = false;
  d.font = font;
  d.justification = right ? ParagraphJustification.RIGHT_JUSTIFY : ParagraphJustification.LEFT_JUSTIFY;
  prop.setValue(d);
  var r = l.sourceRectAtTime(0, false);
  P.tf(l, "ADBE Anchor Point").setValue([right ? r.left + r.width : r.left, r.top + r.height / 2]);
  P.tf(l, "ADBE Position").setValue([x, y]);
  l.name = name;
  return l;
}

// ---- layers, bottom to top
var depth = pill("Depth", true, null, 0);
P.tf(depth, "ADBE Opacity").setValue(5);

var note = pill("Notification", true, null, 0);
note.adjustmentLayer = true;
var fx = P.effect(note, "ADBE Box Blur2");
fx.property("Blur Radius").setValue(30 * K);

var stroke = pill("Stroke", false, [0.8, 0.8, 0.8, 1], 4 * K); // ASSUMED: as in the 01 build

// Logo: the supplied icon, 0.60 of the card height across, centre 0.12 of the card width in from the left edge.
var LOGO_X = LEFT + 0.12 * W; // 171
var icItem = app.project.importFile(new ImportOptions(icFile));
icItem.parentFolder = artFolder;
var logo = c.layers.add(icItem);
logo.name = "Logo";
var logoPx = 0.60 * H; // 136
P.tf(logo, "ADBE Scale").setValue([logoPx / 954 * 100, logoPx / 954 * 100]);
P.tf(logo, "ADBE Position").setValue([LOGO_X, CY]);

var TX = LOGO_X + logoPx / 2 + 0.05 * W; // ASSUMED: text starts a gap of 5 % of the card width right of the disc
var title = line("Larkvault", 40, [28 / 255, 28 / 255, 30 / 255], fSemi, TX, CY - 37, false, "Title");
var sub = line("Backup complete. 1,418 photos are safe.", 31, [58 / 255, 58 / 255, 60 / 255], fReg, TX, CY + 20, false, "Subtitle");
var now = line("now", 27, [142 / 255, 142 / 255, 147 / 255], fReg, LEFT + W - 0.05 * W, CY - 0.30 * H, true, "NOW label");

// ---- nulls (anchor = position = the group's pivot, so children keep their comp coordinates at rest)
function makeNull(name, px, py) {
  var n = c.layers.addNull(c.duration);
  n.name = name;
  P.tf(n, "ADBE Anchor Point").setValue([px, py]);
  P.tf(n, "ADBE Position").setValue([px, py]);
  n.enabled = false; // SUBSTITUTE: a null draws nothing; hidden so its box stays out of the render
  return n;
}
var cardNull = makeNull("Card Null", CX, CY);
var logoNull = makeNull("Logo Null", LOGO_X, CY);
var textNull = makeNull("Text Null", TX + 200, CY);
var master = makeNull("Master Null", 0, 0); // identity: position 0,0 anchor 0,0; top of the stack, never keyed
// addNull puts each new null on top, so the master ends up first.

// ---- parenting
stroke.parent = cardNull; note.parent = cardNull; depth.parent = cardNull;
logo.parent = logoNull;
title.parent = textNull; sub.parent = textNull; now.parent = textNull;
cardNull.parent = master; logoNull.parent = master; textNull.parent = master;

// ---- bounce expression (amp .04, freq 1.8, decay 3, time_max 3), the standard inertial bounce
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

// Two keys 4 f apart; the start pose is above and smaller. Plain (linear) keys: no ease given in the recipe.
function drop(n, px, py, up, s0, dx) {
  var pos = P.tf(n, "ADBE Position");
  pos.setValueAtTime(T0, [px + (dx || 0), py - up]);
  pos.setValueAtTime(T0 + 4 / FPS, [px, py]);
  var sc = P.tf(n, "ADBE Scale");
  sc.setValueAtTime(T0, [s0, s0]);
  sc.setValueAtTime(T0 + 4 / FPS, [100, 100]);
  P.tf(n, "ADBE Position").expression = EXPR;
  P.tf(n, "ADBE Scale").expression = EXPR;
}
// Start poses (recipe 03/04 figures x 0.72):
drop(cardNull, CX, CY, 240 * K, 61);       // card: 240 comp px above, 61 % scale (recipe 04)
// logo path starts at the card's upper-left corner (recipe 04 layout): x = card left at 61 % + 0.12 of its width, y = 82 px above the card centre
drop(logoNull, LOGO_X, CY, 173 + 82, 84, (CX - W * 0.61 / 2 + 0.12 * W * 0.61) - LOGO_X);
drop(textNull, TX + 200, CY, 220 * K, 80); // ASSUMED: text 220 comp px above (about 110 picture px, recipe 04 layout), 80 % (recipe 03)

// ---- the stagger: slide whole bars later; keys travel with them. Card group and master stay at 0.
function slide(layers, frames) {
  var i, l;
  for (i = 0; i < layers.length; i++) {
    l = layers[i];
    if (frames > 0) l.startTime = frames / FPS;
    l.outPoint = c.duration;
    // Hide the group until its bar starts: the first frame the bar shows is the shifted start of the keys (T0 + offset).
    l.inPoint = T0 + frames / FPS;
  }
}
// ASSUMED: logo and text stay hidden during the 0.6 s hold (bar trimmed to start with the keys), also at offset 0 (the "before" run).
slide([logoNull, logo], logoOff);
slide([textNull, title, sub, now], textOff);

return { comp: c.name, id: c.id, layers: c.numLayers, fontName: fSemi, fontMsg: fReg, logoOffsetFrames: logoOff, textOffsetFrames: textOff };
