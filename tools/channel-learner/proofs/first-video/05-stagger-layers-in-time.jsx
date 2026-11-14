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
var DUR = 5;

// Rebuild with artwork (2026-11-14): art from PROOF/05/art (brief.md). Pass args.artLib (art.jsx) and args.artDir.
// The bars become ten picture cards (slices of one panorama) on paper. In place of the Scale Y grow, each card arrives
// over 0.45 s: Position y +70 px to rest with a slight overshoot, Opacity 0 -> 100, Scale 94 -> 100 %. The keys sit
// on card 01 before duplicating; each copy swaps its source (replaceSource keeps keyframes and effects).
// VERIFY (rebuild): layer.replaceSource(item, false) keeps keyframes and effects; Drop Shadow Opacity's range.
$.evalFile(args.artLib);
var ARTDIR = args.artDir;

var c = P.freshComp("05 stagger layers", 1920, 1080, FPS, DUR, ART.hex("#E9E4DD"));
// Remove the plain build's unused off-white "background" solids (P.freshComp removes the comp, not its solids).
(function () { var i, it; for (i = app.project.numItems; i >= 1; i--) { it = app.project.item(i); if (it instanceof FootageItem && it.name === "background" && it.mainSource instanceof SolidSource && Math.abs(it.mainSource.color[0] - 0.93) < 0.005 && Math.abs(it.mainSource.color[2] - 0.89) < 0.005 && it.usedIn.length === 0) it.remove(); } })();

var bg = c.layers.add(ART.footage(ARTDIR, "paper.png", "art 05"));
bg.name = "background";

function cardName(k) { return "card-" + (k < 10 ? "0" + k : "" + k) + ".png"; }
var REST_Y = 800, RISE = 70, ARRIVE = 0.45, SC = 50;
var first = c.layers.add(ART.footage(ARTDIR, cardName(1), "art 05"));
first.name = "card 01";
P.tf(first, "ADBE Anchor Point").setValue([136, 1040]);
var pos = P.tf(first, "ADBE Position");
pos.setValueAtTime(0, [240, REST_Y + RISE]);
pos.setValueAtTime(ARRIVE * 0.7, [240, REST_Y - 6]);
pos.setValueAtTime(ARRIVE, [240, REST_Y]);
var sc = P.tf(first, "ADBE Scale");
sc.setValueAtTime(0, [SC * 0.94, SC * 0.94]);
sc.setValueAtTime(ARRIVE * 0.7, [SC * 1.01, SC * 1.01]);
sc.setValueAtTime(ARRIVE, [SC, SC]);
var op = P.tf(first, "ADBE Opacity");
op.setValueAtTime(0, 0);
op.setValueAtTime(ARRIVE * 0.55, 100);
// Ease out: fast start, soft landing on every key after the first.
var props = [pos, sc, op], pi, kk, dims;
for (pi = 0; pi < props.length; pi++) {
  for (kk = 1; kk <= props[pi].numKeys; kk++) {
    dims = props[pi] === op ? 1 : 1; // spatial Position and 2D Scale take one ease; Scale takes one per dimension
    var eIn = new KeyframeEase(0, kk === 1 ? 33 : 75), eOut = new KeyframeEase(0, kk === 1 ? 10 : 33);
    if (props[pi] === sc) props[pi].setTemporalEaseAtKey(kk, [eIn, eIn, eIn], [eOut, eOut, eOut]);
    else props[pi].setTemporalEaseAtKey(kk, [eIn], [eOut]);
  }
}
// Brief: soft drop shadow so the cards sit on the paper (#2A2420, 30 %, 160 deg, distance 14, softness 30 on screen;
// the effect works in the layer's own pixels, at 50 % scale, so the values are doubled).
var ds = P.effect(first, "ADBE Drop Shadow");
var dsOp = null;
(function () {
  var j, pr;
  for (j = 1; j <= ds.numProperties; j++) {
    pr = ds.property(j);
    if (pr.name === "Opacity") { dsOp = pr.hasMax ? pr.maxValue : null; pr.setValue(pr.hasMax && pr.maxValue > 100 ? 0.3 * pr.maxValue : 30); }
  }
})();
ART.setFx(first.property("ADBE Effect Parade").property(1), { "Shadow Color": ART.hex("#2A2420"), "Direction": 160, "Distance": 28, "Softness": 60 });

// Duplicate up the stack: each copy lands on top, one slot (160 px) to the right, with its own slice.
var cur = first, k, x;
for (k = 2; k <= N; k++) {
  cur = cur.duplicate();
  cur.name = "card " + (k < 10 ? "0" + k : "" + k);
  cur.replaceSource(ART.footage(ARTDIR, cardName(k), "art 05"), false);
  x = 240 + 160 * (k - 1);
  pos = P.tf(cur, "ADBE Position");
  for (kk = 1; kk <= pos.numKeys; kk++) pos.setValueAtKey(kk, [x, pos.keyValue(kk)[1]]);
}

// SUBSTITUTE: the Ctrl+Alt / Cmd+Option drag of the selected layer bars in the timeline (interface only).
// Same result by property: the i-th layer counted from the bottom of the stack (i = 0 for the bottom) starts at base + i * step.
// The cards are layers 1..N; the paper is layer N + 1 and is not staggered.
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

return { dropShadowOpacityMax: dsOp, keysOnCard10: c.layer("card 10").property("ADBE Transform Group").property("ADBE Position").numKeys, comp: c.name, id: c.id, layers: c.numLayers, step: STEP, stepFrames24: STEP * FPS, starts: starts, report: lines.join("\n") };
