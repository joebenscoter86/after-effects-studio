// Pixel headline style: ES3 builders, one per element, and one for a whole beat. No project mutation happens at load.
// Read styles/pixel-headline/STYLE.md first. A cut-out speaker on a light ground; a small lead-in line, one giant word in the
// accent colour that lands on the voice with a glow and a burst of pixel blocks, upright video cards that pop in after it, a
// drawn line, and a tail line; the camera pushes out at the start. Every move is keyed from measured signatures (SIG below).
// Loads after styles/aes-lib.jsx. Times: seconds in the comp; signature tables are in frames at 30 fps (time = frames / 30).
var AESPixelHeadline = (function () {
  var REF = { w: 1080, h: 1920, fps: 30 };
  var FAM = "Inter", FACE = "Bold";
  // ---- signatures (STYLE.md section 9): keys are [frames, value, inInfluence, outInfluence, inSpeed, outSpeed]
  // speeds in value units per frame at 30 fps; influences 0-1
  var SIG = {
    word: [[-1.6476, 0, .33, .0732, 0, .1005], [8.8981, 1.1558, .8947, .0965, 0, 0], [13.8943, .9199, .3108, .4608, 0, 0], [24.9269, 1, .6656, .33, 0, 0]],
    card: [[-1.4255, 0, .33, .1316, 0, 0], [5.5032, 1.0776, 1.0, .6861, 0, 0], [13.2673, .8538, .5232, .3431, 0, 0], [23.0886, 1, .8505, .33, 0, 0]],
    push: [[0, 1.7149, .33, .02, 0, -.734], [42, 1, .3848, .33, 0, 0]],
    leadStrength: [[-1.865, 100, .33, .01, 0, -2.322], [26.119, 0, .823, .33, 0, 0]],
    tailStrength: [[-.376, 100, .33, .066, 0, -2.182], [26.078, 0, .842, .33, 0, 0]],
    leadDelay: 4.75, tailDelay: 6.4, leadDrop: 136, tailSlide: 154, tailBlur: 10,
    deepGlow: { keys: [[-2, 0], [0, .64], [24.26, 0]], eases: [[33, 33], [30.7, 83.3], [5, 33]] },
    // stock fallback: a copy of the word with two Glows, its opacity keyed per frame from W - 1 (linear)
    stockGlow: { glows: [[30, 110, 1.803], [30, 420, .35]], from: -1,
      opacity: [0, 55.3, 69, 69.9, 69.9, 69.8, 69.8, 69.8, 67.3, 61.6, 53.9, 53.8, 45.6, 45.6, 47.5, 51, 51, 49.7, 46.1, 42.3, 39.6, 35.2, 27.5, 16.4, 0] },
    cardFirst: 8, cardStagger: 4, cardBlur: 70, cardExposure: 2, cardHold: 7, cardClear: 12,
    card3WidthShare: .278, cardRect: [790, 1100], cardRound: 60, rimScale: 106, rimBlur: 25, rimExposure: .15, clipScale: 76,
    cardTop: .244, cardMargin: .029, cardStep: .046, cardOverlap: .35,
    line: { width: 18, draw: [7.5, 18], wipe: [15, 22] },
    blocks: { cell: 39, strongOpacity: [70, 100], weakOpacity: [25, 50], weakRatio: .7, reach: 2.6, clusterMax: 2, minLife: 3,
      // The schedule, per frame from W: how many strong blocks are on, and the distance from the word's centre (in word
      // half-sizes) at which new ones appear. Both were fitted on renders so that what shows matches the measured curves
      // below; many blocks fall behind the letters, which is why the counts run higher than what is seen.
      count: [0, 2, 2, 3, 60, 66, 88, 89, 39, 36, 34, 22, 10, 9, 3, 2, 1, 0],
      dist: [.34, .62, .62, .62, .355, .427, .488, .68, 1.111, 1.645, 1.667, 2.174, 1.999, 2.193, .258, .565, .24, 1.04],
      // what the reference shows, per frame from W (608-wide picture): strong red outside the word (px), and the visible
      // blocks' mean distance from the word's centre in half-sizes (null: none visible). The check, not the input.
      seenRed: [7, 429, 697, 973, 6307, 6701, 8827, 11260, 6800, 6959, 8297, 7525, 6104, 5825, 2860, 2076, 811, 55],
      seenDist: [null, .32, .32, .32, .61, .59, .59, .67, .82, 1.01, 1.15, 1.51, 1.58, 1.76, .73, .87, null, null],
      sides: { above: .327, below: .122, left: .401, right: .15 }, lineFree: 6 },
    type: { wordSize: .284, wordMax: .85, wordBaseline: .275, wordPivotUp: 18, leadSize: 64, leadBaseline: .147, tailSize: 86, tailBaseline: .318 },
    pushLead: 18
  };
  function k(comp) { return comp.width / REF.w; }
  function sec(frames) { return frames / REF.fps; }
  function dims(prop) { var sp = prop.propertyValueType === PropertyValueType.TwoD_SPATIAL || prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL;
    return (!sp && prop.value instanceof Array) ? prop.value.length : 1; }
  function clampInf(x) { return Math.max(.1, Math.min(100, x * 100)); }
  // write signature keys: at (s), keys as above, mul scales values and speeds, vec makes a value a vector (scale)
  function sigKeys(prop, at, keysIn, mul, vec) {
    var times = [], vals = [], i, n;
    for (i = 0; i < keysIn.length; i++) { var v = keysIn[i][1] * mul; times.push(at + sec(keysIn[i][0])); vals.push(vec ? vecOf(v, vec) : v); }
    prop.setValuesAtTimes(times, vals);
    var d = dims(prop), B = KeyframeInterpolationType.BEZIER;
    for (i = 0; i < keysIn.length; i++) { var q = keysIn[i], ki = prop.nearestKeyIndex(times[i]), a = [], b = [];
      for (n = 0; n < d; n++) { a.push(new KeyframeEase(q[4] * mul * REF.fps, clampInf(q[2]))); b.push(new KeyframeEase(q[5] * mul * REF.fps, clampInf(q[3]))); }
      prop.setInterpolationTypeAtKey(ki, B, B); prop.setTemporalEaseAtKey(ki, a, b); }
    return prop; }
  function vecOf(v, n) { var a = []; for (var i = 0; i < n; i++) a.push(v); return a; }
  function linearKeys(prop, times, vals) { prop.setValuesAtTimes(times, vals); var L = KeyframeInterpolationType.LINEAR;
    for (var i = 0; i < times.length; i++) { var ki = prop.nearestKeyIndex(times[i]); prop.setInterpolationTypeAtKey(ki, L, L); } return prop; }
  function holdKeys(prop, times, vals) { prop.setValuesAtTimes(times, vals); var H = KeyframeInterpolationType.HOLD;
    for (var i = 0; i < times.length; i++) prop.setInterpolationTypeAtKey(prop.nearestKeyIndex(times[i]), H, H); return prop; }
  function fontOK() { AESLib.font(FAM, FACE); return true; }
  function hasEffect(mn) { var e = app.effects; for (var i = 0; i < e.length; i++) if (e[i].matchName === mn) return true; return false; }
  function motionBlur(comp, layers) { comp.motionBlur = true; for (var i = 0; i < layers.length; i++) if (layers[i] && layers[i].motionBlur !== undefined) try { layers[i].motionBlur = true; } catch (e) {} return layers.length; }
  function effect(L, mn, name) { var e = L.property("ADBE Effect Parade").addProperty(mn); if (name) e.name = name;
    return L.property("ADBE Effect Parade").property(L.property("ADBE Effect Parade").numProperties); }

  // ---- stage: the ground and the graded speaker. o = { take (FootageItem), takeStart (s into the take at the comp's 0),
  //      scale (%), x, ground [r,g,b], grade { mixer [r,g,b], inBlack, inWhite, gamma, saturation } }
  function stage(comp, o) {
    var W = comp.width, H = comp.height, g = o.ground || [.8, .8, .81];
    var G = comp.layers.addSolid(g, "PH Ground", W, H, 1, comp.duration);
    var r = effect(G, "ADBE Ramp");
    r.property("Start of Ramp").setValue([W / 2, H * .469]); r.property("Start Color").setValue([g[0] + .04, g[1] + .04, g[2] + .04]);
    r.property("End of Ramp").setValue([W / 2, H * 1.198]); r.property("End Color").setValue([g[0] - .06, g[1] - .06, g[2] - .06]); r.property("Ramp Shape").setValue(2);
    effect(G, "ADBE Noise2").property("Amount of Noise").setValue(1.3);
    var S = null;
    if (o.take) { S = comp.layers.add(o.take); S.name = "PH Speaker"; if (S.hasAudio) S.audioEnabled = false;
      if (o.takeStart) S.startTime = -o.takeStart;
      S.anchorPoint.setValue([o.take.width / 2, o.take.height]); S.position.setValue([o.x === undefined ? W / 2 : o.x, H]);
      var sc = o.scale || 100; S.scale.setValue([sc, sc]);
      var q = o.grade;
      if (q) { var m = effect(S, "ADBE CHANNEL MIXER"); m.property("Red-Red").setValue(q.mixer[0]); m.property("Green-Green").setValue(q.mixer[1]); m.property("Blue-Blue").setValue(q.mixer[2]);
        var lv = effect(S, "ADBE Easy Levels2"); lv.property("Input Black").setValue(q.inBlack); lv.property("Input White").setValue(q.inWhite); lv.property("Gamma").setValue(q.gamma); lv.property("Output Black").setValue(0);
        effect(S, "ADBE HUE SATURATION").property("Master Saturation").setValue(q.saturation); } }
    return { ground: G, speaker: S }; }

  // ---- the text reveal (native: one animator, an Expression Selector based on words, two sliders). Each word reads the
  //      Strength slider at time - (its index - 1) x Delay / 30 s. Strength 100 = fully offset and clear; 0 = in place.
  function reveal(L, at, strength, delay, offset, blur) {
    var fx = L.property("ADBE Effect Parade");
    fx.addProperty("ADBE Slider Control").name = "Reveal Strength";
    fx.addProperty("ADBE Slider Control").name = "Reveal Delay";
    L.property("ADBE Effect Parade").property("Reveal Delay").property(1).setValue(delay);
    sigKeys(L.property("ADBE Effect Parade").property("Reveal Strength").property(1), at, strength, 1, 0);
    var ans = L.property("ADBE Text Properties").property("ADBE Text Animators"); ans.addProperty("ADBE Text Animator").name = "PH Reveal";
    function an() { return L.property("ADBE Text Properties").property("ADBE Text Animators").property("PH Reveal"); }
    an().property("ADBE Text Selectors").addProperty("ADBE Text Expressible Selector").name = "PH Words";
    var sel = an().property("ADBE Text Selectors").property("PH Words");
    sel.property("ADBE Text Range Type2").setValue(3);
    sel.property("ADBE Text Expressible Amount").expression = 'var s = effect("Reveal Strength")(1).valueAtTime(time - (textIndex - 1) * effect("Reveal Delay")(1) / 30);\n[s, s, s];';
    an().property("ADBE Text Animator Properties").addProperty("ADBE Text Position 3D");
    an().property("ADBE Text Animator Properties").property("ADBE Text Position 3D").setValue([offset[0], offset[1], 0]);
    an().property("ADBE Text Animator Properties").addProperty("ADBE Text Opacity");
    an().property("ADBE Text Animator Properties").property("ADBE Text Opacity").setValue(0);
    if (blur) { an().property("ADBE Text Animator Properties").addProperty("ADBE Text Blur"); an().property("ADBE Text Animator Properties").property("ADBE Text Blur").setValue([blur, blur]); }
    return L; }
  // ---- lead-in line. o = { text, at (s: the line's spoken start), colour }
  function leadIn(comp, o) { var s = k(comp), T = SIG.type;
    var L = AESLib.text(comp, "PH Lead-in", o.text, { family: FAM, style: FACE, size: T.leadSize * s, color: o.colour || [1, 1, 1], just: "center", pos: [comp.width / 2, comp.height * T.leadBaseline] });
    reveal(L, o.at, SIG.leadStrength, SIG.leadDelay, [0, -SIG.leadDrop * s], 0);
    return L; }
  // ---- tail line. o = { text, at (s: its spoken start), colour, under (the giant word's layer, to clear its descenders) }
  function tail(comp, o) { var s = k(comp), T = SIG.type, y = comp.height * T.tailBaseline;
    if (o.under) { var r = o.under.sourceRectAtTime(o.at, false), sz = o.under.property("Source Text").value.fontSize, below = r.top + r.height;
      if (below > .05 * sz) y += below; }
    var L = AESLib.text(comp, "PH Tail", o.text, { family: FAM, style: FACE, size: T.tailSize * s, color: o.colour || [1, 1, 1], just: "center", pos: [comp.width / 2, y] });
    reveal(L, o.at, SIG.tailStrength, SIG.tailDelay, [-SIG.tailSlide * s, 0], SIG.tailBlur * s);
    return L; }

  // ---- giant word and its glow. o = { text, at (s: W, the stressed word's spoken start), colour, glow ("auto"|"deep"|"stock"),
  //      exposure (Deep Glow's peak, default the signature's) }. Returns { layer, glow, box (settled, comp px) }
  function heroWord(comp, o) { var s = k(comp), T = SIG.type, W = comp.width, base = comp.height * T.wordBaseline, size = T.wordSize * W;
    var L = AESLib.text(comp, "PH Word", o.text, { family: FAM, style: FACE, size: size, color: o.colour || [1, 0, 0], just: "center", pos: [W / 2, base] });
    var r = L.sourceRectAtTime(o.at + 1, false);
    if (r.width > T.wordMax * W) { size *= T.wordMax * W / r.width; var td = L.property("Source Text").value; td.fontSize = size; L.property("Source Text").setValue(td); r = L.sourceRectAtTime(o.at + 1, false); }
    L.anchorPoint.setValue([0, -T.wordPivotUp * s]); L.position.setValue([W / 2, base - T.wordPivotUp * s]);
    sigKeys(L.scale, o.at, SIG.word, 100, dims(L.scale));
    L.inPoint = o.at;
    var mode = o.glow || "auto", used = mode === "auto" ? (hasEffect("PEDG2") ? "deep" : "stock") : mode;
    if (used === "deep") { var e = effect(L, "PEDG2"), x = e.property(25), D = SIG.deepGlow, pk = o.exposure || D.keys[1][1], t = [], v = [];
      for (var i = 0; i < D.keys.length; i++) { t.push(o.at + sec(D.keys[i][0])); v.push(D.keys[i][1] ? pk : 0); }
      x.setValuesAtTimes(t, v); var B = KeyframeInterpolationType.BEZIER;
      for (i = 0; i < t.length; i++) { var ki = x.nearestKeyIndex(t[i]); x.setInterpolationTypeAtKey(ki, B, B);
        x.setTemporalEaseAtKey(ki, [new KeyframeEase(0, D.eases[i][0])], [new KeyframeEase(0, D.eases[i][1])]); } }
    var C = null;
    if (used !== "deep") { C = L.duplicate(); C.name = "PH Word glow"; C.moveAfter(L); var S = SIG.stockGlow;
      for (var g = 0; g < S.glows.length; g++) { var gl = effect(C, "ADBE Glo2"); gl.property("Glow Threshold").setValue(S.glows[g][0]); gl.property("Glow Radius").setValue(S.glows[g][1] * s); gl.property("Glow Intensity").setValue(S.glows[g][2]); }
      var tt = [], vv = []; for (var f = 0; f < S.opacity.length; f++) { tt.push(o.at + sec(S.from + f)); vv.push(S.opacity[f]); }
      linearKeys(C.opacity, tt, vv); }
    // the settled box in comp px (anchor offset folded in)
    var box = { x0: W / 2 + r.left, x1: W / 2 + r.left + r.width, y0: base + r.top, y1: base + r.top + r.height };
    return { layer: L, glowLayer: C, glow: used, box: box, size: size }; }

  // ---- pixel blocks. A pure schedule (no AE), then one shape layer of grid squares with Hold opacity keys.
  function rng(seed) { var s = (Math.abs(Math.floor(seed || 7)) % 2147483646) + 1; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  // o = { box {x0,x1,y0,y1}, width, height (comp), seed, cell (px), lineBand [y0, y1] (keep clear until lineFree) }
  // returns [{ x, y, w, h, on, off (frames from W), opacity, d }]
  function blockSchedule(o) {
    var B = SIG.blocks, R = rng(o.seed), c = o.cell || B.cell, bx = o.box, cx = (bx.x0 + bx.x1) / 2, cy = (bx.y0 + bx.y1) / 2, hw = (bx.x1 - bx.x0) / 2, hh = (bx.y1 - bx.y0) / 2;
    var cells = [], sides = ["above", "below", "left", "right"], i, j;
    for (i = 0; i * c < o.width; i++) for (j = 1; j * c < o.height * .45; j++) {
      var x = i * c + c / 2, y = j * c + c / 2, nx = (x - cx) / hw, ny = (y - cy) / hh, d = Math.max(Math.abs(nx), Math.abs(ny));
      if (d > B.reach) continue;
      var dir = [-ny, ny, -nx, nx], best = 0; for (var q = 1; q < 4; q++) if (dir[q] > dir[best]) best = q;
      cells.push({ i: i, j: j, x: i * c, y: j * c, d: d, side: sides[best], line: o.lineBand ? (y + c / 2 > o.lineBand[0] && y - c / 2 < o.lineBand[1]) : false }); }
    var out = [];
    function run(counts, strong) {
      var act = [], taken = { above: 0, below: 0, left: 0, right: 0 }, used = {};
      for (var f = 0; f < counts.length; f++) {
        var n = counts[f], D = dist[Math.min(f, dist.length - 1)];
        // when there are too many, the ones furthest from this frame's distance go; and one block a frame that has fallen
        // behind the run (more than .35 inside it) is replaced, so the burst travels
        act.sort(function (a, b) { return Math.abs(b.d - D) - Math.abs(a.d - D); });
        while (act.length > n) { var b0 = act.shift(); b0.off = f; used[b0.i + "," + b0.j] = 0; }
        act.sort(function (a, b) { return a.d - b.d; });
        if (act.length && act[0].d < D - .35 && f - act[0].on >= B.minLife) { var b1 = act.shift(); b1.off = f; used[b1.i + "," + b1.j] = 0; }
        var guard = 0;
        while (act.length < n && guard++ < 400) {
          var tot = taken.above + taken.below + taken.left + taken.right + 1, side = "above", gap = -9;
          for (var s in B.sides) { var g = B.sides[s] - taken[s] / tot; if (g > gap) { gap = g; side = s; } }
          var pool = [];
          for (var p = 0; p < cells.length; p++) { var cc = cells[p];
            if (cc.side !== side || used[cc.i + "," + cc.j] || (cc.line && f < B.lineFree)) continue;
            if (cc.d >= D - .1 && cc.d <= D + .4) pool.push(cc); }
          if (!pool.length) { var near = 9; for (p = 0; p < cells.length; p++) { cc = cells[p]; if (cc.side === side && !used[cc.i + "," + cc.j] && !(cc.line && f < B.lineFree)) near = Math.min(near, Math.abs(cc.d - D)); }
            for (p = 0; p < cells.length; p++) { cc = cells[p]; if (cc.side === side && !used[cc.i + "," + cc.j] && !(cc.line && f < B.lineFree) && Math.abs(cc.d - D) <= near + .15) pool.push(cc); } }
          if (!pool.length) { taken[side] += 1; continue; }
          var pick = pool[Math.floor(R() * pool.length)], run1 = [pick], extra = Math.floor(R() * (B.clusterMax + 1));
          for (var e2 = 0; e2 < extra; e2++) { var last = run1[run1.length - 1], dd = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(R() * 4)];
            for (p = 0; p < cells.length; p++) if (cells[p].i === last.i + dd[0] && cells[p].j === last.j + dd[1] && !used[cells[p].i + "," + cells[p].j] && !(cells[p].line && f < B.lineFree)) { run1.push(cells[p]); break; } }
          taken[side] += 1;
          for (var r1 = 0; r1 < run1.length && act.length < n; r1++) { var cl = run1[r1], lo = strong ? B.strongOpacity : B.weakOpacity;
            var blk = { i: cl.i, j: cl.j, x: cl.x, y: cl.y, w: c, h: c, d: cl.d, on: f, off: null, opacity: lo[0] + R() * (lo[1] - lo[0]) };
            used[cl.i + "," + cl.j] = 1; act.push(blk); out.push(blk); } } }
      for (var a = 0; a < act.length; a++) act[a].off = counts.length; }
    var strongC = [], weakC = [], area = (o.width * o.height) / (REF.w * REF.h), count = o.count || B.count, dist = o.dist || B.dist;
    for (i = 0; i < count.length; i++) { strongC.push(Math.round(count[i] * area)); weakC.push(Math.round(count[i] * area * B.weakRatio)); }
    run(strongC, true); run(weakC, false);
    return out; }
  // o = { word (heroWord's result), at (W), colour, seed, lineBand }
  function pixelBlocks(comp, o) { var blocks = blockSchedule({ box: o.word.box, width: comp.width, height: comp.height, seed: o.seed || 7, cell: SIG.blocks.cell * k(comp), lineBand: o.lineBand, count: o.count, dist: o.dist });
    var L = comp.layers.addShape(); L.name = "PH Pixels"; var root = L.property("ADBE Root Vectors Group");
    for (var b = 0; b < blocks.length; b++) { var q = blocks[b], g = root.addProperty("ADBE Vector Group"); g.name = "B" + (b + 1);
      var rr = root.property(b + 1).property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Rect");
      rr.property("ADBE Vector Rect Size").setValue([q.w, q.h]); rr.property("ADBE Vector Rect Position").setValue([q.x + q.w / 2 - comp.width / 2, q.y + q.h / 2 - comp.height / 2]);
      root.property(b + 1).property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(o.colour || [1, 0, 0]);
      holdKeys(root.property(b + 1).property("ADBE Vector Transform Group").property("ADBE Vector Group Opacity"), [0, o.at + sec(q.on), o.at + sec(q.off)], [0, q.opacity, 0]); }
    return { layer: L, blocks: blocks }; }

  // ---- one card. o = { clip (FootageItem), clipStart (s in the clip at the card's first frame), at (s: F), pos [x, y], scale (S, %), name }
  function card(comp, o) { var R = SIG.cardRect, nm = o.name || "PH Card";
    var C = app.project.items.addComp(nm, REF.w, REF.h, 1, comp.duration, comp.frameRate);
    function rect(name, sc) { var L = C.layers.addShape(); L.name = name; var g = L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
      var gs = L.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group"); var rr = gs.addProperty("ADBE Vector Shape - Rect");
      rr.property("ADBE Vector Rect Size").setValue(R); rr.property("ADBE Vector Rect Roundness").setValue(SIG.cardRound);
      L.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue([1, 1, 1]);
      L.position.setValue([REF.w / 2, REF.h / 2]); L.scale.setValue([sc, sc]); return L; }
    var outer = rect("Outer", SIG.rimScale);
    var rim = C.layers.addSolid([1, 1, 1], "Rim", REF.w, REF.h, 1, comp.duration); rim.adjustmentLayer = true;
    var rb = effect(rim, "ADBE Gaussian Blur 2"); rb.property("Blurriness").setValue(SIG.rimBlur); rb.property("Repeat Edge Pixels").setValue(1);
    effect(rim, "ADBE Exposure2").property("Exposure").setValue(SIG.rimExposure);
    var inner = rect("Inner", 100);
    var clip = C.layers.add(o.clip); clip.name = "Clip"; if (clip.hasAudio) clip.audioEnabled = false;
    clip.startTime = o.at - (o.clipStart || 0); clip.scale.setValue([SIG.clipScale, SIG.clipScale]); clip.position.setValue([REF.w / 2, REF.h / 2]);
    clip.setTrackMatte(inner, TrackMatteType.ALPHA); rim.setTrackMatte(outer, TrackMatteType.ALPHA);
    var bl = effect(clip, "ADBE Gaussian Blur 2"); bl.property("Repeat Edge Pixels").setValue(1);
    var t3 = [o.at - sec(2), o.at + sec(SIG.cardHold), o.at + sec(SIG.cardClear)];
    AESLib.ease(bl.property("Blurriness"), t3, [SIG.cardBlur, SIG.cardBlur, 0], "travel");
    AESLib.ease(effect(clip, "ADBE Exposure2").property("Exposure"), t3, [SIG.cardExposure, SIG.cardExposure, 0], "travel");
    var L = comp.layers.add(C); L.name = nm; if (L.hasAudio) L.audioEnabled = false; L.position.setValue(o.pos);
    sigKeys(L.scale, o.at, SIG.card, o.scale, dims(L.scale));
    return L; }
  // card size and positions for n cards. o = { n, side ("left"|"right"), comp size, face {x0,y0,x1,y1} }
  // returns { scale (%), w, h, pos: [[x, y]...], warnings: [] }
  function stackLayout(o) { var W = o.width, H = o.height, R = SIG.cardRect, n = o.n, warn = [];
    var w3 = SIG.card3WidthShare * W, h3 = w3 * R[1] / R[0], span = h3 * (1 + (1 - SIG.cardOverlap) * 2);
    var h = n > 0 ? span / (1 + (1 - SIG.cardOverlap) * (n - 1)) : 0, w = h * R[0] / R[1];
    var dir = o.side === "right" ? -1 : 1, x0 = o.side === "right" ? W - SIG.cardMargin * W - w / 2 : SIG.cardMargin * W + w / 2;
    var step = SIG.cardStep * W, pos = [], i;
    function place(sgn) { var p = []; for (var i = 0; i < n; i++) p.push([x0 + dir * sgn * i * step, SIG.cardTop * H + h / 2 + i * h * (1 - SIG.cardOverlap)]); return p; }
    function hitsFace(p) { if (!o.face) return false; var pk = SIG.card[1][1];
      for (var i = 0; i < p.length; i++) { var hw = w * pk / 2, hh = h * pk / 2;
        if (p[i][0] + hw > o.face.x0 && p[i][0] - hw < o.face.x1 && p[i][1] + hh > o.face.y0 && p[i][1] - hh < o.face.y1) return true; } return false; }
    function inFrame(p) { for (var i = 0; i < p.length; i++) if (p[i][0] - w / 2 < 0 || p[i][0] + w / 2 > W) return false; return true; }
    // toward the speaker (the reference); if that reaches the face, away from it; if that leaves the frame, a straight column
    pos = place(1);
    if (hitsFace(pos)) { pos = place(-1); if (!inFrame(pos)) pos = place(0);
      if (hitsFace(pos)) warn.push("cards reach the face at their peak scale; use fewer cards, the other side, or a smaller speaker"); }
    // the card layer's scale: the visible card (rim included) is w wide; the rim is SIG.rimScale % of the inner rect
    return { w: w, h: h, pos: pos, warnings: warn, cardScale: 100 * (w / (SIG.rimScale / 100)) / R[0] }; }
  // o = { clips: [{ item, start }], at (W), side, face }
  function cardStack(comp, o) { var lay = stackLayout({ n: o.clips.length, side: o.side || "left", width: comp.width, height: comp.height, face: o.face }), layers = [], F = [];
    for (var i = 0; i < o.clips.length; i++) { var Fi = o.at + sec(SIG.cardFirst + i * SIG.cardStagger); F.push(Fi);
      layers.push(card(comp, { clip: o.clips[i].item, clipStart: o.clips[i].start, at: Fi, pos: lay.pos[i], scale: lay.cardScale, name: "PH Card " + (i + 1) })); }
    return { layers: layers, first: F, layout: lay, path: linePath(comp, lay, o.side || "left", o.word) }; }
  // the drawn line's path from a stack layout: under the word, through the cards, curling toward the speaker
  function linePath(comp, lay, side, word) { var W = comp.width, H = comp.height, p = lay.pos, n = p.length, s = side === "right" ? -1 : 1, mid = p[Math.min(1, n - 1)], last = p[n - 1];
    var top = word ? word.box.y1 : H * SIG.type.wordBaseline, x1 = p[0][0] + s * .039 * W;
    return { vertices: [[x1, top], [x1, mid[1] + .025 * H], [last[0] - s * .007 * W, last[1] + .02 * H], [last[0] + s * .129 * W, last[1] + lay.h / 2 + .038 * H]],
      inTangents: [[0, 0], [0, -.083 * H], [-s * .023 * W, -.047 * H], [-s * .056 * W, -.021 * H]], outTangents: [[0, .083 * H], [0, .047 * H], [s * .037 * W, .047 * H], [0, 0]] }; }
  // o = { at (W), path, colour, cards (n, for the draw time) }
  function drawnLine(comp, o) { var L = comp.layers.addShape(); L.name = "PH Line"; var g = L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    var gs = L.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group"), sh = new Shape(), P = o.path, v = [], i;
    for (i = 0; i < P.vertices.length; i++) v.push([P.vertices[i][0] - comp.width / 2, P.vertices[i][1] - comp.height / 2]);
    sh.vertices = v; sh.inTangents = P.inTangents; sh.outTangents = P.outTangents; sh.closed = false;
    gs.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(sh);
    var st = L.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Stroke");
    st.property("ADBE Vector Stroke Color").setValue(o.colour || [1, 0, 0]); st.property("ADBE Vector Stroke Width").setValue(SIG.line.width * k(comp));
    L.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").addProperty("ADBE Vector Filter - Trim");
    var tr = L.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property("ADBE Vector Filter - Trim");
    var extra = Math.max(0, ((o.cards || 3) - 3) * SIG.cardStagger), D = SIG.line;
    linearKeys(tr.property("ADBE Vector Trim End"), [o.at + sec(D.draw[0]), o.at + sec(D.draw[1] + extra)], [0, 100]);
    linearKeys(tr.property("ADBE Vector Trim Start"), [o.at + sec(D.wipe[0] + extra), o.at + sec(D.wipe[1] + extra)], [0, 100]);
    L.position.setValue([comp.width / 2, comp.height / 2]);
    return L; }

  // ---- push. o = { at (s: P), pivotY (the face's height in the settled frame), layers, sway [{ f, r }] (the speaker's own head
  //      size over the push, frames from P, as a ratio to P + 40; divided out when it moves by more than 3 %) }
  function push(comp, o) { var N = comp.layers.addNull(comp.duration); N.name = "PH Camera"; N.position.setValue([comp.width / 2, comp.height / 2]);
    for (var i = 0; i < o.layers.length; i++) if (o.layers[i]) o.layers[i].parent = N;
    sigKeys(N.scale, o.at, SIG.push, 100, dims(N.scale));
    var py = o.pivotY === undefined ? comp.height * .444 : o.pivotY, divided = false;
    var expr = "var s = transform.scale[1] / 100;\n[" + (comp.width / 2) + ", " + py + " + (" + (comp.height / 2) + " - " + py + ") * s];";
    if (o.sway && o.sway.length) { var dev = 0; for (i = 0; i < o.sway.length; i++) dev = Math.max(dev, Math.abs(o.sway[i].r - 1));
      if (dev > .03) { divided = true; var sl = effect(N, "ADBE Slider Control", "Speaker sway"), t = [], v = [], last = 0;
        for (i = 0; i < o.sway.length; i++) { t.push(o.at + sec(o.sway[i].f)); v.push(100 / o.sway[i].r); last = o.sway[i].f; }
        t.push(o.at + sec(last + 10)); v.push(100); linearKeys(sl.property(1), t, v);
        N.scale.expression = 'var k = effect("Speaker sway")(1) / 100;\n[value[0] * k, value[1] * k];'; } }
    N.position.expression = expr;
    return { layer: N, divided: divided }; }

  // ---- a whole beat. brief = { type ("opener"|"punch"), take, takeStart, speakerScale, speakerX, face {x0,y0,x1,y1}, pivotY, sway,
  //      words: [{ text, t (s, spoken start) }], stressed (index in words), split: [leadEnd, tailStart] (default around the
  //      stressed word), clips: [{ item, start }], side, accent [r,g,b], ground [r,g,b], grade, push (bool), glow, seed, pushAt }
  function beat(comp, brief) { fontOK(); var rep = { warnings: [] }, b = brief, words = b.words, si = b.stressed, i;
    var W = words[si].t, lead = [], tl = [], lEnd = b.split ? b.split[0] : si, tStart = b.split ? b.split[1] : si + 1;
    for (i = 0; i < lEnd; i++) lead.push(words[i].text); for (i = tStart; i < words.length; i++) tl.push(words[i].text);
    var type = b.type || "opener", st = stage(comp, { take: b.take, takeStart: b.takeStart, scale: b.speakerScale, x: b.speakerX, ground: b.ground, grade: b.grade });
    var scene = [st.speaker], stack = null, line = null, L = null, T = null;
    if (type === "opener" && b.clips && b.clips.length) { stack = cardStack(comp, { clips: b.clips, at: W, side: b.side || "left", face: b.face, word: { box: { y1: comp.height * SIG.type.wordBaseline } } });
      for (i = 0; i < stack.layers.length; i++) scene.push(stack.layers[i]); rep.cards = stack.first; rep.warnings = rep.warnings.concat(stack.layout.warnings); }
    if (stack) { line = drawnLine(comp, { at: W, path: stack.path, colour: b.accent, cards: b.clips.length }); scene.push(line); }
    if (type === "opener" && lead.length) { L = leadIn(comp, { text: lead.join(" "), at: words[0].t }); scene.push(L); rep.leadAt = words[0].t; }
    var hw = heroWord(comp, { text: words[si].text, at: W, colour: b.accent, glow: b.glow, exposure: b.exposure });
    var px = pixelBlocks(comp, { word: hw, at: W, colour: b.accent, seed: b.seed, count: b.blockCount, dist: b.blockDist, lineBand: L ? [comp.height * SIG.type.leadBaseline - 50 * k(comp), comp.height * SIG.type.leadBaseline + 8 * k(comp)] : null });
    px.layer.moveAfter(hw.glowLayer || hw.layer); scene.push(px.layer, hw.layer); if (hw.glowLayer) scene.push(hw.glowLayer);   // blocks under the word and its glow
    if (type === "opener" && tl.length) { T = tail(comp, { text: tl.join(" "), at: words[tStart].t, under: hw.layer }); scene.push(T); rep.tailAt = words[tStart].t; }
    var pu = null; if (b.push !== false && type === "opener") { pu = push(comp, { at: b.pushAt !== undefined ? b.pushAt : (L ? words[0].t - sec(SIG.pushLead) : W - sec(48)), pivotY: b.pivotY, layers: scene, sway: b.sway }); rep.pushAt = pu.layer.scale.keyTime(1); rep.swayDivided = pu.divided; }
    motionBlur(comp, scene.concat([st.ground]));
    rep.W = W; rep.glow = hw.glow; rep.wordBox = hw.box; rep.wordSize = hw.size; rep.blocks = px.blocks.length;
    if (stack) { rep.cardScale = stack.layout.cardScale; rep.cardPos = stack.layout.pos; rep.linePath = stack.path.vertices; }
    return rep; }

  return { SIG: SIG, fontOK: fontOK, hasEffect: hasEffect, stage: stage, push: push, leadIn: leadIn, heroWord: heroWord, blockSchedule: blockSchedule,
    pixelBlocks: pixelBlocks, card: card, stackLayout: stackLayout, cardStack: cardStack, linePath: linePath, drawnLine: drawnLine, tail: tail,
    motionBlur: motionBlur, beat: beat, reveal: reveal };
})();
