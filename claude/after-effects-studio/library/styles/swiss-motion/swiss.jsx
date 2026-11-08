// Swiss motion style: brand-neutral ES3 helpers. No project mutation happens at load.
// Read styles/swiss-motion/STYLE.md first. A column grid, one grotesque (Inter Tight), ink on paper with one signal colour. Every element
// arrives by a clip-reveal or a wipe that lands on the beat with one precise ease; deletions are knife cuts; nothing fades, bounces or glows.
// Adapted from Lemo-Opuscar's swiss-motion style (MIT, LemoLab); see assets/LICENSE-lemo-opuscar.txt.
var AESSwiss = (function () {
  var FAM = "Inter Tight";
  var PALETTE = { page: [.918, .914, .898], paper: [1, 1, 1], ink: [.067, .067, .067], grey: [.812, .808, .788], guide: [.84, .835, .82], note: [.43, .43, .42], signal: [.89, .024, .075] };
  var GRID = { margin: 72, cols: 6, gutter: 24 };                                            // 1080 wide: six 136 px columns, 24 px gutters
  function colW(comp, n) { var w = (comp.width - 2 * GRID.margin - (GRID.cols - 1) * GRID.gutter) / GRID.cols; return (n || 1) * w + ((n || 1) - 1) * GRID.gutter; }
  function colX(comp, i) { return GRID.margin + i * (colW(comp, 1) + GRID.gutter); }
  function fontOK() { AESLib.font(FAM, "Bold"); AESLib.font(FAM, "Medium"); return true; }
  function eases(prop, inf) { var sp = prop.propertyValueType === PropertyValueType.TwoD_SPATIAL || prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL;
    var d = (!sp && prop.value instanceof Array) ? prop.value.length : 1, a = []; for (var n = 0; n < d; n++) a.push(new KeyframeEase(0, inf)); return a; }
  // the snap: cubic-bezier(.7, 0, .2, 1) as an AE ease (zero speed, 70% out of the first key, 80% into the second). No overshoot, ever.
  function snap(prop, t0, t1, v0, v1) { prop.setValuesAtTimes([t0, t1], [v0, v1]);
    var k0 = prop.nearestKeyIndex(t0), k1 = prop.nearestKeyIndex(t1), B = KeyframeInterpolationType.BEZIER;
    prop.setInterpolationTypeAtKey(k0, B, B); prop.setTemporalEaseAtKey(k0, prop.keyInTemporalEase(k0), eases(prop, 70));
    prop.setInterpolationTypeAtKey(k1, B, B); prop.setTemporalEaseAtKey(k1, eases(prop, 80), prop.keyOutTemporalEase(k1)); return prop; }
  function linear(prop, t0, t1, v0, v1) { prop.setValuesAtTimes([t0, t1], [v0, v1]); var L = KeyframeInterpolationType.LINEAR;
    prop.setInterpolationTypeAtKey(prop.nearestKeyIndex(t0), L, L); prop.setInterpolationTypeAtKey(prop.nearestKeyIndex(t1), L, L); return prop; }
  function scaleOf(L, sx, sy) { var v = L.scale.value, r = []; for (var i = 0; i < v.length; i++) r.push(v[i]); r[0] = sx; r[1] = sy; return r; }
  function measure(comp, str, size, style) { var L = AESLib.text(comp, "SWISS_MEASURE", str, { family: FAM, style: style || "Bold", size: size, color: PALETTE.ink, just: "left", tracking: size >= 90 ? -20 : 0 });
    var r = L.sourceRectAtTime(0, false); L.remove(); return r.width; }
  // a word or line set flush left on a baseline, clip-revealed: it rises out of a fixed clip rect and lands on o.t (its spoken onset);
  // o.out lifts it out of the same clip. The clip is a mask keyed against the layer's move, so it stays still in the comp.
  // o = { x, y (baseline), size, style, color, t, out, dur, below (clip bottom in em, default .3), t1 }
  function word(comp, name, str, o) { var size = o.size, x = o.x, y = o.y, dur = o.dur || .24;
    var L = AESLib.text(comp, name, str, { family: FAM, style: o.style || "Bold", size: size, color: o.color || PALETTE.ink, just: "left", tracking: size >= 90 ? -20 : 0, pos: [x, y] });
    var r = L.sourceRectAtTime(0, false); L.anchorPoint.setValue([r.left, 0]); L.position.setValue([x, y]);   // anchor at the ink's left edge: flush left whatever AE's justification does
    var pad = .12 * size, l = r.left - pad, rt = r.left + r.width + pad, top = -1.1 * size, bot = (o.below === undefined ? .3 : o.below) * size, d = bot - top + 4;
    var mp = L.property("ADBE Mask Parade").addProperty("ADBE Mask Atom").property("ADBE Mask Shape");
    function box(dy) { var s = new Shape(); s.vertices = [[l, top + dy], [rt, top + dy], [rt, bot + dy], [l, bot + dy]]; s.closed = true; return s; }
    mp.setValue(box(0));
    if (o.t !== undefined) { var a = Math.max(0, o.t - dur); snap(L.position, a, a + dur, [x, y + d], [x, y]); snap(mp, a, a + dur, box(-d), box(0)); L.inPoint = a; }
    if (o.out !== undefined) { snap(L.position, o.out, o.out + dur, [x, y], [x, y - d]); snap(mp, o.out, o.out + dur, box(0), box(d)); L.outPoint = o.out + dur; }
    else if (o.t1 !== undefined) L.outPoint = o.t1;
    return L; }
  // words set flush left from x on baseline y, wrapping at maxW; times[i] is each word's landing. Returns the layers.
  function setLine(comp, pre, strs, times, o) { var cx = o.x, cy = o.y, sp = .26 * o.size, out = [];
    for (var i = 0; i < strs.length; i++) { var w = measure(comp, strs[i], o.size, o.style);
      if (cx > o.x && cx + w > o.x + o.maxW) { cx = o.x; cy += o.leading; }
      out.push(word(comp, pre + i, strs[i], { x: cx, y: cy, size: o.size, style: o.style, color: o.color, t: times[i], out: o.out === undefined ? undefined : o.out + i * (o.stagger || .04), t1: o.t1, below: o.below }));
      cx += w + sp; }
    return out; }
  // flat shapes in one layer, drawn in order (later on top); its anchor is the top-left, so scale wipes it down or right from there
  // items = [{ ellipse: bool, x, y, w, h, color }] in the layer's own space
  function shapes(comp, name, items, pos) { var L = comp.layers.addShape(); L.name = name; var root = L.property("ADBE Root Vectors Group");
    for (var i = items.length - 1; i >= 0; i--) { var it = items[i], v = root.addProperty("ADBE Vector Group").property("ADBE Vectors Group");
      var s = v.addProperty(it.ellipse ? "ADBE Vector Shape - Ellipse" : "ADBE Vector Shape - Rect");
      s.property(it.ellipse ? "ADBE Vector Ellipse Size" : "ADBE Vector Rect Size").setValue([it.w + 1, it.h + 1]);     // 1 px overdraw: no hairline seams
      s.property(it.ellipse ? "ADBE Vector Ellipse Position" : "ADBE Vector Rect Position").setValue([it.x + it.w / 2, it.y + it.h / 2]);
      v.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(it.color); }
    L.anchorPoint.setValue([0, 0]); L.position.setValue(pos); return L; }
  // a rule drawn along its length (linear, like a ruling pen) from t0 to t1; len along x, or along y when o.vertical
  function rule(comp, name, x, y, len, weight, color, t0, t1, o) { o = o || {}; var L = comp.layers.addShape(); L.name = name;
    var v = L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").property("ADBE Vectors Group"), p = new Shape();
    p.vertices = o.vertical ? [[0, 0], [0, len]] : [[0, 0], [len, 0]]; p.closed = false; v.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(p);
    var st = v.addProperty("ADBE Vector Graphic - Stroke"); st.property("ADBE Vector Stroke Color").setValue(color); st.property("ADBE Vector Stroke Width").setValue(weight);
    v.addProperty("ADBE Vector Filter - Trim"); linear(trim(L, "End"), t0, t1, 0, 100);
    L.position.setValue([x, y]); L.inPoint = t0; if (o.t1 !== undefined) L.outPoint = o.t1; return L; }
  function trim(L, which) { return L.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property("ADBE Vector Filter - Trim").property("ADBE Vector Trim " + which); }
  function retract(L, t0, t1) { linear(trim(L, "Start"), t0, t1, 0, 100); L.outPoint = t1; return L; }
  // a group null whose anchor sits at (x, y): children keep their own coordinates, and scaling it collapses or pushes about that point
  function group(comp, name, x, y, layers) { var N = comp.layers.addNull(); N.name = name; N.anchorPoint.setValue([x, y]); N.position.setValue([x, y]);
    for (var i = 0; i < layers.length; i++) layers[i].parent = N; return N; }
  // the knife cut: a signal line crosses the group at y (linear), then the group collapses to that midline (snap) and lands on t
  function knife(comp, name, N, x, y, len, t, o) { o = o || {}; var K = rule(comp, name, x, y, len, o.weight || 3, PALETTE.signal, t - .36, t - .2);
    var s = N.scale.valueAtTime(t - .2, false); snap(N.scale, t - .2, t, scaleOf(N, s[0], s[1]), scaleOf(N, s[0], 0)); if (!o.keep) retract(K, t, t + .14); return K; }
  // a photo module: the paper wipes in from the left, then the print wipes down onto it
  function photo(comp, name, path, x, y, w, h, t) { var Pp = shapes(comp, name + "_PAPER", [{ x: 0, y: 0, w: w, h: h, color: PALETTE.paper }], [x, y]);
    snap(Pp.scale, t - .3, t, scaleOf(Pp, 0, 100), scaleOf(Pp, 100, 100)); Pp.inPoint = t - .3;
    var Ph = comp.layers.add(AESLib.importFile(path)); Ph.name = name; Ph.anchorPoint.setValue([0, 0]); Ph.position.setValue([x, y]);
    var k = w / Ph.source.width * 100; snap(Ph.scale, t - .05, t + .25, scaleOf(Ph, k, 0), scaleOf(Ph, k, h / Ph.source.height * 100)); Ph.inPoint = t - .05;
    return [Pp, Ph]; }
  // the spoken words that start inside [t0, t1), in order
  function wordsIn(list, t0, t1) { var r = []; for (var i = 0; i < list.length; i++) if (list[i].s >= t0 - .05 && list[i].s < t1) r.push(list[i]); return r; }
  function clearOwned(comp, prefix) { AESLib.clearOwned(comp, prefix); }
  // buildScene: the shared test scene (the library's seven-beat test scene) in the Swiss style. comp = an empty 1080 x 1920 comp at scene.fps.
  // The title is the programme and holds the top of the page; the beats replace one another in the lower field; the photo is the artifact,
  // pushed to full bleed for the carry and knife-cut to the red rule the end card stands on.
  function buildScene(comp, scene, opts) {
    fontOK(); var P = opts.prefix || "SWISS", PAL = opts.palette || PALETTE, A = opts.assets, B = scene.beat, W = comp.width, H = comp.height, M = GRID.margin, notes = [];
    var WL = scene.wordList, FULL = colW(comp, 6), carryOut = B.carry.t0 - .1;
    clearOwned(comp, P);
    var page = comp.layers.addSolid(PAL.page, P + "_PAGE", W, H, 1);
    // the grid itself: column guides drawn top to bottom in a quick ripple, faint, for the whole film
    for (var g = 0; g <= GRID.cols; g++) { var gx = g < GRID.cols ? colX(comp, g) : W - M; rule(comp, P + "_GUIDE" + g, gx, 0, H, 1, PAL.guide, .02 * g, .5 + .02 * g, { vertical: true }); }
    // 1. title: a caption row under the top rule, a grey lead-in and the hero set large, each word landing on its spoken onset; a red rule bleeds
    var tw = wordsIn(WL, B.title.t0, B.title.t1), ctx = B.title.context.split(" "), hero = B.title.hero.split(" "), tTimes = [];
    for (var i = 0; i < tw.length; i++) tTimes.push(tw[i].s);
    var top = rule(comp, P + "_TOPRULE", M, 96, FULL, 2, PAL.ink, 0, .4); retract(top, carryOut, carryOut + .2);
    var caps = ["Swiss motion", "Shared test scene", "Grid 6 x 12"];
    for (var c = 0; c < caps.length; c++) word(comp, P + "_CAP" + c, caps[c], { x: colX(comp, 2 * c), y: 132, size: 24, style: "Medium", color: c ? PAL.note : PAL.ink, t: .1 + .06 * c, out: carryOut + .04 * c });
    setLine(comp, P + "_CTX", ctx, tTimes.slice(0, ctx.length), { x: M, y: 300, size: 56, style: "Medium", color: PAL.note, maxW: FULL, leading: 64, out: carryOut });
    var hs = 168, hy = 470;
    setLine(comp, P + "_HERO", hero, tTimes.slice(ctx.length), { x: M, y: hy, size: hs, style: "Bold", maxW: 860, leading: hs, out: carryOut + .08, stagger: .04 });
    var red = rule(comp, P + "_REDRULE", 0, 690, W, 4, PAL.signal, B.title.t1 - .45, B.title.t1); retract(red, carryOut + .1, carryOut + .3);
    // 2. picture: three flat modules on the grid, each wiping down on its beat, numbered like plates; they wipe back up when the photo arrives
    var pw = wordsIn(WL, B.picture.t0, B.picture.t1), mw = colW(comp, 2), my = 770, mh = 420, out = B.input.t0 - .05, ink = PAL.ink, grey = PAL.grey;
    var DRAW = {
      person: [{ ellipse: true, x: mw / 2 - 80, y: 10, w: 160, h: 160, color: ink }, { x: 0, y: 196, w: mw, h: 224, color: ink }],
      document: [{ x: 0, y: 0, w: mw, h: mh, color: PAL.paper }, { x: 32, y: 40, w: 150, h: 28, color: ink }, { x: 32, y: 104, w: 232, h: 16, color: grey }, { x: 32, y: 148, w: 232, h: 16, color: grey },
        { x: 32, y: 192, w: 232, h: 16, color: grey }, { x: 32, y: 236, w: 232, h: 16, color: grey }, { x: 32, y: 280, w: 140, h: 16, color: grey }],
      device: [{ x: 0, y: 60, w: mw, h: 220, color: ink }, { x: 20, y: 80, w: mw - 40, h: 180, color: grey }, { x: mw / 2 - 30, y: 280, w: 60, h: 60, color: ink }, { x: mw / 2 - 100, y: 340, w: 200, h: 16, color: ink }]
    };
    var objs = B.picture.objects;
    for (var j = 0; j < objs.length && j < 3; j++) { var tj = pw[j] ? pw[j].s + .05 : B.picture.t0 + .3 * j, xj = colX(comp, 2 * j);
      var S = shapes(comp, P + "_OBJ" + j, DRAW[objs[j]] || DRAW.document, [xj, my]); S.inPoint = tj - .25;
      snap(S.scale, tj - .25, tj, scaleOf(S, 100, 0), scaleOf(S, 100, 100)); snap(S.scale, out + .05 * j, out + .05 * j + .22, scaleOf(S, 100, 100), scaleOf(S, 100, 0)); S.outPoint = out + .05 * j + .22;
      var lr = rule(comp, P + "_OBJR" + j, xj, my + mh + 26, mw, 1, PAL.ink, tj - .1, tj + .15); retract(lr, out + .05 * j, out + .05 * j + .15);
      word(comp, P + "_OBJL" + j, "0" + (j + 1) + "  " + objs[j].charAt(0).toUpperCase() + objs[j].slice(1), { x: xj, y: my + mh + 60, size: 24, style: "Medium", t: tj + .1, out: out + .05 * j }); }
    // 3. real input: the frame as a grey print on white paper across the full measure, with a museum-label caption
    var py = 770, ph = 720, pt = B.input.t0 + .35, pm = photo(comp, P + "_PHOTO", A.photo, M, py, FULL, ph, pt);
    var cr = rule(comp, P + "_FIGR", M, py + ph + 24, FULL, 1, PAL.ink, pt, pt + .3);
    var f1 = word(comp, P + "_FIG", "Fig. 1", { x: M, y: py + ph + 58, size: 24, style: "Medium", t: pt + .15, out: carryOut });
    var f2 = word(comp, P + "_FIGT", "Frame 135 of the source clip, printed in one ink", { x: colX(comp, 1), y: py + ph + 58, size: 24, style: "Medium", color: PAL.note, t: pt + .25, out: carryOut + .04 });
    retract(cr, carryOut, carryOut + .2);
    // 4. number: a giant numeral flush left climbs in held steps, a bar under it snaps to each step, its label lands on the spoken word
    var nb = 1830, ns = 300, nt = B.number.t0, steps = [100, 200, 300, B.number.value], st = [];
    for (var s = 0; s < steps.length; s++) st.push(nt + s * .18);
    var num = word(comp, P + "_NUM", String(B.number.value), { x: M - .06 * ns, y: nb, size: ns, style: "Bold", t: nt + .05, below: .08 });   // optically flush left
    var ns0 = []; for (var s2 = 0; s2 < steps.length; s2++) ns0.push(String(steps[s2])); AESLib.textKeys(num, [nt - .2].concat(st.slice(1)), ns0);
    var bar = shapes(comp, P + "_BAR", [{ x: 0, y: 0, w: FULL, h: 10, color: PAL.ink }], [M, nb + 26]); bar.inPoint = nt;
    for (var s3 = 0; s3 < steps.length; s3++) { var from = s3 ? steps[s3 - 1] / B.number.value * 100 : 0; snap(bar.scale, st[s3], st[s3] + .16, scaleOf(bar, from, 100), scaleOf(bar, steps[s3] / B.number.value * 100, 100)); }
    var nw = wordsIn(WL, B.number.t0, B.number.t1), lab = word(comp, P + "_NUML", B.number.label, { x: colX(comp, 4), y: 1680, size: 44, style: "Medium", t: nw[1] ? nw[1].s : nt + .6 });
    var lab2 = word(comp, P + "_NUMN", "counted", { x: colX(comp, 4), y: 1718, size: 24, style: "Medium", color: PAL.note, t: nw[2] ? nw[2].s : nt + 1.2 });
    var mid = nb - .36 * ns, NG = group(comp, P + "_NUMG", W / 2, mid, [num, bar, lab, lab2]);
    knife(comp, P + "_KNIFE1", NG, M, mid, FULL, B.line.t0);
    var gone = [num, bar, lab, lab2]; for (var gi = 0; gi < gone.length; gi++) gone[gi].outPoint = B.line.t0 + .02;
    // 5. typed line: a grey lead-in and the spoken line set large in the lower field, each word rising on its own onset
    var lw = wordsIn(WL, B.line.t0, B.carry.t0), ls = [], lt = [];
    for (var w = 0; w < lw.length; w++) { ls.push(lw[w].text); lt.push(Math.max(B.line.t0 + .2, lw[w].s + .05)); }
    word(comp, P + "_LINEL", "Spoken", { x: M, y: 1600, size: 28, style: "Medium", color: PAL.note, t: B.line.t0 + .1, out: carryOut });
    setLine(comp, P + "_LINE", ls, lt, { x: M, y: 1716, size: 100, style: "Bold", maxW: FULL, leading: 108, out: carryOut, stagger: .03 });
    // 6. carry: the field clears upward, the photo (the artifact) is pushed to full bleed, then a knife crosses it and it collapses to that line
    pm[0].moveToBeginning(); pm[1].moveToBeginning();
    var cx = W / 2, cy = py + ph / 2, PG = group(comp, P + "_PHOTOG", cx, cy, pm), k = H / ph * 100 * 1.002;
    snap(PG.position, B.carry.t0 + .05, B.carry.t0 + .6, [cx, cy], [W / 2, H / 2]); snap(PG.scale, B.carry.t0 + .05, B.carry.t0 + .6, scaleOf(PG, 100, 100), scaleOf(PG, k, k));
    var cutT = B.end.t0 - .12; knife(comp, P + "_KNIFE2", PG, 0, H / 2, W, cutT, { weight: 4, keep: true });
    pm[0].outPoint = cutT + .02; pm[1].outPoint = cutT + .02;
    // 7. end card: the red rule left by the cut is the ground; the end line stands on it, flush left, word by word; a caption row closes the page
    var ew = wordsIn(WL, B.end.t0, B.end.t1), es = [], et = [];
    for (var e = 0; e < ew.length; e++) { es.push(ew[e].text); et.push(Math.max(cutT + .2, ew[e].s + .05)); }
    setLine(comp, P + "_END", es, et, { x: M, y: H / 2 - 40 - 150, size: 150, style: "Bold", maxW: 760, leading: 150, below: .2 });
    rule(comp, P + "_ENDR", M, 1760, FULL, 1, PAL.ink, B.end.t0 + .3, B.end.t0 + .6);
    var ec = ["Swiss motion", "One grid, one face", "One signal colour"];
    for (var c2 = 0; c2 < ec.length; c2++) word(comp, P + "_ENDC" + c2, ec[c2], { x: colX(comp, 2 * c2), y: 1796, size: 24, style: "Medium", color: c2 ? PAL.note : PAL.ink, t: B.end.t0 + .5 + .06 * c2 });
    page.moveToEnd();
    return { layers: comp.numLayers, notes: notes };
  }
  return { FAM: FAM, PALETTE: PALETTE, GRID: GRID, colW: colW, colX: colX, fontOK: fontOK, snap: snap, linear: linear, word: word, setLine: setLine, shapes: shapes,
    rule: rule, retract: retract, group: group, knife: knife, photo: photo, wordsIn: wordsIn, clearOwned: clearOwned, buildScene: buildScene };
})();
