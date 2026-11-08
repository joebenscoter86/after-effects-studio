// Mid-century cartoon style: brand-neutral ES3 helpers. No project mutation happens at load.
// Read styles/midcentury-toon/STYLE.md first. 1950s flat colour and limited animation for a follow-along film: every drawing is two layers,
// a colour cel printed a few px down-right of its broken warm-ink line (the register re-rolls on twos), geometric people whose bodies hold
// still while only the hands, eyes and mouth move, rooms that are one colour plane with a floor band and a broken horizon, numbered
// medallions, round call-outs with a leader line, detail tags with a star bullet, starbursts, sparkles and sunburst rays. Type is a 1950s
// script kicker (Oleo Script Bold), slab titles and numerals in ink over an offset colour plate (Alfa Slab One) and a geometric sans for
// labels (Jost). Drawings on twos; the camera glides on ones; scenes change by colour-block wipes and irises, never dissolves.
// Adapted from Lemo-Opuscar's midcentury-toon style (MIT, LemoLab); see assets/LICENSE-lemo-opuscar.txt.
var AESMidcenturyToon = (function () {
  var SCRIPT = "Oleo Script", SLAB = "Alfa Slab One", SANS = "Jost";
  function hex(h) { return [parseInt(h.substr(1, 2), 16) / 255, parseInt(h.substr(3, 2), 16) / 255, parseInt(h.substr(5, 2), 16) / 255]; }
  var INK = hex("#2B221D");
  var C = { ink: INK, paper: hex("#F1E6CF"), card: hex("#F6ECD8"), shade: hex("#D9C9A8"), coral: hex("#E2674A"), coralDark: hex("#C24F37"), mustard: hex("#E3B13E"),
    turq: hex("#3E9A94"), blue: hex("#86A8C9"), olive: hex("#9BA653"), pink: hex("#EFB0A4"), navy: hex("#34496A"), skin: hex("#F2C8A6"), hair: hex("#5A3426"),
    plum: hex("#7B4A63"), vignette: hex("#6B4A2E") };
  // one ground per scene: a light tint for the wall, a darker shade for the floor band
  var GROUND = { cream: [C.paper, hex("#EBB9A8")], blue: [hex("#CFDCE6"), hex("#8FAFCD")], mustard: [hex("#F3DDA6"), hex("#E0AE45")], sage: [hex("#DDE1BF"), hex("#A3AE5E")] };
  var TWOS = 12, REG = [6, 5], FLOOR = 1640;
  // the global register: every colour cel (and every colour plate under a slab title) sits REG down-right of its line, re-rolled on twos
  var REGX = "posterizeTime(12); seedRandom(Math.floor(time * 12), true); value + [random(-1.6, 1.6), random(-1.6, 1.6)];";
  function n3(x) { return String(Math.round(x * 1000) / 1000); }
  function fontOK() { AESLib.font(SCRIPT, "Bold"); AESLib.font(SLAB, "Regular"); AESLib.font(SANS, "SemiBold"); return true; }

  // ---- keys: list = [{ t, v, i, o }]; i / o are an influence (eased, zero speed), "L" linear or "H" hold. One setValuesAtTimes call.
  function easeArr(prop, inf) { var sp = prop.propertyValueType === PropertyValueType.TwoD_SPATIAL || prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL;
    var d = 1; if (!sp && prop.propertyValueType !== PropertyValueType.COLOR && prop.propertyValueType !== PropertyValueType.SHAPE && prop.value instanceof Array) d = prop.value.length;
    var a = []; for (var n = 0; n < d; n++) a.push(new KeyframeEase(0, inf)); return a; }
  function kt(x) { if (x === "H") return KeyframeInterpolationType.HOLD; if (typeof x === "number") return KeyframeInterpolationType.BEZIER; return KeyframeInterpolationType.LINEAR; }
  function keys(prop, list) { var ts = [], vs = [], B = KeyframeInterpolationType.BEZIER, clean = [];
    for (var c = 0; c < list.length; c++) if (!clean.length || list[c].t > clean[clean.length - 1].t + .005) clean.push(list[c]);
    for (var j = 0; j < clean.length; j++) { ts.push(clean[j].t); vs.push(clean[j].v); } prop.setValuesAtTimes(ts, vs);
    for (var k = 0; k < clean.length; k++) { var ki = prop.nearestKeyIndex(clean[k].t), a = clean[k].i, b = clean[k].o;
      if (typeof a === "number" || typeof b === "number") { prop.setInterpolationTypeAtKey(ki, B, B);
        prop.setTemporalEaseAtKey(ki, easeArr(prop, typeof a === "number" ? a : 33.3), easeArr(prop, typeof b === "number" ? b : 33.3)); }
      prop.setInterpolationTypeAtKey(ki, kt(a), kt(b));
      if (prop.isSpatial) { try { prop.setSpatialTangentsAtKey(ki, [0, 0], [0, 0]); } catch (e) {} } }
    return prop; }
  function fx(L, match) { L.property("ADBE Effect Parade").addProperty(match); var EP = L.property("ADBE Effect Parade"); return EP.property(EP.numProperties); }
  function span(L, t0, t1) { L.inPoint = t0; L.outPoint = t1; return L; }      // in before out: setting inPoint after outPoint loses the out point
  function spanP(p, t0, t1) { span(p.L, t0, t1); if (p.F) span(p.F, t0, t1); return p; }

  // ---- shapes: { k: "poly"|"line"|"rect"|"ellipse"|"circle"|"star"|"path"|"group"|"union", fill, sw (ink line), csw / cc (a colour ribbon),
  // whole (drawn complete on the line layer: limbs, hands, faces), brk (false: an unbroken line) }
  var KAPPA = .5523;
  function poly(pts, closed) { var s = new Shape(); s.vertices = pts; s.closed = closed !== false; return s; }
  function ell(cx, cy, rx, ry) { var a = KAPPA * rx, b = KAPPA * ry, s = new Shape(); s.vertices = [[cx, cy - ry], [cx + rx, cy], [cx, cy + ry], [cx - rx, cy]];
    s.inTangents = [[-a, 0], [0, -b], [a, 0], [0, b]]; s.outTangents = [[a, 0], [0, b], [-a, 0], [0, -b]]; s.closed = true; return s; }
  function rrect(x, y, w, h, r) { var k = (1 - KAPPA) * r, s = new Shape();
    s.vertices = [[x + r, y], [x + w - r, y], [x + w, y + r], [x + w, y + h - r], [x + w - r, y + h], [x + r, y + h], [x, y + h - r], [x, y + r]];
    s.inTangents = [[-r + k, 0], [0, 0], [0, -r + k], [0, 0], [r - k, 0], [0, 0], [0, r - k], [0, 0]];
    s.outTangents = [[0, 0], [r - k, 0], [0, 0], [0, r - k], [0, 0], [-r + k, 0], [0, 0], [0, -r + k]]; s.closed = true; return s; }
  function smooth(pts, closed, k) { var s = new Shape(), n = pts.length, ti = [], to = []; if (k === undefined) k = .5;
    for (var i = 0; i < n; i++) { var i0 = i - 1, i1 = i + 1;
      if (i0 < 0) { if (closed) i0 = n - 1; else i0 = 0; } if (i1 >= n) { if (closed) i1 = 0; else i1 = n - 1; }
      var d = [(pts[i1][0] - pts[i0][0]) * k / 2, (pts[i1][1] - pts[i0][1]) * k / 2]; ti.push([-d[0], -d[1]]); to.push(d); }
    if (!closed) { ti[0] = [0, 0]; to[n - 1] = [0, 0]; }
    s.vertices = pts; s.inTangents = ti; s.outTangents = to; s.closed = !!closed; return s; }
  function starPts(cx, cy, n, R, r, rot) { var p = [], a0 = (rot || -90) * Math.PI / 180;
    for (var i = 0; i < n * 2; i++) { var rr = R; if (i % 2) rr = r; var a = a0 + i * Math.PI / n; p.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]); } return p; }
  function shapeOf(n) { if (n.k === "circle") return ell(n.x, n.y, n.r, n.r);
    if (n.k === "ellipse") return ell(n.x, n.y, n.rx, n.ry);
    if (n.k === "rect") { if (n.r) return rrect(n.x, n.y, n.w, n.h, n.r); return poly([[n.x, n.y], [n.x + n.w, n.y], [n.x + n.w, n.y + n.h], [n.x, n.y + n.h]]); }
    if (n.k === "star") return poly(starPts(n.x, n.y, n.n, n.R, n.r, n.srot));
    if (n.k === "line") return poly(n.pts, false);
    if (n.k === "path") return n.shape;
    return poly(n.pts); }
  function col(v) { if (v instanceof Array) return v; return [v, v, v]; }
  // what one node puts on a layer: mode "F" (the colour cel), "L" (the line) or "A" (everything, for whole nodes)
  function paints(n, mode) { var isInk = n.fill === INK, p = { fill: false, line: false, ribbon: false };
    if (mode === "A" || n.whole) { p.fill = n.fill !== undefined && n.fill !== null; p.line = !!n.sw; p.ribbon = !!n.csw; if (mode === "F") return { fill: false, line: false, ribbon: false }; return p; }
    if (mode === "F") { p.fill = n.fill !== undefined && n.fill !== null && !isInk; p.ribbon = !!n.csw; return p; }
    p.fill = isInk; p.line = !!n.sw; return p; }
  function emit(contents, nodes, mode, notes) {
    for (var i = nodes.length - 1; i >= 0; i--) { var n = nodes[i], sub = mode;
      if (mode === "F" && n.whole) continue;
      if ((n.k === "group" || n.k === "union") && n.whole) sub = "A";
      if (n.k !== "group") { var pp = paints(n, sub); if (!pp.fill && !pp.line && !pp.ribbon && !n.id) continue; }
      var gr = contents.addProperty("ADBE Vector Group"); if (n.id) gr.name = n.id;
      var tg = gr.property("ADBE Vector Transform Group");
      if (n.pivot) { tg.property("ADBE Vector Anchor").setValue(n.pivot); tg.property("ADBE Vector Position").setValue(n.pivot); }
      if (n.pos) tg.property("ADBE Vector Position").setValue(n.pos);
      if (n.rot) tg.property("ADBE Vector Rotation").setValue(n.rot);
      if (n.sc2) tg.property("ADBE Vector Scale").setValue(n.sc2);
      if (n.op !== undefined) tg.property("ADBE Vector Group Opacity").setValue(n.op);
      var v = gr.property("ADBE Vectors Group");
      if (n.k === "group") { emit(v, n.kids, sub, notes); continue; }
      var p = paints(n, sub);
      if (n.k === "union") { for (var u = 0; u < n.parts.length; u++) v.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(shapeOf(n.parts[u]));
        try { v.addProperty("ADBE Vector Filter - Merge").property("ADBE Vector Merge Type").setValue(2); } catch (eM) { if (notes) notes.push("merge paths: " + eM.toString()); } }
      else v.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(shapeOf(n));
      if (p.ribbon) { var cs = v.addProperty("ADBE Vector Graphic - Stroke"); cs.property("ADBE Vector Stroke Color").setValue(col(n.cc || C.coral));
        cs.property("ADBE Vector Stroke Width").setValue(n.csw); cs.property("ADBE Vector Stroke Line Join").setValue(2); cs.property("ADBE Vector Stroke Line Cap").setValue(2); }
      if (p.line) { var si = v.numProperties + 1, st = v.addProperty("ADBE Vector Graphic - Stroke"); st.property("ADBE Vector Stroke Color").setValue(col(n.sc === undefined ? INK : n.sc));
        st.property("ADBE Vector Stroke Width").setValue(n.sw); st.property("ADBE Vector Stroke Line Join").setValue(2); st.property("ADBE Vector Stroke Line Cap").setValue(2);
        // the broken line: marked here by name, dashed after the layer is drawn (breakLines), so no outline quite closes
        if (sub === "L" && n.brk !== false && n.sw >= 3 && n.k !== "line") { var D = n.brk || 170; v.property(si).name = "BRK" + D + "_" + ((i * 37) % D); } }
      if (p.fill) v.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(col(n.fill)); } }
  // one dash and one gap on every marked stroke (gap = 10 % of the dash). Each handle is re-resolved from the layer root by index, because
  // adding a dash leaves every handle fetched before it stale (AE then says the property "is hidden").
  function breakLines(L) { var found = [];
    var walk = function (pg, path) { for (var k = 1; k <= pg.numProperties; k++) { var q = pg.property(k);
      if (q.name.indexOf("BRK") === 0) { found.push({ p: path.concat([k]), n: q.name }); continue; }
      if (q.propertyType === PropertyType.INDEXED_GROUP || q.propertyType === PropertyType.NAMED_GROUP) walk(q, path.concat([k])); } };
    walk(L.property("ADBE Root Vectors Group"), []);
    var at = function (path) { var q = L.property("ADBE Root Vectors Group"); for (var k = 0; k < path.length; k++) q = q.property(path[k]); return q.property("ADBE Vector Stroke Dashes"); };
    for (var f = 0; f < found.length; f++) { var bits = found[f].n.substr(3).split("_"), D = +bits[0], off = +bits[1];
      try { at(found[f].p).addProperty("ADBE Vector Stroke Dash 1"); at(found[f].p).addProperty("ADBE Vector Stroke Gap 1");
        at(found[f].p).property("ADBE Vector Stroke Dash 1").setValue(D + off % 40); at(found[f].p).property("ADBE Vector Stroke Gap 1").setValue(Math.round(D * .1));
 } catch (eD) { if (NOTES.length < 3) NOTES.push("dash: " + eD.toString()); } }
    return found.length; }
  // a drawing as two layers: the colour cel (F, below, parented to the line and printed REG off it) and the line (L)
  var NOTES = [];
  function piece(comp, name, nodes, pos) { var F = comp.layers.addShape(); F.name = name + "_CEL"; emit(F.property("ADBE Root Vectors Group"), nodes, "F", NOTES); F.anchorPoint.setValue([0, 0]);
    if (F.property("ADBE Root Vectors Group").numProperties === 0) { F.remove(); F = null; }
    var L = comp.layers.addShape(); L.name = name; emit(L.property("ADBE Root Vectors Group"), nodes, "L", NOTES); breakLines(L); L.anchorPoint.setValue([0, 0]); L.position.setValue(pos || [0, 0]);
    if (F) { F.parent = L; F.position.setValue(REG); F.position.expression = REGX; }
    return { L: L, F: F }; }
  function grp(L, path) { var gr = L.property("ADBE Root Vectors Group");
    for (var i = 0; i < path.length; i++) { gr = gr.property(path[i]); if (i < path.length - 1) gr = gr.property("ADBE Vectors Group"); }
    return gr; }
  function groupT(L, path) { return grp(L, path).property("ADBE Vector Transform Group"); }
  // the union outline for a whole drawing (a hand): every part in ink with a thick stroke first, then every part filled on top
  function inked(parts, fill, sw) { var out = [], i;
    for (i = 0; i < parts.length; i++) { var a = {}; for (var k in parts[i]) a[k] = parts[i][k]; a.fill = INK; a.sw = sw; a.sc = INK; out.push(a); }
    for (i = 0; i < parts.length; i++) { var b = {}; for (var m in parts[i]) b[m] = parts[i][m]; if (b.fill === undefined) b.fill = fill; b.sw = 0; out.push(b); }
    return out; }
  // a back-ease pop (about 0.3 s, strong overshoot) and a drop-in stamp (a medallion landing like a rubber stamp)
  function pop(L, t, S) { if (!S) S = 100; keys(L.scale, [{ t: t, v: [0, 0], o: 45 }, { t: t + .14, v: [S * 1.16, S * 1.16], i: 60, o: 60 }, { t: t + .24, v: [S * .95, S * .95], i: 60, o: 60 }, { t: t + .32, v: [S, S], i: 70 }]); return L; }
  function stamp(L, t, S) { if (!S) S = 100; keys(L.scale, [{ t: t - .12, v: [S * 2.4, S * 2.4], o: "L" }, { t: t, v: [S * .9, S * .9], i: "L", o: 60 }, { t: t + .1, v: [S * 1.04, S * 1.04], i: 60, o: 60 }, { t: t + .2, v: [S, S], i: 70 }]); return L; }
  // writes a script on left to right with a growing mask (in its own layer space, so the offset plate gets the same mask)
  function writeOn(L, t0, t1) { var r = L.sourceRectAtTime(t0 + .01, false), m = L.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
    var y0 = r.top - 40, y1 = r.top + r.height + 40, x0 = r.left - 20, x1 = r.left + r.width + 30;
    m = L.property("ADBE Mask Parade").property(1); m.property("ADBE Mask Feather").setValue([14, 0]);
    keys(m.property("ADBE Mask Shape"), [{ t: t0, v: poly([[x0, y0], [x0 + 1, y0], [x0 + 1, y1], [x0, y1]]), o: 30 }, { t: t1, v: poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]), i: 60 }]); }

  // ---- type: o = { family, style, size, color, plate (an offset colour copy under it), pos, just, leading, tracking, t0, t1, maxW }
  function words(comp, name, str, o) { var fam = o.family || SANS, sty = o.style || "SemiBold", size = o.size;
    if (o.maxW) { var T = AESLib.text(comp, name + "_M", str, { family: fam, style: sty, size: size, color: INK, leading: o.leading, tracking: o.tracking }), mw = T.sourceRectAtTime(0, false).width; T.remove(); if (mw > o.maxW) size = Math.floor(size * o.maxW / mw); }
    var P = null, lead = o.leading ? Math.round(o.leading * size / o.size) : undefined;
    if (o.plate) P = AESLib.text(comp, name + "_PLATE", str, { family: fam, style: sty, size: size, color: o.plate, just: o.just, leading: lead, tracking: o.tracking });
    var L = AESLib.text(comp, name, str, { family: fam, style: sty, size: size, color: o.color || INK, just: o.just, leading: lead, tracking: o.tracking });
    var r = L.sourceRectAtTime(0, false), an = [r.left + r.width / 2, r.top + r.height / 2]; if (o.just === "left") an = [r.left, r.top + r.height / 2];
    L.anchorPoint.setValue(an); L.position.setValue(o.pos);
    if (P) { P.anchorPoint.setValue(an); P.parent = L; P.position.setValue([an[0] + (o.reg || 7), an[1] + (o.reg || 7)]); P.position.expression = REGX; }
    span(L, o.t0, o.t1); if (P) span(P, o.t0, o.t1); return { L: L, P: P, r: r, size: size }; }
  function textW(comp, str, fam, sty, size) { var T = AESLib.text(comp, "MIDM_MEASURE", str, { family: fam, style: sty, size: size, color: INK, just: "left" }), r = T.sourceRectAtTime(0, false); T.remove(); return r; }

  // ---- the presenter: a geometric 1950s demonstrator, egg head in three-quarter profile with the nose part of the face outline, a bob with
  // a headband, a coral turtleneck, a mustard belt, navy slacks. The body is one held drawing; only the arms, hands, eyes and mouth animate.
  // Feet on y = 0, about 780 tall at scale 100. Shoulders at SH; arms are paths whose shape follows the hand groups HL / HR.
  var SH = { L: [-50, -548], R: [50, -548] }, REACH = 236;
  function handPose(pose) { var parts;
    if (pose === "point") parts = [{ k: "ellipse", x: 0, y: -22, rx: 17, ry: 19 }, { k: "rect", x: -5, y: -76, w: 12, h: 56, r: 6 }, { k: "ellipse", x: 11, y: -32, rx: 9, ry: 11 },
      { k: "ellipse", x: -15, y: -30, rx: 6, ry: 12 }];
    else parts = [{ k: "ellipse", x: 0, y: -24, rx: 18, ry: 20 }, { k: "rect", x: -17, y: -62, w: 9, h: 34, r: 4.5 }, { k: "rect", x: -6, y: -68, w: 9, h: 38, r: 4.5 },
      { k: "rect", x: 5, y: -64, w: 9, h: 36, r: 4.5 }, { k: "rect", x: 15, y: -54, w: 8, h: 28, r: 4 }, { k: "ellipse", x: -21, y: -24, rx: 6, ry: 12 }];
    var n = inked(parts, C.skin, 7); n.push({ k: "rect", x: -15, y: -8, w: 30, h: 12, r: 4, fill: C.coral, sw: 4 }); return n; }
  function hand(id, x, y, pose) { return { k: "group", id: id, whole: true, pos: [x, y], kids: [{ k: "group", id: "POINT", op: pose === "point" ? 100 : 0, kids: handPose("point") },
    { k: "group", id: "OPEN", op: pose === "point" ? 0 : 100, kids: handPose("open") }] }; }
  function arm(id, sh) { return { k: "path", id: id, whole: true, shape: poly([sh, [sh[0], sh[1] + 200]], false), sw: 30, csw: 19, cc: C.coral, fill: null }; }
  function presenterNodes() { var n = [{ k: "ellipse", x: 8, y: -2, rx: 120, ry: 15, fill: C.shade, op: 70 }];
    n.push(arm("AL", SH.L), hand("HL", -66, -330, "open"));
    n.push({ k: "poly", pts: [[-44, -350], [-4, -350], [-8, -30], [-38, -30]], fill: C.navy, sw: 4 }, { k: "poly", pts: [[6, -350], [46, -350], [40, -30], [10, -30]], fill: C.navy, sw: 4 });
    n.push({ k: "line", pts: [[22, -330], [24, -40]], sw: 2.5 });
    n.push({ k: "ellipse", x: -14, y: -16, rx: 36, ry: 14, fill: INK, sw: 3 }, { k: "ellipse", x: 44, y: -16, rx: 38, ry: 14, fill: INK, sw: 3 });
    n.push({ k: "path", shape: smooth([[-60, -556], [-30, -568], [30, -568], [60, -556], [64, -500], [56, -350], [-56, -350], [-64, -500]], true, .35), fill: C.coral, sw: 4.5, brk: 220 });
    n.push({ k: "poly", pts: [[30, -560], [58, -552], [62, -500], [54, -352], [30, -352]], fill: C.coralDark });
    n.push({ k: "rect", x: -60, y: -372, w: 120, h: 22, r: 5, fill: C.mustard, sw: 3.5 }, { k: "rect", x: -10, y: -376, w: 22, h: 30, r: 3, fill: C.paper, sw: 3, brk: false });
    n.push({ k: "rect", x: -24, y: -606, w: 50, h: 46, r: 12, fill: C.coral, sw: 4, brk: false }, { k: "line", pts: [[-18, -588], [20, -588]], sw: 2.5 }, { k: "line", pts: [[-18, -576], [20, -576]], sw: 2.5 });
    // the head: one open spline from the bridge round the skull, closed at the nose tip
    n.push({ k: "path", shape: smooth([[-6, -778], [40, -764], [60, -728], [64, -700], [98, -676], [62, -662], [62, -642], [46, -614], [12, -602], [-30, -610], [-58, -640], [-68, -686], [-52, -744]], true, .8),
      fill: C.skin, sw: 4.5, brk: 260 });
    n.push({ k: "ellipse", x: -26, y: -680, rx: 10, ry: 15, fill: C.skin, sw: 3.5, brk: false });
    n.push({ k: "path", shape: smooth([[-78, -646], [-80, -712], [-58, -760], [-10, -788], [44, -776], [70, -742], [62, -728], [32, -744], [0, -740], [-28, -726], [-42, -698], [-46, -646]], true, .7),
      fill: C.hair, sw: 4.5, brk: 240 });
    n.push({ k: "path", shape: smooth([[-66, -748], [-20, -780], [38, -770]], false, .9), csw: 11, cc: C.mustard, fill: null });
    n.push({ k: "circle", x: 22, y: -652, r: 11, fill: C.pink });
    n.push({ k: "group", id: "EY", whole: true, pivot: [34, -700], kids: [{ k: "ellipse", x: 34, y: -700, rx: 6, ry: 8, fill: INK }, { k: "line", pts: [[22, -724], [44, -728]], sw: 4.5 }] });
    n.push({ k: "group", id: "SMILE", whole: true, kids: [{ k: "path", shape: smooth([[28, -636], [44, -628], [58, -640]], false, .9), sw: 4.5, fill: null }] });
    n.push({ k: "group", id: "TALK", whole: true, op: 0, kids: [{ k: "ellipse", x: 44, y: -632, rx: 9, ry: 8, fill: INK }] });
    n.push(arm("AR", SH.R), hand("HR", 66, -330, "open"));
    return n; }
  function rigArms(L) { var sides = [["AL", "HL", SH.L, -1], ["AR", "HR", SH.R, 1]];
    for (var i = 0; i < sides.length; i++) { var s = sides[i], a = "[" + s[2][0] + ", " + s[2][1] + "]";
      grp(L, [s[0]]).property("ADBE Vectors Group").property(1).property("ADBE Vector Shape").expression =
        "var a = " + a + "; var b = content(\"" + s[1] + "\").transform.position; var d = sub(b, a); var l = Math.max(length(d), 1);\n" +
        "var nn = [-d[1] / l, d[0] / l]; var m = add(div(add(a, b), 2), mul(nn, l * .1 * " + s[3] + ")); var tg = mul(d, .18);\n" +
        "createPath([a, m, b], [[0, 0], mul(tg, -1), [0, 0]], [[0, 0], tg, [0, 0]], false);";
      groupT(L, [s[1]]).property("ADBE Vector Rotation").expression =
        "var a = " + a + "; var d = sub(thisProperty.propertyGroup(1).position, a); value + radiansToDegrees(Math.atan2(d[1], d[0])) + 90;"; }
    groupT(L, ["EY"]).property("ADBE Vector Scale").expression = "posterizeTime(12); var t = (time + .4) % 3.1; var s = 100; if (t > 2.86 && t < 3) s = 10; [100, s];"; }
  // a hand pointing at a stage point (comp coordinates), at the arm's natural length: standing arms never stretch
  function reachTo(o, side, target) { var sh = SH[side], lx = (target[0] - o.x) / o.s, ly = (target[1] - o.y) / o.s, dx = lx - sh[0], dy = ly - sh[1], l = Math.sqrt(dx * dx + dy * dy);
    return [sh[0] + dx / l * REACH, sh[1] + dy / l * REACH]; }
  // hand actions: anticipation (pull back toward the shoulder), a fast action (0.16 s, eased out) with a small overshoot, a settle on the beat
  function gestures(sh, start, list) { var k = [{ t: 0, v: start, o: "H" }], prev = start;
    for (var i = 0; i < list.length; i++) { var g = list[i], back = [prev[0] + (sh[0] - prev[0]) * .14, prev[1] + (sh[1] - prev[1]) * .14 + 10];
      var over = [g.p[0] + (g.p[0] - sh[0]) * .05, g.p[1] + (g.p[1] - sh[1]) * .05];
      k.push({ t: g.t - .26, v: prev, o: 50 }, { t: g.t - .16, v: back, i: 50, o: 30 }, { t: g.t, v: over, i: 80, o: 50 }, { t: g.t + .12, v: g.p, i: 60, o: "H" }); prev = g.p; }
    return k; }

  // ---- props drawn in the style
  function personIcon() { return [{ k: "path", shape: smooth([[-70, 80], [-60, 30], [-26, 14], [26, 14], [60, 30], [70, 80]], false, .6), fill: C.coral, sw: 5 },
    { k: "rect", x: -16, y: 0, w: 32, h: 24, r: 8, fill: C.coral, sw: 4, brk: false },
    { k: "path", shape: smooth([[-2, -98], [30, -88], [42, -60], [62, -44], [42, -34], [36, -12], [6, 4], [-28, -4], [-44, -36], [-38, -80]], true, .8), fill: C.skin, sw: 5 },
    { k: "path", shape: smooth([[-50, -30], [-52, -76], [-24, -104], [24, -100], [44, -76], [20, -84], [-14, -78], [-30, -50], [-34, -28]], true, .7), fill: C.hair, sw: 5 },
    { k: "ellipse", x: 18, y: -54, rx: 4.5, ry: 6, fill: INK }, { k: "circle", x: 8, y: -28, r: 8, fill: C.pink },
    { k: "path", shape: smooth([[14, -20], [24, -16], [34, -22]], false, .9), sw: 4, fill: null }]; }
  function docIcon() { var n = [{ k: "path", shape: poly([[-64, -86], [34, -86], [66, -54], [66, 86], [-64, 86]]), fill: C.card, sw: 5, brk: 200 }, { k: "path", shape: poly([[34, -86], [34, -54], [66, -54]]), fill: C.shade, sw: 4, brk: false }];
    for (var r = 0; r < 5; r++) n.push({ k: "line", pts: [[-42, -40 + r * 24], [r === 4 ? 6 : 44, -40 + r * 24]], sw: 5 });
    n.push({ k: "star", x: -40, y: -64, n: 4, R: 12, r: 3.5, fill: C.coral }); return n; }
  function deviceIcon() { var n = [{ k: "rect", x: -46, y: -86, w: 92, h: 172, r: 16, fill: C.navy, sw: 5 }, { k: "rect", x: -36, y: -70, w: 72, h: 128, r: 6, fill: C.card }, { k: "circle", x: 0, y: 72, r: 6, fill: C.shade }];
    for (var a = 0; a < 3; a++) n.push({ k: "path", shape: smooth([[-14 - a * 10, -6 - a * 10], [0, -14 - a * 14], [14 + a * 10, -6 - a * 10]], false, .9), sw: 5, fill: null });
    n.push({ k: "circle", x: 0, y: 6, r: 5, fill: C.coral, sw: 3 }); return n; }
  // a round picture: a colour disc with an ink line, a pale starburst ring behind, its icon, and a numbered ink medallion at the upper left
  function roundNodes(fill, icon, num) { var n = [{ k: "star", x: 0, y: 0, n: 22, R: 178, r: 158, fill: C.card, sw: 0 }, { k: "circle", x: 14, y: 14, r: 140, fill: C.shade, op: 60 },
    { k: "circle", x: 0, y: 0, r: 140, fill: fill, sw: 6, brk: 300 }];
    n.push({ k: "group", sc2: [110, 110], kids: icon });
    return n; }
  function medallionNodes(R) { return [{ k: "circle", x: 0, y: 0, r: R, fill: INK, sw: 4 }, { k: "circle", x: 0, y: 0, r: R - 7, fill: null, sw: 2.5, sc: C.paper, brk: false }]; }
  // a numbered medallion: an ink disc with a paper slab numeral; it stamps on like a damped rubber stamp
  function medallion(comp, name, num, pos, R, t, t1) { var M = piece(comp, name, medallionNodes(R), pos); spanP(M, t - .12, t1);
    var T = words(comp, name + "_N", String(num), { family: SLAB, style: "Regular", size: R * 1.25, color: C.paper, pos: pos, t0: t - .12, t1: t1 });
    T.L.parent = M.L; stamp(M.L, t); return { M: M, T: T }; }
  // a paper detail card with a thin ink border, a star bullet and a label (the colour cel offset); it pops on the action beat
  function tag(comp, name, str, pos, t, t1, size) { size = size || 52; var r = textW(comp, str, SANS, "SemiBold", size), w = r.width + 140, h = size * 1.9;
    var P = piece(comp, name, [{ k: "rect", x: -w / 2 + 10, y: -h / 2 + 10, w: w, h: h, r: h / 2, fill: C.shade, op: 55 }, { k: "rect", x: -w / 2, y: -h / 2, w: w, h: h, r: h / 2, fill: C.card, sw: 4.5, brk: 320 },
      { k: "star", x: -w / 2 + 50, y: 0, n: 5, R: 20, r: 9, fill: C.coral, sw: 3, brk: false }], pos); spanP(P, t, t1);
    var T = words(comp, name + "_T", str, { size: size, pos: [pos[0] - w / 2 + 84, pos[1] + 2], just: "left", t0: t, t1: t1 }); T.L.parent = P.L; pop(P.L, t); return P; }
  // a 4-point atomic sparkle that turns on twos
  function sparkle(comp, name, pos, R, colr, t0, t1) { var S = piece(comp, name, [{ k: "star", x: 0, y: 0, n: 4, R: R, r: R * .26, fill: colr, sw: 3, brk: false }], pos); spanP(S, t0, t1);
    S.L.rotation.expression = "posterizeTime(12); 8 * Math.sin(time * 5 + " + n3(pos[0] / 100) + ");"; S.L.scale.expression = "posterizeTime(12); var s = 100 + 14 * Math.sin(time * 6 + " + n3(pos[1] / 100) + "); [s, s];"; return S; }
  // sunburst rays (about 30 wedges, semi-transparent), turning slowly on twos
  function rays(comp, name, pos, R, colr, op, t0, t1) { var n = [], N = 30;
    for (var i = 0; i < N; i++) { var a0 = (i - .28) * 2 * Math.PI / N, a1 = (i + .28) * 2 * Math.PI / N;
      n.push({ k: "poly", pts: [[Math.cos(a0) * R * .3, Math.sin(a0) * R * .3], [Math.cos(a0) * R, Math.sin(a0) * R], [Math.cos(a1) * R, Math.sin(a1) * R], [Math.cos(a1) * R * .3, Math.sin(a1) * R * .3]], fill: colr }); }
    var L = comp.layers.addShape(); L.name = name; emit(L.property("ADBE Root Vectors Group"), n, "A", NOTES); L.anchorPoint.setValue([0, 0]); L.position.setValue(pos); L.opacity.setValue(op);
    span(L, t0, t1); L.rotation.expression = "posterizeTime(12); time * 7;"; return L; }
  // a dashed manual arrow along a curve, with a paper-dart head; it draws on (trim paths)
  function arrow(comp, name, pts, t, t1) { var A = comp.layers.addShape(); A.name = name; A.anchorPoint.setValue([0, 0]); A.position.setValue([0, 0]); span(A, t, t1);
    var v = A.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").property("ADBE Vectors Group");
    v.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(smooth(pts, false, .9));
    var st = v.addProperty("ADBE Vector Graphic - Stroke"); st.property("ADBE Vector Stroke Color").setValue(INK); st.property("ADBE Vector Stroke Width").setValue(6); st.property("ADBE Vector Stroke Line Cap").setValue(2);
    try { var dg = v.property(2).property("ADBE Vector Stroke Dashes"); dg.addProperty("ADBE Vector Stroke Dash 1"); dg.addProperty("ADBE Vector Stroke Gap 1");
      dg = v.property(2).property("ADBE Vector Stroke Dashes"); dg.property("ADBE Vector Stroke Dash 1").setValue(18); dg.property("ADBE Vector Stroke Gap 1").setValue(16); } catch (e) { NOTES.push("arrow dash: " + e.toString()); }
    v.addProperty("ADBE Vector Filter - Trim"); v = A.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group");
    keys(v.property(v.numProperties).property("ADBE Vector Trim End"), [{ t: t, v: 0, o: 30 }, { t: t + .3, v: 100, i: 70 }]);
    var e = pts[pts.length - 1], q = pts[pts.length - 2], ang = Math.atan2(e[1] - q[1], e[0] - q[0]) * 180 / Math.PI;
    var H = piece(comp, name + "_HEAD", [{ k: "poly", pts: [[18, 0], [-22, -18], [-10, 0], [-22, 18]], fill: C.coral, sw: 4, brk: false }], e); spanP(H, t + .26, t1); H.L.rotation.setValue(ang); pop(H.L, t + .26);
    return A; }

  // ---- grounds: one colour plane, a floor band, a horizon line with gaps, a wavy line and plus marks in the band (never boils)
  function groundNodes(W, H, g) { var n = [{ k: "rect", x: -40, y: -40, w: W + 80, h: FLOOR + 40, fill: g[0] }, { k: "rect", x: -40, y: FLOOR, w: W + 80, h: H - FLOOR + 60, fill: g[1] }];
    n.push({ k: "line", pts: [[-10, FLOOR], [150, FLOOR]], sw: 6 }, { k: "line", pts: [[176, FLOOR], [640, FLOOR]], sw: 6 }, { k: "line", pts: [[664, FLOOR], [690, FLOOR]], sw: 6 }, { k: "line", pts: [[716, FLOOR], [W + 10, FLOOR]], sw: 6 });
    var wv = []; for (var x = -20; x <= W + 20; x += 45) wv.push([x, FLOOR + 92 + ((x / 45) % 2 ? 12 : -12)]);
    n.push({ k: "path", shape: smooth(wv, false, .9), sw: 4, sc: [g[1][0] * .78, g[1][1] * .72, g[1][2] * .72], fill: null });
    for (var p = 50; p < W; p += 120) n.push({ k: "line", pts: [[p - 8, FLOOR + 190], [p + 8, FLOOR + 190]], sw: 3, sc: C.paper }, { k: "line", pts: [[p, FLOOR + 182], [p, FLOOR + 198]], sw: 3, sc: C.paper });
    return n; }
  function ground(comp, name, g, t0, t1) { var L = comp.layers.addShape(); L.name = name; emit(L.property("ADBE Root Vectors Group"), groundNodes(comp.width, comp.height, g), "A", NOTES);
    L.anchorPoint.setValue([0, 0]); L.position.setValue([0, 0]); span(L, t0, t1); return L; }
  // a colour-block wipe (turning the manual's page): the next ground slides over everything, side or bottom-up, with an ink leading edge
  function wipe(comp, name, g, dir, t) { var L = ground(comp, name, g, t - .26, t + .001), W = comp.width, H = comp.height, from = [W + 70, 0];
    if (dir === "left") from = [-W - 70, 0]; if (dir === "up") from = [0, H + 70];
    var v = L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").property("ADBE Vectors Group"), edge = [[-48, -60], [-48, H + 60]];
    if (dir === "left") edge = [[W + 48, -60], [W + 48, H + 60]]; if (dir === "up") edge = [[-60, -48], [W + 60, -48]];
    v.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(poly(edge, false));
    var st = v.addProperty("ADBE Vector Graphic - Stroke"); st.property("ADBE Vector Stroke Color").setValue(INK); st.property("ADBE Vector Stroke Width").setValue(16);
    keys(L.position, [{ t: t - .26, v: from, o: 40 }, { t: t, v: [0, 0], i: 85 }]); return L; }
  // an iris: an ink layer with a round hole (even-odd fill); returns the hole's size property, fetched fresh
  function iris(comp, name, cx, cy, t0, t1) { var L = comp.layers.addShape(); L.name = name; L.anchorPoint.setValue([0, 0]); L.position.setValue([0, 0]);
    var v = L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").property("ADBE Vectors Group"); v.addProperty("ADBE Vector Shape - Rect").property("ADBE Vector Rect Size").setValue([6000, 6000]);
    v.addProperty("ADBE Vector Shape - Ellipse").property("ADBE Vector Ellipse Position").setValue([cx, cy]);
    var f = v.addProperty("ADBE Vector Graphic - Fill"); f.property("ADBE Vector Fill Color").setValue(INK); f.property("ADBE Vector Fill Rule").setValue(2);
    span(L, t0, t1); return L.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property(2).property("ADBE Vector Ellipse Size"); }

  function wordsIn(list, t0, t1) { var r = []; for (var i = 0; i < list.length; i++) if (list[i].s >= t0 - .05 && list[i].s < t1) r.push(list[i]); return r; }

  // buildScene: the shared test scene (production/styles/scene) as a 1950s follow-along film. comp = an empty 1080 x 1920 comp at scene.fps.
  // STAGE holds the grounds (on ones), CAST (every drawing, on twos with a light line boil) and the wipes and irises above it; the main comp
  // holds STAGE with the camera's slow push, then paper grain and a warm vignette. The presenter holds still in every beat; the hand is the step.
  function buildScene(comp, scene, opts) {
    fontOK(); NOTES = []; var P = opts.prefix || "MID", A = opts.assets, B = scene.beat, W = comp.width, H = comp.height, WL = scene.wordList, D = comp.duration, fps = comp.frameRate;
    AESLib.clearOwned(comp, P);
    var ST = app.project.items.addComp(P + "_STAGE", W, H, 1, D, fps), CA = app.project.items.addComp(P + "_CAST", W, H, 1, D, fps);
    var ons = function (t0, t1) { var r = [], w = wordsIn(WL, t0, t1); for (var i = 0; i < w.length; i++) r.push(w[i].s); return r; };
    var T0 = B.title.t0, P0 = B.picture.t0, I0 = B.input.t0, N0 = B.number.t0, L0 = B.line.t0, C0 = B.carry.t0, E0 = B.end.t0, E1 = B.end.t1;
    var tw = ons(T0, P0), pw = ons(P0, I0), iw = ons(I0, N0), nw = ons(N0, L0), lw = ons(L0, C0), cw = ons(C0, E0), ew = ons(E0, E1);
    var through = cw[cw.length - 1];                          // "next": the camera goes through the medallion into the end card

    // the real frame as a printed cel (tools/cel.mjs, 12 fps) in a round window: used by the input's call-out and again by the carry
    var CR = 640, CL = app.project.items.addComp(P + "_CALLOUT", CR, CR, 1, D, fps); CL.bgColor = C.paper;
    var cel = AESLib.importFile(A.cel), FL = CL.layers.add(cel); FL.name = P + "_CO_CEL"; FL.position.setValue([CR / 2, CR / 2]);
    var fsc = 100 * CR / Math.min(cel.width, cel.height); FL.scale.setValue([fsc, fsc]);
    function callout(name, pos, s, t0, t1, start) { var sh = piece(CA, name + "_SHADOW", [{ k: "circle", x: 16, y: 16, r: CR / 2 + 22, fill: C.shade, op: 65 }], pos);
      var Lc = CA.layers.add(CL); Lc.name = name + "_PIC"; Lc.startTime = start; Lc.position.setValue(pos);
      var m = Lc.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"); m.property("ADBE Mask Shape").setValue(ell(CR / 2, CR / 2, CR / 2, CR / 2));
      var rim = piece(CA, name, [{ k: "circle", x: 0, y: 0, r: CR / 2 + 10, fill: null, csw: 26, cc: C.turq }, { k: "circle", x: 0, y: 0, r: CR / 2 - 3, sw: 6, fill: null, brk: 360 },
        { k: "circle", x: 0, y: 0, r: CR / 2 + 23, sw: 6, fill: null, brk: 400 }], pos);
      sh.L.parent = rim.L; Lc.parent = rim.L; spanP(rim, t0, t1); spanP(sh, t0, t1); span(Lc, t0, t1); rim.L.scale.setValue([s * 100, s * 100]); return rim; }

    // the presenter: one held drawing for the whole film, lower left; the right hand does every step
    var PR = { x: 200, y: 1742, s: .95 }, man = piece(CA, P + "_PRESENTER", presenterNodes(), [PR.x, PR.y]); man.L.scale.setValue([PR.s * 100, PR.s * 100]); rigArms(man.L);
    var rest = [66, -330], g = [];
    var at = function (t, tgt) { g.push({ t: t, p: reachTo(PR, "R", tgt) }); };
    at(tw[2], [560, 560]);
    at(pw[0], [720, 380]); at(pw[1], [720, 780]); at(pw[2], [720, 1180]); at(pw[4], [640, 1560]);
    at(iw[0] + .1, [640, 640]); at(nw[0] + .05, [540, 560]); at(nw[2], [700, 1010]); at(lw[0] + .05, [560, 640]); at(cw[0] + .05, [620, 660]);
    g.push({ t: ew[0] + .12, p: rest });
    keys(groupT(man.L, ["HR"]).property("ADBE Vector Position"), gestures(SH.R, rest, g));
    keys(grp(man.L, ["HR", "POINT"]).property("ADBE Vector Transform Group").property("ADBE Vector Group Opacity"), [{ t: 0, v: 0, o: "H" }, { t: tw[2] - .16, v: 100, o: "H" }, { t: ew[0], v: 0, o: "H" }]);
    keys(grp(man.L, ["HR", "OPEN"]).property("ADBE Vector Transform Group").property("ADBE Vector Group Opacity"), [{ t: 0, v: 100, o: "H" }, { t: tw[2] - .16, v: 0, o: "H" }, { t: ew[0], v: 100, o: "H" }]);
    // the mouth talks on the spoken onsets (two drawings); the body never moves
    var tk = [{ t: 0, v: 0, o: "H" }], sk = [{ t: 0, v: 100, o: "H" }];
    for (var wi = 0; wi < WL.length; wi++) { var w0 = WL[wi].s, w1 = w0 + Math.min(.14, (WL[wi].e - WL[wi].s) * .6); tk.push({ t: w0, v: 100, o: "H" }, { t: w1, v: 0, o: "H" }); sk.push({ t: w0, v: 0, o: "H" }, { t: w1, v: 100, o: "H" }); }
    keys(grp(man.L, ["TALK"]).property("ADBE Vector Transform Group").property("ADBE Vector Group Opacity"), tk);
    keys(grp(man.L, ["SMILE"]).property("ADBE Vector Transform Group").property("ADBE Vector Group Opacity"), sk);

    // 1. title: the script kicker writes on, the slab title slides in on twos over its mustard plate, a letter-spaced line, sparkles
    var K1 = words(CA, P + "_T_KICK", B.title.context, { family: SCRIPT, style: "Bold", size: 150, color: C.coral, plate: C.coralDark, reg: 5, pos: [575, 330], maxW: 820, t0: T0, t1: P0 });
    writeOn(K1.L, T0 + .04, tw[1] + .2); writeOn(K1.P, T0 + .04, tw[1] + .2);
    var hero = B.title.hero.charAt(0).toUpperCase() + B.title.hero.substr(1), sp = hero.split(" "), l1 = sp.slice(0, Math.ceil(sp.length / 2)).join(" "), l2 = sp.slice(Math.ceil(sp.length / 2)).join(" ");
    var T1t = words(CA, P + "_T_HERO", l1 + "\r" + l2 + ".", { family: SLAB, style: "Regular", size: 132, plate: C.mustard, leading: 150, pos: [575, 590], maxW: 860, t0: tw[2] - .1, t1: P0 });
    keys(T1t.L.position, [{ t: tw[2] - .1, v: [575 - 1100, 590], o: "H" }, { t: tw[2] - .02, v: [575 - 420, 590], o: "H" }, { t: tw[2] + .06, v: [575 + 30, 590], o: "H" }, { t: tw[2] + .14, v: [575, 590], o: "H" }]);
    words(CA, P + "_T_LINE", "A FOLLOW-ALONG FILM IN 7 STEPS", { size: 36, tracking: 360, pos: [575, 800], t0: tw[4], t1: P0 });
    sparkle(CA, P + "_T_SPK1", [150, 250], 30, C.coral, T0, P0); sparkle(CA, P + "_T_SPK2", [985, 420], 22, INK, T0, P0); sparkle(CA, P + "_T_SPK3", [940, 760], 18, C.turq, tw[4], P0);

    // 2. picture: three round pictures stamp on "Three", "pieces", "build", a numbered medallion each, dashed arrows between; on "picture"
    // a ribbon tag pops with a starburst: one picture
    var RP = [[720, 380, C.blue, personIcon(), "a person", 320], [720, 780, C.mustard, docIcon(), "a document", 300], [720, 1180, C.olive, deviceIcon(), "a device", 720]];
    for (var ri = 0; ri < 3; ri++) { var rp = RP[ri], tt = pw[ri];
      var R1 = piece(CA, P + "_P_ROUND" + ri, roundNodes(rp[2], rp[3], ri + 1), [rp[0], rp[1]]); spanP(R1, tt, I0); pop(R1.L, tt, 125);
      medallion(CA, P + "_P_MED" + ri, ri + 1, [rp[0] - 128, rp[1] - 128], 52, tt + .1, I0);
      var lb = words(CA, P + "_P_LAB" + ri, rp[4], { size: 54, pos: [rp[5], rp[1] + (ri === 2 ? 250 : 10)], t0: tt + .12, t1: I0 }); pop(lb.L, tt + .12); }
    arrow(CA, P + "_P_ARR1", [[905, 470], [985, 580], [925, 680]], pw[1] - .3, I0);
    arrow(CA, P + "_P_ARR2", [[905, 870], [985, 980], [925, 1080]], pw[2] - .3, I0);
    var RB = piece(CA, P + "_P_RIBBON", [{ k: "poly", pts: [[-340, -70], [340, -70], [300, 0], [340, 70], [-340, 70], [-300, 0]], fill: C.pink, sw: 5, brk: 400 },
      { k: "line", pts: [[-296, -54], [296, -54]], sw: 2.5 }, { k: "line", pts: [[-296, 54], [296, 54]], sw: 2.5 },
      { k: "star", x: -250, y: 0, n: 14, R: 82, r: 58, fill: C.coral, sw: 4, brk: false }], [640, 1560]); spanP(RB, pw[4], I0);
    var RT = words(CA, P + "_P_RIB_T", "One picture.", { size: 66, pos: [690, 1562], t0: pw[4], t1: I0 }); RT.L.parent = RB.L;
    var RN = words(CA, P + "_P_RIB_N", "1", { family: SLAB, style: "Regular", size: 78, color: C.paper, pos: [390, 1564], t0: pw[4], t1: I0 }); RN.L.parent = RB.L;
    pop(RB.L, pw[4]); sparkle(CA, P + "_P_SPK", [990, 1440], 26, C.coral, pw[4] + .1, I0);

    // 3. input: a colour-block wipe from the right onto blue; a round call-out (the real frame, printed off register) pops on the beat with a
    // leader line to the pointing hand; the detail tag lands on "frame"
    var CP3 = [640, 640], CO1 = callout(P + "_I_CALL", CP3, 1, I0, N0, I0); pop(CO1.L, I0 + .02);
    var hp = reachTo(PR, "R", CP3), tip = [PR.x + (hp[0] + (hp[0] - SH.R[0]) * .35) * PR.s, PR.y + (hp[1] + (hp[1] - SH.R[1]) * .35) * PR.s];
    var dx = CP3[0] - tip[0], dy = CP3[1] - tip[1], dl = Math.sqrt(dx * dx + dy * dy), edge = [CP3[0] - dx / dl * (CR / 2 + 30), CP3[1] - dy / dl * (CR / 2 + 30)];
    var LD = piece(CA, P + "_I_LEADER", [{ k: "line", pts: [[tip[0] + dx / dl * 24, tip[1] + dy / dl * 24], edge], sw: 5 }, { k: "circle", x: edge[0], y: edge[1], r: 9, fill: INK }], [0, 0]);
    spanP(LD, iw[0] + .2, N0); LD.L.opacity.setValue(100);
    tag(CA, P + "_I_TAG", "a real frame", [700, 1090], iw[3], N0, 54);
    sparkle(CA, P + "_I_SPK", [300, 330], 26, C.coral, iw[3], N0);

    // 4. number: bottom-up wipe onto mustard; sunburst rays; the count runs on twos in the slab over a coral plate and lands with a pop on
    // "frames"; FRAMES slides in letter-spaced; "counted." lands as a tag on its word
    rays(CA, P + "_N_RAYS", [540, 600], 640, C.card, 55, N0, L0);
    var val = B.number.value, NU = words(CA, P + "_N_NUM", String(val), { family: SLAB, style: "Regular", size: 300, plate: C.coral, reg: 10, pos: [540, 600], t0: N0, t1: L0 });
    NU.L.anchorPoint.expression = "var r = sourceRectAtTime(time, false); [r.left + r.width / 2, r.top + r.height / 2];";
    NU.P.position.expression = "posterizeTime(12); seedRandom(Math.floor(time * 12), true); var r = parent.sourceRectAtTime(time, false); [r.left + r.width / 2 + 10 + random(-1.6, 1.6), r.top + r.height / 2 + 10 + random(-1.6, 1.6)];";
    NU.P.anchorPoint.expression = "var r = sourceRectAtTime(time, false); [r.left + r.width / 2, r.top + r.height / 2];";
    var counts = [], steps = Math.max(2, Math.round((nw[1] - N0) * TWOS)); for (var c = 0; c <= steps; c++) { var e = 1 - Math.pow(1 - c / steps, 2.2); counts.push(String(Math.round(val * e))); }
    AESLib.bakeText(NU.L, counts, TWOS, N0); AESLib.bakeText(NU.P, counts, TWOS, N0);
    keys(NU.L.scale, [{ t: N0, v: [70, 70], o: 40 }, { t: N0 + .14, v: [100, 100], i: 60, o: "H" }, { t: nw[1] - .02, v: [100, 100], o: 40 }, { t: nw[1] + .1, v: [114, 114], i: 60, o: 60 }, { t: nw[1] + .2, v: [97, 97], i: 60, o: 60 }, { t: nw[1] + .3, v: [100, 100], i: 70 }]);
    var FR = words(CA, P + "_N_LABEL", B.number.label.toUpperCase(), { size: 72, tracking: 520, pos: [560, 840], t0: nw[1] - .02, t1: L0 });
    keys(FR.L.position, [{ t: nw[1] - .02, v: [560 + 700, 840], o: "H" }, { t: nw[1] + .06, v: [560 + 160, 840], o: "H" }, { t: nw[1] + .14, v: [560 - 10, 840], o: "H" }, { t: nw[1] + .22, v: [560, 840], o: "H" }]);
    tag(CA, P + "_N_TAG", "counted.", [720, 1010], nw[2], L0, 60);
    var SB = piece(CA, P + "_N_BURST", [{ k: "star", x: 0, y: 0, n: 12, R: 64, r: 40, fill: C.turq, sw: 4, brk: false }, { k: "star", x: 0, y: 0, n: 4, R: 26, r: 7, fill: C.paper }], [930, 940]);
    spanP(SB, nw[2] + .06, L0); pop(SB.L, nw[2] + .06); SB.L.rotation.expression = "posterizeTime(12); time * 20;";

    // 5. line: a wipe from the left onto sage; a step header slides in on twos; the caption card (paper slab, thin ink border, turning stars at
    // its ends) fades up with a small rise and the words are typed on their spoken onsets
    var SH5 = piece(CA, P + "_L_STEP", medallionNodes(52), [210, 330]); spanP(SH5, L0, C0);
    var SN = words(CA, P + "_L_STEPN", "5", { family: SLAB, style: "Regular", size: 64, color: C.paper, pos: [210, 336], t0: L0, t1: C0 }); SN.L.parent = SH5.L;
    var SX = words(CA, P + "_L_STEPX", "STEP 5 OF 7", { size: 38, tracking: 300, pos: [290, 312], just: "left", t0: L0, t1: C0 }); SX.L.parent = SH5.L;
    var SY = words(CA, P + "_L_STEPY", "Typed as I talk", { family: SLAB, style: "Regular", size: 56, plate: C.olive, reg: 5, pos: [290, 370], just: "left", t0: L0, t1: C0 }); SY.L.parent = SH5.L;
    keys(SH5.L.position, [{ t: L0, v: [210 - 900, 330], o: "H" }, { t: L0 + .08, v: [210 - 300, 330], o: "H" }, { t: L0 + .16, v: [222, 330], o: "H" }, { t: L0 + .24, v: [210, 330], o: "H" }]);
    var CW = 920, CH = 430, CC = [540, 780];
    var CD = piece(CA, P + "_L_CARD", [{ k: "rect", x: -CW / 2 + 16, y: -CH / 2 + 16, w: CW, h: CH, r: 46, fill: C.shade, op: 60 }, { k: "rect", x: -CW / 2, y: -CH / 2, w: CW, h: CH, r: 46, fill: C.card, sw: 5, brk: 520 },
      { k: "rect", x: -CW / 2 + 22, y: -CH / 2 + 22, w: CW - 44, h: CH - 44, r: 30, fill: null, sw: 2.5, brk: 300 }], CC); spanP(CD, L0, C0);
    keys(CD.L.position, [{ t: L0, v: [CC[0], CC[1] + 40], o: 40 }, { t: L0 + .22, v: CC, i: 70 }]); keys(CD.L.opacity, [{ t: L0, v: 0, o: 40 }, { t: L0 + .14, v: 100, i: 60 }]);
    if (CD.F) keys(CD.F.opacity, [{ t: L0, v: 0, o: 40 }, { t: L0 + .14, v: 100, i: 60 }]);
    var ST1 = sparkle(CA, P + "_L_STAR1", [-CW / 2 + 4, 0], 34, C.coral, L0, C0), ST2 = sparkle(CA, P + "_L_STAR2", [CW / 2 - 4, 0], 34, C.coral, L0, C0);
    ST1.L.parent = CD.L; ST2.L.parent = CD.L; ST1.L.position.setValue([-CW / 2 + 4, 0]); ST2.L.position.setValue([CW / 2 - 4, 0]);
    var rows = ["Every word I say", "gets typed."], rwi = [[0, 1, 2, 3], [4, 5]], LS = 84;
    for (var r = 0; r < rows.length; r++) { var full = textW(CA, rows[r], SANS, "SemiBold", LS), rowY = CC[1] - 60 + r * 120;
      var RL = AESLib.text(CA, P + "_L_ROW" + r, rows[r], { family: SANS, style: "SemiBold", size: LS, color: INK, just: "left" });
      RL.anchorPoint.setValue([full.left + full.width / 2, full.top + full.height / 2]); RL.position.setValue([CC[0], rowY]); span(RL, L0, C0); RL.parent = CD.L;
      var ws = rows[r].split(" "), tt2 = [L0], ss = [" "];
      for (var wj = 0; wj < ws.length; wj++) { var atw = lw[rwi[r][wj]]; if (atw <= L0 + .001) ss[0] = ws.slice(0, wj + 1).join(" "); else { tt2.push(atw); ss.push(ws.slice(0, wj + 1).join(" ")); } }
      AESLib.textKeys(RL, tt2, ss); }

    // 7 (laid out before 6, which irises into it). end: rays behind, the script kicker writes on, the slab line slides in over its mustard
    // plate, sparkles; the hands come to rest and the frame holds still, then an iris closes on the title
    rays(CA, P + "_E_RAYS", [575, 560], 720, C.mustard, 40, through, E1);
    var EK = words(CA, P + "_E_KICK", "That's", { family: SCRIPT, style: "Bold", size: 170, color: C.coral, plate: C.coralDark, reg: 5, pos: [575, 420], t0: through, t1: E1 });
    writeOn(EK.L, ew[0], ew[1]); writeOn(EK.P, ew[0], ew[1]);
    var EL = words(CA, P + "_E_LINE", "the test.", { family: SLAB, style: "Regular", size: 168, plate: C.mustard, reg: 9, pos: [575, 640], maxW: 880, t0: ew[1] - .1, t1: E1 });
    keys(EL.L.position, [{ t: ew[1] - .1, v: [575 + 1100, 640], o: "H" }, { t: ew[1] - .02, v: [575 + 420, 640], o: "H" }, { t: ew[1] + .06, v: [575 - 30, 640], o: "H" }, { t: ew[1] + .14, v: [575, 640], o: "H" }]);
    sparkle(CA, P + "_E_SPK1", [170, 300], 34, C.coral, ew[2], E1); sparkle(CA, P + "_E_SPK2", [960, 780], 26, C.turq, ew[2] + .1, E1); sparkle(CA, P + "_E_SPK3", [980, 300], 20, INK, ew[1], E1);
    var EB = piece(CA, P + "_E_SEAL", [{ k: "star", x: 0, y: 0, n: 16, R: 120, r: 94, fill: C.coral, sw: 5, brk: false }, { k: "circle", x: 0, y: 0, r: 80, fill: null, sw: 3, sc: C.paper, brk: false }], [770, 1050]);
    spanP(EB, ew[2], E1); pop(EB.L, ew[2]); EB.L.rotation.expression = "posterizeTime(12); -6 + time * 4;";
    var EBT = words(CA, P + "_E_SEALT", "7 OF 7", { size: 40, tracking: 160, color: C.paper, pos: [770, 1052], t0: ew[2], t1: E1 }); EBT.L.parent = EB.L;

    // 6. carry: a cut onto blue; the call-out comes back (the footage runs on); on "one" a numbered medallion stamps onto it, and on "next" the
    // camera goes through the medallion (an ink disc grows from it) into the end card, which opens out of an iris
    var CP6 = [620, 660], CO2 = callout(P + "_C_CALL", CP6, .92, C0, through, C0 - (N0 - I0)); pop(CO2.L, C0 + .02, 92);
    var MD = medallion(CA, P + "_C_MED", 1, [CP6[0] + 150, CP6[1] + 170], 96, cw[1], through);
    var CT = tag(CA, P + "_C_TAG", "becomes the next", [640, 1110], cw[3], through, 50);
    sparkle(CA, P + "_C_SPK", [250, 330], 28, C.mustard, cw[1], through);

    // STAGE: the grounds (one per scene; a colour-block wipe lays each new one), CAST on twos with a line boil, the transitions above
    ground(ST, P + "_G_TITLE", GROUND.cream, 0, I0); ground(ST, P + "_G_INPUT", GROUND.blue, I0, N0); ground(ST, P + "_G_NUMBER", GROUND.mustard, N0, L0);
    ground(ST, P + "_G_LINE", GROUND.sage, L0, C0); ground(ST, P + "_G_CARRY", GROUND.blue, C0, through); ground(ST, P + "_G_END", GROUND.cream, through, D);
    var CL2 = ST.layers.add(CA); CL2.name = P + "_CASTL";
    fx(CL2, "ADBE Posterize Time").property("Frame Rate").setValue(TWOS);
    var td = fx(CL2, "ADBE Turbulent Displace"); td.property("Amount").setValue(1.6); td.property("Size").setValue(30);
    td.property("Evolution").expression = "(Math.floor(time * 12) % 3) * 120;";
    wipe(ST, P + "_W_INPUT", GROUND.blue, "right", I0); wipe(ST, P + "_W_NUMBER", GROUND.mustard, "up", N0); wipe(ST, P + "_W_LINE", GROUND.sage, "left", L0);
    var MC = [CP6[0] + 150, CP6[1] + 170], DK = ST.layers.addShape(); DK.name = P + "_THROUGH"; DK.anchorPoint.setValue([0, 0]); DK.position.setValue(MC);
    var dv = DK.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").property("ADBE Vectors Group"); dv.addProperty("ADBE Vector Shape - Ellipse").property("ADBE Vector Ellipse Size").setValue([192, 192]);
    dv.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(INK); span(DK, through - .3, through + .001);
    keys(DK.scale, [{ t: through - .3, v: [100, 100], o: 60 }, { t: through, v: [1450, 1450], i: 20 }]);
    var IO = iris(ST, P + "_IRIS_OPEN", 575, 600, through, through + .4); keys(IO, [{ t: through, v: [0, 0], o: 30 }, { t: through + .36, v: [3000, 3000], i: 70 }]);
    var IX = iris(ST, P + "_IRIS_OUT", 575, 600, E1 - .62, E1 + .1); keys(IX, [{ t: E1 - .62, v: [3000, 3000], o: 40 }, { t: E1 - .08, v: [0, 0], i: 85 }]);

    // the main comp: the camera on the stand (a slow push of a few % per scene, on ones), paper tooth and grain, a warm vignette
    var bg = comp.layers.addSolid(C.paper, P + "_PAPERBG", W, H, 1);
    var SL = comp.layers.add(ST); SL.name = P + "_STAND"; SL.anchorPoint.setValue([W / 2, 760]); SL.position.setValue([W / 2, 760]);
    var cuts = []; for (var bi = 0; bi < scene.beats.length; bi++) cuts.push(n3(scene.beats[bi].t0)); cuts.push(n3(through)); cuts.sort(function (a, b) { return a - b; });
    SL.scale.expression = "var C = [" + cuts.join(",") + "], t0 = 0, t1 = " + n3(D) + "; for (var i = 0; i < C.length; i++) { if (time >= C[i]) { t0 = C[i]; if (i + 1 < C.length) t1 = C[i + 1]; else t1 = " + n3(D) + "; } }\n" +
      "var u = (time - t0) / Math.max(t1 - t0, .1); var s = 100 + 3 * ease(u, 0, 1, 0, 1); [s, s];";
    var GR = comp.layers.addSolid([.5, .5, .5], P + "_TOOTH", W, H, 1), gf = fx(GR, "ADBE Fractal Noise"); gf.property("Contrast").setValue(140); gf.property("Scale").setValue(40); gf.property("Complexity").setValue(4);
    GR.blendingMode = BlendingMode.OVERLAY; GR.opacity.setValue(12);
    var GB = comp.layers.addSolid([.5, .5, .5], P + "_BRUSH", W, H, 1), bf = fx(GB, "ADBE Fractal Noise"); bf.property("Contrast").setValue(90); bf.property("Scale").setValue(380); bf.property("Complexity").setValue(2);
    GB.blendingMode = BlendingMode.SOFT_LIGHT; GB.opacity.setValue(22);
    var GN = comp.layers.addSolid([1, 1, 1], P + "_GRAIN", W, H, 1); GN.adjustmentLayer = true; var nn = fx(GN, "ADBE Noise"); nn.property("Amount of Noise").setValue(3);
    try { GN.property("ADBE Effect Parade").property(1).property(2).setValue(0); } catch (eG) { NOTES.push("grain colour: " + eG.toString()); }
    var VI = comp.layers.addSolid(C.vignette, P + "_VIGNETTE", W, H, 1), vm = VI.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
    vm.property("ADBE Mask Shape").setValue(ell(W / 2, H / 2, W * .62, H * .58)); vm.inverted = true; vm = VI.property("ADBE Mask Parade").property(1); vm.property("ADBE Mask Feather").setValue([380, 380]);
    VI.blendingMode = BlendingMode.MULTIPLY; VI.opacity.setValue(30);
    return { layers: comp.numLayers + ST.numLayers + CA.numLayers + CL.numLayers, notes: NOTES };
  }
  return { SCRIPT: SCRIPT, SLAB: SLAB, SANS: SANS, C: C, GROUND: GROUND, fontOK: fontOK, keys: keys, piece: piece, grp: grp, groupT: groupT, emit: emit,
    presenterNodes: presenterNodes, rigArms: rigArms, reachTo: reachTo, gestures: gestures, medallion: medallion, tag: tag, sparkle: sparkle, rays: rays, arrow: arrow,
    ground: ground, wipe: wipe, iris: iris, words: words, writeOn: writeOn, pop: pop, stamp: stamp, smooth: smooth, rrect: rrect, ell: ell, buildScene: buildScene };
})();
