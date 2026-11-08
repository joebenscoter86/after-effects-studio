// Silent film style: brand-neutral ES3 helpers. No project mutation happens at load.
// Read styles/silent-film/STYLE.md first. A 1920s one-reel picture as it looks projected: grey tonal drawings with an ink line, hatched in their
// darks by one global pass (Venetian Blinds through a luma matte of the drawing itself), printed on silver stock (Tint, flicker, weave, grain,
// scratches, dust, burn), sampled hand-cranked at 16 fps inside a rounded gate between velvet drapes, above the footlights and a dark house.
// Nobody speaks on screen: intertitle cards with deco borders carry the words; irises open and close on what matters.
// Adapted from Lemo-Opuscar's silent-film style (MIT, LemoLab); see assets/LICENSE-lemo-opuscar.txt.
var AESSilent = (function () {
  var TITLE = "Playfair Display SC", ITAL = "Old Standard TT";
  function g(v) { return [v, v, v]; }
  var PALETTE = { ink: g(.07), card: g(.075), cardInk: g(.88), printBlack: [.075, .06, .048], printWhite: [.95, .92, .85],
    velvet: [.34, .035, .05], velvetDark: [.03, .005, .01], house: [.025, .015, .014], brass: [.62, .47, .22], footlight: [1, .78, .5], wood: [.2, .11, .06] };
  var CRANK = 16;                                                    // the picture is sampled at 16 fps; the print damage changes every output frame
  var PERFRAME = "seedRandom(timeToFrames(time), true); ";
  function fontOK() { AESLib.font(TITLE, "Bold"); AESLib.font(TITLE, "Regular"); AESLib.font(ITAL, "Italic"); return true; }

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
  function span(L, t0, t1) { L.inPoint = t0; L.outPoint = t1; return L; }      // in before out: setting inPoint after outPoint loses the out point
  function solid(comp, name, color, w, h, pos) { var L = comp.layers.addSolid(color, name, w || comp.width, h || comp.height, 1); if (pos) L.position.setValue(pos); return L; }

  // ---- shapes: { k: "poly"|"line"|"rect"|"ellipse"|"circle"|"group", ..., fill (grey value or rgb, or null), sw (stroke width), sc (stroke colour) }
  var KAPPA = .5523;
  function poly(pts, closed) { var s = new Shape(); s.vertices = pts; s.closed = closed !== false; return s; }
  function ell(cx, cy, rx, ry) { var a = KAPPA * rx, b = KAPPA * ry, s = new Shape(); s.vertices = [[cx, cy - ry], [cx + rx, cy], [cx, cy + ry], [cx - rx, cy]];
    s.inTangents = [[-a, 0], [0, -b], [a, 0], [0, b]]; s.outTangents = [[a, 0], [0, b], [-a, 0], [0, -b]]; s.closed = true; return s; }
  function rrect(x, y, w, h, r) { var k = (1 - KAPPA) * r, s = new Shape();
    s.vertices = [[x + r, y], [x + w - r, y], [x + w, y + r], [x + w, y + h - r], [x + w - r, y + h], [x + r, y + h], [x, y + h - r], [x, y + r]];
    s.inTangents = [[-r + k, 0], [0, 0], [0, -r + k], [0, 0], [r - k, 0], [0, 0], [0, r - k], [0, 0]];
    s.outTangents = [[0, 0], [r - k, 0], [0, 0], [0, r - k], [0, 0], [-r + k, 0], [0, 0], [0, -r + k]]; s.closed = true; return s; }
  function col(v) { if (v instanceof Array) return v; return g(v); }
  function shapeOf(n) { if (n.k === "circle") return ell(n.x, n.y, n.r, n.r);
    if (n.k === "ellipse") return ell(n.x, n.y, n.rx, n.ry);
    if (n.k === "rect") return poly([[n.x, n.y], [n.x + n.w, n.y], [n.x + n.w, n.y + n.h], [n.x, n.y + n.h]]);
    if (n.k === "line") return poly(n.pts, false);
    return poly(n.pts); }
  function emit(contents, nodes) {
    for (var i = nodes.length - 1; i >= 0; i--) { var n = nodes[i], gr = contents.addProperty("ADBE Vector Group"); if (n.id) gr.name = n.id;
      var tg = gr.property("ADBE Vector Transform Group");
      if (n.pivot) { tg.property("ADBE Vector Anchor").setValue(n.pivot); tg.property("ADBE Vector Position").setValue(n.pivot); }
      if (n.rot) tg.property("ADBE Vector Rotation").setValue(n.rot);
      var v = gr.property("ADBE Vectors Group");
      if (n.k === "group") { emit(v, n.kids); continue; }
      v.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(shapeOf(n));
      if (n.sw) { var st = v.addProperty("ADBE Vector Graphic - Stroke"); st.property("ADBE Vector Stroke Color").setValue(col(n.sc === undefined ? .07 : n.sc));
        st.property("ADBE Vector Stroke Width").setValue(n.sw); st.property("ADBE Vector Stroke Line Join").setValue(2); st.property("ADBE Vector Stroke Line Cap").setValue(2); }
      if (n.fill !== undefined && n.fill !== null && n.k !== "line") v.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(col(n.fill)); } }
  function piece(comp, name, nodes, pos) { var L = comp.layers.addShape(); L.name = name; emit(L.property("ADBE Root Vectors Group"), nodes);
    L.anchorPoint.setValue([0, 0]); L.position.setValue(pos || [0, 0]); return L; }
  function groupT(L, path) { var gr = L.property("ADBE Root Vectors Group");
    for (var i = 0; i < path.length; i++) { gr = gr.property(path[i]); if (i < path.length - 1) gr = gr.property("ADBE Vectors Group"); }
    return gr.property("ADBE Vector Transform Group"); }
  // a black layer with a round hole (even-odd fill): the iris. Returns { layer, size, pos } property handles fetched fresh.
  function iris(comp, name, cx, cy, t0, t1) { var L = comp.layers.addShape(); L.name = name; L.anchorPoint.setValue([0, 0]); L.position.setValue([0, 0]); var gr = L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    var v = gr.property("ADBE Vectors Group"); var r = v.addProperty("ADBE Vector Shape - Rect"); r.property("ADBE Vector Rect Size").setValue([6000, 6000]);
    var e = v.addProperty("ADBE Vector Shape - Ellipse"); e.property("ADBE Vector Ellipse Position").setValue([cx, cy]);
    var f = v.addProperty("ADBE Vector Graphic - Fill"); f.property("ADBE Vector Fill Color").setValue([0, 0, 0]); f.property("ADBE Vector Fill Rule").setValue(2);
    span(L, t0, t1); var vv = L.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group");
    return { layer: L, size: vv.property(2).property("ADBE Vector Ellipse Size"), pos: vv.property(2).property("ADBE Vector Ellipse Position") }; }

  // ---- type: left-justified layers placed by the full string's ink box, so a line that is written on word by word never jumps
  function words(comp, name, full, o) { var L = AESLib.text(comp, name, full, { family: o.family, style: o.style, size: o.size, color: o.color || PALETTE.cardInk, just: "left", tracking: o.tracking });
    var r = L.sourceRectAtTime(0, false); L.anchorPoint.setValue([r.left + r.width / 2, r.top + r.height / 2]); L.position.setValue([o.x, o.y]);
    if (o.maxW && r.width > o.maxW) { var s = 100 * o.maxW / r.width; L.scale.setValue([s, s]); }
    if (o.keys) AESLib.textKeys(L, o.keys.t, o.keys.s);
    span(L, o.t0, o.t1); return L; }
  function wordsIn(list, t0, t1) { var r = []; for (var i = 0; i < list.length; i++) if (list[i].s >= t0 - .05 && list[i].s < t1) r.push(list[i]); return r; }
  // a line that builds on spoken onsets: keys at the beat start (blank) then one per word, all in one call
  function build(str, ons, t0) { var w = str.split(" "), t = [t0], s = [" "];
    for (var i = 0; i < w.length; i++) { var at = ons[Math.min(i, ons.length - 1)]; if (at <= t0 + .001) { s[0] = w.slice(0, i + 1).join(" "); continue; } t.push(at); s.push(w.slice(0, i + 1).join(" ")); }
    return { t: t, s: s }; }

  // ---- the intertitle card: a black painted card whose border follows the emotion.
  // kind "narration": double rule, stepped corners, fans; "shout": one heavy rule; "tender": thin rule, curls and dots at the corners.
  function cardBorder(W, H, kind, ink) { var n = [];
    if (kind === "shout") { n.push({ k: "rect", x: 52, y: 52, w: W - 104, h: H - 104, fill: null, sw: 16, sc: ink }); n.push({ k: "rect", x: 82, y: 82, w: W - 164, h: H - 164, fill: null, sw: 2, sc: ink }); return n; }
    var a = 46, b = 64; n.push({ k: "rect", x: a, y: a, w: W - 2 * a, h: H - 2 * a, fill: null, sw: kind === "tender" ? 2 : 4, sc: ink });
    if (kind === "narration") n.push({ k: "rect", x: b, y: b, w: W - 2 * b, h: H - 2 * b, fill: null, sw: 1.6, sc: ink });
    var C = [[b, b, 1, 1], [W - b, b, -1, 1], [W - b, H - b, -1, -1], [b, H - b, 1, -1]];
    for (var c = 0; c < 4; c++) { var x = C[c][0], y = C[c][1], sx = C[c][2], sy = C[c][3];
      if (kind === "narration") {
        n.push({ k: "rect", x: x + (sx > 0 ? 0 : -22), y: y + (sy > 0 ? 0 : -22), w: 22, h: 22, fill: ink });                  // the stepped corner
        n.push({ k: "rect", x: x + (sx > 0 ? 22 : -34), y: y + (sy > 0 ? 22 : -34), w: 12, h: 12, fill: ink });
        var R = 96, arc = [];                                                                                                    // the fan
        for (var q = 0; q <= 8; q++) { var an = Math.PI / 2 * q / 8; arc.push([x + sx * (22 + R * Math.cos(an)), y + sy * (22 + R * Math.sin(an))]); }
        n.push({ k: "line", pts: arc, sw: 2.2, sc: ink });
        for (var r = 1; r < 6; r++) { var ar = Math.PI / 2 * r / 6; n.push({ k: "line", pts: [[x + sx * 34, y + sy * 34], [x + sx * (22 + (R - 4) * Math.cos(ar)), y + sy * (22 + (R - 4) * Math.sin(ar))]], sw: 1.6, sc: ink }); }
      } else {
        n.push({ k: "circle", x: x + sx * 26, y: y + sy * 26, r: 16, fill: null, sw: 2, sc: ink }); n.push({ k: "circle", x: x + sx * 26, y: y + sy * 26, r: 5, fill: ink });
        n.push({ k: "circle", x: x + sx * 66, y: y + sy * 14, r: 8, fill: null, sw: 1.6, sc: ink }); n.push({ k: "circle", x: x + sx * 14, y: y + sy * 66, r: 8, fill: null, sw: 1.6, sc: ink });
        n.push({ k: "ellipse", x: x + sx * 92, y: y + sy * 10, rx: 12, ry: 4, fill: ink }); n.push({ k: "ellipse", x: x + sx * 10, y: y + sy * 92, rx: 4, ry: 12, fill: ink }); } }
    return n; }
  function ornament(cx, y, half, ink) { return [{ k: "line", pts: [[cx - half, y], [cx - 18, y]], sw: 2, sc: ink }, { k: "line", pts: [[cx + 18, y], [cx + half, y]], sw: 2, sc: ink },
    { k: "poly", pts: [[cx, y - 11], [cx + 11, y], [cx, y + 11], [cx - 11, y]], fill: ink }]; }
  function card(comp, P, kind, t0, t1, extra) { var W = comp.width, H = comp.height;
    span(solid(comp, P + "_BG", PALETTE.card), t0, t1);
    span(piece(comp, P + "_BORDER", cardBorder(W, H, kind, PALETTE.cardInk).concat(extra || [])), t0, t1); }

  // ---- the figure: realistic proportions (about 7.5 heads, 594 px at scale 100), front-on and deadpan, feet at the layer origin.
  // Silent-era make-up: pale skin, dark lids and lips. Identity by a flat cap and a dark waistcoat (never a bowler, moustache or cane).
  function figureNodes() { var I = .07, skin = .82, shirt = .9, dark = .22, cap = .28;
    function leg(id, s) { return { k: "group", id: id, pivot: [s * 22, -300], kids: [{ k: "poly", pts: [[s * 4, -310], [s * 46, -310], [s * 40, -20], [s * 10, -20]], fill: dark, sw: 3 },
      { k: "poly", pts: [[s * 6, -22], [s * 44, -22], [s * 52, 0], [s * 2, 0]], fill: .1, sw: 3 }] }; }
    function arm(id, s) { return { k: "group", id: id, pivot: [s * 64, -462], kids: [{ k: "poly", pts: [[s * 56, -472], [s * 82, -470], [s * 84, -372], [s * 60, -370]], fill: shirt, sw: 3 },
      { k: "group", id: "F", pivot: [s * 72, -372], kids: [{ k: "poly", pts: [[s * 60, -372], [s * 84, -372], [s * 84, -276], [s * 64, -274]], fill: shirt, sw: 3 },
        { k: "circle", x: s * 74, y: -262, r: 13, fill: skin, sw: 2.5 }] }] }; }
    return [leg("LL", -1), leg("LR", 1), arm("AL", -1), arm("AR", 1),
      { k: "poly", pts: [[-62, -476], [62, -476], [58, -298], [-58, -298]], fill: shirt, sw: 3 },
      { k: "poly", pts: [[-56, -460], [-16, -460], [0, -392], [16, -460], [56, -460], [58, -300], [-58, -300]], fill: dark, sw: 3 },
      { k: "rect", x: -58, y: -312, w: 116, h: 14, fill: .14, sw: 2.5 },
      { k: "circle", x: 0, y: -372, r: 4, fill: .85 }, { k: "circle", x: 0, y: -346, r: 4, fill: .85 }, { k: "circle", x: 0, y: -320, r: 4, fill: .85 },
      { k: "poly", pts: [[-6, -474], [6, -474], [10, -418], [0, -404], [-10, -418]], fill: .14, sw: 2 },
      { k: "rect", x: -12, y: -504, w: 24, h: 32, fill: skin, sw: 2.5 },
      { k: "ellipse", x: 0, y: -546, rx: 32, ry: 42, fill: skin, sw: 3 },
      { k: "group", id: "EY", kids: [{ k: "ellipse", x: -12, y: -552, rx: 7, ry: 3.2, fill: .12 }, { k: "ellipse", x: 12, y: -552, rx: 7, ry: 3.2, fill: .12 }] },
      { k: "line", pts: [[-20, -563], [-5, -561]], sw: 2.5, sc: .15 }, { k: "line", pts: [[5, -561], [20, -563]], sw: 2.5, sc: .15 },
      { k: "rect", x: -9, y: -521, w: 18, h: 3.5, fill: .2 },
      { k: "poly", pts: [[-36, -570], [-30, -594], [30, -596], [38, -572]], fill: cap, sw: 3 },
      { k: "poly", pts: [[-40, -576], [42, -576], [50, -564], [-46, -564]], fill: .18, sw: 3 }]; }
  // o = { x0, x1, y, t0, t1, tw0, tw1 (the walk), scale, look: [{ t, v }] eye offsets }
  function figure(comp, name, o) { var L = piece(comp, name, figureNodes()); span(L, o.t0, o.t1); var s = o.scale || 100;
    L.scale.setValue([s, s]); L.position.setValue([o.x0, o.y]);
    if (o.x1 !== undefined) keys(L.position, [{ t: o.tw0, v: [o.x0, o.y], o: "L" }, { t: o.tw1, v: [o.x1, o.y], i: 60 }]);
    var clk = "var w = 0; if (time > " + o.tw0 + " && time < " + o.tw1 + ") w = 1; var p = 2 * Math.PI * 1.8 * (time - " + o.tw0 + "); ";
    var ex = [[["LL"], "w * 9 * Math.sin(p)"], [["LR"], "-w * 9 * Math.sin(p)"], [["AL"], "-w * 7 * Math.sin(p) + 2"], [["AR"], "w * 7 * Math.sin(p) - 2"],
      [["AL", "F"], "-w * 4"], [["AR", "F"], "w * 4"]];
    for (var i = 0; i < ex.length; i++) groupT(L, ex[i][0]).property("ADBE Vector Rotation").expression = clk + ex[i][1] + ";";
    L.position.expression = clk + "value - [0, w * 7 * Math.abs(Math.sin(p))];";
    if (o.look) keys(groupT(L, ["EY"]).property("ADBE Vector Position"), o.look);
    return L; }

  // ---- the props of the proof scene, drawn as tonal shapes with an ink line
  function setNodes(W, H) { var n = [{ k: "rect", x: 0, y: 0, w: W, h: 1010, fill: .86 }];
    for (var sx = 40; sx < W; sx += 80) n.push({ k: "rect", x: sx, y: 190, w: 3, h: 630, fill: .8 });
    n.push({ k: "rect", x: -4, y: 176, w: W + 8, h: 14, fill: .55, sw: 3 });
    n.push({ k: "rect", x: 120, y: 300, w: 210, h: 160, fill: .3, sw: 3 }, { k: "rect", x: 140, y: 320, w: 170, h: 120, fill: .72, sw: 2 },
      { k: "poly", pts: [[140, 440], [200, 370], [240, 410], [270, 380], [310, 440]], fill: .45, sw: 2 });
    n.push({ k: "rect", x: -4, y: 820, w: W + 8, h: 190, fill: .6, sw: 3 });
    for (var p = 0; p < 5; p++) n.push({ k: "rect", x: 24 + p * 190, y: 846, w: 164, h: 138, fill: null, sw: 2 });
    n.push({ k: "rect", x: 0, y: 1010, w: W, h: H - 1010, fill: .44, sw: 3 });
    for (var b = -6; b <= 14; b++) { var x0 = 480 + (b * 110 - 480) * .45, x1 = 480 + (b * 110 - 480) * 1.6; n.push({ k: "line", pts: [[x0, 1012], [x1, H + 20]], sw: 2, sc: .3 }); }
    n.push({ k: "rect", x: -4, y: 996, w: W + 8, h: 22, fill: .3, sw: 3 });
    // the table
    n.push({ k: "rect", x: 540, y: 900, w: 22, h: 250, fill: .32, sw: 3 }, { k: "rect", x: 852, y: 900, w: 22, h: 250, fill: .32, sw: 3 },
      { k: "poly", pts: [[530, 860], [880, 860], [902, 896], [508, 896]], fill: .58, sw: 3 }, { k: "rect", x: 516, y: 896, w: 378, h: 40, fill: .38, sw: 3 });
    return n; }
  function letterNodes() { var n = [{ k: "poly", pts: [[-78, -98], [78, -98], [78, 98], [-78, 98]], fill: .95, sw: 3 }];
    for (var r = 0; r < 7; r++) n.push({ k: "line", pts: [[-56, -50 + r * 20], [r === 6 ? 10 : 56, -50 + r * 20]], sw: 2.5, sc: .35 });
    n.push({ k: "line", pts: [[-56, -74], [-4, -74]], sw: 4, sc: .2 }, { k: "circle", x: 0, y: -88, r: 7, fill: .3, sw: 2 }); return n; }
  function phoneNodes() { var d = .2; return [{ k: "line", pts: [[44, -10], [80, 10], [110, 30]], sw: 3, sc: .15 },
    { k: "ellipse", x: 0, y: -8, rx: 54, ry: 14, fill: d, sw: 3 }, { k: "rect", x: -9, y: -170, w: 18, h: 160, fill: d, sw: 3 },
    { k: "poly", pts: [[-30, -168], [30, -168], [18, -196], [-18, -196]], fill: .16, sw: 3 }, { k: "ellipse", x: 0, y: -198, rx: 24, ry: 7, fill: .1, sw: 2 },
    { k: "rect", x: 9, y: -132, w: 46, h: 8, fill: d, sw: 2 },
    { k: "poly", pts: [[48, -142], [66, -142], [70, -50], [44, -50]], fill: .17, sw: 3 }, { k: "ellipse", x: 57, y: -50, rx: 15, ry: 6, fill: .1, sw: 2 }]; }

  // ---- the picture house around the gate: velvet drapes (stretched Fractal Noise folds, tinted), a scalloped valance with a brass cord,
  // a stage lip with footlights, a pianist in the pit and a row of heads, lit by the screen's spill.
  function velvet(comp, name, w, h, scaleW, notes) { var L = solid(comp, name, [.5, .5, .5], w, h); var f = fx(L, "ADBE Fractal Noise");
    try { f.property("Contrast").setValue(170); f.property("Brightness").setValue(-8); f.property("Complexity").setValue(2); f.property("Uniform Scaling").setValue(0);
      f = L.property("ADBE Effect Parade").property(1); f.property("Scale Width").setValue(scaleW); f.property("Scale Height").setValue(6000); } catch (e) { notes.push("velvet: " + e.toString()); }
    var t = fx(L, "ADBE Tint"); t.property("Map Black To").setValue(PALETTE.velvetDark); t.property("Map White To").setValue(PALETTE.velvet); return L; }
  function theatre(comp, P, GT, notes) { var W = comp.width, H = comp.height, out = {};
    // stage lip, footlights, pit
    piece(comp, P + "_STAGE", [{ k: "rect", x: -10, y: GT.y1 + 14, w: W + 20, h: 66, fill: PALETTE.wood }, { k: "rect", x: -10, y: GT.y1 + 14, w: W + 20, h: 4, fill: [.55, .36, .18] },
      { k: "rect", x: -10, y: GT.y1 + 80, w: W + 20, h: 8, fill: [.06, .03, .02] }]);
    var fl = []; for (var i = 0; i < 9; i++) { var x = 70 + i * 117.5; fl.push({ k: "ellipse", x: x, y: GT.y1 + 30, rx: 26, ry: 9, fill: PALETTE.footlight }, { k: "poly", pts: [[x - 34, GT.y1 + 30], [x + 34, GT.y1 + 30], [x + 26, GT.y1 + 58], [x - 26, GT.y1 + 58]], fill: [.12, .07, .04] }); }
    var FL = piece(comp, P + "_FOOTLIGHTS", fl), gl = fx(FL, "ADBE Glo2"); gl.property("Glow Threshold").setValue(40); gl.property("Glow Radius").setValue(40); gl.property("Glow Intensity").setValue(1.6);
    var pit = [{ k: "rect", x: 60, y: GT.y1 + 190, w: 330, h: 240, fill: [.045, .025, .02], sw: 3, sc: [.2, .14, .1] }, { k: "rect", x: 44, y: GT.y1 + 176, w: 362, h: 22, fill: [.06, .035, .025], sw: 3, sc: [.26, .18, .12] },
      { k: "rect", x: 300, y: GT.y1 + 120, w: 34, h: 56, fill: [.5, .4, .25] }, { k: "ellipse", x: 317, y: GT.y1 + 114, rx: 34, ry: 12, fill: [.9, .7, .4] }];
    piece(comp, P + "_PIANO", pit);
    var pianist = piece(comp, P + "_PIANIST", [{ k: "ellipse", x: 0, y: 70, rx: 70, ry: 60, fill: [.02, .012, .01], sw: 3, sc: [.22, .16, .12] }, { k: "circle", x: 0, y: 0, r: 34, fill: [.02, .012, .01], sw: 3, sc: [.22, .16, .12] }], [470, GT.y1 + 180]);
    pianist.position.expression = "posterizeTime(6); seedRandom(Math.floor(time * 6), true); value + [random(-4, 4), Math.abs(Math.sin(time * 9)) * -6];";
    var heads = [], hx = [40, 170, 300, 440, 570, 700, 830, 960, 1080];
    for (var h = 0; h < hx.length; h++) { var y = H - 70 + (h % 2) * 18; heads.push({ k: "ellipse", x: hx[h], y: y + 70, rx: 120, ry: 66, fill: [.015, .01, .01], sw: 3, sc: [.16, .13, .12] }, { k: "ellipse", x: hx[h] + 4, y: y - 10, rx: 44, ry: 54, fill: [.015, .01, .01], sw: 3, sc: [.16, .13, .12] }); }
    piece(comp, P + "_HOUSE", heads);
    // drapes: closed over the gate at the start, gathered to the sides as the picture begins
    var dw = W / 2 + 30, dh = GT.y1 + 30;
    var DL = velvet(comp, P + "_DRAPE_L", dw, dh, 26, notes); DL.anchorPoint.setValue([0, 0]); DL.position.setValue([0, 0]);
    var DR = velvet(comp, P + "_DRAPE_R", dw, dh, 26, notes); DR.anchorPoint.setValue([dw, 0]); DR.position.setValue([W, 0]);
    var open = 100 * (GT.x0 + 14) / dw; out.drapes = [DL, DR];
    // valance with scallops and a brass cord
    var VA = velvet(comp, P + "_VALANCE", W, GT.y0 + 60, 14, notes); VA.anchorPoint.setValue([0, 0]); VA.position.setValue([0, 0]);
    var sc = [[0, 0], [W, 0]], n8 = 8, vy = GT.y0 + 6, dip = 46; for (var s = n8; s >= 0; s--) sc.push([W * s / n8, vy]);
    var vs = new Shape(), vv = [[0, 0], [W, 0]], vi = [[0, 0], [0, 0]], vo = [[0, 0], [0, 0]];
    for (var k = n8; k >= 0; k--) { vv.push([W * k / n8, vy]); vi.push(k === n8 ? [0, 0] : [W / n8 * .45, dip * 1.3]); vo.push(k === 0 ? [0, 0] : [-W / n8 * .45, dip * 1.3]); }
    vs.vertices = vv; vs.inTangents = vi; vs.outTangents = vo; vs.closed = true;
    VA.property("ADBE Mask Parade").addProperty("ADBE Mask Atom").property("ADBE Mask Shape").setValue(vs);
    var cord = new Shape(); cord.vertices = vv.slice(2); cord.inTangents = vi.slice(2); cord.outTangents = vo.slice(2); cord.closed = false;
    var CO = comp.layers.addShape(); CO.name = P + "_CORD"; CO.anchorPoint.setValue([0, 0]); CO.position.setValue([0, 0]); var cg = CO.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").property("ADBE Vectors Group");
    cg.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(cord); var cs = cg.addProperty("ADBE Vector Graphic - Stroke");
    cs.property("ADBE Vector Stroke Color").setValue(PALETTE.brass); cs.property("ADBE Vector Stroke Width").setValue(6);
    var tas = []; for (var tq = 0; tq <= n8; tq++) tas.push({ k: "poly", pts: [[W * tq / n8 - 7, vy], [W * tq / n8 + 7, vy], [W * tq / n8 + 4, vy + 34], [W * tq / n8 - 4, vy + 34]], fill: PALETTE.brass });
    piece(comp, P + "_TASSELS", tas);
    // the screen's spill on the house (multiplied, with the gate cut out) and the footlights' warm glow from below
    var SP = solid(comp, P + "_SPILL", [1, 1, 1]); var rp = fx(SP, "ADBE Ramp");
    rp.property("Start of Ramp").setValue([W / 2, (GT.y0 + GT.y1) / 2]); rp.property("Start Color").setValue([1, .96, .9]); rp.property("End of Ramp").setValue([W / 2 + 1050, (GT.y0 + GT.y1) / 2]);
    rp.property("End Color").setValue([.12, .1, .1]); rp.property("Ramp Shape").setValue(2); SP.blendingMode = BlendingMode.MULTIPLY;
    var sm = SP.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"); sm.property("ADBE Mask Shape").setValue(rrect(GT.x0 + 30, GT.y0 + 30, GT.x1 - GT.x0 - 60, GT.y1 - GT.y0 - 60, 30)); sm.inverted = true;
    var FG = solid(comp, P + "_FOOTGLOW", [1, 1, 1]); var fr = fx(FG, "ADBE Ramp");
    fr.property("Start of Ramp").setValue([W / 2, GT.y1 + 40]); fr.property("Start Color").setValue([.55, .3, .12]); fr.property("End of Ramp").setValue([W / 2, GT.y1 - 520]); fr.property("End Color").setValue([0, 0, 0]);
    FG.blendingMode = BlendingMode.ADD; FG.opacity.setValue(45);
    var fm = FG.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"); fm.property("ADBE Mask Shape").setValue(poly([[0, 0], [W, 0], [W, GT.y1 + 14], [0, GT.y1 + 14]]));
    fm = FG.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"); fm.property("ADBE Mask Shape").setValue(rrect(GT.x0, GT.y0, GT.x1 - GT.x0, GT.y1 - GT.y0, 30)); fm.maskMode = MaskMode.SUBTRACT;
    out.open = open; return out; }

  // ---- the print: hand-cranked sampling, silver tint with a little sepia, halation, flicker, uneven density, weave and perforation jumps,
  // grain, broken scratches, dust, a hair in the gate, burn creeping from the edges, a vignette, and a rounded aperture with a soft dark rim.
  function print(comp, P, FILM, GT, notes) { var gw = GT.x1 - GT.x0, gh = GT.y1 - GT.y0, c = [(GT.x0 + GT.x1) / 2, (GT.y0 + GT.y1) / 2];
    var pt = fx(FILM, "ADBE Posterize Time"); pt.property("Frame Rate").setValue(CRANK);
    var tn = fx(FILM, "ADBE Tint"); tn.property("Map Black To").setValue(PALETTE.printBlack); tn.property("Map White To").setValue(PALETTE.printWhite);
    var bc = fx(FILM, "ADBE Brightness & Contrast 2"); bc.property("Contrast").setValue(14);
    var gl = fx(FILM, "ADBE Glo2"); gl.property("Glow Based On").setValue(2); gl.property("Glow Threshold").setValue(78); gl.property("Glow Radius").setValue(26); gl.property("Glow Intensity").setValue(.45);
    FILM.position.expression = "posterizeTime(" + CRANK + "); seedRandom(timeToFrames(time), true); var j = 0; if (random() < .035) j = 16; value + [random(-1.3, 1.3), random(-1.8, 1.8) + j];";
    var DN = solid(comp, P + "_DENSITY", [.5, .5, .5], gw, gh, c), df = fx(DN, "ADBE Fractal Noise"); df.property("Contrast").setValue(70); df.property("Scale").setValue(900); df.property("Complexity").setValue(2);
    df.property("Evolution").expression = PERFRAME + "random(0, 3600);"; DN.blendingMode = BlendingMode.OVERLAY; DN.opacity.setValue(22);
    var FK = solid(comp, P + "_FLICKER", [1, 1, 1], gw, gh, c); FK.adjustmentLayer = true; var fb = fx(FK, "ADBE Brightness & Contrast 2");
    fb.property("Brightness").expression = PERFRAME + "random(-9, 6);";
    var GR = solid(comp, P + "_GRAIN", [1, 1, 1], gw, gh, c); GR.adjustmentLayer = true; var gn = fx(GR, "ADBE Noise"); gn.property("Amount of Noise").setValue(9);
    try { GR.property("ADBE Effect Parade").property(1).property(2).setValue(0); } catch (e) { notes.push("grain colour: " + e.toString()); }
    var FG = solid(comp, P + "_SILVER", [.5, .5, .5], gw, gh, c), ff = fx(FG, "ADBE Fractal Noise"); ff.property("Contrast").setValue(220); ff.property("Scale").setValue(4); ff.property("Complexity").setValue(1);
    ff.property("Evolution").expression = PERFRAME + "random(0, 3600);"; FG.blendingMode = BlendingMode.OVERLAY; FG.opacity.setValue(14);
    // scratches: thin lines whose x jitters every frame; each runs for a stretch and is broken (random length and offset)
    var SC = [[.22, .95, 1.6, 0], [.64, .95, 1.2, 1], [.81, .1, 1.6, 2], [.4, .1, 1.2, 3]];
    for (var s = 0; s < SC.length; s++) { var L = piece(comp, P + "_SCRATCH" + s, [{ k: "rect", x: -SC[s][2] / 2, y: -gh / 2, w: SC[s][2], h: gh, fill: SC[s][1] }], c);
      L.position.expression = PERFRAME + "var k = " + s + "; seedRandom(Math.floor(time / 1.3) * 7 + k, true); var bx = " + GT.x0 + " + random(.1, .9) * " + gw + "; seedRandom(timeToFrames(time) * 3 + k, true);"
        + " [bx + random(-3, 3) + " + (SC[s][0] * 40 - 20) + ", " + c[1] + " + random(-200, 200)];";
      L.scale.expression = PERFRAME + "[100, random(30, 110)];";
      L.opacity.expression = "seedRandom(Math.floor(time / 1.3) * 7 + " + s + ", true); var on = random() < .55; seedRandom(timeToFrames(time) * 5 + " + s + ", true); var o = 0; if (on && random() < .8) o = random(25, 70); o;"; }
    // dust: specks re-scattered every frame, light (scraped emulsion) and dark (dirt on the negative)
    var dust = []; for (var d = 0; d < 7; d++) dust.push({ k: "group", id: "D" + d, kids: [{ k: "ellipse", x: 0, y: 0, rx: 2 + (d % 3) * 2, ry: 1.5 + (d % 2) * 3, fill: d % 2 ? .95 : .06 }] });
    var DU = piece(comp, P + "_DUST", dust, [0, 0]);
    for (var e = 0; e < 7; e++) { var tg = groupT(DU, ["D" + e]); tg.property("ADBE Vector Position").expression = PERFRAME + "seedRandom(timeToFrames(time) * 11 + " + e + ", true); [random(" + (GT.x0 + 20) + ", " + (GT.x1 - 20) + "), random(" + (GT.y0 + 20) + ", " + (GT.y1 - 20) + ")];";
      tg.property("ADBE Vector Group Opacity").expression = "seedRandom(timeToFrames(time) * 13 + " + e + ", true); var o = 0; if (random() < .45) o = random(40, 90); o;"; }
    // a hair caught in the gate for a few seconds
    var hs = new Shape(); hs.vertices = [[0, 0], [20, 60], [-6, 120], [24, 170]]; hs.inTangents = [[0, 0], [-14, -20], [10, -20], [-10, -14]]; hs.outTangents = [[10, 20], [14, 20], [-10, 20], [0, 0]]; hs.closed = false;
    var HA = comp.layers.addShape(); HA.name = P + "_HAIR"; HA.anchorPoint.setValue([0, 0]); var hg = HA.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").property("ADBE Vectors Group");
    hg.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(hs); var hst = hg.addProperty("ADBE Vector Graphic - Stroke");
    hst.property("ADBE Vector Stroke Color").setValue([.05, .04, .03]); hst.property("ADBE Vector Stroke Width").setValue(2.4);
    HA.position.setValue([GT.x0 + 70, GT.y1 - 260]); span(HA, 4.6, 7.4); HA.position.expression = PERFRAME + "value + [random(-2, 2), random(-3, 3)];"; HA.opacity.setValue(80);
    // burn creeping from the edges (brown, flickering) and a vignette
    var BU = solid(comp, P + "_BURN", [.36, .19, .07], gw, gh, c), bm = BU.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
    bm.property("ADBE Mask Shape").setValue(rrect(40, 40, gw - 80, gh - 80, 60)); bm.inverted = true; bm.property("ADBE Mask Feather").setValue([150, 150]);
    BU.property("ADBE Mask Parade").property(1).property("ADBE Mask Offset").expression = PERFRAME + "random(-14, 10);";
    BU.blendingMode = BlendingMode.MULTIPLY; BU.opacity.expression = PERFRAME + "random(55, 75);";
    var VI = solid(comp, P + "_VIGNETTE", [0, 0, 0], gw, gh, c), vm = VI.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
    vm.property("ADBE Mask Shape").setValue(ell(gw / 2, gh / 2, gw * .62, gh * .6)); vm.inverted = true; vm.property("ADBE Mask Feather").setValue([380, 380]); VI.opacity.setValue(62);
    return { burn: BU }; }
  // the film burns through at the end: a char ring, a brown edge and the lamp's white grow from one point in the print
  function burnThrough(comp, P, x, y, t0, t1, notes) { var R = [[.06, .03, .01, 128], [.5, .25, .07, 116], [.97, .95, .9, 100]], out = [];
    for (var i = 0; i < R.length; i++) { var L = piece(comp, P + "_BURNTHRU" + i, [{ k: "circle", x: 0, y: 0, r: R[i][3], fill: [R[i][0], R[i][1], R[i][2]] }], [x, y]); span(L, t0, t1);
      keys(L.scale, [{ t: t0, v: [0, 0], o: 20 }, { t: t1, v: [1500, 1500], i: "L" }]);
      try { var r = fx(L, "ADBE Roughen Edges"); r.property("Border").setValue(30); r.property("Scale").setValue(40); r.property("Complexity").setValue(4); r.property("Evolution").expression = "time * 900;"; } catch (e) { notes.push("burn edge: " + e.toString()); }
      out.push(L); }
    var gl = fx(out[2], "ADBE Glo2"); gl.property("Glow Radius").setValue(60); gl.property("Glow Intensity").setValue(1.2); return out; }

  // ---- the hatch pass: a stripe solid (Venetian Blinds) shown only where a luma copy of the drawing is dark. Two passes cross in the deepest darks.
  // Every layer of the FILM comp jitters a pixel on twos (12 fps), so the drawing looks re-drawn by hand.
  function hatch(comp, P, DRAW, level, dir, notes) { var H = comp.layers.add(DRAW); H.name = P + "_HATCH" + dir;
    var th = fx(H, "ADBE Threshold2"); th.property("Level").setValue(level);                 // black in the darks, white elsewhere
    var vb = fx(H, "ADBE Venetian Blinds");                                                   // cut into stripes (alpha)
    vb.property("Transition Completion").setValue(dir === 45 ? 66 : 70); vb.property("Direction").setValue(dir); vb.property("Width").setValue(dir === 45 ? 7 : 6); vb.property("Feather").setValue(.6);
    H.blendingMode = BlendingMode.MULTIPLY;                                                   // white stripes vanish, black stripes are the hatch
    H.position.expression = "posterizeTime(12); seedRandom(Math.floor(time * 12) + " + dir + ", true); value + [random(-1.5, 1.5), random(-1.5, 1.5)];";
    H.opacity.setValue(dir === 45 ? 92 : 85); return H; }

  // buildScene: the shared test scene (production/styles/scene) as a one-reel silent picture. comp = an empty 1080 x 1920 comp at scene.fps.
  // The gate (a portrait print, see STYLE.md 8) sits between the drapes; inside it, DRAW holds the picture, FILM hatches it, and the print pass
  // runs on the FILM layer in the main comp. Cards: the title (narration), the number (shout), the line (tender), the end (narration, the echo).
  function buildScene(comp, scene, opts) {
    fontOK(); var P = opts.prefix || "SIL", A = opts.assets, B = scene.beat, W = comp.width, H = comp.height, notes = [], WL = scene.wordList, D = comp.duration, fps = comp.frameRate;
    AESLib.clearOwned(comp, P);
    var GT = { x0: 60, x1: 1020, y0: 170, y1: 1490 }, GW = GT.x1 - GT.x0, GH = GT.y1 - GT.y0;
    var DR = app.project.items.addComp(P + "_DRAW", GW, GH, 1, D, fps); DR.bgColor = [0, 0, 0];
    var FI = app.project.items.addComp(P + "_FILM", GW, GH, 1, D, fps); FI.bgColor = [0, 0, 0];
    solid(DR, P + "_BLACK", [0, 0, 0]);
    var ons = function (t0, t1) { var r = [], w = wordsIn(WL, t0, t1); for (var i = 0; i < w.length; i++) r.push(w[i].s); return r; };
    var cx = GW / 2, ink = PALETTE.cardInk;

    // 1. title: a narration card (double rule, stepped corners, fans) seen as the drapes part; the hero line is cut in on its first word
    var T0 = B.title.t0, T1 = B.title.t1, tw = ons(T0, T1);
    card(DR, P + "_C1", "narration", T0, T1, ornament(cx, 640, 190, ink));
    words(DR, P + "_C1_CTX", B.title.context.toUpperCase(), { family: TITLE, style: "Bold", size: 122, tracking: 40, x: cx, y: 540, maxW: 760, t0: T0, t1: T1 });
    words(DR, P + "_C1_HERO", B.title.hero + ".", { family: ITAL, style: "Italic", size: 88, x: cx, y: 760, maxW: 780, t0: Math.max(T0, tw[2] - .02), t1: T1 });

    // 2. picture: an iris opens on a locked wide set. Three: the figure strolls in, deadpan. pieces: a letter drops onto the wall and wobbles
    // to rest. build: a telephone appears on the table by substitution (one frame, a Melies trick), rocks and settles. He looks at it, then at us.
    var P0 = B.picture.t0, P1 = B.picture.t1, pw = ons(P0, P1);
    span(piece(DR, P + "_SET", setNodes(GW, GH)), P0, P1);
    var LT = piece(DR, P + "_LETTER", letterNodes(), [650, 640]); span(LT, P0, P1);
    keys(LT.position, [{ t: pw[1] - .02, v: [650, -140], o: "L" }, { t: pw[1] + .14, v: [650, 640], i: 70 }]);
    keys(LT.rotation, [{ t: pw[1] + .1, v: -14, o: 50 }, { t: pw[1] + .22, v: 7, i: 50, o: 50 }, { t: pw[1] + .34, v: -3, i: 50, o: 50 }, { t: pw[1] + .46, v: 4, i: 60 }]);
    var PH = piece(DR, P + "_PHONE", phoneNodes(), [720, 866]); span(PH, pw[2], P1);
    keys(PH.rotation, [{ t: pw[2], v: -6, o: 50 }, { t: pw[2] + .12, v: 4, i: 50, o: 50 }, { t: pw[2] + .24, v: -1.5, i: 50, o: 50 }, { t: pw[2] + .36, v: 0, i: 60 }]);
    figure(DR, P + "_FIGURE", { x0: -120, x1: 300, y: 1196, t0: P0, t1: P1, tw0: P0, tw1: pw[1] + .28, scale: 112,
      look: [{ t: P0, v: [0, 0], o: "H" }, { t: pw[2] + .08, v: [6, -1], o: "H" }, { t: pw[3] + .2, v: [0, 0], o: "H" }] });
    var I2 = iris(DR, P + "_IRIS2", 360, 760, P0, P1); keys(I2.size, [{ t: P0, v: [0, 0], o: 30 }, { t: P0 + .34, v: [2600, 2600], i: 80 }]);

    // 3. input: hard cut to the real frame, redrawn in ink (tools/redraw.mjs), behind a half-open iris that holds on the face, then opens wider
    var I0 = B.input.t0, I1 = B.input.t1, FX = [440, 380], FP = [GW / 2, 560];
    var rd = AESLib.importFile(A.redraw), RD = DR.layers.add(rd); RD.name = P + "_REAL"; RD.startTime = I0; span(RD, I0, I1);
    RD.anchorPoint.setValue(FX); RD.position.setValue(FP);
    var RM = RD.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"); RM.property("ADBE Mask Feather").setValue([14, 14]);
    keys(RD.property("ADBE Mask Parade").property(1).property("ADBE Mask Shape"), [{ t: I0, v: ell(FX[0], FX[1], 8, 8), o: 30 }, { t: I0 + .3, v: ell(FX[0], FX[1], 330, 330), i: 80, o: "H" },
      { t: I0 + .85, v: ell(FX[0], FX[1], 330, 330), o: 60 }, { t: I1 - .1, v: ell(FX[0], FX[1], 470, 470), i: 70 }]);

    // 4. number: a shout card (one heavy rule). The count runs hand-cranked to the figure, FRAMES lands with it, "counted." is cut in and shakes.
    var N0 = B.number.t0, N1 = B.number.t1, nw = ons(N0, N1), val = B.number.value;
    card(DR, P + "_C4", "shout", N0, N1, ornament(cx, 820, 230, ink));
    var NU = words(DR, P + "_C4_NUM", String(val), { family: TITLE, style: "Bold", size: 330, x: cx, y: 560, t0: N0, t1: N1 });
    NU.anchorPoint.expression = "var r = sourceRectAtTime(time, false); [r.left + r.width / 2, r.top + r.height / 2];";
    var counts = [], cn = 11; for (var c = 0; c <= cn; c++) { var e = 1 - Math.pow(1 - c / cn, 2.2); counts.push(String(Math.round(val * e))); }
    AESLib.bakeText(NU, counts, CRANK, N0);
    words(DR, P + "_C4_FRAMES", "FRAMES,", { family: TITLE, style: "Regular", size: 96, tracking: 260, x: cx, y: 900, t0: nw[1] - .02, t1: N1 });
    var CT = words(DR, P + "_C4_COUNTED", "counted.", { family: ITAL, style: "Italic", size: 136, x: cx, y: 1080, t0: nw[2] - .02, t1: N1 });
    CT.position.expression = "var t0 = " + nw[2] + "; if (time >= t0 && time < t0 + .35) { seedRandom(timeToFrames(time), true); value + [random(-7, 7), random(-6, 6)]; } else { value; }";

    // 5. line: a tender card (thin rule, curls); the dialogue is set in italic between quotes, each word cut in on its spoken onset
    var L0 = B.line.t0, L1 = B.line.t1, lw = ons(L0, L1);
    card(DR, P + "_C5", "tender", L0, L1);
    var rows = ["“Every word", "I say", "gets typed.”"], rw = [[lw[0], lw[1]], [lw[2], lw[3]], [lw[4], lw[5]]];
    for (var r = 0; r < rows.length; r++) words(DR, P + "_C5_L" + r, rows[r], { family: ITAL, style: "Italic", size: 120, x: cx, y: 500 + 170 * r, maxW: 800, t0: L0, t1: L1, keys: build(rows[r], rw[r], L0) });
    var tl = []; tl = tl.concat(ornament(cx, 1040, 160, ink)); span(piece(DR, P + "_C5_ORN", tl), L0, L1);

    // 7 (laid out before 6, which flies into it). end: a narration card again (the echo of the title), the real face in a round medallion at the top
    var E0 = B.end.t0, E1 = B.end.t1, ew = ons(E0, E1), CS = ons(B.carry.t0, B.carry.t1), MED = [cx, 380], MR = 150, cut = CS[CS.length - 1];
    card(DR, P + "_C7", "narration", cut, E1, [{ k: "circle", x: MED[0], y: MED[1], r: MR + 14, fill: null, sw: 4, sc: ink }, { k: "circle", x: MED[0], y: MED[1], r: MR + 26, fill: null, sw: 1.6, sc: ink }].concat(ornament(cx, 1010, 190, ink)));
    words(DR, P + "_C7_A", "THAT’S", { family: TITLE, style: "Bold", size: 140, tracking: 40, x: cx, y: 720, t0: Math.max(cut, ew[0] - .02), t1: E1 });
    words(DR, P + "_C7_B", "THE TEST.", { family: TITLE, style: "Bold", size: 140, tracking: 40, x: cx, y: 880, maxW: 780, t0: ew[1] - .02, t1: E1 });

    // 6. carry: the redrawn face returns at the size the input left it; on "becomes" the iris closes and travels to the medallion; on "next" the
    // card is cut in around it, so the face is the end card's portrait (one thing becomes the next). One layer, time-remapped, holds a frame after.
    var C0 = B.carry.t0, C1 = B.carry.t1, cw = ons(C0, C1);
    var RE = DR.layers.add(rd); RE.name = P + "_REAL2"; RE.timeRemapEnabled = true;
    var TR = RE.property("ADBE Time Remapping"); keys(TR, [{ t: C0, v: 0, o: "L" }, { t: C1, v: Math.min(rd.duration - 1 / 16, 1.4), i: "L", o: "H" }]);
    RE.startTime = 0; span(RE, C0, E1); RE.anchorPoint.setValue(FX);
    keys(RE.position, [{ t: cw[3] - .02, v: FP, o: 60 }, { t: cut - .04, v: MED, i: 80 }]);
    var RM2 = RE.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"); RM2.property("ADBE Mask Feather").setValue([4, 4]);
    keys(RE.property("ADBE Mask Parade").property(1).property("ADBE Mask Shape"), [{ t: C0, v: ell(FX[0], FX[1], 470, 470), o: "H" }, { t: cw[3] - .02, v: ell(FX[0], FX[1], 470, 470), o: 60 },
      { t: cut - .04, v: ell(FX[0], FX[1], MR, MR), i: 80 }]);

    // the redraw boil on the drawing, then FILM = DRAW + the hatch passes
    var DL = FI.layers.add(DR); DL.name = P + "_DRAWL"; var td = fx(DL, "ADBE Turbulent Displace"); td.property("Amount").setValue(2.2); td.property("Size").setValue(30);
    td.property("Evolution").expression = "posterizeTime(12); time * 720;";
    hatch(FI, P, DR, .46, 45, notes); hatch(FI, P, DR, .29, 135, notes);

    // the main comp: the house, the print, the aperture, then the theatre in front
    solid(comp, P + "_HOUSEBG", PALETTE.house);
    var FL = comp.layers.add(FI); FL.name = P + "_FILMPRINT"; FL.position.setValue([(GT.x0 + GT.x1) / 2, (GT.y0 + GT.y1) / 2]);
    print(comp, P, FL, GT, notes);
    burnThrough(comp, P, GT.x0 + GW * .62, GT.y0 + GH * .36, E1 - .5, E1, notes);
    var AP = comp.layers.addShape(); AP.name = P + "_APERTURE"; AP.anchorPoint.setValue([0, 0]); AP.position.setValue([0, 0]); var ag = AP.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").property("ADBE Vectors Group");
    ag.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(poly([[-200, -200], [W + 200, -200], [W + 200, H + 200], [-200, H + 200]]));
    ag.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(rrect(GT.x0 + 8, GT.y0 + 8, GW - 16, GH - 16, 34));
    var af = ag.addProperty("ADBE Vector Graphic - Fill"); af.property("ADBE Vector Fill Color").setValue([0, 0, 0]); af.property("ADBE Vector Fill Rule").setValue(2);
    fx(AP, "ADBE Gaussian Blur 2").property("Blurriness").setValue(26);
    var TH = theatre(comp, P, GT, notes);
    var op = TH.open; keys(TH.drapes[0].scale, [{ t: 0, v: [100, 100], o: "H" }, { t: .06, v: [100, 100], o: 40 }, { t: .72, v: [op, 100], i: 75 }]);
    keys(TH.drapes[1].scale, [{ t: 0, v: [100, 100], o: "H" }, { t: .06, v: [100, 100], o: 40 }, { t: .72, v: [op, 100], i: 75 }]);
    return { layers: comp.numLayers + DR.numLayers + FI.numLayers, notes: notes };
  }
  return { TITLE: TITLE, ITAL: ITAL, PALETTE: PALETTE, CRANK: CRANK, fontOK: fontOK, keys: keys, piece: piece, groupT: groupT, iris: iris, words: words, build: build,
    card: card, cardBorder: cardBorder, ornament: ornament, figure: figure, figureNodes: figureNodes, theatre: theatre, print: print, burnThrough: burnThrough, hatch: hatch,
    rrect: rrect, ell: ell, wordsIn: wordsIn, buildScene: buildScene };
})();
