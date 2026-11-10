// Whiteboard style: brand-neutral ES3 helpers. No project mutation happens at load.
// Read styles/whiteboard/STYLE.md first. An explainer written live on one glossy dry-erase board: single-line handwriting written stroke by
// stroke (EMS Tech stroke data, OFL), floating markers with a cast shadow and no hand, magnets, and a camera that travels across the board
// instead of cutting. Ink multiplies onto the board; nothing fades in, bounces or animates as a block of type.
// Adapted from Lemo-Opuscar's whiteboard style (MIT, LemoLab); see library/styles/LICENSE-lemo-opuscar.txt.
var AESWhiteboard = (function () {
  var SUB = "Architects Daughter";
  var PALETTE = { board0: [.973, .969, .953], board1: [.910, .906, .886], wall: [.74, .73, .70], frame: [.66, .67, .69], ink: [.137, .149, .173],
    blue: [.165, .361, .702], accent: [.851, .467, .341], ghost: [.48, .50, .54], ghostBlue: [.50, .62, .82], label: [.985, .98, .97], magnet: [.22, .23, .26] };
  var PENS = { ink: PALETTE.ink, blue: PALETTE.blue, accent: PALETTE.accent };
  var FONT = null, JOBS = [], N = 0;
  function fontOK() { AESLib.font(SUB, "Regular"); return true; }
  function rng(seed) { var s = (seed >>> 0) || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function clamp(v, a, b) { if (v < a) return a; if (v > b) return b; return v; }
  function lerp(a, b, u) { return a + (b - a) * u; }
  function smooth(u) { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); }
  function travel(u) { u = clamp(u, 0, 1); return u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; }
  function hand(u) { return u - Math.sin(2 * Math.PI * u) / (2 * Math.PI) * .8; }         // slow-fast-slow along one stroke
  function dist(a, b) { var dx = b[0] - a[0], dy = b[1] - a[1]; return Math.sqrt(dx * dx + dy * dy); }
  function plen(p) { var L = 0; for (var i = 1; i < p.length; i++) L += dist(p[i - 1], p[i]); return L; }
  // a marker stroke from a raw polyline: resampled every ~0.6 x width, with a long, low hand wobble along the normal and a finer tremor.
  // A stroke shorter than its width becomes a dot (a font period is a 1 px stroke and would vanish).
  function marker(raw, w, R, amp) { var L = plen(raw); if (L < w * .9) { var c = raw[0]; return [[c[0], c[1]], [c[0] + .6, c[1] + .4]]; }
    var step = Math.max(3, w * .6), n = Math.max(2, Math.ceil(L / step)), out = [], seg = 0, acc = 0, a1 = amp === undefined ? clamp(w * .2, .7, 2.4) : amp,
      l1 = 260 + R() * 220, p1 = R() * 6.3, p2 = R() * 6.3;
    for (var k = 0; k <= n; k++) { var d = L * k / n;
      while (seg < raw.length - 2 && acc + dist(raw[seg], raw[seg + 1]) < d) { acc += dist(raw[seg], raw[seg + 1]); seg++; }
      var a = raw[seg], b = raw[seg + 1], sl = dist(a, b) || 1, u = clamp((d - acc) / sl, 0, 1), nx = -(b[1] - a[1]) / sl, ny = (b[0] - a[0]) / sl;
      var off = a1 * Math.sin(2 * Math.PI * d / l1 + p1) + .15 * Math.sin(2 * Math.PI * d / 46 + p2);
      out.push([lerp(a[0], b[0], u) + nx * off, lerp(a[1], b[1], u) + ny * off]); }
    return out; }
  // ---- the single-line hand ----
  // lay a string out in EMS Tech: o = { cap, w, center, right, maxW, seed, track, sx (horizontal condensing, default .86) }. Returns { words: [[stroke, ...], ...], width, cap }.
  // Each glyph gets a small rotation, baseline and scale jitter; strokes keep the font's writing order.
  function layout(str, x, y, o) { var g = FONT.g, cap = o.cap, sx = o.sx || .86, tr = (o.track || 1.04) * sx, width = 0, i;
    for (i = 0; i < str.length; i++) width += ((g[str.charAt(i)] || g["?"]).w) * cap * tr;
    if (o.maxW && width > o.maxW) { cap *= o.maxW / width; width = o.maxW; }
    var R = rng(o.seed || (str.length * 131 + Math.round(x) * 7 + Math.round(y))), w = o.w || clamp(cap * .1, 6, 22), words = [], cur = [];
    var px = x; if (o.center) px = x - width / 2; else if (o.right) px = x - width;   // never a nested ternary: ExtendScript groups it left to right
    for (i = 0; i < str.length; i++) { var ch = str.charAt(i), gl = g[ch] || g["?"], adv = gl.w * cap * tr;
      if (ch === " ") { if (cur.length) words.push(cur); cur = []; px += adv; continue; }
      var rot = (R() - .5) * .07, dy = (R() - .5) * cap * .07, sc = 1 + (R() - .5) * .06, cx = px + adv / 2, cr = Math.cos(rot), sr = Math.sin(rot);
      for (var s = 0; s < gl.s.length; s++) { var f = gl.s[s], pts = [];
        for (var j = 0; j < f.length; j += 2) { var gx = (f[j] - gl.w / 2) * cap * sc * sx, gy = f[j + 1] * cap * sc + .35 * cap;
          pts.push([cx + gx * cr - gy * sr, y + dy - .35 * cap + gx * sr + gy * cr]); }
        cur.push(marker(pts, w, R)); }
      px += adv; }
    if (cur.length) words.push(cur);
    return { words: words, width: width, cap: cap, w: w, x0: (o.center ? x - width / 2 : (o.right ? x - width : x)) }; }
  // ---- hand-drawn shapes (raw strokes go through marker()) ----
  function line(a, b, R, ov, bow) { var L = dist(a, b) || 1, ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L, o0 = (ov || 0) * (.4 + R() * .8), o1 = (ov || 0) * (.4 + R() * .8), bw = (bow === undefined ? .012 : bow) * L * (R() - .5) * 2, pts = [];
    for (var k = 0; k <= 8; k++) { var u = k / 8, s = Math.sin(Math.PI * u) * bw; pts.push([lerp(a[0] - ux * o0, b[0] + ux * o1, u) - uy * s, lerp(a[1] - uy * o0, b[1] + uy * o1, u) + ux * s]); }
    return pts; }
  function ellipse(cx, cy, rx, ry, R, a0, turns) { var pts = [], tot = 2 * Math.PI * (turns || 1) + .35 + R() * .25, n = Math.ceil(tot * Math.max(rx, ry) / 10), ph = R() * 6.3;
    for (var k = 0; k <= n; k++) { var a = a0 + tot * k / n, r = 1 + .025 * Math.sin(a * 2 + ph) + .012 * k / n; pts.push([cx + rx * r * Math.cos(a), cy + ry * r * Math.sin(a)]); }
    return pts; }
  function box(x, y, w, h, R, ov) { return [line([x, y], [x + w, y], R, ov), line([x + w, y], [x + w, y + h], R, ov), line([x + w, y + h], [x, y + h], R, ov), line([x, y + h], [x, y], R, ov)]; }
  function rbox(x, y, w, h, r, R) { var pts = [], c = [[x + w - r, y + r, -Math.PI / 2], [x + w - r, y + h - r, 0], [x + r, y + h - r, Math.PI / 2], [x + r, y + r, Math.PI]];
    for (var q = 0; q < 4; q++) for (var k = 0; k <= 6; k++) { var a = c[q][2] + Math.PI / 2 * k / 6; pts.push([c[q][0] + r * Math.cos(a), c[q][1] + r * Math.sin(a)]); }
    pts.push([pts[0][0] + 14, pts[0][1] + 1]); return pts; }
  function arrowHead(a, b, s, R) { var L = dist(a, b) || 1, ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L, k = .55 + R() * .1;
    return [[b[0] - s * (ux + uy * k), b[1] - s * (uy - ux * k)], b, [b[0] - s * (ux - uy * k), b[1] - s * (uy + ux * k)]]; }
  // ---- jobs: one writing pass of one pen over one window; each becomes one shape layer written by Trim Paths ----
  // strokes are raw marker polylines in board space; static jobs (ghosts) have no window.
  function job(name, pen, strokes, t0, t1, w, extra) { var j = { name: name, pen: pen, strokes: strokes, t0: t0, t1: t1, w: w || 8 };
    if (extra) for (var k in extra) j[k] = extra[k]; JOBS.push(j); return j; }
  // a written line: one job per word, each word on its own window (wins = [[t0, t1], ...]) or the words sharing one window by ink length
  function write(name, pen, str, x, y, o, wins) { var lay = layout(str, x, y, o), out = [], i;
    if (wins && wins.length === 2 && typeof wins[0] === "number") { var tot = 0, acc = 0, ls = [];
      for (i = 0; i < lay.words.length; i++) { var l = 0; for (var s = 0; s < lay.words[i].length; s++) l += plen(lay.words[i][s]) + 40; ls.push(l); tot += l; }
      var w0 = wins[0], span = wins[1] - wins[0]; wins = [];
      for (i = 0; i < ls.length; i++) { wins.push([w0 + span * acc / tot, w0 + span * (acc + ls[i]) / tot - .015]); acc += ls[i]; } }
    for (i = 0; i < lay.words.length; i++) { var wn = wins[Math.min(i, wins.length - 1)]; out.push(job(name + "_W" + i, pen, lay.words[i], wn[0], wn[1], lay.w)); }
    return { jobs: out, lay: lay }; }
  // the schedule inside a job: every stroke gets time for its length (and a floor), every lift between strokes a short hop; scaled to the window
  function schedule(j) { var n = j.strokes.length, wt = [], hop = [], tot = 0, i; j.len = []; j.cum = []; var c = 0;
    for (i = 0; i < n; i++) { var L = plen(j.strokes[i]); j.len.push(L); j.cum.push(c); c += L; wt.push(.05 + .0011 * L); tot += wt[i];
      if (i < n - 1) { hop.push(.012 + .00005 * dist(j.strokes[i][j.strokes[i].length - 1], j.strokes[i + 1][0])); tot += hop[i]; } }
    j.total = c || 1; var k = (j.t1 - j.t0) / (tot || 1), t = j.t0; j.st = []; j.du = [];
    for (i = 0; i < n; i++) { j.st.push(t); j.du.push(wt[i] * k); t += wt[i] * k; if (i < n - 1) t += hop[i] * k; } }
  function pointAt(p, d) { var acc = 0; for (var i = 1; i < p.length; i++) { var s = dist(p[i - 1], p[i]); if (acc + s >= d) { var u = s ? (d - acc) / s : 0; return [lerp(p[i - 1][0], p[i][0], u), lerp(p[i - 1][1], p[i][1], u)]; } acc += s; }
    return p[p.length - 1]; }
  // where this job's pen is at time t (board space), and whether it is touching the board
  function head(j, t) { var n = j.strokes.length;
    for (var i = 0; i < n; i++) { if (t < j.st[i]) { var a = j.strokes[i - 1], b = j.strokes[i], e = a[a.length - 1], u = smooth((t - (j.st[i - 1] + j.du[i - 1])) / (j.st[i] - j.st[i - 1] - j.du[i - 1] || 1));
        return { p: [lerp(e[0], b[0][0], u), lerp(e[1], b[0][1], u)], lift: .25 * Math.sin(Math.PI * u) }; }
      if (t <= j.st[i] + j.du[i]) return { p: pointAt(j.strokes[i], j.len[i] * hand((t - j.st[i]) / (j.du[i] || 1))), lift: 0 }; }
    var l = j.strokes[n - 1]; return { p: l[l.length - 1], lift: 0 }; }
  // ---- layers ----
  function grp(L) { return L.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group"); }
  function inkLayer(comp, P, j, pan) { var L = comp.layers.addShape(); L.name = P + "_" + j.name + "_" + (N++); L.parent = pan;
    var G = L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group"); G.name = "G";
    for (var i = 0; i < j.strokes.length; i++) { var s = new Shape(); s.vertices = j.strokes[i]; s.closed = false; grp(L).addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(s); }
    var St = grp(L).addProperty("ADBE Vector Graphic - Stroke"); St.property("ADBE Vector Stroke Color").setValue(j.color || PENS[j.pen] || PALETTE.ink);
    St.property("ADBE Vector Stroke Width").setValue(j.w); St.property("ADBE Vector Stroke Line Cap").setValue(2); St.property("ADBE Vector Stroke Line Join").setValue(2);
    L.anchorPoint.setValue([0, 0]); L.position.setValue([0, 0]);
    if (j.t0 !== undefined) { var T = grp(L).addProperty("ADBE Vector Filter - Trim"); T.property("ADBE Vector Trim Type").setValue(2);
      schedule(j); var ts = [], vs = [], S = [0, .2, .4, .6, .8, 1];
      for (var k = 0; k < j.strokes.length; k++) for (var q = 0; q < S.length; q++) { ts.push(j.st[k] + j.du[k] * S[q]); vs.push(100 * (j.cum[k] + j.len[k] * hand(S[q])) / j.total); }
      for (var z = 1; z < ts.length; z++) if (ts[z] <= ts[z - 1]) ts[z] = ts[z - 1] + .0005;
      grp(L).property("ADBE Vector Filter - Trim").property("ADBE Vector Trim End").setValuesAtTimes(ts, vs); L.inPoint = Math.max(0, j.t0 - .02); }
    L.blendingMode = BlendingMode.MULTIPLY; L.opacity.setValue(j.opacity !== undefined ? j.opacity : 94); L.motionBlur = j.t0 !== undefined;
    if (j.out !== undefined) L.outPoint = j.out; j.layer = L; return L; }
  function fx(L, match) { return L.property("ADBE Effect Parade").addProperty(match); }
  function shapeGroup(L) { var g = L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group"); return L.property("ADBE Root Vectors Group").property(L.property("ADBE Root Vectors Group").numProperties); }
  function addRect(L, size, pos, round, fill, stroke, sw) { var g = shapeGroup(L), v = g.property("ADBE Vectors Group"), r = v.addProperty("ADBE Vector Shape - Rect");
    r.property("ADBE Vector Rect Size").setValue(size); r.property("ADBE Vector Rect Roundness").setValue(round || 0);
    if (fill) g.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(fill);
    if (stroke) { var st = g.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Stroke"); st.property("ADBE Vector Stroke Color").setValue(stroke); st.property("ADBE Vector Stroke Width").setValue(sw || 2); }
    g.property("ADBE Vector Transform Group").property("ADBE Vector Position").setValue(pos); return g; }
  function addEllipse(L, size, pos, fill, op) { var g = shapeGroup(L); g.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Ellipse").property("ADBE Vector Ellipse Size").setValue(size);
    var f = g.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill"); f.property("ADBE Vector Fill Color").setValue(fill); if (op !== undefined) f.property("ADBE Vector Fill Opacity").setValue(op);
    g.property("ADBE Vector Transform Group").property("ADBE Vector Position").setValue(pos); return g; }
  // a dry-erase marker, nib at the layer origin, barrel up (rotated by the layer): felt nib, cone, white barrel, colour band, cap in the ink colour
  function penLayer(comp, name, col, silhouette) { var L = comp.layers.addShape(); L.name = name; var W = [.97, .97, .96], edge = [.78, .78, .77];
    if (silhouette) { addRect(L, [50, 330], [0, -165], 18, [0, 0, 0]); }
    else { addRect(L, [50, 72], [0, -296], 14, col, null); addRect(L, [46, 176], [0, -168], 8, W, edge, 2); addRect(L, [46, 24], [0, -116], 2, col, null);
      addRect(L, [10, 150], [-12, -170], 5, [1, 1, 1], null); addRect(L, [30, 30], [0, -64], 10, [.9, .9, .89], edge, 2); addRect(L, [16, 34], [0, -22], 7, col, null); }
    L.anchorPoint.setValue([0, 0]); L.motionBlur = true; return L; }
  // ---- the board ----
  function solid(comp, name, color, w, h) { return comp.layers.addSolid(color, name, Math.round(w), Math.round(h), 1); }
  function c4(c) { return [c[0], c[1], c[2], 1]; }
  // ---- the scene ----
  // the shared test scene (the library's seven-beat test scene) written on one big board (3600 x 5400). Each beat owns a region; the camera travels
  // between regions (and once returns to one), rides the drawn arrow into the last region, then pulls back past the board edge to the wall.
  function buildScene(comp, scene, opts) {
    fontOK(); N = 0; JOBS = []; var P = opts.prefix || "WHITEB", A = opts.assets, B = scene.beat, Wd = comp.width, Ht = comp.height, WL = scene.wordList, fps = scene.fps, notes = [];
    AESLib.clearOwned(comp, P); FONT = AESLib.readJSON(A.font);
    var BW = 3600, BH = 5400, CEN = [Wd / 2, Ht / 2], R = rng(20261016);
    function words(t0, t1) { var r = []; for (var i = 0; i < WL.length; i++) if (WL[i].s >= t0 - .05 && WL[i].s < t1) r.push(WL[i]); return r; }
    function wins(ws, from, n, lead) { var r = []; for (var i = from; i < from + n && i < ws.length; i++) r.push([ws[i].s - (lead || 0), ws[i].e - .01]); return r; }
    var RG = { title: [900, 1000], picture: [2700, 1000], input: [2700, 2700], number: [900, 2700], line: [900, 4400], end: [2700, 4400] };
    function at(r, x, y) { return [RG[r][0] + x, RG[r][1] + y]; }
    // the camera: board-space view centre and zoom by time; zoom eases in 1/z so pushes feel like dollies; long moves dip out a little
    var CAMK = [[0, RG.title, 1.07], [1.18, RG.title, 1.0], [1.52, RG.picture, 1.0, .12], [2.94, RG.picture, 1.0], [3.28, RG.input, .98, .1], [4.42, RG.input, .98], [4.76, RG.number, 1.0, .12],
      [6.1, RG.number, 1.0], [6.42, RG.line, 1.0, .1], [7.6, RG.line, 1.0], [7.9, RG.input, .98, .22], [7.97, RG.input, .98], [8.95, [2700, 4330], 1.0, 0, "ride"], [9.95, RG.end, 1.05],
      [10.62, [BW / 2, BH / 2 + 60], .265], [99, [BW / 2, BH / 2 + 60], .265]];
    function view(t) { for (var i = 1; i < CAMK.length; i++) if (t <= CAMK[i][0]) { var a = CAMK[i - 1], b = CAMK[i], u = (t - a[0]) / (b[0] - a[0]);
        var e = b[4] === "ride" ? (u - Math.sin(2 * Math.PI * u) / (2 * Math.PI) * .6) : travel(u), iz = lerp(1 / a[2], 1 / b[2], e), z = (1 / iz) * (1 - (b[3] || 0) * Math.sin(Math.PI * clamp(u, 0, 1)));
        return { c: [lerp(a[1][0], b[1][0], e), lerp(a[1][1], b[1][1], e)], z: z }; }
      return { c: CAMK[CAMK.length - 1][1], z: CAMK[CAMK.length - 1][2] }; }
    function toScreen(b, v) { return [CEN[0] + v.z * (b[0] - v.c[0]), CEN[1] + v.z * (b[1] - v.c[1])]; }
    // camera nulls: ZOOM scales about the frame centre; PAN (its child) slides the board. Both start at identity so children keep board coordinates.
    var zoom = comp.layers.addNull(); zoom.name = P + "_ZOOM"; zoom.anchorPoint.setValue(CEN); zoom.position.setValue(CEN);
    var pan = comp.layers.addNull(); pan.name = P + "_PAN"; pan.parent = zoom; pan.anchorPoint.setValue([0, 0]); pan.position.setValue([0, 0]);
    // the wall, the board's aluminium frame and tray, the board (warm white, a radial falloff), eraser smears, scuffs
    var wall = solid(comp, P + "_WALL", PALETTE.wall, BW * 3.4, BH * 2.6); wall.parent = pan; wall.position.setValue([BW / 2, BH / 2]);
    fx(wall, "ADBE Ramp"); var wr = wall.property("ADBE Effect Parade").property(1); wr.property("Start of Ramp").setValue([wall.width / 2, wall.height * .38]); wr.property("Start Color").setValue([.80, .79, .76, 1]);
    wr.property("End of Ramp").setValue([wall.width / 2, wall.height * .75]); wr.property("End Color").setValue([.62, .61, .58, 1]); wr.property("Ramp Shape").setValue(2);
    var frm = comp.layers.addShape(); frm.name = P + "_FRAME"; frm.parent = pan; frm.anchorPoint.setValue([0, 0]);
    addRect(frm, [BW + 120, BH + 120], [BW / 2, BH / 2 + 4], 30, [.38, .38, .39]); addRect(frm, [BW + 96, BH + 96], [BW / 2, BH / 2], 26, PALETTE.frame, [.86, .87, .88], 6);
    addRect(frm, [BW * .62, 64], [BW / 2, BH + 96], 14, [.58, .59, .61], [.82, .83, .84], 4); addRect(frm, [BW * .62, 18], [BW / 2, BH + 126], 6, [.30, .30, .31]);
    frm.position.setValue([0, 0]); fx(frm, "ADBE Drop Shadow"); var fs = frm.property("ADBE Effect Parade").property(1); fs.property("Opacity").setValue(55); fs.property("Distance").setValue(40); fs.property("Softness").setValue(120); fs.property("Direction").setValue(170);
    var board = solid(comp, P + "_BOARD", PALETTE.board0, BW, BH); board.parent = pan; board.position.setValue([BW / 2, BH / 2]);
    fx(board, "ADBE Ramp"); var br = board.property("ADBE Effect Parade").property(1); br.property("Start of Ramp").setValue([BW * .42, BH * .4]); br.property("Start Color").setValue(c4(PALETTE.board0));
    br.property("End of Ramp").setValue([BW * 1.15, BH * 1.08]); br.property("End Color").setValue(c4(PALETTE.board1)); br.property("Ramp Shape").setValue(2);
    var scuff = solid(comp, P + "_SCUFF", [.5, .5, .5], BW, BH); scuff.parent = pan; scuff.position.setValue([BW / 2, BH / 2]); fx(scuff, "ADBE Fractal Noise");
    var sf = scuff.property("ADBE Effect Parade").property(1); sf.property("Contrast").setValue(160); sf.property("Complexity").setValue(5);
    sf.property("Uniform Scaling").setValue(false); sf.property("Scale Width").setValue(1400); sf.property("Scale Height").setValue(60); sf.property("Rotation").setValue(-3);
    scuff.blendingMode = BlendingMode.MULTIPLY; scuff.opacity.setValue(5);
    // eraser smears and ghost marks: the old lessons, one static layer per tone, kept out of the regions' working area
    var sm = [], gk = [], gb = [], GW = ["f = ma", "why?", "v2", "draft", "idea", "x²", "ok", "2/3", "a + b", "plan", "42", "next?", "t = 0", "yes", "→", "?", "1, 2, 3", "notes"];
    function free(x, y, pad) { for (var k in RG) if (Math.abs(x - RG[k][0]) < 470 + pad && y - RG[k][1] > -620 - pad && y - RG[k][1] < 720 + pad) return false; return x > 80 && x < BW - 80 && y > 80 && y < BH - 80; }
    for (var s = 0; s < 34; s++) { var sx = R() * BW, sy = R() * BH, sl = 300 + R() * 900; sm.push(line([sx, sy], [sx + sl, sy + (R() - .5) * 60], R, 0, .02)); }
    job("SMEAR", "ink", sm, undefined, undefined, 64, { color: PALETTE.ghost, opacity: 5 });
    for (var gi = 0, tries = 0; gi < 30 && tries < 600; tries++) { var gx = R() * BW, gy = R() * BH; if (!free(gx, gy, 40)) continue; gi++; var tgt = R() < .35 ? gb : gk, kind = R();
      if (kind < .55) { var gl = layout(GW[Math.floor(R() * GW.length)], gx, gy, { cap: 70 + R() * 90, center: true, seed: gi * 17 + 3 }); for (var q = 0; q < gl.words.length; q++) for (var qq = 0; qq < gl.words[q].length; qq++) tgt.push(gl.words[q][qq]); }
      else if (kind < .8) tgt.push(marker(ellipse(gx, gy, 50 + R() * 90, 40 + R() * 70, R, R() * 6), 7, R));
      else { var ga = [gx, gy], gb2 = [gx + 160 + R() * 220, gy + (R() - .5) * 120]; tgt.push(marker(line(ga, gb2, R, 4), 7, R)); tgt.push(marker(arrowHead(ga, gb2, 34, R), 7, R)); } }
    job("GHOST", "ink", gk, undefined, undefined, 7, { color: PALETTE.ghost, opacity: 9 });
    job("GHOSTB", "ink", gb, undefined, undefined, 7, { color: PALETTE.ghostBlue, opacity: 11 });
    function M(raw, w, amp) { return marker(raw, w || 8, R, amp); }
    // 1. title: "every style" in blue, the hero in the dark hand, underlined once in the accent
    var tw = words(B.title.t0, B.title.t1), ctx = B.title.context.toLowerCase(), hero = B.title.hero.toUpperCase().split(" ");
    write("CTX", "blue", ctx, at("title", -440, -380)[0], at("title", -440, -380)[1], { cap: 70 }, wins(tw, 0, 2));
    var h1 = write("H1", "ink", hero.slice(0, 2).join(" "), at("title", -440, -150)[0], at("title", -440, -150)[1], { cap: 160, maxW: 880, sx: .8 }, wins(tw, 2, 2));
    var h2 = write("H2", "ink", hero.slice(2).join(" ") + ".", at("title", -440, 80)[0], at("title", -440, 80)[1], { cap: 160, maxW: 880, sx: .8 }, wins(tw, 4, 2));
    job("UL1", "accent", [M(line(at("title", -470, 140), at("title", -470 + Math.max(h1.lay.width, h2.lay.width) + 50, 122), R, 10, .02), 13)], tw[4].s + .08, B.title.t1 - .02, 13);
    // 2. picture: three drawings in stroke order on the spoken words, plus signs between, one loop round all three, "= one picture"
    var pw = words(B.picture.t0, B.picture.t1), py = -170, bx = [-330, 0, 330];
    var pc = at("picture", bx[0], py), pd = at("picture", bx[1], py), pv = at("picture", bx[2], py);
    job("PERSON", "ink", [M(ellipse(pc[0], pc[1] - 150, 52, 56, R, -1.9)), M(line([pc[0], pc[1] - 92], [pc[0] + 4, pc[1] + 60], R, 4)),
      M(line([pc[0] - 80, pc[1] - 30], [pc[0] + 82, pc[1] - 36], R, 6)), M(line([pc[0] + 4, pc[1] + 60], [pc[0] - 56, pc[1] + 170], R, 4)), M(line([pc[0] + 4, pc[1] + 60], [pc[0] + 62, pc[1] + 168], R, 4))],
      B.picture.t0 + .1, pw[1].s - .02, 8);
    var doc = box(pd[0] - 82, pd[1] - 120, 164, 230, R, 7), docS = [];
    for (var di = 0; di < 4; di++) docS.push(M(doc[di]));
    for (var dl = 0; dl < 4; dl++) docS.push(M(line([pd[0] - 52, pd[1] - 66 + dl * 46], [pd[0] + (dl === 3 ? 10 : 52), pd[1] - 66 + dl * 46], R, 2)));
    job("DOC", "ink", docS, pw[1].s, pw[2].s - .02, 8);
    job("DEVICE", "ink", [M(rbox(pv[0] - 74, pv[1] - 135, 148, 270, 24, R)), M(box(pv[0] - 54, pv[1] - 104, 108, 186, R, 0)[0]), M(box(pv[0] - 54, pv[1] - 104, 108, 186, R, 0)[2]),
      M(ellipse(pv[0], pv[1] + 108, 9, 9, R, 0))], pw[2].s, pw[3].s - .02, 8);
    for (var pl = 0; pl < 2; pl++) { var pp = at("picture", (bx[pl] + bx[pl + 1]) / 2, py);
      job("PLUS" + pl, "blue", [M(line([pp[0] - 26, pp[1]], [pp[0] + 26, pp[1] - 2], R, 2)), M(line([pp[0], pp[1] - 26], [pp[0] + 2, pp[1] + 26], R, 2))], pw[pl + 1].s + .02, pw[pl + 1].s + .2, 8); }
    var oc = at("picture", 0, py - 10);
    job("LOOP", "accent", [M(ellipse(oc[0], oc[1], 500, 270, R, -2.6), 12)], pw[3].s + .02, pw[4].s + .32, 12);
    write("ONE", "ink", "= one picture", at("picture", 0, 300)[0], at("picture", 0, 300)[1], { cap: 104, center: true, maxW: 820 }, [[pw[3].s - .06, pw[3].s + .07], [pw[3].s + .08, pw[3].e], [pw[4].s, pw[4].s + .5]]);
    // 3. input: the real frame slides in as a print under the accent magnet; a second magnet drops; it is labelled in the hand with a blue arrow
    var iw = words(B.input.t0, B.input.t1), PRx = 40, PRy = 50, ph = at("input", PRx, PRy), PW = 500, PH = Math.round(PW * 1920 / 1080);
    write("REAL", "ink", "a real frame", at("input", -420, -560)[0], at("input", -420, -560)[1], { cap: 78 }, [[iw[1].s, iw[1].e], [iw[2].s, iw[2].e], [iw[3].s, iw[3].e]]);
    var a0 = at("input", 250, -590), a1 = at("input", 150, -430);
    job("ARR1", "blue", [M([a0, [a0[0] + 80, a0[1] - 20], [a1[0] + 10, a1[1] - 60], a1]), M(arrowHead([a1[0] + 10, a1[1] - 60], a1, 30, R))], iw[3].e + .01, iw[4].s + .16, 8);
    write("VID", "ink", "from my video", at("input", 0, 650)[0], at("input", 0, 650)[1], { cap: 74, center: true }, wins(iw, 4, 3));
    // 4. number: 338 written large, "frames," under it, "counted." in blue while the accent rings the number
    var nw = words(B.number.t0, B.number.t1);
    var big = write("N338", "ink", String(B.number.value), at("number", 0, 40)[0], at("number", 0, 40)[1], { cap: 400, center: true, maxW: 760, w: 20 }, [B.number.t0 + .04, nw[0].e]);
    write("FRAMES", "ink", B.number.label + ",", at("number", 0, 300)[0], at("number", 0, 300)[1], { cap: 120, center: true }, [[nw[1].s, nw[1].e - .05]]);
    write("COUNTED", "blue", "counted.", at("number", 0, 470)[0], at("number", 0, 470)[1], { cap: 84, center: true }, [[nw[2].s, nw[2].e - .02]]);
    var nc = at("number", 0, -150); job("RING", "accent", [M(ellipse(nc[0], nc[1], 450, 290, R, 3.6), 12)], nw[2].s + .02, nw[2].e - .02, 12);
    // 5. line: the spoken line written word by word on the voice, the last word underlined in the accent
    var lw = words(B.line.t0, B.carry.t0);
    write("L1", "ink", "every word", at("line", -420, -260)[0], at("line", -420, -260)[1], { cap: 136, maxW: 840 }, wins(lw, 0, 2));
    write("L2", "ink", "I say gets", at("line", -420, -40)[0], at("line", -420, -40)[1], { cap: 136, maxW: 840 }, wins(lw, 2, 3));
    var l3 = write("L3", "ink", "typed.", at("line", -420, 180)[0], at("line", -420, 180)[1], { cap: 136, maxW: 840 }, wins(lw, 5, 1));
    job("UL2", "accent", [M(line(at("line", -440, 222), at("line", -420 + l3.lay.width + 30, 216), R, 8, .03), 12)], lw[5].s + .1, B.line.t1 - .02, 12);
    // 6. carry: back to the frame (a callback); a blue arrow leaves the print and the camera rides it down into the last region
    var cw = words(B.carry.t0, B.carry.t1), cs = [ph[0] - 10, ph[1] + PH / 2 + 60], ce = at("end", 0, -470), cv = [];
    for (var ci = 0; ci <= 24; ci++) { var cu = ci / 24; cv.push([lerp(cs[0], ce[0], cu) + 150 * Math.sin(Math.PI * 2 * cu) * (1 - cu), lerp(cs[1], ce[1], cu)]); }
    job("CARRY", "blue", [M(cv, 9), M(arrowHead(cv[22], cv[24], 40, R), 9)], cw[1].s + .05, B.carry.t1 - .1, 9);
    write("BEC", "ink", "becomes", cs[0] + 150, cs[1] + 380, { cap: 70 }, [[cw[3].s, cw[3].e + .12]]);
    // 7. end: "That's the test." written, the answer circled twice in the accent; the camera pulls back past the board edge
    var ew = words(B.end.t0, B.end.t1), et = B.end.text.split(" ");
    write("END1", "ink", et.slice(0, 2).join(" "), at("end", 0, -150)[0], at("end", 0, -150)[1], { cap: 136, center: true }, wins(ew, 0, 2));
    var e2 = write("END2", "ink", et.slice(2).join(" "), at("end", 0, 160)[0], at("end", 0, 160)[1], { cap: 230, center: true, w: 18 }, wins(ew, 2, 1));
    var ec = at("end", 0, 80); job("CIRCLE", "accent", [M(ellipse(ec[0], ec[1], e2.lay.width / 2 + 120, 190, R, 3.4, 2), 12)], ew[2].e + .02, ew[2].e + .4, 12);
    // build every ink layer (ghosts first, so they sit lowest)
    for (var jb = 0; jb < JOBS.length; jb++) inkLayer(comp, P, JOBS[jb], pan);
    // the print: a white border with a contact shadow, the frame inside it, the accent magnet holding it; a second magnet drops after it lands
    var print = comp.layers.addShape(); print.name = P + "_PRINT"; print.parent = pan; addRect(print, [PW + 34, PH + 34], [0, 0], 4, [.995, .995, .99]); print.anchorPoint.setValue([0, 0]);
    fx(print, "ADBE Drop Shadow"); var pds = print.property("ADBE Effect Parade").property(1); pds.property("Opacity").setValue(40); pds.property("Direction").setValue(160); pds.property("Softness").setValue(26);
    var photo = comp.layers.add(AESLib.importFile(A.print)); photo.name = P + "_PHOTO"; photo.parent = print; photo.position.setValue([0, 0]); photo.scale.setValue([PW / photo.source.width * 100, PH / photo.source.height * 100]);
    var tIn = B.input.t0 + .14, tLand = tIn + .26; print.rotation.setValue(-2); print.motionBlur = true; photo.motionBlur = true;
    AESLib.ease(print.position, [tIn, tLand], [[ph[0] + 1200, ph[1] - 40], ph], "settle");
    AESLib.ease(pds.property("Distance"), [tIn, tLand], [34, 7], "settle");
    function magnet(name, col, local, t) { var g = comp.layers.addShape(); g.name = P + "_" + name; g.parent = print; addEllipse(g, [74, 74], [0, 0], col);
      addEllipse(g, [30, 20], [-14, -16], [1, 1, 1], 45); addEllipse(g, [74, 74], [0, 0], [0, 0, 0], 0); g.anchorPoint.setValue([0, 0]); g.position.setValue(local); g.motionBlur = true;
      fx(g, "ADBE Drop Shadow"); var d = g.property("ADBE Effect Parade").property(1); d.property("Opacity").setValue(55); d.property("Direction").setValue(150);
      AESLib.ease(g.scale, [t, t + .12], [[136, 136], [100, 100]], "settle"); AESLib.ease(g.property("ADBE Effect Parade").property(1).property("Distance"), [t, t + .12], [30, 6], "settle");
      AESLib.ease(g.property("ADBE Effect Parade").property(1).property("Softness"), [t, t + .12], [34, 9], "settle"); g.inPoint = t; return g; }
    magnet("MAG1", PALETTE.accent, [0, -PH / 2 + 6], tIn - .02); magnet("MAG2", PALETTE.magnet, [-PW / 2 + 40, PH / 2 - 30], iw[3].s);
    print.inPoint = tIn; photo.inPoint = tIn;
    // the window sheen: three soft diagonal bands moving at 0.35 x the camera; it goes when the camera leaves the board
    var sheen = comp.layers.addShape(); sheen.name = P + "_SHEEN"; for (var sb = 0; sb < 3; sb++) addRect(sheen, [420 + sb * 160, 5200], [(sb - 1) * 1500, 0], 0, [1, 1, 1]);
    sheen.anchorPoint.setValue([0, 0]); sheen.rotation.setValue(28); fx(sheen, "ADBE Gaussian Blur 2"); sheen.property("ADBE Effect Parade").property(1).property("Blurriness").setValue(220);
    sheen.blendingMode = BlendingMode.ADD; sheen.opacity.setValue(5);
    // the dry-marker speckle: sparse white specks screened over everything, locked to the board (offset and scale follow the camera)
    var dry = solid(comp, P + "_DRY", [0, 0, 0], Wd, Ht); fx(dry, "ADBE Fractal Noise"); var dn = dry.property("ADBE Effect Parade").property(1);
    dn.property("Contrast").setValue(520); dn.property("Brightness").setValue(-150); dn.property("Complexity").setValue(2); dn.property("Scale").setValue(9);
    dry.blendingMode = BlendingMode.SCREEN; dry.opacity.setValue(70);
    // the pens: one floating marker per colour, each with a cast shadow; baked per frame from the jobs (writing, hopping, parked off frame, then the tray)
    var PK = ["ink", "blue", "accent"], parks = { ink: [1380, 1480], blue: [1420, 1150], accent: [1400, 1750] }, tray = { ink: [BW / 2 - 300, BH + 70], blue: [BW / 2 + 40, BH + 70], accent: [BW / 2 + 380, BH + 70] };
    var T = [], frames = Math.ceil(scene.duration * fps); for (var f = 0; f <= frames; f++) T.push(f / fps);
        for (var pk = 0; pk < PK.length; pk++) { var pen = PK[pk], mine = [];
      for (var jj = 0; jj < JOBS.length; jj++) if (JOBS[jj].pen === pen && JOBS[jj].t0 !== undefined && !JOBS[jj].color) mine.push(JOBS[jj]);
      mine.sort(function (a, b) { return a.t0 - b.t0; }); var trayT0 = Math.max(10.0, mine.length ? mine[mine.length - 1].t1 + .04 : 10), trayT1 = trayT0 + .5;
      var shL = penLayer(comp, P + "_PENSH_" + pen, [0, 0, 0], true), pL = penLayer(comp, P + "_PEN_" + pen, PENS[pen], false);
      fx(shL, "ADBE Gaussian Blur 2"); shL.opacity.setValue(22);
      var POS = [], SC = [], ROT = [], SPOS = [], BLR = [];
      for (var ti = 0; ti < T.length; ti++) { var t = T[ti], v = view(t), st = null;
        for (var m = 0; m < mine.length; m++) if (t >= mine[m].t0 && t <= mine[m].t1) { var hd = head(mine[m], t); st = { s: toScreen(hd.p, v), lift: hd.lift }; break; }
        if (!st) { var prev = null, next = null; for (m = 0; m < mine.length; m++) { if (mine[m].t1 < t) prev = mine[m]; if (mine[m].t0 > t && !next) next = mine[m]; }
          var park = parks[pen];
          var endOf = function (jx) { var l = jx.strokes[jx.strokes.length - 1]; return l[l.length - 1]; };
          if (prev && next && next.t0 - prev.t1 <= .9) { var u = smooth((t - prev.t1) / (next.t0 - prev.t1)), e0 = endOf(prev), s0 = next.strokes[0][0], dd = dist(e0, s0);
            st = { s: toScreen([lerp(e0[0], s0[0], u), lerp(e0[1], s0[1], u)], v), lift: Math.sin(Math.PI * u) * clamp(dd / 500, .2, 1) }; }
          else { var sOut = prev ? toScreen(endOf(prev), v) : park, sIn = next ? toScreen(next.strokes[0][0], v) : park, p0 = prev ? t - prev.t1 : 99, p1 = next ? next.t0 - t : 99;
            if (p0 < .32) { var uo = smooth(p0 / .32); st = { s: [lerp(sOut[0], park[0], uo), lerp(sOut[1], park[1], uo)], lift: uo }; }
            else if (p1 < .32) { var ui = smooth(1 - p1 / .32); st = { s: [lerp(park[0], sIn[0], ui), lerp(park[1], sIn[1], ui)], lift: 1 - ui }; }
            else st = { s: park, lift: 1 };
            if (!next && t > trayT0) { var ut = smooth((t - trayT0) / (trayT1 - trayT0)), ts2 = toScreen(tray[pen], v); st = { s: [lerp(st.s[0], ts2[0], ut), lerp(st.s[1], ts2[1], ut)], lift: lerp(st.lift, 0, ut), rot: lerp(28, 90, ut), tz: ut }; } } }
        var zz = st.tz !== undefined ? lerp(1, v.z, st.tz) : v.z, sc = 100 * zz * (1 + .07 * st.lift);
        POS.push(st.s); SC.push([sc, sc]); ROT.push(st.rot !== undefined ? st.rot : 28 - 6 * st.lift);
        SPOS.push([st.s[0] + zz * (10 + 60 * st.lift), st.s[1] + zz * (16 + 90 * st.lift)]); BLR.push(4 + 26 * st.lift); }
      pL.position.setValuesAtTimes(T, POS); pL.scale.setValuesAtTimes(T, SC); pL.rotation.setValuesAtTimes(T, ROT);
      shL.position.setValuesAtTimes(T, SPOS); shL.scale.setValuesAtTimes(T, SC); shL.rotation.setValuesAtTimes(T, ROT);
      shL.property("ADBE Effect Parade").property(1).property("Blurriness").setValuesAtTimes(T, BLR); }
    // bake the camera, the sheen drift and the speckle lock, one call per property
    var ZS = [], PP = [], SH = [], DO = [], DS = [], SO = [], DOP = [];
    for (var tk = 0; tk < T.length; tk++) { var vw = view(T[tk]); ZS.push([vw.z * 100, vw.z * 100]); PP.push([CEN[0] - vw.c[0], CEN[1] - vw.c[1]]);
      var dx = -.35 * vw.z * (vw.c[0] - RG.title[0]), dy = -.35 * vw.z * (vw.c[1] - RG.title[1]); SH.push([CEN[0] + 200 + ((dx % 1500) + 1500) % 1500 - 750, CEN[1] + dy * .3]);
      DO.push([CEN[0] - vw.z * vw.c[0], CEN[1] - vw.z * vw.c[1]]); DS.push(9 * vw.z); var wide = clamp((1 - vw.z) / .4, 0, 1); SO.push(5 * (1 - wide)); DOP.push(70 * (1 - wide)); }
    zoom.scale.setValuesAtTimes(T, ZS); pan.position.setValuesAtTimes(T, PP); sheen.position.setValuesAtTimes(T, SH); sheen.opacity.setValuesAtTimes(T, SO);
    dn.property("Offset Turbulence").setValuesAtTimes(T, DO); dry.property("ADBE Effect Parade").property(1).property("Scale").setValuesAtTimes(T, DS); dry.opacity.setValuesAtTimes(T, DOP);
    // burned subtitles: an off-white rounded label, the line in a handwriting face, a short accent dash; one batched Source Text call
    var lines = [], lt = [], beats = scene.beats;
    for (var bi = 0; bi < beats.length; bi++) { var bw2 = words(beats[bi].t0, beats[bi].t1); if (!bw2.length) continue; var tx = []; for (var wi = 0; wi < bw2.length; wi++) tx.push(bw2[wi].text); lines.push(tx.join(" ")); lt.push(bw2[0].s); }
    var subT = AESLib.text(comp, P + "_SUB", lines[0], { family: SUB, style: "Regular", size: 46, color: PALETTE.ink, just: "center", pos: [CEN[0] + 14, 1792] });
    subT.anchorPoint.expression = "var r = sourceRectAtTime(time, false); [r.left + r.width / 2, r.top + r.height / 2];";
    AESLib.textKeys(subT, lt, lines); subT.inPoint = lt[0];
    var lab = comp.layers.addShape(); lab.name = P + "_SUBLABEL"; addRect(lab, [600, 86], [0, 0], 22, PALETTE.label); addRect(lab, [26, 7], [0, 0], 4, PALETTE.accent);
    lab.anchorPoint.setValue([0, 0]); lab.position.setValue([CEN[0], 1792]); lab.opacity.setValue(90); lab.inPoint = lt[0];
    var subRef = 'var r = thisComp.layer("' + subT.name + '").sourceRectAtTime(time, false);';
    lab.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property(1).property("ADBE Vector Rect Size").expression = subRef + " [r.width + 110, 86];";
    lab.property("ADBE Root Vectors Group").property(2).property("ADBE Vector Transform Group").property("ADBE Vector Position").expression = subRef + " [-(r.width + 110) / 2 + 34, 0];";
    fx(lab, "ADBE Drop Shadow"); var lds = lab.property("ADBE Effect Parade").property(1); lds.property("Opacity").setValue(18); lds.property("Distance").setValue(4); lds.property("Softness").setValue(14);
    // stacking, bottom to top: wall, frame, board, scuff, ink (ghosts lowest), print and magnets, speckle, sheen, pen shadows and pens, subtitles, camera
    dry.moveToBeginning(); sheen.moveToBeginning();
    for (var pk2 = 0; pk2 < PK.length; pk2++) { comp.layer(P + "_PENSH_" + PK[pk2]).moveToBeginning(); comp.layer(P + "_PEN_" + PK[pk2]).moveToBeginning(); }
    lab.moveToBeginning(); subT.moveToBeginning(); pan.moveToBeginning(); zoom.moveToBeginning();
    scuff.moveToEnd(); board.moveToEnd(); frm.moveToEnd(); wall.moveToEnd();
    comp.motionBlur = true; comp.shutterAngle = 180; comp.motionBlurSamplesPerFrame = 12;
    notes.push(JOBS.length + " ink jobs");
    return { layers: comp.numLayers, notes: notes };
  }
  return { SUB: SUB, PALETTE: PALETTE, fontOK: fontOK, layout: layout, marker: marker, line: line, ellipse: ellipse, box: box, rbox: rbox, arrowHead: arrowHead, buildScene: buildScene };
})();
