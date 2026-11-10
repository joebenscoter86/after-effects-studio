// One-line drawing style: brand-neutral ES3 helpers. No project mutation happens at load.
// Read styles/one-line/STYLE.md first. A single ink line that never leaves the paper: the whole scene is ONE point array, drawn by
// Trim Paths in short chunks (so the width can follow pen pressure), a camera that follows the nib with lag and anticipation, only a
// pen shadow above the paper, one accent stretch used once, a blot where the pen stops, and a pull back that shows it was one picture.
// Adapted from Lemo-Opuscar's one-line style (MIT, LemoLab); see library/styles/LICENSE-lemo-opuscar.txt.
var AESOneLine = (function () {
  var FACE = "Caveat";
  var PALETTE = { paper: [.957, .937, .894], paper1: [.90, .875, .83], ink: [.114, .102, .090], accent: [.722, .196, .165], rim: [.05, .045, .04] };
  function fontOK() { AESLib.font(FACE, "Regular"); return true; }
  function rng(seed) { var s = (seed >>> 0) || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function clamp(v, a, b) { if (v < a) return a; if (v > b) return b; return v; }
  function lerp(a, b, u) { return a + (b - a) * u; }
  function travel(u) { u = clamp(u, 0, 1); return u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; }
  function smooth(u) { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); }
  function dist(a, b) { var dx = b[0] - a[0], dy = b[1] - a[1]; return Math.sqrt(dx * dx + dy * dy); }
  function norm(v) { var l = Math.sqrt(v[0] * v[0] + v[1] * v[1]) || 1; return [v[0] / l, v[1] / l]; }
  function resample(pts, step) { var out = [pts[0]], acc = 0, i;
    for (i = 1; i < pts.length; i++) { var a = pts[i - 1], b = pts[i], d = dist(a, b); if (!d) continue; var t = step - acc;
      while (t <= d) { out.push([lerp(a[0], b[0], t / d), lerp(a[1], b[1], t / d)]); t += step; } acc = d - (t - step); }
    var l = pts[pts.length - 1]; if (dist(out[out.length - 1], l) > step * .3) out.push([l[0], l[1]]); return out; }
  // ---- path pieces (paper space, y down) ----
  function arc(cx, cy, rx, ry, a0, a1) { var n = Math.max(8, Math.ceil(Math.abs(a1 - a0) * Math.max(rx, ry) / 6)), r = [];
    for (var k = 0; k <= n; k++) { var a = lerp(a0, a1, k / n); r.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return r; }
  function poly() { var r = []; for (var i = 0; i < arguments.length; i++) r.push(arguments[i]); return r; }
  function cat(list) { var r = []; for (var i = 0; i < list.length; i++) for (var j = 0; j < list[i].length; j++) { var p = list[i][j]; if (r.length && dist(r[r.length - 1], p) < .01) continue; r.push(p); } return r; }
  // a hand-led connector: a Hermite spline from s (leaving along ds) through the vias to e (arriving along de); tangent-continuous at both ends
  function via(s, ds, vias, e, de) { var P = [s].concat(vias).concat([e]), T = [], i, r = [];
    for (i = 0; i < P.length; i++) { var t; if (i === 0) { var l0 = dist(P[0], P[1]); t = [ds[0] * l0, ds[1] * l0]; }
      else if (i === P.length - 1) { var l1 = dist(P[i - 1], P[i]); t = [de[0] * l1, de[1] * l1]; }
      else t = [(P[i + 1][0] - P[i - 1][0]) / 2, (P[i + 1][1] - P[i - 1][1]) / 2]; T.push(t); }
    for (i = 0; i < P.length - 1; i++) { var n = Math.max(6, Math.ceil(dist(P[i], P[i + 1]) / 8));
      for (var k = (i ? 1 : 0); k <= n; k++) { var u = k / n, u2 = u * u, u3 = u2 * u, h0 = 2 * u3 - 3 * u2 + 1, h1 = u3 - 2 * u2 + u, h2 = -2 * u3 + 3 * u2, h3 = u3 - u2;
        r.push([h0 * P[i][0] + h1 * T[i][0] + h2 * P[i + 1][0] + h3 * T[i + 1][0], h0 * P[i][1] + h1 * T[i][1] + h2 * P[i + 1][1] + h3 * T[i + 1][1]]); } }
    return r; }
  // digits drawn as one gesture: a 3 (two bowls meeting in a cusp) and an 8 (a lemniscate of Gerono, a real crossing)
  function three(cx, cy, H, W) { return cat([arc(cx, cy - H / 4, W / 2, H / 4, -2.8, Math.PI / 2), arc(cx + 4, cy + H / 4, W * .56, H / 4, -1.75, 2.75)]); }
  function eight(cx, cy, H, W) { var r = [], n = 120; for (var k = 0; k <= n; k++) { var s = 2 * Math.PI * k / n, up = Math.cos(s) > 0, sw = up ? .84 : 1;
      r.push([cx + W / 2 * sw * Math.sin(2 * s), cy - H / 2 * Math.cos(s)]); } return r; }
  // the loop-the-loop: a circle drifting forward, entered and left heading right
  function loop(x, y, r, k) { var p = []; for (var i = 0; i <= 60; i++) { var th = 2 * Math.PI * i / 60; p.push([x + r * Math.sin(th) + k * th, y - r + r * Math.cos(th)]); } return p; }
  // a rounded rectangle drawn clockwise from the top of its right edge, overshooting along the top edge past the start
  function frameCW(cx, cy, w, h, rr, over) { var x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2;
    return cat([poly([x1, y0 + rr], [x1, y1 - rr]), arc(x1 - rr, y1 - rr, rr, rr, 0, Math.PI / 2), poly([x1 - rr, y1], [x0 + rr, y1]), arc(x0 + rr, y1 - rr, rr, rr, Math.PI / 2, Math.PI),
      poly([x0, y1 - rr], [x0, y0 + rr]), arc(x0 + rr, y0 + rr, rr, rr, Math.PI, Math.PI * 1.5), poly([x0 + rr, y0], [x1 + over, y0])]); }
  // ---- the plan: the whole film as one point array with times, plus where every text sits ----
  // m = text widths measured in AE ({ title: [w1, w2, w3], line: w, end: w }); Node previews pass estimates.
  function plan(scene, m) {
    var WL = scene.wordList, R = rng(20261016), PTS = [], TT = [], AC = [], GR = [], marks = [];
    function W(i) { return WL[i]; }
    var TI = [1150, 650], PI = [1700, 1600], IN = [2050, 2750], NU = [1500, 3900], LI = [1300, 4900], CA = [1750, 5500], EN = [1250, 6170];
    var text = { title: [{ s: "Every style", size: 80, at: [TI[0] - 430, TI[1] - 180], w: [0, 1] }, { s: "starts the", size: 150, at: [TI[0] - 430, TI[1] - 30], w: [2, 3] }, { s: "same way.", size: 150, at: [TI[0] - 430, TI[1] + 120], w: [4, 5] }],
      frames: { s: "frames,", size: 120, center: [NU[0] - 10, NU[1] + 230], w: [19] }, line: { s: "Every word I say gets typed.", size: 112, at: [LI[0] - 650, LI[1]], w: [21, 22, 23, 24, 25, 26] },
      end: { s: "That's the test.", size: 140, center: [EN[0], EN[1]], w: [33, 34, 35] } };
    // add a piece: its points are drawn from the current end time to tEnd, time per point weighted by length x (1 + K x turn)
    function draw(pts, tEnd, o) { o = o || {}; pts = resample(pts, 5); var start = PTS.length ? 1 : 0, t0 = PTS.length ? TT[TT.length - 1] : (o.t0 || 0);
      if (!PTS.length) { PTS.push(pts[0]); TT.push(t0); AC.push(o.accent ? 1 : 0); GR.push(o.region); }
      var wt = [], tot = 0, i; for (i = start; i < pts.length; i++) { var a = i ? pts[i - 1] : PTS[PTS.length - 1], b = pts[i], c = pts[Math.min(i + 1, pts.length - 1)];
        var v1 = norm([b[0] - a[0], b[1] - a[1]]), v2 = norm([c[0] - b[0], c[1] - b[1]]), turn = Math.acos(clamp(v1[0] * v2[0] + v1[1] * v2[1], -1, 1));
        var w = dist(a, b) * (1 + 2.6 * Math.min(turn, 1.2)); wt.push(w); tot += w; }
      // smooth the weights so the speed never jumps
      var sw = []; for (i = 0; i < wt.length; i++) { var s = 0, c2 = 0; for (var j = i - 3; j <= i + 3; j++) if (j >= 0 && j < wt.length) { s += wt[j]; c2++; } sw.push(s / c2); }
      tot = 0; for (i = 0; i < sw.length; i++) tot += sw[i];
      var t = t0, k = (tEnd - t0) / (tot || 1);
      for (i = start; i < pts.length; i++) { t += sw[i - start] * k; PTS.push(pts[i]); TT.push(t); AC.push(o.accent ? 1 : 0); GR.push(o.region); } }
    function end() { return PTS[PTS.length - 1]; }
    function dir() { var n = PTS.length; return norm([PTS[n - 1][0] - PTS[n - 4][0], PTS[n - 1][1] - PTS[n - 4][1]]); }
    function go(vias, e, de, tEnd, o) { draw(via(end(), dir(), vias, e, de), tEnd, o); }
    function P(r, x, y) { return [r[0] + x, r[1] + y]; }
    // 1. title: the nib touches down and runs the underline ahead of the writing, ending in a curl
    var tw = Math.max(m.title[1], m.title[2]), ux = TI[0] - 450, uy = TI[1] + 190, ue = TI[0] - 430 + tw + 60, und = [];
    for (var q = 0; q <= 40; q++) { var uu = q / 40; und.push([lerp(ux, ue, uu), uy + 7 * Math.sin(uu * 5.2) - 10 * uu]); }
    draw(und, 1.1, { t0: .14, region: "title" });
    draw(arc(ue + 4, uy - 52, 40, 40, Math.PI / 2 + .25, -Math.PI * 1.35), 1.2, { region: "title" });
    // 2. picture: down to the horizon; the line stands up a person, a document, a device, then rings all three as one picture
    var G = PI[1] + 200, px = PI[0] - 330, dx = PI[0], vx = PI[0] + 330;
    go([P(PI, -520, -560), P(PI, -760, -60), P(PI, -720, 180)], [PI[0] - 620, G], [1, 0], 1.38, { region: "picture" });
    var hip = [px, G - 160], neck = [px, G - 310];
    draw(cat([poly([PI[0] - 620, G], [px - 55, G], hip, [px + 50, G], hip, neck, [px - 95, G - 215], neck, [px + 92, G - 215], neck), arc(px, neck[1] - 64, 60, 64, Math.PI / 2, Math.PI / 2 - 2 * Math.PI),
      poly(neck, hip, [px + 50, G])]), 1.86, { region: "picture" });
    var d0 = dx - 95, d1 = dx + 95, dt = G - 330;
    draw(poly([px + 50, G], [d0, G], [d0, dt], [d1 - 50, dt], [d1, dt + 50], [d1 - 50, dt + 50], [d1 - 50, dt], [d1 - 50, dt + 50], [d1, dt + 50],
      [d1, dt + 120], [d0 + 45, dt + 120], [d1, dt + 120], [d1, dt + 175], [d0 + 45, dt + 175], [d1, dt + 175], [d1, dt + 230], [d0 + 100, dt + 230], [d1, dt + 230], [d1, G]), 2.16, { region: "picture" });
    var v0 = vx - 78, v1 = vx + 78, vt = G - 290, vr = 26;
    draw(cat([poly([d1, G], [v0, G], [v0, vt + vr]), arc(v0 + vr, vt + vr, vr, vr, Math.PI, Math.PI * 1.5), poly([v0 + vr, vt], [vx - 12, vt]), arc(vx, vt + 16, 12, 12, -Math.PI, -Math.PI * 3), poly([vx + 12, vt], [v1 - vr, vt]),
      arc(v1 - vr, vt + vr, vr, vr, -Math.PI / 2, 0), poly([v1, vt + vr], [v1, G], [PI[0] + 500, G])]), 2.44, { region: "picture" });
    var a0 = Math.asin(170 / 330); draw(arc(PI[0], PI[1] + 30, 580, 330, a0, a0 - 2 * Math.PI - .18), 3.02, { region: "picture" });
    // 3. input: the one accent: the line draws the real frame's border (the frame itself appears as line work inside)
    var FW = 480, FH = 853, ftr = [IN[0] + FW / 2, IN[1] - FH / 2];
    go([P(PI, 830, 120), P(PI, 840, 520), [ftr[0] + 40, ftr[1] - 140]], [ftr[0], ftr[1] + 18], [0, 1], 3.12, { region: "input" });
    draw(frameCW(IN[0], IN[1], FW, FH, 18, 70), 3.86, { accent: true, region: "input" });
    // ... over "from my video" it swings round the frame and travels to the number
    var n3 = [NU[0] - 280, NU[1] - 120], H = 420, DW = 230, s3 = three(n3[0], n3[1], H, DW);
    go([[ftr[0] + 190, ftr[1] + 200], [ftr[0] + 170, IN[1] + FH / 2 + 120], [IN[0] - 120, IN[1] + FH / 2 + 290], [NU[0] - 520, NU[1] - 560], [NU[0] - 470, NU[1] - 230]], s3[0], norm([s3[3][0] - s3[0][0], s3[3][1] - s3[0][1]]), 4.6, { region: "number" });
    // 4. number: 338 written as one gesture (retracing back over each 3's lower bowl to leave it), then a row of tally ticks: counted
    draw(s3, 4.84, { region: "number" });
    var lb = arc(n3[0] + 4, n3[1] + H / 4, DW * .56, H / 4, 2.75, .45); draw(lb, 4.9, { region: "number" });
    var n32 = [n3[0] + 260, n3[1]], s32 = three(n32[0], n32[1], H, DW);
    go([], s32[0], norm([s32[3][0] - s32[0][0], s32[3][1] - s32[0][1]]), 4.96, { region: "number" }); draw(s32, 5.14, { region: "number" });
    draw(arc(n32[0] + 4, n32[1] + H / 4, DW * .56, H / 4, 2.75, .45), 5.2, { region: "number" });
    var n8 = [n3[0] + 540, n3[1]], e8 = eight(n8[0], n8[1], H, DW + 20);
    go([], e8[0], [1, 0], 5.26, { region: "number" }); draw(e8, 5.5, { region: "number" });
    var ty = NU[1] + 380, tx0 = NU[0] + 430, tx1 = NU[0] - 430;
    go([[n8[0] + 150, n8[1] - H / 2 + 30], [NU[0] + 520, NU[1] + 60], [NU[0] + 500, ty - 50]], [tx0, ty], [-1, 0], 5.94, { region: "number" });
    var tl = [[tx0, ty]]; for (var ti = 0; ti < 9; ti++) { var tx = lerp(tx0 - 70, tx1 + 70, ti / 8); tl.push([tx, ty], [tx + 6, ty - 78], [tx, ty]); } tl.push([tx1, ty]);
    draw(tl, 6.28, { region: "number" });
    // 5. line: the line runs ahead under the spoken sentence, a horizon the words are written on
    var lx0 = LI[0] - 670, lx1 = LI[0] - 650 + m.line + 40, ly = LI[1] + 38;
    go([[tx1 - 260, ty + 60], [LI[0] - 760, LI[1] - 260], [LI[0] - 760, ly - 40]], [lx0, ly], [1, 0], 6.36, { region: "line" });
    var lu = []; for (var li = 0; li <= 50; li++) { var lv = li / 50; lu.push([lerp(lx0, lx1, lv), ly + 5 * Math.sin(lv * 9) + 4 * lv]); } draw(lu, 7.62, { region: "line" });
    // 6. carry: one thing becomes the next: the line makes a small frame, leaves it as a loop-the-loop and swings down to the last words
    var mf = [CA[0] - 250, CA[1]], mtr = [mf[0] + 85, mf[1] - 150];
    go([[lx1 + 140, ly + 90], [mtr[0] + 160, mtr[1] - 140], [mtr[0] + 40, mtr[1] - 70]], [mtr[0], mtr[1] + 10], [0, 1], 7.82, { region: "carry" });
    draw(frameCW(mf[0], mf[1], 170, 300, 12, 70), 8.16, { region: "carry" });
    var lp = loop(mtr[0] + 130, mtr[1], 115, 28); go([], lp[0], [1, 0], 8.22, { region: "carry" }); draw(lp, 8.52, { region: "carry" });
    var ew = m.end, ex0 = EN[0] - ew / 2 - 30, ex1 = EN[0] + ew / 2 + 30, ey = EN[1] + 52;
    go([[CA[0] + 330, CA[1] + 40], [CA[0] + 120, CA[1] + 330], [EN[0] - 200, EN[1] - 330], [ex0 - 140, EN[1] - 150], [ex0 - 110, ey - 30]], [ex0, ey], [1, 0], 9.06, { region: "end" });
    // 7. end: the last underline under "That's the test.", a small flick up, and the pen stops: a blot, then the pull back
    var eu = []; for (var ei = 0; ei <= 40; ei++) { var evv = ei / 40; eu.push([lerp(ex0, ex1, evv), ey + 4 * Math.sin(evv * 6)]); } draw(eu, 9.84, { region: "end" });
    draw(via(end(), dir(), [[ex1 + 40, ey - 6]], [ex1 + 62, ey - 52], norm([.4, -1])), 9.96, { region: "end" });
    // a fine hand tremble along the whole line (retraced passes get their own, so a retrace only thickens slightly)
    var acc = 0, ph = R() * 6.3, ph2 = R() * 6.3, OUT = [];
    for (var i = 0; i < PTS.length; i++) { if (i) acc += dist(PTS[i - 1], PTS[i]); var a = PTS[Math.max(0, i - 1)], b = PTS[Math.min(PTS.length - 1, i + 1)], nv = norm([-(b[1] - a[1]), b[0] - a[0]]);
      var off = 1.3 * Math.sin(acc / 380 * 6.283 + ph) + .35 * Math.sin(acc / 41 * 6.283 + ph2); OUT.push([PTS[i][0] + nv[0] * off, PTS[i][1] + nv[1] * off]); }
    var all = [Infinity, Infinity, -Infinity, -Infinity]; for (i = 0; i < OUT.length; i++) { all[0] = Math.min(all[0], OUT[i][0]); all[1] = Math.min(all[1], OUT[i][1]); all[2] = Math.max(all[2], OUT[i][0]); all[3] = Math.max(all[3], OUT[i][1]); }
    return { pts: OUT, t: TT, accent: AC, region: GR, text: text, regions: { title: TI, picture: PI, input: IN, number: NU, line: LI, carry: CA, end: EN }, frame: { c: IN, w: FW, h: FH }, bounds: all, stop: OUT[OUT.length - 1], stopT: TT[TT.length - 1] };
  }
  // where the nib is at time t
  function nibAt(pl, t) { var T = pl.t, n = T.length; if (t <= T[0]) return pl.pts[0]; if (t >= T[n - 1]) return pl.pts[n - 1];
    var lo = 0, hi = n - 1; while (hi - lo > 1) { var md = (lo + hi) >> 1; if (T[md] <= t) lo = md; else hi = md; }
    var u = (t - T[lo]) / ((T[hi] - T[lo]) || 1); return [lerp(pl.pts[lo][0], pl.pts[hi][0], u), lerp(pl.pts[lo][1], pl.pts[hi][1], u)]; }
  // the camera: composed keys (centre, zoom, roll, follow weight); the follow point averages the nib over -0.45 .. +0.3 s
  function camera(pl, fps, dur, CEN) {
    var g = pl.regions, st = pl.stop, b = pl.bounds, rev = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2], zr = Math.min(1920 / ((b[3] - b[1]) * 1.1), 1080 / ((b[2] - b[0]) * 1.12));
    var start = pl.pts[0];
    function o(r, x, y) { return [g[r][0] + x, g[r][1] + y]; }
    var K = [[0, start, 2.6, 0, .9], [.18, start, 2.5, 0, .9], [.9, o("title", -40, 20), 1.0, 0, .3], [1.18, o("title", -40, 20), 1.0, 0, .35], [1.5, o("picture", 0, 30), .86, 0, .08],
      [2.98, o("picture", 0, 30), .86, 0, .08], [3.26, o("input", 0, 0), .95, 0, .1], [3.82, o("input", 0, 0), .95, 0, .12], [4.25, o("input", -150, 900), 1.0, 0, .55], [4.7, o("number", 0, 0), .95, 0, .15],
      [6.0, o("number", 0, 60), .95, 0, .3], [6.4, o("line", 0, 0), 1.0, 0, .85], [7.6, o("line", 0, 0), 1.0, 0, .85], [7.9, o("carry", 0, 0), 1.08, 0, .7], [8.2, o("carry", 0, 0), 1.08, 0, .8],
      [8.36, o("carry", 0, 0), 1.1, 6, .85], [8.55, o("carry", 0, 0), 1.08, -2, .85], [8.8, o("carry", 0, 0), 1.05, 0, .8], [9.12, o("end", 0, 0), .95, 0, .1], [9.92, o("end", 0, 0), .95, 0, .1],
      [10.1, [st[0] - 60, st[1] - 10], 1.24, 0, 0], [10.72, rev, zr, 0, 0], [99, rev, zr, 0, 0]];
    function key(t) { for (var i = 1; i < K.length; i++) if (t <= K[i][0]) { var a = K[i - 1], c = K[i], e = travel((t - a[0]) / (c[0] - a[0])), iz = lerp(1 / a[2], 1 / c[2], e);
        return { c: [lerp(a[1][0], c[1][0], e), lerp(a[1][1], c[1][1], e)], z: 1 / iz, r: lerp(a[3], c[3], e), f: lerp(a[4], c[4], e) }; } var l = K[K.length - 1]; return { c: l[1], z: l[2], r: l[3], f: l[4] }; }
    var n = Math.ceil(dur * fps), V = [], i;
    for (i = 0; i <= n; i++) { var t = i / fps, k = key(t), sx = 0, sy = 0; for (var j = 0; j < 8; j++) { var p = nibAt(pl, t - .45 + .75 * j / 7); sx += p[0]; sy += p[1]; }
      var c = [lerp(k.c[0], sx / 8, k.f), lerp(k.c[1], sy / 8, k.f)], nb = nibAt(pl, t);
      // soft clamp: keep the nib inside the central 70% of the frame while the camera is close
      if (k.z > .85 && k.f > .1 && t < 10.0) { var hw = CEN[0] * .7 / k.z, hh = CEN[1] * .7 / k.z, ddx = nb[0] - c[0], ddy = nb[1] - c[1];
        if (ddx > hw) c[0] += ddx - hw; if (ddx < -hw) c[0] += ddx + hw; if (ddy > hh) c[1] += ddy - hh; if (ddy < -hh) c[1] += ddy + hh; }
      V.push({ c: c, z: k.z, r: k.r }); }
    // a light moving average so the follow never jitters
    var S = []; for (i = 0; i < V.length; i++) { var ax = 0, ay = 0, cnt = 0; for (var q = i - 3; q <= i + 3; q++) if (q >= 0 && q < V.length) { ax += V[q].c[0]; ay += V[q].c[1]; cnt++; } S.push({ c: [ax / cnt, ay / cnt], z: V[i].z, r: V[i].r }); }
    return S; }
  // ---- layers ----
  function fx(L, match) { return L.property("ADBE Effect Parade").addProperty(match); }
  function solid(comp, name, color, w, h) { return comp.layers.addSolid(color, name, Math.round(w), Math.round(h), 1); }
  function c4(c) { return [c[0], c[1], c[2], 1]; }
  function shapeGroup(L) { var V = L.property("ADBE Root Vectors Group"); V.addProperty("ADBE Vector Group"); return V.property(V.numProperties); }
  // a Caveat text layer, left-justified; when center is given the layer is placed by its measured width, so a write-on grows from a fixed left edge
  function words(comp, name, o, halo) { var L = AESLib.text(comp, name, o.s, { family: FACE, style: "Regular", size: o.size, color: PALETTE.ink, just: "left", pos: o.at || [0, 0] });
    if (halo) { var sp = L.property("Source Text"), d = sp.value; d.applyStroke = true; d.strokeColor = PALETTE.paper; d.strokeWidth = halo; d.strokeOverFill = false; sp.setValue(d); }
    var r = L.sourceRectAtTime(0, false); o.width = r.width; if (o.center) L.position.setValue([o.center[0] - r.width / 2 - r.left, o.center[1]]); return L; }
  // write a text layer on, character by character inside each spoken word's window; one batched Source Text call
  function writeOn(L, str, wins, fps) { var ws = str.split(" "), t0 = wins[0][0], t1 = wins[wins.length - 1][1], out = [];
    for (var f = 0; f <= Math.ceil((t1 - t0) * fps) + 1; f++) { var t = t0 + f / fps, parts = [];
      for (var i = 0; i < ws.length; i++) { var w = wins[Math.min(i, wins.length - 1)], wd = ws[i];
        if (t >= w[1]) { parts.push(wd); continue; } if (t < w[0]) break; parts.push(wd.substring(0, Math.max(1, Math.ceil(wd.length * (t - w[0]) / (w[1] - w[0]))))); break; }
      out.push(parts.join(" ")); }
    AESLib.bakeText(L, out, fps, t0); L.inPoint = Math.max(0, t0 - .01); }
  // ---- the scene ----
  function buildScene(comp, scene, opts) {
    fontOK(); var P = opts.prefix || "ONELIN", A = opts.assets, Wd = comp.width, Ht = comp.height, CEN = [Wd / 2, Ht / 2], fps = scene.fps, WL = scene.wordList, notes = [];
    AESLib.clearOwned(comp, P);
    function wins(idx) { var r = []; for (var i = 0; i < idx.length; i++) r.push([WL[idx[i]].s, WL[idx[i]].e - .02]); return r; }
    // camera nulls at identity; every paper layer is parented to PAN in paper coordinates and the camera is baked last
    var zoom = comp.layers.addNull(); zoom.name = P + "_ZOOM"; zoom.anchorPoint.setValue(CEN); zoom.position.setValue(CEN);
    var pan = comp.layers.addNull(); pan.name = P + "_PAN"; pan.parent = zoom; pan.anchorPoint.setValue([0, 0]); pan.position.setValue([0, 0]);
    var ctl = comp.layers.addNull(); ctl.name = P + "_CAM"; var wsl = fx(ctl, "ADBE Slider Control"); wsl.name = "W";
    // the paper text first (its widths shape the line)
    var T = { title: [], line: null, end: null, frames: null };
    var tmp = plan(scene, { title: [600, 600, 600], line: 1300, end: 1000 }), tx = tmp.text, k;
    for (k = 0; k < 3; k++) T.title.push(words(comp, P + "_TITLE" + k, tx.title[k], 0));
    T.line = words(comp, P + "_LINE", tx.line, 0); T.end = words(comp, P + "_END", tx.end, 0); T.frames = words(comp, P + "_FRAMES", tx.frames, 0);
    var pl = plan(scene, { title: [tx.title[0].width, tx.title[1].width, tx.title[2].width], line: tx.line.width, end: tx.end.width }), txt = pl.text;
    for (k = 0; k < 3; k++) { T.title[k].parent = pan; writeOn(T.title[k], txt.title[k].s, wins(txt.title[k].w), fps); }
    T.line.parent = pan; writeOn(T.line, txt.line.s, wins(txt.line.w), fps); T.end.parent = pan; writeOn(T.end, txt.end.s, wins(txt.end.w), fps);
    T.frames.parent = pan; writeOn(T.frames, txt.frames.s, wins(txt.frames.w), fps);
    // the paper: warm white, a soft mottle and long fibres anchored to the paper; a vignette in screen space
    var b = pl.bounds, PW = (b[2] - b[0]) + 5000, PH = (b[3] - b[1]) + 5000, PC = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];
    var paper = solid(comp, P + "_PAPER", PALETTE.paper, PW, PH); paper.parent = pan; paper.position.setValue(PC);
    var mot = solid(comp, P + "_MOTTLE", [.5, .5, .5], PW, PH); mot.parent = pan; mot.position.setValue(PC); var mf = fx(mot, "ADBE Fractal Noise");
    mf.property("Contrast").setValue(60); mf.property("Scale").setValue(1300); mf.property("Complexity").setValue(4); mot.blendingMode = BlendingMode.SOFT_LIGHT; mot.opacity.setValue(16);
    var fib = solid(comp, P + "_FIBRES", [.5, .5, .5], PW, PH); fib.parent = pan; fib.position.setValue(PC); var ff = fx(fib, "ADBE Fractal Noise");
    ff.property("Contrast").setValue(160); ff.property("Brightness").setValue(30); ff.property("Uniform Scaling").setValue(false); ff.property("Scale Width").setValue(900); ff.property("Scale Height").setValue(5);
    ff.property("Complexity").setValue(3); ff.property("Rotation").setValue(14); fib.blendingMode = BlendingMode.MULTIPLY; fib.opacity.setValue(6);
    // the line-work frame inside the accent border: edge lines from the real frame, tinted to ink, multiplied, wiped in as the border closes
    var F = pl.frame, art = comp.layers.add(AESLib.importFile(A.lineart)); art.name = P + "_FRAMEART"; art.parent = pan; art.position.setValue(F.c);
    art.scale.setValue([(F.w - 34) / art.source.width * 100, (F.h - 34) / art.source.height * 100]); art.blendingMode = BlendingMode.MULTIPLY; art.opacity.setValue(88);
    var tn = fx(art, "ADBE Tint"); tn.property("Map Black To").setValue(c4(PALETTE.ink)); tn.property("Map White To").setValue([1, 1, 1, 1]);
    var lw = fx(art, "ADBE Linear Wipe"); lw.property("Wipe Angle").setValue(180); lw.property("Feather").setValue(140);
    AESLib.ease(art.property("ADBE Effect Parade").property(2).property("Transition Completion"), [3.36, 4.2], [100, 0], "travel"); art.inPoint = 3.3;
    // the one line: chunks of ~80 px, each its own path, Trim Paths and stroke (so width follows pressure and colour can turn accent); one layer per beat
    var pts = pl.pts, tt = pl.t, n = pts.length, i, sp = [], R = rng(77);
    for (i = 0; i < n; i++) { var a = Math.max(0, i - 2), c = Math.min(n - 1, i + 2); sp.push(dist(pts[a], pts[c]) / ((tt[c] - tt[a]) || .001)); }
    var chunks = [], cur = [0], cl = 0;
    for (i = 1; i < n; i++) { cl += dist(pts[i - 1], pts[i]); cur.push(i); if ((cl > 80 && i < n - 3) || (pl.region[i + 1] !== pl.region[i] && i < n - 1)) { chunks.push(cur); cur = [i]; cl = 0; } }
    if (cur.length > 1) chunks.push(cur);
    var layers = {}, order = [];
    var wexp = 'value * thisComp.layer("' + ctl.name + '").effect("W")(1)';
    for (var ch = 0; ch < chunks.length; ch++) { var ix = chunks[ch], rg = pl.region[ix[1]], L = layers[rg];
      if (!L) { L = comp.layers.addShape(); L.name = P + "_INK_" + rg; L.parent = pan; L.anchorPoint.setValue([0, 0]); L.position.setValue([0, 0]); layers[rg] = L; order.push(rg); }
      var G = shapeGroup(L), GV = G.property("ADBE Vectors Group"), sh = new Shape(), vs = [], ms = 0, ac = 0;
      for (var q = 0; q < ix.length; q++) { vs.push(pts[ix[q]]); ms += sp[ix[q]]; ac += pl.accent[ix[q]]; } ms /= ix.length; ac /= ix.length;
      sh.vertices = vs; sh.closed = false; GV.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(sh);
      var TR = GV.addProperty("ADBE Vector Filter - Trim"), St = GV.addProperty("ADBE Vector Graphic - Stroke");
      var press = .7 + .75 * Math.exp(-ms / 1400), w = 7 * press * (1 + (R() - .5) * .16);
      St.property("ADBE Vector Stroke Color").setValue([lerp(PALETTE.ink[0], PALETTE.accent[0], ac), lerp(PALETTE.ink[1], PALETTE.accent[1], ac), lerp(PALETTE.ink[2], PALETTE.accent[2], ac)]);
      St.property("ADBE Vector Stroke Width").setValue(w); St.property("ADBE Vector Stroke Line Cap").setValue(2); St.property("ADBE Vector Stroke Line Join").setValue(2);
      St.property("ADBE Vector Stroke Width").expression = wexp;
      // Trim End by arc length at every point's own time (times nudged to stay increasing)
      var len = [0]; for (q = 1; q < ix.length; q++) len.push(len[q - 1] + dist(pts[ix[q - 1]], pts[ix[q]])); var tot = len[len.length - 1] || 1, ts = [], vv = [];
      for (q = 0; q < ix.length; q++) { var tq = tt[ix[q]]; if (ts.length && tq <= ts[ts.length - 1]) tq = ts[ts.length - 1] + .0004; ts.push(tq); vv.push(100 * len[q] / tot); }
      // re-fetch the trim after the stroke was added beside it
      G.property("ADBE Vectors Group").property("ADBE Vector Filter - Trim").property("ADBE Vector Trim End").setValuesAtTimes(ts, vv); }
    // ink bleed: each ink layer duplicated under itself, blurred, at 20%
    var bleed = [];
    for (k = 0; k < order.length; k++) { var Lk = layers[order[k]], D = Lk.duplicate(); D.name = P + "_BLEED_" + order[k]; D.parent = pan; fx(D, "ADBE Gaussian Blur 2").property("Blurriness").setValue(7); D.opacity.setValue(20); bleed.push(D); }
    // pooling: a small round dot where the pen slows into a sharp turn
    var pool = comp.layers.addShape(); pool.name = P + "_POOL"; pool.parent = pan; pool.anchorPoint.setValue([0, 0]); pool.position.setValue([0, 0]); var lastPool = -9, pools = 0;
    for (i = 3; i < n - 3; i++) { var v1 = norm([pts[i][0] - pts[i - 3][0], pts[i][1] - pts[i - 3][1]]), v2 = norm([pts[i + 3][0] - pts[i][0], pts[i + 3][1] - pts[i][1]]), cs = v1[0] * v2[0] + v1[1] * v2[1];
      if (cs < -.2 && tt[i] - lastPool > .35 && pools < 14) { lastPool = tt[i]; pools++; var pg = shapeGroup(pool), pv = pg.property("ADBE Vectors Group");
        pv.addProperty("ADBE Vector Shape - Ellipse").property("ADBE Vector Ellipse Size").setValue([11, 11]); pv.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(PALETTE.ink);
        var tg = pg.property("ADBE Vector Transform Group"); tg.property("ADBE Vector Position").setValue(pts[i]);
        tg.property("ADBE Vector Scale").setValuesAtTimes([tt[i], tt[i] + .12], [[0, 0], [100, 100]]); } }
    // the blot where the pen stops: a teardrop, tip at the nib, belly sagging down as it spreads, a dark tide line at the rim
    var blot = comp.layers.addShape(); blot.name = P + "_BLOT"; blot.parent = pan; var bg = shapeGroup(blot), bv = bg.property("ADBE Vectors Group"), bs = new Shape(), bp = [];
    for (i = 0; i <= 28; i++) { var th = -Math.PI / 2 + 2 * Math.PI * i / 28, rr = 1 - .8 * Math.pow(Math.max(0, -Math.sin(th)), 3); bp.push([13 * rr * Math.cos(th), 15 + 15 * Math.sin(th) * (Math.sin(th) < 0 ? 1 : 1.05)]); }
    bs.vertices = bp; bs.closed = true; bv.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(bs);
    bv.addProperty("ADBE Vector Graphic - Stroke"); bv.addProperty("ADBE Vector Graphic - Fill");
    bg.property("ADBE Vectors Group").property("ADBE Vector Graphic - Stroke").property("ADBE Vector Stroke Color").setValue(PALETTE.rim);
    bg.property("ADBE Vectors Group").property("ADBE Vector Graphic - Stroke").property("ADBE Vector Stroke Width").setValue(2.2);
    bg.property("ADBE Vectors Group").property("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue([.17, .15, .13]);
    blot.anchorPoint.setValue([0, 0]); blot.position.setValue(pl.stop); AESLib.ease(blot.scale, [pl.stopT + .02, pl.stopT + .6], [[20, 8], [100, 100]], "settle"); blot.inPoint = pl.stopT;
    // the pen is never drawn: a soft wedge of its shadow off the nib and a tiny contact dot, baked per frame in screen space
    var shd = comp.layers.addShape(); shd.name = P + "_PENSHADOW"; var sg = shapeGroup(shd), sv = sg.property("ADBE Vectors Group"), ss = new Shape();
    ss.vertices = [[10, 8], [22, 14], [-236, 560], [-290, 536]]; ss.closed = true; sv.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(ss);
    sv.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue([.12, .11, .10]); shd.anchorPoint.setValue([0, 0]);
    var sb = fx(shd, "ADBE Gaussian Blur 2"); sb.property("Blurriness").setValue(26); shd.opacity.setValue(15);
    var dot = comp.layers.addShape(); dot.name = P + "_CONTACT"; var dg = shapeGroup(dot); dg.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Ellipse").property("ADBE Vector Ellipse Size").setValue([10, 8]);
    dg.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(PALETTE.ink); dot.anchorPoint.setValue([0, 0]); dot.opacity.setValue(30);
    fx(dot, "ADBE Gaussian Blur 2").property("Blurriness").setValue(3);
    // the vignette: a radial ramp multiplied over the frame
    var vig = solid(comp, P + "_VIGNETTE", [1, 1, 1], Wd, Ht); var vr = fx(vig, "ADBE Ramp"); vr.property("Start of Ramp").setValue(CEN); vr.property("Start Color").setValue([1, 1, 1, 1]);
    vr.property("End of Ramp").setValue([CEN[0] + 1150, CEN[1]]); vr.property("End Color").setValue([.91, .90, .87, 1]); vr.property("Ramp Shape").setValue(2); vig.blendingMode = BlendingMode.MULTIPLY;
    // subtitles: written on in Caveat, ink at 84%, a paper-coloured halo, no box; one layer per line, one batched Source Text call each
    var subs = [["picture", [6, 7, 8, 9, 10]], ["input", [11, 12, 13, 14, 15, 16, 17]], ["number", [18, 19, 20]], ["carry", [27, 28, 29, 30, 31, 32]]], SL = [];
    for (k = 0; k < subs.length; k++) { var idx = subs[k][1], parts = []; for (i = 0; i < idx.length; i++) parts.push(WL[idx[i]].text);
      var line = parts.join(" "), so = { s: line, size: 76, center: [CEN[0], 1745] }, S = words(comp, P + "_SUB" + k, so, 14), st0 = WL[idx[0]].s, wdur = .2 + .017 * line.length, cps = [];
      for (var f = 0; f <= Math.ceil(wdur * fps); f++) cps.push(line.substring(0, Math.ceil(line.length * Math.min(1, f / (wdur * fps)))));
      AESLib.bakeText(S, cps, fps, st0); S.inPoint = st0; var nx = Math.min(k < subs.length - 1 ? WL[subs[k + 1][1][0]].s : 9.02, WL[idx[idx.length - 1]].e + .5);
      AESLib.ease(S.opacity, [nx - .24, nx], [84, 0], "exit"); S.opacity.setValueAtTime(st0, 84); S.outPoint = nx; SL.push(S); }
    // bake the camera, the pen shadow, the width clamp and the fibre fade, one call per property
    var V = camera(pl, fps, scene.duration, CEN), TK = [], ZS = [], RT = [], PP = [], WS = [], FO = [], SP = [], SS = [], SO = [], DP = [];
    for (i = 0; i < V.length; i++) { var t = i / fps, v = V[i]; TK.push(t); ZS.push([v.z * 100, v.z * 100]); RT.push(v.r); PP.push([CEN[0] - v.c[0], CEN[1] - v.c[1]]);
      WS.push(Math.max(1, .5 / v.z)); FO.push(3 * clamp((v.z - .45) / .35, 0, 1));
      var nb = nibAt(pl, t), cr = Math.cos(v.r * Math.PI / 180), sr = Math.sin(v.r * Math.PI / 180), dx = v.z * (nb[0] - v.c[0]), dy = v.z * (nb[1] - v.c[1]), scr = [CEN[0] + dx * cr - dy * sr, CEN[1] + dx * sr + dy * cr];
      var lift = smooth((t - pl.stopT - .35) / .45), z5 = 100 * Math.sqrt(clamp(v.z, .6, 1.6)) * (1 + .25 * lift);
      SP.push([scr[0] + 60 * lift, scr[1] + 90 * lift]); SS.push([z5, z5]); SO.push(15 * (1 - .8 * lift)); DP.push(scr); }
    zoom.scale.setValuesAtTimes(TK, ZS); zoom.rotation.setValuesAtTimes(TK, RT); pan.position.setValuesAtTimes(TK, PP); wsl.property(1).setValuesAtTimes(TK, WS); fib.opacity.setValuesAtTimes(TK, FO);
    shd.position.setValuesAtTimes(TK, SP); shd.scale.setValuesAtTimes(TK, SS); shd.opacity.setValuesAtTimes(TK, SO); dot.position.setValuesAtTimes(TK, DP);
    dot.opacity.setValuesAtTimes([pl.stopT + .3, pl.stopT + .5], [30, 0]);
    // stacking, bottom to top: paper, mottle, fibres, frame art, bleed, ink, pool, blot, paper text, pen shadow, vignette, subtitles, nulls
    for (k = 0; k < order.length; k++) layers[order[k]].moveToBeginning(); for (k = 0; k < bleed.length; k++) bleed[k].moveAfter(layers[order[k]]);
    pool.moveToBeginning(); blot.moveToBeginning(); for (k = 0; k < 3; k++) T.title[k].moveToBeginning(); T.frames.moveToBeginning(); T.line.moveToBeginning(); T.end.moveToBeginning();
    dot.moveToBeginning(); shd.moveToBeginning(); vig.moveToBeginning(); for (k = 0; k < SL.length; k++) SL[k].moveToBeginning();
    ctl.moveToBeginning(); pan.moveToBeginning(); zoom.moveToBeginning();
    art.moveToEnd(); fib.moveToEnd(); mot.moveToEnd(); paper.moveToEnd();
    notes.push(chunks.length + " line chunks over " + order.length + " beats, " + n + " points, " + pools + " pools");
    return { layers: comp.numLayers, notes: notes };
  }
  return { FACE: FACE, PALETTE: PALETTE, fontOK: fontOK, plan: plan, nibAt: nibAt, camera: camera, buildScene: buildScene };
})();
