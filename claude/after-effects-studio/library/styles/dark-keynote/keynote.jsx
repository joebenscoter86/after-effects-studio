// Dark keynote style: brand-neutral ES3 helpers. No project mutation happens at load.
// Read styles/dark-keynote/STYLE.md first. A software launch film where the interface is the star: a near-black stage with a hairline grid
// and soft cool light, raised dark windows and cards, one luminous accent reserved for the one thing that matters, light sweeps that
// reveal, a giant number locking out of glyph noise, captions as toast notifications. Everything lands on the beat with one small overshoot.
// Adapted from Lemo-Opuscar's dark-keynote style (MIT, LemoLab); see assets/LICENSE-lemo-opuscar.txt.
var AESKeynote = (function () {
  var SANS = "Inter Tight", MONO = "IBM Plex Mono";
  function hex(h) { return [parseInt(h.substr(1, 2), 16) / 255, parseInt(h.substr(3, 2), 16) / 255, parseInt(h.substr(5, 2), 16) / 255]; }
  var PALETTE = { stage: hex("#06080C"), lift: hex("#141923"), s1: hex("#101319"), s2: hex("#161A22"), s3: hex("#1D222C"), text: hex("#EDEFF3"),
    secondary: hex("#9AA1AD"), label: hex("#5C6370"), accent: hex("#B7F34A"), cool: hex("#3050FF"), white: [1, 1, 1], black: [0, 0, 0],
    icon: hex("#8C94A2"), well: hex("#2A303B"), paper: hex("#E6E9EE"), rule: hex("#B4BAC4"), code: hex("#C26A63"), bar: hex("#3D4450") };
  var MODULE = 48;                                                                  // the hairline grid's module; every 4th line is brighter
  function fontOK() { AESLib.font(SANS, "SemiBold"); AESLib.font(SANS, "Medium"); AESLib.font(MONO, "Regular"); AESLib.font(MONO, "Medium"); return true; }
  function c4(c) { return [c[0], c[1], c[2], 1]; }
  function fx(L, m) { return L.property("ADBE Effect Parade").addProperty(m); }
  function sc(L, x, y) { var v = L.scale.value, r = []; for (var i = 0; i < v.length; i++) r.push(v[i]); r[0] = x; r[1] = y; return r; }
  function lerp(a, b, k) { if (a instanceof Array) { var r = []; for (var i = 0; i < a.length; i++) r.push(a[i] + (b[i] - a[i]) * k); return r; } return a + (b - a) * k; }
  function eases(prop, inf) { var sp = prop.propertyValueType === PropertyValueType.TwoD_SPATIAL || prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL;
    var d = 1, a = []; if (!sp && prop.value instanceof Array) d = prop.value.length; for (var n = 0; n < d; n++) a.push(new KeyframeEase(0, inf)); return a; }
  // the keynote land: fast out, one small overshoot (back, s about 1.3), an immediate settle. Three keys: start, overshoot peak, rest.
  function back(prop, t0, t1, v0, v1, os) { if (os === undefined) os = .08; var tm = t0 + .6 * (t1 - t0);
    prop.setValuesAtTimes([t0, tm, t1], [v0, lerp(v0, v1, 1 + os), v1]); var B = KeyframeInterpolationType.BEZIER;
    var k0 = prop.nearestKeyIndex(t0), km = prop.nearestKeyIndex(tm), k1 = prop.nearestKeyIndex(t1);
    prop.setInterpolationTypeAtKey(k0, B, B); prop.setTemporalEaseAtKey(k0, prop.keyInTemporalEase(k0), eases(prop, 16));
    prop.setInterpolationTypeAtKey(km, B, B); prop.setTemporalEaseAtKey(km, eases(prop, 50), eases(prop, 40));
    prop.setInterpolationTypeAtKey(k1, B, B); prop.setTemporalEaseAtKey(k1, eases(prop, 70), prop.keyOutTemporalEase(k1)); return prop; }
  function go(prop, t0, t1, v0, v1, mode) { return AESLib.ease(prop, [t0, t1], [v0, v1], mode || "travel"); }
  // --- shapes ---------------------------------------------------------------------------------------------------------------
  function rrShape(x, y, w, h, r) { var k = .5523 * r, s = new Shape();
    s.vertices = [[x + r, y], [x + w - r, y], [x + w, y + r], [x + w, y + h - r], [x + w - r, y + h], [x + r, y + h], [x, y + h - r], [x, y + r]];
    s.inTangents = [[-k, 0], [0, 0], [0, -k], [0, 0], [k, 0], [0, 0], [0, k], [0, 0]];
    s.outTangents = [[0, 0], [k, 0], [0, 0], [0, k], [0, 0], [-k, 0], [0, 0], [0, -k]]; s.closed = true; return s; }
  function ellShape(cx, cy, rx, ry) { var kx = .5523 * rx, ky = .5523 * ry, s = new Shape();
    s.vertices = [[cx, cy - ry], [cx + rx, cy], [cx, cy + ry], [cx - rx, cy]];
    s.inTangents = [[-kx, 0], [0, -ky], [kx, 0], [0, ky]]; s.outTangents = [[kx, 0], [0, ky], [-kx, 0], [0, -ky]]; s.closed = true; return s; }
  // flat pieces in one shape layer whose origin sits at pos; items are drawn in order (later on top), in the layer's own space.
  // item = { ell: bool, x, y, w, h (top-left and size), r (corner), fill, op (fill opacity), stroke, sw, sop }
  function draw(comp, name, items, pos) { var L = comp.layers.addShape(); L.name = name; var root = L.property("ADBE Root Vectors Group");
    for (var i = items.length - 1; i >= 0; i--) { var it = items[i], v = root.addProperty("ADBE Vector Group").property("ADBE Vectors Group");
      var s = v.addProperty(it.ell ? "ADBE Vector Shape - Ellipse" : "ADBE Vector Shape - Rect");
      s.property(it.ell ? "ADBE Vector Ellipse Size" : "ADBE Vector Rect Size").setValue([it.w, it.h]);
      s.property(it.ell ? "ADBE Vector Ellipse Position" : "ADBE Vector Rect Position").setValue([it.x + it.w / 2, it.y + it.h / 2]);
      if (!it.ell && it.r) s.property("ADBE Vector Rect Roundness").setValue(it.r);
      if (it.stroke) { var st = v.addProperty("ADBE Vector Graphic - Stroke"); st.property("ADBE Vector Stroke Color").setValue(it.stroke);
        st.property("ADBE Vector Stroke Width").setValue(it.sw || 1.5); st.property("ADBE Vector Stroke Opacity").setValue(it.sop === undefined ? 100 : it.sop); }
      if (it.fill) { var f = v.addProperty("ADBE Vector Graphic - Fill"); f.property("ADBE Vector Fill Color").setValue(it.fill);
        if (it.op !== undefined) f.property("ADBE Vector Fill Opacity").setValue(it.op); } }
    L.anchorPoint.setValue([0, 0]); L.position.setValue(pos); return L; }
  function blur(L, amt) { var b = fx(L, "ADBE Gaussian Blur 2"); b.property("Blurriness").setValue(amt); try { b.property("Repeat Edge Pixels").setValue(0); } catch (e) {} return b; }
  // the accent's own glow (colour channels: on alpha the whole frame would bloom)
  function glow(L, radius, intensity) { var g = fx(L, "ADBE Glo2"); g.property("Glow Based On").setValue(2); g.property("Glow Threshold").setValue(35);
    g.property("Glow Radius").setValue(radius || 30); g.property("Glow Intensity").setValue(intensity || .8); return g; }
  // a soft shadow under a raised surface: the surface's own shape, black, blurred and dropped
  function shadow(comp, name, w, h, r, pos) { var S = draw(comp, name, [{ x: -w / 2, y: -h / 2, w: w, h: h, r: r, fill: PALETTE.black, op: 70 }], [pos[0], pos[1] + 30]); blur(S, 60); return S; }
  // a raised surface: one of three dark steps, a 1 px light border, a 1 px inner top highlight
  function surfaceItems(w, h, r, fill) { return [{ x: -w / 2, y: -h / 2, w: w, h: h, r: r, fill: fill, stroke: PALETTE.white, sw: 1.5, sop: 9 },
    { x: -w / 2 + r, y: -h / 2 + 1, w: w - 2 * r, h: 1.5, fill: PALETTE.white, op: 14 }]; }
  // --- type -------------------------------------------------------------------------------------------------------------------
  function face(o) { if (o.mono) return MONO; return SANS; }
  function measure(comp, str, o) { var L = AESLib.text(comp, "KEYNOTE_PROBE", str, { family: face(o), style: o.style, size: o.size, color: [1, 1, 1], just: "left", tracking: o.tracking || 0 });
    var r = L.sourceRectAtTime(0, false); L.remove(); return r; }                            // a fresh probe per measurement (re-used probes return stale rects)
  // one text layer on a baseline: o = { mono, style, size, color, x, y, align ("left"|"center"), tracking, t0, t1 }
  function txt(comp, name, str, o) { var L = AESLib.text(comp, name, str, { family: face(o), style: o.style, size: o.size, color: o.color || PALETTE.text, just: "left", tracking: o.tracking || 0 });
    var r = L.sourceRectAtTime(0, false), ax = r.left; if (o.align === "center") ax = r.left + r.width / 2;
    L.anchorPoint.setValue([ax, 0]); L.position.setValue([o.x, o.y]); if (o.t0 !== undefined) L.inPoint = o.t0; if (o.t1 !== undefined) L.outPoint = o.t1; return L; }
  function inkW(L) { return L.sourceRectAtTime(0, false).width; }
  // typed text: one layer, its prefixes keyed in ONE textKeys call; times[i] shows strs[i]
  function typed(comp, name, full, times, strs, o) { var L = txt(comp, name, full, o); AESLib.textKeys(L, times, strs); return L; }
  // a string typed across [t0, t1], one character per step: returns { times, strs }
  function typeOut(str, t0, t1, base) { var r = { times: [], strs: [] }, n = str.length; base = base || "";
    for (var i = 1; i <= n; i++) { r.times.push(t0 + (t1 - t0) * (i - 1) / Math.max(1, n - 1)); r.strs.push(base + str.substr(0, i)); } return r; }
  // a blinking caret: a lime bar with its own glow; it blinks whenever no position key is near (the metronome), solid while typing
  function caret(comp, name, x, y, h, t0, t1) { var C = draw(comp, name, [{ x: -4, y: -h * .8, w: 8, h: h, r: 2, fill: PALETTE.accent }], [x, y]); glow(C, 26, .9);
    C.opacity.expression = "var n = 0; if (position.numKeys > 0) n = Math.abs(position.nearestKey(time).time - time);\n" +
      "var idle = position.numKeys === 0 || n > .3; var v = 100; if (idle && Math.floor(time * 2.2) % 2 === 1) v = 0; v";
    C.inPoint = t0; C.outPoint = t1; return C; }
  // --- the light reveal -----------------------------------------------------------------------------------------------------
  // a soft front sweeps x0 -> x1 across the layer between t0 and t1: only what it has passed is lit. Under it a copy sits at a few percent
  // (unlit), and a soft light band (add, under 20%) travels with the front. box = [x0, y0, x1, y1] in comp space; the layer must be at rest.
  function reveal(comp, name, L, box, t0, t1, o) { o = o || {}; var F = o.feather || 150, ap = L.anchorPoint.value, ps = L.position.value;
    var dx = ap[0] - ps[0], dy = ap[1] - ps[1], lx0 = box[0] + dx, ly0 = box[1] + dy - 60, lx1 = box[2] + dx, ly1 = box[3] + dy + 60;
    var dim = L.duplicate(); dim.name = L.name + "_DIM"; dim.moveAfter(L); dim.opacity.setValue(o.dim || 7);
    var mp = L.property("ADBE Mask Parade"), had = mp.numProperties, m = mp.addProperty("ADBE Mask Atom"); if (had) m.maskMode = MaskMode.INTERSECT;
    m.property("ADBE Mask Feather").setValue([F, 0]);
    function box2(e) { var s = new Shape(); s.vertices = [[lx0 - 2 * F, ly0], [e, ly0], [e, ly1], [lx0 - 2 * F, ly1]]; s.closed = true; return s; }
    var ms = m.property("ADBE Mask Shape"); AESLib.ease(ms, [t0, t1], [box2(lx0 - F), box2(lx1 + F)], "travel");
    var band = null;
    if (o.band !== false) { var bh = box[3] - box[1] + 160; band = draw(comp, name + "_LIGHT", [{ x: -70, y: -bh / 2, w: 140, h: bh, fill: PALETTE.white }], [box[0] - F, (box[1] + box[3]) / 2]);
      blur(band, 70); band.blendingMode = BlendingMode.ADD; band.opacity.setValue(o.light || 12); go(band.position, t0, t1, [box[0] - F, (box[1] + box[3]) / 2], [box[2] + F, (box[1] + box[3]) / 2]);
      band.inPoint = t0; band.outPoint = t1; }
    return { dim: dim, band: band }; }
  // --- groups, windows, transitions ------------------------------------------------------------------------------------------
  // a group null whose anchor sits at (x, y): children keep their comp coordinates (parented at rest), and scale works about that point
  function grp(comp, name, x, y, layers) { var N = comp.layers.addNull(); N.name = name; N.anchorPoint.setValue([x, y]); N.position.setValue([x, y]);
    for (var i = 0; i < layers.length; i++) if (layers[i]) layers[i].parent = N; return N; }
  // CRT-off: the real surface squashes to a hairline, then to a point, landing at t
  function off(N, t) { var s = N.scale.valueAtTime(t - .2, false); AESLib.ease(N.scale, [t - .2, t - .09], [sc(N, s[0], s[1]), sc(N, s[0] * 1.03, 1.2)], "exit");
    AESLib.ease(N.scale, [t - .09, t], [sc(N, s[0] * 1.03, 1.2), sc(N, 0, 0)], "exit"); return N; }
  // CRT-on, the reverse: a point opens to a hairline, then to the full surface with one small overshoot, landing at t
  function on(N, t) { N.scale.setValueAtTime(t - .22, sc(N, 0, 1.2)); AESLib.ease(N.scale, [t - .22, t - .12], [sc(N, 0, 1.2), sc(N, 100, 1.2)], "travel");
    back(N.scale, t - .12, t, sc(N, 100, 1.2), sc(N, 100, 100), .05); return N; }
  function setOut(layers, t) { for (var i = 0; i < layers.length; i++) if (layers[i]) layers[i].outPoint = t; }
  function setIn(layers, t) { for (var i = 0; i < layers.length; i++) if (layers[i]) layers[i].inPoint = t; }
  // a raised window centred at (x, y): shadow, surface, title bar (a small glyph and a mono title, never traffic lights)
  function win(comp, name, x, y, w, h, title) { var sh = shadow(comp, name + "_SH", w, h, 26, [x, y]);
    var items = surfaceItems(w, h, 26, PALETTE.s2); items.push({ x: -w / 2, y: -h / 2 + 64, w: w, h: 1, fill: PALETTE.white, op: 8 });
    items.push({ x: -w / 2 + 28, y: -h / 2 + 25, w: 14, h: 14, r: 4, fill: PALETTE.label });
    var S = draw(comp, name, items, [x, y]);
    var T = txt(comp, name + "_T", title, { mono: true, style: "Regular", size: 22, color: PALETTE.secondary, x: x - w / 2 + 58, y: y - h / 2 + 40, tracking: 20 });
    return { sh: sh, S: S, T: T, layers: [sh, S, T], top: y - h / 2 + 64 }; }
  // captions are a UI component: a bottom-centre toast (dark translucent pill, 1 px border, a small accent speaking dot) that rises in
  function toast(comp, name, str, t0, t1) { var W = comp.width, size = 40, r = measure(comp, str, { style: "Medium", size: size }), pw = r.width + 112, ph = 92, x = W / 2, y = 1712;
    var sh = shadow(comp, name + "_SH", pw, ph, 46, [x, y]);
    var items = surfaceItems(pw, ph, 46, PALETTE.s3); items[0].op = 92; items[0].sop = 13;
    var S = draw(comp, name, items, [x, y]);
    var D = draw(comp, name + "_DOT", [{ ell: true, x: -7, y: -7, w: 14, h: 14, fill: PALETTE.accent }], [x - pw / 2 + 44, y]); glow(D, 16, .8);
    var T = txt(comp, name + "_T", str, { style: "Medium", size: size, color: PALETTE.text, x: x - pw / 2 + 70, y: y + 14 });
    var L = [sh, S, D, T], N = grp(comp, name + "_N", x, y, L);
    go(N.position, t0, t0 + .16, [x, y + 22], [x, y], "settle"); go(N.position, t1 - .14, t1, [x, y], [x, y + 14], "exit");
    for (var i = 0; i < L.length; i++) { var full = L[i].opacity.value; go(L[i].opacity, t0, t0 + .16, 0, full, "settle"); go(L[i].opacity, t1 - .14, t1, full, 0, "exit"); }
    setIn(L, t0); setOut(L, t1); N.inPoint = t0; N.outPoint = t1; return N; }
  // the three object cards of the picture beat (UI kit, original, drawn here), in card space centred on 0, 0
  function cardItems(kind, w, h) { var I = surfaceItems(w, h, 22, PALETTE.s3), P = PALETTE;
    if (kind === "person") { I.push({ ell: true, x: -60, y: -126, w: 120, h: 120, fill: P.well }); I.push({ ell: true, x: -23, y: -110, w: 46, h: 46, fill: P.icon });
      I.push({ ell: true, x: -42, y: -56, w: 84, h: 52, fill: P.icon }); I.push({ x: -84, y: 30, w: 168, h: 16, r: 8, fill: P.text, op: 80 });
      I.push({ x: -60, y: 62, w: 120, h: 12, r: 6, fill: P.bar }); I.push({ x: -84, y: 104, w: 52, h: 26, r: 13, fill: P.s1, stroke: P.white, sw: 1, sop: 10 });
      I.push({ x: -24, y: 104, w: 52, h: 26, r: 13, fill: P.s1, stroke: P.white, sw: 1, sop: 10 }); I.push({ x: 36, y: 104, w: 48, h: 26, r: 13, fill: P.s1, stroke: P.white, sw: 1, sop: 10 }); }
    else if (kind === "device") { I.push({ x: -66, y: -138, w: 132, h: 230, r: 24, fill: P.s1, stroke: P.icon, sw: 3, sop: 60 }); I.push({ x: -54, y: -124, w: 108, h: 186, r: 14, fill: P.well });
      for (var g = 0; g < 6; g++) I.push({ x: -44 + (g % 2) * 48, y: -112 + Math.floor(g / 2) * 56, w: 40, h: 46, r: 8, fill: P.bar });
      I.push({ x: -22, y: 76, w: 44, h: 6, r: 3, fill: P.label }); I.push({ x: -84, y: 110, w: 168, h: 14, r: 7, fill: P.bar }); }
    else { I.push({ x: -66, y: -134, w: 132, h: 172, r: 12, fill: P.paper }); for (var l = 0; l < 4; l++) I.push({ x: -46, y: -104 + l * 26, w: l === 3 ? 56 : 92, h: 9, r: 4, fill: P.rule });
      I.push({ x: -46, y: 4, w: 46, h: 20, r: 5, fill: P.code }); I.push({ x: -84, y: 74, w: 168, h: 16, r: 8, fill: P.text, op: 80 }); I.push({ x: -60, y: 106, w: 120, h: 12, r: 6, fill: P.bar }); }
    return I; }
  // the spoken words that start inside [t0, t1)
  function wordsIn(list, t0, t1) { var r = []; for (var i = 0; i < list.length; i++) if (list[i].s >= t0 - .05 && list[i].s < t1) r.push(list[i]); return r; }
  function clearOwned(comp, prefix) { AESLib.clearOwned(comp, prefix); }
  // ---------------------------------------------------------------------------------------------------------------------------
  // buildScene: the shared test scene (the library's seven-beat test scene) as a keynote. comp = an empty 1080 x 1920 comp at scene.fps.
  // One window carries the film: it opens on the picture, holds the real frame, closes CRT-style for the number, returns for the carry
  // and is squashed into the one accent tile the end card stands under.
  function buildScene(comp, scene, opts) {
    fontOK(); var P = opts.prefix || "KEYNOT", PAL = PALETTE, B = scene.beat, W = comp.width, H = comp.height, CX = W / 2, WL = scene.wordList, notes = [], fps = scene.fps;
    clearOwned(comp, P);
    var END = scene.duration;
    // the stage: near-black with a radial lift at the upper centre, one cool glow at single-digit opacity, the hairline grid, a vignette
    var stg = comp.layers.addSolid(PAL.stage, P + "_STAGE", W, H, 1), rp = fx(stg, "ADBE Ramp");
    rp.property("Start of Ramp").setValue([CX, 360]); rp.property("Start Color").setValue(c4(PAL.lift)); rp.property("End of Ramp").setValue([CX, 1500]);
    rp.property("End Color").setValue(c4(PAL.stage)); rp.property("Ramp Shape").setValue(2);
    var cool = draw(comp, P + "_COOL", [{ ell: true, x: -520, y: -520, w: 1040, h: 1040, fill: PAL.cool }], [860, 1320]); cool.opacity.setValue(9); blur(cool, 240);
    var grid = comp.layers.addShape(); grid.name = P + "_GRID"; var gr = grid.property("ADBE Root Vectors Group");
    var x0 = (W - Math.floor(W / MODULE) * MODULE) / 2, LINES = [[MODULE, 4], [4 * MODULE, 8]];
    for (var q = 0; q < LINES.length; q++) for (var dir = 0; dir < 2; dir++) { var step = LINES[q][0], gv = gr.addProperty("ADBE Vector Group").property("ADBE Vectors Group"), pth = new Shape();
      var gx = x0, gy = 0; if (q) gx = x0 + (Math.round((CX - x0) / MODULE) % 4) * MODULE;   // a major line through the centre
      var n = dir ? Math.floor(H / step) + 1 : Math.floor(W / step) + 1;
      if (dir) pth.vertices = [[0, gy], [W, gy]]; else pth.vertices = [[gx, 0], [gx, H]]; pth.closed = false;
      gv.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(pth);
      var gs = gv.addProperty("ADBE Vector Graphic - Stroke"); gs.property("ADBE Vector Stroke Color").setValue(PAL.white); gs.property("ADBE Vector Stroke Width").setValue(1);
      gs.property("ADBE Vector Stroke Opacity").setValue(LINES[q][1]);
      var rep = gv.addProperty("ADBE Vector Filter - Repeater"); rep.property("ADBE Vector Repeater Copies").setValue(n);
      if (dir) rep.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([0, step]);
      else rep.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([step, 0]); }
    grid.anchorPoint.setValue([0, 0]); grid.position.setValue([0, 0]);
    var vig = comp.layers.addSolid(PAL.black, P + "_VIGNETTE", W, H, 1), vm = vig.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
    vm.property("ADBE Mask Shape").setValue(ellShape(CX, H / 2, W * .78, H * .62)); vm.property("ADBE Mask Feather").setValue([620, 620]); vm.inverted = true; vig.opacity.setValue(55);

    // 1. title: a mono label types itself, the headline sits unlit at a few percent until a soft light passes over it, a lime caret blinks
    var tw = wordsIn(WL, B.title.t0, B.title.t1), lab = B.title.context.toUpperCase(), lt = typeOut(lab, tw[0] ? tw[0].s : .05, tw[1] ? tw[1].e : .4);
    var TL = typed(comp, P + "_TLAB", lab, lt.times, lt.strs, { mono: true, style: "Medium", size: 30, color: PAL.secondary, tracking: 300, x: CX - measure(comp, lab, { mono: true, style: "Medium", size: 30, tracking: 300 }).width / 2, y: 760 });
    TL.inPoint = lt.times[0];
    var hero = B.title.hero, hw = hero.split(" "), h1 = hw.slice(0, Math.ceil(hw.length / 2)).join(" "), h2 = hw.slice(Math.ceil(hw.length / 2)).join(" "), hs = 136;
    var HO = { style: "SemiBold", size: hs, color: PAL.text, tracking: -30, align: "center", x: CX };
    HO.y = 940; var H1 = txt(comp, P + "_H1", h1, HO); HO.y = 1096; var H2 = txt(comp, P + "_H2", h2, HO);
    var r1 = reveal(comp, P + "_RV1", H1, [CX - inkW(H1) / 2, 940 - hs, CX + inkW(H1) / 2, 940 + .2 * hs], .36, .84);
    var r2 = reveal(comp, P + "_RV2", H2, [CX - inkW(H2) / 2, 1096 - hs, CX + inkW(H2) / 2, 1096 + .2 * hs], .78, 1.16);
    var TC = caret(comp, P + "_TCARET", CX + inkW(H2) / 2 + 26, 1096 + 8, 118, .9, B.title.t1 + .05);
    var tOut = B.title.t1 + .04, NT = grp(comp, P + "_TITLEG", CX, 960, [TL, H1, r1.dim, H2, r2.dim, TC]); off(NT, tOut);
    setOut([TL, H1, r1.dim, H2, r2.dim, TC], tOut);

    // 2. picture: three object cards pop in out of order on their words; on "one picture" a window opens and they fly into its three slots
    var WX = CX, WY = 960, WW = 936, WH = 716, cw = 256, ch = 340, pw = wordsIn(WL, B.picture.t0, B.picture.t1);
    var w1 = win(comp, P + "_WIN", WX, WY, WW, WH, "one-picture.layout"), ctop = w1.top, ccy = ctop + 320;
    var tOpen = pw[3] ? pw[3].s + .12 : B.picture.t0 + 1.05;                                                // lands just after "one"
    var scatter = [[300, 700, -7], [786, 846, 6], [372, 1236, 4]], cards = [], objs = B.picture.objects;
    for (var j = 0; j < 3; j++) { var tj = B.picture.t0 + .3 * j; if (pw[j]) tj = Math.max(B.picture.t0 + .02, pw[j].s);
      var C = draw(comp, P + "_CARD" + j, cardItems(objs[j], cw, ch), [scatter[j][0], scatter[j][1]]); C.rotation.setValue(scatter[j][2]);
      var CS = shadow(comp, P + "_CARDSH" + j, cw, ch, 22, [0, 0]); CS.parent = C; CS.position.setValue([0, 30]); CS.moveAfter(C);
      back(C.scale, tj, tj + .26, sc(C, 0, 0), sc(C, 100, 100), .1); C.inPoint = tj; CS.inPoint = tj;
      var land = tOpen + .1 + .05 * j, sx = WX + (j - 1) * 284;
      back(C.position, land - .3, land, [scatter[j][0], scatter[j][1]], [sx, ccy], .06); go(C.rotation, land - .3, land, scatter[j][2], 0, "settle");
      cards.push(C, CS); }
    var tPut = B.input.t0 - .06;                                                                             // put away: one card per sixteenth
    for (var k = 0; k < 3; k++) { var Ck = cards[2 * k], tk = tPut + .07 * k; go(Ck.scale, tk, tk + .14, sc(Ck, 100, 100), sc(Ck, 0, 0), "exit"); setOut([Ck, cards[2 * k + 1]], tk + .14); }
    toast(comp, P + "_TOAST1", "Three pieces build one picture.", B.picture.t0 + .12, B.input.t0 - .08);

    // 3. real input: the frame plays inside the same window (the title bar renames itself), revealed by a light sweep
    var src = AESLib.importFile(scene.clip), FT = comp.layers.add(src); FT.name = P + "_FRAME"; FT.audioEnabled = false;
    var crop = [84, 1222, 912, 640];                                                                          // the webcam half of the source frame
    FT.anchorPoint.setValue([crop[0], crop[1]]); FT.position.setValue([WX - crop[2] / 2, ctop]);
    FT.property("ADBE Mask Parade").addProperty("ADBE Mask Atom").property("ADBE Mask Shape").setValue(rrShape(crop[0], crop[1], crop[2], crop[3], 16));
    FT.startTime = B.input.t0 - (B.input.clipStart || 0); FT.inPoint = B.input.t0 + .06;
    var tShow = B.input.t0 + .14, rf = reveal(comp, P + "_RVF", FT, [WX - crop[2] / 2, ctop, WX + crop[2] / 2, ctop + crop[3]], tShow, tShow + .9, { dim: 6, light: 10 });
    rf.dim.inPoint = B.input.t0 + .06;
    AESLib.textKeys(w1.T, [0, B.input.t0], ["one-picture.layout", "clip.mp4  ·  frame 135"]);
    toast(comp, P + "_TOAST2", "Here's a real frame from my video.", B.input.t0 + .1, B.number.t0 - .1);
    var winLayers = w1.layers.concat([FT, rf.dim]), NW = grp(comp, P + "_WING", WX, WY, winLayers);
    NW.scale.setValueAtTime(0, sc(NW, 0, 0)); back(NW.scale, tOpen - .28, tOpen, sc(NW, 0, 0), sc(NW, 100, 100), .04); setIn(w1.layers, tOpen - .28);
    for (var c2 = cards.length - 1; c2 >= 0; c2--) cards[c2].moveToBeginning();                                // cards fly above the window
    off(NW, B.number.t0 + .02);

    // 4. number: its own screen, no caption. Digits scramble in glyph noise and lock one per sixteenth with a small drop, in the accent
    var ns = 420, nb = 1100, val = String(B.number.value), NO = { style: "SemiBold", size: ns, tracking: -45 }, full = measure(comp, val, NO), lx = CX - full.width / 2 - full.left;
    var nt = B.number.t0, sixteenth = .125, numL = [], noiseL = [];
    var halo = draw(comp, P + "_HALO", [{ ell: true, x: -380, y: -260, w: 760, h: 520, fill: PAL.accent }], [CX, nb - .36 * ns]); halo.opacity.setValue(10); blur(halo, 160);
    back(halo.scale, nt, nt + .5, sc(halo, 40, 40), sc(halo, 100, 100), .04); halo.inPoint = nt; numL.push(halo);
    var seed = 7; function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    for (var d = 0; d < val.length; d++) { var pre = measure(comp, val.substr(0, d + 1), NO), dig = measure(comp, val.charAt(d), NO), dcx = lx + pre.left + pre.width - dig.width / 2;
      var lock = nt + .14 + sixteenth * d, noise = txt(comp, P + "_NOISE" + d, "0", { style: "SemiBold", size: ns, color: PAL.label, tracking: -45, align: "center", x: dcx, y: nb });
      var ts = [], ss = []; for (var f = 0; nt - .08 + f * 2 / fps < lock; f++) { ts.push(nt - .08 + f * 2 / fps); ss.push(String(Math.floor(rnd() * 10))); }
      AESLib.textKeys(noise, ts, ss); noise.inPoint = nt - .08; noise.outPoint = lock; noiseL.push(noise);
      var DG = txt(comp, P + "_DIGIT" + d, val.charAt(d), { style: "SemiBold", size: ns, color: PAL.accent, tracking: -45, align: "center", x: dcx, y: nb }); glow(DG, 40, .7);
      back(DG.position, lock, lock + .16, [dcx, nb - 34], [dcx, nb], .12); DG.inPoint = lock; numL.push(noise, DG); }
    var nw = wordsIn(WL, B.number.t0, B.number.t1), nlab = B.number.label.toUpperCase() + "  ·  COUNTED", LO = { mono: true, style: "Medium", size: 30, tracking: 300 };
    var a1 = typeOut(B.number.label.toUpperCase(), nw[1] ? nw[1].s : nt + .7, nw[1] ? nw[1].s + .24 : nt + .94), a2 = typeOut("  ·  COUNTED", nw[2] ? nw[2].s : nt + 1.4, nw[2] ? nw[2].s + .26 : nt + 1.66, B.number.label.toUpperCase());
    var NL = typed(comp, P + "_NLAB", nlab, a1.times.concat(a2.times), a1.strs.concat(a2.strs), { mono: true, style: "Medium", size: 30, color: PAL.secondary, tracking: 300, x: CX - measure(comp, nlab, LO).width / 2, y: nb + 120 });
    NL.inPoint = a1.times[0]; numL.push(NL);
    var NN = grp(comp, P + "_NUMG", CX, nb - .36 * ns, numL); off(NN, B.line.t0 + .02);
    for (var nl = 0; nl < numL.length; nl++) { var isNoise = false; for (var nz = 0; nz < noiseL.length; nz++) if (numL[nl] === noiseL[nz]) isNoise = true; if (!isNoise) numL[nl].outPoint = B.line.t0 + .02; }   // the noise keeps its own lock out point

    // 5. typed line: an editor window opens from a point; the spoken line is typed into it, the caret riding the last character
    var EY = 940, EH = 470, ew = win(comp, P + "_ED", WX, EY, WW, EH, "transcript.txt"), es = 76, ex = 132, ey = ew.top + 116, lead = 98, maxW = 816;
    var LW = wordsIn(WL, B.line.t0, B.carry.t0), EO = { style: "Medium", size: es }, spw = .26 * es, lines = [[]], cx2 = 0;
    for (var w = 0; w < LW.length; w++) { var ww = measure(comp, LW[w].text, EO).width; if (cx2 > 0 && cx2 + ww > maxW) { lines.push([]); cx2 = 0; } lines[lines.length - 1].push(LW[w]); cx2 += ww + spw; }
    var tType0 = B.line.t0 + .2, edL = [], ctT = [], ctP = [];
    for (var li = 0; li < lines.length; li++) { var ln = lines[li], fullLn = "", times = [], strs = [], by = ey + li * lead;
      for (var wi = 0; wi < ln.length; wi++) fullLn += (wi ? " " : "") + ln[wi].text;
      for (var wj = 0; wj < ln.length; wj++) { var ws = Math.max(tType0, ln[wj].s), we = Math.max(ws + .12, ln[wj].e - .04), base = "";
        for (var wk = 0; wk < wj; wk++) base += (wk ? " " : "") + ln[wk].text; if (wj) base += " ";
        var tp = typeOut(ln[wj].text, ws, we, base); times = times.concat(tp.times); strs = strs.concat(tp.strs); }
      var TLn = typed(comp, P + "_LINE" + li, fullLn, times, strs, { style: "Medium", size: es, color: PAL.text, x: ex, y: by }); TLn.inPoint = times[0]; edL.push(TLn);
      for (var tk2 = 0; tk2 < times.length; tk2++) { ctT.push(times[tk2]); ctP.push([ex + measure(comp, strs[tk2], EO).width + 14, by + 8]); } }
    var ECR = caret(comp, P + "_ECARET", ex + 4, ey + 8, 86, B.line.t0, B.carry.t0); ECR.position.setValuesAtTimes(ctT, ctP);
    for (var hk = 1; hk <= ECR.position.numKeys; hk++) ECR.position.setInterpolationTypeAtKey(hk, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD);
    ECR.position.setValueAtTime(B.line.t0, [ex + 4, ey + 8]); ECR.position.setInterpolationTypeAtKey(1, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD);
    var edAll = ew.layers.concat(edL).concat([ECR]), NE = grp(comp, P + "_EDG", WX, EY, edAll);
    on(NE, B.line.t0 + .2); setIn(ew.layers, B.line.t0 - .02); off(NE, B.carry.t0 + .02); setOut(edAll, B.carry.t0 + .02);

    // 6. carry: the frame's window returns (a rhyme), pushes in slowly, then its real surface is squashed into one accent tile
    var tBack = B.carry.t0 + .26, tSquash = B.end.t0 - .1, tile = 96;
    on(NW, tBack); go(NW.scale, tBack, tSquash - .22, sc(NW, 100, 100), sc(NW, 108, 108), "linear");
    go(NW.scale, tSquash - .22, tSquash, sc(NW, 108, 108), sc(NW, tile / WW * 100, tile / WH * 100), "exit");
    setOut(winLayers, tSquash + .02); NW.outPoint = tSquash + .02;
    toast(comp, P + "_TOAST3", "Then one thing becomes the next.", B.carry.t0 + .14, tSquash);

    // 7. end card: one tile left lit in the accent on the empty grid; the end line is revealed by the light, the caret keeps time
    var TY = 768, T = draw(comp, P + "_TILE", [{ x: -tile / 2, y: -tile / 2, w: tile, h: tile, r: 22, fill: PAL.accent }], [WX, WY]); glow(T, 50, 1);
    T.inPoint = tSquash - .03; back(T.scale, tSquash - .03, tSquash + .14, sc(T, 70, 70), sc(T, 100, 100), .12);
    back(T.position, B.end.t0 + .02, B.end.t0 + .32, [WX, WY], [WX, TY], .07);
    var EL = B.end.text, eL = txt(comp, P + "_END", EL, { style: "SemiBold", size: 128, color: PAL.text, tracking: -30, align: "center", x: CX, y: 1010 });
    var ewd = wordsIn(WL, B.end.t0, B.end.t1), re = reveal(comp, P + "_RVE", eL, [CX - inkW(eL) / 2, 1010 - 128, CX + inkW(eL) / 2, 1010 + 26], ewd[0] ? ewd[0].s : B.end.t0 + .05, ewd[2] ? ewd[2].e : B.end.t0 + .85);
    caret(comp, P + "_ENDCARET", CX + inkW(eL) / 2 + 24, 1018, 110, (ewd[2] ? ewd[2].e : B.end.t0 + .85) - .1, END);
    var cl = "SHARED SCENE  ·  DARK KEYNOTE", ca = typeOut(cl, B.end.t0 + 1.0, B.end.t0 + 1.4);
    var CL = typed(comp, P + "_ENDLAB", cl, ca.times, ca.strs, { mono: true, style: "Regular", size: 24, color: PAL.label, tracking: 260, x: CX - measure(comp, cl, { mono: true, style: "Regular", size: 24, tracking: 260 }).width / 2, y: 1112 });
    CL.inPoint = ca.times[0];
    eL.inPoint = B.end.t0 - .04; re.dim.inPoint = B.end.t0 - .04;

    // stacking, top to bottom: everything built, then vignette, grid, cool glow, stage
    vig.moveToEnd(); grid.moveToEnd(); cool.moveToEnd(); stg.moveToEnd();
    return { layers: comp.numLayers, notes: notes };
  }
  return { SANS: SANS, MONO: MONO, PALETTE: PALETTE, MODULE: MODULE, fontOK: fontOK, back: back, go: go, draw: draw, rrShape: rrShape, ellShape: ellShape,
    glow: glow, blur: blur, shadow: shadow, surfaceItems: surfaceItems, txt: txt, typed: typed, typeOut: typeOut, measure: measure, caret: caret, reveal: reveal,
    grp: grp, off: off, on: on, win: win, toast: toast, cardItems: cardItems, wordsIn: wordsIn, clearOwned: clearOwned, buildScene: buildScene };
})();
