// Rubber hose style: brand-neutral ES3 helpers. No project mutation happens at load.
// Read styles/rubber-hose/STYLE.md first. A 1930s black-and-white hand-inked cartoon as it looks projected: a living clapperboard with
// rubber-hose limbs (equal-width tubes, no elbows), white four-finger gloves, pie eyes and big shoes, squashing and stretching on a fixed
// beat in front of a soft grey painted room, every drawing on twos (12 fps) with a light line boil, inside a rounded gate on a worn print
// (flicker, weave, a jump on every cut, scratches, dust, a hair, a vignette). Words are period cards: fat outlined script titles that hop
// in a travelling wave, Limelight sub-lines, and a near-black singalong card with a bouncing ball.
// Adapted from Lemo-Opuscar's rubber-hose style (MIT, LemoLab); see library/styles/LICENSE-lemo-opuscar.txt.
var AESRubberHose = (function () {
  var SCRIPT = "Shrikhand", DECO = "Limelight", CARD = "IM FELL English SC";
  function g(v) { return [v, v, v]; }
  var INK = g(.06), WHITE = g(.97);
  var PALETTE = { ink: INK, white: WHITE, plate: g(.085), wall: g(.64), stripe: g(.6), motif: g(.52), wood: g(.47), dark: g(.36), floorA: g(.6), floorB: g(.4),
    line: g(.3), shadow: g(.82), blush: g(.84), house: g(.012), printBlack: [.055, .05, .045], printWhite: [.95, .935, .9] };
  var TWOS = 12, BPS = 2;                                       // drawings on twos; one beat every 0.5 s (12 drawings at 24 fps)
  var PERFRAME = "seedRandom(timeToFrames(time), true); ";
  function n3(x) { return String(Math.round(x * 1000) / 1000); }
  function fontOK() { AESLib.font(SCRIPT, "Regular"); AESLib.font(DECO, "Regular"); AESLib.font(CARD, "Regular"); return true; }

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
      prop.setInterpolationTypeAtKey(ki, kt(a), kt(b));
      if (prop.isSpatial) { try { prop.setSpatialTangentsAtKey(ki, [0, 0], [0, 0]); } catch (e) {} } }
    return prop; }
  function fx(L, match) { L.property("ADBE Effect Parade").addProperty(match); var EP = L.property("ADBE Effect Parade"); return EP.property(EP.numProperties); }
  function span(L, t0, t1) { L.inPoint = t0; L.outPoint = t1; return L; }      // in before out: setting inPoint after outPoint loses the out point
  function solid(comp, name, color, w, h, pos) { var L = comp.layers.addSolid(color, name, w || comp.width, h || comp.height, 1); if (pos) L.position.setValue(pos); return L; }

  // ---- shapes: { k: "poly"|"line"|"rect"|"ellipse"|"circle"|"path"|"group", ..., fill (grey value or rgb, or null), sw (stroke width), sc (stroke colour) }
  var KAPPA = .5523;
  function poly(pts, closed) { var s = new Shape(); s.vertices = pts; s.closed = closed !== false; return s; }
  function ell(cx, cy, rx, ry) { var a = KAPPA * rx, b = KAPPA * ry, s = new Shape(); s.vertices = [[cx, cy - ry], [cx + rx, cy], [cx, cy + ry], [cx - rx, cy]];
    s.inTangents = [[-a, 0], [0, -b], [a, 0], [0, b]]; s.outTangents = [[a, 0], [0, b], [-a, 0], [0, -b]]; s.closed = true; return s; }
  function rrect(x, y, w, h, r) { var k = (1 - KAPPA) * r, s = new Shape();
    s.vertices = [[x + r, y], [x + w - r, y], [x + w, y + r], [x + w, y + h - r], [x + w - r, y + h], [x + r, y + h], [x, y + h - r], [x, y + r]];
    s.inTangents = [[-r + k, 0], [0, 0], [0, -r + k], [0, 0], [r - k, 0], [0, 0], [0, r - k], [0, 0]];
    s.outTangents = [[0, 0], [r - k, 0], [0, 0], [0, r - k], [0, 0], [-r + k, 0], [0, 0], [0, -r + k]]; s.closed = true; return s; }
  // a smooth curve through points (Catmull-Rom tangents)
  function smooth(pts, closed, k) { var s = new Shape(), n = pts.length, ti = [], to = []; k = k === undefined ? .5 : k;
    for (var i = 0; i < n; i++) { var p0 = pts[i - 1 < 0 ? (closed ? n - 1 : 0) : i - 1], p1 = pts[i + 1 >= n ? (closed ? 0 : n - 1) : i + 1];
      var d = [(p1[0] - p0[0]) * k / 2, (p1[1] - p0[1]) * k / 2]; ti.push([-d[0], -d[1]]); to.push(d); }
    if (!closed) { ti[0] = [0, 0]; to[n - 1] = [0, 0]; }
    s.vertices = pts; s.inTangents = ti; s.outTangents = to; s.closed = !!closed; return s; }
  // a pie-cut pupil: an ellipse with a wedge cut toward the upper right, notched in toward its centre
  function pie(cx, cy, rx, ry) { var pts = [], a0 = -25, a1 = 295, N = 26;
    pts.push([cx + rx * .3 * Math.cos(-45 * Math.PI / 180), cy + ry * .3 * Math.sin(-45 * Math.PI / 180)]);
    for (var i = 0; i <= N; i++) { var a = (a0 + (a1 - a0) * i / N) * Math.PI / 180; pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); }
    return poly(pts); }
  function col(v) { if (v instanceof Array) return v; return g(v); }
  function shapeOf(n) { if (n.k === "circle") return ell(n.x, n.y, n.r, n.r);
    if (n.k === "ellipse") return ell(n.x, n.y, n.rx, n.ry);
    if (n.k === "rect") { if (n.r) return rrect(n.x, n.y, n.w, n.h, n.r); return poly([[n.x, n.y], [n.x + n.w, n.y], [n.x + n.w, n.y + n.h], [n.x, n.y + n.h]]); }
    if (n.k === "line") return poly(n.pts, false);
    if (n.k === "path") return n.shape;
    return poly(n.pts); }
  function emit(contents, nodes) {
    for (var i = nodes.length - 1; i >= 0; i--) { var n = nodes[i], gr = contents.addProperty("ADBE Vector Group"); if (n.id) gr.name = n.id;
      var tg = gr.property("ADBE Vector Transform Group");
      if (n.pivot) { tg.property("ADBE Vector Anchor").setValue(n.pivot); tg.property("ADBE Vector Position").setValue(n.pivot); }
      if (n.pos) tg.property("ADBE Vector Position").setValue(n.pos);
      if (n.rot) tg.property("ADBE Vector Rotation").setValue(n.rot);
      if (n.sc2) tg.property("ADBE Vector Scale").setValue(n.sc2);
      if (n.op !== undefined) tg.property("ADBE Vector Group Opacity").setValue(n.op);
      var v = gr.property("ADBE Vectors Group");
      if (n.k === "group") { emit(v, n.kids); continue; }
      v.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(shapeOf(n));
      if (n.sw) { var st = v.addProperty("ADBE Vector Graphic - Stroke"); st.property("ADBE Vector Stroke Color").setValue(col(n.sc === undefined ? INK : n.sc));
        st.property("ADBE Vector Stroke Width").setValue(n.sw); st.property("ADBE Vector Stroke Line Join").setValue(2); st.property("ADBE Vector Stroke Line Cap").setValue(2); }
      if (n.fill !== undefined && n.fill !== null && n.k !== "line") v.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(col(n.fill)); } }
  function piece(comp, name, nodes, pos) { var L = comp.layers.addShape(); L.name = name; emit(L.property("ADBE Root Vectors Group"), nodes);
    L.anchorPoint.setValue([0, 0]); L.position.setValue(pos || [0, 0]); return L; }
  function grp(L, path) { var gr = L.property("ADBE Root Vectors Group");
    for (var i = 0; i < path.length; i++) { gr = gr.property(path[i]); if (i < path.length - 1) gr = gr.property("ADBE Vectors Group"); }
    return gr; }
  function groupT(L, path) { return grp(L, path).property("ADBE Vector Transform Group"); }
  // the union outline (Lemo: stroke all parts thick first, then fill all): the parts in ink with a thick stroke, then the same parts filled on top
  function inked(parts, fill, sw) { var out = [], i;
    for (i = 0; i < parts.length; i++) { var a = {}; for (var k in parts[i]) a[k] = parts[i][k]; a.fill = INK; a.sw = sw; a.sc = INK; out.push(a); }
    for (i = 0; i < parts.length; i++) { var b = {}; for (var m in parts[i]) b[m] = parts[i][m]; if (b.fill === undefined) b.fill = fill; b.sw = 0; out.push(b); }
    return out; }

  // ---- the anatomy kit (all drawn about an origin; the body's feet sit on y = 0)
  // a white four-finger glove pointing up (-y), the wrist at the origin: palm, three fat fingers, a thumb, a flared cuff with a fold, three stitches
  function gloveKids() { var parts = [{ k: "rect", x: -30, y: -30, w: 60, h: 34, r: 10 },
      { k: "ellipse", x: 0, y: -66, rx: 42, ry: 40 }, { k: "ellipse", x: -26, y: -108, rx: 15, ry: 28 }, { k: "ellipse", x: 0, y: -118, rx: 15, ry: 30 },
      { k: "ellipse", x: 26, y: -108, rx: 15, ry: 28 }, { k: "group", pivot: [-38, -60], rot: -34, kids: [{ k: "ellipse", x: -46, y: -84, rx: 13, ry: 25, fill: WHITE }] },
      { k: "poly", pts: [[-44, 10], [44, 10], [32, -26], [-32, -26]] }];
    var n = inked([parts[0], parts[1], parts[2], parts[3], parts[4], parts[6]], WHITE, 13);
    n.splice(6, 0, { k: "group", pivot: [-38, -60], rot: -34, kids: [{ k: "ellipse", x: -46, y: -84, rx: 13, ry: 25, fill: INK, sw: 13, sc: INK }] });
    n.push(parts[5]);
    n.push({ k: "line", pts: [[-30, -12], [30, -12]], sw: 4 }, { k: "line", pts: [[-14, -50], [-16, -80]], sw: 3.5 }, { k: "line", pts: [[0, -48], [0, -82]], sw: 3.5 },
      { k: "line", pts: [[14, -50], [16, -80]], sw: 3.5 });
    return n; }
  // pie eyes: white ovals with a big pie-cut pupil (about 64 % x 74 % of the eye); PUP moves for a look, EY blinks
  function eyesNodes(cx, cy, gap, rx, ry) { var w = [], p = [];
    for (var s = -1; s <= 1; s += 2) { w.push({ k: "ellipse", x: cx + s * gap, y: cy, rx: rx, ry: ry, fill: WHITE, sw: 6 });
      p.push({ k: "path", shape: pie(cx + s * gap + rx * .06, cy + ry * .14, rx * .64, ry * .74), fill: INK }); }
    return [{ k: "group", id: "EY", pivot: [cx, cy], kids: w.concat([{ k: "group", id: "PUP", kids: p }]) }]; }
  function mouthNodes(cx, cy, s, which) { var o = [];
    var D = new Shape(); D.vertices = [[cx - 64 * s, cy], [cx + 64 * s, cy], [cx, cy + 70 * s]];
    D.inTangents = [[0, 40 * s], [-20 * s, 0], [40 * s, 0]]; D.outTangents = [[20 * s, 0], [0, 40 * s], [-40 * s, 0]]; D.closed = true;
    o.push({ k: "group", id: "GRIN", op: which === "grin" ? 100 : 0, kids: [{ k: "path", shape: D, fill: INK, sw: 6 },
      { k: "rect", x: cx - 46 * s, y: cy + 2 * s, w: 92 * s, h: 11 * s, fill: WHITE }, { k: "ellipse", x: cx + 4 * s, y: cy + 50 * s, rx: 24 * s, ry: 11 * s, fill: g(.55) }] });
    o.push({ k: "group", id: "SMILE", op: which === "smile" ? 100 : 0, kids: [{ k: "path", shape: smooth([[cx - 60 * s, cy + 6 * s], [cx, cy + 36 * s], [cx + 60 * s, cy + 6 * s]], false, .9), sw: 7 * s },
      { k: "line", pts: [[cx - 70 * s, cy - 6 * s], [cx - 58 * s, cy + 16 * s]], sw: 5 * s }, { k: "line", pts: [[cx + 70 * s, cy - 6 * s], [cx + 58 * s, cy + 16 * s]], sw: 5 * s }] });
    o.push({ k: "group", id: "OH", op: which === "oh" ? 100 : 0, kids: [{ k: "ellipse", x: cx, y: cy + 26 * s, rx: 22 * s, ry: 30 * s, fill: INK, sw: 5 }, { k: "ellipse", x: cx, y: cy + 40 * s, rx: 12 * s, ry: 9 * s, fill: g(.55) }] });
    return o; }
  function faceNodes(cx, cy, s, which) { var n = [{ k: "circle", x: cx - 96 * s, y: cy + 76 * s, r: 18 * s, fill: PALETTE.blush }, { k: "circle", x: cx + 96 * s, y: cy + 76 * s, r: 18 * s, fill: PALETTE.blush }];
    n = n.concat(eyesNodes(cx, cy, 52 * s, 38 * s, 54 * s));
    n.push({ k: "ellipse", x: cx, y: cy + 62 * s, rx: 16 * s, ry: 12 * s, fill: INK }, { k: "ellipse", x: cx - 5 * s, y: cy + 58 * s, rx: 5 * s, ry: 3 * s, fill: WHITE });
    return n.concat(mouthNodes(cx, cy + 88 * s, s, which || "grin")); }
  function shoe(id, x, y, s, dir) { return { k: "group", id: id, pivot: [x - dir * 30 * s, y + 10 * s], kids: [{ k: "ellipse", x: x, y: y, rx: 66 * s, ry: 30 * s, fill: INK, sw: 4 },
    { k: "ellipse", x: x + dir * 30 * s, y: y - 12 * s, rx: 15 * s, ry: 7 * s, fill: WHITE }] }; }
  function hoses(pairs, w) { var n = []; for (var i = 0; i < pairs.length; i++) n.push({ k: "path", shape: smooth(pairs[i], false, .9), sw: w, fill: null }); return n; }
  function glove(id, x, y, rot, s, mirror) { return { k: "group", id: id, pos: [x, y], rot: rot || 0, sc2: [mirror ? -s * 100 : s * 100, s * 100], kids: gloveKids() }; }

  // ---- the hero: a living clapperboard. The whole slate is the body (Lemo: never an object head on a human body), the clapper stick is its
  // hat and its gag (it snaps on the beat), rubber-hose arms and legs, white gloves, pie eyes, a grin. About 520 px tall at scale 100.
  var SH = { L: [-142, -292], R: [142, -292] };
  function heroNodes() { var n = [{ k: "ellipse", x: 0, y: -4, rx: 170, ry: 20, fill: g(.32) }];
    n = n.concat(hoses([[[-62, -126], [-62, -70], [-98, -26]], [[62, -126], [62, -70], [98, -26]]], 26));
    n.push(shoe("SL", -112, -22, 1, -1), shoe("SR", 112, -22, 1, 1));
    n.push({ k: "path", id: "AL", shape: poly([[-142, -292], [-200, -200]], false), sw: 26, fill: null }, { k: "path", id: "AR", shape: poly([[142, -292], [200, -200]], false), sw: 26, fill: null });
    n.push({ k: "rect", x: -152, y: -424, w: 304, h: 304, r: 26, fill: WHITE, sw: 8 });
    n.push({ k: "path", shape: poly([[104, -416], [126, -416], [146, -396], [146, -150], [126, -128], [104, -128]]), fill: PALETTE.shadow });
    n.push({ k: "line", pts: [[-146, -170], [146, -170]], sw: 5 }, { k: "line", pts: [[-40, -170], [-40, -126]], sw: 5 }, { k: "line", pts: [[50, -170], [50, -126]], sw: 5 });
    n.push({ k: "rect", x: -152, y: -424, w: 304, h: 304, r: 26, fill: null, sw: 8 });
    var bar = [{ k: "rect", x: -156, y: -476, w: 312, h: 52, fill: WHITE, sw: 7 }];
    for (var x = -150; x < 140; x += 62) bar.push({ k: "poly", pts: [[x + 22, -473], [x + 52, -473], [x + 30, -427], [x, -427]], fill: INK });
    bar.push({ k: "rect", x: -156, y: -476, w: 312, h: 52, fill: null, sw: 7 });
    n = n.concat(bar);
    var stick = [{ k: "rect", x: -156, y: -530, w: 312, h: 50, fill: WHITE, sw: 7 }];
    for (var y = -150; y < 140; y += 62) stick.push({ k: "poly", pts: [[y, -527], [y + 30, -527], [y + 52, -483], [y + 22, -483]], fill: INK });
    stick.push({ k: "rect", x: -156, y: -530, w: 312, h: 50, fill: null, sw: 7 }, { k: "circle", x: -146, y: -478, r: 12, fill: g(.5), sw: 5 });
    n.push({ k: "group", id: "CLAP", pivot: [-146, -478], kids: stick });
    n = n.concat(faceNodes(0, -326, 1, "grin"));
    n.push(glove("HL", -230, -170, 0, 1, true), glove("HR", 230, -170, 0, 1, false));
    return n; }
  // the rig: arm hoses follow the gloves (one smooth bend, bulging outward), gloves point along their arm, eyes blink, the body breathes on the beat
  function rigLimbs(L, sh, w) {
    var sides = [["AL", "HL", sh.L, -1], ["AR", "HR", sh.R, 1]];
    for (var i = 0; i < sides.length; i++) { var s = sides[i], a = "[" + s[2][0] + ", " + s[2][1] + "]";
      grp(L, [s[0]]).property("ADBE Vectors Group").property(1).property("ADBE Vector Shape").expression =
        "var a = " + a + "; var b = content(\"" + s[1] + "\").transform.position; var d = sub(b, a); var l = Math.max(length(d), 1);\n" +
        "var nn = [-d[1] / l, d[0] / l]; var m = add(div(add(a, b), 2), mul(nn, l * .15 * " + s[3] + ")); var tg = mul(d, .24);\n" +
        "createPath([a, m, b], [[0, 0], mul(tg, -1), [0, 0]], [[0, 0], tg, [0, 0]], false);";
      groupT(L, [s[1]]).property("ADBE Vector Rotation").expression =
        "var a = " + a + "; var d = sub(thisProperty.propertyGroup(1).position, a); value + radiansToDegrees(Math.atan2(d[1], d[0])) + 90;"; }
    groupT(L, ["EY"]).property("ADBE Vector Scale").expression = "posterizeTime(12); var t = (time + " + n3(w || 0) + ") % 2.9; var s = 100; if (t > 2.66 && t < 2.8) s = 8; [100, s];"; }
  function breathe(L, amp) { L.scale.expression = "posterizeTime(12); var b = Math.cos(2 * Math.PI * time * " + BPS + "); var a = " + n3(amp) + ";\n[value[0] * (1 - a * .6 * b), value[1] * (1 + a * b)];"; }
  // o = { x, y (the floor), s, t0, t1, hl / hr: key lists in body coordinates (or one [x, y]), clap: [times], mouth: [{ t, m }], look: key list, amp, rot }
  function hero(comp, name, o) { var L = piece(comp, name, heroNodes()); span(L, o.t0, o.t1); var s = (o.s || 1) * 100;
    L.position.setValue([o.x, o.y]); if (o.pos) keys(L.position, o.pos);
    if (o.sq) keys(L.scale, o.sq); else L.scale.setValue([s, s]);
    rigLimbs(L, SH, o.blink); breathe(L, o.amp === undefined ? .05 : o.amp);
    var H = { HL: o.hl || [-230, -170], HR: o.hr || [230, -170] };
    for (var h in H) { var p = groupT(L, [h]).property("ADBE Vector Position"); if (typeof H[h][0] === "number") p.setValue(H[h]); else keys(p, H[h]); }
    if (o.hlr) keys(groupT(L, ["HL"]).property("ADBE Vector Rotation"), o.hlr);
    if (o.hrr) keys(groupT(L, ["HR"]).property("ADBE Vector Rotation"), o.hrr);
    var cl = groupT(L, ["CLAP"]).property("ADBE Vector Rotation"), ck = [{ t: o.t0, v: -9, o: "H" }];
    for (var c = 0; c < (o.clap || []).length; c++) { var tc = o.clap[c];
      ck.push({ t: tc - .3, v: -9, o: 40 }, { t: tc - .1, v: -34, i: 60, o: "H" }, { t: tc - .06, v: -34, o: "L" }, { t: tc, v: 0, i: "L", o: 60 }, { t: tc + .1, v: -6, i: 60, o: 60 }, { t: tc + .2, v: 0, i: 60, o: 60 }, { t: tc + .42, v: -9, i: 60, o: "H" }); }
    var cks = []; for (var q = 0; q < ck.length; q++) if (ck[q].t >= o.t0 - .001 && (!cks.length || ck[q].t > cks[cks.length - 1].t + .01)) cks.push(ck[q]);
    if (cks.length > 1) keys(cl, cks); else cl.setValue(-9);
    if (o.mouth) { var M = ["GRIN", "SMILE", "OH"];
      for (var m = 0; m < M.length; m++) { var kl = []; for (var j = 0; j < o.mouth.length; j++) kl.push({ t: o.mouth[j].t, v: o.mouth[j].m === M[m].toLowerCase() ? 100 : 0, o: "H" });
        keys(groupT(L, [M[m]]).property("ADBE Vector Group Opacity"), kl); } }
    if (o.look) keys(groupT(L, ["EY", "PUP"]).property("ADBE Vector Position"), o.look);
    if (o.rot) keys(L.rotation, o.rot);
    if (o.tap) groupT(L, ["SR"]).property("ADBE Vector Rotation").expression = "posterizeTime(12); -14 * Math.max(0, Math.sin(2 * Math.PI * time * " + BPS + "));";
    return L; }
  // a body point (in hero coordinates) for a stage point, for a hero placed at (x, y) with scale s
  function local(o, p) { return [(p[0] - o.x) / (o.s || 1), (p[1] - o.y) / (o.s || 1)]; }

  // ---- the supporting cast: the three pieces of the picture (a person, a document, a radio) and a wall clock. Same kit, smaller.
  function legsNodes(hx, hy, fy, s) { var n = hoses([[[-hx, hy], [-hx, (hy + fy) / 2], [-hx - 14 * s, -20 * s]], [[hx, hy], [hx, (hy + fy) / 2], [hx + 14 * s, -20 * s]]], 18 * s);
    n.push(shoe("SL", -hx - 30 * s, -18 * s, s * .72, -1), shoe("SR", hx + 30 * s, -18 * s, s * .72, 1)); return n; }
  function personNodes() { var n = [{ k: "ellipse", x: 0, y: -4, rx: 110, ry: 14, fill: g(.32) }].concat(legsNodes(38, -90, 0, 1));
    n = n.concat(hoses([[[-74, -170], [-120, -190], [-150, -250]], [[74, -170], [118, -150], [150, -120]]], 18));
    n.push({ k: "ellipse", x: 0, y: -160, rx: 84, ry: 92, fill: INK, sw: 6 }, { k: "circle", x: 0, y: -170, r: 9, fill: WHITE }, { k: "circle", x: 0, y: -130, r: 9, fill: WHITE });
    n.push({ k: "circle", x: 0, y: -300, r: 82, fill: WHITE, sw: 7 }, { k: "path", shape: poly([[64, -330], [82, -304], [80, -262], [64, -240]]), fill: PALETTE.shadow });
    n = n.concat(faceNodes(0, -318, .62, "smile"));
    n.push({ k: "path", shape: smooth([[-86, -330], [-70, -384], [0, -396], [74, -380], [96, -336]], false, .8), fill: g(.36), sw: 6 }, { k: "rect", x: -96, y: -340, w: 204, h: 16, r: 8, fill: g(.25), sw: 5 });
    n.push(glove("G1", -150, -250, -30, .62, true), glove("G2", 150, -120, 140, .62, false)); return n; }
  function docNodes() { var n = [{ k: "ellipse", x: 0, y: -4, rx: 100, ry: 13, fill: g(.32) }].concat(legsNodes(36, -70, 0, .9));
    n = n.concat(hoses([[[-92, -170], [-136, -186], [-150, -240]], [[92, -170], [140, -170], [156, -126]]], 17));
    n.push({ k: "path", shape: poly([[-96, -360], [52, -360], [96, -316], [96, -66], [-96, -66]]), fill: WHITE, sw: 7 }, { k: "path", shape: poly([[52, -360], [52, -316], [96, -316]]), fill: g(.8), sw: 5 });
    n.push({ k: "path", shape: poly([[70, -300], [94, -300], [94, -70], [70, -70]]), fill: PALETTE.shadow });
    for (var r = 0; r < 4; r++) n.push({ k: "line", pts: [[-66, -150 + r * 22], [r === 3 ? 10 : 62, -150 + r * 22]], sw: 4, sc: g(.45) });
    n = n.concat(faceNodes(0, -278, .58, "grin"));
    n.push(glove("G1", -150, -240, -24, .58, true), glove("G2", 156, -126, 150, .58, false)); return n; }
  function radioNodes() { var n = [{ k: "ellipse", x: 0, y: -4, rx: 124, ry: 14, fill: g(.32) }].concat(legsNodes(52, -70, 0, .95));
    n = n.concat(hoses([[[-112, -170], [-150, -180], [-170, -230]], [[112, -170], [150, -184], [168, -236]]], 17));
    var body = inked([{ k: "ellipse", x: 0, y: -262, rx: 116, ry: 96 }, { k: "rect", x: -116, y: -262, w: 232, h: 194 }], g(.42), 14);
    n = n.concat(body);
    n.push({ k: "path", shape: poly([[78, -300], [100, -290], [100, -74], [78, -74]]), fill: g(.34) });
    n.push({ k: "ellipse", x: 0, y: -262, rx: 86, ry: 70, fill: g(.78), sw: 5 }, { k: "rect", x: -86, y: -262, w: 172, h: 110, fill: g(.78), sw: 0 }, { k: "line", pts: [[-86, -262], [-86, -152], [86, -152], [86, -262]], sw: 5 });
    for (var v = -60; v <= 60; v += 30) n.push({ k: "line", pts: [[v, -310], [v, -160]], sw: 3, sc: g(.6) });
    n = n.concat(faceNodes(0, -278, .52, "oh"));
    n.push({ k: "circle", x: -60, y: -112, r: 18, fill: INK }, { k: "circle", x: 60, y: -112, r: 18, fill: INK }, { k: "rect", x: -30, y: -122, w: 60, h: 18, r: 6, fill: g(.85), sw: 4 });
    n.push(glove("G1", -170, -230, -20, .58, true), glove("G2", 168, -236, 20, .58, false)); return n; }
  function clockNodes() { var n = [{ k: "circle", x: -62, y: -152, r: 30, fill: g(.5), sw: 6 }, { k: "circle", x: 62, y: -152, r: 30, fill: g(.5), sw: 6 }, { k: "rect", x: -8, y: -186, w: 16, h: 22, fill: INK },
      { k: "circle", x: 0, y: -84, r: 92, fill: g(.4), sw: 7 }, { k: "circle", x: 0, y: -84, r: 74, fill: WHITE, sw: 5 }];
    for (var h = 0; h < 12; h++) { var a = h * Math.PI / 6; n.push({ k: "line", pts: [[64 * Math.cos(a), -84 + 64 * Math.sin(a)], [56 * Math.cos(a), -84 + 56 * Math.sin(a)]], sw: 4 }); }
    n = n.concat(faceNodes(0, -110, .4, "smile"));
    n.push({ k: "line", pts: [[-38, 0], [-52, 10]], sw: 9 }, { k: "line", pts: [[38, 0], [52, 10]], sw: 9 });
    return n; }
  function prop(comp, name, nodes, o) { var L = piece(comp, name, nodes, [o.x, o.y]); span(L, o.t0, o.t1); var s = (o.s || 1) * 100; L.scale.setValue([s, s]);
    try { groupT(L, ["EY"]).property("ADBE Vector Scale").expression = "posterizeTime(12); var t = (time + " + n3(o.blink || 0) + ") % 3.3; var s = 100; if (t > 3.06 && t < 3.2) s = 8; [100, s];"; } catch (e) {}
    breathe(L, o.amp === undefined ? .06 : o.amp); return L; }
  // a drop on the beat: falls from above, lands with a squash and an exponential spring-back (scale keys multiply under the breathing)
  function drop(L, t, y, s) { var S = s * 100; keys(L.position, [{ t: t - .2, v: [L.position.value[0], y - 900], o: "L" }, { t: t, v: [L.position.value[0], y], i: "L" }]);
    keys(L.scale, [{ t: t - .2, v: [S * .86, S * 1.2], o: "H" }, { t: t, v: [S * 1.24, S * .74], o: 60 }, { t: t + .1, v: [S * .92, S * 1.1], i: 60, o: 60 }, { t: t + .2, v: [S * 1.04, S * .97], i: 60, o: 60 }, { t: t + .32, v: [S, S], i: 70 }]); }

  // ---- the set: a soft grey painted room (patterned wallpaper, a window with curtains, a shelf of jars, panelled wainscot, a checker floor in
  // perspective). Backgrounds live in the middle greys; the characters own the white and the ink. It never boils.
  function setNodes(W, H) { var n = [{ k: "rect", x: 0, y: 0, w: W, h: 1180, fill: PALETTE.wall }], x, y, k;
    for (x = 40; x < W; x += 100) n.push({ k: "rect", x: x, y: 110, w: 34, h: 700, fill: PALETTE.stripe });
    for (y = 190, k = 0; y < 790; y += 150, k++) for (x = 7 + (k % 2) * 50; x < W; x += 100) n.push({ k: "poly", pts: [[x, y - 14], [x + 10, y], [x, y + 14], [x - 10, y]], fill: PALETTE.motif });
    n.push({ k: "rect", x: -6, y: 86, w: W + 12, h: 24, fill: PALETTE.wood, sw: 3, sc: PALETTE.line });
    // the window and its curtains
    n.push({ k: "rect", x: 70, y: 250, w: 260, h: 320, fill: PALETTE.wood, sw: 4, sc: PALETTE.line }, { k: "rect", x: 90, y: 270, w: 220, h: 280, fill: g(.8), sw: 3, sc: PALETTE.line },
      { k: "ellipse", x: 230, y: 330, rx: 46, ry: 16, fill: g(.86) }, { k: "line", pts: [[200, 270], [200, 550]], sw: 9, sc: PALETTE.wood }, { k: "line", pts: [[90, 410], [310, 410]], sw: 9, sc: PALETTE.wood },
      { k: "rect", x: 54, y: 570, w: 292, h: 22, fill: PALETTE.wood, sw: 3, sc: PALETTE.line });
    n.push({ k: "path", shape: smooth([[64, 236], [140, 236], [118, 330], [150, 430], [112, 520], [130, 600], [52, 600]], false, .7), fill: g(.74), sw: 4, sc: PALETTE.line },
      { k: "path", shape: smooth([[336, 236], [260, 236], [282, 330], [250, 430], [288, 520], [270, 600], [348, 600]], false, .7), fill: g(.74), sw: 4, sc: PALETTE.line });
    for (k = 0; k < 3; k++) n.push({ k: "line", pts: [[78 + k * 18, 250], [72 + k * 18, 590]], sw: 2, sc: g(.62) }, { k: "line", pts: [[322 - k * 18, 250], [328 - k * 18, 590]], sw: 2, sc: g(.62) });
    n.push({ k: "rect", x: 40, y: 222, w: 320, h: 16, r: 8, fill: g(.3), sw: 3, sc: PALETTE.line });
    // the shelf of jars
    n.push({ k: "rect", x: 590, y: 380, w: 360, h: 20, fill: PALETTE.wood, sw: 3, sc: PALETTE.line }, { k: "poly", pts: [[620, 400], [650, 400], [636, 440]], fill: PALETTE.dark }, { k: "poly", pts: [[890, 400], [920, 400], [904, 440]], fill: PALETTE.dark });
    var J = [[610, 70, 120], [700, 64, 160], [784, 60, 104], [862, 64, 140]];
    for (k = 0; k < J.length; k++) n.push({ k: "rect", x: J[k][0], y: 380 - J[k][2], w: J[k][1], h: J[k][2], r: 10, fill: g(.56), sw: 3, sc: PALETTE.line },
      { k: "rect", x: J[k][0] - 4, y: 368 - J[k][2], w: J[k][1] + 8, h: 18, r: 5, fill: PALETTE.dark, sw: 3, sc: PALETTE.line }, { k: "rect", x: J[k][0] + 10, y: 395 - J[k][2], w: 10, h: J[k][2] - 40, fill: g(.64) });
    // the wainscot
    n.push({ k: "rect", x: 0, y: 820, w: W, h: 360, fill: g(.5), sw: 3, sc: PALETTE.line }, { k: "rect", x: -6, y: 800, w: W + 12, h: 26, fill: PALETTE.wood, sw: 3, sc: PALETTE.line });
    for (k = 0; k < 4; k++) n.push({ k: "rect", x: 30 + k * 245, y: 862, w: 205, h: 270, r: 6, fill: g(.47), sw: 3, sc: PALETTE.line }, { k: "line", pts: [[40 + k * 245, 872], [225 + k * 245, 872]], sw: 3, sc: g(.58) });
    n.push({ k: "rect", x: -6, y: 1160, w: W + 12, h: 26, fill: g(.3), sw: 3, sc: PALETTE.line });
    // the checker floor in perspective (a vanishing point above the floor line)
    var VP = [W / 2, 560], rows = [1186, 1226, 1280, 1350, 1440, 1520];
    for (var r = 0; r < rows.length - 1; r++) for (var c = -6; c < 14; c++) { var xb0 = -440 + c * 140, xb1 = xb0 + 140;
      var X = function (xb, yy) { return VP[0] + (xb - VP[0]) * (yy - VP[1]) / (1500 - VP[1]); };
      n.push({ k: "poly", pts: [[X(xb0, rows[r]), rows[r]], [X(xb1, rows[r]), rows[r]], [X(xb1, rows[r + 1]), rows[r + 1]], [X(xb0, rows[r + 1]), rows[r + 1]]], fill: (r + c) % 2 ? PALETTE.floorA : PALETTE.floorB, sw: 2, sc: PALETTE.line }); }
    return n; }

  // a title sunburst: alternating grey wedges in a ring (the title card's backdrop; it turns slowly on twos)
  function sunburst(R, n) { var out = [{ k: "circle", x: 0, y: 0, r: R, fill: g(.7), sw: 8 }];
    for (var i = 0; i < n; i += 2) { var a0 = i * 2 * Math.PI / n, a1 = (i + 1) * 2 * Math.PI / n;
      out.push({ k: "poly", pts: [[0, 0], [R * Math.cos(a0), R * Math.sin(a0)], [R * Math.cos((a0 + a1) / 2) * 1.02, R * Math.sin((a0 + a1) / 2) * 1.02], [R * Math.cos(a1), R * Math.sin(a1)]], fill: g(.54) }); }
    out.push({ k: "circle", x: 0, y: 0, r: R, fill: null, sw: 8 }, { k: "circle", x: 0, y: 0, r: R - 18, fill: null, sw: 3, sc: g(.85) }); return out; }

  // ---- period cards: a near-black plate, a white double rule and dot-and-ring corner ornaments
  function plateNodes(w, h) { var n = [{ k: "rect", x: -w / 2 + 12, y: -h / 2 + 14, w: w, h: h, r: 24, fill: INK }, { k: "rect", x: -w / 2, y: -h / 2, w: w, h: h, r: 24, fill: PALETTE.plate, sw: 7 }];
    n.push({ k: "rect", x: -w / 2 + 22, y: -h / 2 + 22, w: w - 44, h: h - 44, r: 14, fill: null, sw: 4, sc: WHITE }, { k: "rect", x: -w / 2 + 34, y: -h / 2 + 34, w: w - 68, h: h - 68, r: 8, fill: null, sw: 2, sc: WHITE });
    var C = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    for (var c = 0; c < 4; c++) { var x = C[c][0] * (w / 2 - 34), y = C[c][1] * (h / 2 - 34);
      n.push({ k: "circle", x: x, y: y, r: 15, fill: PALETTE.plate, sw: 3, sc: WHITE }, { k: "circle", x: x, y: y, r: 5, fill: WHITE }); }
    return n; }
  function plate(comp, name, w, h, pos, t0, t1) { var L = piece(comp, name, plateNodes(w, h), pos); span(L, t0, t1); return L; }
  // titles: Shrikhand, white face, a heavy ink outline (about 14 % of the size) under the fill, an ink drop shadow down-right; letters hop in a
  // travelling wave on the beat (an expression selector, sampled on twos)
  function title(comp, name, str, o) { var size = o.size, fam = o.family || SCRIPT;
    if (o.maxW) { var T = AESLib.text(comp, name + "_M", str, { family: fam, style: "Regular", size: size, color: WHITE }), mw = T.sourceRectAtTime(0, false).width; T.remove(); if (mw > o.maxW) size = Math.floor(size * o.maxW / mw); }
    var L = AESLib.text(comp, name, str, { family: fam, style: "Regular", size: size, color: o.color || WHITE, just: "center", tracking: o.tracking });
    var sp = L.property("Source Text"), td = sp.value;
    if (o.stroke !== false) { td.applyStroke = true; td.strokeColor = INK; td.strokeWidth = Math.round(size * (o.sk || .14)); td.strokeOverFill = false; sp.setValue(td); }
    var r = L.sourceRectAtTime(0, false); L.anchorPoint.setValue([r.left + r.width / 2, r.top + r.height / 2]); L.position.setValue(o.pos);
    if (o.shadow !== 0) { fx(L, "ADBE Drop Shadow"); var EP = L.property("ADBE Effect Parade"), ds = EP.property(EP.numProperties);
      ds.property("Shadow Color").setValue(INK); var op = ds.property("Opacity"); op.setValue(op.hasMax && op.maxValue > 100 ? 255 : 100);
      EP = L.property("ADBE Effect Parade"); ds = EP.property(EP.numProperties); ds.property("Direction").setValue(135); ds.property("Distance").setValue(o.shadow || Math.max(6, Math.round(size * .07))); ds.property("Softness").setValue(0); }
    if (o.hop) hop(L, o.hop);
    span(L, o.t0, o.t1); return { L: L, r: r, size: size }; }
  function hop(L, h) { var an = L.property("ADBE Text Properties").property("ADBE Text Animators").addProperty("ADBE Text Animator"); an.name = "HOP";
    an.property("ADBE Text Animator Properties").addProperty("ADBE Text Position 3D");
    an = L.property("ADBE Text Properties").property("ADBE Text Animators").property("HOP"); an.property("ADBE Text Animator Properties").property("ADBE Text Position 3D").setValue([0, -h, 0]);
    an.property("ADBE Text Selectors").addProperty("ADBE Text Expressible Selector");
    an = L.property("ADBE Text Properties").property("ADBE Text Animators").property("HOP");
    an.property("ADBE Text Selectors").property(1).property("ADBE Text Expressible Amount").expression =
      "posterizeTime(12); var ph = (time * " + BPS + " - (textIndex - 1) * .11) * 2 * Math.PI; var a = 100 * Math.pow(Math.max(0, Math.sin(ph)), 2);\nvar v = []; for (var i = 0; i < selectorValue.length; i++) v.push(a); v;";
    return L; }
  function textW(comp, str, fam, size) { var T = AESLib.text(comp, "RUBM_MEASURE", str, { family: fam, style: "Regular", size: size, color: WHITE, just: "left" }), r = T.sourceRectAtTime(0, false); T.remove(); return r; }
  function pop(L, t, S) { S = S || 100; keys(L.scale, [{ t: t, v: [0, 0], o: 40 }, { t: t + .12, v: [S * 1.18, S * .86], i: 60, o: 60 }, { t: t + .22, v: [S * .94, S * 1.06], i: 60, o: 60 }, { t: t + .34, v: [S, S], i: 70 }]); }
  function wordsIn(list, t0, t1) { var r = []; for (var i = 0; i < list.length; i++) if (list[i].s >= t0 - .05 && list[i].s < t1) r.push(list[i]); return r; }
  // the bouncing ball over a singalong card: T = landing times, P = landing points; it arcs between them (a parabola), squashes as it lands
  function ball(comp, name, T, P, t0, t1) { var L = piece(comp, name, [{ k: "ellipse", x: 8, y: 32, rx: 20, ry: 6, fill: g(.02), op: 60 }, { k: "circle", x: 0, y: 0, r: 22, fill: WHITE, sw: 5 },
      { k: "ellipse", x: -7, y: -8, rx: 7, ry: 5, fill: g(1) }], P[0]); span(L, t0, t1);
    var ts = [], xs = [], ys = []; for (var i = 0; i < T.length; i++) { ts.push(n3(T[i])); xs.push(n3(P[i][0])); ys.push(n3(P[i][1])); }
    var head = "var T = [" + ts.join(",") + "], X = [" + xs.join(",") + "], Y = [" + ys.join(",") + "]; var t = time, i = 0; while (i < T.length - 2 && t >= T[i + 1]) i++;\n" +
      "var u = (t - T[i]) / Math.max(T[i + 1] - T[i], .01); if (u < 0) u = 0; if (u > 1) u = 1; var hgt = 70 + Math.abs(X[i + 1] - X[i]) * .25;\n";
    L.position.expression = "posterizeTime(12); " + head + "[X[i] + (X[i + 1] - X[i]) * u, Y[i] + (Y[i + 1] - Y[i]) * u - hgt * 4 * u * (1 - u)];";
    L.scale.expression = "posterizeTime(12); " + head + "var s = [100, 100]; if (u < .1 || u > .93) s = [128, 76]; s;";
    return L; }
  // puffs: white cartoon clouds that pop out of a spot and shrink away (smoke in a row reads as thought bubbles, so they scatter and grow)
  function puff(comp, name, c, t, n, R) { var out = [];
    for (var i = 0; i < n; i++) { var a = i * 2.39996, d = R * (.35 + .65 * ((i * 37) % 10) / 10), r = R * (.34 + .2 * ((i * 53) % 7) / 7);
      var L = piece(comp, name + i, [{ k: "circle", x: 0, y: 0, r: r, fill: WHITE, sw: 6 }, { k: "ellipse", x: r * .25, y: r * .3, rx: r * .5, ry: r * .32, fill: g(.85) }], [c[0] + d * Math.cos(a) * .4, c[1] + d * Math.sin(a) * .4]);
      var t0 = t + i * .025; span(L, t0, t0 + .5);
      keys(L.position, [{ t: t0, v: L.position.value, o: 30 }, { t: t0 + .45, v: [c[0] + d * Math.cos(a), c[1] + d * Math.sin(a) - 40], i: 60 }]);
      keys(L.scale, [{ t: t0, v: [10, 10], o: 30 }, { t: t0 + .18, v: [110, 110], i: 50, o: 40 }, { t: t0 + .5, v: [0, 0], i: 60 }]); out.push(L); }
    return out; }
  // star lines for an impact (the clap): short ink strokes that pop out of a point
  function burst(comp, name, c, t, R) { var n = [];
    for (var i = 0; i < 8; i++) { var a = i * Math.PI / 4 + .2; n.push({ k: "line", pts: [[R * .6 * Math.cos(a), R * .6 * Math.sin(a)], [R * Math.cos(a), R * Math.sin(a)]], sw: 9 }); }
    var L = piece(comp, name, n, c); span(L, t, t + .25); keys(L.scale, [{ t: t, v: [50, 50], o: 40 }, { t: t + .25, v: [140, 140], i: 60 }]); return L; }
  // an iris: a black layer with a round hole (even-odd fill). Returns the layer and its hole's size property, fetched fresh.
  function iris(comp, name, cx, cy, t0, t1) { var L = comp.layers.addShape(); L.name = name; L.anchorPoint.setValue([0, 0]); L.position.setValue([0, 0]);
    var v = L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").property("ADBE Vectors Group"); v.addProperty("ADBE Vector Shape - Rect").property("ADBE Vector Rect Size").setValue([6000, 6000]);
    v.addProperty("ADBE Vector Shape - Ellipse").property("ADBE Vector Ellipse Position").setValue([cx, cy]);
    var f = v.addProperty("ADBE Vector Graphic - Fill"); f.property("ADBE Vector Fill Color").setValue([0, 0, 0]); f.property("ADBE Vector Fill Rule").setValue(2);
    v = L.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group"); var st = v.addProperty("ADBE Vector Graphic - Stroke");
    st.property("ADBE Vector Stroke Color").setValue(g(.02)); st.property("ADBE Vector Stroke Width").setValue(10);
    span(L, t0, t1); return { layer: L, size: L.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property(2).property("ADBE Vector Ellipse Size") }; }

  // ---- the print: greyscale silver with warm paper whites, a contrast boost, flicker, weave with a jump on every cut, grain, broken scratches,
  // dust, a hair in the gate and a strong vignette. No hue anywhere, not even in the damage.
  function print(comp, P, FILM, GT, cuts, notes) { var gw = GT.x1 - GT.x0, gh = GT.y1 - GT.y0, c = [(GT.x0 + GT.x1) / 2, (GT.y0 + GT.y1) / 2];
    var tn = fx(FILM, "ADBE Tint"); tn.property("Map Black To").setValue(PALETTE.printBlack); tn.property("Map White To").setValue(PALETTE.printWhite);
    var bc = fx(FILM, "ADBE Brightness & Contrast 2"); bc.property("Contrast").setValue(12);
    fx(FILM, "ADBE Gaussian Blur 2").property("Blurriness").setValue(.8);
    FILM.position.expression = "var C = [" + cuts.join(",") + "]; var j = 0; for (var i = 0; i < C.length; i++) { if (time >= C[i] && time < C[i] + 2 / 30) j = 7; }\n" +
      "seedRandom(Math.floor(time * 4), true); var w = [random(-1.2, 1.2), random(-1.2, 1.2)]; seedRandom(timeToFrames(time), true); var k = 0; if (random() < .02) k = 5;\nvalue + w + [0, j + k];";
    var FK = solid(comp, P + "_FLICKER", [1, 1, 1], gw, gh, c); FK.adjustmentLayer = true; var fb = fx(FK, "ADBE Brightness & Contrast 2");
    fb.property("Brightness").expression = PERFRAME + "random(-6, 4);";
    var GR = solid(comp, P + "_GRAIN", [1, 1, 1], gw, gh, c); GR.adjustmentLayer = true; var gn = fx(GR, "ADBE Noise"); gn.property("Amount of Noise").setValue(6);
    try { GR.property("ADBE Effect Parade").property(1).property(2).setValue(0); } catch (e) { notes.push("grain colour: " + e.toString()); }
    var SC = [[.22, .9, 1.4], [.64, .1, 1.2], [.81, .9, 1.6]];
    for (var s = 0; s < SC.length; s++) { var L = piece(comp, P + "_SCRATCH" + s, [{ k: "rect", x: -SC[s][2] / 2, y: -gh / 2, w: SC[s][2], h: gh, fill: SC[s][1] }], c);
      L.position.expression = "var k = " + s + "; seedRandom(Math.floor(time / 1.4) * 7 + k, true); var bx = " + GT.x0 + " + random(.1, .9) * " + gw + "; seedRandom(timeToFrames(time) * 3 + k, true);"
        + " [bx + random(-2, 2), " + c[1] + " + random(-200, 200)];";
      L.scale.expression = PERFRAME + "[100, random(40, 110)];";
      L.opacity.expression = "seedRandom(Math.floor(time / 1.4) * 7 + " + s + ", true); var on = random() < .5; seedRandom(timeToFrames(time) * 5 + " + s + ", true); var o = 0; if (on && random() < .8) o = random(20, 55); o;"; }
    var dust = []; for (var d = 0; d < 6; d++) dust.push({ k: "group", id: "D" + d, kids: [{ k: "ellipse", x: 0, y: 0, rx: 2 + (d % 3) * 2, ry: 1.5 + (d % 2) * 3, fill: d % 2 ? .9 : .05 }] });
    var DU = piece(comp, P + "_DUST", dust, [0, 0]);
    for (var e = 0; e < 6; e++) { var tg = groupT(DU, ["D" + e]); tg.property("ADBE Vector Position").expression = PERFRAME + "seedRandom(timeToFrames(time) * 11 + " + e + ", true); [random(" + (GT.x0 + 20) + ", " + (GT.x1 - 20) + "), random(" + (GT.y0 + 20) + ", " + (GT.y1 - 20) + ")];";
      tg.property("ADBE Vector Group Opacity").expression = "seedRandom(timeToFrames(time) * 13 + " + e + ", true); var o = 0; if (random() < .45) o = random(40, 85); o;"; }
    var hs = smooth([[0, 0], [22, 60], [-4, 120], [26, 170]], false, .8), HA = comp.layers.addShape(); HA.name = P + "_HAIR"; HA.anchorPoint.setValue([0, 0]);
    var hg = HA.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").property("ADBE Vectors Group"); hg.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(hs);
    var hst = hg.addProperty("ADBE Vector Graphic - Stroke"); hst.property("ADBE Vector Stroke Color").setValue(g(.04)); hst.property("ADBE Vector Stroke Width").setValue(2.2);
    HA.position.setValue([GT.x1 - 120, GT.y0 + 180]); span(HA, 5.0, 7.2); HA.position.expression = PERFRAME + "value + [random(-2, 2), random(-3, 3)];"; HA.opacity.setValue(75);
    var VI = solid(comp, P + "_VIGNETTE", [0, 0, 0], gw, gh, c), vm = VI.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
    vm.property("ADBE Mask Shape").setValue(ell(gw / 2, gh / 2, gw * .6, gh * .58)); vm.inverted = true; vm.property("ADBE Mask Feather").setValue([340, 340]); VI.opacity.setValue(58);
    return {}; }

  // buildScene: the shared test scene (the library's seven-beat test scene) as a 1930s rubber hose short. comp = an empty 1080 x 1920 comp at scene.fps.
  // STAGE (the gate) holds the painted room and CAST; CAST holds every drawing (on twos, with a line boil); the print pass runs on STAGE in
  // the main comp, inside a rounded gate on black. The hero (the clapperboard) is on screen in every beat.
  function buildScene(comp, scene, opts) {
    fontOK(); var P = opts.prefix || "RUB", A = opts.assets, B = scene.beat, W = comp.width, notes = [], WL = scene.wordList, D = comp.duration, fps = comp.frameRate;
    AESLib.clearOwned(comp, P);
    var GT = { x0: 40, x1: 1040, y0: 210, y1: 1710 }, GW = GT.x1 - GT.x0, GH = GT.y1 - GT.y0, cx = GW / 2;
    var ST = app.project.items.addComp(P + "_STAGE", GW, GH, 1, D, fps); ST.bgColor = [0, 0, 0];
    var CA = app.project.items.addComp(P + "_CAST", GW, GH, 1, D, fps); CA.bgColor = [0, 0, 0];
    var ons = function (t0, t1) { var r = [], w = wordsIn(WL, t0, t1); for (var i = 0; i < w.length; i++) r.push(w[i].s); return r; };

    // the framed real frame: an ornate dark frame, the inked footage (tools/ink.mjs, 12 fps) and a white inner rule. Used by the input and the carry.
    var FW = 820, FH = 620, FR = app.project.items.addComp(P + "_FRAMED", FW, FH, 1, D, fps); FR.bgColor = [0, 0, 0];
    piece(FR, P + "_FR_BACK", [{ k: "rect", x: 6, y: 6, w: FW - 12, h: FH - 12, r: 18, fill: g(.22), sw: 10 }, { k: "rect", x: 20, y: 20, w: FW - 40, h: FH - 40, r: 10, fill: g(.38), sw: 5 }]);
    var ink = AESLib.importFile(A.ink), IL = FR.layers.add(ink); IL.name = P + "_FR_INK"; IL.position.setValue([FW / 2, FH / 2]);
    var isc = 100 * Math.max((FW - 80) / ink.width, (FH - 80) / ink.height); IL.scale.setValue([isc, isc]);
    var im = IL.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"); im.property("ADBE Mask Shape").setValue(rrect((ink.width - (FW - 80) * 100 / isc) / 2, (ink.height - (FH - 80) * 100 / isc) / 2, (FW - 80) * 100 / isc, (FH - 80) * 100 / isc, 8));
    var fo = []; for (var cn = 0; cn < 4; cn++) { var ccx = cn % 2 ? FW - 22 : 22, ccy = cn < 2 ? 22 : FH - 22; fo.push({ k: "circle", x: ccx, y: ccy, r: 20, fill: g(.22), sw: 6 }, { k: "circle", x: ccx, y: ccy, r: 7, fill: WHITE }); }
    piece(FR, P + "_FR_TOP", [{ k: "rect", x: 40, y: 40, w: FW - 80, h: FH - 80, r: 8, fill: null, sw: 9 }, { k: "rect", x: 32, y: 32, w: FW - 64, h: FH - 64, r: 10, fill: null, sw: 3, sc: WHITE }].concat(fo));

    // the clock on the wall: a breathing prop, in phase with everything (the world dances)
    prop(CA, P + "_CLOCK", clockNodes(), { x: 870, y: 690, s: .8, t0: 0, t1: D, amp: .07, blink: 1.1 });

    // 1. title: an iris opens on the hero; the title hops in a travelling wave, the sub-line sits on a plate; the clapper snaps on "starts".
    // On "Three" the title rolls up like a window shade.
    var T0 = B.title.t0, T1 = B.title.t1, tw = ons(T0, T1), HO1 = { x: cx, y: 1430, s: 1 };
    hero(CA, P + "_HERO1", { x: HO1.x, y: HO1.y, s: 1, t0: T0, t1: T1, clap: [tw[2]], amp: .05,
      hl: [{ t: T0, v: [-220, -230], o: 50 }, { t: tw[2] - .12, v: [-200, -190], i: 60, o: 40 }, { t: tw[2], v: [-330, -560], i: 70 }],
      hr: [{ t: T0, v: [220, -230], o: 50 }, { t: tw[2] - .12, v: [200, -190], i: 60, o: 40 }, { t: tw[2], v: [330, -560], i: 70 }],
      mouth: [{ t: T0, m: "smile" }, { t: tw[2] - .02, m: "grin" }], look: [{ t: T0, v: [0, 0], o: "H" }, { t: tw[1], v: [0, -8], o: "H" }] });
    burst(CA, P + "_CLAPFX", [HO1.x - 30, HO1.y - 520], tw[2], 120);
    var SUN = piece(CA, P + "_T_SUN", sunburst(400, 24), [cx, 420]); span(SUN, T0, T1); SUN.rotation.expression = "posterizeTime(12); time * 24;";
    var SB = plate(CA, P + "_T_PLATE", 800, 132, [cx, 492], T0, T1);
    var TT = title(CA, P + "_T_HERO", B.title.context, { size: 168, pos: [cx, 290], maxW: 880, hop: 26, t0: T0, t1: T1 });
    var SU = title(CA, P + "_T_SUB", B.title.hero.toUpperCase(), { family: DECO, size: 60, pos: [cx, 492], maxW: 700, stroke: false, shadow: 0, tracking: 40, t0: tw[2] - .02, t1: T1 });
    var shade = [SUN, TT.L, SB, SU.L], sh0 = T1 - .2;
    for (var si = 0; si < shade.length; si++) { var Ls = shade[si], p0 = Ls.position.value;
      keys(Ls.position, [{ t: sh0, v: p0, o: 40 }, { t: T1, v: [p0[0], p0[1] - 260], i: "L" }]); keys(Ls.scale, [{ t: sh0, v: [100, 100], o: 40 }, { t: T1, v: [100, 4], i: "L" }]); }
    var I1 = iris(CA, P + "_IRIS_IN", HO1.x, HO1.y - 330, T0, T0 + .5); keys(I1.size, [{ t: T0, v: [0, 0], o: 30 }, { t: T0 + .42, v: [2800, 2800], i: 70 }]);

    // 2. picture: three pieces drop onto the chair rail on "Three", "pieces", "build" (each lands with a squash); the hero reaches for each one
    // with a rubber-hose stretch; on "picture" a frame drops around all three and the clapper snaps: one picture.
    var P0 = B.picture.t0, P1 = B.picture.t1, pw = ons(P0, P1), HO2 = { x: cx, y: 1450, s: .78 }, RAIL = 812;
    var PC = [[180, personNodes(), .8], [500, docNodes(), .86], [820, radioNodes(), .8]], PL = [];
    for (var pi = 0; pi < 3; pi++) { var LP = prop(CA, P + "_PIECE" + pi, PC[pi][1], { x: PC[pi][0], y: RAIL, s: PC[pi][2], t0: P0, t1: P1, amp: .06, blink: pi * .9 });
      drop(LP, pw[pi], RAIL, PC[pi][2]); PL.push(LP); }
    var reach = function (i) { return local(HO2, [PC[i][0], RAIL - 240]); };
    hero(CA, P + "_HERO2", { x: HO2.x, y: HO2.y, s: HO2.s, t0: P0, t1: P1, clap: [pw[4] + .06], amp: .05,
      hl: [{ t: P0, v: [-230, -170], o: 60 }, { t: pw[0] + .05, v: reach(0), i: 70, o: "H" }, { t: pw[2] - .05, v: reach(0), o: 50 }, { t: pw[2] + .1, v: [-240, -210], i: 60, o: 40 }, { t: pw[4] + .06, v: [-360, -660], i: 70 }],
      hr: [{ t: P0, v: [230, -170], o: 60 }, { t: pw[1] + .05, v: reach(1), i: 70, o: "H" }, { t: pw[2] - .05, v: reach(1), o: 50 }, { t: pw[2] + .08, v: reach(2), i: 70, o: "H" }, { t: pw[4] - .1, v: reach(2), o: 50 }, { t: pw[4] + .06, v: [360, -660], i: 70 }],
      mouth: [{ t: P0, m: "oh" }, { t: pw[2], m: "grin" }], look: [{ t: P0, v: [-10, -8], o: "H" }, { t: pw[1], v: [0, -10], o: "H" }, { t: pw[2], v: [10, -8], o: "H" }, { t: pw[4], v: [0, 0], o: "H" }] });
    var FRM = [{ k: "rect", x: -470, y: -290, w: 940, h: 580, r: 16, fill: null, sw: 22 }, { k: "rect", x: -452, y: -272, w: 904, h: 544, r: 10, fill: null, sw: 4, sc: WHITE }, { k: "rect", x: -484, y: -304, w: 968, h: 608, r: 22, fill: null, sw: 4 }];
    for (var fc = 0; fc < 4; fc++) { var fxp = fc % 2 ? 470 : -470, fyp = fc < 2 ? -290 : 290; FRM.push({ k: "circle", x: fxp, y: fyp, r: 26, fill: g(.3), sw: 6 }, { k: "circle", x: fxp, y: fyp, r: 9, fill: WHITE }); }
    var PF = piece(CA, P + "_PICFRAME", FRM, [cx, 570]); span(PF, pw[4] - .2, P1); drop(PF, pw[4], 570, 1);
    burst(CA, P + "_PICFX", [cx, 280], pw[4] + .06, 90);

    // 3. input: hard cut, closer: the hero holds the real frame up over its head (the arms stretch to the frame's corners); it pops up on the cut
    var I0 = B.input.t0, I1e = B.input.t1, iw = ons(I0, I1e), HO3 = { x: cx, y: 1470, s: .9 }, FP = [cx, 560];
    var F1 = CA.layers.add(FR); F1.name = P + "_FRAME1"; F1.startTime = I0; span(F1, I0, I1e);
    keys(F1.position, [{ t: I0, v: [cx, 760], o: 30 }, { t: I0 + .16, v: [cx, 520], i: 60, o: 60 }, { t: I0 + .28, v: FP, i: 70 }]);
    keys(F1.scale, [{ t: I0, v: [80, 120], o: 40 }, { t: I0 + .16, v: [108, 94], i: 60, o: 60 }, { t: I0 + .3, v: [100, 100], i: 70 }]);
    F1.rotation.expression = "posterizeTime(12); 1.2 * Math.sin(2 * Math.PI * time * " + BPS + " / 2);";
    var cornerL = function (dy) { return local(HO3, [cx - FW / 2 + 40, FP[1] + FH / 2 - 10 + dy]); }, cornerR = function (dy) { return local(HO3, [cx + FW / 2 - 40, FP[1] + FH / 2 - 10 + dy]); };
    hero(CA, P + "_HERO3", { x: HO3.x, y: HO3.y, s: HO3.s, t0: I0, t1: I1e, amp: .045, blink: .7,
      hl: [{ t: I0, v: cornerL(200), o: 30 }, { t: I0 + .16, v: cornerL(-40), i: 60, o: 60 }, { t: I0 + .28, v: cornerL(0), i: 70 }],
      hr: [{ t: I0, v: cornerR(200), o: 30 }, { t: I0 + .16, v: cornerR(-40), i: 60, o: 60 }, { t: I0 + .28, v: cornerR(0), i: 70 }],
      mouth: [{ t: I0, m: "grin" }, { t: iw[3], m: "oh" }, { t: iw[5], m: "grin" }], look: [{ t: I0, v: [0, -12], o: "H" }, { t: iw[4], v: [12, -4], o: "H" }],
      sq: [{ t: I0, v: [112, 76], o: 40 }, { t: I0 + .14, v: [84, 104], i: 60, o: 60 }, { t: I0 + .3, v: [90, 90], i: 70 }] });

    // 4. number: the count runs on twos in a fat outlined script and lands with a squash on "frames"; FRAMES sits on a plate; "counted!" is
    // stamped. The hero dances below, a foot tapping the beat, the clapper snapping on each spoken word.
    var N0 = B.number.t0, N1 = B.number.t1, nw = ons(N0, N1), val = B.number.value, HO4 = { x: cx, y: 1450, s: .85 };
    var NU = title(CA, P + "_N_NUM", String(val), { size: 330, pos: [cx, 360], hop: 22, sk: .12, t0: N0, t1: N1 });
    NU.L.anchorPoint.expression = "var r = sourceRectAtTime(time, false); [r.left + r.width / 2, r.top + r.height / 2];";
    var counts = [], steps = Math.max(2, Math.round((nw[1] - N0) * TWOS)); for (var c = 0; c <= steps; c++) { var e = 1 - Math.pow(1 - c / steps, 2.2); counts.push(String(Math.round(val * e))); }
    AESLib.bakeText(NU.L, counts, TWOS, N0);
    keys(NU.L.scale, [{ t: N0, v: [60, 60], o: 40 }, { t: N0 + .14, v: [104, 104], i: 60, o: "H" }, { t: nw[1] - .02, v: [100, 100], o: 40 }, { t: nw[1] + .08, v: [124, 80], i: 60, o: 60 }, { t: nw[1] + .2, v: [94, 106], i: 60, o: 60 }, { t: nw[1] + .34, v: [100, 100], i: 70 }]);
    var FB = plate(CA, P + "_N_PLATE", 560, 130, [cx, 640], nw[1] - .02, N1); pop(FB, nw[1] - .02);
    var FT = title(CA, P + "_N_FRAMES", "FRAMES", { family: DECO, size: 76, pos: [cx, 640], stroke: false, shadow: 0, tracking: 120, t0: nw[1] - .02, t1: N1 }); pop(FT.L, nw[1] - .02);
    var CT = title(CA, P + "_N_COUNTED", "counted!", { size: 150, pos: [cx, 860], sk: .15, hop: 16, t0: nw[2] - .02, t1: N1 }); CT.L.rotation.setValue(-6); pop(CT.L, nw[2] - .02);
    hero(CA, P + "_HERO4", { x: HO4.x, y: HO4.y, s: HO4.s, t0: N0, t1: N1, clap: [nw[1], nw[2]], amp: .07, tap: true, blink: 1.4,
      hl: [{ t: N0, v: [-250, -250], o: 50 }, { t: N0 + .5, v: [-300, -420], i: 50, o: 50 }, { t: N0 + 1, v: [-250, -230], i: 50, o: 50 }, { t: N0 + 1.5, v: [-300, -440], i: 50 }],
      hr: [{ t: N0, v: [300, -420], o: 50 }, { t: N0 + .5, v: [250, -250], i: 50, o: 50 }, { t: N0 + 1, v: [300, -440], i: 50, o: 50 }, { t: N0 + 1.5, v: [250, -230], i: 50 }],
      mouth: [{ t: N0, m: "oh" }, { t: nw[1], m: "grin" }], look: [{ t: N0, v: [0, -14], o: "H" }, { t: nw[2], v: [-10, -6], o: "H" }] });

    // 5. line: the bouncing-ball singalong. A near-black period card (white double rule, dot-and-ring corners) with the line in IM Fell
    // English SC; a ball hops from word to word on the spoken onsets, and each word is typed as the ball lands on it. The hero stands on the
    // card, swinging its arms to the beat.
    var L0 = B.line.t0, L1 = B.line.t1, lw = ons(L0, L1), CP = [cx, 900], CW = 900, CH = 600;
    plate(CA, P + "_L_CARD", CW, CH, CP, L0, L1);
    var rows = ["Every word", "I say", "gets typed."], rw = [[0, 1], [2, 3], [4, 5]], LS = 92, LT = [], BP = [], BT = [];
    for (var r = 0; r < rows.length; r++) { var full = textW(CA, rows[r], CARD, LS), rowY = CP[1] - 150 + r * 150;
      var RL = AESLib.text(CA, P + "_L_ROW" + r, rows[r], { family: CARD, style: "Regular", size: LS, color: WHITE, just: "left" });
      RL.anchorPoint.setValue([full.left + full.width / 2, full.top + full.height / 2]); RL.position.setValue([cx, rowY + 20]); span(RL, L0, L1);
      var ws = rows[r].split(" "), tt = [L0], ss = [" "];
      for (var wi = 0; wi < ws.length; wi++) { var pre = textW(CA, ws.slice(0, wi + 1).join(" "), CARD, LS), one = textW(CA, ws[wi], CARD, LS), at = lw[rw[r][wi]];
        BP.push([cx - full.width / 2 + (pre.left + pre.width) - full.left - one.width / 2, rowY + 20 - full.height / 2 - 40]); BT.push(at);
        if (at <= L0 + .001) ss[0] = ws.slice(0, wi + 1).join(" "); else { tt.push(at); ss.push(ws.slice(0, wi + 1).join(" ")); } }
      AESLib.textKeys(RL, tt, ss); LT.push(RL); }
    BT.unshift(L0 - .02); BP.unshift([CP[0] - CW / 2 + 40, CP[1] - CH / 2 - 60]); BT.push(L1 + .4); BP.push(BP[BP.length - 1]);
    ball(CA, P + "_L_BALL", BT, BP, L0, L1);
    var HO5 = { x: cx + 250, y: CP[1] - CH / 2 + 6, s: .62 };
    hero(CA, P + "_HERO5", { x: HO5.x, y: HO5.y, s: HO5.s, t0: L0, t1: L1, clap: [lw[5]], amp: .07, blink: .3,
      hl: [{ t: L0, v: [-260, -380], o: 50 }, { t: L0 + .5, v: [-300, -200], i: 50, o: 50 }, { t: L0 + 1, v: [-260, -420], i: 50 }],
      hr: [{ t: L0, v: [300, -200], o: 50 }, { t: L0 + .5, v: [260, -400], i: 50, o: 50 }, { t: L0 + 1, v: [300, -200], i: 50 }],
      mouth: [{ t: L0, m: "oh" }, { t: lw[2], m: "grin" }, { t: lw[4], m: "oh" }, { t: lw[5], m: "grin" }], look: [{ t: L0, v: [-14, 6], o: "H" }] });

    // 7 (laid out before 6, which turns into it). end: the end card with the line in the fat script, letters hopping; the hero waves beside it
    // and takes a bow, then an iris closes on its face.
    var E0 = B.end.t0, E1 = B.end.t1, ew = ons(E0, E1), CS = ons(B.carry.t0, B.carry.t1), next = CS[CS.length - 1], EP = [cx, 600];
    var EC = plate(CA, P + "_E_CARD", 860, 640, EP, next, E1); pop(EC, next);
    var E1t = title(CA, P + "_E_A", "That's", { size: 190, pos: [cx, EP[1] - 110], hop: 22, t0: Math.max(next, ew[0] - .02), t1: E1 }); pop(E1t.L, ew[0] - .02);
    var E2t = title(CA, P + "_E_B", "the test.", { size: 170, pos: [cx, EP[1] + 110], maxW: 760, hop: 22, t0: ew[1] - .02, t1: E1 }); pop(E2t.L, ew[1] - .02);
    var HO7 = { x: 760, y: 1460, s: .78 }, IX = HO7.x, IY = HO7.y - 330 * HO7.s, bow = ew[2] + .25;
    hero(CA, P + "_HERO7", { x: HO7.x, y: HO7.y, s: HO7.s, t0: next, t1: E1, amp: .05, blink: 2.2, clap: [ew[2]],
      hl: [{ t: next, v: [-230, -170], o: 50 }, { t: E0, v: [-330, -560], i: 60, o: 50 }, { t: E0 + .25, v: [-260, -600], i: 50, o: 50 }, { t: E0 + .5, v: [-340, -560], i: 50, o: 50 }, { t: bow, v: [-200, -120], i: 60 }],
      hr: [{ t: next, v: [230, -170], o: "H" }, { t: bow, v: [230, -170], o: 50 }, { t: bow + .25, v: [120, -100], i: 60 }],
      mouth: [{ t: next, m: "grin" }, { t: bow, m: "smile" }], look: [{ t: next, v: [-12, -4], o: "H" }, { t: bow + .2, v: [-6, 6], o: "H" }],
      rot: [{ t: next, v: 0, o: "H" }, { t: bow, v: 0, o: 50 }, { t: bow + .25, v: -14, i: 60, o: "H" }, { t: bow + .55, v: -14, o: 50 }, { t: bow + .8, v: 0, i: 60 }] });
    var I7 = iris(CA, P + "_IRIS_OUT", IX, IY, E1 - .7, E1); keys(I7.size, [{ t: E1 - .7, v: [2800, 2800], o: 50 }, { t: E1 - .12, v: [0, 0], i: 85 }]);

    // 6. carry: the real frame comes back (it is the thing that becomes the next). The hero grabs its corner; on "thing" it squashes (the
    // anticipation), on "becomes" it stretches and spins away into a puff, and the end card pops out of the puff on "next".
    var C0 = B.carry.t0, C1 = B.carry.t1, cw = ons(C0, C1), HO6 = { x: 190, y: 1460, s: .8 }, CF = [650, 600];
    var F2 = CA.layers.add(FR); F2.name = P + "_FRAME2"; F2.startTime = C0 - 1.1; span(F2, C0, next + .02);
    F2.position.setValue(CF);
    keys(F2.scale, [{ t: C0, v: [86, 86], o: 50 }, { t: cw[2], v: [86, 86], o: 50 }, { t: cw[2] + .16, v: [100, 70], i: 60, o: "H" }, { t: cw[3], v: [100, 70], o: 30 },
      { t: cw[3] + .14, v: [56, 130], i: 50, o: 40 }, { t: next, v: [0, 0], i: 50 }]);
    keys(F2.rotation, [{ t: cw[3], v: 0, o: 20 }, { t: next, v: 300, i: 50 }]);
    var grab = function (dy) { return local(HO6, [CF[0] - FW * .43 + 30, CF[1] + FH * .43 - 10 + dy]); };
    hero(CA, P + "_HERO6", { x: HO6.x, y: HO6.y, s: HO6.s, t0: C0, t1: next, amp: .05, blink: 1.9, clap: [cw[3]],
      hl: [{ t: C0, v: [-230, -170], o: "H" }], hr: [{ t: C0, v: grab(0), o: "H" }, { t: cw[2], v: grab(0), o: 50 }, { t: cw[2] + .16, v: grab(70), i: 60, o: "H" }, { t: cw[3], v: grab(70), o: 40 }, { t: cw[3] + .14, v: [260, -150], i: 60 }],
      mouth: [{ t: C0, m: "grin" }, { t: cw[2], m: "oh" }, { t: cw[3] + .1, m: "grin" }], look: [{ t: C0, v: [12, -10], o: "H" }],
      sq: [{ t: C0, v: [80, 80], o: "H" }, { t: cw[2], v: [80, 80], o: 50 }, { t: cw[2] + .16, v: [88, 70], i: 60, o: "H" }, { t: cw[3], v: [88, 70], o: 40 }, { t: cw[3] + .1, v: [70, 96], i: 60, o: 60 }, { t: cw[3] + .3, v: [80, 80], i: 70 }] });
    puff(CA, P + "_PUFF", [CF[0] - 60, CF[1]], next - .14, 13, 330);

    // CAST on twos with a light line boil (three drawings cycling at 12 fps); the painted room under it never boils
    var SET = piece(ST, P + "_SET", setNodes(GW, GH));
    var BL = solid(ST, P + "_BLOTCH", [.5, .5, .5]), bf = fx(BL, "ADBE Fractal Noise"); bf.property("Contrast").setValue(60); bf.property("Scale").setValue(420); bf.property("Complexity").setValue(3);
    BL.blendingMode = BlendingMode.SOFT_LIGHT; BL.opacity.setValue(45);
    var IV = solid(ST, P + "_EDGES", [0, 0, 0]), iv = IV.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"); iv.property("ADBE Mask Shape").setValue(rrect(60, 60, GW - 120, GH - 120, 80));
    iv.inverted = true; iv.property("ADBE Mask Feather").setValue([220, 220]); IV.opacity.setValue(35);
    var CL = ST.layers.add(CA); CL.name = P + "_CASTL";
    fx(CL, "ADBE Posterize Time").property("Frame Rate").setValue(TWOS);
    var td = fx(CL, "ADBE Turbulent Displace"); td.property("Amount").setValue(2.4); td.property("Size").setValue(26);
    td.property("Evolution").expression = "(Math.floor(time * 12) % 3) * 120;";
    // the main comp: black house, the print, the rounded gate with a soft inner shadow
    solid(comp, P + "_HOUSEBG", PALETTE.house);
    var FL = comp.layers.add(ST); FL.name = P + "_FILMPRINT"; FL.position.setValue([(GT.x0 + GT.x1) / 2, (GT.y0 + GT.y1) / 2]);
    var cuts = []; for (var bi = 1; bi < scene.beats.length; bi++) cuts.push(n3(scene.beats[bi].t0)); cuts.push(n3(next));
    print(comp, P, FL, GT, cuts, notes);
    var AP = comp.layers.addShape(); AP.name = P + "_APERTURE"; AP.anchorPoint.setValue([0, 0]); AP.position.setValue([0, 0]); var ag = AP.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").property("ADBE Vectors Group");
    ag.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(poly([[-200, -200], [W + 200, -200], [W + 200, comp.height + 200], [-200, comp.height + 200]]));
    ag.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(rrect(GT.x0, GT.y0, GW, GH, 28));
    var af = ag.addProperty("ADBE Vector Graphic - Fill"); af.property("ADBE Vector Fill Color").setValue([0, 0, 0]); af.property("ADBE Vector Fill Rule").setValue(2);
    var AS = comp.layers.addShape(); AS.name = P + "_GATESHADOW"; AS.anchorPoint.setValue([0, 0]); AS.position.setValue([0, 0]);
    var sg = AS.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").property("ADBE Vectors Group"); sg.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(rrect(GT.x0 + 4, GT.y0 + 4, GW - 8, GH - 8, 26));
    var ss2 = sg.addProperty("ADBE Vector Graphic - Stroke"); ss2.property("ADBE Vector Stroke Color").setValue([0, 0, 0]); ss2.property("ADBE Vector Stroke Width").setValue(26);
    fx(AS, "ADBE Gaussian Blur 2").property("Blurriness").setValue(18); AS.opacity.setValue(70);
    AP.moveToBeginning();
    return { layers: comp.numLayers + ST.numLayers + CA.numLayers + FR.numLayers, notes: notes };
  }
  return { SCRIPT: SCRIPT, DECO: DECO, CARD: CARD, PALETTE: PALETTE, fontOK: fontOK, keys: keys, piece: piece, grp: grp, groupT: groupT, hero: hero, heroNodes: heroNodes,
    prop: prop, drop: drop, personNodes: personNodes, docNodes: docNodes, radioNodes: radioNodes, clockNodes: clockNodes, setNodes: setNodes, plate: plate, title: title,
    hop: hop, ball: ball, puff: puff, burst: burst, iris: iris, print: print, smooth: smooth, pie: pie, rrect: rrect, ell: ell, buildScene: buildScene };
})();
