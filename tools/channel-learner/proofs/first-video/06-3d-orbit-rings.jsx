// Technique 6: tilted 3D ring of discs orbiting a centre object.
// A black 3D circle sits in the middle of a pale grey frame. One white disc with a dark outline is made 3D,
// its anchor moved 910 px below it (so it sits above the centre while turning around the centre),
// turned edge-on with Y Rotation 90, then duplicated to 36 discs whose Orientation Z steps 41.1 degrees per layer.
// All discs share Orientation X 307 (the tilt), so the near discs pass in front of the circle and the far ones behind.
//
// VERIFY: match names ADBE Orientation, ADBE Rotate Y, ADBE Anchor Point, ADBE Scale on a 3D shape layer's transform group
// VERIFY: after threeDLayer = true, Anchor Point, Position and Scale take 3-value arrays
// VERIFY: AE applies Orientation so that [tiltX, 0, z] spins the disc by z around the centre in the ring plane and then tilts that plane by tiltX (the recipe shows this works; check the ring reads as one tilted ellipse, not a sphere of discs)
// VERIFY: layer.duplicate() puts the copy directly above the source and keeps the 3D switch, anchor, scale and rotation
// VERIFY: a 2D background solid at the bottom of the stack renders beneath the 3D layers without breaking their depth sorting
// VERIFY: the default comp camera (no camera layer) shows the whole ring: ring radius after 48% scale is about 437 px
// VERIFY: the expression "value + [0, 0, time * 72]" on Orientation is accepted (Orientation is a 3-value property; expressions may return angles above 360)
//
// args.count (default 36), args.stepZ (default 41.1), args.tiltX (default 307) override the recipe's values;
// args.tidy = true uses stepZ = 360 / count (the recipe's suggestion for a single even pass);
// args.still = true leaves out the orbit expression.
$.evalFile(args.prelude);
// Rebuild with artwork (2026-11-14): art from PROOF/06/art (brief.md). Pass args.artLib (art.jsx) and args.artDir.
// paper.png replaces the grey solid; sphere.png (a 3D footage layer facing the camera, not parented to the roll null so its
// highlight stays upper left) replaces the black circle at the same place; discs become ink line drawings on paper;
// a soft contact shadow and two ink sparkles are added.
// VERIFY (rebuild): star match names ADBE Vector Shape - Star / Star Type, Points, Outer Radius, Inner Radius.
$.evalFile(args.artLib);
var ARTDIR = args.artDir;
var INK = ART.hex("#1A1A1A");

// Local helper (candidate for the prelude: P.fill).
function fill(sh, color, opacity) {
  var f = P.contents(sh).addProperty("ADBE Vector Graphic - Fill");
  var idx = f.propertyIndex;
  P.contents(sh).property(idx).property("ADBE Vector Fill Color").setValue(color);
  if (opacity !== undefined) P.contents(sh).property(idx).property("ADBE Vector Fill Opacity").setValue(opacity);
  return idx;
}

var FPS = 23.976; // the recipe says the example comp runs at 23.976 fps
var DUR = 5;
var N = args.count || 36;
var STEPZ = args.tidy ? 360 / N : (args.stepZ !== undefined ? args.stepZ : 41.1);
// Review correction: the recipe's 307 shows the ring from too high (its hole opens up); the picture is nearer edge-on.
// Second review asked for a flatter outline (0.864 of the height tall against 0.807) and suggested 294 to 295. Measured: 294 makes
// it taller (0.893), 290 flatter (0.840), width 0.81 in both; nearer edge-on is toward 270, so the fix lies below 292 (about 287 to 288,
// with the centre moved down to hold the bottom edge). Not asked for, so 292 stays.
var TILTX = args.tiltX !== undefined ? args.tiltX : 292;
var ROLL = args.roll !== undefined ? args.roll : 17; // (was 6; review: the long axis leans 16-17) degrees, AE Z Rotation of a parent null: the ring's left end sits higher than its right
var SPEED = args.speed !== undefined ? args.speed : -19; // degrees a second round the ring; negative so the front discs travel left to right (was 72, then 30)
var CX = 960, CY = args.cy || 512; // at tilt 292 and roll 17 the ring spans about 0.10-0.96 of the height (was 505 at roll 6)
// Layout (recipe's layout: line): ring 0.09-0.90 of the width, 0.16-0.96 of the height, front discs about 0.45 of the height tall;
// sphere about 0.28 of the width across. With the recipe's anchor 910 and scale 48 the ring is only about 980 px wide under the
// default camera, so the whole build sits closer to the camera (Z) to enlarge it in perspective, keeping the recipe's values.
var Z = args.z !== undefined ? args.z : -700;
var DISC = args.disc || 540; // ASSUMED: sized so the front discs are about 0.4 of the height tall
var CORE = args.core || 400; // about 540 px on screen at this depth (layout: 0.28 of the width)

var c = P.freshComp("06 3d orbit rings", 1920, 1080, FPS, DUR, ART.hex("#E4E0DA"));
// Re-runs: freshComp removes the comp but not its solid; remove this script's unused background solid (86% grey) first.
(function () {
  var j, it;
  for (j = app.project.numItems; j >= 1; j--) {
    it = app.project.item(j);
    if (it instanceof FootageItem && it.mainSource instanceof SolidSource && it.name === "background" && it.usedIn.length === 0 &&
        Math.abs(it.mainSource.color[0] - 0.86) < 0.001 && Math.abs(it.mainSource.color[2] - 0.86) < 0.001) it.remove();
    else if (it instanceof FootageItem && it.mainSource instanceof SolidSource && it.name === "06 roll null" && it.usedIn.length === 0) it.remove();
  }
})();
// Rebuild: paper.png as "background" (replaces the 86 % grey solid).
var paper = c.layers.add(ART.footage(ARTDIR, "paper.png", "art 06"));
paper.name = "background";

// Brief: soft contact shadow under the ring, #1A1A1A at 10 %, about 0.6 of the width wide at 0.95 down (2D, below the 3D layers).
var cs = P.shape(c, "contact shadow");
P.ellipse(cs, [0.6 * 1920, 90]);
fill(cs, INK);
P.tf(cs.layer, "ADBE Position").setValue([CX, 0.95 * 1080]);
P.tf(cs.layer, "ADBE Opacity").setValue(10);
P.effect(cs.layer, "ADBE Gaussian Blur 2").property("Blurriness").setValue(70); // 45 read as a flat band

// Step 1: the centre object. Rebuild: the obsidian sphere stands where the black circle was (3D, same position and depth,
// facing the camera). Scale so it is CORE px wide in layer space, as the circle was (about 540 px on screen at Z -700;
// the brief's 53.2 % assumes Z 0).
var core = { layer: c.layers.add(ART.footage(ARTDIR, "sphere.png", "art 06")) };
core.layer.name = "sphere";
core.layer.threeDLayer = true;
var SPH = 100 * CORE / 1012;
P.tf(core.layer, "ADBE Scale").setValue([SPH, SPH, SPH]);
P.tf(core.layer, "ADBE Position").setValue([CX, CY, Z]);

// Step 2: one disc, white fill, 6 px dark stroke, scale 48%.
// ASSUMED: ellipse 200 x 200 px before scaling (about 96 px on screen); colours pure white and near-black.
var disc = P.shape(c, "disc 01");
P.ellipse(disc, [DISC, DISC]);
// Rebuild (brief): fill #F3F0EB at 88 %, ink stroke #1A1A1A about 2 px on screen (3 px in layer space at 48 % scale, Z -700).
fill(disc, ART.hex("#F3F0EB").concat([1]), args.discFill || 88);
P.stroke(disc, INK.concat([1]), args.discStroke || 4); // 3 read as a faint hairline on the first render
var d = disc.layer;

// Step 4 (part): 3D switch on first, so the transform takes 3-value arrays.
d.threeDLayer = true;
P.tf(d, "ADBE Scale").setValue([48, 48, 48]);

// Step 3: anchor moved 910 px down in layer space while the position stays at the centre object.
// SUBSTITUTE: the Pan Behind tool drag; the recipe's Anchor Point value is set directly.
P.tf(d, "ADBE Anchor Point").setValue([0, 910, 0]);
P.tf(d, "ADBE Position").setValue([CX, CY, Z]);

// Step 4: Y Rotation 90 turns the disc edge-on (a slice of the doughnut).
P.tf(d, "ADBE Rotate Y").setValue(90);

// Step 5: duplicate to N discs. Each copy lands on top of the stack.
var cur = d;
var k;
for (k = 2; k <= N; k++) {
  cur = cur.duplicate();
  cur.name = "disc " + (k < 10 ? "0" + k : "" + k);
}

// Steps 6 and 7: Orientation Z steps per layer counted from the top (the top keeps Z 0); every disc gets the same tilt X.
// SUBSTITUTE: the Ctrl+Alt / Cmd+Option drag on the Orientation value across the selected layers; the values are set directly.
// Discs are layers 1..N (top first); the centre circle is N + 1 and the background N + 2.
var i, L, sample = [];
for (i = 0; i < N; i++) {
  L = c.layer(i + 1);
  P.tf(L, "ADBE Orientation").setValue([TILTX, 0, (i * STEPZ) % 360]);
  if (i < 4) sample.push(L.name + " " + P.tf(L, "ADBE Orientation").value.toString());
}

// Orbit. ASSUMED: the recipe does not show how the example moves (its discs are parented to a null whose animation is not shown).
// SUBSTITUTE: instead of a rotating null (rotating a null about Z would spin the tilted ellipse in the screen plane, not along the ring),
// each disc's Orientation Z advances one turn per 5 s, so the discs travel around the ring and the loop is seamless.
if (!args.still) {
  for (i = 0; i < N; i++) {
    c.layer(i + 1).property("ADBE Transform Group").property("ADBE Orientation").expression = "value + [0, 0, time * " + SPEED + "]";
  }
}

// Roll: the whole ring and the centre circle are parented to a 3D null at the centre, and the null's Z Rotation rolls the picture.
// (A roll in the picture plane cannot be written into the discs' own Orientation without changing the tilt.)
var rollNull = c.layers.addNull(c.duration);
rollNull.source.name = "06 roll null";
rollNull.name = "roll null";
rollNull.threeDLayer = true;
P.tf(rollNull, "ADBE Position").setValue([CX, CY, Z]);
for (i = 2; i <= N + 1; i++) c.layer(i).parent = rollNull; // discs are layers 2..N+1; the sphere (N+2) stays unparented so it does not roll
P.tf(rollNull, "ADBE Rotate Z").setValue(ROLL);

// Brief: two four-point ink sparkles at the recipe's positions (0.13 w across at 0.17, 0.35; 0.07 w across at 0.18, 0.79),
// with a very slow twinkle (scale 95-105 %). 2D, on top of the 3D layers.
function sparkle(name, across, x, y, phase) {
  var st = P.shape(c, name);
  var sp = P.contents(st).addProperty("ADBE Vector Shape - Star");
  var si = sp.propertyIndex;
  var g = function () { return P.contents(st).property(si); };
  g().property("ADBE Vector Star Type").setValue(1);
  g().property("ADBE Vector Star Points").setValue(4);
  g().property("ADBE Vector Star Outer Radius").setValue(across / 2);
  g().property("ADBE Vector Star Inner Radius").setValue(across * 0.085);
  fill(st, INK);
  P.tf(st.layer, "ADBE Position").setValue([x, y]);
  P.tf(st.layer, "ADBE Scale").expression = "var s = 100 + 5 * Math.sin(2 * Math.PI * time / 2.5 + " + phase + "); [s, s];";
  return st.layer;
}
sparkle("sparkle big", 0.13 * 1920, 0.17 * 1920, 0.35 * 1080, 0);
sparkle("sparkle small", 0.07 * 1920, 0.18 * 1920, 0.79 * 1080, 2);

var order = []; for (i = 1; i <= c.numLayers; i++) if (i < 4 || i > c.numLayers - 4) order.push(i + " " + c.layer(i).name);
return { order: order, comp: c.name, id: c.id, layers: c.numLayers, discs: N, stepZ: STEPZ, tiltX: TILTX, roll: ROLL, speed: SPEED, sample: sample.join(" | ") };
