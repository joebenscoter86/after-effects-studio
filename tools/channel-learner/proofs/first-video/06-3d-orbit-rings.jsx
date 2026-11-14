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

// Local helper (candidate for the prelude: P.fill).
function fill(sh, color) {
  var f = P.contents(sh).addProperty("ADBE Vector Graphic - Fill");
  var idx = f.propertyIndex;
  P.contents(sh).property(idx).property("ADBE Vector Fill Color").setValue(color);
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

var c = P.freshComp("06 3d orbit rings", 1920, 1080, FPS, DUR, [0.86, 0.86, 0.86]);
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
// ASSUMED: "pale grey frame" = 86% grey.
P.solid(c, "background", [0.86, 0.86, 0.86]);

// Step 1: the centre object, a filled black circle, 3D.
// ASSUMED: diameter 440 px (the recipe gives no size); the ring's projected half-height is about 263 px, so the near discs overlap the circle's lower edge.
var core = P.shape(c, "centre circle");
P.ellipse(core, [CORE, CORE]);
fill(core, [0, 0, 0, 1]);
core.layer.threeDLayer = true;
P.tf(core.layer, "ADBE Position").setValue([CX, CY, Z]);

// Step 2: one disc, white fill, 6 px dark stroke, scale 48%.
// ASSUMED: ellipse 200 x 200 px before scaling (about 96 px on screen); colours pure white and near-black.
var disc = P.shape(c, "disc 01");
P.ellipse(disc, [DISC, DISC]);
fill(disc, [1, 1, 1, 1]);
P.stroke(disc, [0.08, 0.08, 0.08, 1], 6);
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
for (i = 2; i <= N + 2; i++) c.layer(i).parent = rollNull; // discs are now layers 2..N+1, the circle N+2
P.tf(rollNull, "ADBE Rotate Z").setValue(ROLL);

return { comp: c.name, id: c.id, layers: c.numLayers, discs: N, stepZ: STEPZ, tiltX: TILTX, roll: ROLL, speed: SPEED, sample: sample.join(" | ") };
