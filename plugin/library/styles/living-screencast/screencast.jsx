// Living screencast style: brand-neutral ES3 helpers. No project mutation happens at load.
// Read styles/living-screencast/STYLE.md first. A screen recording that is not a recording: the app window is redrawn from native shapes and
// type (sharp at any zoom) and floats on wallpaper; a recording-software camera pushes in to the cursor and the caret; a mascot made of big
// square pixels lives on the top edges of the UI and acts out what the software does. Two actors, never a hand: the cursor is the user,
// the mascot is the software. Overlays are information only (chapter pill, caption pill, key HUD, time-lapse tag).
// Adapted from Lemo-Opuscar's living-screencast style (MIT, LemoLab); see assets/LICENSE-lemo-opuscar.txt. The mascot here is our own.
var AESScreencast = (function () {
  var UI = "Inter Tight", SERIF = "Newsreader", MONO = "IBM Plex Mono";
  function hex(h) { return [parseInt(h.substr(1, 2), 16) / 255, parseInt(h.substr(3, 2), 16) / 255, parseInt(h.substr(5, 2), 16) / 255]; }
  var PALETTE = { wallTop: hex("#E8C7B1"), wallBottom: hex("#EEE7DC"), window: hex("#F8F7F4"), chrome: hex("#F0EEEA"), line: hex("#E0DCD4"), field: [1, 1, 1],
    chip: hex("#ECE9E3"), ink: hex("#22211F"), muted: hex("#8B8880"), accent: hex("#2F6FEB"), dust: hex("#D6CFC4"), hud: hex("#1C1B1A"),
    mascot: hex("#FF7A2F"), mascotShade: hex("#E5611B"), antenna: hex("#FFD3AE"), eye: hex("#241F1C"), red: hex("#FF5F57"), amber: hex("#FEBC2E"), green: hex("#28C840") };
  var PX = 12;                                                                    // one mascot pixel, in world px (the sprite is 10 x 9 pixels)
  function fontOK() { AESLib.font(UI, "Medium"); AESLib.font(UI, "Bold"); AESLib.font(SERIF, "Medium"); AESLib.font(MONO, "Regular"); return true; }
  function fx(L, m) { return L.property("ADBE Effect Parade").addProperty(m); }
  function c4(c) { return [c[0], c[1], c[2], 1]; }
  function isSpatial(p) { return p.propertyValueType === PropertyValueType.TwoD_SPATIAL || p.propertyValueType === PropertyValueType.ThreeD_SPATIAL; }
  function scl(L, sx, sy) { var v = L.scale.value, r = []; for (var i = 0; i < v.length; i++) r.push(v[i]); r[0] = sx; r[1] = sy; return r; }

  // keys in one setValuesAtTimes call. list = [{ t, v, e }], e = "lin" | "hold" | "settle" | "travel" | "peak" | "snap"; sorted, one key per 1/60 s.
  // Spatial properties get straight segments (zero tangents), so a held position never loops.
  function keys(prop, list) {
    list.sort(function (a, b) { return a.t - b.t; });
    var ks = [];
    for (var i = 0; i < list.length; i++) { if (ks.length && list[i].t - ks[ks.length - 1].t < 1 / 60) ks[ks.length - 1] = list[i]; else ks.push(list[i]); }
    var ts = [], vs = []; for (var j = 0; j < ks.length; j++) { ts.push(ks[j].t); vs.push(ks[j].v); }
    if (!ts.length) return prop;
    prop.setValuesAtTimes(ts, vs);
    var sp = isSpatial(prop), d = 1, B = KeyframeInterpolationType.BEZIER, LI = KeyframeInterpolationType.LINEAR, HO = KeyframeInterpolationType.HOLD;
    if (!sp && prop.propertyValueType !== PropertyValueType.COLOR && prop.value instanceof Array) d = prop.value.length;
    for (var k = 0; k < ks.length; k++) { var n = prop.nearestKeyIndex(ks[k].t), e = ks[k].e || "lin";
      if (sp) { var z = prop.propertyValueType === PropertyValueType.TwoD_SPATIAL ? [0, 0] : [0, 0, 0]; prop.setSpatialTangentsAtKey(n, z, z); }
      if (e === "hold") { prop.setInterpolationTypeAtKey(n, HO, HO); continue; }
      if (e === "lin") { prop.setInterpolationTypeAtKey(n, LI, LI); continue; }
      var ii = 85, oi = 28;
      if (e === "travel") { ii = 82; oi = 82; } else if (e === "peak") { ii = 50; oi = 50; } else if (e === "snap") { ii = 80; oi = 70; }
      var a = [], b = []; for (var q = 0; q < d; q++) { a.push(new KeyframeEase(0, ii)); b.push(new KeyframeEase(0, oi)); }
      prop.setInterpolationTypeAtKey(n, B, B); prop.setTemporalEaseAtKey(n, a, b); }
    return prop; }
  function K(t, v, e) { return { t: t, v: v, e: e }; }

  // one shape layer from items drawn in order (later on top), in world px. item = { k: "rect" | "ell" | "path", x, y, w, h, r, fill, op, stroke, sw, sop, v, closed, cap }
  // The layer's anchor and position are both (o.ax, o.ay), so its own space is world space and scaling pivots there.
  function shp(comp, name, items, o) { o = o || {}; var L = comp.layers.addShape(); L.name = name; var root = L.property("ADBE Root Vectors Group");
    for (var i = items.length - 1; i >= 0; i--) { var it = items[i], g = root.addProperty("ADBE Vector Group"), v = g.property("ADBE Vectors Group");
      if (it.k === "path") { var s = new Shape(); s.vertices = it.v; s.closed = it.closed !== false; v.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(s); }
      else if (it.k === "ell") { var e = v.addProperty("ADBE Vector Shape - Ellipse"); e.property("ADBE Vector Ellipse Size").setValue([it.w, it.h]); e.property("ADBE Vector Ellipse Position").setValue([it.x + it.w / 2, it.y + it.h / 2]); }
      else { var r = v.addProperty("ADBE Vector Shape - Rect"); r.property("ADBE Vector Rect Size").setValue([it.w, it.h]); r.property("ADBE Vector Rect Position").setValue([it.x + it.w / 2, it.y + it.h / 2]);
        if (it.r) r.property("ADBE Vector Rect Roundness").setValue(it.r); }
      if (it.stroke) { var st = v.addProperty("ADBE Vector Graphic - Stroke"); st.property("ADBE Vector Stroke Color").setValue(it.stroke); st.property("ADBE Vector Stroke Width").setValue(it.sw || 2);
        if (it.sop !== undefined) st.property("ADBE Vector Stroke Opacity").setValue(it.sop); if (it.cap) { st.property("ADBE Vector Stroke Line Cap").setValue(2); st.property("ADBE Vector Stroke Line Join").setValue(2); } }
      if (it.fill) { var f = v.addProperty("ADBE Vector Graphic - Fill"); f.property("ADBE Vector Fill Color").setValue(it.fill); if (it.op !== undefined) f.property("ADBE Vector Fill Opacity").setValue(it.op); } }
    var ax = o.ax || 0, ay = o.ay || 0; L.anchorPoint.setValue([ax, ay]); L.position.setValue([ax, ay]);
    if (o.parent) L.parent = o.parent; if (o.t0 !== undefined) L.inPoint = o.t0; if (o.t1 !== undefined) L.outPoint = o.t1; return L; }
  function rectProp(L, which) { return L.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property(1).property("ADBE Vector Rect " + which); }

  // type set on a baseline, anchored on its ink rect: align "left" (x = left ink edge), "center" or "right". Alignment is taken from the
  // full string, so a layer typed on later (partial strings) grows from the same left edge. Every layer is re-anchored from a fresh rect at the end.
  var TXT = [];
  function txt(comp, name, str, o) { var L = AESLib.text(comp, name, str, { family: o.family || UI, style: o.style || "Medium", size: o.size, color: o.color || PALETTE.ink, just: "left", tracking: o.tracking });
    var r = L.sourceRectAtTime(0, false), ax = r.left;
    if (o.align === "center") ax = r.left + r.width / 2; else if (o.align === "right") ax = r.left + r.width;
    L.anchorPoint.setValue([ax, 0]); if (o.parent) L.parent = o.parent; L.position.setValue([o.x, o.y]);
    if (o.t0 !== undefined) L.inPoint = o.t0; if (o.t1 !== undefined) L.outPoint = o.t1;
    TXT.push({ L: L, align: o.align || "left", at: o.full === undefined ? 0 : o.full }); return L; }
  function realign() { for (var i = 0; i < TXT.length; i++) { var x = TXT[i], r = x.L.sourceRectAtTime(x.at, false), ax = r.left;
      if (x.align === "center") ax = r.left + r.width / 2; else if (x.align === "right") ax = r.left + r.width; x.L.anchorPoint.setValue([ax, 0]); } TXT = []; }
  function measure(comp, str, size, family, style) { var L = AESLib.text(comp, "LSC_MEASURE", str, { family: family || UI, style: style || "Medium", size: size, color: [0, 0, 0], just: "left" });
    var r = L.sourceRectAtTime(0, false); L.remove(); return r.width; }

  function roundRect(x, y, w, h, r) { var k = .5523 * r, s = new Shape();
    s.vertices = [[x + r, y], [x + w - r, y], [x + w, y + r], [x + w, y + h - r], [x + w - r, y + h], [x + r, y + h], [x, y + h - r], [x, y + r]];
    s.inTangents = [[-k, 0], [0, 0], [0, -k], [0, 0], [k, 0], [0, 0], [0, k], [0, 0]]; s.outTangents = [[0, 0], [k, 0], [0, 0], [0, k], [0, 0], [-k, 0], [0, 0], [0, -k]];
    s.closed = true; return s; }

  // ---- the mascot: our own pixel character (an orange block with an antenna), one square-pixel grid, crisp edges ----
  var BODY = ["....A.....", "....B.....", "..BBBBBB..", ".BBBBBBBB.", ".BBBBBBBB.", "BBBBBBBBBB", ".BBBBBBBB.", ".SSSSSSSS."];
  var EYES = { neutral: [[3, 4], [3, 5], [6, 4], [6, 5]], left: [[2, 4], [2, 5], [5, 4], [5, 5]], right: [[4, 4], [4, 5], [7, 4], [7, 5]],
    down: [[3, 5], [3, 6], [6, 5], [6, 6]], up: [[3, 3], [3, 4], [6, 3], [6, 4]], happy: [[2, 5], [3, 4], [4, 5], [5, 5], [6, 4], [7, 5]], shut: [[2, 5], [3, 5], [6, 5], [7, 5]] };
  var LEGS = { stand: [[2, 8], [3, 8], [6, 8], [7, 8]], walkA: [[1, 8], [2, 8], [6, 8], [7, 8]], walkB: [[2, 8], [3, 8], [7, 8], [8, 8]] };
  function px(c, r, col) { return { k: "rect", x: (c - 5) * PX, y: (r - 9) * PX, w: PX + .5, h: PX + .5, fill: col }; }   // feet at y = 0, centred on x = 0
  function sprite(cells, col) { var it = []; for (var i = 0; i < cells.length; i++) it.push(px(cells[i][0], cells[i][1], col)); return it; }
  function bodyItems() { var it = [], cols = { A: PALETTE.antenna, B: PALETTE.mascot, S: PALETTE.mascotShade };
    for (var r = 0; r < BODY.length; r++) { var row = BODY[r], c = 0;
      while (c < row.length) { var ch = row.charAt(c); if (ch === ".") { c++; continue; } var c1 = c; while (c1 < row.length && row.charAt(c1) === ch) c1++;
        it.push({ k: "rect", x: (c - 5) * PX, y: (r - 9) * PX, w: (c1 - c) * PX + .5, h: PX + .5, fill: cols[ch] }); c = c1; } }
    return it; }
  // A performer: hops, rides, looks and blinks are collected in any order and keyed once, sorted (X and Y separated, so a hop is ballistic).
  function Mascot(comp, P, world, x0, y0) { this.comp = comp; this.P = P; this.world = world; this.x = x0; this.y = y0; this.hops = []; this.X = [K(0, x0, "lin")]; this.Y = [K(0, y0, "lin")];
    this.eyes = [[0, "neutral"]]; this.legs = [[0, "stand"]]; this.blinks = []; this.cheers = []; }
  Mascot.prototype.hop = function (t0, t1, x1, y1, h) { var top = Math.min(this.y, y1) - (h === undefined ? 70 : h), tm = t0 + (t1 - t0) * (y1 < this.y ? .62 : .42);
    this.X.push(K(t0, this.x, "lin"), K(t1, x1, "lin")); this.Y.push(K(t0, this.y, "lin"), K(tm, top, "peak"), K(t1, y1, "lin"));
    this.legs.push([t0 + .03, "tuck"], [t1 - .01, "stand"]); this.hops.push({ t0: t0, t1: t1, x: x1, y: y1, still: false }); this.x = x1; this.y = y1; return this; };
  // ride a moving floor (a progress bar, a card): eased like the floor itself; walk = alternate the legs on twos
  Mascot.prototype.ride = function (t0, t1, x1, y1, e, walk) { this.X.push(K(t0, this.x, e), K(t1, x1, e)); this.Y.push(K(t0, this.y, e), K(t1, y1, e));
    if (walk) { var f = 0; for (var t = t0; t < t1; t += 2 / 30) { this.legs.push([t, f % 2 ? "walkB" : "walkA"]); f++; } this.legs.push([t1, "stand"]); }
    this.x = x1; this.y = y1; return this; };
  Mascot.prototype.look = function (t, pose) { if (t === 0) this.eyes[0] = [0, pose]; else this.eyes.push([t, pose]); return this; };
  Mascot.prototype.blink = function (t) { this.blinks.push(t); return this; };
  Mascot.prototype.cheer = function (t) { this.cheers.push(t); return this; };    // a small hop in place
  function poseAt(list, t) { var p = list[0][1]; for (var i = 0; i < list.length; i++) if (list[i][0] <= t + 1e-6) p = list[i][1]; return p; }
  function schedule(list) { list.sort(function (a, b) { return a[0] - b[0]; }); return list; }
  // pose layers: one shape layer per pose, shown by held opacity keys
  function poseLayers(comp, name, parent, list, table) { schedule(list); var made = [];
    for (var p in table) { if (!table.hasOwnProperty(p)) continue; var used = false; for (var i = 0; i < list.length; i++) if (list[i][1] === p) used = true; if (!used) continue;
      var L = shp(comp, name + "_" + p, sprite(table[p], name.indexOf("EYE") >= 0 ? PALETTE.eye : PALETTE.mascotShade)); L.parent = parent; L.position.setValue([0, 0]);
      var ks = []; for (var j = 0; j < list.length; j++) ks.push(K(list[j][0], list[j][1] === p ? 100 : 0, "hold")); keys(L.opacity, ks); made.push(L); }
    return made; }
  Mascot.prototype.finish = function () { var comp = this.comp, P = this.P, i;
    // cheers become hops in place
    for (i = 0; i < this.cheers.length; i++) { var c = this.cheers[i], xy = [valueAt(this.X, c), valueAt(this.Y, c)];
      this.Y.push(K(c, xy[1], "lin"), K(c + .1, xy[1] - 42, "peak"), K(c + .2, xy[1], "lin")); this.legs.push([c + .02, "tuck"], [c + .19, "stand"]); this.hops.push({ t0: c, t1: c + .2, x: xy[0], y: xy[1], still: true }); }
    this.hops.sort(function (a, b) { return a.t0 - b.t0; });
    var N = comp.layers.addNull(); N.name = P + "_MASCOT"; N.anchorPoint.setValue([0, 0]); N.position.setValue([this.X[0].v, this.Y[0].v]); N.parent = this.world;
    var body = shp(comp, P + "_MASCOT_BODY", bodyItems()); body.parent = N; body.position.setValue([0, 0]);
    // eyes: blinks are two frames of "shut", unless the eyes change inside them
    var eyes = schedule(this.eyes);
    for (i = 0; i < this.blinks.length; i++) { var b = this.blinks[i], before = poseAt(eyes, b), clash = false;
      for (var j = 0; j < eyes.length; j++) if (eyes[j][0] > b && eyes[j][0] < b + .1) clash = true;
      if (!clash && before !== "shut") { eyes.push([b, "shut"], [b + .07, before]); schedule(eyes); } }
    poseLayers(comp, P + "_MASCOT_EYE", N, eyes, EYES);
    var legs = schedule(this.legs);
    poseLayers(comp, P + "_MASCOT_LEG", N, legs, { stand: LEGS.stand, walkA: LEGS.walkA, walkB: LEGS.walkB });
    // squash and stretch about the feet: crouch, stretch on take-off, round in the air, squash and a damped bounce on landing
    var S = [K(0, scl(N, 100, 100), "settle")];
    for (i = 0; i < this.hops.length; i++) { var h = this.hops[i], prevEnd = i ? this.hops[i - 1].t1 : -1, next = i < this.hops.length - 1 ? this.hops[i + 1].t0 : 99, tm = (h.t0 + h.t1) / 2;
      if (h.t0 - prevEnd > .2) S.push(K(h.t0 - .08, scl(N, 100, 100), "settle"));
      S.push(K(h.t0, scl(N, 112, 86), "lin"), K(Math.min(h.t0 + .07, tm), scl(N, 90, 113), "settle"), K(tm, scl(N, 100, 100), "settle"), K(h.t1, scl(N, 98, 103), "lin"));
      var bounce = [[.04, 118, 84], [.12, 95, 105], [.2, 100, 100]];
      for (var q = 0; q < bounce.length; q++) if (h.t1 + bounce[q][0] < next - .09) S.push(K(h.t1 + bounce[q][0], scl(N, bounce[q][1], bounce[q][2]), "settle"));
      if (!h.still && h.t1 + .2 < next) dust(comp, P + "_DUST" + i, this.world, h.x, h.y, h.t1); }
    keys(N.scale, S);
    N.scale.expression = "var v = value; v[1] = v[1] + 1.2 * Math.sin(time * 7.5); v;";      // idle breath
    N.position.dimensionsSeparated = true; var TX = N.property("ADBE Transform Group").property("ADBE Position_0"), TY = N.property("ADBE Transform Group").property("ADBE Position_1");
    keys(TX, this.X); keys(TY, this.Y);
    TX.expression = "Math.round(value / 6) * 6"; TY.expression = "Math.round(value / 6) * 6";   // stepped to the half pixel
    return N; };
  function valueAt(list, t) { var s = list.slice(0); s.sort(function (a, b) { return a.t - b.t; }); var v = s[0].v;
    for (var i = 0; i < s.length; i++) { if (s[i].t <= t) v = s[i].v; else { var a = s[i - 1]; if (a) v = a.v + (s[i].v - a.v) * (t - a.t) / (s[i].t - a.t); break; } } return v; }
  // landing dust: four grey pixels kicked out sideways from the feet
  function dust(comp, name, world, x, y, t) { var d = PX * .6, it = [];
    for (var i = 0; i < 4; i++) it.push({ k: "rect", x: -d / 2, y: -d, w: d, h: d, fill: PALETTE.dust });
    var L = shp(comp, name, it, { parent: world, t0: t, t1: t + .32 }); L.position.setValue([x, y]); L.anchorPoint.setValue([0, 0]);
    var root = L.property("ADBE Root Vectors Group"), dx = [-70, -40, 40, 70], dy = [-14, -30, -30, -14];
    for (var g = 1; g <= 4; g++) { var tp = root.property(g).property("ADBE Vector Transform Group").property("ADBE Vector Position");
      keys(tp, [K(t, [0, 0], "lin"), K(t + .3, [dx[g - 1], dy[g - 1]], "settle")]); }
    keys(L.opacity, [K(t, 100, "lin"), K(t + .3, 0, "lin")]); return L; }

  // ---- the cursor: the user. Smoothed paths, a small push and a ripple on every click; hidden while typing ----
  function Cursor(comp, P, world, x0, y0) { this.comp = comp; this.P = P; this.world = world; this.pos = [K(0, [x0, y0], "travel")]; this.clicks = []; this.op = [K(0, 100, "hold")]; this.at = [x0, y0]; }
  Cursor.prototype.move = function (t0, t1, x, y) { this.pos.push(K(t0, this.at, "travel"), K(t1, [x, y], "travel")); this.at = [x, y]; return this; };
  Cursor.prototype.click = function (t) { this.clicks.push({ t: t, x: this.at[0], y: this.at[1] }); return this; };
  Cursor.prototype.hide = function (t0, t1) { this.op.push(K(t0, 0, "hold"), K(t1, 100, "hold")); return this; };
  Cursor.prototype.finish = function () { var comp = this.comp, P = this.P, s = 1.45, a = [[0, 0], [0, 36], [9, 28], [15, 41], [21, 38], [15, 26], [26, 26]], v = [];
    for (var i = 0; i < a.length; i++) v.push([a[i][0] * s, a[i][1] * s]);
    for (var c = 0; c < this.clicks.length; c++) { var k = this.clicks[c], R = shp(comp, P + "_RIPPLE" + c, [{ k: "ell", x: -40, y: -40, w: 80, h: 80, stroke: PALETTE.accent, sw: 4 }], { parent: this.world, t0: k.t, t1: k.t + .36 });
      R.position.setValue([k.x, k.y]); keys(R.scale, [K(k.t, scl(R, 15, 15), "lin"), K(k.t + .34, scl(R, 100, 100), "settle")]); keys(R.opacity, [K(k.t, 80, "lin"), K(k.t + .34, 0, "lin")]); }
    var L = shp(comp, P + "_CURSOR", [{ k: "path", v: v, fill: [0, 0, 0], stroke: [1, 1, 1], sw: 3.2 }], { parent: this.world });
    var ds = fx(L, "ADBE Drop Shadow"), dop = ds.property("Opacity"); dop.setValue(dop.hasMax && dop.maxValue > 100 ? 80 : 32); ds.property("Distance").setValue(4); ds.property("Softness").setValue(10);
    keys(L.position, this.pos); keys(L.opacity, this.op);
    var S = [K(0, scl(L, 100, 100), "settle")];
    for (var j = 0; j < this.clicks.length; j++) { var t = this.clicks[j].t; S.push(K(t - .04, scl(L, 100, 100), "settle"), K(t + .03, scl(L, 80, 80), "settle"), K(t + .16, scl(L, 100, 100), "settle")); }
    keys(L.scale, S); return L; };

  // ---- the camera: recording software. A world null, zoom >= 1 and clamped so the frame never leaves the screen ----
  function camAt(W, H, s, cx, cy) { var px = W / 2 - s * cx, py = H / 2 - s * cy; px = Math.min(0, Math.max(W - s * W, px)); py = Math.min(0, Math.max(H - s * H, py)); return [px, py]; }

  function wordsIn(list, t0, t1) { var r = []; for (var i = 0; i < list.length; i++) if (list[i].s >= t0 - .05 && list[i].s < t1 - .01) r.push(list[i]); return r; }
  function onset(ws, i, fb) { return ws[i] ? ws[i].s : fb; }
  function clearOwned(comp, prefix) { AESLib.clearOwned(comp, prefix); }

  // buildScene: the shared test scene (production/styles/scene) as a screencast of a proof tool whose beat strip lists the scene's real beats.
  // comp = an empty 1080 x 1920 comp at scene.fps. The UI is light; the mascot is the only saturated hue; overlays sit in screen space.
  function buildScene(comp, scene, opts) {
    fontOK(); TXT = [];
    var P = opts.prefix || "LSC", PAL = PALETTE, A = opts.assets, B = scene.beat, W = comp.width, H = comp.height, WL = scene.wordList, notes = [], fps = scene.fps;
    clearOwned(comp, P);
    var WIN = { x: 36, y: 130, w: 1008, h: 1564 }, WR = WIN.x + WIN.w, WB = WIN.y + WIN.h, ink = PAL.ink, mut = PAL.muted;
    var WORLD = comp.layers.addNull(); WORLD.name = P + "_WORLD"; WORLD.anchorPoint.setValue([0, 0]); WORLD.position.setValue([0, 0]);
    function own(L) { L.parent = WORLD; return L; }

    // wallpaper (larger than the screen, never seen past its edge) and the menu bar
    var wall = own(comp.layers.addSolid(PAL.wallBottom, P + "_WALL", W + 400, H + 400, 1)); wall.position.setValue([W / 2, H / 2]);
    var rp = fx(wall, "ADBE Ramp"); rp.property("Start of Ramp").setValue([200, 200]); rp.property("Start Color").setValue(c4(PAL.wallTop)); rp.property("End of Ramp").setValue([W + 200, H + 200]); rp.property("End Color").setValue(c4(PAL.wallBottom));
    shp(comp, P + "_MENUBAR", [{ k: "rect", x: -200, y: 0, w: W + 400, h: 48, fill: [1, 1, 1], op: 55 }], { parent: WORLD });
    txt(comp, P + "_MENU_APP", "Proof", { style: "Bold", size: 22, x: 24, y: 32, parent: WORLD });
    var menu = ["File", "Edit", "View", "Window", "Help"], mx = 104;
    for (var mi = 0; mi < menu.length; mi++) { txt(comp, P + "_MENU" + mi, menu[mi], { size: 22, x: mx, y: 32, parent: WORLD }); mx += measure(comp, menu[mi], 22) + 30; }
    txt(comp, P + "_CLOCK", "Fri 9:41", { size: 22, x: W - 24, y: 32, align: "right", parent: WORLD });

    // the window: body with a soft shadow, title bar with traffic lights and a segmented control, the beat strip
    var win = shp(comp, P + "_WINDOW", [{ k: "rect", x: WIN.x, y: WIN.y, w: WIN.w, h: WIN.h, r: 26, fill: PAL.window, stroke: PAL.line, sw: 1.5 },
      { k: "rect", x: WIN.x + 1, y: WIN.y + 1, w: WIN.w - 2, h: 71, r: 25, fill: PAL.chrome }, { k: "rect", x: WIN.x + 1, y: WIN.y + 36, w: WIN.w - 2, h: 36, fill: PAL.chrome },
      { k: "rect", x: WIN.x, y: WIN.y + 72, w: WIN.w, h: 1.5, fill: PAL.line },
      { k: "ell", x: 70, y: 159, w: 15, h: 15, fill: PAL.red }, { k: "ell", x: 96, y: 159, w: 15, h: 15, fill: PAL.amber }, { k: "ell", x: 122, y: 159, w: 15, h: 15, fill: PAL.green },
      { k: "rect", x: 375, y: 146, w: 330, h: 40, r: 10, fill: PAL.chip }, { k: "rect", x: 379, y: 149, w: 104, h: 34, r: 8, fill: [1, 1, 1], stroke: PAL.line, sw: 1 }], { parent: WORLD });
    var wds = fx(win, "ADBE Drop Shadow"), wop = wds.property("Opacity"); wop.setValue(wop.hasMax && wop.maxValue > 100 ? 60 : 24);
    wds.property("Direction").setValue(180); wds.property("Distance").setValue(26); wds.property("Softness").setValue(90);
    var seg = ["Scene", "Style", "Render"];
    for (var si = 0; si < 3; si++) txt(comp, P + "_SEG" + si, seg[si], { size: 22, x: 431 + si * 110, y: 174, align: "center", color: si ? mut : ink, parent: WORLD });
    // beat strip: one chip per beat of the scene; a white, accent-ringed highlight moves to the beat that is playing
    var chips = [], cx = 72, beatIds = [];
    for (var bi = 0; bi < scene.beats.length; bi++) beatIds.push(scene.beats[bi].id);
    var chipItems = [];
    for (var ci = 0; ci < beatIds.length; ci++) { var cw = measure(comp, beatIds[ci], 22) + 34; chips.push({ x: cx, w: cw }); chipItems.push({ k: "rect", x: cx, y: 226, w: cw, h: 40, r: 20, fill: PAL.chip }); cx += cw + 10; }
    shp(comp, P + "_CHIPS", chipItems, { parent: WORLD });
    var hl = shp(comp, P + "_CHIPHL", [{ k: "rect", x: 0, y: 0, w: 100, h: 40, r: 20, fill: [1, 1, 1], stroke: PAL.accent, sw: 2.5 }], { parent: WORLD });
    var hlS = [], hlP = [];
    for (var hi = 0; hi < chips.length; hi++) { var tb = scene.beats[hi].t0; hlS.push(K(tb, [chips[hi].w, 40], "hold")); hlP.push(K(tb, [chips[hi].x + chips[hi].w / 2, 246], "hold")); }
    keys(rectProp(hl, "Size"), hlS); keys(rectProp(hl, "Position"), hlP);
    for (var ti = 0; ti < chips.length; ti++) txt(comp, P + "_CHIPT" + ti, beatIds[ti], { size: 22, x: chips[ti].x + chips[ti].w / 2, y: 254, align: "center", parent: WORLD });
    // canvas header: the document name, and the button the user will click
    txt(comp, P + "_DOC", "shared-v1", { style: "Bold", size: 30, x: 72, y: 332, parent: WORLD });
    txt(comp, P + "_DOCN", scene.beats.length + " beats", { size: 24, x: 72 + measure(comp, "shared-v1", 30, UI, "Bold") + 16, y: 332, color: mut, parent: WORLD });
    var BTN = { x: 832, y: 298, w: 176, h: 48 };
    var btn = shp(comp, P + "_BTN", [{ k: "rect", x: BTN.x, y: BTN.y, w: BTN.w, h: BTN.h, r: 12, fill: [1, 1, 1], stroke: PAL.line, sw: 1.5 }], { parent: WORLD, ax: BTN.x + BTN.w / 2, ay: BTN.y + BTN.h / 2 });
    txt(comp, P + "_BTNT", "Open frame", { size: 24, x: BTN.x + BTN.w / 2, y: BTN.y + 32, align: "center", parent: WORLD });

    // the composer: placeholder, controls, send
    var CMP = { x: 72, y: 1494, w: 936, h: 160 }, sendC = [970, 1614];
    shp(comp, P + "_COMPOSER", [{ k: "rect", x: CMP.x, y: CMP.y, w: CMP.w, h: CMP.h, r: 24, fill: PAL.field, stroke: PAL.line, sw: 2 },
      { k: "rect", x: 104, y: 1594, w: 40, h: 40, r: 10, stroke: PAL.line, sw: 2 }, { k: "path", v: [[124, 1604], [124, 1624]], closed: false, stroke: mut, sw: 2.5, cap: true },
      { k: "path", v: [[114, 1614], [134, 1614]], closed: false, stroke: mut, sw: 2.5, cap: true },
      { k: "rect", x: 156, y: 1594, w: 104, h: 40, r: 10, stroke: PAL.line, sw: 2 }, { k: "rect", x: 270, y: 1594, w: 100, h: 40, r: 10, stroke: PAL.line, sw: 2 },
      { k: "ell", x: sendC[0] - 23, y: sendC[1] - 23, w: 46, h: 46, fill: PAL.accent },
      { k: "path", v: [[sendC[0], sendC[1] + 10], [sendC[0], sendC[1] - 10]], closed: false, stroke: [1, 1, 1], sw: 3.5, cap: true },
      { k: "path", v: [[sendC[0] - 8, sendC[1] - 2], [sendC[0], sendC[1] - 10], [sendC[0] + 8, sendC[1] - 2]], closed: false, stroke: [1, 1, 1], sw: 3.5, cap: true }], { parent: WORLD });
    txt(comp, P + "_CHIPN", "Native", { size: 22, x: 208, y: 1622, align: "center", parent: WORLD });
    txt(comp, P + "_CHIPF", scene.fps + " fps", { size: 22, x: 320, y: 1622, align: "center", parent: WORLD });
    var tLine = B.line.t0, tSend = B.carry.t0 + .02;
    txt(comp, P + "_PLACE", "Describe a change, or type / for commands", { size: 28, x: 104, y: 1548, color: mut, parent: WORLD, t0: 0, t1: tLine - .1 });
    txt(comp, P + "_PLACE2", "Describe a change, or type / for commands", { size: 28, x: 104, y: 1548, color: mut, parent: WORLD, t0: tSend + .06 });

    // 1. title: a diegetic empty-state heading, each word appearing on its spoken onset
    var tw = wordsIn(WL, B.title.t0, B.title.t1), ctx = B.title.context.split(" "), hero = B.title.hero.split(" "), tOut = B.picture.t0;
    var head = txt(comp, P + "_HEAD", B.title.context, { family: SERIF, size: 120, x: W / 2, y: 760, align: "center", parent: WORLD, t0: 0, t1: tOut + .22, full: tOut - .01 });
    var sub = txt(comp, P + "_SUB", B.title.hero, { size: 44, x: W / 2, y: 842, align: "center", color: mut, parent: WORLD, t0: 0, t1: tOut + .22, full: tOut - .06 });
    var hs = [" "], ht = [0], ss = [" "], st = [0];
    for (var hw = 0; hw < ctx.length; hw++) { hs.push(ctx.slice(0, hw + 1).join(" ")); ht.push(onset(tw, hw, .05 + .15 * hw)); }
    for (var sw = 0; sw < hero.length; sw++) { ss.push(hero.slice(0, sw + 1).join(" ")); st.push(onset(tw, ctx.length + sw, .4 + .15 * sw)); }
    AESLib.textKeys(head, ht, hs); AESLib.textKeys(sub, st, ss);
    var headTop = 760 + head.sourceRectAtTime(1.2, false).top, headR = head.sourceRectAtTime(1.2, false);
    keys(head.opacity, [K(tOut, 100, "lin"), K(tOut + .2, 0, "lin")]); keys(sub.opacity, [K(tOut - .05, 100, "lin"), K(tOut + .15, 0, "lin")]);
    keys(head.position, [K(tOut, [W / 2, 760], "settle"), K(tOut + .2, [W / 2, 720], "settle")]); keys(sub.position, [K(tOut - .05, [W / 2, 842], "settle"), K(tOut + .15, [W / 2, 802], "settle")]);

    // 2. picture: three tiles pop in on "Three", "pieces", "build"; on "picture" the user selects all three as one group
    var pw = wordsIn(WL, B.picture.t0, B.picture.t1), objs = B.picture.objects, TY = 520, TH = 340, TW = 280, tX = [92, 400, 708], tIn = [], tExit = B.input.t0 + .1;
    var ICON = {
      person: function (x, y) { var c = x + TW / 2; return [{ k: "ell", x: c - 42, y: y + 62, w: 84, h: 84, fill: ink }, { k: "rect", x: c - 76, y: y + 158, w: 152, h: 92, r: 40, fill: ink }, { k: "rect", x: c - 76, y: y + 210, w: 152, h: 40, fill: ink }]; },
      document: function (x, y) { var c = x + TW / 2, it = [{ k: "rect", x: c - 66, y: y + 52, w: 132, h: 176, r: 10, fill: [1, 1, 1], stroke: ink, sw: 4 }, { k: "rect", x: c - 44, y: y + 84, w: 60, h: 12, r: 6, fill: PAL.accent }];
        for (var l = 0; l < 4; l++) it.push({ k: "rect", x: c - 44, y: y + 116 + 24 * l, w: l === 3 ? 56 : 88, h: 10, r: 5, fill: PAL.line }); return it; },
      device: function (x, y) { var c = x + TW / 2; return [{ k: "rect", x: c - 54, y: y + 44, w: 108, h: 196, r: 20, fill: ink }, { k: "rect", x: c - 44, y: y + 62, w: 88, h: 148, r: 8, fill: PAL.accent },
        { k: "rect", x: c - 16, y: y + 220, w: 32, h: 8, r: 4, fill: PAL.chip }]; }
    };
    var tiles = [];
    for (var oi = 0; oi < objs.length && oi < 3; oi++) { var x0 = tX[oi], t1 = onset(pw, oi, B.picture.t0 + .3 * oi);
      var items = [{ k: "rect", x: x0, y: TY, w: TW, h: TH, r: 20, fill: [1, 1, 1], stroke: PAL.line, sw: 2 }].concat((ICON[objs[oi]] || ICON.document)(x0, TY));
      var T = shp(comp, P + "_TILE" + oi, items, { parent: WORLD, ax: x0 + TW / 2, ay: TY + TH / 2, t0: t1, t1: tExit + .22 });
      var lab = txt(comp, P + "_TILEL" + oi, objs[oi], { size: 28, x: x0 + TW / 2, y: TY + 296, align: "center", t0: t1, t1: tExit + .22 });
      var idx = txt(comp, P + "_TILEN" + oi, "0" + (oi + 1), { family: MONO, style: "Regular", size: 20, x: x0 + 20, y: TY + 38, color: mut, t0: t1, t1: tExit + .22 });
      lab.parent = T; idx.parent = T;
      keys(T.scale, [K(t1, scl(T, 92, 92), "lin"), K(t1 + .2, scl(T, 100, 100), "settle"), K(tExit + .02 * oi, scl(T, 100, 100), "settle"), K(tExit + .02 * oi + .2, scl(T, 96, 96), "lin")]);
      keys(T.opacity, [K(t1, 0, "lin"), K(t1 + .12, 100, "lin"), K(tExit + .02 * oi, 100, "lin"), K(tExit + .02 * oi + .2, 0, "lin")]);
      keys(T.position, [K(tExit + .02 * oi, [x0 + TW / 2, TY + TH / 2], "settle"), K(tExit + .02 * oi + .2, [x0 + TW / 2, TY + TH / 2 - 30], "settle")]);
      tiles.push(T); tIn.push(t1); }
    var tPic = onset(pw, 4, B.picture.t0 + 1.1), G = { x: 80, y: TY - 12, w: 920, h: TH + 24 }, hd = 14, sel = [{ k: "rect", x: G.x, y: G.y, w: G.w, h: G.h, r: 6, stroke: PAL.accent, sw: 3 }];
    var corners = [[G.x, G.y], [G.x + G.w, G.y], [G.x, G.y + G.h], [G.x + G.w, G.y + G.h]];
    for (var cn = 0; cn < 4; cn++) sel.push({ k: "rect", x: corners[cn][0] - hd / 2, y: corners[cn][1] - hd / 2, w: hd, h: hd, r: 2, fill: [1, 1, 1], stroke: PAL.accent, sw: 2.5 });
    var SEL = shp(comp, P + "_SELECT", sel, { parent: WORLD, t0: tPic, t1: tExit + .02 });
    var selT = txt(comp, P + "_SELECTT", "1 picture  \u00B7  " + objs.length + " pieces", { size: 22, x: G.x, y: G.y - 14, color: PAL.accent, parent: WORLD, t0: tPic + .06, t1: tExit + .02 });

    // 3. input: the dialog-to-be is built first (it sits under the card); the card opens when the user clicks "Open frame"
    var DLG = { cx: W / 2, cy: 870, w: 780, h: 900 }, tMorph = onset(wordsIn(WL, B.carry.t0, B.carry.t1), 3, B.carry.t0 + .55) - .02, tMorphE = tMorph + .5;
    var dim = shp(comp, P + "_DIM", [{ k: "rect", x: WIN.x, y: WIN.y, w: WIN.w, h: WIN.h, r: 26, fill: [0, 0, 0] }], { parent: WORLD, t0: tMorph });
    keys(dim.opacity, [K(tMorph, 0, "lin"), K(tMorph + .3, 16, "lin")]);
    var dlg = shp(comp, P + "_DIALOG", [{ k: "rect", x: 0, y: 0, w: 100, h: 100, r: 22, fill: [1, 1, 1], stroke: PAL.line, sw: 1.5 }], { parent: WORLD, t0: tMorph });
    var dds = fx(dlg, "ADBE Drop Shadow"), dop = dds.property("Opacity"); dop.setValue(dop.hasMax && dop.maxValue > 100 ? 70 : 28); dds.property("Direction").setValue(180); dds.property("Distance").setValue(30); dds.property("Softness").setValue(110);
    var tOpen = B.input.t0 + .08, CARD = { x: 297, y: 400, w: 486, hh: 52 }, img = AESLib.importFile(A.frame), ik = CARD.w / img.width * 100, IH = img.height * ik / 100, CH = CARD.hh + IH;
    keys(rectProp(dlg, "Size"), [K(tMorph, [CARD.w, CH], "travel"), K(tMorphE, [DLG.w, DLG.h], "travel")]);
    keys(rectProp(dlg, "Position"), [K(tMorph, [W / 2, CARD.y + CH / 2], "travel"), K(tMorphE, [DLG.cx, DLG.cy], "travel")]);
    var cardN = comp.layers.addNull(); cardN.name = P + "_CARD"; cardN.anchorPoint.setValue([0, 0]); cardN.position.setValue([W / 2, CARD.y]); cardN.parent = WORLD;
    var cbg = shp(comp, P + "_CARDBG", [{ k: "rect", x: CARD.x, y: CARD.y, w: CARD.w, h: CH, r: 18, fill: [1, 1, 1], stroke: PAL.line, sw: 1.5 }], { t0: tOpen, t1: tMorph + .02 });
    var cds = fx(cbg, "ADBE Drop Shadow"), cop = cds.property("Opacity"); cop.setValue(cop.hasMax && cop.maxValue > 100 ? 50 : 20); cds.property("Direction").setValue(180); cds.property("Distance").setValue(16); cds.property("Softness").setValue(60);
    var ph = comp.layers.add(img); ph.name = P + "_FRAME"; ph.anchorPoint.setValue([0, 0]); ph.scale.setValue(scl(ph, ik, ik)); ph.position.setValue([CARD.x, CARD.y + CARD.hh]); ph.inPoint = tOpen;
    var pm = ph.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"); pm.property("ADBE Mask Shape").setValue(roundRect(0, 0, img.width, img.height, 18 / ik * 100));
    var fname = txt(comp, P + "_CARDNAME", "clip.mp4", { size: 22, x: CARD.x + 20, y: CARD.y + 34, t0: tOpen, t1: tMorph + .02 });
    var fmeta = txt(comp, P + "_CARDMETA", "frame 135", { family: MONO, style: "Regular", size: 20, x: CARD.x + CARD.w - 20, y: CARD.y + 34, align: "right", color: mut, t0: tOpen, t1: tMorph + .02 });
    var cardKids = [cbg, ph, fname, fmeta]; for (var ck = 0; ck < cardKids.length; ck++) cardKids[ck].parent = cardN;
    var gb = fx(ph, "ADBE Gaussian Blur 2"); gb.property("Blurriness").setValue(0);
    keys(cardN.scale, [K(tOpen, scl(cardN, 90, 90), "lin"), K(tOpen + .22, scl(cardN, 100, 100), "settle"), K(tMorph, scl(cardN, 100, 100), "travel"), K(tMorphE, scl(cardN, 62, 62), "travel")]);
    keys(cardN.position, [K(tMorph, [W / 2, CARD.y], "travel"), K(tMorphE, [W / 2, 466], "travel")]);
    var cardOp = [K(tOpen, 0, "lin"), K(tOpen + .1, 100, "lin")]; for (var co = 0; co < cardKids.length; co++) keys(cardKids[co].opacity, cardOp.slice(0));
    for (var cf = 2; cf < 4; cf++) keys(cardKids[cf].opacity, [K(tOpen, 0, "lin"), K(tOpen + .1, 100, "lin"), K(tMorph - .12, 100, "lin"), K(tMorph, 0, "lin")]);
    keys(btn.scale, [K(B.input.t0 + .02, scl(btn, 100, 100), "settle"), K(B.input.t0 + .06, scl(btn, 95, 95), "settle"), K(B.input.t0 + .18, scl(btn, 100, 100), "settle")]);

    // 4. number: the app counts the clip's frames (a time-lapse, with a tag), the bar fills, the spinner becomes a check on "counted"
    var nw = wordsIn(WL, B.number.t0, B.number.t1), nT0 = B.number.t0 + .14, nT1 = onset(nw, 1, nT0 + .6), tCounted = onset(nw, 2, nT1 + .6), BAR = { x: CARD.x, y: 1350, w: CARD.w }, tRowOut = B.line.t0 - .08;
    shp(comp, P + "_TRACK", [{ k: "rect", x: BAR.x, y: BAR.y, w: BAR.w, h: 10, r: 5, fill: PAL.chip }], { parent: WORLD, t0: B.number.t0, t1: tRowOut });
    var fill = shp(comp, P + "_FILL", [{ k: "rect", x: BAR.x, y: BAR.y, w: BAR.w, h: 10, r: 5, fill: PAL.accent }], { parent: WORLD, ax: BAR.x, ay: BAR.y + 5, t0: nT0, t1: tRowOut });
    keys(fill.scale, [K(nT0, scl(fill, 0, 100), "lin"), K(nT1, scl(fill, 100, 100), "lin")]);
    var spin = shp(comp, P + "_SPIN", [{ k: "ell", x: -11, y: -11, w: 22, h: 22, stroke: PAL.accent, sw: 3.5, cap: true }], { parent: WORLD, t0: B.number.t0, t1: tCounted });
    spin.position.setValue([BAR.x + 11, 1396]); var trim = spin.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").addProperty("ADBE Vector Filter - Trim");
    trim.property("ADBE Vector Trim End").setValue(70); spin.rotation.expression = "time * 540";
    var chk = shp(comp, P + "_CHECK", [{ k: "path", v: [[BAR.x, 1396], [BAR.x + 8, 1404], [BAR.x + 22, 1386]], closed: false, stroke: PAL.green, sw: 4, cap: true }], { parent: WORLD, t0: tCounted, t1: tRowOut });
    var ct = chk.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").addProperty("ADBE Vector Filter - Trim").property("ADBE Vector Trim End");
    keys(ct, [K(tCounted, 0, "lin"), K(tCounted + .16, 100, "settle")]);
    var status = txt(comp, P + "_STATUS", "Counting frames", { size: 24, x: BAR.x + 34, y: 1404, color: mut, parent: WORLD, t0: B.number.t0, t1: tRowOut });
    AESLib.textKeys(status, [0, tCounted], ["Counting frames", "Counted"]);
    var N = B.number.value, cnt = txt(comp, P + "_COUNT", N + " " + B.number.label, { family: MONO, style: "Regular", size: 30, x: BAR.x + BAR.w, y: 1406, align: "right", parent: WORLD, t0: B.number.t0, t1: tRowOut, full: tRowOut - .3 });
    var cs = [], pad = String(N).length;
    for (var f = 0; f * (1 / fps) < nT1 - nT0 + 1e-6; f++) { var vN = Math.round(N * Math.min(1, f / ((nT1 - nT0) * fps))), sN = String(vN); while (sN.length < pad) sN = " " + sN; cs.push(sN); }
    var ctimes = [0], cstr = [cs[0]]; for (var cc = 1; cc < cs.length; cc++) if (cs[cc] !== cs[cc - 1]) { ctimes.push(nT0 + cc / fps); cstr.push(cs[cc]); }
    ctimes.push(nT1 + .02); cstr.push(N + " " + B.number.label); AESLib.textKeys(cnt, ctimes, cstr);
    keys(gb.property("Blurriness"), [K(nT0, 0, "lin"), K(nT0 + .3, 7, "lin"), K(B.carry.t0 + .05, 7, "lin"), K(B.carry.t0 + .3, 0, "lin")]);   // rack focus off the picture
    var rowKids = [comp.layer(P + "_TRACK"), fill, chk, status, cnt];   // the status row clears once the count is done (the mascot needs the lane)
    for (var rk = 0; rk < rowKids.length; rk++) keys(rowKids[rk].opacity, [K(tRowOut - .2, 100, "lin"), K(tRowOut, 0, "lin")]);

    // 5. line: the user clicks into the composer; the spoken line is typed on as it is said; the caret follows; the key HUD echoes the keys
    var lw = wordsIn(WL, B.line.t0, B.carry.t0), words = [], wordsT = [];
    for (var li = 0; li < lw.length; li++) { words.push(lw[li].text); wordsT.push(lw[li]); }
    function typedAt(t) { var s = "";
      for (var q = 0; q < wordsT.length; q++) { var w = wordsT[q], e = q < wordsT.length - 1 ? Math.min(w.e, wordsT[q + 1].s) : w.e - .05;
        if (t < w.s) break; var n = Math.max(1, Math.min(w.text.length, Math.ceil((t - w.s) / Math.max(.03, e - w.s) * w.text.length))); s += (q ? " " : "") + w.text.slice(0, n); }
      return s; }
    var typed = txt(comp, P + "_TYPED", words.join(" "), { size: 34, x: 104, y: 1550, parent: WORLD, t0: tLine, t1: tSend + .04 }), tstr = [], hstr = [];
    for (var tf = 0; tLine + tf / fps < B.carry.t0; tf++) { var sT = typedAt(tLine + tf / fps); tstr.push(sT); hstr.push(sT.length > 15 ? sT.slice(sT.length - 15) : sT); }
    AESLib.bakeText(typed, tstr, fps, tLine);
    var caret = shp(comp, P + "_CARET", [{ k: "rect", x: -1.5, y: -36, w: 3, h: 44, fill: PAL.accent }], { parent: WORLD, t0: tLine - .12, t1: tSend + .04 });
    caret.position.expression = 'var L = thisComp.layer("' + P + '_TYPED"); var r = L.sourceRectAtTime(time, false); var w = (time < ' + (tLine + .02) + ') ? 0 : r.left + r.width; [L.transform.position[0] - L.transform.anchorPoint[0] + w + 5, L.transform.position[1]]';
    caret.opacity.expression = 'var lastKey = ' + (wordsT.length ? wordsT[wordsT.length - 1].e : tSend) + '; (time > lastKey || time < ' + tLine + ') ? ((Math.floor(time * 3) % 2) ? 0 : 100) : 100';
    var wx = [];
    for (var wi = 0; wi < words.length; wi++) { var endW = measure(comp, words.slice(0, wi + 1).join(" "), 34), wW = measure(comp, words[wi], 34); wx.push(104 + endW - wW / 2); }

    // 6. carry and 7. end: the dialog's content (the picture card itself becomes its thumbnail)
    var ew = wordsIn(WL, B.end.t0, B.end.t1), endWords = B.end.text.split(" "), dTitleY = 1110;
    var dTitle = txt(comp, P + "_ENDTITLE", B.end.text, { family: SERIF, size: 76, x: W / 2, y: dTitleY, align: "center", parent: WORLD, t0: B.end.t0 - .02, full: B.end.t1 - .05 });
    var ets = [], ess = [];
    for (var ei = 0; ei < endWords.length; ei++) { ets.push(onset(ew, ei, B.end.t0 + .3 * ei)); ess.push(endWords.slice(0, ei + 1).join(" ")); }
    AESLib.textKeys(dTitle, ets, ess);
    var dSub = txt(comp, P + "_ENDSUB", "shared-v1  \u00B7  " + scene.beats.length + " beats  \u00B7  " + N + " frames", { size: 26, x: W / 2, y: 1168, align: "center", color: mut, parent: WORLD, t0: tMorphE - .1 });
    var done = shp(comp, P + "_DONE", [{ k: "rect", x: W / 2 - 84, y: 1206, w: 168, h: 56, r: 14, fill: PAL.accent }], { parent: WORLD, ax: W / 2, ay: 1234, t0: tMorphE - .05 });
    var doneT = txt(comp, P + "_DONET", "Done", { style: "Bold", size: 26, x: W / 2, y: 1243, align: "center", color: [1, 1, 1], parent: WORLD, t0: tMorphE - .05 });
    var dOp = [K(tMorphE - .1, 0, "lin"), K(tMorphE + .1, 100, "lin")]; keys(dSub.opacity, dOp.slice(0)); keys(done.opacity, dOp.slice(0)); keys(doneT.opacity, dOp.slice(0));
    var titleR = dTitle.sourceRectAtTime(B.end.t1 - .1, false), titleTop = dTitleY + titleR.top, titleRight = W / 2 + titleR.width / 2;

    // ---- the actors ----
    var hwTop = headTop, mas = new Mascot(comp, P, WORLD, 880, WIN.y);
    mas.look(0, "down").blink(.42);
    mas.hop(.72, 1.0, W / 2 + headR.width / 2 - 120, hwTop, 90).look(1.0, "happy").look(1.2, "left");
    var tTop = TY;
    mas.hop(Math.max(1.12, tIn[0] - .12), tIn[0] + .14, tX[0] + TW / 2, tTop, 80).look(tIn[0] + .16, "right");
    mas.hop(tIn[1] + .08, tIn[2] + .02, tX[1] + TW / 2, tTop, 60).look(tIn[2] + .05, "right").blink(2.2);
    mas.hop(tIn[2] + .2, tPic, tX[2] + TW / 2, tTop, 60).look(tPic, "happy").look(tPic + .3, "up");
    mas.hop(tExit - .06, tOpen + .26, W / 2 + 120, CARD.y, 80).look(tOpen + .3, "down").look(B.input.t0 + 1.1, "neutral").blink(4.05);
    var rideX0 = BAR.x + 40, rideX1 = BAR.x + BAR.w - 40;
    mas.hop(nT0 - .26, nT0 + .02, rideX0, BAR.y, 40).look(nT0, "right").ride(nT0 + .02, nT1, rideX1, BAR.y, "lin", true).look(nT1, "down");
    mas.look(tCounted, "happy").look(tCounted + .3, "left");
    var kHops = [];                                                              // karaoke ball: one landing per spoken word (words closer than 0.12 s share a hop)
    for (var kh = 0; kh < wordsT.length; kh++) if (!kHops.length || wordsT[kh].s - kHops[kHops.length - 1].t > .12) kHops.push({ t: wordsT[kh].s, x: wx[kh] }); else kHops[kHops.length - 1].x = wx[kh];
    if (kHops.length) { mas.hop(kHops[0].t - .3, kHops[0].t, kHops[0].x, CMP.y, 60).look(kHops[0].t, "down");
      for (var kk = 1; kk < kHops.length; kk++) { var gap = kHops[kk].t - kHops[kk - 1].t; mas.hop(kHops[kk - 1].t + Math.max(.06, .4 * gap), kHops[kk].t, kHops[kk].x, CMP.y, 24); } }
    mas.look(B.line.t1 - .05, "up");
    var tWhip0 = tSend + .06, tWhip1 = tWhip0 + .3;
    mas.hop(tWhip0, tWhip1, W / 2, CARD.y, 60).look(tWhip1, "neutral").blink(tWhip1 + .4);
    mas.ride(tMorph, tMorphE, W / 2, 466, "travel", false).look(tMorphE, "down");
    var landEnd = ets[ets.length - 1];
    mas.hop(landEnd - .3, landEnd, titleRight - 100, titleTop, 70).look(landEnd, "happy");
    var tSleep = B.end.t1 - .62;
    mas.cheer(landEnd + .42).look(landEnd + .64, "neutral").look(tSleep, "shut");
    var cur = new Cursor(comp, P, WORLD, 760, 1130);
    cur.move(B.picture.t0 + 1.1, B.input.t0 - .02, BTN.x + 120, BTN.y + 30).click(B.input.t0 + .02);
    cur.move(B.input.t0 + .35, B.input.t0 + .9, 960, 980);
    cur.move(B.number.t1 - .55, tLine - .14, 560, 1580).click(tLine - .12).hide(tLine + .02, tSend - .22);
    cur.move(tSend - .22, tSend - .04, sendC[0] + 4, sendC[1] + 4).click(tSend);
    cur.move(tSend + .2, tSend + .7, 930, 1260);
    cur.move(B.end.t0 + .7, B.end.t0 + 1.2, W / 2 + 40, 1240);
    // sleep: two pixel z's rise from the mascot
    var zPix = [[0, 0], [1, 0], [2, 0], [1, 1], [0, 2], [1, 2], [2, 2]];
    for (var zi = 0; zi < 2; zi++) { var zt = tSleep + .12 + .26 * zi, zs = [], zp = PX * .55;
      for (var zq = 0; zq < zPix.length; zq++) zs.push({ k: "rect", x: zPix[zq][0] * zp, y: zPix[zq][1] * zp, w: zp + .5, h: zp + .5, fill: PAL.muted });
      var Z = shp(comp, P + "_ZZ" + zi, zs, { parent: WORLD, t0: zt });
      keys(Z.position, [K(zt, [titleRight - 70 + 22 * zi, titleTop - 120], "lin"), K(B.end.t1, [titleRight - 40 + 30 * zi, titleTop - 190 - 30 * zi], "lin")]);
      keys(Z.opacity, [K(zt, 0, "lin"), K(zt + .12, 100, "lin")]); }
    cur.finish();
    mas.finish();

    // ---- the camera: drift at rest, push in to the cursor and the caret, a whip with blur, pull back, a spotlight push on the promise ----
    var C = [[0, 1, 540, 960, "lin"], [B.picture.t0 - .05, 1.04, 540, 820, "travel"], [B.picture.t0 + .3, 1.1, 540, 700, "travel"], [B.input.t0 - .3, 1.12, 560, 690, "lin"],
      [B.input.t0 + .08, 1.26, 780, 560, "travel"], [B.input.t0 + .65, 1.3, 540, 860, "travel"], [B.number.t0 - .05, 1.33, 540, 880, "lin"],
      [nT0 + .3, 1.55, 540, 1330, "travel"], [B.number.t1 - .2, 1.58, 560, 1340, "lin"], [tLine + .1, 1.72, 360, 1560, "travel"], [B.line.t1 - .08, 1.74, 470, 1560, "lin"],
      [tWhip1, 1.22, 540, 780, "travel"], [tMorph, 1.22, 540, 790, "lin"], [tMorphE + .05, 1, 540, 960, "travel"], [B.end.t0 + .04, 1, 540, 960, "travel"],
      [B.end.t0 + .7, 1.24, 540, 900, "travel"], [B.end.t1, 1.27, 540, 905, "lin"]];
    var CS = [], CP = [];
    for (var cm = 0; cm < C.length; cm++) { CS.push(K(C[cm][0], scl(WORLD, C[cm][1] * 100, C[cm][1] * 100), C[cm][4])); CP.push(K(C[cm][0], camAt(W, H, C[cm][1], C[cm][2], C[cm][3]), C[cm][4])); }
    keys(WORLD.scale, CS); keys(WORLD.position, CP);
    var blur = comp.layers.addSolid([1, 1, 1], P + "_WHIPBLUR", W, H, 1); blur.adjustmentLayer = true; var db = fx(blur, "ADBE Motion Blur");
    db.property("Direction").setValue(0); keys(db.property("Blur Length"), [K(tWhip0, 0, "lin"), K((tWhip0 + tWhip1) / 2, 45, "lin"), K(tWhip1, 0, "lin")]);
    blur.inPoint = tWhip0 - .02; blur.outPoint = tWhip1 + .02;
    var vig = comp.layers.addSolid([0, 0, 0], P + "_VIGNETTE", W, H, 1), vm = vig.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"), vs = new Shape();
    vs.vertices = [[0, 0], [W, 0], [W, H], [0, H]]; vs.closed = true; vm.property("ADBE Mask Shape").setValue(vs); vm.inverted = true;
    vm.property("ADBE Mask Feather").setValue([420, 420]); vm.property("ADBE Mask Offset").setValue(-170);
    keys(vig.opacity, [K(B.end.t0 + .1, 0, "lin"), K(B.end.t0 + .7, 50, "settle")]); vig.inPoint = B.end.t0;

    // ---- overlays, in screen space: chapter pill, caption pill (frosted), time-lapse tag, key HUD ----
    var chapters = [[0, "01", "Open"], [B.input.t0, "02", "Count"], [B.line.t0, "03", "Type"], [B.carry.t0, "04", "Ship"]], CPW = 214;
    function frosted(name, items, t0, t1) { var M = shp(comp, name + "_MATTE", items, { t0: t0, t1: t1 }), Bl = comp.layers.addSolid([1, 1, 1], name + "_FROST", W, H, 1);
      Bl.adjustmentLayer = true; var bx = fx(Bl, "ADBE Box Blur2"); bx.property("Blur Radius").setValue(26); Bl.inPoint = t0; Bl.outPoint = t1;
      try { Bl.setTrackMatte(M, TrackMatteType.ALPHA); } catch (e) { M.moveBefore(Bl); Bl.trackMatteType = TrackMatteType.ALPHA; notes.push("legacy track matte"); }
      M.enabled = false; return [M, Bl]; }
    var chapFr = frosted(P + "_CHAP", [{ k: "rect", x: W / 2 - CPW / 2, y: 62, w: CPW, h: 46, r: 23, fill: [1, 1, 1] }], 0, B.end.t1);
    var chap = shp(comp, P + "_CHAP", [{ k: "rect", x: W / 2 - CPW / 2, y: 62, w: CPW, h: 46, r: 23, fill: [1, 1, 1], op: 62, stroke: [1, 1, 1], sw: 1.5, sop: 90 }], { ax: W / 2, ay: 85 });
    var chS = [K(0, scl(chap, 100, 100), "settle")];
    for (var ch = 0; ch < chapters.length; ch++) { var c0 = chapters[ch][0], c1 = ch < chapters.length - 1 ? chapters[ch + 1][0] : B.end.t1;
      var cnum = txt(comp, P + "_CHAPN" + ch, chapters[ch][1], { family: MONO, style: "Regular", size: 22, x: W / 2 - CPW / 2 + 26, y: 93, color: mut, t0: c0, t1: c1 });
      var clab = txt(comp, P + "_CHAPL" + ch, chapters[ch][2], { size: 24, x: W / 2 - CPW / 2 + 70, y: 93, t0: c0, t1: c1 });
      cnum.parent = chap; clab.parent = chap;
      if (ch) chS.push(K(c0 - .1, scl(chap, 100, 100), "snap"), K(c0, scl(chap, 0, 100), "lin"), K(c0 + .14, scl(chap, 100, 100), "snap")); }
    keys(chap.scale, chS);
    var lines = [B.title.context + " " + B.title.hero + ".", "Three pieces build one picture.", "Here's a real frame from my video.", N + " " + B.number.label + ", counted.", B.line.text, "Then one thing becomes the next.", B.end.text];
    var capY = 1790, pillS = [], capTimes = [];
    for (var cp = 0; cp < scene.beats.length; cp++) capTimes.push(scene.beats[cp].t0 === 0 ? .03 : scene.beats[cp].t0);
    for (var cq = 0; cq < lines.length; cq++) pillS.push(K(capTimes[cq], [measure(comp, lines[cq], 34) + 72, 78], "hold"));
    var capFr = frosted(P + "_CAP", [{ k: "rect", x: -50, y: -39, w: 100, h: 78, r: 39, fill: [1, 1, 1] }], capTimes[0], B.end.t1);
    capFr[0].position.setValue([W / 2, capY]); capFr[0].anchorPoint.setValue([0, 0]); keys(rectProp(capFr[0], "Size"), pillS.slice(0));
    var pill = shp(comp, P + "_CAPPILL", [{ k: "rect", x: -50, y: -39, w: 100, h: 78, r: 39, fill: [1, 1, 1], op: 66, stroke: [1, 1, 1], sw: 1.5, sop: 90 }], { t0: capTimes[0] });
    pill.anchorPoint.setValue([0, 0]); pill.position.setValue([W / 2, capY]);
    var pds = fx(pill, "ADBE Drop Shadow"), pop = pds.property("Opacity"); pop.setValue(pop.hasMax && pop.maxValue > 100 ? 40 : 16); pds.property("Direction").setValue(180); pds.property("Distance").setValue(6); pds.property("Softness").setValue(24); keys(rectProp(pill, "Size"), pillS.slice(0));
    for (var cl = 0; cl < lines.length; cl++) txt(comp, P + "_CAPT" + cl, lines[cl], { size: 34, x: W / 2, y: capY + 12, align: "center", t0: capTimes[cl], t1: cl < lines.length - 1 ? capTimes[cl + 1] : B.end.t1 });
    // time-lapse tag while the count runs
    var tag = shp(comp, P + "_TAG", [{ k: "rect", x: 890, y: 62, w: 150, h: 46, r: 12, fill: PAL.hud, op: 88 }], { t0: nT0, t1: nT1 + .1 });
    var tri = shp(comp, P + "_TAGTRI", [{ k: "path", v: [[910, 74], [928, 85], [910, 96]], fill: [1, 1, 1] }, { k: "path", v: [[930, 74], [948, 85], [930, 96]], fill: [1, 1, 1] }], { t0: nT0, t1: nT1 + .1 });
    var trk = []; for (var tb2 = nT0; tb2 < nT1 + .1; tb2 += .2) trk.push(K(tb2, Math.round((tb2 - nT0) / .2) % 2 ? 35 : 100, "hold")); keys(tri.opacity, trk);
    txt(comp, P + "_TAGT", "12\u00D7", { family: MONO, style: "Regular", size: 26, x: 962, y: 95, color: [1, 1, 1], t0: nT0, t1: nT1 + .1 });
    // key HUD while typing (KeyCastr-like): the last keys typed, then return
    var hud = shp(comp, P + "_KEYS", [{ k: "rect", x: W / 2 - 290, y: 1626, w: 580, h: 76, r: 18, fill: PAL.hud, op: 88 }], { t0: tLine, t1: tSend + .28 });
    var hudT = txt(comp, P + "_KEYST", "Every word I say", { family: MONO, style: "Regular", size: 34, x: W / 2 - 260, y: 1676, color: [1, 1, 1], t0: tLine, t1: tSend + .28 });
    AESLib.bakeText(hudT, hstr, fps, tLine); AESLib.textKeys(hudT, [tSend - .02], ["return"]);
    realign();
    return { layers: comp.numLayers, notes: notes };
  }
  return { PALETTE: PALETTE, PX: PX, fontOK: fontOK, keys: keys, shp: shp, txt: txt, measure: measure, Mascot: Mascot, Cursor: Cursor, camAt: camAt,
    wordsIn: wordsIn, clearOwned: clearOwned, buildScene: buildScene };
})();
