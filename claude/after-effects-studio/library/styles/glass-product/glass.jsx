// Glass product style: brand-neutral ES3 helpers. No project mutation happens at load.
// Read styles/glass-product/STYLE.md first. A launch film for a fictional glass object in a black strip-light studio. Blender owns the
// object and its light (tools/glass_scene.py renders one plate per beat: the sweep, the dispersion, the comet pulses, the exploded view,
// the caustic rings). After Effects owns the cut on every beat, a small extra push on each plate, the bloom above the highlights, a
// couple of frames of micro shake on the snap, the ultra-thin wide type with a diagonal glint, and the frosted-glass subtitle slab.
// Adapted from Lemo-Opuscar's glass-product style (MIT, LemoLab); see assets/LICENSE-lemo-opuscar.txt.
var AESGlass = (function () {
  var SANS = "Inter Tight";
  function hex(h) { return [parseInt(h.substr(1, 2), 16) / 255, parseInt(h.substr(3, 2), 16) / 255, parseInt(h.substr(5, 2), 16) / 255]; }
  var PAL = { text: hex("#EEF2F7"), secondary: hex("#9AA3AF"), ice: hex("#6BC7FF"), violet: hex("#A985FF"), cool: hex("#DBEAFF"), white: [1, 1, 1], black: [0, 0, 0] };
  var SHOTS = ["title", "picture", "input", "number", "line", "carry", "end"];
  // where the type sits (the plates leave these zones empty): titles in the upper third, the subtitle slab low
  var LAYOUT = { titleY: 360, sloganY: 470, numberLabelY: 1420, endY: 600, creditY: 700, slabY: 1640, slabH: 100, slabSize: 42 };
  function fontOK() { AESLib.font(SANS, "ExtraLight"); AESLib.font(SANS, "Light"); AESLib.font(SANS, "Regular"); return true; }
  function fx(L, m) { return L.property("ADBE Effect Parade").addProperty(m); }
  function blur(L, amt) { var b = fx(L, "ADBE Gaussian Blur 2"); b.property("Blurriness").setValue(amt); return b; }
  function rrShape(x, y, w, h, r) { var k = .5523 * r, s = new Shape();
    s.vertices = [[x + r, y], [x + w - r, y], [x + w, y + r], [x + w, y + h - r], [x + w - r, y + h], [x + r, y + h], [x, y + h - r], [x, y + r]];
    s.inTangents = [[-k, 0], [0, 0], [0, -k], [0, 0], [k, 0], [0, 0], [0, k], [0, 0]];
    s.outTangents = [[0, 0], [k, 0], [0, 0], [0, k], [0, 0], [-k, 0], [0, 0], [0, -k]]; s.closed = true; return s; }
  // flat pieces in one shape layer whose origin sits at pos (later items on top). item = { x, y, w, h, r, fill, op, stroke, sw, sop }
  function draw(comp, name, items, pos) { var L = comp.layers.addShape(); L.name = name; var root = L.property("ADBE Root Vectors Group");
    for (var i = items.length - 1; i >= 0; i--) { var it = items[i], v = root.addProperty("ADBE Vector Group").property("ADBE Vectors Group");
      var s = v.addProperty("ADBE Vector Shape - Rect"); s.property("ADBE Vector Rect Size").setValue([it.w, it.h]);
      s.property("ADBE Vector Rect Position").setValue([it.x + it.w / 2, it.y + it.h / 2]); if (it.r) s.property("ADBE Vector Rect Roundness").setValue(it.r);
      if (it.stroke) { var st = v.addProperty("ADBE Vector Graphic - Stroke"); st.property("ADBE Vector Stroke Color").setValue(it.stroke);
        st.property("ADBE Vector Stroke Width").setValue(it.sw || 1.5); st.property("ADBE Vector Stroke Opacity").setValue(it.sop === undefined ? 100 : it.sop); }
      if (it.fill) { var f = v.addProperty("ADBE Vector Graphic - Fill"); f.property("ADBE Vector Fill Color").setValue(it.fill);
        if (it.op !== undefined) f.property("ADBE Vector Fill Opacity").setValue(it.op); } }
    L.anchorPoint.setValue([0, 0]); L.position.setValue(pos); return L; }
  function span(L, t0, t1) { L.inPoint = t0; L.outPoint = t1; return L; }
  function wordsIn(words, t0, t1) { var r = []; for (var i = 0; i < words.length; i++) if (words[i].s >= t0 - .01 && words[i].s < t1 - .01) r.push(words[i]); return r; }
  function joinWords(ws) { var s = ""; for (var i = 0; i < ws.length; i++) s += (i ? " " : "") + ws[i].text; return s; }
  // --- type -----------------------------------------------------------------------------------------------------------------------
  // centred text on a baseline: o = { style, size, color, tracking, y, caps }
  function txt(comp, name, str, o) { var L = AESLib.text(comp, name, o.caps ? str.toUpperCase() : str, { family: SANS, style: o.style, size: o.size, color: o.color || PAL.text, tracking: o.tracking || 0 });
    L.position.setValue([comp.width / 2, o.y]); return L; }
  function inkW(L) { return L.sourceRectAtTime(L.inPoint, false).width; }
  // the widest a title may be: shrink its size until the ink fits maxW
  function fit(L, maxW) { var w = inkW(L); if (w <= maxW) return L; var sp = L.property("Source Text"), d = sp.value; d.fontSize = Math.floor(d.fontSize * maxW / w); sp.setValue(d); return L; }
  // launch-film arrival: opacity up and a blur that clears, eased out (no bounce, no slide); out is a cut unless dOut is given
  function arrive(L, t0, d, b) { AESLib.ease(L.opacity, [t0, t0 + d], [0, 100], "settle");
    if (b) { var g = blur(L, b); AESLib.ease(g.property("Blurriness"), [t0, t0 + d * 1.1], [b, 0], "settle"); } return L; }
  function leave(L, t1, d) { AESLib.ease(L.opacity, [t1 - d, t1], [100, 0], "exit"); return L; }
  // the glint: a copy of the text in white, matted by a soft diagonal band that crosses the letters in [t0, t1], added with a glow
  function glint(comp, name, L, t0, t1) { var r = L.sourceRectAtTime(t1, false), p = L.position.value, cx = p[0] + r.left + r.width / 2, cy = p[1] + r.top + r.height / 2;
    var G = L.duplicate(); G.name = name; var sp = G.property("Source Text"), d;
    if (sp.numKeys) { for (var k = 1; k <= sp.numKeys; k++) { d = sp.keyValue(k); d.fillColor = PAL.white; sp.setValueAtKey(k, d); } }   // a keyed line: recolour every key
    else { d = sp.value; d.fillColor = PAL.white; sp.setValue(d); }
    var ef = G.property("ADBE Effect Parade"); for (var e = ef.numProperties; e >= 1; e--) ef.property(e).remove();
    var ok = G.opacity; while (ok.numKeys) ok.removeKey(1); ok.setValue(100);
    var band = draw(comp, name + "_BAND", [{ x: -55, y: -r.height * 1.6, w: 110, h: r.height * 3.2, fill: PAL.white }], [cx - r.width / 2 - 200, cy]);
    band.rotation.setValue(24); blur(band, 26);
    AESLib.ease(band.position, [t0, t1], [[cx - r.width / 2 - 200, cy], [cx + r.width / 2 + 200, cy]], "travel");
    band.moveBefore(G); G.setTrackMatte(band, TrackMatteType.ALPHA); band.enabled = false;
    G.blendingMode = BlendingMode.ADD; var gl = fx(G, "ADBE Glo2"); gl.property("Glow Radius").setValue(18); gl.property("Glow Intensity").setValue(.8);
    span(G, t0, t1); span(band, t0, t1); return [G, band]; }
  // --- the frosted-glass subtitle slab ----------------------------------------------------------------------------------------------
  // a centred rounded bar filled with the live frame blurred and lifted (an adjustment layer masked to the bar), a little cool white,
  // a thin highlight stroke, an accent line on top, the line in the light grotesk. keys = { times, strs } types the line word by word.
  function slab(comp, P, str, t0, t1, keys) { var S = LAYOUT.slabSize, H = LAYOUT.slabH, y = LAYOUT.slabY, W = comp.width, out = [];
    var T = AESLib.text(comp, P + "_TXT", str, { family: SANS, style: "Light", size: S, color: PAL.text, tracking: 10 });
    var tw = inkW(T), w = Math.min(W - 80, tw + 96), x = (W - w) / 2, top = y - H / 2;
    var F = comp.layers.addSolid([1, 1, 1], P + "_FROST", W, comp.height, 1); F.adjustmentLayer = true;
    var mk = F.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"); mk.property("ADBE Mask Shape").setValue(rrShape(x, top, w, H, 26));
    var fb = blur(F, 34); try { fb.property("Repeat Edge Pixels").setValue(1); } catch (e) {}
    var lv = fx(F, "ADBE Easy Levels2"); lv.property("Output Black").setValue(.05); lv.property("Output White").setValue(.6); lv.property("Gamma").setValue(1.15);   // lifted, but a strip behind can never wash out the line
    var C = draw(comp, P + "_GLASS", [{ x: x, y: top, w: w, h: H, r: 26, fill: PAL.cool, op: 9, stroke: PAL.white, sw: 1.2, sop: 22 }], [0, 0]);
    var lw = Math.min(160, w * .3), A = draw(comp, P + "_ACCENT", [{ x: W / 2 - lw / 2, y: top - 1, w: lw, h: 2.5, r: 1, fill: PAL.ice }], [0, 0]);
    var ag = fx(A, "ADBE Glo2"); ag.property("Glow Radius").setValue(14); ag.property("Glow Intensity").setValue(1.2);
    T.moveToBeginning(); T.position.setValue([W / 2, y + S * .36]);
    if (keys) AESLib.textKeys(T, keys.times, keys.strs);
    out.push(F, C, A, T); for (var i = 0; i < out.length; i++) { span(out[i], t0, t1); AESLib.ease(out[i].opacity, [t0, t0 + .14], [0, 100], "settle"); }
    AESLib.ease(T.position, [t0, t0 + .3], [[W / 2, y + S * .36 + 10], [W / 2, y + S * .36]], "settle");
    return out; }
  // --- the plates ----------------------------------------------------------------------------------------------------------------
  // one Blender plate per beat, cut in on the beat, held on its last frame if the beat is a fraction longer, with a small extra push
  function plate(comp, P, file, b, push) { var L = comp.layers.add(AESLib.importFile(file)); L.name = P + "_PLATE_" + b.id; L.startTime = b.t0;
    L.timeRemapEnabled = true; L.property("ADBE Time Remapping").expression = "Math.min(time - thisLayer.startTime, thisLayer.source.duration - thisComp.frameDuration)";
    span(L, b.t0, b.t1); var s = comp.width / L.source.width * 100; L.scale.setValue([s, s]); AESLib.ease(L.scale, [b.t0, b.t1], [[s, s], [s * push, s * push]], "linear"); return L; }
  // a couple of frames of micro shake on an impact (the snap)
  function shake(L, t, amp) { var p = L.position.value, f = 1 / 30;
    L.position.setValuesAtTimes([t - f, t, t + f, t + 2 * f, t + 3 * f], [p, [p[0] + amp, p[1] - amp * .7], [p[0] - amp * .8, p[1] + amp * .5], [p[0] + amp * .3, p[1] - amp * .2], p]);
    for (var k = 1; k <= L.position.numKeys; k++) L.position.setInterpolationTypeAtKey(k, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR); }
  function clearOwned(comp, prefix) { AESLib.clearOwned(comp, prefix); }

  function buildScene(comp, scene, opts) {
    var P = opts.prefix || "GLASSP", A = opts.assets, B = scene.beat, notes = [];
    fontOK(); clearOwned(comp, P); var CX = comp.width / 2, END = scene.duration;
    var WL = scene.wordList || [];
    // 1. the plates, cut on the beats
    var plates = {}, push = { title: 1.03, picture: 1.02, input: 1.04, number: 1.025, line: 1.02, carry: 1.015, end: 1.0 };
    for (var i = 0; i < SHOTS.length; i++) { var id = SHOTS[i]; if (!A[id]) throw new Error("missing the " + id + " plate"); plates[id] = plate(comp, P, A[id], B[id], push[id]); }
    shake(plates.carry, B.carry.t0 + 36 / 30, 7);
    // bloom only above the highlights (Glow on the colour channels, a high threshold)
    var BL = comp.layers.addSolid([1, 1, 1], P + "_BLOOM", comp.width, comp.height, 1); BL.adjustmentLayer = true; span(BL, 0, END);
    var bg = fx(BL, "ADBE Glo2"); bg.property("Glow Based On").setValue(2); bg.property("Glow Threshold").setValue(78); bg.property("Glow Radius").setValue(60); bg.property("Glow Intensity").setValue(.35);

    // 2. title: the hero line huge, ultra-thin and wide; the context small beneath it, like a slogan; a glint rides the sweep
    var tb = B.title, TT = fit(txt(comp, P + "_TITLE", tb.context, { style: "ExtraLight", size: 132, tracking: 420, caps: true, y: LAYOUT.titleY }), 940);
    span(TT, tb.t0, tb.t1); arrive(TT, tb.t0 + .05, .5, 18);
    var tw = wordsIn(WL, tb.t0, tb.t1), tS = tw.length > 2 ? tw[2].s : tb.t0 + .44;
    var TS = txt(comp, P + "_SLOGAN", tb.hero.charAt(0).toUpperCase() + tb.hero.substr(1) + ".", { style: "Light", size: 46, tracking: 20, y: LAYOUT.sloganY });
    span(TS, tS - .04, tb.t1); arrive(TS, tS - .04, .3, 8);
    glint(comp, P + "_TGLINT", TT, tb.t0 + .55, tb.t1 - .05);

    // 3. subtitles on the slab for the spoken lines that are not title cards
    var lines = ["picture", "input", "carry"];
    for (var l = 0; l < lines.length; l++) { var b = B[lines[l]], ws = wordsIn(WL, b.t0, b.t1); slab(comp, P + "_SUB_" + b.id, joinWords(ws), b.t0 + .04, b.t1); }
    // the line beat types its words as they are spoken (one key per word), on the same slab
    var lb = B.line, lw = wordsIn(WL, lb.t0, lb.t1), lt = [], ls = [], acc = "";
    for (var w = 0; w < lw.length; w++) { acc += (w ? " " : "") + lw[w].text; lt.push(w ? lw[w].s : lb.t0); ls.push(acc); }
    if (!lw.length) { lt = [lb.t0]; ls = [lb.text]; }
    slab(comp, P + "_SUB_line", ls[ls.length - 1], lb.t0 + .02, lb.t1, { times: lt, strs: ls });

    // 4. number: the digits are glass in the plate; a tracked label under them, word by word, with its own glint
    var nb = B.number, nw = wordsIn(WL, nb.t0, nb.t1), lab = String(nb.label).toUpperCase(), n1 = nw.length > 1 ? nw[1].s : nb.t0 + .7, n2 = nw.length > 2 ? nw[2].s : nb.t0 + 1.4;
    var NL = txt(comp, P + "_NLABEL", lab + "   ·   COUNTED", { style: "Regular", size: 30, tracking: 640, color: PAL.secondary, y: LAYOUT.numberLabelY });
    AESLib.textKeys(NL, [nb.t0, n2], [lab, lab + "   ·   COUNTED"]); span(NL, n1 - .04, nb.t1); arrive(NL, n1 - .04, .3, 8);
    glint(comp, P + "_NGLINT", NL, n2 + .05, nb.t1 - .05);

    // 5. end card: the line ultra-thin in the upper third, each word clearing from blur as it is spoken, a glint, a small tracked credit
    var eb = B.end, ew = wordsIn(WL, eb.t0, eb.t1), EL = fit(txt(comp, P + "_END", eb.text, { style: "ExtraLight", size: 112, tracking: 80, y: LAYOUT.endY }), 920);
    span(EL, eb.t0, END); arrive(EL, (ew.length ? ew[0].s : eb.t0) - .02, .55, 16);
    var CR = txt(comp, P + "_CREDIT", "glass product", { style: "Regular", size: 24, tracking: 700, caps: true, color: PAL.secondary, y: LAYOUT.creditY });
    span(CR, eb.t0 + .8, END); arrive(CR, eb.t0 + .8, .4, 6);
    glint(comp, P + "_EGLINT", EL, eb.t0 + .9, eb.t0 + 1.55);
    notes.push("plates: Blender (tools/glass_scene.py), cut on the beats; type, glint, slab and bloom native");
    return { layers: comp.numLayers, notes: notes };
  }
  return { SANS: SANS, PALETTE: PAL, SHOTS: SHOTS, LAYOUT: LAYOUT, fontOK: fontOK, draw: draw, rrShape: rrShape, txt: txt, fit: fit, arrive: arrive, leave: leave,
    glint: glint, slab: slab, plate: plate, shake: shake, wordsIn: wordsIn, clearOwned: clearOwned, buildScene: buildScene };
})();
