// Risograph style: brand-neutral ES3 helpers. No project mutation happens at load.
// Read styles/risograph/STYLE.md first. Every frame is drawn once, into an ART comp whose RGB channels are not colours but ink densities
// (R = plate 1, G = plate 2, B = plate 3; black = paper). Normal blending is a knockout, Add is an overprint. Each plate comp takes one channel
// (Shift Channels), subtracts its own halftone screen (a PNG fixed to the paper, tools/screen.mjs) and ink grain, cuts it with Levels and
// prints it in its ink with Tint; the plates multiply on warm paper in the main comp, each a few pixels off, kicking on the accents.
// Adapted from Lemo-Opuscar's risograph style (MIT, LemoLab); see assets/LICENSE-lemo-opuscar.txt.
var AESRiso = (function () {
  var TITLE = "Archivo Black", CAP = "Josefin Sans";
  function hex(h) { return [parseInt(h.substr(0, 2), 16) / 255, parseInt(h.substr(2, 2), 16) / 255, parseInt(h.substr(4, 2), 16) / 255]; }
  function c4(c) { return [c[0], c[1], c[2], 1]; }
  // default ink set: blue, fluorescent pink, yellow on warm paper. Override per brand (opts.palette), keeping one ink that carries a silhouette alone.
  var PALETTE = { paper: hex("F4EEE2"), inks: [hex("0078BF"), hex("FF48B0"), hex("FFE800")], names: ["BLUE", "PINK", "YELLOW"] };
  // densities in the ART comp: [plate 1, plate 2, plate 3]
  var ZERO = [0, 0, 0], B1 = [1, 0, 0], P1 = [0, 1, 0], Y1 = [0, 0, 1], BP = [1, 1, 0], BY = [1, 0, 1];
  var TWOS = "posterizeTime(12); value;";                       // figures and pieces on twos (12 fps); camera moves and plates on ones
  function fontOK() { AESLib.font(TITLE, "Regular"); AESLib.font(CAP, "SemiBold"); return true; }
  function rng(seed) { var s = seed; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function fx(L, match) { L.property("ADBE Effect Parade").addProperty(match); var EP = L.property("ADBE Effect Parade"); return EP.property(EP.numProperties); }
  function span(L, t0, t1) { L.inPoint = t0; L.outPoint = t1; return L; }       // in before out: setting inPoint after outPoint loses the out point

  // ---- keys: list = [{ t, v, o }], o = "L" (linear to the next key) or "H" (hold, the default). One setValuesAtTimes call.
  function keys(prop, list) { list.sort(function (a, b) { return a.t - b.t; }); var ts = [], vs = [], L = KeyframeInterpolationType.LINEAR, H = KeyframeInterpolationType.HOLD;
    for (var j = 0; j < list.length; j++) { ts.push(list[j].t); vs.push(list[j].v); } prop.setValuesAtTimes(ts, vs);
    for (var k = 0; k < list.length; k++) { var ki = prop.nearestKeyIndex(list[k].t), inT = H, outT = H;
      if (k > 0 && list[k - 1].o === "L") inT = L; if (list[k].o === "L") outT = L; prop.setInterpolationTypeAtKey(ki, inT, outT); }
    return prop; }

  // ---- vector pieces: { k: "poly", pts } | { k: "circle", x, y, r } | { k: "rect", x, y, w, h } | { k: "group", id, pivot, rot, kids }, each with
  // color (a density triplet). Later nodes draw on top.
  var KAPPA = .5523;
  function poly(pts) { var s = new Shape(); s.vertices = pts; s.closed = true; return s; }
  function circ(cx, cy, r) { var k = KAPPA * r, s = new Shape(); s.vertices = [[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy]];
    s.inTangents = [[-k, 0], [0, -k], [k, 0], [0, k]]; s.outTangents = [[k, 0], [0, k], [-k, 0], [0, -k]]; s.closed = true; return s; }
  function rectS(x0, y0, x1, y1) { return poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]); }
  function shapeOf(n) { if (n.k === "circle") return circ(n.x, n.y, n.r);           // plain ifs, never a chained conditional
    if (n.k === "rect") return rectS(n.x, n.y, n.x + n.w, n.y + n.h); return poly(n.pts); }
  function emit(contents, nodes) {
    for (var i = nodes.length - 1; i >= 0; i--) { var n = nodes[i], g = contents.addProperty("ADBE Vector Group"); if (n.id) g.name = n.id;
      var tg = g.property("ADBE Vector Transform Group");
      if (n.pivot) { tg.property("ADBE Vector Anchor").setValue(n.pivot); tg.property("ADBE Vector Position").setValue(n.pivot); }
      if (n.rot) tg.property("ADBE Vector Rotation").setValue(n.rot);
      var v = g.property("ADBE Vectors Group");
      if (n.k === "group") { emit(v, n.kids); continue; }
      v.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(shapeOf(n));
      v.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(n.color); } }
  function piece(comp, name, nodes, pos) { var L = comp.layers.addShape(); L.name = name; emit(L.property("ADBE Root Vectors Group"), nodes);
    L.anchorPoint.setValue([0, 0]); L.position.setValue(pos || [0, 0]); return L; }
  function groupT(L, path) { var g = L.property("ADBE Root Vectors Group");          // fetched fresh by its path of ids (handles go stale)
    for (var i = 0; i < path.length; i++) { g = g.property(path[i]); if (i < path.length - 1) g = g.property("ADBE Vectors Group"); }
    return g.property("ADBE Vector Transform Group"); }
  // the paper-white knockout halo: a copy of the layer under it, filled with zero ink and spread by px. Call it after the layer's keys are set.
  function halo(L, px, notes) { var H = L.duplicate(); H.name = L.name + "_HALO"; H.moveAfter(L); H.blendingMode = BlendingMode.NORMAL;
    try { fx(H, "ADBE Fill").property("Color").setValue([0, 0, 0, 1]); fx(H, "ADBE Simple Choker").property("Choke Matte").setValue(-px); } catch (e) { notes.push("halo: " + e.toString()); }
    return H; }
  // printed type: o = { family, style, size, color, pos, tracking, t0, t1, halo (px of paper around it), rot, add }. Anchored on its ink centre.
  function type(comp, name, str, o) { var L = AESLib.text(comp, name, str, { family: o.family || TITLE, style: o.style || "Regular", size: o.size, color: o.color || B1, tracking: o.tracking });
    var sp = L.property("Source Text"), td = sp.value;
    if (o.halo) { td.applyStroke = true; td.strokeColor = [0, 0, 0]; td.strokeWidth = 2 * o.halo; td.strokeOverFill = false; sp.setValue(td); }
    var r = L.sourceRectAtTime(0, false); L.anchorPoint.setValue([r.left + r.width / 2, r.top + r.height / 2]); L.position.setValue(o.pos);
    if (o.rot) L.rotation.setValue(o.rot); if (o.add) L.blendingMode = BlendingMode.ADD; if (o.t0 !== undefined) span(L, o.t0, o.t1); return L; }
  // a knockout strip (zero ink, small radius) for subtitles: its edges catch the plates' misregistration fringes
  function strip(comp, name, x, y, w, h, t0, t1) { var L = comp.layers.addShape(); L.name = name;
    var v = L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").property("ADBE Vectors Group"), r = v.addProperty("ADBE Vector Shape - Rect");
    r.property("ADBE Vector Rect Size").setValue([w, h]); r.property("ADBE Vector Rect Roundness").setValue(14);
    v.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(ZERO); L.position.setValue([x, y]); return span(L, t0, t1); }
  // ---- the world: stepped halftone sky, a disc, a horizon town, a ground with marks, a road
  function skyNodes(yEnd) { var b = [[0, 250, .16], [250, 500, .32], [500, 760, .52], [760, yEnd, 1]], n = [];
    for (var i = 0; i < b.length; i++) n.push({ k: "rect", x: -400, y: b[i][0], w: 1880, h: b[i][1] - b[i][0], color: [0, 0, b[i][2]] }); return n; }
  function townNodes(x0, x1, y, seed) { var R = rng(seed), n = [{ k: "rect", x: x0, y: y - 8, w: x1 - x0, h: 60, color: B1 }], x = x0;
    while (x < x1) { var w = 50 + R() * 110, h = 30 + R() * 90, roof = R();
      if (roof < .5) n.push({ k: "poly", pts: [[x, y], [x, y - h], [x + w / 2, y - h - w * .4], [x + w, y - h], [x + w, y]], color: B1 });
      else n.push({ k: "rect", x: x, y: y - h, w: w, h: h, color: B1 });
      if (R() < .12) n.push({ k: "poly", pts: [[x + w / 2 - 9, y - h], [x + w / 2, y - h - 150], [x + w / 2 + 9, y - h]], color: B1 });
      x += w + (R() < .25 ? 30 + R() * 50 : 0); }
    return n; }
  function groundNodes(x0, x1, y, seed) { var R = rng(seed), n = [{ k: "rect", x: x0, y: y, w: x1 - x0, h: 1920 - y, color: [.24, 0, 1] }];
    for (var r = 0; r < 9; r++) { var yy = y + 40 + r * 44, xx = x0 + R() * 120; while (xx < x1) { var w = 30 + R() * 110; n.push({ k: "rect", x: xx, y: yy, w: w, h: 7, color: BY }); xx += w + 60 + R() * 200; } }
    n.push({ k: "rect", x: x0, y: 1680, w: x1 - x0, h: 240, color: [1, .28, 0] });
    for (var d = x0 + 20; d < x1; d += 160) n.push({ k: "rect", x: d, y: 1770, w: 80, h: 10, color: BP });
    return n; }
  // ---- a small figure in profile, feet at the layer origin, about 300 px tall at scale 100: legs and arms swing on twos, a pink scarf
  function figureNodes() {
    function leg(id, dx) { return { k: "group", id: id, pivot: [dx, -122], kids: [{ k: "rect", x: dx - 11, y: -124, w: 22, h: 118, color: B1 }, { k: "rect", x: dx - 11, y: -12, w: 36, h: 12, color: B1 }] }; }
    function arm(id) { return { k: "group", id: id, pivot: [0, -222], kids: [{ k: "rect", x: -8, y: -226, w: 16, h: 100, color: B1 }] }; }
    return [arm("AB"), leg("LB", -4), leg("LF", 4), { k: "poly", pts: [[-28, -242], [28, -242], [34, -116], [-34, -116]], color: B1 },
      { k: "group", id: "SC", pivot: [0, -244], kids: [{ k: "poly", pts: [[6, -250], [-8, -248], [-72, -236], [-66, -224], [-8, -236]], color: P1 }] },
      { k: "rect", x: -8, y: -252, w: 16, h: 14, color: B1 }, { k: "circle", x: 2, y: -274, r: 25, color: B1 }, arm("AF")]; }
  // o = { x0, x1, y, t0, t1, tm0, tm1 (the walk), scale, facing }; the limbs stop when the walk does
  function figure(comp, name, o, notes) { var s = o.scale || 100, f = o.facing || 1, L = piece(comp, name, figureNodes()); span(L, o.t0, o.t1);
    L.position.setValue([o.x0, o.y]); L.scale.setValue([s * f, s]);
    var walk = o.x1 !== undefined; if (walk) keys(L.position, [{ t: o.tm0, v: [o.x0, o.y], o: "L" }, { t: o.tm1, v: [o.x1, o.y] }]);
    var clk = "posterizeTime(12); var a = " + (walk ? "(time > " + o.tm0 + " && time < " + o.tm1 + ") ? 1 : 0" : "0") + "; var p = 2 * Math.PI * 1.6 * time; ";
    var ex = [[["LB"], "24 * a * Math.sin(p)"], [["LF"], "-24 * a * Math.sin(p)"], [["AB"], "-20 * a * Math.sin(p)"], [["AF"], "20 * a * Math.sin(p)"], [["SC"], "-4 + 5 * Math.sin(2 * p)"]];
    for (var i = 0; i < ex.length; i++) groupT(L, ex[i][0]).property("ADBE Vector Rotation").expression = clk + ex[i][1] + ";";
    L.position.expression = clk + "value - [0, 5 * a * Math.abs(Math.sin(p))];";
    halo(L, 5, notes); return L; }
  function bustNodes() { return [{ k: "poly", pts: [[-210, 0], [-205, -230], [-150, -320], [-60, -350], [60, -350], [150, -320], [205, -230], [210, 0]], color: B1 },
    { k: "rect", x: -36, y: -410, w: 72, h: 70, color: B1 }, { k: "circle", x: 0, y: -480, r: 92, color: B1 }]; }
  function docNodes() { var n = [{ k: "rect", x: -150, y: -190, w: 300, h: 380, color: P1 }, { k: "rect", x: -110, y: -150, w: 140, h: 34, color: ZERO }];
    for (var r = 0; r < 6; r++) n.push({ k: "rect", x: -110, y: -86 + 40 * r, w: r === 5 ? 120 : 220, h: 14, color: ZERO }); return n; }
  function laptopNodes() { return [{ k: "rect", x: -190, y: -310, w: 380, h: 280, color: B1 }, { k: "rect", x: -164, y: -284, w: 328, h: 228, color: [0, .3, 0] },
    { k: "rect", x: -130, y: -250, w: 150, h: 22, color: B1 }, { k: "rect", x: -130, y: -210, w: 230, h: 12, color: B1 }, { k: "rect", x: -130, y: -184, w: 190, h: 12, color: B1 },
    { k: "poly", pts: [[-240, 0], [240, 0], [205, -36], [-205, -36]], color: B1 }]; }

  // ---- the print: one plate comp per ink (its channel of ART, minus its screen and grain, cut by Levels, printed by Tint), multiplied on paper
  function noise(comp, name, o, notes) { var k = o.fine || 1, L = comp.layers.addSolid([0, 0, 0], name, Math.round(comp.width * k), Math.round(comp.height * k), 1), f = fx(L, "ADBE Fractal Noise");
    if (k !== 1) L.scale.setValue([100 / k, 100 / k]);   // Fractal Noise stops at scale 10: render it larger and shrink the layer for a finer grain
    try { f.property("Contrast").setValue(o.contrast); f.property("Brightness").setValue(o.brightness); f.property("Complexity").setValue(o.complexity || 1);
      if (o.sw) { f.property("Uniform Scaling").setValue(0); f = L.property("ADBE Effect Parade").property(1); f.property("Scale Width").setValue(o.sw); f.property("Scale Height").setValue(o.sh); }
      else f.property("Scale").setValue(o.scale);
      f.property("Random Seed").setValue(o.seed); if (o.boil) f.property("Evolution").expression = "posterizeTime(" + o.boil + "); time * 777;"; } catch (e) { notes.push(name + ": " + e.toString()); }
    L.blendingMode = BlendingMode.SUBTRACT; L.opacity.setValue(o.op); return L; }
  function plates(comp, P, A, PAL, notes) { var W = comp.width, H = comp.height, D = comp.duration, fps = comp.frameRate, out = [];
    var ART = app.project.items.addComp(P + "_ART", W, H, 1, D, fps); ART.bgColor = [0, 0, 0]; ART.layers.addSolid([0, 0, 0], P + "_A_ZERO", W, H, 1);
    for (var i = 0; i < 3; i++) { var PL = app.project.items.addComp(P + "_PLATE" + (i + 1) + "_" + PAL.names[i], W, H, 1, D, fps); PL.bgColor = [0, 0, 0];
      PL.layers.addSolid([0, 0, 0], P + "_P" + i + "_ZERO", W, H, 1);
      var a = PL.layers.add(ART); a.name = P + "_P" + i + "_DENSITY"; var sc = fx(a, "ADBE Shift Channels");
      try { sc.property("Take Red From").setValue(i + 2); sc.property("Take Green From").setValue(i + 2); sc.property("Take Blue From").setValue(i + 2); } catch (e) { notes.push("shift channels: " + e.toString()); }
      var s = PL.layers.add(AESLib.importFile(A["screen" + (i + 1)])); s.name = P + "_P" + i + "_SCREEN"; s.blendingMode = BlendingMode.SUBTRACT;
      noise(PL, P + "_P" + i + "_BLOT", { contrast: 110, brightness: -10, scale: 450, complexity: 3, seed: 11 + i, op: 10 }, notes);
      noise(PL, P + "_P" + i + "_STREAK", { contrast: 150, brightness: -10, sw: 4, sh: 1400, seed: 21 + i, op: 8 }, notes);
      noise(PL, P + "_P" + i + "_GRAIN", { contrast: 220, brightness: -20, scale: 10, fine: 2.5, seed: 31 + i, op: 16 }, notes);
      noise(PL, P + "_P" + i + "_BOIL", { contrast: 220, brightness: -20, scale: 10, fine: 2.5, seed: 41 + i, op: 9, boil: 8 }, notes);
      noise(PL, P + "_P" + i + "_PINHOLES", { contrast: 700, brightness: -300, scale: 10, fine: 2, seed: 51 + i, op: 100, boil: 8 }, notes);
      var adj = PL.layers.addSolid([1, 1, 1], P + "_P" + i + "_PRINT", W, H, 1); adj.adjustmentLayer = true;
      var lv = fx(adj, "ADBE Easy Levels2"); try { lv.property("Input Black").setValue(0); lv.property("Input White").setValue(.06); } catch (e2) { notes.push("levels: " + e2.toString()); }
      var tn = fx(adj, "ADBE Tint"); tn.property("Map Black To").setValue([1, 1, 1, 1]); tn.property("Map White To").setValue(c4(PAL.inks[i]));
      var L = comp.layers.add(PL); L.name = P + "_INK" + (i + 1) + "_" + PAL.names[i]; L.blendingMode = BlendingMode.MULTIPLY; out.push(L); }
    return { art: ART, plates: out }; }
  // misregistration: a fixed offset per shot (beats[k] = { t, reg: [[dx, dy] x 3] }), kicks that ring out in a quarter second, drifts that snap back
  function register(plates, beats, kicks, drifts, W, H) {
    for (var i = 0; i < plates.length; i++) { var list = [];
      var regAt = function (t) { var r = beats[0].reg[i]; for (var b = 0; b < beats.length; b++) if (beats[b].t <= t + 1e-4) r = beats[b].reg[i]; return r; };
      var at = function (t) { for (var q = 0; q < list.length; q++) if (Math.abs(list[q].t - t) < 1e-3) return q; return -1; };
      for (var b = 0; b < beats.length; b++) list.push({ t: beats[b].t, v: [W / 2 + beats[b].reg[i][0], H / 2 + beats[b].reg[i][1]], o: "H" });
      for (var d = 0; d < drifts.length; d++) { var r0 = regAt(drifts[d].t0), q0 = at(drifts[d].t0); if (q0 >= 0) list[q0].o = "L"; else list.push({ t: drifts[d].t0, v: [W / 2 + r0[0], H / 2 + r0[1]], o: "L" });
        list.push({ t: drifts[d].t1, v: [W / 2 + r0[0] + drifts[d].by[i][0], H / 2 + r0[1] + drifts[d].by[i][1]], o: "H" }); }
      for (var k = 0; k < kicks.length; k++) { var K = kicks[k].by[i], rr = regAt(kicks[k].t), ring = [1, -.45, .2, -.08, 0], dt = [0, .05, .1, .17, .27];
        for (var n = 0; n < ring.length; n++) { var t = kicks[k].t + dt[n], v = [W / 2 + rr[0] + K[0] * ring[n], H / 2 + rr[1] + K[1] * ring[n]], q = at(t);
          if (q >= 0) { list[q].v = v; list[q].o = n < ring.length - 1 ? "L" : "H"; } else list.push({ t: t, v: v, o: n < ring.length - 1 ? "L" : "H" }); } }
      keys(plates[i].position, list); } }
  // a plate that rolls in (its lower edge sweeps down the sheet, the feed direction) or lifts off (its upper edge sweeps down): o = { in: [t0, t1], out: [t0, t1] }
  function gate(L, o) { var W = L.source.width, H = L.source.height, m = L.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"), list = [];
    m.property("ADBE Mask Feather").setValue([0, 8]);
    if (o["in"]) { list.push({ t: o["in"][0], v: rectS(-40, -40, W + 40, -40), o: "L" }); list.push({ t: o["in"][1], v: rectS(-40, -40, W + 40, H + 40), o: "H" }); }
    if (o.out) { list.push({ t: o.out[0], v: rectS(-40, -40, W + 40, H + 40), o: "L" }); list.push({ t: o.out[1], v: rectS(-40, H + 40, W + 40, H + 40), o: "H" }); }
    keys(L.property("ADBE Mask Parade").property(1).property("ADBE Mask Shape"), list); return L; }
  // the sheet: mottling and fibre over the whole print
  function paperTexture(comp, P, notes) { var W = comp.width, H = comp.height;
    var M = comp.layers.addSolid([.5, .5, .5], P + "_MOTTLE", W, H, 1), fm = fx(M, "ADBE Fractal Noise");
    fm.property("Contrast").setValue(120); fm.property("Complexity").setValue(6); fm.property("Scale").setValue(380); M.blendingMode = BlendingMode.OVERLAY; M.opacity.setValue(12);
    var F = comp.layers.addSolid([.5, .5, .5], P + "_FIBRE", W, H, 1), ff = fx(F, "ADBE Fractal Noise");
    try { ff.property("Contrast").setValue(160); ff.property("Uniform Scaling").setValue(0); ff = F.property("ADBE Effect Parade").property(1);
      ff.property("Scale Width").setValue(24); ff.property("Scale Height").setValue(700); ff.property("Complexity").setValue(3); ff.property("Rotation").setValue(3); } catch (e) { notes.push("fibre: " + e.toString()); }
    F.blendingMode = BlendingMode.SOFT_LIGHT; F.opacity.setValue(9); return [M, F]; }
  function wordsIn(list, t0, t1) { var r = []; for (var i = 0; i < list.length; i++) if (list[i].s >= t0 - .05 && list[i].s < t1) r.push(list[i]); return r; }
  function clearOwned(comp, prefix) { AESLib.clearOwned(comp, prefix); }

  // buildScene: the shared test scene (the library's seven-beat test scene) as a riso print. comp = an empty 1080 x 1920 comp at scene.fps.
  // Plates as narrative: the title opens in one ink and the other two roll in on the voice; the real frame is separated into blue and pink;
  // the number overprints the hill; the line is a lateral track with a registration drift that snaps on the downbeat; the photo becomes a
  // pink disc that overprints the frame and shrinks into the sun; the end lifts two plates away and leaves the last line in one ink.
  function buildScene(comp, scene, opts) {
    fontOK(); var P = opts.prefix || "RISO", PAL = opts.palette || PALETTE, A = opts.assets, B = scene.beat, W = comp.width, H = comp.height, notes = [], WL = scene.wordList;
    clearOwned(comp, P);
    comp.layers.addSolid(PAL.paper, P + "_PAPER", W, H, 1);
    var pr = plates(comp, P, A, PAL, notes), ART = pr.art, K = P + "_A";      // ART layer names carry the prefix too
    function S(name, nodes, t0, t1, o) { o = o || {}; var L = piece(ART, K + "_" + name, nodes, o.pos); span(L, t0, t1); if (o.add) L.blendingMode = BlendingMode.ADD; return L; }
    function T(name, str, o) { return type(ART, K + "_" + name, str, o); }
    var HZ = 1215;                                                                // the horizon of every outdoor shot

    // 1. title: the frame opens in one ink (blue carries it alone), pink rolls in on "starts", yellow on "same". A small figure walks along the
    // horizon with its head against the sun.
    var T0 = B.title.t0, T1 = B.title.t1, tw = wordsIn(WL, T0, T1);
    var sky1 = skyNodes(HZ); sky1.push({ k: "circle", x: 540, y: 1000, r: 300, color: P1 });
    S("SKY1", sky1, T0, T1); S("TOWN1", townNodes(-60, 1140, HZ, 5), T0, T1); S("GROUND1", groundNodes(-60, 1140, HZ + 40, 7), T0, T1);
    figure(ART, K + "_FIG1", { x0: 380, x1: 520, y: HZ + 2, t0: T0, t1: T1, tm0: T0, tm1: T1, scale: 100 }, notes);
    T("CTX", B.title.context.toUpperCase(), { family: CAP, style: "SemiBold", size: 58, tracking: 380, pos: [W / 2, 250], halo: 6, t0: tw[0].s, t1: T1 });
    var hero = B.title.hero.toUpperCase().split(" ");                              // STARTS THE / SAME WAY
    T("HERO1", hero[0] + " " + hero[1], { size: 132, color: BP, pos: [W / 2, 440], halo: 10, t0: tw[2].s, t1: T1 });
    T("HERO2", hero.slice(2).join(" "), { size: 132, color: BP, pos: [W / 2, 590], halo: 10, t0: tw[4].s, t1: T1 });

    // 2. picture: three pieces land on "Three", "pieces", "build", one ink each; the document overprints the yellow desk (a third colour)
    var P0 = B.picture.t0, P1t = B.picture.t1, pw = wordsIn(WL, P0, P1t);
    S("WALL2", [{ k: "rect", x: -40, y: -40, w: W + 80, h: 1260, color: [.18, 0, 0] }, { k: "circle", x: 340, y: 760, r: 280, color: P1 }], P0, P1t);
    var bust = S("PERSON", bustNodes(), pw[0].s, P1t, { pos: [340, 1200] }); AESLib.ease(bust.position, [pw[0].s, pw[0].s + .24], [[-300, 1200], [340, 1200]], "settle"); bust.position.expression = TWOS; halo(bust, 7, notes);
    S("DESK2", [{ k: "rect", x: -40, y: 1180, w: W + 80, h: 800, color: Y1 }, { k: "rect", x: -40, y: 1180, w: W + 80, h: 14, color: B1 }], P0, P1t);
    var doc = S("DOC", docNodes(), pw[1].s, P1t, { pos: [330, 1520], add: true }); doc.rotation.setValue(-8);
    AESLib.ease(doc.position, [pw[1].s, pw[1].s + .24], [[1400, 1380], [330, 1520]], "settle"); AESLib.ease(doc.rotation, [pw[1].s, pw[1].s + .24], [16, -8], "settle");
    doc.position.expression = TWOS; doc.rotation.expression = TWOS;
    var lap = S("DEVICE", laptopNodes(), pw[2].s, P1t, { pos: [720, 1720] }); AESLib.ease(lap.position, [pw[2].s, pw[2].s + .24], [[720, 2400], [720, 1720]], "settle"); lap.position.expression = TWOS; halo(lap, 7, notes);
    T("ONEPIC", "ONE PICTURE", { size: 130, color: B1, pos: [W / 2, 330], halo: 9, t0: pw[3].s, t1: P1t });

    // 3. input: the real frame, separated into a blue plate (shadows) and a pink tint (skin), in a knockout window on a yellow field
    var I0 = B.input.t0, I1 = B.input.t1, iw = wordsIn(WL, I0, I1);
    S("FIELD3", [{ k: "rect", x: -40, y: -40, w: W + 80, h: H + 80, color: Y1 }, { k: "rect", x: 540 - 452, y: 880 - 452, w: 904, h: 904, color: ZERO }], I0, I1);
    var ph = ART.layers.add(AESLib.importFile(A.photo)); ph.name = K + "_PHOTO"; span(ph, I0, I1); ph.position.setValue([540, 880]);
    AESLib.ease(ph.scale, [I0, I1], [[100, 100], [104, 104]], "linear");
    T("REAL", "A REAL FRAME", { size: 120, color: B1, pos: [W / 2, 270], halo: 9, t0: iw[2].s, t1: I1 });
    strip(ART, K + "_STRIP3", W / 2, 1560, 760, 120, iw[4].s, I1);
    T("VIDEO", "FROM MY VIDEO", { family: CAP, style: "SemiBold", size: 56, tracking: 300, color: B1, pos: [W / 2, 1562], t0: iw[4].s, t1: I1 });

    // 4. number: a blue hill under a yellow sky; the count is printed in pink over both, so it is orange in the sky and violet on the hill
    var N0 = B.number.t0, N1 = B.number.t1, nw = wordsIn(WL, N0, N1), val = B.number.value, hillR = 900, hillY = 2250;
    S("SKY4", skyNodes(1960).concat([{ k: "circle", x: 540, y: hillY, r: hillR, color: B1 }]), N0, N1);
    var fx4 = 820; figure(ART, K + "_FIG4", { x0: fx4, y: hillY - Math.sqrt(hillR * hillR - (fx4 - 540) * (fx4 - 540)) + 4, t0: N0, t1: N1, scale: 80, facing: -1 }, notes);
    var num = T("NUM", String(val), { size: 520, color: P1, pos: [W / 2, 1290], t0: N0, t1: N1, add: true });
    var counts = [], nf = 11; for (var c = 0; c <= nf; c++) { var e = 1 - Math.pow(1 - c / nf, 3); counts.push(String(Math.round(val * e))); }
    AESLib.bakeText(num, counts, 12, N0);
    T("FRAMES", B.number.label.toUpperCase(), { family: CAP, style: "SemiBold", size: 72, tracking: 420, color: ZERO, pos: [W / 2, 1710], t0: nw[1].s, t1: N1 });
    T("COUNTED", "COUNTED.", { size: 140, color: BP, pos: [W / 2, 520], rot: -7, halo: 10, t0: nw[2].s, t1: N1 });

    // 5. line: a wide lateral track (camera on ones), the figure walking on twos, the spoken words typed on a knockout strip
    var L0 = B.line.t0, L1 = B.line.t1, lw = wordsIn(WL, L0, L1);
    S("SKY5", skyNodes(HZ), L0, L1);
    var cam = ART.layers.addNull(); cam.name = K + "_CAM5"; span(cam, L0, L1); keys(cam.position, [{ t: L0, v: [0, 0], o: "L" }, { t: L1, v: [-520, 0] }]);
    var w5 = [S("SUN5", [{ k: "circle", x: 980, y: 1050, r: 210, color: P1 }], L0, L1), S("TOWN5", townNodes(-60, 1760, HZ, 9), L0, L1), S("GROUND5", groundNodes(-60, 1760, HZ + 40, 13), L0, L1)];
    for (var q = 0; q < w5.length; q++) w5[q].parent = cam;
    figure(ART, K + "_FIG5", { x0: 300, x1: 470, y: HZ + 2, t0: L0, t1: L1, tm0: L0, tm1: L1, scale: 100 }, notes);
    strip(ART, K + "_STRIP5", W / 2, 1520, 940, 130, L0, L1);
    var line = T("LINE", B.line.text, { family: CAP, style: "SemiBold", size: 54, tracking: 40, color: B1, pos: [W / 2, 1522], t0: L0, t1: L1 });
    var fps = comp.frameRate, strs = [], nl = Math.round((L1 - L0) * fps);
    for (var g = 0; g <= nl; g++) { var t = L0 + g / fps, sl = ""; for (var k = 0; k < lw.length; k++) if (t >= lw[k].s) sl += (sl ? " " : "") + lw[k].text; strs.push(sl); }
    AESLib.bakeText(line, strs, fps, L0);

    // 6 and 7. carry and end: the photo comes back as a disc; a pink disc grows out of it and overprints the whole frame; under the pink the
    // world cuts to the end card on "becomes", and the disc shrinks into the end card's sun (pink over yellow: orange, the full overprint).
    var C0 = B.carry.t0, C1 = B.carry.t1, cw = wordsIn(WL, C0, C1), E0 = B.end.t0, E1 = B.end.t1, ew = wordsIn(WL, E0, E1), cut = cw[3].s, D = comp.duration;
    S("SKY7", skyNodes(HZ), cut, D);
    S("FIELD6", [{ k: "rect", x: -40, y: -40, w: W + 80, h: H + 80, color: Y1 }, { k: "circle", x: 540, y: 900, r: 352, color: ZERO }], C0, cut);
    var ph6 = ART.layers.add(AESLib.importFile(A.photo)); ph6.name = K + "_PHOTO6"; span(ph6, C0, cut); ph6.position.setValue([540, 900]); ph6.scale.setValue([104, 104]);
    var pm = ph6.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"); pm.property("ADBE Mask Shape").setValue(circ(430, 430, 318));
    var disc = S("DISC", [{ k: "circle", x: 0, y: 0, r: 1000, color: P1 }], cw[1].s, D, { pos: [540, 900], add: true });
    AESLib.ease(disc.scale, [cw[1].s, cw[1].s + .32], [[33, 33], [135, 135]], "settle");
    AESLib.ease(disc.scale, [cw[4].s, C1], [[135, 135], [30, 30]], "travel"); AESLib.ease(disc.position, [cw[4].s, C1], [[540, 900], [540, 1000]], "travel");
    S("TOWN7", townNodes(-60, 1140, HZ, 17), cut, D); S("GROUND7", groundNodes(-60, 1140, HZ + 40, 19), cut, D);
    strip(ART, K + "_STRIP6", W / 2, 1600, 860, 120, C0, C1);
    T("THEN", "THEN ONE THING", { family: CAP, style: "SemiBold", size: 54, tracking: 300, color: B1, pos: [W / 2, 1602], t0: C0, t1: cut });
    T("NEXT", "BECOMES THE NEXT", { family: CAP, style: "SemiBold", size: 54, tracking: 300, color: B1, pos: [W / 2, 1602], t0: cut, t1: C1 });
    figure(ART, K + "_FIG7", { x0: 150, x1: 470, y: HZ + 2, t0: E0, t1: E1, tm0: E0 + .1, tm1: E0 + 1.05, scale: 100 }, notes);
    T("END1", "THAT'S", { size: 168, color: BP, pos: [W / 2, 400], halo: 11, t0: ew[0].s, t1: E1 });
    T("END2", "THE TEST.", { size: 168, color: BP, pos: [W / 2, 580], halo: 11, t0: ew[1].s, t1: E1 });

    // the print: per-shot registration, kicks on the accents, the drift through the typed line, plates rolling in and lifting off
    var R = function (a, b, c) { return { reg: [a, b, c] }; }, beats = [], regs = [R([0, 0], [3, -2], [-2, 3]), R([-1, 1], [-3, 2], [2, -2]), R([1, 0], [2, 3], [-3, -1]),
      R([0, -1], [-2, -3], [3, 2]), R([1, 1], [3, -1], [-2, -2]), R([0, 0], [-3, 2], [2, 3]), R([-1, 0], [3, 2], [-2, -3])];
    for (var bi = 0; bi < scene.beats.length; bi++) { regs[bi].t = scene.beats[bi].t0; beats.push(regs[bi]); }
    var KB = [[-3, 4], [11, -7], [-9, -10]], kicks = [{ t: tw[2].s, by: KB }, { t: pw[3].s, by: KB }, { t: nw[2].s, by: [[4, -3], [-12, 8], [10, 9]] }, { t: C0, by: KB },
      { t: cut, by: [[3, 3], [-10, -6], [8, -9]] }, { t: ew[2].s, by: [[-4, 3], [12, 6], [-8, 10]] }];
    register(pr.plates, beats, kicks, [{ t0: L0, t1: L1 - .03, by: [[0, 0], [22, -8], [-14, 12]] }], W, H);
    gate(pr.plates[1], { "in": [tw[2].s - .04, tw[2].s + .18], out: [10.3, 10.52] });
    gate(pr.plates[2], { "in": [tw[4].s - .02, tw[4].s + .18], out: [10.0, 10.22] });
    paperTexture(comp, P, notes);
    return { layers: comp.numLayers + ART.numLayers, notes: notes };
  }
  return { TITLE: TITLE, CAP: CAP, PALETTE: PALETTE, TWOS: TWOS, ZERO: ZERO, fontOK: fontOK, keys: keys, piece: piece, groupT: groupT, halo: halo, type: type,
    strip: strip, skyNodes: skyNodes, townNodes: townNodes, groundNodes: groundNodes, figure: figure, figureNodes: figureNodes, plates: plates, register: register,
    gate: gate, paperTexture: paperTexture, wordsIn: wordsIn, clearOwned: clearOwned, buildScene: buildScene };
})();
