// Hologram HUD style: brand-neutral ES3 helpers. No project mutation happens at load.
// Read styles/hologram-hud/STYLE.md first. A subject made of light: line wireframes above a round projector pad on a near-black stage,
// scanned in by a rising plane, locked by target boxes, measured by values that roll out of garbage glyphs and turn the one warm accent
// on the frame they become true, all framed by HUD furniture (corner brackets, rulers, status line, telemetry) and HUD subtitles.
// The wireframes are real 3D: every path is a createPath expression that projects its 3D points through one camera null (yaw, pitch,
// distance, focal), so the orbit, crane and push are a handful of native keys and the pad, the scan plane and the objects stay in register.
// Adapted from Lemo-Opuscar's hologram-hud style (MIT, LemoLab); see library/styles/LICENSE-lemo-opuscar.txt.
var AESHologram = (function () {
  var SANS = "Rajdhani", MONO = "Share Tech Mono";
  function hex(h) { return [parseInt(h.substr(1, 2), 16) / 255, parseInt(h.substr(3, 2), 16) / 255, parseInt(h.substr(5, 2), 16) / 255]; }
  var PALETTE = { stage: hex("#010608"), lift: hex("#06181E"), line: hex("#38D9F2"), dim: hex("#1D6F7D"), hud: hex("#6FCFDE"), hot: hex("#D8FBFF"),
    text: hex("#DDF6FA"), accent: hex("#F4B53F"), plate: hex("#010A0E"), white: [1, 1, 1], black: [0, 0, 0] };
  var GLYPHS = "ABCDEFGHKLMNPRSTVWXYZ0123456789<>/#%+=", DIGITS = "0123456789";
  function fontOK() { AESLib.font(SANS, "Light"); AESLib.font(SANS, "Medium"); AESLib.font(SANS, "SemiBold"); AESLib.font(MONO, "Regular"); return true; }
  function c4(c) { return [c[0], c[1], c[2], 1]; }
  function fx(L, m) { return L.property("ADBE Effect Parade").addProperty(m); }
  function r3(v) { return Math.round(v * 1000) / 1000; }
  var seed = 11; function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
  function pick(set) { return set.charAt(Math.floor(rnd() * set.length)); }
  // keys in one call, each with the same mode: "settle" (arrive), "travel" (S-curve), "exit", "linear", "hold"
  function keys(prop, times, vals, mode) { prop.setValuesAtTimes(times, vals); var sp = prop.propertyValueType === PropertyValueType.TwoD_SPATIAL || prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL;
    for (var i = 0; i < times.length; i++) { var k = prop.nearestKeyIndex(times[i]);
      if (mode === "hold") { prop.setInterpolationTypeAtKey(k, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD); continue; }
      if (mode === "linear") { prop.setInterpolationTypeAtKey(k, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR); continue; }
      var ii = 85, oi = 30; if (mode === "exit") { ii = 15; oi = 75; } if (mode === "travel") { ii = 80; oi = 80; }
      var d = 1; if (!sp && prop.value instanceof Array) d = prop.value.length; var a = [], b = [];
      for (var n = 0; n < d; n++) { a.push(new KeyframeEase(0, ii)); b.push(new KeyframeEase(0, oi)); }
      prop.setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER); prop.setTemporalEaseAtKey(k, a, b); }
    if (sp) for (var j = 1; j <= prop.numKeys; j++) { try { prop.setSpatialTangentsAtKey(j, [0, 0, 0], [0, 0, 0]); } catch (e) {} }
    return prop; }
  function go(prop, t0, t1, v0, v1, mode) { return keys(prop, [t0, t1], [v0, v1], mode || "settle"); }

  // --- 3D: models and the projection --------------------------------------------------------------------------------------------
  // a model is a list of polylines { p: [[x, y, z], ...], c: closed, op: base opacity, w: width }. y is up from the pad, z away from camera.
  function ringPts(cx, cy, cz, rx, rz, n, a0) { var r = []; for (var i = 0; i < n; i++) { var a = (a0 || 0) + 2 * Math.PI * i / n; r.push([cx + rx * Math.cos(a), cy, cz + rz * Math.sin(a)]); } return r; }
  function poly(p, c, op, w) { return { p: p, c: !!c, op: op === undefined ? 100 : op, w: w || 2 }; }
  function tilt(m, deg) { var a = deg * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);                  // tip the top away from the camera, about the base
    for (var i = 0; i < m.length; i++) for (var j = 0; j < m[i].p.length; j++) { var q = m[i].p[j], y = q[1], z = q[2]; q[1] = y * ca - z * sa; q[2] = z * ca + y * sa; } return m; }
  function person() { var m = [], R = [[0, .22, .14], [.18, .22, .13], [.4, .32, .16], [.56, .38, .18], [.63, .24, .13]], N = 10;
    for (var i = 0; i < R.length; i++) m.push(poly(ringPts(0, R[i][0], 0, R[i][1], R[i][2], 28), true, i === 3 ? 100 : 80));
    for (var k = 0; k < N; k++) { var a = 2 * Math.PI * k / N, l = []; for (var j = 0; j < R.length; j++) l.push([R[j][1] * Math.cos(a), R[j][0], R[j][2] * Math.sin(a)]); m.push(poly(l, false, 55, 1.6)); }
    m.push(poly(ringPts(0, .66, 0, .07, .07, 14), true, 70)); for (var q = 0; q < 4; q++) { var b = Math.PI * q / 2; m.push(poly([[.07 * Math.cos(b), .63, .07 * Math.sin(b)], [.07 * Math.cos(b), .72, .07 * Math.sin(b)]], false, 60, 1.6)); }
    var hc = .86, hr = .15, lat = [-55, -25, 8, 40, 68];
    for (var t = 0; t < lat.length; t++) { var ph = lat[t] * Math.PI / 180; m.push(poly(ringPts(0, hc + hr * Math.sin(ph), 0, hr * Math.cos(ph), hr * Math.cos(ph), 24), true, t === 2 ? 95 : 70)); }
    for (var g = 0; g < 3; g++) { var u = g * Math.PI / 3, gc = []; for (var s = 0; s < 28; s++) { var v = 2 * Math.PI * s / 28; gc.push([hr * Math.cos(v) * Math.cos(u), hc + hr * Math.sin(v), hr * Math.cos(v) * Math.sin(u)]); } m.push(poly(gc, true, 60, 1.6)); }
    return m; }
  function documentModel() { var m = [], w = .58, h = .76, t = .035, c = .13, f = -t / 2, b = t / 2;
    function face(z) { return [[-w / 2, 0, z], [w / 2, 0, z], [w / 2, h - c, z], [w / 2 - c, h, z], [-w / 2, h, z]]; }
    var F = face(f), Bk = face(b); m.push(poly(F, true, 100)); m.push(poly(Bk, true, 45));
    for (var i = 0; i < 5; i++) m.push(poly([F[i], Bk[i]], false, 70, 1.6));
    m.push(poly([[w / 2 - c, h, f], [w / 2 - c, h - c, f], [w / 2, h - c, f]], false, 90));
    m.push(poly([[-.21, .62, f], [.06, .62, f]], false, 100, 3));
    var L = [[.53, .42], [.46, .38], [.39, .42], [.32, .34], [.25, .4]];
    for (var j = 0; j < L.length; j++) m.push(poly([[-.21, L[j][0], f], [-.21 + L[j][1], L[j][0], f]], false, 65, 1.6));
    m.push(poly([[-.21, .07, f], [-.06, .07, f], [-.06, .16, f], [-.21, .16, f]], true, 80));
    return tilt(m, 8); }
  function rrPts(w, h, r, y0, z) { var p = [], C = [[w / 2 - r, y0 + h - r, 0], [-w / 2 + r, y0 + h - r, 90], [-w / 2 + r, y0 + r, 180], [w / 2 - r, y0 + r, 270]];
    for (var i = 0; i < 4; i++) for (var s = 0; s <= 4; s++) { var a = (C[i][2] + 90 * s / 4) * Math.PI / 180; p.push([C[i][0] + r * Math.cos(a), C[i][1] + r * Math.sin(a), z]); } return p; }
  function device() { var m = [], w = .38, h = .78, d = .06, r = .06, f = -d / 2, b = d / 2, F = rrPts(w, h, r, 0, f), Bk = rrPts(w, h, r, 0, b);
    m.push(poly(F, true, 100)); m.push(poly(Bk, true, 45)); for (var i = 2; i < 20; i += 5) m.push(poly([F[i], Bk[i]], false, 70, 1.6));
    m.push(poly(rrPts(w - .05, h - .05, .04, .025, f - .002), true, 75));
    for (var g = 0; g < 6; g++) { var x0 = -.115 + (g % 2) * .13, y0 = .44 + Math.floor(g / 2) * .1; m.push(poly([[x0, y0, f], [x0 + .1, y0, f], [x0 + .1, y0 + .075, f], [x0, y0 + .075, f]], true, 60, 1.6)); }
    m.push(poly(rrPts(.09, .022, .011, h - .06, f - .002), true, 80, 1.6)); m.push(poly([[-.06, .06, f], [.06, .06, f]], false, 80, 2.4));
    m.push(poly([[-.115, .32, f], [.115, .32, f]], false, 55, 1.6)); m.push(poly([[-.115, .26, f], [.04, .26, f]], false, 55, 1.6));
    return tilt(m, 6); }
  function pad() { var m = [], R = [[.7, 22, 1.6], [1.05, 90, 2.6], [1.45, 18, 1.4], [2.1, 9, 1.4]];
    for (var i = 0; i < R.length; i++) m.push(poly(ringPts(0, 0, 0, R[i][0], R[i][0], 72), true, R[i][1], R[i][2]));
    return m; }
  function padDashed() { return [poly(ringPts(0, 0, 0, 1.12, 1.12, 72), true, 45, 1.6)]; }
  function padTicks() { var m = []; for (var i = 0; i < 72; i++) { var a = 2 * Math.PI * i / 72, r1 = 1.17, r2 = (i % 6) ? 1.22 : 1.3;
      m.push(poly([[r1 * Math.cos(a), 0, r1 * Math.sin(a)], [r2 * Math.cos(a), 0, r2 * Math.sin(a)]], false, (i % 6) ? 40 : 70, 1.4)); }
    for (var j = 0; j < 24; j++) { var b = 2 * Math.PI * (j + .5) / 24; m.push(poly([[.3 * Math.cos(b), 0, .3 * Math.sin(b)], [.98 * Math.cos(b), 0, .98 * Math.sin(b)]], false, 10, 1.2)); }
    return m; }
  // the camera: { yaw, pitch (deg), dist, focal, ty (target height), cx, cy (screen point of the target) }
  function proj(q, cam, ox, oy, spin) { var cs = Math.cos(spin || 0), ss = Math.sin(spin || 0), x = q[0] * cs - q[2] * ss + (ox || 0), z = q[0] * ss + q[2] * cs, y = q[1] + (oy || 0) - cam.ty;
    var A = cam.yaw * Math.PI / 180, Q = cam.pitch * Math.PI / 180, x1 = x * Math.cos(A) - z * Math.sin(A), z1 = x * Math.sin(A) + z * Math.cos(A);
    var yv = y * Math.cos(Q) + z1 * Math.sin(Q), zv = -y * Math.sin(Q) + z1 * Math.cos(Q), k = cam.focal / (zv + cam.dist); return [cam.cx + x1 * k, cam.cy - yv * k, zv]; }
  function bounds(model, cam, ox, oy) { var b = [1e9, 1e9, -1e9, -1e9];
    for (var i = 0; i < model.length; i++) for (var j = 0; j < model[i].p.length; j++) { var s = proj(model[i].p[j], cam, ox, oy, 0);
      if (s[0] < b[0]) b[0] = s[0]; if (s[1] < b[1]) b[1] = s[1]; if (s[0] > b[2]) b[2] = s[0]; if (s[1] > b[3]) b[3] = s[1]; } return b; }
  // the projection as an expression: the path's own points, the camera null's sliders, the layer's own offsets
  function camHead(camName, oxE, oyE, spinE) { return "var L=thisComp.layer(\"" + camName + "\");var A=L.effect(\"Yaw\")(1)*Math.PI/180,Q=L.effect(\"Pitch\")(1)*Math.PI/180," +
    "D=L.effect(\"Dist\")(1),F=L.effect(\"Focal\")(1),T=L.effect(\"TargetY\")(1),X0=L.effect(\"CX\")(1),Y0=L.effect(\"CY\")(1);" +
    "var OX=" + oxE + ",OY=" + oyE + ",S=" + spinE + ";var ca=Math.cos(A),sa=Math.sin(A),cq=Math.cos(Q),sq=Math.sin(Q),cs=Math.cos(S),ss=Math.sin(S);" +
    "function pr(a,b,c){var x=a*cs-c*ss+OX,z=a*ss+c*cs,y=b+OY-T;var x1=x*ca-z*sa,z1=x*sa+z*ca;var yv=y*cq+z1*sq,zv=-y*sq+z1*cq,k=F/(zv+D);return [X0+x1*k,Y0-yv*k,zv];}"; }
  function pathExpr(head, pts, closed) { var flat = []; for (var i = 0; i < pts.length; i++) flat.push(r3(pts[i][0]), r3(pts[i][1]), r3(pts[i][2]));
    return head + "var P=[" + flat.join(",") + "],o=[];for(var i=0;i<P.length;i+=3){var s=pr(P[i],P[i+1],P[i+2]);o.push([s[0],s[1]]);}createPath(o,[],[]," + (closed ? "true" : "false") + ");"; }
  function fogExpr(head, pts, base) { var c = [0, 0, 0]; for (var i = 0; i < pts.length; i++) { c[0] += pts[i][0] / pts.length; c[1] += pts[i][1] / pts.length; c[2] += pts[i][2] / pts.length; }
    return head + "var s=pr(" + r3(c[0]) + "," + r3(c[1]) + "," + r3(c[2]) + ");" + base + "*(1-.72*Math.min(1,Math.max(0,(s[2]+.9)/2.1)));"; }
  // one shape layer of light: a group per polyline (expression path + stroke with depth fog), additive, two glow passes
  function wire(comp, name, model, camName, o) { o = o || {}; var L = comp.layers.addShape(); L.name = name; L.anchorPoint.setValue([0, 0]); L.position.setValue([0, 0]);
    var oxE = "0", oyE = "0", spE = "0";
    if (o.ox !== undefined) { var sx = fx(L, "ADBE Slider Control"); sx.name = "Off X"; sx.property(1).setValue(o.ox); oxE = "effect(\"Off X\")(1)"; }
    if (o.oyExpr) oyE = o.oyExpr; if (o.spin) { var sp = fx(L, "ADBE Slider Control"); sp.name = "Spin"; spE = "effect(\"Spin\")(1)"; }
    var head = camHead(camName, oxE, oyE, spE), root = L.property("ADBE Root Vectors Group"), col = o.color || PALETTE.line;
    for (var i = 0; i < model.length; i++) { var g = root.addProperty("ADBE Vector Group"), v = g.property("ADBE Vectors Group");
      v.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").expression = pathExpr(head, model[i].p, model[i].c);
      if (o.fill) { var fl = v.addProperty("ADBE Vector Graphic - Fill"); fl.property("ADBE Vector Fill Color").setValue(col); fl.property("ADBE Vector Fill Opacity").setValue(o.fill); }
      var st = v.addProperty("ADBE Vector Graphic - Stroke"); st.property("ADBE Vector Stroke Color").setValue(col); st.property("ADBE Vector Stroke Width").setValue(model[i].w * (o.wk || 1));
      if (o.dash) { var ds = st.property("ADBE Vector Stroke Dashes"); ds.addProperty("ADBE Vector Stroke Dash 1").setValue(o.dash[0]); ds.addProperty("ADBE Vector Stroke Gap 1").setValue(o.dash[1]); st = v.property("ADBE Vector Graphic - Stroke"); }
      if (o.fog === false) st.property("ADBE Vector Stroke Opacity").setValue(model[i].op); else st.property("ADBE Vector Stroke Opacity").expression = fogExpr(head, model[i].p, model[i].op); }
    L.blendingMode = BlendingMode.ADD; if (o.glow !== false) { glow(L, 10, 1.1, 30); glow(L, 46, .7, 30); } return L; }
  function glow(L, radius, intensity, thr) { var g = fx(L, "ADBE Glo2"); g.property("Glow Based On").setValue(2); g.property("Glow Threshold").setValue(thr || 35);
    g.property("Glow Radius").setValue(radius || 30); g.property("Glow Intensity").setValue(intensity || .8); return g; }
  function blur(L, amt) { var b = fx(L, "ADBE Gaussian Blur 2"); b.property("Blurriness").setValue(amt); try { b.property("Repeat Edge Pixels").setValue(0); } catch (e) {} return b; }

  // --- flat pieces ------------------------------------------------------------------------------------------------------------------
  // items in one shape layer whose origin sits at pos, drawn in order (later on top). item = { ell, x, y, w, h, r, fill, op, stroke, sw, sop }
  // or a polyline { path: [[x, y], ...], closed, stroke, sw, sop }
  function draw(comp, name, items, pos) { var L = comp.layers.addShape(); L.name = name; var root = L.property("ADBE Root Vectors Group");
    for (var i = items.length - 1; i >= 0; i--) { var it = items[i], v = root.addProperty("ADBE Vector Group").property("ADBE Vectors Group");
      if (it.path) { var s0 = new Shape(); s0.vertices = it.path; s0.closed = !!it.closed; v.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(s0); }
      else if (it.ell) { var e = v.addProperty("ADBE Vector Shape - Ellipse"); e.property("ADBE Vector Ellipse Size").setValue([it.w, it.h]); e.property("ADBE Vector Ellipse Position").setValue([it.x + it.w / 2, it.y + it.h / 2]); }
      else { var r = v.addProperty("ADBE Vector Shape - Rect"); r.property("ADBE Vector Rect Size").setValue([it.w, it.h]); r.property("ADBE Vector Rect Position").setValue([it.x + it.w / 2, it.y + it.h / 2]);
        if (it.r) r.property("ADBE Vector Rect Roundness").setValue(it.r); }
      if (it.stroke) { var st = v.addProperty("ADBE Vector Graphic - Stroke"); st.property("ADBE Vector Stroke Color").setValue(it.stroke);
        st.property("ADBE Vector Stroke Width").setValue(it.sw || 1.5); st.property("ADBE Vector Stroke Opacity").setValue(it.sop === undefined ? 100 : it.sop);
        st.property("ADBE Vector Stroke Line Cap").setValue(1); }
      if (it.fill) { var f = v.addProperty("ADBE Vector Graphic - Fill"); f.property("ADBE Vector Fill Color").setValue(it.fill); if (it.op !== undefined) f.property("ADBE Vector Fill Opacity").setValue(it.op); } }
    L.anchorPoint.setValue([0, 0]); L.position.setValue(pos); return L; }
  // a HUD plate centred on 0, 0: translucent near-black, a 1 px hue border, 10 px corner ticks in the hue
  function plateItems(w, h, op) { var x = -w / 2, y = -h / 2, t = 12, P = PALETTE, I = [{ x: x, y: y, w: w, h: h, fill: P.plate, op: op === undefined ? 72 : op, stroke: P.line, sw: 1.2, sop: 28 }];
    var C = [[x, y, 1, 1], [x + w, y, -1, 1], [x + w, y + h, -1, -1], [x, y + h, 1, -1]];
    for (var i = 0; i < 4; i++) I.push({ path: [[C[i][0] + C[i][2] * t, C[i][1]], [C[i][0], C[i][1]], [C[i][0], C[i][1] + C[i][3] * t]], stroke: P.line, sw: 2, sop: 90 }); return I; }
  // target-box corners, centred on 0, 0
  function bracketItems(w, h, arm, col, sw) { var x = -w / 2, y = -h / 2, I = [], C = [[x, y, 1, 1], [x + w, y, -1, 1], [x + w, y + h, -1, -1], [x, y + h, 1, -1]];
    for (var i = 0; i < 4; i++) I.push({ path: [[C[i][0] + C[i][2] * arm, C[i][1]], [C[i][0], C[i][1]], [C[i][0], C[i][1] + C[i][3] * arm]], stroke: col, sw: sw || 2.4 }); return I; }

  // --- type ---------------------------------------------------------------------------------------------------------------------------
  function face(o) { if (o.mono) return MONO; return SANS; }
  function measure(comp, str, o) { var L = AESLib.text(comp, "HOLO_PROBE", str, { family: face(o), style: o.style || "Regular", size: o.size, color: [1, 1, 1], just: "left", tracking: o.tracking || 0 });
    var r = L.sourceRectAtTime(0, false); L.remove(); return r; }                                    // a fresh probe per measurement
  // one text layer on a baseline: o = { mono, style, size, color, x, y, align ("left"|"center"|"right"), tracking, t0, t1 }
  function txt(comp, name, str, o) { var L = AESLib.text(comp, name, str, { family: face(o), style: o.style || "Regular", size: o.size, color: o.color || PALETTE.text, just: "left", tracking: o.tracking || 0 });
    var r = L.sourceRectAtTime(0, false), ax = r.left; if (o.align === "center") ax = r.left + r.width / 2; if (o.align === "right") ax = r.left + r.width;
    L.anchorPoint.setValue([ax, 0]); L.position.setValue([o.x, o.y]); if (o.t0 !== undefined) L.inPoint = o.t0; if (o.t1 !== undefined) L.outPoint = o.t1; return L; }
  function typeOut(str, t0, t1, base) { var r = { times: [], strs: [] }, n = str.length; base = base || "";
    for (var i = 1; i <= n; i++) { r.times.push(t0 + (t1 - t0) * (i - 1) / Math.max(1, n - 1)); r.strs.push(base + str.substr(0, i)); } return r; }
  // a colour that changes on the lock: a Fill effect keyed with holds (garbage dim, a one-frame white flash, then the final colour)
  function lockColour(L, t0, lock, fin, fps) { var f = fx(L, "ADBE Fill"), c = f.property("Color");
    keys(c, [t0, lock, lock + 1 / fps], [c4(PALETTE.dim), c4(PALETTE.white), c4(fin)], "hold"); return f; }
  // rolled text: one layer per character, each scrambling through garbage glyphs every frame until its lock, then the real character
  // o = { style, size, tracking, x (left ink edge), y (baseline), t0, locks: [one time per non-space character], color, set, tOut, fps }
  function roll(comp, name, str, o) { var fps = o.fps, M = { style: o.style, size: o.size, tracking: o.tracking }, full = measure(comp, str, M), X = o.x - full.left, out = [], n = 0;
    for (var i = 0; i < str.length; i++) { var ch = str.charAt(i); if (ch === " ") continue;
      var pre = measure(comp, str.substr(0, i + 1), M), cr = measure(comp, ch, M), cx = X + pre.left + pre.width - cr.width / 2, lock = o.locks[n], t0 = o.t0 + (o.stagger || 0) * n;
      var L = AESLib.text(comp, name + n, ch, { family: SANS, style: o.style, size: o.size, color: [1, 1, 1], just: "left" });
      var own = L.sourceRectAtTime(0, false); L.anchorPoint.setValue([own.left + own.width / 2, 0]); L.position.setValue([cx, o.y]);
      var ss = [], f; for (f = 0; t0 + f / fps < lock - .001; f++) ss.push(pick(o.set || GLYPHS)); ss.push(ch);
      if (o.tOut !== undefined) { var hold = Math.round((o.tOut + .012 * n - t0) * fps); while (ss.length < hold) ss.push(ch); for (var g = 0; g < 3; g++) ss.push(pick(o.set || GLYPHS)); ss.push(" "); }
      AESLib.bakeText(L, ss, fps, t0); L.inPoint = t0; if (o.tOut !== undefined) L.outPoint = t0 + ss.length / fps;
      lockColour(L, t0, lock, o.color || PALETTE.text, fps); out.push(L); n++; }
    return out; }
  function nonSpace(s) { var n = 0; for (var i = 0; i < s.length; i++) if (s.charAt(i) !== " ") n++; return n; }
  function spread(t0, t1, n, rtl) { var r = []; for (var i = 0; i < n; i++) { var k = i; if (rtl) k = n - 1 - i; r.push(t0 + (t1 - t0) * k / Math.max(1, n - 1)); } return r; }
  function wordsIn(list, t0, t1) { var r = []; for (var i = 0; i < list.length; i++) if (list[i].s >= t0 - .05 && list[i].s < t1) r.push(list[i]); return r; }
  // a decoding line: one layer whose characters resolve left to right out of garbage glyphs (one bakeText call)
  function decodeStrings(str, frames) { var ss = []; for (var f = 1; f <= frames; f++) { var n = Math.round(str.length * f / frames), s = str.substr(0, n);
      for (var i = n; i < str.length; i++) { if (str.charAt(i) === " ") s += " "; else s += pick(GLYPHS); } ss.push(s); } return ss; }

  // --- HUD pieces -------------------------------------------------------------------------------------------------------------------
  function grp(comp, name, x, y, layers) { var N = comp.layers.addNull(); N.name = name; N.anchorPoint.setValue([x, y]); N.position.setValue([x, y]);
    for (var i = 0; i < layers.length; i++) if (layers[i]) layers[i].parent = N; return N; }
  function setIn(layers, t) { for (var i = 0; i < layers.length; i++) if (layers[i]) layers[i].inPoint = t; }
  function setOut(layers, t) { for (var i = 0; i < layers.length; i++) if (layers[i]) layers[i].outPoint = t; }
  // a target lock: oversized, rotated 45 degrees and faint, it snaps to fit in about 0.2 s and flashes white for three frames
  function target(comp, name, cx, cy, w, h, tag, label, t, fps) { var P = PALETTE, B = draw(comp, name, bracketItems(w, h, 26, P.line, 2.6), [cx, cy]);
    var col = B.property("ADBE Root Vectors Group"), sts = [];
    for (var i = 1; i <= col.numProperties; i++) sts.push(col.property(i).property("ADBE Vectors Group").property("ADBE Vector Graphic - Stroke").property("ADBE Vector Stroke Color"));
    for (var s = 0; s < sts.length; s++) keys(sts[s], [t, t + 3 / fps], [P.white, P.line], "hold");
    go(B.scale, t, t + .22, [190, 190], [100, 100], "settle"); go(B.rotation, t, t + .22, 45, 0, "settle"); go(B.opacity, t, t + .22, 30, 100, "settle"); B.inPoint = t;
    var out = [B];
    if (tag) { var tx = cx - w / 2, ty = cy - h / 2 - 22, TB = draw(comp, name + "_TAG", [{ x: 0, y: -19, w: 50, h: 38, fill: P.plate, op: 90, stroke: P.text, sw: 1.5, sop: 80 }], [tx, ty]);
      var TT = txt(comp, name + "_TAGT", tag, { mono: true, size: 24, color: P.text, x: tx + 25, y: ty + 8, align: "center" });
      var TL = txt(comp, name + "_LAB", label, { style: "SemiBold", size: 28, color: P.hud, tracking: 220, x: tx + 62, y: ty + 10 });
      AESLib.bakeText(TL, decodeStrings(label, 5), fps, t + .08); setIn([TB, TT, TL], t + .06); out.push(TB, TT, TL); }
    return out; }
  // a HUD subtitle: a plate with corner ticks, two slanted brackets, four voiceprint bars that move with the words; near-white Rajdhani Medium
  function subtitle(comp, name, str, t0, t1, words, fps) { var P = PALETTE, size = 46, W = comp.width, y = 1690, r = measure(comp, str, { style: "Medium", size: size, tracking: 10 });
    var pw = r.width + 176, ph = 96, x0 = W / 2 - pw / 2, items = plateItems(pw, ph, 62);
    items.push({ path: [[-pw / 2 - 18, -30], [-pw / 2 - 30, 30]], stroke: P.line, sw: 3 }); items.push({ path: [[pw / 2 + 18, -30], [pw / 2 + 30, 30]], stroke: P.line, sw: 3 });
    var S = draw(comp, name, items, [W / 2, y]), bars = [];
    for (var b = 0; b < 4; b++) { var bx = x0 + 34 + b * 13, Bb = draw(comp, name + "_VB" + b, [{ x: -3, y: -22, w: 6, h: 44, fill: P.line }], [bx, y]), ts = [], vs = [];
      for (var t = t0; t < t1; t += 2 / fps) { var on = false; for (var w = 0; w < words.length; w++) if (t >= words[w].s && t <= words[w].e) on = true;
        var amp = 14; if (on) amp = 30 + 70 * rnd(); ts.push(t); vs.push([100, amp]); }
      keys(Bb.scale, ts, vs, "linear"); bars.push(Bb); }
    var T = txt(comp, name + "_T", str, { style: "Medium", size: size, color: P.text, tracking: 10, x: x0 + 104, y: y + 16 });
    AESLib.bakeText(T, decodeStrings(str, 6).concat([str]), fps, t0 + .04);
    go(S.scale, t0, t0 + .12, [0, 100], [100, 100], "settle"); go(S.scale, t1 - .1, t1, [100, 100], [0, 100], "exit");
    var all = [S, T].concat(bars); setIn(all, t0); setOut(all, t1); T.outPoint = t1 - .08; return all; }
  // a horizontal scan front (the only way things appear or vanish): a matte rect keyed top/bottom plus a hot line travelling with it.
  // mode "in" reveals top-down, "out" erases top-down. Returns the matte; give it to every layer of the group with setTrackMatte.
  function scanMatte(comp, name, box, segs, fps, noHot) { var M = comp.layers.addShape(); M.name = name; M.anchorPoint.setValue([0, 0]); M.position.setValue([0, 0]);
    var v = M.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").property("ADBE Vectors Group"); v.addProperty("ADBE Vector Shape - Group");
    var fl = v.addProperty("ADBE Vector Graphic - Fill"); fl.property("ADBE Vector Fill Color").setValue([1, 1, 1]);
    var sp = M.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property(1).property("ADBE Vector Shape");   // re-fetched after the Fill was added
    function rect(top, bot) { var s = new Shape(); s.vertices = [[box[0] - 40, top], [box[2] + 40, top], [box[2] + 40, bot], [box[0] - 40, bot]]; s.closed = true; return s; }
    var ts = [], vs = [], hot = [], E = box[1] - 2, Bt = box[3] + 2;
    for (var i = 0; i < segs.length; i++) { var g = segs[i];
      if (g.mode === "in") { ts.push(g.t0, g.t1); vs.push(rect(E, E), rect(E, Bt)); } else { ts.push(g.t0, g.t1); vs.push(rect(E, Bt), rect(Bt, Bt)); } hot.push(g); }
    sp.setValuesAtTimes(ts, vs); for (var k = 1; k <= sp.numKeys; k++) sp.setInterpolationTypeAtKey(k, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
    M.enabled = false; if (noHot) return { M: M, hot: null };
    var H = draw(comp, name + "_HOT", [{ x: box[0] - 30, y: -2, w: box[2] - box[0] + 60, h: 4, fill: PALETTE.hot }], [0, E]); glow(H, 22, 1.4, 20); H.blendingMode = BlendingMode.ADD;
    var hp = [], hv = [], ho = [], hov = [];
    for (var j = 0; j < hot.length; j++) { hp.push(hot[j].t0, hot[j].t1); hv.push([0, E], [0, Bt]); ho.push(hot[j].t0 - 1 / fps, hot[j].t0, hot[j].t1, hot[j].t1 + 1 / fps); hov.push(0, 100, 100, 0); }
    keys(H.position, hp, hv, "linear"); keys(H.opacity, ho, hov, "hold");
    return { M: M, hot: H }; }
  function matte(layers, M) { for (var i = 0; i < layers.length; i++) layers[i].setTrackMatte(M, TrackMatteType.ALPHA); }
  // the real picture as a hologram panel: tinted in the hue, additive, scanlines, a border plate. src is a layer already placed at rest.
  function holoPanel(comp, name, src, cx, cy, w, h) { var P = PALETTE, T = fx(src, "ADBE Tint"); T.property("Map Black To").setValue(c4([0, .02, .03])); T.property("Map White To").setValue(c4([.72, .97, 1]));
    glow(src, 14, .45, 55); src.blendingMode = BlendingMode.ADD; src.opacity.setValue(88);
    var SL = comp.layers.addShape(); SL.name = name + "_LINES"; var v = SL.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").property("ADBE Vectors Group");
    var r = v.addProperty("ADBE Vector Shape - Rect"); r.property("ADBE Vector Rect Size").setValue([w, 2]); r.property("ADBE Vector Rect Position").setValue([0, -h / 2 + 1]);
    var f = v.addProperty("ADBE Vector Graphic - Fill"); f.property("ADBE Vector Fill Color").setValue(P.black);
    var rp = v.addProperty("ADBE Vector Filter - Repeater"); rp.property("ADBE Vector Repeater Copies").setValue(Math.floor(h / 4));
    rp.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([0, 4]); SL.anchorPoint.setValue([0, 0]); SL.position.setValue([cx, cy]); SL.opacity.setValue(45);
    var B = draw(comp, name + "_PLATE", plateItems(w + 16, h + 16, 0), [cx, cy]); return [src, SL, B]; }

  // --- buildScene ---------------------------------------------------------------------------------------------------------------------
  // The shared test scene as a hologram spec scan. Three wireframe objects are scanned onto the pad and locked one by one, pulled together
  // into one picture, erased; the real frame becomes a hologram panel and is measured (338 rolls out of garbage glyphs and turns amber,
  // then docks in the rail); the spoken line is typed into a live transcript; the frame returns, turns into its own line art, folds into the
  // pad, and the pad scans the assembled picture back up under the end lockup.
  function buildScene(comp, scene, opts) {
    fontOK(); var P = opts.prefix || "HOLOHU", PAL = PALETTE, B = scene.beat, W = comp.width, H = comp.height, CX = W / 2, WL = scene.wordList, fps = scene.fps, END = scene.duration, notes = [];
    var A = opts.assets || {}; AESLib.clearOwned(comp, P); seed = 11;
    var camName = P + "_CAM", CY = 1020;
    // the stage: near-black with a radial lift behind the subject, a fading dot grid with slow parallax, a strong vignette
    var stg = comp.layers.addSolid(PAL.stage, P + "_STAGE", W, H, 1), rp = fx(stg, "ADBE Ramp");
    rp.property("Start of Ramp").setValue([CX, CY]); rp.property("Start Color").setValue(c4(PAL.lift)); rp.property("End of Ramp").setValue([CX, CY + 900]);
    rp.property("End Color").setValue(c4(PAL.stage)); rp.property("Ramp Shape").setValue(2);
    var dots = comp.layers.addShape(); dots.name = P + "_DOTS"; var dv = dots.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").property("ADBE Vectors Group");
    var de = dv.addProperty("ADBE Vector Shape - Ellipse"); de.property("ADBE Vector Ellipse Size").setValue([3, 3]);
    var df = dv.addProperty("ADBE Vector Graphic - Fill"); df.property("ADBE Vector Fill Color").setValue(PAL.line);
    var r1 = dv.addProperty("ADBE Vector Filter - Repeater"); r1.property("ADBE Vector Repeater Copies").setValue(26); r1.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([48, 0]);
    var r2 = dv.addProperty("ADBE Vector Filter - Repeater"); r2.property("ADBE Vector Repeater Copies").setValue(44); r2.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([0, 48]);
    dots.anchorPoint.setValue([0, 0]); dots.position.setValue([12, 12]); dots.opacity.setValue(26);
    var dm = dots.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"), dms = new Shape(), dk = .5523;
    dms.vertices = [[CX + 72, CY - 900], [CX + 72 + 560, CY + 40], [CX + 72, CY + 980], [CX + 72 - 560, CY + 40]];
    dms.inTangents = [[-560 * dk, 0], [0, -940 * dk], [560 * dk, 0], [0, 940 * dk]]; dms.outTangents = [[560 * dk, 0], [0, 940 * dk], [-560 * dk, 0], [0, -940 * dk]]; dms.closed = true;
    dm.property("ADBE Mask Shape").setValue(dms); dm.property("ADBE Mask Feather").setValue([420, 420]);
    var vig = comp.layers.addSolid(PAL.black, P + "_VIGNETTE", W, H, 1), vm = vig.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"), vs = new Shape(), rx = W * .74, ry = H * .58;
    vs.vertices = [[CX, CY - ry], [CX + rx, CY], [CX, CY + ry], [CX - rx, CY]]; vs.inTangents = [[-rx * dk, 0], [0, -ry * dk], [rx * dk, 0], [0, ry * dk]];
    vs.outTangents = [[rx * dk, 0], [0, ry * dk], [-rx * dk, 0], [0, -ry * dk]]; vs.closed = true;
    vm.property("ADBE Mask Shape").setValue(vs); vm.property("ADBE Mask Feather").setValue([520, 520]); vm.inverted = true; vig.opacity.setValue(70);

    // the camera null: an orbit that cranes down while it pushes in, a slow drift, then a turntable under the end lockup
    var CAM = comp.layers.addNull(); CAM.name = camName; var S = {};
    var SL = [["Yaw", 34], ["Pitch", 26], ["Dist", 4.8], ["Focal", 2000], ["TargetY", .45], ["CX", CX], ["CY", CY], ["Scan", -1.2]];
    for (var s = 0; s < SL.length; s++) { var e = fx(CAM, "ADBE Slider Control"); e.name = SL[s][0]; e.property(1).setValue(SL[s][1]); }
    for (var s2 = 0; s2 < SL.length; s2++) S[SL[s2][0]] = CAM.property("ADBE Effect Parade").property(SL[s2][0]).property(1);   // re-fetched after the siblings exist
    keys(S.Yaw, [0, 3.45, 8.95, END], [34, 12, 2, -22], "travel"); keys(S.Pitch, [0, 2.2, 9.0, END], [26, 17, 17, 12], "travel"); keys(S.Dist, [0, 2.2, 9.0, END], [4.8, 4.2, 4.2, 4.0], "travel");
    var T1 = B.title.t0 + .3, T2 = B.title.t1 - .1, E0 = B.input.t0, E1 = B.input.t0 + .38, R0 = B.end.t0 + .02, R1 = B.end.t0 + .74;
    keys(S.Scan, [0, T1, T1 + .01, T2, E0, E1, E1 + .01, R0, R0 + .01, R1], [-1.2, -1.2, -.1, 1.3, 1.3, -.1, -1.2, -1.2, -.1, 1.3], "linear");   // parked well below the pad, so nothing near peeks under the front
    function camAt(t) { return { yaw: S.Yaw.valueAtTime(t, false), pitch: S.Pitch.valueAtTime(t, false), dist: S.Dist.valueAtTime(t, false), focal: 2000, ty: .45, cx: CX, cy: CY }; }

    // the projector pad in true perspective: rings (one bright, one dashed), ticks and faint rays that rotate slowly, a faint floor disc
    var padL = wire(comp, P + "_PAD", pad(), camName, { glow: false }), dash = wire(comp, P + "_PADDASH", padDashed(), camName, { dash: [10, 8], glow: false });
    var ticks = wire(comp, P + "_PADTICKS", padTicks(), camName, { spin: true, glow: false });
    var spinP = ticks.property("ADBE Effect Parade").property("Spin").property(1); keys(spinP, [0, END], [0, .12 * END], "linear");
    var floor = wire(comp, P + "_FLOOR", [poly(ringPts(0, 0, 0, 1.05, 1.05, 72), true, 0, 1)], camName, { fill: 7, glow: false, fog: false });
    glow(padL, 18, .9, 30); var padHot = padL.property("ADBE Root Vectors Group").property(2).property("ADBE Vectors Group").property("ADBE Vector Graphic - Stroke").property("ADBE Vector Stroke Color");
    // the pad powers on: rings scale out from the centre on the first beat (a group-wide scale on the pad layers around the pad's centre)
    var pc = proj([0, 0, 0], camAt(0), 0, 0, 0);
    var padLs = [padL, dash, ticks, floor];
    for (var pl = 0; pl < padLs.length; pl++) { padLs[pl].anchorPoint.setValue([pc[0], pc[1]]); padLs[pl].position.setValue([pc[0], pc[1]]); go(padLs[pl].scale, .04, .5, [0, 0], [100, 100], "settle"); }
    // the scan plane: a hot ring at the scan height with a faint fill, visible only while it moves
    var scanR = wire(comp, P + "_SCANRING", [poly(ringPts(0, 0, 0, 1.22, 1.22, 64), true, 100, 2.4)], camName, { color: PAL.hot, fill: 3, oyExpr: "L.effect(\"Scan\")(1)", fog: false, glow: false }); glow(scanR, 16, .9, 40);
    var so = scanR.opacity; keys(so, [0, T1 - .02, T2 + .02, E0 - .02, E1 + .02, R0 - .02, R1 + .02], [0, 100, 0, 100, 0, 100, 0], "hold");

    // the three objects, their scan matte (visible below the front: the scan grows them, the same plane erases them)
    var OBJ = [{ k: "PERSON", m: person(), x: -.64, xa: -.42 }, { k: "DOCUMENT", m: documentModel(), x: 0, xa: 0 }, { k: "DEVICE", m: device(), x: .64, xa: .42 }], objL = [];
    var mk = comp.layers.addShape(); mk.name = P + "_SCANMATTE"; mk.anchorPoint.setValue([0, 0]); mk.position.setValue([0, 0]);
    var mkv = mk.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").property("ADBE Vectors Group");
    mkv.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").expression = camHead(camName, "0", "L.effect(\"Scan\")(1)", "0") +
      "var s=pr(0,0,0);createPath([[-300,s[1]],[1380,s[1]],[1380,2300],[-300,2300]],[],[],true);";
    mkv.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue([1, 1, 1]); mk.enabled = false;
    var tA0 = 0, tA1 = 0; { var pw0 = wordsIn(WL, B.picture.t0, B.picture.t1); tA0 = pw0[3] ? pw0[3].s : B.picture.t0 + .95; tA1 = tA0 + .32; }
    for (var o = 0; o < OBJ.length; o++) { var OL = wire(comp, P + "_OBJ" + o, OBJ[o].m, camName, { ox: OBJ[o].x }); OL.setTrackMatte(mk, TrackMatteType.ALPHA);
      var ox = OL.property("ADBE Effect Parade").property("Off X").property(1); keys(ox, [tA0, tA1], [OBJ[o].x, OBJ[o].xa], "settle"); objL.push(OL); }

    // HUD furniture: corner brackets, rulers with faster parallax, subject // mode, the status line, telemetry
    var br = [], m = 44, a = 46, CR = [[m, m, 1, 1], [W - m, m, -1, 1], [W - m, H - m, -1, -1], [m, H - m, 1, -1]];
    for (var c = 0; c < 4; c++) br.push({ path: [[CR[c][0] + CR[c][2] * a, CR[c][1]], [CR[c][0], CR[c][1]], [CR[c][0], CR[c][1] + CR[c][3] * a]], stroke: PAL.line, sw: 2, sop: 70 });
    var BR = draw(comp, P + "_BRACKETS", br, [0, 0]); go(BR.opacity, 0, .3, 0, 100, "settle");
    function ruler(nm, x, dir) { var Rl = comp.layers.addShape(); Rl.name = nm; var rv = Rl.property("ADBE Root Vectors Group");
      for (var q = 0; q < 2; q++) { var g = rv.addProperty("ADBE Vector Group").property("ADBE Vectors Group"), sh = new Shape(), len = q ? 18 : 9;
        sh.vertices = [[0, 0], [dir * len, 0]]; sh.closed = false; g.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(sh);
        var st = g.addProperty("ADBE Vector Graphic - Stroke"); st.property("ADBE Vector Stroke Color").setValue(PAL.line); st.property("ADBE Vector Stroke Width").setValue(1.4); st.property("ADBE Vector Stroke Opacity").setValue(q ? 55 : 30);
        var rr = g.addProperty("ADBE Vector Filter - Repeater"); rr.property("ADBE Vector Repeater Copies").setValue(q ? 12 : 58);
        rr.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([0, q ? 120 : 24]); }
      Rl.anchorPoint.setValue([0, 0]); Rl.position.setValue([x, 300]);
      var mp = Rl.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"), ms = new Shape(); ms.vertices = [[-30, 0], [30, 0], [30, 1320], [-30, 1320]]; ms.closed = true;
      mp.property("ADBE Mask Shape").setValue(ms); mp.property("ADBE Mask Feather").setValue([0, 120]);
      Rl.position.expression = "var y=thisComp.layer(\"" + camName + "\").effect(\"Yaw\")(1);[value[0],value[1]+((y*4)%24)]"; return Rl; }
    var RLl = ruler(P + "_RULERL", 60, 1), RLr = ruler(P + "_RULERR", W - 60, -1);
    dots.position.expression = "var y=thisComp.layer(\"" + camName + "\").effect(\"Yaw\")(1);[value[0]+((y*1.2)%48)-24,value[1]]";
    var tl = "EVERY STYLE  //  SCAN", tw = wordsIn(WL, B.title.t0, B.title.t1), tlo = typeOut(tl, tw[0] ? tw[0].s : .05, tw[1] ? tw[1].e : .44);
    var TLB = txt(comp, P + "_SUBJ", tl, { mono: true, size: 24, color: PAL.hud, tracking: 80, x: 96, y: 124 }); AESLib.textKeys(TLB, tlo.times, tlo.strs); TLB.inPoint = tlo.times[0];
    // the status line, right-aligned (an anchor expression keeps it flush right while its text changes)
    var st0 = [], sv0 = [];
    for (var pc2 = 0; pc2 <= 100; pc2 += 4) { st0.push(T1 + (T2 - T1) * pc2 / 100); var ps = String(pc2); while (ps.length < 3) ps = "0" + ps; sv0.push("SCANNING  " + ps + "%"); }
    st0.unshift(0); sv0.unshift("SCANNING  000%");
    var pw = wordsIn(WL, B.picture.t0, B.picture.t1), lockT = [pw[0] ? pw[0].s : 1.3, pw[1] ? pw[1].s : 1.6, pw[2] ? pw[2].s : 1.95];
    var STX = [[lockT[0], "TARGET 1/3  ·  PERSON"], [lockT[1], "TARGET 2/3  ·  DOCUMENT"], [lockT[2], "TARGET 3/3  ·  DEVICE"], [tA1, "SCAN COMPLETE  ·  3 PARTS"],
      [B.input.t0, "SOURCE  ·  REAL FRAME"], [B.number.t0, "VALUE  ·  COMPUTING"], [B.number.t0 + .7, "VALUE LOCKED"], [B.line.t0, "VOICE  ·  LIVE"],
      [B.carry.t0, "CONVERTING"], [B.end.t0, "RESCAN"], [B.end.t0 + .9, "SPEC SHEET  ·  READY"]];
    for (var sx = 0; sx < STX.length; sx++) { st0.push(STX[sx][0]); sv0.push(STX[sx][1]); }
    var STL = txt(comp, P + "_STATUS", "SCANNING  000%", { mono: true, size: 24, color: PAL.hud, tracking: 80, x: W - 96, y: 124 }); AESLib.textKeys(STL, st0, sv0);
    STL.anchorPoint.expression = "var r=sourceRectAtTime(time,false);[r.left+r.width,0]";
    // telemetry: a frame counter bottom left; the camera's yaw, pitch and distance bottom right, read off the camera null (baked)
    var tlf = [], tlr = [], tm = [];
    for (var f = 0; f < Math.round(END * fps); f += 2) { var tt = f / fps, cm = camAt(tt), fn = String(f); while (fn.length < 4) fn = "0" + fn; tm.push(tt);
      tlf.push("HOLO." + fn + "  ·  Y " + (1.16 + .02 * Math.sin(tt * 1.7)).toFixed(2) + " M"); tlr.push(cm.yaw.toFixed(1) + "°  ·  " + cm.pitch.toFixed(1) + "°  ·  " + cm.dist.toFixed(2) + " M"); }
    var TF = txt(comp, P + "_TELEL", tlf[0], { mono: true, size: 24, color: PAL.dim, tracking: 100, x: 96, y: H - 84 }); AESLib.textKeys(TF, tm, tlf);
    var TR = txt(comp, P + "_TELER", tlr[0], { mono: true, size: 24, color: PAL.dim, tracking: 100, x: W - 96, y: H - 84 }); AESLib.textKeys(TR, tm, tlr);
    TR.anchorPoint.expression = "var r=sourceRectAtTime(time,false);[r.left+r.width,0]";

    // 1. title: the hero rolls in like a value out of garbage glyphs, a rule draws, a code line types; it scrambles away on the cut to the picture
    var hz = { style: "Light", size: 140, tracking: 120 }, hero = B.title.hero.toUpperCase(), hw = hero.split(" "), h1 = hw.slice(0, Math.ceil(hw.length / 2)).join(" "), h2 = hw.slice(Math.ceil(hw.length / 2)).join(" ");
    var hs = tw[1] ? tw[1].s + .06 : .3, tOutT = B.title.t1 + .02, n1 = nonSpace(h1), n2 = nonSpace(h2);
    var heroL = roll(comp, P + "_H1_", h1, { style: "Light", size: 140, tracking: 120, x: 96, y: 410, t0: hs, stagger: .015, locks: spread(hs + .1, hs + .34, n1), tOut: tOutT, fps: fps })
      .concat(roll(comp, P + "_H2_", h2, { style: "Light", size: 140, tracking: 120, x: 96, y: 560, t0: hs + .1, stagger: .015, locks: spread(hs + .22, hs + .52, n2), tOut: tOutT + .05, fps: fps }));
    var rule = draw(comp, P + "_RULE", [{ path: [[0, 0], [560, 0]], stroke: PAL.line, sw: 2, sop: 80 }], [100, 612]); go(rule.scale, .78, 1.05, [0, 100], [100, 100], "settle");
    rule.inPoint = .78; rule.outPoint = tOutT + .1; go(rule.scale, tOutT, tOutT + .1, [100, 100], [0, 100], "exit");
    var cl = "SS-01  ·  SHARED SCENE", clo = typeOut(cl, .86, 1.12), CLs = txt(comp, P + "_CODE", cl, { mono: true, size: 28, color: PAL.hud, tracking: 160, x: 100, y: 672 });
    AESLib.textKeys(CLs, clo.times.concat([tOutT + .02]), clo.strs.concat([" "])); CLs.inPoint = .86; CLs.outPoint = tOutT + .06;

    // 2. picture: a target locks onto each object on its word; on "one picture" they slide together and one box takes all three
    var tOne = tA0, boxes = [];
    for (var j = 0; j < 3; j++) { var bb = bounds(OBJ[j].m, camAt(lockT[j] + .2), OBJ[j].x, 0), bw = bb[2] - bb[0] + 36, bh = bb[3] - bb[1] + 36;
      var tg = target(comp, P + "_TGT" + j, (bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2, bw, bh, "0" + (j + 1), OBJ[j].k, lockT[j], fps);
      for (var tq = 0; tq < tg.length; tq++) { tg[tq].outPoint = tOne + .08; } boxes = boxes.concat(tg); }
    var ball = [1e9, 1e9, -1e9, -1e9], cAll = camAt(tA1 + .1);
    for (var j2 = 0; j2 < 3; j2++) { var b2 = bounds(OBJ[j2].m, cAll, OBJ[j2].xa, 0); ball[0] = Math.min(ball[0], b2[0]); ball[1] = Math.min(ball[1], b2[1]); ball[2] = Math.max(ball[2], b2[2]); ball[3] = Math.max(ball[3], b2[3]); }
    var big = target(comp, P + "_TGTALL", (ball[0] + ball[2]) / 2, (ball[1] + ball[3]) / 2, ball[2] - ball[0] + 60, ball[3] - ball[1] + 50, "ALL", "ONE PICTURE", tA0 + .1, fps);
    setOut(big, B.input.t0 + .02);
    subtitle(comp, P + "_SUB1", "Three pieces build one picture.", B.picture.t0 - .02, B.input.t0 - .06, pw, fps);

    // 3. input: the real frame scans in as a hologram panel above the pad, a beam rising under it
    var PW = 820, PH = Math.round(PW * 640 / 912), PX = CX, PY = 1168 - PH / 2, crop = [84, 1222, 912, 640], sk = PW / crop[2];
    var src = AESLib.importFile(scene.clip), FT = comp.layers.add(src); FT.name = P + "_FRAME"; FT.audioEnabled = false;
    FT.anchorPoint.setValue([crop[0] + crop[2] / 2, crop[1] + crop[3] / 2]); FT.position.setValue([PX, PY]); FT.scale.setValue([sk * 100, sk * 100]);
    var fm = FT.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"), fs0 = new Shape(); fs0.vertices = [[crop[0], crop[1]], [crop[0] + crop[2], crop[1]], [crop[0] + crop[2], crop[1] + crop[3]], [crop[0], crop[1] + crop[3]]]; fs0.closed = true;
    fm.property("ADBE Mask Shape").setValue(fs0); FT.startTime = B.input.t0 - (B.input.clipStart || 0);
    var pan = holoPanel(comp, P + "_PAN", FT, PX, PY, PW, PH), pbox = [PX - PW / 2 - 12, PY - PH / 2 - 12, PX + PW / 2 + 12, PY + PH / 2 + 12];
    var iIn = B.input.t0 + .18, iOut = B.line.t0;
    var sm1 = scanMatte(comp, P + "_PANSCAN", pbox, [{ mode: "in", t0: iIn, t1: iIn + .36 }, { mode: "out", t0: iOut, t1: iOut + .26 }], fps);
    var plab = txt(comp, P + "_PANLAB", "SRC  //  CLIP.MP4", { mono: true, size: 24, color: PAL.hud, tracking: 140, x: PX - PW / 2, y: PY - PH / 2 - 30 });
    var pfr = txt(comp, P + "_PANFR", "FR 0135", { mono: true, size: 24, color: PAL.hud, tracking: 140, x: PX + PW / 2, y: PY - PH / 2 - 30, align: "right" });
    var frs = [], frt = []; for (var fq = 0; fq < Math.round((iOut - iIn) * fps); fq += 1) { frt.push(iIn + fq / fps); var fv = String(120 + fq); while (fv.length < 4) fv = "0" + fv; frs.push("FR " + fv); }
    AESLib.textKeys(pfr, frt, frs);
    var panAll = pan.concat([plab, pfr]); matte(panAll, sm1.M); setIn(panAll, iIn); setOut(panAll, iOut + .28); sm1.M.inPoint = iIn - .05; sm1.M.outPoint = iOut + .3;
    // the beam: a soft additive cone from the pad up to whatever stands on it
    var beam = comp.layers.addSolid(PAL.line, P + "_BEAM", W, H, 1), bmr = fx(beam, "ADBE Ramp");
    bmr.property("Start of Ramp").setValue([CX, 1180]); bmr.property("Start Color").setValue(c4(PAL.line)); bmr.property("End of Ramp").setValue([CX, 560]); bmr.property("End Color").setValue(c4(PAL.black));
    var bm = beam.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"), bs = new Shape(); bs.vertices = [[CX - 330, 1185], [CX + 330, 1185], [CX + 450, 560], [CX - 450, 560]]; bs.closed = true;
    bm.property("ADBE Mask Shape").setValue(bs); bm.property("ADBE Mask Feather").setValue([90, 90]); beam.blendingMode = BlendingMode.ADD;
    var tFold = B.end.t0 - .1;
    keys(beam.opacity, [0, iIn, iIn + .3, iOut, iOut + .2, B.carry.t0 + .14, B.carry.t0 + .4, tFold, tFold + .12, tFold + .5], [0, 0, 16, 16, 0, 0, 16, 16, 34, 20], "settle");
    subtitle(comp, P + "_SUB2", "Here's a real frame from my video.", B.input.t0 - .02, B.number.t0 - .06, wordsIn(WL, B.input.t0, B.input.t1), fps);

    // 4. number: a box locks onto the panel, the panel rises and shrinks, a leader pulls out, 338 rolls out of digits and locks right to left
    var NP = grp(comp, P + "_PANG", PX, PY, panAll.concat([sm1.M, sm1.hot])), nt = B.number.t0, nT = .66, NY = 610;
    var ptg = target(comp, P + "_TGTPAN", PX, PY, PW + 60, PH + 60, "SRC", "REAL FRAME", nt + .02, fps); for (var pt = 0; pt < ptg.length; pt++) ptg[pt].parent = NP;
    keys(NP.position, [nt + .1, nt + .42], [[PX, PY], [PX, NY]], "travel"); keys(NP.scale, [nt + .1, nt + .42], [[100, 100], [nT * 100, nT * 100]], "travel");
    setOut(ptg, iOut);
    var ringX = PX - .18 * PW * nT, ringY = NY + PH * nT / 2 - 10, cardT = 1150, cardB = 1430, cardX0 = 90, cardX1 = W - 90;
    var LD = draw(comp, P + "_LEADER", [{ ell: true, x: ringX - 12, y: ringY - 12, w: 24, h: 24, stroke: PAL.line, sw: 2.4 }, { path: [[ringX, ringY + 12], [ringX - 110, cardT - 36], [cardX0 + 40, cardT - 36]], stroke: PAL.line, sw: 2 }], [0, 0]);
    var trim = LD.property("ADBE Root Vectors Group").addProperty("ADBE Vector Filter - Trim"); go(trim.property("ADBE Vector Trim End"), nt + .36, nt + .66, 0, 100, "settle"); LD.inPoint = nt + .36;
    var CARD = draw(comp, P + "_CARD", plateItems(cardX1 - cardX0, cardB - cardT), [CX, (cardT + cardB) / 2]); go(CARD.scale, nt + .44, nt + .58, [100, 0], [100, 100], "settle"); CARD.inPoint = nt + .44;
    var cl1 = txt(comp, P + "_CARDLAB", "01   FRAMES", { style: "SemiBold", size: 34, color: PAL.hud, tracking: 220, x: cardX0 + 40, y: cardT + 62 });
    AESLib.bakeText(cl1, decodeStrings("01   FRAMES", 5), fps, nt + .5); cl1.inPoint = nt + .5;
    var nw = wordsIn(WL, B.number.t0, B.number.t1), val = String(B.number.value);
    var digs = roll(comp, P + "_DIG", val, { style: "Light", size: 200, tracking: 40, x: cardX0 + 36, y: cardB - 50, t0: nt + .5, locks: spread(nt + .62, nt + .82, val.length, true), set: DIGITS, color: PAL.accent, fps: fps });
    var dr = measure(comp, val, { style: "Light", size: 200, tracking: 40 }), unit = txt(comp, P + "_UNIT", "FR", { style: "Medium", size: 56, color: PAL.hud, tracking: 80, x: cardX0 + 36 + dr.width + 24, y: cardB - 52 });
    unit.inPoint = nt + 1.0;
    var det = "SOURCE CLIP  ·  COUNTED", tC = nw[1] ? nw[1].s + .3 : nt + .98, deto = typeOut(det, tC, tC + .3);
    var DT = txt(comp, P + "_DETAIL", det, { mono: true, size: 24, color: PAL.text, tracking: 120, x: cardX1 - 40, y: cardT + 60, align: "right" }); AESLib.textKeys(DT, deto.times, deto.strs); DT.inPoint = tC;
    var cardAll = [LD, CARD, cl1, unit, DT].concat(digs), dock = B.line.t0 - .3;
    for (var ca = 0; ca < cardAll.length; ca++) { go(cardAll[ca].opacity, dock, dock + .3, 100, 0, "exit"); cardAll[ca].outPoint = dock + .32; }
    subtitle(comp, P + "_SUB3", "338 frames, counted.", B.number.t0 - .02, B.line.t0 - .06, nw, fps);
    // the value docks: a chip slides into the left rail and stays to the end
    var chX = 88, chY = 1490, chW = 320, chH = 96;
    var CHP = draw(comp, P + "_CHIP", plateItems(chW, chH), [chX + chW / 2, chY]), cht = txt(comp, P + "_CHIPLAB", "01  FRAMES", { mono: true, size: 20, color: PAL.hud, tracking: 120, x: chX + 22, y: chY - 14 });
    var chv = txt(comp, P + "_CHIPV", val, { style: "Light", size: 64, color: PAL.accent, tracking: 40, x: chX + 22, y: chY + 36 }), chu = txt(comp, P + "_CHIPU", "FR", { style: "Medium", size: 26, color: PAL.hud, tracking: 60, x: chX + 22 + measure(comp, val, { style: "Light", size: 64, tracking: 40 }).width + 14, y: chY + 34 });
    var chipAll = [CHP, cht, chv, chu], CHN = grp(comp, P + "_CHIPN", chX, chY, chipAll);
    go(CHN.position, dock + .05, dock + .4, [chX + 52, chY], [chX, chY], "settle"); for (var ch = 0; ch < chipAll.length; ch++) { go(chipAll[ch].opacity, dock + .05, dock + .3, 0, 100, "settle"); chipAll[ch].inPoint = dock + .05; }

    // 5. line: a live transcript plate scans in; voiceprint bars move with the voice; the line types word by word behind a block cursor
    var LX0 = 90, LX1 = W - 90, LY0 = 680, LY1 = 1160, LCX = CX, LCY = (LY0 + LY1) / 2, lt0 = B.line.t0, lt1 = B.carry.t0;
    var LPL = draw(comp, P + "_TPLATE", plateItems(LX1 - LX0, LY1 - LY0), [LCX, LCY]);
    var LH = txt(comp, P + "_THEAD", "VOICE  //  LIVE TRANSCRIPT", { mono: true, size: 24, color: PAL.hud, tracking: 140, x: LX0 + 40, y: LY0 + 56 });
    var LR = draw(comp, P + "_TREC", [{ ell: true, x: -8, y: -8, w: 16, h: 16, fill: PAL.line }], [LX1 - 52, LY0 + 48]); glow(LR, 14, 1, 20);
    LR.opacity.expression = "Math.floor(time*3)%2?35:100";
    var LWd = wordsIn(WL, lt0, lt1), vb = [];
    for (var b = 0; b < 36; b++) { var bx = LX0 + 52 + b * 24, VB = draw(comp, P + "_TVB" + b, [{ x: -4, y: -36, w: 8, h: 72, fill: PAL.line }], [bx, LY0 + 130]), vts = [], vvs = [];
      for (var t = lt0; t < lt1; t += 2 / fps) { var onw = false; for (var w = 0; w < LWd.length; w++) if (t >= LWd[w].s && t <= LWd[w].e) onw = true;
        var am = 6 + 8 * rnd(); if (onw) am = 20 + 80 * rnd() * (0.5 + .5 * Math.sin(b * .45 + t * 9)); vts.push(t); vvs.push([100, am]); }
      keys(VB.scale, vts, vvs, "linear"); VB.opacity.setValue(70); vb.push(VB); }
    var es = 92, ex = LX0 + 44, ey = LY0 + 290, lead = 106, maxW = LX1 - LX0 - 120, EO = { style: "Medium", size: es }, lines = [[]], cw = 0, spw = .25 * es;
    for (var wi = 0; wi < LWd.length; wi++) { var ww = measure(comp, LWd[wi].text, EO).width; if (cw > 0 && cw + ww > maxW) { lines.push([]); cw = 0; } lines[lines.length - 1].push(LWd[wi]); cw += ww + spw; }
    var tType0 = lt0 + .22, edL = [], ctT = [], ctP = [];
    for (var li = 0; li < lines.length; li++) { var ln = lines[li], fullLn = "", times = [], strs = [], by = ey + li * lead;
      for (var a1 = 0; a1 < ln.length; a1++) fullLn += (a1 ? " " : "") + ln[a1].text;
      for (var a2 = 0; a2 < ln.length; a2++) { var ws = Math.max(tType0, ln[a2].s), we = Math.max(ws + .1, ln[a2].e - .04), base = "";
        for (var a3 = 0; a3 < a2; a3++) base += (a3 ? " " : "") + ln[a3].text; if (a2) base += " ";
        var tp = typeOut(ln[a2].text, ws, we, base); times = times.concat(tp.times); strs = strs.concat(tp.strs); }
      var TLn = txt(comp, P + "_TLINE" + li, fullLn, { style: "Medium", size: es, color: PAL.text, x: ex, y: by }); AESLib.textKeys(TLn, [0].concat(times), [" "].concat(strs)); TLn.inPoint = times[0]; edL.push(TLn);
      for (var tk = 0; tk < times.length; tk++) { ctT.push(times[tk]); ctP.push([ex + measure(comp, strs[tk], EO).width + 16, by]); } }
    var CUR = draw(comp, P + "_TCUR", [{ x: 0, y: -70, w: 16, h: 80, fill: PAL.line }], [ex, ey]); glow(CUR, 16, 1, 25); CUR.blendingMode = BlendingMode.ADD;
    ctT.unshift(lt0); ctP.unshift([ex, ey]); keys(CUR.position, ctT, ctP, "hold");
    CUR.opacity.expression = "var n=Math.abs(position.nearestKey(time).time-time);(n>.3&&Math.floor(time*2.4)%2)?0:100";
    var tAll = [LPL, LH, LR, CUR].concat(vb).concat(edL), tIn = lt0 + .02, tOut = lt1;
    var sm2 = scanMatte(comp, P + "_TSCAN", [LX0 - 10, LY0 - 10, LX1 + 10, LY1 + 10], [{ mode: "in", t0: tIn, t1: tIn + .2 }, { mode: "out", t0: tOut, t1: tOut + .2 }], fps);
    matte(tAll, sm2.M); setIn(tAll, tIn); setOut(tAll, tOut + .22); sm2.M.inPoint = tIn - .05; sm2.M.outPoint = tOut + .24;

    // 6. carry: the frame returns as a hologram (a rhyme), a scan front turns it into its own line art, then it folds down into the pad
    var c0 = B.carry.t0, cIn = c0 + .14, cConv0 = c0 + .52, cConv1 = c0 + .98, still = null, lineL = null;
    if (A.frame) { still = comp.layers.add(AESLib.importFile(A.frame)); } else { still = comp.layers.add(src); still.startTime = c0 - (B.input.clipStart || 0); notes.push("no prepared frame: used the clip"); }
    still.name = P + "_STILL"; still.audioEnabled = false; still.position.setValue([PX, PY]); still.scale.setValue([sk * 100, sk * 100]);
    var pan2 = holoPanel(comp, P + "_PAN2", still, PX, PY, PW, PH);
    var allC = pan2.slice(0);
    if (A.lines) { lineL = comp.layers.add(AESLib.importFile(A.lines)); lineL.name = P + "_LINEART"; lineL.position.setValue([PX, PY]); lineL.scale.setValue([sk * 100, sk * 100]);
      var lt = fx(lineL, "ADBE Tint"); lt.property("Map Black To").setValue(c4(PAL.black)); lt.property("Map White To").setValue(c4(PAL.line)); lineL.blendingMode = BlendingMode.ADD; glow(lineL, 12, 1.2, 25);
      allC.push(lineL); } else notes.push("no prepared line art: the carry keeps the picture");
    // one matte per layer: the picture scans in and is then erased top-down by the conversion front (its hot line is that front);
    // the plate and scanlines only scan in; the line art is revealed top-down by the same front
    var smS = scanMatte(comp, P + "_CSCAN", pbox, [{ mode: "in", t0: cIn, t1: cIn + .3 }, { mode: "out", t0: cConv0, t1: cConv1 }], fps); still.setTrackMatte(smS.M, TrackMatteType.ALPHA);
    var smP = scanMatte(comp, P + "_CPLATE", pbox, [{ mode: "in", t0: cIn, t1: cIn + .3 }], fps, true); matte(pan2.slice(1), smP.M);
    var cMats = [smS.M, smS.hot, smP.M];
    if (lineL) { var smL = scanMatte(comp, P + "_CLINES", pbox, [{ mode: "in", t0: cConv0, t1: cConv1 }], fps, true); lineL.setTrackMatte(smL.M, TrackMatteType.ALPHA); cMats.push(smL.M); }
    var NC = grp(comp, P + "_PAN2G", PX, PY + PH / 2, allC.concat(cMats));
    keys(NC.scale, [tFold - .32, tFold], [[100, 100], [60, 0]], "exit");
    setIn(allC, cIn); setOut(allC, tFold + .02); if (lineL) lineL.inPoint = cConv0;
    keys(padHot, [0, tFold, tFold + 3 / fps], [PAL.line, PAL.hot, PAL.line], "hold");
    subtitle(comp, P + "_SUB4", "Then one thing becomes the next.", B.carry.t0 - .02, B.end.t0 - .06, wordsIn(WL, B.carry.t0, B.carry.t1), fps);

    // 7. end: the pad scans the assembled picture back up (the objects' scan matte rises again) under the lockup, which rolls in like the title
    var ewd = wordsIn(WL, B.end.t0, B.end.t1), eh = B.end.text.toUpperCase().split(" "), e1 = eh.slice(0, eh.length - 1).join(" "), e2 = eh[eh.length - 1], es0 = ewd[0] ? ewd[0].s : B.end.t0;
    roll(comp, P + "_E1_", e1, { style: "Light", size: 140, tracking: 120, x: 96, y: 410, t0: es0, stagger: .015, locks: spread(es0 + .12, es0 + .42, nonSpace(e1)), fps: fps });
    roll(comp, P + "_E2_", e2, { style: "Light", size: 140, tracking: 120, x: 96, y: 560, t0: es0 + .1, stagger: .015, locks: spread(es0 + .36, (ewd[2] ? ewd[2].e : es0 + .84), nonSpace(e2)), fps: fps });
    var rule2 = draw(comp, P + "_RULE2", [{ path: [[0, 0], [560, 0]], stroke: PAL.line, sw: 2, sop: 80 }], [100, 612]); go(rule2.scale, es0 + .5, es0 + .78, [0, 100], [100, 100], "settle"); rule2.inPoint = es0 + .5;
    var ec = "SS-07  ·  SHARED SCENE  ·  ", eco = typeOut(ec, es0 + .7, es0 + 1.0), EC = txt(comp, P + "_ECODE", ec, { mono: true, size: 28, color: PAL.hud, tracking: 160, x: 100, y: 672 });
    AESLib.textKeys(EC, eco.times, eco.strs); EC.inPoint = es0 + .7;
    var ecw = measure(comp, ec, { mono: true, size: 28, tracking: 160 }), passT = es0 + 1.02;
    roll(comp, P + "_PASS", "PASS", { style: "SemiBold", size: 40, tracking: 200, x: 100 + ecw.width + 8, y: 674, t0: passT, locks: spread(passT + .16, passT + .4, 4, true), color: PAL.accent, fps: fps });

    // stacking, top to bottom: everything built, then the scan matte under its objects, the vignette, dots, stage
    var mats = [mk]; for (var mm = 0; mm < mats.length; mm++) mats[mm].moveToEnd();
    for (var ol = objL.length - 1; ol >= 0; ol--) objL[ol].moveToEnd(); scanR.moveToEnd(); floor.moveToEnd(); ticks.moveToEnd(); dash.moveToEnd(); padL.moveToEnd(); beam.moveToEnd();
    vig.moveToEnd(); dots.moveToEnd(); stg.moveToEnd(); CAM.moveToBeginning();
    return { layers: comp.numLayers, notes: notes };
  }
  return { SANS: SANS, MONO: MONO, PALETTE: PALETTE, fontOK: fontOK, keys: keys, go: go, person: person, documentModel: documentModel, device: device, pad: pad,
    padTicks: padTicks, proj: proj, bounds: bounds, camHead: camHead, pathExpr: pathExpr, wire: wire, glow: glow, blur: blur, draw: draw, plateItems: plateItems,
    bracketItems: bracketItems, txt: txt, measure: measure, roll: roll, typeOut: typeOut, decodeStrings: decodeStrings, target: target, subtitle: subtitle,
    scanMatte: scanMatte, holoPanel: holoPanel, grp: grp, wordsIn: wordsIn, buildScene: buildScene };
})();
