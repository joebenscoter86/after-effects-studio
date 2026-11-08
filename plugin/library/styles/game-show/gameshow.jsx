// Game show style: brand-neutral ES3 helpers. No project mutation happens at load.
// Read styles/game-show/STYLE.md first. A rhythm-game variety show in flat vector: one fixed tempo grid, toy mascots (a bean body, mitten arms,
// one antenna) with one heavy ink outline, a candy set per round (stripes, polka dots or a sunburst over a darker floor band), fat outlined
// telops with hard offset shadows, things that drop from the sky and land on the beat, a judgement word on the round's last hit, a beat punch
// in the frame and a short white flash on every hard cut.
// Adapted from Lemo-Opuscar's game-show style (MIT, LemoLab); see assets/LICENSE-lemo-opuscar.txt.
var AESGameShow = (function () {
  var FAM = "Fredoka", BOLD = "Bold", SEMI = "SemiBold";
  var BPM = 138, BEAT = 60 / BPM, Q = BEAT / 2;                                                   // the grid: every event sits on a half beat of its round
  function hex(h) { return [parseInt(h.substr(0, 2), 16) / 255, parseInt(h.substr(2, 2), 16) / 255, parseInt(h.substr(4, 2), 16) / 255]; }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function c4(c) { return [c[0], c[1], c[2], 1]; }
  var INK = hex("1E1A2B"), WHITE = [1, 1, 1], CREAM = hex("FFF4DC"), PAPER = hex("F1DFB8"), MOUTH = hex("7A1F2B"), CHEEK = hex("FF8FB0");
  var CANDY = { yellow: hex("FFD23F"), orange: hex("FF8A3D"), red: hex("FF5A5F"), pink: hex("FF6FAE"), green: hex("2BB673"), lime: hex("A6E35A"),
    sky: hex("5BC0F0"), blue: hex("3D7BFF"), purple: hex("8E6CFF"), grey: hex("DADDE6") };
  // a set = one hue: ground, its pattern one step lighter, a darker floor band
  var SETS = {
    tangerine: { ground: hex("FFB870"), pattern: hex("FFA85A"), floor: hex("EE8A3C"), kind: "stripes" },
    teal: { ground: hex("19A7A0"), pattern: WHITE, floor: hex("0E7F79"), kind: "dots" },
    sky: { ground: hex("5BC0F0"), pattern: hex("86D3F6"), floor: hex("2E93C9"), kind: "burst" },
    navy: { ground: hex("26306E"), pattern: hex("FFC83D"), floor: hex("181F4C"), kind: "burst", patternOp: 22 },
    pink: { ground: hex("FF7EB6"), pattern: hex("FF99C7"), floor: hex("E05A97"), kind: "stripes" },
    lime: { ground: hex("8FD14F"), pattern: WHITE, floor: hex("66A831"), kind: "dots" },
    grape: { ground: hex("6B4FBB"), pattern: WHITE, floor: hex("4A3590"), kind: "dots" }
  };
  var FLOOR = 1500;                                                                               // the floor band's ink line (characters stand on it)

  function fontOK() { AESLib.font(FAM, BOLD); AESLib.font(FAM, SEMI); return true; }
  function grid(t, t0) { return t0 + Math.round((t - t0) / Q) * Q; }                            // snap an event to its round's half-beat grid
  function wordsIn(list, t0, t1) { var r = []; for (var i = 0; i < list.length; i++) if (list[i].s >= t0 - .05 && list[i].s < t1 - .02) r.push(list[i]); return r; }
  function fx(L, m) { return L.property("ADBE Effect Parade").addProperty(m); }
  function fxLast(L) { var E = L.property("ADBE Effect Parade"); return E.property(E.numProperties); }
  function n3(x) { return (Math.round(x * 1000) / 1000).toString(); }

  // ---- keys: list = [{ t, v, i, o }]; i / o are an influence (eased, zero speed), "L" linear or "H" hold. One setValuesAtTimes call.
  function easeArr(prop, inf) { var sp = prop.propertyValueType === PropertyValueType.TwoD_SPATIAL || prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL;
    var d = (!sp && prop.propertyValueType !== PropertyValueType.COLOR && prop.value instanceof Array) ? prop.value.length : 1, a = [];
    for (var n = 0; n < d; n++) a.push(new KeyframeEase(0, inf)); return a; }
  function kt(x) { if (x === "H") return KeyframeInterpolationType.HOLD; if (typeof x === "number") return KeyframeInterpolationType.BEZIER; return KeyframeInterpolationType.LINEAR; }
  function keys(prop, list) { var ts = [], vs = [], B = KeyframeInterpolationType.BEZIER;
    list.sort(function (a, b) { return a.t - b.t; });
    for (var j = 0; j < list.length; j++) { ts.push(list[j].t); vs.push(list[j].v); } prop.setValuesAtTimes(ts, vs);
    for (var k = 0; k < list.length; k++) { var ki = prop.nearestKeyIndex(list[k].t), a = list[k].i, b = list[k].o;
      prop.setInterpolationTypeAtKey(ki, B, B); prop.setTemporalEaseAtKey(ki, easeArr(prop, typeof a === "number" ? a : 33.3), easeArr(prop, typeof b === "number" ? b : 33.3));
      prop.setInterpolationTypeAtKey(ki, kt(a), kt(b)); }
    return prop; }
  function s2(L, s) { var v = L.scale.value, r = []; for (var i = 0; i < v.length; i++) r.push(v[i]); r[0] = s; r[1] = s; return r; }
  // a back-ease pop: nothing fades in, it is either off or popping (0 -> overshoot -> rest in about a third of a beat)
  function pop(L, t, s) { s = s || 100; keys(L.scale, [{ t: t, v: s2(L, 0), o: 30 }, { t: t + .12, v: s2(L, s * 1.16), i: 40, o: 40 }, { t: t + .22, v: s2(L, s * .97), i: 50, o: 50 }, { t: t + .3, v: s2(L, s), i: 70 }]);
    if (L.inPoint < t) L.inPoint = t; return L; }
  function span(L, t0, t1) { L.inPoint = t0; L.outPoint = t1; return L; }

  // ---- vector nodes: { k: "rect"|"ellipse"|"path"|"group", ... } drawn in order (later on top). fill / stroke (ink outline) per node.
  var KAPPA = .5523;
  function poly(pts, closed) { var s = new Shape(); s.vertices = pts; s.closed = closed !== false; return s; }
  function curve(pts, ins, outs, closed) { var s = new Shape(); s.vertices = pts; s.inTangents = ins; s.outTangents = outs; s.closed = closed !== false; return s; }
  // the bean: a dome on top, slightly narrower flat-ish base; origin at the feet's centre
  function bean(H, R) { return curve([[0, -H], [R, -.32 * H], [.8 * R, 0], [-.8 * R, 0], [-R, -.32 * H]],
    [[-.56 * R, 0], [0, -.42 * H], [.16 * R, -.1 * H], [.25 * R, 0], [0, .2 * H]],
    [[.56 * R, 0], [0, .2 * H], [-.25 * R, 0], [-.16 * R, -.1 * H], [0, -.42 * H]], true); }
  function star(n, ro, ri) { var p = []; for (var i = 0; i < 2 * n; i++) { var a = Math.PI * i / n - Math.PI / 2, r = i % 2 ? ri : ro; p.push([r * Math.cos(a), r * Math.sin(a)]); } return poly(p); }
  function emit(contents, nodes) {
    for (var i = nodes.length - 1; i >= 0; i--) { var n = nodes[i], g = contents.addProperty("ADBE Vector Group"); if (n.name) g.name = n.name;
      var tg = g.property("ADBE Vector Transform Group");
      if (n.pos) { tg.property("ADBE Vector Anchor").setValue(n.anchor || n.pos); tg.property("ADBE Vector Position").setValue(n.pos); }
      if (n.rot) tg.property("ADBE Vector Rotation").setValue(n.rot);
      if (n.op !== undefined) tg.property("ADBE Vector Group Opacity").setValue(n.op);
      var v = g.property("ADBE Vectors Group");
      if (n.k === "group") { emit(v, n.kids); continue; }
      if (n.k === "rect") { var s = v.addProperty("ADBE Vector Shape - Rect"); s.property("ADBE Vector Rect Size").setValue([n.w, n.h]);
        s.property("ADBE Vector Rect Position").setValue([n.x, n.y]); if (n.round) s.property("ADBE Vector Rect Roundness").setValue(n.round); }
      else if (n.k === "ellipse") { var e = v.addProperty("ADBE Vector Shape - Ellipse"); e.property("ADBE Vector Ellipse Size").setValue([n.w || 2 * n.r, n.h || 2 * n.r]); e.property("ADBE Vector Ellipse Position").setValue([n.x, n.y]); }
      else v.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(n.shape);
      if (n.stroke) { var st = v.addProperty("ADBE Vector Graphic - Stroke"); st.property("ADBE Vector Stroke Color").setValue(n.stroke); st.property("ADBE Vector Stroke Width").setValue(n.sw || 8);
        st.property("ADBE Vector Stroke Line Cap").setValue(2); st.property("ADBE Vector Stroke Line Join").setValue(2); }
      if (n.fill) { var fl = v.addProperty("ADBE Vector Graphic - Fill"); fl.property("ADBE Vector Fill Color").setValue(n.fill); if (n.fop !== undefined) fl.property("ADBE Vector Fill Opacity").setValue(n.fop); }
      if (n.rep) for (var r = 0; r < n.rep.length; r++) { var rp = v.addProperty("ADBE Vector Filter - Repeater"); rp.property("ADBE Vector Repeater Copies").setValue(n.rep[r][0]);
        rp.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue(n.rep[r][1]); }
    }
  }
  function shapeLayer(comp, name, nodes, pos) { var L = comp.layers.addShape(); L.name = name; emit(L.property("ADBE Root Vectors Group"), nodes);
    L.anchorPoint.setValue([0, 0]); L.position.setValue(pos || [0, 0]); return L; }
  function group(L, name) { return L.property("ADBE Root Vectors Group").property(name); }
  // a sticker / card / plate: the shape in ink offset down-right (the hard shadow), then the shape with its ink outline
  function plateNodes(w, h, fill, o) { o = o || {}; var d = o.shadow === undefined ? 12 : o.shadow, rd = o.round === undefined ? 26 : o.round;
    return [{ k: "rect", x: d, y: d, w: w, h: h, round: rd, fill: INK }, { k: "rect", x: 0, y: 0, w: w, h: h, round: rd, fill: fill, stroke: INK, sw: o.sw || 9 }]; }

  // ---- telops: Fredoka with an ink stroke under the fill (about 14 % of the size) and a hard offset shadow; anchored on its own centre
  function telop(comp, name, str, o) { var size = o.size, L = AESLib.text(comp, name, str, { family: FAM, style: o.style || BOLD, size: size, color: o.fill || WHITE, just: o.just || "center", leading: o.leading, tracking: o.tracking || 0 });
    var sp = L.property("Source Text"), td = sp.value;
    if (o.stroke !== false) { td.applyStroke = true; td.strokeColor = o.strokeColor || INK; td.strokeWidth = Math.round(size * (o.sk || .14)); td.strokeOverFill = false; sp.setValue(td); }
    var r = L.sourceRectAtTime(0, false); L.anchorPoint.setValue(o.anchor === "topleft" ? [r.left, r.top] : [r.left + r.width / 2, r.top + r.height / 2]);
    L.position.setValue([o.x, o.y]); if (o.rot) L.rotation.setValue(o.rot);
    if (o.shadow !== 0) { var ds = fx(L, "ADBE Drop Shadow"); ds = fxLast(L); ds.property("Shadow Color").setValue(c4(INK)); var op = ds.property("Opacity"); op.setValue(op.hasMax && op.maxValue > 100 ? 255 : 100);
      ds = fxLast(L); ds.property("Direction").setValue(135); ds.property("Distance").setValue(o.shadow || Math.max(5, Math.round(size * .07))); ds.property("Softness").setValue(0); }
    return { L: L, r: r }; }
  function textWidth(comp, str, size, style) { var T = AESLib.text(comp, "GAME_MEASURE", str, { family: FAM, style: style || BOLD, size: size, color: WHITE, just: "center" }), w = T.sourceRectAtTime(0, false).width; T.remove(); return w; }
  function fit(comp, str, size, maxW, style) { var w = textWidth(comp, str, size, style); return w > maxW ? size * maxW / w : size; }
  // titles are built glyph by glyph: an expression selector pops each character with a back ease, one after the other
  function glyphPop(L, t, step, dur) { var an = L.property("ADBE Text Properties").property("ADBE Text Animators").addProperty("ADBE Text Animator"); an.name = "POP";
    an.property("ADBE Text Animator Properties").addProperty("ADBE Text Scale 3D");
    an = L.property("ADBE Text Properties").property("ADBE Text Animators").property("POP"); an.property("ADBE Text Animator Properties").property("ADBE Text Scale 3D").setValue([0, 0, 0]);
    an.property("ADBE Text Selectors").addProperty("ADBE Text Expressible Selector");
    an = L.property("ADBE Text Properties").property("ADBE Text Animators").property("POP");
    an.property("ADBE Text Selectors").property(1).property("ADBE Text Expressible Amount").expression =
      "var p = (time - " + n3(t) + " - (textIndex - 1) * " + n3(step) + ") / " + n3(dur || .2) + "; var a = 100;\n" +
      "if (p >= 1) { a = 0; } else if (p > 0) { var s = 1.9, q = p - 1; a = 100 * (1 - (1 + (s + 1) * q * q * q + s * q * q)); }\n" +
      "var v = []; for (var i = 0; i < selectorValue.length; i++) v.push(a); v;";
    L.property("ADBE Text Properties").property("ADBE Text More Options").property("ADBE Text Anchor Point Align").setValue([0, -40]);
    return L; }

  // ---- the cast: one body construction, told apart by colour, a belly patch and the antenna ball. Origin at the feet.
  function mascotNodes(body, acc) { var H = 170, R = 78, dark = mix(body, INK, .25), light = mix(body, WHITE, .5);
    function arm(side) { var s = side, k = [{ k: "path", shape: poly([[0, 0], [s * 22, 44]], false), stroke: INK, sw: 32 }, { k: "path", shape: poly([[0, 0], [s * 22, 44]], false), stroke: dark, sw: 18 },
      { k: "ellipse", x: s * 24, y: 50, r: 16, fill: WHITE, stroke: INK, sw: 6 }];
      return { k: "group", name: s > 0 ? "ARM_R" : "ARM_L", pos: [s * .8 * R, -.42 * H], anchor: [0, 0], kids: k }; }
    var mc = { k: "path", shape: curve([[-12, -.47 * H], [12, -.47 * H]], [[0, 0], [-5, 9]], [[5, 9], [0, 0]], false), stroke: INK, sw: 6 };
    return [arm(-1), arm(1),
      { k: "path", shape: poly([[0, -H + 4], [0, -H - 34]], false), stroke: INK, sw: 7 }, { k: "ellipse", x: 0, y: -H - 42, r: 13, fill: acc, stroke: INK, sw: 6 },
      { k: "path", shape: bean(H, R), fill: body, stroke: INK, sw: 9 },
      { k: "ellipse", x: 0, y: -.2 * H, w: 1.0 * R, h: .42 * H, fill: light },
      { k: "ellipse", x: -.52 * R, y: -.5 * H, w: 24, h: 13, fill: CHEEK, fop: 75 }, { k: "ellipse", x: .52 * R, y: -.5 * H, w: 24, h: 13, fill: CHEEK, fop: 75 },
      { k: "ellipse", x: -.27 * R, y: -.64 * H, w: 18, h: 26, fill: INK }, { k: "ellipse", x: .27 * R, y: -.64 * H, w: 18, h: 26, fill: INK },
      { k: "ellipse", x: -.27 * R - 3, y: -.64 * H - 6, r: 4, fill: WHITE }, { k: "ellipse", x: .27 * R - 3, y: -.64 * H - 6, r: 4, fill: WHITE },
      { k: "group", name: "MOUTH_C", kids: [mc] },
      { k: "group", name: "MOUTH_O", op: 0, kids: [{ k: "ellipse", x: 0, y: -.45 * H, w: 26, h: 22, fill: MOUTH, stroke: INK, sw: 5 }] }]; }
  // the hop: a parabola-like bounce on every beat after it has landed (neighbours hop on the off-beat), with a damped squash on each contact
  function hopExpr(land, amp, phase) { return "var tt = time - " + n3(land) + " - " + n3(phase) + "; var v = value;\n" +
    "if (tt > 0) v = [value[0], value[1] - " + n3(amp) + " * Math.abs(Math.sin(Math.PI * tt / " + n3(BEAT) + "))];\nv;"; }
  function squashExpr(land, phase) { return "var s = 0, g = time - " + n3(land) + "; if (g >= 0 && g < .45) s += 20 * Math.exp(-g * 9) * Math.cos(g * 30);\n" +
    "var tt = time - " + n3(land) + " - " + n3(phase) + "; if (tt > 0) { var f = tt % " + n3(BEAT) + "; s += 7 * Math.exp(-f * 16) * Math.cos(f * 28); }\n" +
    "var v = value; v[0] = value[0] * (1 + s / 100); v[1] = value[1] * (1 - s / 100); v;"; }
  // a cast member or prop drops from the sky (ease-in) and lands exactly on its beat, then hops; o.shouts = [{ t, d }] (arms up + open mouth)
  function dropIn(L, x, y, land, o) { o = o || {}; var from = o.from === undefined ? -260 : o.from, fall = o.fall || .3;
    keys(L.position, [{ t: land - fall, v: [x, from], o: 70 }, { t: land, v: [x, y], i: "L", o: "H" }]); L.inPoint = land - fall;
    L.position.expression = hopExpr(land, o.amp === undefined ? 16 : o.amp, o.phase || 0); L.scale.expression = squashExpr(land, o.phase || 0); return L; }
  function shouts(L, list) { if (!list || !list.length) return L; var ar = [], al = [], mo = [], mc = [];
    ar.push({ t: 0, v: 0, i: "H", o: "H" }); al.push({ t: 0, v: 0, i: "H", o: "H" }); mo.push({ t: 0, v: 0, i: "H", o: "H" }); mc.push({ t: 0, v: 100, i: "H", o: "H" });
    for (var i = 0; i < list.length; i++) { var a = list[i].t, b = a + (list[i].d || Q);
      if (list[i].arms !== false) { ar.push({ t: a, v: -150, i: "H", o: "H" }, { t: b, v: 0, i: "H", o: "H" }); al.push({ t: a, v: 150, i: "H", o: "H" }, { t: b, v: 0, i: "H", o: "H" }); }
      mo.push({ t: a, v: 100, i: "H", o: "H" }, { t: b, v: 0, i: "H", o: "H" }); mc.push({ t: a, v: 0, i: "H", o: "H" }, { t: b, v: 100, i: "H", o: "H" }); }
    if (ar.length > 1) { keys(group(L, "ARM_R").property("ADBE Vector Transform Group").property("ADBE Vector Rotation"), ar); keys(group(L, "ARM_L").property("ADBE Vector Transform Group").property("ADBE Vector Rotation"), al); }
    keys(group(L, "MOUTH_O").property("ADBE Vector Transform Group").property("ADBE Vector Group Opacity"), mo);
    keys(group(L, "MOUTH_C").property("ADBE Vector Transform Group").property("ADBE Vector Group Opacity"), mc); return L; }
  function mascot(comp, name, body, acc, x, land, t1, o) { o = o || {}; var L = shapeLayer(comp, name, mascotNodes(body, acc), [x, FLOOR]);
    if (o.scale) L.scale.setValue(s2(L, o.scale)); dropIn(L, x, FLOOR + 4, land, o); shouts(L, o.shouts); L.outPoint = t1; return L; }
  // a name tag: an ink pill with white type
  function tag(comp, name, str, x, y, t, t1) { var T = telop(comp, name + "_T", str, { size: 40, fill: WHITE, stroke: false, shadow: 0, x: x, y: y }), w = T.r.width + 50;
    var P = shapeLayer(comp, name, [{ k: "rect", x: 0, y: 0, w: w, h: 64, round: 32, fill: INK, stroke: WHITE, sw: 4 }], [x, y]); T.L.moveBefore(P);
    T.L.parent = P; pop(P, t); span(T.L, t, t1); P.outPoint = t1; return P; }
  // the burst on a hit: a star, a ring and speed lines, gone in about two thirds of a beat
  function burst(comp, name, pos, t, color) { var k = [], i;
    for (i = 0; i < 8; i++) { var a = Math.PI * i / 4 + Math.PI / 8; k.push({ k: "path", shape: poly([[98 * Math.cos(a), 98 * Math.sin(a)], [150 * Math.cos(a), 150 * Math.sin(a)]], false), stroke: WHITE, sw: 10 }); }
    k.push({ k: "ellipse", x: 0, y: 0, r: 80, stroke: WHITE, sw: 8 }, { k: "path", shape: star(5, 66, 30), fill: color || CANDY.yellow, stroke: INK, sw: 7 });
    var L = shapeLayer(comp, name, k, pos); keys(L.scale, [{ t: t, v: s2(L, 25), o: 10 }, { t: t + .12, v: s2(L, 100), i: 80, o: 20 }, { t: t + .3, v: s2(L, 118), i: 10 }]);
    keys(L.rotation, [{ t: t, v: -20, o: 10 }, { t: t + .3, v: 10, i: 60 }]); span(L, t, t + .3); return L; }

  // ---- sets: the ground, its same-hue pattern (diagonal stripes, offset polka dots or a turning sunburst) and the floor band with its ink line
  function setLayers(comp, P, S, t0, t1, i) { var W = comp.width, H = comp.height, out = [], d = t1 - t0;
    var g = comp.layers.addSolid(S.ground, P + "_SET" + i + "_GROUND", W, H, 1); out.push(g);
    var pat;
    if (S.kind === "stripes") { pat = shapeLayer(comp, P + "_SET" + i + "_STRIPES", [{ k: "rect", x: -2800, y: 0, w: 74, h: 4600, fill: S.pattern, rep: [[42, [140, 0]]] }], [W / 2, H / 2]);
      pat.rotation.setValue(-35); keys(pat.position, [{ t: t0, v: [W / 2 - 70, H / 2], o: "L" }, { t: t1, v: [W / 2 + 70 * (1 + d), H / 2], i: "L" }]); }
    else if (S.kind === "dots") { var dn = { k: "ellipse", x: -540, y: -1000, r: 19, fill: S.pattern, fop: 24, rep: [[14, [100, 0]], [23, [0, 100]]] };
      pat = shapeLayer(comp, P + "_SET" + i + "_DOTS", [dn, { k: "group", pos: [50, 50], anchor: [0, 0], kids: [{ k: "ellipse", x: -540, y: -1000, r: 19, fill: S.pattern, fop: 24, rep: [[14, [100, 0]], [23, [0, 100]]] }] }], [W / 2, H / 2]);
      keys(pat.position, [{ t: t0, v: [W / 2, H / 2], o: "L" }, { t: t1, v: [W / 2 + 60 * d, H / 2 + 60 * d], i: "L" }]); }
    else { var wedges = [], R = 1800, n = 18; for (var k = 0; k < 2 * n; k += 2) { var a = Math.PI * k / n, b = Math.PI * (k + 1) / n; wedges.push([0, 0], [R * Math.cos(a), R * Math.sin(a)], [R * Math.cos(b), R * Math.sin(b)]); }
      var wn = []; for (var q = 0; q < wedges.length; q += 3) wn.push({ k: "path", shape: poly([wedges[q], wedges[q + 1], wedges[q + 2]]), fill: S.pattern, fop: S.patternOp === undefined ? 100 : S.patternOp });
      pat = shapeLayer(comp, P + "_SET" + i + "_BURST", wn, [W / 2, 820]); keys(pat.rotation, [{ t: t0, v: 0, o: "L" }, { t: t1, v: 14 * d, i: "L" }]); }
    out.push(pat);
    var fl = shapeLayer(comp, P + "_SET" + i + "_FLOOR", [{ k: "rect", x: W / 2, y: (FLOOR + H) / 2 + 20, w: W + 40, h: H - FLOOR + 40, fill: S.floor }, { k: "rect", x: W / 2, y: FLOOR, w: W + 40, h: 10, fill: INK }]);
    out.push(fl);
    for (var j = 0; j < out.length; j++) span(out[j], t0, t1);
    return out; }
  // the finale's curtain valance: a red band with a scalloped hem and an ink outline
  function valance(comp, name, t0, t1) { var W = comp.width, n = 8, step = (W + 80) / n, v = [[-40, -40], [W + 40, -40]], ins = [[0, 0], [0, 0]], outs = [[0, 0], [0, 0]];
    for (var i = 0; i <= n; i++) { v.push([W + 40 - i * step, 150]); ins.push([0, i === 0 ? 0 : 70]); outs.push([0, i === n ? 0 : 70]); }
    return span(shapeLayer(comp, name, [{ k: "path", shape: curve(v, ins, outs, true), fill: CANDY.red, stroke: INK, sw: 9 }]), t0, t1); }
  // confetti: small candy rectangles falling and turning (expressions on each piece's transform, a pure function of time)
  function confetti(comp, name, t0, t1, seed) { var R = seed || 7, rnd = function () { R = (R * 9301 + 49297) % 233280; return R / 233280; }, cols = [CANDY.yellow, CANDY.pink, CANDY.sky, CANDY.lime, WHITE, CANDY.orange], nodes = [], i;
    for (i = 0; i < 46; i++) nodes.push({ k: "group", name: "C" + i, pos: [0, 0], anchor: [0, 0], kids: [{ k: "rect", x: 0, y: 0, w: 16, h: 30, fill: cols[i % cols.length] }] });
    var L = shapeLayer(comp, name, nodes, [0, 0]);
    for (i = 0; i < 46; i++) { var tg = group(L, "C" + i).property("ADBE Vector Transform Group"), x = rnd() * comp.width, y = -60 - rnd() * 900, sp = 420 + rnd() * 380, w = 2 + rnd() * 4, ph = rnd() * 6, rs = (rnd() - .5) * 720;
      tg.property("ADBE Vector Position").expression = "var t = time - " + n3(t0) + "; [" + n3(x) + " + 26 * Math.sin(t * " + n3(w) + " + " + n3(ph) + "), " + n3(y) + " + " + n3(sp) + " * t];";
      group(L, "C" + i).property("ADBE Vector Transform Group").property("ADBE Vector Rotation").expression = "(time - " + n3(t0) + ") * " + n3(rs) + " + " + n3(ph * 40) + ";"; }
    return span(L, t0, t1); }

  // buildScene: the shared test scene (the library's seven-beat test scene) as a seven-round game show. comp = an empty 1080 x 1920 comp at scene.fps.
  // Each beat is a round in its own set, hard-cut with a white flash; a corner banner names the round; cast and props drop in on the grid and hop;
  // the subtitles are telops on the floor band. The real frame is a polaroid card that pops in, comes back as a thumbnail in the round ribbon,
  // grows out of its slot and stays as the finale's card under a "Perfect!" while the crowd drops in.
  function buildScene(comp, scene, opts) {
    fontOK(); var P = opts.prefix || "GAME", A = opts.assets, B = scene.beat, W = comp.width, H = comp.height, WL = scene.wordList, fr = comp.frameDuration, notes = [];
    AESLib.clearOwned(comp, P);
    var R = [
      { id: "title", set: "tangerine", name: "EVERY STYLE" }, { id: "picture", set: "teal", name: "3 PIECES" }, { id: "input", set: "sky", name: "REAL FRAME" },
      { id: "number", set: "navy", name: "THE COUNT" }, { id: "line", set: "pink", name: "TYPE IT" }, { id: "carry", set: "lime", name: "CARRY" }, { id: "end", set: "grape", name: "FINALE" }];
    var i, k, hits = [];
    for (k = 0; k < R.length; k++) { R[k].t0 = B[R[k].id].t0; R[k].t1 = B[R[k].id].t1; R[k].S = SETS[R[k].set]; R[k].w = wordsIn(WL, R[k].t0, R[k].t1); if (k) hits.push({ t: R[k].t0, a: 3 }); }
    var END = comp.duration;
    function hit(t, a) { hits.push({ t: t, a: a }); }
    // 1. the sets, one per round
    for (k = 0; k < R.length; k++) setLayers(comp, P, R[k].S, R[k].t0, R[k].t1, k);
    var rE = R[6], rC = R[5], rI = R[2];
    valance(comp, P + "_VALANCE", rE.t0, END);
    // 2. the round ribbon (carry): one slot per round in its set's hue, popping in a quarter beat apart; the third slot holds the card's thumbnail
    var slotY = 1330, slotX = [], slotT = rC.t0;
    for (k = 0; k < 6; k++) { var sx = W / 2 + (k - 2.5) * 158; slotX.push(sx);
      var SL = shapeLayer(comp, P + "_SLOT" + k, plateNodes(128, 128, k === 2 ? INK : R[k].S.ground, { round: 22, shadow: 9, sw: 8 }), [sx, slotY]);
      if (k !== 2) { var SN = telop(comp, P + "_SLOTN" + k, String(k + 1), { size: 70, x: sx, y: slotY + 4, shadow: 4 }); SN.L.parent = SL; span(SN.L, slotT + k * Q / 2, rC.t1); }
      pop(SL, slotT + k * Q / 2, 100); SL.outPoint = rC.t1; }                                          // parent first, then pop (a parent keyed from scale 0 swallows its children)
    // 3. the card: the real frame as a polaroid (cream border, ink outline, a caption strip), one precomp layer carried across three rounds
    var fw = 760, fh = 540, bd = 26, cw = fw + 2 * bd, ch = fh + bd + 104;
    var CC = app.project.items.addComp(P + "_CARD", cw, ch, 1, comp.duration, 1 / fr);
    var ph = CC.layers.add(AESLib.importFile(A.frame)); ph.name = P + "_PHOTO"; ph.position.setValue([cw / 2, bd + fh / 2]);
    var pl = shapeLayer(CC, P + "_PHOTOLINE", [{ k: "rect", x: cw / 2, y: bd + fh / 2, w: fw, h: fh, stroke: INK, sw: 6 }]);
    var cap = telop(CC, P + "_CAPTION", "FRAME 135", { size: 58, style: BOLD, fill: INK, stroke: false, shadow: 0, x: cw / 2, y: bd + fh + 52 });
    var paper = shapeLayer(CC, P + "_PAPER", [{ k: "rect", x: cw / 2, y: ch / 2, w: cw - 10, h: ch - 10, round: 18, fill: CREAM, stroke: INK, sw: 10 }]); paper.moveToEnd();
    var card = comp.layers.add(CC); card.name = P + "_CARD"; card.anchorPoint.setValue([cw / 2, ch / 2]);
    var cds = fx(card, "ADBE Drop Shadow"); cds = fxLast(card); cds.property("Shadow Color").setValue(c4(INK)); var cop = cds.property("Opacity"); cop.setValue(cop.hasMax && cop.maxValue > 100 ? 255 : 100);
    cds = fxLast(card); cds.property("Direction").setValue(135); cds.property("Distance").setValue(16); cds.property("Softness").setValue(0);
    var cIn = rI.t0, cMid = [W / 2, 800], thumb = 120 / cw * 100, grow = grid(rC.w.length > 3 ? rC.w[3].s : rC.t0 + .5, rC.t0), endS = 82;
    var tTh = slotT + Q;                                                                             // the thumbnail pops with its slot (the third, a half beat in)
    keys(card.scale, [{ t: cIn, v: [0, 0], o: 30 }, { t: cIn + .12, v: [116, 116], i: 40, o: 40 }, { t: cIn + .22, v: [97, 97], i: 50, o: 50 }, { t: cIn + .3, v: [100, 100], i: 70, o: "H" },
      { t: tTh, v: [0, 0], i: "H", o: 30 }, { t: tTh + .12, v: [thumb * 1.3, thumb * 1.3], i: 40, o: 40 }, { t: tTh + .24, v: [thumb, thumb], i: 60, o: "H" },
      { t: grow, v: [thumb, thumb], i: "H", o: 82 }, { t: grow + BEAT, v: [endS, endS], i: 82, o: "H" }]);
    keys(card.position, [{ t: cIn, v: cMid, o: "H" }, { t: tTh, v: [slotX[2], slotY], i: "H", o: "H" }, { t: grow, v: [slotX[2], slotY], i: "H", o: 82 }, { t: grow + BEAT, v: cMid, i: 82, o: "H" }]);
    keys(card.rotation, [{ t: cIn, v: -4, o: "H" }, { t: tTh, v: 0, i: "H", o: "H" }, { t: grow, v: 0, i: "H", o: 82 }, { t: grow + BEAT, v: 3, i: 82, o: "H" }]);
    keys(card.opacity, [{ t: cIn, v: 100, o: "H" }, { t: rI.t1, v: 0, i: "H", o: "H" }, { t: tTh, v: 100, i: "H", o: "H" }]);
    card.inPoint = cIn; card.outPoint = END; hit(cIn + .12, 2.5); hit(grow + BEAT, 2);
    burst(comp, P + "_BURSTC", [slotX[2], slotY], grow, CANDY.yellow);
    // 4. round 1: the title. A blue mascot drops onto an empty stage, the hero line pops glyph by glyph, the mascot shouts on the last word
    var r0 = R[0], heroT = r0.w.length > 2 ? r0.w[2].s : .44, wayT = r0.w.length > 5 ? r0.w[5].s : 1.0;
    burst(comp, P + "_BURST0", [W / 2, FLOOR - 30], grid(.43, 0), CANDY.yellow);
    mascot(comp, P + "_HOST", CANDY.blue, CANDY.yellow, W / 2, grid(.43, 0), r0.t1, { scale: 200, amp: 26, shouts: [{ t: grid(wayT, 0), d: .3 }] }); hit(grid(.43, 0), 2);
    var hero = B.title.hero, hs = fit(comp, "starts the", 190, 960), hw = hero.split(" ");
    var H1 = telop(comp, P + "_HERO", hw.slice(0, 2).join(" ") + "\r" + hw.slice(2).join(" "), { size: hs, fill: CANDY.yellow, x: W / 2, y: 760, leading: hs * 1.02, shadow: 12 });
    glyphPop(H1.L, heroT, .035, .22); span(H1.L, 0, r0.t1);
    var CTX = telop(comp, P + "_CONTEXT", B.title.context, { size: 96, fill: WHITE, x: W / 2, y: 470, rot: -4, shadow: 8 }); glyphPop(CTX.L, .05, .03, .2); span(CTX.L, 0, r0.t1);
    // 5. round 2: three pieces drop from the sky, one per word, each landing on the grid with a burst, then all hop together
    var r1 = R[1], lands = [], objs = B.picture.objects;
    for (i = 0; i < 3; i++) lands.push(r1.t0 + (1 + 2 * i) * Q);                                       // one piece per beat, a half beat after the cut
    var picT = lands[2] + Q, px = [200, 540, 875];
    for (i = 0; i < 3; i++) { burst(comp, P + "_BURST1" + i, [px[i], FLOOR - 40], lands[i], [CANDY.yellow, CANDY.pink, CANDY.lime][i]); hit(lands[i], 2); }
    mascot(comp, P + "_PERSON", CANDY.orange, CANDY.pink, px[0], lands[0], r1.t1, { scale: 165, amp: 20, phase: 0, shouts: [{ t: picT, d: .35 }] });
    var doc = shapeLayer(comp, P + "_DOCUMENT", [{ k: "path", shape: poly([[-100 + 12, -270 + 12], [58 + 12, -270 + 12], [100 + 12, -228 + 12], [100 + 12, 12], [-100 + 12, 12]]), fill: INK },
      { k: "path", shape: poly([[-100, -270], [58, -270], [100, -228], [100, 0], [-100, 0]]), fill: CREAM, stroke: INK, sw: 9 },
      { k: "path", shape: poly([[58, -270], [58, -228], [100, -228]]), fill: PAPER, stroke: INK, sw: 6 },
      { k: "path", shape: poly([[-62, -214], [20, -214]], false), stroke: CANDY.red, sw: 16 }, { k: "path", shape: poly([[-62, -166], [62, -166]], false), stroke: INK, sw: 11 },
      { k: "path", shape: poly([[-62, -128], [62, -128]], false), stroke: INK, sw: 11 }, { k: "path", shape: poly([[-62, -90], [40, -90]], false), stroke: INK, sw: 11 },
      { k: "rect", x: 0, y: -42, w: 124, h: 34, round: 10, fill: CANDY.sky, stroke: INK, sw: 5 }], [px[1], FLOOR]);
    doc.scale.setValue(s2(doc, 135)); dropIn(doc, px[1], FLOOR + 4, lands[1], { amp: 16, phase: Q, from: -420 }); doc.outPoint = r1.t1;
    var dev = shapeLayer(comp, P + "_DEVICE", [{ k: "rect", x: 12, y: -165 + 12, w: 184, h: 330, round: 34, fill: INK },
      { k: "rect", x: 0, y: -165, w: 184, h: 330, round: 34, fill: CANDY.blue, stroke: INK, sw: 9 }, { k: "rect", x: 0, y: -182, w: 142, h: 236, round: 14, fill: CREAM, stroke: INK, sw: 6 },
      { k: "path", shape: poly([[-20, -214], [-20, -150], [32, -182]]), fill: CANDY.red, stroke: INK, sw: 6 }, { k: "ellipse", x: 0, y: -34, r: 13, fill: WHITE, stroke: INK, sw: 5 }], [px[2], FLOOR]);
    dev.scale.setValue(s2(dev, 135)); dropIn(dev, px[2], FLOOR + 4, lands[2], { amp: 16, phase: 0, from: -480 }); dev.outPoint = r1.t1;
    for (i = 0; i < 3; i++) tag(comp, P + "_TAG" + i, objs[i].toUpperCase(), px[i], FLOOR + 74, lands[i] + .06, r1.t1);
    hit(picT, 2.5);
    // 6. round 3: the real frame pops in on the cut (back ease, a tilt), a sticker slaps on "real", a snap zoom holds the card for one beat
    var r2 = R[2], realT = r2.w.length > 2 ? grid(r2.w[2].s, r2.t0) : r2.t0 + Q;
    mascot(comp, P + "_POINTER", CANDY.yellow, CANDY.red, 170, r2.t0 + Q, r2.t1, { scale: 150, amp: 18, shouts: [{ t: realT, d: BEAT }] });
    var stk = shapeLayer(comp, P + "_STICKER", plateNodes(300, 112, CANDY.pink, { round: 56, shadow: 10 }), [800, 470]); stk.rotation.setValue(9);
    var stT = telop(comp, P + "_STICKER_T", "REAL!", { size: 84, fill: WHITE, x: 800, y: 470, shadow: 0 }); stT.L.rotation.setValue(9); stT.L.parent = stk;
    pop(stk, realT, 100); stk.outPoint = r2.t1; span(stT.L, realT, r2.t1); hit(realT, 3);
    // 7. round 4: the count. A scoreboard with chasing bulbs, the counter races to the number, a label plate, then a judgement word
    var r3 = R[3], cntT = r3.t0 + Q, cntEnd = r3.w.length > 1 ? grid(r3.w[1].s, r3.t0) : r3.t0 + 3 * Q, judT = r3.w.length > 2 ? grid(r3.w[2].s, r3.t0) : r3.t1 - .4;
    var board = shapeLayer(comp, P + "_BOARD", plateNodes(880, 500, INK, { round: 40, shadow: 14 }).concat([{ k: "rect", x: 0, y: 0, w: 830, h: 450, round: 26, stroke: CANDY.yellow, sw: 6 }]), [W / 2, 780]);
    pop(board, r3.t0, 100); board.outPoint = r3.t1;
    var bulbs = []; for (i = 0; i < 12; i++) { bulbs.push({ k: "group", name: "B" + i, kids: [{ k: "ellipse", x: -385 + i * 70, y: -250, r: 14, fill: i % 2 ? WHITE : CANDY.yellow, stroke: INK, sw: 4 }] });
      bulbs.push({ k: "group", name: "D" + i, kids: [{ k: "ellipse", x: -385 + i * 70, y: 250, r: 14, fill: i % 2 ? CANDY.yellow : WHITE, stroke: INK, sw: 4 }] }); }
    var BL = shapeLayer(comp, P + "_BULBS", bulbs, [W / 2, 780]); pop(BL, r3.t0, 100);
    for (i = 0; i < 12; i++) { var be = "Math.floor((time - " + n3(r3.t0) + ") / " + n3(Q) + " + " + i + ") % 2 == 0 ? 100 : 30;";
      group(BL, "B" + i).property("ADBE Vector Transform Group").property("ADBE Vector Group Opacity").expression = be;
      group(BL, "D" + i).property("ADBE Vector Transform Group").property("ADBE Vector Group Opacity").expression = be; }
    BL.outPoint = r3.t1;
    var NUM = telop(comp, P + "_COUNT", String(B.number.value), { size: 300, fill: CANDY.yellow, x: W / 2, y: 740, stroke: false, shadow: 0 });
    var roll = [], nf = Math.max(4, Math.round((cntEnd - cntT) / fr)); for (i = 0; i <= nf; i++) { var p = i / nf, v = Math.round(B.number.value * (1 - Math.pow(2, -9 * p)) / (1 - Math.pow(2, -9))); if (i === nf) v = B.number.value; roll.push(("00" + v).slice(-3)); }
    AESLib.bakeText(NUM.L, roll, 1 / fr, cntT); span(NUM.L, cntT, r3.t1); hit(cntEnd, 3);
    var lab = shapeLayer(comp, P + "_LABEL", plateNodes(330, 92, WHITE, { round: 46, shadow: 0, sw: 7 }), [W / 2, 948]);
    var labT = telop(comp, P + "_LABEL_T", B.number.label.toUpperCase(), { size: 60, fill: INK, stroke: false, shadow: 0, x: W / 2, y: 950 }); labT.L.parent = lab;
    pop(lab, cntEnd, 100); lab.outPoint = r3.t1; span(labT.L, cntEnd, r3.t1);
    var J1 = telop(comp, P + "_JUDGE1", "Counted!", { size: 150, fill: CANDY.pink, x: W / 2 - 10, y: 1170, rot: -8, shadow: 12 }); pop(J1.L, judT, 100); J1.L.outPoint = r3.t1; hit(judT, 3);
    burst(comp, P + "_BURST3", [W / 2 + 390, 1040], judT, CANDY.yellow);
    mascot(comp, P + "_FAN1", CANDY.green, CANDY.yellow, 150, r3.t0 + Q, r3.t1, { scale: 150, amp: 18, phase: 0, shouts: [{ t: judT, d: .3 }] });
    mascot(comp, P + "_FAN2", CANDY.orange, CANDY.sky, 930, r3.t0 + 2 * Q, r3.t1, { scale: 150, amp: 18, phase: Q, shouts: [{ t: judT, d: .3 }] });
    // 8. round 5: call and response. The mascot shouts every word into a speech bubble and the word is typed there, a character a frame
    var r4 = R[4], bub = shapeLayer(comp, P + "_BUBBLE", [{ k: "path", shape: poly([[-260 + 12, 230 + 12], [-130 + 12, 230 + 12], [-330 + 12, 420 + 12]]), fill: INK }]
      .concat(plateNodes(900, 520, CREAM, { round: 60, shadow: 14 })).concat([{ k: "path", shape: poly([[-270, 240], [-120, 240], [-330, 420]]), fill: CREAM, stroke: INK, sw: 9 },
      { k: "rect", x: -209, y: 250, w: 118, h: 24, fill: CREAM }]), [580, 760]);
    pop(bub, r4.t0, 100); bub.outPoint = r4.t1;
    var full = "Every word\rI say gets\rtyped.", ts0 = fit(comp, "I say gets", 124, 760, SEMI);
    var TY = telop(comp, P + "_TYPED", full, { size: ts0, style: SEMI, fill: INK, stroke: false, shadow: 0, just: "left", anchor: "topleft", leading: ts0 * 1.12, x: 220, y: 560 });
    var times = [r4.t0], strs = [" "], at = 0;
    for (i = 0; i < r4.w.length; i++) { var wd = r4.w[i].text, idx = full.indexOf(wd, at); if (idx < 0) continue; at = idx + wd.length;
      for (var c = 0; c < wd.length; c++) { var tt = r4.w[i].s + c * fr; if (tt <= times[times.length - 1]) tt = times[times.length - 1] + fr / 2; times.push(tt); strs.push(full.substr(0, idx + c + 1)); }
      hit(r4.w[i].s, 1.2); }
    AESLib.textKeys(TY.L, times, strs); span(TY.L, r4.t0, r4.t1);
    var sh = []; for (i = 0; i < r4.w.length; i++) sh.push({ t: r4.w[i].s, d: .16, arms: i === r4.w.length - 1 });
    mascot(comp, P + "_CALLER", CANDY.purple, CANDY.lime, 220, r4.t0 + Q / 2, r4.t1, { scale: 150, amp: 14, shouts: sh });
    // 9. round 7: the finale. The card holds centre stage, the crowd drops in one per half beat with a pitched pop each, "Perfect!" pops at an
    // angle on the last word with confetti, everyone shouts
    var testT = (rE.w.length > 2 ? grid(rE.w[2].s, rE.t0) : rE.t1 - 1) + Q, cx = [130, 330, 540, 750, 950], cc = [CANDY.blue, CANDY.green, CANDY.orange, CANDY.yellow, CANDY.pink], ca = [CANDY.yellow, CANDY.pink, CANDY.sky, CANDY.red, CANDY.lime];
    for (i = 0; i < 5; i++) { var lt = rE.t0 + (i + 1) * Q / 2; mascot(comp, P + "_CROWD" + i, cc[i], ca[i], cx[i], lt, END, { amp: 18, phase: i % 2 ? Q : 0, scale: 112, shouts: [{ t: testT, d: .45 }] }); }
    confetti(comp, P + "_CONFETTI", testT, END, 11);
    var J2 = telop(comp, P + "_JUDGE2", "Perfect!", { size: 210, fill: CANDY.yellow, x: W / 2, y: 410, rot: -8, shadow: 14 }); pop(J2.L, testT, 100); J2.L.outPoint = END; hit(testT, 3.5);
    burst(comp, P + "_BURST6", [W / 2 + 370, 330], testT, CANDY.pink);
    var zl = comp.layers.addSolid(WHITE, P + "_ZOOM", W, H, 1); zl.adjustmentLayer = true; fx(zl, "ADBE Geometry2");   // the snap zoom: under the telops and banners
    // 10. the telops: each round's spoken line on the floor band (the line round's bubble is its own telop, the title is its own card)
    for (k = 1; k < R.length; k++) { if (R[k].id === "line") continue; var str = "", ww = R[k].w; for (i = 0; i < ww.length; i++) str += (i ? " " : "") + ww[i].text;
      if (R[k].id === "number") str = B.number.value + " frames, counted.";
      var ts = fit(comp, str, 70, 960), TL = telop(comp, P + "_TELOP" + k, str, { size: ts, fill: WHITE, x: W / 2, y: 1770, shadow: 6 }); pop(TL.L, R[k].t0 + .03, 100); TL.L.outPoint = k === R.length - 1 ? END : R[k].t1; }
    // 11. the corner banner: a red sticker naming the round, popping on every cut
    for (k = 0; k < R.length; k++) { var rk = R[k], top = 96, left = 46, a1 = telop(comp, P + "_BAN" + k + "_N", "ROUND " + (k + 1), { size: 44, fill: CANDY.yellow, x: 0, y: 0, shadow: 0 });
      var a2 = telop(comp, P + "_BAN" + k + "_T", rk.name, { size: 78, fill: WHITE, x: 0, y: 0, shadow: 0 }), bw = Math.max(a1.r.width, a2.r.width) + 70, bh = a1.r.height + a2.r.height + 44;
      var bx = left + bw / 2, by = top + bh / 2, ban = shapeLayer(comp, P + "_BAN" + k, plateNodes(bw, bh, rk.id === "end" ? CANDY.pink : CANDY.red, { round: 24, shadow: 12 }), [bx, by]);
      a1.L.position.setValue([bx, top + 22 + a1.r.height / 2]); a2.L.position.setValue([bx, top + 22 + a1.r.height + a2.r.height / 2 + 2]); a1.L.moveBefore(ban); a2.L.moveBefore(ban);
      a1.L.parent = ban; a2.L.parent = ban; ban.rotation.setValue(-3); pop(ban, rk.t0 + (k ? 0 : .02), 100);
      var bt1 = k === R.length - 1 ? END : rk.t1; ban.outPoint = bt1; span(a1.L, rk.t0, bt1); span(a2.L, rk.t0, bt1); }
    // 12. the white flash on every hard cut (two frames), then the beat punch and one snap zoom in a top adjustment layer
    var fl = comp.layers.addSolid(WHITE, P + "_FLASH", W, H, 1), fk = [{ t: 0, v: 0, i: "H", o: "H" }];
    for (k = 1; k < R.length; k++) fk.push({ t: R[k].t0, v: 75, i: "H", o: "H" }, { t: R[k].t0 + 2 * fr, v: 0, i: "H", o: "H" }); keys(fl.opacity, fk);
    var cam = comp.layers.addSolid(WHITE, P + "_CAMERA", W, H, 1); cam.adjustmentLayer = true;
    fx(cam, "ADBE Geometry2");
    hits.sort(function (a, b) { return a.t - b.t; }); var keep = [];
    for (i = 0; i < hits.length; i++) { if (keep.length && hits[i].t - keep[keep.length - 1].t < .17) { if (hits[i].a > keep[keep.length - 1].a) keep[keep.length - 1] = hits[i]; continue; } keep.push(hits[i]); }
    var pk = [{ t: 0, v: 100, o: "L" }];
    for (i = 0; i < keep.length; i++) { var h0 = keep[i].t; if (h0 < fr) continue; pk.push({ t: h0 - fr, v: 100, i: "L", o: "L" }, { t: h0, v: 100 + keep[i].a, i: "L", o: 70 }, { t: Math.min(h0 + .16, (i + 1 < keep.length ? keep[i + 1].t - fr - .001 : h0 + .16)), v: 100, i: 70, o: "L" }); }
    var clean = [pk[0]]; for (i = 1; i < pk.length; i++) if (pk[i].t > clean[clean.length - 1].t + .001) clean.push(pk[i]);
    keys(cam.property("ADBE Effect Parade").property(1).property("ADBE Geometry2-0003"), clean);
    var Z = zl.property("ADBE Effect Parade").property(1), zEnd = realT + BEAT, zp = [W / 2, 800];
    Z.property("ADBE Geometry2-0001").setValue(zp);
    Z = zl.property("ADBE Effect Parade").property(1); keys(Z.property("ADBE Geometry2-0002"), [{ t: 0, v: [W / 2, 800], i: "H", o: "H" }, { t: realT, v: [W / 2, 860], i: "H", o: "H" }, { t: zEnd, v: [W / 2, 800], i: "H", o: "H" }]);
    Z = zl.property("ADBE Effect Parade").property(1); keys(Z.property("ADBE Geometry2-0003"), [{ t: 0, v: 100, i: "H", o: "H" }, { t: realT, v: 122, i: "H", o: "H" }, { t: zEnd, v: 100, i: "H", o: "H" }]);
    return { layers: comp.numLayers, notes: notes };
  }
  return { FAM: FAM, BPM: BPM, BEAT: BEAT, INK: INK, CANDY: CANDY, SETS: SETS, fontOK: fontOK, grid: grid, keys: keys, pop: pop, emit: emit, shapeLayer: shapeLayer, plateNodes: plateNodes,
    telop: telop, fit: fit, glyphPop: glyphPop, mascotNodes: mascotNodes, mascot: mascot, dropIn: dropIn, shouts: shouts, tag: tag, burst: burst, setLayers: setLayers,
    valance: valance, confetti: confetti, wordsIn: wordsIn, buildScene: buildScene };
})();
