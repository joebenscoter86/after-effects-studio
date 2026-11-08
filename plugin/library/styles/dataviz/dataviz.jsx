// Data storytelling style: brand-neutral ES3 helpers. No project mutation happens at load.
// Read styles/dataviz/STYLE.md first. One sheet of cream paper under a 2D camera (a world null); every mark is a real number; a red and blue
// pencil draws the marks; handwritten notes (Caveat) are pinned to values with a wobbly leader and an un-closed ring; colour encodes the value
// only (a diverging ramp centred on the mean); transitions are chart operations (axes grow, the scale ratchets, the series morphs), never fades.
// Adapted from Lemo-Opuscar's dataviz style (MIT, LemoLab); see assets/LICENSE-lemo-opuscar.txt.
var AESDataviz = (function () {
  var SERIF = "Newsreader", MONO = "IBM Plex Mono", HAND = "Caveat";
  function hex(h) { return [parseInt(h.substr(1, 2), 16) / 255, parseInt(h.substr(3, 2), 16) / 255, parseInt(h.substr(5, 2), 16) / 255]; }
  var PALETTE = { paper: hex("#F5F0E6"), dots: hex("#D9D0BF"), ink: hex("#2B2622"), grid: hex("#E3DACA"), mean: hex("#CDBFA8"), note: hex("#8A8176"),
    blue: hex("#2F5E9E"), red: hex("#B8323A"), wood: hex("#E8C69B"), woodDark: hex("#C99D6B"), print: [1, 1, 1] };
  // RdBu, seven stops: -1 (far below the reference) is deep blue, 0 is the paper-pale centre, +1 is deep red
  var RAMP = ["#2166AC", "#4393C3", "#92C5DE", "#F2EEE8", "#F4A582", "#D6604D", "#B2182B"];
  function ramp(t) { t = Math.max(-1, Math.min(1, t)); var f = (t + 1) / 2 * (RAMP.length - 1), i = Math.min(RAMP.length - 2, Math.floor(f)), u = f - i, a = hex(RAMP[i]), b = hex(RAMP[i + 1]);
    return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]; }
  function fontOK() { AESLib.font(SERIF, "Medium"); AESLib.font(SERIF, "Regular"); AESLib.font(MONO, "Regular"); AESLib.font(HAND, "Regular"); return true; }

  // ---- keys
  function keys(prop, times, vals, interp) { prop.setValuesAtTimes(times, vals); var I = interp || KeyframeInterpolationType.LINEAR;
    for (var i = 0; i < times.length; i++) prop.setInterpolationTypeAtKey(prop.nearestKeyIndex(times[i]), I, I); return prop; }
  function hold(prop, times, vals) { return keys(prop, times, vals, KeyframeInterpolationType.HOLD); }

  // ---- type: one text layer anchored on its baseline at the ink's left edge, its right edge or its centre (whatever AE's justification does)
  function txt(comp, name, str, fam, style, size, color, x, y, align) {
    var L = AESLib.text(comp, name, str, { family: fam, style: style, size: size, color: color, just: "left" });   // always set left, then align by the anchor (the old "AE ignores justification" was a chained-conditional bug in AESLib.text, fixed 2026-10-16)
    var r = L.sourceRectAtTime(0, false), ax = r.left; if (align === "right") ax = r.left + r.width; else if (align === "center") ax = r.left + r.width / 2;
    L.anchorPoint.setValue([ax, 0]); L.position.setValue([x, y]); if (align === "right" || align === "center") ALIGNED.push([L, align]); return L; }
  // the rect AE reports straight after a text layer is made can be stale (a right label came out anchored from another rect), so every
  // right or centred label is anchored again once the build is done
  var ALIGNED = [];
  function realign() { for (var i = 0; i < ALIGNED.length; i++) { var L = ALIGNED[i][0], r = L.sourceRectAtTime(L.inPoint, false);
    L.anchorPoint.setValue([ALIGNED[i][1] === "right" ? r.left + r.width : r.left + r.width / 2, 0]); } var n = ALIGNED.length; ALIGNED = []; return n; }
  function width(L) { return L.sourceRectAtTime(0, false).width; }
  // write-on (a mask whose right edge travels with the pencil, linear) and an optional erase (the left edge follows it out)
  function writeOn(L, t0, t1, e0, e1) { var r = L.sourceRectAtTime(t1, false), l = r.left - 8, rt = r.left + r.width + 10, tp = r.top - 14, bt = r.top + r.height + 18;
    function box(a, b) { var s = new Shape(); s.vertices = [[a, tp], [b, tp], [b, bt], [a, bt]]; s.closed = true; return s; }
    var mp = L.property("ADBE Mask Parade").addProperty("ADBE Mask Atom").property("ADBE Mask Shape"), ts = [t0, t1], vs = [box(l, l), box(l, rt)];
    if (e0 !== undefined) { ts.push(e0, e1); vs.push(box(l, rt), box(rt, rt)); L.outPoint = e1; }
    keys(mp, ts, vs); L.inPoint = t0; return L; }

  // ---- shapes
  function shapeLayer(comp, name, pos) { var L = comp.layers.addShape(); L.name = name; L.anchorPoint.setValue([0, 0]); L.position.setValue(pos || [0, 0]); return L; }
  function group(L, nm) { var g = L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group"); g.name = nm; return g; }
  function contents(g) { return g.property("ADBE Vectors Group"); }
  function fill(g, c) { contents(g).addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(c); }
  function stroke(g, c, w) { var s = contents(g).addProperty("ADBE Vector Graphic - Stroke"); s.property("ADBE Vector Stroke Color").setValue(c); s.property("ADBE Vector Stroke Width").setValue(w);
    s.property("ADBE Vector Stroke Line Cap").setValue(2); s.property("ADBE Vector Stroke Line Join").setValue(2); }
  function poly(pts, closed) { var s = new Shape(); s.vertices = pts; s.closed = !!closed; return s; }
  function pathIn(g, shp) { contents(g).addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(shp); }
  function rectIn(g, w, h, x, y, rnd) { var r = contents(g).addProperty("ADBE Vector Shape - Rect"); r.property("ADBE Vector Rect Size").setValue([w, h]);
    r.property("ADBE Vector Rect Position").setValue([x, y]); if (rnd) r.property("ADBE Vector Rect Roundness").setValue(rnd); }
  function trimOf(L, gi, which) { return L.property("ADBE Root Vectors Group").property(gi).property("ADBE Vectors Group").property("ADBE Vector Filter - Trim").property("ADBE Vector Trim " + which); }
  // a pencil or ink line along pts (world coords), drawn linear from t0 to t1 like a ruling pen
  function line(comp, name, pts, color, w, t0, t1, parent) { var L = shapeLayer(comp, name), g = group(L, "line"); pathIn(g, poly(pts)); stroke(g, color, w);
    contents(g).addProperty("ADBE Vector Filter - Trim"); keys(trimOf(L, 1, "End"), [t0, t1], [0, 100]); L.inPoint = t0; if (parent) L.parent = parent; return L; }
  function retract(L, t0, t1) { keys(trimOf(L, 1, "Start"), [t0, t1], [0, 100]); L.outPoint = t1; return L; }
  // a leader: a wobbly curve from a to b (a gentle bow to one side, never a straight rule); bs/ts key its far end so it follows a data-space pin
  function bow(a, b, side) { var dx = b[0] - a[0], dy = b[1] - a[1], m = [(a[0] + b[0]) / 2 - dy * .12 * side, (a[1] + b[1]) / 2 + dx * .12 * side], s = new Shape();
    s.vertices = [a, m, b]; s.inTangents = [[0, 0], [-dx / 4, -dy / 4], [0, 0]]; s.outTangents = [[0, 0], [dx / 4, dy / 4], [0, 0]]; s.closed = false; return s; }
  function leader(comp, name, a, b, color, t0, t1, parent, o) { o = o || {}; var L = shapeLayer(comp, name), g = group(L, "leader"); pathIn(g, bow(a, b, o.side || 1)); stroke(g, color, 2.2);
    contents(g).addProperty("ADBE Vector Filter - Trim"); keys(trimOf(L, 1, "End"), [t0, t1], [0, 100]); L.inPoint = t0;
    if (o.bs) { var sh = []; for (var i = 0; i < o.bs.length; i++) sh.push(bow(a, o.bs[i], o.side || 1));
      AESLib.ease(L.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property(1).property("ADBE Vector Shape"), o.ts, sh, "settle"); }
    if (parent) L.parent = parent; return L; }
  // the un-closed ring around a mark: drawn on in 0.16 s, its gap facing the leader (from = the leader's far end)
  function ring(comp, name, c, rad, color, t, from, parent) { var L = shapeLayer(comp, name, c), g = group(L, "ring"), e = contents(g).addProperty("ADBE Vector Shape - Ellipse");
    e.property("ADBE Vector Ellipse Size").setValue([2 * rad, 2 * rad]); stroke(g, color, 2.2); contents(g).addProperty("ADBE Vector Filter - Trim");
    var ang = from ? Math.atan2(from[0] - c[0], -(from[1] - c[1])) * 180 / Math.PI : 0; L.rotation.setValue(ang + 28);
    keys(trimOf(L, 1, "End"), [t, t + .16], [0, 85]); L.inPoint = t; if (parent) L.parent = parent; return L; }
  // a handwritten note (Caveat, in a pencil lead's colour) written on from t0 to t1
  function note(comp, name, str, color, x, y, t0, t1, parent, size) { var L = txt(comp, name, str, HAND, "Regular", size || 50, color, x, y); writeOn(L, t0, t1); if (parent) L.parent = parent; return L; }

  // ---- the red and blue pencil: only the tip end shows, from the lower right; its anchor is the tip. Lift reads as the shadow drifting out.
  function pencil(comp, name, parent) { var L = shapeLayer(comp, name), parts = [
      { nm: "body", pts: [[58, -15], [1400, -15], [1400, 15], [58, 15]], c: PALETTE.blue }, { nm: "facetHi", pts: [[58, -15], [1400, -15], [1400, -5], [58, -5]], c: [.42, .58, .8] },
      { nm: "facetLo", pts: [[58, 5], [1400, 5], [1400, 15], [58, 15]], c: [.15, .3, .52] }, { nm: "wood", pts: [[12, -3.5], [58, -15], [60, 0], [58, 15], [12, 3.5]], c: PALETTE.wood },
      { nm: "woodShade", pts: [[12, 0], [58, 5], [58, 15], [12, 3.5]], c: PALETTE.woodDark }, { nm: "lead", pts: [[0, 0], [12, -3.5], [12, 3.5]], c: PALETTE.blue } ];
    for (var i = parts.length - 1; i >= 0; i--) { var g = group(L, parts[i].nm); pathIn(g, poly(parts[i].pts, true)); fill(g, parts[i].c); }
    L.rotation.setValue(56);
    var fx = L.property("ADBE Effect Parade").addProperty("ADBE Drop Shadow");
    fx.property("Shadow Color").setValue([.17, .13, .1]); var op = fx.property("Opacity"); op.setValue(op.hasMax && op.maxValue > 100 ? 80 : 32);
    fx.property("Direction").setValue(94); fx.property("Distance").setValue(5); fx.property("Softness").setValue(10);
    if (parent) L.parent = parent; return L; }
  function pencilColors(L, t, from, to) { var names = ["body", "facetHi", "facetLo", "lead"], lift = [[.42, .58, .8], [.85, .5, .52]];
    for (var i = 0; i < names.length; i++) { var c = L.property("ADBE Root Vectors Group").property(names[i]).property("ADBE Vectors Group").property("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color");
      var a = from, b = to; if (names[i] === "facetHi") { a = lift[0]; b = lift[1]; } else if (names[i] === "facetLo") { a = [.15, .3, .52]; b = [.5, .12, .15]; }
      hold(c, [0, t], [a, b]); } }
  // a performance script for the pencil: taps (lift, land, a tiny rebound), writing (the tip dancing over the x-height) and moves. Keys go in at the end, one call per property.
  function Performer() { this.t = []; this.p = []; this.d = []; }
  Performer.prototype.push = function (t, p, d) { this.t.push(Math.max(0, t)); this.p.push(p); this.d.push(d); };
  Performer.prototype.tap = function (t, p, prevGap, nextGap) { if (prevGap > .2) this.push(t - .1, [p[0] + 16, p[1] - 30], 22);
    this.push(t, p, 4); if (nextGap > .14) { this.push(t + .05, [p[0] + 2, p[1] - 6], 8); this.push(t + .1, [p[0] + 1, p[1] - 2], 5); } };
  Performer.prototype.write = function (x0, y, w, t0, t1) { this.push(t0 - .08, [x0 + 10, y - 40], 20); var n = Math.max(2, Math.round((t1 - t0) / .045));
    for (var k = 0; k <= n; k++) this.push(t0 + (t1 - t0) * k / n, [x0 + w * k / n, y - 6 - (k % 2) * 16], 4); };
  Performer.prototype.move = function (t, p, d) { this.push(t, p, d === undefined ? 20 : d); };
  // events arrive in any order: sort them by time, then keep one per 1/60 s (the first added wins a tie)
  Performer.prototype.apply = function (L) { var ix = [], T = [], Pp = [], Dd = []; for (var i = 0; i < this.t.length; i++) ix.push(i);
    var self = this; ix.sort(function (a, b) { return self.t[a] - self.t[b] || a - b; });
    for (var j = 0; j < ix.length; j++) { var t = this.t[ix[j]]; if (T.length && t <= T[T.length - 1] + 1 / 60) continue; T.push(t); Pp.push(this.p[ix[j]]); Dd.push(this.d[ix[j]]); }
    L.position.setValuesAtTimes(T, Pp); var dim = L.position.value.length, z = dim === 3 ? [0, 0, 0] : [0, 0];
    for (var k = 1; k <= L.position.numKeys; k++) { L.position.setSpatialTangentsAtKey(k, z, z); L.position.setInterpolationTypeAtKey(k, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR); }
    var fx = L.property("ADBE Effect Parade").property(1); fx.property("Distance").setValuesAtTimes(T, Dd);
    var soft = []; for (var m = 0; m < Dd.length; m++) soft.push(8 + Dd[m] * 1.2); fx.property("Softness").setValuesAtTimes(T, soft); return T.length; };

  function wordsIn(list, t0, t1) { var r = []; for (var i = 0; i < list.length; i++) if (list[i].s >= t0 - .05 && list[i].s < t1 - .02) r.push(list[i]); return r; }
  function clearOwned(comp, prefix) { AESLib.clearOwned(comp, prefix); }

  // buildScene: the shared test scene (the library's seven-beat test scene) as a data story. comp = an empty 1080 x 1920 comp at scene.fps.
  // Sheet A (top of the paper): one dot per spoken word, its height the word's real length in seconds, coloured on a ramp centred on the mean.
  // Sheet B (1500 px further down the same paper): the real frame pinned as a print, then the clip's real brightness, one value per frame (338),
  // which breaks the frame at the cut and makes the scale ratchet. The camera pans down to B and back; the carry is the series morphing into
  // stripes; the end is one red note.
  function buildScene(comp, scene, opts) {
    fontOK(); ALIGNED = []; var P = opts.prefix || "DATAVI", PAL = PALETTE, A = opts.assets, B = scene.beat, W = comp.width, H = comp.height, notes = [];
    var WL = scene.wordList, SER = AESLib.readJSON(A.series), V = SER.values, NF = V.length, OFF = 1500;
    clearOwned(comp, P);
    // the world: one sheet of paper under a 2D camera (a null at the origin; camera keys go on last, after everything is parented)
    var WORLD = comp.layers.addNull(); WORLD.name = P + "_WORLD"; WORLD.anchorPoint.setValue([0, 0]); WORLD.position.setValue([0, 0]);
    var paper = comp.layers.addSolid(PAL.paper, P + "_PAPER", W, 3500, 1); paper.anchorPoint.setValue([0, 0]); paper.position.setValue([0, 0]); paper.parent = WORLD;
    var fib = comp.layers.addSolid([.5, .5, .5], P + "_FIBRE", W, 3500, 1); fib.anchorPoint.setValue([0, 0]); fib.position.setValue([0, 0]); fib.parent = WORLD;
    try { var fn = fib.property("ADBE Effect Parade").addProperty("ADBE Fractal Noise"); fn.property("Contrast").setValue(80); fn.property("Complexity").setValue(4);
      try { fn.property("Transform").property("Scale").setValue(14); } catch (e0) {}
      fib.blendingMode = BlendingMode.MULTIPLY; fib.opacity.setValue(4); } catch (e) { notes.push("fractal noise fibre skipped: " + e.toString()); fib.enabled = false; }
    // the dot grid in world space (it pans with the paper)
    var dg = shapeLayer(comp, P + "_DOTGRID", [18, 18]), dgg = group(dg, "dot"), de = contents(dgg).addProperty("ADBE Vector Shape - Ellipse");
    de.property("ADBE Vector Ellipse Size").setValue([3.4, 3.4]); fill(dgg, PAL.dots);
    var r1 = dg.property("ADBE Root Vectors Group").addProperty("ADBE Vector Filter - Repeater"); r1.property("ADBE Vector Repeater Copies").setValue(30);
    r1.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([36, 0]);
    var r2 = dg.property("ADBE Root Vectors Group").addProperty("ADBE Vector Filter - Repeater"); r2.property("ADBE Vector Repeater Copies").setValue(97);
    r2.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([0, 36]); dg.parent = WORLD;

    // ================= sheet A: the spoken words
    var x0 = 170, x1 = 990, top = 560, bot = 1160, PH = bot - top, VMAX = 1, N = WL.length;
    function xa(i) { return x0 + 24 + i * (x1 - x0 - 48) / (N - 1); }
    function ya(v) { return bot - v / VMAX * PH; }
    var dur = [], sum = 0; for (var i = 0; i < N; i++) { dur.push(Math.round((WL[i].e - WL[i].s) * 100) / 100); sum += dur[i]; }
    var mean = sum / N, span = 0; for (var i2 = 0; i2 < N; i2++) span = Math.max(span, Math.abs(dur[i2] - mean));
    // the headline is the chart's own (Newsreader, world space), each word set on its spoken onset; the kicker is the measure, in mono
    var hw = wordsIn(WL, B.title.t0, B.title.t1), heads = (B.title.context + " " + B.title.hero).split(" "), split = B.title.context.split(" ").length, hx = 120;
    for (var h = 0; h < heads.length; h++) { var hy = h < split ? 300 : 400; if (h === split) hx = 120;
      var HL = txt(comp, P + "_HEAD" + h, heads[h], SERIF, "Medium", 96, PAL.ink, hx, hy); HL.inPoint = hw[h] ? hw[h].s : B.title.t0 + .15 * h; HL.parent = WORLD; hx += width(HL) + 24; }
    var kick = txt(comp, P + "_KICKA", "Length of each spoken word, seconds · one dot per word", MONO, "Regular", 24, PAL.note, 124, 462); kick.inPoint = .25; kick.parent = WORLD;
    // the plot grows: gridlines, then the y axis and the x axis drawn like a ruler, ticks in mono, the mean as the reference line
    for (var g = 0; g <= 4; g++) { var gv = g / 4 * VMAX, gl = line(comp, P + "_GRIDA" + g, [[x0, ya(gv)], [x1, ya(gv)]], PAL.grid, 1.5, .3 + .05 * g, .7 + .05 * g, WORLD);
      var tl = txt(comp, P + "_TICKA" + g, (gv === 0 ? "0" : gv.toFixed(2)) + (g === 4 ? " s" : ""), MONO, "Regular", 22, PAL.note, x0 - 16, ya(gv) + 8, "right"); tl.inPoint = .4 + .05 * g; tl.parent = WORLD; }
    line(comp, P + "_YAXIS", [[x0, bot], [x0, top - 10]], PAL.ink, 2.2, .15, .55, WORLD);
    line(comp, P + "_XAXIS", [[x0, bot], [x1, bot]], PAL.ink, 2.2, .2, .7, WORLD);
    var xl = [0, 9, 19, 29, N - 1]; for (var q = 0; q < xl.length; q++) { var XL = txt(comp, P + "_XLAB" + q, String(xl[q] + 1), MONO, "Regular", 22, PAL.note, xa(xl[q]), bot + 38, "center"); XL.inPoint = .5 + .04 * q; XL.parent = WORLD; }
    var wl = txt(comp, P + "_XUNIT", "word", MONO, "Regular", 22, PAL.note, x1, bot + 72, "right"); wl.inPoint = .7; wl.parent = WORLD;
    var ml = line(comp, P + "_MEAN", [[x0, ya(mean)], [x1, ya(mean)]], PAL.mean, 2, .75, 1.05, WORLD);
    var mt = txt(comp, P + "_MEANL", "mean " + mean.toFixed(2) + " s", MONO, "Regular", 20, PAL.note, x1, ya(mean) - 10, "right"); mt.inPoint = 1.0; mt.parent = WORLD;
    // the series line: one path through every dot, drawn to each dot as its word is spoken
    var pts = [], cum = [0]; for (var p = 0; p < N; p++) pts.push([xa(p), ya(dur[p])]);
    for (var p2 = 1; p2 < N; p2++) cum.push(cum[p2 - 1] + Math.sqrt(Math.pow(pts[p2][0] - pts[p2 - 1][0], 2) + Math.pow(pts[p2][1] - pts[p2 - 1][1], 2)));
    var SL = shapeLayer(comp, P + "_SERIES"), sg = group(SL, "line"); pathIn(sg, poly(pts)); stroke(sg, PAL.ink, 2.4); contents(sg).addProperty("ADBE Vector Filter - Trim");
    var st = [], sv = []; for (var p3 = 0; p3 < N; p3++) { var ts = Math.max(WL[p3].s, .06); if (st.length && ts <= st[st.length - 1] + .01) ts = st[st.length - 1] + .02; st.push(ts); sv.push(cum[p3] / cum[N - 1] * 100); }
    keys(trimOf(SL, 1, "End"), st, sv); SL.inPoint = st[0] - .01; SL.parent = WORLD;
    // the dots: each lands with a short pop and a thin ripple (none when marks arrive closer than 0.1 s); in the carry each morphs into a stripe
    var carryT = B.carry.t0 + .1, stripeW = (x1 - x0 - 48) / (N - 1) + .8, DOTS = [];
    for (var d = 0; d < N; d++) { var c = ramp((dur[d] - mean) / span), D = shapeLayer(comp, P + "_DOT" + d, pts[d]), mg = group(D, "mark");
      rectIn(mg, 17, 17, 0, 0, 8.5); fill(mg, c); stroke(mg, PAL.ink, 1.6);
      var gapP = d ? st[d] - st[d - 1] : 1, gapN = d < N - 1 ? st[d + 1] - st[d] : 1, rip = gapP >= .1 && gapN >= .1;
      if (rip) { var rg = group(D, "ripple"), re = contents(rg).addProperty("ADBE Vector Shape - Ellipse"); re.property("ADBE Vector Ellipse Size").setValue([17, 17]); stroke(rg, c, 1.6); }
      D.parent = WORLD; DOTS.push(D);
      var t = st[d]; D.inPoint = t; AESLib.ease(D.scale, [t, t + .06, t + .15], [[0, 0], [128, 128], [100, 100]], "settle");
      if (rip) { var tr = D.property("ADBE Root Vectors Group").property("ripple").property("ADBE Vector Transform Group");
        keys(tr.property("ADBE Vector Scale"), [t, t + .45], [[100, 100], [330, 330]]); keys(tr.property("ADBE Vector Group Opacity"), [t, t + .45], [80, 0]); }
      // the morph: a staggered sweep, each mark easing into a stripe the height of the plot (warming-stripes grammar: no axes needed)
      var m0 = Math.max(carryT + d * .018, t + .16), m1 = m0 + .42, R = D.property("ADBE Root Vectors Group").property("mark").property("ADBE Vectors Group");
      AESLib.ease(R.property(1).property("ADBE Vector Rect Size"), [m0, m1], [[17, 17], [stripeW, PH]], "travel");
      AESLib.ease(R.property(1).property("ADBE Vector Rect Position"), [m0, m1], [[0, 0], [0, (top + bot) / 2 - pts[d][1]]], "travel");
      AESLib.ease(R.property(1).property("ADBE Vector Rect Roundness"), [m0, m1], [8.5, 0], "travel");
      AESLib.ease(R.property("ADBE Vector Graphic - Stroke").property("ADBE Vector Stroke Width"), [m0, m0 + .2], [1.6, 0], "travel"); }
    retract(SL, carryT - .05, carryT + .35);
    // the picture beat: three blue notes (memories, human scale) pinned to the dots of the words that say it
    var pw = wordsIn(WL, B.picture.t0, B.picture.t1), objs = B.picture.objects, pin = [6, 8, 10], NP = [[200, 650], [430, 606], [640, 660]], PERF = new Performer(), nA = [];
    for (var o = 0; o < objs.length && o < 3; o++) { var k = Math.min(pin[o], N - 1), nt0 = (pw[o * 2] ? pw[o * 2].s : B.picture.t0 + .5 * o) + .02, nt1 = nt0 + .42;
      var NL = note(comp, P + "_NOTE" + o, (o + 1) + " · a " + objs[o], PAL.blue, NP[o][0], NP[o][1], nt0, nt1, WORLD), nw = width(NL);
      PERF.write(NP[o][0], NP[o][1], nw, nt0, nt1);
      var la = [NP[o][0] + 30, NP[o][1] + 16], dc = pts[k], dv = [la[0] - dc[0], la[1] - dc[1]], dl = Math.sqrt(dv[0] * dv[0] + dv[1] * dv[1]), lb = [dc[0] + dv[0] / dl * 22, dc[1] + dv[1] / dl * 22];
      var LD = leader(comp, P + "_LEAD" + o, la, lb, PAL.blue, nt1 - .02, nt1 + .16, WORLD, { side: o % 2 ? -1 : 1 }), RG = ring(comp, P + "_RING" + o, dc, 20, PAL.blue, nt1 + .14, la, WORLD);
      nA.push([NL, LD, RG, dc[0]]); }
    // ================= sheet B: the real frame and the clip's 338 real values
    var IN = B.input, NU = B.number, bx0 = 170, bx1 = 990, btop = 2380, bbot = 2840, BH = bbot - btop;
    var ph = comp.layers.add(AESLib.importFile(A.frame)); ph.name = P + "_PRINT"; var pw0 = ph.source.width, ph0 = ph.source.height;
    var card = shapeLayer(comp, P + "_PRINTCARD", [160, 1690]), cg = group(card, "card"); rectIn(cg, pw0 + 20, ph0 + 20, (pw0 + 20) / 2, (ph0 + 20) / 2); fill(cg, PAL.print);
    var sfx = card.property("ADBE Effect Parade").addProperty("ADBE Drop Shadow"); var sop = sfx.property("Opacity"); sop.setValue(sop.hasMax && sop.maxValue > 100 ? 60 : 24);
    sfx.property("Direction").setValue(150); sfx.property("Distance").setValue(6); sfx.property("Softness").setValue(16);
    ph.moveBefore(card); ph.anchorPoint.setValue([0, 0]); ph.position.setValue([170, 1700]); ph.parent = card;   // the print rides on its card
    card.parent = WORLD; card.anchorPoint.setValue([0, 0]); var pinT = IN.t0 + .32;
    AESLib.ease(card.scale, [pinT - .12, pinT], [[106, 106], [100, 100]], "settle"); AESLib.ease(card.rotation, [pinT - .12, pinT], [-4, -1.5], "settle"); card.inPoint = pinT - .12; ph.inPoint = pinT - .12;
    var fl = txt(comp, P + "_PRINTL", "frame 135 of " + NF, MONO, "Regular", 22, PAL.note, 172, 2262); fl.inPoint = pinT + .15; fl.parent = WORLD;
    var iw = wordsIn(WL, IN.t0, IN.t1), b1t0 = (iw[3] ? iw[3].s : IN.t0 + .6), b1 = note(comp, P + "_NOTEB0", "a real frame", PAL.blue, 530, 1820, b1t0, b1t0 + .32, WORLD),
      b2 = note(comp, P + "_NOTEB1", "from my video", PAL.blue, 556, 1882, b1t0 + .36, b1t0 + .72, WORLD);
    PERF.move(IN.t0 + .3, [480, 1690], 24); PERF.move(pinT, [482, 1700], 4); PERF.write(530, 1820, width(b1), b1t0, b1t0 + .32); PERF.write(556, 1882, width(b2), b1t0 + .36, b1t0 + .72);
    leader(comp, P + "_LEADB", [526, 1846], [486, 1930], PAL.blue, b1t0 + .7, b1t0 + .86, WORLD, { side: -1 });
    // plot B arrives with its unit: the heading names the measure, the axes grow, the frame ticks land
    var axT = IN.t0 + .55, bh = txt(comp, P + "_KICKB", "Brightness of each frame of the clip · " + NF + " frames", MONO, "Regular", 24, PAL.note, 124, btop - 44); bh.inPoint = axT; bh.parent = WORLD;
    function xb(f) { return bx0 + 14 + f * (bx1 - bx0 - 28) / (NF - 1); }
    var RNG = [[155, 175], [140, 180], [100, 180], [0, 200]];
    function yb(v, r) { return bbot - (v - r[0]) / (r[1] - r[0]) * BH; }
    for (var gb = 0; gb <= 4; gb++) line(comp, P + "_GRIDB" + gb, [[bx0, bbot - gb * BH / 4], [bx1, bbot - gb * BH / 4]], PAL.grid, 1.5, axT + .05 * gb, axT + .35 + .05 * gb, WORLD);
    line(comp, P + "_YAXISB", [[bx0, bbot], [bx0, btop - 10]], PAL.ink, 2.2, axT, axT + .35, WORLD);
    var XB = line(comp, P + "_XAXISB", [[bx0, bbot], [bx1, bbot]], PAL.ink, 2.2, axT + .05, axT + .45, WORLD);
    var fticks = [0, 100, 200, 300]; for (var fq = 0; fq < fticks.length; fq++) { var FT = txt(comp, P + "_XLABB" + fq, String(fticks[fq]), MONO, "Regular", 22, PAL.note, xb(fticks[fq]), bbot + 38, "center"); FT.inPoint = axT + .2 + .05 * fq; FT.parent = WORLD; }
    var F338 = txt(comp, P + "_XLABBN", String(NF), MONO, "Regular", 22, PAL.ink, xb(NF - 1), bbot + 38, "center"); F338.inPoint = axT + .45; F338.parent = WORLD;
    var fu = txt(comp, P + "_XUNITB", "frame", MONO, "Regular", 22, PAL.note, bx1, bbot + 72, "right"); fu.inPoint = axT + .45; fu.parent = WORLD;
    // the ratchet: draw in the calm range, break the frame at the cut, hold the pierced state, then the scale clicks out in eased steps
    var d0 = NU.t0 + .06, dCut = d0 + .6, dEnd = dCut + .08, cutF = 309; for (var cf = 1; cf < NF; cf++) if (V[cf] < RNG[0][0]) { cutF = cf - 1; break; }
    function tf(f) { return f <= cutF ? d0 + (dCut - d0) * f / cutF : dCut + (dEnd - dCut) * (f - cutF) / (NF - 1 - cutF); }
    var c0 = dEnd + .17, RT = [c0, c0 + .08, c0 + .13, c0 + .21, c0 + .26, c0 + .34], RI = [0, 1, 1, 2, 2, 3];
    function series(r) { var a = []; for (var f = 0; f < NF; f++) a.push([xb(f), yb(V[f], r)]); return poly(a); }
    var BL = shapeLayer(comp, P + "_SERIESB"), bg = group(BL, "line"); pathIn(bg, series(RNG[0])); stroke(bg, PAL.ink, 2.4); contents(bg).addProperty("ADBE Vector Filter - Trim");
    var shp = []; for (var ri = 0; ri < RT.length; ri++) shp.push(series(RNG[RI[ri]]));
    AESLib.ease(BL.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property(1).property("ADBE Vector Shape"), RT, shp, "settle");
    var bp = [], bl = [0]; for (var f2 = 0; f2 < NF; f2++) bp.push([xb(f2), yb(V[f2], RNG[0])]);
    for (var f3 = 1; f3 < NF; f3++) bl.push(bl[f3 - 1] + Math.sqrt(Math.pow(bp[f3][0] - bp[f3 - 1][0], 2) + Math.pow(bp[f3][1] - bp[f3 - 1][1], 2)));
    var bt = [], bv = []; for (var f4 = 0; f4 < NF; f4 += 6) { bt.push(tf(f4)); bv.push(bl[f4] / bl[NF - 1] * 100); } bt.push(tf(NF - 1)); bv.push(100);
    keys(trimOf(BL, 1, "End"), bt, bv); BL.inPoint = d0 - .01; BL.parent = WORLD;
    // the scar where the line tore through the axis stays
    var sx = xb(cutF + 1), scar = shapeLayer(comp, P + "_SCAR"), scg = group(scar, "scar");
    pathIn(scg, poly([[sx - 16, bbot - 3], [sx - 9, bbot + 6], [sx - 3, bbot - 5], [sx + 4, bbot + 7], [sx + 10, bbot - 4], [sx + 16, bbot + 3]])); stroke(scg, PAL.ink, 2); scar.inPoint = tf(cutF + 2); scar.parent = WORLD;
    // y ticks re-label on each click (mono, padded to three places so they never drift)
    for (var yt = 0; yt <= 4; yt++) { var TB = txt(comp, P + "_TICKB" + yt, pad3(RNG[0][0] + yt * (RNG[0][1] - RNG[0][0]) / 4), MONO, "Regular", 22, PAL.note, bx0 - 16, bbot - yt * BH / 4 + 8, "right");
      TB.inPoint = axT + .1 + .05 * yt; TB.parent = WORLD; var tt = [], tv = [];
      for (var r3 = 1; r3 < RNG.length; r3++) { tt.push(RT[r3 * 2 - 1]); tv.push(pad3(RNG[r3][0] + yt * (RNG[r3][1] - RNG[r3][0]) / 4)); } AESLib.textKeys(TB, [0].concat(tt), [pad3(RNG[0][0] + yt * (RNG[0][1] - RNG[0][0]) / 4)].concat(tv)); }   // a key at 0 too: before its first key a text layer shows that key's value
    // frame 135 is the print's own mark: a data-space pin (its ring and leader follow every rescale)
    var f135 = 134, t135 = tf(f135), mk = [], ss = []; for (var m = 0; m < RT.length; m++) { mk.push([xb(f135), yb(V[f135], RNG[RI[m]])]); }
    var MK = shapeLayer(comp, P + "_MARK135", mk[0]), mkg = group(MK, "dot"), mke = contents(mkg).addProperty("ADBE Vector Shape - Ellipse"); mke.property("ADBE Vector Ellipse Size").setValue([15, 15]);
    fill(mkg, ramp(0)); stroke(mkg, PAL.ink, 1.8); MK.parent = WORLD; MK.inPoint = t135; AESLib.ease(MK.scale, [t135, t135 + .06, t135 + .15], [[0, 0], [130, 130], [100, 100]], "settle");
    AESLib.ease(MK.position, RT, mk, "settle");
    var la135 = [420, 2240]; for (var m2 = 0; m2 < mk.length; m2++) { var v2 = [la135[0] - mk[m2][0], la135[1] - mk[m2][1]], l2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1]); ss.push([mk[m2][0] + v2[0] / l2 * 22, mk[m2][1] + v2[1] / l2 * 22]); }
    leader(comp, P + "_LEAD135", la135, ss[0], PAL.blue, t135 + .05, t135 + .2, WORLD, { bs: ss, ts: RT, side: -1 });
    var R135 = ring(comp, P + "_RING135", mk[0], 20, PAL.blue, t135 + .18, la135, WORLD); AESLib.ease(R135.position, RT, mk, "settle");
    // the record, in red: the last frame, counted (the lead is flipped to red for it, a turn)
    var fin = [xb(NF - 1), yb(V[NF - 1], RNG[3])], rN0 = RT[5] + .06, rN1 = rN0 + .36, RN = note(comp, P + "_NOTER", NF + " frames, counted.", PAL.red, 520, 2560, rN0, rN1, WORLD);
    leader(comp, P + "_LEADR", [520 + width(RN) - 40, 2578], [fin[0] - 6, fin[1] - 22], PAL.red, rN1, rN1 + .14, WORLD);
    ring(comp, P + "_RINGR", fin, 20, PAL.red, rN1 + .12, [520 + width(RN) - 40, 2578], WORLD);
    PERF.move(axT - .05, [bx0 + 40, bbot + 60], 24);
    for (var f5 = 0; f5 <= cutF; f5 += 12) PERF.move(tf(f5), bp[f5], 5);
    var head = bp[cutF]; PERF.move(dCut + .05, [head[0] + 46, head[1] - 70], 30); PERF.move(c0 + .3, [head[0] + 46, head[1] - 70], 30);       // flinch: recoil and freeze
    PERF.write(520, 2560, width(RN), rN0, rN1);
    // ================= back to sheet A: the line beat, the carry (the morph), the end
    var LT = B.line.t0, LW = wordsIn(WL, B.line.t0, B.carry.t0);
    for (var w = 0; w < N; w++) { var tw = st[w]; if (tw < B.picture.t0 - .05 || (tw >= LT + .25 && tw < B.carry.t0)) PERF.tap(tw, pts[w], w ? tw - st[w - 1] : 1, w < N - 1 ? st[w + 1] - tw : 1); }
    for (var sw = 0; sw <= 6; sw++) PERF.move(carryT + .1 + sw * .12, [x0 + 30 + sw * (x1 - x0 - 60) / 6, bot + 10 - (sw % 2) * 14], 6);    // the pencil leads the sweep
    for (var e = 0; e < nA.length; e++) { var pass = carryT + Math.max(0, (nA[e][3] - x0) / (x1 - x0)) * .6; nA[e][0].outPoint = pass + .2; retract(nA[e][1], pass - .1, pass + .05); retract(nA[e][2], pass - .05, pass + .1);
      var em = nA[e][0].property("ADBE Mask Parade").property(1).property("ADBE Mask Shape"), ev = em.keyValue(2), r0 = ev.vertices, ers = poly([[r0[1][0], r0[0][1]], r0[1], r0[2], [r0[2][0], r0[3][1]]], true);
      keys(em, [pass - .12, pass + .12], [ev, ers]); }
    ml.outPoint = carryT + .7; mt.outPoint = carryT + .5;
    var ET = B.end.t0, lastS = [xa(N - 1), bot], eN0 = ET + .12, eN1 = eN0 + .44, EN = note(comp, P + "_NOTEEND", "that's the test.", PAL.red, 560, 1296, eN0, eN1, WORLD);
    leader(comp, P + "_LEADEND", [560 + width(EN) - 30, 1262], [lastS[0], lastS[1] + 24], PAL.red, eN1, eN1 + .14, WORLD, { side: -1 });
    PERF.move(ET - .05, [560, 1250], 24); PERF.write(560, 1296, width(EN), eN0, eN1); PERF.move(eN1 + .2, [lastS[0] + 6, lastS[1] + 30], 6);
    PERF.move(eN1 + .55, [lastS[0] + 8, lastS[1] + 34], 14); PERF.move(eN1 + 1.0, [1400, 1700], 60);                                    // hesitate, then exit: the story is the viewer's
    PERF.move(0, [pts[0][0] + 180, pts[0][1] + 230], 30);
    var PEN = pencil(comp, P + "_PENCIL", WORLD); PERF.apply(PEN); pencilColors(PEN, c0 + .2, PAL.blue, PAL.red);
    // ================= the caption band (screen space): the subtitle is the figure caption
    var band = shapeLayer(comp, P + "_BAND"), bdg = group(band, "band"); rectIn(bdg, W, H - 1590, W / 2, 1590 + (H - 1590) / 2); fill(bdg, PAL.paper);
    line(comp, P + "_BANDR", [[120, 1636], [W - 90, 1636]], PAL.ink, 1.2, .05, .45);
    var beats = scene.beats, KICK = ["words 1 to 6 of 36", "words 1 to 11 of 36", "frame 135 of " + NF, "frames 1 to " + NF, "words 1 to 27 of 36", "words 1 to 33, one stripe each", "all 36 words, " + scene.duration.toFixed(1) + " s"];
    for (var b = 0; b < beats.length; b++) { var bb = beats[b], KL = txt(comp, P + "_KICK" + b, KICK[b] || bb.id, MONO, "Regular", 22, PAL.note, 122, 1682); KL.inPoint = bb.t0; KL.outPoint = bb.t1;
      var cw = wordsIn(WL, bb.t0, bb.t1), cx = 120, cy = 1766;
      for (var cwi = 0; cwi < cw.length; cwi++) { var CL = txt(comp, P + "_CAP" + b + "_" + cwi, cw[cwi].text, SERIF, "Regular", 56, PAL.ink, cx, cy), ww = width(CL);
        if (cx > 120 && cx + ww > W - 90) { cx = 120; cy += 66; CL.position.setValue([cx, cy]); }
        CL.inPoint = Math.max(bb.t0, cw[cwi].s); CL.outPoint = bb.t1; cx += ww + 14; } }
    // the camera: pull and pan down the same paper to sheet B (more real data), then back
    AESLib.ease(WORLD.position, [IN.t0 - .02, IN.t0 + .5, LT + .1, LT + .56], [[0, 0], [0, -OFF], [0, -OFF], [0, 0]], "travel");
    realign();
    return { layers: comp.numLayers, notes: notes };
  }
  function pad3(v) { var s = String(Math.round(v)); while (s.length < 3) s = " " + s; return s; }
  return { SERIF: SERIF, MONO: MONO, HAND: HAND, PALETTE: PALETTE, ramp: ramp, fontOK: fontOK, txt: txt, writeOn: writeOn, line: line, retract: retract, leader: leader, ring: ring,
    note: note, pencil: pencil, Performer: Performer, wordsIn: wordsIn, clearOwned: clearOwned, buildScene: buildScene };
})();
