// Technique 08: three popping window dots (springy Scale) and a faint feathered grid panel inside a rounded card.
// VERIFY: effect display name "Grid" (match "ADBE Grid") and its property display names "Size From", "Width", "Border", "Color", "Blending Mode"
// VERIFY: Grid "Size From" dropdown index 2 = Width Slider
// VERIFY: Grid "Blending Mode" dropdown index 1 = None (assumed first item)
// VERIFY: Grid "Width" is accepted as a plain number (slider-type property)
// VERIFY: layers.precompose([index], name, true) with one layer, moves effects into the new comp; the new layer keeps the name given
// VERIFY: layer.setTrackMatte(layer, TrackMatteType.ALPHA) exists (AE 2023+) and works with a matte layer BELOW the target
// VERIFY: after setTrackMatte the card layer stays visible (I set card.enabled = true afterwards)
// VERIFY: masks: "ADBE Mask Atom" adds; maskMode = MaskMode.SUBTRACT; "ADBE Mask Feather" takes [x,y]; mask.inverted = false
// VERIFY: setting layer.parent leaves local position values unchanged (child coordinates are then relative to the card's origin = card centre)
// VERIFY: expression with velocityAtTime on a 2-D Scale returns an array and array*scalar works
// VERIFY: font "Poppins-Medium" exists (args.font overrides); PostScript name
// VERIFY: text justification set to LEFT_JUSTIFY via TextDocument after P.text, and sourceRectAtTime left then equals 0
// VERIFY: layer.inPoint assignment trims the dot's start to its first key
$.evalFile(args.prelude);

// remove earlier precomp so the script can be re-run
var i, it;
for (i = app.project.numItems; i >= 1; i--) {
  it = app.project.item(i);
  if (it instanceof CompItem && it.name === "08 grid solid") it.remove();
}

var W = 1080, H = 1920;
var c = P.freshComp("08 bouncing dots and soft grid panel", W, H, 24, 4, [0.94, 0.94, 0.94]);

// ground: pale grey F0F0F0
var artFolder = null, ai;
for (ai = 1; ai <= app.project.numItems; ai++) { if (app.project.item(ai) instanceof FolderItem && app.project.item(ai).name === "art 08") artFolder = app.project.item(ai); }
if (!artFolder) artFolder = app.project.items.addFolder("art 08");
var gf = null;
for (ai = 1; ai <= app.project.numItems; ai++) { if (app.project.item(ai) instanceof FootageItem && app.project.item(ai).name === "ground.png" && app.project.item(ai).parentFolder === artFolder) gf = app.project.item(ai); }
if (!gf) { gf = app.project.importFile(new ImportOptions(new File(args.groundPath || "~/Assets/comp-room-studies/channel-study/tYRvoI04pJk/proof/08/art/ground.png"))); gf.parentFolder = artFolder; }
var groundL = c.layers.add(gf); groundL.name = "ground";

// ---- card: white rounded rectangle, 3 px E2E2E2 stroke
// ASSUMED: card 900 x 1300 (recipe's 65% x 81% is for 16:9; re-framed for 9:16)
var CW = 929, CH = 1421; // brief: 86% x 74% of comp
var card = P.shape(c, "card");
var cardContents = P.contents(card);
var rect = cardContents.addProperty("ADBE Vector Shape - Rect");
rect.property("ADBE Vector Rect Size").setValue([CW, CH]);
rect.property("ADBE Vector Rect Roundness").setValue(37); // 4% of card width // ~4% of picture width scaled
var fill = P.contents(card).addProperty("ADBE Vector Graphic - Fill");
P.contents(card).property("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue([1, 1, 1, 1]);
P.stroke(card, [0.886, 0.886, 0.886, 1], 3, 1);
var cardLayer = card.layer;
P.tf(cardLayer, "ADBE Position").setValue([W / 2, H / 2]);

// ---- grid panel: light grey solid + Grid effect, precomposed, masked, matted by the card
// ASSUMED: solid colour 0.75 grey (recipe: typed value unknown, renders mid-light grey)
var gs = P.solid(c, "grid solid", [0.75, 0.75, 0.75]);
var g = P.effect(gs, "Grid");
g.property("Size From").setValue(2);          // Width Slider
g.property("Width").setValue(84);              // ASSUMED: recipe says 122 shown but final cell ~5.9% of 1920 wide picture; scaled to our card width (113 px * 900/1255)
g = gs.property("ADBE Effect Parade").property(1);
g.property("Border").setValue(5);
g.property("Color").setValue([0.922, 0.922, 0.922, 1]); // EBEBEB
g.property("Blending Mode").setValue(1);       // None
c.layers.precompose([gs.index], "08 grid solid", true);
var grid = c.layer(1);
grid.name = "TECH grid panel";

// two Subtract masks, heavily feathered; shapes placed by me (recipe: "by hand, not given")
// ASSUMED: upper mask edge at y=560, lower mask edge at y=1100 (picture space), feather 500 / 450
function maskRect(layer, name, x0, y0, x1, y1, feather) {
  var m = layer.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
  var idx = m.propertyIndex;
  m = layer.property("ADBE Mask Parade").property(idx);
  var s = new Shape();
  s.vertices = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  s.closed = true;
  m.property("ADBE Mask Shape").setValue(s);
  m.maskMode = MaskMode.SUBTRACT;
  m.inverted = false;
  m.property("ADBE Mask Feather").setValue([feather, feather]);
  m.name = name;
}
maskRect(grid, "upper", -700, -700, 1780, 576, 500);
maskRect(grid, "lower", -700, 1485, 1780, 2600, 450);

// parent to card, then matte; precomp centre sits on the card centre
grid.parent = cardLayer;
P.tf(grid, "ADBE Position").setValue([0, 0]);   // local to card origin (card centre); anchor stays at precomp centre
grid.setTrackMatte(cardLayer, TrackMatteType.ALPHA);
cardLayer.enabled = true;
P.tf(grid, "ADBE Opacity").setValue(40);

// ---- dots
// SUBSTITUTE: the author's "Bounce" button / pinned-comment expression; pasted as an expression on Scale
var bounce = "var amp = 0.04, freq = 1.8, decay = 3;\n" +
  "var n = 0;\n" +
  "if (numKeys > 0) { n = nearestKey(time).index; if (key(n).time > time) n--; }\n" +
  "if (n > 0) {\n" +
  "  var t = time - key(n).time;\n" +
  "  var v = velocityAtTime(key(n).time - thisComp.frameDuration / 10);\n" +
  "  value + v * amp * Math.sin(freq * t * 2 * Math.PI) / Math.exp(decay * t);\n" +
  "} else { value; }";

// ASSUMED: ellipse Size 108 (recipe 43.2 at ~40% = 17 px is tiny on 1080 wide); scale keys 0 -> 40 as recipe's final
// local positions are relative to the card centre: first centre 4.4% of card width in, 4.8% of card height down
var cols = [[0.898, 0.325, 0.294, 1], [0.910, 0.773, 0.278, 1], [0.373, 0.749, 0.416, 1]];
var names = ["red", "yellow", "green"];
var x0 = -CW / 2 + 0.044 * CW;
var y0 = -CH / 2 + 0.048 * CH;
var step = 85; // ~1.97 dot diameters at final scale (recipe: 35.5 px / 18 px)
var t0 = 0.6;  // ASSUMED: dots appear at 0.6 s (recipe: about 7.5 s of a longer comp, after the card grows in; moved earlier)
var d, dot, dl, sc;
for (d = 0; d < 3; d++) {
  dot = P.shape(c, "TECH dot " + names[d]);
  P.ellipse(dot, [108, 108]);
  P.contents(dot).addProperty("ADBE Vector Graphic - Fill");
  P.contents(dot).property("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(cols[d]);
  dl = dot.layer;
  dl.parent = cardLayer;
  P.tf(dl, "ADBE Position").setValue([x0 + d * step, y0]);
  sc = P.tf(dl, "ADBE Scale");
  var ta = t0 + d * 2 / 24; // ~2 frames apart
  sc.setValueAtTime(ta, [0, 0]);
  sc.setValueAtTime(ta + 3 / 24, [40, 40]); // key easing not stated: left linear
  sc = P.tf(dl, "ADBE Scale");
  sc.expression = bounce;
  dl.inPoint = ta; // trimmed to its first key
}

// ---- title under the dots, dark grey, medium weight, left aligned
var title = P.text(c, "Notes", { size: 64, color: [0.227, 0.227, 0.235], font: args.font || "HelveticaNeue-Medium", name: "title" });
var tp = title.property("ADBE Text Properties").property("ADBE Text Document");
var td = tp.value;
td.justification = ParagraphJustification.LEFT_JUSTIFY;
tp.setValue(td);
var r = title.sourceRectAtTime(0, false);
P.tf(title, "ADBE Anchor Point").setValue([r.left, r.top + r.height / 2]);
title.parent = cardLayer;
// left edge ~2.2 diameters from the first dot centre (diameter ~43 px)
P.tf(title, "ADBE Position").setValue([x0 + 95, y0 + 110]);

return { comp: c.name, id: c.id, layers: c.numLayers };
