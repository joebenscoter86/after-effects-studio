// Technique 1: frosted-glass pill from three stacked shape layers (Stroke, Notification as adjustment layer + Fast Box Blur, Depth at 5 %).
// Bare card, no text or logo, over the shared wallpaper. Recipe sizes x 0.72 for the phone frame.
// VERIFY: match name "ADBE Box Blur2" for Fast Box Blur (display name "Fast Box Blur"), and that its properties are named "Blur Radius", "Iterations"
// VERIFY: "ADBE Vector Rect Size", "ADBE Vector Rect Roundness", "ADBE Vector Shape - Rect" match names
// VERIFY: "ADBE Vector Graphic - Fill" / "ADBE Vector Fill Color"; Stroke group re-fetch by index after addProperty
// VERIFY: layer.adjustmentLayer = true on a shape layer makes it filter only inside its fill's outline
// VERIFY: Rectangle Roundness above half the height clamps to a full half-circle end
// VERIFY: args.artDir (folder holding wallpaper.png) or args.art (path to wallpaper.png); ImportOptions import of a PNG
// VERIFY: comp.bgColor accepts [r,g,b] 0..1; app.project.importFile returns a FootageItem
// VERIFY: layer.moveToBeginning/moveAfter ordering after adding layers
$.evalFile(args.prelude);
var K = 0.72; // 1350 -> 972 wide
var c = P.freshComp("01 frosted glass pill", 1080, 1920, 30, 5, [250 / 255, 250 / 255, 250 / 255]);

// Backdrop: shared wallpaper, full frame.
var wpPath = args.art ? args.art : (args.artDir + "/backdrop.png");
var wpFile = new File(wpPath);
if (!wpFile.exists) throw new Error("wallpaper not found: " + wpPath);
var wpItem = app.project.importFile(new ImportOptions(wpFile));
var artFolder = app.project.items.addFolder("art 01");
wpItem.parentFolder = artFolder;
var wp = c.layers.add(wpItem);
wp.name = "Wallpaper";
P.tf(wp, "ADBE Position").setValue([540, 960]);

var W = 1350 * K, H = 315 * K;
// ASSUMED: Roundness is set to full round (>= half the height, 114) because the recipe measures half-circle ends; its stated 110 x 0.72 = 79 would not make them.
var ROUND = 120;
var CY = 1920 * 0.35; // 672, where a phone banner sits

function pill(name, withFill, strokeColor, strokeW) {
  var sh = P.shape(c, name);
  var r = P.contents(sh).addProperty("ADBE Vector Shape - Rect");
  P.contents(sh).property("ADBE Vector Shape - Rect").property("ADBE Vector Rect Size").setValue([W, H]);
  P.contents(sh).property("ADBE Vector Shape - Rect").property("ADBE Vector Rect Roundness").setValue(ROUND);
  if (withFill) {
    var f = P.contents(sh).addProperty("ADBE Vector Graphic - Fill");
    var fi = f.propertyIndex;
    P.contents(sh).property(fi).property("ADBE Vector Fill Color").setValue([0, 0, 0, 1]);
  }
  if (strokeW) P.stroke(sh, strokeColor, strokeW, 1);
  // Shape layer position is the pill centre; anchor stays at the group origin (the rectangle's centre).
  P.tf(sh.layer, "ADBE Position").setValue([540, CY]);
  return sh.layer;
}

// Created bottom to top: each new layer lands on top of the last.
var depth = pill("TECH Depth", true, null, 0);
P.tf(depth, "ADBE Opacity").setValue(5);

var note = pill("TECH Notification", true, null, 0); // stroke 0 px: omitted
note.adjustmentLayer = true;
var fx = P.effect(note, "ADBE Box Blur2");
fx.property("Blur Radius").setValue(30 * K);
// Iterations 3, Horizontal and Vertical, Repeat Edge Pixels off: defaults, left alone.

// ASSUMED: stroke 4 px x 0.72 = 2.9 px, CCCCCC (final colour; the 5C5C5C first pass is not needed).
// Fill removed: the stroke layer is built without a fill.
var stroke = pill("TECH Stroke", false, [0.8, 0.8, 0.8, 1], 4 * K);

// Null at the end, above the stack (not parented: parenting is the next technique).
var n = c.layers.addNull(c.duration);
n.name = "Null";
P.tf(n, "ADBE Position").setValue([540, CY]);
n.enabled = false; // SUBSTITUTE: null has no visible content; hidden so it does not draw a box

return { comp: c.name, id: c.id, layers: c.numLayers };
