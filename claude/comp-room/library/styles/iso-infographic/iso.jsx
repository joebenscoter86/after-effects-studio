// Isometric infographic style: brand-neutral ES3 helpers. No project mutation happens at load.
// Read styles/iso-infographic/STYLE.md first. A floating diorama board in true isometric (30 degree axes, never rotated), flat solids in three
// tones per face (top light, +y side mid, +x side dark), ink only for the infographic furniture (pins, leaders, routes, rings), Isotype numbers
// built from identical icons, a circular inset that opens on a leader, and a 2D camera with a log-interpolated zoom.
// Adapted from Lemo-Opuscar's iso-infographic style (MIT, LemoLab); see library/styles/LICENSE-lemo-opuscar.txt.
var AESIso = (function () {
  var FAM = "Poppins";
  function hex(h) { return [parseInt(h.substr(0, 2), 16) / 255, parseInt(h.substr(2, 2), 16) / 255, parseInt(h.substr(4, 2), 16) / 255]; }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  var INK = hex("2B2230"), GROUND = hex("F1E7D3"), WARM = hex("FFF8EC"), COOL = hex("231A2C"), PLATE = hex("FAF4E8"), LATTICE = hex("D9CBB0");
  // one hue per meaning, never reused: board land, soil, rock, the person, the document, the device, frames of the video (the subject)
  var HUE = { land: hex("9CC27E"), soil: hex("8A6142"), rock: hex("5E4A3C"), person: hex("2E9C93"), document: hex("E2A83A"), paper: hex("F6F0E4"),
    device: hex("4F7CAC"), screen: hex("2A2734"), frame: hex("E0533D"), type: hex("BFE8D6") };
  // three tones from one base: the top mixes 20% toward warm white, the +x side 22% toward a cool dark, the +y side is the base
  function tones(c) { return { top: mix(c, WARM, .2), py: c, px: mix(c, COOL, .22) }; }
  function fontOK() { AESLib.font(FAM, "SemiBold"); AESLib.font(FAM, "Regular"); return true; }

  // ---- projection: x runs down-right, y down-left, z up; painter depth is x + y + z. K px per unit at rest; the board centre (6, 6) sits at OX, OY.
  var K = 46, OX = 540, OY = 860, C30 = Math.cos(Math.PI / 6);
  function iso(x, y, z) { return [OX + (x - y) * C30 * K, OY + ((x + y) / 2 - 6 - (z || 0)) * K]; }

  // ---- keys: one setValuesAtTimes per property, then the ease per key (colour takes one KeyframeEase; spatial tangents are zeroed)
  function keys(prop, list, mode) {
    var T = [], V = [], i; list.sort(function (a, b) { return a[0] - b[0]; });
    for (i = 0; i < list.length; i++) { if (T.length && list[i][0] <= T[T.length - 1] + 1 / 120) { V[V.length - 1] = list[i][1]; continue; } T.push(list[i][0]); V.push(list[i][1]); }
    prop.setValuesAtTimes(T, V);
    var vt = prop.propertyValueType, sp = vt === PropertyValueType.TwoD_SPATIAL || vt === PropertyValueType.ThreeD_SPATIAL;
    var n = 1; if (!sp && vt !== PropertyValueType.COLOR && prop.value instanceof Array) n = prop.value.length;
    for (i = 0; i < T.length; i++) { var k = prop.nearestKeyIndex(T[i]);
      if (mode === "hold") { prop.setInterpolationTypeAtKey(k, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD); continue; }
      if (mode === "linear") { prop.setInterpolationTypeAtKey(k, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR); }
      else { var ii = 85, oi = 30; if (mode === "exit") { ii = 12; oi = 75; } else if (mode === "travel") { ii = 80; oi = 80; }
        var a = [], b = []; for (var d = 0; d < n; d++) { a.push(new KeyframeEase(0, ii)); b.push(new KeyframeEase(0, oi)); }
        prop.setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER); prop.setTemporalEaseAtKey(k, a, b); }
      if (sp) { var z = prop.value.length === 3 ? [0, 0, 0] : [0, 0]; prop.setSpatialTangentsAtKey(k, z, z); } }
    return prop; }
  // a back-ease pop (overshoot) on a 2D scale
  function pop(prop, t, peak, dur) { var p = peak || 115, d = dur || .2; return keys(prop, [[t, [0, 0]], [t + d * .55, [p, p]], [t + d, [100, 100]]], "settle"); }

  // ---- shapes
  function shapeLayer(comp, name) { var L = comp.layers.addShape(); L.name = name; L.anchorPoint.setValue([0, 0]); L.position.setValue([0, 0]); return L; }
  function group(L, nm) { var g = L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group"); g.name = nm; return g; }
  function contents(g) { return g.property("ADBE Vectors Group"); }
  function fill(g, c) { contents(g).addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(c); }
  function stroke(g, c, w, dash) { var s = contents(g).addProperty("ADBE Vector Graphic - Stroke"); s.property("ADBE Vector Stroke Color").setValue(c);
    s.property("ADBE Vector Stroke Width").setValue(w); s.property("ADBE Vector Stroke Line Cap").setValue(dash ? 1 : 2); s.property("ADBE Vector Stroke Line Join").setValue(2);
    if (dash) { var D = s.property("ADBE Vector Stroke Dashes"); D.addProperty("ADBE Vector Stroke Dash 1").setValue(dash[0]); D.addProperty("ADBE Vector Stroke Gap 1").setValue(dash[1]); }
    return s; }
  function poly(pts, closed) { var s = new Shape(); s.vertices = pts; s.closed = !!closed; return s; }
  function pathIn(g, shp) { return contents(g).addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape"); }
  function setPath(g, shp) { pathIn(g).setValue(shp); }
  function ellipseIn(g, d, c) { var e = contents(g).addProperty("ADBE Vector Shape - Ellipse"); e.property("ADBE Vector Ellipse Size").setValue([d, d]); if (c) e.property("ADBE Vector Ellipse Position").setValue(c); return e; }
  function trimIn(g) { return contents(g).addProperty("ADBE Vector Filter - Trim"); }
  function gtr(g) { return g.property("ADBE Vector Transform Group"); }
  function circleShape(c, r) { var k = r * .5523, s = new Shape(); s.vertices = [[c[0], c[1] - r], [c[0] + r, c[1]], [c[0], c[1] + r], [c[0] - r, c[1]]];
    s.inTangents = [[-k, 0], [0, -k], [k, 0], [0, k]]; s.outTangents = [[k, 0], [0, k], [-k, 0], [0, -k]]; s.closed = true; return s; }

  // ---- solids: a box is three faces, one group each (the faces of one box never overlap). Boxes in one layer go front first (the top group draws on top).
  function boxFaces(b) { var x = b.x, y = b.y, z = b.z, w = b.w, d = b.d, h = b.h;
    return { top: [iso(x, y, z + h), iso(x + w, y, z + h), iso(x + w, y + d, z + h), iso(x, y + d, z + h)],
      px: [iso(x + w, y, z), iso(x + w, y + d, z), iso(x + w, y + d, z + h), iso(x + w, y, z + h)],
      py: [iso(x, y + d, z), iso(x + w, y + d, z), iso(x + w, y + d, z + h), iso(x, y + d, z + h)] }; }
  function depth(b) { return (b.x + b.w / 2) + (b.y + b.d / 2) + (b.z + b.h / 2) + (b.bias || 0); }
  function solids(L, list) { list.sort(function (a, b) { return depth(b) - depth(a); });
    for (var i = 0; i < list.length; i++) { var b = list[i], f = boxFaces(b), T = tones(b.c), g;
      if (b.h > 0) { g = group(L, (b.nm || "box") + "_py"); setPath(g, poly(f.py, true)); fill(g, T.py);
        g = group(L, (b.nm || "box") + "_px"); setPath(g, poly(f.px, true)); fill(g, T.px); }
      g = group(L, (b.nm || "box") + "_top"); setPath(g, poly(f.top, true)); fill(g, T.top); }
    return L; }
  // a flat shape lying on a face: pts in world units, drawn at z (top plane) or on the +x plane (pts are [y, z] at x)
  function onTop(pts, z) { var r = []; for (var i = 0; i < pts.length; i++) r.push(iso(pts[i][0], pts[i][1], z)); return r; }
  function onPX(x, pts) { var r = []; for (var i = 0; i < pts.length; i++) r.push(iso(x, pts[i][0], pts[i][1])); return r; }
  // groups added later sit under earlier ones; this puts a group on top of the layer
  // moving a group invalidates every handle to its siblings, so groups are moved by name and fetched again afterwards
  function toTop(g) { g.moveTo(1); }
  function grp(L, nm) { return L.property("ADBE Root Vectors Group").property(nm); }
  function top(L, nm) { grp(L, nm).moveTo(1); return grp(L, nm); }

  // an object layer anchored at its base point (so a drop lands and a squash stays grounded)
  function objectLayer(comp, name, base, parent) { var L = shapeLayer(comp, name); L.anchorPoint.setValue(base); L.position.setValue(base); L.parent = parent; L.position.setValue(base); return L; }
  // solids arrive by motion, never by alpha: a fall that accelerates, an 18% squash on landing, one small bounce
  function drop(L, base, t, h) { var hh = h || 340; L.inPoint = Math.max(0, t - .26);
    keys(L.position, [[t - .26, [base[0], base[1] - hh]], [t, base]], "exit");
    keys(L.scale, [[t, [100, 100]], [t + .06, [112, 82]], [t + .15, [95, 106]], [t + .25, [100, 100]]], "settle"); }

  // ---- type: Poppins, every label with a ~7 px halo in the ground colour so it reads over any block
  var ALIGNED = [], NOTES = [];
  // the halo is a stroke under the fill; the default "per character" order lets each letter's halo cover the letter before it (an "o" read as
  // a "c"), so the layer's More Options > Fill & Stroke is set to All Fills Over All Strokes (value 2)
  function fillsOver(L) { var mo = L.property("ADBE Text Properties").property("ADBE Text More Options"), p = null, i;
    for (i = 1; i <= mo.numProperties; i++) if (mo.property(i).name.indexOf("Fill") >= 0) p = mo.property(i);
    if (!p) { if (!NOTES.length) { var n = []; for (i = 1; i <= mo.numProperties; i++) n.push(mo.property(i).matchName + "=" + mo.property(i).name); NOTES.push("no Fill & Stroke option in " + n.join(", ")); } return; }
    p.setValue(2); }
  function tx(comp, name, str, style, size, color, o) { o = o || {};
    var L = AESLib.text(comp, name, str, { family: FAM, style: style, size: size, color: color, just: "left", tracking: o.track || 0 });
    if (o.halo !== false) { var sp = L.property("Source Text"), td = sp.value; td.applyStroke = true; td.strokeColor = o.haloColor || GROUND; td.strokeWidth = o.haloW || 14; td.strokeOverFill = false; sp.setValue(td); fillsOver(L); }
    if (o.parent) L.parent = o.parent;
    var r = L.sourceRectAtTime(0, false), ax = r.left;
    if (o.align === "right") ax = r.left + r.width; else if (o.align === "center") ax = r.left + r.width / 2;
    L.anchorPoint.setValue([ax, 0]); L.position.setValue([o.x || 0, o.y || 0]); if (o.align === "right" || o.align === "center") ALIGNED.push([L, o.align]);
    if (o.t0 !== undefined) L.inPoint = o.t0; if (o.t1 !== undefined) L.outPoint = o.t1; return L; }
  function realign() { for (var i = 0; i < ALIGNED.length; i++) { var L = ALIGNED[i][0], r = L.sourceRectAtTime(L.inPoint + .5, false), ax = r.left + r.width / 2;
    if (ALIGNED[i][1] === "right") ax = r.left + r.width; L.anchorPoint.setValue([ax, 0]); } var n = ALIGNED.length; ALIGNED = []; return n; }
  function wid(L) { return L.sourceRectAtTime(0, false).width; }
  // a wipe: a mask whose right edge travels left to right (linear), and an optional wipe out (the left edge follows)
  function wipe(L, t0, t1, e0, e1) { var r = L.sourceRectAtTime(0, false), a = r.left - 18, b = r.left + r.width + 18, tp = r.top - 18, bt = r.top + r.height + 18;
    function box(p, q) { return poly([[p, tp], [q, tp], [q, bt], [p, bt]], true); }
    var mp = L.property("ADBE Mask Parade").addProperty("ADBE Mask Atom").property("ADBE Mask Shape"), list = [[t0, box(a, a)], [t1, box(a, b)]];
    if (e0 !== undefined) list.push([e0, box(a, b)], [e1, box(b, b)]);
    keys(mp, list, "linear"); return L; }

  // ---- a label pin: dot (ink ring, pale fill) -> leader -> rule -> text. Its null sits on a world point and cancels the camera's zoom, so the
  // furniture stays a constant pixel size. o = { dir: 1 right / -1 left, up: true, L, R, title, num, unit, t, out, center, count: [times, strings] }
  function pin(comp, P, nm, wp, o, WORLD) {
    var N = comp.layers.addNull(); N.name = P + "_PIN_" + nm; N.anchorPoint.setValue([0, 0]); N.position.setValue(wp); N.parent = WORLD;
    N.scale.expression = 'var s = thisComp.layer("' + WORLD.name + '").transform.scale[0]; [10000 / s, 10000 / s]';
    var t = o.t, sg = o.up === false ? 1 : -1, ry = sg * o.L, dir = o.dir || 1, R = o.center ? 0 : (o.R || 40), S = shapeLayer(comp, P + "_PINS_" + nm); S.parent = N; S.position.setValue([0, 0]);
    var gd = group(S, "dot"); ellipseIn(gd, 14); fill(gd, PLATE); stroke(gd, INK, 2.6);
    var gl = group(S, "leader"); setPath(gl, poly([[0, 7 * sg], [0, ry]])); stroke(gl, INK, 2.4); var tl = trimIn(gl);
    keys(tl.property("ADBE Vector Trim End"), [[t + .05, 0], [t + .24, 100]], "linear");
    if (!o.center) { var gr = group(S, "rule"); setPath(gr, poly([[0, ry], [dir * R, ry]])); stroke(gr, INK, 2.4); var tr = trimIn(gr);
      keys(tr.property("ADBE Vector Trim End"), [[t + .24, 0], [t + .34, 100]], "linear"); }
    pop(gtr(grp(S, "dot")).property("ADBE Vector Scale"), t, 130, .16); S.inPoint = t;
    var out = { N: N, S: S, texts: [] }, tsize = o.tsize || 42, nsize = o.nsize || 80, usize = Math.round(nsize / 2);
    var titleBase, numBase, x0 = dir * (R + 14);
    if (o.center) { numBase = ry - 22; titleBase = o.num ? numBase - nsize - 6 : numBase; } else { titleBase = ry + 13; numBase = titleBase + nsize + 4; }
    if (o.title) { var TL = tx(comp, P + "_PINT_" + nm, o.title, "SemiBold", tsize, INK, { track: 120, parent: N, x: 0, y: titleBase });
      var tw = wid(TL); if (o.center) TL.position.setValue([-tw / 2, titleBase]); else if (dir < 0) TL.position.setValue([x0 - tw, titleBase]); else TL.position.setValue([x0, titleBase]);
      wipe(TL, t + .26, t + .44, o.out, o.out === undefined ? undefined : o.out + .18); TL.inPoint = t + .24; out.texts.push(TL); out.title = TL; }
    if (o.num) { var NL = tx(comp, P + "_PINN_" + nm, o.num, "Regular", nsize, INK, { parent: N, x: 0, y: numBase }), nw = wid(NL), UL = null, uw = 0;
      if (o.unit) { UL = tx(comp, P + "_PINU_" + nm, o.unit, "Regular", usize, INK, { parent: N, x: 0, y: numBase }); uw = wid(UL); }
      var gap = UL ? 12 : 0, total = nw + gap + uw, nx = x0; if (o.center) nx = -total / 2; else if (dir < 0) nx = x0 - total;
      NL.position.setValue([nx, numBase]); if (UL) UL.position.setValue([nx + nw + gap, numBase]);
      var nt = o.numT === undefined ? t + .38 : o.numT;
      wipe(NL, nt, nt + .24, o.out, o.out === undefined ? undefined : o.out + .18); NL.inPoint = nt - .02; out.texts.push(NL); out.num = NL;
      if (UL) { wipe(UL, nt + .14, nt + .3, o.out, o.out === undefined ? undefined : o.out + .18); UL.inPoint = nt + .12; out.texts.push(UL); out.unit = UL; }
      // a count-up keeps its right edge on the unit: the anchor follows the ink's right edge (the mask was set from the full string)
      if (o.count) { AESLib.textKeys(NL, o.count[0], o.count[1]); NL.anchorPoint.expression = "var r = sourceRectAtTime(time, false); [r.left + r.width, 0]"; NL.position.setValue([nx + nw, numBase]); } }
    if (o.out !== undefined) { var e = o.out; tl = grp(S, "leader").property("ADBE Vectors Group").property("ADBE Vector Filter - Trim"); if (!o.center) tr = grp(S, "rule").property("ADBE Vectors Group").property("ADBE Vector Filter - Trim"); keys(tl.property("ADBE Vector Trim Start"), [[e + .1, 0], [e + .3, 100]], "linear");
      if (tr) keys(tr.property("ADBE Vector Trim Start"), [[e, 0], [e + .1, 100]], "linear");
      keys(gtr(grp(S, "dot")).property("ADBE Vector Scale"), [[e + .26, [100, 100]], [e + .36, [0, 0]]], "exit"); S.outPoint = e + .4;
      for (var q = 0; q < out.texts.length; q++) out.texts[q].outPoint = e + .3; }
    return out; }

  // ---- the subtitle is a map label: a pale card, ink border, a tiny iso cube as legend chip, bottom centre. Border draws first, then the words type on.
  function isoCube(g, c, s, col) { var T = tones(col), h = s * .5, w = s * C30;
    var ft = [[c[0], c[1] - s], [c[0] + w, c[1] - h], [c[0], c[1]], [c[0] - w, c[1] - h]], px = [[c[0], c[1]], [c[0] + w, c[1] - h], [c[0] + w, c[1] + h], [c[0], c[1] + s]],
      py = [[c[0], c[1]], [c[0], c[1] + s], [c[0] - w, c[1] + h], [c[0] - w, c[1] - h]];
    var a = group(g.L, g.nm + "_top"); setPath(a, poly(ft, true)); fill(a, T.top); var b = group(g.L, g.nm + "_px"); setPath(b, poly(px, true)); fill(b, T.px);
    var d = group(g.L, g.nm + "_py"); setPath(d, poly(py, true)); fill(d, T.py); top(g.L, g.nm + "_top"); top(g.L, g.nm + "_px"); top(g.L, g.nm + "_py"); }
  function subtitle(comp, P, i, words, t0, t1, Y) { var str = []; for (var w = 0; w < words.length; w++) str.push(words[w].text); var full = str.join(" ");
    var TL = tx(comp, P + "_SUBT" + i, full, "Regular", 46, INK, { halo: false, x: 0, y: Y + 16 }), tw = wid(TL), cw = tw + 128, cx0 = 540 - cw / 2;
    TL.position.setValue([cx0 + 92, Y + 16]); TL.inPoint = t0 + .12; TL.outPoint = t1;
    var ts = [0], ss = [str[0]]; for (var k = 0; k < str.length; k++) { ts.push(Math.max(t0 + .14, words[k].s)); ss.push(str.slice(0, k + 1).join(" ")); } AESLib.textKeys(TL, ts, ss);
    var C = shapeLayer(comp, P + "_SUBC" + i), gf = group(C, "fill"), rf = contents(gf).addProperty("ADBE Vector Shape - Rect");
    rf.property("ADBE Vector Rect Size").setValue([cw, 88]); rf.property("ADBE Vector Rect Position").setValue([540, Y]); rf.property("ADBE Vector Rect Roundness").setValue(10); fill(gf, PLATE);
    var gb = group(C, "border"), rb = contents(gb).addProperty("ADBE Vector Shape - Rect"); rb.property("ADBE Vector Rect Size").setValue([cw, 88]); rb.property("ADBE Vector Rect Position").setValue([540, Y]);
    rb.property("ADBE Vector Rect Roundness").setValue(10); stroke(gb, INK, 2.4); var tb = trimIn(gb); keys(tb.property("ADBE Vector Trim End"), [[t0, 0], [t0 + .2, 100]], "linear");
    keys(gtr(grp(C, "fill")).property("ADBE Vector Group Opacity"), [[t0 + .04, 0], [t0 + .16, 100]], "linear"); top(C, "border");
    isoCube({ L: C, nm: "chip" }, [cx0 + 48, Y - 2], 17, HUE.frame); C.inPoint = t0; C.outPoint = t1; TL.moveBefore(C);
    // on exit the label slides down 8 px and fades
    keys(C.position, [[t1 - .14, [0, 0]], [t1, [0, 8]]], "linear"); keys(C.opacity, [[t1 - .14, 100], [t1, 0]], "linear");
    keys(TL.position, [[t1 - .14, [cx0 + 92, Y + 16]], [t1, [cx0 + 92, Y + 24]]], "linear"); keys(TL.opacity, [[t1 - .14, 100], [t1, 0]], "linear");
    return [C, TL]; }

  // ---- the camera: a world null (anchor 0, 0). Each key holds a world point c (rest coordinates), a zoom z and the screen point T it sits on.
  // Baked per frame with a log-interpolated zoom: z = exp(lerp(log z0, log z1, u)), so a pull-out feels the same at every scale.
  function shape01(u, e) { if (e === "out") return 1 - Math.pow(1 - u, 3); if (e === "in") return u * u * u; return u * u * u * (u * (u * 6 - 15) + 10); }
  function camera(WORLD, ks, fps, dur) { var T = [], Pp = [], Sc = [];
    for (var f = 0; f <= Math.round(dur * fps); f++) { var t = f / fps, i = 0; while (i < ks.length - 2 && t >= ks[i + 1].t) i++;
      var a = ks[i], b = ks[i + 1], u = (t - a.t) / (b.t - a.t); if (u < 0) u = 0; if (u > 1) u = 1; u = shape01(u, b.e);
      var z = Math.exp(Math.log(a.z) + (Math.log(b.z) - Math.log(a.z)) * u), c = [a.c[0] + (b.c[0] - a.c[0]) * u, a.c[1] + (b.c[1] - a.c[1]) * u],
        s = [a.T[0] + (b.T[0] - a.T[0]) * u, a.T[1] + (b.T[1] - a.T[1]) * u];
      T.push(t); Pp.push([s[0] - z * c[0], s[1] - z * c[1]]); Sc.push([100 * z, 100 * z]); }
    WORLD.position.setValuesAtTimes(T, Pp); WORLD.scale.setValuesAtTimes(T, Sc);
    var dim = WORLD.position.value.length, zz = dim === 3 ? [0, 0, 0] : [0, 0];
    for (var k = 1; k <= WORLD.position.numKeys; k++) { WORLD.position.setInterpolationTypeAtKey(k, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR); WORLD.position.setSpatialTangentsAtKey(k, zz, zz);
      WORLD.scale.setInterpolationTypeAtKey(k, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR); }
    return T.length; }

  function wordsIn(list, t0, t1) { var r = []; for (var i = 0; i < list.length; i++) if (list[i].s >= t0 - .05 && list[i].s < t1 - .02) r.push(list[i]); return r; }
  function clearOwned(comp, prefix) { AESLib.clearOwned(comp, prefix); }

  // buildScene: the shared test scene as one diorama. A board slides in under the title; three stations (person, document, device) drop along a
  // route; a leader grows from the device's screen into a circular inset that plays the real clip; the inset folds back while 34 coral cubes
  // (one per 10 frames, the last one 8/10 high) fill an Isotype grid and the count runs to 338; everything but the device greys while each spoken
  // word is typed on its screen; the inset re-opens and rides a route line to the end station; a fast log pull-out ends on the legend.
  var STAGE = "";
  function buildScene(comp, scene, opts) { try { return build(comp, scene, opts); } catch (e) { throw new Error(STAGE + ": " + e.toString() + " (module line " + e.line + ")"); } }
  function build(comp, scene, opts) {
    fontOK(); ALIGNED = []; NOTES = []; var P = opts.prefix || "ISOINF", B = scene.beat, W = comp.width, H = comp.height, WL = scene.wordList, notes = [], i;
    clearOwned(comp, P);
    var bg = comp.layers.addSolid(GROUND, P + "_GROUND", W, H, 1);
    var WORLD = comp.layers.addNull(); WORLD.name = P + "_WORLD"; WORLD.anchorPoint.setValue([0, 0]); WORLD.position.setValue([0, 0]);
    // the faint isometric dot lattice on the ground (world space, so it pans and zooms with the board)
    STAGE = "s1";
    var lat = shapeLayer(comp, P + "_LATTICE"), lg = group(lat, "dot"); ellipseIn(lg, 4.4, iso(-20, -20, 0)); fill(lg, LATTICE);
    var rp1 = lat.property("ADBE Root Vectors Group").addProperty("ADBE Vector Filter - Repeater"); rp1.property("ADBE Vector Repeater Copies").setValue(64);
    rp1.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([C30 * K, K / 2]);
    var rp2 = lat.property("ADBE Root Vectors Group").addProperty("ADBE Vector Filter - Repeater"); rp2.property("ADBE Vector Repeater Copies").setValue(64);
    rp2.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([-C30 * K, K / 2]); lat.parent = WORLD;
    // ===== the board: a 12 x 12 plinth whose front faces show the strata (land, soil, rock), on a soft blurred shadow
    STAGE = "s2";
    var bc = iso(12, 12, -1.2), shadow = shapeLayer(comp, P + "_SHADOW"), sh = group(shadow, "s");
    setPath(sh, poly([iso(-.2, -.2, -1.2), iso(12.6, -.2, -1.2), iso(12.6, 12.6, -1.2), iso(-.2, 12.6, -1.2)], true)); fill(sh, INK);
    shadow.position.setValue([0, 34]); shadow.opacity.setValue(0); shadow.parent = WORLD;
    try { shadow.property("ADBE Effect Parade").addProperty("ADBE Gaussian Blur 2").property("Blurriness").setValue(46); } catch (e) { notes.push("shadow blur skipped: " + e.toString()); }
    keys(shadow.opacity, [[.2, 0], [.5, 22]], "linear");
    var board = objectLayer(comp, P + "_BOARD", bc, WORLD);
    solids(board, [{ nm: "rock", x: 0, y: 0, z: -1.2, w: 12, d: 12, h: .5, c: HUE.rock }, { nm: "soil", x: 0, y: 0, z: -.7, w: 12, d: 12, h: .52, c: HUE.soil },
      { nm: "land", x: 0, y: 0, z: -.18, w: 12, d: 12, h: .18, c: HUE.land }]);
    keys(board.position, [[0, [bc[0], bc[1] + 520]], [.42, bc]], "settle");
    keys(board.scale, [[.42, [100, 100]], [.5, [103, 95]], [.62, [100, 100]]], "settle");
    // ===== the routes (dashed ink on the land, drawn slightly ahead of whatever they lead) and the station plates
    STAGE = "s3";
    var PIC = B.picture, pw = wordsIn(WL, PIC.t0, PIC.t1), tP = pw[0] ? pw[0].s + .05 : PIC.t0 + .05, tD = pw[1] ? pw[1].s + .02 : tP + .3, tV = pw[2] ? pw[2].s + .02 : tD + .3;
    var ST = { person: [3.5, 9.5], document: [6.5, 6.5], device: [9.5, 3.5], grid: [3.2, 3.2], end: [10.5, 10.5] };
    function route(nm, pts, t0, t1) { var L = shapeLayer(comp, P + "_ROUTE_" + nm), g = group(L, "r"), w = []; for (var q = 0; q < pts.length; q++) w.push(iso(pts[q][0], pts[q][1], .005));
      setPath(g, poly(w)); stroke(g, INK, 2.6, [10, 7]); var tr = trimIn(g); keys(tr.property("ADBE Vector Trim End"), [[t0, 0], [t1, 100]], "linear"); L.inPoint = t0; L.parent = WORLD; return L; }
    route("pic", [[1.2, 11.2], [1.2, 9.5], [3.5, 9.5], [3.5, 6.5], [6.5, 6.5], [6.5, 3.5], [9.5, 3.5]], tP - .3, tV - .02);
    var CAR = B.carry, cw = wordsIn(WL, CAR.t0, CAR.t1), tGo = CAR.t0 + .3, tLand = cw.length ? Math.min(CAR.t1 - .12, cw[cw.length - 1].s + .1) : CAR.t1 - .15;
    route("carry", [[10.6, 3.5], [11.05, 3.5], [11.05, 10.5], [10.5, 10.5]], tGo - .08, tLand - .1);
    function plate(nm, c, s, t, accent) { var L = objectLayer(comp, P + "_PLATE_" + nm, iso(c[0], c[1], 0), WORLD), x = c[0] - s / 2, y = c[1] - s / 2;
      solids(L, [{ nm: "plate", x: x, y: y, z: 0, w: s, d: s, h: .06, c: PLATE }]);
      var g = group(L, "outline"); setPath(g, poly(onTop([[x + .12, y + .12], [x + s - .12, y + .12], [x + s - .12, y + s - .12], [x + .12, y + s - .12]], .061), true)); stroke(g, INK, 2, [8, 6]); toTop(g);
      if (accent) { var a = s * .3; solids(L, [{ nm: "accent", x: c[0] - a / 2, y: c[1] - a / 2, z: .06, w: a, d: a, h: .05, c: accent }]); var gs = L.property("ADBE Root Vectors Group");
        for (var q = gs.numProperties; q >= 1; q--) if (gs.property(q).name.indexOf("accent") === 0) gs.property(q).moveTo(1); }
      pop(L.scale, t, 108, .22); L.inPoint = t; return L; }
    plate("grid", ST.grid, 5.6, B.number.t0 + .02);
    plate("person", ST.person, 2.2, tP - .16); plate("document", ST.document, 2.4, tD - .16); plate("device", ST.device, 2.4, tV - .16);
    var endPlate = plate("end", ST.end, 1.9, CAR.t0 + .02, HUE.frame);
    // ===== the Isotype count: one coral cube per 10 frames (338 = 33 cubes and one 8/10 high), arriving faster and faster
    STAGE = "s4";
    var NU = B.number, NF = NU.value, per = 10, NC = Math.ceil(NF / per), cs = .62, pitch = .86, gx0 = ST.grid[0] - 2.5 * pitch - cs / 2, gy0 = ST.grid[1] - 2.5 * pitch - cs / 2;
    var cubes = [], c0 = NU.t0 + .32, cT = 1.05, cnt = [[0], ["0"]];
    for (i = 0; i < NC; i++) { var col = i % 6, row = Math.floor(i / 6), last = (i === NC - 1) && (NF % per), hgt = last ? cs * (NF % per) / per : cs;
      cubes.push({ i: i, x: gx0 + col * pitch, y: gy0 + row * pitch, h: hgt, t: c0 + cT * Math.sqrt((i + 1) / NC) - cT * Math.sqrt(1 / NC) }); }
    var order = cubes.slice(0); order.sort(function (a, b) { return (a.x + a.y) - (b.x + b.y); });
    for (i = 0; i < order.length; i++) { var cb = order[i], base = iso(cb.x + cs / 2, cb.y + cs / 2, .06), CL = objectLayer(comp, P + "_CUBE" + cb.i, base, WORLD);
      solids(CL, [{ nm: "cube", x: cb.x, y: cb.y, z: .06, w: cs, d: cs, h: cb.h, c: HUE.frame }]); pop(CL.scale, cb.t, 120, .2); CL.inPoint = cb.t; }
    for (i = 0; i < cubes.length; i++) { cnt[0].push(cubes[i].t); cnt[1].push(String(Math.min(NF, (i + 1) * per))); }
    // ===== the stations: a document (a mustard folder with a paper sheet), a person billboard, the device (a monitor on a stand)
    STAGE = "s5";
    var dB = iso(ST.document[0], ST.document[1], .06), DOC = objectLayer(comp, P + "_DOCUMENT", dB, WORLD), dx = ST.document[0] - .8, dy = ST.document[1] - .6;
    solids(DOC, [{ nm: "folder", x: dx, y: dy, z: .06, w: 1.6, d: 1.2, h: .1, c: HUE.document }, { nm: "sheet", x: dx + .14, y: dy + .1, z: .16, w: 1.3, d: .98, h: .05, c: HUE.paper, bias: .2 }]);
    var hb = group(DOC, "header"); setPath(hb, poly(onTop([[dx + .26, dy + .2], [dx + .66, dy + .2], [dx + .66, dy + .9], [dx + .26, dy + .9]], .211), true)); fill(hb, HUE.frame); toTop(hb);
    for (i = 0; i < 4; i++) { var ly = dy + .24 + i * .2, lgp = group(DOC, "line" + i); setPath(lgp, poly(onTop([[dx + .8, ly], [dx + 1.3 - (i % 2) * .18, ly]], .211))); stroke(lgp, mix(HUE.paper, INK, .45), 3); toTop(lgp); }
    drop(DOC, dB, tD);
    // the person: a minimal billboard (round head, tapered two-tone body, a thick arm stroke, hair for identity, no face)
    STAGE = "s6";
    var pB = iso(ST.person[0], ST.person[1], .06), PER = objectLayer(comp, P + "_PERSON", pB, WORLD), u = K * 1.25, PT = tones(HUE.person), bx = pB[0], by = pB[1];
    var shd = group(PER, "shadow"); ellipseIn(shd, u * .9, [bx, by]); fill(shd, INK); gtr(shd).property("ADBE Vector Anchor").setValue([bx, by]); gtr(shd).property("ADBE Vector Position").setValue([bx, by]); gtr(shd).property("ADBE Vector Scale").setValue([100, 45]); gtr(shd).property("ADBE Vector Group Opacity").setValue(18);
    var bl = group(PER, "bodyL"); setPath(bl, poly([[bx - u * .34, by], [bx, by], [bx, by - u * 1.25], [bx - u * .24, by - u * 1.25]], true)); fill(bl, PT.py);
    var br = group(PER, "bodyR"); setPath(br, poly([[bx, by], [bx + u * .34, by], [bx + u * .24, by - u * 1.25], [bx, by - u * 1.25]], true)); fill(br, PT.px);
    var hd = group(PER, "head"); ellipseIn(hd, u * .5, [bx, by - u * 1.55]); fill(hd, hex("E8B48F"));
    var hr = group(PER, "hair"); setPath(hr, (function () { var s = new Shape(), r = u * .27, cx = bx, cy = by - u * 1.6, k = r * .5523;
      s.vertices = [[cx - r, cy], [cx, cy - r], [cx + r, cy], [cx, cy - r * .35]]; s.inTangents = [[0, 0], [-k, 0], [0, -k], [r * .5, 0]]; s.outTangents = [[0, -k], [k, 0], [-r * .5, 0], [0, 0]]; s.closed = true; return s; })()); fill(hr, INK);
    var arm = group(PER, "arm"); setPath(arm, poly([[bx + u * .2, by - u * 1.1], [bx + u * .52, by - u * .62]])); stroke(arm, PT.px, u * .14); top(PER, "arm"); top(PER, "head"); top(PER, "hair"); grp(PER, "shadow").moveTo(grp(PER, "shadow").parentProperty.numProperties);
    drop(PER, pB, tP);
    // after the landing the arm waves (the person performs), stepping at 12 fps
    STAGE = "s7";
    var ap = grp(PER, "arm").property("ADBE Vectors Group").property(1).property("ADBE Vector Shape"), wv = [];
    for (i = 0; i < 6; i++) wv.push([tP + .32 + i / 12, poly([[bx + u * .2, by - u * 1.1], i % 2 ? [bx + u * .56, by - u * 1.62] : [bx + u * .62, by - u * 1.5]])]);
    wv.push([tP + .32 + 6 / 12, poly([[bx + u * .2, by - u * 1.1], [bx + u * .52, by - u * .62]])]); keys(ap, wv, "hold");
    // ===== focus + context: everything under this greys toward warm grey while the device keeps its colour
    STAGE = "s8";
    var ADJ = comp.layers.addSolid([1, 1, 1], P + "_FOCUS", W, H, 1); ADJ.adjustmentLayer = true; var tf = ADJ.property("ADBE Effect Parade").addProperty("ADBE Tint");
    tf.property("Map Black To").setValue(mix(INK, GROUND, .35)); tf.property("Map White To").setValue(WARM);
    var LN = B.line; keys(ADJ.opacity, [[LN.t0 - .02, 0], [LN.t0 + .22, 82], [LN.t1 - .12, 82], [LN.t1 + .14, 0]], "linear"); ADJ.inPoint = LN.t0 - .05; ADJ.outPoint = LN.t1 + .2;
    // the device: foot, neck, slab; the screen and its content sit on the slab's +x face
    STAGE = "s9";
    var vB = iso(ST.device[0], ST.device[1], .06), DEV = objectLayer(comp, P + "_DEVICE", vB, WORLD), sx = 9.56, DT = tones(HUE.device);
    var lines = [], LW = wordsIn(WL, LN.t0, LN.t1), rowY = 4.18, rowZ = 1.46, typ = [];
    for (i = 0; i < LW.length; i++) { var len = .12 + LW[i].text.length * .085; if (rowY - len < 2.86) { rowY = 4.18; rowZ -= .2; }
      lines.push({ a: [rowY, rowZ], b: [rowY - len, rowZ], t0: LW[i].s, t1: Math.max(LW[i].s + .06, LW[i].e - .02) }); rowY -= len + .1; }
    for (i = lines.length - 1; i >= 0; i--) { var gt = group(DEV, "type" + i); setPath(gt, poly(onPX(sx + .005, [lines[i].a, lines[i].b]))); stroke(gt, HUE.type, 5); typ.push(trimIn(gt)); }
    var vid = group(DEV, "video"); setPath(vid, poly(onPX(sx + .004, [[3.0, .78], [4.0, .78], [4.0, 1.5], [3.0, 1.5]]), true)); fill(vid, HUE.frame);
    var vtri = group(DEV, "play");
    setPath(vtri, poly(onPX(sx + .006, [[3.62, .94], [3.62, 1.34], [3.34, 1.14]]), true)); fill(vtri, WARM);
    var scr = group(DEV, "screen"); setPath(scr, poly(onPX(sx + .002, [[2.74, .62], [4.26, .62], [4.26, 1.66], [2.74, 1.66]]), true)); fill(scr, HUE.screen);
    solids(DEV, [{ nm: "slab", x: 9.3, y: 2.6, z: .5, w: .26, d: 1.8, h: 1.25, c: HUE.device, bias: 2 }, { nm: "neck", x: 9.36, y: 3.4, z: .14, w: .14, d: .2, h: .4, c: HUE.device, bias: -1 },
      { nm: "foot", x: 9.0, y: 3.05, z: .06, w: .9, d: .9, h: .08, c: HUE.device, bias: -2 }]);
    // final order, top first: typed lines, play, video, screen, then the solids
    STAGE = "s10";
    var RV = DEV.property("ADBE Root Vectors Group");
    RV.property("screen").moveTo(1); RV.property("video").moveTo(1); RV.property("play").moveTo(1); for (i = 0; i < lines.length; i++) RV.property("type" + i).moveTo(1);
    drop(DEV, vB, tV);
    for (i = 0; i < lines.length; i++) keys(RV.property("type" + i).property("ADBE Vectors Group").property("ADBE Vector Filter - Trim").property("ADBE Vector Trim End"), [[lines[i].t0, 0], [lines[i].t1, 100]], "linear");
    keys(gtr(RV.property("video")).property("ADBE Vector Group Opacity"), [[LN.t0 - .02, 100], [LN.t0 + .1, 0]], "hold");
    keys(gtr(RV.property("play")).property("ADBE Vector Group Opacity"), [[LN.t0 - .02, 100], [LN.t0 + .1, 0]], "hold");
    // ===== the inset: a leader grows from the device's screen into a circle that plays the real clip. It folds back for the count and re-opens
    STAGE = "s11";
    // for the carry, riding the route to the end station with a dashed "you are here" ring.
    STAGE = "s12";
    var IN = B.input, scrP = iso(sx, 3.5, 1.13), tOpen = IN.t0 + .32, IC = [-150, -320], IR = 200;
    var OUT = comp.layers.addNull(); OUT.name = P + "_INSET"; OUT.anchorPoint.setValue([0, 0]); OUT.position.setValue(scrP); OUT.parent = WORLD;
    OUT.scale.expression = 'var s = thisComp.layer("' + WORLD.name + '").transform.scale[0]; [10000 / s, 10000 / s]';
    var INN = comp.layers.addNull(); INN.name = P + "_INSETK"; INN.anchorPoint.setValue([0, 0]); INN.parent = OUT; INN.position.setValue([0, 0]);
    keys(INN.scale, [[0, [100, 100]], [CAR.t0 - .1, [62, 62]]], "hold");
    var CEN = comp.layers.addNull(); CEN.name = P + "_INSETC"; CEN.anchorPoint.setValue([0, 0]); CEN.parent = INN; CEN.position.setValue(IC);
    var cl = Math.sqrt(IC[0] * IC[0] + IC[1] * IC[1]), edge = [IC[0] - IC[0] / cl * IR, IC[1] - IC[1] / cl * IR];
    // for the carry the circle floats up and to the right of the subject instead (clear of the stations in front of the board)
    var IC2 = [150, -320], edge2 = [IC2[0] - IC2[0] / cl * IR, IC2[1] - IC2[1] / cl * IR];
    keys(CEN.position, [[0, IC], [CAR.t0, IC2]], "hold");
    var LD = shapeLayer(comp, P + "_INSETLEAD"); LD.parent = INN; LD.position.setValue([0, 0]); var gld = group(LD, "leader"); setPath(gld, poly([[0, 0], edge])); stroke(gld, INK, 2.6); trimIn(gld);
    keys(grp(LD, "leader").property("ADBE Vectors Group").property(1).property("ADBE Vector Shape"), [[0, poly([[0, 0], edge])], [CAR.t0, poly([[0, 0], edge2])]], "hold");
    var gdt = group(LD, "dot"); ellipseIn(gdt, 14); fill(gdt, PLATE); stroke(gdt, INK, 2.6);
    var tlead, NUt = B.number.t0; top(LD, "dot"); gdt = grp(LD, "dot"); tlead = grp(LD, "leader").property("ADBE Vectors Group").property("ADBE Vector Filter - Trim");
    keys(tlead.property("ADBE Vector Trim End"), [[IN.t0 + .08, 0], [tOpen, 100], [NUt + .16, 100], [NUt + .3, 0], [CAR.t0 + .02, 0], [CAR.t0 + .18, 100]], "linear");
    keys(gtr(gdt).property("ADBE Vector Scale"), [[IN.t0, [0, 0]], [IN.t0 + .08, [130, 130]], [IN.t0 + .16, [100, 100]], [NUt + .26, [100, 100]], [NUt + .34, [0, 0]], [CAR.t0, [0, 0]], [CAR.t0 + .08, [130, 130]], [CAR.t0 + .16, [100, 100]]], "settle");
    LD.inPoint = IN.t0;
    keys(CEN.scale, [[tOpen, [0, 0]], [tOpen + .13, [112, 112]], [tOpen + .24, [100, 100]], [NUt, [100, 100]], [NUt + .2, [0, 0]], [CAR.t0 + .14, [0, 0]], [CAR.t0 + .27, [112, 112]], [CAR.t0 + .38, [100, 100]], [tLand, [100, 100]], [tLand + .3, [72, 72]]], "settle");
    var halo = shapeLayer(comp, P + "_INSETHALO"); halo.parent = CEN; halo.position.setValue([0, 0]); var gh = group(halo, "h"); ellipseIn(gh, IR * 2 + 22); fill(gh, GROUND);
    var clip = comp.layers.add(AESLib.importFile(scene.clip)); clip.name = P + "_INSETCLIP"; clip.parent = CEN; clip.anchorPoint.setValue([545, 1470]); clip.position.setValue([0, 0]);
    var csc = .62; clip.scale.setValue([csc * 100, csc * 100]);
    clip.property("ADBE Mask Parade").addProperty("ADBE Mask Atom").property("ADBE Mask Shape").setValue(circleShape([545, 1470], IR / csc));
    clip.timeRemapEnabled = true; var trm = clip.property("ADBE Time Remapping"); if (trm.numKeys > 1) trm.removeKey(trm.numKeys); var cS = IN.clipStart, cE = IN.clipEnd, rest = scene.duration - CAR.t0;
    keys(trm, [[0, cS], [tOpen, cS], [tOpen + (cE - cS), cE], [CAR.t0, cE], [scene.duration, cE + rest]], "linear"); clip.inPoint = tOpen - .02; clip.outPoint = scene.duration;
    var ring = shapeLayer(comp, P + "_INSETRING"); ring.parent = CEN; ring.position.setValue([0, 0]); var grg = group(ring, "r"); ellipseIn(grg, IR * 2); stroke(grg, INK, 3.4);
    var trk = group(ring, "track"); ellipseIn(trk, IR * 2 + 64); stroke(trk, HUE.frame, 4, [14, 12]);
    keys(gtr(trk).property("ADBE Vector Group Opacity"), [[0, 0], [CAR.t0 + .3, 0], [CAR.t0 + .4, 100], [B.end.t0 + .2, 100], [B.end.t0 + .4, 0]], "linear");
    keys(gtr(trk).property("ADBE Vector Rotation"), [[CAR.t0 + .3, 0], [B.end.t0 + .4, 160]], "linear");
    var ilab = tx(comp, P + "_INSETLAB", "FRAME 135 OF " + NF, "SemiBold", 32, INK, { track: 120, parent: CEN, x: 0, y: -IR - 20 }); ilab.position.setValue([-wid(ilab) / 2, -IR - 20]);
    wipe(ilab, tOpen + .2, tOpen + .4); ilab.inPoint = tOpen + .18;
    // the carry: the inset rides the route (the line is drawn a step ahead) and lands on the end plate, which squashes under it
    STAGE = "s13";
    var rP = [scrP, iso(10.6, 3.5, .3), iso(11.05, 3.5, 0), iso(11.05, 10.5, 0), iso(10.5, 10.5, .06)], seg = [0], tot = 0;
    for (i = 1; i < rP.length; i++) { tot += Math.sqrt(Math.pow(rP[i][0] - rP[i - 1][0], 2) + Math.pow(rP[i][1] - rP[i - 1][1], 2)); seg.push(tot); }
    var ride = [[tGo, scrP]]; for (i = 1; i < rP.length; i++) ride.push([tGo + (tLand - tGo) * seg[i] / tot, rP[i]]);
    keys(OUT.position, ride, "linear"); var e0 = OUT.position.nearestKeyIndex(tGo), e1 = OUT.position.nearestKeyIndex(tLand);
    OUT.position.setTemporalEaseAtKey(e0, [new KeyframeEase(0, 60)], [new KeyframeEase(0, 60)]); OUT.position.setTemporalEaseAtKey(e1, [new KeyframeEase(0, 70)], [new KeyframeEase(0, 70)]);
    OUT.position.setInterpolationTypeAtKey(e0, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER); OUT.position.setInterpolationTypeAtKey(e1, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
    keys(endPlate.scale, [[CAR.t0 + .02, [0, 0]], [CAR.t0 + .14, [108, 108]], [CAR.t0 + .24, [100, 100]], [tLand, [100, 100]], [tLand + .06, [110, 84]], [tLand + .16, [96, 104]], [tLand + .26, [100, 100]]], "settle");
    // ===== the label pins (constant pixel size; leaders grow before the text)
    STAGE = "s14";
    var TI = B.title, tw0 = wordsIn(WL, TI.t0, TI.t1), heroT = tw0.length > 2 ? tw0[2].s : TI.t0 + .4;
    pin(comp, P, "TITLE", iso(6, 6, 0), { center: true, L: 300, t: .3, title: TI.context.toUpperCase(), num: TI.hero, nsize: 84, tsize: 48, numT: heroT, out: PIC.t0 - .02 }, WORLD);
    pin(comp, P, "PERSON", iso(ST.person[0], ST.person[1], 2.6), { dir: -1, L: 96, R: 34, t: tP + .28, title: PIC.objects[0].toUpperCase(), num: "1", unit: "of 3", nsize: 70 }, WORLD);
    pin(comp, P, "DOCUMENT", iso(5.55, 7.45, .06), { dir: -1, up: false, L: 84, R: 30, t: tD + .28, title: PIC.objects[1].toUpperCase(), num: "2", unit: "of 3", nsize: 70 }, WORLD);
    pin(comp, P, "DEVICE", iso(9.43, 2.7, 1.75), { dir: 1, L: 96, R: 30, t: tV + .28, title: PIC.objects[2].toUpperCase(), num: "3", unit: "of 3", nsize: 70 }, WORLD);
    var full = String(NF);
    pin(comp, P, "COUNT", iso(gx0 + .3, gy0 + .3, .7), { center: true, L: 150, t: NU.t0 + .12, title: "COUNTED", num: full, nsize: 92, unit: NU.label, numT: NU.t0 + .26, count: cnt }, WORLD);
    // ===== subtitles: map-label cards, one per spoken line (the end line becomes the legend's title instead)
    STAGE = "s15";
    var subY = 1700, beats = scene.beats;
    for (i = 1; i < beats.length - 1; i++) subtitle(comp, P, i, wordsIn(WL, beats[i].t0, beats[i].t1), beats[i].t0, beats[i].t1, subY);
    // ===== the end frame is the legend: title, the total, the Isotype key, NOT TO SCALE (screen space, slides up, border first)
    STAGE = "s16";
    var EN = B.end, ew = wordsIn(WL, EN.t0, EN.t1), lt = EN.t0 + .1, cx = 540, cyc = 1420, lw = 900, lh = 400, lx = cx - lw / 2, ly = cyc - lh / 2;
    var LG = comp.layers.addNull(); LG.name = P + "_LEGEND"; LG.anchorPoint.setValue([cx, cyc]); LG.position.setValue([cx, cyc]);
    keys(LG.position, [[lt, [cx, cyc + 60]], [lt + .32, [cx, cyc]]], "settle");
    var LC = shapeLayer(comp, P + "_LEGCARD"); LC.parent = LG; LC.position.setValue([0, 0]);
    var lf = group(LC, "fill"), lrf = contents(lf).addProperty("ADBE Vector Shape - Rect"); lrf.property("ADBE Vector Rect Size").setValue([lw, lh]); lrf.property("ADBE Vector Rect Position").setValue([cx, cyc]);
    lrf.property("ADBE Vector Rect Roundness").setValue(16); fill(lf, PLATE); keys(gtr(lf).property("ADBE Vector Group Opacity"), [[lt + .04, 0], [lt + .2, 100]], "linear");
    var lb = group(LC, "border"), lrb = contents(lb).addProperty("ADBE Vector Shape - Rect"); lrb.property("ADBE Vector Rect Size").setValue([lw, lh]); lrb.property("ADBE Vector Rect Position").setValue([cx, cyc]);
    lrb.property("ADBE Vector Rect Roundness").setValue(16); stroke(lb, INK, 2.6); keys(trimIn(lb).property("ADBE Vector Trim End"), [[lt, 0], [lt + .3, 100]], "linear"); top(LC, "border");
    var lr = group(LC, "rule"); setPath(lr, poly([[lx + 44, ly + 156], [lx + lw - 44, ly + 156]])); stroke(lr, INK, 2); keys(trimIn(lr).property("ADBE Vector Trim End"), [[lt + .3, 0], [lt + .55, 100]], "linear"); top(LC, "rule");
    LC.inPoint = lt;
    var endStr = EN.text.toUpperCase(), ewords = endStr.split(" "), LT = tx(comp, P + "_LEGTITLE", endStr, "SemiBold", 60, INK, { track: 90, halo: false, parent: LG, x: lx + 44, y: ly + 88 });
    var lts = [0], lss = [ewords[0]]; for (i = 0; i < ewords.length; i++) { lts.push(Math.max(lt + .12, ew[i] ? ew[i].s : lt + .2 * i)); lss.push(ewords.slice(0, i + 1).join(" ")); } AESLib.textKeys(LT, lts, lss); LT.inPoint = lt + .1;
    var LS = tx(comp, P + "_LEGSUB", "Isometric infographic, one shared scene", "Regular", 30, HUE.frame, { halo: false, parent: LG, x: lx + 46, y: ly + 132 }); wipe(LS, lt + .3, lt + .55); LS.inPoint = lt + .28;
    var LTO = tx(comp, P + "_LEGTOTAL", "TOTAL", "SemiBold", 26, INK, { track: 160, halo: false, parent: LG, x: lx + 46, y: ly + 204 }); wipe(LTO, lt + .45, lt + .6); LTO.inPoint = lt + .43;
    var LNS = tx(comp, P + "_LEGNTS", "NOT TO SCALE", "SemiBold", 22, mix(INK, PLATE, .4), { track: 160, halo: false, parent: LG, x: 0, y: ly + 204 }); LNS.position.setValue([lx + lw - 44 - wid(LNS), ly + 204]);
    wipe(LNS, lt + .5, lt + .65); LNS.inPoint = lt + .48;
    var LNN = tx(comp, P + "_LEGNUM", full, "Regular", 84, INK, { halo: false, parent: LG, x: lx + 42, y: ly + 290 }), lnw = wid(LNN); wipe(LNN, lt + .5, lt + .72); LNN.inPoint = lt + .48;
    var LNU = tx(comp, P + "_LEGUNIT", NU.label, "Regular", 40, INK, { halo: false, parent: LG, x: lx + 42 + lnw + 14, y: ly + 290 }); wipe(LNU, lt + .62, lt + .78); LNU.inPoint = lt + .6;
    // the Isotype key: one square per 10 frames, the last one cut to 8/10; they pop left to right, then the key reads "= 10 frames"
    STAGE = "s17";
    var KQ = shapeLayer(comp, P + "_LEGKEY"); KQ.parent = LG; KQ.position.setValue([0, 0]); var kp = (lw - 88) / NC, ks = kp - 5, kt0 = lt + .7;
    for (i = NC - 1; i >= 0; i--) { var kw = ks; if (i === NC - 1 && NF % per) kw = ks * (NF % per) / per; var gk = group(KQ, "k" + i), rk = contents(gk).addProperty("ADBE Vector Shape - Rect");
      rk.property("ADBE Vector Rect Size").setValue([kw, ks]); rk.property("ADBE Vector Rect Position").setValue([lx + 44 + i * kp + kw / 2, ly + 322]); fill(gk, HUE.frame);
      gtr(gk).property("ADBE Vector Anchor").setValue([lx + 44 + i * kp + kw / 2, ly + 322]); gtr(gk).property("ADBE Vector Position").setValue([lx + 44 + i * kp + kw / 2, ly + 322]);
      pop(gtr(gk).property("ADBE Vector Scale"), kt0 + i * .012, 130, .16); }
    KQ.inPoint = kt0;
    var kc = group(KQ, "chip"), rkc = contents(kc).addProperty("ADBE Vector Shape - Rect"); rkc.property("ADBE Vector Rect Size").setValue([ks, ks]); rkc.property("ADBE Vector Rect Position").setValue([lx + 44 + ks / 2, ly + 364]); fill(kc, HUE.frame);
    keys(gtr(kc).property("ADBE Vector Group Opacity"), [[kt0 + .45, 0], [kt0 + .5, 100]], "hold");
    var LK = tx(comp, P + "_LEGKEYT", "= " + per + " frames", "Regular", 26, INK, { halo: false, parent: LG, x: lx + 44 + ks + 12, y: ly + 373 }); wipe(LK, kt0 + .48, kt0 + .62); LK.inPoint = kt0 + .46;
    LG.scale.setValue([110, 110]);   // scaled only now: parenting to a scaled null makes AE compensate each child's scale
    // ===== the camera: wide while the stations accumulate, push to the inset, pan to the count, close on the screen, follow the carry, fast log pull-out
    STAGE = "s18";
    var ctr = [OX, OY - 40], T0 = [540, 900], devC = [scrP[0] - 60, scrP[1] - 120], gridC = iso(ST.grid[0], ST.grid[1], .3), endC = [OX, OY + 10];
    var ks2 = [{ t: 0, c: ctr, z: 1.16, T: T0 }, { t: PIC.t0, c: ctr, z: 1.06, T: T0, e: "out" }, { t: IN.t0, c: ctr, z: 1.06, T: T0 },
      { t: IN.t0 + .5, c: devC, z: 1.36, T: T0 }, { t: NU.t0 + .05, c: devC, z: 1.38, T: T0 }, { t: NU.t0 + .5, c: gridC, z: 1.26, T: [470, 980] },
      { t: LN.t0 - .02, c: gridC, z: 1.32, T: [470, 980] }, { t: LN.t0 + .4, c: [scrP[0] - 8, scrP[1] + 10], z: 2.6, T: [540, 880] }, { t: CAR.t0 + .1, c: [scrP[0] - 8, scrP[1] + 10], z: 2.7, T: [540, 880] }];
    ks2.push({ t: tGo, c: [scrP[0] - 40, scrP[1] - 60], z: 1.5, T: [540, 960] }, { t: tLand, c: [rP[rP.length - 1][0] - 40, rP[rP.length - 1][1] - 110], z: 1.5, T: [540, 960] });
    ks2.push({ t: EN.t0 + .05, c: [rP[rP.length - 1][0] - 40, rP[rP.length - 1][1] - 110], z: 1.5, T: [540, 960] }, { t: EN.t0 + .7, c: endC, z: .98, T: [540, 690], e: "out" }, { t: scene.duration + 1, c: endC, z: .96, T: [540, 690] });
    camera(WORLD, ks2, scene.fps, scene.duration);
    realign();
    for (i = 0; i < NOTES.length; i++) notes.push(NOTES[i]);
    notes.push("subtitle cards hold for their beat only (the scene's beats are shorter than the style's 1.8 s minimum hold)");
    return { layers: comp.numLayers, notes: notes };
  }
  return { FAM: FAM, HUE: HUE, INK: INK, GROUND: GROUND, tones: tones, iso: iso, keys: keys, pop: pop, solids: solids, onTop: onTop, onPX: onPX, pin: pin, subtitle: subtitle,
    camera: camera, drop: drop, wipe: wipe, wordsIn: wordsIn, fontOK: fontOK, clearOwned: clearOwned, buildScene: buildScene };
})();
