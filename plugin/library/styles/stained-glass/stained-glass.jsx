// Stained glass style: brand-neutral ES3 helpers. No project mutation happens at load.
// Read styles/stained-glass/STYLE.md first. A leaded window in a dark stone hall, alive only where the sun touches it. The glass is drawn
// once (GLASS: flat jewel pieces, every piece stroked with a lead came, faces in brown grisaille), a LIGHT comp says where the sun is
// (white = lit), and LIT = GLASS luma-matted by LIGHT and multiplied by the sun's colour. In the ROOM the window is GLASS darkened and
// milky (unlit) with LIT added on top and glowing, LIT again corner-pinned and blurred onto the floor, and additive shafts between them.
// The main comp holds the ROOM as the camera (anchor and scale keys), the banderole captions and the crack flash.
// Adapted from Lemo-Opuscar's stained-glass style (MIT, LemoLab); see library/styles/LICENSE-lemo-opuscar.txt.
var AESStainedGlass = (function () {
  var CIN = "Cinzel", FELL = "IM FELL English";
  var C = { cobalt: [.125, .278, .69], cobaltD: [.086, .188, .494], sky: [.3, .46, .78], ruby: [.69, .118, .18], gold: [.878, .667, .165], green: [.184, .498, .235],
    murrey: [.455, .149, .31], flesh: [.70, .50, .38], fleshD: [.56, .34, .24], white: [.78, .82, .72], brown: [.29, .17, .10], lead: [.07, .063, .059],
    stone: [.20, .185, .17], stoneL: [.30, .28, .255], tablet: [.33, .305, .275], floor: [.15, .135, .12], mortar: [.085, .075, .07],
    parch: [.902, .839, .682], parchD: [.72, .62, .45], ink: [.16, .11, .07], iron: [.05, .045, .04] };
  // the room (all in ROOM px): one lancet, a rose above it, a sill, an incised tablet, a flagstone floor
  var R = { w: 1800, h: 3700, cx: 900, rose: [900, 900], roseR: 230, lx: 580, ly: 1200, lw: 640, lh: 1500, tab: [420, 2820, 960, 280], floorY: 3150 };
  var SPR = Math.round(R.lw * .866), MC = [320, 860], MR = 280, MI = 258;      // spring line of the arch; medallion centre / ring / inner radius (lancet px)
  var STEP = "posterizeTime(8); ";                                            // figures and glass move at 8 fps; light and camera on ones
  function fontOK() { AESLib.font(CIN, "Bold"); AESLib.font(FELL, "Regular"); AESLib.font(FELL, "Italic"); return true; }

  // ---- keys: list = [{ t, v, i, o }]; i / o are an influence (eased), "L" linear or "H" hold. One setValuesAtTimes call.
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
  function span(L, t0, t1) { L.inPoint = t0; L.outPoint = t1; return L; }
  function solid(comp, name, color, w, h, pos) { var L = comp.layers.addSolid(color, name, w || comp.width, h || comp.height, 1); if (pos) L.position.setValue(pos); return L; }
  function comp(name, w, h, D, fps) { var c = app.project.items.addComp(name, w, h, 1, D, fps); c.bgColor = [0, 0, 0]; return c; }
  function nest(into, item, name, pos) { var L = into.layers.add(item); L.name = name; L.anchorPoint.setValue([0, 0]); L.position.setValue(pos || [0, 0]); return L; }

  // ---- shapes. node = { k: "poly"|"line"|"rect"|"circle"|"ellipse"|"shape"|"group", ..., fill (rgb or null), sw, sc (rgb), so (stroke opacity),
  // dash [d, g] (round caps: dash 0 = pearls), id, pivot, rot, kids }. Every glass piece carries its lead as its stroke.
  var KAPPA = .5523;
  function poly(pts, closed) { var s = new Shape(); s.vertices = pts; s.closed = closed !== false; return s; }
  function ell(cx, cy, rx, ry) { var a = KAPPA * rx, b = KAPPA * ry, s = new Shape(); s.vertices = [[cx, cy - ry], [cx + rx, cy], [cx, cy + ry], [cx - rx, cy]];
    s.inTangents = [[-a, 0], [0, -b], [a, 0], [0, b]]; s.outTangents = [[a, 0], [0, b], [-a, 0], [0, -b]]; s.closed = true; return s; }
  function shapeOf(n) { if (n.k === "circle") return ell(n.x, n.y, n.r, n.r);
    if (n.k === "ellipse") return ell(n.x, n.y, n.rx, n.ry);
    if (n.k === "rect") return poly([[n.x, n.y], [n.x + n.w, n.y], [n.x + n.w, n.y + n.h], [n.x, n.y + n.h]]);
    if (n.k === "shape") return n.shape;
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
      if (n.sw) { var st = v.addProperty("ADBE Vector Graphic - Stroke"); st.property("ADBE Vector Stroke Color").setValue(n.sc || C.lead);
        st.property("ADBE Vector Stroke Width").setValue(n.sw); st.property("ADBE Vector Stroke Line Join").setValue(2); st.property("ADBE Vector Stroke Line Cap").setValue(2);
        if (n.so !== undefined) st.property("ADBE Vector Stroke Opacity").setValue(n.so);
        if (n.dash) { var ds = st.property("ADBE Vector Stroke Dashes"); ds.addProperty("ADBE Vector Stroke Dash 1").setValue(n.dash[0]); ds.addProperty("ADBE Vector Stroke Gap 1").setValue(n.dash[1]); } }
      if (n.fill && n.k !== "line") v.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(n.fill); } }
  function piece(comp, name, nodes, pos) { var L = comp.layers.addShape(); L.name = name; emit(L.property("ADBE Root Vectors Group"), nodes);
    L.anchorPoint.setValue([0, 0]); L.position.setValue(pos || [0, 0]); return L; }
  function groupT(L, path) { var gr = L.property("ADBE Root Vectors Group");
    for (var i = 0; i < path.length; i++) { gr = gr.property(path[i]); if (i < path.length - 1) gr = gr.property("ADBE Vectors Group"); }
    return gr.property("ADBE Vector Transform Group"); }
  // the lancet outline (an equilateral pointed arch) inset by d px (negative d = outset), offset by o
  function lancetPts(d, o, w, h, spr) { w = w || R.lw; h = h || R.lh; spr = spr || SPR; o = o || [0, 0];
    var r = w - d, t1 = Math.acos((w / 2) / r), pts = [[d, h - d], [d, spr]], n = 14, i, t;
    for (i = 1; i <= n; i++) { t = t1 * i / n; pts.push([w - r * Math.cos(t), spr - r * Math.sin(t)]); }
    for (i = n - 1; i >= 0; i--) { t = t1 * i / n; pts.push([r * Math.cos(t), spr - r * Math.sin(t)]); }
    pts.push([w - d, h - d]); for (i = 0; i < pts.length; i++) pts[i] = [pts[i][0] + o[0], pts[i][1] + o[1]]; return pts; }
  function arcPts(cx, cy, r, a0, a1, n) { var p = []; for (var i = 0; i <= n; i++) { var a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; p.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return p; }
  function seeded(seed) { var s = seed; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

  // ---- glass pieces (lancet px). Grisaille = thin translucent brown strokes painted on a piece.
  function grisaille(pts, w) { return { k: "line", pts: pts, sw: w || 3, sc: C.brown, so: 85 }; }
  function faceNodes(x, y, s) { s = s || 1; var e = 9 * s;   // almond eyes, heavy lids, brows flowing into the nose, expression in brows and mouth
    return [{ k: "ellipse", x: x, y: y, rx: 30 * s, ry: 37 * s, fill: C.flesh, sw: 5 },
      { k: "poly", pts: [[x - 33 * s, y - 4 * s], [x - 30 * s, y - 34 * s], [x, y - 46 * s], [x + 30 * s, y - 34 * s], [x + 33 * s, y - 4 * s], [x + 22 * s, y - 24 * s], [x - 22 * s, y - 24 * s]], fill: C.brown, sw: 5 },
      grisaille([[x - 20 * s, y - 13 * s], [x - 8 * s, y - 16 * s], [x - 2 * s, y - 10 * s], [x - 1 * s, y + 8 * s], [x - 6 * s, y + 12 * s]], 3 * s),
      grisaille([[x + 20 * s, y - 13 * s], [x + 8 * s, y - 16 * s], [x + 3 * s, y - 10 * s]], 3 * s),
      { k: "ellipse", x: x - 12 * s, y: y - 4 * s, rx: e * .9, ry: e * .45, fill: C.brown }, { k: "ellipse", x: x + 12 * s, y: y - 4 * s, rx: e * .9, ry: e * .45, fill: C.brown },
      grisaille([[x - 9 * s, y + 21 * s], [x, y + 23 * s], [x + 9 * s, y + 21 * s]], 3 * s)]; }
  function personNodes(x, y) {   // standing figure, base at (x, y): ruby tunic, murrey legs, gold belt, one arm on a pivot
    var legs = [{ k: "poly", pts: [[x - 34, y - 120], [x - 4, y - 120], [x - 8, y], [x - 38, y]], fill: C.murrey, sw: 6 }, { k: "poly", pts: [[x + 4, y - 120], [x + 34, y - 120], [x + 38, y], [x + 8, y]], fill: C.murrey, sw: 6 }];
    var body = [{ k: "poly", pts: [[x - 52, y - 252], [x + 52, y - 252], [x + 70, y - 108], [x - 70, y - 108]], fill: C.ruby, sw: 7 },
      grisaille([[x - 18, y - 236], [x - 26, y - 116]], 3), grisaille([[x + 16, y - 236], [x + 24, y - 116]], 3), grisaille([[x, y - 230], [x + 2, y - 112]], 3),
      { k: "rect", x: x - 58, y: y - 176, w: 116, h: 16, fill: C.gold, sw: 5 },
      { k: "poly", pts: [[x - 50, y - 246], [x - 74, y - 236], [x - 86, y - 160], [x - 66, y - 156]], fill: C.ruby, sw: 6 }, { k: "circle", x: x - 78, y: y - 148, r: 13, fill: C.flesh, sw: 5 },
      { k: "group", id: "AR", pivot: [x + 54, y - 240], kids: [{ k: "poly", pts: [[x + 50, y - 246], [x + 74, y - 236], [x + 86, y - 160], [x + 66, y - 156]], fill: C.ruby, sw: 6 }, { k: "circle", x: x + 78, y: y - 148, r: 13, fill: C.flesh, sw: 5 }] },
      { k: "rect", x: x - 12, y: y - 268, w: 24, h: 20, fill: C.flesh, sw: 5 }];
    return legs.concat(body).concat(faceNodes(x, y - 304, 1.05)); }
  function documentNodes(x, y) { var n = [{ k: "rect", x: x - 58, y: y - 74, w: 116, h: 148, fill: C.white, sw: 6 }, { k: "poly", pts: [[x + 22, y - 74], [x + 58, y - 38], [x + 22, y - 38]], fill: C.gold, sw: 5 }];
    for (var r = 0; r < 6; r++) n.push(grisaille([[x - 40, y - 46 + r * 20], [x + (r === 5 ? 0 : 38), y - 46 + r * 20]], 4)); return n; }
  function deviceNodes(x, y) { var n = [{ k: "rect", x: x - 80, y: y - 112, w: 160, h: 106, fill: C.gold, sw: 6 }, { k: "rect", x: x - 66, y: y - 100, w: 132, h: 82, fill: C.white, sw: 5 },
    { k: "poly", pts: [[x - 98, y - 6], [x + 98, y - 6], [x + 112, y + 14], [x - 112, y + 14]], fill: C.murrey, sw: 6 }];
    for (var r = 0; r < 4; r++) n.push(grisaille([[x - 50, y - 82 + r * 17], [x + (r === 3 ? 10 : 50), y - 82 + r * 17]], 4)); return n; }
  function sunNodes(x, y, r) { var n = [{ k: "circle", x: x, y: y, r: r, fill: C.cobalt, sw: 7 }];
    for (var a = 0; a < 360; a += 30) { var t = a * Math.PI / 180, u = (a + 15) * Math.PI / 180, v = (a - 15) * Math.PI / 180;
      n.push({ k: "poly", pts: [[x + Math.cos(v) * r * .46, y + Math.sin(v) * r * .46], [x + Math.cos(t) * r * .86, y + Math.sin(t) * r * .86], [x + Math.cos(u) * r * .46, y + Math.sin(u) * r * .46]], fill: C.gold, sw: 4 }); }
    n.push({ k: "circle", x: x, y: y, r: r * .42, fill: C.gold, sw: 5 }); n.push({ k: "circle", x: x, y: y, r: r - 10, fill: null, sw: 7, sc: C.white, dash: [0, 20] });
    return n; }
  // the medallion's ring (ruby band, white pearls) and its ground
  function medallion(ground) { var band = MR - MI, n = [{ k: "circle", x: MC[0], y: MC[1], r: (MR + MI) / 2, fill: null, sw: band, sc: C.ruby },
    { k: "circle", x: MC[0], y: MC[1], r: MR, fill: null, sw: 8 }, { k: "circle", x: MC[0], y: MC[1], r: MR - 11, fill: null, sw: 8, sc: C.white, dash: [0, 22] },
    { k: "circle", x: MC[0], y: MC[1], r: MI, fill: null, sw: 7 }];
    if (ground) n.unshift({ k: "circle", x: MC[0], y: MC[1], r: MI, fill: ground }); return n; }
  // ---- the window frame: ruby border with pearls, white fillet, cobalt field cut into tall lozenge quarries
  function frameGlass(GL, P) { var W = R.lw, H = R.lh;
    piece(GL, P + "_G_BORDER", [{ k: "poly", pts: lancetPts(0), fill: C.ruby, sw: 10 }, { k: "poly", pts: lancetPts(14), fill: null, sw: 8, sc: C.white, dash: [0, 24] },
      { k: "poly", pts: lancetPts(26), fill: C.white, sw: 6 }, { k: "poly", pts: lancetPts(36), fill: C.cobalt, sw: 6 }]);
    var lines = [], s = 70, k = 1.44, x;
    for (x = -H / k - s; x < W + s; x += s) lines.push({ k: "line", pts: [[x, 0], [x + H / k, H]], sw: 5 });
    for (x = 0; x < W + H / k + s; x += s) lines.push({ k: "line", pts: [[x, 0], [x - H / k, H]], sw: 5 });
    var LZ = piece(GL, P + "_G_QUARRIES", lines), M = piece(GL, P + "_G_QMATTE", [{ k: "poly", pts: lancetPts(40), fill: [1, 1, 1] }]);
    LZ.setTrackMatte(M, TrackMatteType.ALPHA); M.enabled = false;
    // quarry shading: a few quarries a shade lighter or darker (hand-cut, not printed)
    var q = [], rnd = seeded(41);
    for (var i = 0; i < 26; i++) { var cx = 90 + rnd() * (W - 180), cy = 640 + rnd() * (H - 700), dx = s / 2, dy = s * k / 2;
      q.push({ k: "poly", pts: [[cx, cy - dy], [cx + dx, cy], [cx, cy + dy], [cx - dx, cy]], fill: rnd() > .5 ? C.sky : C.cobaltD }); }
    var QS = piece(GL, P + "_G_QSHADE", q); QS.opacity.setValue(45); QS.moveAfter(LZ);
    piece(GL, P + "_G_SUN", sunNodes(320, 340, 104));
    return LZ; }
  // glass texture over every piece (streaks at an angle, thickness clouds); Preserve Transparency keeps it inside the glass
  function glassTexture(GL, P) { var T = solid(GL, P + "_G_STREAK", [.5, .5, .5]), f = fx(T, "ADBE Fractal Noise");
    try { f.property("Contrast").setValue(160); f.property("Uniform Scaling").setValue(0); f = T.property("ADBE Effect Parade").property(1);
      f.property("Scale Width").setValue(900); f.property("Scale Height").setValue(22); f.property("Rotation").setValue(-24); f.property("Complexity").setValue(4); } catch (e) {}
    T.blendingMode = BlendingMode.MULTIPLY; T.opacity.setValue(22); T.preserveTransparency = true;
    var CL = solid(GL, P + "_G_CLOUD", [.5, .5, .5]), cf = fx(CL, "ADBE Fractal Noise"); cf.property("Contrast").setValue(140); cf.property("Scale").setValue(90); cf.property("Complexity").setValue(5);
    CL.blendingMode = BlendingMode.OVERLAY; CL.opacity.setValue(16); CL.preserveTransparency = true;
    var BU = solid(GL, P + "_G_SEEDS", [0, 0, 0]), bf = fx(BU, "ADBE Fractal Noise"); bf.property("Contrast").setValue(700); bf.property("Brightness").setValue(-230); bf.property("Scale").setValue(10);
    BU.blendingMode = BlendingMode.SCREEN; BU.opacity.setValue(35); BU.preserveTransparency = true; }

  // ---- light: a white feathered solid in a LIGHT comp (white = lit)
  function lightSolid(LT, name, w, h, mask, feather) { var L = solid(LT, name, [1, 1, 1], w, h); var m = L.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
    m.property("ADBE Mask Shape").setValue(mask); m.property("ADBE Mask Feather").setValue([feather, feather]); return L; }
  function pool(LT, name, x, y, rx, ry, list) { var L = lightSolid(LT, name, LT.width, LT.height, ell(x, y, rx, ry), 70); keys(L.opacity, list); return L; }
  // LIT = glass where the light is, times the sun's colour (an ADBE Fill on a Preserve Transparency solid, so the colour is the clock)
  function litComp(LC, P, tag, glass, light, sun) { var LL = nest(LC, light, P + "_" + tag + "_LIGHTL"); var GL = nest(LC, glass, P + "_" + tag + "_GLASSL");
    GL.setTrackMatte(LL, TrackMatteType.LUMA); LL.enabled = false;
    var S = solid(LC, P + "_" + tag + "_SUN", [1, 1, 1]); S.blendingMode = BlendingMode.MULTIPLY; S.preserveTransparency = true; keys(fx(S, "ADBE Fill").property("Color"), sun); return LC; }
  // the window in the room: unlit (dark, milky) under lit (added, glowing)
  function windowIn(RM, P, tag, glass, lit, pos, outline, hazeCol) {
    var U = nest(RM, glass, P + "_" + tag + "_UNLIT", pos); fx(U, "ADBE Exposure2").property("Exposure").setValue(-2.7);
    fx(U, "ADBE HUE SATURATION").property("Master Saturation").setValue(-45);
    var HZ = piece(RM, P + "_" + tag + "_HAZE", [{ k: "shape", shape: outline, fill: hazeCol }], pos); HZ.blendingMode = BlendingMode.SCREEN; HZ.opacity.setValue(9);
    var L = nest(RM, lit, P + "_" + tag + "_LIT", pos); L.blendingMode = BlendingMode.ADD; fx(L, "ADBE Exposure2").property("Exposure").setValue(-.35);
    var g = fx(L, "ADBE Glo2"); g.property("Glow Threshold").setValue(72); g.property("Glow Radius").setValue(30); g.property("Glow Intensity").setValue(.45);
    return { unlit: U, lit: L }; }

  // ---- type
  function words(wl, t0, t1) { var r = []; for (var i = 0; i < wl.length; i++) if (wl[i].s >= t0 - .05 && wl[i].s < t1) r.push(wl[i].s); return r; }
  function buildKeys(str, ons, t0) { var w = str.split(" "), t = [t0], s = [" "];
    for (var i = 0; i < w.length; i++) { var at = ons[Math.min(i, ons.length - 1)]; if (at <= t0 + .001) { s[0] = w.slice(0, i + 1).join(" "); continue; } t.push(at); s.push(w.slice(0, i + 1).join(" ")); }
    return { t: t, s: s }; }
  function centred(comp, name, str, o) { var L = AESLib.text(comp, name, str, { family: o.family, style: o.style, size: o.size, color: o.color, just: "center", tracking: o.tracking });
    var r = L.sourceRectAtTime(0, false); L.anchorPoint.setValue([r.left + r.width / 2, r.top + r.height / 2]); L.position.setValue([o.x, o.y]);
    if (o.maxW && r.width > o.maxW) { var s = 100 * o.maxW / r.width; L.scale.setValue([s, s]); } return L; }
  // incised capitals on the stone tablet: a light lower lip, the dark cut, gilding revealed only where the band of light has passed
  function incised(RM, P, name, str, o, matte, t0, t1) { var out = [];
    var lip = centred(RM, P + "_" + name + "_LIP", str, { family: o.family, style: o.style, size: o.size, tracking: o.tracking, color: [.42, .39, .35], x: o.x, y: o.y + 2, maxW: o.maxW });
    var cut = centred(RM, P + "_" + name + "_CUT", str, { family: o.family, style: o.style, size: o.size, tracking: o.tracking, color: [.06, .05, .04], x: o.x, y: o.y, maxW: o.maxW });
    var gild = centred(RM, P + "_" + name + "_GILD", str, { family: o.family, style: o.style, size: o.size, tracking: o.tracking, color: [.86, .64, .27], x: o.x, y: o.y - 1, maxW: o.maxW });
    gild.setTrackMatte(matte, TrackMatteType.ALPHA); span(lip, t0, t1); span(cut, t0, t1); span(gild, t0, t1); return [lip, cut, gild]; }
  // the banderole: a parchment ribbon that unfurls from the centre; the line inks in once it is three quarters open
  function banderole(comp, P, i, str, t0, t1) { var y = 1772, T = AESLib.text(comp, P + "_BAND" + i + "_TXT", str, { family: FELL, style: "Italic", size: 46, color: C.ink, pos: [540, y] });
    var r = T.sourceRectAtTime(0, false); T.anchorPoint.setValue([r.left + r.width / 2, r.top + r.height / 2]); T.position.setValue([540, y]);
    var hw = Math.min(470, r.width / 2 + 70), h = 46, sag = 8, s = new Shape();
    s.vertices = [[-hw, -h], [0, -h + sag], [hw, -h], [hw - 16, 0], [hw, h], [0, h + sag], [-hw, h], [-hw + 16, 0]];
    s.inTangents = [[0, 0], [-hw * .5, 0], [0, 0], [0, 0], [0, 0], [hw * .5, 0], [0, 0], [0, 0]]; s.outTangents = [[0, 0], [hw * .5, 0], [0, 0], [0, 0], [0, 0], [-hw * .5, 0], [0, 0], [0, 0]]; s.closed = true;
    var curl = function (sx) { return [{ k: "poly", pts: [[sx * hw, -h], [sx * (hw + 30), -h + 6], [sx * (hw + 34), h - 4], [sx * hw, h]], fill: C.parchD, sw: 2, sc: C.ink },
      { k: "ellipse", x: sx * (hw + 28), y: 4, rx: 10, ry: h - 4, fill: C.parch, sw: 2, sc: C.ink }]; };
    var RB = piece(comp, P + "_BAND" + i, [{ k: "shape", shape: s, fill: C.parch, sw: 2.5, sc: C.ink }, { k: "line", pts: [[-hw + 22, -h + 14 + sag * .5], [hw - 22, -h + 14 + sag * .5]], sw: 1.2, sc: C.parchD }]
      .concat(curl(1)).concat(curl(-1)), [540, y]);
    RB.moveAfter(T); span(RB, t0, t1); span(T, t0, t1);
    keys(RB.scale, [{ t: t0, v: [4, 100], o: 30 }, { t: t0 + .3, v: [100, 100], i: 75, o: "H" }, { t: t1 - .2, v: [100, 100], o: 40 }, { t: t1, v: [4, 100], i: 60 }]);
    keys(T.opacity, [{ t: t0 + .2, v: 0, o: "L" }, { t: t0 + .27, v: 100, i: "L", o: "H" }, { t: t1 - .24, v: 100, o: "L" }, { t: t1 - .18, v: 0, i: "L" }]);
    return RB; }

  // ---- the carry: the face pane cut into shards along jagged cracks from an impact; shards step out and back, cracks become leads
  function shardPolys(I, n, rad, seed) { var rnd = seeded(seed), cuts = [], polys = [], i, j;
    for (i = 0; i < n; i++) { var a = (i * 360 / n + rnd() * 30 - 15) * Math.PI / 180, edge = [I[0] + Math.cos(a) * rad * 2.2, I[1] + Math.sin(a) * rad * 2.2], c = [I];
      for (j = 1; j < 5; j++) { var f = j / 5, px = I[0] + (edge[0] - I[0]) * f, py = I[1] + (edge[1] - I[1]) * f, nx = -Math.sin(a), ny = Math.cos(a), o = (rnd() - .5) * 34;
        c.push([px + nx * o, py + ny * o]); } c.push(edge); cuts.push({ a: a, pts: c }); }
    for (i = 0; i < n; i++) { var A = cuts[i], Bc = cuts[(i + 1) % n], p = A.pts.slice(0), b = Bc.pts.slice(0).reverse(); p = p.concat(b.slice(0, b.length - 1));
      var mid = (A.a + Bc.a + (i === n - 1 ? 2 * Math.PI : 0)) / 2; polys.push({ pts: p, dir: [Math.cos(mid), Math.sin(mid)] }); }
    return { cuts: cuts, polys: polys }; }

  // buildScene: the shared test scene (the library's seven-beat test scene) as one window read pane by pane. comp = an empty 1080 x 1920 comp.
  function buildScene(comp0, scene, opts) {
    fontOK(); var P = opts.prefix || "STGL", A = opts.assets, B = scene.beat, WL = scene.wordList, D = comp0.duration, fps = comp0.frameRate, notes = [];
    AESLib.clearOwned(comp0, P);
    var GL = comp(P + "_GLASS", R.lw, R.lh, D, fps), LT = comp(P + "_LIGHT", R.lw, R.lh, D, fps), LC = comp(P + "_LIT", R.lw, R.lh, D, fps);
    var RG = comp(P + "_ROSEGLASS", 460, 460, D, fps), RLT = comp(P + "_ROSELIGHT", 460, 460, D, fps), RLC = comp(P + "_ROSELIT", 460, 460, D, fps);
    var RM = comp(P + "_ROOM", R.w, R.h, D, fps);
    var T0 = B.title.t0, P0 = B.picture.t0, I0 = B.input.t0, N0 = B.number.t0, L0 = B.line.t0, C0 = B.carry.t0, E0 = B.end.t0, E1 = B.end.t1;
    var pw = words(WL, P0, B.picture.t1), nw = words(WL, N0, B.number.t1), lw = words(WL, L0, B.line.t1), cw = words(WL, C0, B.carry.t1), ew = words(WL, E0, E1);
    var LIT = [{ t: 0, v: 0, o: "L" }, { t: 1.0, v: 0, i: "L", o: 40 }, { t: P0, v: .3, i: 60, o: "H" }, { t: pw[4], v: .3, o: 30 }, { t: pw[4] + .35, v: 1, i: 70, o: "H" },
      { t: N0, v: 1, o: 40 }, { t: N0 + .45, v: .25, i: 60, o: "H" }, { t: lw[4], v: .25, o: 30 }, { t: lw[5] + .2, v: 1, i: 70, o: "H" }, { t: E1 - .45, v: 1, o: 40 }, { t: E1, v: .4, i: 40 }];
    // the sun's colour is the clock: blue-white dawn, white noon, gold afternoon, orange dusk
    var SUN = [{ t: 0, v: [.7, .8, 1], o: 50 }, { t: P0 + .4, v: [1, .98, .94], i: 50, o: 50 }, { t: N0, v: [1, .93, .78], i: 50, o: 50 }, { t: L0, v: [1, .87, .64], i: 50, o: 50 },
      { t: E0 + .4, v: [1, .72, .44], i: 50 }];

    // ===== GLASS (lancet px): the frame, then one medallion scene per beat
    frameGlass(GL, P);
    span(piece(GL, P + "_G_MED_P", medallion(C.sky)), 0, I0);
    var hill = [[MC[0] - 228, MC[1] + 121], [MC[0] - 130, MC[1] + 96], [MC[0] + 10, MC[1] + 116], [MC[0] + 160, MC[1] + 90], [MC[0] + 228, MC[1] + 121]].concat(arcPts(MC[0], MC[1], MI, 28, 152, 10));
    span(piece(GL, P + "_G_HILL", [{ k: "poly", pts: hill, fill: C.green, sw: 7 }, grisaille([[MC[0] - 170, MC[1] + 150], [MC[0] - 120, MC[1] + 140]], 3), grisaille([[MC[0] + 60, MC[1] + 150], [MC[0] + 120, MC[1] + 142]], 3)]), 0, I0);
    var PE = piece(GL, P + "_G_PERSON", personNodes(MC[0] - 110, MC[1] + 168)); span(PE, 0, I0);
    var ar = groupT(PE, ["AR"]).property("ADBE Vector Rotation"); keys(ar, [{ t: pw[2], v: 0, o: 40 }, { t: pw[2] + .3, v: -118, i: 70 }]); ar.expression = STEP + "value;";
    var DO = piece(GL, P + "_G_DOC", documentNodes(MC[0] + 100, MC[1] - 112)); span(DO, 0, I0); DO.rotation.setValue(-5);
    keys(DO.position, [{ t: pw[1], v: [0, -26], o: 30 }, { t: pw[1] + .25, v: [0, 0], i: 80 }]); DO.position.expression = STEP + "value;";
    span(piece(GL, P + "_G_DEVICE", deviceNodes(MC[0] + 122, MC[1] + 92)), 0, I0);
    // input: the real frame cut into glass by tools/glass.mjs, in the medallion (it holds its last frame through the rose)
    var gv = AESLib.importFile(A.glass), GV = GL.layers.add(gv); GV.name = P + "_G_REAL"; GV.startTime = I0; span(GV, I0, L0);
    try { GV.timeRemapEnabled = true; var tr = GV.property("ADBE Time Remapping"); tr.expression = "Math.min(time - " + I0 + ", " + (gv.duration - 1 / 8).toFixed(3) + ");"; } catch (eTR) { notes.push("hold last glass frame: " + eTR.toString()); }
    var gsc = 100 * 2 * MI / 560; GV.position.setValue(MC); GV.scale.setValue([gsc, gsc]); fx(GV, "ADBE Exposure2").property("Exposure").setValue(-1.1); fx(GV, "ADBE HUE SATURATION").property("Master Saturation").setValue(-18);   // flesh darker than you think, or it burns when lit
    GV.property("ADBE Mask Parade").addProperty("ADBE Mask Atom").property("ADBE Mask Shape").setValue(ell(280, 280, 279, 279));
    span(piece(GL, P + "_G_MED_I", medallion(null)), I0, L0);
    // line: a white-glass scroll in a ruby medallion; the line is painted on it in grisaille, word by word
    var scroll = [{ k: "rect", x: MC[0] - 200, y: MC[1] - 150, w: 400, h: 300, fill: C.white, sw: 7 }, { k: "ellipse", x: MC[0] - 210, y: MC[1], rx: 22, ry: 156, fill: C.gold, sw: 6 },
      { k: "ellipse", x: MC[0] + 210, y: MC[1], rx: 22, ry: 156, fill: C.gold, sw: 6 }];
    span(piece(GL, P + "_G_MED_L", medallion(C.ruby).concat(scroll)), L0, C0);
    var rows = ["Every word", "I say", "gets typed."], ron = [[lw[0], lw[1]], [lw[2], lw[3]], [lw[4], lw[5]]];
    for (var r = 0; r < 3; r++) { var RL = AESLib.text(GL, P + "_G_LINE" + r, rows[r], { family: FELL, style: "Italic", size: 80, color: [.2, .11, .06], just: "left" });
      var rr = RL.sourceRectAtTime(0, false); RL.anchorPoint.setValue([rr.left, rr.top + rr.height / 2]); RL.position.setValue([MC[0] - 168, MC[1] - 92 + r * 92]); 
      var bk = buildKeys(rows[r], ron[r], L0); AESLib.textKeys(RL, bk.t, bk.s); span(RL, L0, C0); }
    // carry and end: the face pane again (the rhyme), cracked on "thing", shards step out on "becomes" and back on "the next" with new leads
    var I = [240, 250], SH = shardPolys(I, 6, 300, 17), fc = AESLib.importFile(A.face), tCrack = cw[2], tOut = cw[3], tBack = cw[4] + .02;
    for (var s = 0; s < SH.polys.length; s++) { var SL = GL.layers.add(fc); SL.name = P + "_G_SHARD" + s; SL.anchorPoint.setValue([280, 280]); SL.scale.setValue([gsc, gsc]); span(SL, C0, E1); fx(SL, "ADBE Exposure2").property("Exposure").setValue(-1.1); fx(SL, "ADBE HUE SATURATION").property("Master Saturation").setValue(-18);
      SL.property("ADBE Mask Parade").addProperty("ADBE Mask Atom").property("ADBE Mask Shape").setValue(poly(SH.polys[s].pts));
      var d = SH.polys[s].dir, st = s * .0625, out = [MC[0] + d[0] * 26, MC[1] + d[1] * 26];
      keys(SL.position, [{ t: C0, v: MC, o: "H" }, { t: tOut + st, v: [MC[0] + d[0] * 10, MC[1] + d[1] * 10], o: "H" }, { t: tOut + st + .125, v: out, o: "H" }, { t: tBack + st, v: [MC[0] + d[0] * 32, MC[1] + d[1] * 32], o: "H" },
        { t: tBack + st + .125, v: MC, o: "H" }]); }
    var SMT = piece(GL, P + "_G_SHARDMATTE", [{ k: "circle", x: MC[0], y: MC[1], r: MI, fill: [1, 1, 1] }]); span(SMT, C0, E1);
    for (var s2 = 0; s2 < SH.polys.length; s2++) GL.layer(P + "_G_SHARD" + s2).setTrackMatte(SMT, TrackMatteType.ALPHA);
    SMT.enabled = false;
    span(piece(GL, P + "_G_MED_C", medallion(null)), C0, E1);
    var crk = []; for (var c = 0; c < SH.cuts.length; c++) { var cp = []; for (var q = 0; q < SH.cuts[c].pts.length; q++) cp.push([SH.cuts[c].pts[q][0] * gsc / 100 + MC[0] - 280 * gsc / 100, SH.cuts[c].pts[q][1] * gsc / 100 + MC[1] - 280 * gsc / 100]);
      crk.push({ k: "line", pts: cp, sw: 5, sc: [1, .98, .9] }); }
    var CR = piece(GL, P + "_G_CRACKS", crk); span(CR, tCrack, E1);
    var CRm = piece(GL, P + "_G_CRACKMATTE", [{ k: "circle", x: MC[0], y: MC[1], r: MI - 2, fill: [1, 1, 1] }]); span(CRm, tCrack, E1); CR.setTrackMatte(CRm, TrackMatteType.ALPHA); CRm.enabled = false;
    for (var g2 = 1; g2 <= SH.cuts.length; g2++) { var gp = CR.property("ADBE Root Vectors Group").property(g2).property("ADBE Vectors Group");
      var tm = gp.addProperty("ADBE Vector Filter - Trim"); keys(tm.property("ADBE Vector Trim End"), [{ t: tCrack, v: 0, o: "L" }, { t: tCrack + .25, v: 100, i: "L" }]);
      var sk = gp.property("ADBE Vector Graphic - Stroke"); keys(sk.property("ADBE Vector Stroke Color"), [{ t: tCrack, v: [1, .98, .9], o: "H" }, { t: tBack + .5, v: C.lead, o: "H" }]);
      keys(sk.property("ADBE Vector Stroke Width"), [{ t: tCrack, v: 5, o: "H" }, { t: tBack + .5, v: 8, o: "H" }]); }
    // weld sparks where each mended lead meets the ring
    var sp = []; for (var w = 0; w < SH.cuts.length; w++) { var a = SH.cuts[w].a, sx = MC[0] + Math.cos(a) * (MI - 6), sy = MC[1] + Math.sin(a) * (MI - 6);
      sp.push({ k: "poly", pts: [[sx, sy - 16], [sx + 4, sy - 4], [sx + 16, sy], [sx + 4, sy + 4], [sx, sy + 16], [sx - 4, sy + 4], [sx - 16, sy], [sx - 4, sy - 4]], fill: [1, .95, .8] }); }
    var SP = piece(GL, P + "_G_SPARKS", sp); span(SP, tBack, tBack + .55);
    keys(SP.opacity, [{ t: tBack, v: 0, o: "H" }, { t: tBack + .125, v: 100, o: "H" }, { t: tBack + .375, v: 60, o: "H" }, { t: tBack + .5, v: 0, o: "H" }]);
    glassTexture(GL, P);

    // ===== LIGHT (lancet px): a wide feathered band trucks across between beats; pools light the pieces on their words
    var OFF = -900, ON = 320, GONE = 1560;
    var BAND = lightSolid(LT, P + "_L_BAND", 1300, 2600, poly([[0, 0], [1300, 0], [1300, 2600], [0, 2600]]), 260); BAND.rotation.setValue(10);
    keys(BAND.position, [{ t: 0, v: [OFF, 750], o: "H" }, { t: .95, v: [OFF, 750], o: 40 }, { t: P0, v: [-560, 750], i: 60, o: "H" }, { t: pw[4], v: [-560, 750], o: 30 }, { t: pw[4] + .35, v: [ON, 750], i: 70, o: "H" },
      { t: I0, v: [OFF, 750], o: 25 }, { t: I0 + .5, v: [ON, 750], i: 70, o: "H" }, { t: N0, v: [ON, 750], o: 40 }, { t: N0 + .45, v: [GONE, 750], i: 60, o: "H" },
      { t: N0 + .5, v: [OFF, 750], o: "H" }, { t: lw[5], v: [OFF, 750], o: 30 }, { t: lw[5] + .3, v: [ON, 750], i: 70, o: "H" }]);
    pool(LT, P + "_L_PERSON", MC[0] - 110, MC[1] + 10, 120, 200, [{ t: 0, v: 0, o: "H" }, { t: pw[0], v: 100, o: "H" }, { t: I0, v: 0, o: "H" }]);
    pool(LT, P + "_L_DOC", MC[0] + 100, MC[1] - 112, 100, 110, [{ t: 0, v: 0, o: "H" }, { t: pw[1], v: 100, o: "H" }, { t: I0, v: 0, o: "H" }]);
    pool(LT, P + "_L_DEVICE", MC[0] + 122, MC[1] + 40, 130, 100, [{ t: 0, v: 0, o: "H" }, { t: pw[2], v: 100, o: "H" }, { t: I0, v: 0, o: "H" }]);
    for (var lr = 0; lr < 3; lr++) pool(LT, P + "_L_ROW" + lr, MC[0], MC[1] - 92 + lr * 92, 260, 70, [{ t: 0, v: 0, o: "H" }, { t: ron[lr][0], v: 100, o: "H" }, { t: C0, v: 0, o: "H" }]);
    litComp(LC, P, "LANCET", GL, LT, SUN);

    // ===== ROSE (460 px): twelve petals light in turn like hours while the count rises in grisaille on the white centre
    var rc = 230, petals = [{ k: "circle", x: rc, y: rc, r: 226, fill: C.gold, sw: 8 }, { k: "circle", x: rc, y: rc, r: 215, fill: null, sw: 8, sc: C.white, dash: [0, 22] }];
    for (var pt = 0; pt < 12; pt++) { var a0 = pt * 30 - 90 + 2, a1 = a0 + 26; petals.push({ k: "poly", pts: arcPts(rc, rc, 204, a0, a1, 6).concat(arcPts(rc, rc, 118, a1, a0, 4)), fill: pt % 2 ? C.cobalt : C.ruby, sw: 7 });
      petals.push({ k: "circle", x: rc + Math.cos((a0 + 13) * Math.PI / 180) * 160, y: rc + Math.sin((a0 + 13) * Math.PI / 180) * 160, r: 16, fill: pt % 2 ? C.gold : C.green, sw: 5 }); }
    petals.push({ k: "circle", x: rc, y: rc, r: 112, fill: C.white, sw: 8 });
    piece(RG, P + "_R_PETALS", petals);
    var NU = AESLib.text(RG, P + "_R_NUM", "0", { family: FELL, style: "Regular", size: 132, color: [.2, .11, .06], pos: [rc, rc - 6] });
    NU.anchorPoint.expression = "var r = sourceRectAtTime(time, false); [r.left + r.width / 2, r.top + r.height / 2];";
    var val = B.number.value, counts = []; for (var k2 = 0; k2 <= 6; k2++) counts.push(String(Math.round(val * (1 - Math.pow(1 - k2 / 6, 2)))));
    AESLib.bakeText(NU, counts, 8, N0 + .05);
    var FR = centred(RG, P + "_R_FRAMES", "FRAMES", { family: FELL, style: "Regular", size: 32, tracking: 240, color: [.2, .11, .06], x: rc + 4, y: rc + 70 });
    glassTexture(RG, P + "_R");
    var RW = solid(RLT, P + "_RL_WHEEL", [1, 1, 1]), rw = fx(RW, "ADBE Radial Wipe"); rw.property("Start Angle").setValue(0); rw.property("Feather").setValue(6);
    keys(rw.property("Transition Completion"), [{ t: 0, v: 100, o: "H" }, { t: N0 + .05, v: 100, o: "L" }, { t: N0 + .8, v: 0, i: "L" }]); rw.property("Transition Completion").expression = STEP + "value;";
    var RCN = lightSolid(RLT, P + "_RL_CENTRE", 460, 460, ell(rc, rc, 116, 116), 8); keys(RCN.opacity, [{ t: 0, v: 0, o: "H" }, { t: N0, v: 100, o: "H" }]);
    litComp(RLC, P, "ROSE", RG, RLT, SUN);

    // ===== ROOM: stone hall, embrasures, the two windows, saddle bars, floor patch, shafts, tablet
    var WALL = solid(RM, P + "_WALL", C.stone), wn = solid(RM, P + "_WALLTEX", [.5, .5, .5]), wf = fx(wn, "ADBE Fractal Noise");
    wf.property("Contrast").setValue(130); wf.property("Scale").setValue(260); wf.property("Complexity").setValue(6); wn.blendingMode = BlendingMode.OVERLAY; wn.opacity.setValue(40);
    var AS = RM.layers.addShape(); AS.name = P + "_ASHLAR"; AS.anchorPoint.setValue([0, 0]); AS.position.setValue([0, 50]);
    var ag = AS.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").property("ADBE Vectors Group");
    var ra = ag.addProperty("ADBE Vector Shape - Rect"); ra.property("ADBE Vector Rect Size").setValue([236, 110]); ra.property("ADBE Vector Rect Position").setValue([0, 0]);
    var rb = ag.addProperty("ADBE Vector Shape - Rect"); rb.property("ADBE Vector Rect Size").setValue([236, 110]); rb.property("ADBE Vector Rect Position").setValue([118, 110]);
    var ast = ag.addProperty("ADBE Vector Graphic - Stroke"); ast.property("ADBE Vector Stroke Color").setValue(C.mortar); ast.property("ADBE Vector Stroke Width").setValue(5);
    var rp1 = ag.addProperty("ADBE Vector Filter - Repeater"); rp1.property("ADBE Vector Repeater Copies").setValue(9); rp1.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([236, 0]);
    var rp2 = ag.addProperty("ADBE Vector Filter - Repeater"); rp2.property("ADBE Vector Repeater Copies").setValue(14); rp2.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([0, 220]);
    AS.opacity.setValue(75);
    // the floor: large irregular flagstones in perspective
    var fl = [{ k: "rect", x: 0, y: R.floorY, w: R.w, h: R.h - R.floorY, fill: C.floor }], rows2 = [R.floorY, 3250, 3390, 3560, R.h + 10], VP = [900, 2500], rnd = seeded(5);
    for (var fr = 0; fr < rows2.length - 1; fr++) { var off = rnd() * 260;
      for (var fc2 = -2; fc2 < 7; fc2++) { var xb0 = fc2 * 330 + off - 200, xb1 = xb0 + 330 + rnd() * 40;
        var px = function (xb, y) { return VP[0] + (xb - VP[0]) * (y - VP[1]) / (R.h - VP[1]); }, ya = rows2[fr], yb = rows2[fr + 1];
        var sh = .9 + rnd() * .2; fl.push({ k: "poly", pts: [[px(xb0, ya), ya], [px(xb1, ya), ya], [px(xb1, yb), yb], [px(xb0, yb), yb]], fill: [C.floor[0] * sh, C.floor[1] * sh, C.floor[2] * sh], sw: 5, sc: C.mortar }); } }
    piece(RM, P + "_FLOOR", fl);
    // embrasures (lighter splayed stone), the sill and the tablet
    var lo = [R.lx, R.ly];
    piece(RM, P + "_EMBRASURE", [{ k: "poly", pts: lancetPts(-74, lo), fill: C.stoneL, sw: 5, sc: C.mortar }, { k: "poly", pts: lancetPts(-34, lo), fill: [.24, .225, .205], sw: 4, sc: C.mortar },
      { k: "circle", x: R.rose[0], y: R.rose[1], r: R.roseR + 64, fill: C.stoneL, sw: 5, sc: C.mortar }, { k: "circle", x: R.rose[0], y: R.rose[1], r: R.roseR + 26, fill: [.24, .225, .205], sw: 4, sc: C.mortar },
      { k: "rect", x: R.lx - 140, y: R.ly + R.lh, w: R.lw + 280, h: 64, fill: C.stoneL, sw: 5, sc: C.mortar },
      { k: "rect", x: R.tab[0], y: R.tab[1], w: R.tab[2], h: R.tab[3], fill: C.tablet, sw: 6, sc: C.mortar }, { k: "rect", x: R.tab[0] + 18, y: R.tab[1] + 18, w: R.tab[2] - 36, h: R.tab[3] - 36, fill: null, sw: 3, sc: [.22, .2, .18] }]);
    // spill: the lit window warms the stone around it
    var SPL = solid(RM, P + "_SPILL", [0, 0, 0]), sr = fx(SPL, "ADBE Ramp"); sr.property("Ramp Shape").setValue(2); sr.property("Start of Ramp").setValue([R.cx, R.ly + 900]);
    sr.property("Start Color").setValue([.42, .4, .36]); sr.property("End of Ramp").setValue([R.cx + 1000, R.ly + 900]); sr.property("End Color").setValue([0, 0, 0]);
    SPL.blendingMode = BlendingMode.ADD; keys(SPL.opacity, LIT); SPL.opacity.expression = "value * 100;";
    var LW = windowIn(RM, P, "LANCET", GL, LC, lo, poly(lancetPts(0)), [.55, .58, .62]);
    var RW2 = windowIn(RM, P, "ROSE", RG, RLC, [R.rose[0] - 230, R.rose[1] - 230], ell(230, 230, 228, 228), [.55, .58, .62]);
    // iron saddle bars across the lancet (above and below the medallion) and the rose's cross bars
    var bars = []; for (var b = 0; b < 2; b++) { var by = R.ly + [560, 1196][b]; bars.push({ k: "rect", x: R.lx - 30, y: by - 5, w: R.lw + 60, h: 10, fill: C.iron }); }
        piece(RM, P + "_BARS", bars);
    // the floor patch: the lit window projected onto the stone, mirrored (its top lands nearest the camera), blurred, desaturated
    var FP = nest(RM, LC, P + "_PATCH"), cpn = fx(FP, "ADBE Corner Pin");
    cpn.property("Upper Left").setValue([720, 3690]); cpn.property("Upper Right").setValue([1460, 3690]); cpn.property("Lower Left").setValue([860, 3200]); cpn.property("Lower Right").setValue([1250, 3200]);
    fx(FP, "ADBE Gaussian Blur 2").property("Blurriness").setValue(48); fx(FP, "ADBE HUE SATURATION").property("Master Saturation").setValue(-22);
    FP.blendingMode = BlendingMode.ADD; FP.opacity.setValue(60);
    // shafts: additive, near nothing at the window, strongest about 40% of the way down; dust drifts in them
    var SHF = solid(RM, P + "_SHAFT", [0, 0, 0]), smk = SHF.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
    smk.property("ADBE Mask Shape").setValue(poly([[R.lx + 30, R.ly + 700], [R.lx + R.lw - 30, R.ly + 600], [1480, 3690], [700, 3690]])); smk.property("ADBE Mask Feather").setValue([90, 90]);
    var shr = fx(SHF, "ADBE Ramp"); shr.property("Start of Ramp").setValue([R.cx, R.ly + 900]); shr.property("Start Color").setValue([0, 0, 0]);
    shr.property("End of Ramp").setValue([R.cx, 3000]); shr.property("End Color").setValue([.5, .48, .42]);
    SHF.blendingMode = BlendingMode.ADD; keys(SHF.opacity, LIT); SHF.opacity.expression = "value * 55;";
    var DU = solid(RM, P + "_DUST", [0, 0, 0]), df = fx(DU, "ADBE Fractal Noise"); df.property("Contrast").setValue(600); df.property("Brightness").setValue(-200); df.property("Scale").setValue(14);
    df.property("Evolution").expression = "time * 90;"; DU.blendingMode = BlendingMode.ADD;
    var dm = DU.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"); dm.property("ADBE Mask Shape").setValue(poly([[R.lx + 30, R.ly + 700], [R.lx + R.lw - 30, R.ly + 600], [1330, R.ly + R.lh], [760, R.ly + R.lh]]));   // dust only between the glass and the sill dm.property("ADBE Mask Feather").setValue([120, 120]);
    keys(DU.opacity, LIT); DU.opacity.expression = "value * 40;";
    // the tablet: incised capitals, gilding revealed behind a band of light that crosses the stone
    var tx = R.tab[0] + R.tab[2] / 2, TB = solid(RM, P + "_TABBAND", [1, 1, 1], 420, R.tab[3] + 160), tbm = TB.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
    tbm.property("ADBE Mask Shape").setValue(ell(210, (R.tab[3] + 160) / 2, 210, (R.tab[3] + 160) / 2)); tbm.property("ADBE Mask Feather").setValue([160, 60]);
    keys(fx(TB, "ADBE Fill").property("Color"), SUN); TB.blendingMode = BlendingMode.ADD; TB.opacity.setValue(20);
    keys(TB.position, [{ t: 0, v: [R.tab[0] - 120, R.tab[1] + R.tab[3] / 2], o: 20 }, { t: 1.2, v: [R.tab[0] + R.tab[2] + 120, R.tab[1] + R.tab[3] / 2], i: 20, o: "H" },
      { t: E0 - .05, v: [R.tab[0] - 120, R.tab[1] + R.tab[3] / 2], o: 20 }, { t: ew[2] + .3, v: [R.tab[0] + R.tab[2] + 120, R.tab[1] + R.tab[3] / 2], i: 30, o: "H" }]);
    var GM = solid(RM, P + "_GILDMATTE", [1, 1, 1], 2400, R.tab[3] + 40), gmm = GM.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
    gmm.property("ADBE Mask Shape").setValue(poly([[0, 0], [2400, 0], [2400, R.tab[3] + 40], [0, R.tab[3] + 40]])); gmm.property("ADBE Mask Feather").setValue([140, 0]);
    GM.anchorPoint.setValue([2400, (R.tab[3] + 40) / 2]); GM.position.expression = "thisComp.layer(\"" + P + "_TABBAND\").transform.position - [60, 0];"; GM.enabled = false;
    incised(RM, P, "T_CTX", B.title.context.toUpperCase(), { family: CIN, style: "Bold", size: 100, tracking: 60, x: tx, y: R.tab[1] + 98, maxW: R.tab[2] - 90 }, GM, 0, I0);
    var GM2 = GM.duplicate(); GM2.name = P + "_GILDMATTE2"; GM2.enabled = false;
    incised(RM, P, "T_HERO", B.title.hero, { family: FELL, style: "Italic", size: 66, x: tx, y: R.tab[1] + 200, maxW: R.tab[2] - 120 }, GM2, 0, I0);
    var GM3 = GM.duplicate(); GM3.name = P + "_GILDMATTE3"; GM3.enabled = false;
    incised(RM, P, "E_A", "THAT’S", { family: CIN, style: "Bold", size: 104, tracking: 80, x: tx, y: R.tab[1] + 92, maxW: R.tab[2] - 90 }, GM3, I0, E1);
    var GM4 = GM.duplicate(); GM4.name = P + "_GILDMATTE4"; GM4.enabled = false;
    incised(RM, P, "E_B", "THE TEST.", { family: CIN, style: "Bold", size: 104, tracking: 80, x: tx, y: R.tab[1] + 204, maxW: R.tab[2] - 90 }, GM4, I0, E1);

    // ===== MAIN: the room is the camera (anchor = what we look at, scale = how close), the flash, captions, a vignette
    var RL2 = nest(comp0, RM, P + "_ROOML", [540, 960]);
    var F = { tab: [[900, 2930], 112], lan: [[900, 1960], 118], face: [[900, 2060], 138], rose: [[900, 910], 182], end: [[900, 2520], 92] };
    function cam(t, f, s, i, o) { return { t: t, v: f[0], i: i, o: o, s: s }; }
    var camK = [cam(0, F.tab, 106, 30, 30), cam(P0 - .02, F.tab, 112, 30, 30), cam(P0 + .5, F.lan, 118, 75, 30), cam(I0, F.lan, 124, 30, 30), cam(I0 + .45, F.face, 138, 75, 30),
      cam(N0, F.face, 146, 30, 30), cam(N0 + .5, F.rose, 182, 75, 30), cam(L0, F.rose, 190, 30, 30), cam(L0 + .45, F.lan, 124, 75, 30), cam(C0, F.lan, 128, 30, 30),
      cam(C0 + .3, F.face, 140, 75, 30), cam(E0, F.face, 144, 30, 30), cam(E0 + .55, F.end, 92, 75, 30), cam(E1, F.end, 88, 30, 30)];
    var ak = [], sk2 = []; for (var ci = 0; ci < camK.length; ci++) { ak.push({ t: camK[ci].t, v: camK[ci].v, i: camK[ci].i, o: camK[ci].o }); sk2.push({ t: camK[ci].t, v: [camK[ci].s, camK[ci].s], i: camK[ci].i, o: camK[ci].o }); }
    keys(RL2.anchorPoint, ak); keys(RL2.scale, sk2);
    RL2.position.expression = "var d = time - " + tCrack.toFixed(3) + ", f = thisComp.frameDuration; if (d >= 0 && d < f) value + [9, -7]; else if (d >= f && d < 2 * f) value + [-6, 5]; else value;";
    var FL = solid(comp0, P + "_FLASH", [1, .97, .9]); FL.blendingMode = BlendingMode.ADD; span(FL, tCrack, tCrack + .2);
    keys(FL.opacity, [{ t: tCrack, v: 55, o: "L" }, { t: tCrack + .1, v: 0, i: "L" }]);
    var VG = solid(comp0, P + "_VIGNETTE", [0, 0, 0]), vm = VG.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"); vm.property("ADBE Mask Shape").setValue(ell(540, 960, 640, 1060));
    vm.inverted = true; vm.property("ADBE Mask Feather").setValue([420, 420]); VG.opacity.setValue(70);
    banderole(comp0, P, 0, "Three pieces build one picture.", P0, I0);
    banderole(comp0, P, 1, "Here’s a real frame from my video.", I0, N0);
    banderole(comp0, P, 2, "Then one thing becomes the next.", C0, E0);
    return { layers: comp0.numLayers + GL.numLayers + LT.numLayers + LC.numLayers + RG.numLayers + RLT.numLayers + RLC.numLayers + RM.numLayers, notes: notes };
  }
  return { C: C, R: R, fontOK: fontOK, keys: keys, piece: piece, lancetPts: lancetPts, faceNodes: faceNodes, personNodes: personNodes, documentNodes: documentNodes,
    deviceNodes: deviceNodes, sunNodes: sunNodes, medallion: medallion, frameGlass: frameGlass, glassTexture: glassTexture, litComp: litComp, windowIn: windowIn,
    incised: incised, banderole: banderole, shardPolys: shardPolys, buildScene: buildScene };
})();
