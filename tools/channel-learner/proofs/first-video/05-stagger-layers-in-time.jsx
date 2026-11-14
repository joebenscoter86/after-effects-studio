// Technique 5: even time stagger of a whole stack of layers.
// Ten identical bars are built at start time 0 (one bar, duplicated), then staggered in layer order:
// the bottom bar keeps its start at 0 and each bar above it starts one step later. Each bar grows up from
// its baseline over its first 0.4 s, so when played the bars pop on one after another, left to right.
// The script returns every bar's start time (seconds and frames) so the offsets can be checked as numbers.
//
// VERIFY: setting layer.startTime moves the layer's keyframes with it (keyframes live in layer time), so each bar's grow animation shifts with its start
// VERIFY: layer.duplicate() puts the copy directly above the source and copies its Scale keyframes
// VERIFY: a fractional startTime (step = 22.34 / 60 s, not a whole number of 24 fps frames) is accepted as is and not snapped to a frame
// VERIFY: match names ADBE Vector Shape - Rect, ADBE Vector Rect Size, ADBE Vector Rect Position, ADBE Vector Rect Roundness, ADBE Vector Graphic - Fill, ADBE Vector Fill Color
// VERIFY: Scale on a 2D shape layer takes a 3-value array in setValueAtTime ([x, y, z]); a 2-value array may also be accepted
//
// args.before = true leaves every bar at start 0 (the "before": all bars aligned, all grow at once).
// args.wholeFrames = true rounds each start to a whole frame (recipe build notes: Math.round(...) / frameRate).
// args.step overrides the per-layer offset in seconds; args.count the number of bars.
$.evalFile(args.prelude);

// Local helpers (candidates for the prelude: P.rect, P.fill).
function rect(sh, size, pos, roundness) {
  var r = P.contents(sh).addProperty("ADBE Vector Shape - Rect");
  var idx = r.propertyIndex;
  P.contents(sh).property(idx).property("ADBE Vector Rect Size").setValue(size);
  P.contents(sh).property(idx).property("ADBE Vector Rect Position").setValue(pos);
  P.contents(sh).property(idx).property("ADBE Vector Rect Roundness").setValue(roundness);
  return idx;
}
function fill(sh, color) {
  var f = P.contents(sh).addProperty("ADBE Vector Graphic - Fill");
  var idx = f.propertyIndex;
  P.contents(sh).property(idx).property("ADBE Vector Fill Color").setValue(color);
  return idx;
}

var FPS = 24;
var N = args.count || 10;
// Recipe value: Per Layer offset 0:00:00:22.34 at 60 fps = 22.34 / 60 s, about 0.372 s (8.94 frames at 24 fps).
var STEP = args.step || (22.34 / 60);
var GROW = 0.4; // ASSUMED: the recipe shows no animation on the staggered layers; each bar grows on over 0.4 s so the stagger can be seen
var DUR = 5;

var c = P.freshComp("05 stagger layers", 1920, 1080, FPS, DUR, [0.93, 0.92, 0.89]);
P.solid(c, "background", [0.93, 0.92, 0.89]);

// One bar: a rounded rectangle whose bottom edge sits on the layer origin, so scaling Y grows it upwards.
var sh = P.shape(c, "bar 01");
rect(sh, [96, 420], [0, -210], 18);
fill(sh, [0.11, 0.12, 0.16, 1]);
var spacing = 150;
var x0 = 1920 / 2 - spacing * (N - 1) / 2;
var baseY = 760;
P.tf(sh.layer, "ADBE Position").setValue([x0, baseY]);
var sc = P.tf(sh.layer, "ADBE Scale");
sc.setValueAtTime(0, [100, 0, 100]);
sc.setValueAtTime(GROW * 0.6, [100, 112, 100]);
sc.setValueAtTime(GROW, [100, 100, 100]);

// Duplicate the bar up the stack: each copy lands on top, one step to the right.
// Bottom of the stack = bar 01 (leftmost), top = bar N (rightmost), as in the example (bottom layer keeps 0).
var cur = sh.layer;
var k;
for (k = 2; k <= N; k++) {
  cur = cur.duplicate();
  cur.name = "bar " + (k < 10 ? "0" + k : "" + k);
  P.tf(cur, "ADBE Position").setValue([x0 + spacing * (k - 1), baseY]);
}

// SUBSTITUTE: the Ctrl+Alt / Cmd+Option drag of the selected layer bars in the timeline (interface only).
// Same result by property: the i-th layer counted from the bottom of the stack (i = 0 for the bottom) starts at base + i * step.
// The bars are layers 1..N; the background solid is layer N + 1 and is not staggered.
var base = 0;
var starts = [];
var lines = [];
var i, L, t;
for (i = 0; i < N; i++) {
  L = c.layer(N - i);
  t = base + i * STEP;
  if (args.wholeFrames) t = Math.round(t * FPS) / FPS;
  if (args.before) t = base;
  L.startTime = t;
  starts.push({ index: L.index, name: L.name, startTime: L.startTime, inPoint: L.inPoint, startFrames: L.startTime * FPS });
  lines.push("layer " + L.index + " " + L.name + " start " + L.startTime + " s (" + (L.startTime * FPS) + " f)");
}

return { comp: c.name, id: c.id, layers: c.numLayers, step: STEP, stepFrames24: STEP * FPS, starts: starts, report: lines.join("\n") };
