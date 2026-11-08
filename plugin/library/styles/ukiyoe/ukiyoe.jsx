// Ukiyo-e woodblock print style: brand-neutral ES3 helpers. No project mutation happens at load.
// Read styles/ukiyoe/STYLE.md first. Every view is a complete woodblock print: a washi sheet, a thick and thin sumi border, flat colour
// blocks each printed a hair out of register, a sumi key block on top, bokashi gradients, woodgrain, mottle and specks in the ink, paper
// fibres over all. Views print block by block (key first, then each colour lands with a diagonal baren sweep, sliding into register).
// The sheets are mounted side by side on one long handscroll and the camera slides right to left between them. A real frame of video is
// cut into the same blocks by tools/blocks.mjs (key, flesh, hair, beard, garment mattes) and printed like any other view.
// Adapted from Lemo-Opuscar's ukiyoe style (MIT, LemoLab); see assets/LICENSE-lemo-opuscar.txt.
var AESUkiyoe = (function () {
  var MIN = "Shippori Mincho", MED = "Medium";
  var PALETTE = { paper: [.937, .894, .8], mount: [.75, .643, .455], sumi: [.11, .102, .114], prussian: [.122, .239, .451], paleBlue: [.561, .682, .796],
    indigo: [.169, .251, .439], beni: [.749, .227, .18], pink: [.91, .659, .596], ochre: [.8, .62, .33], green: [.333, .451, .322], darkGreen: [.2, .3, .22],
    flesh: [.957, .851, .761], stubble: [.592, .639, .682], cream: [.953, .91, .816], brown: [.45, .3, .2], mist: [.95, .89, .85], grey: [.62, .64, .66],
    lacquer: [.17, .13, .13], greyGreen: [.45, .52, .45], mauve: [.64, .56, .63], night: [.09, .14, .29] };
  var SHW = 1000, SHH = 1760, IW = 908, IH = 1600, IX = 46, IY = 52;   // the sheet, and its image area inside the border (wider margin below)
  var STEP = 1180, NS = 7, SCW = 2 * 790 + (NS - 1) * STEP;             // sheets on the handscroll, right to left
  var EIGHTS = "posterizeTime(8); ";
  var REG = { a: [2, -1.5], b: [-2, 1.5], c: [1.5, 2], d: [-1.5, -2], e: [2.5, 1] };   // each colour block's fixed misregistration with the key
  function fontOK() { AESLib.font(MIN, MED); return true; }
  function X(i) { return SCW - 790 - i * STEP; }

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
    if (prop.propertyValueType === PropertyValueType.TwoD_SPATIAL || prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL)
      for (var s = 1; s <= prop.numKeys; s++) prop.setSpatialTangentsAtKey(s, [0, 0, 0], [0, 0, 0]);       // straight paths: collinear keys never bow
    return prop; }
  function fx(L, match) { L.property("ADBE Effect Parade").addProperty(match); var EP = L.property("ADBE Effect Parade"); return EP.property(EP.numProperties); }
  function span(L, t0, t1) { L.inPoint = t0; L.outPoint = t1; return L; }      // in before out: setting inPoint after outPoint loses the out point
  function solid(comp, name, color, w, h, pos) { var L = comp.layers.addSolid(color, name, w || comp.width, h || comp.height, 1); if (pos) L.position.setValue(pos); return L; }
  function noise(L, o) { var f = fx(L, "ADBE Fractal Noise"); f.property("Contrast").setValue(o.contrast); f.property("Brightness").setValue(o.brightness || 0);
    f.property("Complexity").setValue(o.complexity || 3);
    if (o.sw) { f.property("Uniform Scaling").setValue(0); f = L.property("ADBE Effect Parade").property(L.property("ADBE Effect Parade").numProperties);
      f.property("Scale Width").setValue(o.sw); f.property("Scale Height").setValue(o.sh); } else f.property("Scale").setValue(o.scale);
    if (o.rot) f.property("Rotation").setValue(o.rot); return f; }

  // ---- shapes: { k: "poly"|"smooth"|"line"|"sline"|"rect"|"circle"|"ellipse"|"group", ..., fill (rgb or null), key (key-line width, 0 = none),
  // sw / sc (a coloured stroke printed with the colour block) }. A drawing is printed twice: its colour block (fills) and its key block (lines).
  var KAPPA = .5523, KW = 3;
  function poly(pts, closed) { var s = new Shape(); s.vertices = pts; s.closed = closed !== false; return s; }
  function smooth(pts, closed) { var n = pts.length, s = new Shape(), it = [], ot = [];   // Catmull-Rom through the points
    for (var i = 0; i < n; i++) { var a, b; if (closed) { a = pts[(i - 1 + n) % n]; b = pts[(i + 1) % n]; } else { a = pts[Math.max(0, i - 1)]; b = pts[Math.min(n - 1, i + 1)]; }
      var tx = (b[0] - a[0]) / 6, ty = (b[1] - a[1]) / 6; it.push([-tx, -ty]); ot.push([tx, ty]); }
    s.vertices = pts; s.inTangents = it; s.outTangents = ot; s.closed = closed; return s; }
  function ell(cx, cy, rx, ry) { var a = KAPPA * rx, b = KAPPA * ry, s = new Shape(); s.vertices = [[cx, cy - ry], [cx + rx, cy], [cx, cy + ry], [cx - rx, cy]];
    s.inTangents = [[-a, 0], [0, -b], [a, 0], [0, b]]; s.outTangents = [[a, 0], [0, b], [-a, 0], [0, -b]]; s.closed = true; return s; }
  function shapeOf(n) { if (n.k === "circle") return ell(n.x, n.y, n.r, n.r);
    if (n.k === "ellipse") return ell(n.x, n.y, n.rx, n.ry);
    if (n.k === "rect") return poly([[n.x, n.y], [n.x + n.w, n.y], [n.x + n.w, n.y + n.h], [n.x, n.y + n.h]]);
    if (n.k === "line") return poly(n.pts, false);
    if (n.k === "sline") return smooth(n.pts, false);
    if (n.k === "smooth") return smooth(n.pts, true);
    return poly(n.pts); }
  function open(n) { return n.k === "line" || n.k === "sline"; }
  function emit(contents, nodes, mode) {
    for (var i = nodes.length - 1; i >= 0; i--) { var n = nodes[i];
      if (n.k !== "group") { if (mode === "key" && !(n.key !== 0 && (n.fill || open(n) || n.key))) continue;
        if (mode === "fill" && !(n.fill && !open(n)) && !n.sw) continue; }
      var gr = contents.addProperty("ADBE Vector Group"); if (n.id) gr.name = n.id;
      var tg = gr.property("ADBE Vector Transform Group");
      if (n.pivot) { tg.property("ADBE Vector Anchor").setValue(n.pivot); tg.property("ADBE Vector Position").setValue(n.pivot); }
      var v = gr.property("ADBE Vectors Group");
      if (n.k === "group") { emit(v, n.kids, mode); continue; }
      v.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(shapeOf(n));
      var sw = 0, sc = null;
      if (mode === "key") { sw = n.key || KW; sc = n.kc || PALETTE.sumi; } else if (n.sw) { sw = n.sw; sc = n.sc; }
      if (sw) { var st = v.addProperty("ADBE Vector Graphic - Stroke"); st.property("ADBE Vector Stroke Color").setValue(sc);
        st.property("ADBE Vector Stroke Width").setValue(sw); st.property("ADBE Vector Stroke Line Join").setValue(2); st.property("ADBE Vector Stroke Line Cap").setValue(2); }
      if (mode !== "key" && n.fill && !open(n)) v.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(n.fill); } }
  function piece(comp, name, nodes, mode, pos) { var L = comp.layers.addShape(); L.name = name; emit(L.property("ADBE Root Vectors Group"), nodes, mode || "fill");
    L.anchorPoint.setValue([0, 0]); L.position.setValue(pos || [0, 0]); return L; }
  // a colour block: the fills, set off its key by a fixed registration offset
  function block(comp, name, nodes, reg, pos) { var p = pos || [0, 0]; return piece(comp, name, nodes, "fill", [p[0] + reg[0], p[1] + reg[1]]); }
  function keyLine(comp, name, nodes, pos) { var L = piece(comp, name, nodes, "key", pos);
    try { var re = fx(L, "ADBE Roughen Edges"); re.property("Border").setValue(1.2); re.property("Scale").setValue(10); re.property("Complexity").setValue(2); } catch (e) {}
    return L; }

  // printing: a block lands over about 0.3 s under a diagonal baren sweep with a noisy edge, sliding a few px into register as it lands.
  // The sweep is a feathered Linear Wipe with Roughen Edges keyed to 0 at the end (so the landed block keeps its own clean edge).
  function printIn(L, t, dur, slide, mover, angle, rough) { var w = fx(L, "ADBE Linear Wipe"); w.property("Wipe Angle").setValue(angle === undefined ? 225 : angle); w.property("Feather").setValue(120);
    keys(w.property("Transition Completion"), [{ t: t, v: 100, o: 25 }, { t: t + dur, v: 0, i: 75 }]);
    try { var re = fx(L, "ADBE Roughen Edges"); re.property("Scale").setValue(34); re.property("Complexity").setValue(3); re.property("Edge Sharpness").setValue(1.4);
      keys(re.property("Border"), [{ t: t, v: rough || 26, o: "L" }, { t: t + dur, v: 0, i: "L" }]); } catch (e) {}
    var m = mover || L; if (slide) { var p = m.position.value; keys(m.position, [{ t: t, v: [p[0] + slide[0], p[1] + slide[1]], o: 25 }, { t: t + dur, v: p, i: 85 }]); }
    return L; }
  // a cartouche or slip drops in (fade and a short slide); a seal stamps (scale 135 -> 100 in 0.2 s)
  function dropIn(L, t) { var p = L.position.value; keys(L.position, [{ t: t, v: [p[0], p[1] - 16], o: 20 }, { t: t + .26, v: p, i: 85 }]);
    keys(L.opacity, [{ t: t, v: 0, o: "L" }, { t: t + .16, v: 100, i: "L" }]); return L; }
  function stamp(L, t) { keys(L.scale, [{ t: t, v: [135, 135], o: 10 }, { t: t + .2, v: [100, 100], i: 90 }]); keys(L.opacity, [{ t: t, v: 0, o: "H" }, { t: t + .02, v: 100 }]); return L; }

  // bokashi: an ink graded into paper by hand. A solid of the ink, its LUMA matte a ramp whose edge wanders per column (static Turbulent Displace)
  function bokashi(C, name, color, y0, y1, wander) { var S = solid(C, name, color);
    var M = solid(C, name + "_RAMP", [0, 0, 0], C.width + 200, C.height + 200, [C.width / 2, C.height / 2]), r = fx(M, "ADBE Ramp");
    r.property("Start of Ramp").setValue([C.width / 2 + 100, y0 + 100]); r.property("Start Color").setValue([1, 1, 1]); r.property("End of Ramp").setValue([C.width / 2 + 100, y1 + 100]); r.property("End Color").setValue([0, 0, 0]);
    var td = fx(M, "ADBE Turbulent Displace"); td.property("Amount").setValue(wander || 26); td.property("Size").setValue(260);
    S.setTrackMatte(M, TrackMatteType.LUMA); M.enabled = false; return S; }

  // ---- type
  function txt(comp, name, str, o) { var L = AESLib.text(comp, name, str, { family: MIN, style: MED, size: o.size, color: o.color || PALETTE.sumi, just: o.just || "center", tracking: o.tracking, leading: o.leading });
    var r = L.sourceRectAtTime(0, false); L.anchorPoint.setValue([r.left + r.width / 2, r.top + r.height / 2]); L.position.setValue([o.x, o.y]);
    if (o.maxW && r.width > o.maxW) { var s = 100 * o.maxW / r.width; L.scale.setValue([s, s]); }
    return L; }
  function inkWidth(comp, str, size) { var L = AESLib.text(comp, "PROBE", str, { family: MIN, style: MED, size: size, color: [0, 0, 0], just: "left" });
    var w = L.sourceRectAtTime(0, false).width; L.remove(); return w; }
  function wordsIn(list, t0, t1) { var r = []; for (var i = 0; i < list.length; i++) if (list[i].s >= t0 - .05 && list[i].s < t1) r.push(list[i].s); return r; }
  // a slip: cream with a thick outer and a thin inner sumi border (the cartouche of every print)
  function slipNodes(x, y, w, h, fill) { return [{ k: "rect", x: x, y: y, w: w, h: h, fill: fill || PALETTE.cream, key: 5 }, { k: "rect", x: x + 8, y: y + 8, w: w - 16, h: h - 16, fill: null, key: 1.6 }]; }
  function slip(comp, name, x, y, w, h, fill) { var nodes = slipNodes(x, y, w, h, fill), cx = x + w / 2, cy = y + h / 2;
    var L = comp.layers.addShape(); L.name = name; emit(L.property("ADBE Root Vectors Group"), nodes, "key"); emit(L.property("ADBE Root Vectors Group"), nodes, "fill");   // groups added later draw below
    L.anchorPoint.setValue([cx, cy]); L.position.setValue([cx, cy]); return L; }
  // a seal: one or two characters cut out of red, chipped edges
  function seal(comp, name, ch, x, y, s) { var L = comp.layers.addShape(); L.name = name; var gp = L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").property("ADBE Vectors Group");
    var rc = gp.addProperty("ADBE Vector Shape - Rect"); rc.property("ADBE Vector Rect Size").setValue([s, s]); rc.property("ADBE Vector Rect Roundness").setValue(s * .08);
    gp.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(PALETTE.beni); L.position.setValue([x, y]);
    try { var re = fx(L, "ADBE Roughen Edges"); re.property("Border").setValue(s * .045); re.property("Scale").setValue(12); } catch (e) {}
    var T = txt(comp, name + "_CH", ch, { size: s * .7, color: PALETTE.paper, x: x, y: y });
    return { box: L, ch: T }; }
  function vertical(str) { var a = []; for (var i = 0; i < str.length; i++) a.push(str.charAt(i)); return a.join("\r"); }

  // ---- one view: an INK comp (the blocks; image-area size) printed onto a SHEET comp (washi, border, fibres, ageing)
  function view(P, i, D, fps) { var INK = app.project.items.addComp(P + "_INK" + i, IW, IH, 1, D, fps); INK.bgColor = PALETTE.paper;
    var SH = app.project.items.addComp(P + "_SHEET" + i, SHW, SHH, 1, D, fps); SH.bgColor = PALETTE.paper; return { ink: INK, sh: SH, i: i }; }
  // the ink's texture: woodgrain (long wavy streaks) and mottle (uneven density from the baren), only where ink is (Preserve Transparency)
  function inkTexture(C, P) { var G = solid(C, P + "_GRAIN", [.5, .5, .5]); noise(G, { contrast: 140, sw: 1300, sh: 16, complexity: 4 });
    var gt = fx(G, "ADBE Turbulent Displace"); gt.property("Amount").setValue(34); gt.property("Size").setValue(140);
    G.blendingMode = BlendingMode.OVERLAY; G.opacity.setValue(17); G.preserveTransparency = true;
    var M = solid(C, P + "_MOTTLE", [.5, .5, .5]); noise(M, { contrast: 110, scale: 180, complexity: 4 }); M.blendingMode = BlendingMode.OVERLAY; M.opacity.setValue(16); M.preserveTransparency = true; }
  // goma-zuri: fine specks where ink did not take, on every block including the key
  function inkSpecks(C, P) { var S = solid(C, P + "_SPECKS", [0, 0, 0]); noise(S, { contrast: 620, brightness: -175, scale: 4, complexity: 2 });
    S.blendingMode = BlendingMode.SCREEN; S.opacity.setValue(30); S.preserveTransparency = true; }
  function finish(v, P) { var SH = v.sh, cx = IX + IW / 2, cy = IY + IH / 2;
    solid(SH, P + "_PAPER", PALETTE.paper);
    var IL = SH.layers.add(v.ink); IL.name = P + "_PRINT"; IL.position.setValue([cx, cy]);
    var BD = SH.layers.addShape(); BD.name = P + "_BORDER"; BD.anchorPoint.setValue([0, 0]); BD.position.setValue([0, 0]);
    emit(BD.property("ADBE Root Vectors Group"), [{ k: "rect", x: IX - 5, y: IY - 5, w: IW + 10, h: IH + 10, fill: null, key: 7 }, { k: "rect", x: IX - 17, y: IY - 17, w: IW + 34, h: IH + 34, fill: null, key: 2.2 }], "key");
    var FB = solid(SH, P + "_FIBRES", [0, 0, 0]); noise(FB, { contrast: 420, brightness: -150, sw: 300, sh: 5, complexity: 3, rot: 28 }); FB.blendingMode = BlendingMode.SCREEN; FB.opacity.setValue(16);
    var F2 = solid(SH, P + "_FIBRES2", [0, 0, 0]); noise(F2, { contrast: 420, brightness: -160, sw: 260, sh: 4, complexity: 3, rot: -52 }); F2.blendingMode = BlendingMode.SCREEN; F2.opacity.setValue(12);
    var PM = solid(SH, P + "_WASHI", [.5, .5, .5]); noise(PM, { contrast: 70, scale: 120, complexity: 5 }); PM.blendingMode = BlendingMode.OVERLAY; PM.opacity.setValue(12);
    var AG = solid(SH, P + "_AGE", [.62, .47, .3]); var am = AG.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
    am.property("ADBE Mask Shape").setValue(poly([[34, 34], [SHW - 34, 34], [SHW - 34, SHH - 34], [34, SHH - 34]])); am.property("ADBE Mask Feather").setValue([90, 90]); am.inverted = true;
    AG.blendingMode = BlendingMode.MULTIPLY; AG.opacity.setValue(30);
    return { print: IL, border: BD }; }

  // ---- drawings (image-area coordinates, 908 x 1600)
  // a landscape (the title, and the same key block reprinted at night for the end): sky, mountain with paper snow, sun or moon, mist bands,
  // banded sea with foam left as paper, a pine crossing the frame
  function mountainNodes(pal) { return [
      { k: "poly", pts: [[-30, 1010], [110, 880], [230, 760], [330, 640], [350, 618], [378, 650], [404, 612], [430, 662], [458, 616], [486, 668], [512, 620], [540, 650], [568, 602],
        [650, 690], [760, 800], [940, 930], [940, 1010]], fill: pal.mountain, key: 0 },
      { k: "line", pts: [[-30, 1010], [110, 880], [230, 760], [330, 640], [395, 540], [430, 488], [462, 470], [500, 500], [560, 580], [650, 690], [760, 800], [940, 930]], key: 3.4 }]; }
  function mistNodes(c) { return [{ k: "smooth", pts: [[30, 880], [200, 858], [480, 852], [700, 864], [740, 884], [700, 904], [420, 912], [160, 906]], fill: c, key: 0 },
    { k: "smooth", pts: [[300, 960], [520, 940], [800, 944], [960, 958], [960, 990], [760, 1000], [480, 996], [320, 984]], fill: c, key: 0 },
    { k: "smooth", pts: [[-40, 700], [120, 684], [300, 690], [360, 704], [300, 718], [100, 722]], fill: c, key: 0 }]; }
  function seaNodes(pal) { var n = [{ k: "rect", x: -10, y: 1010, w: IW + 20, h: IH - 1000, fill: pal.sea, key: 0 }];
    for (var r = 0; r < 6; r++) { var y = 1080 + r * 92 + r * r * 4, pts = [];
      for (var x = -40; x <= IW + 40; x += 76) pts.push([x, y + Math.sin(x * .021 + r * 1.7) * (8 + r * 2)]);
      n.push({ k: "sline", pts: pts, sw: 3 + r * .8, sc: PALETTE.paper, key: 0 }); }
    return n; }
  function padNodes(x, y, s, c) { var p = [], k; for (k = 0; k <= 12; k++) { var a = Math.PI * (1 - k / 12), r = (k % 2) ? 1 : .9; p.push([x + Math.cos(a) * 100 * s * r, y - Math.sin(a) * 44 * s * r]); }
    var n = [{ k: "poly", pts: p, fill: c, key: 2.6 }];
    for (k = 1; k < 12; k += 2) { var a2 = Math.PI * (1 - k / 12); n.push({ k: "line", pts: [[x + Math.cos(a2) * 60 * s, y - Math.sin(a2) * 24 * s], [x + Math.cos(a2) * 92 * s, y - Math.sin(a2) * 40 * s]], key: 1.6 }); }
    return n; }
  function pineNodes(pal) { var T = pal.trunk, n = [{ k: "smooth", pts: [[836, 1640], [930, 1640], [880, 1400], [800, 1160], [700, 960], [640, 860], [610, 874], [668, 980], [760, 1180], [820, 1410]], fill: T, key: 3.4 },
      { k: "sline", pts: [[780, 1150], [660, 1110], [540, 1124]], sw: 20, sc: T, key: 0 }, { k: "sline", pts: [[720, 1010], [600, 980], [470, 1000]], sw: 18, sc: T, key: 0 },
      { k: "sline", pts: [[650, 880], [740, 800], [860, 780]], sw: 16, sc: T, key: 0 }, { k: "sline", pts: [[830, 1380], [900, 1330]], sw: 16, sc: T, key: 0 }];
    return n.concat(padNodes(520, 1126, 1.6, pal.pine)).concat(padNodes(460, 1002, 1.35, pal.pine)).concat(padNodes(840, 786, 1.25, pal.pine))
      .concat(padNodes(640, 870, 1.1, pal.pine)).concat(padNodes(890, 1334, 1, pal.pine)).concat(padNodes(700, 1160, 1, pal.pine)); }
  function birdNodes() { var n = [], b = [[160, 470], [214, 446], [250, 490]];
    for (var i = 0; i < b.length; i++) n.push({ k: "sline", pts: [[b[i][0] - 16, b[i][1] - 7], [b[i][0] - 6, b[i][1] - 3], [b[i][0], b[i][1]], [b[i][0] + 6, b[i][1] - 3], [b[i][0] + 16, b[i][1] - 7]], key: 3 });
    return n; }
  // the landscape view, printed block by block: key at k0 (or already printed), then each colour at its time
  function landscape(v, P, pal, tk, tc) { var C = v.ink, n = [];
    var SKY = bokashi(C, P + "_SKY", pal.sky, 0, pal.skyEnd, 30); if (tc) printIn(SKY, tc[0], .3);
    if (pal.glow) { var GL = bokashi(C, P + "_GLOW", pal.glow, 1000, 560, 30); if (tc) printIn(GL, tc[0] + .05, .3); }
    var SUN = block(C, P + "_SUN", [{ k: "circle", x: 640, y: 360, r: 84, fill: pal.sun }], REG.c); if (tc) printIn(SUN, tc[3], .26, [5, 4]);
    var MT = block(C, P + "_MOUNT", mountainNodes(pal), REG.a); if (tc) printIn(MT, tc[1], .3, [5, 4]);
    var SEA = block(C, P + "_SEA", seaNodes(pal), REG.b); if (tc) printIn(SEA, tc[2], .3, [-5, 4]);
    var SB = bokashi(C, P + "_SEADEEP", pal.deep, 1600, 1120, 22); if (tc) printIn(SB, tc[2] + .04, .3);
    var MI = block(C, P + "_MIST", mistNodes(pal.mist), REG.d); if (tc) printIn(MI, tc[4], .3, [5, -4]);
    var PI = block(C, P + "_PINE", pineNodes(pal), REG.e); if (tc) printIn(PI, tc[4] + .06, .28, [-5, 5]);
    inkTexture(C, P);
    var keyNodes = mountainNodes(pal).concat(pineNodes(pal)).concat([{ k: "line", pts: [[-10, 1010], [IW + 10, 1010]], key: 3 }]);
    if (pal.moon) keyNodes.push({ k: "circle", x: 640, y: 360, r: 84, fill: null, key: 3 });
    var K = keyLine(C, P + "_KEY", keyNodes); if (tk !== null && tk !== undefined) printIn(K, tk, .26, [4, 3]);
    var BI = keyLine(C, P + "_BIRDS", birdNodes()); BI.position.expression = EIGHTS + "value + [-time * 34, Math.sin(time * 5) * 3];";
    return { key: K }; }

  // the picture: a terrace in a garden; a traveller, a hanging scroll and a laptop on a lacquer table print in one by one, on their words
  function personNodes() { var R = PALETTE; return [
      { k: "line", pts: [[-118, -170], [-150, 0]], sw: 7, sc: R.brown, key: 0 },
      { k: "poly", pts: [[-66, -330], [66, -330], [96, 0], [-96, 0]], fill: R.indigo }, { k: "poly", pts: [[-66, -330], [-124, -196], [-96, -148], [-52, -250]], fill: R.indigo },
      { k: "poly", pts: [[66, -330], [124, -196], [96, -148], [52, -250]], fill: R.indigo }, { k: "rect", x: -70, y: -206, w: 140, h: 34, fill: R.beni },
      { k: "circle", x: -112, y: -152, r: 15, fill: R.flesh }, { k: "circle", x: 112, y: -152, r: 15, fill: R.flesh },
      { k: "line", pts: [[-30, -330], [0, -276], [30, -330]], key: 3 }, { k: "rect", x: -46, y: 0, w: 30, h: 16, fill: R.sumi }, { k: "rect", x: 16, y: 0, w: 30, h: 16, fill: R.sumi },
      { k: "ellipse", x: 0, y: -374, rx: 32, ry: 40, fill: R.flesh }, { k: "poly", pts: [[-122, -394], [0, -470], [122, -394], [0, -380]], fill: R.ochre },
      { k: "line", pts: [[-16, -370], [-5, -368]], key: 3 }, { k: "line", pts: [[5, -368], [16, -370]], key: 3 }, { k: "line", pts: [[-8, -350], [8, -350]], key: 2.4 }]; }
  function scrollNodes() { var R = PALETTE, n = [{ k: "rect", x: 560, y: 266, w: 200, h: 600, fill: R.greyGreen }, { k: "rect", x: 584, y: 300, w: 152, h: 520, fill: R.cream },
      { k: "rect", x: 546, y: 250, w: 228, h: 18, fill: R.brown }, { k: "rect", x: 550, y: 864, w: 220, h: 20, fill: R.brown }, { k: "line", pts: [[600, 250], [660, 196], [720, 250]], key: 2.4 }];
    var cols = [704, 676, 648, 620], lens = [[60, 40, 70, 30, 54], [40, 70, 50, 64], [70, 30, 60, 44, 36], [36, 52]];
    for (var c = 0; c < cols.length; c++) { var y = 330; for (var d = 0; d < lens[c].length; d++) { n.push({ k: "line", pts: [[cols[c], y], [cols[c] + 2, y + lens[c][d]]], key: 5 }); y += lens[c][d] + 22; } }
    n.push({ k: "rect", x: 600, y: 770, w: 30, h: 30, fill: R.beni, key: 0 }); return n; }
  function deviceNodes() { var R = PALETTE; return [
      { k: "poly", pts: [[500, 1150], [880, 1150], [900, 1182], [480, 1182]], fill: R.lacquer }, { k: "rect", x: 500, y: 1182, w: 22, h: 60, fill: R.lacquer }, { k: "rect", x: 858, y: 1182, w: 22, h: 60, fill: R.lacquer },
      { k: "rect", x: 600, y: 940, w: 200, h: 186, fill: R.sumi }, { k: "rect", x: 614, y: 954, w: 172, h: 158, fill: R.paleBlue, key: 0 },
      { k: "line", pts: [[634, 990], [740, 990]], sw: 9, sc: R.paper, key: 0 }, { k: "line", pts: [[634, 1024], [760, 1024]], sw: 7, sc: R.paper, key: 0 }, { k: "line", pts: [[634, 1056], [710, 1056]], sw: 7, sc: R.paper, key: 0 },
      { k: "poly", pts: [[588, 1126], [812, 1126], [834, 1150], [566, 1150]], fill: R.grey }]; }
  function gardenNodes() { var R = PALETTE, n = [{ k: "smooth", pts: [[-30, 720], [120, 612], [260, 646], [380, 584], [520, 626], [660, 566], [800, 604], [950, 584], [950, 740], [-30, 740]], fill: [.72, .77, .8], key: 0 },
      { k: "smooth", pts: [[-30, 1070], [60, 1030], [150, 1050], [240, 1020], [340, 1048], [440, 1016], [560, 1046], [660, 1018], [780, 1044], [940, 1024], [940, 1190], [-30, 1190]], fill: R.green, key: 3 },
      { k: "rect", x: -10, y: 1180, w: IW + 20, h: IH - 1170, fill: [.86, .74, .53], key: 0 }];
    for (var k = 0; k < 16; k++) n.push({ k: "line", pts: [[k * 82, 1182], [k * 82 - 240, 1610]], key: 1.8 });
    n.push({ k: "line", pts: [[-10, 1182], [IW + 10, 1182]], key: 3.4 }); return n; }

  // ---- buildScene: the shared test scene as seven views on one handscroll. comp = an empty 1080 x 1920 comp.
  function buildScene(comp, scene, opts) {
    fontOK(); var P = opts.prefix || "UKIYO", A = opts.assets, B = scene.beat, W = comp.width, H = comp.height, notes = [], WL = scene.wordList, D = comp.duration, fps = comp.frameRate;
    AESLib.clearOwned(comp, P);
    var R = PALETTE, cx = IW / 2, comps = [];
    var SC = app.project.items.addComp(P + "_SCROLL", SCW, H, 1, D, fps); SC.bgColor = R.mount;
    // the camera: slides right to left along the scroll at each beat (0.34 s, on ones, motion blur)
    var bt = [B.picture.t0, B.input.t0, B.number.t0, B.line.t0, B.carry.t0, B.end.t0], SL = .34, slides = [];
    for (var s = 0; s < bt.length; s++) slides.push([bt[s] - .12, bt[s] - .12 + SL]);
    function shown(i) { var a = i === 0 ? 0 : slides[i - 1][0] - .04, b = i === NS - 1 ? D : slides[i][1] + .04; return [a, b]; }
    var V = []; for (var vi = 0; vi < NS; vi++) { V.push(view(P + "V" + vi, vi, D, fps)); }

    // 1. title: the opening print. Its key block is already printed at frame 0; sky, mountain, sea, sun, mist and pine land one by one.
    // The cartouche sits on the sky with the series line; the vertical cartouche reads "test print"; the seal stamps as the line ends.
    var T0 = B.title.t0, tw = wordsIn(WL, T0, B.title.t1), PD = P + "V0";
    var dayPal = { sky: R.prussian, skyEnd: 600, sun: R.beni, mountain: R.paleBlue, sea: R.paleBlue, deep: R.prussian, mist: R.mist, trunk: R.brown, pine: R.green };
    landscape(V[0], PD, dayPal, null, [T0 + .08, T0 + .2, T0 + .3, T0 + .42, T0 + .52]);
    slip(V[0].ink, PD + "_SLIP", 36, 64, 536, 178);
    var TT = txt(V[0].ink, PD + "_TITLE", B.title.context, { size: 92, x: 304, y: 150, maxW: 470 }); printIn(TT, T0, .22, [4, 3], null, 270, 5);
    slip(V[0].ink, PD + "_TAB", 36, 236, 536, 70, R.pink);
    var TH = txt(V[0].ink, PD + "_HERO", B.title.hero.toUpperCase(), { size: 30, tracking: 160, x: 304, y: 272, maxW: 480 }); printIn(TH, tw[2] - .1, .26, [4, 3], null, 270, 5);
    slip(V[0].ink, PD + "_VSLIP", 796, 64, 76, 320);
    txt(V[0].ink, PD + "_VTEXT", vertical("試し刷り"), { size: 50, leading: 66, x: 834, y: 222 });
    var ts = seal(V[0].ink, PD + "_SEAL", "試", 834, 432, 66); stamp(ts.box, tw[5] + .02); stamp(ts.ch, tw[5] + .02);
    inkSpecks(V[0].ink, PD);

    // 2. picture: the garden prints as the sheet arrives; the traveller, the scroll and the laptop each print on their word (key, then colour);
    // on "picture" the view's vertical cartouche drops in and its seal stamps: the full stop of the view
    var P0 = B.picture.t0, pw = wordsIn(WL, P0, B.picture.t1), PP = P + "V1", C1 = V[1].ink;
    var SK1 = bokashi(C1, PP + "_SKY", R.paleBlue, 0, 560, 24); printIn(SK1, P0 - .1, .3);
    var GD = block(C1, PP + "_GARDEN", gardenNodes(), REG.a); printIn(GD, P0 - .02, .3, [5, 4]);
    var MI1 = block(C1, PP + "_MIST", [{ k: "smooth", pts: [[-40, 712], [200, 690], [560, 696], [940, 716], [940, 742], [500, 748], [100, 744]], fill: R.mist, key: 0 }], REG.d); printIn(MI1, P0 + .06, .3);
    var PE = block(C1, PP + "_PERSON", personNodes(), REG.b, [230, 1262]); printIn(PE, pw[0] + .12, .26, [-5, 4]);
    var DO = block(C1, PP + "_SCROLLART", scrollNodes(), REG.c); printIn(DO, pw[1] + .12, .26, [5, 4]);
    var DV = block(C1, PP + "_DEVICE", deviceNodes(), REG.e); printIn(DV, pw[2] + .12, .26, [-4, 5]);
    inkTexture(C1, PP);
    var GK = keyLine(C1, PP + "_GARDENKEY", gardenNodes()); printIn(GK, P0 - .06, .26);
    var PK = keyLine(C1, PP + "_PERSONKEY", personNodes(), [230, 1262]); printIn(PK, pw[0], .24, [4, 3]);
    var DK = keyLine(C1, PP + "_SCROLLKEY", scrollNodes()); printIn(DK, pw[1], .24, [4, 3]);
    var VK = keyLine(C1, PP + "_DEVICEKEY", deviceNodes()); printIn(VK, pw[2], .24, [4, 3]);
    var VS1 = slip(C1, PP + "_VSLIP", 40, 60, 76, 250); dropIn(VS1, pw[3]);
    var VT1 = txt(C1, PP + "_VTEXT", vertical("一枚"), { size: 52, leading: 70, x: 78, y: 184 }); dropIn(VT1, pw[3]);
    var s1 = seal(C1, PP + "_SEAL", "景", 78, 352, 56); stamp(s1.box, pw[4] + .05); stamp(s1.ch, pw[4] + .05);
    inkSpecks(C1, PP);

    // 3 and 6. the real frame as a print (an okubi-e: a big head on a bokashi ground), cut into blocks by tools/blocks.mjs. Each block is a
    // flat ink (a solid) whose LUMA matte is that block's matte video; the colour lands under a baren sweep while its matte slides into
    // register. The carry reprints the same key block in a second palette: the alternate impression.
    function portrait(v, PX, t0, pal, order, keyAt) { var C = v.ink, out = {};
      var GR = bokashi(C, PX + "_GROUND", pal.ground, 0, 980, 30); printIn(GR, order.ground, .34);
      var names = ["flesh", "beard", "cloth", "hair"], regs = [REG.d, REG.c, REG.b, REG.a];
      for (var b = 0; b < names.length; b++) { var nm = names[b]; if (!pal[nm]) continue;
        var M = C.layers.add(AESLib.importFile(A[nm])); M.name = PX + "_" + nm.toUpperCase() + "_MATTE"; M.startTime = t0; M.timeRemapEnabled = true; M.outPoint = D; M.position.setValue([cx + regs[b][0], IH / 2 + regs[b][1]]);   // remapped: holds its last frame
        var S = solid(C, PX + "_" + nm.toUpperCase(), pal[nm]); S.setTrackMatte(M, TrackMatteType.LUMA); M.enabled = false;
        printIn(S, order[nm], .3, [6, 5], M); out[nm] = S; }
      inkTexture(C, PX);
      var KM = C.layers.add(AESLib.importFile(A.key)); KM.name = PX + "_KEY_MATTE"; KM.startTime = t0; KM.timeRemapEnabled = true; KM.outPoint = D; KM.position.setValue([cx, IH / 2]);
      var K = solid(C, PX + "_KEY", R.sumi); K.setTrackMatte(KM, TrackMatteType.LUMA); KM.enabled = false;
      if (keyAt !== null) printIn(K, keyAt, .28, [5, 4], KM);
      out.key = K; return out; }
    var I0 = B.input.t0, I1 = B.input.t1, PI3 = P + "V2";
    portrait(V[2], PI3, I0, { ground: R.prussian, flesh: R.flesh, beard: R.stubble, cloth: R.indigo, hair: R.sumi },
      { ground: I0 + .6, flesh: I0 + .18, beard: I0 + .38, cloth: I0 + .48, hair: I0 + .28 }, I0 + .02);
    var VS2 = slip(V[2].ink, PI3 + "_VSLIP", 40, 60, 76, 320); dropIn(VS2, I0 + .8);
    var VT2 = txt(V[2].ink, PI3 + "_VTEXT", vertical("似顔絵"), { size: 52, leading: 70, x: 78, y: 220 }); dropIn(VT2, I0 + .8);
    var s2 = seal(V[2].ink, PI3 + "_SEAL", "試", 78, 424, 56); stamp(s2.box, I0 + .98); stamp(s2.ch, I0 + .98);
    inkSpecks(V[2].ink, PI3);
    var C0 = B.carry.t0, cw = wordsIn(WL, C0, B.carry.t1), PC = P + "V5";
    portrait(V[5], PC, C0, { ground: R.beni, beard: R.mauve, cloth: R.greyGreen, hair: R.sumi },
      { ground: cw[3] - .02, hair: cw[3] + .1, cloth: cw[3] + .22, beard: cw[3] + .34 }, null);
    var VS5 = slip(V[5].ink, PC + "_VSLIP", 40, 60, 76, 320); var VT5 = txt(V[5].ink, PC + "_VTEXT", vertical("似顔絵"), { size: 52, leading: 70, x: 78, y: 220 });
    var s5 = seal(V[5].ink, PC + "_SEAL", "再", 78, 424, 56); stamp(s5.box, cw[5] + .02); stamp(s5.ch, cw[5] + .02);
    inkSpecks(V[5].ink, PC);

    // 4. number: night rain. A sumi bokashi sky, a far shore, rain in two sets of fine lines at slightly different angles (on twelves);
    // the count prints in a cream cartouche on twelves, FRAMES lands in the pink tab on its word, and the seal stamps on "counted"
    var N0 = B.number.t0, nw = wordsIn(WL, N0, B.number.t1), PN = P + "V3", C3 = V[3].ink, val = B.number.value;
    var NS1 = bokashi(C3, PN + "_SKY", [.2, .2, .25], 0, 820, 30); printIn(NS1, N0 - .1, .3);
    var NWB = bokashi(C3, PN + "_WATER", R.paleBlue, 1600, 1060, 26); printIn(NWB, N0 - .04, .3);
    var SHO = block(C3, PN + "_SHORE", [{ k: "smooth", pts: [[-30, 1010], [80, 990], [160, 1002], [260, 972], [380, 996], [520, 980], [640, 996], [780, 970], [940, 990], [940, 1060], [-30, 1060]], fill: [.42, .45, .5], key: 0 }], REG.a);
    printIn(SHO, N0, .3, [5, 4]);
    inkTexture(C3, PN);
    function rain(name, ang, gap, dy, op) { var L = C3.layers.addShape(); L.name = name; var g = L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").property("ADBE Vectors Group");
      var a = ang * Math.PI / 180, len = 150; g.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(poly([[0, 0], [Math.cos(a) * len, Math.sin(a) * len]], false));
      var st = g.addProperty("ADBE Vector Graphic - Stroke"); st.property("ADBE Vector Stroke Color").setValue([.3, .3, .35]); st.property("ADBE Vector Stroke Width").setValue(1.6);
      var r1 = g.addProperty("ADBE Vector Filter - Repeater"); r1.property("ADBE Vector Repeater Copies").setValue(50); r1.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([gap, 0]);
      var gg = L.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group");
      var r2 = gg.addProperty("ADBE Vector Filter - Repeater"); r2.property("ADBE Vector Repeater Copies").setValue(12);
      r2.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([dy * .3, dy]);
      L.anchorPoint.setValue([0, 0]); L.position.setValue([-600, -dy]); L.opacity.setValue(op);
      L.position.expression = "posterizeTime(12); value + [0, (time * 900) % " + dy + "];"; return L; }
    var RA = rain(PN + "_RAIN_A", 100, 28, 180, 70), RB = rain(PN + "_RAIN_B", 104, 41, 230, 45);
    printIn(RA, N0 + .1, .3); printIn(RB, N0 + .16, .3);
    var NSL = slip(C3, PN + "_SLIP", 154, 430, 600, 440); dropIn(NSL, N0 - .04);
    var NU = txt(C3, PN + "_NUM", String(val), { size: 290, x: cx, y: 652 });
    NU.anchorPoint.expression = "var r = sourceRectAtTime(time, false); [r.left + r.width / 2, r.top + r.height / 2];";
    var counts = [], cn = 8; for (var c2 = 0; c2 <= cn; c2++) { var e = 1 - Math.pow(1 - c2 / cn, 2.2); counts.push(String(Math.round(val * e))); }
    AESLib.bakeText(NU, counts, 12, N0);
    var NTB = slip(C3, PN + "_TAB", 154, 862, 600, 86, R.pink); printIn(NTB, nw[1] - .04, .24, [4, 3], null, 270, 5);
    var NF = txt(C3, PN + "_FRAMES", B.number.label.toUpperCase(), { size: 46, tracking: 500, x: cx + 12, y: 906 }); printIn(NF, nw[1], .26, [4, 3], null, 270, 5);
    var s3 = seal(C3, PN + "_SEAL", "数", 700, 800, 70); stamp(s3.box, nw[2] + .04); stamp(s3.ch, nw[2] + .04);
    inkSpecks(C3, PN);

    // 5. line: a plum branch crosses the frame from the top left (extreme foreground); every word prints on its slip as it is said
    var L0 = B.line.t0, lw = wordsIn(WL, L0, B.line.t1), PL = P + "V4", C4 = V[4].ink;
    var LS = bokashi(C4, PL + "_SKY", R.pink, 0, 560, 28); printIn(LS, L0 - .1, .3);
    var LG = bokashi(C4, PL + "_GROUND", R.greyGreen, 1600, 1330, 24); printIn(LG, L0 - .04, .3);
    var BR = [.24, .17, .15], plum = [{ k: "smooth", pts: [[-40, 40], [160, 150], [330, 290], [480, 420], [620, 500], [700, 530], [692, 556], [600, 532], [450, 456], [300, 332], [130, 200], [-40, 110]], fill: BR, key: 3.4 },
      { k: "sline", pts: [[230, 220], [300, 110], [400, 60]], sw: 15, sc: BR, key: 0 }, { k: "sline", pts: [[470, 430], [590, 360], [700, 360]], sw: 13, sc: BR, key: 0 },
      { k: "sline", pts: [[120, 170], [100, 300], [150, 400]], sw: 13, sc: BR, key: 0 }, { k: "sline", pts: [[600, 520], [680, 600], [700, 680]], sw: 11, sc: BR, key: 0 }];
    var bl = [[400, 62], [320, 110], [700, 360], [610, 362], [150, 400], [104, 300], [700, 680], [690, 600], [560, 470], [420, 380], [250, 240], [790, 520], [470, 180], [60, 200]];
    for (var q = 0; q < bl.length; q++) { var w5 = q % 3 === 2 ? R.paper : R.beni; for (var pe = 0; pe < 5; pe++) { var an = pe * Math.PI * 2 / 5 + q;
      plum.push({ k: "circle", x: bl[q][0] + Math.cos(an) * 17, y: bl[q][1] + Math.sin(an) * 17, r: 14, fill: w5, key: 1.8 }); } plum.push({ k: "circle", x: bl[q][0], y: bl[q][1], r: 6, fill: R.ochre, key: 0 }); }
    var PB = block(C4, PL + "_PLUM", plum, REG.c); printIn(PB, L0 - .02, .3, [5, 4]);
    inkTexture(C4, PL);
    var PBK = keyLine(C4, PL + "_PLUMKEY", plum); printIn(PBK, L0 - .08, .26);
    var LSL = slip(C4, PL + "_SLIP", 104, 740, 700, 560); dropIn(LSL, L0 - .04);
    var rows = [["Every", "word"], ["I", "say"], ["gets", "typed."]], ry = [890, 1030, 1170], wi = 0, LZ = 96;
    for (var r = 0; r < rows.length; r++) { var full = rows[r].join(" "), fwid = inkWidth(C4, full, LZ), x0 = cx - fwid / 2;
      for (var k = 0; k < rows[r].length; k++) { var pre = rows[r].slice(0, k + 1).join(" "), ww = inkWidth(C4, rows[r][k], LZ), xc = x0 + inkWidth(C4, pre, LZ) - ww / 2;
        var WT = txt(C4, PL + "_W" + wi, rows[r][k], { size: LZ, x: xc, y: ry[r] }); printIn(WT, lw[Math.min(wi, lw.length - 1)] - .02, .22, [4, 3], null, 270, 5); wi++; } }
    var s4 = seal(C4, PL + "_SEAL", "詞", 744, 1252, 52); stamp(s4.box, lw[5] + .2); stamp(s4.ch, lw[5] + .2);
    inkSpecks(C4, PL);

    // 7. end: the title's key block reprinted at night (moon for sun, indigo sea): the bookend. "That's the test." prints in its cartouche,
    // the seal stamps on "test", then the print washes back to paper and only the seal is left.
    var E0 = B.end.t0, E1 = B.end.t1, ew = wordsIn(WL, E0, E1), PE7 = P + "V6", C6 = V[6].ink;
    var nightPal = { sky: R.night, skyEnd: 820, glow: R.beni, sun: R.paper, moon: true, mountain: [.42, .5, .62], sea: R.indigo, deep: R.night, mist: [.86, .64, .62], trunk: [.3, .2, .14], pine: R.darkGreen };
    landscape(V[6], PE7, nightPal, null, [E0 - .04, E0 + .04, E0 + .1, E0 + .16, E0 + .22]);
    var ES = slip(C6, PE7 + "_SLIP", 36, 64, 536, 178); dropIn(ES, E0 - .06);
    var ET = txt(C6, PE7 + "_TITLE", B.end.text, { size: 80, x: 304, y: 150, maxW: 470 }); printIn(ET, ew[0], .4, [4, 3], null, 270, 5);
    var EB = slip(C6, PE7 + "_TAB", 36, 236, 536, 70, R.pink); dropIn(EB, E0);
    txt(C6, PE7 + "_HERO", B.title.context.toUpperCase(), { size: 30, tracking: 300, x: 304, y: 272, maxW: 480 });
    slip(C6, PE7 + "_VSLIP", 796, 64, 76, 320); txt(C6, PE7 + "_VTEXT", vertical("試し刷り"), { size: 50, leading: 66, x: 834, y: 222 });
    inkSpecks(C6, PE7);

    // sheets: ink on washi; the end sheet's print washes away, its big seal (on the sheet, above the print) stays
    for (var f = 0; f < NS; f++) comps.push(finish(V[f], P + "V" + f));
    var wash = [{ t: E1 - .5, v: 100, o: 30 }, { t: E1 - .1, v: 0, i: 60 }];
    keys(comps[6].print.opacity, wash); keys(comps[6].border.opacity, wash);
    var es = seal(V[6].sh, PE7 + "_BIGSEAL", "試", SHW / 2, 1290, 150); stamp(es.box, ew[2]); stamp(es.ch, ew[2]);

    // the scroll: mount paper with its own fibres per sheet slot (joins between slots read as the mount's seams), sheets with a soft shadow
    for (var m = 0; m < NS; m++) { var sh = shown(m);
      var MT = solid(SC, P + "_MOUNTTEX" + m, [.5, .5, .5], STEP, H, [X(m), H / 2]); noise(MT, { contrast: 90, sw: 420, sh: 30, complexity: 4, rot: 4 });
      MT.blendingMode = BlendingMode.OVERLAY; MT.opacity.setValue(18); span(MT, sh[0], sh[1]);
      var SLY = SC.layers.add(V[m].sh); SLY.name = P + "_SHEETL" + m; SLY.position.setValue([X(m), H / 2]); span(SLY, sh[0], sh[1]);
      try { var ds = fx(SLY, "ADBE Drop Shadow"); ds.property("Distance").setValue(4); ds.property("Softness").setValue(16); ds.property("Opacity").setValue(90); } catch (e5) { notes.push("sheet shadow: " + e5.toString()); } }

    // main comp: the scroll under the camera, then subtitles (horizontal cartouches with a seal, fixed to the screen)
    solid(comp, P + "_MOUNT", R.mount);
    var CAM = comp.layers.add(SC); CAM.name = P + "_CAMERA"; CAM.position.setValue([W / 2, H / 2]);
    var ak = [{ t: 0, v: [X(0), H / 2], o: "H" }];
    for (var c = 0; c < slides.length; c++) { ak.push({ t: slides[c][0], v: [X(c), H / 2], o: 80 }); ak.push({ t: slides[c][1], v: [X(c + 1), H / 2], i: 80, o: "H" }); }
    keys(CAM.anchorPoint, ak);
    keys(CAM.scale, [{ t: I0 + .3, v: [100, 100], o: 30 }, { t: slides[2][0], v: [104, 104], i: 30, o: 60 }, { t: slides[2][1], v: [100, 100], i: 60 }]);
    comp.motionBlur = true; comp.shutterAngle = 180; CAM.motionBlur = true;
    var caps = [[B.picture, "Three pieces build one picture."], [B.input, "Here’s a real frame from my video."], [B.carry, "Then one thing becomes the next."]];
    for (var cc = 0; cc < caps.length; cc++) { var cb = caps[cc][0], CY = 1716, a0 = cb.t0 + .1, a1 = cb.t1 - .16;
      var CT = txt(comp, P + "_CAP" + cc, caps[cc][1], { size: 42, x: W / 2 + 26, y: CY, maxW: 760 });
      var cr = CT.sourceRectAtTime(0, false), cwid = Math.min(760, cr.width) + 130;
      var CS = slip(comp, P + "_CAPSLIP" + cc, W / 2 - cwid / 2, CY - 44, cwid, 88); CS.moveAfter(CT);
      var cs = seal(comp, P + "_CAPSEAL" + cc, "語", W / 2 - cwid / 2 + 44, CY, 40);
      var lay = [CS, CT, cs.box, cs.ch];
      for (var li = 0; li < lay.length; li++) { span(lay[li], cb.t0, cb.t1); keys(lay[li].opacity, [{ t: a0, v: 0, o: "L" }, { t: a0 + .12, v: 100, i: "L", o: "H" }, { t: a1, v: 100, o: "L" }, { t: a1 + .14, v: 0, i: "L" }]); }
      printIn(CT, a0, .22, null, null, 270, 5); }

    var total = comp.numLayers + SC.numLayers; for (var t = 0; t < NS; t++) total += V[t].ink.numLayers + V[t].sh.numLayers;
    return { layers: total, notes: notes };
  }
  return { MIN: MIN, MED: MED, PALETTE: PALETTE, fontOK: fontOK, keys: keys, piece: piece, block: block, keyLine: keyLine, printIn: printIn, dropIn: dropIn, stamp: stamp,
    bokashi: bokashi, slip: slip, seal: seal, txt: txt, view: view, inkTexture: inkTexture, inkSpecks: inkSpecks, finish: finish, landscape: landscape, buildScene: buildScene };
})();
