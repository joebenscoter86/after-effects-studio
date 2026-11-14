// Technique 22: tuck helper layers out of the Timeline with the shy switch.
// A ring of stand-in photo cards, each with image, box, matte, outline, decoration and text layers.
// Mattes, outlines, decorations and text are marked shy; then the comp's Hide All Shy Layers toggle is set.
// Shy changes only the Timeline layer list, never the render: judge the build by the layer list, not a frame.
// args.hide === false leaves the toggle off (the "before" state); args.cards sets the number of cards (default 12).
//
// VERIFY: layer.shy and comp.hideShyLayers are the scripting names (both documented in the AE scripting guide).
// VERIFY: assigning layer.parent keeps the child where it is on screen (setParentWithJump is the one that keeps values).
// VERIFY: layer.setTrackMatte(matte, TrackMatteType.ALPHA) exists in AE 2027 and the matte need not sit directly above.
// VERIFY: a matte layer with enabled = false still works as the matte.
// VERIFY: "Vibrance" is the display name of the effect and its property, accepted by P.effect.
// VERIFY: shape Rect and Fill match names: "ADBE Vector Shape - Rect", "ADBE Vector Rect Size/Position/Roundness", "ADBE Vector Graphic - Fill", "ADBE Vector Fill Color".
$.evalFile(args.prelude);

// Local helpers (candidates for the prelude: 22, 24 and 25 all need rectangles and fills).
function addRect(sh, size, pos, round) {
  var r = P.contents(sh).addProperty("ADBE Vector Shape - Rect");
  var idx = r.propertyIndex;
  P.contents(sh).property(idx).property("ADBE Vector Rect Size").setValue(size);
  P.contents(sh).property(idx).property("ADBE Vector Rect Position").setValue(pos || [0, 0]);
  P.contents(sh).property(idx).property("ADBE Vector Rect Roundness").setValue(round || 0);
  return idx;
}
function addFill(sh, color) {
  var f = P.contents(sh).addProperty("ADBE Vector Graphic - Fill");
  var idx = f.propertyIndex;
  P.contents(sh).property(idx).property("ADBE Vector Fill Color").setValue(color);
  return idx;
}

var N = args.cards || 12; // ASSUMED: 12 cards (the example has about ninety layers; 12 x 6 + 4 = 76 here)
var R = 380;              // ASSUMED: ring radius
var W = 130, H = 170;     // ASSUMED: card size
var c = P.freshComp("22 hide layers shy", 1920, 1080, 24, 4, [0.05, 0.05, 0.06]);

var bg = P.solid(c, "background", [0.08, 0.08, 0.1]);
var wheel = P.shape(c, "wheel");
P.ellipse(wheel, [R * 2, R * 2]);
P.stroke(wheel, [0.45, 0.45, 0.5, 1], 6);

var palette = [[0.85, 0.35, 0.25], [0.95, 0.7, 0.2], [0.3, 0.6, 0.85], [0.35, 0.75, 0.5], [0.7, 0.4, 0.8], [0.9, 0.5, 0.6]];
var cardLayers = [wheel.layer];
var shyCount = 0;
var i, a, pos, col, box, img, matte, outline, deco, label;
for (i = 0; i < N; i++) {
  a = i * 2 * Math.PI / N;
  pos = [960 + R * Math.sin(a), 540 - R * Math.cos(a)];
  col = palette[i % palette.length];

  box = P.shape(c, "card " + (i + 1) + " box");
  addRect(box, [W + 16, H + 16], [0, 0], 10);
  addFill(box, [0.16, 0.16, 0.18, 1]);
  P.tf(box.layer, "ADBE Position").setValue(pos);

  img = P.solid(c, "card " + (i + 1) + " image", col, W, H);
  P.tf(img, "ADBE Position").setValue(pos);

  matte = P.shape(c, "card " + (i + 1) + " matte");
  addRect(matte, [W, H], [0, 0], 14);
  addFill(matte, [1, 1, 1, 1]);
  P.tf(matte.layer, "ADBE Position").setValue(pos);
  img.setTrackMatte(matte.layer, TrackMatteType.ALPHA);
  matte.layer.enabled = false;

  outline = P.shape(c, "card " + (i + 1) + " outline");
  addRect(outline, [W + 8, H + 8], [0, 0], 18);
  P.stroke(outline, [1, 1, 1, 1], 2);
  P.tf(outline.layer, "ADBE Position").setValue(pos);

  deco = P.shape(c, "card " + (i + 1) + " decoration");
  P.ellipse(deco, [14, 14]);
  addFill(deco, [col[0], col[1], col[2], 1]);
  P.tf(deco.layer, "ADBE Position").setValue([pos[0], pos[1] - H / 2 - 22]);

  label = P.text(c, (i < 9 ? "0" : "") + (i + 1), { size: 26, pos: [pos[0], pos[1] + H / 2 + 30], name: "card " + (i + 1) + " text" });

  cardLayers.push(box.layer, img, matte.layer, outline.layer, deco.layer, label);

  // Step 1: mark the helper layers shy; image and box stay unmarked.
  matte.layer.shy = true;
  outline.layer.shy = true;
  deco.layer.shy = true;
  label.shy = true;
  shyCount += 4;
}

// Effects layer: an adjustment layer over the ring (unmarked).
var fxLayer = P.solid(c, "effects", [1, 1, 1]);
fxLayer.adjustmentLayer = true;
var vib = P.effect(fxLayer, "Vibrance");
vib.property("Vibrance").setValue(20); // ASSUMED: any mild grade; the recipe does not say what the effects layer does

// Null that turns the whole ring (unmarked).
var ctl = c.layers.addNull(c.duration);
ctl.name = "wheel null";
P.tf(ctl, "ADBE Position").setValue([960, 540]);
var k;
for (k = 0; k < cardLayers.length; k++) cardLayers[k].parent = ctl;
var rot = P.tf(ctl, "ADBE Rotate Z");
rot.setValueAtTime(0, 0);
rot.setValueAtTime(c.duration, 20); // ASSUMED: a slow turn so the comp is not a dead still

// Step 2: the master toggle, Hide All Shy Layers.
c.hideShyLayers = (args.hide !== false);

return { comp: c.name, id: c.id, layers: c.numLayers, shy: shyCount, visibleInTimeline: c.numLayers - (c.hideShyLayers ? shyCount : 0), hideShyLayers: c.hideShyLayers };
