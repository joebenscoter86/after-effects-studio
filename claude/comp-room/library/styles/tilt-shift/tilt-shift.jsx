// Tilt-shift miniature style: brand-neutral ES3 helpers. No project mutation happens at load.
// Read styles/tilt-shift/STYLE.md first. The world is a Blender plate (tools/town.py: a sunny harbour town from high up, a physical
// depth of field focused on each shot's subject, everything that moves stepping at 10 Hz in a x12 time-lapse, smooth at x1 in the end)
// rendered by tools/plate.mjs with a per-frame track. After Effects draws what lives on and around it: the rooftop billboard's face
// (a holdout in the plate) carries the real clip and the neon sign, corner-pinned under the plate; neon spill over the board; the
// grade (saturation, contrast, warm highlights, vignette); a screen-space band that follows the subject; and the type, which belongs
// to the town's own signage: cobalt harbour-notice panels in a highway-sign grotesk (Barlow) and a monospace time-lapse clock
// (IBM Plex Mono) that reads x12 TIME-LAPSE until time drops to x1 REAL TIME.
// Adapted from Lemo-Opuscar's tilt-shift style (MIT, LemoLab); see library/styles/LICENSE-lemo-opuscar.txt.
var AESTiltShift = (function () {
  var SIGNF = "Barlow Semi Condensed", SIGNS = "SemiBold", MONOF = "IBM Plex Mono", MONOS = "Medium";
  function hex(h) { return [parseInt(h.substr(1, 2), 16) / 255, parseInt(h.substr(3, 2), 16) / 255, parseInt(h.substr(5, 2), 16) / 255]; }
  var C = { cobalt: hex("#1F5FA8"), white: hex("#FFFFFF"), board: hex("#3A2216"), boardRim: hex("#5A3A26"), pink: hex("#FF7A93"), cyan: hex("#7FF3FF"),
    pinkGlow: hex("#FF3D6E"), cyanGlow: hex("#2BD9FF"), chip: hex("#14213A"), warm: hex("#FFB46A"), red: hex("#FF3B2F"), amber: hex("#FFC94A") };
  var VW = 1080, VH = 1920, SW = 948, SH = 675;

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
  function holdKeys(prop, ts, vs) { if (!ts.length) return prop; prop.setValuesAtTimes(ts, vs);
    for (var k = 1; k <= prop.numKeys; k++) prop.setInterpolationTypeAtKey(k, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD); return prop; }
  function fx(L, match) { L.property("ADBE Effect Parade").addProperty(match); var EP = L.property("ADBE Effect Parade"); return EP.property(EP.numProperties); }
  function span(L, t0, t1) { L.inPoint = t0; L.outPoint = t1; return L; }
  function solid(comp, name, color, w, h) { return comp.layers.addSolid(color, name, w || comp.width, h || comp.height, 1); }
  function adjust(comp, name) { var L = solid(comp, name, [1, 1, 1]); L.adjustmentLayer = true; return L; }
  function blur(L, r) { var g = fx(L, "ADBE Gaussian Blur 2"); g.property("Blurriness").setValue(r); try { g.property("Repeat Edge Pixels").setValue(1); } catch (e) {} return g; }
  function rectShape(x0, y0, x1, y1) { var s = new Shape(); s.vertices = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]; s.closed = true; return s; }
  function ellipseShape(cx, cy, rx, ry) { var a = .5523 * rx, b = .5523 * ry, s = new Shape(); s.vertices = [[cx, cy - ry], [cx + rx, cy], [cx, cy + ry], [cx - rx, cy]];
    s.inTangents = [[-a, 0], [0, -b], [a, 0], [0, b]]; s.outTangents = [[a, 0], [0, b], [-a, 0], [0, -b]]; s.closed = true; return s; }
  function mask(L, shp, feather, inverted) { var M = L.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"); M.property("ADBE Mask Shape").setValue(shp);
    if (feather) M.property("ADBE Mask Feather").setValue([feather, feather]); if (inverted) M.inverted = true; return M; }
  function glow(L, radius, intensity, threshold) { var g = fx(L, "ADBE Glo2"); try { g.property("Glow Threshold").setValue(threshold || 40); g.property("Glow Radius").setValue(radius); g.property("Glow Intensity").setValue(intensity); } catch (e) {} return g; }
  // a rounded panel: a shape layer with a rounded rectangle, a fill and an optional stroke, anchored at its centre
  function panel(comp, name, w, h, fill, stroke, sw, round, pos) { var L = comp.layers.addShape(); L.name = name;
    var v = L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").property("ADBE Vectors Group");
    var r = v.addProperty("ADBE Vector Shape - Rect"); r.property("ADBE Vector Rect Size").setValue([w, h]); r.property("ADBE Vector Rect Roundness").setValue(round || 0);
    if (stroke) { var s = v.addProperty("ADBE Vector Graphic - Stroke"); s.property("ADBE Vector Stroke Color").setValue(stroke); s.property("ADBE Vector Stroke Width").setValue(sw || 4); }
    v.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(fill);
    L.anchorPoint.setValue([0, 0]); L.position.setValue(pos); return L; }
  function fit(L, maxW) { var w = L.sourceRectAtTime(0, false).width; if (w <= maxW) return L; var sp = L.property("Source Text"), td = sp.value; td.fontSize = td.fontSize * maxW / w; sp.setValue(td); return L; }
  // corner-pin a layer of the sign's size from the screen corners in the track, over the frames in [t0, t1]
  function pin(L, track, t0, t1, fps) { L.anchorPoint.setValue([0, 0]); L.position.setValue([0, 0]);
    var cp = fx(L, "ADBE Corner Pin"), f0 = Math.max(0, Math.floor(t0 * fps) - 1), f1 = Math.min(track.screen.length - 1, Math.ceil(t1 * fps) + 1), ts = [], pins = [[], [], [], []];
    for (var f = f0; f <= f1; f++) { ts.push(f / fps); for (var c = 0; c < 4; c++) pins[c].push(track.screen[f][c]); }
    for (var p = 0; p < 4; p++) linKeys(cp.property(p + 1), ts, pins[p]); span(L, t0, t1); return L; }

  // ---- the billboard's face: a precomp of the sign's size. The neon sign: a dark board, a thin rim, two lines of neon capitals that
  // flicker on (a few hold keys off and on), each with a glow in its own colour. Lines: [{ text, color, glow, size, y, on }]
  function neonText(SC, name, ln) { var L = AESLib.text(SC, name, ln.text, { family: SIGNF, style: SIGNS, size: ln.size, color: ln.color, just: "center", tracking: ln.tracking || 120, pos: [SW / 2, ln.y] });
    fit(L, SW - 110); glow(L, ln.glowR || 18, 1.4, 30); try { var g = L.property("ADBE Effect Parade").property(1); g.property("Glow Colors").setValue(2); g.property("Color A").setValue(ln.glow); g.property("Color B").setValue(ln.glow); } catch (e) {}
    var on = ln.on; holdKeys(L.opacity, [0, on, on + .07, on + .12, on + .2, on + .26], [0, 100, 20, 100, 45, 100]); return L; }
  function signComp(P, D, fps, lines, rimOn) { var SC = app.project.items.addComp(P + "_SIGN", SW, SH, 1, D, fps);
    SC.layers.addSolid(C.board, P + "_SIGNBOARD", SW, SH, 1);
    var rim = SC.layers.addShape(); rim.name = P + "_SIGNRIM"; var v = rim.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").property("ADBE Vectors Group");
    var r = v.addProperty("ADBE Vector Shape - Rect"); r.property("ADBE Vector Rect Size").setValue([SW - 44, SH - 44]); r.property("ADBE Vector Rect Roundness").setValue(18);
    var st = v.addProperty("ADBE Vector Graphic - Stroke"); st.property("ADBE Vector Stroke Color").setValue(C.amber); st.property("ADBE Vector Stroke Width").setValue(7);
    rim.anchorPoint.setValue([0, 0]); rim.position.setValue([SW / 2, SH / 2]); glow(rim, 14, 1.2, 30);
    holdKeys(rim.opacity, rimOn[0], rimOn[1]);
    for (var j = 0; j < lines.length; j++) { var ln = lines[j], L = neonText(SC, P + "_NEON" + j, ln); if (ln.off) { L.outPoint = ln.off; } }
    return SC; }
  // the real clip, cropped to the webcam frame of the input picture, a little contrast so it reads as a lit screen in daylight
  function clipComp(P, scene, D, fps) { var cx0 = 66, cy0 = 1206, B = scene.beat.input;
    var CC = app.project.items.addComp(P + "_CLIP", SW, SH, 1, D, fps); var K = CC.layers.add(AESLib.importFile(scene.clip));
    K.name = P + "_CLIPSRC"; K.startTime = B.t0 - B.clipStart; K.anchorPoint.setValue([0, 0]); K.position.setValue([-cx0, -cy0]); K.audioEnabled = false;
    var lv = fx(K, "ADBE Easy Levels2"); lv.property("Output Black").setValue(0.04); lv.property("Gamma").setValue(1.12);
    return CC; }

  // ---- type: the town's signage. A cobalt harbour notice with a white border, white Barlow capitals or sentence case
  function notice(comp, name, str, o) { var size = o.size || 52, padX = 46, padY = 26;
    var T = AESLib.text(comp, name + "_TXT", str, { family: SIGNF, style: SIGNS, size: size, color: C.white, just: "center", tracking: o.tracking || 20, pos: [o.x || VW / 2, o.y] });
    fit(T, o.maxW || 900); var r = T.sourceRectAtTime(o.t0 + .5, false), w = (o.w || r.width) + padX * 2, h = (o.h || size * 1.05) + padY * 2;
    var cy = o.y + r.top + r.height / 2; if (o.h) cy = o.y - size * .36 + o.h / 2 - size * .1;
    var Pn = panel(comp, name + "_PANEL", w, h, C.cobalt, C.white, 5, 12, [o.x || VW / 2, cy]); Pn.moveAfter(T);
    var Sh = panel(comp, name + "_SHADOW", w, h, [0, 0, 0], null, 0, 12, [(o.x || VW / 2) + 5, cy + 8]); Sh.opacity.setValue(30); blur(Sh, 10); Sh.moveAfter(Pn);
    var all = [T, Pn, Sh]; for (var i = 0; i < all.length; i++) span(all[i], o.t0, o.t1);
    // the panel flips on like a sign: scale Y from 0 with a small settle, the text a frame later; out: a quick fold
    keys(Pn.scale, [{ t: o.t0, v: [100, 0], o: 30 }, { t: o.t0 + .16, v: [100, 108], i: 60, o: 40 }, { t: o.t0 + .26, v: [100, 100], i: 60 }, { t: o.t1 - .12, v: [100, 100], o: 60 }, { t: o.t1, v: [100, 0], i: 40 }]);
    Sh.scale.expression = "thisComp.layer(\"" + Pn.name + "\").transform.scale";
    keys(T.opacity, [{ t: o.t0 + .08, v: 0, o: "L" }, { t: o.t0 + .16, v: 100, i: "L", o: "H" }, { t: o.t1 - .12, v: 100, o: "L" }, { t: o.t1 - .04, v: 0, i: "L" }]);
    return { text: T, panel: Pn, shadow: Sh }; }
  // the time-lapse clock: a dark chip, a red dot that blinks with the steps, the speed and the town's time of day
  function hhmmss(s) { var t = Math.floor(s), h = Math.floor(t / 3600) % 24, m = Math.floor(t / 60) % 60, x = t % 60; function z(n) { return (n < 10 ? "0" : "") + n; } return z(h) + ":" + z(m) + ":" + z(x); }
  function clockHUD(comp, P, track, fps, start) { var y = 120, x0 = 64;
    var bg = panel(comp, P + "_CLOCKCHIP", 600, 74, C.chip, null, 0, 37, [x0 + 300, y]); bg.opacity.setValue(78);
    var dot = panel(comp, P + "_CLOCKDOT", 18, 18, C.red, null, 0, 9, [x0 + 40, y]);
    var T = AESLib.text(comp, P + "_CLOCK", "x12 TIME-LAPSE", { family: MONOF, style: MONOS, size: 30, color: C.white, just: "left", tracking: 40, pos: [x0 + 66, y + 11] });
    var strs = [], dts = [], dvs = [];
    for (var f = 0; f < track.clock.length; f++) { var sp = track.speed[f], lab = sp > 1 ? ("×" + sp + " TIME-LAPSE  ") : "×1 REAL TIME   ";
      strs.push(lab + hhmmss(start + track.clock[f]));
      if (sp > 1 && f % track.stepFrames === 0) { dts.push(f / fps, (f + 1) / fps); dvs.push(100, 35); } }
    AESLib.bakeText(T, strs, fps, 0);
    var endF = -1; for (var e = 0; e < track.speed.length; e++) if (track.speed[e] === 1) { endF = e; break; }
    if (endF >= 0) { dts.push(endF / fps); dvs.push(100); }
    holdKeys(dot.opacity, dts, dvs);
    if (endF >= 0) { var dc = dot.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color");
      holdKeys(dc, [0, endF / fps], [C.red, hex("#3BE37A")]);
      // the readout itself: amber in time-lapse, green at real time (a Fill effect, so the baked strings keep one style)
      var fl = fx(T, "ADBE Fill"); holdKeys(fl.property("Color"), [0, endF / fps], [C.amber, hex("#5CF08F")]);
      keys(bg.scale, [{ t: endF / fps, v: [100, 100], o: 30 }, { t: endF / fps + .1, v: [106, 112], i: 50, o: 50 }, { t: endF / fps + .3, v: [100, 100], i: 50 }]); }
    return T; }

  function buildScene(comp, scene, opts) { var P = opts.prefix || "TILTSH", A = opts.assets || {}; AESLib.clearOwned(comp, P);
    var B = scene.beat, D = comp.duration, fps = comp.frameRate, notes = [], comps = [];
    var T = { title: B.title.t0, picture: B.picture.t0, input: B.input.t0, number: B.number.t0, line: B.line.t0, carry: B.carry.t0, end: B.end.t0 };
    var track = AESLib.readJSON(A.track);
    if (track.w !== comp.width || track.h !== comp.height) notes.push("track is " + track.w + "x" + track.h + ", comp " + comp.width + "x" + comp.height);
    var bg = solid(comp, P + "_BG", hex("#B9B2A6")); // behind everything: the town floor's colour, in case the plate leaves a gap

    // the carry: the clip stays on the billboard into the carry, then switches off on "becomes" (a collapse to a bright line) and the
    // board's neon rim lights; the end lights the words
    var tSwitch = T.carry + (T.end - T.carry) * .4; var wt = track.lineWords || [];
    var titleLines = [{ text: B.title.context.toUpperCase(), color: C.cyan, glow: C.cyanGlow, size: 92, y: 250, on: .12, off: T.input },
                      { text: B.title.hero.toUpperCase(), color: C.pink, glow: C.pinkGlow, size: 112, y: 440, on: .42, off: T.input }];
    var et = B.end.text.toUpperCase().split(" "), e1 = et.slice(0, Math.ceil(et.length / 2)).join(" "), e2 = et.slice(Math.ceil(et.length / 2)).join(" ");
    var endLines = [{ text: e1, color: C.cyan, glow: C.cyanGlow, size: 150, y: 290, on: T.end + .12 }, { text: e2, color: C.pink, glow: C.pinkGlow, size: 170, y: 500, on: T.end + .4 }];
    var SG = signComp(P, D, fps, titleLines.concat(endLines), [[0, .05, .09, .13, tSwitch + .05, tSwitch + .12, tSwitch + .16, tSwitch + .22], [0, 100, 30, 100, 0, 100, 40, 100]]); comps.push(SG);
    var CC = clipComp(P, scene, D, fps); comps.push(CC);
    var signL = comp.layers.add(SG); signL.name = P + "_SIGNPIN"; pin(signL, track, 0, D, fps);
    var clipL = comp.layers.add(CC); clipL.name = P + "_CLIPPIN"; clipL.audioEnabled = false; pin(clipL, track, T.input, tSwitch + .1, fps);
    // the clip comes on with a flicker; it switches off by collapsing to a line (old screen off), drawn inside the pin
    holdKeys(clipL.opacity, [T.input, T.input + .05, T.input + .09, T.input + .14], [100, 30, 100, 100]);
    // the pin owns the corners, so the switch-off collapses a mask to a thin line instead of scaling the layer
    var cm = mask(clipL, rectShape(0, 0, SW, SH), 0); keys(cm.property("ADBE Mask Shape"), [{ t: tSwitch - .1, v: rectShape(0, 0, SW, SH), o: 60 }, { t: tSwitch + .06, v: rectShape(0, SH / 2 - 3, SW, SH / 2 + 3), i: 80 }]);

    // the plate
    var plate = AESLib.importFile(A.plate); try { plate.mainSource.alphaMode = AlphaMode.STRAIGHT; } catch (e) {} plate.mainSource.conformFrameRate = fps;
    var PL = comp.layers.add(plate); PL.name = P + "_PLATE"; PL.startTime = 0; PL.audioEnabled = false;
    // neon spill: the pinned sign again, blurred, in Add over the plate, so the glow bleeds past the board's frame
    var spill = comp.layers.add(SG); spill.name = P + "_SIGNSPILL"; pin(spill, track, 0, D, fps); spill.blendingMode = BlendingMode.ADD;
    var sl = fx(spill, "ADBE Easy Levels2"); sl.property("Input Black").setValue(0.35); blur(spill, 26); spill.opacity.setValue(70);

    // the grade: a freshly painted model. Saturation up, soft contrast, warm highlights, a vignette
    var GR = adjust(comp, P + "_GRADE"); var hs = fx(GR, "ADBE HUE SATURATION");
    try { hs.property("Master Saturation").setValue(42); } catch (e) { notes.push("saturation: " + e.message); }
    var bc = fx(GR, "ADBE Brightness & Contrast 2"); try { bc.property("Contrast").setValue(14); bc.property("Brightness").setValue(4); } catch (e) {}
    var WM = solid(comp, P + "_WARM", C.warm); WM.blendingMode = BlendingMode.SOFT_LIGHT; keys(WM.opacity, [{ t: 0, v: 12, o: 50 }, { t: T.carry, v: 14, i: 50, o: 50 }, { t: D, v: 26, i: 50 }]);
    // the band: a screen-space blur outside a strip that follows the subject (from the track), feathered, mixed over the lens blur
    var BD = adjust(comp, P + "_BAND"); blur(BD, 13); var bm = mask(BD, rectShape(-60, 700, VW + 60, 1100), 280, true), bts = [], bvs = [];
    for (var f = 0; f < track.band.length; f += 2) { var y = track.band[f][0], hh = Math.max(200, track.band[f][1]); bts.push(f / fps); bvs.push(rectShape(-80, y - hh, VW + 80, y + hh)); }
    linKeys(bm.property("ADBE Mask Shape"), bts, bvs);
    var VG = solid(comp, P + "_VIGNETTE", [0, 0, 0]); mask(VG, ellipseShape(VW / 2, VH / 2, VW * .78, VH * .62), 420, true); VG.opacity.setValue(42); VG.blendingMode = BlendingMode.MULTIPLY;

    // ---- the clock (the audience's speedometer)
    clockHUD(comp, P, track, fps, 7 * 3600 + 41 * 60 + 12);

    // ---- harbour notices where the beat carries no type of its own
    notice(comp, P + "_SUBPIC", "Three pieces build one picture.", { y: 1640, t0: T.picture + .06, t1: T.input - .04 });
    notice(comp, P + "_SUBIN", "Here's a real frame from my video.", { y: 1640, t0: T.input + .06, t1: T.number - .04 });
    notice(comp, P + "_SUBCARRY", "Then one thing becomes the next.", { y: 1640, t0: T.carry + .06, t1: T.end - .04 });

    // ---- number: the digits are painted on the plaza in the plate (tools/town.py); the label is a notice under them
    var dt = track.digits || [T.number + .3]; var lbT0 = dt[dt.length - 1] + .08;
    notice(comp, P + "_NUMLABEL", String(B.number.label).toUpperCase(), { y: 1330, size: 76, tracking: 260, t0: lbT0, t1: T.line - .04 });

    // ---- line: a platform board typed by the voice, word by word, in the lower band while the band follows the red van
    var words = B.line.text.split(" "); if (wt.length !== words.length) { wt = []; for (var q = 0; q < words.length; q++) wt.push(T.line + .05 + q * (T.carry - T.line - .3) / words.length); }
    var cut = Math.ceil(words.length / 2), lineN = notice(comp, P + "_LINE", " ", { y: 1560, size: 66, w: 860, h: 170, t0: T.line + .02, t1: T.carry - .04 });
    var tdoc = lineN.text.property("Source Text").value; tdoc.autoLeading = false; tdoc.leading = 80; lineN.text.property("Source Text").setValue(tdoc);
    var ts = [T.line + .02], ss = [" "]; for (var w = 0; w < words.length; w++) { var a = words.slice(0, Math.min(w + 1, cut)).join(" "), b = w + 1 > cut ? words.slice(cut, w + 1).join(" ") : "";
      ts.push(Math.max(T.line + .1, wt[w])); ss.push(b ? a + "\r" + b : a); }
    AESLib.textKeys(lineN.text, ts, ss);

    var total = comp.numLayers; for (var n = 0; n < comps.length; n++) total += comps[n].numLayers;
    notes.push(track.frames + " plate frames"); return { layers: total, notes: notes }; }

  return { buildScene: buildScene, signComp: signComp, clipComp: clipComp, pin: pin, notice: notice, clockHUD: clockHUD, PALETTE: C };
})();
