// Silkscreen poster style: brand-neutral ES3 helpers. No project mutation happens at load.
// Read styles/silkscreen-poster/STYLE.md first. A WPA-style screen-print poster printed on camera: every colour is one opaque flat ink on its
// own layer, revealed by a linear squeegee pull (a ragged-front alpha matte shared by every layer of that pull), slightly off register, with
// an overprint ghost and an ink-thickness rim. Skies are stepped bands, never gradients. The dark info band prints last. Posters change by a
// foreground silhouette truck or a diagonal re-ink squeegee, and end hung together on a wood wall.
// Adapted from Lemo-Opuscar's silkscreen-poster style (MIT, LemoLab); see library/styles/LICENSE-lemo-opuscar.txt.
var AESSilk = (function () {
  var DISP = "Big Shoulders Display", LAB = "Outfit";
  function hex(h) { h = h.replace("#", ""); return [parseInt(h.substr(0, 2), 16) / 255, parseInt(h.substr(2, 2), 16) / 255, parseInt(h.substr(4, 2), 16) / 255]; }
  function mix(a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; }
  var PAPER = hex("EFE6D2");
  // one palette per poster, at most six inks, by role (sky1 light sky, sky2 bands, far, mid, near = darkest and the info band, accent = rare)
  var PALETTES = {
    dawn: { sky1: hex("F6CD98"), sky2: hex("EE9A73"), far: hex("9A7FA8"), mid: hex("3E7079"), near: hex("1E3B3F"), accent: hex("F2B134") },
    noon: { sky1: hex("E8F0F2"), sky2: hex("7FB3C8"), far: hex("D9C7A3"), mid: hex("2F6E8E"), near: hex("173247"), accent: hex("E8553D") },
    ember: { sky1: hex("F2B37A"), sky2: hex("C4553D"), far: hex("C4553D"), mid: hex("C4553D"), near: hex("1E3B3F"), accent: hex("F2B134") },
    dusk: { sky1: hex("F6C177"), sky2: hex("E9763F"), far: hex("8A5A9A"), mid: hex("4E2F66"), near: hex("22192F"), accent: hex("F7DB7A") },
    night: { sky1: hex("EEF1F4"), sky2: hex("B8C9D9"), far: hex("8B9BB0"), mid: hex("4A5D78"), near: hex("1F2A3C"), accent: hex("F2B134") }
  };
  var PW = 1000, PH = 1500, ART = { x: 36, y: 36, w: 928, h: 1048 }, BAND = { x: 36, y: 1100, w: 928, h: 364 };
  function fontOK() { AESLib.font(DISP, "Black"); AESLib.font(DISP, "ExtraBold"); AESLib.font(LAB, "SemiBold"); return true; }
  function rng(seed) { var s = seed; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

  // ---- keys: list = [{ t, v, i, o }]; i / o: a number = eased influence, "L" linear, "H" hold. One setValuesAtTimes call per property.
  function easeArr(prop, inf) { var sp = prop.propertyValueType === PropertyValueType.TwoD_SPATIAL || prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL;
    var d = (!sp && prop.propertyValueType !== PropertyValueType.COLOR && prop.value instanceof Array) ? prop.value.length : 1, a = [];
    for (var n = 0; n < d; n++) a.push(new KeyframeEase(0, inf)); return a; }
  function kt(x) { if (x === "H") return KeyframeInterpolationType.HOLD; if (typeof x === "number") return KeyframeInterpolationType.BEZIER; return KeyframeInterpolationType.LINEAR; }
  function keys(prop, list) { var ts = [], vs = [], B = KeyframeInterpolationType.BEZIER;
    for (var j = 0; j < list.length; j++) { ts.push(list[j].t); vs.push(list[j].v); } prop.setValuesAtTimes(ts, vs);
    for (var k = 0; k < list.length; k++) { var ki = prop.nearestKeyIndex(list[k].t), a = list[k].i, b = list[k].o;
      prop.setInterpolationTypeAtKey(ki, B, B); prop.setTemporalEaseAtKey(ki, easeArr(prop, typeof a === "number" ? a : 33.3), easeArr(prop, typeof b === "number" ? b : 33.3));
      prop.setInterpolationTypeAtKey(ki, kt(a), kt(b));
      if (prop.propertyValueType === PropertyValueType.TwoD_SPATIAL) prop.setSpatialTangentsAtKey(ki, [0, 0], [0, 0]);
      if (prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL) prop.setSpatialTangentsAtKey(ki, [0, 0, 0], [0, 0, 0]); }
    return prop; }
  function fx(L, match) { L.property("ADBE Effect Parade").addProperty(match); var EP = L.property("ADBE Effect Parade"); return EP.property(EP.numProperties); }
  function span(L, t0, t1) { L.inPoint = t0; L.outPoint = t1; return L; }   // in before out: setting in after out loses the out point

  // ---- vector pieces: { k: "poly", pts } | { k: "circle", x, y, r } | { k: "rect", x, y, w, h } | { k: "rrect", x, y, w, h, r }, each with color.
  // Later nodes draw on top. Coordinates are the layer's own (anchor 0, position 0 = comp coordinates).
  var KAPPA = .5523;
  function poly(pts) { var s = new Shape(); s.vertices = pts; s.closed = true; return s; }
  function circ(cx, cy, r) { var k = KAPPA * r, s = new Shape(); s.vertices = [[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy]];
    s.inTangents = [[-k, 0], [0, -k], [k, 0], [0, k]]; s.outTangents = [[k, 0], [0, k], [-k, 0], [0, -k]]; s.closed = true; return s; }
  function rrect(x, y, w, h, r) { var k = (1 - KAPPA) * r, s = new Shape();
    s.vertices = [[x + r, y], [x + w - r, y], [x + w, y + r], [x + w, y + h - r], [x + w - r, y + h], [x + r, y + h], [x, y + h - r], [x, y + r]];
    s.inTangents = [[0, 0], [0, 0], [0, -r + k], [0, 0], [r - k, 0], [0, 0], [0, r - k], [0, 0]];
    s.outTangents = [[0, 0], [r - k, 0], [0, 0], [0, r - k], [0, 0], [-r + k, 0], [0, 0], [0, -r + k]]; s.closed = true; return s; }
  function shapeOf(n) { if (n.k === "circle") return circ(n.x, n.y, n.r);
    if (n.k === "rrect") return rrect(n.x, n.y, n.w, n.h, n.r);
    if (n.k === "rect") return poly([[n.x, n.y], [n.x + n.w, n.y], [n.x + n.w, n.y + n.h], [n.x, n.y + n.h]]);
    return poly(n.pts); }
  function emit(contents, nodes) {
    for (var i = nodes.length - 1; i >= 0; i--) { var n = nodes[i], g = contents.addProperty("ADBE Vector Group"), v = g.property("ADBE Vectors Group");
      v.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(shapeOf(n));
      v.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(n.color); } }
  function piece(comp, name, nodes) { var L = comp.layers.addShape(); L.name = name; emit(L.property("ADBE Root Vectors Group"), nodes);
    L.anchorPoint.setValue([0, 0]); L.position.setValue([0, 0]); return L; }

  // ---- print shapes
  // stepped bands (the gradient substitute): n stripes between ya and yb whose thickness goes from ta to tb, then (optionally) solid to yc
  function stripes(x, w, ya, yb, n, ta, tb, color, solidTo) { var out = [], pitch = (yb - ya) / n;
    for (var i = 0; i < n; i++) { var th = ta + (tb - ta) * i / Math.max(1, n - 1), y = ya + pitch * (i + 1) - th; out.push({ k: "rect", x: x, y: y, w: w, h: th, color: color }); }
    if (solidTo !== undefined) out.push({ k: "rect", x: x, y: yb, w: w, h: solidTo - yb, color: color });
    return out; }
  // a pine as one outline of drooping tiers (no seams), base centre at (x, base)
  function pine(x, base, h, w, color) { var n = 6, L = [], R = [], top = base - h, th = h * .9 / n;
    L.push([x, top]);
    for (var i = 1; i <= n; i++) { var y = top + th * i, hw = w / 2 * (.25 + .75 * i / n);
      L.push([x - hw, y + th * .18]); if (i < n) L.push([x - hw * .42, y - th * .12]); }
    L.push([x - w * .07, base - h * .08]); L.push([x - w * .07, base]);
    for (var j = L.length - 1; j >= 1; j--) R.push([2 * x - L[j][0], L[j][1]]);
    var pts = L.concat(R); return { k: "poly", pts: pts, color: color }; }
  function ridge(pts, bottom, color) { var p = pts.slice(0); p.push([pts[pts.length - 1][0], bottom]); p.push([pts[0][0], bottom]); return { k: "poly", pts: p, color: color }; }
  // jagged lit facets on the right flank of every peak that is higher than its right neighbour
  function facets(pts, color) { var out = [];
    for (var i = 1; i < pts.length - 1; i++) { var a = pts[i], b = pts[i + 1]; if (!(a[1] < pts[i - 1][1] && a[1] < b[1])) continue;
      var dx = b[0] - a[0], dy = b[1] - a[1];
      out.push({ k: "poly", pts: [a, [a[0] + .55 * dx, a[1] + .55 * dy], [a[0] + .3 * dx, a[1] + .55 * dy + 26], [a[0] + .38 * dx, a[1] + .6 * dy + 50], [a[0] + .12 * dx, a[1] + .6 * dy + 70], [a[0] + .08 * dx, a[1] + 110]], color: color }); }
    return out; }
  function wave(x0, x1, y, amps, step) { var pts = [];
    for (var x = x0; x <= x1 + .1; x += step) { var v = y; for (var k = 0; k < amps.length; k++) v += amps[k][0] * Math.sin(x / amps[k][1] + amps[k][2]); pts.push([Math.min(x, x1), v]); }
    return pts; }
  // sun: an accent disc with concentric paper rings (a knock-out, paper is a colour)
  function sun(x, y, r, accent) { return [{ k: "circle", x: x, y: y, r: r + 40, color: PAPER }, { k: "circle", x: x, y: y, r: r + 28, color: accent },
    { k: "circle", x: x, y: y, r: r + 16, color: PAPER }, { k: "circle", x: x, y: y, r: r, color: accent }]; }

  // ---- ink: an overprint ghost (a hard 2 px dark offset), an ink-thickness rim (light top-left, dark bottom-right) with a wet sheen that dries
  function ink(L, o) { o = o || {};
    var s = fx(L, "ADBE Drop Shadow"); s.property("Shadow Color").setValue([0, 0, 0, 1]); s.property("Opacity").setValue(o.ghost === undefined ? 30 : o.ghost);
    s.property("Direction").setValue(135); s.property("Distance").setValue(o.dist || 2); s.property("Softness").setValue(o.soft || 1);
    var b = fx(L, "ADBE Bevel Alpha"); b.property("Edge Thickness").setValue(o.rim || 1.6); b.property("Light Angle").setValue(-45);
    var li = b.property("Light Intensity");
    if (o.wet !== undefined && o.wet !== null) keys(li, [{ t: o.wet, v: .75, o: "L" }, { t: o.wet + .9, v: .32, i: "L" }]); else li.setValue(.32);
    return L; }

  // ---- text: anchored on its own ink (justification is not trusted on a new layer); auto-fit to maxW.
  // o = { fam, style, size, color, x, y (baseline), align, maxW, tracking }
  function txt(comp, name, str, o) {
    var L = AESLib.text(comp, name, str, { family: o.fam || DISP, style: o.style || "ExtraBold", size: o.size, color: o.color, just: "left", tracking: o.tracking || 0 });
    var r = L.sourceRectAtTime(0, false);
    if (o.maxW && r.width > o.maxW) { var sp = L.property("Source Text"), td = sp.value; td.fontSize = o.size * o.maxW / r.width; sp.setValue(td); r = L.sourceRectAtTime(0, false); }
    var ax = r.left; if (o.align === "center") ax = r.left + r.width / 2; if (o.align === "right") ax = r.left + r.width;
    L.anchorPoint.setValue([ax, 0]); L.position.setValue([o.x, o.y]);
    return { layer: L, left: o.x - (ax - r.left), right: o.x - (ax - r.left) + r.width, top: o.y + r.top, bottom: o.y + r.top + r.height }; }

  // ---- the pull: one ragged-front matte (disabled) shared by every layer of the pull, its front travelling linearly from v0 to v1.
  // Registration: every layer of the pull is shifted 1 to 3 units (o.reg). o = { x0, x1, v0, v1, t0, t1, name, beads: [colors], squeegee }
  // ctx = { comp, R, notes, instant (no mattes: the sheet is already printed), pulls: [] (squeegee requests for the main comp) }
  function front(x0, x1, R, drag) { var pts = [[x0 - 30, -6000], [x1 + 30, -6000]], x = x1 + 30;
    while (x > x0 - 30) { var d = R() < .12 ? drag * (.4 + .6 * R()) : 0; pts.push([x, -4 * R() - d]); x -= 14 + 18 * R(); }
    pts.push([x0 - 30, -3]); return pts; }
  function pull(ctx, layers, o) { var c = ctx.comp, R = ctx.R, i;
    var reg = o.reg === undefined ? 2.2 : o.reg;
    for (i = 0; i < layers.length; i++) { var p = layers[i].position.value; layers[i].position.setValue([p[0] + (R() * 2 - 1) * reg, p[1] + (R() * 2 - 1) * reg]); }
    if (ctx.instant) return null;
    var M = c.layers.addShape(); M.name = ctx.P + "_PULL_" + o.name; emit(M.property("ADBE Root Vectors Group"), [{ k: "poly", pts: front(o.x0, o.x1, R, o.drag || 26), color: [1, 1, 1] }]);
    M.anchorPoint.setValue([0, 0]); keys(M.position, [{ t: o.t0, v: [0, o.v0], o: "L" }, { t: o.t1, v: [0, o.v1 + 40], i: "L" }]);
    for (i = 0; i < layers.length; i++) layers[i].setTrackMatte(M, TrackMatteType.ALPHA);
    M.enabled = false;
    if (o.squeegee) ctx.pulls.push({ t0: o.t0, t1: o.t1, v0: o.v0, v1: o.v1 + 40, beads: o.beads });
    return M; }
  // an ink layer from nodes, printed by its own pull (or folded into a shared pull by the caller)
  function inkPiece(ctx, name, nodes, wet) { return ink(piece(ctx.comp, ctx.P + "_" + name, nodes), { wet: ctx.instant ? null : wet }); }
  // a text item printed by a short pull of its own (no squeegee): info items print left to right on subdivisions of the beat
  function item(ctx, name, str, o, t) { var r = txt(ctx.comp, ctx.P + "_" + name, str, o); ink(r.layer, { rim: 1, ghost: 24, wet: ctx.instant ? null : t + .1 });
    if (t !== null && t !== undefined) pull(ctx, [r.layer], { name: name, x0: r.left - 12, x1: r.right + 12, v0: r.top - 10, v1: r.bottom + 6, t0: t, t1: t + .1, reg: 1.5, drag: 10 });
    return r; }

  // ---- the poster template (1000 x 1500 units): paper, art area, dark info band with a name, a number, a rule and a row of stats.
  function posterComp(name, scene) { var c = app.project.items.addComp(name, PW, PH, 1, scene.duration, scene.fps); c.bgColor = PAPER;
    var S = c.layers.addSolid(PAPER, name + "_PAPER", PW, PH, 1); S.name = name + "_PAPER"; return c; }
  // band = { pal, name, num, stats: [[label, value]], tName, tNum, tStats: [t...], bandPulled (the band ink already printed elsewhere) }
  function band(ctx, b) { var pal = b.pal, y0 = BAND.y;
    if (!b.bandPulled) { var BL = inkPiece(ctx, "BAND", [{ k: "rect", x: BAND.x, y: BAND.y, w: BAND.w, h: BAND.h, color: pal.near }], b.tBand + (b.dBand || .14));
      pull(ctx, [BL], { name: "BAND", x0: BAND.x, x1: BAND.x + BAND.w, v0: BAND.y - 20, v1: BAND.y + BAND.h, t0: b.tBand, t1: b.tBand + (b.dBand || .14), squeegee: b.squeegee, beads: [pal.near] }); }
    var nm = item(ctx, "NAME", b.name, { fam: DISP, style: "ExtraBold", size: 118, color: b.nameColor || pal.sky1, x: 72, y: y0 + 132, align: "left", maxW: 700 }, b.tName);
    item(ctx, "NUM", b.num, { fam: DISP, style: "ExtraBold", size: 118, color: pal.accent, x: 928, y: y0 + 132, align: "right" }, b.tNum);
    var RL = inkPiece(ctx, "RULE", [{ k: "rect", x: 72, y: y0 + 158, w: 856, h: 5, color: pal.accent }], b.tNum + .1);
    pull(ctx, [RL], { name: "RULE", x0: 60, x1: 940, v0: y0 + 150, v1: y0 + 166, t0: b.tNum, t1: b.tNum + .06, reg: 1 });
    var cols = [72, 72 + 300, 72 + 600];
    for (var i = 0; i < b.stats.length; i++) { var t = b.tStats[i];
      item(ctx, "LAB" + i, b.stats[i][0], { fam: LAB, style: "SemiBold", size: 30, color: b.labColor || pal.sky2, x: cols[i], y: y0 + 232, align: "left", tracking: 160 }, t);
      item(ctx, "VAL" + i, b.stats[i][1], { fam: DISP, style: "ExtraBold", size: 74, color: b.valColor || PAPER, x: cols[i], y: y0 + 318, align: "left", maxW: 280 }, t === null ? null : t + .04); }
    return nm; }
  function ctxFor(comp, P, R, notes, instant) { return { comp: comp, P: P, R: R, notes: notes, instant: !!instant, pulls: [] }; }

  // ---- 1. title (dawn): stepped sky, sun rings, lavender ridges with lit facets, teal hills, pines, the header in the sky, the band last
  function posterTitle(scene, P, R, notes, WL) { var B = scene.beat.title, pal = PALETTES.dawn, c = posterComp(P + "_P1", scene), ctx = ctxFor(c, P + "1", R, notes);
    var on = onsets(wordsIn(WL, B.t0, B.t1)), ax = ART.x, aw = ART.w, bot = ART.y + ART.h;
    var s1 = inkPiece(ctx, "SKY1", [{ k: "rect", x: ax, y: ART.y, w: aw, h: ART.h, color: pal.sky1 }], .16);
    var s2 = inkPiece(ctx, "SKY2", stripes(ax, aw, 250, 600, 7, 4, 34, pal.sky2, bot), .16);
    pull(ctx, [s1, s2], { name: "SKY", x0: ax, x1: ax + aw, v0: ART.y - 20, v1: bot, t0: 0, t1: .2, squeegee: true, beads: [pal.sky1, pal.sky2] });
    var hdr = item(ctx, "HDR", B.context.toUpperCase(), { fam: DISP, style: "ExtraBold", size: 74, color: pal.near, x: 500, y: 150, align: "center", tracking: 420, maxW: 860 }, on[1]);
    var rp = [[ax, 640], [110, 560], [200, 600], [300, 470], [380, 560], [450, 510], [560, 600], [640, 520], [720, 580], [820, 455], [900, 545], [ax + aw, 500]];
    var sn = inkPiece(ctx, "SUN", sun(690, 430, 92, pal.accent), on[1] + .2);
    var fr = inkPiece(ctx, "FAR", [ridge(rp, bot, pal.far)], on[1] + .2);
    var fc = inkPiece(ctx, "FACET", facets(rp, pal.sky2), on[1] + .2);
    pull(ctx, [sn, fr, fc], { name: "FAR", x0: ax, x1: ax + aw, v0: 330, v1: bot, t0: on[1] + .02, t1: on[1] + .2, squeegee: true, beads: [pal.far, pal.accent] });
    var md = inkPiece(ctx, "MID", [ridge(wave(ax, ax + aw, 790, [[34, 120, 0], [18, 47, 1]], 24), bot, pal.mid)], on[2] + .2);
    var nodes = [ridge(wave(ax, ax + aw, 985, [[10, 70, 2]], 30), bot, pal.near)], px = [[130, 650, 220], [250, 440, 150], [880, 700, 160], [790, 470, 140], [700, 300, 90], [360, 260, 80]];
    for (var i = 0; i < px.length; i++) nodes.push(pine(px[i][0], 1010, px[i][1], px[i][2], pal.near));
    var nr = inkPiece(ctx, "NEAR", nodes, on[2] + .2);
    pull(ctx, [md, nr], { name: "LAND", x0: ax, x1: ax + aw, v0: 300, v1: bot, t0: on[2], t1: on[2] + .22, squeegee: true, beads: [pal.mid, pal.near] });
    band(ctx, { pal: pal, name: B.hero.toUpperCase(), num: "01", stats: [["SCENE", "SHARED"], ["BEATS", String(scene.beats.length)], ["LENGTH", scene.duration.toFixed(1) + " S"]],
      tBand: on[3] - .02, squeegee: true, tName: on[4], tNum: on[5], tStats: [on[5] + .06, on[5] + .12, on[5] + .18] });
    return ctx; }

  // ---- 2. picture (noon): stepped sky, sand ground, three objects printed one ink per word, the header ONE PICTURE in the sky
  function person(x, base, h, color) { var u = h / 10; return [{ k: "circle", x: x, y: base - 9 * u, r: .85 * u, color: color },
    { k: "poly", pts: [[x - 1.9 * u, base - 7.4 * u], [x + 1.9 * u, base - 7.4 * u], [x + 2.2 * u, base - 3.6 * u], [x + 1.2 * u, base - 3.6 * u], [x + 1.15 * u, base], [x + .25 * u, base], [x, base - 3.2 * u],
      [x - .25 * u, base], [x - 1.15 * u, base], [x - 1.2 * u, base - 3.6 * u], [x - 2.2 * u, base - 3.6 * u]], color: color }]; }
  function documentNodes(x, base, ink, paper, accent) { var w = 230, h = 300, x0 = x - w / 2, y0 = base - h, n = [
    { k: "poly", pts: [[x0, y0], [x0 + w - 60, y0], [x0 + w, y0 + 60], [x0 + w, base], [x0, base]], color: paper },
    { k: "poly", pts: [[x0 + w - 60, y0], [x0 + w - 60, y0 + 60], [x0 + w, y0 + 60]], color: ink }, { k: "rect", x: x0 + 30, y: y0 + 40, w: 110, h: 18, color: accent }];
    for (var r = 0; r < 5; r++) n.push({ k: "rect", x: x0 + 30, y: y0 + 96 + 36 * r, w: r === 4 ? 100 : 170, h: 10, color: ink }); return n; }
  function deviceNodes(x, base, ink, screen) { return [{ k: "rrect", x: x - 95, y: base - 340, w: 190, h: 340, r: 28, color: ink },
    { k: "rect", x: x - 74, y: base - 300, w: 148, h: 248, color: screen }, { k: "circle", x: x, y: base - 26, r: 11, color: screen }]; }
  function posterPicture(scene, P, R, notes, WL) { var B = scene.beat.picture, pal = PALETTES.noon, c = posterComp(P + "_P2", scene), ctx = ctxFor(c, P + "2", R, notes);
    var on = onsets(wordsIn(WL, B.t0, B.t1)), ax = ART.x, aw = ART.w, bot = ART.y + ART.h, base = 1000;
    var s1 = inkPiece(ctx, "SKY1", [{ k: "rect", x: ax, y: ART.y, w: aw, h: ART.h, color: pal.sky1 }], B.t0 + .2);
    var s2 = inkPiece(ctx, "SKY2", [{ k: "rect", x: ax, y: ART.y, w: aw, h: 120, color: pal.sky2 }].concat(stripes(ax, aw, 156, 470, 7, 30, 4, pal.sky2)), B.t0 + .2);
    var gr = inkPiece(ctx, "GROUND", [ridge(wave(ax, ax + aw, 760, [[8, 160, 0]], 40), bot, pal.far)], B.t0 + .2);
    pull(ctx, [s1, s2, gr], { name: "SKY", x0: ax, x1: ax + aw, v0: ART.y - 20, v1: bot, t0: B.t0 - .06, t1: B.t0 + .2, squeegee: true, beads: [pal.sky2, pal.sky1, pal.far] });
    band(ctx, { pal: pal, name: "THREE PIECES", num: "02", stats: [["PIECE 1", "PERSON"], ["PIECE 2", "DOCUMENT"], ["PIECE 3", "DEVICE"]],
      tBand: B.t0 + .2, squeegee: true, tName: on[1] + .02, tNum: on[1] + .1, tStats: [on[0] + .32, on[1] + .26, on[2] + .12] });
    var objs = B.objects, made = [];
    for (var i = 0; i < objs.length && i < 3; i++) { var x = [260, 520, 790][i], t = Math.max(on[i] + .02, B.t0 + .22), nodes;
      if (objs[i] === "person") nodes = person(x, base, 480, pal.mid);
      else if (objs[i] === "document") nodes = documentNodes(x, base, pal.near, PAPER, pal.accent);
      else if (objs[i] === "device") nodes = deviceNodes(x, base, pal.near, pal.accent);
      else nodes = [{ k: "circle", x: x, y: base - 140, r: 130, color: pal.mid }];
      var L = inkPiece(ctx, "OBJ" + i, nodes, t + .16); made.push(L);
      pull(ctx, [L], { name: "OBJ" + i, x0: x - 170, x1: x + 170, v0: 380, v1: base + 10, t0: t, t1: t + .16 }); }
    var h1 = item(ctx, "HDR1", "ONE", { fam: DISP, style: "Black", size: 200, color: pal.near, x: 500, y: 250, align: "center", maxW: 860 }, on[3]);
    item(ctx, "HDR2", "PICTURE", { fam: DISP, style: "Black", size: 200, color: pal.near, x: 500, y: 440, align: "center", maxW: 860 }, on[4]);
    return ctx; }

  // ---- 3. input (ember, and re-inked as night for the carry): the real frame separated into three opaque inks, one pull per word
  function posterInput(scene, P, R, notes, WL, A, o) { var B = scene.beat.input, pal = PALETTES[o.pal], c = posterComp(P + "_P3" + o.tag, scene), ctx = ctxFor(c, P + "3" + o.tag, R, notes, o.instant);
    // o.instant: the art is already printed (a re-ink), but the band's facts still print on the voice
    var on = onsets(wordsIn(WL, B.t0, B.t1)), ax = ART.x, aw = ART.w, bot = ART.y + ART.h, sepInk = [pal.sky1, pal.sky2, pal.near], tt = [on[0], on[2], on[3]];
    for (var k = 0; k < 3; k++) { var S = c.layers.add(AESLib.importFile(A["sep" + k])); S.name = ctx.P + "_SEP" + k;
      S.anchorPoint.setValue([0, 0]); S.position.setValue([ax, ART.y]); var fl = fx(S, "ADBE Fill"); fl.property("Color").setValue(sepInk[k]); ink(S, { wet: ctx.instant ? null : tt[k] + .24 });
      var lay = [S];
      if (k === 2) { var BL = inkPiece(ctx, "BAND", [{ k: "rect", x: BAND.x, y: BAND.y, w: BAND.w, h: BAND.h, color: pal.near }], tt[k] + .26); lay.push(BL); }
      pull(ctx, lay, { name: "SEP" + k, x0: ax, x1: ax + aw, v0: ART.y - 20, v1: k === 2 ? BAND.y + BAND.h : bot, t0: tt[k] + (k ? 0 : .02), t1: tt[k] + .26, squeegee: true, beads: [sepInk[k]] }); }
    var b = o.band; b.pal = pal; b.bandPulled = true; ctx.instant = false; band(ctx, b);
    return ctx; }

  // ---- 4. number (dusk): the value printed huge in the sky; every plane is loose (parallax, paper gaps) until it snaps into register on the hit
  function posterNumber(scene, P, R, notes, WL) { var B = scene.beat.number, pal = PALETTES.dusk, c = posterComp(P + "_P4", scene), ctx = ctxFor(c, P + "4", R, notes);
    var on = onsets(wordsIn(WL, B.t0, B.t1)), ax = ART.x, aw = ART.w, bot = ART.y + ART.h, snap = on[on.length - 1], planes = [];
    var s1 = inkPiece(ctx, "SKY1", [{ k: "rect", x: ax, y: ART.y, w: aw, h: ART.h, color: pal.sky1 }], B.t0 + .14);
    var s2 = inkPiece(ctx, "SKY2", stripes(ax, aw, 120, 640, 8, 4, 30, pal.sky2, bot), B.t0 + .14);
    pull(ctx, [s1, s2], { name: "SKY", x0: ax, x1: ax + aw, v0: ART.y - 20, v1: bot, t0: B.t0 - .08, t1: B.t0 + .14, squeegee: true, beads: [pal.sky1, pal.sky2] });
    planes.push([s2, 6, -10, .2]);
    var sn = inkPiece(ctx, "SUN", sun(760, 300, 120, pal.accent), B.t0 + .3);
    pull(ctx, [sn], { name: "SUN", x0: 560, x1: 964, v0: 120, v1: 480, t0: B.t0 + .28, t1: B.t0 + .38 }); planes.push([sn, -14, 8, -.5]);
    var nm = txt(c, ctx.P + "_VALUE", String(B.value), { fam: DISP, style: "Black", size: 560, color: pal.near, x: 500, y: 640, align: "center", maxW: 840 }); ink(nm.layer, { wet: on[0] + .4, rim: 2.4 });
    pull(ctx, [nm.layer], { name: "VALUE", x0: ax, x1: ax + aw, v0: nm.top - 20, v1: nm.bottom + 10, t0: B.t0 + .06, t1: B.t0 + .26, squeegee: true, beads: [pal.near] }); planes.push([nm.layer, 22, -16, .8]);
    var rp = [[ax, 760], [170, 690], [300, 610], [420, 540], [500, 480], [560, 520], [660, 600], [760, 650], [880, 700], [ax + aw, 740]];
    var fr = inkPiece(ctx, "FAR", [ridge(rp, bot, pal.far)], on[1]), fc = inkPiece(ctx, "FACET", facets(rp, pal.sky2), on[1]);
    pull(ctx, [fr, fc], { name: "FAR", x0: ax, x1: ax + aw, v0: 460, v1: bot, t0: B.t0 + .4, t1: B.t0 + .58, squeegee: true, beads: [pal.far, pal.sky2] }); planes.push([fr, -24, 12, -.6], [fc, -24, 12, -.6]);
    var md = inkPiece(ctx, "MID", [ridge(wave(ax, ax + aw, 860, [[30, 90, 1], [14, 41, 0]], 24), bot, pal.mid)], on[1] + .2);
    var nodes = [ridge(wave(ax, ax + aw, 1000, [[8, 60, 1]], 30), bot, pal.near)];
    for (var i = 0; i < 16; i++) { var x = 60 + i * 58 + 14 * R(), h = 120 + 120 * R(); nodes.push(pine(x, 1015, h, h * .42, pal.near)); }
    var nr = inkPiece(ctx, "NEAR", nodes, on[1] + .2);
    pull(ctx, [md, nr], { name: "LAND", x0: ax, x1: ax + aw, v0: 700, v1: bot, t0: on[1] - .04, t1: on[1] + .14, squeegee: true, beads: [pal.mid, pal.near] }); planes.push([md, 30, 18, .5], [nr, -36, 24, -.7]);
    // loose planes: offset and turned a little, drifting by depth, with a thicker paper shadow; one hold key snaps them into register on the hit
    for (var p = 0; p < planes.length; p++) { var Lp = planes[p][0], v = Lp.position.value, dx = planes[p][1], dy = planes[p][2], rr = planes[p][3];
      var a = Lp.anchorPoint.value; if (a[0] === 0 && a[1] === 0) { Lp.anchorPoint.setValue([PW / 2, PH / 2]); v = [v[0] + PW / 2, v[1] + PH / 2]; }   // turn about the sheet's centre
      keys(Lp.position, [{ t: B.t0, v: [v[0] + dx, v[1] + dy], o: "L" }, { t: snap - .03, v: [v[0] + dx * .55, v[1] + dy * .55], i: "L", o: "H" }, { t: snap, v: v, i: "H" }]);
      keys(Lp.rotation, [{ t: B.t0, v: rr, o: "L" }, { t: snap - .03, v: rr * .5, i: "L", o: "H" }, { t: snap, v: 0, i: "H" }]);
      var sh = Lp.property("ADBE Effect Parade").property(1); keys(sh.property("Distance"), [{ t: B.t0, v: 12, o: "H" }, { t: snap, v: 2, i: "H" }]);
      keys(sh.property("Softness"), [{ t: B.t0, v: 14, o: "H" }, { t: snap, v: 1, i: "H" }]); }
    band(ctx, { pal: pal, name: B.label.toUpperCase() + ", COUNTED.", num: "04", stats: [["FRAMES", String(B.value)], ["FPS", String(scene.fps)], ["SECONDS", (B.value / scene.fps).toFixed(1)]],
      tBand: on[1] + .16, squeegee: true, tName: on[1] + .34, tNum: on[1] + .44, tStats: [snap + .05, snap + .12, snap + .19] });
    return ctx; }

  // ---- 5. line (night): the spoken line is the poster, each word one short pull on its onset, dusk bands above
  function posterLine(scene, P, R, notes, WL) { var B = scene.beat.line, pal = PALETTES.night, c = posterComp(P + "_P5", scene), ctx = ctxFor(c, P + "5", R, notes);
    var lw = wordsIn(WL, B.t0, B.t1), ax = ART.x, aw = ART.w, bot = ART.y + ART.h;
    var bs = inkPiece(ctx, "BASE", [{ k: "rect", x: ax, y: ART.y, w: aw, h: ART.h, color: pal.near }, { k: "rect", x: BAND.x, y: BAND.y, w: BAND.w, h: BAND.h, color: pal.near }], B.t0 + .2);
    var st = inkPiece(ctx, "BANDS", [{ k: "rect", x: ax, y: ART.y, w: aw, h: 60, color: pal.mid }].concat(stripes(ax, aw, 96, 300, 6, 26, 4, pal.mid)), B.t0 + .2);
    pull(ctx, [bs, st], { name: "BASE", x0: ax, x1: ax + aw, v0: ART.y - 20, v1: BAND.y + BAND.h, t0: B.t0 - .06, t1: B.t0 + .2, squeegee: true, beads: [pal.mid, pal.near] });
    var words = B.text.toUpperCase().split(" "), rows = [], r0 = [];   // rows: one long word or two short ones
    for (var i = 0; i < words.length; i++) { r0.push(i); var nxt = words[i + 1];
      if (!(words[i].length <= 2 && nxt && nxt.length <= 4)) { rows.push(r0); r0 = []; } }
    if (r0.length) rows.push(r0);
    var top = 230, pitch = Math.min(205, (bot - 60 - top) / Math.max(1, rows.length - 1));
    for (var r = 0; r < rows.length; r++) { var s = [], t = lw[Math.min(rows[r][0], lw.length - 1)].s;
      for (var q = 0; q < rows[r].length; q++) s.push(words[rows[r][q]]);
      var last = r === rows.length - 1;
      item(ctx, "W" + r, s.join(" "), { fam: DISP, style: "Black", size: 230, color: last ? pal.accent : pal.sky1, x: 500, y: top + pitch * r, align: "center", maxW: 820 }, t - .02); }
    band(ctx, { pal: pal, name: "SUBTITLES", num: "05", stats: [["WORDS", String(words.length)], ["PULLS", String(rows.length)], ["INKS", "4"]],
      bandPulled: true, tName: B.t0 + .22, tNum: B.t0 + .3, tStats: [B.t0 + .36, B.t0 + .42, B.t0 + .48] });
    return ctx; }

  // ---- the banner for the series wall (1000 x 290): stepped sky, hills, a strip, the end line
  function banner(scene, P, R, notes, WL, t) { var B = scene.beat.end, pal = PALETTES.dawn, c = app.project.items.addComp(P + "_BANNER", 1000, 290, 1, scene.duration, scene.fps), ctx = ctxFor(c, P + "B", R, notes);
    c.layers.addSolid(PAPER, P + "_BANNER_PAPER", 1000, 290, 1);
    var s1 = inkPiece(ctx, "SKY1", [{ k: "rect", x: 20, y: 20, w: 960, h: 200, color: pal.sky1 }], t + .12);
    var s2 = inkPiece(ctx, "SKY2", [{ k: "rect", x: 20, y: 20, w: 960, h: 30, color: pal.sky2 }].concat(stripes(20, 960, 56, 150, 5, 14, 3, pal.sky2)), t + .12);
    var hl = inkPiece(ctx, "HILL", [ridge(wave(20, 980, 190, [[12, 80, 0], [6, 31, 2]], 20), 220, pal.mid)], t + .12);
    var sp = inkPiece(ctx, "STRIP", [{ k: "rect", x: 20, y: 226, w: 960, h: 44, color: pal.near }], t + .12);
    pull(ctx, [s1, s2, hl, sp], { name: "ALL", x0: 20, x1: 980, v0: 0, v1: 290, t0: t - .1, t1: t + .06 });
    var ew = onsets(wordsIn(WL, B.t0, B.t1));
    item(ctx, "END", B.text.toUpperCase(), { fam: DISP, style: "Black", size: 170, color: pal.near, x: 500, y: 196, align: "center", maxW: 900 }, ew[ew.length - 1] + .02);
    item(ctx, "SUB", scene.beat.title.context.toUpperCase() + " " + scene.beat.title.hero.toUpperCase(), { fam: LAB, style: "SemiBold", size: 22, color: pal.sky1, x: 500, y: 257, align: "center", tracking: 420 }, ew[ew.length - 1] + .2);
    return ctx; }

  // ---- main-comp props
  // the squeegee, in poster units, parented to the poster layer: a wood handle sliver, an aluminium holder, the rubber blade, and the ink bead
  // rolling ahead of it (several colours = a split fountain). It travels linearly (a squeegee does not ease) and leaves off the sheet.
  function squeegee(comp, name, poster, q, R) { var n = [], x0 = -40, x1 = 1040, beads = q.beads, sw = (x1 - x0) / beads.length;
    n.push({ k: "rect", x: 360, y: -150, w: 280, h: 84, color: hex("B98552") }, { k: "rect", x: 360, y: -150, w: 280, h: 10, color: hex("D6A770") });
    n.push({ k: "rect", x: x0, y: -72, w: x1 - x0, h: 50, color: hex("9EA5AB") }, { k: "rect", x: x0, y: -72, w: x1 - x0, h: 9, color: hex("D9DDE0") }, { k: "rect", x: x0, y: -30, w: x1 - x0, h: 8, color: hex("6A7178") });
    n.push({ k: "rect", x: x0 + 6, y: -22, w: x1 - x0 - 12, h: 22, color: hex("2B2926") });
    for (var i = 0; i < beads.length; i++) { var bx = x0 + 10 + sw * i, bw = sw - (i < beads.length - 1 ? 0 : 20);
      n.push({ k: "rrect", x: bx, y: 1, w: bw, h: 26, r: 12, color: mix(beads[i], [0, 0, 0], .28) }, { k: "rrect", x: bx + 2, y: 2, w: bw - 4, h: 15, r: 7, color: beads[i] },
        { k: "rrect", x: bx + 6, y: 4, w: bw - 12, h: 5, r: 2.5, color: mix(beads[i], [1, 1, 1], .45) }); }
    for (var g = 0; g < 7; g++) n.push({ k: "rrect", x: x0 + 60 + 140 * g + 40 * R(), y: 6, w: 18, h: 4, r: 2, color: [1, 1, 1] });
    var L = piece(comp, name, n); L.parent = poster; L.scale.setValue([100, 100]); L.rotation.setValue(0); L.anchorPoint.setValue([500, 0]);
    var sp = (q.v1 - q.v0) / (q.t1 - q.t0), pre = 260, post = 900, ta = q.t0 - pre / sp, tb = q.t1 + post / sp, va = q.v0 - pre;
    if (ta < 0) { va = q.v0 - sp * q.t0; ta = 0; }                       // no keys before 0: start the pre-roll where it would be at 0
    keys(L.position, [{ t: ta, v: [500, va], o: "L" }, { t: tb, v: [500, q.v1 + post], i: "L" }]);
    keys(L.rotation, [{ t: ta, v: -.7, o: "L" }, { t: tb, v: .9, i: "L" }]);
    span(L, ta, tb);
    var s = fx(L, "ADBE Drop Shadow"); s.property("Opacity").setValue(45); s.property("Direction").setValue(160); s.property("Distance").setValue(16); s.property("Softness").setValue(22);
    return L; }
  // a foreground silhouette truck: a mass of pines crossing the frame fast, full cover on the switch for about two frames
  // the mass is only a little wider than the frame (core 1120, tiers to about 1300), so full cover lasts one or two frames, never a dark blank
  function truck(comp, name, tc, dir, color, R) { var n = [{ k: "rect", x: -560, y: -300, w: 1120, h: 2600, color: color }];
    for (var i = 0; i < 8; i++) { var side = i % 2 ? 1 : -1, h = 1300 + 1000 * R();
      n.push(pine(side * (540 + 30 * R()), 2300, h, 180 + 120 * R(), color)); }
    var L = piece(comp, name, n), d = dir || 1; L.motionBlur = true;
    keys(L.position, [{ t: tc - .2, v: [540 + 1300 * d, -200], o: "L" }, { t: tc + .2, v: [540 - 1300 * d, -200], i: "L" }]); span(L, tc - .2, tc + .2);
    return L; }
  // the wood wall (also the workbench): planks with dark seams, and a grain layer above it (Fractal Noise replaces a layer's pixels, so it is its own layer)
  function wood(comp, name, parent) { var n = [{ k: "rect", x: -400, y: -400, w: 1880, h: 2720, color: hex("4A3324") }];
    for (var x = -400; x < 1480; x += 132) { n.push({ k: "rect", x: x, y: -400, w: 6, h: 2720, color: hex("2E1F15") }, { k: "rect", x: x + 6, y: -400, w: 3, h: 2720, color: hex("5E4330") }); }
    var L = piece(comp, name, n); L.parent = parent; L.position.setValue([0, 0]); L.scale.setValue([100, 100]);
    var G = piece(comp, name + "_GRAIN", [{ k: "rect", x: -400, y: -400, w: 1880, h: 2720, color: [.5, .5, .5] }]), f = fx(G, "ADBE Fractal Noise");
    try { f.property("Contrast").setValue(150); f.property("Uniform Scaling").setValue(0); f = G.property("ADBE Effect Parade").property(1);
      f.property("Scale Width").setValue(12); f.property("Scale Height").setValue(900); f.property("Complexity").setValue(4); } catch (e) {}
    G.blendingMode = BlendingMode.OVERLAY; G.opacity.setValue(22); G.parent = parent; G.position.setValue([0, 0]); G.scale.setValue([100, 100]);
    return L; }
  function paperTexture(comp, P, notes) { var W = comp.width, H = comp.height;
    var M = comp.layers.addSolid([.5, .5, .5], P + "_MOTTLE", W, H, 1), fm = fx(M, "ADBE Fractal Noise");
    fm.property("Contrast").setValue(120); fm.property("Complexity").setValue(6); fm.property("Scale").setValue(380); M.blendingMode = BlendingMode.OVERLAY; M.opacity.setValue(14);
    var F = comp.layers.addSolid([.5, .5, .5], P + "_FIBRE", W, H, 1), ff = fx(F, "ADBE Fractal Noise");
    try { ff.property("Contrast").setValue(160); ff.property("Uniform Scaling").setValue(0); ff = F.property("ADBE Effect Parade").property(1);
      ff.property("Scale Width").setValue(26); ff.property("Scale Height").setValue(700); ff.property("Complexity").setValue(3); ff.property("Rotation").setValue(3); } catch (e) { notes.push("fibre: " + e.toString()); }
    F.blendingMode = BlendingMode.SOFT_LIGHT; F.opacity.setValue(9);
    var V = comp.layers.addSolid([0, 0, 0], P + "_PINHOLES", W, H, 1), fv = fx(V, "ADBE Fractal Noise");
    fv.property("Contrast").setValue(520); fv.property("Brightness").setValue(-175); fv.property("Scale").setValue(6); fv.property("Complexity").setValue(1);
    V.blendingMode = BlendingMode.SCREEN; V.opacity.setValue(40);
    var G = comp.layers.addSolid([1, 1, 1], P + "_GRAIN", W, H, 1); G.adjustmentLayer = true; var gn = fx(G, "ADBE Noise"); gn.property("Amount of Noise").setValue(4);
    gn = G.property("ADBE Effect Parade").property(1); gn.property(2).setValue(0); }
  function hang(L) { var s = fx(L, "ADBE Drop Shadow"); s.property("Opacity").setValue(50); s.property("Direction").setValue(150); s.property("Distance").setValue(14); s.property("Softness").setValue(30); return L; }
  function wordsIn(list, t0, t1) { var r = []; for (var i = 0; i < list.length; i++) if (list[i].s >= t0 - .05 && list[i].s < t1 - .02) r.push(list[i]); return r; }
  function onsets(list) { var r = []; for (var i = 0; i < list.length; i++) r.push(list[i].s); return r; }
  function clearOwned(comp, prefix) { AESLib.clearOwned(comp, prefix); }

  // buildScene: the shared test scene as a run of screen-printed posters. comp = an empty 1080 x 1920 comp at scene.fps.
  // One poster per beat, printed on camera (one pull per word or idea), changed by a pine truck; the real frame comes back for the carry and
  // is re-inked in a night palette on "becomes"; the camera pulls back to the series hung on the wall under a banner that prints the end line.
  function buildScene(comp, scene, opts) {
    fontOK(); var P = opts.prefix || "SILK", A = opts.assets, B = scene.beat, WL = scene.wordList, notes = [], R = rng(23), W = comp.width, H = comp.height;
    clearOwned(comp, P); comp.motionBlur = true;
    var c1 = posterTitle(scene, P, R, notes, WL), c2 = posterPicture(scene, P, R, notes, WL);
    var io = onsets(wordsIn(WL, B.input.t0, B.input.t1)), cw = onsets(wordsIn(WL, B.carry.t0, B.carry.t1));
    var c3 = posterInput(scene, P, R, notes, WL, A, { pal: "ember", tag: "A", band: { name: "A REAL FRAME", num: "03", stats: [["SOURCE", "MY VIDEO"], ["INKS", "3"], ["PULLS", "3"]],
      tName: io[3] + .2, tNum: io[3] + .28, tStats: [io[4] + .18, io[5] + .1, io[6] + .1] } });
    var c4 = posterNumber(scene, P, R, notes, WL), c5 = posterLine(scene, P, R, notes, WL);
    var c6 = posterInput(scene, P, R, notes, WL, A, { pal: "night", tag: "B", instant: true, band: { name: "BECOMES THE NEXT", num: "06", nameColor: PALETTES.night.sky2,
      stats: [["SAME", "SHAPES"], ["NEW", "INKS"]], tName: cw[4] + .02, tNum: cw[4] + .1, tStats: [cw[5] + .04, cw[5] + .12] } });
    var cb = banner(scene, P, R, notes, WL, B.end.t0 + .3);

    // the wall: a null at the last poster's place on the wall; it holds the camera at that poster until the end, then pulls back to the series
    var WX = 785, WY = 1510, WS = 44, Z = 104 / WS * 100;
    var WALL = comp.layers.addNull(); WALL.name = P + "_WALL"; WALL.anchorPoint.setValue([WX, WY]); WALL.position.setValue([WX, WY]);
    wood(comp, P + "_WOOD", WALL);
    function poster(ctxp, name, t0, t1, push, noSqueegee) { var L = comp.layers.add(ctxp.comp); L.name = name; span(L, t0, t1); hang(L);
      L.position.setValue([W / 2, H / 2]); if (push) keys(L.scale, [{ t: t0, v: [104, 104], o: 60 }, { t: t1, v: [104 * push, 104 * push], i: 60 }]); else L.scale.setValue([104, 104]);
      if (!noSqueegee) for (var i = 0; i < ctxp.pulls.length; i++) squeegee(comp, name + "_SQ" + i, L, ctxp.pulls[i], R);
      return L; }
    function onWall(ctxp, name, x, y, sc, t0) { var L = comp.layers.add(ctxp.comp); L.name = name; L.parent = WALL; L.position.setValue([x, y]); L.scale.setValue([sc, sc]); L.rotation.setValue(0); span(L, t0, scene.duration); hang(L);
      var pins = piece(comp, name + "_PINS", [{ k: "circle", x: x - PW * sc / 200 + 16, y: y - PH * sc / 200 + 16, r: 7, color: hex("8C8F92") }, { k: "circle", x: x + PW * sc / 200 - 16, y: y - PH * sc / 200 + 16, r: 7, color: hex("8C8F92") }]);
      pins.parent = WALL; pins.position.setValue([0, 0]); pins.scale.setValue([100, 100]); span(pins, Math.max(t0, E0), scene.duration); return L; }
    var t12 = B.picture.t0, t23 = B.input.t0, t34 = B.number.t0, t45 = B.line.t0, t56 = B.carry.t0, tre = cw[3], E0 = B.end.t0;
    poster(c1, P + "_POSTER1", 0, t12, 1.03); poster(c2, P + "_POSTER2", t12, t23, 1.03); poster(c3, P + "_POSTER3", t23, t34, 1.04);
    poster(c4, P + "_POSTER4", t34, t45, 1.02); poster(c5, P + "_POSTER5", t45, t56, 1.03);
    poster(c3, P + "_POSTER3B", t56, tre + .4, null, true);

    // the series wall (built before the camera keys: parenting compensates for the parent's transform at time 0)
    var wb = comp.layers.add(cb.comp); wb.name = P + "_BANNERL"; wb.parent = WALL; wb.position.setValue([540, 300]); wb.scale.setValue([98, 98]); span(wb, E0, scene.duration); hang(wb);
    onWall(c1, P + "_WALL1", 295, 820, WS, E0); onWall(c2, P + "_WALL2", WX, 820, WS, E0); onWall(c4, P + "_WALL4", 295, WY, WS, E0);
    var last = onWall(c6, P + "_WALL6", WX, WY, WS, tre);

    // the re-ink: a wide squeegee travels diagonally; behind its blade the same poster is in the night palette
    var th = -12, n = [Math.sin(-th * Math.PI / 180), Math.cos(-th * Math.PI / 180)], s0 = -1180, s1 = 1180, dur = .32;
    function along(s) { return [W / 2 + s * n[0], H / 2 + s * n[1]]; }
    var WM = piece(comp, P + "_REINK_MATTE", [{ k: "rect", x: -2600, y: -6000, w: 5200, h: 6000, color: [1, 1, 1] }]); WM.rotation.setValue(th);
    keys(WM.position, [{ t: tre, v: along(s0), o: "L" }, { t: tre + dur, v: along(s1), i: "L" }]);   // parks at s1: the rect is 6000 deep, so pushing it further uncovers the sheet from behind
    last.setTrackMatte(WM, TrackMatteType.ALPHA); WM.enabled = false;
    var bn = [{ k: "rect", x: 380, y: -150, w: 240, h: 80, color: hex("B98552") }, { k: "rect", x: -1500, y: -72, w: 3000, h: 50, color: hex("9EA5AB") },
      { k: "rect", x: -1500, y: -72, w: 3000, h: 9, color: hex("D9DDE0") }, { k: "rect", x: -1500, y: -22, w: 3000, h: 22, color: hex("2B2926") }];
    var bc = [PALETTES.night.sky2, PALETTES.night.mid, PALETTES.night.near, PALETTES.night.accent];
    for (var bi = 0; bi < 12; bi++) { var bx = -1500 + 250 * bi, col = bc[bi % bc.length];
      bn.push({ k: "rrect", x: bx, y: 1, w: 250, h: 28, r: 13, color: mix(col, [0, 0, 0], .28) }, { k: "rrect", x: bx + 2, y: 2, w: 246, h: 16, r: 8, color: col }); }
    var BLD = piece(comp, P + "_REINK_BLADE", bn); BLD.rotation.setValue(th); BLD.motionBlur = true;
    keys(BLD.position, [{ t: tre - .12, v: along(s0 - (s1 - s0) / dur * .12), o: "L" }, { t: tre + dur + .12, v: along(s1 + (s1 - s0) / dur * .12), i: "L" }]); span(BLD, tre - .12, tre + dur + .12);
    var bs = fx(BLD, "ADBE Drop Shadow"); bs.property("Opacity").setValue(45); bs.property("Distance").setValue(18); bs.property("Softness").setValue(24);

    // the camera: held on the last poster, then a log pull-back to the series wall
    keys(WALL.position, [{ t: 0, v: [W / 2, H / 2], o: "H" }, { t: E0, v: [W / 2, H / 2], i: "H", o: 20 }, { t: E0 + .62, v: [WX, WY], i: 85 }]);
    keys(WALL.scale, [{ t: 0, v: [Z, Z], o: "H" }, { t: E0, v: [Z, Z], i: "H", o: 20 }, { t: E0 + .62, v: [100, 100], i: 85 }]);

    // poster changes: a pine mass trucks through the foreground, centred on the switch
    var tc = [t12, t23, t34, t45, t56], tcol = [PALETTES.dawn.near, PALETTES.noon.near, PALETTES.ember.near, PALETTES.dusk.near, PALETTES.night.near];
    for (var k = 0; k < tc.length; k++) truck(comp, P + "_TRUCK" + k, tc[k], k % 2 ? -1 : 1, tcol[k], R);

    paperTexture(comp, P, notes);
    return { layers: comp.numLayers, notes: notes };
  }
  return { DISP: DISP, LAB: LAB, PALETTES: PALETTES, PAPER: PAPER, fontOK: fontOK, keys: keys, piece: piece, stripes: stripes, pine: pine, ridge: ridge, facets: facets,
    wave: wave, sun: sun, ink: ink, txt: txt, pull: pull, item: item, band: band, posterComp: posterComp, squeegee: squeegee, truck: truck, wood: wood,
    paperTexture: paperTexture, wordsIn: wordsIn, onsets: onsets, clearOwned: clearOwned, buildScene: buildScene };
})();
