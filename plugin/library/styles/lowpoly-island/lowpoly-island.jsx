// Low-poly isometric island style: brand-neutral ES3 helpers. No project mutation happens at load.
// Read styles/lowpoly-island/STYLE.md first. The world is a Blender plate (tools/island.py: flat-shaded hex columns and primitive props,
// one orthographic camera, time of day as keyed colours, the far sea faded to alpha) rendered by tools/plate.mjs with a per-frame track.
// After Effects draws what sits around and inside it: the sky as a screen-space vertical gradient keyed with the time of day, stars at
// night, the real clip corner-pinned under the plate where the screen is a holdout, bloom that grows with the night, a light tilt-shift
// at the frame edges, the lighthouse beam (a Gaussian ribbon and a wider halo from the lamp toward the tracked tip), and the type:
// geometric caps (Josefin Sans) whose letters rise from under a water line with a damped overshoot, rounded subtitles (Fredoka) with a
// soft dark-blue shadow and a small flat-shaded tile icon whose top follows the time of day.
// Adapted from Lemo-Opuscar's lowpoly-island style (MIT, LemoLab); see library/styles/LICENSE-lemo-opuscar.txt.
var AESLowpolyIsland = (function () {
  var CAPF = "Josefin Sans", CAPS = "SemiBold", SUBF = "Fredoka", SUBS = "SemiBold";
  function hex(h) { return [parseInt(h.substr(1, 2), 16) / 255, parseInt(h.substr(3, 2), 16) / 255, parseInt(h.substr(5, 2), 16) / 255]; }
  var C = { warm: hex("#FFF6EA"), shadow: hex("#1C2350"), beam: hex("#FFE2A8"), lamp: hex("#FFD58A"),
    dayZen: hex("#9CC8EC"), dayHor: hex("#EEF5F4"), duskZen: hex("#7C7FC4"), duskHor: hex("#F7B99C"), nightZen: hex("#101247"), nightHor: hex("#3B3D8E"),
    grass: hex("#93CC7A"), grassSide: hex("#6E8F5E"), apricot: hex("#F6B48A"), apricotSide: hex("#B9795B"), lilac: hex("#A9A6F0"), lilacSide: hex("#5A5EAE") };
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
  function span(L, t0, t1) { L.inPoint = t0; L.outPoint = t1; return L; }
  function solid(comp, name, color, w, h) { return comp.layers.addSolid(color, name, w || comp.width, h || comp.height, 1); }
  function adjust(comp, name) { var L = solid(comp, name, [1, 1, 1]); L.adjustmentLayer = true; return L; }
  function blur(L, r) { var g = fx(L, "ADBE Gaussian Blur 2"); g.property("Blurriness").setValue(r); try { g.property("Repeat Edge Pixels").setValue(1); } catch (e) {} return g; }
  function rectShape(x0, y0, x1, y1) { var s = new Shape(); s.vertices = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]; s.closed = true; return s; }
  function mask(L, shp, feather, inverted) { var M = L.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"); M.property("ADBE Mask Shape").setValue(shp);
    if (feather) M.property("ADBE Mask Feather").setValue([feather, feather]); if (inverted) M.inverted = true; return M; }
  function ellipseShape(cx, cy, rx, ry) { var a = .5523 * rx, b = .5523 * ry, s = new Shape(); s.vertices = [[cx, cy - ry], [cx + rx, cy], [cx, cy + ry], [cx - rx, cy]];
    s.inTangents = [[-a, 0], [0, -b], [a, 0], [0, b]]; s.outTangents = [[a, 0], [0, b], [-a, 0], [0, -b]]; s.closed = true; return s; }
  // a soft glow: a solid with a feathered elliptical mask (a blurred shape layer clips to its own bounds; hd-2d)
  function softEllipse(comp, name, color, r, feather) { var w = Math.ceil(r * 2 + feather * 2 + 8), L = solid(comp, name, color, w, w);
    mask(L, ellipseShape(w / 2, w / 2, r, r), feather); return L; }

  // ---- time of day: the same keys as tools/island.py (day, late afternoon, dusk, night)
  function todTimes(T) { return [0, T.line - 0.6, T.line + 0.45, T.carry - 0.05]; }
  function todKeys(prop, T, vals) { var ts = todTimes(T), list = []; for (var i = 0; i < ts.length; i++) list.push({ t: ts[i], v: vals[i], i: 50, o: 50 }); keys(prop, list); }

  function sky(comp, P, T) { var L = solid(comp, P + "_SKY", [1, 1, 1]); var g = fx(L, "ADBE Ramp");
    g.property("Start of Ramp").setValue([VW / 2, 0]); g.property("End of Ramp").setValue([VW / 2, 820]); g.property("Ramp Shape").setValue(1);
    todKeys(g.property("Start Color"), T, [C.dayZen, C.dayZen, C.duskZen, C.nightZen]);
    todKeys(g.property("End Color"), T, [C.dayHor, C.dayHor, C.duskHor, C.nightHor]); return L; }

  // stars where the haze is thick (the top of the frame), twinkling, only after dusk
  function stars(comp, P, T, D) { var L = comp.layers.addShape(); L.name = P + "_STARS"; L.anchorPoint.setValue([0, 0]); L.position.setValue([0, 0]);
    var root = L.property("ADBE Root Vectors Group"), seed = 11;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    for (var i = 0; i < 70; i++) { var g = root.addProperty("ADBE Vector Group"), v = g.property("ADBE Vectors Group"), y = 40 + Math.pow(rnd(), 1.4) * 700, r = 1.6 + rnd() * 2.4;
      var e = v.addProperty("ADBE Vector Shape - Ellipse"); e.property("ADBE Vector Ellipse Size").setValue([r * 2, r * 2]); e.property("ADBE Vector Ellipse Position").setValue([20 + rnd() * (VW - 40), y]);
      v.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue([1, .97, .9]);
      g.property("ADBE Vector Transform Group").property("ADBE Vector Group Opacity").expression = "55 + 45 * Math.sin(time * " + (1.5 + rnd() * 3).toFixed(2) + " + " + (rnd() * 6.28).toFixed(2) + ")"; }
    keys(L.opacity, [{ t: T.line + 0.5, v: 0, o: 40 }, { t: T.carry, v: 100, i: 40 }]); return L; }

  // the real clip: cropped to the webcam frame, corner-pinned frame by frame onto the screen (under the plate, which holds it out)
  function clip(comp, P, scene, track, D, fps) { var cw = 948, ch = 675, cx0 = 66, cy0 = 1206, B = scene.beat.input;
    var CC = app.project.items.addComp(P + "_CLIP", cw, ch, 1, D, fps); var item = AESLib.importFile(scene.clip), K = CC.layers.add(item);
    K.name = P + "_CLIPSRC"; K.startTime = B.t0 - B.clipStart; K.anchorPoint.setValue([0, 0]); K.position.setValue([-cx0, -cy0]); K.audioEnabled = false;
    var L = comp.layers.add(CC); L.name = P + "_CLIP"; L.anchorPoint.setValue([0, 0]); L.position.setValue([0, 0]); L.audioEnabled = false;
    var lv = fx(L, "ADBE Easy Levels2"); lv.property("Output Black").setValue(0.06); lv.property("Gamma").setValue(1.08);
    var cp = fx(L, "ADBE Corner Pin"), pins = [[], [], [], []], ts = [], first = -1, last = -1;
    for (var f = 0; f < track.screen.length; f++) { if (!track.screenOn[f]) continue; if (first < 0) first = f; last = f; }
    if (first < 0) { L.enabled = false; return { comp: CC, layer: L }; }
    for (var f2 = Math.max(0, first - 1); f2 <= Math.min(track.screen.length - 1, last + 1); f2++) { ts.push(f2 / fps);
      for (var c = 0; c < 4; c++) pins[c].push(track.screen[f2][c]); }
    for (var p = 0; p < 4; p++) linKeys(cp.property(p + 1), ts, pins[p]);
    span(L, first / fps, (last + 1) / fps); return { comp: CC, layer: L }; }

  // the lighthouse beam: a ribbon bright at the root and fading with distance, plus a wider faint halo, from the lamp to the tip
  function beam(comp, P, name, track, t0, D, fps, thick, op, feather) { var Lw = 1000, L = solid(comp, P + "_" + name, C.beam, Lw, thick * 3);
    L.anchorPoint.setValue([0, thick * 1.5]); var g = fx(L, "ADBE Ramp"); g.property("Start of Ramp").setValue([0, thick * 1.5]); g.property("End of Ramp").setValue([Lw, thick * 1.5]);
    g.property("Start Color").setValue([1, 1, 1]); g.property("End Color").setValue([0, 0, 0]); g.property("Ramp Shape").setValue(1);
    var tn = fx(L, "ADBE Tint"); tn.property("Map Black To").setValue([0, 0, 0]); tn.property("Map White To").setValue(C.beam);
    var s = new Shape(); s.vertices = [[0, thick * 1.5 - thick * .18], [Lw, thick * 1.5 - thick * .5], [Lw, thick * 1.5 + thick * .5], [0, thick * 1.5 + thick * .18]]; s.closed = true;
    mask(L, s, feather); L.blendingMode = BlendingMode.ADD;
    var f0 = Math.floor(t0 * fps), ts = [], pos = [], rot = [], scl = [];
    for (var f = f0; f < track.lamp.length; f++) { var a = track.lamp[f], b = track.tip[f], dx = b[0] - a[0], dy = b[1] - a[1];
      ts.push(f / fps); pos.push(a); rot.push(Math.atan2(dy, dx) * 180 / Math.PI); scl.push([100 * Math.sqrt(dx * dx + dy * dy) / Lw, 100]); }
    // unwrap the angle so the sweep never spins the long way between two frames
    for (var u = 1; u < rot.length; u++) { while (rot[u] - rot[u - 1] > 180) rot[u] -= 360; while (rot[u] - rot[u - 1] < -180) rot[u] += 360; }
    linKeys(L.position, ts, pos); linKeys(L.rotation, ts, rot); linKeys(L.scale, ts, scl);
    keys(L.opacity, [{ t: t0, v: 0, o: "L" }, { t: t0 + .12, v: op * 1.5, i: "L", o: 40 }, { t: t0 + .5, v: op, i: 40 }]); span(L, t0, D); return L; }

  // ---- type
  function fit(L, maxW) { var w = L.sourceRectAtTime(0, false).width; if (w <= maxW) return L; var sp = L.property("Source Text"), td = sp.value; td.fontSize = td.fontSize * maxW / w; sp.setValue(td); return L; }
  // letters (or words) rise from under a water line: a mask hides everything below the baseline; an expression selector lifts each unit
  // with a cubic ease and a damped overshoot (the same curve as the tiles). starts: one start time per unit, or [t0, step]
  function riseExpr(starts, step) { return "var st = " + JSON.stringify(starts) + ", s;\n" +
    "if (st.length > 1 && " + (step ? "false" : "true") + ") s = time - st[Math.min(textIndex - 1, st.length - 1)]; else s = time - st[0] - (textIndex - 1) * " + (step || 0) + ";\n" +
    "var A = .16, T = .3, v; if (s <= 0) v = 0; else if (s < T) { var u = s / T; v = (1 - Math.pow(1 - u, 3)) * (1 + A); } else v = 1 + A * Math.exp(-7 * (s - T)) * Math.cos(16 * (s - T));\n" +
    "var a = (1 - v) * 100; [a, a, a]"; }
  function riser(comp, name, str, o) { var L = AESLib.text(comp, name, str, { family: o.family, style: o.style, size: o.size, color: o.color || C.warm, just: "center", tracking: o.tracking, pos: o.pos });
    if (o.maxW) fit(L, o.maxW);
    var an = L.property("ADBE Text Properties").property("ADBE Text Animators").addProperty("ADBE Text Animator");
    var tp = an.property("ADBE Text Animator Properties").addProperty("ADBE Text Position 3D"); tp.setValue([0, o.drop || 160, 0]);
    var sel = an.property("ADBE Text Selectors").addProperty("ADBE Text Expressible Selector");
    if (o.words) sel.property("ADBE Text Range Type2").setValue(3);
    sel.property("ADBE Text Expressible Amount").expression = riseExpr(o.starts, o.step);
    mask(L, rectShape(-900, -600, 900, o.line || 10), 0); if (o.t0 !== undefined) span(L, o.t0, o.t1); return L; }
  function shadowTwin(comp, L, name, blurR) { var S = L.duplicate(); S.name = name; S.moveAfter(L);
    var sp = S.property("Source Text"), td = sp.value; td.fillColor = C.shadow; sp.setValue(td); blur(S, blurR || 10);
    S.position.setValue([L.position.value[0] + 3, L.position.value[1] + 5]); S.opacity.setValue(70); return S; }
  function underline(comp, name, y, w, t0, t1) { var L = comp.layers.addShape(); L.name = name; L.anchorPoint.setValue([0, 0]); L.position.setValue([VW / 2, y]);
    var v = L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").property("ADBE Vectors Group");
    var r = v.addProperty("ADBE Vector Shape - Rect"); r.property("ADBE Vector Rect Size").setValue([w, 3]);
    v.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(C.warm);
    keys(L.scale, [{ t: t0, v: [0, 100], o: 20 }, { t: t0 + .45, v: [100, 100], i: 85 }]); span(L, t0, t1); return L; }
  // the small flat-shaded tile beside a subtitle: a hexagon top over a darker side band, its top colour following the time of day
  function tileIcon(comp, name, pos, T) { var L = comp.layers.addShape(); L.name = name; L.anchorPoint.setValue([0, 0]); L.position.setValue(pos);
    var root = L.property("ADBE Root Vectors Group"), r = 22, h = 12, pts = [], k;
    for (k = 0; k < 6; k++) { var a = Math.PI / 6 + k * Math.PI / 3; pts.push([r * Math.cos(a), r * .58 * Math.sin(a)]); }
    var gs = root.addProperty("ADBE Vector Group").property("ADBE Vectors Group"), s1 = new Shape();
    s1.vertices = [[pts[0][0], pts[0][1]], [pts[1][0], pts[1][1]], [pts[2][0], pts[2][1]], [pts[2][0], pts[2][1] + h], [pts[1][0], pts[1][1] + h], [pts[0][0], pts[0][1] + h]];
    s1.closed = true; gs.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(s1);
    var sf = gs.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color"); todKeys(sf, T, [C.grassSide, C.grassSide, C.apricotSide, C.lilacSide]);
    var gt = root.addProperty("ADBE Vector Group").property("ADBE Vectors Group"), s2 = new Shape(); s2.vertices = pts; s2.closed = true;
    gt.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(s2);
    var tf = gt.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color"); todKeys(tf, T, [C.grass, C.grass, C.apricot, C.lilac]);
    return L; }
  // subtitles: no box, warm white over a soft dark-blue shadow, centred low, a tile icon at the left; a short fade in and out
  function subtitle(comp, P, tag, str, t0, t1, T) { var y = 1690;
    var L = AESLib.text(comp, P + "_SUB_" + tag, str, { family: SUBF, style: SUBS, size: 50, color: C.warm, just: "center", pos: [VW / 2 + 26, y] }); fit(L, 900);
    var S = shadowTwin(comp, L, P + "_SUBSH_" + tag, 9), w = L.sourceRectAtTime(t0, false).width;
    var I = tileIcon(comp, P + "_SUBICON_" + tag, [VW / 2 + 26 - w / 2 - 44, y - 16], T);
    var all = [L, S, I]; for (var i = 0; i < all.length; i++) { span(all[i], t0, t1); keys(all[i].opacity, [{ t: t0, v: 0, o: "L" }, { t: t0 + .15, v: all[i] === S ? 70 : 100, i: "L", o: "H" }, { t: t1 - .15, v: all[i] === S ? 70 : 100, o: "L" }, { t: t1, v: 0, i: "L" }]); }
    keys(I.scale, [{ t: t0, v: [0, 0], o: 20 }, { t: t0 + .25, v: [118, 118], i: 60, o: 40 }, { t: t0 + .4, v: [100, 100], i: 60 }]);
    return all; }

  function buildScene(comp, scene, opts) { var P = opts.prefix || "LOWPOL", A = opts.assets || {}; AESLib.clearOwned(comp, P);
    var B = scene.beat, D = comp.duration, fps = comp.frameRate, notes = [], comps = [];
    var T = { title: B.title.t0, picture: B.picture.t0, input: B.input.t0, number: B.number.t0, line: B.line.t0, carry: B.carry.t0, end: B.end.t0 };
    var track = AESLib.readJSON(A.track);
    if (track.w !== comp.width || track.h !== comp.height) notes.push("track is " + track.w + "x" + track.h + ", comp " + comp.width + "x" + comp.height);

    // the world, bottom to top: sky, stars, the clip under the screen holdout, the plate, bloom, tilt-shift edges, the beam
    sky(comp, P, T); stars(comp, P, T, D);
    var CL = clip(comp, P, scene, track, D, fps); comps.push(CL.comp);
    var io = new ImportOptions(new File(A.plate)); io.sequence = true; io.forceAlphabetical = true;
    var plate = app.project.importFile(io); plate.mainSource.conformFrameRate = fps; try { plate.mainSource.alphaMode = AlphaMode.STRAIGHT; } catch (e) {}
    var PL = comp.layers.add(plate); PL.name = P + "_PLATE"; PL.startTime = 0;
    // bloom: a copy of the plate keeping only its brightest values (the lit windows, the lamps, the lantern), blurred, in Add, stronger at night
    // (a Glow adjustment over the whole comp washed the day sky to white and saturated the night: never use it here)
    var G = comp.layers.add(plate); G.name = P + "_BLOOM"; G.startTime = 0; G.blendingMode = BlendingMode.ADD;
    var glv = fx(G, "ADBE Easy Levels2"); glv.property("Input Black").setValue(0.62); blur(G, 34);
    todKeys(G.opacity, T, [0, 0, 35, 85]);
    var TS = adjust(comp, P + "_TILTSHIFT"); blur(TS, 7); mask(TS, rectShape(-50, 520, VW + 50, 1560), 340, true);
    var tl = track.lampOn; beam(comp, P, "BEAMHALO", track, tl, D, fps, 150, 22, 70); beam(comp, P, "BEAM", track, tl, D, fps, 46, 55, 18);
    var LG = softEllipse(comp, P + "_LAMPGLOW", C.lamp, 18, 50); LG.blendingMode = BlendingMode.ADD; span(LG, tl, D);
    var lts = [], lps = []; for (var f = Math.floor(tl * fps); f < track.lamp.length; f++) { lts.push(f / fps); lps.push(track.lamp[f]); } linKeys(LG.position, lts, lps);
    keys(LG.opacity, [{ t: tl, v: 0, o: "L" }, { t: tl + .1, v: 100, i: "L" }]);

    // ---- title: geometric caps in the sky band, letters rising from the water line, a thin rule and a small lowercase line
    var tc = riser(comp, P + "_TITLE2", B.title.context.toLowerCase(), { family: CAPF, style: CAPS, size: 56, tracking: 300, pos: [VW / 2, 300], maxW: 900, starts: [T.title + .05], step: .03, drop: 80, t0: 0, t1: T.picture });
    var th = riser(comp, P + "_TITLE1", B.title.hero.toUpperCase(), { family: CAPF, style: CAPS, size: 112, tracking: 140, pos: [VW / 2, 420], maxW: 990, starts: [T.title + .25], step: .03, t0: 0, t1: T.picture });
    var tr = underline(comp, P + "_TITLERULE", 470, 560, T.title + .5, T.picture);
    shadowTwin(comp, th, P + "_TITLE1SH", 12); shadowTwin(comp, tc, P + "_TITLE2SH", 8);

    // ---- subtitles where the beat carries no type of its own
    subtitle(comp, P, "PIC", "Three pieces build one picture.", T.picture + .05, T.input - .04, T);
    subtitle(comp, P, "IN", "Here's a real frame from my video.", T.input + .05, T.number - .04, T);
    subtitle(comp, P, "CARRY", "Then one thing becomes the next.", T.carry + .05, T.end - .04, T);

    // ---- number: the digits rise in the plate; the label rises letter by letter under them
    var lb = riser(comp, P + "_NUMLABEL", String(B.number.label).toUpperCase(), { family: CAPF, style: CAPS, size: 66, tracking: 520, pos: [VW / 2 + 16, 1352], maxW: 900, starts: [T.number + .75], step: .045, drop: 90, t0: T.number, t1: T.line });
    shadowTwin(comp, lb, P + "_NUMLABELSH", 9);

    // ---- line: typed by the voice, one word rising per spoken word, in the sky band while night falls and a window lights per word
    var wt = (track.lineWords || []).slice();      // the spoken word times, from the scene's words (tools/island.py lights a window on each)
    if (!wt.length) { var nw = B.line.text.split(" ").length; for (var q = 0; q < nw; q++) wt.push(T.line + .05 + q * (T.carry - T.line - .3) / nw); }
    var lw = B.line.text.split(" "), cut = Math.ceil(lw.length * .6), l1 = lw.slice(0, cut).join(" "), l2 = lw.slice(cut).join(" ");
    var ln1 = riser(comp, P + "_LINE1", l1, { family: SUBF, style: SUBS, size: 92, pos: [VW / 2, 330], maxW: 980, starts: wt.slice(0, cut), words: true, drop: 130, t0: T.line, t1: T.carry });
    var ln2 = riser(comp, P + "_LINE2", l2, { family: SUBF, style: SUBS, size: 92, pos: [VW / 2, 446], maxW: 980, starts: wt.slice(cut).length ? wt.slice(cut) : [wt[wt.length - 1]], words: true, drop: 130, t0: T.line, t1: T.carry });
    shadowTwin(comp, ln1, P + "_LINE1SH", 10); shadowTwin(comp, ln2, P + "_LINE2SH", 10);

    // ---- end: the last piece has landed and the lamp is on; the words rise into the night sky
    var e1 = riser(comp, P + "_END", B.end.text.toUpperCase(), { family: CAPF, style: CAPS, size: 100, tracking: 220, pos: [VW / 2, 360], maxW: 960, starts: [T.end + .2], step: .04, t0: T.end, t1: D });
    underline(comp, P + "_ENDRULE", 412, 520, T.end + .55, D); shadowTwin(comp, e1, P + "_ENDSH", 12);

    var total = comp.numLayers; for (var n = 0; n < comps.length; n++) total += comps[n].numLayers;
    notes.push(track.frames + " plate frames"); return { layers: total, notes: notes }; }

  return { buildScene: buildScene, sky: sky, stars: stars, clip: clip, beam: beam, riser: riser, subtitle: subtitle, tileIcon: tileIcon, underline: underline, PALETTE: C };
})();
