// Paper-cut lightbox style: brand-neutral ES3 helpers. No project mutation happens at load.
// Read styles/paper-lantern/STYLE.md first. Every shot is one shallow box of flat cut card: back sheets bright and translucent, the front
// almost black. A sheet is one shape layer with, in order: Ramp (the backlight glowing through the paper, radial from the shot's light),
// Tint (the lamp switched off: 100 = dim, 0 = lit), Bevel Alpha (the warm rim on the top edge, the dark band below), Drop Shadow (the top
// spot's soft shadow on the sheet behind) and, near the lens, Gaussian Blur (depth of field). Light sources and windows are emissive shapes
// with Glow. The camera is a 2.5D rig: each shot comp has a CAM null, and every sheet's position and scale follow it by its depth factor.
// Adapted from Lemo-Opuscar's paper-lantern style (MIT, LemoLab); see library/styles/LICENSE-lemo-opuscar.txt.
var AESLantern = (function () {
  var FACE = "Cormorant Garamond";
  function hex(h) { return [parseInt(h.substr(0, 2), 16) / 255, parseInt(h.substr(2, 2), 16) / 255, parseInt(h.substr(4, 2), 16) / 255]; }
  function c4(c) { return [c[0], c[1], c[2], 1]; }
  function mul(c, k) { return [Math.min(1, c[0] * k), Math.min(1, c[1] * k), Math.min(1, c[2] * k)]; }
  // ladders: one temperature per stack, back light and translucent, front dark and opaque. Changing ladder says "another place".
  var LADDERS = {
    night: { sky: hex("0A1330"), skyLit: hex("2C4A90"), far: hex("6A86C2"), farLit: hex("B8C8EC"), mid: hex("3F5A92"), midLit: hex("6E88BE"),
      house: hex("2B3C6E"), houseLit: hex("475C94"), roof: hex("131B38"), near: hex("111A3B"), front: hex("060A1C"), cloud: hex("CFC8B8"), cloudLine: hex("8C8778"), star: hex("DFE6FF") },
    interior: { wall: hex("E9BC80"), wallLit: hex("FFEFC8"), drape: hex("B86E48"), drapeLit: hex("DE9A68"), desk: hex("5E2A1A"), floor: hex("3A180E"), front: hex("170A05"),
      figure: hex("1C0C06"), paper: hex("EEDDBA"), paperLit: hex("FFF4DC") },
    violet: { sky: hex("1A1030"), skyLit: hex("3E2D6E"), far: hex("7A6AA8"), farLit: hex("A898D0"), mid: hex("4A3A78"), midLit: hex("6E5E9E"), hole: hex("1E1534"), front: hex("0E081C") },
    dusk: { sky: hex("E8B884"), skyLit: hex("FFE4B4"), far: hex("BC7450"), farLit: hex("DE9A6C"), mid: hex("6A3020"), midLit: hex("8C4A30"), near: hex("3A180E"), front: hex("170A05") },
    frames: [hex("3F5A92"), hex("24345E"), hex("0E1532")]
  };
  var LIGHT = hex("FFB862"), MOON = hex("FFF1C8"), SEAL = hex("C0262A"), GOLD = hex("E2B970"), STRIP = hex("EFE3C8"), INK = hex("16224A"), CAP = hex("F3E6CF"),
    LANTERN = hex("FF9A3C"), SCREEN = hex("FFE2AE"), SHADE = hex("05060F"), RIM = hex("FFE0B0");
  function fontOK() { AESLib.font(FACE, "SemiBold"); AESLib.font(FACE, "Medium"); AESLib.font(FACE, "SemiBold Italic"); return true; }

  // ---- keys: list = [{ t, v, i, o }]; i / o are an influence (eased, zero speed), "L" linear or "H" hold. One setValuesAtTimes call.
  function easeArr(prop, inf) { var sp = prop.propertyValueType === PropertyValueType.TwoD_SPATIAL || prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL;
    var d = 1; if (!sp && prop.propertyValueType !== PropertyValueType.COLOR && prop.propertyValueType !== PropertyValueType.SHAPE && prop.value instanceof Array) d = prop.value.length;
    var a = []; for (var n = 0; n < d; n++) a.push(new KeyframeEase(0, inf)); return a; }
  function kt(x) { if (x === "H") return KeyframeInterpolationType.HOLD; if (typeof x === "number") return KeyframeInterpolationType.BEZIER; return KeyframeInterpolationType.LINEAR; }
  function keys(prop, list) { var ts = [], vs = [], B = KeyframeInterpolationType.BEZIER;
    for (var j = 0; j < list.length; j++) { ts.push(list[j].t); vs.push(list[j].v); } prop.setValuesAtTimes(ts, vs);
    for (var k = 0; k < list.length; k++) { var ki = prop.nearestKeyIndex(list[k].t), a = list[k].i, b = list[k].o;
      if (typeof a === "number" || typeof b === "number") { prop.setInterpolationTypeAtKey(ki, B, B);
        prop.setTemporalEaseAtKey(ki, easeArr(prop, typeof a === "number" ? a : 33.3), easeArr(prop, typeof b === "number" ? b : 33.3)); }
      prop.setInterpolationTypeAtKey(ki, kt(a), kt(b)); }
    return prop; }
  function fx(L, match) { L.property("ADBE Effect Parade").addProperty(match); var EP = L.property("ADBE Effect Parade"); return EP.property(EP.numProperties); }
  function setPct(p, pct) { if (p.hasMax && p.maxValue > 100) p.setValue(pct * 2.55); else p.setValue(pct); }
  function span(L, t0, t1) { if (t0 !== undefined) L.inPoint = t0; if (t1 !== undefined) L.outPoint = t1; return L; }   // in before out
  function solid(comp, name, color, w, h, pos) { var L = comp.layers.addSolid(color, name, w || comp.width, h || comp.height, 1); if (pos) L.position.setValue(pos); return L; }

  // ---- shapes: { k: "poly"|"line"|"rect"|"ellipse"|"circle"|"group"|"holes", ..., fill (rgb or null), sw (stroke width), sc (stroke rgb) }
  // "holes" = an outer contour and cut-outs, filled even-odd (a sheet with windows punched through it).
  var KAPPA = .5523;
  function poly(pts, closed) { var s = new Shape(); s.vertices = pts; s.closed = closed !== false; return s; }
  function ell(cx, cy, rx, ry) { var a = KAPPA * rx, b = KAPPA * ry, s = new Shape(); s.vertices = [[cx, cy - ry], [cx + rx, cy], [cx, cy + ry], [cx - rx, cy]];
    s.inTangents = [[-a, 0], [0, -b], [a, 0], [0, b]]; s.outTangents = [[a, 0], [0, b], [-a, 0], [0, -b]]; s.closed = true; return s; }
  function rectPts(x, y, w, h) { return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; }
  function archPts(x, y, w, h, n) { var r = w / 2, pts = [[x, y + h]]; for (var q = 0; q <= (n || 18); q++) { var a = Math.PI * q / (n || 18); pts.push([x + r - Math.cos(a) * r, y + r - Math.sin(a) * r]); }
    pts.push([x + w, y + h]); return pts; }
  function shapeOf(n) { if (n.k === "circle") return ell(n.x, n.y, n.r, n.r);
    if (n.k === "ellipse") return ell(n.x, n.y, n.rx, n.ry);
    if (n.k === "rect") return poly(rectPts(n.x, n.y, n.w, n.h));
    if (n.k === "line") return poly(n.pts, false);
    return poly(n.pts); }
  function emit(contents, nodes) {
    for (var i = nodes.length - 1; i >= 0; i--) { var n = nodes[i], gr = contents.addProperty("ADBE Vector Group"); if (n.id) gr.name = n.id;
      var tg = gr.property("ADBE Vector Transform Group");
      if (n.pivot) { tg.property("ADBE Vector Anchor").setValue(n.pivot); tg.property("ADBE Vector Position").setValue(n.pivot); }
      if (n.rot) tg.property("ADBE Vector Rotation").setValue(n.rot);
      var v = gr.property("ADBE Vectors Group");
      if (n.k === "group") { emit(v, n.kids); continue; }
      if (n.k === "holes") { v.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(poly(n.outer));
        for (var h = 0; h < n.cuts.length; h++) v.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(poly(n.cuts[h]));
        var hf = v.addProperty("ADBE Vector Graphic - Fill"); hf.property("ADBE Vector Fill Color").setValue(n.fill); hf.property("ADBE Vector Fill Rule").setValue(2); continue; }
      v.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(shapeOf(n));
      if (n.sw) { var st = v.addProperty("ADBE Vector Graphic - Stroke"); st.property("ADBE Vector Stroke Color").setValue(n.sc);
        st.property("ADBE Vector Stroke Width").setValue(n.sw); st.property("ADBE Vector Stroke Line Join").setValue(2); st.property("ADBE Vector Stroke Line Cap").setValue(2); }
      if (n.fill && n.k !== "line") v.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(n.fill); } }
  function piece(comp, name, nodes, pos) { var L = comp.layers.addShape(); L.name = name; emit(L.property("ADBE Root Vectors Group"), nodes);
    L.anchorPoint.setValue([0, 0]); L.position.setValue(pos || [0, 0]); return L; }
  function groupT(L, path) { var gr = L.property("ADBE Root Vectors Group");
    for (var i = 0; i < path.length; i++) { gr = gr.property(path[i]); if (i < path.length - 1) gr = gr.property("ADBE Vectors Group"); }
    return gr.property("ADBE Vector Transform Group"); }
  function rnd(seed) { var s = seed; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

  // ---- the box: a shot comp with its CAM null; every sheet follows the CAM by its depth (0 = the back of the box, 1 = the front)
  function shot(P, name, W, H, D, fps) { var C = app.project.items.addComp(P + "_SHOT_" + name, W, H, 1, D, fps); C.bgColor = [0, 0, 0];
    var N = C.layers.addNull(); N.name = P + "_CAM"; N.position.setValue([W / 2, H / 2]); N.enabled = false;
    N.position.expression = "[value[0] + Math.sin(time * 1.3) * 1.6 + Math.sin(time * 3.1) * .7, value[1] + Math.sin(time * 1.7 + 1) * 1.2];";   // hand-held micro-drift
    return { comp: C, cam: N, P: P }; }
  function rig(S, L, p) { var pre = "var c = thisComp.layer(\"" + S.P + "_CAM\"), p = " + p + ", k = 1 + (c.transform.scale[0] / 100 - 1) * p; ";
    L.position.expression = pre + "var C = [thisComp.width / 2, thisComp.height / 2], q = c.transform.position; [C[0] + (value[0] - C[0]) * k + (q[0] - C[0]) * p, C[1] + (value[1] - C[1]) * k + (q[1] - C[1]) * p];";
    L.scale.expression = pre + "value * k;"; return L; }
  // the lamp: Tint maps the sheet to a dim, unlit card (amount 100) and back to its lit colours (0); on/off are lists of switch times
  function lamp(L, base, on, off) { var t = fx(L, "ADBE Tint"); t.property("Map Black To").setValue(c4([0, 0, 0])); t.property("Map White To").setValue(c4(mul(base, .55)));
    var ks = []; if (on !== undefined && on !== null) { ks.push({ t: on, v: 100, o: 30 }); ks.push({ t: on + .2, v: 0, i: 60 }); } else ks.push({ t: 0, v: 0, o: "H" });
    if (off !== undefined && off !== null) { ks.push({ t: off, v: 0, o: 30 }); ks.push({ t: off + .16, v: 100, i: 60 }); }
    if (ks.length > 1) keys(t.property("Amount to Tint"), ks); else t.property("Amount to Tint").setValue(0); return t; }
  function rimShade(L, thick, inten) { var b = fx(L, "ADBE Bevel Alpha"); b.property("Edge Thickness").setValue(thick || 2.4); b.property("Light Angle").setValue(-90);
    b.property("Light Color").setValue(c4(RIM)); b.property("Light Intensity").setValue(inten || .55); return b; }
  function shadow(L, dist, op) { var d = fx(L, "ADBE Drop Shadow"); d.property("Shadow Color").setValue(c4(SHADE)); setPct(d.property("Opacity"), op || 62);
    d = L.property("ADBE Effect Parade").property(L.property("ADBE Effect Parade").numProperties);
    d.property("Direction").setValue(180); d.property("Distance").setValue(dist); d.property("Softness").setValue(dist * 2.6 + 6); return d; }
  function blur(L, amt) { var b = fx(L, "ADBE Gaussian Blur 2"); b.property("Blurriness").setValue(amt); try { b.property("Repeat Edge Pixels").setValue(0); } catch (e) {} return b; }
  // one paper sheet: o = { depth, lit: { at, r, c0, c1 }, base, on, off, shadow, rim, blur, t0, t1 }
  function sheet(S, name, nodes, o) { var L = piece(S.comp, S.P + "_" + name, nodes, o.pos);
    if (o.lit) { var R = fx(L, "ADBE Ramp"); R.property("Start of Ramp").setValue(o.lit.at); R.property("Start Color").setValue(c4(o.lit.c0));
      R.property("End of Ramp").setValue([o.lit.at[0] + o.lit.r, o.lit.at[1]]); R.property("End Color").setValue(c4(o.lit.c1)); R.property("Ramp Shape").setValue(2); }
    if (o.base && (o.on !== undefined || o.off !== undefined)) lamp(L, o.base, o.on, o.off);
    if (o.rim !== false) rimShade(L, o.rimW, o.rimI);
    if (o.shadow) shadow(L, o.shadow, o.shadowOp);
    if (o.blur) blur(L, o.blur);
    rig(S, L, o.depth); span(L, o.t0, o.t1); return L; }
  // light: an emissive shape (a window, a fire, a moon) with Glow and a lamp flicker; o = { depth, color, glow, inten, on, off, onGap }
  function light(S, name, nodes, o) { var L = piece(S.comp, S.P + "_" + name, nodes, o.pos);
    var g = fx(L, "ADBE Glo2"); g.property("Glow Based On").setValue(2); g.property("Glow Threshold").setValue(20); g.property("Glow Radius").setValue(o.glow || 26);
    g.property("Glow Intensity").setValue(o.inten || 1.1);
    g = L.property("ADBE Effect Parade").property(1); g.property("Glow Intensity").expression = "value * (1 + .06 * Math.sin(7.3 * time) * Math.sin(3.1 * time));";
    var top = o.op || 100; L.opacity.setValue(top);
    if (o.on !== undefined || o.off !== undefined) { var ks = [];
      if (o.on !== undefined && o.on !== null) { ks.push({ t: o.on, v: 0, o: "L" }); ks.push({ t: o.on + (o.fade || .08), v: top, i: "L" }); } else ks.push({ t: 0, v: top, o: "H" });
      if (o.off !== undefined && o.off !== null) { ks.push({ t: o.off, v: top, o: "L" }); ks.push({ t: o.off + .1, v: 0, i: "L" }); }
      if (ks.length > 1) keys(L.opacity, ks); }
    rig(S, L, o.depth); span(L, o.t0, o.t1); return L; }
  // a moon (or any round source): disk + two glows + a radial halo in Add (a full ramp that reaches black before its solid's edge, so no square shows)
  function moon(S, name, at, r, o) { var C = S.comp, hs = r * 9;
    var HA = solid(C, S.P + "_" + name + "_HALO", [0, 0, 0], hs, hs, at), hr = fx(HA, "ADBE Ramp");
    hr.property("Start of Ramp").setValue([hs / 2, hs / 2]); hr.property("Start Color").setValue(c4(mul(o.halo || [.55, .48, .36], 1))); hr.property("End of Ramp").setValue([hs / 2 + r * 4.2, hs / 2]);
    hr.property("End Color").setValue(c4([0, 0, 0])); hr.property("Ramp Shape").setValue(2); HA.blendingMode = BlendingMode.ADD; HA.opacity.setValue(o.haloOp || 70);
    var D = piece(C, S.P + "_" + name, [{ k: "circle", x: at[0], y: at[1], r: r, fill: o.color || MOON }]);
    var g1 = fx(D, "ADBE Glo2"); g1.property("Glow Based On").setValue(2); g1.property("Glow Threshold").setValue(30); g1.property("Glow Radius").setValue(r * .7); g1.property("Glow Intensity").setValue(1.4);
    var g2 = fx(D, "ADBE Glo2"); g2.property("Glow Based On").setValue(2); g2.property("Glow Threshold").setValue(30); g2.property("Glow Radius").setValue(r * .18); g2.property("Glow Intensity").setValue(.8);
    var list = [HA, D]; for (var i = 0; i < 2; i++) { var L = list[i];
      if (o.on !== undefined || o.off !== undefined) { var top = L.opacity.value, ks = [];
        if (o.on !== undefined && o.on !== null) { ks.push({ t: o.on, v: 0, o: 30 }); ks.push({ t: o.on + .14, v: top, i: 60 }); } else ks.push({ t: 0, v: top, o: "H" });
        if (o.off !== undefined && o.off !== null) { ks.push({ t: o.off, v: top, o: 30 }); ks.push({ t: o.off + .2, v: 0, i: 60 }); }
        if (ks.length > 1) keys(L.opacity, ks); }
      rig(S, L, o.depth); span(L, o.t0, o.t1); }
    return D; }

  // ---- motifs (comp coordinates of the shot; sheets run past the frame so parallax never shows an edge)
  function bellY(x, y0, peaks) { var m = 0; for (var i = 0; i < peaks.length; i++) { var p = peaks[i], v = p[1] * Math.exp(-Math.pow(Math.abs(x - p[0]) / p[2], 1.6)); if (v > m) m = v; } return y0 - m; }
  function range(y0, peaks, x0, x1, fill) { var pts = []; for (var x = x0; x <= x1; x += 16) pts.push([x, bellY(x, y0, peaks)]);
    pts.push([x1, 2300]); pts.push([x0, 2300]); return [{ k: "poly", pts: pts, fill: fill }]; }
  // cut contour lines nested inside each peak (the folds of the card), drawn as a lighter stroke on its own layer at the same depth
  function contours(y0, peaks, col) { var n = [];
    for (var i = 0; i < peaks.length; i++) for (var j = 1; j <= 2; j++) { var p = peaks[i], hh = p[1] - 52 * j, ww = p[2] * (1 - .2 * j), pts = [];
      if (hh < 60) continue;
      for (var x = p[0] - ww * 1.5; x <= p[0] + ww * 1.5; x += 10) { var y = y0 + 22 * j - hh * Math.exp(-Math.pow(Math.abs(x - p[0]) / ww, 1.6)); if (y < bellY(x, y0, peaks) + 14) continue; if (y < y0 - 24) pts.push([x, y]); }
      if (pts.length > 3) n.push({ k: "line", pts: pts, sw: 3, sc: col }); }
    return n; }
  function house(x, y, w, h, wall, roof) { var g = 64, s = w * .17;
    return [{ k: "rect", x: x - 8, y: y - h - 22, w: w + 16, h: 26, fill: roof }, { k: "rect", x: x, y: y - h, w: w, h: h, fill: wall },
      { k: "rect", x: x - 6, y: y - h - g, w: s, h: g, fill: wall }, { k: "rect", x: x - 12, y: y - h - g - 10, w: s + 12, h: 12, fill: roof },
      { k: "rect", x: x + w - s + 6, y: y - h - g, w: s, h: g, fill: wall }, { k: "rect", x: x + w - s, y: y - h - g - 10, w: s + 12, h: 12, fill: roof },
      { k: "rect", x: x + w * .44, y: y - h * .5, w: w * .12, h: h * .5, fill: roof }]; }
  function houseWindows(x, y, w, h) { return [{ k: "rect", x: x + w * .16, y: y - h * .66, w: w * .14, h: h * .2, fill: LIGHT }, { k: "rect", x: x + w * .68, y: y - h * .66, w: w * .14, h: h * .2, fill: LIGHT }]; }
  function cloud(cx, cy, s, fill, line) { return [{ k: "rect", x: cx - 150 * s, y: cy + 24 * s, w: 280 * s, h: 7 * s, fill: fill },
    { k: "ellipse", x: cx - 52 * s, y: cy + 6 * s, rx: 44 * s, ry: 28 * s, fill: fill, sw: 3, sc: line }, { k: "ellipse", x: cx + 56 * s, y: cy + 4 * s, rx: 48 * s, ry: 30 * s, fill: fill, sw: 3, sc: line },
    { k: "ellipse", x: cx, y: cy - 8 * s, rx: 62 * s, ry: 40 * s, fill: fill, sw: 3, sc: line },
    { k: "circle", x: cx, y: cy - 6 * s, r: 20 * s, fill: null, sw: 3, sc: line }, { k: "circle", x: cx + 4 * s, y: cy - 6 * s, r: 9 * s, fill: null, sw: 3, sc: line },
    { k: "circle", x: cx + 56 * s, y: cy + 6 * s, r: 14 * s, fill: null, sw: 3, sc: line }, { k: "circle", x: cx - 52 * s, y: cy + 8 * s, r: 12 * s, fill: null, sw: 3, sc: line }]; }
  function stars(n, x0, y0, x1, y1, seed, col) { var r = rnd(seed), out = []; for (var i = 0; i < n; i++) out.push({ k: "circle", x: x0 + r() * (x1 - x0), y: y0 + r() * (y1 - y0), r: 1.5 + r() * 2.6, fill: col }); return out; }
  function tree(x, y, s, fill) { return [{ k: "poly", pts: [[x - 18 * s, y], [x + 18 * s, y], [x + 12 * s, y - 300 * s], [x - 10 * s, y - 300 * s]], fill: fill },
    { k: "ellipse", x: x, y: y - 470 * s, rx: 230 * s, ry: 210 * s, fill: fill }, { k: "ellipse", x: x - 150 * s, y: y - 330 * s, rx: 160 * s, ry: 130 * s, fill: fill },
    { k: "ellipse", x: x + 150 * s, y: y - 340 * s, rx: 170 * s, ry: 140 * s, fill: fill }, { k: "ellipse", x: x + 30 * s, y: y - 640 * s, rx: 170 * s, ry: 140 * s, fill: fill }]; }
  function blossoms(n, x, y, s, seed) { var r = rnd(seed), out = []; for (var i = 0; i < n; i++) { var a = r() * Math.PI * 2, d = Math.sqrt(r()), px = x + Math.cos(a) * d * 280 * s, py = y - 450 * s + Math.sin(a) * d * 280 * s;
    out.push({ k: "circle", x: px, y: py, r: (5 + r() * 5) * s, fill: GOLD }); } return out; }
  function ripples(cx, y0, n, seed) { var r = rnd(seed), out = []; for (var i = 0; i < n; i++) { var w = (110 - i * 4) * (.55 + r() * .6); out.push({ k: "rect", x: cx - w / 2 + (r() - .5) * 26, y: y0 + i * 17, w: w, h: 7, fill: MOON }); } return out; }
  function seal(cx, cy, s) { return [{ k: "rect", x: cx - 38 * s, y: cy - 38 * s, w: 76 * s, h: 76 * s, fill: SEAL },
    { k: "rect", x: cx - 28 * s, y: cy - 28 * s, w: 56 * s, h: 56 * s, fill: null, sw: 3, sc: STRIP }, { k: "line", pts: [[cx - 14 * s, cy - 14 * s], [cx + 14 * s, cy - 14 * s], [cx + 14 * s, cy + 14 * s]], sw: 4, sc: STRIP },
    { k: "line", pts: [[cx - 14 * s, cy], [cx, cy], [cx, cy + 14 * s]], sw: 4, sc: STRIP }]; }
  // a near-plane frame: the whole card with an arched hole (even-odd)
  function frameNodes(hx, hy, hw, hh, fill) { return [{ k: "holes", outer: rectPts(-300, -300, 1680, 2520), cuts: [archPts(hx, hy, hw, hh, 24)], fill: fill }]; }

  // ---- type: paper words. Left-justified layers placed by the full string's ink box, so a line built word by word never jumps.
  function words(comp, name, full, o) { var L = AESLib.text(comp, name, full, { family: FACE, style: o.style, size: o.size, color: o.color, just: "left", tracking: o.tracking });
    var r = L.sourceRectAtTime(0, false); L.anchorPoint.setValue([r.left + r.width / 2, r.top + r.height / 2]); if (o.left !== undefined) L.position.setValue([o.left + r.width / 2, o.y]); else L.position.setValue([o.x, o.y]);
    if (o.maxW && r.width > o.maxW) { var s = 100 * o.maxW / r.width; L.scale.setValue([s, s]); }
    if (o.keys) AESLib.textKeys(L, o.keys.t, o.keys.s);
    span(L, o.t0, o.t1); return { layer: L, rect: r }; }
  function inkWidth(comp, str, o) { var L = AESLib.text(comp, "PROBE", str, { family: FACE, style: o.style, size: o.size, color: [1, 1, 1], just: "left", tracking: o.tracking });
    var w = L.sourceRectAtTime(0, false).width; L.remove(); return w; }
  function wordsIn(list, t0, t1) { var r = []; for (var i = 0; i < list.length; i++) if (list[i].s >= t0 - .05 && list[i].s < t1) r.push(list[i]); return r; }
  function build(str, ons, t0) { var w = str.split(" "), t = [t0], s = [" "];
    for (var i = 0; i < w.length; i++) { var at = ons[Math.min(i, ons.length - 1)]; if (at <= t0 + .001) { s[0] = w.slice(0, i + 1).join(" "); continue; } t.push(at); s.push(w.slice(0, i + 1).join(" ")); }
    return { t: t, s: s }; }
  // a cut paper title: gold card letters revealed from their anchor edge (a wipe, so glyphs are never squashed), rim and shadow like any sheet
  function paperTitle(S, name, str, o) { var T = words(S.comp, S.P + "_" + name, str, { style: o.style, size: o.size, tracking: o.tracking, color: o.color || GOLD, x: o.x, y: o.y, maxW: o.maxW, t0: o.t0, t1: o.t1 });
    var w = fx(T.layer, "ADBE Linear Wipe"); w.property("Wipe Angle").setValue(90); w.property("Feather").setValue(12);
    keys(w.property("Transition Completion"), [{ t: o.in0, v: 100, o: 30 }, { t: o.in1, v: 0, i: 70 }]);
    rimShade(T.layer, 1.6, .5); shadow(T.layer, o.shadow || 8, 70); rig(S, T.layer, o.depth); return T.layer; }

  // ---- shots
  // the village (title and end): sky, moon, clouds, far and mid ranges with folds, a row of houses with windows, water with the moon's
  // ripples, a front tree with gold blossoms. o = { moon, on (lamp-on start, staggered back to front), off (lights-out start, front to back) }
  function village(S, o) { var N = LADDERS.night, M = o.moon, on = o.on, off = o.off, st = .07, t0 = o.t0, t1 = o.t1, lit = function (c0, c1, r) { return { at: M, r: r, c0: c0, c1: c1 }; };
    function T(i) { if (on === undefined || on === null) return null; return on + i * st; }
    function O(i) { if (off === undefined || off === null) return null; return off + i * .06; }
    sheet(S, "SKY", [{ k: "rect", x: -300, y: -300, w: 1680, h: 2520, fill: N.sky }], { depth: .05, lit: lit(N.skyLit, N.sky, 1100), base: N.sky, on: T(0), off: O(7), rim: false, t0: t0, t1: t1 });
    sheet(S, "STARS", stars(46, -200, -100, 1280, 1000, 17, N.star), { depth: .06, rim: false, t0: t0, t1: t1 }).opacity.setValue(70);
    moon(S, "MOON", M, 150, { depth: .1, on: T(0), off: O(8), t0: t0, t1: t1 });
    sheet(S, "CLOUDS", cloud(M[0] - 340, M[1] + 30, 1, N.cloud, N.cloudLine).concat(cloud(M[0] + 300, M[1] + 330, .85, N.cloud, N.cloudLine)).concat(cloud(M[0] - 90, M[1] + 140, .8, N.cloud, N.cloudLine)),
      { depth: .2, base: N.cloud, on: T(1), off: O(6), shadow: 12, t0: t0, t1: t1 });
    var fp = [[140, 400, 150], [470, 300, 140], [830, 440, 160], [1110, 300, 130], [-130, 300, 130]], fy = M[1] + 680;
    sheet(S, "FAR", range(fy, fp, -320, 1400, N.far), { depth: .3, lit: lit(N.farLit, N.far, 760), base: N.far, on: T(2), off: O(5), shadow: 16, t0: t0, t1: t1 });
    sheet(S, "FAR_FOLDS", contours(fy, fp, N.farLit), { depth: .3, rim: false, base: N.farLit, on: T(2), off: O(5), t0: t0, t1: t1 }).opacity.setValue(55);
    var mp = [[-20, 250, 150], [330, 190, 150], [690, 250, 170], [1030, 210, 140]], my = fy + 150;
    sheet(S, "MID", range(my, mp, -320, 1400, N.mid), { depth: .42, lit: lit(N.midLit, N.mid, 820), base: N.mid, on: T(3), off: O(4), shadow: 18, t0: t0, t1: t1 });
    sheet(S, "MID_FOLDS", contours(my, mp, N.midLit), { depth: .42, rim: false, base: N.midLit, on: T(3), off: O(4), t0: t0, t1: t1 }).opacity.setValue(50);
    var hy = my + 110, hs = [[30, 200, 120], [290, 170, 150], [520, 230, 130], [800, 190, 140], [1040, 170, 110]], hn = [], wn = [];
    for (var i = 0; i < hs.length; i++) { hn = hn.concat(house(hs[i][0], hy, hs[i][1], hs[i][2], N.house, N.roof)); wn.push(houseWindows(hs[i][0], hy, hs[i][1], hs[i][2])); }
    sheet(S, "HOUSES", hn, { depth: .55, lit: lit(N.houseLit, N.house, 900), base: N.house, on: T(4), off: O(3), shadow: 14, t0: t0, t1: t1 });
    var order = [2, 0, 3, 1, 4];                                                      // windows light one by one; the last one lit goes out last
    for (var w = 0; w < order.length; w++) { var oi = order[w];
      light(S, "WIN" + w, wn[oi], { depth: .55, glow: 22, inten: 1.2, on: (on === undefined || on === null) ? null : on + .42 + w * .1, off: (off === undefined || off === null) ? null : off - .3 + (order.length - 1 - w) * .06, t0: t0, t1: t1 }); }
    sheet(S, "WATER", [{ k: "rect", x: -300, y: hy, w: 1680, h: 1200, fill: N.near }, { k: "line", pts: [[-300, hy + 120], [1380, hy + 120]], sw: 2, sc: N.house }, { k: "line", pts: [[-300, hy + 260], [1380, hy + 260]], sw: 2, sc: N.house }],
      { depth: .7, base: N.near, on: T(5), off: O(2), shadow: 10, t0: t0, t1: t1 });
    light(S, "RIPPLES", ripples(M[0], hy + 26, 16, 5), { depth: .7, glow: 10, inten: .8, on: T(5), off: O(2), op: 80, t0: t0, t1: t1 });
    sheet(S, "TREE", tree(80, hy + 220, 1.15, N.front).concat([{ k: "poly", pts: [[-300, 2300], [-300, hy + 330], [200, hy + 300], [520, hy + 360], [900, hy + 320], [1380, hy + 360], [1380, 2300]], fill: N.front }]),
      { depth: 1, base: N.front, on: T(6), off: O(0), shadow: 24, blur: 5, t0: t0, t1: t1 });
    light(S, "BLOSSOM", blossoms(70, 80, hy + 220, 1.15, 9), { depth: 1, glow: 14, inten: .9, on: T(6) === null ? null : T(6) + .1, off: O(0), t0: t0, t1: t1 }).property("ADBE Effect Parade").addProperty("ADBE Gaussian Blur 2").property("Blurriness").setValue(4);
    return hy; }

  // buildScene: the shared test scene (the library's seven-beat test scene) as seven shots inside paper-cut lightboxes. comp = an empty 1080 x 1920 comp.
  function buildScene(comp, scene, opts) {
    fontOK(); var P = opts.prefix || "LANT", A = opts.assets, B = scene.beat, W = comp.width, H = comp.height, D = comp.duration, fps = comp.frameRate, notes = [], WL = scene.wordList;
    AESLib.clearOwned(comp, P); var comps = [];
    var ons = function (t0, t1) { var r = [], w = wordsIn(WL, t0, t1); for (var i = 0; i < w.length; i++) r.push(w[i].s); return r; };
    var clipItem = AESLib.importFile(scene.clip);
    function S_(name) { var s = shot(P, name, W, H, D, fps); comps.push(s.comp); return s; }

    // 1. title: the lamp turns on (moon, then each sheet back to front, then windows one by one); the title is gold card cut out and grows
    // from its edge on its words; the seal slams on "way".
    var T0 = B.title.t0, T1 = B.title.t1 + .14, tw = ons(B.title.t0, B.title.t1), ST = S_("TITLE");
    village(ST, { moon: [540, 640], on: .02, t0: T0, t1: T1 });
    paperTitle(ST, "T_CTX", B.title.context.toUpperCase(), { style: "SemiBold", size: 118, tracking: 140, x: 540, y: 232, maxW: 940, in0: tw[0], in1: tw[2], depth: .25, t0: T0, t1: T1 });
    paperTitle(ST, "T_HERO", B.title.hero, { style: "SemiBold Italic", size: 92, x: 520, y: 348, maxW: 860, in0: tw[2], in1: tw[5] + .1, depth: .25, t0: T0, t1: T1 });
    var TS = sheet(ST, "T_SEAL", seal(0, 0, 1), { depth: .25, pos: [930, 352], shadow: 6, t0: tw[5], t1: T1 });
    keys(TS.scale, [{ t: tw[5], v: [160, 160], o: 20 }, { t: tw[5] + .12, v: [100, 100], i: 80 }]);
    keys(ST.cam.scale, [{ t: 0, v: [100, 100], o: 20 }, { t: T1, v: [104, 104], i: 20 }]);

    // 2. picture: a warm interior box lit by a hanging lantern. Three pieces slide in like paper on a stick, one per word (the figure up
    // from below, the page down from above, the laptop up onto the desk); the figure's jointed arm reaches, the screen lights, dolly in.
    var P0 = B.picture.t0 - .2, P1 = B.picture.t1 + .02, pw = ons(B.picture.t0, B.picture.t1), SP = S_("PICTURE"), I = LADDERS.interior, LP = [770, 470];
    var ilit = function (c0, c1, r) { return { at: LP, r: r, c0: c0, c1: c1 }; };
    sheet(SP, "P_WALL", [{ k: "rect", x: -300, y: -300, w: 1680, h: 2520, fill: I.wall }].concat([{ k: "rect", x: -300, y: 1140, w: 1680, h: 8, fill: mul(I.wall, .82) }]), { depth: .08, lit: ilit(I.wallLit, I.wall, 1300), rim: false, t0: P0, t1: P1 });
    // the lantern hangs from its string (drawn with the string's top at the origin, so it swings on the anchor)
    var LY0 = LP[1] + 300, SWING = "2.2 * Math.sin(time * 1.9);";
    var lan = light(SP, "P_LANTERN", [{ k: "ellipse", x: 0, y: LY0, rx: 74, ry: 92, fill: LANTERN }], { depth: .25, glow: 70, inten: 1.5, pos: [LP[0], -300], t0: P0, t1: P1 });
    var lanCap = sheet(SP, "P_LANTERNCAP", [{ k: "line", pts: [[0, 0], [0, LY0 - 104]], sw: 3, sc: I.desk }, { k: "rect", x: -40, y: LY0 - 108, w: 80, h: 20, fill: I.desk },
      { k: "rect", x: -34, y: LY0 + 88, w: 68, h: 18, fill: I.desk }, { k: "line", pts: [[0, LY0 + 106], [0, LY0 + 170]], sw: 4, sc: SEAL },
      { k: "line", pts: [[-60, LY0 - 50], [60, LY0 - 50]], sw: 2, sc: mul(LANTERN, .7) }, { k: "line", pts: [[-72, LY0 + 10], [72, LY0 + 10]], sw: 2, sc: mul(LANTERN, .7) }],
      { depth: .25, shadow: 8, pos: [LP[0], -300], t0: P0, t1: P1 });
    lan.rotation.expression = SWING; lanCap.rotation.expression = SWING;
    var drape = [{ k: "poly", pts: [[-300, -300], [210, -300], [180, 400], [120, 900], [150, 1400], [60, 2300], [-300, 2300]], fill: I.drape },
      { k: "poly", pts: [[1380, -300], [880, -300], [910, 400], [960, 900], [930, 1400], [1020, 2300], [1380, 2300]], fill: I.drape }];
    var val = [{ k: "rect", x: -300, y: -300, w: 1680, h: 470, fill: I.drape }]; for (var sc = -2; sc < 12; sc++) val.push({ k: "circle", x: sc * 100 + 50, y: 170, r: 50, fill: I.drape });
    sheet(SP, "P_DRAPES", drape.concat(val), { depth: .38, lit: ilit(I.drapeLit, I.drape, 900), shadow: 18, t0: P0, t1: P1 });
    sheet(SP, "P_DRAPE_FOLDS", [{ k: "line", pts: [[40, 300], [20, 2000]], sw: 3, sc: I.drapeLit }, { k: "line", pts: [[110, 260], [80, 2000]], sw: 3, sc: I.drapeLit },
      { k: "line", pts: [[980, 300], [1010, 2000]], sw: 3, sc: I.drapeLit }, { k: "line", pts: [[1050, 260], [1080, 2000]], sw: 3, sc: I.drapeLit }], { depth: .38, rim: false, t0: P0, t1: P1 }).opacity.setValue(45);
    // the page: a sheet of paper on a stick with its lines cut through (the light shows in the slits); down from above on "pieces"
    var docN = [{ k: "rect", x: -150, y: -190, w: 300, h: 380, fill: I.paper }, { k: "line", pts: [[0, -190], [0, -1200]], sw: 3, sc: I.desk }], slits = [];
    for (var r0 = 0; r0 < 7; r0++) slits.push({ k: "rect", x: -110, y: -120 + r0 * 40, w: r0 === 6 ? 120 : 220, h: 9, fill: LIGHT });
    slits.push({ k: "rect", x: -110, y: -160, w: 110, h: 18, fill: SEAL });
    var DOC = sheet(SP, "P_DOC", docN, { depth: .5, lit: { at: [0, -100], r: 360, c0: I.paperLit, c1: I.paper }, pos: [560, 760], shadow: 16, t0: pw[1] - .02, t1: P1 });
    var DOCL = light(SP, "P_DOCSLITS", slits, { depth: .5, glow: 12, inten: .9, pos: [560, 760], t0: pw[1] - .02, t1: P1 });
    var dk = [{ t: pw[1] - .02, v: [560, -260], o: 30 }, { t: pw[1] + .34, v: [560, 760], i: 82 }];
    keys(DOC.position, dk); keys(DOCL.position, dk); DOC.rotation.expression = "-3 + 1.5 * Math.sin(time * 2.3);"; DOCL.rotation.expression = DOC.rotation.expression;
    // the figure: a seated silhouette, the arm a separate sheet jointed at the shoulder (rotation only); up from below on "Three"
    var fig = [{ k: "rect", x: -150, y: -260, w: 30, h: 300, fill: I.figure }, { k: "rect", x: -150, y: -20, w: 190, h: 26, fill: I.figure },
      { k: "poly", pts: [[-110, -300], [20, -300], [50, -40], [-120, -40]], fill: I.figure }, { k: "rect", x: -40, y: -340, w: 36, h: 50, fill: I.figure },
      { k: "ellipse", x: -20, y: -390, rx: 52, ry: 60, fill: I.figure }, { k: "circle", x: -62, y: -440, r: 26, fill: I.figure }, { k: "poly", pts: [[28, -400], [46, -380], [26, -370]], fill: I.figure },
      { k: "group", id: "ARM", pivot: [0, -280], rot: 38, kids: [{ k: "poly", pts: [[-14, -290], [16, -290], [110, -170], [86, -150]], fill: I.figure }, { k: "poly", pts: [[86, -172], [110, -168], [230, -190], [232, -166], [100, -146]], fill: I.figure }] }];
    var FIG = sheet(SP, "P_FIGURE", fig, { depth: .6, pos: [300, 1240], shadow: 18, t0: pw[0] - .02, t1: P1 });
    keys(FIG.position, [{ t: pw[0] - .02, v: [300, 1900], o: 30 }, { t: pw[0] + .34, v: [300, 1240], i: 82 }]);
    keys(groupT(FIG, ["ARM"]).property("ADBE Vector Rotation"), [{ t: pw[2] + .06, v: 38, o: 40 }, { t: pw[2] + .36, v: 0, i: 80 }]);
    // the laptop: a dark card on the desk; its screen is a window that switches on on "one"
    var lap = [{ k: "poly", pts: [[-170, 0], [170, 0], [190, 22], [-190, 22]], fill: I.figure }, { k: "poly", pts: [[-150, -230], [150, -230], [140, -6], [-140, -6]], fill: I.figure }];
    var LAP = sheet(SP, "P_LAPTOP", lap, { depth: .66, pos: [720, 1268], shadow: 14, t0: pw[2] - .02, t1: P1 });
    var SCR = light(SP, "P_SCREEN", [{ k: "poly", pts: [[-132, -214], [132, -214], [124, -22], [-124, -22]], fill: SCREEN }], { depth: .66, glow: 60, inten: 1.2, pos: [720, 1268], on: pw[3], fade: .12, t0: pw[2] - .02, t1: P1 });
    var lk = [{ t: pw[2] - .02, v: [720, 1900], o: 30 }, { t: pw[2] + .3, v: [720, 1268], i: 82 }]; keys(LAP.position, lk); keys(SCR.position, lk);
    sheet(SP, "P_DESK", [{ k: "rect", x: 100, y: 1290, w: 900, h: 40, fill: I.desk }, { k: "rect", x: 140, y: 1330, w: 40, h: 480, fill: I.desk }, { k: "rect", x: 920, y: 1330, w: 40, h: 480, fill: I.desk },
      { k: "rect", x: -300, y: 1760, w: 1680, h: 600, fill: I.floor }], { depth: .72, lit: ilit(mul(I.desk, 1.5), I.desk, 900), shadow: 20, t0: P0, t1: P1 });
    sheet(SP, "P_FRAME", frameNodes(60, 120, 960, 1700, I.front), { depth: 1, shadow: 26, blur: 6, t0: P0, t1: P1 });
    keys(SP.cam.scale, [{ t: P0, v: [100, 100], o: "H" }, { t: pw[4], v: [100, 100], o: 30 }, { t: P1, v: [106, 106], i: 60 }]);
    keys(SP.cam.position, [{ t: pw[4], v: [W / 2, H / 2], o: 30 }, { t: P1, v: [W / 2 + 18, H / 2 - 30], i: 60 }]);

    // 3. input: the real frame glows through a window cut in three stacked frames (front hole widest, each sheet behind steps in);
    // two lanterns hang in front; a slow dolly in.
    var I0 = B.input.t0, I1 = B.input.t1 + .02, SI = S_("INPUT"), F = LADDERS.frames;
    var CL = SI.comp.layers.add(clipItem); CL.name = P + "_I_REAL"; CL.startTime = I0 - B.input.clipStart; span(CL, I0, I1);
    CL.anchorPoint.setValue([540, 1485]); CL.position.setValue([540, 880]); CL.scale.setValue([122, 122]);
    var ct = fx(CL, "ADBE Tint"); ct.property("Map Black To").setValue(c4(hex("120A20"))); ct.property("Map White To").setValue(c4(hex("FFEBC6"))); ct.property("Amount to Tint").setValue(42);
    rig(SI, CL, .15);
    var FH = [[250, 430, 580, 900], [200, 380, 680, 1010], [140, 320, 800, 1140]];
    for (var f = 0; f < 3; f++) sheet(SI, "I_FRAME" + f, frameNodes(FH[f][0], FH[f][1], FH[f][2], FH[f][3], F[f]), { depth: .4 + f * .2, lit: f === 0 ? { at: [540, 880], r: 700, c0: hex("6E88BE"), c1: F[0] } : null, shadow: 14 + f * 6, blur: f === 2 ? 3 : 0, t0: I0, t1: I1 });
    sheet(SI, "I_CLOUDS", cloud(170, 1640, .9, LADDERS.night.cloud, LADDERS.night.cloudLine).concat(cloud(900, 1720, .75, LADDERS.night.cloud, LADDERS.night.cloudLine)), { depth: .85, shadow: 12, t0: I0, t1: I1 });
    var lanterns = [[150, 250], [930, 250]];
    for (var l = 0; l < 2; l++) { var lx = lanterns[l][0], ly = lanterns[l][1];
      light(SI, "I_LANTERN" + l, [{ k: "ellipse", x: lx, y: ly, rx: 48, ry: 60, fill: LANTERN }], { depth: .95, glow: 50, inten: 1.3, t0: I0, t1: I1 });
      sheet(SI, "I_LANTERNCAP" + l, [{ k: "line", pts: [[lx, -300], [lx, ly - 70]], sw: 3, sc: F[2] }, { k: "rect", x: lx - 26, y: ly - 74, w: 52, h: 14, fill: F[2] }, { k: "rect", x: lx - 22, y: ly + 58, w: 44, h: 12, fill: F[2] },
        { k: "line", pts: [[lx, ly + 70], [lx, ly + 120]], sw: 4, sc: SEAL }], { depth: .95, shadow: 6, t0: I0, t1: I1 }); }
    keys(SI.cam.scale, [{ t: I0, v: [100, 100], o: 20 }, { t: I1, v: [108, 108], i: 20 }]);

    // 4. number: a violet street; the count is gold card ticking on twos, and 338 windows in one facade light up row by row with it.
    // The lamp comes back on after the light-off cut (sheets switch on back to front).
    var N0 = B.number.t0, N1 = B.number.t1 + .12, nw = ons(B.number.t0, B.number.t1), SN = S_("NUMBER"), V = LADDERS.violet, val = B.number.value, LT = [540, 380];
    var vlit = function (c0, c1, r) { return { at: LT, r: r, c0: c0, c1: c1 }; };
    sheet(SN, "N_SKY", [{ k: "rect", x: -300, y: -300, w: 1680, h: 2520, fill: V.sky }], { depth: .05, lit: vlit(V.skyLit, V.sky, 1200), base: V.sky, on: N0, rim: false, t0: N0, t1: N1 });
    sheet(SN, "N_STARS", stars(40, -200, -100, 1280, 800, 23, LADDERS.night.star), { depth: .06, rim: false, t0: N0, t1: N1 }).opacity.setValue(60);
    var sky = [{ k: "rect", x: -300, y: 1000, w: 1680, h: 1300, fill: V.far }], bx = [-260, -150, -20, 110, 980, 1080, 1200];
    for (var b2 = 0; b2 < bx.length; b2++) sky.push({ k: "rect", x: bx[b2], y: 760 + (b2 % 3) * 90, w: 120, h: 600, fill: V.far });
    sheet(SN, "N_FAR", sky, { depth: .25, lit: vlit(V.farLit, V.far, 900), base: V.far, on: N0 + .07, shadow: 14, t0: N0, t1: N1 });
    sheet(SN, "N_FACADE", [{ k: "rect", x: 80, y: 900, w: 920, h: 700, fill: V.mid }, { k: "rect", x: 60, y: 880, w: 960, h: 30, fill: V.mid }, { k: "rect", x: 470, y: 840, w: 140, h: 44, fill: V.mid }],
      { depth: .45, lit: vlit(V.midLit, V.mid, 1100), base: V.mid, on: N0 + .14, shadow: 18, t0: N0, t1: N1 });
    function grid(name, color, depth) { var G = SN.comp.layers.addShape(); G.name = P + "_" + name; G.anchorPoint.setValue([0, 0]); G.position.setValue([115 - 9, 960]);
      var og = G.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group"), ov = og.property("ADBE Vectors Group"), ig = ov.addProperty("ADBE Vector Group"), iv = ig.property("ADBE Vectors Group");
      var rc = iv.addProperty("ADBE Vector Shape - Rect"); rc.property("ADBE Vector Rect Size").setValue([18, 26]); rc.property("ADBE Vector Rect Position").setValue([9, 13]);
      iv.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(color);
      var r1 = iv.addProperty("ADBE Vector Filter - Repeater"); r1.property("ADBE Vector Repeater Copies").setValue(26); r1.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([34, 0]);
      var r2 = ov.addProperty("ADBE Vector Filter - Repeater"); r2.property("ADBE Vector Repeater Copies").setValue(13); r2.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([0, 44]);
      rig(SN, G, depth); span(G, N0, N1); return G; }
    grid("N_HOLES", V.hole, .45);
    var LW = grid("N_LIT", LIGHT, .45), lg = fx(LW, "ADBE Glo2"); lg.property("Glow Based On").setValue(2); lg.property("Glow Threshold").setValue(20); lg.property("Glow Radius").setValue(18); lg.property("Glow Intensity").setValue(1.1);
    var rows = LW.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property(2).property("ADBE Vector Repeater Copies");
    var cnEnd = N0 + .25 + 10 / 12;
    keys(rows, [{ t: N0 + .25, v: 0, o: "L" }, { t: cnEnd, v: 13, i: "L" }]); rows.expression = "posterizeTime(12); Math.round(value);";
    var NU = words(SN.comp, P + "_N_NUM", String(val), { style: "SemiBold", size: 360, color: GOLD, x: 540, y: 470, t0: N0, t1: N1 }).layer;
    NU.anchorPoint.expression = "var r = sourceRectAtTime(time, false); [r.left + r.width / 2, r.top + r.height / 2];";
    var counts = [], cn = 10; for (var c2 = 0; c2 <= cn; c2++) { var e = 1 - Math.pow(1 - c2 / cn, 2.2); counts.push(String(Math.round(val * e))); }
    AESLib.bakeText(NU, counts, 12, N0 + .25); rimShade(NU, 2.2, .55); shadow(NU, 12, 70); rig(SN, NU, .3);
    paperTitle(SN, "N_LABEL", B.number.label.toUpperCase(), { style: "SemiBold", size: 84, tracking: 380, x: 548, y: 700, in0: nw[1] - .04, in1: nw[1] + .3, depth: .3, t0: N0, t1: N1 });
    sheet(SN, "N_STREET", [{ k: "rect", x: -300, y: 1600, w: 1680, h: 800, fill: V.front }, { k: "rect", x: 150, y: 1180, w: 16, h: 440, fill: V.front }, { k: "rect", x: 914, y: 1180, w: 16, h: 440, fill: V.front },
      { k: "rect", x: 128, y: 1150, w: 60, h: 40, fill: V.front }, { k: "rect", x: 892, y: 1150, w: 60, h: 40, fill: V.front }], { depth: .9, base: V.front, on: N0 + .21, shadow: 22, blur: 4, t0: N0, t1: N1 });
    light(SN, "N_STREETLAMPS", [{ k: "rect", x: 136, y: 1160, w: 44, h: 24, fill: LIGHT }, { k: "rect", x: 900, y: 1160, w: 44, h: 24, fill: LIGHT }], { depth: .9, glow: 40, inten: 1.3, on: N0 + .28, t0: N0, t1: N1 });
    keys(SN.cam.scale, [{ t: N0, v: [103, 103], o: 20 }, { t: N1, v: [100, 100], i: 20 }]);

    // 5. line: the camera tilts up the stack into the sky; three cream strips grow from their left edge as each word is spoken, the words
    // cut through them (the night shows in the letters).
    var L0 = B.line.t0 - .22, L1 = B.line.t1 + .12, lw = ons(B.line.t0, B.line.t1), SL = S_("LINE"), Nn = LADDERS.night, LM = [800, 360];
    sheet(SL, "L_SKY", [{ k: "rect", x: -300, y: -300, w: 1680, h: 2620, fill: Nn.sky }], { depth: .05, lit: { at: LM, r: 1200, c0: Nn.skyLit, c1: Nn.sky }, rim: false, t0: L0, t1: L1 });
    sheet(SL, "L_STARS", stars(60, -200, -200, 1280, 1700, 31, Nn.star), { depth: .06, rim: false, t0: L0, t1: L1 }).opacity.setValue(70);
    moon(SL, "L_MOON", LM, 110, { depth: .1, t0: L0, t1: L1 });
    sheet(SL, "L_CLOUDS", cloud(200, 470, 1, Nn.cloud, Nn.cloudLine).concat(cloud(900, 1420, .9, Nn.cloud, Nn.cloudLine)), { depth: .3, shadow: 12, t0: L0, t1: L1 });
    var lp = [[100, 330, 150], [460, 260, 150], [820, 360, 170]];
    sheet(SL, "L_FAR", range(1900, lp, -320, 1400, Nn.far), { depth: .35, lit: { at: LM, r: 1500, c0: Nn.farLit, c1: Nn.far }, shadow: 16, t0: L0, t1: L1 });
    var rowsT = ["Every word", "I say", "gets typed."], rwT = [[lw[0], lw[1]], [lw[2], lw[3]], [lw[4], lw[5]]], LO = { style: "SemiBold Italic", size: 112 }, LX = 140, LY = [760, 960, 1160], PAD = 34;
    for (var rr = 0; rr < 3; rr++) { var full = rowsT[rr], ws = full.split(" "), fw = inkWidth(SL.comp, full, LO), dep = .5 + rr * .04;
      var SW = fw + PAD * 2, STR = sheet(SL, "L_STRIP" + rr, [{ k: "rect", x: 0, y: -74, w: SW, h: 148, fill: STRIP }], { depth: dep, pos: [LX - PAD, LY[rr]], shadow: 14, t0: L0, t1: L1 });
      var sk = [{ t: L0, v: [0, 100], o: "H" }];
      for (var wi = 0; wi < ws.length; wi++) { var at = Math.max(rwT[rr][Math.min(wi, rwT[rr].length - 1)] - .04, sk[sk.length - 1].t + .01), pw2 = inkWidth(SL.comp, ws.slice(0, wi + 1).join(" "), LO) + PAD * 2;
        sk.push({ t: at, v: [sk[sk.length - 1].v[0], 100], o: 30 }); sk.push({ t: at + .16, v: [100 * pw2 / SW, 100], i: 75, o: "H" }); }
      sk.shift(); keys(STR.scale, sk);
      var TX = words(SL.comp, P + "_L_ROW" + rr, full, { style: LO.style, size: LO.size, color: INK, left: LX, y: LY[rr] + 6, t0: L0, t1: L1, keys: build(full, rwT[rr], L0) }).layer;
      rig(SL, TX, dep); }
    keys(SL.cam.position, [{ t: L0, v: [W / 2, H / 2 + 260], o: 20 }, { t: L0 + .7, v: [W / 2, H / 2], i: 80 }]);

    // 6. carry: a dusk desert box traveling sideways (each sheet at its depth's speed); the real frame rides along in a round window and,
    // on "becomes", rises and turns into the moon of the next shot.
    var C0 = B.carry.t0 - .22, C1 = B.carry.t1 + .1, cw = ons(B.carry.t0, B.carry.t1), SC = S_("CARRY"), U = LADDERS.dusk, SUN = [540, 1150];
    sheet(SC, "C_SKY", [{ k: "rect", x: -1200, y: -300, w: 3480, h: 2520, fill: U.sky }], { depth: .05, lit: { at: SUN, r: 1300, c0: U.skyLit, c1: U.sky }, rim: false, t0: C0, t1: C1 });
    var dp = [[-700, 300, 260], [-150, 380, 300], [400, 260, 240], [950, 400, 300], [1500, 300, 260], [2000, 360, 280]], dy = 1380;
    sheet(SC, "C_FAR", range(dy, dp, -1200, 2300, U.far), { depth: .3, lit: { at: SUN, r: 1100, c0: U.farLit, c1: U.far }, shadow: 16, t0: C0, t1: C1 });
    sheet(SC, "C_FAR_FOLDS", contours(dy, dp, U.farLit), { depth: .3, rim: false, t0: C0, t1: C1 }).opacity.setValue(50);
    var mp2 = [[-900, 200, 260], [-300, 240, 300], [300, 180, 240], [900, 260, 280], [1500, 200, 260], [2100, 240, 260]], my2 = 1580;
    sheet(SC, "C_MID", range(my2, mp2, -1300, 2400, U.mid), { depth: .5, lit: { at: SUN, r: 1000, c0: U.midLit, c1: U.mid }, shadow: 18, t0: C0, t1: C1 });
    var fires = [], fr = rnd(41); for (var fi = 0; fi < 9; fi++) { var fxp = -1100 + fi * 400 + fr() * 120; fires.push({ k: "poly", pts: [[fxp - 16, 0], [fxp - 4, -34], [fxp + 2, -18], [fxp + 8, -40], [fxp + 16, 0]], fill: LANTERN }); }
    var FI = light(SC, "C_FIRES", fires, { depth: .5, glow: 20, inten: .6, pos: [0, my2 - 40], t0: C0, t1: C1 });
    sheet(SC, "C_NEAR", range(1760, [[-1000, 120, 300], [-200, 160, 340], [600, 110, 300], [1400, 170, 320], [2200, 120, 300]], -1500, 2600, U.near), { depth: .75, shadow: 20, t0: C0, t1: C1 });
    sheet(SC, "C_FRONT", [{ k: "poly", pts: [[-1700, 2300], [-1700, 1820], [-900, 1800], [0, 1850], [900, 1790], [1800, 1840], [2800, 1800], [2800, 2300]], fill: U.front }].concat(tree(-420, 1880, .7, U.front)).concat(tree(1500, 1880, .8, U.front)),
      { depth: 1, shadow: 24, blur: 5, t0: C0, t1: C1 });
    keys(SC.cam.position, [{ t: C0, v: [W / 2 + 760, H / 2], o: "L" }, { t: C1, v: [W / 2 - 760, H / 2], i: "L" }]);
    // the window (not on the rig: the camera follows it): the real face held on one frame, masked round, in a paper ring
    var WC = [540, 960], WR = 230, MO = [540, 560], MR = 150, s1 = MR / WR;
    var WN = SC.comp.layers.addNull(); WN.name = P + "_C_WINDOW"; WN.position.setValue(WC); WN.enabled = false; span(WN, C0, C1);
    var FC = SC.comp.layers.add(clipItem); FC.name = P + "_C_FACE"; span(FC, C0, C1); FC.timeRemapEnabled = true; FC.property("ADBE Time Remapping").expression = "4.6;";
    FC.anchorPoint.setValue([540, 1470]); FC.position.setValue(WC); FC.scale.setValue([112, 112]);
    var fm = FC.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"); fm.property("ADBE Mask Shape").setValue(ell(540, 1470, WR / 1.12, WR / 1.12)); fm.property("ADBE Mask Feather").setValue([2, 2]);
    var fct = fx(FC, "ADBE Tint"); fct.property("Map Black To").setValue(c4(hex("2A1206"))); fct.property("Map White To").setValue(c4(hex("FFEBC6"))); fct.property("Amount to Tint").setValue(42);
    var RG = SC.comp.layers.addShape(); RG.name = P + "_C_RING"; RG.anchorPoint.setValue([0, 0]); RG.position.setValue(WC);
    var rgv = RG.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").property("ADBE Vectors Group");
    rgv.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(ell(0, 0, WR + 36, WR + 36)); rgv.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(ell(0, 0, WR - 2, WR - 2));
    var rgf = rgv.addProperty("ADBE Vector Graphic - Fill"); rgf.property("ADBE Vector Fill Color").setValue(U.mid); rgf.property("ADBE Vector Fill Rule").setValue(2);
    rimShade(RG, 3, .6); shadow(RG, 16, 70); span(RG, C0, C1);
    var MD = piece(SC.comp, P + "_C_MOON", [{ k: "circle", x: 0, y: 0, r: WR, fill: MOON }], WC); span(MD, C0, C1);
    var mg = fx(MD, "ADBE Glo2"); mg.property("Glow Based On").setValue(2); mg.property("Glow Threshold").setValue(30); mg.property("Glow Radius").setValue(110); mg.property("Glow Intensity").setValue(1.4);
    keys(MD.opacity, [{ t: cw[3] + .2, v: 0, o: 30 }, { t: cw[5] + .1, v: 100, i: 60 }]);
    keys(RG.opacity, [{ t: cw[3] + .25, v: 100, o: 30 }, { t: cw[5] + .1, v: 0, i: 60 }]);
    FC.parent = WN; RG.parent = WN; MD.parent = WN;                                    // position first, then parent
    keys(WN.position, [{ t: cw[3] - .04, v: WC, o: 40 }, { t: cw[5] + .16, v: MO, i: 80 }]);
    keys(WN.scale, [{ t: cw[3] - .04, v: [100, 100], o: 40 }, { t: cw[5] + .16, v: [100 * s1, 100 * s1], i: 80 }]);

    // 7. end: back home in the night box with the moon where the window landed; THAT'S THE TEST grows in gold card on its words, the seal
    // slams, the camera pulls out of the box (main comp), and the lights go out one by one, the moon last.
    var E0 = B.end.t0 - .2, E1 = D, ew = ons(B.end.t0, B.end.t1), SE = S_("END"), OFF = 10.24;
    village(SE, { moon: MO, off: OFF, t0: E0, t1: E1 });
    paperTitle(SE, "E_A", "THAT’S", { style: "SemiBold", size: 120, tracking: 160, x: 540, y: 176, in0: ew[0] - .02, in1: ew[1], depth: .25, t0: E0, t1: E1 });
    paperTitle(SE, "E_B", "THE TEST.", { style: "SemiBold", size: 150, tracking: 80, x: 540, y: 306, maxW: 900, in0: ew[1], in1: ew[2] + .3, depth: .25, t0: E0, t1: E1 });
    var ES = sheet(SE, "E_SEAL", seal(0, 0, 1.1), { depth: .25, pos: [900, 470], shadow: 6, t0: ew[2] + .38, t1: E1 });
    keys(ES.scale, [{ t: ew[2] + .38, v: [160, 160], o: 20 }, { t: ew[2] + .5, v: [100, 100], i: 80 }]);
    keys(SE.cam.scale, [{ t: E0, v: [104, 104], o: 20 }, { t: E1, v: [100, 100], i: 20 }]);

    // ---- main comp: the shots in order, each later one above; dissolves, a near-plane curtain, a light-off cut, the pull-out of the box
    function addShot(S, t0, t1, fadeIn) { var L = comp.layers.add(S.comp); L.name = S.comp.name; span(L, t0, t1);
      if (fadeIn) keys(L.opacity, [{ t: t0, v: 0, o: 30 }, { t: t0 + fadeIn, v: 100, i: 60 }]); return L; }
    addShot(ST, 0, T1);
    addShot(SP, P0, P1, .2);
    addShot(SI, I0, I1);
    var LN = addShot(SN, N0, N1);
    addShot(SL, L0, L1, .22);
    addShot(SC, C0, C1, .22);
    var LE = addShot(SE, 8.84, D, .26);
    // the pull-out: the end box shrinks into its wooden frame on a table in a dark room lit by the lamp's spill
    var PULL0 = 9.98, PULL1 = 10.55, KS = 80;
    keys(LE.scale, [{ t: PULL0, v: [100, 100], o: 30 }, { t: PULL1, v: [KS, KS], i: 75 }]);
    var ROOM = solid(comp, P + "_ROOM", hex("0B0705")); span(ROOM, PULL0, D); ROOM.moveAfter(LE);
    var rr2 = fx(ROOM, "ADBE Ramp"); rr2.property("Start of Ramp").setValue([540, 1780]); rr2.property("Start Color").setValue(c4(hex("4A2C14"))); rr2.property("End of Ramp").setValue([540 + 900, 1780]);
    rr2.property("End Color").setValue(c4(hex("0B0705"))); rr2.property("Ramp Shape").setValue(2);
    var bw = W * KS / 100, bh = H * KS / 100, bx0 = (W - bw) / 2, by0 = (H - bh) / 2;
    var FRM = piece(comp, P + "_BOXFRAME", [{ k: "holes", outer: rectPts(bx0 - 70, by0 - 70, bw + 140, bh + 140), cuts: [rectPts(bx0, by0, bw, bh)], fill: hex("3A2414") },
      { k: "holes", outer: rectPts(bx0, by0, bw, bh), cuts: [rectPts(bx0 + 14, by0 + 14, bw - 28, bh - 28)], fill: hex("050403") }]);
    FRM.anchorPoint.setValue([W / 2, H / 2]); FRM.position.setValue([W / 2, H / 2]); span(FRM, PULL0, D);
    FRM.scale.expression = "var s = thisComp.layer(\"" + LE.name + "\").transform.scale[0] / " + KS + " * 100; [s, s];";
    rimShade(FRM, 4, .5); shadow(FRM, 24, 80);
    // the near-plane curtain between the picture and the input: two dark halves that meet exactly at their front edges
    var CUR0 = B.picture.t1 - .26, CUR1 = B.input.t0 + .06, CUR2 = B.input.t0 + .4, Nf = LADDERS.night.front;
    var halves = [[-540, 540, -1140], [540, 1620, 1140]];
    for (var hv = 0; hv < 2; hv++) { var x0 = halves[hv][0], x1 = halves[hv][1], ed = hv === 0 ? x1 : x0, CU = piece(comp, P + "_CURTAIN" + hv, [{ k: "rect", x: x0, y: -40, w: 1080, h: 2000, fill: Nf }].concat(cloud(ed + (hv === 0 ? -170 : 170), 1300, .8, mul(Nf, 3), mul(Nf, 1.6))).concat(cloud(ed + (hv === 0 ? -260 : 260), 520, .7, mul(Nf, 3), mul(Nf, 1.6))));
      span(CU, CUR0, CUR2); rimShade(CU, 3, .5); shadow(CU, 26, 80); blur(CU, 2);
      keys(CU.position, [{ t: CUR0, v: [halves[hv][2], 0], o: 30 }, { t: B.input.t0 - .02, v: [0, 0], i: 90, o: "H" }, { t: CUR1, v: [0, 0], o: 40 }, { t: CUR2, v: [halves[hv][2], 0], i: 70 }]); }
    // the light-off cut between the input and the number: the lamp clicks off, darkness, the next box switches on
    var DARK = solid(comp, P + "_LAMPOFF", [0, 0, 0]); span(DARK, B.input.t1 - .2, N0 + .02);
    keys(DARK.opacity, [{ t: B.input.t1 - .2, v: 0, o: 30 }, { t: B.input.t1 - .04, v: 100, i: 60 }]);
    // paper and lens over every box: pulp mottle (light through fibre), fine fibre grain, a gentle vignette
    var PU = solid(comp, P + "_PULP", [.5, .5, .5]), pf = fx(PU, "ADBE Fractal Noise"); pf.property("Contrast").setValue(130); pf.property("Scale").setValue(260); pf.property("Complexity").setValue(5);
    PU.blendingMode = BlendingMode.SOFT_LIGHT; PU.opacity.setValue(34);
    var FB = solid(comp, P + "_FIBRE", [.5, .5, .5], W * 2.2, H * 2.2, [W / 2, H / 2]), ff = fx(FB, "ADBE Fractal Noise");
    try { ff.property("Contrast").setValue(160); ff.property("Complexity").setValue(3); ff.property("Uniform Scaling").setValue(0);
      ff = FB.property("ADBE Effect Parade").property(1); ff.property("Scale Width").setValue(70); ff.property("Scale Height").setValue(14); } catch (e1) { notes.push("fibre: " + e1.toString()); }
    FB.scale.setValue([100 / 2.2, 100 / 2.2]); FB.blendingMode = BlendingMode.OVERLAY; FB.opacity.setValue(14);
    var VG = solid(comp, P + "_VIGNETTE", [0, 0, 0]), vm = VG.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
    vm.property("ADBE Mask Shape").setValue(ell(W / 2, H / 2, W * .62, H * .56)); vm.inverted = true; vm.property("ADBE Mask Feather").setValue([420, 420]); VG.opacity.setValue(55);
    // subtitles: a quiet burned-in serif line under the story, only where the words are not already paper in the picture
    var caps = [[B.picture, "Three pieces build one picture."], [B.input, "Here’s a real frame from my video."], [B.carry, "Then one thing becomes the next."]];
    for (var k = 0; k < caps.length; k++) { var cb = caps[k][0], CP = AESLib.text(comp, P + "_CAP" + k, caps[k][1], { family: FACE, style: "Medium", size: 52, color: CAP, pos: [W / 2, 1800] });
      span(CP, cb.t0 - .1, cb.t1); keys(CP.opacity, [{ t: cb.t0 - .1, v: 0, o: 30 }, { t: cb.t0 + .1, v: 100, i: 60, o: "H" }, { t: cb.t1 - .15, v: 100, o: 30 }, { t: cb.t1, v: 0, i: 60 }]);
      var cs = fx(CP, "ADBE Drop Shadow"); cs.property("Shadow Color").setValue(c4([0, 0, 0])); setPct(cs.property("Opacity"), 75);
      cs = CP.property("ADBE Effect Parade").property(1); cs.property("Direction").setValue(180); cs.property("Distance").setValue(3); cs.property("Softness").setValue(14); }
    var total = comp.numLayers; for (var ci = 0; ci < comps.length; ci++) total += comps[ci].numLayers;
    return { layers: total, notes: notes };
  }
  return { FACE: FACE, LADDERS: LADDERS, PALETTE: { light: LIGHT, moon: MOON, seal: SEAL, gold: GOLD, strip: STRIP, ink: INK, caption: CAP }, fontOK: fontOK, keys: keys,
    piece: piece, groupT: groupT, shot: shot, rig: rig, lamp: lamp, sheet: sheet, light: light, moon: moon, range: range, contours: contours, house: house,
    cloud: cloud, stars: stars, tree: tree, seal: seal, frameNodes: frameNodes, words: words, inkWidth: inkWidth, build: build, paperTitle: paperTitle,
    village: village, buildScene: buildScene };
})();
