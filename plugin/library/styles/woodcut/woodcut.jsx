// Woodcut print style: brand-neutral ES3 helpers. No project mutation happens at load.
// Read styles/woodcut/STYLE.md first. A relief print that carves itself: a TONE drawing (0 = uncut black wood, 1 = cut away to paper) is
// carved by one knife pass (a soft line screen added in Linear Light, roughened, then Threshold), so cut width follows tone and brights
// carve first. The carved plate prints in ink on laid paper inside a ragged block edge, captions are letterpress in the margin, and one
// copper plate (Darken) shows only where wood was cut away.
// Adapted from Lemo-Opuscar's woodcut style (MIT, LemoLab); see assets/LICENSE-lemo-opuscar.txt.
var AESWoodcut = (function () {
  var SC = "IM FELL English SC", FELL = "IM FELL English";
  var PALETTE = { ink: [.09, .075, .06], paper: [.937, .902, .824], copper: [.76, .35, .17], woodInked: [.141, .102, .071], woodPale: [.725, .541, .357],
    woodSide: [.47, .33, .2], table: [.122, .086, .063] };
  var PLATE = { x: 64, y: 150, w: 952, h: 1380 };                    // the block on the sheet; the wider bottom margin holds the captions
  var SPACING = 15;                                                   // the line screen's period in px (V-gouge cuts up to about 8 px wide)
  var TWOS = "posterizeTime(12); ";
  function fontOK() { AESLib.font(SC, "Regular"); AESLib.font(FELL, "Regular"); AESLib.font(FELL, "Italic"); return true; }

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
  // Tone is the carving instruction: 0 is uncut wood, 1 is cut clean away, between is hatched (wider cuts where brighter).
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
      if (n.sw) { var st = v.addProperty("ADBE Vector Graphic - Stroke"); st.property("ADBE Vector Stroke Color").setValue(col(n.sc === undefined ? 1 : n.sc));
        st.property("ADBE Vector Stroke Width").setValue(n.sw); st.property("ADBE Vector Stroke Line Join").setValue(2); st.property("ADBE Vector Stroke Line Cap").setValue(2); }
      if (n.fill !== undefined && n.fill !== null && n.k !== "line") v.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(col(n.fill)); } }
  function piece(comp, name, nodes, pos) { var L = comp.layers.addShape(); L.name = name; emit(L.property("ADBE Root Vectors Group"), nodes);
    L.anchorPoint.setValue([0, 0]); L.position.setValue(pos || [0, 0]); return L; }
  function groupT(L, path) { var gr = L.property("ADBE Root Vectors Group");
    for (var i = 0; i < path.length; i++) { gr = gr.property(path[i]); if (i < path.length - 1) gr = gr.property("ADBE Vectors Group"); }
    return gr.property("ADBE Vector Transform Group"); }
  // a tonal gradient (a solid with a linear Ramp): far = dark and dense, near the light = wide cuts
  function ramp(comp, name, p0, t0, p1, t1) { var L = solid(comp, name, [0, 0, 0]); var r = fx(L, "ADBE Ramp");
    r.property("Start of Ramp").setValue(p0); r.property("Start Color").setValue(g(t0)); r.property("End of Ramp").setValue(p1); r.property("End Color").setValue(g(t1)); return L; }
  // the carve reveal: nothing fades in; a feathered wipe lets the cuts grow along a direction (angle 180 = top to bottom)
  function carveIn(L, t0, dur, angle, feather) { var w = fx(L, "ADBE Linear Wipe"); w.property("Wipe Angle").setValue(angle === undefined ? 180 : angle);
    w.property("Feather").setValue(feather || 80); keys(w.property("Transition Completion"), [{ t: t0, v: 100, o: 30 }, { t: t0 + dur, v: 0, i: 70 }]); return L; }
  // stab cuts: small white flecks (snow, chips, sparks) at fixed seeded places
  function flecks(n, x0, y0, x1, y1, seed, rmin, rmax) { var out = [], s = seed;
    function rnd() { s = (s * 16807) % 2147483647; return s / 2147483647; }
    for (var i = 0; i < n; i++) { var r = rmin + rnd() * (rmax - rmin); out.push({ k: "ellipse", x: x0 + rnd() * (x1 - x0), y: y0 + rnd() * (y1 - y0), rx: r, ry: r * (.6 + rnd() * .5), fill: 1 }); }
    return out; }

  // ---- type: left-justified layers placed by the full string's ink box, so a line carved word by word never jumps
  function words(comp, name, full, o) { var L = AESLib.text(comp, name, full, { family: o.family, style: o.style, size: o.size, color: o.color || [1, 1, 1], just: "left", tracking: o.tracking });
    var r = L.sourceRectAtTime(0, false); L.anchorPoint.setValue([r.left + r.width / 2, r.top + r.height / 2]); L.position.setValue([o.x, o.y]);
    if (o.maxW && r.width > o.maxW) { var s = 100 * o.maxW / r.width; L.scale.setValue([s, s]); }
    if (o.keys) AESLib.textKeys(L, o.keys.t, o.keys.s);
    span(L, o.t0, o.t1); return { layer: L, rect: r }; }
  // ink width of a string in a given face (a fresh probe layer per measurement: a re-used probe returns stale rects)
  function inkWidth(comp, str, o) { var L = AESLib.text(comp, "PROBE", str, { family: o.family, style: o.style, size: o.size, color: [1, 1, 1], just: "left", tracking: o.tracking });
    var w = L.sourceRectAtTime(0, false).width; L.remove(); return w; }
  function wordsIn(list, t0, t1) { var r = []; for (var i = 0; i < list.length; i++) if (list[i].s >= t0 - .05 && list[i].s < t1) r.push(list[i]); return r; }
  function build(str, ons, t0) { var w = str.split(" "), t = [t0], s = [" "];
    for (var i = 0; i < w.length; i++) { var at = ons[Math.min(i, ons.length - 1)]; if (at <= t0 + .001) { s[0] = w.slice(0, i + 1).join(" "); continue; } t.push(at); s.push(w.slice(0, i + 1).join(" ")); }
    return { t: t, s: s }; }

  // ---- the carve pass: CARVE = the tone drawing + a soft line screen (Linear Light, 40%) + chip noise (Linear Light, 8%), then Threshold.
  // Where tone + screen crosses 0.5 the wood is cut: tone 0 never cuts, tone 1 always does, between the cut width grows with brightness.
  // The screen is roughened (Turbulent Displace) and bent by the drawing's own tone (Displacement Map), so cuts wobble and follow form.
  function screenComp(P, D, fps) { var S = 2000, C = app.project.items.addComp(P + "_SCREEN", S, S, 1, D, fps); C.bgColor = [0, 0, 0];
    solid(C, P + "_SCREENBG", [0, 0, 0]);
    var L = C.layers.addShape(); L.name = P + "_LINES"; L.anchorPoint.setValue([0, 0]); L.position.setValue([S / 2, S / 2]);
    var gr = L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group"), v = gr.property("ADBE Vectors Group");
    var rc = v.addProperty("ADBE Vector Shape - Rect"); rc.property("ADBE Vector Rect Size").setValue([S + 400, SPACING / 2]); rc.property("ADBE Vector Rect Position").setValue([0, -S / 2 - 40]);
    v.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue([1, 1, 1]);
    var rp = v.addProperty("ADBE Vector Filter - Repeater"); rp.property("ADBE Vector Repeater Copies").setValue(Math.ceil((S + 80) / SPACING) + 2);
    rp.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([0, SPACING]);
    fx(L, "ADBE Gaussian Blur 2").property("Blurriness").setValue(SPACING * .32);
    return C; }
  function carvePass(CV, P, DR, SCR, angles, notes) { var W = CV.width, H = CV.height;
    var DL = CV.layers.add(DR); DL.name = P + "_DRAWL";
    var td = fx(DL, "ADBE Turbulent Displace"); td.property("Amount").setValue(1.6); td.property("Size").setValue(5);    // chipped, hand-cut edges (static, no boil)
    var SL = CV.layers.add(SCR); SL.name = P + "_KNIFE"; SL.position.setValue([W / 2, H / 2]);
    keys(SL.rotation, angles);
    var tw = fx(SL, "ADBE Turbulent Displace"); tw.property("Amount").setValue(5); tw.property("Size").setValue(34);
    try { var dm = fx(SL, "ADBE Displacement Map"); dm.property("Use For Horizontal Displacement").setValue(11); dm.property("Max Horizontal Displacement").setValue(0);
      dm.property("Use For Vertical Displacement").setValue(5); dm.property("Max Vertical Displacement").setValue(9);
      dm.property("Displacement Map Layer").setValue(DL.index); } catch (e) { notes.push("form-following displacement: " + e.toString()); }
    SL.blendingMode = BlendingMode.LINEAR_LIGHT; SL.opacity.setValue(40);
    var CH = solid(CV, P + "_CHIPS", [.5, .5, .5]), cf = fx(CH, "ADBE Fractal Noise"); cf.property("Contrast").setValue(150); cf.property("Scale").setValue(16); cf.property("Complexity").setValue(3);
    CH.blendingMode = BlendingMode.LINEAR_LIGHT; CH.opacity.setValue(5);
    var TH = solid(CV, P + "_THRESH", [1, 1, 1]); TH.adjustmentLayer = true;
    fx(TH, "ADBE Gaussian Blur 2").property("Blurriness").setValue(1.4);
    fx(TH, "ADBE Threshold2").property("Level").setValue(.5);                          // 0..1 from scripting, not 0..255
    fx(TH, "ADBE Gaussian Blur 2").property("Blurriness").setValue(.7);                // a soft edge, so the print does not alias
    return { draw: DL, knife: SL }; }

  // ---- the print: the carved plate in ink on laid paper, ragged block edge, wood grain in the cuts, specks where ink did not take.
  // Every hard cut is a new impression: two frames of misregistration.
  function printSheet(SH, P, CV, cuts, notes) { var W = SH.width, H = SH.height, c = [PLATE.x + PLATE.w / 2, PLATE.y + PLATE.h / 2];
    solid(SH, P + "_PAPER", PALETTE.paper);
    var PR = SH.layers.add(CV); PR.name = P + "_PRINT"; PR.position.setValue(c);
    var tn = fx(PR, "ADBE Tint"); tn.property("Map Black To").setValue(PALETTE.ink); tn.property("Map White To").setValue(PALETTE.paper);
    try { var re = fx(PR, "ADBE Roughen Edges"); re.property("Border").setValue(9); re.property("Edge Sharpness").setValue(2.2); re.property("Scale").setValue(28); re.property("Complexity").setValue(4); } catch (e) { notes.push("block edge: " + e.toString()); }
    var ex = "var c = [" + cuts.join(", ") + "], f = thisComp.frameDuration, o = [0, 0]; for (var i = 0; i < c.length; i++) { var d = time - c[i]; if (d >= 0 && d < f) o = [5, -3]; if (d >= f && d < 2 * f) o = [2, -1]; } value + o;";
    PR.position.expression = ex;
    // wood grain in the carved white (horizontal streaks, multiplied) and specks where ink did not take (sparse light flecks, screened)
    var GR = solid(SH, P + "_GRAIN", [.5, .5, .5], PLATE.w, PLATE.h, c), gf = fx(GR, "ADBE Fractal Noise");
    try { gf.property("Contrast").setValue(140); gf.property("Brightness").setValue(30); gf.property("Complexity").setValue(3); gf.property("Uniform Scaling").setValue(0);
      gf = GR.property("ADBE Effect Parade").property(1); gf.property("Scale Width").setValue(1600); gf.property("Scale Height").setValue(26); } catch (e2) { notes.push("grain: " + e2.toString()); }
    GR.blendingMode = BlendingMode.MULTIPLY; GR.opacity.setValue(16);
    var SP = solid(SH, P + "_SPECKS", [0, 0, 0], PLATE.w, PLATE.h, c), sf = fx(SP, "ADBE Fractal Noise");
    sf.property("Contrast").setValue(600); sf.property("Brightness").setValue(-190); sf.property("Scale").setValue(5); sf.property("Complexity").setValue(2);
    SP.blendingMode = BlendingMode.SCREEN; SP.opacity.setValue(40);
    // laid paper over everything (fine mottling)
    var PT = solid(SH, P + "_PAPERTEX", [.5, .5, .5]), pf = fx(PT, "ADBE Fractal Noise"); pf.property("Contrast").setValue(60); pf.property("Scale").setValue(140); pf.property("Complexity").setValue(5);
    PT.blendingMode = BlendingMode.OVERLAY; PT.opacity.setValue(14);
    return PR; }
  // the one colour plate: printed only where wood was cut away, with a small fixed misregistration. Darken, not Multiply: Multiply also
  // darkens the ink and its box shows; Darken keeps the ink (darker in every channel) and turns only the paper copper.
  // It sits directly above the print, under the grain, specks and paper texture.
  function colourPlate(SH, P, name, nodes, pos) { var L = piece(SH, P + "_COLOUR_" + name, nodes, [pos[0] + 3, pos[1] + 2]); L.blendingMode = BlendingMode.DARKEN;
    L.moveBefore(SH.layer(P + "_PRINT")); return L; }

  // ---- drawn pieces (tone nodes)
  // a figure: a black silhouette with a white knife outline, skin carved white with black features, grazing light on the lit edge only
  function personNodes() { var K = 1, O = 6;
    return [{ k: "poly", pts: [[-50, -262], [-8, -262], [-12, 0], [-56, 0]], fill: 0, sw: O, sc: K }, { k: "poly", pts: [[8, -262], [50, -262], [56, 0], [12, 0]], fill: 0, sw: O, sc: K },
      { k: "poly", pts: [[-84, -520], [84, -520], [100, -232], [-100, -232]], fill: 0, sw: O, sc: K },
      { k: "poly", pts: [[56, -506], [80, -514], [96, -244], [70, -244]], fill: .52 },
      { k: "poly", pts: [[-84, -512], [-54, -506], [-74, -300], [-104, -306]], fill: 0, sw: O, sc: K }, { k: "circle", x: -90, y: -290, r: 17, fill: 1, sw: 3, sc: 0 },
      { k: "group", id: "AR", pivot: [70, -506], kids: [{ k: "poly", pts: [[54, -512], [86, -514], [104, -312], [74, -306]], fill: 0, sw: O, sc: K }, { k: "circle", x: 90, y: -294, r: 17, fill: 1, sw: 3, sc: 0 }] },
      { k: "poly", pts: [[-24, -520], [0, -476], [24, -520]], fill: 1, sw: 3, sc: 0 },
      { k: "circle", x: 0, y: -446, r: 5, fill: 1 }, { k: "circle", x: 0, y: -398, r: 5, fill: 1 }, { k: "circle", x: 0, y: -350, r: 5, fill: 1 },
      { k: "rect", x: -15, y: -550, w: 30, h: 34, fill: 1, sw: 3, sc: 0 },
      { k: "ellipse", x: 0, y: -602, rx: 47, ry: 57, fill: 1, sw: 4, sc: 0 },
      { k: "poly", pts: [[-50, -612], [-42, -654], [0, -668], [42, -654], [50, -612], [32, -632], [-32, -632]], fill: 0, sw: 4, sc: K },
      { k: "ellipse", x: -17, y: -603, rx: 7, ry: 4, fill: 0 }, { k: "ellipse", x: 17, y: -603, rx: 7, ry: 4, fill: 0 },
      { k: "line", pts: [[-29, -617], [-8, -615]], sw: 4, sc: 0 }, { k: "line", pts: [[8, -615], [29, -617]], sw: 4, sc: 0 },
      { k: "line", pts: [[1, -598], [-5, -580], [5, -578]], sw: 3, sc: 0 }, { k: "line", pts: [[-14, -566], [14, -566]], sw: 4, sc: 0 }]; }
  function documentNodes() { var n = [{ k: "rect", x: -134, y: -174, w: 268, h: 348, fill: null, sw: 4, sc: 1 }, { k: "rect", x: -125, y: -165, w: 250, h: 330, fill: .8, sw: 6, sc: 0 },
    { k: "rect", x: -92, y: -136, w: 112, h: 20, fill: 0 }];
    for (var r = 0; r < 7; r++) n.push({ k: "line", pts: [[-92, -86 + r * 34], [r === 6 ? 20 : 92, -86 + r * 34]], sw: 7, sc: 0 });
    n.push({ k: "poly", pts: [[79, -165], [125, -119], [79, -119]], fill: .25, sw: 4, sc: 0 }); return n; }
  function deviceNodes() { var n = [{ k: "rect", x: -172, y: -238, w: 344, h: 238, fill: 0, sw: 6, sc: 1 }, { k: "rect", x: -150, y: -216, w: 300, h: 196, fill: .88, sw: 4, sc: 0 },
    { k: "rect", x: -124, y: -188, w: 120, h: 16, fill: 0 }, { k: "line", pts: [[-124, -150], [110, -150]], sw: 6, sc: 0 }, { k: "line", pts: [[-124, -122], [80, -122]], sw: 6, sc: 0 },
    { k: "line", pts: [[-124, -94], [96, -94]], sw: 6, sc: 0 }, { k: "rect", x: 30, y: -76, w: 90, h: 40, fill: .35, sw: 3, sc: 0 },
    { k: "poly", pts: [[-190, 0], [190, 0], [222, 42], [-222, 42]], fill: 0, sw: 6, sc: 1 }];
    for (var r = 0; r < 3; r++) for (var c = 0; c < 12; c++) n.push({ k: "rect", x: -150 + c * 26 + r * 4, y: 8 + r * 10, w: 14, h: 4, fill: 1 });
    return n; }
  function knifeNodes() { return [{ k: "poly", pts: [[34, 62], [62, 34], [186, 158], [158, 186]], fill: 0, sw: 6, sc: 1 },          // tip at the origin, handle down-right
    { k: "poly", pts: [[26, 50], [50, 26], [62, 38], [38, 62]], fill: 1, sw: 3, sc: 0 },                                              // (so the knife never covers the line it cuts)
    { k: "poly", pts: [[0, 0], [44, 16], [52, 30], [30, 52], [16, 44]], fill: 1, sw: 3, sc: 0 }, { k: "line", pts: [[6, 6], [36, 36]], sw: 2, sc: 0 }]; }
  function raysNodes(cx, cy, a0, a1, step, r0, r1, w0, w1) { var n = [];
    for (var a = a0; a <= a1 + .001; a += step) { var t = a * Math.PI / 180, dx = Math.cos(t), dy = Math.sin(t), nx = -dy, ny = dx;
      n.push({ k: "poly", pts: [[cx + dx * r0 + nx * w0, cy + dy * r0 + ny * w0], [cx + dx * r1 + nx * w1, cy + dy * r1 + ny * w1], [cx + dx * r1 - nx * w1, cy + dy * r1 - ny * w1], [cx + dx * r0 - nx * w0, cy + dy * r0 - ny * w0]], fill: 1 }); }
    return n; }

  // buildScene: the shared test scene (the library's seven-beat test scene) as seven plates of a woodcut novel. comp = an empty 1080 x 1920 comp.
  // DRAW holds the tone drawing, CARVE cuts it, SHEET prints it on paper; the main comp holds the block (title), the sheet, the blank
  // paper that lays down and soaks through, the peeled impression (carry), the letterpress captions and the plate numbers.
  function buildScene(comp, scene, opts) {
    fontOK(); var P = opts.prefix || "WOOD", A = opts.assets, B = scene.beat, W = comp.width, H = comp.height, notes = [], WL = scene.wordList, D = comp.duration, fps = comp.frameRate;
    AESLib.clearOwned(comp, P);
    var PW = PLATE.w, PH = PLATE.h, cx = PW / 2;
    var DR = app.project.items.addComp(P + "_DRAW", PW, PH, 1, D, fps); DR.bgColor = [0, 0, 0];
    var CV = app.project.items.addComp(P + "_CARVE", PW, PH, 1, D, fps); CV.bgColor = [0, 0, 0];
    var SH = app.project.items.addComp(P + "_SHEET", W, H, 1, D, fps); SH.bgColor = PALETTE.paper;
    var SCR = screenComp(P, D, fps);
    solid(DR, P + "_WOOD", [0, 0, 0]);
    var ons = function (t0, t1) { var r = [], w = wordsIn(WL, t0, t1); for (var i = 0; i < w.length; i++) r.push(w[i].s); return r; };
    var cuts = [B.picture.t0, B.input.t0, B.number.t0, B.line.t0, B.carry.t0];

    // 1. title: light is carved. A sun on the horizon throws radial cuts across a sky hatched wider towards the light; furrows run to it.
    // The title is cut into the block (read mirrored while the block is shown, true once the paper is pulled).
    var T0 = B.title.t0, T1 = B.title.t1, HZ = 1010;
    span(ramp(DR, P + "_T_SKY", [cx, 500], .02, [cx, HZ], .66), T0, T1);
    var RY = piece(DR, P + "_T_RAYS", raysNodes(0, 0, 188, 352, 8, 150, 560, 2, 22), [cx, HZ]); span(RY, T0, T1);
    keys(RY.scale, [{ t: T0 + .04, v: [12, 12], o: 30 }, { t: T0 + .42, v: [100, 100], i: 75 }]);
    var fur = [{ k: "rect", x: -10, y: HZ, w: PW + 20, h: PH - HZ + 10, fill: .14 }]; for (var f = -7; f <= 15; f++) fur.push({ k: "line", pts: [[cx, HZ], [cx + (f * 110 - cx) * 2.4, PH + 20]], sw: 3, sc: 1 });
    fur.push({ k: "rect", x: -10, y: HZ - 2, w: PW + 20, h: 4, fill: 1 });
    span(piece(DR, P + "_T_GROUND", fur), T0, T1);
    span(piece(DR, P + "_T_SUN", [{ k: "circle", x: cx, y: HZ, r: 118, fill: 1 }, { k: "circle", x: cx, y: HZ, r: 132, fill: null, sw: 4, sc: 1 }]), T0, T1);
    var TC = words(DR, P + "_T_CTX", B.title.context.toUpperCase(), { family: SC, style: "Regular", size: 142, tracking: 30, x: cx, y: 214, maxW: 820, t0: T0, t1: T1 });
    carveIn(TC.layer, T0 + .04, .32, 90, 60);
    span(piece(DR, P + "_T_RULE", [{ k: "rect", x: 200, y: 312, w: PW - 400, h: 4, fill: 1 }, { k: "poly", pts: [[cx, 302], [cx + 10, 314], [cx, 326], [cx - 10, 314]], fill: 1 }]), T0, T1);
    var TH = words(DR, P + "_T_HERO", B.title.hero, { family: FELL, style: "Italic", size: 96, x: cx, y: 404, maxW: 800, t0: T0, t1: T1 });
    carveIn(TH.layer, T0 + .2, .3, 90, 60);
    span(piece(DR, P + "_T_STARS", flecks(26, 30, 470, PW - 30, 760, 11, 2, 5)), T0, T1);

    // 2. picture: three pieces carved on their words (the person, the page, the screen), then one carved rule frames them as one picture
    var P0 = B.picture.t0, P1 = B.picture.t1, pw = ons(P0, P1), GY = 1160;
    span(ramp(DR, P + "_P_SKY", [cx, 480], .02, [cx, GY], .56), P0, P1);
    span(piece(DR, P + "_P_STARS", flecks(34, 30, 40, PW - 30, 560, 7, 2, 6)), P0, P1);
    var gr = [{ k: "rect", x: -10, y: GY, w: PW + 20, h: PH - GY + 10, fill: .3 }, { k: "rect", x: -10, y: GY - 2, w: PW + 20, h: 4, fill: 1 }];
    gr = gr.concat([{ k: "rect", x: 536, y: 910, w: 440, h: 36, fill: 0, sw: 5, sc: 1 }, { k: "line", pts: [[552, 922], [940, 922]], sw: 2, sc: 1 }, { k: "line", pts: [[580, 934], [900, 934]], sw: 2, sc: 1 },
      { k: "rect", x: 572, y: 946, w: 26, h: 270, fill: 0, sw: 5, sc: 1 }, { k: "rect", x: 900, y: 946, w: 26, h: 270, fill: 0, sw: 5, sc: 1 }]);
    span(piece(DR, P + "_P_GROUND", gr), P0, P1);
    var PE = piece(DR, P + "_P_PERSON", personNodes(), [232, 1246]); span(PE, P0, P1); carveIn(PE, pw[0], .34, 180, 90);
    var ar = groupT(PE, ["AR"]).property("ADBE Vector Rotation"); keys(ar, [{ t: pw[3] - .1, v: 0, o: 40 }, { t: pw[4] + .1, v: -128, i: 70 }]); ar.expression = TWOS + "value;";
    var DO = piece(DR, P + "_P_DOC", documentNodes(), [500, 560]); span(DO, pw[1], P1); DO.rotation.setValue(-6); carveIn(DO, pw[1], .32, 180, 80);
    keys(DO.position, [{ t: pw[1], v: [500, 500], o: 30 }, { t: pw[1] + .3, v: [500, 560], i: 80 }]); DO.position.expression = TWOS + "value;";
    var DV = piece(DR, P + "_P_DEVICE", deviceNodes(), [756, 868]); span(DV, pw[2], P1); carveIn(DV, pw[2], .32, 180, 80);
    var FR = piece(DR, P + "_P_FRAME", [{ k: "rect", x: 26, y: 26, w: PW - 52, h: PH - 52, fill: null, sw: 5, sc: 1 }]); span(FR, P0, P1);
    var tr = FR.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").addProperty("ADBE Vector Filter - Trim");
    keys(tr.property("ADBE Vector Trim End"), [{ t: pw[4], v: 0, o: 30 }, { t: pw[4] + .42, v: 100, i: 75 }]);

    // 3. input: the real frame carved by the same knife (tools/tone.mjs makes the tone plate on twos), inside an arched window; slow macro push.
    // The cuts grow in, brightest first (the tone rises from uncut wood).
    var I0 = B.input.t0, I1 = B.input.t1;
    var tv = AESLib.importFile(A.tone), TV = DR.layers.add(tv); TV.name = P + "_I_REAL"; TV.startTime = I0; span(TV, I0, I1);
    TV.position.setValue([cx, 800]); keys(TV.scale, [{ t: I0, v: [100, 100], o: 20 }, { t: I1, v: [107, 107], i: 20 }]);
    keys(TV.opacity, [{ t: I0, v: 0, o: 20 }, { t: I0 + .4, v: 100, i: 70 }]);
    var AR = [[96, 1300], [96, 560], [856, 560], [856, 1300]], am = new Shape(), ac = [];
    for (var q = 0; q <= 16; q++) { var an = Math.PI * q / 16; ac.push([cx - Math.cos(an) * 380, 560 - Math.sin(an) * 330]); }
    am.vertices = [[96, 1300]].concat(ac).concat([[856, 1300]]); am.closed = true;
    var arch = DR.layers.addShape(); arch.name = P + "_I_ARCHMASK"; arch.anchorPoint.setValue([0, 0]); arch.position.setValue([0, 0]);
    var ag = arch.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").property("ADBE Vectors Group"); ag.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(am);
    ag.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue([1, 1, 1]); span(arch, I0, I1);
    TV.setTrackMatte(arch, TrackMatteType.ALPHA); arch.enabled = false;
    var ab = DR.layers.addShape(); ab.name = P + "_I_ARCH"; ab.anchorPoint.setValue([0, 0]); ab.position.setValue([0, 0]);
    var abg = ab.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").property("ADBE Vectors Group"); abg.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(am);
    var abs = abg.addProperty("ADBE Vector Graphic - Stroke"); abs.property("ADBE Vector Stroke Color").setValue([1, 1, 1]); abs.property("ADBE Vector Stroke Width").setValue(6); span(ab, I0, I1);
    span(piece(DR, P + "_I_FLECKS", flecks(30, 30, 30, PW - 30, 200, 3, 2, 5).concat(flecks(12, 30, 1330, PW - 30, 1370, 5, 2, 4))), I0, I1);

    // 4. number: the count is carved into a black panel on twos, FRAMES lands on its word, and 338 stab cuts fill row by row with the count.
    // The copper plate spreads over the numerals: the one thing that burns.
    var N0 = B.number.t0, N1 = B.number.t1, nw = ons(N0, N1), val = B.number.value, NY = 440;
    var NU = words(DR, P + "_N_NUM", String(val), { family: FELL, style: "Regular", size: 430, x: cx, y: NY, t0: N0, t1: N1 }).layer;
    NU.anchorPoint.expression = "var r = sourceRectAtTime(time, false); [r.left + r.width / 2, r.top + r.height / 2];";
    var counts = [], cn = 8; for (var c2 = 0; c2 <= cn; c2++) { var e = 1 - Math.pow(1 - c2 / cn, 2.2); counts.push(String(Math.round(val * e))); }
    AESLib.bakeText(NU, counts, 12, N0);
    span(piece(DR, P + "_N_RULE", [{ k: "rect", x: 150, y: 700, w: PW - 300, h: 4, fill: 1 }, { k: "rect", x: 190, y: 712, w: PW - 380, h: 2, fill: 1 }]), N0, N1);
    var FW = words(DR, P + "_N_FRAMES", "FRAMES", { family: SC, style: "Regular", size: 96, tracking: 300, x: cx + 14, y: 800, t0: N0, t1: N1 }); carveIn(FW.layer, nw[1] - .02, .26, 90, 50);
    var GRD = DR.layers.addShape(); GRD.name = P + "_N_STABS"; GRD.anchorPoint.setValue([0, 0]); GRD.position.setValue([101, 940]); span(GRD, N0, N1);
    var og = GRD.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group"), ov = og.property("ADBE Vectors Group");
    var ig = ov.addProperty("ADBE Vector Group"), iv = ig.property("ADBE Vectors Group");
    var de = iv.addProperty("ADBE Vector Shape - Ellipse"); de.property("ADBE Vector Ellipse Size").setValue([11, 8]);
    iv.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue([1, 1, 1]);
    var r1 = iv.addProperty("ADBE Vector Filter - Repeater"); r1.property("ADBE Vector Repeater Copies").setValue(26); r1.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([30, 0]);
    var r2 = ov.addProperty("ADBE Vector Filter - Repeater"); r2.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([0, 30]);
    r2 = GRD.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property(2);
    keys(r2.property("ADBE Vector Repeater Copies"), [{ t: N0, v: 0, o: "L" }, { t: N0 + cn / 12, v: 13, i: "L" }]);
    r2.property("ADBE Vector Repeater Copies").expression = TWOS + "Math.round(value);";

    // 5. line: the knife carves the line word by word; its tip tracks the end of the last word cut, chips fly at each stroke
    var L0 = B.line.t0, L1 = B.line.t1, lw = ons(L0, L1), rows = ["Every word", "I say", "gets typed."], rw = [[lw[0], lw[1]], [lw[2], lw[3]], [lw[4], lw[5]]];
    var LO = { family: FELL, style: "Italic", size: 138 }, LX = 110, LY = [420, 620, 820], tips = [];
    for (var r = 0; r < rows.length; r++) {
      var rr = words(DR, P + "_L_ROW" + r, rows[r], { family: LO.family, style: LO.style, size: LO.size, x: LX + 0, y: LY[r], t0: L0, t1: L1, keys: build(rows[r], rw[r], L0) });
      var ws = rows[r].split(" "); rr.layer.position.setValue([LX + rr.rect.width / 2, LY[r]]);                     // the ink box's left edge sits on LX
      for (var wi = 0; wi < ws.length; wi++) tips.push({ t: rw[r][Math.min(wi, rw[r].length - 1)], v: [LX + inkWidth(DR, ws.slice(0, wi + 1).join(" "), LO) + 8, LY[r] + 48] }); }
    var KN = piece(DR, P + "_L_KNIFE", knifeNodes(), tips[0].v); span(KN, L0, L1);
    var kk = [{ t: L0, v: [tips[0].v[0] - 60, tips[0].v[1] + 40], o: 40 }]; for (var ti = 0; ti < tips.length; ti++) kk.push({ t: tips[ti].t + .16, v: tips[ti].v, i: 70, o: 40 });
    keys(KN.position, kk); KN.position.expression = TWOS + "value;";
    var CHP = piece(DR, P + "_L_CHIPS", [{ k: "poly", pts: [[-8, -30], [0, -40], [6, -28]], fill: 1 }, { k: "poly", pts: [[18, -14], [30, -20], [26, -6]], fill: 1 }, { k: "ellipse", x: -22, y: -6, rx: 4, ry: 3, fill: 1 },
      { k: "ellipse", x: 12, y: -44, rx: 3, ry: 3, fill: 1 }, { k: "poly", pts: [[-30, -24], [-20, -30], [-22, -18]], fill: 1 }], [0, 0]); span(CHP, L0, L1);
    CHP.position.expression = "thisComp.layer(\"" + P + "_L_KNIFE\").transform.position;";
    var ck = [], lastChip = -1; for (var cc = 0; cc < tips.length; cc++) { if (tips[cc].t - lastChip < .22) continue; lastChip = tips[cc].t; ck.push({ t: tips[cc].t + .1, v: [0, 0], o: "L" }); ck.push({ t: tips[cc].t + .17, v: [120, 120], i: "L", o: "L" }); ck.push({ t: tips[cc].t + .3, v: [0, 0], i: "L", o: "L" }); }
    keys(CHP.scale, ck); CHP.scale.expression = TWOS + "value;";

    // 7. end (under the peel from the carry on): the real face in an oval medallion, THAT'S THE TEST carved on its words, a carved rule
    var C0 = B.carry.t0, E0 = B.end.t0, E1 = B.end.t1, ew = ons(E0, E1), MED = [cx, 452];
    var fc = AESLib.importFile(A.face), FC = DR.layers.add(fc); FC.name = P + "_E_FACE"; span(FC, C0, E1);
    FC.anchorPoint.setValue([505, 430]); FC.position.setValue(MED); FC.scale.setValue([56, 56]);
    var fm = FC.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"); fm.property("ADBE Mask Shape").setValue(ell(505, 430, 205 / .56, 258 / .56));
    span(piece(DR, P + "_E_RINGS", [{ k: "ellipse", x: MED[0], y: MED[1], rx: 214, ry: 266, fill: null, sw: 6, sc: 1 }, { k: "ellipse", x: MED[0], y: MED[1], rx: 232, ry: 284, fill: null, sw: 2.5, sc: 1 }]
      .concat(flecks(40, 40, 40, PW - 40, 760, 23, 2, 5))), C0, E1);
    var EA = words(DR, P + "_E_A", "THAT’S", { family: SC, style: "Regular", size: 150, tracking: 40, x: cx, y: 900, t0: C0, t1: E1 }); carveIn(EA.layer, ew[0] - .02, .26, 90, 50);
    var EB = words(DR, P + "_E_B", "THE TEST.", { family: SC, style: "Regular", size: 150, tracking: 40, x: cx, y: 1070, maxW: 820, t0: C0, t1: E1 }); carveIn(EB.layer, ew[1] - .02, .4, 90, 60);
    var ER = piece(DR, P + "_E_RULE", [{ k: "rect", x: 180, y: 1190, w: PW - 360, h: 4, fill: 1 }, { k: "poly", pts: [[cx, 1180], [cx + 12, 1192], [cx, 1204], [cx - 12, 1192]], fill: 1 }]); span(ER, C0, E1);
    carveIn(ER, ew[2], .3, 90, 60);

    // CARVE: the knife's line screen turns per plate (hold keys): the direction of the cuts is part of each plate's drawing
    var ang = [{ t: 0, v: 0, o: "H" }, { t: B.input.t0, v: 34, o: "H" }, { t: B.number.t0, v: -26, o: "H" }, { t: B.line.t0, v: 0, o: "H" }, { t: B.carry.t0, v: 22, o: "H" }];
    carvePass(CV, P, DR, SCR, ang, notes);

    // SHEET: the print. The colour plates (copper) sit on it: spread over the count, then a last copper light in the medallion that shrinks
    // to a single highlight on the ring.
    printSheet(SH, P, CV, cuts, notes);
    var px = PLATE.x, py = PLATE.y;
    var CN = colourPlate(SH, P, "COUNT", [{ k: "rect", x: -350, y: -190, w: 700, h: 380, fill: PALETTE.copper }], [px + cx, py + NY]); span(CN, N0, N1);
    keys(CN.scale, [{ t: N0 + .02, v: [100, 0], o: 30 }, { t: nw[1], v: [100, 100], i: 70 }]);
    var CE = colourPlate(SH, P, "END", [{ k: "ellipse", x: 0, y: 0, rx: 214, ry: 266, fill: PALETTE.copper }], [px + MED[0], py + MED[1]]); span(CE, ew[0], E1);
    CE.anchorPoint.setValue([0, -266]); CE.position.setValue([px + MED[0] + 3, py + MED[1] - 266 + 2]);
    keys(CE.scale, [{ t: ew[0], v: [0, 0], o: 30 }, { t: ew[0] + .4, v: [100, 100], i: 70, o: "H" }, { t: ew[2] + .55, v: [100, 100], o: 50 }, { t: ew[2] + 1.05, v: [5, 4], i: 80 }]);

    // main comp: the table and the inked block (mirrored), the brayer's wet highlight, the sheet, the blank paper that lays down and soaks
    // through (the baren's spiral), the peeled impression, letterpress captions and plate numbers in the margin
    var pc = [px + cx, py + PH / 2], LAY = .3, LAND = .48, SOAK = .7;
    solid(comp, P + "_TABLE", PALETTE.table);
    span(solid(comp, P + "_BLOCKSIDE", PALETTE.woodSide, PW + 10, PH + 10, [pc[0] + 9, pc[1] + 11]), 0, LAND + .02);
    var BK = comp.layers.add(CV); BK.name = P + "_BLOCK"; BK.position.setValue(pc); BK.scale.setValue([-100, 100]); span(BK, 0, LAND + .02);
    var bt = fx(BK, "ADBE Tint"); bt.property("Map Black To").setValue(PALETTE.woodInked); bt.property("Map White To").setValue(PALETTE.woodPale);
    var BR = solid(comp, P + "_BRAYER", [1, .96, .9], PW, 150, [pc[0], py]); BR.blendingMode = BlendingMode.ADD; BR.opacity.setValue(22); span(BR, 0, LAND);
    var bm = BR.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"); bm.property("ADBE Mask Shape").setValue(poly([[0, 40], [PW, 40], [PW, 110], [0, 110]])); bm.property("ADBE Mask Feather").setValue([0, 60]);
    keys(BR.position, [{ t: 0, v: [pc[0], py], o: 40 }, { t: LAY, v: [pc[0], py + PH], i: 40 }]);
    var SL = comp.layers.add(SH); SL.name = P + "_SHEETL"; span(SL, LAND - .02, D);
    var BL = solid(comp, P + "_BLANK", PALETTE.paper); BL.threeDLayer = true; BL.anchorPoint.setValue([W / 2, 0]); BL.position.setValue([W / 2, 0, 0]); span(BL, LAY, SOAK + .02);
    keys(BL.property("ADBE Transform Group").property("ADBE Rotate X"), [{ t: LAY, v: -84, o: 15 }, { t: LAND, v: 0, i: 90 }]);
    var rw2 = fx(BL, "ADBE Radial Wipe"); rw2.property("Feather").setValue(160); rw2.property("Wipe Center").setValue([pc[0], pc[1]]);
    keys(rw2.property("Transition Completion"), [{ t: LAND + .02, v: 0, o: 30 }, { t: SOAK, v: 100, i: 60 }]);
    // carry: a new impression of plate III (the sheet held at a frame of the input), peeled off on "becomes" to show the end plate below
    var cw = ons(B.carry.t0, B.carry.t1), PK = comp.layers.add(SH); PK.name = P + "_PEEL"; span(PK, C0, cw[5] + .12);
    PK.timeRemapEnabled = true; PK.property("ADBE Time Remapping").expression = String(B.input.t0 + 1.05) + ";";
    PK.threeDLayer = true; PK.anchorPoint.setValue([W / 2, 0]); PK.position.setValue([W / 2, 0, 0]);
    keys(PK.property("ADBE Transform Group").property("ADBE Rotate X"), [{ t: cw[3] - .02, v: 0, o: 85 }, { t: cw[5] + .1, v: -96, i: 10 }]);
    // captions: letterpress in the margin, ink up in 0.1 s with no slide, out over 0.15 s. Plate numbers above the block.
    var caps = [[B.picture, "Three pieces build one picture."], [B.input, "Here’s a real frame from my video."], [B.number, "counted."], [B.carry, "Then one thing becomes the next."]];
    for (var k = 0; k < caps.length; k++) { var cb = caps[k][0], CL = AESLib.text(comp, P + "_CAP" + k, caps[k][1], { family: FELL, style: "Italic", size: 58, color: PALETTE.ink, pos: [W / 2, 1668] });
      span(CL, cb.t0, cb.t1); keys(CL.opacity, [{ t: cb.t0, v: 0, o: "L" }, { t: cb.t0 + .1, v: 100, i: "L", o: "H" }, { t: cb.t1 - .15, v: 100, o: "L" }, { t: cb.t1, v: 0, i: "L" }]);
      try { var cre = fx(CL, "ADBE Roughen Edges"); cre.property("Border").setValue(1.4); cre.property("Scale").setValue(12); } catch (e3) { notes.push("caption ink: " + e3.toString()); } }
    var PN = AESLib.text(comp, P + "_PLATENO", "PLATE I", { family: SC, style: "Regular", size: 40, tracking: 220, color: PALETTE.ink, pos: [W / 2, 108] }); span(PN, LAND, D);
    AESLib.textKeys(PN, [LAND, B.picture.t0, B.input.t0, B.number.t0, B.line.t0, B.carry.t0, cw[5]], ["PLATE I", "PLATE II", "PLATE III", "PLATE IV", "PLATE V", "PLATE III", "PLATE VI"]);
    return { layers: comp.numLayers + DR.numLayers + CV.numLayers + SH.numLayers + SCR.numLayers, notes: notes };
  }
  return { SC: SC, FELL: FELL, PALETTE: PALETTE, PLATE: PLATE, fontOK: fontOK, keys: keys, piece: piece, groupT: groupT, ramp: ramp, carveIn: carveIn, flecks: flecks,
    words: words, inkWidth: inkWidth, build: build, wordsIn: wordsIn, screenComp: screenComp, carvePass: carvePass, printSheet: printSheet, colourPlate: colourPlate,
    personNodes: personNodes, documentNodes: documentNodes, deviceNodes: deviceNodes, knifeNodes: knifeNodes, raysNodes: raysNodes, ell: ell, buildScene: buildScene };
})();
