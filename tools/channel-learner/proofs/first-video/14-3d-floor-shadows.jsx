// Technique 14: real cast shadows on an invisible 3D floor.
// A white 3D solid laid flat (X Rotation 90) under the 3D graphics, Material Options Accepts Shadows "Only",
// so it shows nothing but the shadows falling on it. A point light behind the graphics casts soft shadows
// forward onto it. The graphics have Accepts Lights off so the light does not shade or tint them.
// Switch-off for a "before" frame: disable the two layers named "TECH floor" and "TECH point light".
//
// VERIFY: c.renderer = "ADBE Advanced 3d" is the Classic 3D renderer's id.
// VERIFY: Material Options match names "ADBE Material Options Group", "ADBE Casts Shadows", "ADBE Accepts Shadows", "ADBE Accepts Lights".
// VERIFY: Casts Shadows values 0 Off, 1 On, 2 Only; Accepts Shadows values 0 Off, 1 On, 2 Only (recipe's build notes say 2 = Only); Accepts Lights 0 Off, 1 On.
// VERIFY: Light Options group "ADBE Light Options Group" and display names "Intensity", "Color", "Casts Shadows", "Shadow Darkness", "Shadow Diffusion", "Falloff", "Radius", "Falloff Distance".
// VERIFY: Falloff dropdown values 1 None, 2 Smooth, 3 Inverse Square Clamped.
// VERIFY: Shadow Darkness and Intensity take percent numbers (45, 100), not 0-1.
// VERIFY: X Rotation match name "ADBE Rotate X"; 3D Position takes [x, y, z].
// VERIFY: 3D shape layers cast shadows under Classic 3D (they should; the tutorial used collapsed 3D precomps).
// VERIFY: with the default camera, the floor at Y 840 scaled 233 % reaches past the bottom of frame and the shadows fall forward and down as the recipe describes.
// VERIFY: Font "Poppins-Bold" may be missing; After Effects substitutes a font.
$.evalFile(args.prelude);

// Helpers (candidates for the prelude): a rounded rectangle and a fill inside the shape's one group.
function rect(sh, size, round) {
  var r = P.contents(sh).addProperty("ADBE Vector Shape - Rect");
  var idx = r.propertyIndex;
  P.contents(sh).property(idx).property("ADBE Vector Rect Size").setValue(size);
  P.contents(sh).property(idx).property("ADBE Vector Rect Roundness").setValue(round);
  return idx;
}
function fill(sh, color) {
  var f = P.contents(sh).addProperty("ADBE Vector Graphic - Fill");
  var idx = f.propertyIndex;
  P.contents(sh).property(idx).property("ADBE Vector Fill Color").setValue(color);
  return idx;
}
// A flat 3D card: rounded rectangle with a fill, 3D on, placed at [x, y, z].
function card(comp, name, size, round, color, pos) {
  var sh = P.shape(comp, name);
  rect(sh, size, round);
  fill(sh, color);
  sh.layer.threeDLayer = true;
  P.tf(sh.layer, "ADBE Position").setValue(pos);
  return sh;
}
// Step 8: graphic ignores the light, still casts and accepts shadows.
function graphicMaterial(layer) {
  var m = layer.property("ADBE Material Options Group");
  m.property("ADBE Accepts Lights").setValue(0);
  layer.property("ADBE Material Options Group").property("ADBE Casts Shadows").setValue(1);
  layer.property("ADBE Material Options Group").property("ADBE Accepts Shadows").setValue(1);
}

var c = P.freshComp("14 floor shadows", 1920, 1080, 24, 5, [0.92, 0.93, 0.95]);
c.renderer = "ADBE Advanced 3d"; // Classic 3D, as in the tutorial

// Pale 2D background (bottom of stack).
// ASSUMED: background colour R0.92 G0.93 B0.95 ("pale UI-style scene").
var bg = P.solid(c, "background", [0.92, 0.93, 0.95]);

// Step 1-3: white 3D solid laid flat as the floor, moved down and scaled up.
var floor = P.solid(c, "TECH floor", [1, 1, 1], 1920, 1080);
floor.threeDLayer = true;
P.tf(floor, "ADBE Rotate X").setValue(90);
P.tf(floor, "ADBE Position").setValue([960, 840, 0]);
P.tf(floor, "ADBE Scale").setValue([233, 233, 233]);
// Anchor Point 960,540,0 is the default; left alone.

// Step 6: floor shows only shadows.
floor.property("ADBE Material Options Group").property("ADBE Accepts Shadows").setValue(2);
floor.property("ADBE Material Options Group").property("ADBE Casts Shadows").setValue(0);

// Stand-in 3D graphics standing on the floor (floor plane is at Y 840, about 0.78 of the height).
// Run fix (layout line): button panel 0.17-0.51w, 0.12-0.78h; weather card 0.53-0.85w, 0.51-0.76h; both bottoms at the
// floor line, so the shadow starts at the objects' bottom edge. The tickers are not in the layout and are dropped.
// ASSUMED: pale UI colours; a 3 x 4 grid of white buttons on the panel, a little in front of it.
var W = 1920, H = 1080;
var panel = card(c, "panel", [0.34 * W, 0.66 * H], 48, [0.84, 0.88, 0.95, 1], [0.34 * W, 0.45 * H, 0]);
var buttons = [];
var bx, by, bsz = 150;
for (by = 0; by < 4; by++) {
  for (bx = 0; bx < 3; bx++) {
    buttons.push(card(c, "button " + (by * 3 + bx + 1), [bsz, bsz], 34, [1, 1, 1, 1],
      [0.34 * W + (bx - 1) * 190, 0.45 * H + (by - 1.5) * 168, -10]));
  }
}
var weather = card(c, "weather card", [0.32 * W, 0.25 * H], 40, [0.98, 0.80, 0.45, 1], [0.69 * W, 0.635 * H, 0]);

// A little motion so the shadow is seen to follow: the weather card rises and settles.
// ASSUMED: the tutorial's graphics have their own animations; this one is ours.
var wp = P.tf(weather.layer, "ADBE Position");
wp.setValueAtTime(0, [0.69 * W, 0.635 * H + 80, 0]);
wp.setValueAtTime(1.5, [0.69 * W, 0.635 * H - 40, 0]);
wp.setValueAtTime(3, [0.69 * W, 0.635 * H, 0]);
var e = new KeyframeEase(0, 66);
var k;
for (k = 1; k <= wp.numKeys; k++) wp.setTemporalEaseAtKey(k, [e], [e]);

var graphics = [panel.layer, weather.layer];
for (k = 0; k < buttons.length; k++) graphics.push(buttons[k].layer);
var i;
for (i = 0; i < graphics.length; i++) graphicMaterial(graphics[i]);

// Step 5 and 7: point light up, left and behind the graphics, soft light shadow, smooth falloff.
var light = c.layers.addLight("TECH point light", [960, 540]);
light.lightType = LightType.POINT;
P.tf(light, "ADBE Position").setValue([-440, 460, 2483.3]);
var lo = light.property("ADBE Light Options Group");
lo.property("Intensity").setValue(100);
light.property("ADBE Light Options Group").property("Color").setValue([1, 1, 1]);
light.property("ADBE Light Options Group").property("Falloff").setValue(2); // Smooth
light.property("ADBE Light Options Group").property("Radius").setValue(3530);
light.property("ADBE Light Options Group").property("Falloff Distance").setValue(500);
light.property("ADBE Light Options Group").property("Casts Shadows").setValue(1);
// Correction (2026-11-14, from the review): the recipe shows 45 %, which gives a mid-grey shadow (0.55 of the open floor)
// where the tutorial's is near black (0.22). Raised toward 78 %. args.shadowDarkness = 45 gives the recipe's value.
light.property("ADBE Light Options Group").property("Shadow Darkness").setValue(args.shadowDarkness === undefined ? 78 : args.shadowDarkness);
light.property("ADBE Light Options Group").property("Shadow Diffusion").setValue(205);

// 2D title on top of everything (above all 3D layers, so it does not split the 3D group).
// Run fix (layout line): bold title word 0.54-0.86w, 0.24-0.45h (614 x 227 px); a script-style word above it reaching
// about 0.11h, 0.57-0.90w. ASSUMED: words "Weather" and "today"; Poppins-Bold and Poppins-Regular stand in for the script face.
var t1 = P.text(c, "Weather", { size: args.titleSize || 139, font: args.font || "Poppins-Bold", color: [0.10, 0.12, 0.18], name: "title", pos: [0.70 * W, 0.345 * H] });
var t2 = P.text(c, "today", { size: 110, font: "Poppins-Regular", color: [0.27, 0.45, 0.95], name: "title script", pos: [0.735 * W, 0.17 * H] });
var t1r = t1.sourceRectAtTime(0, false);

// Step 4: stack order. Title (2D) top, light, 3D graphics, floor directly under the lowest 3D graphic, background (2D) last.
// With Classic 3D a 2D layer between 3D layers splits them into groups that cannot shadow each other.
floor.moveAfter(panel.layer);
bg.moveToEnd();

return { title: [t1r.width, t1r.height], renderer: c.renderer, comp: c.name, id: c.id, layers: c.numLayers, floorIndex: floor.index, lightIndex: light.index };
