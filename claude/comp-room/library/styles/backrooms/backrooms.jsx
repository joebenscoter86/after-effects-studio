// Liminal found footage style: brand-neutral ES3 helpers. No project mutation happens at load.
// Read styles/backrooms/STYLE.md first. The world is a Blender plate (tools/rooms.py: one handheld camcorder take through an empty
// mustard office, flat shadowless panel light, fog that follows the local light, dead zones, a CRT that moves by itself) rendered small
// by tools/plates.mjs with a per-frame track. After Effects owns the medium: the real clip on the CRT's screen (corner-pinned, blurred
// to the plate's focus), auto-exposure catching up after blackouts, the VHS camcorder pass (soft luma, smeared chroma, ringing, tape
// noise, lifted blacks, barrel and vignette, a head-switching band, tracking tears, dropouts, a drifting white balance), and on top,
// untouched by the tape: the camcorder OSD (REC, battery, counter, date and time in a bitmap face with a black outline), the title
// generator, and closed captions (white monospace on a black box per row, typed on word by word).
// Adapted from Lemo-Opuscar's backrooms style (MIT, LemoLab); see library/styles/LICENSE-lemo-opuscar.txt.
var AESBackrooms = (function () {
  var OSDF = "VT323", OSDS = "Regular", CCF = "IBM Plex Mono", CCS = "Medium";
  function hex(h) { return [parseInt(h.substr(1, 2), 16) / 255, parseInt(h.substr(3, 2), 16) / 255, parseInt(h.substr(5, 2), 16) / 255]; }
  var C = { white: [1, 1, 1], black: [0, 0, 0], rec: hex("#FF2A1A"), warm: hex("#FFC27A"), green: hex("#9CFF8A"), cool: hex("#8AB8FF") };
  var VW = 1080, VH = 1920;

  // ---- keys: list = [{ t, v, i, o }]; i / o: an influence (eased), "L" linear or "H" hold. One setValuesAtTimes call.
  function easeArr(prop, inf) { var sp = prop.propertyValueType === PropertyValueType.TwoD_SPATIAL || prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL;
    var d = 1; if (!sp && prop.propertyValueType !== PropertyValueType.COLOR && prop.value instanceof Array) d = prop.value.length;
    var a = []; for (var n = 0; n < d; n++) a.push(new KeyframeEase(0, inf)); return a; }
  function kt(x) { if (x === "H") return KeyframeInterpolationType.HOLD; if (typeof x === "number") return KeyframeInterpolationType.BEZIER; return KeyframeInterpolationType.LINEAR; }
  function keys(prop, list) { var ts = [], vs = [], B = KeyframeInterpolationType.BEZIER;
    for (var j = 0; j < list.length; j++) { ts.push(list[j].t); vs.push(list[j].v); } prop.setValuesAtTimes(ts, vs);
    for (var k = 0; k < list.length; k++) { var ki = prop.nearestKeyIndex(list[k].t), a = list[k].i, b = list[k].o;
      if (typeof a === "number" || typeof b === "number") { prop.setInterpolationTypeAtKey(ki, B, B);
        var ia = 33.3, ob = 33.3; if (typeof a === "number") ia = a; if (typeof b === "number") ob = b;
        prop.setTemporalEaseAtKey(ki, easeArr(prop, ia), easeArr(prop, ob)); }
      prop.setInterpolationTypeAtKey(ki, kt(a), kt(b)); }
    return prop; }
  function linKeys(prop, ts, vs) { if (!ts.length) return prop; prop.setValuesAtTimes(ts, vs);
    for (var k = 1; k <= prop.numKeys; k++) prop.setInterpolationTypeAtKey(k, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR); return prop; }
  function fx(L, match) { L.property("ADBE Effect Parade").addProperty(match); var EP = L.property("ADBE Effect Parade"); return EP.property(EP.numProperties); }
  // set an effect parameter by its display name; a missing name is reported, never silently skipped
  function setp(E, name, v, notes) { try { E.property(name).setValue(v); } catch (e) { if (notes) notes.push("could not set " + E.matchName + " / " + name); } }
  function span(L, t0, t1) { L.inPoint = t0; L.outPoint = t1; return L; }
  function solid(comp, name, color, w, h) { return comp.layers.addSolid(color, name, w || comp.width, h || comp.height, 1); }
  function adjust(comp, name) { var L = solid(comp, name, [1, 1, 1]); L.adjustmentLayer = true; return L; }
  function rectShape(x0, y0, x1, y1) { var s = new Shape(); s.vertices = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]; s.closed = true; return s; }
  function ellipseShape(cx, cy, rx, ry) { var a = .5523 * rx, b = .5523 * ry, s = new Shape(); s.vertices = [[cx, cy - ry], [cx + rx, cy], [cx, cy + ry], [cx - rx, cy]];
    s.inTangents = [[-a, 0], [0, -b], [a, 0], [0, b]]; s.outTangents = [[a, 0], [0, b], [-a, 0], [0, -b]]; s.closed = true; return s; }
  function mask(L, shp, feather, inverted) { var M = L.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"); M.property("ADBE Mask Shape").setValue(shp);
    if (feather) M.property("ADBE Mask Feather").setValue([feather, feather]); if (inverted) M.inverted = true; return M; }
  function shapeLayer(comp, name) { var L = comp.layers.addShape(); L.name = name; L.anchorPoint.setValue([0, 0]); L.position.setValue([0, 0]); return L; }
  function addRect(L, x, y, w, h, fill, stroke, sw) { var g = L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group"), v = g.property("ADBE Vectors Group");
    var r = v.addProperty("ADBE Vector Shape - Rect"); r.property("ADBE Vector Rect Size").setValue([w, h]); r.property("ADBE Vector Rect Position").setValue([x, y]);
    if (stroke) { var s = v.addProperty("ADBE Vector Graphic - Stroke"); s.property("ADBE Vector Stroke Color").setValue(stroke); s.property("ADBE Vector Stroke Width").setValue(sw); }
    if (fill) v.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(fill);
    return g; }
  // every copy of the tape gets the same lens: a slight overscale and barrel, so its edges stay off screen and the copies line up
  function lens(L, notes) { L.scale.setValue([107, 107]); var oc = fx(L, "ADBE Optics Compensation"); setp(oc, "Field Of View (FOV)", 12, notes); return oc; }
  function timeRemapExpr(L, expr, D) { L.timeRemapEnabled = true; L.property("ADBE Time Remapping").expression = expr; L.outPoint = D; }
  // expression helper: "1 inside any window [[a, b], ...] at time, else 0"
  function winExpr(ws) { var s = []; for (var i = 0; i < ws.length; i++) s.push("[" + ws[i][0].toFixed(3) + "," + ws[i][1].toFixed(3) + "]");
    return "var w=[" + s.join(",") + "]; var on=0; for (var i=0;i<w.length;i++){ if (time>=w[i][0] && time<w[i][1]) on=1; } "; }

  // ---- the camcorder's own type: the bitmap face, white, a black outline
  function osdText(comp, name, str, size, pos, just, t0, t1, color) {
    var L = AESLib.text(comp, name, str, { family: OSDF, style: OSDS, size: size, color: color || C.white, pos: pos, just: just, tracking: 30, t0: t0, t1: t1 });
    var sp = L.property("Source Text"), td = sp.value; td.applyStroke = true; td.strokeColor = C.black; td.strokeWidth = Math.max(4, Math.round(size / 12));
    td.strokeOverFill = false; sp.setValue(td); return L; }
  function fitWidth(L, maxW, t) { var r = L.sourceRectAtTime(t, false); if (r.width > maxW) { var s = 100 * maxW / r.width; L.scale.setValue([s, s]); } }

  // ---- closed captions: one row = white monospace on a black box that follows the text's bounds (typed text grows its box)
  function ccRow(comp, P, id, y, t0, t1, times, strings) {
    var name = P + "_CC_" + id, box = shapeLayer(comp, name + "_BOX"), g = addRect(box, 0, 0, 10, 10, C.black);
    var rr = g.property("ADBE Vectors Group").property(1);
    var ref = "var L=thisComp.layer(\"" + name + "\"); var r=L.sourceRectAtTime(time,false); ";
    rr.property("ADBE Vector Rect Size").expression = ref + "[r.width+34, 66];";
    rr.property("ADBE Vector Rect Position").expression = ref + "L.toComp([r.left+r.width/2, -17]);";
    box.opacity.expression = ref + "(r.width>24)?100:0;";
    var T = AESLib.text(comp, name, " ", { family: CCF, style: CCS, size: 50, color: C.white, pos: [VW / 2, y], t0: t0, t1: t1 });
    AESLib.textKeys(T, times, strings); span(box, t0, t1); box.moveAfter(T); return T; }
  function ccLine(comp, P, id, y, t0, t1, str) { return ccRow(comp, P, id, y, t0, t1, [t0], [str]); }

  // ---- the battery: an outline with a nub and three bars; the bars drain at the tape events, the last one blinks before it dies
  function battery(comp, P, x, y, T, D, freeze) {
    var L = shapeLayer(comp, P + "_BATT");
    addRect(L, x + 44, y, 8, 18, C.white, C.black, 4);
    addRect(L, x, y, 80, 40, null, C.black, 11); addRect(L, x, y, 80, 40, null, C.white, 5);
    for (var i = 0; i < 3; i++) addRect(L, x - 24 + i * 22, y, 16, 26, C.white);
    // re-fetch the groups: handles go invalid once a sibling group is added
    var root = L.property("ADBE Root Vectors Group"), bars = [root.property(4), root.property(5), root.property(6)];
    var op = function (g) { return g.property("ADBE Vector Transform Group").property("ADBE Vector Group Opacity"); };
    keys(op(bars[2]), [{ t: 0, v: 100, o: "H" }, { t: T.number, v: 0, i: "H", o: "H" }]);       // the tear removed time: one bar gone
    keys(op(bars[1]), [{ t: 0, v: 100, o: "H" }, { t: T.end, v: 0, i: "H", o: "H" }]);
    op(bars[0]).expression = "(time<" + T.end.toFixed(3) + ")?100:((time<" + freeze.toFixed(3) + ")?(Math.floor(time*3)%2?100:20):0)";
    L.opacity.expression = "(time<" + freeze.toFixed(3) + ")?100:(Math.floor(time*4)%2?100:0)";
    return L; }

  function clock(sec) { var h = Math.floor(sec / 3600) % 24, m = Math.floor(sec / 60) % 60, s = Math.floor(sec) % 60, ap = "AM";
    if (h >= 12) ap = "PM"; var h12 = h % 12; if (h12 === 0) h12 = 12;
    return ap + " " + h12 + ":" + (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s; }

  // ---- the real clip on the CRT: the webcam frame, a little phosphor softness and a dark rim, frozen when the source runs out
  function screen(TC, P, scene, data, D, fps, notes) {
    var cw = 900, ch = 675, cx0 = 90, cy0 = 1206, B = scene.beat.input, f, c;
    var CC = app.project.items.addComp(P + "_CLIP", cw, ch, 1, D, fps), item = AESLib.importFile(scene.clip), K = CC.layers.add(item);
    K.name = P + "_CLIPSRC"; K.anchorPoint.setValue([0, 0]); K.position.setValue([-cx0, -cy0]); K.audioEnabled = false;
    var maxT = item.duration - 1 / fps, off = B.clipStart - B.t0;
    timeRemapExpr(K, "Math.max(0, Math.min(" + maxT.toFixed(3) + ", time + " + off.toFixed(3) + "))", D);
    var soft = adjust(CC, P + "_CRTSOFT"), g = fx(soft, "ADBE Gaussian Blur 2"); setp(g, "Blurriness", 1.5, notes);
    var lv = fx(soft, "ADBE Easy Levels2"); setp(lv, "Output Black", 0.07, notes); setp(lv, "Gamma", 1.1, notes);
    var rim = solid(CC, P + "_CRTRIM", C.black, cw, ch); mask(rim, ellipseShape(cw / 2, ch / 2, cw * .62, ch * .66), 140, true); rim.opacity.setValue(70);
    var L = TC.layers.add(CC); L.name = P + "_SCREEN"; L.anchorPoint.setValue([0, 0]); L.position.setValue([0, 0]); L.audioEnabled = false;
    var cp = fx(L, "ADBE Corner Pin"), pins = [[], [], [], []], ts = [], bl = [], op = [];
    for (f = 0; f < data.screen.length; f++) { if (!data.screenOn[f]) continue; ts.push(f / fps);
      for (c = 0; c < 4; c++) pins[c].push(data.screen[f][c]);
      bl.push(data.screenBlur[f] * 0.55); op.push(100 * (0.4 + 0.6 * data.screenFog[f])); }
    if (!ts.length) { L.enabled = false; return L; }
    for (c = 0; c < 4; c++) linKeys(cp.property(c + 1), ts, pins[c]);
    var gb = fx(L, "ADBE Gaussian Blur 2"); setp(gb, "Repeat Edge Pixels", 0, notes); linKeys(gb.property("Blurriness"), ts, bl); linKeys(L.opacity, ts, op);
    // hidden on the frames where the screen is off or out of frame (hold keys on a visibility slider through the opacity)
    var vis = [], vts = []; for (f = 0; f < data.screenOn.length; f++) { if (f === 0 || data.screenOn[f] !== data.screenOn[f - 1]) { vts.push(f / fps); vis.push(data.screenOn[f]); } }
    var vx = "var v=[" + vis.join(",") + "], tt=[" + vts.join(",") + "], on=0; for (var i=0;i<tt.length;i++){ if (time>=tt[i]-0.0001) on=v[i]; } on*value;";
    L.opacity.expression = vx;
    return L; }

  function buildScene(comp, scene, opts) { var P = opts.prefix || "BKR", A = opts.assets || {}; AESLib.clearOwned(comp, P);
    var B = scene.beat, D = comp.duration, fps = comp.frameRate, notes = [], comps = [], i;
    var T = { title: B.title.t0, picture: B.picture.t0, input: B.input.t0, number: B.number.t0, line: B.line.t0, carry: B.carry.t0, end: B.end.t0 };
    var plates = AESLib.readJSON(A.plates), data = AESLib.readJSON(plates.data), freeze = data.freeze, tear = data.tear;
    if (data.w !== comp.width || data.h !== comp.height) notes.push("track is " + data.w + "x" + data.h + ", comp " + comp.width + "x" + comp.height);

    // ---- the tape: everything the lens saw, in one comp (the plate upscaled, the clip on the CRT, bloom, auto-exposure)
    var TC = app.project.items.addComp(P + "_TAPE", VW, VH, 1, D, fps); comps.push(TC);
    var pitem = AESLib.importFile(plates.video), PL = TC.layers.add(pitem); PL.name = P + "_PLATE";
    var sc = 100 * VW / data.render[0]; PL.scale.setValue([sc, sc]); PL.position.setValue([VW / 2, VH / 2]);
    var SCR = screen(TC, P, scene, data, D, fps, notes); comps.push(SCR.source);
    // bloom: only the brightest values (panels, the red lamp, the screen), blurred, in Add
    var BL = TC.layers.add(pitem); BL.name = P + "_BLOOM"; BL.scale.setValue([sc, sc]); BL.position.setValue([VW / 2, VH / 2]); BL.blendingMode = BlendingMode.ADD;
    var blv = fx(BL, "ADBE Easy Levels2"); setp(blv, "Input Black", 0.78, notes); var bb = fx(BL, "ADBE Gaussian Blur 2"); setp(bb, "Blurriness", 46, notes); BL.opacity.setValue(55);
    // auto-exposure: the gain rises in a blackout, and when the lights return it is too bright and catches up over about 0.45 s
    var AE_ = adjust(TC, P + "_AGC"), ex = fx(AE_, "ADBE Exposure2"), exl = [{ t: 0, v: 0, o: "L" }];
    for (i = 0; i < data.blackouts.length; i++) { var s0 = data.blackouts[i][0], l0 = data.blackouts[i][1];
      exl.push({ t: s0, v: 0, i: "L", o: "L" }); exl.push({ t: s0 + .04, v: 1.9, i: "L", o: "L" }); exl.push({ t: s0 + l0, v: 1.9, i: "L", o: "L" });
      exl.push({ t: s0 + l0 + .02, v: 1.1, i: "L", o: 60 }); exl.push({ t: s0 + l0 + .47, v: 0, i: 80, o: "L" }); }
    var exp = null; try { exp = ex.property("Exposure"); } catch (e) {}
    if (exp) keys(exp, exl); else notes.push("Exposure2 has no Exposure property");

    // ---- the VHS pass, bottom to top in the main comp
    solid(comp, P + "_BLACK", C.black);
    var TP = comp.layers.add(TC); TP.name = P + "_TAPE"; timeRemapExpr(TP, "Math.min(time, " + freeze.toFixed(3) + ")", D);
    keys(TP.opacity, [{ t: 0, v: 0, o: "H" }, { t: 4 / fps, v: 100, i: "H", o: "H" }]);
    TP.position.expression = "seedRandom(Math.floor(time*30),true); value + [random(-1.2,1.2), 0];";   // line jitter, about a pixel
    // the power-on roll and the tear's roll: the picture wraps vertically and settles
    var ofs = fx(TP, "ADBE Offset"), sct = ofs.property(1);
    keys(sct, [{ t: 4 / fps, v: [VW / 2, VH / 2 + 1500], o: 40 }, { t: .45, v: [VW / 2, VH / 2], i: 85, o: "H" },
      { t: tear - .14, v: [VW / 2, VH / 2], i: "H", o: "L" }, { t: tear - .02, v: [VW / 2, VH / 2 - 620], i: "L", o: "H" }, { t: tear, v: [VW / 2, VH / 2 + 260], i: "H", o: 50 }, { t: tear + .14, v: [VW / 2, VH / 2], i: 80, o: "H" }]);
    var lb = fx(TP, "ADBE Gaussian Blur 2"); setp(lb, "Blurriness", 3.4, notes); setp(lb, "Blur Dimensions", 2, notes);           // luma: soft along the line
    var ch = fx(TP, "ADBE Channel Blur"); setp(ch, "Red Blurriness", 14, notes); setp(ch, "Blue Blurriness", 18, notes); setp(ch, "Blur Dimensions", 2, notes);
    var sh = fx(TP, "ADBE Sharpen"); setp(sh, "Sharpen Amount", 28, notes);                                                         // edge ringing
    var nz = fx(TP, "ADBE Noise"), na = nz.property(1);
    keys(na, [{ t: 0, v: 9, o: "L" }, { t: T.end, v: 11, i: "L", o: "L" }, { t: D, v: 14, i: "L" }]);                                 // tape noise and AGC grain
    try { nz.property(2).setValue(1); } catch (e) {}
    var lv = fx(TP, "ADBE Easy Levels2"); setp(lv, "Output Black", 0.075, notes); setp(lv, "Output White", 0.93, notes); setp(lv, "Gamma", 0.94, notes);
    var hs = fx(TP, "ADBE Color Balance (HLS)"); setp(hs, "Saturation", 28, notes);
    lens(TP, notes);                                                                                                                 // barrel on the image, not the OSD
    // head switching: the bottom lines slide right, noisy
    var HS = comp.layers.add(TC); HS.name = P + "_HEADSW"; timeRemapExpr(HS, "Math.min(time, " + freeze.toFixed(3) + ")", D);
    mask(HS, rectShape(-60, VH - 110, VW + 60, VH - 64), 0, false); HS.position.expression = "seedRandom(Math.floor(time*30),true); value + [random(18,34), random(-2,2)];";
    var hn = fx(HS, "ADBE Noise"); hn.property(1).setValue(45); lens(HS, notes);
    // tracking tears: a band of the picture shifted sideways and bright noise lines, at power-on, at the cut and when the battery dies
    var tw = [[4 / fps, .5], [tear - .24, tear + .16], [7.40, 7.48], [freeze - .06, freeze + .16]];
    var TB = comp.layers.add(TC); TB.name = P + "_TEARBAND"; timeRemapExpr(TB, "Math.min(time, " + freeze.toFixed(3) + ")", D);
    var tm = mask(TB, rectShape(0, 0, VW, 200), 6, false);
    tm.property("ADBE Mask Shape").expression = "seedRandom(Math.floor(time*30)+7,true); var y=random(-100,1800), h=random(60,300); createPath([[-80,y],[1160,y],[1160,y+h],[-80,y+h]],[],[],true);";
    TB.position.expression = winExpr(tw) + "seedRandom(Math.floor(time*30)+3,true); var s=(random()<0.5)?-1:1; value + [on*s*random(40,170), 0];";
    TB.opacity.expression = winExpr(tw) + "on*100;";
    var tn = fx(TB, "ADBE Noise"); tn.property(1).setValue(60); lens(TB, notes);
    var TL = shapeLayer(comp, P + "_TEARLINES"); TL.blendingMode = BlendingMode.SCREEN;
    for (i = 0; i < 18; i++) { var gl = addRect(TL, 0, 0, 400, 3, C.white);
      gl.property("ADBE Vector Transform Group").property("ADBE Vector Position").expression = "seedRandom(Math.floor(time*30)*31+" + i + ",true); [random(-200,1280), random(0,1920)];";
      gl.property("ADBE Vector Transform Group").property("ADBE Vector Scale").expression = "seedRandom(Math.floor(time*30)*17+" + i + ",true); [random(30,260), random(60,200)];"; }
    TL.opacity.expression = winExpr(tw) + "on*85;";
    // dropouts: a few short white streaks on about one frame in eight
    var DO = shapeLayer(comp, P + "_DROPOUT"); DO.blendingMode = BlendingMode.SCREEN;
    for (i = 0; i < 3; i++) { var gd = addRect(DO, 0, 0, 70, 2, C.white);
      gd.property("ADBE Vector Transform Group").property("ADBE Vector Position").expression = "seedRandom(Math.floor(time*30)*13+" + i + ",true); [random(40,1040), random(60,1860)];";
      gd.property("ADBE Vector Transform Group").property("ADBE Vector Scale").expression = "seedRandom(Math.floor(time*30)*7+" + i + ",true); [random(40,220), 100];"; }
    DO.opacity.expression = "seedRandom(Math.floor(time*30)+91,true); (random()<0.13)?90:0;";
    // white balance drifts: warm, then green after the tear, then back
    var WB = solid(comp, P + "_WB", C.warm); WB.blendingMode = BlendingMode.SOFT_LIGHT;
    keys(fx(WB, "ADBE Fill").property("Color"), [{ t: 0, v: C.warm, o: 50 }, { t: tear, v: C.green, i: 50, o: 50 }, { t: T.carry, v: C.cool, i: 50, o: 50 }, { t: D, v: C.warm, i: 50 }]);
    WB.opacity.expression = "16 + 6*Math.sin(time*0.9)";
    var VG = solid(comp, P + "_VIGNETTE", C.black); mask(VG, ellipseShape(VW / 2, VH / 2, VW * .78, VH * .62), 520, true); VG.opacity.setValue(72);

    // ---- the OSD (not touched by the tape): REC, battery, SP and counter, date and time
    var recDot = shapeLayer(comp, P + "_RECDOT"), rg = recDot.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group"), rv = rg.property("ADBE Vectors Group");
    rv.addProperty("ADBE Vector Shape - Ellipse").property("ADBE Vector Ellipse Size").setValue([52, 52]);
    var rs = rv.addProperty("ADBE Vector Graphic - Stroke"); rs.property("ADBE Vector Stroke Color").setValue(C.black); rs.property("ADBE Vector Stroke Width").setValue(7);
    rv.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(C.rec); recDot.position.setValue([112, 226]);
    span(recDot, 4 / fps, freeze);
    osdText(comp, P + "_REC", "REC", 120, [152, 262], "left", 4 / fps, freeze);
    var BT = battery(comp, P, 0, 0, T, D, freeze); BT.position.setValue([930, 226]); BT.scale.setValue([165, 165]);
    osdText(comp, P + "_SP", "SP", 92, [1004, 352], "right", 4 / fps, D);
    var cnt = osdText(comp, P + "_COUNTER", "0000", 92, [1004, 440], "right", T.number, D);
    var val = parseInt(B.number.value, 10), cts = [], cst = [], nfr = Math.round(.9 * fps);
    for (i = 0; i <= nfr; i++) { var n = Math.round(val * (1 - Math.pow(1 - i / nfr, 3))), s4 = String(n); while (s4.length < 4) s4 = "0" + s4; cts.push(T.number + .12 + i / fps); cst.push(s4); }
    AESLib.textKeys(cnt, cts, cst);
    osdText(comp, P + "_DATE", "OCT 22 1996", 100, [80, 1590], "left", 4 / fps, D);
    var clk = osdText(comp, P + "_TIME", clock(0), 100, [80, 1690], "left", 4 / fps, D), kts = [], kst = [], base = 23 * 3600 + 47 * 60 + 3, jump = 2 * 3600 + 16 * 60 + 38;
    for (var sec = 0; sec < tear; sec++) { kts.push(sec); kst.push(clock(base + sec)); }
    kts.push(tear); kst.push(clock(base + tear + jump));                                     // the tear removed time: the clock jumps
    for (var s2 = Math.ceil(tear); s2 <= freeze; s2++) { kts.push(s2); kst.push(clock(base + s2 + jump)); }
    AESLib.textKeys(clk, kts, kst);

    // ---- the title generator: the OSD face, larger, over the first shot and the last
    var t1 = osdText(comp, P + "_TITLE1", B.title.context.toUpperCase(), 92, [VW / 2, 790], "center", .45, T.picture);
    var t2 = osdText(comp, P + "_TITLE2", B.title.hero.toUpperCase(), 118, [VW / 2, 900], "center", .45, T.picture);
    fitWidth(t1, 960, 1); fitWidth(t2, 960, 1);
    var e1 = osdText(comp, P + "_ENDTITLE", B.end.text.toUpperCase(), 118, [VW / 2, 640], "center", T.end + .22, D); fitWidth(e1, 960, D - .1);

    // ---- closed captions, above the date; the line beat is painted on word by word as it is spoken
    var Y1 = 1340, Y2 = 1414;
    ccLine(comp, P, "PIC", Y2, T.picture + .05, T.input - .03, "Three pieces build one picture.");
    ccLine(comp, P, "IN1", Y1, T.input + .05, T.number - .03, "Here's a real frame");
    ccLine(comp, P, "IN2", Y2, T.input + .05, T.number - .03, "from my video.");
    ccLine(comp, P, "NUM", Y2, T.number + .16, T.line - .03, String(B.number.value) + " " + String(B.number.label) + ", counted.");
    var lw = B.line.text.split(" "), wt = (data.lineWords || []).slice(), lt = [], ls = [];
    if (wt.length !== lw.length) { wt = []; for (i = 0; i < lw.length; i++) wt.push(T.line + .05 + i * (T.carry - T.line - .3) / lw.length); }
    for (i = 0; i < lw.length; i++) { lt.push(wt[i]); ls.push(lw.slice(0, i + 1).join(" ")); }
    ccRow(comp, P, "LINE", Y2, T.line, T.carry - .03, [T.line].concat(lt), [" "].concat(ls));
    ccLine(comp, P, "SDH", Y1, T.carry + .02, T.carry + .7, "[LIGHTS FLICKER]");
    ccLine(comp, P, "CARRY", Y2, T.carry + .05, T.end - .03, "Then one thing becomes the next.");

    var total = comp.numLayers; for (i = 0; i < comps.length; i++) total += comps[i].numLayers;
    notes.push(data.frames + " plate frames"); return { layers: total, notes: notes }; }

  return { buildScene: buildScene, screen: screen, ccRow: ccRow, ccLine: ccLine, battery: battery, osdText: osdText, PALETTE: C };
})();
