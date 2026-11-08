// Copperplate engraving style: brand-neutral ES3 helpers. No project mutation happens at load.
// Read styles/engraving/STYLE.md first. An intaglio plate that cuts itself: a TONE drawing (0 = deepest shadow, 1 = bare paper) is turned
// into ink lines by three hatch families (soft line screens added in Linear Light, then Threshold), each switching on at a darker tone and
// crossing the one before, so line width swells where the form turns from the light and the cut order is outline and first hatching, then
// crossing, then the darks. The ink prints over cream laid paper inside a pressed plate mark; lettering is cut glyph by glyph, notes are
// written in script on a paper slip, and colour arrives last as a transparent wash laid under the ink.
// Adapted from Lemo-Opuscar's engraving style (MIT, LemoLab); see assets/LICENSE-lemo-opuscar.txt.
var AESEngraving = (function () {
  var BOD = "Bodoni Moda", PIN = "Pinyon Script";
  var PALETTE = { ink: [.11, .082, .063], paper: [.945, .91, .824], paperOuter: [.91, .875, .78], slip: [.969, .945, .882], bevelLight: [.99, .975, .94],
    bevelDark: [.74, .69, .58], washAmber: [.863, .678, .42], washBlueGrey: [.624, .702, .729], fox: [.72, .56, .36] };
  var MARK = { x: 34, y: 34, w: 1012, h: 1852 }, BORDER = 74;     // the pressed plate mark and the ruled border (rule + hairline)
  // three hatch families: period (px), screen strength p (Linear Light opacity), Threshold level, turn from the plate's angle.
  // A family draws where tone + p * (2 * screen - 1) < level, so it switches on below tone (level + p): about 0.86, 0.52 and 0.29.
  var FAMILIES = [{ id: "F1", period: 9, p: .40, level: .46, turn: 0 }, { id: "F2", period: 10, p: .32, level: .20, turn: 62 }, { id: "F3", period: 8, p: .22, level: .07, turn: -30 }];
  var TWOS = "posterizeTime(12); ";
  function fontOK() { AESLib.font(BOD, "Regular"); AESLib.font(BOD, "Italic"); AESLib.font(PIN, "Regular"); return true; }

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
  function g(v) { return [v, v, v]; }
  function col(v) { if (v instanceof Array) return v; return g(v); }

  // ---- shapes: { k: "poly"|"line"|"rect"|"ellipse"|"circle"|"group", ..., fill (tone 0..1 or rgb, or null), sw (stroke width), sc (stroke tone) }
  // Tone is the engraving instruction: 1 is bare paper, below about 0.86 the first hatching starts, below 0.52 it is crossed, below 0.29 the darks.
  var KAPPA = .5523;
  function poly(pts, closed) { var s = new Shape(); s.vertices = pts; s.closed = closed !== false; return s; }
  function ell(cx, cy, rx, ry) { var a = KAPPA * rx, b = KAPPA * ry, s = new Shape(); s.vertices = [[cx, cy - ry], [cx + rx, cy], [cx, cy + ry], [cx - rx, cy]];
    s.inTangents = [[-a, 0], [0, -b], [a, 0], [0, b]]; s.outTangents = [[a, 0], [0, b], [-a, 0], [0, -b]]; s.closed = true; return s; }
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
      if (n.sw) { var st = v.addProperty("ADBE Vector Graphic - Stroke"); st.property("ADBE Vector Stroke Color").setValue(col(n.sc === undefined ? 0 : n.sc));
        st.property("ADBE Vector Stroke Width").setValue(n.sw); st.property("ADBE Vector Stroke Line Join").setValue(2); st.property("ADBE Vector Stroke Line Cap").setValue(2); }
      if (n.fill !== undefined && n.fill !== null && n.k !== "line") v.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(col(n.fill)); } }
  function piece(comp, name, nodes, pos) { var L = comp.layers.addShape(); L.name = name; emit(L.property("ADBE Root Vectors Group"), nodes);
    L.anchorPoint.setValue([0, 0]); L.position.setValue(pos || [0, 0]); return L; }
  function groupT(L, path) { var gr = L.property("ADBE Root Vectors Group");
    for (var i = 0; i < path.length; i++) { gr = gr.property(path[i]); if (i < path.length - 1) gr = gr.property("ADBE Vectors Group"); }
    return gr.property("ADBE Vector Transform Group"); }
  function mask(L, shape, feather) { var m = L.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"); m.property("ADBE Mask Shape").setValue(shape);
    if (feather) m.property("ADBE Mask Feather").setValue([feather, feather]); return m; }
  // a lit sphere (pillow lighting from the upper left): a radial Ramp masked to the circle, with a tone-0 contour
  function sphere(comp, name, cx, cy, r) { var L = solid(comp, name, [1, 1, 1]), rp = fx(L, "ADBE Ramp");
    rp.property("Ramp Shape").setValue(2); rp.property("Start of Ramp").setValue([cx - .4 * r, cy - .44 * r]); rp.property("Start Color").setValue(g(.98));
    rp.property("End of Ramp").setValue([cx + .78 * r, cy + .8 * r]); rp.property("End Color").setValue(g(.06)); mask(L, ell(cx, cy, r, r)); return L; }
  // the burin reveal for drawn pieces: a feathered wipe, so a figure is cut along a direction (angle 180 = top to bottom)
  function cutIn(L, t0, dur, angle, feather) { var w = fx(L, "ADBE Linear Wipe"); w.property("Wipe Angle").setValue(angle === undefined ? 180 : angle);
    w.property("Feather").setValue(feather || 80); keys(w.property("Transition Completion"), [{ t: t0, v: 100, o: 30 }, { t: t0 + dur, v: 0, i: 70 }]); return L; }

  // ---- type: roman letters are cut glyph by glyph (a text animator's range start steps through the characters; no Source Text keys)
  function words(comp, name, full, o) { var L = AESLib.text(comp, name, full, { family: o.family, style: o.style, size: o.size, color: o.color || PALETTE.ink, just: o.just || "center", tracking: o.tracking });
    var r = L.sourceRectAtTime(0, false); L.anchorPoint.setValue([r.left + r.width / 2, r.top + r.height / 2]); L.position.setValue([o.x, o.y]);
    if (o.maxW && r.width > o.maxW) { var s = 100 * o.maxW / r.width; L.scale.setValue([s, s]); }
    if (o.keys) AESLib.textKeys(L, o.keys.t, o.keys.s);
    span(L, o.t0, o.t1); return { layer: L, rect: r }; }
  function cutGlyphs(L, t0, dur) { var A = L.property("ADBE Text Properties").property("ADBE Text Animators"); A.addProperty("ADBE Text Animator").name = "CUT";
    var an = L.property("ADBE Text Properties").property("ADBE Text Animators").property("CUT");
    an.property("ADBE Text Animator Properties").addProperty("ADBE Text Opacity").setValue(0);
    an.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
    var sel = L.property("ADBE Text Properties").property("ADBE Text Animators").property("CUT").property("ADBE Text Selectors").property(1);
    try { sel.property("ADBE Text Range Advanced").property("ADBE Text Selector Smoothness").setValue(0); } catch (e) {}
    keys(sel.property("ADBE Text Percent Start"), [{ t: t0, v: 0, o: "L" }, { t: t0 + dur, v: 100, i: "L" }]); return L; }
  function inkWidth(comp, str, o) { var L = AESLib.text(comp, "PROBE", str, { family: o.family, style: o.style, size: o.size, color: [0, 0, 0], just: "left", tracking: o.tracking });
    var w = L.sourceRectAtTime(0, false).width; L.remove(); return w; }
  function wordsIn(list, t0, t1) { var r = []; for (var i = 0; i < list.length; i++) if (list[i].s >= t0 - .05 && list[i].s < t1) r.push(list[i]); return r; }
  function build(str, ons, t0) { var w = str.split(" "), t = [t0], s = [" "];
    for (var i = 0; i < w.length; i++) { var at = ons[Math.min(i, ons.length - 1)]; if (at <= t0 + .001) { s[0] = w.slice(0, i + 1).join(" "); continue; } t.push(at); s.push(w.slice(0, i + 1).join(" ")); }
    return { t: t, s: s }; }

  // ---- the hatch families. Each is its own comp: the tone drawing + a soft line screen (Linear Light at p) + Threshold at its level.
  // The screen is roughened a little (Turbulent Displace) and bent by the drawing's own tone (Displacement Map), so lines follow form.
  function screenComp(P, f, D, fps) { var S = 2400, C = app.project.items.addComp(P + "_SCR_" + f.id, S, S, 1, D, fps); C.bgColor = [0, 0, 0];
    solid(C, P + "_SCRBG_" + f.id, [0, 0, 0]);
    var L = C.layers.addShape(); L.name = P + "_LINES_" + f.id; L.anchorPoint.setValue([0, 0]); L.position.setValue([S / 2, S / 2]);
    var v = L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").property("ADBE Vectors Group");
    var rc = v.addProperty("ADBE Vector Shape - Rect"); rc.property("ADBE Vector Rect Size").setValue([S + 400, f.period / 2]); rc.property("ADBE Vector Rect Position").setValue([0, -S / 2 - 40]);
    v.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue([1, 1, 1]);
    var rp = v.addProperty("ADBE Vector Filter - Repeater"); rp.property("ADBE Vector Repeater Copies").setValue(Math.ceil((S + 80) / f.period) + 2);
    rp.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([0, f.period]);
    fx(L, "ADBE Gaussian Blur 2").property("Blurriness").setValue(f.period * .32);
    return C; }
  function familyComp(P, f, DR, angles, D, fps, notes) { var C = app.project.items.addComp(P + "_" + f.id, DR.width, DR.height, 1, D, fps); C.bgColor = [1, 1, 1];
    var SCR = screenComp(P, f, D, fps);
    var DL = C.layers.add(DR); DL.name = P + "_DRAWL_" + f.id;
    var SL = C.layers.add(SCR); SL.name = P + "_SCREEN_" + f.id; SL.position.setValue([C.width / 2, C.height / 2]);
    var ak = []; for (var i = 0; i < angles.length; i++) ak.push({ t: angles[i].t, v: angles[i].v + f.turn, o: "H" }); keys(SL.rotation, ak);
    var tw = fx(SL, "ADBE Turbulent Displace"); tw.property("Amount").setValue(1.4); tw.property("Size").setValue(30);
    try { var dm = fx(SL, "ADBE Displacement Map"); dm.property("Use For Horizontal Displacement").setValue(11); dm.property("Max Horizontal Displacement").setValue(0);
      dm.property("Use For Vertical Displacement").setValue(5); dm.property("Max Vertical Displacement").setValue(6);
      dm.property("Displacement Map Layer").setValue(DL.index); } catch (e) { notes.push("form-following displacement: " + e.toString()); }
    SL.blendingMode = BlendingMode.LINEAR_LIGHT; SL.opacity.setValue(f.p * 100);
    var TH = solid(C, P + "_THRESH_" + f.id, [1, 1, 1]); TH.adjustmentLayer = true;
    fx(TH, "ADBE Gaussian Blur 2").property("Blurriness").setValue(.9);
    fx(TH, "ADBE Threshold2").property("Level").setValue(f.level);                    // 0..1 from scripting, not 0..255
    fx(TH, "ADBE Gaussian Blur 2").property("Blurriness").setValue(.55);              // a soft edge, so the hairlines do not alias
    return C; }
  // INK: the three families multiplied, each revealed per plate in cutting order (first hatching sweeps, then crossing, then the darks)
  function inkComp(P, fcomps, plates, D, fps) { var C = app.project.items.addComp(P + "_INK", fcomps[0].width, fcomps[0].height, 1, D, fps); C.bgColor = [1, 1, 1];
    solid(C, P + "_INKWHITE", [1, 1, 1]);
    var order = [{ off: 0, dur: .42, ang: 160 }, { off: .22, dur: .4, ang: 200 }, { off: .42, dur: .36, ang: 135 }];
    for (var i = 0; i < fcomps.length; i++) { var L = C.layers.add(fcomps[i]); L.name = P + "_INK_" + FAMILIES[i].id; if (i > 0) L.blendingMode = BlendingMode.MULTIPLY;
      var w = fx(L, "ADBE Linear Wipe"); w.property("Wipe Angle").setValue(order[i].ang); w.property("Feather").setValue(140);
      var k = [];
      for (var j = 0; j < plates.length; j++) { var s = plates[j].t, a = s + order[i].off, start = j === 0 ? plates[j].from : 100;
        k.push({ t: s, v: start, o: "H" }); if (a > s + .001) k.push({ t: a, v: start, o: 25 }); else k[k.length - 1].o = 25;
        k.push({ t: a + order[i].dur, v: 0, i: 70, o: "H" }); }
      keys(w.property("Transition Completion"), k); }
    return C; }

  // ---- the sheet: cream laid paper, the pressed plate mark, the ink (Multiply over paper and washes), the ruled border
  function paperSheet(SH, P) { var W = SH.width, H = SH.height;
    solid(SH, P + "_OUTER", PALETTE.paperOuter);
    piece(SH, P + "_MARKSHADOW", [{ k: "rect", x: MARK.x + 3, y: MARK.y + 4, w: MARK.w, h: MARK.h, fill: null, sw: 4, sc: PALETTE.bevelDark }]);
    fx(SH.layer(P + "_MARKSHADOW"), "ADBE Gaussian Blur 2").property("Blurriness").setValue(3);
    piece(SH, P + "_PLATE", [{ k: "rect", x: MARK.x, y: MARK.y, w: MARK.w, h: MARK.h, fill: PALETTE.paper }]);
    piece(SH, P + "_BEVEL", [{ k: "line", pts: [[MARK.x + 2, MARK.y + MARK.h], [MARK.x + 2, MARK.y + 2], [MARK.x + MARK.w, MARK.y + 2]], sw: 3, sc: PALETTE.bevelLight }]);
    // laid lines (fine horizontal) and chain lines (sparse vertical), barely there; fibre mottling; sparse foxing
    var LD = SH.layers.addShape(); LD.name = P + "_LAID"; LD.anchorPoint.setValue([0, 0]); LD.position.setValue([0, 0]);
    var lv = LD.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").property("ADBE Vectors Group");
    var lr = lv.addProperty("ADBE Vector Shape - Rect"); lr.property("ADBE Vector Rect Size").setValue([W, 1]); lr.property("ADBE Vector Rect Position").setValue([W / 2, 2]);
    lv.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(PALETTE.bevelDark);
    var lp = lv.addProperty("ADBE Vector Filter - Repeater"); lp.property("ADBE Vector Repeater Copies").setValue(Math.ceil(H / 5)); lp.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([0, 5]);
    var cv = LD.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").property("ADBE Vectors Group");
    var cr = cv.addProperty("ADBE Vector Shape - Rect"); cr.property("ADBE Vector Rect Size").setValue([2, H]); cr.property("ADBE Vector Rect Position").setValue([60, H / 2]);
    cv.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(PALETTE.bevelDark);
    var cp = cv.addProperty("ADBE Vector Filter - Repeater"); cp.property("ADBE Vector Repeater Copies").setValue(9); cp.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([128, 0]);
    LD.blendingMode = BlendingMode.MULTIPLY; LD.opacity.setValue(7);
    var PT = solid(SH, P + "_FIBRE", [.5, .5, .5]), pf = fx(PT, "ADBE Fractal Noise"); pf.property("Contrast").setValue(55); pf.property("Scale").setValue(120); pf.property("Complexity").setValue(6);
    PT.blendingMode = BlendingMode.OVERLAY; PT.opacity.setValue(12);
    var fox = [[180, 1580, 9], [930, 300, 6], [860, 1720, 11], [130, 640, 5], [700, 1830, 7], [990, 1100, 5]], fn = [];
    for (var i = 0; i < fox.length; i++) fn.push({ k: "circle", x: fox[i][0], y: fox[i][1], r: fox[i][2], fill: PALETTE.fox });
    var FX = piece(SH, P + "_FOXING", fn); fx(FX, "ADBE Gaussian Blur 2").property("Blurriness").setValue(5); FX.blendingMode = BlendingMode.MULTIPLY; FX.opacity.setValue(30); }
  function printInk(SH, P, INK) { var L = SH.layers.add(INK); L.name = P + "_PRINT"; L.blendingMode = BlendingMode.MULTIPLY;
    var tn = fx(L, "ADBE Tint"); tn.property("Map Black To").setValue(PALETTE.ink); tn.property("Map White To").setValue([1, 1, 1]); return L; }
  function border(SH, P) { var b = BORDER, W = SH.width, H = SH.height;
    return piece(SH, P + "_BORDER", [{ k: "rect", x: b, y: b, w: W - 2 * b, h: H - 2 * b, fill: null, sw: 3, sc: PALETTE.ink },
      { k: "rect", x: b + 10, y: b + 10, w: W - 2 * b - 20, h: H - 2 * b - 20, fill: null, sw: 1.2, sc: PALETTE.ink }]); }
  // a hand-laid wash: transparent pigment multiplied over paper and under the ink, a few px of spill and misregister, a darker
  // tide-line at the wet edge, ragged; it blooms from the point the brush touched (anchor) and dries
  // band > 0 lays the wash as a band of that width along the shape (a ring), without a fill
  function wash(SH, P, name, shape, color, touch, t0, dur, notes, band) { var dk = [color[0] * .82, color[1] * .8, color[2] * .78];
    var L = SH.layers.addShape(); L.name = P + "_WASH_" + name;
    var v = L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").property("ADBE Vectors Group");
    v.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(shape);
    var st = v.addProperty("ADBE Vector Graphic - Stroke");
    if (band) { st.property("ADBE Vector Stroke Color").setValue(color); st.property("ADBE Vector Stroke Width").setValue(band); }
    else { st.property("ADBE Vector Stroke Color").setValue(dk); st.property("ADBE Vector Stroke Width").setValue(5); v.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(color); }
    L.anchorPoint.setValue(touch); L.position.setValue([touch[0] + 4, touch[1] + 3]);
    try { var re = fx(L, "ADBE Roughen Edges"); re.property("Border").setValue(7); re.property("Edge Sharpness").setValue(.6); re.property("Scale").setValue(40); re.property("Complexity").setValue(3);
      keys(re.property("Evolution"), [{ t: t0, v: 0, o: "L" }, { t: t0 + dur, v: 90, i: 60 }]); } catch (e) { notes.push("wash edge: " + e.toString()); }
    fx(L, "ADBE Gaussian Blur 2").property("Blurriness").setValue(1.6);
    L.blendingMode = BlendingMode.MULTIPLY; L.opacity.setValue(72);
    keys(L.scale, [{ t: t0, v: [4, 4], o: 20 }, { t: t0 + dur, v: [100, 100], i: 80 }]);
    L.moveAfter(SH.layer(P + "_PRINT")); return L; }

  // ---- drawn pieces (tone nodes), lit from the upper left; outlines are tone 0
  function personNodes() { var O = 3;
    return [{ k: "ellipse", x: 70, y: 0, rx: 130, ry: 16, fill: .5 },
      { k: "poly", pts: [[-50, -262], [-8, -262], [-12, 0], [-56, 0]], fill: .45, sw: O }, { k: "poly", pts: [[8, -262], [50, -262], [56, 0], [12, 0]], fill: .24, sw: O },
      { k: "poly", pts: [[-84, -520], [84, -520], [100, -232], [-100, -232]], fill: .55, sw: O },
      { k: "poly", pts: [[34, -516], [84, -520], [100, -232], [52, -232]], fill: .22 },
      { k: "poly", pts: [[-84, -512], [-54, -506], [-74, -300], [-104, -306]], fill: .7, sw: O }, { k: "circle", x: -90, y: -290, r: 17, fill: .93, sw: 2.5 },
      { k: "group", id: "AR", pivot: [70, -506], kids: [{ k: "poly", pts: [[54, -512], [86, -514], [104, -312], [74, -306]], fill: .3, sw: O }, { k: "circle", x: 90, y: -294, r: 17, fill: .72, sw: 2.5 }] },
      { k: "poly", pts: [[-24, -520], [0, -476], [24, -520]], fill: .96, sw: 2.5 },
      { k: "circle", x: 0, y: -446, r: 5, fill: 0 }, { k: "circle", x: 0, y: -398, r: 5, fill: 0 }, { k: "circle", x: 0, y: -350, r: 5, fill: 0 },
      { k: "rect", x: -15, y: -550, w: 30, h: 34, fill: .8, sw: 2.5 },
      { k: "ellipse", x: 0, y: -602, rx: 47, ry: 57, fill: .93, sw: 3 },
      { k: "poly", pts: [[20, -646], [44, -624], [46, -590], [30, -556], [16, -552], [28, -600]], fill: .62 },
      { k: "poly", pts: [[-50, -612], [-42, -654], [0, -668], [42, -654], [50, -612], [32, -632], [-32, -632]], fill: .2, sw: 3 },
      { k: "ellipse", x: -17, y: -603, rx: 6, ry: 3.5, fill: 0 }, { k: "ellipse", x: 17, y: -603, rx: 6, ry: 3.5, fill: 0 },
      { k: "line", pts: [[-29, -617], [-8, -615]], sw: 3, sc: 0 }, { k: "line", pts: [[8, -615], [29, -617]], sw: 3, sc: 0 },
      { k: "line", pts: [[1, -598], [-5, -580], [5, -578]], sw: 2.5, sc: 0 }, { k: "line", pts: [[-14, -566], [14, -566]], sw: 3, sc: 0 }]; }
  function documentNodes() { var n = [{ k: "rect", x: -110, y: -150, w: 250, h: 330, fill: .55 }, { k: "rect", x: -125, y: -165, w: 250, h: 330, fill: .97, sw: 3 },
    { k: "rect", x: -92, y: -136, w: 112, h: 16, fill: 0 }];
    for (var r = 0; r < 7; r++) n.push({ k: "line", pts: [[-92, -86 + r * 34], [r === 6 ? 20 : 92, -86 + r * 34]], sw: 3.5, sc: 0 });
    n.push({ k: "poly", pts: [[79, -165], [125, -119], [79, -119]], fill: .6, sw: 2.5 }); return n; }
  function deviceNodes() { var n = [{ k: "ellipse", x: 10, y: 46, rx: 196, ry: 13, fill: .5 }, { k: "rect", x: -172, y: -238, w: 344, h: 238, fill: .32, sw: 3 }, { k: "rect", x: -150, y: -216, w: 300, h: 196, fill: .92, sw: 2.5 },
    { k: "poly", pts: [[60, -216], [150, -216], [150, -20], [110, -20]], fill: .78 },
    { k: "rect", x: -124, y: -188, w: 120, h: 14, fill: 0 }, { k: "line", pts: [[-124, -150], [110, -150]], sw: 4, sc: 0 }, { k: "line", pts: [[-124, -122], [80, -122]], sw: 4, sc: 0 },
    { k: "line", pts: [[-124, -94], [96, -94]], sw: 4, sc: 0 }, { k: "rect", x: 30, y: -76, w: 90, h: 40, fill: .5, sw: 2.5 },
    { k: "poly", pts: [[-190, 0], [190, 0], [222, 42], [-222, 42]], fill: .62, sw: 3 }, { k: "poly", pts: [[-222, 42], [222, 42], [222, 50], [-222, 50]], fill: .15, sw: 2 }];
    for (var r = 0; r < 3; r++) for (var c = 0; c < 12; c++) n.push({ k: "rect", x: -150 + c * 26 + r * 4, y: 8 + r * 10, w: 14, h: 4, fill: .95 });
    return n; }
  // the burin: tip at the origin, shaft and mushroom handle down-right (so it never covers the line it has just cut), bevelled face lit
  function burinNodes() { return [{ k: "ellipse", x: 196, y: 196, rx: 60, ry: 46, fill: .5, sw: 3 }, { k: "ellipse", x: 212, y: 210, rx: 36, ry: 26, fill: .22 },
    { k: "rect", x: 130, y: 130, w: 34, h: 34, fill: .4, sw: 2.5 },
    { k: "poly", pts: [[0, 0], [24, 8], [150, 134], [134, 150], [8, 24]], fill: .7, sw: 2.5 },
    { k: "poly", pts: [[8, 24], [134, 150], [150, 134], [16, 16]], fill: .3 }, { k: "line", pts: [[18, 8], [144, 132]], sw: 2, sc: 1 },
    { k: "poly", pts: [[0, 0], [24, 8], [8, 24]], fill: .97, sw: 2 }]; }
  function swarfNodes() { var pts = [], a, r; for (var i = 0; i <= 26; i++) { a = i * .5; r = 4 + i * 1.3; pts.push([-10 - i * 1.6 + Math.cos(a) * r, -8 - i * 1.1 + Math.sin(a) * r * .7]); }
    return [{ k: "line", pts: pts, sw: 2, sc: 0 }]; }
  // a double-ruled ring with a lozenge rule (crisp ink on the sheet)
  function ruleNodes(cx, y, half) { return [{ k: "rect", x: cx - half, y: y - 1.5, w: 2 * half, h: 3, fill: PALETTE.ink }, { k: "rect", x: cx - half + 40, y: y + 8, w: 2 * half - 80, h: 1.2, fill: PALETTE.ink },
    { k: "poly", pts: [[cx, y - 10], [cx + 10, y], [cx, y + 10], [cx - 10, y]], fill: PALETTE.ink }]; }

  // buildScene: the shared test scene (the library's seven-beat test scene) as six plates of one natural-history book. comp = an empty 1080 x 1920 comp.
  // DRAW holds the tone drawing; F1..F3 hatch it; INK multiplies the families in cutting order; SHEET prints the ink on laid paper with
  // the plate mark, border, cut lettering and washes; the main comp breathes over the sheet, peels the held proof and lays the note slips.
  function buildScene(comp, scene, opts) {
    fontOK(); var P = opts.prefix || "ENGRAV", A = opts.assets, B = scene.beat, W = comp.width, H = comp.height, notes = [], WL = scene.wordList, D = comp.duration, fps = comp.frameRate;
    AESLib.clearOwned(comp, P);
    var cx = W / 2, INKC = PALETTE.ink;
    var DR = app.project.items.addComp(P + "_DRAW", W, H, 1, D, fps); DR.bgColor = [1, 1, 1];
    var SH = app.project.items.addComp(P + "_SHEET", W, H, 1, D, fps); SH.bgColor = PALETTE.paper;
    solid(DR, P + "_BARE", [1, 1, 1]);
    var ons = function (t0, t1) { var r = [], w = wordsIn(WL, t0, t1); for (var i = 0; i < w.length; i++) r.push(w[i].s); return r; };
    var C0 = B.carry.t0, E0 = B.end.t0, E1 = B.end.t1;

    // 1. title: on paper at 1x. The title is cut first, the italic under it, then the figure (a lit sphere and its shadow) engraves itself.
    var T0 = B.title.t0, T1 = B.title.t1, SC = [540, 960], SR = 290;
    var SHD = piece(DR, P + "_T_SHADOW", [{ k: "ellipse", x: SC[0] + 70, y: SC[1] + SR + 50, rx: 300, ry: 44, fill: .38 }]); fx(SHD, "ADBE Gaussian Blur 2").property("Blurriness").setValue(26); span(SHD, T0, T1);
    span(sphere(DR, P + "_T_SPHERE", SC[0], SC[1], SR), T0, T1);
    span(piece(DR, P + "_T_CONTOUR", [{ k: "circle", x: SC[0], y: SC[1], r: SR, fill: null, sw: 3.5, sc: 0 }, { k: "line", pts: [[150, SC[1] + SR + 50], [930, SC[1] + SR + 50]], sw: 1.5, sc: 0 }]), T0, T1);
    var TT = words(SH, P + "_T_TITLE", B.title.context.toUpperCase() + ".", { family: BOD, style: "Regular", size: 104, tracking: 120, x: cx, y: 300, maxW: 860, t0: T0, t1: T1 }); cutGlyphs(TT.layer, T0 + .02, .5);
    var TI = words(SH, P + "_T_ITAL", B.title.hero, { family: BOD, style: "Italic", size: 60, x: cx, y: 398, t0: T0, t1: T1 }); cutGlyphs(TI.layer, T0 + .5, .5);
    span(piece(SH, P + "_T_RULE", ruleNodes(cx, 460, 200)), T0, T1);
    var TF = words(SH, P + "_T_FIG", "Fig. 1.", { family: BOD, style: "Italic", size: 34, x: cx, y: 1410, t0: T0, t1: T1 }); cutGlyphs(TF.layer, T0 + .8, .3);

    // 2. picture: three pieces engraved on their words (the person, the page, the screen), a double rule frames them as one plate
    var P0 = B.picture.t0, P1 = B.picture.t1, pw = ons(P0, P1), GY = 1430;
    span(piece(DR, P + "_P_GROUND", [{ k: "line", pts: [[120, GY], [960, GY]], sw: 2.5, sc: 0 },
      { k: "rect", x: 590, y: GY - 150, w: 360, h: 26, fill: .5, sw: 3 }, { k: "rect", x: 620, y: GY - 124, w: 22, h: 124, fill: .3, sw: 2.5 }, { k: "rect", x: 898, y: GY - 124, w: 22, h: 124, fill: .2, sw: 2.5 }]), P0, P1);
    var PE = piece(DR, P + "_P_PERSON", personNodes(), [270, GY]); span(PE, P0, P1); cutIn(PE, pw[0], .34, 180, 90);
    var ar = groupT(PE, ["AR"]).property("ADBE Vector Rotation"); keys(ar, [{ t: pw[3] - .1, v: 0, o: 40 }, { t: pw[4] + .1, v: -128, i: 70 }]); ar.expression = TWOS + "value;";
    var DO = piece(DR, P + "_P_DOC", documentNodes(), [560, 820]); span(DO, pw[1], P1); DO.rotation.setValue(-6); cutIn(DO, pw[1], .32, 180, 80);
    keys(DO.position, [{ t: pw[1], v: [560, 770], o: 30 }, { t: pw[1] + .3, v: [560, 820], i: 80 }]); DO.position.expression = TWOS + "value;";
    var DV = piece(DR, P + "_P_DEVICE", deviceNodes(), [750, GY - 186]); DV.scale.setValue([90, 90]); span(DV, pw[2], P1); cutIn(DV, pw[2], .32, 180, 80);
    var nums = [["1", [150, 1500], pw[0]], ["2", [700, 610], pw[1]], ["3", [940, 1000], pw[2]]];
    for (var ni = 0; ni < nums.length; ni++) { var NL = words(SH, P + "_P_NUM" + ni, nums[ni][0] + ".", { family: BOD, style: "Italic", size: 38, x: nums[ni][1][0], y: nums[ni][1][1], t0: nums[ni][2] + .2, t1: P1 }); cutGlyphs(NL.layer, nums[ni][2] + .2, .12); }
    var FR = piece(SH, P + "_P_FRAME", [{ k: "rect", x: 100, y: 520, w: 880, h: 1050, fill: null, sw: 2.5, sc: INKC }]); span(FR, P0, P1);
    var tr = FR.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").addProperty("ADBE Vector Filter - Trim");
    keys(tr.property("ADBE Vector Trim End"), [{ t: pw[4], v: 0, o: 30 }, { t: pw[4] + .42, v: 100, i: 75 }]);
    var PT = words(SH, P + "_P_TITLE", "THE PICTURE.", { family: BOD, style: "Regular", size: 64, tracking: 160, x: cx, y: 300, t0: P0, t1: P1 }); cutGlyphs(PT.layer, P0 + .02, .4);

    // 3. input: a magnification roundel flies in on an eased arc, growing to size, with the real frame engraved inside; its label is cut on landing
    var I0 = B.input.t0, I1 = B.input.t1, RC = [540, 930], RR = 330, LAND = I0 + .55;
    var RO = app.project.items.addComp(P + "_ROUNDEL", W, H, 1, D, fps); RO.bgColor = [1, 1, 1];
    var tv = AESLib.importFile(A.tone), TV = RO.layers.add(tv); TV.name = P + "_I_REAL"; TV.startTime = I0; TV.position.setValue(RC); TV.scale.setValue([110, 110]);
    keys(TV.opacity, [{ t: I0 + .1, v: 0, o: 20 }, { t: I0 + .6, v: 100, i: 70 }]); mask(TV, ell(320, 320, RR / 1.1, RR / 1.1));
    piece(RO, P + "_I_RINGS", [{ k: "circle", x: RC[0], y: RC[1], r: RR, fill: null, sw: 5, sc: 0 }, { k: "circle", x: RC[0], y: RC[1], r: RR + 16, fill: null, sw: 2, sc: 0 }]);
    var RL = DR.layers.add(RO); RL.name = P + "_I_ROUNDEL"; span(RL, I0, I1); RL.anchorPoint.setValue(RC);
    keys(RL.position, [{ t: I0, v: [250, 560], o: 40 }, { t: LAND, v: RC, i: 85 }]);
    try { RL.position.setSpatialTangentsAtKey(1, [0, 0, 0], [0, -120, 0]); RL.position.setSpatialTangentsAtKey(2, [-160, -60, 0], [0, 0, 0]); } catch (eS) { notes.push("roundel arc: " + eS.toString()); }
    keys(RL.scale, [{ t: I0, v: [16, 16], o: 15 }, { t: LAND, v: [100, 100], i: 90 }]);
    var IL = words(SH, P + "_I_LABEL", "FIG. 2  ·  A REAL FRAME", { family: BOD, style: "Regular", size: 34, tracking: 220, x: cx, y: 1340, t0: I0, t1: I1 }); cutGlyphs(IL.layer, LAND, .4);
    var IN = words(SH, P + "_I_NAME", "ad vivum", { family: BOD, style: "Italic", size: 44, x: cx, y: 1400, t0: I0, t1: I1 }); cutGlyphs(IN.layer, LAND + .3, .25);
    var IT = words(SH, P + "_I_TITLE", "THE SOURCE.", { family: BOD, style: "Regular", size: 64, tracking: 160, x: cx, y: 300, t0: I0, t1: I1 }); cutGlyphs(IT.layer, I0 + .02, .36);

    // 4. number: the count in Bodoni numerals (on twos), FRAMES cut on its word, a strip of film engraved below it
    var N0 = B.number.t0, N1 = B.number.t1, nw = ons(N0, N1), val = B.number.value, NY = 720;
    var NU = words(SH, P + "_N_NUM", String(val), { family: BOD, style: "Regular", size: 400, x: cx, y: NY, t0: N0, t1: N1 }).layer;
    NU.anchorPoint.expression = "var r = sourceRectAtTime(time, false); [r.left + r.width / 2, r.top + r.height / 2];";
    var counts = [], cn = 8; for (var c2 = 0; c2 <= cn; c2++) { var e = 1 - Math.pow(1 - c2 / cn, 2.2); counts.push(String(Math.round(val * e))); }
    AESLib.bakeText(NU, counts, 12, N0);
    span(piece(SH, P + "_N_RULE", ruleNodes(cx, 960, 240)), N0, N1);
    var FW = words(SH, P + "_N_FRAMES", "FRAMES", { family: BOD, style: "Regular", size: 80, tracking: 320, x: cx + 14, y: 1050, t0: N0, t1: N1 }); cutGlyphs(FW.layer, nw[1] - .02, .3);
    var fs = [{ k: "rect", x: 120, y: 1160, w: 840, h: 250, fill: .3, sw: 3 }];
    for (var fi = 0; fi < 5; fi++) fs.push({ k: "rect", x: 138 + fi * 166, y: 1198, w: 140, h: 174, fill: .9 - fi * .08, sw: 2 });
    for (var si = 0; si < 14; si++) { fs.push({ k: "rect", x: 132 + si * 60, y: 1170, w: 22, h: 16, fill: 1, sw: 1.5 }); fs.push({ k: "rect", x: 132 + si * 60, y: 1384, w: 22, h: 16, fill: 1, sw: 1.5 }); }
    var FS = piece(DR, P + "_N_FILM", fs); span(FS, N0, N1); cutIn(FS, nw[1], .4, 270, 120);

    // 5. line: an engraved note written word by word in script; the burin's point rides the end of the last word, swarf curling ahead
    var L0 = B.line.t0, L1 = B.line.t1, lw = ons(L0, L1), rows = ["Every word", "I say", "gets typed."], rw = [[lw[0], lw[1]], [lw[2], lw[3]], [lw[4], lw[5]]];
    var LO = { family: PIN, style: "Regular", size: 150 }, LX = 150, LY = [620, 840, 1060], tips = [];
    for (var r = 0; r < rows.length; r++) {
      var rr = words(SH, P + "_L_ROW" + r, rows[r], { family: LO.family, style: LO.style, size: LO.size, just: "left", x: LX, y: LY[r], t0: L0, t1: L1, keys: build(rows[r], rw[r], L0) });
      var ws = rows[r].split(" "); rr.layer.position.setValue([LX + rr.rect.width / 2, LY[r]]);
      for (var wi = 0; wi < ws.length; wi++) tips.push({ t: rw[r][Math.min(wi, rw[r].length - 1)], v: [LX + inkWidth(SH, ws.slice(0, wi + 1).join(" "), LO) + 10, LY[r] + 40] }); }
    var BU = piece(DR, P + "_L_BURIN", burinNodes(), tips[0].v); span(BU, L0, L1);
    var bk = [{ t: L0, v: [tips[0].v[0] - 60, tips[0].v[1] + 40], o: 40 }]; for (var ti = 0; ti < tips.length; ti++) bk.push({ t: tips[ti].t + .16, v: tips[ti].v, i: 70, o: 40 });
    keys(BU.position, bk); BU.position.expression = TWOS + "value;";
    var SW = piece(DR, P + "_L_SWARF", swarfNodes(), [0, 0]); span(SW, L0, L1); SW.position.expression = "thisComp.layer(\"" + P + "_L_BURIN\").transform.position;";
    var sk = [], lastS = -1; for (var cc = 0; cc < tips.length; cc++) { if (tips[cc].t - lastS < .2) continue; lastS = tips[cc].t; sk.push({ t: tips[cc].t + .05, v: [20, 20], o: "L" }); sk.push({ t: tips[cc].t + .2, v: [100, 100], i: "L", o: "L" }); sk.push({ t: tips[cc].t + .3, v: [0, 0], i: "L", o: "L" }); }
    keys(SW.scale, sk); SW.scale.expression = TWOS + "value;";
    span(piece(SH, P + "_L_RULE", ruleNodes(cx, 1240, 220)), L0, L1);
    var LT = words(SH, P + "_L_TITLE", "AN ENGRAVED NOTE.", { family: BOD, style: "Regular", size: 56, tracking: 160, x: cx, y: 300, t0: L0, t1: L1 }); cutGlyphs(LT.layer, L0 + .02, .4);

    // 7. end (under the peel from the carry on): the finished plate. The real face in an oval medallion, THAT'S THE TEST cut on its words,
    // then colour arrives by hand: an amber wash blooms on the face and a blue-grey wash in the ring
    var ew = ons(E0, E1), MED = [cx, 800], MX = 250, MY = 310;
    var fc = AESLib.importFile(A.face), FC = DR.layers.add(fc); FC.name = P + "_E_FACE"; span(FC, C0, E1); FC.position.setValue(MED);
    FC.scale.setValue([100, 100]); mask(FC, ell(260, 320, MX - 6, MY - 6));
    span(piece(DR, P + "_E_RINGS", [{ k: "ellipse", x: MED[0], y: MED[1], rx: MX, ry: MY, fill: null, sw: 5, sc: 0 }, { k: "ellipse", x: MED[0], y: MED[1], rx: MX + 30, ry: MY + 30, fill: null, sw: 2, sc: 0 }]), C0, E1);
    var EA = words(SH, P + "_E_A", "THAT’S", { family: BOD, style: "Regular", size: 120, tracking: 120, x: cx, y: 1290, t0: C0, t1: E1 }); cutGlyphs(EA.layer, ew[0], .28);
    var EB = words(SH, P + "_E_B", "THE TEST.", { family: BOD, style: "Regular", size: 120, tracking: 120, x: cx, y: 1430, maxW: 860, t0: C0, t1: E1 }); cutGlyphs(EB.layer, ew[1], .4);
    var ER = piece(SH, P + "_E_RULE", ruleNodes(cx, 1530, 220)); span(ER, C0, E1); cutIn(ER, ew[2], .3, 270, 60);
    var ET = words(SH, P + "_E_TITLE", "THE FINISHED PLATE.", { family: BOD, style: "Regular", size: 50, tracking: 160, x: cx, y: 300, t0: C0, t1: E1 }); cutGlyphs(ET.layer, C0 + .1, .5);

    // INK: the plate's line angle changes per plate (hold keys); the families cut in order at each new plate
    var plates = [{ t: 0, from: 55 }, { t: B.picture.t0 }, { t: B.input.t0 }, { t: B.number.t0 }, { t: B.line.t0 }, { t: C0 }];
    var ang = [{ t: 0, v: 38 }, { t: B.picture.t0, v: 28 }, { t: B.input.t0, v: 18 }, { t: B.number.t0, v: -32 }, { t: B.line.t0, v: 40 }, { t: C0, v: 24 }];
    var fcs = []; for (var f = 0; f < FAMILIES.length; f++) fcs.push(familyComp(P, FAMILIES[f], DR, ang, D, fps, notes));
    var INK = inkComp(P, fcs, plates, D, fps);

    // SHEET: paper, ink, washes under the ink, border, running head, plate numbers and credits (all part of the plate)
    paperSheet(SH, P); var PR = printInk(SH, P, INK); border(SH, P);
    // the beat lettering was made before the paper existed: lift it above the paper and ink, keeping its order (collect first, then move)
    var lift = [], pre = ["_T_", "_P_", "_I_", "_N_", "_L_", "_E_"];
    for (var li = 1; li <= SH.numLayers; li++) { var ly = SH.layer(li); for (var q = 0; q < pre.length; q++) if (ly.name.indexOf(P + pre[q]) === 0) lift.push(ly); }
    for (var lq = lift.length - 1; lq >= 0; lq--) lift[lq].moveToBeginning();
    var RH = AESLib.text(SH, P + "_RUNHEAD", "PLATES OF THE SHARED SCENE", { family: BOD, style: "Regular", size: 22, tracking: 200, color: INKC, just: "left", pos: [116, 150] });
    var PN = AESLib.text(SH, P + "_PLATENO", "PL. I.", { family: BOD, style: "Regular", size: 34, tracking: 60, color: INKC, just: "right", pos: [964, 152] });
    AESLib.textKeys(PN, [0, B.picture.t0, B.input.t0, B.number.t0, B.line.t0, C0], ["PL. I.", "PL. II.", "PL. III.", "PL. IV.", "PL. V.", "PL. VI."]);
    AESLib.text(SH, P + "_DEL", "Ad viv. del.", { family: BOD, style: "Italic", size: 22, color: INKC, just: "left", pos: [80, 1872] });
    AESLib.text(SH, P + "_SCULP", "Aere incid.", { family: BOD, style: "Italic", size: 22, color: INKC, just: "right", pos: [1000, 1872] });
    var WA = wash(SH, P, "FACE", ell(MED[0] + 8, MED[1] - 60, 104, 134), PALETTE.washAmber, [MED[0] - 40, MED[1] - 130], ew[1] + .05, .7, notes); span(WA, ew[1], E1);
    var WB = wash(SH, P, "RING", ell(MED[0], MED[1], MX + 15, MY + 15), PALETTE.washBlueGrey, [MED[0] + 200, MED[1] + 220], ew[2] + .1, .6, notes, 26); span(WB, ew[2], E1);

    // main comp: a locked plate with a 1.5 % breathing push; on the carry the held proof (the sheet at a frame of plate III) is peeled
    // off about its top edge to show the finished plate below; note slips are laid in the bottom margin
    solid(comp, P + "_DESK", PALETTE.paperOuter);
    var SL = comp.layers.add(SH); SL.name = P + "_SHEETL"; keys(SL.scale, [{ t: 0, v: [100, 100], o: "L" }, { t: D, v: [101.5, 101.5], i: "L" }]);
    // the proof pulled: the held sheet is lifted off the bed by its top-left corner (it swells a little and turns a few degrees while its
    // shadow on the plate below grows longer and softer), then drawn away up and to the left, uncovering the finished plate
    var cw = ons(C0, B.carry.t1), TU0 = cw[3] - .1, LIFT = TU0 + .3, TU1 = cw[5] + .2, PK = comp.layers.add(SH); PK.name = P + "_PEEL"; span(PK, C0, TU1 + .04);
    PK.timeRemapEnabled = true; PK.property("ADBE Time Remapping").expression = String(B.input.t0 + 1.2) + ";";
    PK.anchorPoint.setValue([0, 0]); PK.position.setValue([0, 0]);
    keys(PK.scale, [{ t: TU0, v: [100, 100], o: 60 }, { t: LIFT, v: [103, 103], i: 60 }]);
    PK.scale.expression = "value * thisComp.layer(\"" + P + "_SHEETL\").transform.scale[0] / 100;";
    keys(PK.rotation, [{ t: TU0, v: 0, o: 60 }, { t: LIFT, v: -2.5, i: 50, o: 20 }, { t: TU1, v: -9, i: 60 }]);
    keys(PK.position, [{ t: LIFT, v: [0, 0], o: 12 }, { t: TU1, v: [-W * .55, -H * 1.12], i: 70 }]);
    var psh = fx(PK, "ADBE Drop Shadow"); psh.property("Direction").setValue(135);
    try { keys(psh.property("Opacity"), [{ t: TU0, v: 0, o: 50 }, { t: LIFT, v: 120, i: 50 }]); } catch (eO) { notes.push("proof shadow opacity: " + eO.toString()); }
    keys(psh.property("Distance"), [{ t: TU0, v: 0, o: 50 }, { t: LIFT, v: 30, i: 50, o: 30 }, { t: TU1, v: 70, i: 50 }]);
    keys(psh.property("Softness"), [{ t: TU0, v: 4, o: 50 }, { t: LIFT, v: 60, i: 50, o: 30 }, { t: TU1, v: 120, i: 50 }]);
    var caps = [[B.picture, "Three pieces build one picture."], [B.input, "Here’s a real frame from my video."], [B.number, "counted."], [B.carry, "Then one thing becomes the next."]];
    for (var k = 0; k < caps.length; k++) { var cb = caps[k][0], CW = inkWidth(comp, caps[k][1], { family: PIN, style: "Regular", size: 56 }) + 110;
      var SLP = solid(comp, P + "_SLIP" + k, PALETTE.slip, Math.round(Math.min(CW, 940)), 118, [W / 2, 1712]); span(SLP, cb.t0, cb.t1);
      try { var sre = fx(SLP, "ADBE Roughen Edges"); sre.property("Border").setValue(5); sre.property("Edge Sharpness").setValue(1.2); sre.property("Scale").setValue(10); } catch (e4) { notes.push("slip deckle: " + e4.toString()); }
      var ds = fx(SLP, "ADBE Drop Shadow"); try { ds.property("Opacity").setValue(70); } catch (e5) { notes.push("slip shadow: " + e5.toString()); } ds.property("Distance").setValue(4); ds.property("Softness").setValue(10);
      keys(SLP.scale, [{ t: cb.t0, v: [103, 103], o: 30 }, { t: cb.t0 + .1, v: [100, 100], i: 70 }]);
      var CL = AESLib.text(comp, P + "_CAP" + k, caps[k][1], { family: PIN, style: "Regular", size: 56, color: INKC, pos: [W / 2, 1730] }); span(CL, cb.t0, cb.t1);
      cutIn(CL, cb.t0 + .04, .55, 270, 30); }                                   // 270: written left to right
    return { layers: comp.numLayers + DR.numLayers + SH.numLayers + INK.numLayers + RO.numLayers + 3 * 4, notes: notes };
  }
  return { BOD: BOD, PIN: PIN, PALETTE: PALETTE, FAMILIES: FAMILIES, MARK: MARK, fontOK: fontOK, keys: keys, piece: piece, groupT: groupT, sphere: sphere, cutIn: cutIn,
    cutGlyphs: cutGlyphs, words: words, inkWidth: inkWidth, build: build, wordsIn: wordsIn, screenComp: screenComp, familyComp: familyComp, inkComp: inkComp,
    paperSheet: paperSheet, printInk: printInk, border: border, wash: wash, personNodes: personNodes, documentNodes: documentNodes, deviceNodes: deviceNodes,
    burinNodes: burinNodes, swarfNodes: swarfNodes, ruleNodes: ruleNodes, ell: ell, buildScene: buildScene };
})();
