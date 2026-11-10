// Blueprint style: brand-neutral ES3 helpers. No project mutation happens at load.
// Read styles/blueprint/STYLE.md first. White technical line work drawn on a sheet of cyanotype paper in drafting order, hand-lettered notes,
// a title block, one red rubber stamp for the verdict. Every stroke draws on with a glowing nib; nothing fades, bounces or turns 3D.
// Adapted from Lemo-Opuscar's blueprint style (MIT, LemoLab); see library/styles/LICENSE-lemo-opuscar.txt.
var AESBlueprint = (function () {
  var HAND = "Architects Daughter", TECH = "B612";
  var PALETTE = { deep: [.07, .16, .36], light: [.13, .28, .6], line: [.906, .941, .976], dim: [.78, .86, .95], table: [.051, .067, .086], stamp: [.80, .16, .14] };
  var W = { outline: 4.4, detail: 2.8, thin: 1.8, hair: 1.2 };                                       // the four line weights at 1080 wide
  var DASH = { centre: [34, 9, 7, 9], hidden: [10, 8], phantom: [34, 8, 7, 8, 7, 8] };              // long-short, short, long-short-short
  var N = 0, WID = {};                                                                                // a counter for unique layer names (expressions find layers by name); lettered widths by layer name
  function fontOK() { AESLib.font(HAND, "Regular"); AESLib.font(TECH, "Bold"); AESLib.font(TECH, "Regular"); return true; }
  function lin(prop, times, vals) { prop.setValuesAtTimes(times, vals); var L = KeyframeInterpolationType.LINEAR;
    for (var i = 0; i < times.length; i++) prop.setInterpolationTypeAtKey(prop.nearestKeyIndex(times[i]), L, L); return prop; }
  function grp(L) { return L.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group"); }
  function own(L, cam) { if (cam) L.parent = cam; return L; }
  // one stroke: pts in comp space, drawn on along its length from t over dur (linear, like a pen), with a glowing nib riding the head.
  // o = { w, color, closed, dash, t, dur, nib (default true), out, cam, opacity }
  function stroke(comp, name, pts, o) { var L = comp.layers.addShape(); L.name = name + "_" + (N++);
    var G = L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group"); G.name = "G";
    var P = grp(L).addProperty("ADBE Vector Shape - Group"); P.name = "P"; var s = new Shape(); s.vertices = pts; s.closed = !!o.closed; P.property("ADBE Vector Shape").setValue(s);
    var St = grp(L).addProperty("ADBE Vector Graphic - Stroke"); St.property("ADBE Vector Stroke Color").setValue(o.color || PALETTE.line); St.property("ADBE Vector Stroke Width").setValue(o.w || W.outline);
    St.property("ADBE Vector Stroke Line Cap").setValue(2); St.property("ADBE Vector Stroke Line Join").setValue(2);
    if (o.dash) for (var d = 0; d < o.dash.length; d++) grp(L).property("ADBE Vector Graphic - Stroke").property("ADBE Vector Stroke Dashes")
      .addProperty((d % 2 ? "ADBE Vector Stroke Gap " : "ADBE Vector Stroke Dash ") + (Math.floor(d / 2) + 1)).setValue(o.dash[d]);
    var T = grp(L).addProperty("ADBE Vector Filter - Trim"); T.name = "T";
    L.anchorPoint.setValue([0, 0]); L.position.setValue([0, 0]); if (o.opacity !== undefined) L.opacity.setValue(o.opacity);
    var t = o.t || 0, dur = o.dur || .2; lin(grp(L).property("T").property("ADBE Vector Trim End"), [t, t + dur], [0, 100]); L.inPoint = t; if (o.out !== undefined) L.outPoint = o.out;
    own(L, o.cam); if (o.nib !== false && dur >= .1) nib(comp, L, t, t + dur, o.cam); return L; }
  // the nib: a hot dot and a soft halo that follow the stroke's trim head (pointOnPath of its own path at the trim end)
  function nib(comp, L, t0, t1, cam) { var D = comp.layers.addShape(); D.name = L.name + "_NIB"; var root = D.property("ADBE Root Vectors Group"), sz = [[26, .3], [8, 1]];
    for (var i = 0; i < sz.length; i++) { var g = root.addProperty("ADBE Vector Group"), c = g.property("ADBE Vectors Group");
      c.addProperty("ADBE Vector Shape - Ellipse").property("ADBE Vector Ellipse Size").setValue([sz[i][0], sz[i][0]]);
      var f = root.property(root.numProperties).property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill"); f.property("ADBE Vector Fill Color").setValue([1, 1, 1]); f.property("ADBE Vector Fill Opacity").setValue(100 * sz[i][1]); }
    D.anchorPoint.setValue([0, 0]);
    D.position.expression = 'var L = thisComp.layer("' + L.name + '"), g = L.content("G");\ng.content("P").path.pointOnPath(Math.min(1, Math.max(0, g.content("T").end / 100)));';
    D.inPoint = t0; D.outPoint = t1 + .04; own(D, cam); return D; }
  function c4(c) { return [c[0], c[1], c[2], 1]; }
  function rect(x, y, w, h) { return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; }
  function circle(cx, cy, r, n, a0) { var p = []; n = n || 48; a0 = a0 === undefined ? -Math.PI / 2 : a0; for (var i = 0; i < n; i++) { var a = a0 + 2 * Math.PI * i / n; p.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return p; }
  // fine-line hatching at 45 degrees inside a rect, every stroke drawn one after another (Trim Multiple Shapes: individually)
  function hatch(comp, name, x, y, w, h, gap, t, dur, cam, out) { var L = comp.layers.addShape(); L.name = name + "_" + (N++);
    L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").name = "G"; var step = gap * Math.SQRT2, n = 0;
    for (var k = x + y + step / 2; k < x + w + y + h; k += step) { var xa = Math.max(x, k - (y + h)), xb = Math.min(x + w, k - y); if (xb - xa < 2) continue;
      var s = new Shape(); s.vertices = [[xa, k - xa], [xb, k - xb]]; s.closed = false; grp(L).addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(s); n++; }
    var St = grp(L).addProperty("ADBE Vector Graphic - Stroke"); St.property("ADBE Vector Stroke Color").setValue(PALETTE.line); St.property("ADBE Vector Stroke Width").setValue(W.thin);
    var T = grp(L).addProperty("ADBE Vector Filter - Trim"); T.property("ADBE Vector Trim Type").setValue(2);
    lin(grp(L).property("ADBE Vector Filter - Trim").property("ADBE Vector Trim End"), [t, t + dur], [0, 100]);
    L.anchorPoint.setValue([0, 0]); L.position.setValue([0, 0]); L.inPoint = t; if (out !== undefined) L.outPoint = out; own(L, cam); return L; }
  // lettering, written on left to right: an opacity animator whose range start is keyed (o.keys = [[t, percent], ...], or t and dur).
  // Flush left on (x, y baseline) unless o.center. o = { family, style, size, color, tracking, leading, t, dur, keys, center, out, cam, nib }
  function letter(comp, name, str, o) { var fam = o.family || HAND, sty = o.style || "Regular";
    var L = AESLib.text(comp, name + "_" + (N++), str, { family: fam, style: sty, size: o.size, color: o.color || PALETTE.line, just: "left", tracking: o.tracking || 0, leading: o.leading, pos: [o.x, o.y] });
    var r = L.sourceRectAtTime(0, false); L.anchorPoint.setValue([o.center ? r.left + r.width / 2 : r.left, 0]); L.position.setValue([o.x, o.y]);
    var keys = (o.keys && o.keys.length > 1) ? o.keys : [[o.t !== undefined ? o.t : 0, 0], [(o.t !== undefined ? o.t : 0) + (o.dur || Math.max(.18, str.length * .028)), 100]];
    var an = L.property("ADBE Text Properties").property("ADBE Text Animators").addProperty("ADBE Text Animator"); an.name = "W";
    L.property("ADBE Text Properties").property("ADBE Text Animators").property("W").property("ADBE Text Animator Properties").addProperty("ADBE Text Opacity").setValue(0);
    L.property("ADBE Text Properties").property("ADBE Text Animators").property("W").property("ADBE Text Selectors").addProperty("ADBE Text Selector");
    var sel = L.property("ADBE Text Properties").property("ADBE Text Animators").property("W").property("ADBE Text Selectors").property(1), ts = [], ps = [];
    try { sel.property("ADBE Text Range Advanced").property("ADBE Text Selector Smoothness").setValue(0); } catch (e) {}
    for (var i = 0; i < keys.length; i++) { ts.push(keys[i][0]); ps.push(keys[i][1]); }
    lin(L.property("ADBE Text Properties").property("ADBE Text Animators").property("W").property("ADBE Text Selectors").property(1).property("ADBE Text Percent Start"), ts, ps);
    L.inPoint = Math.max(0, ts[0] - .01); if (o.out !== undefined) L.outPoint = o.out; own(L, o.cam);
    if (o.nib && str.indexOf("\r") < 0) { var x0 = o.center ? o.x - r.width / 2 : o.x, yN = o.y - .35 * o.size, D = comp.layers.addShape(); D.name = L.name + "_NIB";
      var root = D.property("ADBE Root Vectors Group"); root.addProperty("ADBE Vector Shape - Ellipse").property("ADBE Vector Ellipse Size").setValue([8, 8]);
      root.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue([1, 1, 1]); D.anchorPoint.setValue([0, 0]);
      var px = []; for (var j = 0; j < ts.length; j++) px.push([x0 + r.width * ps[j] / 100, yN]); lin(D.position, ts, px); D.inPoint = ts[0]; D.outPoint = ts[ts.length - 1] + .04; own(D, o.cam); }
    WID[L.name] = r.width; return L; }
  // keys that letter a string word by word on spoken onsets: words = [{ text, s }]; the line is the words joined, breaks given as "\r"
  function spokenKeys(str, words, rate) { var keys = [], at = 0, total = str.length, last = -1;
    for (var i = 0; i < words.length; i++) { var w = words[i].text.toUpperCase().replace(/[.,!?;:]+$/, ""), idx = str.indexOf(w, at); if (idx < 0) continue;
      var t0 = Math.max(words[i].s, last + .01), t1 = t0 + Math.max(.08, w.length * (rate || .03)); if (i + 1 < words.length) t1 = Math.min(t1, Math.max(t0 + .05, words[i + 1].s - .01));
      keys.push([t0, 100 * idx / total]); keys.push([t1, 100 * (idx + w.length) / total]); at = idx + w.length; last = t1; }
    return keys; }
  // a horizontal dimension: extension lines, the line with open arrowheads, a gap for its value. o = { ext (up from y0), gap, t, cam, out }
  function dim(comp, name, x0, x1, y, o) { var t = o.t, cm = o.cam, out = o.out, gap = o.gap || 0, cx = (x0 + x1) / 2, a = 16, r = [];
    r.push(stroke(comp, name + "_E0", [[x0, o.from], [x0, y + 12]], { w: W.hair, t: t, dur: .1, cam: cm, out: out, nib: false }));
    r.push(stroke(comp, name + "_E1", [[x1, o.from], [x1, y + 12]], { w: W.hair, t: t + .03, dur: .1, cam: cm, out: out, nib: false }));
    r.push(stroke(comp, name + "_L0", [[x0, y], [cx - gap / 2, y]], { w: W.thin, t: t + .08, dur: .16, cam: cm, out: out }));
    r.push(stroke(comp, name + "_L1", [[x1, y], [cx + gap / 2, y]], { w: W.thin, t: t + .08, dur: .16, cam: cm, out: out, nib: false }));
    r.push(stroke(comp, name + "_A0", [[x0 + a, y - 6], [x0, y], [x0 + a, y + 6]], { w: W.thin, t: t + .08, dur: .06, cam: cm, out: out, nib: false }));
    r.push(stroke(comp, name + "_A1", [[x1 - a, y - 6], [x1, y], [x1 - a, y + 6]], { w: W.thin, t: t + .08, dur: .06, cam: cm, out: out, nib: false }));
    return r; }
  // a part balloon: a circle with its number, a leader to the part ending in a dot
  function balloon(comp, name, n, bx, by, tx, ty, t, cam, out) { var r = 24, dx = tx - bx, dy = ty - by, d = Math.sqrt(dx * dx + dy * dy);
    stroke(comp, name + "_C", circle(bx, by, r, 32), { closed: true, w: W.detail, t: t, dur: .14, cam: cam, out: out });
    stroke(comp, name + "_LD", [[bx + dx / d * r, by + dy / d * r], [tx, ty]], { w: W.thin, t: t + .12, dur: .1, cam: cam, out: out, nib: false });
    stroke(comp, name + "_DOT", circle(tx, ty, 3.5, 10), { closed: true, w: 3, t: t + .2, dur: .02, cam: cam, out: out, nib: false });
    letter(comp, name + "_N", String(n), { x: bx, y: by + 11, size: 30, center: true, t: t + .12, dur: .08, cam: cam, out: out }); }
  // a strike through a lettered label (a revision), drawn left to right
  function strike(comp, name, L, x, y, size, t, cam, out) { return stroke(comp, name, [[x - 8, y - .32 * size], [x + WID[L.name] + 8, y - .36 * size]], { w: W.detail, t: t, dur: .14, cam: cam, out: out }); }
  function solid(comp, name, color, cam) { var L = comp.layers.addSolid(color, name, comp.width, comp.height, 1); return own(L, cam); }
  function fx(L, match) { return L.property("ADBE Effect Parade").addProperty(match); }
  function fxp(L, i, name) { return L.property("ADBE Effect Parade").property(i).property(name); }
  // the sheet: two Prussian blues (radial), fbm mottling, coating streaks, two fold creases, bleached edges; lying on a dark table with a shadow
  function sheet(comp, P, cam) { var out = [], Wd = comp.width, Ht = comp.height;
    var S = solid(comp, P + "_SHEET", PALETTE.deep, cam); fx(S, "ADBE Ramp");
    fxp(S, 1, "Start of Ramp").setValue([Wd * .45, Ht * .42]); fxp(S, 1, "Start Color").setValue(c4(PALETTE.light)); fxp(S, 1, "End of Ramp").setValue([Wd * 1.25, Ht * 1.1]);
    fxp(S, 1, "End Color").setValue(c4(PALETTE.deep)); fxp(S, 1, "Ramp Shape").setValue(2);
    fx(S, "ADBE Drop Shadow"); var ds = S.property("ADBE Effect Parade").property(2);
    ds.property("Shadow Color").setValue([0, 0, 0, 1]); ds.property("Opacity").setValue(75); ds.property("Direction").setValue(160); ds.property("Distance").setValue(26); ds.property("Softness").setValue(70); out.push(S);
    var M = solid(comp, P + "_MOTTLE", [.5, .5, .5], cam); fx(M, "ADBE Fractal Noise"); var fn = M.property("ADBE Effect Parade").property(1);
    fn.property("Contrast").setValue(110); fn.property("Complexity").setValue(7); fn.property("Scale").setValue(520);
    M.blendingMode = BlendingMode.OVERLAY; M.opacity.setValue(14); out.push(M);
    var K = solid(comp, P + "_STREAKS", [.5, .5, .5], cam); fx(K, "ADBE Fractal Noise"); var fk = K.property("ADBE Effect Parade").property(1), tr = fk;
    tr.property("Uniform Scaling").setValue(false); tr.property("Scale Width").setValue(50); tr.property("Scale Height").setValue(2600); tr.property("Rotation").setValue(4);
    fk.property("Contrast").setValue(110); fk.property("Complexity").setValue(3); K.blendingMode = BlendingMode.SOFT_LIGHT; K.opacity.setValue(6); out.push(K);
    var F = comp.layers.addShape(); F.name = P + "_FOLDS"; var root = F.property("ADBE Root Vectors Group");
    var folds = [[[0, Ht * .5], [Wd, Ht * .5]], [[Wd * .5, 0], [Wd * .5, Ht]]], tone = [[[.85, .92, 1], 1.4, 0, 18], [[.03, .08, .2], 3, 3, 30]];
    for (var f = 0; f < folds.length; f++) for (var q = 0; q < tone.length; q++) { var g = root.addProperty("ADBE Vector Group"), c = g.property("ADBE Vectors Group"), s = new Shape(), o = tone[q][2];
      s.vertices = [[folds[f][0][0] + (f ? o : 0), folds[f][0][1] + (f ? 0 : o)], [folds[f][1][0] + (f ? o : 0), folds[f][1][1] + (f ? 0 : o)]]; s.closed = false;
      c.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(s);
      var st = root.property(root.numProperties).property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Stroke");
      st.property("ADBE Vector Stroke Color").setValue(tone[q][0]); st.property("ADBE Vector Stroke Width").setValue(tone[q][1]); st.property("ADBE Vector Stroke Opacity").setValue(tone[q][3]); }
    F.anchorPoint.setValue([0, 0]); F.position.setValue([0, 0]); own(F, cam); out.push(F);
    var B = solid(comp, P + "_BLEACH", [.75, .85, 1], cam), mk = B.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"), ms = new Shape();
    ms.vertices = rect(0, 0, Wd, Ht); ms.closed = true; mk.property("ADBE Mask Shape").setValue(ms);
    B.property("ADBE Mask Parade").property(1).property("ADBE Mask Feather").setValue([150, 150]); B.property("ADBE Mask Parade").property(1).property("ADBE Mask Offset").setValue(-30);
    B.property("ADBE Mask Parade").property(1).inverted = true; B.opacity.setValue(16); out.push(B);
    return out; }
  // the shared test scene (the library's seven-beat test scene) on one blueprint sheet. comp = an empty 1080 x 1920 comp at scene.fps.
  // The header is the title; three figures are drafted in order; the real frame becomes a cyanotype print with its edges traced; a dimension counts
  // the frames; the spoken line is a drawing note; a section line turns the print into pure line work; the camera pulls back to the whole sheet and
  // the verdict is stamped in red on the title block.
  function buildScene(comp, scene, opts) {
    fontOK(); N = 0; var P = opts.prefix || "BLUEP", A = opts.assets, B = scene.beat, Wd = comp.width, Ht = comp.height, WL = scene.wordList, notes = [];
    AESLib.clearOwned(comp, P);
    function words(t0, t1) { var r = []; for (var i = 0; i < WL.length; i++) if (WL[i].s >= t0 - .05 && WL[i].s < t1) r.push(WL[i]); return r; }
    var table = comp.layers.addSolid(PALETTE.table, P + "_TABLE", Wd, Ht, 1);
    var cam = comp.layers.addNull(); cam.name = P + "_CAM"; cam.anchorPoint.setValue([Wd / 2, Ht / 2]); cam.position.setValue([Wd / 2, Ht / 2]);
    var paper = sheet(comp, P, cam);
    // 1. title: the border draws, a centre line crosses the empty sheet, the header is lettered on the spoken words, the title block is ruled
    stroke(comp, P + "_BORD0", rect(36, 36, Wd - 72, Ht - 72), { closed: true, w: W.outline, t: 0, dur: .5, cam: cam });
    stroke(comp, P + "_BORD1", rect(52, 52, Wd - 104, Ht - 104), { closed: true, w: W.thin, t: .08, dur: .5, cam: cam, nib: false });
    var tw = words(B.title.t0, B.title.t1), cut1 = B.input.t0;
    stroke(comp, P + "_CLH", [[70, 830], [Wd - 70, 830]], { w: W.thin, dash: DASH.centre, t: .1, dur: .4, cam: cam, out: cut1 });
    stroke(comp, P + "_CLV", [[Wd / 2, 480], [Wd / 2, 1160]], { w: W.thin, dash: DASH.centre, t: .25, dur: .35, cam: cam, out: cut1 });
    var ctx = B.title.context.toUpperCase(), hero = B.title.hero.toUpperCase().split(" "), h1 = hero.slice(0, 2).join(" "), h2 = hero.slice(2).join(" ");
    letter(comp, P + "_CTX", ctx, { family: TECH, style: "Bold", size: 30, tracking: 220, color: PALETTE.dim, x: 92, y: 132, keys: spokenKeys(ctx, tw.slice(0, 2), .06), cam: cam });
    letter(comp, P + "_H1", h1, { size: 112, x: 88, y: 270, keys: spokenKeys(h1, tw.slice(2, 4), .045), cam: cam, nib: true });
    letter(comp, P + "_H2", h2, { size: 112, x: 88, y: 392, keys: spokenKeys(h2, tw.slice(4), .05), cam: cam, nib: true });
    stroke(comp, P + "_HR0", [[88, 432], [Wd - 88, 432]], { w: W.outline, t: 1.0, dur: .26, cam: cam });
    stroke(comp, P + "_HR1", [[88, 442], [Wd - 88, 442]], { w: W.hair, t: 1.06, dur: .26, cam: cam, nib: false });
    // the title block: general notes on the left, four fields on the right
    var TB = { x: 70, y: 1570, w: Wd - 140, h: 280, split: 640 }, rows = 4, rh = TB.h / rows;
    stroke(comp, P + "_TB", rect(TB.x, TB.y, TB.w, TB.h), { closed: true, w: W.outline, t: .5, dur: .45, cam: cam });
    stroke(comp, P + "_TBV", [[TB.split, TB.y], [TB.split, TB.y + TB.h]], { w: W.detail, t: .82, dur: .12, cam: cam, nib: false });
    for (var r = 1; r < rows; r++) stroke(comp, P + "_TBR" + r, [[TB.split, TB.y + r * rh], [TB.x + TB.w, TB.y + r * rh]], { w: W.thin, t: .86 + .03 * r, dur: .12, cam: cam, nib: false });
    letter(comp, P + "_GN", "GENERAL NOTES", { family: TECH, style: "Bold", size: 18, tracking: 160, color: PALETTE.dim, x: TB.x + 18, y: TB.y + 32, t: .9, dur: .2, cam: cam });
    var fields = [["TITLE", "SHARED TEST SCENE"], ["DWG NO.", "ST-001   REV. A"], ["FRAMES", ""], ["STATUS", "PENDING"]], fx0 = TB.split + 16, vals = [];
    for (var f = 0; f < fields.length; f++) { var fy = TB.y + f * rh;
      letter(comp, P + "_FL" + f, fields[f][0], { family: TECH, style: "Bold", size: 14, tracking: 160, color: PALETTE.dim, x: fx0, y: fy + 22, t: .95 + .04 * f, dur: .12, cam: cam });
      if (fields[f][1]) vals.push(letter(comp, P + "_FV" + f, fields[f][1], { size: 28, x: fx0, y: fy + 58, t: 1.05 + .06 * f, cam: cam })); }
    // the general notes: every spoken line lettered into the column after it is said
    var lines = [], said = [[B.title, "EVERY STYLE STARTS THE SAME WAY."], [B.picture, "THREE PIECES BUILD ONE PICTURE."], [B.input, "HERE'S A REAL FRAME FROM MY VIDEO."],
      [B.number, "338 FRAMES, COUNTED."], [B.line, "EVERY WORD I SAY GETS TYPED."], [B.carry, "THEN ONE THING BECOMES THE NEXT."], [B.end, "THAT'S THE TEST."]];
    for (var n = 0; n < said.length; n++) { var tn = n < said.length - 1 ? said[n][0].t1 : said[n][0].t0 + .95;
      lines.push(letter(comp, P + "_NOTE" + n, (n + 1) + ".  " + said[n][1], { size: 21, x: TB.x + 18, y: TB.y + 66 + n * 31, t: tn, dur: .35, cam: cam })); }
    // 2. picture: three figures drafted in order on the spoken words (centre line, outline, detail, hatching, balloon, label), then a dimension spans them
    var pw = words(B.picture.t0, B.picture.t1), T0 = 610, BOT = 1010, cxs = [215, 540, 865], objs = B.picture.objects;
    var FIG = {
      person: function (cx, t, k) { stroke(comp, k + "_HEAD", circle(cx, T0 + 70, 58), { closed: true, w: W.outline, t: t + .12, dur: .22, cam: cam, out: cut1 });
        stroke(comp, k + "_BODY", [[cx - 115, BOT], [cx - 115, T0 + 235], [cx - 95, T0 + 178], [cx - 45, T0 + 152], [cx + 45, T0 + 152], [cx + 95, T0 + 178], [cx + 115, T0 + 235], [cx + 115, BOT]], { closed: true, w: W.outline, t: t + .2, dur: .3, cam: cam, out: cut1 });
        stroke(comp, k + "_COL", [[cx - 45, T0 + 152], [cx, T0 + 210], [cx + 45, T0 + 152]], { w: W.detail, t: t + .45, dur: .12, cam: cam, out: cut1 });
        hatch(comp, k + "_HAT", cx - 115, T0 + 300, 230, BOT - T0 - 300, 13, t + .5, .25, cam, cut1); return [cx + 40, T0 + 40]; },
      document: function (cx, t, k) { stroke(comp, k + "_PAGE", [[cx - 105, T0 + 20], [cx + 55, T0 + 20], [cx + 105, T0 + 70], [cx + 105, BOT - 20], [cx - 105, BOT - 20]], { closed: true, w: W.outline, t: t + .12, dur: .34, cam: cam, out: cut1 });
        stroke(comp, k + "_FOLD", [[cx + 55, T0 + 20], [cx + 55, T0 + 70], [cx + 105, T0 + 70]], { w: W.detail, t: t + .44, dur: .1, cam: cam, out: cut1, nib: false });
        stroke(comp, k + "_HEADR", rect(cx - 75, T0 + 70, 100, 34), { closed: true, w: W.detail, t: t + .44, dur: .1, cam: cam, out: cut1, nib: false });
        hatch(comp, k + "_HAT", cx - 75, T0 + 70, 100, 34, 9, t + .52, .14, cam, cut1);
        for (var i = 0; i < 6; i++) stroke(comp, k + "_TL" + i, [[cx - 75, T0 + 150 + i * 36], [cx + (i === 5 ? 20 : 75), T0 + 150 + i * 36]], { w: W.thin, t: t + .5 + .03 * i, dur: .08, cam: cam, out: cut1, nib: false });
        return [cx + 70, T0 + 60]; },
      device: function (cx, t, k) { stroke(comp, k + "_CASE", rect(cx - 125, T0 + 60, 250, 190), { closed: true, w: W.outline, t: t + .12, dur: .3, cam: cam, out: cut1 });
        stroke(comp, k + "_SCR", rect(cx - 108, T0 + 77, 216, 156), { closed: true, w: W.detail, t: t + .36, dur: .14, cam: cam, out: cut1, nib: false });
        stroke(comp, k + "_NECK", [[cx - 20, T0 + 250], [cx - 30, T0 + 330], [cx + 30, T0 + 330], [cx + 20, T0 + 250]], { w: W.outline, t: t + .4, dur: .12, cam: cam, out: cut1 });
        stroke(comp, k + "_BASE", rect(cx - 90, T0 + 330, 180, 22), { closed: true, w: W.outline, t: t + .48, dur: .1, cam: cam, out: cut1, nib: false });
        hatch(comp, k + "_HAT", cx - 108, T0 + 77, 216, 156, 16, t + .52, .22, cam, cut1); return [cx + 60, T0 + 100]; }
    };
    for (var j = 0; j < objs.length && j < 3; j++) { var tj = pw[j] ? pw[j].s : B.picture.t0 + .3 * j, cx = cxs[j], k = P + "_F" + j;
      stroke(comp, k + "_CL", [[cx, T0 - 30], [cx, BOT + 30]], { w: W.hair, dash: DASH.centre, t: tj, dur: .14, cam: cam, out: cut1, nib: false });
      var tip = (FIG[objs[j]] || FIG.document)(cx, tj, k);
      balloon(comp, k + "_BAL", j + 1, cx + 95, T0 - 30, tip[0], tip[1], tj + .5, cam, cut1);
      letter(comp, k + "_LBL", objs[j].toUpperCase(), { size: 32, x: cx, y: BOT + 64, center: true, t: tj + .55, dur: .22, cam: cam, out: cut1 }); }
    var onePic = pw[3] ? pw[3].s : 2.25;
    dim(comp, P + "_DIM3", 95, 985, 1128, { from: BOT + 84, gap: 150, t: onePic, cam: cam, out: cut1 });
    letter(comp, P + "_DIM3V", "3 PCS", { family: TECH, style: "Bold", size: 24, tracking: 100, x: 540, y: 1137, center: true, t: onePic + .15, dur: .14, cam: cam, out: cut1 });
    var FY = 1268, fig1 = letter(comp, P + "_FIG1", "FIG. 1  ·  ONE PICTURE", { size: 40, x: 92, y: FY, keys: spokenKeys("FIG. 1  ·  ONE PICTURE", [{ text: "FIG. 1", s: onePic }, { text: "ONE", s: onePic + .12 }, { text: "PICTURE", s: pw[4] ? pw[4].s : 2.43 }]), cam: cam, out: cut1 + .2 });
    strike(comp, P + "_FIG1X", fig1, 92, FY, 40, cut1, cam, cut1 + .2);
    // 3. input: the frame is ruled, its edges are traced on left to right behind a scan line, the cyanotype print exposes under the trace; a dimension measures it
    var FX = 120, FYt = 520, FW = 840, FH = 560, tIn = B.input.t0, tw3 = words(B.input.t0, B.input.t1);
    var fig2 = letter(comp, P + "_FIG2", "FIG. 2  ·  REAL FRAME", { size: 40, x: 92, y: FY, t: cut1 + .2, dur: .4, cam: cam, nib: true });
    stroke(comp, P + "_FRAME", rect(FX, FYt, FW, FH), { closed: true, w: W.outline, t: tIn + .05, dur: .4, cam: cam });
    function plate(file, name, t0, t1) { var L = comp.layers.add(AESLib.importFile(file)); L.name = name; L.anchorPoint.setValue([0, 0]); L.position.setValue([FX, FYt]);
      L.scale.setValue([FW / L.source.width * 100, FH / L.source.height * 100]);
      var m = L.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"), sw = L.source.width, sh = L.source.height;
      function wipe(x) { var s = new Shape(); s.vertices = rect(0, 0, Math.max(.5, x), sh); s.closed = true; return s; }
      lin(L.property("ADBE Mask Parade").property(1).property("ADBE Mask Shape"), [t0, t1], [wipe(0), wipe(sw)]); L.inPoint = t0; own(L, cam); return L; }
    var tScan = tIn + .3, tone = plate(A.tone, P + "_TONE", tScan + .25, tScan + .95), trace = plate(A.trace, P + "_TRACE", tScan, tScan + .7);
    tone.property("ADBE Effect Parade").addProperty("ADBE Tint"); fxp(tone, 1, "Map Black To").setValue([0, 0, 0, 1]); fxp(tone, 1, "Map White To").setValue([.5, .64, .86, 1]);
    tone.blendingMode = BlendingMode.SCREEN; tone.opacity.setValue(50);
    trace.property("ADBE Effect Parade").addProperty("ADBE Tint"); fxp(trace, 1, "Map Black To").setValue([0, 0, 0, 1]); fxp(trace, 1, "Map White To").setValue(c4(PALETTE.line));
    trace.blendingMode = BlendingMode.ADD;
    var scan = stroke(comp, P + "_SCAN", [[FX, FYt - 14], [FX, FYt + FH + 14]], { w: W.detail, t: tScan, dur: .05, cam: cam, nib: false }); lin(scan.position, [tScan, tScan + .7], [[0, 0], [FW, 0]]); scan.outPoint = tScan + .72;
    dim(comp, P + "_DIMW", FX, FX + FW, 486, { from: FYt - 6, gap: 170, t: tScan + .7, cam: cam });
    letter(comp, P + "_DIMWV", "840 PX", { family: TECH, style: "Bold", size: 22, tracking: 100, x: 540, y: 494, center: true, t: tScan + .85, dur: .14, cam: cam });
    // 4. number: a dimension under the print; its value counts the frames up to 338 (one batched Source Text call), the words land on the voice
    var tN = B.number.t0, nw = words(B.number.t0, B.number.t1), DY = 1150;
    dim(comp, P + "_DIMN", FX, FX + FW, DY, { from: FYt + FH + 6, gap: 300, t: tN, cam: cam });
    var num = AESLib.text(comp, P + "_NUM", "0", { family: HAND, style: "Regular", size: 132, color: PALETTE.line, just: "center", pos: [540, DY + 46] }); own(num, cam);
    var steps = [], cnt = 20; for (var s = 0; s <= cnt; s++) { var p = s / cnt; steps.push(String(Math.round(B.number.value * (1 - Math.pow(1 - p, 3))))); }
    AESLib.bakeText(num, steps, scene.fps, tN + .04); num.inPoint = tN + .04;
    var fc = B.number.label.toUpperCase() + ", COUNTED";
    letter(comp, P + "_NUML", fc, { family: TECH, style: "Bold", size: 20, tracking: 100, x: 712, y: DY + 46, keys: [[nw[1] ? nw[1].s : tN + .7, 0], [(nw[1] ? nw[1].s : tN + .7) + .3, 100 * 7 / fc.length], [nw[2] ? nw[2].s : tN + 1.4, 100 * 7 / fc.length], [(nw[2] ? nw[2].s : tN + 1.4) + .3, 100]], cam: cam });
    letter(comp, P + "_FV2", String(B.number.value), { size: 28, x: fx0, y: TB.y + 2 * rh + 58, t: nw[2] ? nw[2].s : tN + 1.4, dur: .2, cam: cam });
    // 5. line: the spoken line is a drawing note, a double-ruled box with a NOTE cell, lettered on each word's onset
    var NB = { x: 70, y: 1318, w: Wd - 140, h: 210, cell: 190 }, tL = B.line.t0, lw = words(B.line.t0, B.carry.t0), tE = B.end.t0;
    stroke(comp, P + "_NB0", rect(NB.x, NB.y, NB.w, NB.h), { closed: true, w: W.detail, t: tL - .25, dur: .3, cam: cam });
    stroke(comp, P + "_NB1", rect(NB.x + 8, NB.y + 8, NB.w - 16, NB.h - 16), { closed: true, w: W.hair, t: tL - .2, dur: .3, cam: cam, nib: false });
    stroke(comp, P + "_NBC", [[NB.x + NB.cell, NB.y + 8], [NB.x + NB.cell, NB.y + NB.h - 8]], { w: W.thin, t: tL - .05, dur: .1, cam: cam, nib: false });
    letter(comp, P + "_NBN", "NOTE", { family: TECH, style: "Bold", size: 26, tracking: 160, color: PALETTE.dim, x: NB.x + 28, y: NB.y + 92, t: tL, dur: .14, cam: cam });
    var nn = AESLib.text(comp, P + "_NBNUM", "/ 1", { family: TECH, style: "Bold", size: 40, color: PALETTE.line, just: "left", pos: [NB.x + 28, NB.y + 150] }); var nr = nn.sourceRectAtTime(0, false); nn.anchorPoint.setValue([nr.left, 0]); nn.position.setValue([NB.x + 28, NB.y + 150]); own(nn, cam); nn.inPoint = tL + .06;
    AESLib.textKeys(nn, [tL + .06, tE], ["/ 1", "/ 2"]);
    var spoken = B.line.text.toUpperCase().replace(/\.$/, "."), sw = spoken.split(" "), l1 = sw.slice(0, 4).join(" "), l2 = sw.slice(4).join(" ");
    letter(comp, P + "_LINE1", l1, { size: 62, x: NB.x + NB.cell + 28, y: NB.y + 92, keys: spokenKeys(l1, lw.slice(0, 4), .035), cam: cam, out: tE, nib: true });
    letter(comp, P + "_LINE2", l2, { size: 62, x: NB.x + NB.cell + 28, y: NB.y + 172, keys: spokenKeys(l2, lw.slice(4, 6), .035), cam: cam, out: tE, nib: true });
    // 6. carry: FIG. 2 is struck and rewritten FIG. 3, a section line A-A sweeps down the print and the photograph under it becomes pure line work
    var tC = B.carry.t0, cw = words(B.carry.t0, B.carry.t1), tBec = cw[3] ? cw[3].s : 8.21;
    strike(comp, P + "_FIG2X", fig2, 92, FY, 40, tBec - .2, cam, tBec);
    fig2.outPoint = tBec;
    letter(comp, P + "_FIG3", "FIG. 3  ·  THE NEXT", { size: 40, x: 92, y: FY, t: tBec, dur: .4, cam: cam, nib: true });
    var tS0 = tC + .12, tS1 = tC + .95, sec = stroke(comp, P + "_SEC", [[90, 0], [Wd - 90, 0]], { w: W.detail, dash: DASH.phantom, t: tS0 - .12, dur: .12, cam: cam, nib: false });
    var sa = letter(comp, P + "_SECA", "A", { family: TECH, style: "Bold", size: 30, x: 62, y: 11, t: tS0 - .05, dur: .05, center: true, cam: null });
    var sb = letter(comp, P + "_SECB", "A", { family: TECH, style: "Bold", size: 30, x: Wd - 62, y: 11, t: tS0 - .05, dur: .05, center: true, cam: null });
    sa.parent = sec; sb.parent = sec; lin(sec.position, [tS0, tS1], [[0, FYt], [0, FYt + FH]]); sec.outPoint = tS1 + .2; sa.outPoint = tS1 + .2; sb.outPoint = tS1 + .2;
    var tm = tone.property("ADBE Mask Parade").property(1).property("ADBE Mask Shape"), tsw = tone.source.width, tsh = tone.source.height;
    var top = new Shape(); top.vertices = rect(0, 0, tsw, tsh); top.closed = true; var bot = new Shape(); bot.vertices = rect(0, tsh - .5, tsw, .5); bot.closed = true;
    lin(tm, [tS0, tS1], [top, bot]); tone.outPoint = tS1 + .02;
    // the camera: locked off on the drawing, then it pulls back to the whole sheet on the table for the verdict
    AESLib.ease(cam.scale, [tC + .35, tE - .05], [[100, 100], [86, 86]], "travel");
    // 7. end: NOTE / 2 is the end line; the status is stamped TESTED in red, the only colour on the sheet, with a small bump of the camera
    var ew = words(B.end.t0, B.end.t1), endL = B.end.text.toUpperCase();
    letter(comp, P + "_END", endL, { size: 66, x: NB.x + NB.cell + 28, y: NB.y + 136, keys: spokenKeys(endL, ew, .04), cam: cam, nib: true });
    var tSt = ew.length ? ew[ew.length - 1].s + .1 : tE + .5, sx = fx0 + 140, sy = TB.y + 3 * rh + 4;
    var st = comp.layers.addShape(); st.name = P + "_STAMP"; var sr = st.property("ADBE Root Vectors Group");
    var outer = sr.addProperty("ADBE Vector Group"); outer.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Rect").property("ADBE Vector Rect Size").setValue([480, 152]);
    sr.property(1).property("ADBE Vectors Group").property(1).property("ADBE Vector Rect Roundness").setValue(10);
    var ost = sr.property(1).property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Stroke"); ost.property("ADBE Vector Stroke Color").setValue(PALETTE.stamp); ost.property("ADBE Vector Stroke Width").setValue(9);
    var inner = sr.addProperty("ADBE Vector Group"); inner.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Rect").property("ADBE Vector Rect Size").setValue([448, 120]);
    var ist = sr.property(2).property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Stroke"); ist.property("ADBE Vector Stroke Color").setValue(PALETTE.stamp); ist.property("ADBE Vector Stroke Width").setValue(2.5);
    st.position.setValue([sx, sy]);
    var stx = AESLib.text(comp, P + "_STAMPT", "TESTED", { family: TECH, style: "Bold", size: 88, color: PALETTE.stamp, just: "left", tracking: 120, pos: [sx, sy] });
    var srr = stx.sourceRectAtTime(0, false); stx.anchorPoint.setValue([srr.left + srr.width / 2, srr.top + srr.height / 2]); stx.position.setValue([sx, sy]);   // centred on the box whatever the justification does
    stx.parent = st; st.rotation.setValue(-7); own(st, cam);
    var SL = [st, stx]; for (var q = 0; q < SL.length; q++) { SL[q].inPoint = tSt; fx(SL[q], "ADBE Roughen Edges");
      try { var re = SL[q].property("ADBE Effect Parade").property(1); re.property("Border").setValue(2.5); re.property("Scale").setValue(22); } catch (e3) { notes.push("roughen settings: " + e3.toString()); } SL[q].opacity.setValue(88); }
    AESLib.ease(st.scale, [tSt, tSt + .07], [[128, 128], [100, 100]], "settle");
    lin(cam.position, [tSt + .06, tSt + .1, tSt + .22], [[Wd / 2, Ht / 2], [Wd / 2 + 3, Ht / 2 + 7], [Wd / 2, Ht / 2]]);
    // the ink: one adjustment over every line softens it a little and lets it glow faintly, as white line work does on blue paper
    var ink = comp.layers.addSolid([1, 1, 1], P + "_INK", Wd, Ht, 1); ink.adjustmentLayer = true;
    fx(ink, "ADBE Gaussian Blur 2"); fxp(ink, 1, "Blurriness").setValue(.8);
    fx(ink, "ADBE Glo2"); var gl = ink.property("ADBE Effect Parade").property(2); gl.property("Glow Based On").setValue(2); gl.property("Glow Threshold").setValue(92); gl.property("Glow Radius").setValue(12); gl.property("Glow Intensity").setValue(.6);
    // stacking: table, sheet layers at the bottom; ink adjustment above the drawing; stamp and camera on top
    ink.moveToBeginning(); stx.moveToBeginning(); st.moveToBeginning(); cam.moveToBeginning();
    for (var pp = paper.length - 1; pp >= 0; pp--) paper[pp].moveToEnd(); table.moveToEnd();
    return { layers: comp.numLayers, notes: notes };
  }
  return { HAND: HAND, TECH: TECH, PALETTE: PALETTE, W: W, DASH: DASH, fontOK: fontOK, stroke: stroke, hatch: hatch, letter: letter, spokenKeys: spokenKeys, dim: dim,
    balloon: balloon, strike: strike, sheet: sheet, rect: rect, circle: circle, buildScene: buildScene };
})();
