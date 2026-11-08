// Pictogram motion style: brand-neutral ES3 helpers. No project mutation happens at load.
// Read styles/pictogram-motion/STYLE.md first. A square grid of discs and patterned cells whose rows slide past each other, faceless figures of
// round-capped bars, a 900-weight grotesk that slides up out of masks, mono HUD meta. One hue per card, printed by Tint from five greys.
// Adapted from Lemo-Opuscar's pictogram-motion style (MIT, LemoLab); see assets/LICENSE-lemo-opuscar.txt.
var AESPictogram = (function () {
  var FAM = "Inter Tight", MONO = "Space Mono", C = 180;                                        // C: the grid cell, 1/6 of the frame width
  function hex(h) { return [parseInt(h.substr(0, 2), 16) / 255, parseInt(h.substr(2, 2), 16) / 255, parseInt(h.substr(4, 2), 16) / 255]; }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  var CREAM = hex("F9F4E7"), SIGNAL = hex("E8412A"), GOLD = hex("F2B33D");
  // each hue is a ramp from its darkest to its lightest tone; the five tones are the ramp at 0, .25, .5, .75 and 1
  var HUES = { turf: { dark: hex("004F25"), light: hex("74C766"), accent: SIGNAL }, harbour: { dark: hex("0B2C66"), light: hex("6FA6E3"), accent: SIGNAL },
    brick: { dark: hex("7A160E"), light: hex("F2855E"), accent: GOLD }, night: { dark: hex("10141B"), light: hex("485262"), accent: GOLD },
    dusk: { dark: hex("2E1A63"), light: hex("A68BE6"), accent: SIGNAL }, ochre: { dark: hex("5E3203"), light: hex("E3A748"), accent: SIGNAL } };
  function tone(h, t) { return mix(h.dark, h.light, t); }
  var LOW = [.1, .62];                                                                            // the ramp span under type (low contrast); a chapter card uses [0, 1]
  function grey(k) { return [k / 4, k / 4, k / 4]; }                                              // pattern tone k (0..4) before Tint prints it
  function c4(c) { return [c[0], c[1], c[2], 1]; }
  function fontOK() { AESLib.font(FAM, "Black"); AESLib.font(FAM, "ExtraBold"); AESLib.font(MONO, "Bold"); return true; }
  function rng(seed) { var s = seed; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

  // ---- keys: list = [{ t, v, i, o }]; i / o are an influence (eased, zero speed), "L" linear or "H" hold. One setValuesAtTimes call.
  function easeArr(prop, inf) { var sp = prop.propertyValueType === PropertyValueType.TwoD_SPATIAL || prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL;
    var d = (!sp && prop.propertyValueType !== PropertyValueType.COLOR && prop.value instanceof Array) ? prop.value.length : 1, a = [];   // colours ease as one dimension
    for (var n = 0; n < d; n++) a.push(new KeyframeEase(0, inf)); return a; }
  function kt(x) { return x === "H" ? KeyframeInterpolationType.HOLD : (typeof x === "number" ? KeyframeInterpolationType.BEZIER : KeyframeInterpolationType.LINEAR); }
  function keys(prop, list) { var ts = [], vs = [], B = KeyframeInterpolationType.BEZIER;
    for (var j = 0; j < list.length; j++) { ts.push(list[j].t); vs.push(list[j].v); } prop.setValuesAtTimes(ts, vs);
    for (var k = 0; k < list.length; k++) { var ki = prop.nearestKeyIndex(list[k].t), a = list[k].i, b = list[k].o;
      prop.setInterpolationTypeAtKey(ki, B, B); prop.setTemporalEaseAtKey(ki, easeArr(prop, typeof a === "number" ? a : 33.3), easeArr(prop, typeof b === "number" ? b : 33.3));
      prop.setInterpolationTypeAtKey(ki, kt(a), kt(b)); }
    return prop; }
  // exponential ease-out for entrances (fast start, long settle), exponential in-out for whips
  function expoOut(prop, t0, t1, v0, v1) { return keys(prop, [{ t: t0, v: v0, o: 6 }, { t: t1, v: v1, i: 92 }]); }
  function whip(prop, t0, t1, v0, v1) { return keys(prop, [{ t: t0, v: v0, o: 88 }, { t: t1, v: v1, i: 88 }]); }
  function scl(L, s) { var v = L.scale.value, r = []; for (var i = 0; i < v.length; i++) r.push(v[i]); r[0] = s; r[1] = s; return r; }

  // ---- vector nodes: { k: "rect"|"ellipse"|"path"|"line"|"group", ... } drawn in order (later on top) into a contents group
  var KAPPA = .5523;
  function pie(cx, cy, r) { var s = new Shape(); s.vertices = [[cx, cy], [cx + r, cy], [cx, cy + r]]; s.inTangents = [[0, 0], [0, 0], [KAPPA * r, 0]];
    s.outTangents = [[0, 0], [0, KAPPA * r], [0, 0]]; s.closed = true; return s; }                                   // quarter disc, corner at (cx, cy), opening +x +y
  function half(x, y, r) { var k = KAPPA * r, s = new Shape(); s.vertices = [[x, y], [x + r, y - r], [x + 2 * r, y]]; s.inTangents = [[0, 0], [-k, 0], [0, -k]];
    s.outTangents = [[0, -k], [k, 0], [0, 0]]; s.closed = true; return s; }                                          // half disc standing on (x, y) .. (x + 2r, y)
  function poly(pts, closed) { var s = new Shape(); s.vertices = pts; s.closed = closed !== false; return s; }
  function circle(cx, cy, r) { var k = KAPPA * r, s = new Shape(); s.vertices = [[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy]];
    s.inTangents = [[-k, 0], [0, -k], [k, 0], [0, k]]; s.outTangents = [[k, 0], [0, k], [-k, 0], [0, -k]]; s.closed = true; return s; }
  function box(l, t, r, b) { return poly([[l, t], [r, t], [r, b], [l, b]]); }
  function emit(contents, nodes) {
    for (var i = nodes.length - 1; i >= 0; i--) { var n = nodes[i], g = contents.addProperty("ADBE Vector Group");
      if (n.rot || n.op !== undefined) { var tg = g.property("ADBE Vector Transform Group");
        if (n.rot) { tg.property("ADBE Vector Anchor").setValue(n.pivot); tg.property("ADBE Vector Position").setValue(n.pivot); tg.property("ADBE Vector Rotation").setValue(n.rot); }
        if (n.op !== undefined) tg.property("ADBE Vector Group Opacity").setValue(n.op); }
      var v = g.property("ADBE Vectors Group");
      if (n.k === "group") { emit(v, n.kids); continue; }
      if (n.k === "rect") { var s = v.addProperty("ADBE Vector Shape - Rect"); s.property("ADBE Vector Rect Size").setValue([n.w + (n.pad || 0), n.h + (n.pad || 0)]);
        s.property("ADBE Vector Rect Position").setValue([n.x + n.w / 2, n.y + n.h / 2]); if (n.round) s.property("ADBE Vector Rect Roundness").setValue(n.round); }
      else if (n.k === "ellipse") { var e = v.addProperty("ADBE Vector Shape - Ellipse"); e.property("ADBE Vector Ellipse Size").setValue([2 * n.r, 2 * n.r]); e.property("ADBE Vector Ellipse Position").setValue([n.x, n.y]); }
      else { var pp = v.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape"); pp.setValue(n.shape);
        if (n.anim) { pp.setValuesAtTimes(n.anim.t, n.anim.v); for (var a = 1; a <= pp.numKeys; a++) pp.setInterpolationTypeAtKey(a, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD); } }
      if (n.k === "line" || n.stroke) { var st = v.addProperty("ADBE Vector Graphic - Stroke"); st.property("ADBE Vector Stroke Color").setValue(n.color); st.property("ADBE Vector Stroke Width").setValue(n.width);
        st.property("ADBE Vector Stroke Line Cap").setValue(2); st.property("ADBE Vector Stroke Line Join").setValue(2); if (n.sop !== undefined) st.property("ADBE Vector Stroke Opacity").setValue(n.sop); }
      else v.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(n.color); }
  }
  function shapeLayer(comp, name, nodes, pos, anchor) { var L = comp.layers.addShape(); L.name = name; emit(L.property("ADBE Root Vectors Group"), nodes);
    L.anchorPoint.setValue(anchor || [0, 0]); L.position.setValue(pos || [0, 0]); return L; }
  function maskBox(L, l, t, r, b) { var m = L.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"); m.property("ADBE Mask Shape").setValue(box(l, t, r, b)); return m; }

  // ---- the pattern: one shape layer per grid row, drawn two cells wider than the frame on each side and masked to its band, so a row can
  // shift a whole cell. Discs sit on grid nodes (they read as half and quarter discs once the bands cut them); about half the cells carry a motif.
  function motif(kind, x, y, a, b, rot) { var c = C, cx = x + c / 2, cy = y + c / 2, k = [{ k: "rect", x: x, y: y, w: c, h: c, color: grey(a), pad: 1 }], q;
    if (kind === 0) k.push({ k: "path", shape: pie(x, y, c), color: grey(b) });
    else if (kind === 1) k.push({ k: "path", shape: half(x, y + c, c / 2), color: grey(b) });
    else if (kind === 2) { k.push({ k: "ellipse", x: cx, y: cy, r: .42 * c, color: grey(b) }, { k: "ellipse", x: cx, y: cy, r: .28 * c, color: grey(a) }, { k: "ellipse", x: cx, y: cy, r: .14 * c, color: grey(b) }); }
    else if (kind === 3) { for (q = 0; q < 9; q++) k.push({ k: "ellipse", x: x + c / 6 + (q % 3) * c / 3, y: y + c / 6 + Math.floor(q / 3) * c / 3, r: .075 * c, color: grey(b) }); }
    else if (kind === 4) { for (q = 0; q < 4; q++) k.push({ k: "path", shape: poly([[x + q * c / 4, y + c], [x + (q + .5) * c / 4, y + .55 * c], [x + (q + 1) * c / 4, y + c]]), color: grey(b) }); }
    else if (kind === 5) { for (q = 0; q < 5; q++) k.push({ k: "rect", x: x, y: y + .1 * c + q * .18 * c, w: (1 - .12 * q) * c, h: .08 * c, color: grey(b) }); }
    else if (kind === 6) { for (q = 0; q < 12; q++) k.push({ k: "rect", x: cx - .025 * c, y: y + .06 * c, w: .05 * c, h: .14 * c, color: grey(b), rot: q * 30, pivot: [cx, cy] });
      k.push({ k: "ellipse", x: cx, y: cy, r: .22 * c, color: grey(b) }); }
    else if (kind === 7) { for (q = 0; q < 16; q++) if ((q + Math.floor(q / 4)) % 2 === 0) k.push({ k: "rect", x: x + (q % 4) * c / 4, y: y + Math.floor(q / 4) * c / 4, w: c / 4, h: c / 4, color: grey(b), pad: .5 }); }
    else if (kind === 8) { k.push({ k: "ellipse", x: cx, y: cy, r: .4 * c, color: grey(b) }, { k: "ellipse", x: cx + .14 * c, y: cy - .1 * c, r: .34 * c, color: grey(a) }); }
    else if (kind === 9) { for (q = 0; q < 3; q++) { k.push({ k: "path", shape: half(x + q * c / 3, y + c / 2, c / 6), color: grey(b) }, { k: "path", shape: half(x + q * c / 3, y + c, c / 6), color: grey(b) }); } }
    else { k.push({ k: "path", shape: pie(x, y, c), color: grey(b) }, { k: "path", shape: pie(x, y, .66 * c), color: grey(a) }, { k: "path", shape: pie(x, y, .33 * c), color: grey(b) }); }
    return { k: "group", kids: k, rot: rot, pivot: [cx, cy] }; }
  function patternRows(comp, P, seed, nRows) { var R = rng(seed), discs = {}, cells = {}, i, j, rows = [];
    for (j = 0; j <= nRows; j++) for (i = -2; i <= 8; i++) if ((i + j) % 2 === 0 && R() < .5) discs[i + "_" + j] = { t: [0, 2, 3, 4][Math.floor(R() * 4)], inner: R() < .4 ? Math.floor(R() * 5) : -1 };
    for (j = 0; j < nRows; j++) for (i = -2; i < 8; i++) if (R() < .48) { var a = Math.floor(R() * 5), b = (a + 1 + Math.floor(R() * 4)) % 5; cells[i + "_" + j] = { kind: Math.floor(R() * 11), a: a, b: b, rot: 90 * Math.floor(R() * 4) }; }
    for (var r = 0; r < nRows; r++) { var y0 = r * C, nodes = [{ k: "rect", x: -2 * C, y: y0, w: 10 * C, h: C, color: grey(1), pad: 2 }];
      for (j = r; j <= r + 1; j++) for (i = -2; i <= 8; i++) { var d = discs[i + "_" + j]; if (!d) continue;
        nodes.push({ k: "ellipse", x: i * C, y: j * C, r: C, color: grey(d.t) }); if (d.inner >= 0) nodes.push({ k: "ellipse", x: i * C, y: j * C, r: .5 * C, color: grey(d.inner) }); }
      for (i = -2; i < 8; i++) { var m = cells[i + "_" + r]; if (m) nodes.push(motif(m.kind, i * C, y0, m.a, m.b, m.rot)); }
      var L = shapeLayer(comp, P + "_ROW" + (r < 10 ? "0" : "") + r, nodes); maskBox(L, -2 * C - 4, y0, 8 * C + 4, y0 + C + .5); L.motionBlur = true; rows.push(L); }
    return rows; }

  // ---- type: a text layer flush left on a baseline (anchor at the ink's left edge), or flush right when o.right
  function txt(comp, name, str, o) { var L = AESLib.text(comp, name, str, { family: o.mono ? MONO : FAM, style: o.style || (o.mono ? "Bold" : "Black"), size: o.size, color: o.color || CREAM, just: "left", tracking: o.tracking || 0 });
    var r = L.sourceRectAtTime(0, false); L.anchorPoint.setValue([o.right ? r.left + r.width : r.left, 0]); L.position.setValue([o.x, o.y]); return { L: L, r: r }; }
  function width(comp, str, o) { var T = txt(comp, "PICTO_MEASURE", str, { mono: o.mono, style: o.style, size: o.size, tracking: o.tracking, x: 0, y: 0 }), w = T.r.width; T.L.remove(); return w; }
  function fit(comp, str, o, maxW) { var w = width(comp, str, o); return w > maxW ? o.size * maxW / w : o.size; }
  // the mask slide-up: the layer rises into a fixed clip and lands (expo out); o.out lifts it out of the same clip
  function slide(T, t, o) { o = o || {}; var L = T.L, r = T.r, pad = .08 * Math.max(r.height, 20), l = r.left - 2 * pad, rt = r.left + r.width + 2 * pad, top = r.top - pad, bot = r.top + r.height + pad, d = bot - top, dur = o.dur || .3;
    L.inPoint = t; var p = L.position.value, x = p[0], y = p[1], mp = L.property("ADBE Mask Parade").addProperty("ADBE Mask Atom").property("ADBE Mask Shape");
    function bx(dy) { return box(l, top + dy, rt, bot + dy); }
    var pk = [{ t: t, v: [x, y + d], o: 6 }, { t: t + dur, v: [x, y], i: 92 }], mk = [{ t: t, v: bx(-d), o: 6 }, { t: t + dur, v: bx(0), i: 92 }];
    if (o.t1 !== undefined) L.outPoint = o.t1;
    if (o.out !== undefined) { pk.push({ t: o.out, v: [x, y], o: 80 }, { t: o.out + .14, v: [x, y - d], i: 10 }); mk.push({ t: o.out, v: bx(0), o: 80 }, { t: o.out + .14, v: bx(d), i: 10 }); L.outPoint = o.out + .14; }
    keys(L.position, pk); keys(mp, mk); L.motionBlur = true; return L; }
  // mono meta typed on without a caret: a mask whose right edge steps one character a frame (hold keys)
  function typeOn(T, t, n, o) { o = o || {}; var L = T.L, r = T.r, fps = 1 / L.containingComp.frameDuration, cps = o.cps || 40, ts = [], vs = [];
    var mp = L.property("ADBE Mask Parade").addProperty("ADBE Mask Atom").property("ADBE Mask Shape"), l = r.left - 4, top = r.top - 6, bot = r.top + r.height + 6;
    for (var k = 0; k <= n; k++) { ts.push(t + Math.round(k / cps * fps) / fps); vs.push(box(l, top, k === n ? r.left + r.width + 8 : r.left + r.width * k / n, bot)); }
    mp.setValuesAtTimes(ts, vs); for (var q = 1; q <= mp.numKeys; q++) mp.setInterpolationTypeAtKey(q, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD);
    L.inPoint = t; if (o.t1 !== undefined) L.outPoint = o.t1; return L; }

  // ---- the figure: unit 1 = 1/138 of the body height, origin at the hip; far limbs mixed toward the background (stroke opacity)
  var W_TORSO = 16, W_LEG = 11, W_ARM = 9, HEAD = 10;
  var POSES = {
    read: { head: [5, -74], torso: [[0, -4], [3, -55]], nearArm: [[7, -50], [18, -33], [32, -43]], farArm: [[-1, -50], [-8, -30], [-5, -12]], nearLeg: [[2, 4], [7, 26], [5, 48]], farLeg: [[-2, 4], [-7, 26], [-11, 47]] },
    typeA: { head: [7, -73], torso: [[0, -4], [4, -55]], nearArm: [[8, -50], [17, -31], [33, -27]], farArm: [[0, -50], [9, -33], [25, -30]], nearLeg: [[2, 4], [5, 26], [4, 48]], farLeg: [[-2, 4], [-5, 26], [-8, 47]] },
    typeB: { head: [7, -73], torso: [[0, -4], [4, -55]], nearArm: [[8, -50], [18, -32], [33, -32]], farArm: [[0, -50], [9, -32], [25, -25]], nearLeg: [[2, 4], [5, 26], [4, 48]], farLeg: [[-2, 4], [-5, 26], [-8, 47]] },
    cheer: { head: [0, -76], torso: [[0, -4], [0, -55]], nearArm: [[5, -51], [17, -65], [22, -88]], farArm: [[-5, -51], [-17, -65], [-22, -88]], nearLeg: [[3, 4], [12, 25], [18, 47]], farLeg: [[-3, 4], [-12, 25], [-18, 47]] }
  };
  function limb(pts, s) { var a = []; for (var i = 0; i < pts.length; i++) a.push([pts[i][0] * s, pts[i][1] * s]); return poly(a, false); }
  // seq = [{ t, pose }] (one entry, or several for a held pose change on each t)
  function figureNodes(seq, s, color) { var parts = [["farArm", W_ARM, 60], ["farLeg", W_LEG, 60], ["torso", W_TORSO], ["nearLeg", W_LEG], ["nearArm", W_ARM]], nodes = [];
    for (var p = 0; p < parts.length; p++) { var nm = parts[p][0], n = { k: "line", shape: limb(POSES[seq[0].pose][nm], s), color: color, width: parts[p][1] * s, sop: parts[p][2] };
      if (seq.length > 1) { n.anim = { t: [], v: [] }; for (var q = 0; q < seq.length; q++) { n.anim.t.push(seq[q].t); n.anim.v.push(limb(POSES[seq[q].pose][nm], s)); } }
      nodes.push(n); }
    var h = POSES[seq[0].pose].head, hn = { k: "path", shape: circle(h[0] * s, h[1] * s, HEAD * s), color: color };
    if (seq.length > 1) { hn.anim = { t: [], v: [] }; for (var q2 = 0; q2 < seq.length; q2++) { var hh = POSES[seq[q2].pose].head; hn.anim.t.push(seq[q2].t); hn.anim.v.push(circle(hh[0] * s, hh[1] * s, HEAD * s)); } }
    nodes.push(hn); return nodes; }
  // the figure arrives as horizontal bands sliding into register from alternating sides (one masked copy per band)
  function figure(comp, name, seq, x, y, s, color, t, t1, o) { o = o || {}; var nb = o.bands || 4, F = shapeLayer(comp, name + "_0", figureNodes(seq, s, color), [x, y]), out = [F];
    for (var k = 1; k < nb; k++) { var D = F.duplicate(); D.name = name + "_" + k; out.push(D); }
    var top = -92 * s, bot = 60 * s, bh = (bot - top) / nb;
    for (var b = 0; b < nb; b++) { var L = out[b]; maskBox(L, -60 * s, top + b * bh - (b ? 0 : 20), 60 * s, top + (b + 1) * bh + (b === nb - 1 ? 20 : .5));
      var dx = (b % 2 ? 1 : -1) * (o.reach || 420), tb = t + .045 * b; expoOut(L.position, tb, tb + .32, [x + dx, y], [x, y]); L.inPoint = tb; L.outPoint = t1; L.motionBlur = true; }
    return out; }
  // a prop pops open about its own centre (expo out); props are discs, rings, capsules and lines in the figure colour
  function prop(comp, name, nodes, pos, t, t1) { var L = shapeLayer(comp, name, nodes, pos, [0, 0]); expoOut(L.scale, t, t + .26, scl(L, 0), scl(L, 100)); L.inPoint = t; L.outPoint = t1; L.motionBlur = true; return L; }

  function wordsIn(list, t0, t1) { var r = []; for (var i = 0; i < list.length; i++) if (list[i].s >= t0 - .05 && list[i].s < t1 - .02) r.push(list[i]); return r; }
  function clearOwned(comp, prefix) { AESLib.clearOwned(comp, prefix); }

  // buildScene: the shared test scene (production/styles/scene) as seven cards of a pictogram film. comp = an empty 1080 x 1920 comp at scene.fps.
  // Each beat is a card in its own hue (the rows whip one cell at every cut while Tint swaps the hue); stage on top, text column below, HUD in
  // the corners, a caption band and a tick bar at the bottom. The real frame is printed inside the stage disc, pushed to full bleed for the carry,
  // and shrinks back to become the end card's sun disc.
  function buildScene(comp, scene, opts) {
    fontOK(); var P = opts.prefix || "PICTO", A = opts.assets, B = scene.beat, Wd = comp.width, Ht = comp.height, M = 72, FULL = Wd - 2 * M, notes = [], fr = comp.frameDuration;
    var WL = scene.wordList, nRows = Math.ceil(Ht / C);
    clearOwned(comp, P); comp.motionBlur = true;
    var CARDS = [
      { id: "title", hue: "turf", block: 700, title: [B.title.context.toUpperCase().split(" ")[0], B.title.context.toUpperCase().split(" ").slice(1).join(" ")], size: 300, second: B.title.hero, chip: "START", ch: "OPENING" },
      { id: "picture", hue: "harbour", title: ["3 PIECES"], size: 200, second: "build one picture", chip: "BUILD", ch: "PIECES", stage: true },
      { id: "input", hue: "brick", title: ["REAL FRAME"], size: 200, second: "from my video", chip: "INPUT", ch: "SOURCE" },
      { id: "number", hue: "night", title: [B.number.label.toUpperCase()], size: 220, second: "counted", chip: "COUNT", ch: "COUNT" },
      { id: "line", hue: "dusk", words: true, size: 150, chip: "VOICE", ch: "VOICE", stage: true },
      { id: "carry", hue: "ochre", title: ["ONE THING"], size: 200, second: "becomes the next", chip: "CARRY", ch: "CARRY" },
      { id: "end", hue: "turf", block: 1150, title: ["THAT'S", "THE TEST."], size: 200, second: "pictogram motion", chip: "TEST", ch: "THE TEST" }
    ];
    var N = CARDS.length, T = [], k, r, i;
    for (k = 0; k < N; k++) { CARDS[k].t0 = B[CARDS[k].id].t0; CARDS[k].t1 = B[CARDS[k].id].t1; CARDS[k].H = HUES[CARDS[k].hue]; T.push(CARDS[k].t0); }
    // 1. the grey stack: page, pattern rows, stage discs (Tint prints all of it in the card's hue)
    var page = comp.layers.addSolid(grey(1), P + "_PAGE", Wd, Ht, 1);
    var rows = patternRows(comp, P, opts.seed || 1972, nRows);
    for (r = 0; r < nRows; r++) { var px = rows[r].property("ADBE Transform Group").property("ADBE Position"); px.dimensionsSeparated = true;
      var X = rows[r].property("ADBE Transform Group").property("ADBE Position_0"), dir = r % 2 ? 1 : -1, list = [], st = r * .008, x = 0;
      list.push({ t: 0, v: dir * 1440, o: 6 }); list.push({ t: .34 + r * .016, v: 0, i: 92, o: "L" });                // opening: rows slide in from alternating sides
      for (k = 1; k < N; k++) { var drift = (k % 2 ? 1 : -1) * dir * 16; list.push({ t: T[k] - .1 + st, v: x + drift, i: "L", o: 88 });
        x = x + drift + ((r + k) % 2 ? 1 : -1) * C; list.push({ t: T[k] + .1 + st, v: x, i: 88, o: "L" }); }
      list.push({ t: 9.9 + r * .05, v: x + dir * 14, i: 85 });                                                            // the end card: rows stop one by one
      keys(X, list); }
    var stageY = 700, stageR = 380, discs = {};
    for (k = 0; k < N; k++) if (CARDS[k].stage) { var D = shapeLayer(comp, P + "_DISC" + k, [{ k: "ellipse", x: 0, y: 0, r: stageR, color: grey(3) }], [Wd / 2, stageY]);
      expoOut(D.scale, CARDS[k].t0, CARDS[k].t0 + .3, scl(D, 0), scl(D, 100)); D.inPoint = CARDS[k].t0; D.outPoint = CARDS[k].t1; discs[k] = D; }
    var tintL = comp.layers.addSolid([1, 1, 1], P + "_TINT", Wd, Ht, 1); tintL.adjustmentLayer = true; tintL.property("ADBE Effect Parade").addProperty("ADBE Tint");
    var TF = tintL.property("ADBE Effect Parade").property(1), mb = [{ t: 0, v: c4(CARDS[0].H.dark), o: 70 }], mw = [{ t: 0, v: c4(CARDS[0].H.light), o: 70 }];
    mb.push({ t: .7, v: c4(tone(CARDS[0].H, LOW[0])), i: 70, o: "H" }); mw.push({ t: .7, v: c4(tone(CARDS[0].H, LOW[1])), i: 70, o: "H" });     // the chapter card settles under its type
    for (k = 1; k < N; k++) { mb.push({ t: T[k], v: c4(tone(CARDS[k].H, LOW[0])), i: "H", o: "H" }); mw.push({ t: T[k], v: c4(tone(CARDS[k].H, LOW[1])), i: "H", o: "H" }); }
    keys(TF.property("Map Black To"), mb); TF = tintL.property("ADBE Effect Parade").property(1); keys(TF.property("Map White To"), mw);
    var stageTone = function (H) { return tone(H, LOW[0] + (LOW[1] - LOW[0]) * .75); };
    // 2. the real frame: printed in the card's hue inside the stage disc; it returns for the carry, is pushed to full bleed, then shrinks back
    // to the end card's stage and turns into its sun disc
    var ph = comp.layers.add(AESLib.importFile(A.disc)); ph.name = P + "_PHOTO"; var pw = ph.source.width, pr = pw / 2;
    ph.anchorPoint.setValue([pr, pr]); ph.position.setValue([Wd / 2, stageY]);
    ph.property("ADBE Mask Parade").addProperty("ADBE Mask Atom").property("ADBE Mask Shape").setValue(circle(pr, pr, pr));
    var k100 = stageR / pr * 100, kFull = Math.sqrt(Math.pow(Wd / 2, 2) + Math.pow(Ht - stageY, 2)) / pr * 100 * 1.02;
    var cI = CARDS[2], cC = CARDS[5], cE = CARDS[6], tIn = cI.t0 + .08, tRet = cC.t0 + .04, tPush = cC.t0 + .42, tBack = cE.t0 + .3;
    keys(ph.scale, [{ t: tIn, v: scl(ph, 0), o: 6 }, { t: tIn + .32, v: scl(ph, k100), i: 92, o: "H" }, { t: cI.t1, v: scl(ph, 0), i: "H", o: "H" },
      { t: tRet, v: scl(ph, 0), i: "H", o: 6 }, { t: tRet + .3, v: scl(ph, k100 * .9), i: 92, o: 70 }, { t: tPush + .5, v: scl(ph, kFull), i: 85, o: "H" },
      { t: cE.t0, v: scl(ph, kFull), i: "H", o: 85 }, { t: tBack, v: scl(ph, k100), i: 88 }]);
    ph.inPoint = tIn; ph.motionBlur = true;
    ph.property("ADBE Effect Parade").addProperty("ADBE Tint"); var PT = ph.property("ADBE Effect Parade").property(1);
    keys(PT.property("Map Black To"), [{ t: 0, v: c4(cI.H.dark), o: "H" }, { t: cC.t0, v: c4(cC.H.dark), i: "H", o: "H" }, { t: cE.t0, v: c4(cE.H.dark), i: "H", o: "H" }, { t: tBack + .04, v: c4(stageTone(cE.H)), i: "H", o: "H" }]);
    PT = ph.property("ADBE Effect Parade").property(1);
    keys(PT.property("Map White To"), [{ t: 0, v: c4(CREAM), o: "H" }, { t: cC.t0, v: c4(tone(cC.H, .62)), i: "H", o: "H" }, { t: cE.t0, v: c4(tone(cE.H, .62)), i: "H", o: "H" }, { t: tBack + .04, v: c4(stageTone(cE.H)), i: "H", o: "H" }]);
    // 3. one soft light sweep crosses each stage card (the only gradient)
    var sweepCards = [1, 2, 4, 6];
    for (i = 0; i < sweepCards.length; i++) { var cs = CARDS[sweepCards[i]], SW = shapeLayer(comp, P + "_SWEEP" + i, [{ k: "rect", x: -90, y: -1300, w: 180, h: 2600, color: [1, 1, 1] }], [-300, Ht / 2]);
      var smk = maskBox(SW, -90, -1300, 90, 1300); smk.property("ADBE Mask Feather").setValue([90, 0]); SW.rotation.setValue(16); SW.opacity.setValue(9); SW.blendingMode = BlendingMode.ADD;
      keys(SW.position, [{ t: cs.t0, v: [-300, Ht / 2] }, { t: cs.t1, v: [Wd + 300, Ht / 2] }]); SW.inPoint = cs.t0; SW.outPoint = cs.t1; }
    // 4. the stage: three pieces build one picture (figure in bands, a document, a device); the typed line (a figure typing at a desk,
    // one held pose change per spoken word); the count (a giant numeral rolling up on a bar); the end figure cheering on the sun disc
    var c1 = CARDS[1], pwds = wordsIn(WL, c1.t0, c1.t1), s1 = 4, hipX = 470, hipY = 770;
    var tP = [pwds[0] ? pwds[0].s : c1.t0, pwds[1] ? pwds[1].s : c1.t0 + .3, pwds[2] ? pwds[2].s : c1.t0 + .6];
    figure(comp, P + "_FIG1", [{ t: 0, pose: "read" }], hipX, hipY, s1, CREAM, tP[0] + .02, c1.t1);
    var dline = tone(c1.H, .2);
    prop(comp, P + "_DOC", [{ k: "rect", x: -62, y: -78, w: 124, h: 156, round: 14, color: CREAM }, { k: "rect", x: -40, y: -50, w: 60, h: 14, round: 7, color: dline },
      { k: "rect", x: -40, y: -20, w: 80, h: 10, round: 5, color: tone(c1.H, .5) }, { k: "rect", x: -40, y: 2, w: 80, h: 10, round: 5, color: tone(c1.H, .5) },
      { k: "rect", x: -40, y: 24, w: 56, h: 10, round: 5, color: tone(c1.H, .5) }], [hipX + 34 * s1 + 10, hipY - 47 * s1], tP[1] + .02, c1.t1).rotation.setValue(-8);
    prop(comp, P + "_DEVICE", [{ k: "rect", x: -92, y: -66, w: 184, h: 132, round: 16, color: CREAM, stroke: true, width: 18 }, { k: "line", shape: poly([[0, 72], [0, 112]], false), color: CREAM, width: 18 },
      { k: "line", shape: poly([[-50, 120], [50, 120]], false), color: CREAM, width: 18 }], [770, 850], tP[2] + .02, c1.t1);
    var c4c = CARDS[4], lw = wordsIn(WL, c4c.t0, c4c.t1), seq = [{ t: 0, pose: "typeA" }];
    for (i = 0; i < lw.length; i++) seq.push({ t: lw[i].s, pose: i % 2 ? "typeA" : "typeB" });
    var fx4 = 420, fy4 = 790; figure(comp, P + "_FIG2", seq, fx4, fy4, s1, CREAM, c4c.t0 + .06, c4c.t1);
    prop(comp, P + "_DESK", [{ k: "line", shape: poly([[-120, 0], [200, 0]], false), color: CREAM, width: 16 }, { k: "line", shape: poly([[150, 0], [150, 270]], false), color: CREAM, width: 16 },
      { k: "rect", x: 20, y: -122, w: 150, h: 104, round: 12, color: CREAM, stroke: true, width: 14 }, { k: "line", shape: poly([[0, -10], [190, -10]], false), color: CREAM, width: 12 }],
      [fx4 + 34 * s1 + 30, fy4 - 24 * s1], c4c.t0 + .14, c4c.t1);
    var c3 = CARDS[3], nT = c3.t0 + .04, nS = 430, nb = stageY + 150;
    var NUM = txt(comp, P + "_NUM", String(B.number.value), { size: nS, color: CREAM, x: M - .05 * nS, y: nb, tracking: -30 });
    slide(NUM, nT, { dur: .3, t1: c3.t1 });
    var roll = [], nf = 20; for (i = 0; i <= nf; i++) { var p = i / nf, v = Math.round(B.number.value * (1 - Math.pow(2, -10 * p)) / (1 - Math.pow(2, -10))); roll.push(("00" + v).slice(-3)); }
    AESLib.bakeText(NUM.L, roll, 1 / fr, nT);
    var BAR = shapeLayer(comp, P + "_BAR", [{ k: "rect", x: 0, y: 0, w: FULL, h: 20, color: c3.H.accent }], [M, nb + 46]);
    expoOut(BAR.scale, nT, nT + nf * fr, [0, 100, 100], [100, 100, 100]); BAR.inPoint = nT; BAR.outPoint = c3.t1;
    var tick0 = shapeLayer(comp, P + "_BART", [{ k: "rect", x: 0, y: 0, w: FULL, h: 20, color: tone(c3.H, .75) }], [M, nb + 46]); tick0.inPoint = nT; tick0.outPoint = c3.t1; tick0.moveAfter(BAR);
    var c6 = CARDS[6], ew = wordsIn(WL, c6.t0, c6.t1);
    figure(comp, P + "_FIG3", [{ t: 0, pose: "cheer" }], Wd / 2, stageY + 80, 3.8, CREAM, tBack + .06, comp.duration, { reach: 460 });
    // 5. the text column: index, a huge title sliding up out of its mask, the second line ~0.08 s later, a tag chip after
    for (k = 0; k < N; k++) { var cd = CARDS[k], y = cd.block || 1210, t0 = cd.t0 + .02, last = k === N - 1, outT = last ? undefined : cd.t1 - .16, nm = P + "_C" + k;
      var IX = txt(comp, nm + "_IDX", "0" + (k + 1) + " / 0" + N, { mono: true, size: 26, tracking: 180, x: M, y: y }); typeOn(IX, cd.t0, 7, { t1: cd.t1 });
      var by = y + 34;
      if (cd.words) {                                                                                                  // the typed line: each word lands on its spoken onset
        var ww = wordsIn(WL, cd.t0, cd.t1), big = [], small = [];
        for (i = 0; i < ww.length; i++) (i < 4 ? big : small).push(ww[i]);
        var bs = fit(comp, (big[0].text + " " + big[1].text).toUpperCase(), { size: cd.size }, FULL), lx = M, ly = by + .73 * bs;
        for (i = 0; i < big.length; i++) { if (i === 2) { lx = M; ly += .9 * bs; }
          var WT = txt(comp, nm + "_W" + i, big[i].text.toUpperCase(), { size: bs, x: lx, y: ly, tracking: -20 }); slide(WT, Math.max(cd.t0, big[i].s - .04), { dur: .26, out: outT + .02 * i }); lx += WT.r.width + .24 * bs; }
        lx = M; ly += 26 + .73 * 72;
        for (i = 0; i < small.length; i++) { var ST = txt(comp, nm + "_S" + i, small[i].text, { style: "ExtraBold", size: 72, x: lx, y: ly, tracking: -10 }); slide(ST, small[i].s - .04, { dur: .26, out: outT + .1 }); lx += ST.r.width + .26 * 72; }
        by = ly;
      } else {
        var ts = cd.size; for (i = 0; i < cd.title.length; i++) ts = Math.min(ts, fit(comp, cd.title[i], { size: cd.size }, FULL));
        var ly2 = by + .73 * ts;
        for (i = 0; i < cd.title.length; i++) { if (i) ly2 += .9 * ts; slide(txt(comp, nm + "_T" + i, cd.title[i], { size: ts, x: M - .02 * ts, y: ly2, tracking: -20 }), t0 + .05 * i, { out: outT }); }
        ly2 += 26 + .73 * 72; slide(txt(comp, nm + "_S", cd.second, { style: "ExtraBold", size: 72, x: M, y: ly2, tracking: -10 }), t0 + .08 + .05 * (cd.title.length - 1), { out: outT === undefined ? undefined : outT + .03 });
        by = ly2;
      }
      var chipY = Math.min(by + 70, 1652);                                                                   // the chip never touches the caption band
      if (by + 70 > chipY) notes.push(cd.id + ": chip lifted to clear the caption band");
      var CT0 = chipY, CT = txt(comp, nm + "_CHIPT", cd.chip, { mono: true, size: 24, tracking: 120, x: M + 14, y: CT0 }), cw = CT.r.width + 28;
      var CR = shapeLayer(comp, nm + "_CHIP", [{ k: "rect", x: 0, y: 0, w: cw, h: 44, color: cd.H.accent }], [M, chipY - 32]); CR.moveAfter(CT.L);
      expoOut(CR.scale, t0 + .18, t0 + .4, [0, 100, 100], [100, 100, 100]); CR.inPoint = t0 + .18; CR.outPoint = cd.t1; typeOn(CT, t0 + .24, cd.chip.length, { t1: cd.t1 });
      // HUD, top right: the chapter typed on at the cut
      typeOn(txt(comp, nm + "_CH", "CH.0" + (k + 1) + "  " + cd.ch, { mono: true, size: 22, tracking: 180, x: Wd - M, y: 112, right: true }), cd.t0, ("CH.0" + (k + 1) + "  " + cd.ch).length, { t1: cd.t1 });
    }
    typeOn(txt(comp, P + "_HUD0", "STYLE LIBRARY", { mono: true, size: 22, tracking: 180, x: M, y: 112 }), .1, 13);
    typeOn(txt(comp, P + "_HUD1", "PICTOGRAM MOTION", { mono: true, size: 22, tracking: 180, x: M, y: 146 }), .2, 16);
    typeOn(txt(comp, P + "_HUD2", "SHARED SCENE  10.8 S", { mono: true, size: 22, tracking: 180, x: Wd - M, y: 146, right: true }), .3, 20);
    // 6. captions: a mono line on a solid band in the card's darkest tone, each word appearing on its spoken onset
    var bandY = 1700, band = shapeLayer(comp, P + "_BAND", [{ k: "rect", x: 0, y: 0, w: Wd, h: 84, color: CARDS[0].H.dark, pad: 2 }], [0, bandY]);
    var bc = band.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property(2).property("ADBE Vector Fill Color"), bk = [];
    for (k = 0; k < N; k++) bk.push({ t: T[k], v: CARDS[k].H.dark, i: "H", o: "H" }); keys(bc, bk);
    for (k = 0; k < N; k++) { var cw2 = wordsIn(WL, CARDS[k].t0, CARDS[k].t1), cx = M;
      for (i = 0; i < cw2.length; i++) { var CW = txt(comp, P + "_CAP" + k + "_" + i, cw2[i].text.toUpperCase(), { mono: true, size: 28, tracking: 40, x: cx, y: bandY + 52 }); CW.L.inPoint = cw2[i].s; CW.L.outPoint = k === N - 1 ? comp.duration : CARDS[k].t1; cx += CW.r.width + 17; } }
    // 7. the progress bar: one tick per card (current tall, done dimmed, the rest faint)
    for (i = 0; i < N; i++) { var TK = shapeLayer(comp, P + "_TICK" + i, [{ k: "rect", x: -3, y: -40, w: 6, h: 40, color: CREAM }], [M + i * FULL / (N - 1), 1868]), sk = [], ok = [];
      for (k = 0; k < N; k++) { sk.push({ t: T[k], v: [100, k === i ? 100 : 40, 100], i: "H", o: "H" }); ok.push({ t: T[k], v: k === i ? 100 : (k > i ? 45 : 22), i: "H", o: "H" }); }
      keys(TK.scale, sk); keys(TK.opacity, ok); }
    // 8. light grain over everything
    var gr = comp.layers.addSolid([1, 1, 1], P + "_GRAIN", Wd, Ht, 1); gr.adjustmentLayer = true; gr.property("ADBE Effect Parade").addProperty("ADBE Noise");
    var GN = gr.property("ADBE Effect Parade").property(1); GN.property("Amount of Noise").setValue(3); GN = gr.property("ADBE Effect Parade").property(1); GN.property(2).setValue(0);
    page.moveToEnd();
    return { layers: comp.numLayers, notes: notes };
  }
  return { FAM: FAM, MONO: MONO, C: C, HUES: HUES, CREAM: CREAM, POSES: POSES, fontOK: fontOK, keys: keys, expoOut: expoOut, whip: whip, emit: emit, shapeLayer: shapeLayer,
    patternRows: patternRows, motif: motif, txt: txt, fit: fit, slide: slide, typeOn: typeOn, figure: figure, prop: prop, tone: tone, wordsIn: wordsIn, clearOwned: clearOwned, buildScene: buildScene };
})();
