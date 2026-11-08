// Microgame frenzy style: brand-neutral ES3 helpers. No project mutation happens at load.
// Read styles/microgame/STYLE.md first. A rapid-fire party-game film: one fixed home look (a flat toon game-show stage with a TV, a host,
// a lives board and a stage badge, thick ink outlines and one hard shadow) and a run of microgames, each a shouted command word, a few
// seconds, one action and one result, each drawn in a completely different medium (crayon, pixel, Swiss type, amber terminal). Games play
// inside the TV; the camera pushes into the screen to start one and shrinks back out to return; everything speeds up as it goes.
// Adapted from Lemo-Opuscar's microgame style (MIT, LemoLab); see assets/LICENSE-lemo-opuscar.txt. Host, hero and games here are our own.
var AESMicrogame = (function () {
  var DISPLAY = "Titan One", ROUND = "Lilita One", PIXEL = "Silkscreen", SWISS = "Inter Tight", MONO = "VT323", HAND = "Caveat";
  function hex(h) { return [parseInt(h.substr(1, 2), 16) / 255, parseInt(h.substr(3, 2), 16) / 255, parseInt(h.substr(5, 2), 16) / 255]; }
  // home palette (the stage only); every medium below brings its own
  var PALETTE = { ground: hex("#2A0F5C"), burst: hex("#3A1680"), ink: hex("#160A2E"), shade: hex("#12082A"), magenta: hex("#FF2E88"), gold: hex("#FFC928"),
    goldLight: hex("#FFE58A"), cyan: hex("#1FD1D1"), violet: hex("#6C2BD9"), plate: hex("#1C0B40"), floor: hex("#1D0A45"), floorLine: hex("#3B1A7E"),
    ok: hex("#2ED15A"), fail: hex("#FF3B3B"), white: [1, 1, 1], cream: hex("#FFF3D6"), hero: hex("#FF4F3F"), helmet: hex("#EEF3FF"), visor: hex("#8FE3F2"), skin: hex("#FFCFA6") };
  var CRAYON = { paper: hex("#F2ECDD"), line: hex("#34304F"), red: hex("#D8432E"), blue: hex("#3A6FC6"), sky: hex("#8EC9EE"), green: hex("#3E9B4B"),
    yellow: hex("#F0B429"), orange: hex("#E9792C"), grey: hex("#9A97A6"), pale: hex("#F6DE86") };
  var PIX = { bg: hex("#15103A"), ground: hex("#3B2C7A"), block: hex("#5A46B0"), star: hex("#C9C2FF"), K: hex("#0E0A22"), W: hex("#F6F3FF"), V: hex("#4FD8F0"),
    C: hex("#FF4F3F"), O: hex("#FFB020"), text: hex("#F6F3FF"), accent: hex("#4FD8F0") };
  var SW = { paper: hex("#F2F0EB"), black: hex("#111111"), hair: hex("#DCD8CF"), red: hex("#E3241B"), grey: hex("#77746D") };
  var TERM = { bg: hex("#0B0703"), amber: hex("#FFB000"), dim: hex("#7A5400") };
  var SCREEN = { x: 230, y: 409, w: 620, h: 1102 };                   // the TV's screen in world px; a game comp (1080 x 1920) fills it at 57.4 %
  function fontOK() { AESLib.font(DISPLAY, "Regular"); AESLib.font(ROUND, "Regular"); AESLib.font(PIXEL, "Regular"); AESLib.font(SWISS, "Bold");
    AESLib.font(MONO, "Regular"); AESLib.font(HAND, "Regular"); return true; }
  function fx(L, m) { return L.property("ADBE Effect Parade").addProperty(m); }
  function c4(c) { return [c[0], c[1], c[2], 1]; }
  function isSpatial(p) { return p.propertyValueType === PropertyValueType.TwoD_SPATIAL || p.propertyValueType === PropertyValueType.ThreeD_SPATIAL; }
  function rng(seed) { var s = seed; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

  // keys in one setValuesAtTimes call. list = [{ t, v, e }], e = "lin" | "hold" | "settle" | "travel" | "snap" | "out"; sorted, one key per 1/60 s.
  // Spatial properties get straight segments (zero tangents), so a held position never loops.
  function keys(prop, list) {
    list.sort(function (a, b) { return a.t - b.t; });
    var ks = [];
    for (var i = 0; i < list.length; i++) { if (ks.length && list[i].t - ks[ks.length - 1].t < 1 / 60) ks[ks.length - 1] = list[i]; else ks.push(list[i]); }
    var ts = [], vs = []; for (var j = 0; j < ks.length; j++) { ts.push(ks[j].t); vs.push(ks[j].v); }
    if (!ts.length) return prop;
    if (!prop) throw new Error("keys: missing property for values " + vs.toSource().substr(0, 80) + " at " + ts.join(","));
    prop.setValuesAtTimes(ts, vs);
    var sp = isSpatial(prop), d = 1, B = KeyframeInterpolationType.BEZIER, LI = KeyframeInterpolationType.LINEAR, HO = KeyframeInterpolationType.HOLD;
    if (!sp && prop.propertyValueType !== PropertyValueType.COLOR && prop.value instanceof Array) d = prop.value.length;
    for (var k = 0; k < ks.length; k++) { var n = prop.nearestKeyIndex(ks[k].t), e = ks[k].e || "lin";
      if (sp) { var z = prop.propertyValueType === PropertyValueType.TwoD_SPATIAL ? [0, 0] : [0, 0, 0]; prop.setSpatialTangentsAtKey(n, z, z); }
      if (e === "hold") { prop.setInterpolationTypeAtKey(n, HO, HO); continue; }
      if (e === "lin") { prop.setInterpolationTypeAtKey(n, LI, LI); continue; }
      var ii = 85, oi = 28;
      if (e === "travel") { ii = 80; oi = 80; } else if (e === "snap") { ii = 90; oi = 60; } else if (e === "out") { ii = 20; oi = 85; }
      var a = [], b = []; for (var q = 0; q < d; q++) { a.push(new KeyframeEase(0, ii)); b.push(new KeyframeEase(0, oi)); }
      prop.setInterpolationTypeAtKey(n, B, B); prop.setTemporalEaseAtKey(n, a, b); }
    return prop; }
  function K(t, v, e) { return { t: t, v: v, e: e }; }
  function span(L, t0, t1) { if (t0 !== undefined && t0 !== null) L.inPoint = t0; if (t1 !== undefined && t1 !== null) L.outPoint = t1; return L; }
  function holdOn(L, list) { var ks = []; for (var i = 0; i < list.length; i++) ks.push(K(list[i][0], list[i][1], "hold")); keys(L.opacity, ks); return L; }

  // ---- shapes. One shape layer from items drawn in order (later on top). item = { k: "rect" | "ell" | "path" | "star", x, y, w, h, r, v (path
  // vertices), closed, fill, op, stroke, sw, cap, pts, ir, or, rot, id, trim }. The layer's anchor and position are both (o.ax, o.ay).
  function addPath(v, it) { var s = new Shape(); s.vertices = it.v; s.closed = it.closed !== false; v.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(s); }
  function shp(comp, name, items, o) { o = o || {}; var L = comp.layers.addShape(); L.name = name; var root = L.property("ADBE Root Vectors Group");
    for (var i = items.length - 1; i >= 0; i--) { var it = items[i], g = root.addProperty("ADBE Vector Group"), v = g.property("ADBE Vectors Group"); if (it.id) g.name = it.id;
      if (it.k === "path") addPath(v, it);
      else if (it.k === "ell") { var e = v.addProperty("ADBE Vector Shape - Ellipse"); e.property("ADBE Vector Ellipse Size").setValue([it.w, it.h]); e.property("ADBE Vector Ellipse Position").setValue([it.x + it.w / 2, it.y + it.h / 2]); }
      else if (it.k === "star") { var st0 = v.addProperty("ADBE Vector Shape - Star"); st0.property("ADBE Vector Star Type").setValue(1); st0.property("ADBE Vector Star Points").setValue(it.pts);
        st0.property("ADBE Vector Star Position").setValue([it.x, it.y]); st0.property("ADBE Vector Star Inner Radius").setValue(it.ir); st0.property("ADBE Vector Star Outer Radius").setValue(it.or);
        if (it.rot) st0.property("ADBE Vector Star Rotation").setValue(it.rot); }
      else { var r = v.addProperty("ADBE Vector Shape - Rect"); r.property("ADBE Vector Rect Size").setValue([it.w, it.h]); r.property("ADBE Vector Rect Position").setValue([it.x + it.w / 2, it.y + it.h / 2]);
        if (it.r) r.property("ADBE Vector Rect Roundness").setValue(it.r); }
      if (it.trim) v.addProperty("ADBE Vector Filter - Trim");
      if (it.stroke) { var sk = v.addProperty("ADBE Vector Graphic - Stroke"); sk.property("ADBE Vector Stroke Color").setValue(it.stroke); sk.property("ADBE Vector Stroke Width").setValue(it.sw || 2);
        if (it.cap !== false) { sk.property("ADBE Vector Stroke Line Cap").setValue(2); sk.property("ADBE Vector Stroke Line Join").setValue(2); } }
      if (it.fill) { var f = v.addProperty("ADBE Vector Graphic - Fill"); f.property("ADBE Vector Fill Color").setValue(it.fill); if (it.op !== undefined) f.property("ADBE Vector Fill Opacity").setValue(it.op); } }
    var ax = o.ax || 0, ay = o.ay || 0; L.anchorPoint.setValue([ax, ay]); L.position.setValue([ax, ay]);
    if (o.parent) L.parent = o.parent; span(L, o.t0, o.t1); return L; }
  function group(L, id) { return L.property("ADBE Root Vectors Group").property(id); }
  function groupTrim(L, id) { return group(L, id).property("ADBE Vectors Group").property("ADBE Vector Filter - Trim"); }
  function copy(it) { var o = {}; for (var k in it) if (it.hasOwnProperty(k)) o[k] = it[k]; return o; }
  function moved(it, dx, dy) { var o = copy(it); if (o.v) { var nv = []; for (var i = 0; i < o.v.length; i++) nv.push([o.v[i][0] + dx, o.v[i][1] + dy]); o.v = nv; }
    if (o.x !== undefined) o.x += dx; if (o.y !== undefined) o.y += dy; return o; }
  // the home look: every filled item gets a thick ink outline and one hard shadow (the same shape in the shade colour, offset down-right)
  function toon(items, o) { o = o || {}; var dx = o.dx === undefined ? 10 : o.dx, dy = o.dy === undefined ? 10 : o.dy, out = [];
    for (var i = 0; i < items.length; i++) { var it = items[i];
      if (it.fill && !it.flat) { var s = moved(it, dx, dy); s.fill = o.shade || PALETTE.shade; s.stroke = null; s.op = 100; s.id = null; out.push(s); }
      var m = copy(it); if (m.fill && !m.flat && m.stroke === undefined) { m.stroke = PALETTE.ink; m.sw = o.sw || 7; } out.push(m); }
    return out; }
  function R(x, y, w, h, fill, r) { return { k: "rect", x: x, y: y, w: w, h: h, fill: fill, r: r }; }
  function E(cx, cy, w, h, fill) { return { k: "ell", x: cx - w / 2, y: cy - h / 2, w: w, h: h, fill: fill }; }
  function Pth(v, fill, closed) { return { k: "path", v: v, fill: fill, closed: closed }; }
  function Ln(v, stroke, sw) { return { k: "path", v: v, closed: false, stroke: stroke, sw: sw }; }

  // ---- type. txt() is AESLib.text plus an optional outline (o.stroke, o.sw) and anchoring on the ink rect (o.anchor "center" | "baseline").
  function txt(comp, name, str, o) { var L = AESLib.text(comp, name, str, { family: o.family, style: o.style || "Regular", size: o.size, color: o.color, just: o.just || "center",
      leading: o.leading, tracking: o.tracking });
    if (o.stroke) { var sp = L.property("Source Text"), td = sp.value; td.applyStroke = true; td.strokeColor = o.stroke; td.strokeWidth = o.sw || 10; td.strokeOverFill = false; sp.setValue(td); }
    if (o.anchor === "center") { var r = L.sourceRectAtTime(0, false); L.anchorPoint.setValue([r.left + r.width / 2, r.top + r.height / 2]); }
    if (o.pos) L.position.setValue(o.pos); if (o.parent) L.parent = o.parent; span(L, o.t0, o.t1); return L; }
  function hardDrop(L, color, dist, dir) { var d = fx(L, "ADBE Drop Shadow"); d.property("Shadow Color").setValue(color); try { d.property("Opacity").setValue(255); } catch (e) { d.property("Opacity").setValue(100); }
    d.property("Direction").setValue(dir === undefined ? 150 : dir); d.property("Distance").setValue(dist || 12); d.property("Softness").setValue(0); return L; }
  function glow(L, thr, rad, inten) { var g = fx(L, "ADBE Glo2"); g.property("Glow Threshold").setValue(thr); g.property("Glow Radius").setValue(rad); g.property("Glow Intensity").setValue(inten); return L; }
  function nul(comp, name, pos, o) { o = o || {}; var N = comp.layers.addNull(); N.name = name; N.anchorPoint.setValue([0, 0]); N.position.setValue(pos);
    if (o.parent) N.parent = o.parent; span(N, o.t0, o.t1); return N; }
  function sub(comp, P, name, bg) { var c = app.project.items.addComp(P + "_" + name, comp.width, comp.height, 1, comp.duration, comp.frameRate); c.bgColor = bg; return c; }
  // parent a layer drawn around its own origin and put it at the parent's origin (parenting compensates for the parent's current transform)
  function attach(L, N) { L.parent = N; L.position.setValue([0, 0]); return L; }
  function solid(c, name, color, t0, t1) { var L = c.layers.addSolid(color, name, c.width, c.height, 1); span(L, t0, t1); return L; }

  // ---- the hero: a round helmet, a visor and an antenna with a ball in the hero colour. Those three marks survive every medium.
  function heroHead(cx, cy, r, ball) { return [Ln([[cx, cy - r * .8], [cx, cy - r * 1.45]], PALETTE.ink, Math.max(6, r * .14)), E(cx, cy - r * 1.6, r * .62, r * .62, ball || PALETTE.hero),
    E(cx, cy, r * 2, r * 2, PALETTE.helmet), E(cx, cy + r * .12, r * 1.36, r * 1.1, PALETTE.visor),
    E(cx - r * .3, cy + r * .08, r * .18, r * .3, PALETTE.ink), E(cx + r * .3, cy + r * .08, r * .18, r * .3, PALETTE.ink), { k: "path", v: [[cx - r * .2, cy + r * .36], [cx, cy + r * .46], [cx + r * .2, cy + r * .36]], closed: false, stroke: PALETTE.ink, sw: Math.max(3, r * .08) }]; }

  // ---- a pixel sprite: rows of characters, one per pixel, '.' empty. One group per colour. Anchor at the bottom centre.
  function sprite(c, name, rows, px, pal, o) { var L = c.layers.addShape(); L.name = name; var root = L.property("ADBE Root Vectors Group"), cols = rows[0].length, byCol = {};
    for (var y = 0; y < rows.length; y++) { var x = 0; while (x < cols) { var ch = rows[y].charAt(x); if (ch === ".") { x++; continue; } var x1 = x; while (x1 < cols && rows[y].charAt(x1) === ch) x1++;
      if (!byCol[ch]) byCol[ch] = []; byCol[ch].push([x, y, x1 - x]); x = x1; } }
    for (var key in byCol) { if (!byCol.hasOwnProperty(key)) continue; var g = root.addProperty("ADBE Vector Group"), v = g.property("ADBE Vectors Group"), runs = byCol[key];
      for (var i = 0; i < runs.length; i++) { var rr = v.addProperty("ADBE Vector Shape - Rect"), w = runs[i][2] * px;
        rr.property("ADBE Vector Rect Size").setValue([w, px]); rr.property("ADBE Vector Rect Position").setValue([(runs[i][0] - cols / 2) * px + w / 2, (runs[i][1] - rows.length) * px + px / 2]); }
      v.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(pal[key]); }
    L.anchorPoint.setValue([0, 0]); if (o.parent) L.parent = o.parent; L.position.setValue(o.pos || [0, 0]); span(L, o.t0, o.t1); return L; }
  // the hero in pixels: 14 x 16, arms down (stand), two run frames, and arms up (catch)
  function heroRows(pose) {
    var head = ["......CC......", "......CC......", ".......K......", "....KKKKKK....", "...KWWWWWWK...", "..KWVVVVVVWK..", "..KWVKVVKVWK..", "..KWVVVVVVWK..", "...KWWWWWWK...", "....KKKKKK...."];
    var body = ["...KWWWWWWK...", "..KWWWCCWWWK..", "..KWWWWWWWWK..", "...KWWKKWWK..."];
    var legs = { stand: ["...KWK..KWK...", "..KOOK..KOOK.."], runA: ["..KWK....KWK..", ".KOOK....KOOK."], runB: ["....KWKKWK....", "....KOOOOK...."] };
    var rows = head.concat(body).concat(legs[pose === "catch" ? "stand" : pose]), i;
    if (pose === "catch") { for (i = 1; i <= 10; i++) rows[i] = "K" + rows[i].substr(1, 12) + "K"; rows[0] = "W" + rows[0].substr(1, 12) + "W"; }
    else { for (i = 10; i <= 12; i++) rows[i] = ".K" + rows[i].substr(2, 10) + "K."; }
    return rows; }

  // ---- crayon: a drawing is two layers, wax fill (hatched by Venetian Blinds) and a crayon outline, both boiling (Turbulent Displace on 8 fps)
  // and with a ragged paper-tooth edge (Roughen Edges). items as in shp; fill items are hatched, every closed item and line gets the outline.
  function crayonize(L, hatch, seed) {
    if (hatch) { var vb = fx(L, "ADBE Venetian Blinds"); vb.property("Transition Completion").setValue(hatch); vb.property("Direction").setValue(32 + (seed % 3) * 9); vb.property("Width").setValue(9); vb.property("Feather").setValue(1.5); }
    var td = fx(L, "ADBE Turbulent Displace"); td.property("Amount").setValue(hatch ? 10 : 6); td.property("Size").setValue(hatch ? 16 : 11);
    L.property("ADBE Effect Parade").property(L.property("ADBE Effect Parade").numProperties).property("Evolution").expression = "posterizeTime(8); time * 300 + " + seed * 37 + ";";
    var re = fx(L, "ADBE Roughen Edges"); re.property("Border").setValue(hatch ? 3 : 2.5); re.property("Edge Sharpness").setValue(2); re.property("Scale").setValue(14); re.property("Complexity").setValue(2);
    return L; }
  function crayon(c, name, items, o) { o = o || {}; var fills = [], lines = [];
    for (var i = 0; i < items.length; i++) { var it = items[i];
      if (it.fill) { var f = copy(it); f.stroke = null; fills.push(f); }
      if (it.k === "path" && !it.fill && it.stroke) { lines.push(copy(it)); continue; }
      if (it.noLine) continue; var l = copy(it); l.fill = null; l.stroke = it.line || CRAYON.line; l.sw = it.lw || 8; lines.push(l); }
    var F = null, Lr = null;
    if (fills.length) { F = crayonize(shp(c, name + "_WAX", fills, { parent: o.parent, t0: o.t0, t1: o.t1 }), o.hatch || 48, o.seed || 1); }
    if (lines.length) { Lr = crayonize(shp(c, name + "_LINE", lines, { parent: o.parent, t0: o.t0, t1: o.t1 }), 0, (o.seed || 1) + 5); }
    return { wax: F, line: Lr }; }

  // ---- the command word: white display type with a thick ink outline, a coloured hard drop and a burst behind, skewed. It slams in over three
  // frames, holds, then shrinks into a corner tag before the first action (mode "tag") or flies out (mode "fly", one-off banners).
  function command(comp, P, word, t0, tHold, tEnd, mode, burstColor, dropColor, notes) {
    var N = nul(comp, P + "_CMD_" + word.replace(/[^A-Z]/g, ""), [540, 900], { t0: t0, t1: tEnd });
    var T = txt(comp, N.name + "_T", word, { family: DISPLAY, size: 230, color: PALETTE.white, stroke: PALETTE.ink, sw: 26, anchor: "center", pos: [540, 900], t0: t0, t1: tEnd });
    var w = T.sourceRectAtTime(t0, false).width, out = Math.max(270, w / 2 + 110);
    var sk = fx(T, "ADBE Geometry2"); sk.property("Skew").setValue(-9); sk.property("Skew Axis").setValue(0);
    hardDrop(T, dropColor, 16, 150);
    var B = shp(comp, N.name + "_BURST", toon([{ k: "star", x: 540, y: 900, pts: 14, ir: out * .74, or: out, fill: burstColor }], { sw: 9, dx: 12, dy: 12 }), { ax: 540, ay: 900, t0: t0, t1: tEnd });
    B.rotation.expression = "time * 40;"; B.moveAfter(T); B.parent = N; T.parent = N; N.rotation.setValue(-5);
    keys(N.scale, [K(t0, [330, 330], "lin"), K(t0 + .067, [86, 86], "settle"), K(t0 + .12, [108, 108], "settle"), K(t0 + .18, [100, 100], "settle"), K(tHold, [100, 100], "settle"),
      mode === "fly" ? K(tHold + .12, [150, 150], "lin") : K(tHold + .16, [34, 34], "settle")]);
    if (mode === "fly") keys(N.position, [K(tHold, [540, 900], "lin"), K(tHold + .12, [540, -500], "lin")]);
    else keys(N.position, [K(tHold, [540, 900], "travel"), K(tHold + .16, [190, 200], "settle")]);
    return N; }
  // a banner: lines of display type on a ribbon, built word by word (one text key per word), each word bumping the banner.
  // o = { pos, words: [{ s, text }], size, ribbon, drop, t0, t1, flyOut (time), rot }
  function banner(comp, name, o, notes) {
    var N = nul(comp, name, o.pos, { t0: o.t0, t1: o.t1, parent: o.parent });
    var full = o.lines.join("\r"), T = txt(comp, name + "_T", full, { family: DISPLAY, size: o.size, color: PALETTE.white, stroke: PALETTE.ink, sw: o.size * .12, leading: o.size * 1.02, t0: o.t0, t1: o.t1 });
    var r = T.sourceRectAtTime(o.t0, false); T.anchorPoint.setValue([r.left + r.width / 2, r.top + r.height / 2]); T.position.setValue(o.pos); hardDrop(T, o.drop, o.size * .07, 150);
    var pw = r.width + o.size * .9, ph = r.height + o.size * .55;
    var Rb = shp(comp, name + "_RIBBON", toon([R(o.pos[0] - pw / 2, o.pos[1] - ph / 2, pw, ph, o.ribbon, o.size * .3)], { sw: 9, dx: 14, dy: 14 }), { ax: o.pos[0], ay: o.pos[1], t0: o.t0, t1: o.t1 });
    Rb.moveAfter(T); Rb.parent = N; T.parent = N; N.rotation.setValue(o.rot === undefined ? -4 : o.rot);
    // word by word: the text keys are cumulative strings with the line breaks kept, so the block keeps its size and the words appear in place
    var words = [], times = [], strs = [], acc = "", wi = 0, lw;
    for (var li = 0; li < o.lines.length; li++) { lw = o.lines[li].split(" "); for (var j = 0; j < lw.length; j++) words.push({ w: lw[j], line: li }); }
    for (var k = 0; k < words.length; k++) { times.push(o.words[k] !== undefined ? o.words[k] : times[k - 1] + .1); var s = "", seen = 0;
      for (var l2 = 0; l2 < o.lines.length; l2++) { var parts = o.lines[l2].split(" "), shown = [];
        for (var p = 0; p < parts.length; p++) { shown.push(seen <= k ? parts[p] : new Array(parts[p].length + 1).join(" ")); seen++; }
        s += (l2 ? "\r" : "") + shown.join(" "); }
      strs.push(s); }
    AESLib.textKeys(T, times, strs);
    var sk = [K(o.t0, [0, 0], "lin")];
    for (var b = 0; b < times.length; b++) { if (b === 0) { sk.push(K(times[0] + .07, [112, 112], "settle")); sk.push(K(times[0] + .14, [100, 100], "settle")); }
      else { sk.push(K(times[b], [100, 100], "settle")); sk.push(K(times[b] + .05, [106, 106], "settle")); sk.push(K(times[b] + .11, [100, 100], "settle")); } }
    if (o.flyOut) { sk.push(K(o.flyOut, [100, 100], "settle")); sk.push(K(o.flyOut + .14, [130, 130], "lin")); keys(N.position, [K(o.flyOut, o.pos, "lin"), K(o.flyOut + .14, [o.pos[0], o.pos[1] - 1500], "lin")]); }
    keys(N.scale, sk);
    return N; }
  // a stamp: a disc (or a burst) with a label, slammed on the result. o = { pos, r, fill, label, t0, t1, parent, burst, rot }
  function stamp(comp, name, o) {
    var N = nul(comp, name, o.pos, { t0: o.t0, t1: o.t1, parent: o.parent });
    var shape = o.burst ? { k: "star", x: o.pos[0], y: o.pos[1], pts: 12, ir: o.r * .8, or: o.r * 1.12, fill: o.fill } : E(o.pos[0], o.pos[1], o.r * 2, o.r * 2, o.fill);
    var D = shp(comp, name + "_DISC", toon([shape, { k: "ell", x: o.pos[0] - o.r * .8, y: o.pos[1] - o.r * .8, w: o.r * 1.6, h: o.r * 1.6, stroke: PALETTE.white, sw: o.r * .06, flat: true }], { sw: o.r * .09, dx: o.r * .08, dy: o.r * .08 }),
      { ax: o.pos[0], ay: o.pos[1], t0: o.t0, t1: o.t1 });
    var T = txt(comp, name + "_T", o.label, { family: DISPLAY, size: o.r * (o.label.length > 3 ? .5 : .78), color: PALETTE.white, stroke: PALETTE.ink, sw: o.r * .1, anchor: "center", pos: o.pos, t0: o.t0, t1: o.t1 });
    D.parent = N; T.parent = N; N.rotation.setValue(o.rot === undefined ? -12 : o.rot);
    keys(N.scale, [K(o.t0, [0, 0], "lin"), K(o.t0 + .07, [132, 132], "settle"), K(o.t0 + .13, [92, 92], "settle"), K(o.t0 + .2, [100, 100], "settle")]);
    return N; }
  // the timer: a fuse with a knot per beat and a bomb at the end; the spark passes each knot exactly on its beat and reaches the bomb on the result.
  function fuse(comp, name, t0, t1, tOut) {
    var x0 = 120, x1 = 880, y = 1846, n = 4, items = [Ln([[x0, y], [x1, y]], PALETTE.ink, 26), Ln([[x0, y], [x1, y]], hex("#D99A55"), 14)];
    items[0].id = "INK"; items[0].trim = true; items[1].id = "ROPE"; items[1].trim = true;
    for (var i = 1; i < n; i++) { var kn = E(x0 + (x1 - x0) * i / n, y, 30, 30, hex("#D99A55")); kn.stroke = PALETTE.ink; kn.sw = 6; kn.id = "KNOT" + i; items.push(kn); }
    items = items.concat(toon([E(x1 + 62, y - 10, 104, 104, PALETTE.ink), R(x1 + 40, y - 78, 44, 22, PALETTE.violet, 4)], { sw: 6, dx: 6, dy: 6 })).concat([E(x1 + 44, y - 30, 22, 16, hex("#5B4A8A"))]);
    var L = shp(comp, name, items, { t0: t0, t1: tOut });
    keys(groupTrim(L, "INK").property("ADBE Vector Trim Start"), [K(t0, 0, "lin"), K(t1, 100, "lin")]);
    keys(groupTrim(L, "ROPE").property("ADBE Vector Trim Start"), [K(t0, 0, "lin"), K(t1, 100, "lin")]);
    for (var j = 1; j < n; j++) keys(group(L, "KNOT" + j).property("ADBE Vector Transform Group").property("ADBE Vector Group Opacity"), [K(t0, 100, "hold"), K(t0 + (t1 - t0) * j / n, 0, "hold")]);
    var S = shp(comp, name + "_SPARK", [{ k: "star", x: 0, y: 0, pts: 9, ir: 12, or: 34, fill: hex("#FFF4A0"), stroke: hex("#FF8A1E"), sw: 5 }], { t0: t0, t1: t1 });
    keys(S.position, [K(t0, [x0, y], "lin"), K(t1, [x1, y], "lin")]);
    S.scale.expression = "var s = 75 + 45 * Math.abs(Math.sin(time * 53)); [s, s];"; S.rotation.expression = "time * 720;"; glow(S, 40, 26, 1.2);
    return L; }

  // ---------------------------------------------------------------- the stage (the home look)
  function stage(comp, P, W, H, C, B, notes) {
    var cx = 540, cy = 960, out = {};
    // sunburst: alternate wedges on the ground, rotating on ones
    var wedges = [], nW = 22; for (var i = 0; i < nW; i += 2) { var a0 = i / nW * Math.PI * 2, a1 = (i + 1) / nW * Math.PI * 2;
      wedges.push(Pth([[cx, cy], [cx + 2200 * Math.cos(a0), cy + 2200 * Math.sin(a0)], [cx + 2200 * Math.cos(a1), cy + 2200 * Math.sin(a1)]], C.burst)); }
    out.burst = shp(comp, P + "_SUNBURST", wedges, { ax: cx, ay: cy }); var te = (B.end.t0 + .2).toFixed(2); out.burst.rotation.expression = "time * 9 + Math.max(0, time - " + te + ") * 30;";
    // floor: a dark band with perspective lines, the round stage on it
    var fl = [R(-400, 1690, 1880, 600, C.floor)], vp = [540, 1500];
    for (var xb = -900; xb <= 1980; xb += 240) { var xt = vp[0] + (xb - vp[0]) * (1690 - vp[1]) / (2400 - vp[1]); fl.push(Ln([[xt, 1690], [xb, 2400]], C.floorLine, 5)); }
    fl.push(Ln([[-400, 1745], [1480, 1745]], C.floorLine, 5)); fl.push(Ln([[-400, 1830], [1480, 1830]], C.floorLine, 5));
    shp(comp, P + "_FLOOR", fl);
    shp(comp, P + "_PLATFORM", toon([E(540, 1700, 1180, 170, C.magenta), E(540, 1690, 1080, 120, hex("#FF5AA2"))], { dx: 0, dy: 16 }));
    // the TV: a gold cabinet, the screen well, knobs and a speaker; the games are nested comps set into the screen (added later, above this)
    var cab = [R(420, 1600, 240, 70, C.violet, 6), Pth([[400, 1640], [680, 1640], [730, 1720], [350, 1720]], C.violet), R(185, 362, 710, 1258, C.gold, 56),
      { k: "rect", x: 220, y: 378, w: 640, h: 16, r: 8, fill: C.goldLight, flat: true }, { k: "rect", x: SCREEN.x - 16, y: SCREEN.y - 16, w: SCREEN.w + 32, h: SCREEN.h + 32, r: 28, fill: C.ink, flat: true },
      E(735, 1566, 46, 46, C.fail), E(800, 1566, 46, 46, C.cyan)];
    for (var s = 0; s < 8; s++) cab.push(Ln([[285 + s * 22, 1545], [285 + s * 22, 1590]], C.ink, 7));
    out.cab = shp(comp, P + "_TV", toon(cab, { dx: 14, dy: 14 }));
    return out; }
  function stageTop(comp, P, C, B, WL, notes) {
    var out = {};
    // the screen lip, over the nested games
    shp(comp, P + "_TV_LIP", [{ k: "rect", x: SCREEN.x, y: SCREEN.y, w: SCREEN.w, h: SCREEN.h, r: 10, stroke: C.ink, sw: 12 }]);
    // marquee: a dark plate, a magenta frame of chasing bulbs, the show's sign in glowing gold
    shp(comp, P + "_MARQUEE", toon([R(60, 200, 960, 150, C.plate, 40)], { sw: 8, dx: 12, dy: 12 }).concat([{ k: "rect", x: 74, y: 214, w: 932, h: 122, r: 30, stroke: C.magenta, sw: 14 }]));
    var bulbs = [], bi = 0; for (var bx = 110; bx <= 970; bx += 62) { bulbs.push({ x: bx, y: 214 }); bulbs.push({ x: bx, y: 336 }); }
    var BL = shp(comp, P + "_BULBS", (function () { var a = []; for (var q = 0; q < bulbs.length; q++) { var e = E(bulbs[q].x, bulbs[q].y, 18, 18, hex("#FFF2B0")); e.id = "B" + q; a.push(e); } return a; })());
    for (var q = 0; q < bulbs.length; q++) group(BL, "B" + q).property("ADBE Vector Transform Group").property("ADBE Vector Group Opacity").expression =
      "var r = time > " + (B.end.t0 + .2).toFixed(2) + " ? 16 : 8; posterizeTime(r); (Math.floor(time * r) + " + (Math.floor(q / 2) % 3) + ") % 3 == 0 ? 100 : 30;";
    glow(BL, 50, 18, 1);
    var sign = txt(comp, P + "_SIGN", (B.title.context || "").toUpperCase(), { family: DISPLAY, size: 92, color: hex("#FFE27A"), just: "center", pos: [540, 307] });
    var tw = wordsIn(WL, B.title.t0, B.title.t1), signWords = (B.title.context || "").toUpperCase().split(" "), sk = [], ss = [];
    sk.push(0); ss.push(" "); for (var w = 0; w < signWords.length; w++) { sk.push(tw[w] ? tw[w].s : .05 * (w + 1)); ss.push(signWords.slice(0, w + 1).join(" ")); }
    AESLib.textKeys(sign, sk, ss); glow(sign, 45, 22, 1.1);
    // stage badge (top left) and lives board (top right)
    shp(comp, P + "_BADGE", toon([R(40, 36, 270, 148, C.gold, 34)], { dx: 10, dy: 10 }));
    txt(comp, P + "_BADGE_LBL", "STAGE", { family: ROUND, size: 46, color: C.ink, pos: [175, 90] });
    out.badge = txt(comp, P + "_BADGE_NUM", "01", { family: DISPLAY, size: 86, color: C.white, stroke: C.ink, sw: 12, pos: [175, 168] });
    shp(comp, P + "_LIVES", toon([R(690, 36, 350, 148, C.plate, 34)], { dx: 10, dy: 10 }));
    out.lives = [];
    for (var l = 0; l < 3; l++) { var hx = 762 + l * 104, hy = 128, H = shp(comp, P + "_LIFE" + (l + 1), toon(heroHead(hx, hy, 34), { sw: 5, dx: 4, dy: 4 }), { ax: hx, ay: hy + 34 }); out.lives.push(H); }
    // the host: round cream face, top hat, magenta tux; the head ticks on every beat (hold keys)
    var hx0 = 130, hy0 = 1880;
    var body = [E(-50, -14, 84, 32, C.white), E(42, -14, 84, 32, C.white), R(-42, -160, 30, 146, C.ink), R(12, -160, 30, 146, C.ink),
      Pth([[-82, -330], [82, -330], [98, -140], [-98, -140]], C.magenta), Pth([[-26, -330], [26, -330], [0, -232]], C.white),
      Pth([[-28, -330], [-70, -330], [-8, -205]], C.cyan), Pth([[28, -330], [70, -330], [8, -205]], C.cyan),
      E(0, -188, 16, 16, C.gold), E(0, -158, 16, 16, C.gold)];
    function placed(items, dx, dy) { var a = []; for (var i = 0; i < items.length; i++) a.push(moved(items[i], dx, dy)); return a; }
    var armL = [Ln([[-72, -305], [-112, -200]], C.ink, 46), Ln([[-72, -305], [-112, -200]], C.magenta, 30), E(-114, -190, 50, 50, C.white)];
    shp(comp, P + "_HOST", toon(placed(armL.concat(body), hx0, hy0), { dx: 9, dy: 9 }));
    var tie = shp(comp, P + "_HOST_TIE", toon(placed([Pth([[0, -318], [-34, -336], [-34, -300]], C.ink), Pth([[0, -318], [34, -336], [34, -300]], C.ink)], hx0, hy0), { dx: 0, dy: 0 }));
    var head = [E(0, -420, 196, 184, C.cream), E(-58, -392, 34, 20, hex("#FFA5C2")), E(58, -392, 34, 20, hex("#FFA5C2")),
      E(-36, -436, 22, 36, C.ink), E(36, -436, 22, 36, C.ink), Pth([[-46, -392], [46, -392], [26, -360], [0, -352], [-26, -360]], hex("#8A1538")),
      R(-84, -514, 168, 18, C.plate, 6), R(-56, -606, 112, 96, C.plate, 8), R(-56, -538, 112, 20, C.magenta)];
    out.head = shp(comp, P + "_HOST_HEAD", toon(placed(head, hx0, hy0), { dx: 9, dy: 9 }), { ax: hx0, ay: hy0 - 330 });
    out.armPoint = shp(comp, P + "_HOST_ARM", toon(placed([Ln([[70, -305], [140, -262], [178, -292]], C.ink, 46), Ln([[70, -305], [140, -262], [178, -292]], C.magenta, 30), E(186, -300, 54, 54, C.white)], hx0, hy0), { dx: 9, dy: 9 }));
    out.armCheer = shp(comp, P + "_HOST_CHEER", toon(placed([Ln([[70, -305], [112, -410], [118, -500]], C.ink, 46), Ln([[70, -305], [112, -410], [118, -500]], C.magenta, 30), E(118, -516, 58, 58, C.white)], hx0, hy0), { dx: 9, dy: 9 }));
    // the trigger: a big red button on a podium
    shp(comp, P + "_PODIUM", toon([Pth([[880, 1610], [1050, 1610], [1074, 1900], [856, 1900]], C.violet), R(850, 1580, 230, 34, C.gold, 10), E(965, 1584, 170, 46, hex("#7D7A90"))], { dx: 10, dy: 10 }));
    out.button = shp(comp, P + "_BUTTON", toon([R(905, 1530, 120, 50, hex("#C21E2E"), 12), E(965, 1530, 122, 44, C.fail)], { dx: 0, dy: 0, sw: 6 }), { ax: 965, ay: 1560 });
    txt(comp, P + "_PODIUM_Q", "?", { family: DISPLAY, size: 150, color: C.gold, stroke: C.ink, sw: 14, pos: [965, 1820] });
    return out; }
  function wordsIn(WL, t0, t1) { var a = []; for (var i = 0; i < WL.length; i++) if (WL[i].s >= t0 - .01 && WL[i].s < t1 - .01) a.push(WL[i]); return a; }

  // ---------------------------------------------------------------- the games (each a full-frame comp nested in the TV screen)
  function attract(c, P, C, t1) {
    solid(c, P + "A_BG", PIX.bg, 0, t1);
    sprite(c, P + "A_HERO", heroRows("stand"), 22, PIX, { pos: [540, 1060], t0: 0, t1: t1 });
    var r = txt(c, P + "A_READY", "READY?", { family: PIXEL, style: "Regular", size: 150, color: PIX.text, pos: [540, 560], t0: 0, t1: t1 });
    r.opacity.expression = "posterizeTime(4); Math.floor(time * 4) % 2 == 0 ? 100 : 25;";
    txt(c, P + "A_PRESS", "PRESS START", { family: PIXEL, size: 64, color: PIX.accent, pos: [540, 1700], t0: 0, t1: t1 });
  }
  // 1. crayon: BUILD! Three pieces drop onto the paper one per word, a red frame scribbles round them and they are one picture.
  function gameCrayon(c, P, B, WL, ft) {
    var T0 = B.picture.t0, T1 = B.picture.t1, end = c.duration, pw = wordsIn(WL, T0, T1), G = 1560;
    var paper = solid(c, P + "C_PAPER", CRAYON.paper, 0, end);
    var tooth = solid(c, P + "C_TOOTH", [.5, .5, .5], 0, end); var fn = fx(tooth, "ADBE Fractal Noise"); fn.property("Contrast").setValue(160); fn.property("Brightness").setValue(-5);
    fn.property("Scale").setValue(14); tooth.blendingMode = BlendingMode.MULTIPLY; tooth.opacity.setValue(7);
    // scenery: grass, a sun, two clouds
    crayon(c, P + "C_GRASS", [{ k: "path", v: [[-40, G - 6], [300, G + 10], [700, G - 4], [1120, G + 8], [1120, 1980], [-40, 1980]], fill: CRAYON.green, line: hex("#2C6E36") }], { hatch: 52, seed: 2 });
    var sun = [E(600, 410, 160, 160, CRAYON.yellow)]; for (var r = 0; r < 10; r++) { var a = r / 10 * Math.PI * 2; sun.push(Ln([[600 + 105 * Math.cos(a), 410 + 105 * Math.sin(a)], [600 + 150 * Math.cos(a), 410 + 150 * Math.sin(a)]], CRAYON.orange, 9)); }
    sun[0].line = CRAYON.orange; crayon(c, P + "C_SUN", sun, { hatch: 50, seed: 3 });
    function cloud(x, y) { return { k: "path", v: [[x - 90, y + 30], [x - 100, y - 5], [x - 55, y - 30], [x - 20, y - 60], [x + 35, y - 45], [x + 80, y - 30], [x + 100, y + 5], [x + 85, y + 30]], line: CRAYON.blue, lw: 7 }; }
    crayon(c, P + "C_CLOUDS", [cloud(260, 700), cloud(860, 820)], { seed: 4 });
    // the three pieces: a device, a document and the hero (person), dropped onto the grass on "Three", "pieces", "build"
    var device = [Pth([[-190, -62], [190, -62], [210, 0], [-210, 0]], CRAYON.grey), R(-150, -262, 300, 200, CRAYON.blue, 14), R(-122, -236, 244, 148, CRAYON.sky)];
    var doc = [Pth([[-115, -320], [60, -320], [115, -265], [115, 0], [-115, 0]], CRAYON.pale), Pth([[60, -320], [60, -265], [115, -265]], CRAYON.orange)];
    for (var dl = 0; dl < 5; dl++) doc.push(Ln([[-78, -250 + dl * 44], [dl === 4 ? 10 : 78, -250 + dl * 44]], CRAYON.blue, 7));
    var heroB = [R(-48, -96, 36, 96, CRAYON.sky), R(12, -96, 36, 96, CRAYON.sky), R(-58, -30, 54, 30, CRAYON.orange, 8), R(4, -30, 54, 30, CRAYON.orange, 8),
      R(-72, -268, 144, 180, CRAYON.sky, 20), E(0, -190, 40, 40, CRAYON.red), Ln([[0, -420], [0, -500]], CRAYON.line, 8), E(0, -515, 40, 40, CRAYON.red),
      E(0, -350, 180, 170, hex("#E6E8F2")), { k: "rect", x: -62, y: -388, w: 124, h: 78, r: 34, fill: hex("#F7C59A") }, E(-22, -350, 12, 18, CRAYON.line), E(22, -350, 12, 18, CRAYON.line)];
    var lands = [pw[1] ? pw[1].s + .02 : T0 + .3, pw[2] ? pw[2].s + .02 : T0 + .6, pw[3] ? pw[3].s + .02 : T0 + .9], xs = [240, 540, 840], pieces = [device, doc, heroB], nulls = [];
    for (var p = 0; p < 3; p++) { var N = nul(c, P + "C_PIECE" + p, [xs[p], G + 8], { t0: 0, t1: end }); var tl = lands[p];
      keys(N.position, [K(0, [xs[p], -700], "hold"), K(tl - .2, [xs[p], -700], "lin"), K(tl, [xs[p], G + 8], "lin"), K(tl + .1, [xs[p], G - 46], "settle"), K(tl + .2, [xs[p], G + 8], "lin")]);
      keys(N.scale, [K(tl - .034, [100, 100], "hold"), K(tl, [122, 80], "settle"), K(tl + .1, [94, 106], "settle"), K(tl + .2, [100, 100], "settle")]);
      N.position.expression = "posterizeTime(8); value;"; N.scale.expression = "posterizeTime(8); value;";
      var pc = crayon(c, P + "C_P" + p, pieces[p], { hatch: 50, seed: 10 + p * 3 }); attach(pc.wax, N); attach(pc.line, N); nulls.push(N); }
    // the hero's arms: down until the picture is built, then up (yay)
    var tUp = pw[4] ? pw[4].s : T0 + 1.1;
    var down = crayon(c, P + "C_ARMS_DN", [Ln([[-70, -240], [-118, -140]], CRAYON.line, 9), Ln([[70, -240], [118, -140]], CRAYON.line, 9)], { seed: 21 });
    var up = crayon(c, P + "C_ARMS_UP", [Ln([[-70, -240], [-140, -330]], CRAYON.line, 9), Ln([[70, -240], [140, -330]], CRAYON.line, 9), E(-146, -340, 30, 30, CRAYON.red), E(146, -340, 30, 30, CRAYON.red)], { seed: 22 });
    attach(down.line, nulls[2]); attach(up.line, nulls[2]); attach(up.wax, nulls[2]); down.line.outPoint = tUp; up.line.inPoint = tUp; up.wax.inPoint = tUp;
    // "one picture": a red frame scribbled round the three pieces, then the hero's yay
    var tF = pw[3] ? pw[3].s : T0 + .95;
    var fr = crayon(c, P + "C_FRAME", [{ k: "path", v: [[70, 980], [1010, 966], [1016, 1630], [64, 1640]], closed: true, line: CRAYON.red, lw: 12, trim: true }], { seed: 30 });
    keys(fr.line.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property("ADBE Vector Filter - Trim").property("ADBE Vector Trim End"), [K(tF, 0, "lin"), K(tF + .26, 100, "out")]);
    var yay = txt(c, P + "C_YAY", "yay!", { family: HAND, size: 130, color: CRAYON.red, pos: [600, 1060], t0: tUp, t1: end }); yay.rotation.setValue(-12); crayonize(yay, 0, 40);
  }
  // 2. pixel: CATCH! The real frame falls (pixelated and posterized), the hero runs under it and catches it; it resolves to the real frame.
  function gamePixel(c, P, B, WL, A, notes) {
    var T0 = B.input.t0, T1 = B.input.t1, end = c.duration, iw = wordsIn(WL, T0, T1), GY = 1584, px = 18;
    solid(c, P + "X_BG", PIX.bg, 0, end);
    var st = [], rnd = rng(7); for (var s = 0; s < 46; s++) { var sx = Math.round(rnd() * 58) * px, sy = Math.round(rnd() * 80) * px; st.push(R(sx, sy, rnd() < .25 ? px * 2 : px, px, PIX.star)); }
    var stars = shp(c, P + "X_STARS", st); stars.opacity.expression = "posterizeTime(6); 55 + 45 * Math.sin(time * 9);";
    var gr = [R(0, GY, 1080, 400, PIX.ground)]; for (var g = 0; g < 60; g++) if (g % 2 === 0) gr.push(R(g * px, GY, px, px, PIX.block)); for (var g2 = 0; g2 < 60; g2++) if (g2 % 2 === 1) gr.push(R(g2 * px, GY + px, px, px, PIX.block));
    shp(c, P + "X_GROUND", gr);
    // the frame: the real image, low-res (Mosaic) and few colours (Posterize), in a white pixel border
    var tCatch = iw[3] ? iw[3].s - .05 : T0 + .58, tFall = T0 + .24, FW = 500, FH = 889, rest = GY - 18 * 15 - FH / 2 + 8;   // hands at the top of a 15-row sprite
    var F = c.layers.add(AESLib.importFile(A.frame)); F.name = P + "X_FRAME"; F.scale.setValue([FW / 10.8, FW / 10.8]);
    var mo = fx(F, "ADBE Mosaic"); mo.property("Horizontal Blocks").setValue(30); mo.property("Vertical Blocks").setValue(53); mo.property("Sharp Colors").setValue(1);
    var po = fx(F, "ADBE Posterize"); po.property("Level").setValue(5);
    var EP = F.property("ADBE Effect Parade"), tR = iw[4] ? iw[4].s : tCatch + .15;
    keys(EP.property(1).property("Horizontal Blocks"), [K(0, 30, "hold"), K(tR, 60, "hold"), K(tR + .12, 120, "hold"), K(tR + .24, 540, "hold")]);
    keys(EP.property(1).property("Vertical Blocks"), [K(0, 53, "hold"), K(tR, 107, "hold"), K(tR + .12, 213, "hold"), K(tR + .24, 960, "hold")]);
    keys(EP.property(2).property("Level"), [K(0, 5, "hold"), K(tR + .12, 9, "hold"), K(tR + .24, 64, "hold")]);
    var Fb = shp(c, P + "X_BORDER", [{ k: "rect", x: 540 - FW / 2 - 9, y: 960 - FH / 2 - 9, w: FW + 18, h: FH + 18, stroke: PIX.W, sw: 18, cap: false }], { ax: 540, ay: 960 });
    var FN = nul(c, P + "X_FRAME_N", [540, -700], { t0: 0, t1: end }); F.parent = FN; Fb.parent = FN; F.position.setValue([0, 0]); Fb.position.setValue([0, 0]);
    keys(FN.position, [K(0, [540, -700], "hold"), K(tFall, [540, -700], "lin"), K(tCatch, [540, rest], "lin"), K(tCatch + .08, [540, rest + 30], "settle"), K(tCatch + .2, [540, rest], "settle")]);
    FN.position.expression = "posterizeTime(12); [Math.round(value[0] / 18) * 18, Math.round(value[1] / 18) * 18];";
    // the hero: runs in from the left on two frames, catches with arms up
    var HN = nul(c, P + "X_HERO_N", [-200, GY], { t0: 0, t1: end }), tRun = T0 + .18;
    keys(HN.position, [K(0, [-200, GY], "hold"), K(tRun, [-200, GY], "lin"), K(tCatch - .04, [540, GY], "settle"), K(tCatch, [540, GY], "hold"), K(tCatch + .08, [540, GY + 18], "hold"), K(tCatch + .2, [540, GY], "hold")]);
    HN.position.expression = "posterizeTime(12); [Math.round(value[0] / 18) * 18, Math.round(value[1] / 18) * 18];";
    var ra = sprite(c, P + "X_RUN_A", heroRows("runA"), px, PIX, { parent: HN }), rb = sprite(c, P + "X_RUN_B", heroRows("runB"), px, PIX, { parent: HN }), ca = sprite(c, P + "X_CATCH", heroRows("catch"), px, PIX, { parent: HN });
    var la = [K(0, 100, "hold")], lb = [K(0, 0, "hold")], f = 0; for (var t = tRun; t < tCatch - .04; t += 1 / 12) { la.push(K(t, f % 2 ? 0 : 100, "hold")); lb.push(K(t, f % 2 ? 100 : 0, "hold")); f++; }
    la.push(K(tCatch - .04, 0, "hold")); lb.push(K(tCatch - .04, 0, "hold")); keys(ra.opacity, la); keys(rb.opacity, lb); keys(ca.opacity, [K(0, 0, "hold"), K(tCatch - .04, 100, "hold")]);
    // caption in the medium's own type
    var cap = txt(c, P + "X_CAP", "REAL FRAME", { family: PIXEL, size: 84, color: PIX.text, pos: [540, 1760], t0: iw[2] ? iw[2].s : tCatch, t1: end });
    AESLib.bakeText(cap, ["R", "RE", "REA", "REAL", "REAL ", "REAL F", "REAL FR", "REAL FRA", "REAL FRAM", "REAL FRAME"], 30, cap.inPoint);
  }
  // 3. Swiss: COUNT! A strict grid, one sans, one signal-red circle (the hero). The number counts on the voice; the circle lands as the full stop.
  function gameSwiss(c, P, B, WL, notes) {
    var T0 = B.number.t0, T1 = B.number.t1, end = c.duration, nw = wordsIn(WL, T0, T1), val = B.number.value;
    solid(c, P + "S_PAPER", SW.paper, 0, end);
    var gl = []; for (var g = 0; g <= 6; g++) gl.push(Ln([[70 + g * 940 / 6, -10], [70 + g * 940 / 6, 1930]], SW.hair, 2)); gl.push(Ln([[0, 1430], [1080, 1430]], SW.hair, 2));
    shp(c, P + "S_GRID", gl);
    shp(c, P + "S_RULE", [R(70, 700, 940, 14, SW.black)]);
    txt(c, P + "S_META_L", "STAGE 03", { family: SWISS, style: "Bold", size: 44, color: SW.black, just: "left", pos: [70, 790] });
    txt(c, P + "S_META_R", "COUNT THE FRAMES", { family: SWISS, style: "Bold", size: 44, color: SW.grey, just: "right", pos: [1010, 790] });
    var tc0 = T0 + .16, tc1 = nw[1] ? nw[1].s : T0 + .68;
    var num = txt(c, P + "S_NUM", String(val), { family: SWISS, style: "Bold", size: 480, color: SW.black, just: "left", tracking: -40, pos: [56, 1190] });
    var ss = [], nf = Math.max(2, Math.round((tc1 - tc0) * 30)); for (var i = 0; i <= nf; i++) { var u = i / nf; ss.push(String(Math.round(val * (1 - Math.pow(1 - u, 3))))); }
    AESLib.textKeys(num, [0], ["0"]); AESLib.bakeText(num, ss, 30, tc0);
    var lab = txt(c, P + "S_LABEL", (B.number.label || "").toUpperCase(), { family: SWISS, style: "Bold", size: 150, color: SW.black, just: "left", tracking: -10, pos: [66, 1380] });
    var lr = lab.sourceRectAtTime(0, false), full = lab.property("Source Text").value.text, ls = [" "]; for (var l = 1; l <= full.length; l++) ls.push(full.substr(0, l));
    AESLib.bakeText(lab, ls, 30, tc1 - 1 / 30);
    // the hero: a red circle that slides in along the rule, waits, then hops down to be the full stop on "counted"
    var r0 = 40, tIn = T0 + .2, tLand = nw[2] ? nw[2].s + .02 : T1 - .34, px = 66 + lr.left + lr.width + 26 + r0;
    var D = shp(c, P + "S_DOT", [E(0, 0, r0 * 2, r0 * 2, SW.red)], { t0: 0, t1: end });
    D.position.dimensionsSeparated = true; var X = D.transform.xPosition, Y = D.transform.yPosition;
    keys(X, [K(0, 1200, "hold"), K(tIn, 1200, "lin"), K(tIn + .2, 930, "settle"), K(tLand - .26, 930, "lin"), K(tLand, px, "lin")]);
    keys(D.scale, [K(tLand - .034, [100, 100], "hold"), K(tLand, [128, 74], "settle"), K(tLand + .1, [94, 106], "settle"), K(tLand + .18, [100, 100], "settle")]);
    D.anchorPoint.setValue([0, r0]); keys(Y, [K(0, 700, "hold"), K(tLand - .26, 700, "out"), K(tLand - .17, 580, "settle"), K(tLand, 1380, "lin")]);
    X.expression = "posterizeTime(15); value;"; Y.expression = "posterizeTime(15); value;";
  }
  // 4. terminal: TYPE! Amber phosphor; the line is typed as it is spoken; the hero is the block cursor, with its antenna.
  function gameTerminal(c, P, B, WL, notes) {
    var T0 = B.line.t0, T1 = B.line.t1, end = c.duration, lw = wordsIn(WL, T0, T1), size = 150, adv = size * .4, lead = 175, X0 = 90, Y0 = 860, tStart = T0 + .14;
    solid(c, P + "T_BG", TERM.bg, 0, end);
    txt(c, P + "T_HEAD", "MICRO OS 1.0", { family: MONO, size: 70, color: TERM.dim, just: "left", pos: [X0, 560] });
    txt(c, P + "T_HEAD2", "STAGE 04: TYPE THE LINE", { family: MONO, size: 70, color: TERM.dim, just: "left", pos: [X0, 630] });
    // wrap the spoken line into rows of at most 13 cells after a "> " prompt
    var words = (B.line.text || "").split(" "), rows = [], cur = "> ", wrow = [], wcol = [];
    for (var i = 0; i < words.length; i++) { var add = (cur.length > 2 && cur !== "  " ? " " : "") + words[i];
      if (cur.length + add.length > 13 && cur.length > 2) { rows.push(cur); cur = "  " + words[i]; } else cur += add; wrow.push(rows.length); wcol.push(cur.length - words[i].length); }
    rows.push(cur);
    var T = txt(c, P + "T_LINE", rows.join("\r"), { family: MONO, size: size, color: TERM.amber, just: "left", leading: lead, pos: [X0, Y0], t0: T0, t1: end });
    // one key per character, each word's letters spread over its spoken time
    var times = [T0], strs = ["> "], curs = [[2, 0]];
    function partial(wi, n) { var out = rows.slice(0);
      for (var k = 0; k < rows.length; k++) out[k] = ""; out[0] = "> ";
      for (var w = 0; w < words.length; w++) { var take = w < wi ? words[w].length : (w === wi ? n : 0); if (!take) continue;
        var line = out[wrow[w]]; if (!line.length) line = "  "; while (line.length < wcol[w]) line += " "; out[wrow[w]] = line + words[w].substr(0, take); }
      var last = rows.length - 1; while (last > 0 && !out[last].length) last--; return out.slice(0, last + 1).join("\r"); }
    for (var w2 = 0; w2 < words.length; w2++) { var wd = lw[w2] || { s: tStart + w2 * .2, e: tStart + w2 * .2 + .18 }, s0 = Math.max(wd.s, tStart), e0 = Math.max(s0 + .05, wd.e - .03);
      for (var ch = 1; ch <= words[w2].length; ch++) { times.push(s0 + (e0 - s0) * (ch - 1) / words[w2].length); strs.push(partial(w2, ch)); curs.push([wcol[w2] + ch, wrow[w2]]); } }
    var tt = [], st = [], ct = []; for (var q = 0; q < times.length; q++) { if (tt.length && times[q] - tt[tt.length - 1] < 1 / 30) { st[st.length - 1] = strs[q]; ct[ct.length - 1] = curs[q]; continue; } tt.push(times[q]); st.push(strs[q]); ct.push(curs[q]); }
    AESLib.textKeys(T, tt, st);
    // the cursor (the hero): an inverse block with a little antenna and ball, stepping cell by cell, blinking once the line is done
    var cw = adv, chh = size * .62, Cu = shp(c, P + "T_CURSOR", [R(0, -chh, cw, chh, TERM.amber), Ln([[cw / 2, -chh], [cw / 2, -chh - 26]], TERM.amber, 6), E(cw / 2, -chh - 34, 18, 18, TERM.amber)], { t0: T0, t1: end });
    var ck = []; for (var z = 0; z < tt.length; z++) ck.push(K(tt[z], [X0 + ct[z][0] * adv + 4, Y0 + ct[z][1] * lead + 6], "hold")); keys(Cu.position, ck);
    var tDone = tt[tt.length - 1] + .1;
    Cu.opacity.expression = "if (time < " + tDone.toFixed(3) + ") 100; else (Math.floor(time * 5) % 2 == 0) * 100;";
    var ok = txt(c, P + "T_OK", "[ OK ] LINE TYPED", { family: MONO, size: 80, color: TERM.amber, just: "left", pos: [X0, Y0 + rows.length * lead + 40], t0: Math.min(T1 - .2, tDone + .02), t1: end });
    // phosphor: glow, scanlines, a dark vignette
    var fxl = solid(c, P + "T_FX", [1, 1, 1], 0, end); fxl.adjustmentLayer = true; glow(fxl, 45, 22, .9);
    var sl = solid(c, P + "T_SCAN", [0, 0, 0], 0, end); sl.opacity.setValue(30); var vb = fx(sl, "ADBE Venetian Blinds");
    vb.property("Transition Completion").setValue(60); vb.property("Direction").setValue(90); vb.property("Width").setValue(5); vb.property("Feather").setValue(1);
    var vg = solid(c, P + "T_VIG", [1, 1, 1], 0, end); vg.adjustmentLayer = true; fx(vg, "CC Vignette").property("Amount").setValue(60);
    return { done: tDone }; }
  // 5. boss: FLIP! The last frames of every earlier game, cut into tiles, flip one by one into the real frame (the past becomes the end card).
  function gameBoss(c, P, B, WL, A, games, notes) {
    var T0 = B.carry.t0, T1 = B.carry.t1, end = c.duration, cols = 3, rowsN = 5, tw = 1080 / cols, th = 1920 / rowsN;
    solid(c, P + "B_BG", PALETTE.ink, 0, end);
    var tFirst = T0 + .26, step = Math.max(.08, (T1 - .16 - tFirst - .14) / (cols + rowsN - 2));
    for (var r = 0; r < rowsN; r++) for (var q = 0; q < cols; q++) {
      var x = q * tw, y = r * th, idx = (q * 2 + r) % games.length, tf = tFirst + (r + q) * step + q * .015, half = .07;
      var old = c.layers.add(games[idx].comp); old.name = P + "B_OLD_" + r + q; old.timeRemapEnabled = true; var tr = old.property("ADBE Time Remapping");
      for (var tk = tr.numKeys; tk >= 1; tk--) tr.setValueAtKey(tk, games[idx].freeze);   // removing every key hides the property, so freeze the two keys AE adds
      var neu = c.layers.add(AESLib.importFile(A.frame)); neu.name = P + "B_NEW_" + r + q;
      var pair = [old, neu];
      for (var k = 0; k < 2; k++) { var L = pair[k], m = L.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"), s = new Shape();
        s.vertices = [[x + 4, y + 4], [x + tw - 4, y + 4], [x + tw - 4, y + th - 4], [x + 4, y + th - 4]]; s.closed = true; m.property("ADBE Mask Shape").setValue(s);
        L.anchorPoint.setValue([x + tw / 2, y + th / 2]); L.position.setValue([x + tw / 2, y + th / 2]); }
      span(old, 0, tf + half); span(neu, tf + half, end);
      keys(old.scale, [K(tf, [100, 100], "lin"), K(tf + half, [0, 100], "lin")]); keys(neu.scale, [K(tf + half, [0, 100], "lin"), K(tf + 2 * half, [100, 100], "settle")]); }
    var gl = []; for (var gx = 1; gx < cols; gx++) gl.push(Ln([[gx * tw, -10], [gx * tw, 1930]], PALETTE.ink, 10)); for (var gy = 1; gy < rowsN; gy++) gl.push(Ln([[-10, gy * th], [1090, gy * th]], PALETTE.ink, 10));
    var grid = shp(c, P + "B_GRID", gl, { t0: 0, t1: end }); keys(grid.opacity, [K(0, 100, "hold"), K(tFirst + (cols + rowsN - 2) * step + .2, 0, "hold")]);
  }

  // buildScene: the shared test scene as one run of a microgame show. comp = an empty 1080 x 1920 comp at scene.fps.
  // Home stage on the title; push into the TV for BUILD! (crayon), CATCH! (pixel), COUNT! (Swiss), TYPE! (terminal); the boss FLIP! turns
  // the pieces of every game into the real frame; snap back to the stage for the end, where the banner says the line and the stamp says CLEAR.
  function buildScene(comp, scene, opts) {
    fontOK(); var P = opts.prefix || "MICRO", C = opts.palette || PALETTE, A = opts.assets, B = scene.beat, W = comp.width, H = comp.height, notes = [], WL = scene.wordList, D = comp.duration;
    AESLib.clearOwned(comp, P);
    var Z = 100 * W / SCREEN.w, CX = SCREEN.x + SCREEN.w / 2, CY = SCREEN.y + SCREEN.h / 2;
    // the camera schedule (push in at the game start, shrink back out to the stage after the result); the ladder gets shorter each round
    var cam = { push: [[1.05, 1.30], [3.04, 3.22], [4.54, 4.70], [6.28, 6.40]], back: [[2.62, 2.92], [4.22, 4.46], [6.00, 6.22]], end: [B.end.t0, B.end.t0 + .2] };
    // the games, each its own comp, nested in the TV
    var gA = sub(comp, P, "G0_READY", PIX.bg), g1 = sub(comp, P, "G1_CRAYON", CRAYON.paper), g2 = sub(comp, P, "G2_PIXEL", PIX.bg), g3 = sub(comp, P, "G3_SWISS", SW.paper),
      g4 = sub(comp, P, "G4_TERMINAL", TERM.bg), g5 = sub(comp, P, "G5_BOSS", PALETTE.ink);
    attract(gA, P, C, cam.push[0][0]); gameCrayon(g1, P, B, WL); gamePixel(g2, P, B, WL, A, notes); gameSwiss(g3, P, B, WL, notes); var term = gameTerminal(g4, P, B, WL, notes);
    gameBoss(g5, P, B, WL, A, [{ comp: g1, freeze: 2.58 }, { comp: g2, freeze: 4.18 }, { comp: g3, freeze: 6.0 }, { comp: g4, freeze: B.line.t1 - .05 }], notes);
    // the stage, bottom to top
    solid(comp, P + "_GROUND", C.ground, 0, D);
    var WORLD = nul(comp, P + "_WORLD", [CX, CY]); WORLD.anchorPoint.setValue([CX, CY]); WORLD.position.setValue([CX, CY]);
    var st = stage(comp, P, W, H, C, B, notes);
    var slots = [[gA, 0, cam.push[0][0]], [g1, cam.push[0][0], B.input.t0], [g2, B.input.t0, B.number.t0], [g3, B.number.t0, B.line.t0], [g4, B.line.t0, B.carry.t0], [g5, B.carry.t0, D]], gl = [];
    for (var s = 0; s < slots.length; s++) { var GL = comp.layers.add(slots[s][0]); GL.name = P + "_SCREEN" + s; GL.position.setValue([CX, CY]); GL.scale.setValue([100 * SCREEN.w / W, 100 * SCREEN.w / W]); span(GL, slots[s][1], slots[s][2]); gl.push(GL); }
    var top = stageTop(comp, P, C, B, WL, notes);
    // stamps on the results, in the TV (they shrink back out with the game)
    var res = [B.picture.t0 + 1.18, B.input.t0 + 1.04, B.number.t1 - .33, Math.min(B.line.t1 - .16, term.done + .04)], ends = [B.input.t0, B.number.t0, B.line.t0, B.carry.t0], stamps = [];
    for (var k = 0; k < res.length; k++) stamps.push(stamp(comp, P + "_OK" + (k + 1), { pos: [765, 632], r: 74, fill: C.ok, label: "OK!", t0: res[k], t1: ends[k] }));
    var clear = stamp(comp, P + "_CLEAR", { pos: [850, 430], r: 100, fill: C.gold, label: "CLEAR!", t0: B.end.t0 + .86, t1: D, burst: true, rot: 10 });
    // everything on the stage is parented to the world before the camera is keyed
    for (var i = 1; i <= comp.numLayers; i++) { var L = comp.layer(i); if (L === WORLD || L.parent || L.name === P + "_GROUND") continue; L.parent = WORLD; }
    // the HUD (not parented): fuses, command words, banners
    var tags = [["BUILD!", B.picture.t0, B.picture.t0 + .28, cam.back[0][0], C.magenta, C.gold], ["CATCH!", cam.push[1][0] + .08, cam.push[1][0] + .28, cam.back[1][0], C.cyan, C.magenta],
      ["COUNT!", cam.push[2][0] + .06, cam.push[2][0] + .2, cam.back[2][0], C.gold, C.magenta], ["TYPE!", cam.push[3][0] + .03, cam.push[3][0] + .13, B.carry.t0, C.magenta, C.cyan]];
    var burns = [[cam.push[0][1], res[0]], [cam.push[1][1], res[1]], [cam.push[2][1], res[2]], [cam.push[3][1], res[3]]], outs = [cam.back[0][0], cam.back[1][0], cam.back[2][0], B.carry.t0];
    for (var f = 0; f < 4; f++) fuse(comp, P + "_FUSE" + (f + 1), burns[f][0], burns[f][1], outs[f]);
    for (var c = 0; c < tags.length; c++) command(comp, P, tags[c][0], tags[c][1], tags[c][2], tags[c][3], "tag", tags[c][4], tags[c][5], notes);
    command(comp, P, "FLIP!", B.carry.t0 + .02, B.carry.t0 + .2, B.carry.t0 + .34, "fly", C.cyan, C.gold, notes);
    var tw = wordsIn(WL, B.title.t0, B.title.t1), hero = (B.title.hero || "").toUpperCase().split(" "), hl = [hero.slice(0, Math.ceil(hero.length / 2)).join(" "), hero.slice(Math.ceil(hero.length / 2)).join(" ")];
    var ctxN = (B.title.context || "").split(" ").length, ht = []; for (var h = 0; h < hero.length; h++) ht.push(tw[ctxN + h] ? tw[ctxN + h].s : .4 + h * .15);
    banner(comp, P + "_TITLE", { pos: [540, 1050], lines: hl, words: ht, size: 128, ribbon: C.magenta, drop: C.gold, t0: ht[0], t1: cam.push[0][0] + .22, flyOut: cam.push[0][0] + .04, rot: -4 }, notes);
    banner(comp, P + "_SPEED", { pos: [540, 1050], lines: ["SPEED UP!"], words: [cam.back[1][1] - .14], size: 150, ribbon: C.cyan, drop: C.magenta, t0: cam.back[1][1] - .14, t1: cam.push[2][0] + .16, flyOut: cam.push[2][0] + .02, rot: 5 }, notes);
    var ew = wordsIn(WL, B.end.t0, B.end.t1), et = (B.end.text || "").toUpperCase().split(" "), etl = et.length > 2 ? [et.slice(0, 1).join(" "), et.slice(1).join(" ")] : [et.join(" ")], ett = [];
    for (var e = 0; e < et.length; e++) ett.push(Math.max(cam.end[0] + .08, ew[e] ? ew[e].s : B.end.t0 + e * .2));
    banner(comp, P + "_END", { pos: [540, 1500], lines: etl, words: ett, size: 118, ribbon: C.magenta, drop: C.gold, t0: ett[0], t1: D, rot: -4 }, notes);
    // the camera: push into the screen to start a game, shrink back out to return, snap back to the stage for the end, then a slow drift
    var ck = [K(0, [100, 100], "settle")];
    for (var p = 0; p < cam.push.length; p++) { ck.push(K(cam.push[p][0], [100, 100], "travel")); ck.push(K(cam.push[p][1], [Z, Z], "travel")); }
    for (var b = 0; b < cam.back.length; b++) { ck.push(K(cam.back[b][0], [Z, Z], "travel")); ck.push(K(cam.back[b][1], [100, 100], "travel")); }
    ck.push(K(cam.end[0], [Z, Z], "snap")); ck.push(K(cam.end[1], [100, 100], "lin")); ck.push(K(D, [103, 103], "lin"));
    keys(WORLD.scale, ck);
    // the stage acts: the badge counts the stages, the button is pressed on each push, the host ticks on the beat and cheers at the end
    AESLib.textKeys(top.badge, [0, cam.back[0][1] - .04, cam.back[1][1] - .04, cam.back[2][1] - .04, B.carry.t0], ["01", "02", "03", "04", "05"]);
    var bk = [K(0, [965, 1560], "hold")]; for (var q = 0; q < cam.push.length; q++) { var tp = cam.push[q][0] - .06; bk.push(K(tp, [965, 1576], "hold")); bk.push(K(tp + .1, [965, 1560], "hold")); } keys(top.button.position, bk);
    var tick = [], sgn = 1, tq = 0; for (tq = 0; tq < B.end.t0 + .28; tq += .3) { tick.push(K(tq, sgn * 6, "hold")); sgn = -sgn; }
    tick.push(K(B.end.t0 + .3, 0, "hold")); for (tq = ett[ett.length - 1]; tq < D; tq += .15) { tick.push(K(tq, sgn * 9, "hold")); sgn = -sgn; } keys(top.head.rotation, tick);
    var tCheer = ett[ett.length - 1]; top.armPoint.outPoint = tCheer; top.armCheer.inPoint = tCheer;
    for (var l = 0; l < top.lives.length; l++) { var tl = B.end.t0 + .86 + l * .06; keys(top.lives[l].scale, [K(tl, [100, 100], "settle"), K(tl + .08, [126, 126], "settle"), K(tl + .2, [100, 100], "settle")]); }
    var n = 0; var comps = [comp, gA, g1, g2, g3, g4, g5]; for (var z = 0; z < comps.length; z++) n += comps[z].numLayers;
    return { layers: n, notes: notes }; }

  return { PALETTE: PALETTE, fontOK: fontOK, keys: keys, shp: shp, toon: toon, sprite: sprite, heroRows: heroRows, crayon: crayon, command: command, banner: banner,
    stamp: stamp, fuse: fuse, buildScene: buildScene };
})();
