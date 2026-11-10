// Halftone dossier style: brand-neutral ES3 helpers. No project mutation happens at load.
// Read styles/halftone-dossier/STYLE.md first. A retro print case file: cream paper, overprinted halftone dots in a few flat inks
// (a real print screen: density field minus a dot screen, pushed through Exposure, used as a luma matte for a flat ink), heavy serif
// headlines that pop in glyph by glyph over a misregistered shadow, caption bars with a highlighted keyword, rubber stamps that slam
// with a shake and a flash, numbered exhibits pinned to a board, and a dot wipe between files.
// Adapted from Lemo-Opuscar's halftone-dossier style (MIT, LemoLab); see library/styles/LICENSE-lemo-opuscar.txt.
var AESDossier = (function () {
  function hex(h) { return [parseInt(h.substr(0, 2), 16) / 255, parseInt(h.substr(2, 2), 16) / 255, parseInt(h.substr(4, 2), 16) / 255]; }
  // a paper ground, one dark ink, four spot inks (overprint shadow, highlight, accent, stamp red). Face is the one local colour.
  var PALETTE = { paper: hex("F1E9D4"), sheet: hex("FBF6EA"), ink: hex("1E2A4A"), over: hex("2D4FC0"), pink: hex("E8508A"),
    yellow: hex("F2C230"), red: hex("D8342C"), face: hex("F3C6A0") };
  var FONTS = { serif: ["Newsreader", "ExtraBold"], display: ["Titan One", "Regular"], mono: ["Space Mono", "Bold"], sans: ["Anton", "Regular"] };
  function fontOK() { for (var k in FONTS) AESLib.font(FONTS[k][0], FONTS[k][1]); return true; }
  function c4(c) { return [c[0], c[1], c[2], 1]; }
  function n3(x) { return Math.round(x * 1000) / 1000; }

  // ---- keys: list = [{ t, v, i, o }]; i / o are an influence (eased, zero speed), "L" linear or "H" hold. One setValuesAtTimes call.
  function easeArr(prop, inf) { var sp = prop.propertyValueType === PropertyValueType.TwoD_SPATIAL || prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL;
    var d = (!sp && prop.propertyValueType !== PropertyValueType.COLOR && prop.value instanceof Array) ? prop.value.length : 1, a = [];
    for (var n = 0; n < d; n++) a.push(new KeyframeEase(0, inf)); return a; }
  function kt(x) { if (x === "H") return KeyframeInterpolationType.HOLD; if (typeof x === "number") return KeyframeInterpolationType.BEZIER; return KeyframeInterpolationType.LINEAR; }
  function keys(prop, list) { var ts = [], vs = [], B = KeyframeInterpolationType.BEZIER;
    for (var j = 0; j < list.length; j++) { ts.push(list[j].t); vs.push(list[j].v); } prop.setValuesAtTimes(ts, vs);
    for (var k = 0; k < list.length; k++) { var ki = prop.nearestKeyIndex(list[k].t), a = list[k].i, b = list[k].o;
      prop.setInterpolationTypeAtKey(ki, B, B); prop.setTemporalEaseAtKey(ki, easeArr(prop, typeof a === "number" ? a : 33.3), easeArr(prop, typeof b === "number" ? b : 33.3));
      prop.setInterpolationTypeAtKey(ki, kt(a), kt(b)); }
    return prop; }
  function over(v0, v1, k) { if (!(v1 instanceof Array)) return v1 + (v1 - v0) * k; var r = []; for (var i = 0; i < v1.length; i++) r.push(v1[i] + (v1[i] - v0[i]) * k); return r; }
  // everything enters with overshoot (a back ease): v0 -> past v1 -> v1 in dur
  function back(prop, t, dur, v0, v1, k) { return keys(prop, [{ t: t, v: v0, o: 60 }, { t: t + dur * .62, v: over(v0, v1, k === undefined ? .12 : k), i: 45, o: 45 }, { t: t + dur, v: v1, i: 60 }]); }
  // a squash landing that keeps its volume: scale(1 / sq, sq) with a damped bounce
  function squash(prop, t, s) { s = s || 100; return keys(prop, [{ t: t, v: [s, s], o: "L" }, { t: t + .06, v: [s * 1.12, s * .88], i: 40, o: 40 }, { t: t + .14, v: [s * .96, s * 1.04], i: 40, o: 40 }, { t: t + .22, v: [s, s], i: 60 }]); }
  function fx(L, match) { L.property("ADBE Effect Parade").addProperty(match); var EP = L.property("ADBE Effect Parade"); return EP.property(EP.numProperties); }
  function span(L, t0, t1) { L.inPoint = t0; L.outPoint = t1; return L; }            // in before out: setting inPoint after outPoint loses the out point
  function pivot(comp, name, x, y, t0, t1) { var N = comp.layers.addNull(); N.name = name; N.anchorPoint.setValue([x, y]); N.position.setValue([x, y]); return span(N, t0, t1); }
  function own(layers, parent) { for (var i = 0; i < layers.length; i++) if (layers[i]) layers[i].parent = parent; }

  // ---- vector pieces: { k: "rect", x, y, w, h, r } | { k: "ell", x, y, w, h } | { k: "poly", pts, open } | { k: "group", id, pivot, kids },
  // each with fill and / or stroke (+ sw). Flat fills and a heavy ink outline. Later nodes draw on top.
  function emit(contents, nodes) {
    for (var i = nodes.length - 1; i >= 0; i--) { var n = nodes[i], g = contents.addProperty("ADBE Vector Group"); if (n.id) g.name = n.id;
      var tg = g.property("ADBE Vector Transform Group");
      if (n.pivot) { tg.property("ADBE Vector Anchor").setValue(n.pivot); tg.property("ADBE Vector Position").setValue(n.pivot); }
      if (n.rot) tg.property("ADBE Vector Rotation").setValue(n.rot);
      var v = g.property("ADBE Vectors Group");
      if (n.k === "group") { emit(v, n.kids); continue; }
      if (n.k === "rect") { var r = v.addProperty("ADBE Vector Shape - Rect"); r.property("ADBE Vector Rect Size").setValue([n.w, n.h]); r.property("ADBE Vector Rect Position").setValue([n.x, n.y]);
        if (n.r) r.property("ADBE Vector Rect Roundness").setValue(n.r); }
      if (n.k === "ell") { var e = v.addProperty("ADBE Vector Shape - Ellipse"); e.property("ADBE Vector Ellipse Size").setValue([n.w, n.h]); e.property("ADBE Vector Ellipse Position").setValue([n.x, n.y]); }
      if (n.k === "poly") { var s = new Shape(); s.vertices = n.pts; s.closed = !n.open; v.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(s); }
      if (n.stroke) { var st = v.addProperty("ADBE Vector Graphic - Stroke"); st.property("ADBE Vector Stroke Color").setValue(n.stroke); st.property("ADBE Vector Stroke Width").setValue(n.sw || 7);
        st.property("ADBE Vector Stroke Line Join").setValue(2); st.property("ADBE Vector Stroke Line Cap").setValue(2); }
      if (n.fill) v.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(n.fill); } }
  function piece(comp, name, nodes, pos) { var L = comp.layers.addShape(); L.name = name; emit(L.property("ADBE Root Vectors Group"), nodes);
    L.anchorPoint.setValue([0, 0]); L.position.setValue(pos || [0, 0]); return L; }
  function groupT(L, path) { var g = L.property("ADBE Root Vectors Group");
    for (var i = 0; i < path.length; i++) { g = g.property(path[i]); if (i < path.length - 1) g = g.property("ADBE Vectors Group"); }
    return g.property("ADBE Vector Transform Group"); }
  // line boil on characters and props only (never text, dots or captions): small turbulence reseeded at 10 fps
  function boil(L, seed) { var td = fx(L, "ADBE Turbulent Displace"); td.property("Amount").setValue(3); td.property("Size").setValue(26);
    L.property("ADBE Effect Parade").property(L.property("ADBE Effect Parade").numProperties).property("Evolution").expression = "posterizeTime(10); time * 400 + " + (seed || 1) * 53 + ";"; return L; }

  // ---- type. o = { f: "serif" | "display" | "mono" | "sans", size, color, x, y (baseline), align ("left" | "center"), stroke, sw, tracking, leading }
  // The anchor comes from sourceRectAtTime (justification on a new text layer has not been reliable), so x is the ink's left or centre.
  function txt(comp, name, str, o) { var F = FONTS[o.f || "serif"];
    var L = AESLib.text(comp, name, str, { family: F[0], style: F[1], size: o.size, color: o.color, just: "left", tracking: o.tracking, leading: o.leading });
    if (o.stroke) { var sp = L.property("Source Text"), td = sp.value; td.applyStroke = true; td.strokeColor = o.stroke; td.strokeWidth = o.sw || 8; td.strokeOverFill = false; sp.setValue(td); }
    var r = L.sourceRectAtTime(0, false); L.anchorPoint.setValue([o.align === "center" ? r.left + r.width / 2 : r.left, 0]); L.position.setValue([o.x, o.y]);
    return L; }
  function width(L) { return L.sourceRectAtTime(0, false).width; }
  // per-glyph pop: each glyph drops from above and scales in with an overshoot, staggered (an expression selector, so one key-free animator)
  function popChars(L, t, step, dur, drop) { var A = L.property("ADBE Text Properties").property("ADBE Text Animators"); A.addProperty("ADBE Text Animator").name = "POP";
    var an = L.property("ADBE Text Properties").property("ADBE Text Animators").property("POP"), ap = an.property("ADBE Text Animator Properties");
    ap.addProperty("ADBE Text Scale 3D"); ap = L.property("ADBE Text Properties").property("ADBE Text Animators").property("POP").property("ADBE Text Animator Properties");
    ap.property("ADBE Text Scale 3D").setValue([0, 0, 0]); ap.addProperty("ADBE Text Position 3D");
    ap = L.property("ADBE Text Properties").property("ADBE Text Animators").property("POP").property("ADBE Text Animator Properties"); ap.property("ADBE Text Position 3D").setValue([0, -(drop || 60), 0]);
    an = L.property("ADBE Text Properties").property("ADBE Text Animators").property("POP"); an.property("ADBE Text Selectors").addProperty("ADBE Text Expressible Selector");
    an = L.property("ADBE Text Properties").property("ADBE Text Animators").property("POP");
    an.property("ADBE Text Selectors").property(1).property("ADBE Text Expressible Amount").expression =
      "var p = (time - " + n3(t) + " - (textIndex - 1) * " + n3(step) + ") / " + n3(dur || .32) + "; var a = 100;\n" +
      "if (p >= 1) { a = 0; } else if (p > 0) { var s = 1.7, q = p - 1; a = 100 * (1 - (1 + (s + 1) * q * q * q + s * q * q)); }\n" +
      "var v = []; for (var i = 0; i < selectorValue.length; i++) v.push(a); v;";
    L.property("ADBE Text Properties").property("ADBE Text More Options").property("ADBE Text Anchor Point Align").setValue([0, -40]);
    return L; }
  // the keyword of a line in another ink (a range selector over its characters)
  function keyword(L, str, key, color) { var i0 = str.indexOf(key); if (i0 < 0) return L;
    L.property("ADBE Text Properties").property("ADBE Text Animators").addProperty("ADBE Text Animator").name = "KEY";
    var an = L.property("ADBE Text Properties").property("ADBE Text Animators").property("KEY");
    an.property("ADBE Text Animator Properties").addProperty("ADBE Text Fill Color");
    an = L.property("ADBE Text Properties").property("ADBE Text Animators").property("KEY"); an.property("ADBE Text Animator Properties").property("ADBE Text Fill Color").setValue(c4(color));
    an.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
    var sel = L.property("ADBE Text Properties").property("ADBE Text Animators").property("KEY").property("ADBE Text Selectors").property(1);
    sel.property("ADBE Text Percent Start").setValue(100 * i0 / str.length); sel = L.property("ADBE Text Properties").property("ADBE Text Animators").property("KEY").property("ADBE Text Selectors").property(1);
    sel.property("ADBE Text Percent End").setValue(100 * (i0 + key.length) / str.length); return L; }
  // a headline: the ink line over a misregistration shadow (+off/+off in the overprint ink, multiplied), both popping glyph by glyph
  // o = txt options + { t, step, t0, t1, off, shadow (colour), parent }
  function headline(comp, name, str, o) { var out = [], cols = [o.shadow || PALETTE.over, o.color || PALETTE.ink], off = o.off === undefined ? Math.max(5, Math.round(o.size * .05)) : o.off;
    for (var i = 0; i < 2; i++) { var L = txt(comp, name + (i ? "" : "_SH"), str, { f: o.f, size: o.size, color: cols[i], x: o.x + (i ? 0 : off), y: o.y + (i ? 0 : off), align: o.align, stroke: o.stroke, sw: o.sw, tracking: o.tracking });
      if (!i) L.blendingMode = BlendingMode.MULTIPLY;
      popChars(L, o.t, o.step === undefined ? .05 : o.step, o.dur, o.drop); span(L, Math.max(o.t0 === undefined ? o.t : o.t0, 0), o.t1); if (o.parent) L.parent = o.parent; out.push(L); }
    return out; }
  // a caption bar: a dark-ink pill over an overprint-ink offset shadow, paper-coloured text, the keyword in the highlight ink. Pops in.
  function caption(comp, name, str, key, o) { var C = PALETTE, size = o.size || 58;
    var T = txt(comp, name + "_T", str, { f: "sans", size: size, color: C.sheet, x: o.x || comp.width / 2, y: (o.y || 1760) + .36 * size, align: "center", tracking: 10 });
    keyword(T, str, key, C.yellow); var w = width(T) + 76, h = size * 1.6, x = o.x || comp.width / 2, y = o.y || 1760;
    var B = piece(comp, name + "_BAR", [{ k: "rect", x: 10, y: 10, w: w, h: h, r: h / 2, fill: C.over }, { k: "rect", x: 0, y: 0, w: w, h: h, r: h / 2, fill: C.ink }], [x, y]);
    T.moveBefore(B); var N = pivot(comp, name + "_N", x, y, o.t, o.t1); own([B, T], N); span(B, o.t, o.t1); span(T, o.t, o.t1); if (o.parent) N.parent = o.parent;
    back(N.scale, o.t, .32, [0, 0], [100, 100], .1); return { bar: B, text: T, node: N }; }
  // a rubber stamp: double rounded frame and black-weight letters, rough-edged, 93 %, tilted; slams from 2.6x in 0.09 s then a damped bounce
  function stamp(comp, name, str, o, notes) { var C = o.color || PALETTE.red, size = o.size || 170;
    var T = txt(comp, name + "_T", str, { f: "sans", size: size, color: C, x: o.x, y: o.y + .36 * size, align: "center", tracking: 40 }), w = width(T) + size * .7, h = size * 1.42;
    var F = piece(comp, name + "_FRAME", [{ k: "rect", x: 0, y: 0, w: w, h: h, r: 18, stroke: C, sw: 12 }, { k: "rect", x: 0, y: 0, w: w - 34, h: h - 34, r: 10, stroke: C, sw: 5 }], [o.x, o.y]);
    T.moveBefore(F); var N = pivot(comp, name + "_N", o.x, o.y, o.t - .09, o.t1); own([F, T], N); span(F, o.t - .09, o.t1); span(T, o.t - .09, o.t1); if (o.parent) N.parent = o.parent;
    N.rotation.setValue(o.rot === undefined ? -10 : o.rot);
    for (var i = 0; i < 2; i++) { var L = i ? T : F; L.opacity.setValue(93);
      try { var r = fx(L, "ADBE Roughen Edges"); r.property("Border").setValue(4); r.property("Edge Sharpness").setValue(1.2); r.property("Scale").setValue(16); r.property("Complexity").setValue(3); } catch (e) { notes.push("roughen: " + e.toString()); } }
    keys(N.scale, [{ t: o.t - .09, v: [260, 260], o: "L" }, { t: o.t, v: [100, 100], i: "L", o: 40 }, { t: o.t + .06, v: [93, 93], i: 50, o: 50 }, { t: o.t + .13, v: [102, 102], i: 50, o: 50 }, { t: o.t + .2, v: [100, 100], i: 60 }]);
    return { node: N, text: T, frame: F }; }
  // camera shake with quadratic decay, on a camera null's position (vector maths through add / mul, safe in either expression engine)
  function shake(L, ts, amp, dur) { dur = dur || .45;
    L.position.expression = "var t = time - " + n3(ts) + "; if (t > 0 && t < " + dur + ") { seedRandom(Math.floor(time * 30), true); var k = Math.pow(1 - t / " + dur + ", 2); add(value, mul([random(-1, 1), random(-1, 1)], " + amp + " * k)); } else { value; }"; }
  function flash(comp, name, ts, peak) { var L = comp.layers.addSolid([1, 1, 1], name, comp.width, comp.height, 1); span(L, ts, ts + .2);
    keys(L.opacity, [{ t: ts, v: peak === undefined ? 50 : peak, o: "L" }, { t: ts + .18, v: 0, i: "L" }]); return L; }   // capped at 50: a full white flash reads as a dropped frame

  // ---- halftone: one dot layer is a precomp (black, density fields added on top, the dot screen subtracted), then Exposure pushes the
  // difference to a crisp dot, and the precomp is the luma matte for a flat ink solid, multiplied so inks overprint.
  // fields: [{ k: "radial", c: [x, y], r: [[t, radius] ...], peak, op: [[t, opacity] ...] } | { k: "edge", inset, feather, op } |
  //          { k: "linear", a: [x, y], b: [x, y], op } | { k: "sweep", t0, tc, t1, band } (the dot wipe: cover, then uncover, on a diagonal)]
  // o = { screen, ink, t0, t1, fields, clip: function (pc) -> matte layer, parent }
  function opKeys(L, op) { if (!op) return; var l = []; for (var i = 0; i < op.length; i++) l.push({ t: op[i][0], v: op[i][1], i: 50, o: 50 }); if (l.length > 1) keys(L.opacity, l); else L.opacity.setValue(op[0][1]); }
  function ramp(L, a, b, ca, cb, radial) { fx(L, "ADBE Ramp"); var R = L.property("ADBE Effect Parade").property(L.property("ADBE Effect Parade").numProperties);
    R.property("Start of Ramp").setValue(a); R.property("Start Color").setValue(c4(ca)); R.property("End of Ramp").setValue(b); R.property("End Color").setValue(c4(cb));
    R.property("Ramp Shape").setValue(radial ? 2 : 1); return L.property("ADBE Effect Parade").property(L.property("ADBE Effect Parade").numProperties); }
  function field(pc, name, f) { var W = pc.width, H = pc.height, S = pc.layers.addSolid([0, 0, 0], name, W, H, 1); S.blendingMode = BlendingMode.ADD;
    var pk = f.peak === undefined ? 1 : f.peak, white = [pk, pk, pk], black = [0, 0, 0];
    if (f.k === "radial") { var R = ramp(S, f.c, [f.c[0] + f.r[0][1], f.c[1]], white, black, true);
      if (f.r.length > 1) { var l = []; for (var i = 0; i < f.r.length; i++) l.push({ t: f.r[i][0], v: [f.c[0] + Math.max(1, f.r[i][1]), f.c[1]], i: 60, o: 60 });
        keys(S.property("ADBE Effect Parade").property(1).property("End of Ramp"), l); } }
    if (f.k === "linear") ramp(S, f.a, f.b, white, black, false);
    if (f.k === "edge") { S.remove(); S = pc.layers.addSolid(white, name, W, H, 1); S.blendingMode = BlendingMode.ADD;
      var m = S.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"), sh = new Shape(), q = f.inset || 260;
      sh.vertices = [[q, q], [W - q, q], [W - q, H - q], [q, H - q]]; sh.closed = true; m.property("ADBE Mask Shape").setValue(sh);
      m = S.property("ADBE Mask Parade").property(1); m.maskMode = MaskMode.SUBTRACT; S.property("ADBE Mask Parade").property(1).property("ADBE Mask Feather").setValue([f.feather || 360, f.feather || 360]); }
    if (f.k === "sweep") {                                                     // white spreads down the diagonal until it covers, then black does
      var D = (W + H) / Math.SQRT2, band = f.band || 520, u = [Math.SQRT1_2, Math.SQRT1_2], at = function (s) { return [u[0] * s, u[1] * s]; };
      ramp(S, at(-band), at(0), white, black, false); var EP = S.property("ADBE Effect Parade").property(1);
      keys(EP.property("Start of Ramp"), [{ t: f.t0, v: at(-band), o: "L" }, { t: f.tc, v: at(D + 40), i: "L" }]); EP = S.property("ADBE Effect Parade").property(1);
      keys(EP.property("End of Ramp"), [{ t: f.t0, v: at(0), o: "L" }, { t: f.tc, v: at(D + band + 40), i: "L" }]); span(S, f.t0, f.tc);
      var S2 = pc.layers.addSolid([0, 0, 0], name + "_OUT", W, H, 1); S2.blendingMode = BlendingMode.ADD; ramp(S2, at(-band), at(0), black, white, false);
      EP = S2.property("ADBE Effect Parade").property(1); keys(EP.property("Start of Ramp"), [{ t: f.tc, v: at(-band), o: "L" }, { t: f.t1, v: at(D + 40), i: "L" }]);
      EP = S2.property("ADBE Effect Parade").property(1); keys(EP.property("End of Ramp"), [{ t: f.tc, v: at(0), o: "L" }, { t: f.t1, v: at(D + band + 40), i: "L" }]); span(S2, f.tc, f.t1); }
    opKeys(S, f.op); return S; }
  function dots(comp, name, o, notes) { var W = comp.width, H = comp.height, pc = app.project.items.addComp(name, W, H, 1, comp.duration, comp.frameRate);
    pc.layers.addSolid([0, 0, 0], name + "_BLACK", W, H, 1);
    for (var i = 0; i < o.fields.length; i++) field(pc, name + "_F" + i, o.fields[i]);
    var sc = pc.layers.add(AESLib.importFile(o.screen)); sc.name = name + "_SCREEN"; sc.blendingMode = BlendingMode.SUBTRACT;
    if (o.clip) { var m = o.clip(pc), out = pc.layers.addSolid([0, 0, 0], name + "_CLIP", W, H, 1); out.setTrackMatte(m, TrackMatteType.ALPHA_INVERTED); m.enabled = false; }
    var D = comp.layers.add(pc); D.name = name + "_MATTE"; span(D, o.t0, o.t1); fx(D, "ADBE Exposure2"); D.property("ADBE Effect Parade").property(1).property(3).setValue(o.gain || 4.4);
    var ink = comp.layers.addSolid(o.ink, name, W, H, 1); span(ink, o.t0, o.t1); if (!o.cover) ink.blendingMode = BlendingMode.MULTIPLY;   // a wipe covers; every other dot layer overprints
    try { ink.setTrackMatte(D, TrackMatteType.LUMA); } catch (e) { D.moveBefore(ink); ink.trackMatteType = TrackMatteType.LUMA; notes.push("legacy track matte"); }
    D.enabled = false; if (o.parent) D.parent = o.parent; return { ink: ink, matte: D, comp: pc }; }

  // ---- paper: the cream sheet under everything, then mottling, a centre fold, a vignette and dust specks reseeded every 2 frames
  function paper(comp, P) { return span(comp.layers.addSolid(PALETTE.paper, P + "_PAPER", comp.width, comp.height, 1), 0, comp.duration); }
  function paperTexture(comp, P, notes) { var W = comp.width, H = comp.height, out = [];
    var M = comp.layers.addSolid([.5, .5, .5], P + "_MOTTLE", W, H, 1), fm = fx(M, "ADBE Fractal Noise");
    fm.property("Contrast").setValue(120); fm.property("Complexity").setValue(5); fm.property("Scale").setValue(520); M.blendingMode = BlendingMode.OVERLAY; M.opacity.setValue(11); out.push(M);
    var F = piece(comp, P + "_FOLD", [{ k: "rect", x: W / 2, y: H / 2, w: 26, h: H + 40, fill: [.55, .5, .42] }]); F.blendingMode = BlendingMode.MULTIPLY; F.opacity.setValue(16);
    var fb = fx(F, "ADBE Gaussian Blur 2"); fb.property(1).setValue(16); out.push(F);
    var V = comp.layers.addSolid([.62, .52, .38], P + "_VIGNETTE", W, H, 1), vm = V.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"), vs = new Shape(), k = .5523;
    vs.vertices = [[W / 2, -60], [W + 160, H / 2], [W / 2, H + 60], [-160, H / 2]]; vs.inTangents = [[-k * (W / 2 + 160), 0], [0, -k * (H / 2 + 60)], [k * (W / 2 + 160), 0], [0, k * (H / 2 + 60)]];
    vs.outTangents = [[k * (W / 2 + 160), 0], [0, k * (H / 2 + 60)], [-k * (W / 2 + 160), 0], [0, -k * (H / 2 + 60)]]; vs.closed = true; vm.property("ADBE Mask Shape").setValue(vs);
    vm = V.property("ADBE Mask Parade").property(1); vm.maskMode = MaskMode.SUBTRACT; V.property("ADBE Mask Parade").property(1).property("ADBE Mask Feather").setValue([420, 420]);
    V.blendingMode = BlendingMode.MULTIPLY; V.opacity.setValue(16); out.push(V);
    var SP = [[P + "_SPECKS", PALETTE.sheet, BlendingMode.SCREEN, 40, -192, 1], [P + "_INKSPECKS", PALETTE.ink, BlendingMode.NORMAL, 70, -196, 7]];
    for (var i = 0; i < 2; i++) { var S = comp.layers.addSolid([0, 0, 0], SP[i][0], W, H, 1), fn = fx(S, "ADBE Fractal Noise");
      fn.property("Contrast").setValue(600); fn.property("Brightness").setValue(SP[i][4]); fn.property("Scale").setValue(6); fn.property("Complexity").setValue(1);
      S.property("ADBE Effect Parade").property(1).property("Evolution").expression = "posterizeTime(15); time * 900 + " + SP[i][5] * 100 + ";";
      if (i) { var IK = comp.layers.addSolid(PALETTE.ink, P + "_INKSPECKS_INK", W, H, 1); IK.opacity.setValue(SP[i][3]);   // ink specks: the noise is the luma matte of an ink solid
        IK.setTrackMatte(S, TrackMatteType.LUMA); S.enabled = false; out.push(IK, S); continue; }
      S.blendingMode = SP[i][2]; S.opacity.setValue(SP[i][3]); out.push(S); }
    return out; }

  // ---- the HUD: case number and chapter chip top-left, a REC dot and the date top-right (the chip counts the exhibits)
  function hud(comp, P, beats) { var C = PALETTE, out = [], T = comp.duration;
    out.push(span(txt(comp, P + "_HUD_CASE", "CASE No.2026-STY-001", { f: "mono", size: 30, color: C.ink, x: 64, y: 118 }), 0, T));
    var ex = span(txt(comp, P + "_HUD_EX", "EXHIBIT", { f: "mono", size: 28, color: C.yellow, x: 86, y: 182 }), 0, T), ew = width(ex);
    var num = span(txt(comp, P + "_HUD_NUM", "01", { f: "mono", size: 28, color: C.sheet, x: 86 + ew + 18, y: 182 }), 0, T);
    var ts = [], ss = []; for (var i = 0; i < beats.length; i++) { ts.push(beats[i].t0); ss.push((i < 9 ? "0" : "") + (i + 1)); } AESLib.textKeys(num, ts, ss);
    var chip = span(piece(comp, P + "_HUD_CHIP", [{ k: "rect", x: 64 + (ew + 80) / 2, y: 172, w: ew + 80, h: 50, r: 10, fill: C.ink }]), 0, T); ex.moveBefore(chip); num.moveBefore(chip);
    var box = span(piece(comp, P + "_HUD_REC", [{ k: "rect", x: 880, y: 116, w: 260, h: 74, r: 14, stroke: C.ink, sw: 5, fill: C.sheet }, { k: "ell", x: 790, y: 116, w: 24, h: 24, fill: C.red }]), 0, T);
    out.push(span(txt(comp, P + "_HUD_DATE", "2026.10", { f: "mono", size: 34, color: C.ink, x: 912, y: 128, align: "center" }), 0, T));
    var dot = span(piece(comp, P + "_HUD_DOT", [{ k: "ell", x: 790, y: 116, w: 24, h: 24, fill: C.sheet }]), 0, T); dot.opacity.expression = "Math.floor(time * 2) % 2 ? 100 : 0;";
    out.push(ex, num, chip, dot, box); return out; }

  // ---- the exhibits of the proof scene, drawn flat with an ink outline (local origin at the card's centre)
  function personNodes() { var C = PALETTE, o = C.ink;
    return [{ k: "rect", x: 0, y: 128, w: 236, h: 150, r: 70, fill: C.over, stroke: o }, { k: "ell", x: 0, y: -30, w: 176, h: 190, fill: C.face, stroke: o },
      { k: "poly", pts: [[-88, -46], [-80, -112], [-30, -134], [40, -132], [86, -100], [90, -40], [64, -84], [-10, -96], [-60, -78]], fill: o, stroke: o, sw: 6 },
      { k: "ell", x: -50, y: 10, w: 30, h: 16, fill: C.pink }, { k: "ell", x: 50, y: 10, w: 30, h: 16, fill: C.pink },
      { k: "group", id: "EYES", pivot: [0, -22], kids: [{ k: "ell", x: -32, y: -22, w: 26, h: 34, fill: o }, { k: "ell", x: 32, y: -22, w: 26, h: 34, fill: o },
        { k: "ell", x: -27, y: -30, w: 10, h: 10, fill: C.sheet }, { k: "ell", x: 37, y: -30, w: 10, h: 10, fill: C.sheet }, { k: "ell", x: -36, y: -16, w: 5, h: 5, fill: C.sheet }, { k: "ell", x: 28, y: -16, w: 5, h: 5, fill: C.sheet }] },
      { k: "poly", pts: [[-16, 26], [0, 38], [16, 26]], open: true, stroke: o, sw: 6 }]; }
  function documentNodes() { var C = PALETTE, o = C.ink, n = [{ k: "rect", x: 0, y: 10, w: 220, h: 286, r: 6, fill: C.paper, stroke: o }, { k: "rect", x: -34, y: -96, w: 120, h: 24, fill: C.red }];
    for (var i = 0; i < 5; i++) n.push({ k: "rect", x: i === 4 ? -30 : 0, y: -46 + 36 * i, w: i === 4 ? 100 : 160, h: 12, fill: o }); return n; }
  function deviceNodes() { var C = PALETTE, o = C.ink; return [{ k: "rect", x: 0, y: -28, w: 250, h: 170, r: 10, fill: o, stroke: o }, { k: "rect", x: 0, y: -30, w: 214, h: 134, r: 4, fill: C.sheet },
    { k: "rect", x: -30, y: -60, w: 120, h: 16, fill: C.over }, { k: "rect", x: -10, y: -28, w: 160, h: 12, fill: C.over }, { k: "rect", x: -40, y: 0, w: 100, h: 12, fill: C.pink },
    { k: "poly", pts: [[-150, 66], [150, 66], [176, 112], [-176, 112]], fill: C.yellow, stroke: o }]; }
  // a pinned exhibit card: card + subject (boiling) + label + pin, all on one null. Returns { node, layers, pin }
  function exhibit(comp, name, label, subject, o, notes) { var C = PALETTE, N = pivot(comp, name + "_N", o.x, o.y, o.t0, o.t1), w = o.w || 380, h = o.h || 460;
    var card = span(piece(comp, name + "_CARD", [{ k: "rect", x: 0, y: 0, w: w, h: h, r: 10, fill: C.sheet, stroke: C.ink, sw: 7 }], [o.x, o.y]), o.t0, o.t1);
    var sub = span(boil(piece(comp, name + "_SUBJECT", subject, [o.x, o.y + 22]), o.seed), o.t0, o.t1);
    var lab = span(txt(comp, name + "_LABEL", label, { f: "mono", size: 26, color: C.ink, x: o.x - w / 2 + 26, y: o.y - h / 2 + 52 }), o.t0, o.t1);
    var pin = span(piece(comp, name + "_PIN", [{ k: "ell", x: 0, y: 0, w: 34, h: 34, fill: C.red, stroke: C.ink, sw: 5 }, { k: "ell", x: -5, y: -6, w: 9, h: 9, fill: C.sheet }], [o.x, o.y - h / 2 + 4]), o.t0, o.t1);
    own([card, sub, lab, pin], N); N.rotation.setValue(o.rot || 0); return { node: N, card: card, subject: sub, label: lab, pin: pin }; }
  // a manila folder: back panel with a tab, and a front flap hinged at the bottom (closing = scale Y from -100 to 100)
  function folder(comp, name, x, y, t0, t1) { var C = PALETTE, w = 860, h = 640;
    var back = span(piece(comp, name + "_BACK", [{ k: "rect", x: -w / 2 + 130, y: -h / 2 - 34, w: 240, h: 90, r: 14, fill: C.yellow, stroke: C.ink }, { k: "rect", x: 0, y: 0, w: w, h: h, r: 14, fill: C.yellow, stroke: C.ink }], [x, y]), t0, t1);
    var tab = span(txt(comp, name + "_TAB", "CASE 001", { f: "mono", size: 30, color: C.ink, x: x - w / 2 + 130, y: y - h / 2 - 36, align: "center" }), t0, t1);
    var flap = span(piece(comp, name + "_FLAP", [{ k: "rect", x: 0, y: -h * .44, w: w + 8, h: h * .88, r: 14, fill: C.yellow, stroke: C.ink }, { k: "rect", x: 0, y: -h * .5, w: 300, h: 70, r: 8, fill: C.sheet, stroke: C.ink, sw: 5 }], [x, y + h / 2]), t0, t1);
    var fl = span(txt(comp, name + "_FLAPLABEL", "STYLE TEST", { f: "mono", size: 34, color: C.ink, x: x, y: y + h / 2 - h * .5 + 12, align: "center" }), t0, t1); fl.parent = flap;
    return { back: back, tab: tab, flap: flap, label: fl, w: w, h: h }; }
  function wordsIn(list, t0, t1) { var r = []; for (var i = 0; i < list.length; i++) if (list[i].s >= t0 - .05 && list[i].s < t1) r.push(list[i]); return r; }
  function clearOwned(comp, prefix) { AESLib.clearOwned(comp, prefix); }

  // buildScene: the shared test scene (the library's seven-beat test scene) as a case file read out one exhibit at a time.
  // comp = an empty 1080 x 1920 comp at scene.fps. opts.assets: screen45, screen15, wipe (dot screens) and print (the real frame, printed).
  function buildScene(comp, scene, opts) {
    fontOK(); var P = opts.prefix || "DOSS", C = PALETTE, A = opts.assets, B = scene.beat, W = comp.width, H = comp.height, notes = [], WL = scene.wordList, END = comp.duration;
    clearOwned(comp, P);
    function on(beat) { var w = wordsIn(WL, beat.t0, beat.t1), r = []; for (var i = 0; i < w.length; i++) r.push(w[i].s); return r; }
    function cam(id, t0, t1) { return pivot(comp, P + "_CAM_" + id, W / 2, H / 2, t0, t1); }
    paper(comp, P);

    // 1. title: a cobalt halo of dots blooms, a pink overprint swells inside it, the context label and the headline pop in on the voice,
    // and the file is stamped OPEN on "way".
    var T0 = B.title.t0, T1 = B.title.t1, tw = on(B.title), c1 = cam("TITLE", T0, T1);
    dots(comp, P + "_DOT_TITLE", { screen: A.screen45, ink: C.over, t0: T0, t1: T1, parent: c1, fields: [{ k: "radial", c: [700, 1230], r: [[T0, 1], [T0 + .7, 760]] }] }, notes);
    dots(comp, P + "_DOT_TITLE2", { screen: A.screen15, ink: C.pink, t0: T0, t1: T1, parent: c1, fields: [{ k: "radial", c: [760, 1300], peak: .85, r: [[T0 + .25, 1], [T0 + .95, 420]] }] }, notes);
    var lab1 = span(popChars(txt(comp, P + "_TITLE_CTX", B.title.context.toUpperCase(), { f: "mono", size: 46, color: C.pink, x: 72, y: 560 }), tw[0], .025, .3, 30), T0, T1);
    var hw = B.title.hero.split(" "), h1 = headline(comp, P + "_TITLE_H1", hw.slice(0, hw.length - 2).join(" "), { size: 176, x: 66, y: 760, t: tw[2], t0: T0, t1: T1 });
    var h2 = headline(comp, P + "_TITLE_H2", hw.slice(hw.length - 2).join(" ") + ".", { size: 176, x: 66, y: 950, t: tw[4], t0: T0, t1: T1 });
    var st1 = stamp(comp, P + "_TITLE_STAMP", "OPEN", { x: 780, y: 1360, t: tw[5] + .02, t1: T1, size: 150, rot: -11 }, notes);
    own([lab1].concat(h1, h2, [st1.node]), c1); shake(c1, tw[5] + .02, 12); flash(comp, P + "_TITLE_FLASH", tw[5] + .02, 40);

    // 2. picture: three numbered exhibits rise onto the board on "Three", "pieces", "build", each with its own halo of dots;
    // red string links the pins on "one picture" and the board shudders.
    var P0 = B.picture.t0, P1 = B.picture.t1, pw = on(B.picture), c2 = cam("PICTURE", P0, P1);
    var spots = [{ x: 300, y: 820, rot: -5 }, { x: 790, y: 1000, rot: 4 }, { x: 350, y: 1400, rot: -3 }], lands = [pw[0] + .02, pw[1], pw[2]];
    var fl2 = []; for (var s = 0; s < 3; s++) fl2.push({ k: "radial", c: [spots[s].x, spots[s].y], peak: .95, r: [[lands[s], 1], [lands[s] + .5, 360]] });
    dots(comp, P + "_DOT_PIC", { screen: A.screen45, ink: C.over, t0: P0, t1: P1, parent: c2, fields: fl2 }, notes);
    var subj = [personNodes(), documentNodes(), deviceNodes()], labs = ["EXHIBIT A", "EXHIBIT B", "EXHIBIT C"], cards = [];
    for (var e = 0; e < 3; e++) { var X = exhibit(comp, P + "_EX" + e, labs[e], subj[e], { x: spots[e].x, y: spots[e].y, rot: spots[e].rot, t0: P0, t1: P1, seed: e + 2 }, notes);
      back(X.node.position, lands[e] - .02, .4, [spots[e].x, spots[e].y + 1300], [spots[e].x, spots[e].y], .06); squash(X.node.scale, lands[e] + .38); X.node.parent = c2; cards.push(X); }
    var ey = groupT(cards[0].subject, ["EYES"]).property("ADBE Vector Scale"), bt = pw[3] + .1;
    keys(ey, [{ t: bt, v: [100, 100], o: "L" }, { t: bt + .06, v: [100, 8], i: "L", o: "L" }, { t: bt + .14, v: [100, 100], i: "L" }]);
    var pins = []; for (var p = 0; p < 3; p++) { var pr = spots[p], th = pr.rot * Math.PI / 180; pins.push([pr.x + 230 * Math.sin(th), pr.y - 226 * Math.cos(th)]); }
    // the string: a new shape layer sits at the comp centre, so zero its anchor and position before drawing in comp coordinates
    var STR = comp.layers.addShape(); STR.name = P + "_PIC_STRING"; STR.anchorPoint.setValue([0, 0]); STR.position.setValue([0, 0]); var sv = STR.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").property("ADBE Vectors Group");
    var spth = new Shape(); spth.vertices = [pins[0], pins[1], pins[2]]; spth.inTangents = [[0, 0], [-80, -60], [80, -40]]; spth.outTangents = [[90, 40], [-120, 60], [0, 0]]; spth.closed = false;
    sv.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(spth); sv.addProperty("ADBE Vector Filter - Trim");
    sv = STR.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group"); var stk = sv.addProperty("ADBE Vector Graphic - Stroke");
    stk.property("ADBE Vector Stroke Color").setValue(C.red); stk.property("ADBE Vector Stroke Width").setValue(6);
    keys(STR.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property(2).property("ADBE Vector Trim End"), [{ t: pw[3], v: 0, o: 40 }, { t: pw[4] + .1, v: 100, i: 70 }]);
    span(STR, P0, P1); STR.parent = c2; for (var pp = 0; pp < 3; pp++) cards[pp].pin.moveBefore(STR);
    var h3 = headline(comp, P + "_PIC_H", "Exhibits", { size: 150, x: 66, y: 470, t: pw[0], t0: P0, t1: P1 });
    var lab2 = span(popChars(txt(comp, P + "_PIC_CTX", "THREE PIECES", { f: "mono", size: 40, color: C.pink, x: 72, y: 300 }), pw[0], .025, .3, 30), P0, P1);
    own(h3.concat([lab2]), c2); caption(comp, P + "_PIC_CAP", "Three pieces build one picture.", "picture", { t: pw[0] + .15, t1: P1, parent: c2 }); shake(c2, pw[4], 6, .35);

    // 3. input: the mugshot. A height chart, a halo of dots, the real frame printed in two inks on a photo card, a flash on "real",
    // the name plate on "my", and a slow push-in.
    var I0 = B.input.t0, I1 = B.input.t1, iw = on(B.input), c3 = cam("INPUT", I0, I1);
    keys(c3.scale, [{ t: I0, v: [100, 100], o: 30 }, { t: I1, v: [106, 106], i: 30 }]);
    var lines = []; for (var li = 0; li < 8; li++) lines.push({ k: "rect", x: 540, y: 560 + 150 * li, w: 820, h: 4, fill: C.ink });
    var chart = span(piece(comp, P + "_IN_CHART", lines), I0, I1); chart.opacity.setValue(55);
    var nums = []; for (var ln = 0; ln < 8; ln++) nums.push(String(200 - 20 * ln));
    var cl = span(txt(comp, P + "_IN_CM_L", nums.join("\r"), { f: "mono", size: 30, color: C.ink, x: 40, y: 572, leading: 150 }), I0, I1);
    var cr = span(txt(comp, P + "_IN_CM_R", nums.join("\r"), { f: "mono", size: 30, color: C.ink, x: 975, y: 572, leading: 150 }), I0, I1);
    dots(comp, P + "_DOT_IN", { screen: A.screen45, ink: C.over, t0: I0, t1: I1, parent: c3, fields: [{ k: "radial", c: [540, 1010], peak: 1, r: [[I0, 1], [I0 + .45, 640]] }] }, notes);
    var ph = pivot(comp, P + "_IN_PHOTO_N", 540, 1010, I0, I1); ph.rotation.setValue(-2);
    var card3 = span(piece(comp, P + "_IN_CARD", [{ k: "rect", x: 0, y: 0, w: 660, h: 790, r: 6, fill: C.sheet, stroke: C.ink, sw: 7 }], [540, 1010]), I0, I1);
    var prt = comp.layers.add(AESLib.importFile(A.print)); prt.name = P + "_IN_PRINT"; span(prt, I0, I1); prt.blendingMode = BlendingMode.MULTIPLY; prt.position.setValue([540, 1010]);
    own([card3, prt], ph); back(ph.scale, I0, .36, [0, 0], [100, 100], .08); ph.parent = c3;
    var plate = pivot(comp, P + "_IN_PLATE_N", 540, 1470, I0, I1);
    var plB = span(piece(comp, P + "_IN_PLATE", [{ k: "rect", x: 10, y: 10, w: 560, h: 150, r: 14, fill: C.over }, { k: "rect", x: 0, y: 0, w: 560, h: 150, r: 14, fill: C.ink }], [540, 1470]), I0, I1);
    var plT = span(txt(comp, P + "_IN_PLATE_T", "FRAME 135", { f: "display", size: 66, color: C.sheet, x: 540, y: 1470 }, notes), I0, I1);
    var pr0 = plT.sourceRectAtTime(0, false); plT.anchorPoint.setValue([pr0.left + pr0.width / 2, pr0.top + pr0.height / 2]); plT.position.setValue([540, 1452]);
    var plS = span(txt(comp, P + "_IN_PLATE_S", "SOURCE: MY VIDEO", { f: "mono", size: 28, color: C.yellow, x: 540, y: 1524, align: "center" }), I0, I1);
    own([plB, plT, plS], plate); plate.rotation.setValue(2); back(plate.position, iw[5] - .05, .34, [540, 2300], [540, 1470], .06); plate.parent = c3;
    var h4 = headline(comp, P + "_IN_H", "A real frame", { size: 140, x: 66, y: 420, t: iw[2], t0: I0, t1: I1 });
    own([chart, cl, cr].concat(h4), c3); flash(comp, P + "_IN_FLASH", iw[2], 50);
    caption(comp, P + "_IN_CAP", "Here's a real frame from my video.", "frame", { t: I0 + .1, t1: I1, y: 1730, size: 52 });

    // 4. number: the giant numeral, yellow with a darker halftone inside it (lit from above), counts up on twos over a cobalt shadow;
    // dots crowd the edges as the tension rises; COUNTED slams on "counted" with a shake and a flash.
    var N0 = B.number.t0, N1 = B.number.t1, nw = on(B.number), c4m = cam("NUMBER", N0, N1), val = B.number.value, base = 1150;
    dots(comp, P + "_DOT_EDGE", { screen: A.screen45, ink: C.ink, t0: N0, t1: N1, parent: c4m, fields: [{ k: "edge", inset: 120, feather: 340, op: [[N0, 20], [nw[2], 85]] }] }, notes);
    var counts = [], cn = 10; for (var q = 0; q <= cn; q++) { var ez = 1 - Math.pow(1 - q / cn, 2); counts.push(String(Math.round(100 + (val - 100) * ez))); }
    function numeral(cmp, name, col, dx) { var L = txt(cmp, name, String(val), { f: "display", size: 470, color: col, x: W / 2 + dx, y: base + dx, align: "center", stroke: C.ink, sw: col === C.yellow ? 14 : 0 });
      AESLib.bakeText(L, counts, 15, N0); back(L.scale, N0, .34, [0, 0], [100, 100], .08); return L; }
    var nsh = span(numeral(comp, P + "_NUM_SH", C.over, 16), N0, N1); nsh.blendingMode = BlendingMode.MULTIPLY;
    var nfill = span(numeral(comp, P + "_NUM", C.yellow, 0), N0, N1);
    var nd = dots(comp, P + "_DOT_NUM", { screen: A.screen15, ink: C.pink, t0: N0, t1: N1, parent: c4m, fields: [{ k: "linear", a: [540, 720], b: [540, 1180], peak: .1 }, { k: "linear", a: [540, 1180], b: [540, 720], peak: .75 }],
      clip: function (pc) { return span(numeral(pc, P + "_NUM_CLIP", [1, 1, 1], 0), N0, N1); } }, notes);
    nfill.moveBefore(nsh); nd.ink.moveBefore(nfill); nd.matte.moveBefore(nd.ink);
    var h5 = headline(comp, P + "_NUM_H", "frames,", { size: 160, x: 540, y: 1430, align: "center", t: nw[1], t0: N0, t1: N1 });
    var st4 = stamp(comp, P + "_NUM_STAMP", "COUNTED", { x: 560, y: 1640, t: nw[2], t1: N1, size: 150, rot: -9 }, notes);
    own([nsh, nfill, st4.node].concat(h5), c4m); shake(c4m, nw[2], 20); flash(comp, P + "_NUM_FLASH", nw[2], 50);

    // 5. line: a transcript sheet slides up; the spoken line is printed but redacted, and each bar lifts on its word.
    var L0 = B.line.t0, L1 = B.line.t1, lw = on(B.line), c5 = cam("LINE", L0, L1);
    dots(comp, P + "_DOT_LINE", { screen: A.screen15, ink: C.pink, t0: L0, t1: L1, parent: c5, fields: [{ k: "radial", c: [930, 560], peak: .9, r: [[L0, 1], [L0 + .6, 520]] }] }, notes);
    var sheet = pivot(comp, P + "_LINE_SHEET_N", 540, 1020, L0, L1); sheet.rotation.setValue(-1.5);
    var sx = 120, sy = 560, rows = [];
    var sh5 = span(piece(comp, P + "_LINE_SHEET", [{ k: "rect", x: 540, y: 1020, w: 900, h: 1000, r: 8, fill: C.sheet, stroke: C.ink, sw: 7 }, { k: "rect", x: 300, y: 640, w: 420, h: 16, fill: C.red }]), L0, L1);
    var hd = span(txt(comp, P + "_LINE_HEAD", "TRANSCRIPT / AUDIO 01", { f: "mono", size: 36, color: C.ink, x: sx, y: 610 }), L0, L1);
    var red = [[sx, 760, 600], [sx, 830, 760], [sx, 1250, 520], [sx, 1320, 700], [sx, 1390, 380]], rn = [];
    for (var rr = 0; rr < red.length; rr++) rn.push({ k: "rect", x: red[rr][0] + red[rr][2] / 2, y: red[rr][1], w: red[rr][2], h: 34, fill: C.ink });
    var rbars = span(piece(comp, P + "_LINE_REDACTED", rn), L0, L1);
    var lineRows = ["EVERY WORD I SAY", "GETS TYPED."], rowY = [990, 1110], probe = txt(comp, P + "_LINE_PROBE", "0000000000", { f: "mono", size: 74, color: C.ink, x: 0, y: 0 }), cw = width(probe) / 10; probe.remove();
    var lineL = [], wi = 0; for (var r5 = 0; r5 < 2; r5++) { lineL.push(span(txt(comp, P + "_LINE_T" + r5, lineRows[r5], { f: "mono", size: 74, color: C.ink, x: sx, y: rowY[r5] }), L0, L1));
      var ws = lineRows[r5].split(" "), col = 0;
      for (var w5 = 0; w5 < ws.length; w5++) { var bw = ws[w5].length * cw + 16, bx = sx + col * cw - 8, wt = lw[Math.min(wi, lw.length - 1)];
        var bar = span(piece(comp, P + "_LINE_BAR" + wi, [{ k: "rect", x: bw / 2, y: 0, w: bw, h: 84, fill: C.ink }], [bx, rowY[r5] - 26]), L0, L1);
        keys(bar.scale, [{ t: wt - .02, v: [100, 100], o: "L" }, { t: wt + .1, v: [0, 100], i: 60 }]); rows.push(bar); col += ws[w5].length + 1; wi++; } }
    own([sh5, hd, rbars].concat(lineL, rows), sheet); back(sheet.position, L0, .36, [540, 2900], [540, 1020], .05); sheet.parent = c5;
    var st5 = span(txt(comp, P + "_LINE_FOOT", "TYPED BY THE MACHINE", { f: "mono", size: 30, color: C.red, x: sx, y: 1480 }), L0, L1); st5.parent = sheet;

    // the dot wipe into the next file: a coarse navy screen grows to full cover down the diagonal, the scene switches under it, and it shrinks back
    var WC = L1, wipe = dots(comp, P + "_DOT_WIPE", { screen: A.wipe, ink: C.ink, t0: WC - .24, t1: WC + .26, gain: 5, cover: true, fields: [{ k: "sweep", t0: WC - .24, tc: WC, t1: WC + .26, band: 560 }] }, notes);

    // 6. carry (into 7): the folder is open; the mugshot drops in on "thing", the transcript on "becomes", and the flap closes on "next".
    var C0 = B.carry.t0, C1 = B.carry.t1, cwd = on(B.carry), E0 = B.end.t0, E1 = B.end.t1, ewd = on(B.end), c6 = cam("FILE", C0, END);
    keys(c6.scale, [{ t: E0, v: [100, 100], o: 30 }, { t: E1, v: [104, 104], i: 30 }]);
    dots(comp, P + "_DOT_FILE", { screen: A.screen45, ink: C.over, t0: C0, t1: END, parent: c6, fields: [{ k: "radial", c: [540, 1120], peak: .8, r: [[C0, 300], [C0 + .5, 780]] }] }, notes);
    var fo = folder(comp, P + "_FOLDER", 540, 1120, C0, END);
    var mug = pivot(comp, P + "_FILE_MUG_N", 470, 1080, C0, END), mc = span(piece(comp, P + "_FILE_MUG", [{ k: "rect", x: 0, y: 0, w: 330, h: 395, r: 4, fill: C.sheet, stroke: C.ink, sw: 6 }], [470, 1080]), C0, END);
    var mp = comp.layers.add(AESLib.importFile(A.print)); mp.name = P + "_FILE_PRINT"; span(mp, C0, END); mp.blendingMode = BlendingMode.MULTIPLY; mp.position.setValue([470, 1080]); mp.scale.setValue([50, 50]);
    own([mc, mp], mug); keys(mug.position, [{ t: cwd[2] - .3, v: [470, -400], o: "L" }, { t: cwd[2], v: [470, 1080], i: 70 }]); keys(mug.rotation, [{ t: cwd[2] - .3, v: 14, o: "L" }, { t: cwd[2], v: -4, i: 70 }]); squash(mug.scale, cwd[2]);
    var memo = pivot(comp, P + "_FILE_MEMO_N", 660, 1150, C0, END), mn = [{ k: "rect", x: 0, y: 0, w: 340, h: 420, r: 4, fill: C.sheet, stroke: C.ink, sw: 6 }, { k: "rect", x: -60, y: -150, w: 160, h: 12, fill: C.red }];
    for (var m6 = 0; m6 < 6; m6++) mn.push({ k: "rect", x: m6 % 3 === 2 ? -40 : 0, y: -100 + 46 * m6, w: m6 % 3 === 2 ? 180 : 260, h: 20, fill: C.ink });
    var memoL = span(piece(comp, P + "_FILE_MEMO", mn, [660, 1150]), C0, END); memoL.parent = memo;
    keys(memo.position, [{ t: cwd[3] - .3, v: [660, -400], o: "L" }, { t: cwd[3], v: [660, 1150], i: 70 }]); keys(memo.rotation, [{ t: cwd[3] - .3, v: -12, o: "L" }, { t: cwd[3], v: 5, i: 70 }]); squash(memo.scale, cwd[3]);
    fo.flap.moveBefore(memoL); fo.label.moveBefore(fo.flap);
    keys(fo.label.opacity, [{ t: C0, v: 0, o: "H" }, { t: cwd[5] - .02, v: 100, i: "H", o: "H" }]);   // its mirrored print stays hidden while the flap hangs open
    keys(fo.flap.scale, [{ t: C0, v: [100, -100], o: "H" }, { t: cwd[5] - .18, v: [100, -100], o: 60 }, { t: cwd[5] + .04, v: [100, 104], i: 50, o: 50 }, { t: cwd[5] + .14, v: [100, 100], i: 60 }]);
    own([fo.back, fo.tab, fo.flap, mug, memo], c6); shake(c6, ewd[2], 22);
    caption(comp, P + "_FILE_CAP", "Then one thing becomes the next.", "next", { t: C0 + .1, t1: C1, parent: c6 });
    var lab6 = span(popChars(txt(comp, P + "_FILE_CTX", "FILING", { f: "mono", size: 40, color: C.pink, x: 72, y: 300 }), C0 + .12, .025, .3, 30), C0, C1); lab6.parent = c6;

    // 7. end: "That's the test." pops in, CLOSED slams on the folder on "test", and a pink bloom of dots breaks out behind the stamp.
    dots(comp, P + "_DOT_END", { screen: A.screen15, ink: C.pink, t0: E0, t1: END, parent: c6, fields: [{ k: "radial", c: [540, 1150], peak: .95, r: [[ewd[2], 1], [ewd[2] + .7, 900]] }] }, notes)
      .ink.moveAfter(comp.layer(P + "_FOLDER_BACK"));
        var h7a = headline(comp, P + "_END_H1", "That's", { size: 170, x: 66, y: 470, t: ewd[0], t0: E0, t1: END });
    var h7b = headline(comp, P + "_END_H2", "the test.", { size: 170, x: 66, y: 660, t: ewd[1], t0: E0, t1: END });
    var st7 = stamp(comp, P + "_END_STAMP", "CLOSED", { x: 560, y: 1150, t: ewd[2], t1: END, size: 210, rot: -9 }, notes);
    own(h7a.concat(h7b, [st7.node]), c6); flash(comp, P + "_END_FLASH", ewd[2], 50);
    var lab7 = span(popChars(txt(comp, P + "_END_CTX", "VERDICT", { f: "mono", size: 40, color: C.pink, x: 72, y: 300 }), E0 + .05, .025, .3, 30), E0, END); lab7.parent = c6;

    // the HUD over the pages, the wipe over the HUD, the paper's texture over everything
    var hl = hud(comp, P, scene.beats); for (var hh = 0; hh < hl.length; hh++) hl[hh].moveBefore(wipe.matte);
    paperTexture(comp, P, notes);
    return { layers: comp.numLayers, notes: notes };
  }
  return { PALETTE: PALETTE, FONTS: FONTS, fontOK: fontOK, keys: keys, back: back, squash: squash, piece: piece, groupT: groupT, boil: boil, txt: txt, popChars: popChars,
    keyword: keyword, headline: headline, caption: caption, stamp: stamp, shake: shake, flash: flash, dots: dots, field: field, paper: paper, paperTexture: paperTexture,
    hud: hud, exhibit: exhibit, folder: folder, personNodes: personNodes, documentNodes: documentNodes, deviceNodes: deviceNodes, wordsIn: wordsIn, clearOwned: clearOwned, buildScene: buildScene };
})();
