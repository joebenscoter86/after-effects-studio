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

// Run fix: layer stack rebuilt to the recipe's layout line: 88 layers; FX (1), Null 1 (2), then twelve cards of seven layers
// each (four shy helpers, the image, one shy helper, the box: image at 7, 14 ... 84, box at 9, 16 ... 86), wheel (87),
// background (88). The image is parented to its box and each box to Null 1. 60 shy, 28 left showing.
// Layers are added bottom-up, since a new layer always lands on top.
var N = args.cards || 12;
var R = 410;              // ASSUMED: ring radius (run fix: 380 with 130 x 170 cards made neighbours overlap at the sides)
var W = 100, H = 130;     // ASSUMED: card size
var c = P.freshComp("22 hide layers shy", 1920, 1080, 24, 4, [0.05, 0.05, 0.06]);

var bg = P.solid(c, "22 background", [0.08, 0.08, 0.1]);
bg.name = "background";
var wheel = P.shape(c, "wheel");
P.ellipse(wheel, [R * 2, R * 2]);
P.stroke(wheel, [0.45, 0.45, 0.5, 1], 6);

var palette = [[0.85, 0.35, 0.25], [0.95, 0.7, 0.2], [0.3, 0.6, 0.85], [0.35, 0.75, 0.5], [0.7, 0.4, 0.8], [0.9, 0.5, 0.6]];
var boxes = [];
var shyCount = 0;
var i, a, pos, col, box, img, matte, outline, deco, label, cap, nm, hl, h;
for (i = N - 1; i >= 0; i--) {
  a = i * 2 * Math.PI / N;
  pos = [960 + R * Math.sin(a), 540 - R * Math.cos(a)];
  col = palette[i % palette.length];
  nm = "card " + (i < 9 ? "0" : "") + (i + 1);

  box = P.shape(c, nm + " box");
  addRect(box, [W + 16, H + 16], [0, 0], 10);
  addFill(box, [0.16, 0.16, 0.18, 1]);
  P.tf(box.layer, "ADBE Position").setValue(pos);

  // ASSUMED: the one shy layer between image and box is the matte (the recipe lists "matte, outline, decoration and text" but not their order).
  matte = P.shape(c, nm + " matte");
  addRect(matte, [W, H], [0, 0], 14);
  addFill(matte, [1, 1, 1, 1]);
  P.tf(matte.layer, "ADBE Position").setValue(pos);

  img = P.solid(c, "22 card image", col, W, H);
  img.name = nm + " image";
  P.tf(img, "ADBE Position").setValue(pos);
  img.setTrackMatte(matte.layer, TrackMatteType.ALPHA);
  matte.layer.enabled = false;

  outline = P.shape(c, nm + " outline");
  addRect(outline, [W + 8, H + 8], [0, 0], 18);
  P.stroke(outline, [1, 1, 1, 1], 2);
  P.tf(outline.layer, "ADBE Position").setValue(pos);

  deco = P.shape(c, nm + " decoration");
  P.ellipse(deco, [14, 14]);
  addFill(deco, [col[0], col[1], col[2], 1]);
  P.tf(deco.layer, "ADBE Position").setValue([pos[0], pos[1] - H / 2 - 22]);

  cap = P.text(c, "PHOTO", { size: 13, tracking: 200, pos: [pos[0], pos[1] + H / 2 + 52], name: nm + " text caption" });
  label = P.text(c, (i < 9 ? "0" : "") + (i + 1), { size: 26, pos: [pos[0], pos[1] + H / 2 + 30], name: nm + " text" });

  // Step 1: mark the helper layers shy; image and box stay unmarked.
  hl = [matte.layer, outline.layer, deco.layer, cap, label];
  for (h = 0; h < hl.length; h++) { hl[h].shy = true; shyCount++; }
  // Image parented to its box (layout); ASSUMED: the helpers ride on the box too.
  img.parent = box.layer;
  for (h = 0; h < hl.length; h++) hl[h].parent = box.layer;
  boxes.push(box.layer);
}

// Null that turns the whole ring (unmarked). Each box is parented to it (layout).
var ctl = c.layers.addNull(c.duration);
ctl.source.name = "22 Null 1";
ctl.name = "Null 1";
P.tf(ctl, "ADBE Position").setValue([960, 540]);
var k;
for (k = 0; k < boxes.length; k++) boxes[k].parent = ctl;
wheel.layer.parent = ctl; // ASSUMED
var rot = P.tf(ctl, "ADBE Rotate Z");
rot.setValueAtTime(0, 0);
rot.setValueAtTime(c.duration, 20); // ASSUMED: a slow turn so the comp is not a dead still

// Effects layer: an adjustment layer over everything (unmarked), top of the stack.
var fxLayer = P.solid(c, "22 FX", [1, 1, 1]);
fxLayer.name = "FX";
fxLayer.adjustmentLayer = true;
var vib = P.effect(fxLayer, "Vibrance");
fxLayer.property("ADBE Effect Parade").property(vib.propertyIndex).property("Vibrance").setValue(20); // ASSUMED: any mild grade

// Step 2: the master toggle, Hide All Shy Layers.
c.hideShyLayers = (args.hide !== false);

// Read-back: this is the proof, since the Timeline panel cannot be rendered.
var shown = [], shyIdx = [], li;
for (li = 1; li <= c.numLayers; li++) {
  if (c.layer(li).shy) shyIdx.push(li); else shown.push(li + " " + c.layer(li).name);
}
// Remove this script's own unused solids from earlier runs.
var oi, oit;
for (oi = app.project.numItems; oi >= 1; oi--) {
  oit = app.project.item(oi);
  if (oit instanceof FootageItem && oit.mainSource instanceof SolidSource && oit.usedIn.length === 0 &&
      (oit.name === "22 card image" || oit.name === "22 Null 1" || oit.name === "22 FX" || oit.name === "22 background")) oit.remove();
}
return { comp: c.name, id: c.id, layers: c.numLayers, shy: shyIdx.length, hideShyLayers: c.hideShyLayers,
  showingInTimeline: c.hideShyLayers ? shown.length : c.numLayers, notShy: shown, shyIndices: shyIdx };
