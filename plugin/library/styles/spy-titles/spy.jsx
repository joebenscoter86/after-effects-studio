// Spy titles style: brand-neutral ES3 helpers. No project mutation happens at load.
// Read styles/spy-titles/STYLE.md first. A 1960s cut-paper opening title: four opaque inks, scissor-cut edges (Roughen Edges in layer space,
// so a moving piece keeps its edge), a cut gap and a small paper shadow on every piece, credits that are the set, a hatted silhouette agent
// whose limbs step on twos, hard cuts on the beat, a giant circle, and a title assembled from the pieces at the end.
// Adapted from Lemo-Opuscar's spy-titles style (MIT, LemoLab); see assets/LICENSE-lemo-opuscar.txt.
var AESSpy = (function () {
  var FAM = "Bebas Neue", TITLE = "Anton";
  function hex(h) { return [parseInt(h.substr(0, 2), 16) / 255, parseInt(h.substr(2, 2), 16) / 255, parseInt(h.substr(4, 2), 16) / 255]; }
  // four inks plus darker "shadow paper" versions of the grounds for background props (never black props: they read as letters)
  var PALETTE = { black: hex("1B1714"), cream: hex("EFE4C9"), red: hex("D23A22"), mustard: hex("E2A52A"),
    creamDark: hex("D8C9A6"), redDark: hex("AE301C"), mustardDark: hex("C08A22"), blackLift: hex("2E2722") };
  var TWOS = "posterizeTime(15); value;";                      // puppets and landing letters on twos (15 fps in a 30 fps comp); camera and slides on ones
  var S30 = Math.tan(Math.PI / 6);
  function fontOK() { AESLib.font(FAM, "Regular"); AESLib.font(TITLE, "Regular"); return true; }
  function rng(seed) { var s = seed; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

  // ---- keys: list = [{ t, v, i, o }]; i / o are an influence (eased, zero speed), "L" linear or "H" hold. One setValuesAtTimes call.
  function easeArr(prop, inf) { var sp = prop.propertyValueType === PropertyValueType.TwoD_SPATIAL || prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL;
    var d = (!sp && prop.propertyValueType !== PropertyValueType.COLOR && prop.value instanceof Array) ? prop.value.length : 1, a = [];
    for (var n = 0; n < d; n++) a.push(new KeyframeEase(0, inf)); return a; }
  function kt(x) { return x === "H" ? KeyframeInterpolationType.HOLD : (typeof x === "number" ? KeyframeInterpolationType.BEZIER : KeyframeInterpolationType.LINEAR); }
  function keys(prop, list) { var ts = [], vs = [], B = KeyframeInterpolationType.BEZIER;
    for (var j = 0; j < list.length; j++) { ts.push(list[j].t); vs.push(list[j].v); } prop.setValuesAtTimes(ts, vs);
    for (var k = 0; k < list.length; k++) { var ki = prop.nearestKeyIndex(list[k].t), a = list[k].i, b = list[k].o;
      prop.setInterpolationTypeAtKey(ki, B, B); prop.setTemporalEaseAtKey(ki, easeArr(prop, typeof a === "number" ? a : 33.3), easeArr(prop, typeof b === "number" ? b : 33.3));
      prop.setInterpolationTypeAtKey(ki, kt(a), kt(b)); }
    return prop; }
  // a slide that stops dead on the beat: leaves fast, short ease-out into the mark
  function dead(prop, t0, t1, v0, v1) { return keys(prop, [{ t: t0, v: v0, o: "L" }, { t: t1, v: v1, i: 55 }]); }
  function travel(prop, t0, t1, v0, v1) { return keys(prop, [{ t: t0, v: v0, o: 70 }, { t: t1, v: v1, i: 70 }]); }
  function fx(L, match) { L.property("ADBE Effect Parade").addProperty(match); var EP = L.property("ADBE Effect Parade"); return EP.property(EP.numProperties); }

  // ---- paper: scissor-cut edge (in the layer's own space, so it never crawls) and a small paper shadow. o = { border, scale, shadow }
  function cut(L, o, notes) { o = o || {};
    try { var r = fx(L, "ADBE Roughen Edges"); r.property("Border").setValue(o.border || 3); r.property("Edge Sharpness").setValue(3); r.property("Fractal Influence").setValue(.7);
      r.property("Scale").setValue(o.scale || 32); r.property("Complexity").setValue(2); } catch (e) { if (notes) notes.push("roughen: " + e.toString()); }
    var s = fx(L, "ADBE Drop Shadow"); s.property("Shadow Color").setValue([0, 0, 0, 1]); s.property("Opacity").setValue(o.shadow === undefined ? 32 : o.shadow);
    s.property("Direction").setValue(135); s.property("Distance").setValue(o.dist || 5); s.property("Softness").setValue(10); return L; }
  function ground(comp, name, color, t0, t1) { var L = comp.layers.addSolid(color, name, comp.width, comp.height, 1); L.inPoint = t0; L.outPoint = t1; return L; }
  function span(L, t0, t1) { L.inPoint = t0; L.outPoint = t1; return L; }
  // a group null whose anchor is its position (so a child's local coordinates are comp coordinates when it is parented)
  function pivot(comp, name, x, y, t0, t1) { var N = comp.layers.addNull(); N.name = name; N.anchorPoint.setValue([x, y]); N.position.setValue([x, y]); span(N, t0, t1); return N; }

  // ---- vector pieces: { k: "poly", pts } | { k: "circle", x, y, r } | { k: "rect", x, y, w, h } | { k: "group", id, pivot, rot, kids }, each with color.
  // Later nodes draw on top. Shapes inside one figure share one ink, so the figure reads as one merged outline (no mannequin seams).
  var KAPPA = .5523;
  function poly(pts) { var s = new Shape(); try { s.vertices = pts; } catch (e) { throw new Error("bad polygon " + pts.toSource()); } s.closed = true; return s; }
  function circ(cx, cy, r) { var k = KAPPA * r, s = new Shape(); s.vertices = [[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy]];
    s.inTangents = [[-k, 0], [0, -k], [k, 0], [0, k]]; s.outTangents = [[k, 0], [0, k], [-k, 0], [0, -k]]; s.closed = true; return s; }
  function shapeOf(n) { if (n.k === "circle") return circ(n.x, n.y, n.r);                // plain ifs: a chained ternary sent circles down the rect branch here
    if (n.k === "rect") return poly([[n.x, n.y], [n.x + n.w, n.y], [n.x + n.w, n.y + n.h], [n.x, n.y + n.h]]); return poly(n.pts); }
  function emit(contents, nodes) {
    for (var i = nodes.length - 1; i >= 0; i--) { var n = nodes[i], g = contents.addProperty("ADBE Vector Group"); if (n.id) g.name = n.id;
      var tg = g.property("ADBE Vector Transform Group");
      if (n.pivot) { tg.property("ADBE Vector Anchor").setValue(n.pivot); tg.property("ADBE Vector Position").setValue(n.pivot); }
      if (n.rot) tg.property("ADBE Vector Rotation").setValue(n.rot);
      var v = g.property("ADBE Vectors Group");
      if (n.k === "group") { emit(v, n.kids); continue; }
      v.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(shapeOf(n));
      v.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(n.color); } }
  function piece(comp, name, nodes, pos) { var L = comp.layers.addShape(); L.name = name; emit(L.property("ADBE Root Vectors Group"), nodes);
    L.anchorPoint.setValue([0, 0]); L.position.setValue(pos || [0, 0]); return L; }
  // the transform of a named group, fetched fresh by its path of ids (handles go stale once siblings are added)
  function groupT(L, path) { var g = L.property("ADBE Root Vectors Group");
    for (var i = 0; i < path.length; i++) { g = g.property(path[i]); if (i < path.length - 1) g = g.property("ADBE Vectors Group"); }
    return g.property("ADBE Vector Transform Group"); }

  // ---- the agent: a tall hatted silhouette in profile (about seven heads, 600 px at scale 100), one accent scarf that streams back.
  // Feet at the layer origin. Limbs are nested groups (thigh > shin, upper arm > forearm) driven by one clock expression on twos.
  function agentNodes(ink, accent) {
    function leg(id) { return { k: "group", id: id, pivot: [0, -250], kids: [{ k: "poly", pts: [[-18, -268], [18, -268], [13, -128], [-12, -128]], color: ink },
      { k: "group", id: "S", pivot: [0, -134], kids: [{ k: "poly", pts: [[-12, -142], [12, -142], [9, -12], [-9, -12]], color: ink },
        { k: "poly", pts: [[-13, -20], [22, -16], [44, -5], [44, 2], [-15, 2]], color: ink }] }] }; }
    function arm(id) { return { k: "group", id: id, pivot: [2, -462], kids: [{ k: "poly", pts: [[-12, -472], [14, -472], [10, -332], [-7, -332]], color: ink },
      { k: "group", id: "F", pivot: [1, -338], kids: [{ k: "poly", pts: [[-8, -344], [10, -344], [8, -270], [-4, -270]], color: ink },
        { k: "poly", pts: [[-6, -276], [10, -276], [3, -236]], color: ink }] }] }; }
    return [arm("AB"), leg("LB"), leg("LF"),
      { k: "poly", pts: [[-28, -480], [30, -480], [44, -402], [50, -300], [64, -210], [-60, -204], [-45, -300], [-42, -402]], color: ink },   // trench coat
      { k: "group", id: "SC", pivot: [-2, -472], kids: [{ k: "poly", pts: [[-2, -486], [-60, -480], [-120, -464], [-110, -450], [-58, -464], [-2, -466]], color: accent }] },
      { k: "rect", x: -9, y: -494, w: 20, h: 22, color: ink }, { k: "circle", x: 6, y: -514, r: 27, color: ink }, { k: "poly", pts: [[28, -522], [46, -504], [30, -497]], color: ink },
      { k: "poly", pts: [[-48, -536], [62, -542], [64, -531], [-46, -527]], color: ink }, { k: "poly", pts: [[-24, -536], [-18, -586], [32, -588], [38, -540]], color: ink },
      arm("AF")]; }
  // o = { x0, x1, y, t0, t1, tm0, tm1 (the move), scale, facing (1 right, -1 left), gait ("run" | "walk" | "stand"), accent, freeze: [f0, f1], parent }
  function agent(comp, name, o, notes) { var s = o.scale || 60, f = o.facing || 1, gait = o.gait || "stand";
    var L = piece(comp, name, agentNodes(PALETTE.black, o.accent || PALETTE.red)); span(L, o.t0, o.t1); if (o.parent) L.parent = o.parent;
    L.position.setValue([o.x0, o.y]); L.scale.setValue([s * f, s]);
    if (o.x1 !== undefined) keys(L.position, [{ t: o.tm0, v: [o.x0, o.y], o: "L" }, { t: o.tm1, v: [o.x1, o.y], i: "L" }]);
    var GA = { run: { A: 40, lean: 10, sc: "-14 + 10", bob: 9 }, walk: { A: 20, lean: 2, sc: "-6 + 5", bob: 4 }, stand: { A: 0, lean: 0, sc: "-2 + 2", bob: 0 } }, gs = GA[gait] || GA.stand;
    var A = gs.A, hz = gait === "run" ? 2.4 : 1.4, lean = gs.lean;
    L.rotation.setValue(lean * f);
    var clk = "posterizeTime(15); var t = time;" + (o.freeze ? " var f0 = " + o.freeze[0] + ", f1 = " + o.freeze[1] + "; t = t < f0 ? t : (t < f1 ? f0 : t - (f1 - f0));" : "")
      + " var p = 2 * Math.PI * " + hz + " * t; ";
    var ex = [[["LB"], A + " * Math.sin(p)"], [["LF"], -A + " * Math.sin(p)"],
      [["LB", "S"], "Math.max(0, Math.sin(p - 0.6)) * " + (A * 1.7)], [["LF", "S"], "Math.max(0, -Math.sin(p - 0.6)) * " + (A * 1.7)],
      [["AB"], (-.9 * A) + " * Math.sin(p)"], [["AF"], (.9 * A) + " * Math.sin(p)"],
      [["AB", "F"], gait === "run" ? "-75" : "-12"], [["AF", "F"], gait === "run" ? "-75" : "-12"],
      [["SC"], gs.sc + " * Math.sin(2 * p)"]];
    for (var i = 0; i < ex.length; i++) groupT(L, ex[i][0]).property("ADBE Vector Rotation").expression = clk + ex[i][1] + ";";
    var bob = gs.bob;
    L.position.expression = clk + "valueAtTime(t) - [0, " + bob + " * Math.abs(Math.sin(p))];";
    cut(L, { border: 2.4, scale: 22 }, notes); return L; }

  // ---- cut letters: one text layer per letter, laid out with the font's own spacing, each re-cut (jittered rotation and baseline),
  // with a cut gap in the ground's colour behind the fill. They land on twos with a small drop (a paper slap).
  // o = { x (centre), y (baseline), size, family, color, gap, maxW, times[] | t + step, drop, jit, base, seed, parent, t1, track }
  // widths only, from a fresh probe layer per measurement: ink left and right were unstable while AESLib.text's chained conditional
  // turned "left" into right-aligned (fixed 2026-10-16); widths stay the robust measure, but the prefix's ink width is the right edge of letter i from the line's ink left
  function measure(comp, name, str, fam, size) { var right = [], single = [];
    function box(t) { var L = AESLib.text(comp, name, t, { family: fam, style: "Regular", size: size, just: "left" }), q = L.sourceRectAtTime(0, false); L.remove(); return q; }
    for (var i = 0; i < str.length; i++) { var ch = str.charAt(i); if (ch === " ") { right.push(i ? right[i - 1] : 0); single.push([0, 0]); continue; }
      var q = box(str.substr(0, i + 1)); right.push(q.width); var s1 = box(ch); single.push([s1.left, s1.width]); }
    return { right: right, single: single }; }
  function letters(comp, name, str, o, notes) { var fam = o.family || FAM, size = o.size, track = o.track === undefined ? .03 * size : o.track, R = rng(o.seed || 7);
    var m = measure(comp, name + "_M", str, fam, size);
    var n = str.length, total = m.right[n - 1] + track * (n - 1), k = (o.maxW && total > o.maxW) ? o.maxW / total : 1;
    size *= k; total *= k; var x0 = o.x - total / 2, out = [];
    for (var i = 0; i < n; i++) { var ch = str.charAt(i); if (ch === " ") continue;
      var l = m.single[i][0] * k, w = m.single[i][1] * k, cx = x0 + m.right[i] * k + track * k * i - w / 2;
      var L = AESLib.text(comp, name + i, ch, { family: fam, style: "Regular", size: size, color: o.color, just: "left" });
      var sp = L.property("Source Text"), td = sp.value; td.applyStroke = true; td.strokeColor = o.gap || PALETTE.black; td.strokeWidth = o.gapW || Math.max(4, .028 * size); td.strokeOverFill = false; sp.setValue(td);
      if (o.parent) L.parent = o.parent;
      var jr = (R() * 2 - 1) * (o.jit === undefined ? .8 : o.jit), jy = (R() * 2 - 1) * (o.base === undefined ? 1.5 : o.base), p = [cx, o.y + jy];
      L.anchorPoint.setValue([l + w / 2, 0]); L.position.setValue(p); L.rotation.setValue(jr);
      var t = o.times ? o.times[i] : (o.t === undefined || o.t === null ? null : o.t + i * (o.step === undefined ? .034 : o.step)), d = o.drop === undefined ? .3 * size : o.drop;
      if (t !== undefined && t !== null && !isNaN(t)) { keys(L.position, [{ t: t - .14, v: [p[0], p[1] - d], o: "L" }, { t: t, v: p, i: 40 }]);
        keys(L.rotation, [{ t: t - .14, v: jr + (R() < .5 ? -9 : 9), o: "L" }, { t: t, v: jr, i: 40 }]);
        L.position.expression = TWOS; L.rotation.expression = TWOS; L.inPoint = Math.max(0, t - .14); }
      if (o.t0 !== undefined) L.inPoint = o.t0;                                       // in before out: setting inPoint after outPoint loses the out point
      if (o.t1 !== undefined) L.outPoint = o.t1;
      cut(L, { border: Math.max(2, .008 * size), scale: Math.max(14, .09 * size) }, notes); out.push(L); }
    return { layers: out, size: size, left: x0, right: x0 + total }; }
  // letter landing times for a line of words: each word's letters land one frame apart from its spoken onset
  function wordTimes(str, onsets, lead, step) { var t = [], w = 0, inWord = false, c = 0;
    for (var i = 0; i < str.length; i++) { if (str.charAt(i) === " ") { if (inWord) { w++; inWord = false; } t.push(null); continue; }
      if (!inWord) { inWord = true; c = 0; } t.push(onsets[Math.min(w, onsets.length - 1)] - (lead || 0) + c * (step === undefined ? .034 : step)); c++; }
    return t; }
  // a credit line that slides in along its grid line on ones and stops dead: o = { from: [dx, dy], t0, t1 (landed), out }
  function slideCredit(comp, name, str, o, notes) { var N = pivot(comp, name + "_N", o.x, o.y, o.t0, o.out === undefined ? comp.duration : o.out);
    var c = letters(comp, name, str, { x: o.x, y: o.y, size: o.size, family: o.family, color: o.color, gap: o.gap, maxW: o.maxW, parent: N, seed: o.seed, jit: o.jit, t0: o.t0, t1: o.out }, notes);
    if (o.rot) N.rotation.setValue(o.rot);
    dead(N.position, o.t0, o.t1, [o.x + o.from[0], o.y + o.from[1]], [o.x, o.y]);
    c.node = N; return c; }

  // ---- the paper: mottling and fibres multiplied over everything, sparse ink voids, film grain
  function paperTexture(comp, P, notes) { var W = comp.width, H = comp.height, out = [];
    var M = comp.layers.addSolid([.5, .5, .5], P + "_MOTTLE", W, H, 1), fm = fx(M, "ADBE Fractal Noise");
    fm.property("Contrast").setValue(130); fm.property("Complexity").setValue(6); fm.property("Scale").setValue(420); M.blendingMode = BlendingMode.OVERLAY; M.opacity.setValue(16); out.push(M);
    var F = comp.layers.addSolid([.5, .5, .5], P + "_FIBRE", W, H, 1), ff = fx(F, "ADBE Fractal Noise");
    try { ff.property("Contrast").setValue(160); ff.property("Uniform Scaling").setValue(0); ff = F.property("ADBE Effect Parade").property(1);
      ff.property("Scale Width").setValue(30); ff.property("Scale Height").setValue(900); ff.property("Complexity").setValue(3); ff.property("Rotation").setValue(4); } catch (e) { notes.push("fibre: " + e.toString()); }
    F.blendingMode = BlendingMode.SOFT_LIGHT; F.opacity.setValue(10); out.push(F);
    var V = comp.layers.addSolid([0, 0, 0], P + "_VOIDS", W, H, 1), fv = fx(V, "ADBE Fractal Noise");
    fv.property("Contrast").setValue(500); fv.property("Brightness").setValue(-170); fv.property("Scale").setValue(7); fv.property("Complexity").setValue(1);
    V.blendingMode = BlendingMode.SCREEN; V.opacity.setValue(45); out.push(V);
    var G = comp.layers.addSolid([1, 1, 1], P + "_GRAIN", W, H, 1); G.adjustmentLayer = true; var gn = fx(G, "ADBE Noise"); gn.property("Amount of Noise").setValue(5);
    gn = G.property("ADBE Effect Parade").property(1); gn.property(2).setValue(0); out.push(G);
    return out; }

  // ---- the props of the proof scene
  function phone(ink, paper) { var n = [{ k: "poly", pts: [[-190, 70], [190, 70], [150, -80], [-150, -80]], color: ink },
    { k: "circle", x: 0, y: -2, r: 86, color: paper }, { k: "circle", x: 0, y: -2, r: 30, color: ink },
    { k: "poly", pts: [[-210, -175], [-120, -178], [-104, -112], [-196, -104]], color: ink }, { k: "poly", pts: [[120, -178], [210, -175], [196, -104], [104, -112]], color: ink },
    { k: "poly", pts: [[-170, -170], [170, -170], [160, -140], [-160, -140]], color: ink }];
    for (var h = 0; h < 8; h++) { var a = Math.PI * (.25 + 1.5 * h / 8); n.push({ k: "circle", x: 58 * Math.cos(a), y: -2 + 58 * Math.sin(a), r: 13, color: ink }); }
    return n; }
  function dossier(ink, paper, clip) { var n = [{ k: "poly", pts: [[-200, -150], [-60, -150], [-40, -172], [60, -172], [80, -150], [200, -150], [200, 150], [-200, 150]], color: ink },
    { k: "poly", pts: [[-176, -128], [168, -136], [176, 128], [-170, 134]], color: paper }, { k: "rect", x: -140, y: -100, w: 150, h: 24, color: ink }];
    for (var r = 0; r < 5; r++) n.push({ k: "rect", x: -140, y: -50 + 34 * r, w: r === 4 ? 160 : 270, h: 12, color: ink });
    n.push({ k: "poly", pts: [[120, -190], [146, -190], [146, -60], [120, -60]], color: clip }); return n; }
  function poles(ink, xs, top, bot) { var n = [];
    for (var i = 0; i < xs.length; i++) { n.push({ k: "rect", x: xs[i] - 9, y: top, w: 18, h: bot - top, color: ink }); n.push({ k: "rect", x: xs[i] - 70, y: top + 30, w: 140, h: 12, color: ink }); }
    return n; }
  function wire(comp, name, xs, y, sag, color, t0, t1) { var L = comp.layers.addShape(); L.name = name; var v = L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").property("ADBE Vectors Group");
    var s = new Shape(), vv = [], it = [], ot = [];
    for (var i = 0; i < xs.length; i++) { vv.push([xs[i], y]); var d = i ? (xs[i] - xs[i - 1]) / 3 : 0, e = i < xs.length - 1 ? (xs[i + 1] - xs[i]) / 3 : 0; it.push([-d, sag]); ot.push([e, sag]); }
    s.vertices = vv; s.inTangents = it; s.outTangents = ot; s.closed = false; v.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(s);
    var st = v.addProperty("ADBE Vector Graphic - Stroke"); st.property("ADBE Vector Stroke Color").setValue(color); st.property("ADBE Vector Stroke Width").setValue(3);
    span(L, t0, t1); return L; }
  function wordsIn(list, t0, t1) { var r = []; for (var i = 0; i < list.length; i++) if (list[i].s >= t0 - .05 && list[i].s < t1) r.push(list[i]); return r; }
  function onsets(list) { var r = []; for (var i = 0; i < list.length; i++) r.push(list[i].s); return r; }
  function clearOwned(comp, prefix) { AESLib.clearOwned(comp, prefix); }

  // buildScene: the shared test scene (the library's seven-beat test scene) as a spy title sequence. comp = an empty 1080 x 1920 comp at scene.fps.
  // Every beat is a new location with its own ground, cut hard on the voice; the credits are the set; the agent crosses the picture;
  // the keyhole circle (the real frame) is the object of the chase and ends as the full stop of the title.
  function buildScene(comp, scene, opts) {
    fontOK(); var P = opts.prefix || "SPY", C = opts.palette || PALETTE, A = opts.assets, B = scene.beat, W = comp.width, H = comp.height, notes = [], WL = scene.wordList;
    clearOwned(comp, P);
    var black = C.black, cream = C.cream, red = C.red, mus = C.mustard;
    // grounds first (bottom of the stack); one dominant ground per location
    ground(comp, P + "_G_TITLE", mus, 0, B.title.t1); ground(comp, P + "_G_PIC", black, B.picture.t0, B.picture.t1); ground(comp, P + "_G_INPUT", red, B.input.t0, B.input.t1);
    ground(comp, P + "_G_NUM", cream, B.number.t0, B.number.t1); ground(comp, P + "_G_LINE", black, B.line.t0, B.line.t1); ground(comp, P + "_G_CARRY", cream, B.carry.t0, B.carry.t1);
    ground(comp, P + "_G_END", red, B.end.t0, B.end.t1);

    // 1. title: a mustard location built from the credit. Telephone poles in the ground's darker ink, a black rail bed, the hero line
    // landing letter by letter on the voice, the context credit sliding in along the top line, the agent strolling along the top of STARTS.
    var T0 = B.title.t0, T1 = B.title.t1, tw = onsets(wordsIn(WL, T0, T1));
    piece(comp, P + "_POLES", poles(C.mustardDark, [150, 540, 930], 380, 1480)).outPoint = T1; wire(comp, P + "_WIRE", [-40, 150, 540, 930, 1120], 430, 40, C.mustardDark, 0, T1);
    span(cut(piece(comp, P + "_BED", [{ k: "rect", x: -40, y: 1476, w: W + 80, h: 500, color: black }, { k: "rect", x: -40, y: 1500, w: W + 80, h: 6, color: cream }]), { shadow: 20 }, notes), 0, T1);
    var ctx = B.title.context.toUpperCase(), hero = B.title.hero.toUpperCase().split(" "); // "STARTS THE SAME WAY" -> STARTS / THE SAME / WAY
    slideCredit(comp, P + "_CTX", ctx, { x: W / 2, y: 196, size: 120, color: cream, gap: mus, maxW: 900, from: [-W, 0], t0: Math.max(0, tw[0] - .05), t1: tw[1] + .02, out: T1, seed: 3 }, notes);
    var rows = [hero[0], hero.slice(1, hero.length - 1).join(" "), hero[hero.length - 1]], rowY = [770, 1110, 1470], wi = 2, st = null;
    for (var r = 0; r < rows.length; r++) { var nw = rows[r].split(" ").length, on = tw.slice(wi, wi + nw); wi += nw;
      var lr = letters(comp, P + "_HERO" + r, rows[r], { x: W / 2, y: rowY[r], size: 360, color: black, gap: mus, maxW: 940, times: wordTimes(rows[r], on, .02, .03), t1: T1, seed: 11 + r }, notes);
      if (!r) st = lr; }
    agent(comp, P + "_AGENT1", { x0: st.left + 40, x1: st.left + 330, y: rowY[0] - .7 * st.size, t0: T0, t1: T1, tm0: T0, tm1: T1, scale: 42, gait: "walk", accent: red }, notes);

    // 2. picture: a diagonal split. Three bands (mustard, cream, red) slide in along the 30 degree diagonal and stop dead on "Three",
    // "pieces", "build"; each carries one silhouette (the agent, a dossier, a telephone). "ONE PICTURE" lands along the diagonal.
    var P0 = B.picture.t0, P1 = B.picture.t1, pw = onsets(wordsIn(WL, P0, P1)), u = [Math.cos(Math.PI / 6), -Math.sin(Math.PI / 6)];
    var cuts = [-1600, 900, 1500, 3600], inks = [mus, cream, red], lands = [pw[0] + .12, pw[1] + .02, pw[2] + .02], bands = [];
    for (var b = 0; b < 3; b++) { var bt = cuts[b], bb = cuts[b + 1];
      var BL = cut(piece(comp, P + "_BAND" + b, [{ k: "poly", pts: [[-400, bt + 400 * S30], [1480, bt - 1480 * S30], [1480, bb - 1480 * S30], [-400, bb + 400 * S30]], color: inks[b] }]), { border: 4, scale: 60, shadow: 40, dist: 7 }, notes);
      span(BL, P0, P1); var sgn = b === 1 ? 1 : -1; dead(BL.position, Math.max(P0, lands[b] - .16), lands[b], [sgn * 1700 * u[0], sgn * 1700 * u[1]], [0, 0]); bands.push(BL); }
    agent(comp, P + "_AGENT2", { x0: 330, y: 660, t0: P0, t1: P1, scale: 86, gait: "stand", accent: red, parent: bands[0] }, notes);
    var dz = cut(piece(comp, P + "_DOSSIER", [{ k: "group", rot: -30, kids: dossier(black, cream, mus) }]), { border: 2.5, scale: 30 }, notes); span(dz, P0, P1); dz.parent = bands[1]; dz.position.setValue([540, 900]);
    var ph = cut(piece(comp, P + "_PHONE", phone(black, cream)), { border: 2.5, scale: 30 }, notes); span(ph, P0, P1); ph.parent = bands[2]; ph.position.setValue([730, 1450]);
    var opN = pivot(comp, P + "_ONEPIC_N", 430, 1690, P0, P1); opN.rotation.setValue(-30);
    letters(comp, P + "_ONEPIC", "ONE PICTURE", { x: 430, y: 1690, size: 150, color: cream, gap: red, maxW: 560, times: wordTimes("ONE PICTURE", [pw[3], pw[4]], .02, .03), parent: opN, t1: P1, seed: 21 }, notes);

    // 3. input: the real frame, printed in three inks, seen through a keyhole on a black backing (the object of the chase is keylined);
    // the camera trucks in; the agent stands at the edge of the frame, hat and nose in the light.
    var I0 = B.input.t0, I1 = B.input.t1, iw = onsets(wordsIn(WL, I0, I1)), KX = 540, KY = 760, KR = 260, KB = 1360, push = 1.08;
    var cam = pivot(comp, P + "_CAM3", W / 2, H / 2, I0, I1); travel(cam.scale, I0, I1, [100, 100], [100 * push, 100 * push]);
    function keyhole(g) { return [{ k: "circle", x: KX, y: KY, r: KR + g, color: black }, { k: "poly", pts: [[KX - 70 - g, KY + 150], [KX + 70 + g, KY + 150], [KX + 150 + g, KB + g], [KX - 150 - g, KB + g]], color: black }]; }
    var back = cut(piece(comp, P + "_KEYBACK", keyhole(18)), { border: 3, scale: 40, shadow: 40 }, notes); span(back, I0, I1); back.parent = cam;
    var pr = comp.layers.add(AESLib.importFile(A.print)); pr.name = P + "_PRINT"; span(pr, I0, I1); pr.parent = cam;
    var pw0 = pr.source.width, ph0 = pr.source.height; pr.anchorPoint.setValue([pw0 / 2, ph0 / 2]); pr.position.setValue([KX, 930]);
    var ox = pw0 / 2 - KX, oy = ph0 / 2 - 930, MP = pr.property("ADBE Mask Parade");
    MP.addProperty("ADBE Mask Atom").property("ADBE Mask Shape").setValue(circ(KX + ox, KY + oy, KR));
    MP = pr.property("ADBE Mask Parade"); MP.addProperty("ADBE Mask Atom").property("ADBE Mask Shape").setValue(poly([[KX - 70 + ox, KY + 150 + oy], [KX + 70 + ox, KY + 150 + oy], [KX + 150 + ox, KB + oy], [KX - 150 + ox, KB + oy]]));
    cut(pr, { border: 2.5, scale: 30, shadow: 0 }, notes);
    var ag3 = agent(comp, P + "_AGENT3", { x0: 1000, y: 1690, t0: I0, t1: I1, scale: 112, facing: -1, gait: "stand", accent: mus }, notes); ag3.parent = cam;
    slideCredit(comp, P + "_REAL", "A REAL FRAME", { x: W / 2, y: 330, size: 150, color: cream, gap: red, maxW: 900, from: [-W, 0], t0: iw[2] - .2, t1: iw[2] + .02, out: I1, seed: 31 }, notes).node.parent = cam;
    letters(comp, P + "_VIDEO", "FROM MY VIDEO", { x: 470, y: 1600, size: 110, color: black, gap: red, maxW: 700, times: wordTimes("FROM MY VIDEO", [iw[4], iw[5], iw[6]], .02, .03), t1: I1, seed: 37, parent: cam }, notes);

    // 4. number: a cream location whose architecture is the number. It counts up on twos; the agent runs across its top in front of a giant
    // circle; FRAMES slides along the rail bed; on "counted" the whole picture stops dead (stop-time) and the word slaps down.
    var N0 = B.number.t0, N1 = B.number.t1, nw2 = onsets(wordsIn(WL, N0, N1)), base = 1460, val = B.number.value;
    span(cut(piece(comp, P + "_SUN", [{ k: "circle", x: 540, y: 620, r: 340, color: C.creamDark }]), { border: 4, scale: 60, shadow: 0 }, notes), N0, N1);
    span(cut(piece(comp, P + "_BED4", [{ k: "rect", x: -40, y: base, w: W + 80, h: 600, color: black }, { k: "rect", x: -40, y: base + 24, w: W + 80, h: 6, color: cream }]), { shadow: 20 }, notes), N0, N1);
    var nm = letters(comp, P + "_NUMM", String(val), { x: W / 2, y: base, size: 900, maxW: 980, color: black, gap: cream }, notes);   // layout only
    for (var q = 0; q < nm.layers.length; q++) nm.layers[q].remove();
    var num = AESLib.text(comp, P + "_NUM", String(val), { family: FAM, style: "Regular", size: nm.size, color: black, just: "left" }), nsp = num.property("Source Text"), ntd = nsp.value;
    ntd.applyStroke = true; ntd.strokeColor = cream; ntd.strokeWidth = 18; ntd.strokeOverFill = false; ntd.tracking = 30; nsp.setValue(ntd);
    var nr = num.sourceRectAtTime(0, false); num.anchorPoint.setValue([nr.left + nr.width / 2, 0]); num.position.setValue([W / 2, base]); span(num, N0, N1);
    var counts = [], cn = 10; for (var c = 0; c <= cn; c++) { var e = 1 - Math.pow(1 - c / cn, 2); counts.push(String(Math.round(100 + (val - 100) * e))); }
    AESLib.bakeText(num, counts, 15, N0); cut(num, { border: 5, scale: 70 }, notes);
    var top = base - .7 * nm.size, freeze = [nw2[2], N1 + .1];
    agent(comp, P + "_AGENT4", { x0: -120, x1: 1200, y: top, t0: N0, t1: N1, tm0: N0, tm1: N1 + .45, scale: 52, gait: "run", accent: red, freeze: freeze }, notes);
    slideCredit(comp, P + "_FRAMES", "FRAMES", { x: W / 2, y: 1760, size: 190, color: cream, gap: black, maxW: 700, from: [W, 0], t0: nw2[1] - .18, t1: nw2[1] + .02, out: N1, seed: 41 }, notes);
    var cN = pivot(comp, P + "_COUNTED_N", 760, 390, N0, N1); cN.rotation.setValue(-8);
    letters(comp, P + "_COUNTED", "COUNTED.", { x: 760, y: 390, size: 170, color: red, gap: cream, maxW: 560, times: wordTimes("COUNTED.", [nw2[2]], 0, 0), t1: N1, parent: cN, seed: 43, jit: 2.5 }, notes);

    // 5. line: a black location; the spoken line is a column of type, each word landing on its onset, inks alternating; the camera pans down it.
    var L0 = B.line.t0, L1 = B.line.t1, lw = wordsIn(WL, L0, L1), lrows = [["EVERY"], ["WORD"], ["I", "SAY"], ["GETS"], ["TYPED."]], lk = 0;
    var lcam = pivot(comp, P + "_CAM5", W / 2, H / 2, L0, L1); travel(lcam.position, L0 + .05, L1, [W / 2, H / 2], [W / 2, H / 2 - 190]);
    var links = [cream, red, cream, mus, red];
    for (var lr2 = 0; lr2 < lrows.length; lr2++) { var lo = []; for (var lq = 0; lq < lrows[lr2].length; lq++) { lo.push(lw[Math.min(lk, lw.length - 1)].s); lk++; }
      var lstr = lrows[lr2].join(" ");
      letters(comp, P + "_LINE" + lr2, lstr, { x: W / 2, y: 520 + 340 * lr2, size: 380, color: links[lr2], gap: black, maxW: 900, times: wordTimes(lstr, lo, .02, .03), parent: lcam, t1: L1, seed: 51 + lr2 }, notes); }

    // 7 (laid out before 6, which flies into it). end: a red location, the title assembled from cut pieces on the voice, a black rail bed,
    // and the object of the chase landing as the title's full stop. The agent walks off with the last beat.
    var E0 = B.end.t0, E1 = B.end.t1, ew = onsets(wordsIn(WL, E0, E1));
    span(cut(piece(comp, P + "_BED7", [{ k: "rect", x: -40, y: 1560, w: W + 80, h: 500, color: black }, { k: "rect", x: -40, y: 1584, w: W + 80, h: 6, color: cream }]), { shadow: 20 }, notes), E0, E1);
    slideCredit(comp, P + "_PRESENTS", "A SHARED SCENE PICTURE", { x: W / 2, y: 470, size: 74, color: black, gap: red, maxW: 860, from: [-W, 0], t0: E0 + .02, t1: E0 + .2, seed: 61 }, notes);
    letters(comp, P + "_END0", "THAT'S", { family: TITLE, x: W / 2, y: 880, size: 330, color: cream, gap: red, maxW: 860, times: wordTimes("THAT'S", [ew[0]], .02, .034), jit: 3, base: 12, seed: 63 }, notes);
    var e2 = letters(comp, P + "_END1", "THE TEST", { family: TITLE, x: W / 2 - 50, y: 1270, size: 300, color: cream, gap: red, maxW: 820, times: wordTimes("THE TEST", [ew[1], ew[2]], .02, .034), jit: 3, base: 12, seed: 67 }, notes);
    slideCredit(comp, P + "_STARRING", "STARRING THE AGENT", { x: W / 2, y: 1780, size: 80, color: cream, gap: black, maxW: 700, from: [W, 0], t0: ew[2] + .3, t1: ew[2] + .5, seed: 69 }, notes);
    agent(comp, P + "_AGENT7", { x0: 140, x1: 1240, y: 1560, t0: E0, t1: E1, tm0: E0 + .4, tm1: E1, scale: 44, gait: "walk", accent: mus }, notes);

    // 6. carry: a cream location; the keyhole's circle comes back at the same size and place (a graphic match cut), keylined in black,
    // and the agent runs across it; the credits slide on the voice; on "the next" the circle flies down the diagonal to be the full stop.
    var C0 = B.carry.t0, C1 = B.carry.t1, cw = onsets(wordsIn(WL, C0, C1)), cx = W / 2 + (KX - W / 2) * push, cy = H / 2 + (KY - H / 2) * push, cr = KR * push;
    slideCredit(comp, P + "_THEN", "THEN ONE THING", { x: W / 2, y: 1500, size: 150, color: black, gap: cream, maxW: 920, from: [-W, 0], t0: cw[0], t1: cw[2] + .05, out: C1, seed: 71 }, notes);
    slideCredit(comp, P + "_NEXT", "BECOMES THE NEXT", { x: W / 2, y: 1680, size: 150, color: red, gap: cream, maxW: 920, from: [W, 0], t0: cw[3] - .1, t1: cw[3] + .1, out: C1, seed: 73 }, notes);
    agent(comp, P + "_AGENT6", { x0: -160, x1: 1240, y: 1230, t0: C0, t1: C1, tm0: C0, tm1: cw[4] + .2, scale: 104, gait: "run", accent: red }, notes);
    var pr0 = .12 * e2.size, dotX = e2.right + pr0 + 20, dotY = 1270 - pr0 - 4, sc = pr0 / cr * 100;
    var ball = cut(piece(comp, P + "_OBJECT", [{ k: "circle", x: 0, y: 0, r: cr + 16, color: black }, { k: "circle", x: 0, y: 0, r: cr, color: mus }], [cx, cy]), { border: 3, scale: 40, shadow: 36 }, notes);
    span(ball, C0, E1); ball.moveAfter(comp.layer(P + "_AGENT6"));
    travel(ball.position, cw[4], C1, [cx, cy], [dotX, dotY]); travel(ball.scale, cw[4], C1, [100, 100], [sc, sc]);

    paperTexture(comp, P, notes);
    return { layers: comp.numLayers, notes: notes };
  }
  return { FAM: FAM, TITLE: TITLE, PALETTE: PALETTE, TWOS: TWOS, fontOK: fontOK, keys: keys, dead: dead, travel: travel, cut: cut, ground: ground, pivot: pivot,
    piece: piece, groupT: groupT, agent: agent, agentNodes: agentNodes, letters: letters, wordTimes: wordTimes, slideCredit: slideCredit, paperTexture: paperTexture,
    phone: phone, dossier: dossier, poles: poles, wire: wire, wordsIn: wordsIn, clearOwned: clearOwned, buildScene: buildScene };
})();
