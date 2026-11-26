// Technique 4: glass button with four CC Light Sweep edge lights and an overshooting bounce on Scale and rectangle Size.
// VERIFY: effect match name "CC Light Sweep" (display name used by P.effect)
// VERIFY: CC Light Sweep property display names: Center, Direction, Shape, Width, Sweep Intensity, Edge Intensity, Edge Thickness, Light Color, Light Reception
// VERIFY: Shape enum: 1 Linear, 2 Smooth, 3 Sharp (Smooth set as 2)
// VERIFY: Light Reception enum: 1 Add, 2 Composite, 3 Cut Out (Add set as 1)
// VERIFY: Light Color is read as [r,g,b] or [r,g,b,a]; I pass 4 values
// VERIFY: Direction 0 vs 180 puts the edge on the intended side; Center is in layer space (layer anchor set so it equals comp space at 100% scale)
// VERIFY: "Glow" match name "ADBE Glow", properties "Glow Threshold", "Glow Radius", "Glow Intensity"; threshold unit (60 vs 0.6 vs 153)
// VERIFY: Effect.name assignment works for renaming to "TECH ..."
// VERIFY: Rect path match names "ADBE Vector Shape - Rect", "ADBE Vector Rect Size", "ADBE Vector Rect Roundness"
// VERIFY: expression on 2D Size/Scale using velocityAtTime returns arrays without error
// VERIFY: setting text.parent keeps the text centred (parent anchor = position = comp centre)
$.evalFile(args.prelude);
var W = 1080, H = 1920, cx = 540, cy = 800; // card in the upper-middle per art brief
var cardW = 900, cardH = 380;
var c = P.freshComp("04 light sweep edge", W, H, 24, 5, [0.01, 0.01, 0.015]);

// Art: ground plate from the brief, in project folder "art 04", bottom layer.
var ground = null, k;
for (k = 1; k <= app.project.numItems; k++) {
  var it = app.project.item(k);
  if (it instanceof FootageItem && it.name == "backdrop.png" && it.parentFolder && it.parentFolder.name == "art 04") { ground = it; break; }
}
if (!ground) {
  var artFolder = app.project.items.addFolder("art 04");
  var io = new ImportOptions(new File("~/Assets/comp-room-studies/channel-study/tYRvoI04pJk/proof/04/art/backdrop.png"));
  ground = app.project.importFile(io);
  ground.parentFolder = artFolder;
}
var gl = c.layers.add(ground);
gl.name = "Ground";
gl.moveToEnd();

// Stand-in for the blue glowing line (recipe 03): vertical, reaches the card's top centre, leaves from the bottom centre.
var line = P.shape(c, "blue line");
P.path(line, [[cx, 0], [cx, cy - cardH / 2]], null, null, false);
P.path(line, [[cx, cy + cardH / 2], [cx, H]], null, null, false);
P.stroke(line, [0.25, 0.5, 1, 1], 4, 2);
P.tf(line.layer, "ADBE Position").setValue([0, 0]); // shape layers start at comp centre; paths here are in comp coordinates
P.tf(line.layer, "ADBE Anchor Point").setValue([0, 0]);
var g1 = P.effect(line.layer, "Glow");
g1.property("Glow Threshold").setValue(60); // ASSUMED: percent units
g1.property("Glow Radius").setValue(50);
g1.property("Glow Intensity").setValue(1);
var g2 = P.effect(line.layer, "Glow");
g2.property("Glow Threshold").setValue(60);
g2.property("Glow Radius").setValue(100);
g2.property("Glow Intensity").setValue(1);

// The button: rounded rectangle, near-black fill, 4 px pale indigo stroke.
var btn = P.shape(c, "button");
var L = btn.layer;
var contents = P.contents(btn);
contents.addProperty("ADBE Vector Shape - Rect");
var rectIdx = contents.numProperties;
var rect = P.contents(btn).property(rectIdx);
rect.property("ADBE Vector Rect Size").setValue([cardW, cardH]);
rect.property("ADBE Vector Rect Roundness").setValue(90); // 0.25 of card height per recipe layout
var fill = P.contents(btn).addProperty("ADBE Vector Graphic - Fill");
P.contents(btn).property(fill.propertyIndex).property("ADBE Vector Fill Color").setValue([0.07, 0.07, 0.11, 1]); // SUBSTITUTE: flat near-black blue fill for the recipe's gradient fill (gradient fill is not reliably scriptable)
P.stroke(btn, [40 / 255, 40 / 255, 48 / 255, 1], 4, 1); // dim stroke per review: side outline about rgb 40,40,48 (AFB0FF is for the sweeps only)
// Put the rectangle in the middle of the comp via the group's position; layer anchor/position at centre so Scale pops from the middle.
btn.layer.property("ADBE Root Vectors Group").property(1).property("ADBE Vector Transform Group").property("ADBE Vector Position").setValue([cx, cy]);
P.tf(L, "ADBE Anchor Point").setValue([cx, cy]);
P.tf(L, "ADBE Position").setValue([cx, cy]);

// Four sweeps: thin top (dir 0), thick top (dir 0), thick bottom (dir 180), thin top (dir 180) -- numbering as in the recipe.
// ASSUMED: centre x is the comp centre (recipe 2564/2573.6 are in the original 3840 comp); y = top and bottom edge of the card.
var topY = cy - cardH / 2, botY = cy + cardH / 2;
var specs = [
  { dir: 0,   y: topY, ei: 25, et: 4 },
  { dir: 0,   y: topY, ei: 7,  et: 20 },
  { dir: 180, y: botY, ei: 7,  et: 20 },
  { dir: 180, y: topY, ei: 25, et: 4 }
];
var i, e;
for (i = 0; i < specs.length; i++) {
  e = P.effect(L, "CC Light Sweep");
  e.name = "TECH Light Sweep " + (i + 1);
  e.property("Center").setValue([cx, specs[i].y]);
  e.property("Direction").setValue(specs[i].dir);
  e.property("Shape").setValue(2);
  e.property("Width").setValue(140); // ASSUMED: kept at the recipe's 140 although this comp is narrower than the original
  e.property("Sweep Intensity").setValue(0);
  e.property("Edge Intensity").setValue(specs[i].ei);
  e.property("Edge Thickness").setValue(specs[i].et);
  e.property("Light Color").setValue([0xAF / 255, 0xB0 / 255, 1, 1]);
  e.property("Light Reception").setValue(1);
}

// Pop-in keys: Scale 0 -> 100 (settled value; recipe's 72.2 belongs to its 3840 comp) over 4 frames; Size narrower -> full width.
var t0 = 0.5, t1 = 0.5 + 4 / 24;
var sc = P.tf(L, "ADBE Scale");
sc.setValueAtTime(t0, [0, 0]);
sc.setValueAtTime(t1, [100, 100]);
var sz = P.contents(btn).property(rectIdx).property("ADBE Vector Rect Size");
sz.setValueAtTime(t0, [cardW * 0.78, cardH]); // ASSUMED: start narrower ("a bit smaller")
sz.setValueAtTime(t1, [cardW, cardH]);

var bounce =
  "amp = .04;\n" +
  "freq = 1.8;\n" +
  "decay = 3;\n" +
  "n = 0;\n" +
  "if (numKeys > 0) { n = nearestKey(time).index; if (key(n).time > time) n--; }\n" +
  "if (n > 0) {\n" +
  "  t = time - key(n).time;\n" +
  "  v = velocityAtTime(key(n).time - .001);\n" +
  "  value + v * amp * Math.sin(freq * t * 2 * Math.PI) / Math.exp(decay * t);\n" +
  "} else { value; }";
// ASSUMED: the pinned comment text is not in the recipe; this is the common keyframe-bounce expression with the recipe's amp, freq, decay.
sc.expression = bounce;
P.contents(btn).property(rectIdx).property("ADBE Vector Rect Size").expression = bounce;

// Word, parented to the button.
var word = P.text(c, "Start", { size: 140, name: "word", pos: [cx, cy] });
word.parent = L;

return { comp: c.name, id: c.id, layers: c.numLayers };
