// Art Deco style: brand-neutral ES3 helpers. No project mutation happens at load.
// Read styles/art-deco/STYLE.md first. Everything is drawn in white into one ART precomp; a GILD precomp turns it into engraved gold through a
// luma matte over a banded metal (white = gold, grey = airbrushed gold volume, black = lacquer that hides what is behind it). One centre axis:
// plaques, arches and doors unfold from it and fold back into it. A sunburst sits behind everything, light sweeps the gold on the hits, bulbs
// switch on one by one with an overshoot, and one jewel colour (the mat behind the real frame) follows the protagonist.
// Adapted from Lemo-Opuscar's art-deco style (MIT, LemoLab); see assets/LICENSE-lemo-opuscar.txt.
var AESDeco = (function () {
  var TITLE = "Limelight", NUMS = "Poiret One", SANS = "Josefin Sans", SANS_STYLE = "SemiBold";
  var PALETTE = { lacquer: [.035, .027, .016], warm: [.20, .14, .06], goldDark: [.42, .29, .10], gold: [.80, .62, .30], goldLight: [.93, .81, .52],
    hot: [1, .95, .80], ivory: [.95, .91, .82], accent: [.52, .10, .16], accentLight: [.74, .22, .27], accentDark: [.24, .04, .07], ray: [.69, .54, .27] };
  var W = { key: 3.2, hair: 1.4, detail: 2.2 };                                                       // keyline, its parallel twin, details (at 1080 wide)
  var N = 0, OUT = {};                                                                                // OUT: a layer's wanted out point (re-applied after an in point moves)
  function fontOK() { AESLib.font(TITLE, "Regular"); AESLib.font(NUMS, "Regular"); AESLib.font(SANS, SANS_STYLE); return true; }
  function c4(c) { return [c[0], c[1], c[2], 1]; }
  function grey(v) { return [v, v, v]; }
  // mechanical ease (firm in and out, like machinery) with straight spatial paths, so two equal keys never drift
  function mech(prop, times, vals) { AESLib.ease(prop, times, vals, "travel");
    if (prop.propertyValueType === PropertyValueType.TwoD_SPATIAL || prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL)
      for (var i = 0; i < times.length; i++) { var k = prop.nearestKeyIndex(times[i]), z = prop.propertyValueType === PropertyValueType.TwoD_SPATIAL ? [0, 0] : [0, 0, 0]; prop.setSpatialTangentsAtKey(k, z, z); }
    return prop; }
  function lin(prop, times, vals) { prop.setValuesAtTimes(times, vals); var L = KeyframeInterpolationType.LINEAR;
    for (var i = 0; i < times.length; i++) prop.setInterpolationTypeAtKey(prop.nearestKeyIndex(times[i]), L, L); return prop; }
  function fx(L, match) { return L.property("ADBE Effect Parade").addProperty(match); }
  function fxp(L, i, name) { return L.property("ADBE Effect Parade").property(i).property(name); }
  // ---- geometry (comp space, vertices clockwise from the top centre so a centre trim unfolds from the top) ----
  function arc(cx, cy, r, a0, a1, n) { var p = []; n = n || 24; for (var i = 0; i <= n; i++) { var a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; p.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return p; }
  function circle(cx, cy, r, n) { var p = arc(cx, cy, r, -90, 270, n || 48); p.pop(); return p; }
  function rect5(cx, cy, hw, hh) { return [[cx, cy - hh], [cx + hw, cy - hh], [cx + hw, cy + hh], [cx - hw, cy + hh], [cx - hw, cy - hh]]; }
  function diamond5(cx, cy, d) { return [[cx + d / 2, cy - d / 2], [cx + d, cy], [cx, cy + d], [cx - d, cy], [cx, cy - d]]; }        // rect5's points turned 45 degrees
  // a rectangle whose corners step inward n times (the setback of a deco plaque or tower)
  function stepped(cx, cy, hw, hh, s, n) { var p = [[cx, cy - hh]], C = [[1, -1, 0], [1, 1, 1], [-1, 1, 0], [-1, -1, 1]];
    for (var c = 0; c < 4; c++) { var sx = C[c][0], sy = C[c][1], X = cx + sx * hw, Y = cy + sy * hh, k;
      if (!C[c][2]) { p.push([X - sx * n * s, Y]); for (k = n; k >= 1; k--) { p.push([X - sx * k * s, Y - sy * (n - k + 1) * s]); p.push([X - sx * (k - 1) * s, Y - sy * (n - k + 1) * s]); } }
      else { p.push([X, Y - sy * n * s]); for (k = n; k >= 1; k--) { p.push([X - sx * (n - k + 1) * s, Y - sy * k * s]); p.push([X - sx * (n - k + 1) * s, Y - sy * (k - 1) * s]); } } }
    return p; }
  // an arch-topped window: a semicircle over a rectangle
  function archWin(cx, top, hw, bot) { var cyA = top + hw, p = arc(cx, cyA, hw, -90, 0, 12); p.push([cx + hw, bot]); p.push([cx - hw, bot]);
    var q = arc(cx, cyA, hw, 180, 270, 12); for (var i = 0; i < q.length - 1; i++) p.push(q[i]); return p; }
  function star4(cx, cy, R) { var p = []; for (var i = 0; i < 8; i++) { var a = (i * 45 - 90) * Math.PI / 180, r = i % 2 ? R * .16 : R; p.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return p; }
  function rays(cx, cy, r0, r1, n, a0, a1) { var out = []; for (var i = 0; i < n; i++) { var a = (a0 + (a1 - a0) * i / (n - 1)) * Math.PI / 180;
    out.push({ pts: [[cx + r0 * Math.cos(a), cy + r0 * Math.sin(a)], [cx + r1 * Math.cos(a), cy + r1 * Math.sin(a)]] }); } return out; }
  function mirror(pts, ax) { var q = []; for (var i = 0; i < pts.length; i++) q.push([2 * ax - pts[i][0], pts[i][1]]); return q; }
  // ---- layers ----
  // one shape layer: o = { paths: [{ pts, closed }], stroke: colour, w, fill: colour, fillOp, ramp: [x0, y0, c0, x1, y1, c1] (airbrush),
  //   draw: { t, dur, mode: "end" | "centre", seq }, t0 (in point), out, parent, anchor: [x, y] (rotate or scale about it), opacity }
  function sh(comp, name, o) { var L = comp.layers.addShape(); L.name = name + "_" + (N++);
    L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").name = "G";
    function C() { return L.property("ADBE Root Vectors Group").property("G").property("ADBE Vectors Group"); }
    for (var i = 0; i < o.paths.length; i++) { var s = new Shape(); s.vertices = o.paths[i].pts; s.closed = !!o.paths[i].closed;
      C().addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(s); }
    if (o.stroke) { var st = C().addProperty("ADBE Vector Graphic - Stroke"); st.property("ADBE Vector Stroke Color").setValue(o.stroke); st.property("ADBE Vector Stroke Width").setValue(o.w || W.key);
      C().property("ADBE Vector Graphic - Stroke").property("ADBE Vector Stroke Line Join").setValue(1); C().property("ADBE Vector Graphic - Stroke").property("ADBE Vector Stroke Line Cap").setValue(1); }
    if (o.fill) { var f = C().addProperty("ADBE Vector Graphic - Fill"); f.property("ADBE Vector Fill Color").setValue(o.fill); if (o.fillOp !== undefined) C().property("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Opacity").setValue(o.fillOp); }
    if (o.draw) { var T = C().addProperty("ADBE Vector Filter - Trim"); if (o.draw.seq) C().property("ADBE Vector Filter - Trim").property("ADBE Vector Trim Type").setValue(2);
      var d = o.draw, tr = C().property("ADBE Vector Filter - Trim");
      if (d.mode === "centre") { mech(tr.property("ADBE Vector Trim Start"), [d.t, d.t + d.dur], [50, 0]); mech(C().property("ADBE Vector Filter - Trim").property("ADBE Vector Trim End"), [d.t, d.t + d.dur], [50, 100]); }
      else mech(tr.property("ADBE Vector Trim End"), [d.t, d.t + d.dur], [0, 100]); }
    var an = o.anchor || [0, 0]; L.anchorPoint.setValue(an); L.position.setValue(o.pos || an); if (o.opacity !== undefined) L.opacity.setValue(o.opacity);
    if (o.ramp) { fx(L, "ADBE Ramp"); fxp(L, 1, "Start of Ramp").setValue([o.ramp[0], o.ramp[1]]); fxp(L, 1, "Start Color").setValue(c4(o.ramp[2]));
      fxp(L, 1, "End of Ramp").setValue([o.ramp[3], o.ramp[4]]); fxp(L, 1, "End Color").setValue(c4(o.ramp[5])); }
    var tin = o.t0 !== undefined ? o.t0 : (o.draw ? o.draw.t : 0); L.inPoint = Math.max(0, tin); if (o.out !== undefined) L.outPoint = o.out; if (o.parent) L.parent = o.parent; return L; }
  function line(comp, name, pts, o) { o.paths = [{ pts: pts, closed: !!o.closed }]; if (!o.stroke) o.stroke = [1, 1, 1]; return sh(comp, name, o); }
  // a double keyline (a key line and its parallel twin inside it) drawn on from the top centre; makePts(inset) returns the path at that inset
  function keyline(comp, name, makePts, o) { var a = { stroke: [1, 1, 1], w: W.key, draw: o.draw, out: o.out, parent: o.parent, t0: o.t0, paths: [{ pts: makePts(0), closed: true }] };
    var b = { stroke: [1, 1, 1], w: W.hair, draw: o.draw, out: o.out, parent: o.parent, t0: o.t0, paths: [{ pts: makePts(o.gap || 10), closed: true }] };
    return [sh(comp, name + "_K", a), sh(comp, name + "_T", b)]; }
  // a lacquer panel: black in ART, so the gold behind (the sunburst) is hidden and the panel reads as a solid
  function lacquer(comp, name, pts, o) { return sh(comp, name, { paths: [{ pts: pts, closed: true }], fill: [0, 0, 0], t0: o.t0, out: o.out, parent: o.parent }); }
  // an airbrushed volume: a grey ramp inside a hard edge, light from the upper left (white in ART is full gold, dark grey is shadowed gold)
  function volume(comp, name, pts, o) { var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (var i = 0; i < pts.length; i++) { x0 = Math.min(x0, pts[i][0]); y0 = Math.min(y0, pts[i][1]); x1 = Math.max(x1, pts[i][0]); y1 = Math.max(y1, pts[i][1]); }
    return sh(comp, name, { paths: [{ pts: pts, closed: true }], fill: [1, 1, 1], ramp: [x0, y0, grey(o.light || .62), x1, y1, grey(o.dark || .07)], t0: o.t0, out: o.out, parent: o.parent }); }
  // a centred text layer (anchored on its ink's centre and baseline, whatever the justification does). o = { family, style, size, color, tracking, x, y, t0, out, parent }
  // o.maxW: the size shrinks until the ink fits (Limelight is wide)
  function type(comp, name, str, o) { var L = AESLib.text(comp, name + "_" + (N++), str, { family: o.family || SANS, style: o.style || SANS_STYLE, size: o.size, color: o.color || [1, 1, 1], just: "center", tracking: o.tracking || 0, pos: [o.x, o.y] });
    var r = L.sourceRectAtTime(0, false);
    if (o.maxW && r.width > o.maxW) { var sp = L.property("Source Text"), td = sp.value; td.fontSize = Math.floor(o.size * o.maxW / r.width); sp.setValue(td); r = L.sourceRectAtTime(0, false); }
    L.anchorPoint.setValue([r.left + r.width / 2, 0]); L.position.setValue([o.x, o.y]);
    if (o.t0 !== undefined) L.inPoint = Math.max(0, o.t0); if (o.out !== undefined) { L.outPoint = o.out; OUT[L.name] = o.out; } if (o.parent) L.parent = o.parent; return L; }
  function setIn(L, t) { L.inPoint = Math.max(0, t); if (OUT[L.name] !== undefined) L.outPoint = OUT[L.name]; return L; }
  // unfold a text layer from the centre axis: a mask opens symmetrically from a hairline to the full ink width
  function openMask(L, t, dur) { var r = L.sourceRectAtTime(t, false), cx = r.left + r.width / 2, pad = 30;
    function m(hw) { var s = new Shape(); s.vertices = [[cx - hw, r.top - pad], [cx + hw, r.top - pad], [cx + hw, r.top + r.height + pad], [cx - hw, r.top + r.height + pad]]; s.closed = true; return s; }
    L.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"); mech(L.property("ADBE Mask Parade").property(1).property("ADBE Mask Shape"), [t, t + dur], [m(.5), m(r.width / 2 + pad)]);
    return setIn(L, t); }
  // ivory words revealed on their spoken onsets (an opacity animator whose range start is keyed); words = [{ text, s }]
  function spoken(comp, name, str, words, o) { var L = type(comp, name, str, o), keys = [], at = 0, last = -1, up = str.toUpperCase();
    for (var i = 0; i < words.length; i++) { var w = words[i].text.toUpperCase().replace(/[.,!?;:]+$/, ""), idx = up.indexOf(w, at); if (idx < 0) continue;
      var t0 = Math.max(words[i].s, last + .01), t1 = t0 + .1; keys.push([t0, 100 * idx / up.length]); keys.push([t1, 100 * (idx + w.length) / up.length]); at = idx + w.length; last = t1; }
    if (keys.length) keys.push([keys[keys.length - 1][0] + .02, 100]);
    var A = L.property("ADBE Text Properties").property("ADBE Text Animators"); A.addProperty("ADBE Text Animator").name = "W";
    L.property("ADBE Text Properties").property("ADBE Text Animators").property("W").property("ADBE Text Animator Properties").addProperty("ADBE Text Opacity").setValue(0);
    L.property("ADBE Text Properties").property("ADBE Text Animators").property("W").property("ADBE Text Selectors").addProperty("ADBE Text Selector");
    var sel = L.property("ADBE Text Properties").property("ADBE Text Animators").property("W").property("ADBE Text Selectors").property(1), ts = [], ps = [];
    try { sel.property("ADBE Text Range Advanced").property("ADBE Text Selector Smoothness").setValue(0); } catch (e) {}
    for (var k = 0; k < keys.length; k++) { ts.push(keys[k][0]); ps.push(keys[k][1]); }
    lin(L.property("ADBE Text Properties").property("ADBE Text Animators").property("W").property("ADBE Text Selectors").property(1).property("ADBE Text Percent Start"), ts, ps);
    return setIn(L, ts[0] - .01); }
  // a group: a null on the axis; children are parented while it is still at 100%, then unfold / fold keys go on it (scale X from the axis)
  function group(comp, name, x, y) { var n = comp.layers.addNull(); n.name = name; n.anchorPoint.setValue([0, 0]); n.position.setValue([x, y]); return n; }
  // a group folded at its first or last key is not there at all (no hairline on the axis before it opens or after it closes)
  function hinge(n, keys) { var ts = [], vs = []; for (var i = 0; i < keys.length; i++) { ts.push(keys[i][0]); vs.push([Math.max(.1, keys[i][1]), 100]); } mech(n.scale, ts, vs);
    var c = n.containingComp, first = keys[0], last = keys[keys.length - 1];
    for (var l = 1; l <= c.numLayers; l++) { var L = c.layer(l); if (L.parent !== n) continue;
      if (!first[1] && L.inPoint < first[0]) { var o = L.outPoint; L.inPoint = first[0]; L.outPoint = o; }
      if (!last[1] && L.outPoint > last[0]) L.outPoint = last[0]; }
    return n; }
  // a bulb in the main comp: a hot core and a halo that switch on at t with the ignition overshoot (1.6x, settling in 0.18 s)
  function bulb(comp, name, x, y, t, out, r) { r = r || 8; var L = comp.layers.addShape(); L.name = name + "_" + (N++); var root = L.property("ADBE Root Vectors Group"), sz = [[r * 3.4, .22], [r * 1.9, .45], [r * 2, 1]];
    for (var i = 0; i < sz.length; i++) { var g = root.addProperty("ADBE Vector Group"); g.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Ellipse").property("ADBE Vector Ellipse Size").setValue([sz[i][0], sz[i][0]]);
      var f = root.property(root.numProperties).property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill"); f.property("ADBE Vector Fill Color").setValue(i === 2 ? PALETTE.hot : PALETTE.goldLight);
      root.property(root.numProperties).property("ADBE Vectors Group").property("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Opacity").setValue(100 * sz[i][1]); }
    L.anchorPoint.setValue([0, 0]); L.position.setValue([x, y]); lin(L.scale, [t, t + .06, t + .18], [[0, 0], [160, 160], [100, 100]]); L.inPoint = t; if (out !== undefined) L.outPoint = out; return L; }
  // ---- the gold: ART (white drawing) -> GILD (black silhouette + banded metal through a luma matte) -> main comp with bevel, underline, glow ----
  function makeGold(main, P, ART) { var Wd = main.width, Ht = main.height, d = main.duration, fps = main.frameRate, notes = [];
    var MAT = app.project.items.addComp(P + "_METAL", Wd, Ht, 1, d, fps);
    var g = MAT.layers.addSolid(PALETTE.gold, P + "_METAL_BASE", Wd, Ht, 1);
    try { fx(g, "ADBE 4ColorGradient"); var e = g.property("ADBE Effect Parade").property(1);
      e.property("Point 1").setValue([Wd * .1, Ht * .05]); e.property("Color 1").setValue(c4(PALETTE.goldLight));
      e.property("Point 2").setValue([Wd * .95, Ht * .3]); e.property("Color 2").setValue(c4(PALETTE.goldDark));
      e.property("Point 3").setValue([Wd * .05, Ht * .75]); e.property("Color 3").setValue(c4(PALETTE.gold));
      e.property("Point 4").setValue([Wd * .9, Ht * .95]); e.property("Color 4").setValue(c4(PALETTE.goldLight)); } catch (e1) { notes.push("4-colour gradient: " + e1.toString()); }
    var b = MAT.layers.addSolid([.5, .5, .5], P + "_METAL_BANDS", Wd, Ht, 1); fx(b, "ADBE Fractal Noise"); var fn = b.property("ADBE Effect Parade").property(1);
    fn.property("Contrast").setValue(170); fn.property("Complexity").setValue(2); fn.property("Uniform Scaling").setValue(false); fn.property("Scale Width").setValue(3000); fn.property("Scale Height").setValue(90); fn.property("Rotation").setValue(-12);
    b.blendingMode = BlendingMode.OVERLAY; b.opacity.setValue(55);
    var GILD = app.project.items.addComp(P + "_GILD", Wd, Ht, 1, d, fps);
    var sil = GILD.layers.add(ART); sil.name = P + "_SILHOUETTE"; fx(sil, "ADBE Fill"); fxp(sil, 1, "Color").setValue([0, 0, 0, 1]);
    var metal = GILD.layers.add(MAT); metal.name = P + "_METAL";
    var matte = GILD.layers.add(ART); matte.name = P + "_MATTE"; matte.enabled = false;
    try { metal.setTrackMatte(matte, TrackMatteType.LUMA); } catch (e2) { matte.moveBefore(metal); metal.trackMatteType = TrackMatteType.LUMA; notes.push("legacy track matte"); }
    var sw = null; try { sw = fx(metal, "CC Light Sweep"); var ls = metal.property("ADBE Effect Parade").property(1);
      ls.property("Direction").setValue(-25); ls.property("Width").setValue(70); ls.property("Sweep Intensity").setValue(90); ls.property("Edge Intensity").setValue(0);
      ls.property("Light Color").setValue(c4(PALETTE.hot)); ls.property("Center").setValue([-500, Ht / 2]); sw = ls; } catch (e3) { notes.push("light sweep: " + e3.toString()); sw = null; }
    var L = main.layers.add(GILD); L.name = P + "_GOLD";
    try { fx(L, "ADBE Bevel Alpha"); var bv = L.property("ADBE Effect Parade").property(1); bv.property("Edge Thickness").setValue(1.4); bv.property("Light Angle").setValue(-45); bv.property("Light Intensity").setValue(.55); } catch (e4) { notes.push("bevel: " + e4.toString()); }
    fx(L, "ADBE Drop Shadow"); var ds = L.property("ADBE Effect Parade").property(L.property("ADBE Effect Parade").numProperties);
    ds.property("Shadow Color").setValue([.02, .012, 0, 1]); ds.property("Opacity").setValue(95); ds.property("Direction").setValue(150); ds.property("Distance").setValue(2.5); ds.property("Softness").setValue(3);
    fx(L, "ADBE Glo2"); var gl = L.property("ADBE Effect Parade").property(L.property("ADBE Effect Parade").numProperties);
    gl.property("Glow Based On").setValue(2); gl.property("Glow Threshold").setValue(62); gl.property("Glow Radius").setValue(16); gl.property("Glow Intensity").setValue(.5);
    return { layer: L, sweep: sw, notes: notes }; }
  // light crossing the gold on each hit: the sweep centre runs across the frame, then parks off frame until the next hit
  function sheen(sw, Ht, hits) { if (!sw) return; var ts = [], vs = [], c = sw.property("Center");
    for (var i = 0; i < hits.length; i++) { ts.push(hits[i]); vs.push([-500, Ht * .3]); ts.push(hits[i] + .55); vs.push([1700, Ht * .7]); }
    c.setValuesAtTimes(ts, vs); for (var k = 1; k <= c.numKeys; k++) c.setInterpolationTypeAtKey(k, KeyframeInterpolationType.LINEAR, k % 2 ? KeyframeInterpolationType.LINEAR : KeyframeInterpolationType.HOLD); }
  // the ground: warm lacquer black with a warm centre, a sunburst of gold hairlines and faint wedges turning very slowly about the axis
  function ground(comp, P, cx, cy) { var Wd = comp.width, Ht = comp.height, out = [];
    var S = comp.layers.addSolid(PALETTE.lacquer, P + "_GROUND", Wd, Ht, 1); fx(S, "ADBE Ramp");
    fxp(S, 1, "Start of Ramp").setValue([cx, cy]); fxp(S, 1, "Start Color").setValue(c4(PALETTE.warm)); fxp(S, 1, "End of Ramp").setValue([cx, cy + 1150]); fxp(S, 1, "End Color").setValue(c4(PALETTE.lacquer)); fxp(S, 1, "Ramp Shape").setValue(2); out.push(S);
    var n = 64, wedges = [], lines = rays(cx, cy, 70, 2400, n, 0, 360 - 360 / n);
    for (var i = 0; i < n; i += 2) { var a0 = i * 360 / n * Math.PI / 180, a1 = (i + 1) * 360 / n * Math.PI / 180;
      wedges.push({ pts: [[cx, cy], [cx + 2400 * Math.cos(a0), cy + 2400 * Math.sin(a0)], [cx + 2400 * Math.cos(a1), cy + 2400 * Math.sin(a1)]], closed: true }); }
    var Wg = sh(comp, P + "_WEDGES", { paths: wedges, fill: PALETTE.ray, fillOp: 13, anchor: [cx, cy] });
    var Ry = sh(comp, P + "_RAYS", { paths: lines, stroke: PALETTE.ray, w: 1.8, opacity: 60, draw: { t: .05, dur: .8, mode: "end" }, anchor: [cx, cy], t0: 0 });
    lin(Wg.rotation, [0, comp.duration], [0, 5]); lin(Ry.rotation, [0, comp.duration], [0, 5]); out.push(Wg); out.push(Ry); return out; }
  // the shared test scene (the library's seven-beat test scene) as one moving deco poster. comp = an empty 1080 x 1920 comp at scene.fps.
  // Title: a point, a hairline, the plaque opens from the axis under an arch and the title unfolds word by word. Picture: three arched windows open,
  // their figures engrave themselves, a frame and a plaque bind them into one picture. Doors close over it and open on the real frame, gilded, on a
  // jewel mat. Number: the frame rises, a dial unfolds and its needle counts 338 while bulbs switch on. Line: a subtitle card unfolds and the words
  // appear on the voice. Carry: the frame turns into a diamond medallion with a sunburst. End: the closing plaque, bulbs and a last sweep of light.
  function buildScene(comp, scene, opts) {
    fontOK(); N = 0; var P = opts.prefix || "DECO", A = opts.assets, B = scene.beat, Wd = comp.width, Ht = comp.height, AX = Wd / 2, CY = 800, WL = scene.wordList, notes = [];
    AESLib.clearOwned(comp, P);
    for (var it = app.project.numItems; it >= 1; it--) { var pi = app.project.item(it); if (pi instanceof CompItem && (pi.name === P + "_ART" || pi.name === P + "_GILD" || pi.name === P + "_METAL")) pi.remove(); }
    function words(t0, t1) { var r = []; for (var i = 0; i < WL.length; i++) if (WL[i].s >= t0 - .05 && WL[i].s < t1) r.push(WL[i]); return r; }
    function at(list, i, d) { return list[i] ? list[i].s : d; }
    var ART = app.project.items.addComp(P + "_ART", Wd, Ht, 1, comp.duration, comp.frameRate), K = P + "A";   // ART layer names carry the prefix too
    var WH = [1, 1, 1];
    // the frame of the poster: a stepped double keyline drawn on from the top centre, for the whole film
    keyline(ART, K + "_BORDER", function (g) { return stepped(AX, Ht / 2, AX - 40 - g, Ht / 2 - 40 - g, 16, 2); }, { draw: { t: 0, dur: .7, mode: "centre" }, gap: 12 });
    // 1. title: a point, a hairline, the plaque unfolds under an arch, the context and the title unfold from the axis on their words
    var tw = words(B.title.t0, B.title.t1), tOut = B.title.t1 - .1, TY = 780;
    var pt0 = sh(ART, K + "_POINT", { paths: [{ pts: star4(0, 0, 22), closed: true }], fill: WH, pos: [AX, TY], out: .2 }); mech(pt0.scale, [0, .06, .2], [[0, 0], [150, 150], [20, 20]]);
    line(ART, K + "_HAIR", [[AX - 470, TY], [AX + 470, TY]], { w: W.hair, draw: { t: .02, dur: .16, mode: "centre" }, out: .44 });
    var T = group(ART, K + "_TITLE", AX, TY);
    var aR = [300, 236, 172], aY = 588;
    sh(ART, K + "_ARCHFILL", { paths: [{ pts: arc(AX, aY, aR[0], 180, 360, 36), closed: true }], fill: [0, 0, 0], parent: T, out: B.title.t1 });
    for (var a = 0; a < aR.length; a++) line(ART, K + "_ARCH" + a, arc(AX, aY, aR[a], 180, 360, 36), { w: a ? W.detail : W.key, draw: { t: .3 + .08 * a, dur: .5, mode: "centre" }, parent: T, out: B.title.t1 });
    var fanRays = rays(AX, aY, 40, aR[2] - 14, 11, 195, 345); sh(ART, K + "_FAN", { paths: fanRays, stroke: WH, w: W.hair, draw: { t: .55, dur: .3, mode: "end" }, parent: T, out: B.title.t1 });
    lacquer(ART, K + "_PLAQUEFILL", stepped(AX, TY, 460, 192, 20, 2), { parent: T, out: B.title.t1 });
    keyline(ART, K + "_PLAQUE", function (g) { return stepped(AX, TY, 460 - g, 192 - g, 20, 2); }, { parent: T, out: B.title.t1, gap: 12 });
    for (var s = 0; s < 2; s++) { var legA = [[330, 972], [330, 1030], [250, 1030], [250, 1100], [170, 1100], [170, 1560]], legB = [[430, 972], [430, 1080], [350, 1080], [350, 1150], [270, 1150], [270, 1560]];
      line(ART, K + "_LEGA" + s, s ? mirror(legA, AX) : legA, { w: W.detail, draw: { t: .55, dur: .55, mode: "end" }, parent: T, out: B.title.t1 });
      line(ART, K + "_LEGB" + s, s ? mirror(legB, AX) : legB, { w: W.hair, draw: { t: .62, dur: .5, mode: "end" }, parent: T, out: B.title.t1 }); }
    var ctx = type(ART, K + "_CTX", B.title.context.toUpperCase(), { size: 40, tracking: 520, x: AX, y: 676, parent: T, out: B.title.t1 }); openMask(ctx, at(tw, 0, .05), .3);
    var hero = B.title.hero.toUpperCase().split(" "), h1 = hero.slice(0, 2).join(" "), h2 = hero.slice(2).join(" ");
    openMask(type(ART, K + "_H1", h1, { family: TITLE, style: "Regular", size: 112, maxW: 860, tracking: 20, x: AX, y: 812, parent: T, out: B.title.t1 }), at(tw, 2, .44), .26);
    openMask(type(ART, K + "_H2", h2, { family: TITLE, style: "Regular", size: 112, maxW: 860, tracking: 20, x: AX, y: 934, parent: T, out: B.title.t1 }), at(tw, 4, .86), .16);
    var sp1 = sh(ART, K + "_SPARK", { paths: [{ pts: star4(0, 0, 34), closed: true }], fill: WH, t0: 1.0, pos: [AX, aY - aR[0] - 40], parent: T, out: B.title.t1 });
    mech(sp1.scale, [1.0, 1.12, 1.24], [[0, 0], [140, 140], [100, 100]]);
    hinge(T, [[.12, 0], [.42, 100], [tOut, 100], [B.title.t1, 0]]);
    // 2. picture: three arched windows open from their own axes (centre first, then both sides), their figures engrave themselves; a frame binds them
    var pw = words(B.picture.t0, B.picture.t1), objs = B.picture.objects, cxs = [230, AX, 850], order = [1, 0, 2], pOut = B.picture.t1, PT = 512, PB = 1140, PH = 128;
    var FIG = {
      person: function (cx, t, k, g) { volume(ART, k + "_VOLH", circle(cx, 800, 50, 36), { t0: t + .3, parent: g, out: pOut });
        var body = [[cx - 26, 872], [cx + 26, 872], [cx + 100, 920], [cx + 90, 1080], [cx - 90, 1080], [cx - 100, 920]]; volume(ART, k + "_VOLB", body, { t0: t + .4, parent: g, out: pOut });
        line(ART, k + "_HEAD", circle(cx, 800, 50, 36), { closed: true, draw: { t: t + .05, dur: .25, mode: "end" }, parent: g, out: pOut });
        line(ART, k + "_BODY", body, { closed: true, draw: { t: t + .12, dur: .3, mode: "end" }, parent: g, out: pOut });
        line(ART, k + "_COLLAR", [[cx - 26, 872], [cx, 922], [cx + 26, 872]], { w: W.detail, draw: { t: t + .35, dur: .1, mode: "end" }, parent: g, out: pOut });
        line(ART, k + "_LAPEL", [[cx, 922], [cx, 1080]], { w: W.hair, draw: { t: t + .4, dur: .1, mode: "end" }, parent: g, out: pOut }); },
      document: function (cx, t, k, g) { var page = [[cx - 84, 720], [cx + 44, 720], [cx + 84, 760], [cx + 84, 1066], [cx - 84, 1066]];
        volume(ART, k + "_VOL", page, { t0: t + .4, parent: g, out: pOut, light: .5 });
        line(ART, k + "_PAGE", page, { closed: true, draw: { t: t + .05, dur: .32, mode: "end" }, parent: g, out: pOut });
        line(ART, k + "_FOLD", [[cx + 44, 720], [cx + 44, 760], [cx + 84, 760]], { w: W.detail, draw: { t: t + .35, dur: .08, mode: "end" }, parent: g, out: pOut });
        var ch = []; for (var i = 0; i < 3; i++) ch.push({ pts: [[cx - 52, 790 + 30 * i], [cx, 812 + 30 * i], [cx + 52, 790 + 30 * i]] });
        sh(ART, k + "_CHEV", { paths: ch, stroke: [0, 0, 0], w: 5, draw: { t: t + .4, dur: .2, mode: "end", seq: true }, parent: g, out: pOut });
        var tl = []; for (var j = 0; j < 4; j++) tl.push({ pts: [[cx - 60, 930 + 32 * j], [cx + (j === 3 ? 20 : 60), 930 + 32 * j]] });
        sh(ART, k + "_LINES", { paths: tl, stroke: [0, 0, 0], w: 4, draw: { t: t + .45, dur: .2, mode: "end", seq: true }, parent: g, out: pOut }); },
      device: function (cx, t, k, g) { var scr = stepped(cx, 820, 104, 84, 10, 1), base = [[cx - 20, 904], [cx - 20, 940], [cx - 50, 940], [cx - 50, 970], [cx - 82, 970], [cx - 82, 1000], [cx + 82, 1000], [cx + 82, 970], [cx + 50, 970], [cx + 50, 940], [cx + 20, 940], [cx + 20, 904]];
        volume(ART, k + "_VOL", scr, { t0: t + .4, parent: g, out: pOut, light: .45 }); volume(ART, k + "_VOLS", base, { t0: t + .45, parent: g, out: pOut });
        line(ART, k + "_CASE", scr, { closed: true, draw: { t: t + .05, dur: .3, mode: "end" }, parent: g, out: pOut });
        line(ART, k + "_SCR", stepped(cx, 820, 88, 68, 8, 1), { closed: true, w: W.hair, draw: { t: t + .3, dur: .14, mode: "end" }, parent: g, out: pOut });
        line(ART, k + "_BASE", base, { draw: { t: t + .3, dur: .2, mode: "end" }, parent: g, out: pOut });
        sh(ART, k + "_SUN", { paths: rays(cx, 880, 14, 58, 9, 200, 340), stroke: [0, 0, 0], w: 3, draw: { t: t + .45, dur: .2, mode: "end" }, parent: g, out: pOut }); }
    };
    for (var o = 0; o < 3; o++) { var j = order[o], cx = cxs[j], tj = o === 0 ? at(pw, 0, B.picture.t0) + .02 : at(pw, 1, B.picture.t0 + .3), k = K + "_P" + j, g = group(ART, k + "_G", cx, 825);
      lacquer(ART, k + "_WIN", archWin(cx, PT, PH, PB), { parent: g, out: pOut });
      keyline(ART, k + "_FRAME", function (gp) { return archWin(cx, PT + gp, PH - gp, PB - gp); }, { parent: g, out: pOut, gap: 10 });
      sh(ART, k + "_FAN", { paths: rays(cx, PT + PH, 26, PH - 22, 9, 198, 342), stroke: WH, w: W.hair, draw: { t: tj + .2, dur: .25, mode: "end" }, parent: g, out: pOut });
      (FIG[objs[j]] || FIG.document)(cx, tj + .18, k, g);
      openMask(type(ART, k + "_LBL", objs[j].toUpperCase(), { size: 30, maxW: 236, tracking: 380, x: cx, y: 1200, parent: g, out: pOut }), tj + .45, .25);
      hinge(g, [[tj, 0], [tj + .22, 100]]); }
    var tOne = at(pw, 3, 2.25), tPic = at(pw, 4, 2.43);
    keyline(ART, K + "_ONEFRAME", function (gp) { return stepped(AX, 868, 506 - gp, 410 - gp, 18, 2); }, { draw: { t: tOne, dur: .4, mode: "centre" }, out: pOut, gap: 12 });
    var OP = group(ART, K + "_ONE", AX, 1400);
    lacquer(ART, K + "_ONEFILL", stepped(AX, 1400, 330, 74, 16, 2), { parent: OP, out: pOut });
    keyline(ART, K + "_ONEPLQ", function (gp) { return stepped(AX, 1400, 330 - gp, 74 - gp, 16, 2); }, { parent: OP, out: pOut, gap: 10 });
    openMask(type(ART, K + "_ONET", "ONE PICTURE", { family: TITLE, style: "Regular", size: 74, maxW: 600, tracking: 20, x: AX, y: 1427, parent: OP, out: pOut }), tPic, .3);
    hinge(OP, [[tPic - .1, 0], [tPic + .08, 100]]);
    for (var q = 0; q < 2; q++) { var spq = sh(ART, K + "_SPK" + q, { paths: [{ pts: star4(0, 0, 26), closed: true }], fill: WH, t0: tPic + .12 + .08 * q, pos: [q ? 1010 : 70, 458], out: pOut });
      mech(spq.scale, [tPic + .12 + .08 * q, tPic + .24 + .08 * q, tPic + .36 + .08 * q], [[0, 0], [140, 140], [100, 100]]); }
    // 3. input: the real frame waits behind closed doors on its jewel mat; the doors split along the seam and its keyline engraves itself
    var tIn = B.input.t0, iw = words(B.input.t0, B.input.t1), PW2 = 420, PH2 = 280;
    var plate = comp.layers.add(AESLib.importFile(A.plate)); plate.name = P + "_PLATE"; plate.anchorPoint.setValue([PW2, PH2]); plate.position.setValue([AX, CY]); plate.inPoint = tIn;
    plate.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"); var pm = plate.property("ADBE Mask Parade").property(1).property("ADBE Mask Shape");
    fx(plate, "ADBE Tint"); fxp(plate, 1, "Map Black To").setValue(c4(PALETTE.lacquer)); fxp(plate, 1, "Map White To").setValue([.99, .89, .68, 1]);
    function pshape(pts) { var s = new Shape(); s.vertices = pts; s.closed = true; return s; }
    var MATE = sh(comp, P + "_MAT", { paths: [{ pts: rect5(AX, CY, 452, 312), closed: true }], fill: [1, 1, 1], ramp: [AX - 420, CY - 300, PALETTE.accentLight, AX + 420, CY + 320, PALETTE.accentDark], t0: tIn });
    var KO = sh(ART, K + "_PKEY", { paths: [{ pts: rect5(AX, CY, 468, 328), closed: true }], stroke: WH, w: W.key, draw: { t: tIn + .12, dur: .45, mode: "centre" } });
    var KI = sh(ART, K + "_PKEYT", { paths: [{ pts: rect5(AX, CY, 456, 316), closed: true }], stroke: WH, w: W.hair, draw: { t: tIn + .16, dur: .45, mode: "centre" } });
    var corners = []; for (var cc = 0; cc < 4; cc++) { var sx = cc % 2 ? 1 : -1, sy = cc < 2 ? -1 : 1, ang = sx > 0 ? (sy < 0 ? 270 : 0) : (sy < 0 ? 180 : 90);
      corners.push({ pts: arc(AX + sx * 468, CY + sy * 328, 34, ang, ang + 90, 8) }); }
    var CRN = sh(ART, K + "_PCORNERS", { paths: corners, stroke: WH, w: W.detail, draw: { t: tIn + .5, dur: .2, mode: "end" } });
    var IP = group(ART, K + "_REAL", AX, 1196);
    openMask(type(ART, K + "_REALT", "A REAL FRAME", { size: 40, tracking: 520, x: AX, y: 1208, parent: IP }), at(iw, 2, 3.38), .3);
    line(ART, K + "_REALL", [[AX - 400, 1194], [AX - 230, 1194]], { w: W.hair, draw: { t: at(iw, 2, 3.38) + .1, dur: .2, mode: "end" }, parent: IP });
    line(ART, K + "_REALR", [[AX + 400, 1194], [AX + 230, 1194]], { w: W.hair, draw: { t: at(iw, 2, 3.38) + .1, dur: .2, mode: "end" }, parent: IP });
    var tUp = B.number.t0, tUp1 = tUp + .32; hinge(IP, [[tUp - .12, 100], [tUp + .06, 0]]);
    // the doors: two lacquer leaves with keylines, chevrons and a half medallion each; they shut over the picture and split open on the frame
    var tShut = pOut - .26, tOpen = tIn + .06, leaves = [];
    for (var lf = 0; lf < 2; lf++) { var side = lf ? 1 : -1, x0 = lf ? AX : 0, x1 = lf ? Wd : AX, dg = group(ART, K + "_DOOR" + lf, 0, 0), kk = K + "_D" + lf;
      lacquer(ART, kk + "_FILL", [[x0, 0], [x1, 0], [x1, Ht], [x0, Ht]], { parent: dg });
      line(ART, kk + "_K", [[x0 + 30, 30], [x1 - 30, 30], [x1 - 30, Ht - 30], [x0 + 30, Ht - 30]], { closed: true, parent: dg });
      line(ART, kk + "_T", [[x0 + 44, 44], [x1 - 44, 44], [x1 - 44, Ht - 44], [x0 + 44, Ht - 44]], { closed: true, w: W.hair, parent: dg });
      var cv = [], mx = (x0 + x1) / 2; for (var c2 = 0; c2 < 9; c2++) cv.push({ pts: [[mx - 150, 300 + 80 * c2], [mx, 350 + 80 * c2], [mx + 150, 300 + 80 * c2]] });
      for (var c3 = 0; c3 < 3; c3++) cv.push({ pts: [[mx - 150, 1420 + 80 * c3], [mx, 1470 + 80 * c3], [mx + 150, 1420 + 80 * c3]] });
      sh(ART, kk + "_CHEV", { paths: cv, stroke: WH, w: W.detail, parent: dg });
      var a0 = lf ? -90 : 90, a1 = lf ? 90 : 270; lacquer(ART, kk + "_MEDF", arc(AX, Ht / 2, 150, a0, a1, 24), { parent: dg });
      sh(ART, kk + "_MED", { paths: [{ pts: arc(AX, Ht / 2, 150, a0, a1, 24) }, { pts: arc(AX, Ht / 2, 118, a0, a1, 24) }].concat(rays(AX, Ht / 2, 20, 104, 7, a0 + 12, a1 - 12)), stroke: WH, w: W.detail, parent: dg });
      dg.position.setValue([0, 0]); mech(dg.position, [tShut, pOut - .03, pOut + .03, tOpen, tOpen + .4], [[side * 580, 0], [-side * 6, 0], [0, 0], [0, 0], [side * 580, 0]]);
      for (var ly = 1; ly <= ART.numLayers; ly++) if (ART.layer(ly).parent === dg) { ART.layer(ly).inPoint = tShut; ART.layer(ly).outPoint = tOpen + .42; }
      leaves.push(dg); }
    // 4. number: the frame rises (photo, mat and keylines keyed together), a dial unfolds and its needle counts the frames while bulbs switch on
    var nw = words(B.number.t0, B.number.t1), sUp = .8, yUp = 560, tCar = B.carry.t0 + .04, tCar1 = tCar + .4, tTurn = at(words(B.carry.t0, B.carry.t1), 3, 8.21), tTurn1 = tTurn + .4, YE = 820, DD = 280;
    mech(plate.position, [tUp, tUp1, tCar, tCar1], [[AX, CY], [AX, yUp], [AX, yUp], [AX, YE]]);
    mech(plate.scale, [tUp, tUp1, tCar, tCar1], [[100, 100], [sUp * 100, sUp * 100], [sUp * 100, sUp * 100], [100, 100]]);
    var lr = rect5(PW2, PH2, PW2, PH2), ld = diamond5(PW2, PH2, DD), lr4 = [lr[1], lr[2], lr[3], lr[4]], ld4 = [ld[1], ld[2], ld[3], ld[4]];
    pm.setValue(pshape(lr4)); mech(pm, [tTurn, tTurn1], [pshape(lr4), pshape(ld4)]);
    function keyed(L, hw, hh, dd) { var pr = L.property("ADBE Root Vectors Group").property("G").property("ADBE Vectors Group").property(1).property("ADBE Vector Shape");
      mech(pr, [tUp, tUp1, tCar, tCar1, tTurn, tTurn1], [pshape(rect5(AX, CY, hw, hh)), pshape(rect5(AX, yUp, hw * sUp, hh * sUp)), pshape(rect5(AX, yUp, hw * sUp, hh * sUp)), pshape(rect5(AX, YE, hw, hh)), pshape(rect5(AX, YE, hw, hh)), pshape(diamond5(AX, YE, dd))]); }
    keyed(MATE, 452, 312, DD + 32); keyed(KO, 468, 328, DD + 48); keyed(KI, 456, 316, DD + 36); CRN.outPoint = tUp;
    var DG = group(ART, K + "_DIAL", AX, 1330), DR = 300;
    lacquer(ART, K + "_DIALF", arc(AX, 1330, DR, 180, 360, 36), { parent: DG, out: B.line.t0 });
    line(ART, K + "_DIALA", arc(AX, 1330, DR, 180, 360, 36), { parent: DG, out: B.line.t0, draw: { t: tUp + .2, dur: .35, mode: "centre" } });
    line(ART, K + "_DIALB", arc(AX, 1330, DR - 18, 180, 360, 36), { w: W.hair, parent: DG, out: B.line.t0, draw: { t: tUp + .24, dur: .35, mode: "centre" } });
    line(ART, K + "_DIALC", [[AX - DR - 30, 1330], [AX + DR + 30, 1330]], { parent: DG, out: B.line.t0, draw: { t: tUp + .1, dur: .25, mode: "centre" } });
    var ticks = []; for (var tk = 0; tk <= 12; tk++) { var ta = (180 + 15 * tk) * Math.PI / 180, r0 = tk % 3 ? DR - 52 : DR - 70;
      ticks.push({ pts: [[AX + r0 * Math.cos(ta), 1330 + r0 * Math.sin(ta)], [AX + (DR - 30) * Math.cos(ta), 1330 + (DR - 30) * Math.sin(ta)]] }); }
    sh(ART, K + "_TICKS", { paths: ticks, stroke: WH, w: W.detail, parent: DG, out: B.line.t0, draw: { t: tUp + .3, dur: .3, mode: "end", seq: true } });
    var tC0 = Math.max(tUp1 + .02, at(nw, 0, 4.54) + .3), tC1 = Math.min(at(nw, 1, 5.22) + .25, tC0 + .75), DUR = tC1 - tC0, VAL = B.number.value;
    function f(p) { return 1 - Math.pow(1 - p, 3); }
    var ndl = sh(ART, K + "_NEEDLE", { paths: [{ pts: [[AX, 1330 - 252], [AX + 12, 1330 - 30], [AX, 1330 + 26], [AX - 12, 1330 - 30]], closed: true }], fill: WH, anchor: [AX, 1330], parent: DG, out: B.line.t0, t0: tUp + .2 });
    var hub = volume(ART, K + "_HUB", circle(AX, 1330, 22, 24), { parent: DG, out: B.line.t0, t0: tUp + .2, light: .9, dark: .3 });
    var nts = [], nvs = [], steps = [], nf = Math.round(DUR * scene.fps);
    for (var fr = 0; fr <= nf; fr++) { var pp = f(fr / nf); nts.push(tC0 + fr / scene.fps); nvs.push(-90 + 180 * pp); steps.push(String(Math.round(VAL * pp))); }
    ndl.rotation.setValue(-90); lin(ndl.rotation, nts, nvs);
    var num = AESLib.text(ART, K + "_NUM", String(VAL), { family: NUMS, style: "Regular", size: 190, color: WH, just: "center", pos: [AX, 1560] });
    num.anchorPoint.expression = "var r = sourceRectAtTime(time, false); [r.left + r.width / 2, 0];"; num.parent = DG; num.inPoint = tC0; num.outPoint = B.line.t0;
    AESLib.bakeText(num, steps, scene.fps, tC0);
    openMask(type(ART, K + "_NUML", B.number.label.toUpperCase() + "  ·  COUNTED", { size: 34, tracking: 480, x: AX, y: 1636, parent: DG, out: B.line.t0 }), at(nw, 1, 5.22), .35);
    hinge(DG, [[tUp + .02, 0], [tUp + .26, 100], [B.line.t0 - .2, 100], [B.line.t0, 0]]);
    for (var bb = 0; bb <= 12; bb++) { var ba = -90 + 15 * bb, pf = (ba + 90) / 180, pt = 1 - Math.pow(1 - pf, 1 / 3), bt = bb === 0 ? tC0 : tC0 + pt * DUR, br = (180 + 15 * bb) * Math.PI / 180;
      bulb(comp, P + "_DB" + bb, AX + (DR + 34) * Math.cos(br), 1330 + (DR + 34) * Math.sin(br), bt, B.line.t0 - .2); }
    // 5. line: a subtitle card unfolds from the axis (stepped ends, double keyline) and the words appear in ivory on the voice
    var lw = words(B.line.t0, B.carry.t0), tL = B.line.t0, CG = group(ART, K + "_CARD", AX, 1380);
    lacquer(ART, K + "_CARDF", stepped(AX, 1380, 474, 140, 18, 2), { parent: CG, out: B.carry.t0 + .2 });
    keyline(ART, K + "_CARDK", function (gp) { return stepped(AX, 1380, 474 - gp, 140 - gp, 18, 2); }, { parent: CG, out: B.carry.t0 + .2, gap: 12 });
    hinge(CG, [[tL - .14, 0], [tL + .06, 100], [B.carry.t0, 100], [B.carry.t0 + .18, 0]]);
    var lt = B.line.text.toUpperCase().replace(/\.$/, "").split(" "), l1 = lt.slice(0, 4).join(" "), l2 = lt.slice(4).join(" ") + ".";
    spoken(comp, P + "_LINE1", l1, lw.slice(0, 4), { size: 66, tracking: 120, color: PALETTE.ivory, x: AX, y: 1366, out: B.carry.t0 });
    spoken(comp, P + "_LINE2", l2, lw.slice(4), { size: 66, tracking: 120, color: PALETTE.ivory, x: AX, y: 1452, out: B.carry.t0 });
    // 6. carry: the frame returns to the centre and turns into a diamond medallion; a burst of short rays and an arch frame it
    var burst = rays(AX, YE, DD + 70, DD + 150, 36, 0, 350); sh(ART, K + "_BURST", { paths: burst, stroke: WH, w: W.hair, draw: { t: tTurn1 - .1, dur: .35, mode: "end" } });
    line(ART, K + "_HALO0", arc(AX, YE, 470, 180, 360, 40), { draw: { t: tTurn1, dur: .45, mode: "centre" } });
    line(ART, K + "_HALO1", arc(AX, YE, 452, 180, 360, 40), { w: W.hair, draw: { t: tTurn1 + .04, dur: .45, mode: "centre" } });
    // 7. end: the closing plaque unfolds and the line lands on the voice; setback legs drop and a row of bulbs is counted on; a last sweep of light
    var ew = words(B.end.t0, B.end.t1), tE = B.end.t0, EG = group(ART, K + "_END", AX, 1390);
    lacquer(ART, K + "_ENDF", stepped(AX, 1390, 474, 104, 18, 2), { parent: EG });
    keyline(ART, K + "_ENDK", function (gp) { return stepped(AX, 1390, 474 - gp, 104 - gp, 18, 2); }, { parent: EG, gap: 12 });
    var endT = type(ART, K + "_ENDT", B.end.text.toUpperCase(), { family: TITLE, style: "Regular", size: 92, maxW: 860, tracking: 20, x: AX, y: 1424, parent: EG }); openMask(endT, at(ew, 0, tE) + .02, at(ew, 2, 9.48) - at(ew, 0, tE) + .1);
    hinge(EG, [[tE - .14, 0], [tE + .06, 100]]);
    for (var s2 = 0; s2 < 2; s2++) { var lg = [[330, 1494], [330, 1560], [250, 1560], [250, 1630], [170, 1630], [170, 1860]];
      line(ART, K + "_ELEG" + s2, s2 ? mirror(lg, AX) : lg, { w: W.detail, draw: { t: tE + .2, dur: .5, mode: "end" } }); }
    var tB = at(ew, 1, 9.33); for (var eb = 0; eb < 9; eb++) bulb(comp, P + "_EB" + eb, AX - 200 + 50 * eb, 1592, tB + .05 * eb, undefined, 10);
    var ttest = at(ew, 2, 9.48);
    // the gold, the sheen on the hits, the grain and the vignette
    var G = makeGold(comp, P, ART); notes = notes.concat(G.notes);
    sheen(G.sweep, Ht, [1.02, tPic + .1, tOpen + .3, at(nw, 2, 5.92), tTurn1, ttest]);
    var ground0 = ground(comp, P, AX, CY);
    var vig = comp.layers.addSolid([0, 0, 0], P + "_VIGNETTE", Wd, Ht, 1), mk = vig.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"), ms = new Shape();
    ms.vertices = [[0, 0], [Wd, 0], [Wd, Ht], [0, Ht]]; ms.closed = true; mk.property("ADBE Mask Shape").setValue(ms);
    vig.property("ADBE Mask Parade").property(1).property("ADBE Mask Feather").setValue([260, 260]); vig.property("ADBE Mask Parade").property(1).property("ADBE Mask Offset").setValue(-40);
    vig.property("ADBE Mask Parade").property(1).inverted = true; vig.opacity.setValue(55);
    var grain = comp.layers.addSolid([1, 1, 1], P + "_GRAIN", Wd, Ht, 1); grain.adjustmentLayer = true; fx(grain, "ADBE Noise"); fxp(grain, 1, "Amount of Noise").setValue(3.5);
    try { fxp(grain, 1, "Use Color Noise").setValue(0); } catch (e5) {}
    // stacking (top to bottom): grain, vignette, bulbs and ivory words, gold, jewel mat, sunburst, ground
    grain.moveToBeginning(); vig.moveAfter(grain); MATE.moveToEnd(); for (var gi = ground0.length - 1; gi >= 0; gi--) ground0[gi].moveToEnd(); ground0[0].moveToEnd();
    plate.moveBefore(MATE); G.layer.moveBefore(plate);
    return { layers: comp.numLayers + ART.numLayers, notes: notes };
  }
  return { TITLE: TITLE, NUMS: NUMS, SANS: SANS, PALETTE: PALETTE, W: W, fontOK: fontOK, sh: sh, line: line, keyline: keyline, lacquer: lacquer, volume: volume,
    type: type, openMask: openMask, spoken: spoken, group: group, hinge: hinge, bulb: bulb, makeGold: makeGold, sheen: sheen, ground: ground,
    arc: arc, circle: circle, stepped: stepped, archWin: archWin, star4: star4, rays: rays, buildScene: buildScene };
})();
