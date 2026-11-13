// Pixel headline style: ES3 builders, one per element, and one for a whole beat. No project mutation happens at load.
// Read styles/pixel-headline/STYLE.md first. A cut-out speaker on a light ground; a small lead-in line, one giant word in the
// accent colour that lands on the voice with a glow and a burst of pixel blocks, upright video cards that pop in after it, a
// drawn line, and a tail line; the camera pushes out at the start. Every move is keyed from measured signatures (SIG below).
// Loads after styles/aes-lib.jsx. Times: seconds in the comp; signature tables are in frames at 30 fps (time = frames / 30).
var AESPixelHeadline = (function () {
  var REF = { w: 1080, h: 1920, fps: 30 };
  var FAM = "Inter", FACE = "Bold";
  // ---- signatures (STYLE.md section 9): keys are [frames, value, inInfluence, outInfluence, inSpeed, outSpeed]
  // speeds in value units per frame at 30 fps; influences 0-1
  var SIG = {
    word: [[-1.6476, 0, .33, .0732, 0, .1005], [8.8981, 1.1558, .8947, .0965, 0, 0], [13.8943, .9199, .3108, .4608, 0, 0], [24.9269, 1, .6656, .33, 0, 0]],
    card: [[-1.4255, 0, .33, .1316, 0, 0], [5.5032, 1.0776, 1.0, .6861, 0, 0], [13.2673, .8538, .5232, .3431, 0, 0], [23.0886, 1, .8505, .33, 0, 0]],
    push: [[0, 1.7149, .33, .02, 0, -.734], [42, 1, .3848, .33, 0, 0]],
    leadStrength: [[-1.865, 100, .33, .01, 0, -2.322], [26.119, 0, .823, .33, 0, 0]],
    tailStrength: [[-.376, 100, .33, .066, 0, -2.182], [26.078, 0, .842, .33, 0, 0]],
    leadDelay: 4.75, tailDelay: 6.4, leadDrop: 136, tailSlide: 154, tailBlur: 10,
    // Exposure 0.64 on a light ground (calibrated); 0.2 on a dark one (set from test renders on a dark wall: at 0.64 the
    // Screen haze washes the word's own letters toward white, at 0.2 they keep the accent and the haze still shows)
    deepGlow: { keys: [[-2, 0], [0, .64], [24.26, 0]], eases: [[33, 33], [30.7, 83.3], [5, 33]], darkGround: .2 },
    // stock fallback: a copy of the word with two Glows, its opacity keyed per frame from W - 1 (linear)
    stockGlow: { glows: [[30, 110, 1.803], [30, 420, .35]], from: -1,
      opacity: [0, 55.3, 69, 69.9, 69.9, 69.8, 69.8, 69.8, 67.3, 61.6, 53.9, 53.8, 45.6, 45.6, 47.5, 51, 51, 49.7, 46.1, 42.3, 39.6, 35.2, 27.5, 16.4, 0] },
    cardFirst: 8, cardStagger: 4, cardBlur: 70, cardExposure: 2, cardHold: 7, cardClear: 12,
    card3WidthShare: .278, cardRect: [790, 1100], cardRound: 60, rimScale: 106, rimBlur: 25, rimExposure: .15, clipScale: 76,
    cardTop: .244, cardMargin: .029, cardStep: .046, cardOverlap: .35, cardRimShare: .03, cardRoundShare: .076, rimBlurShare: .032,
    line: { width: 18, draw: [7.5, 18], wipe: [15, 22] },
    blocks: { cell: 39, strongOpacity: [70, 100], weakOpacity: [25, 50], weakRatio: .7, reach: 2.6, clusterMax: 2, minLife: 3,
      // The schedule, per frame from W: how many strong blocks are on, and the distance from the word's centre (in word
      // half-sizes) at which new ones appear. Both were fitted on renders so that what shows matches the measured curves
      // below; many blocks fall behind the letters, which is why the counts run higher than what is seen.
      count: [0, 2, 2, 3, 60, 66, 88, 89, 39, 36, 34, 22, 10, 9, 3, 2, 1, 0],
      dist: [.34, .62, .62, .62, .355, .427, .488, .68, 1.111, 1.645, 1.667, 2.174, 1.999, 2.193, .258, .565, .24, 1.04],
      // what the reference shows, per frame from W (608-wide picture): strong red outside the word (px), and the visible
      // blocks' mean distance from the word's centre in half-sizes (null: none visible). The check, not the input.
      seenRed: [7, 429, 697, 973, 6307, 6701, 8827, 11260, 6800, 6959, 8297, 7525, 6104, 5825, 2860, 2076, 811, 55],
      seenDist: [null, .32, .32, .32, .61, .59, .59, .67, .82, 1.01, 1.15, 1.51, 1.58, 1.76, .73, .87, null, null],
      sides: { above: .327, below: .122, left: .401, right: .15 }, lineFree: 6 },
    type: { wordSize: .284, wordMax: .85, wordBaseline: .275, wordPivotUp: 18, leadSize: 64, leadBaseline: .147, tailSize: 86, tailBaseline: .318, leading: 1.2, lineMax: .85 },
    pushLead: 18,
    // exits (extended: the reference never shows one): each element leaves the way it came, about twice as fast, with no
    // overshoot; text by word from the last word, cards from the last card; everything gone within 10 frames
    exit: { textFrames: 6, wordDelay: 1, wordFrames: 7, cardFrames: 6, cardStagger: 2, easeOut: .75, easeIn: .1, within: 10 }
  };
  function k(comp) { return comp.width / REF.w; }
  function sec(frames) { return frames / REF.fps; }
  function isArr(x) { return Object.prototype.toString.call(x) === "[object Array]"; }   // true for arrays from any realm

  function dims(prop) { var sp = prop.propertyValueType === PropertyValueType.TwoD_SPATIAL || prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL;
    return (!sp && isArr(prop.value)) ? prop.value.length : 1; }
  function clampInf(x) { return Math.max(.1, Math.min(100, x * 100)); }
  // write signature keys: at (s), keys as above, mul scales values and speeds, vec makes a value a vector (scale)
  function sigKeys(prop, at, keysIn, mul, vec) {
    var times = [], vals = [], i, n;
    for (i = 0; i < keysIn.length; i++) { var v = keysIn[i][1] * mul; times.push(at + sec(keysIn[i][0])); vals.push(vec ? vecOf(v, vec) : v); }
    prop.setValuesAtTimes(times, vals);
    var d = dims(prop), B = KeyframeInterpolationType.BEZIER;
    for (i = 0; i < keysIn.length; i++) { var q = keysIn[i], ki = prop.nearestKeyIndex(times[i]), a = [], b = [];
      for (n = 0; n < d; n++) { a.push(new KeyframeEase(q[4] * mul * REF.fps, clampInf(q[2]))); b.push(new KeyframeEase(q[5] * mul * REF.fps, clampInf(q[3]))); }
      prop.setInterpolationTypeAtKey(ki, B, B); prop.setTemporalEaseAtKey(ki, a, b); }
    return prop; }
  function vecOf(v, n) { var a = []; for (var i = 0; i < n; i++) a.push(v); return a; }
  function linearKeys(prop, times, vals) { prop.setValuesAtTimes(times, vals); var L = KeyframeInterpolationType.LINEAR;
    for (var i = 0; i < times.length; i++) { var ki = prop.nearestKeyIndex(times[i]); prop.setInterpolationTypeAtKey(ki, L, L); } return prop; }
  function holdKeys(prop, times, vals) { prop.setValuesAtTimes(times, vals); var H = KeyframeInterpolationType.HOLD;
    for (var i = 0; i < times.length; i++) prop.setInterpolationTypeAtKey(prop.nearestKeyIndex(times[i]), H, H); return prop; }
  function fontOK() { AESLib.font(FAM, FACE); return true; }
  function hasEffect(mn) { var e = app.effects; for (var i = 0; i < e.length; i++) if (e[i].matchName === mn) return true; return false; }
  function motionBlur(comp, layers) { comp.motionBlur = true; for (var i = 0; i < layers.length; i++) if (layers[i] && layers[i].motionBlur !== undefined) try { layers[i].motionBlur = true; } catch (e) {} return layers.length; }
  function effect(L, mn, name) { var e = L.property("ADBE Effect Parade").addProperty(mn); if (name) e.name = name;
    return L.property("ADBE Effect Parade").property(L.property("ADBE Effect Parade").numProperties); }

  function pfx(o) { return (o && o.prefix) || "PH "; }
  // text split into at most two lines at a word boundary, the lines as even as they can be (maxChars per line, default 24)
  function wrap(text, maxChars) { var m = maxChars || 24; if (text.length <= m) return [text];
    var w = text.split(" "), best = null, bestD = 1e9;
    for (var i = 1; i < w.length; i++) { var a = w.slice(0, i).join(" "), b = w.slice(i).join(" "), d = Math.abs(a.length - b.length);
      if (Math.max(a.length, b.length) <= m + 6 && d < bestD) { bestD = d; best = [a, b]; } }
    return best || [text]; }

  // ---- stage: the ground and the graded speaker. o = { take (FootageItem), takeStart (s into the take at the comp's 0),
  //      scale (%), x, ground [r,g,b], grade { mixer [r,g,b], inBlack, inWhite, gamma, saturation }, prefix,
  //      footageGround (true: the take is used as it is, filling the frame, with no cut-out and no ground solid) }
  function stage(comp, o) {
    var W = comp.width, H = comp.height, g = o.ground || [.8, .8, .81], P = pfx(o), G = null, S = null;
    if (!o.footageGround) { G = comp.layers.addSolid(g, P + "Ground", W, H, 1, comp.duration);
      var r = effect(G, "ADBE Ramp");
      r.property("Start of Ramp").setValue([W / 2, H * .469]); r.property("Start Color").setValue([g[0] + .04, g[1] + .04, g[2] + .04]);
      r.property("End of Ramp").setValue([W / 2, H * 1.198]); r.property("End Color").setValue([g[0] - .06, g[1] - .06, g[2] - .06]); r.property("Ramp Shape").setValue(2);
      effect(G, "ADBE Noise2").property("Amount of Noise").setValue(1.3); }
    if (o.take) { S = comp.layers.add(o.take); S.name = P + "Speaker"; if (S.hasAudio) S.audioEnabled = false;
      if (o.takeStart) S.startTime = -o.takeStart;
      if (o.footageGround) { var cover = 100 * Math.max(W / o.take.width, H / o.take.height);
        S.anchorPoint.setValue([o.take.width / 2, o.take.height / 2]); S.position.setValue([W / 2, H / 2]); S.scale.setValue([cover, cover]); }
      else { S.anchorPoint.setValue([o.take.width / 2, o.take.height]); S.position.setValue([o.x === undefined ? W / 2 : o.x, H]);
        var sc = o.scale || 100; S.scale.setValue([sc, sc]); }
      var q = o.grade;
      if (q) { var m = effect(S, "ADBE CHANNEL MIXER"); m.property("Red-Red").setValue(q.mixer[0]); m.property("Green-Green").setValue(q.mixer[1]); m.property("Blue-Blue").setValue(q.mixer[2]);
        var lv = effect(S, "ADBE Easy Levels2"); lv.property("Input Black").setValue(q.inBlack); lv.property("Input White").setValue(q.inWhite); lv.property("Gamma").setValue(q.gamma); lv.property("Output Black").setValue(0);
        effect(S, "ADBE HUE SATURATION").property("Master Saturation").setValue(q.saturation); } }
    // a shade in the wall's colour over the top of the frame (hides what the take shows there, e.g. a ceiling), its lower edge
    // feathered; it rides the push with the footage. o.topShade = { share (of the height), colour [r,g,b], feather (px) }
    var Sh = null;
    if (o.topShade) { var ts = o.topShade, fh = ts.feather === undefined ? .05 * H : ts.feather;
      Sh = comp.layers.addSolid(ts.colour, P + "Top shade", W, H, 1, comp.duration);
      Sh.property("ADBE Mask Parade").addProperty("ADBE Mask Atom").name = "Shade";
      var sm = new Shape(); sm.vertices = [[-fh, -2 * fh], [W + fh, -2 * fh], [W + fh, ts.share * H + fh / 2], [-fh, ts.share * H + fh / 2]]; sm.closed = true;
      Sh.property("ADBE Mask Parade").property("Shade").property("ADBE Mask Shape").setValue(sm);
      Sh.property("ADBE Mask Parade").property("Shade").property("ADBE Mask Feather").setValue([0, fh]); }
    return { ground: G, speaker: S, shade: Sh, footageGround: !!o.footageGround }; }

  // ---- the zoom-out inset: the footage scaled down inside the frame, its edges feathered by a mask, over a ground solid of
  //      the footage's own colour, so the speaker sits small and leaves room above. o = { speaker (layer), scale (%),
  //      position [x, y] (the inset's centre), feather (px on screen), ground [r,g,b] or "sample" (read from the footage's top
  //      edge by expression), trimTop (share of the footage's height left off its top), at (s: when given, it moves there on
  //      the push's curve over 42 frames), prefix }
  function zoomOut(comp, o) { var S = o.speaker, P = pfx(o), src = S.source, sc = o.scale, fe = o.feather === undefined ? 60 : o.feather;
    var G = comp.layers.addSolid(o.ground && o.ground.length ? o.ground : [0, 0, 0], P + "Inset ground", comp.width, comp.height, 1, comp.duration); G.moveAfter(S);
    if (o.ground === "sample") { var f = effect(G, "ADBE Fill");
      f.property("Color").expression = 'var L = thisComp.layer("' + S.name + '");\nvar c = L.sampleImage([L.width / 2, L.height * .03], [L.width * .45, L.height * .02], true, time);\n[c[0], c[1], c[2], 1];'; }
    var mk = S.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"); mk.name = "Inset edge";
    // trimTop: a share of the footage's height left off its top (e.g. a ceiling the top shade hid at full frame)
    var y0 = (o.trimTop || 0) * src.height, shp = new Shape(); shp.vertices = [[0, y0], [src.width, y0], [src.width, src.height], [0, src.height]]; shp.closed = true;
    S.property("ADBE Mask Parade").property("Inset edge").property("ADBE Mask Shape").setValue(shp);
    var lf = fe * 100 / sc; S.property("ADBE Mask Parade").property("Inset edge").property("ADBE Mask Feather").setValue([lf, lf]);
    S.property("ADBE Mask Parade").property("Inset edge").property("ADBE Mask Offset").setValue(-lf / 2);
    if (S.anchorPoint.value[1] !== src.height / 2) S.anchorPoint.setValue([src.width / 2, src.height / 2]);
    if (o.at !== undefined) { var from = S.scale.valueAtTime(o.at, false), fp = S.position.valueAtTime(o.at, false);
      pushEase(S.scale, o.at, from, [sc, sc, 100].slice(0, from.length)); pushEase(S.position, o.at, fp, toParent(S, o.position, o.at)); }
    else { S.scale.setValue([sc, sc]); S.position.setValue(toParent(S, o.position, 0)); }
    return { ground: G, speaker: S }; }
  // a comp-space point in a layer's parent space at time t (parent unrotated), so a parented layer can be sent to a place on screen
  function toParent(L, p, t) { var P = L.parent; if (!P) return p;
    var pp = P.position.valueAtTime(t, false), pa = P.anchorPoint.valueAtTime(t, false), ps = P.scale.valueAtTime(t, false);
    return [pa[0] + (p[0] - pp[0]) * 100 / ps[0], pa[1] + (p[1] - pp[1]) * 100 / ps[1]]; }
  // back to the full frame on the same ease. o = { speaker, at, cover (%) }
  function exitInset(comp, o) { var S = o.speaker, src = S.source, cv = o.cover || 100 * Math.max(comp.width / src.width, comp.height / src.height);
    var from = S.scale.valueAtTime(o.at, false), fp = S.position.valueAtTime(o.at, false);
    pushEase(S.scale, o.at, from, [cv, cv, 100].slice(0, from.length)); pushEase(S.position, o.at, fp, toParent(S, [comp.width / 2, comp.height / 2], o.at));
    return o.at + sec(SIG.push[1][0]); }
  // a move from a to b (numbers or arrays) on the push's curve: fast out of the first frame, a long ease in, over 42 frames
  // (or `frames`: the same curve compressed or stretched in time)
  function pushEase(prop, at, a, b, frames) { var K = SIG.push, fr = frames || K[1][0], t1 = at + sec(fr), d = [], i, n = isArr(a) ? a.length : 1;
    if (isArr(a)) { var bb = []; for (i = 0; i < n; i++) bb.push(i < b.length ? b[i] : a[i]); b = bb; }   // match the layer's dimensions
    prop.setValuesAtTimes([at, t1], [a, b]);
    var spd = K[0][5] / (K[0][1] - K[1][1]) * REF.fps * K[1][0] / fr;   // the push's out speed as a share of its travel, per second
    var span = 0; for (i = 0; i < n; i++) span = Math.max(span, Math.abs((n > 1 ? b[i] - a[i] : b - a)));
    var dm = dims(prop), B = KeyframeInterpolationType.BEZIER, ea = [], eb = [], ec = [], ed = [];
    for (i = 0; i < dm; i++) { ea.push(new KeyframeEase(0, 33)); eb.push(new KeyframeEase(-spd * span, K[0][3] * 100)); ec.push(new KeyframeEase(0, K[1][2] * 100)); ed.push(new KeyframeEase(0, 33)); }
    var k0 = prop.nearestKeyIndex(at), k1 = prop.nearestKeyIndex(t1);
    prop.setInterpolationTypeAtKey(k0, B, B); prop.setTemporalEaseAtKey(k0, ea, eb);
    prop.setInterpolationTypeAtKey(k1, B, B); prop.setTemporalEaseAtKey(k1, ec, ed);
    return prop; }

  // ---- the text reveal (native: one animator, an Expression Selector based on words, sliders). Each word reads the
  //      Strength slider at time - rank x Delay / 30 s; rank is the word's place in reading order, or, from the exit time on,
  //      its place from the end (the exit runs in reverse at its own delay). Strength 100 = fully offset and clear; 0 = in place.
  // line2 (optional) = { n1: words in line 1, extra: s added to every word of line 2 }, so line 2 starts when it is spoken
  function reveal(L, at, strength, delay, offset, blur, line2) {
    var fx = L.property("ADBE Effect Parade");
    fx.addProperty("ADBE Slider Control").name = "Reveal Line 2";
    fx.addProperty("ADBE Slider Control").name = "Reveal Strength";
    fx.addProperty("ADBE Slider Control").name = "Reveal Delay";
    fx.addProperty("ADBE Slider Control").name = "Reveal Exit";
    fx.addProperty("ADBE Slider Control").name = "Reveal Exit Delay";
    L.property("ADBE Effect Parade").property("Reveal Delay").property(1).setValue(delay);
    L.property("ADBE Effect Parade").property("Reveal Exit").property(1).setValue(-1);
    L.property("ADBE Effect Parade").property("Reveal Exit Delay").property(1).setValue(SIG.exit.wordDelay);
    L.property("ADBE Effect Parade").property("Reveal Line 2").property(1).setValue(line2 ? line2.extra : 0);
    sigKeys(L.property("ADBE Effect Parade").property("Reveal Strength").property(1), at, strength, 1, 0);
    var ans = L.property("ADBE Text Properties").property("ADBE Text Animators"); ans.addProperty("ADBE Text Animator").name = "PH Reveal";
    function an() { return L.property("ADBE Text Properties").property("ADBE Text Animators").property("PH Reveal"); }
    an().property("ADBE Text Selectors").addProperty("ADBE Text Expressible Selector").name = "PH Words";
    var sel = an().property("ADBE Text Selectors").property("PH Words");
    sel.property("ADBE Text Range Type2").setValue(3);
    sel.property("ADBE Text Expressible Amount").expression = 'var ex = effect("Reveal Exit")(1), out = ex >= 0 && time >= ex;\n'
      + 'var rank = out ? textTotal - textIndex : textIndex - 1, d = out ? effect("Reveal Exit Delay")(1) : effect("Reveal Delay")(1);\n'
      + 'var x = !out && textIndex > ' + (line2 ? line2.n1 : 9999) + ' ? effect("Reveal Line 2")(1) : 0;\n'
      + 'var s = effect("Reveal Strength")(1).valueAtTime(time - rank * d / 30 - x);\n[s, s, s];';
    an().property("ADBE Text Animator Properties").addProperty("ADBE Text Position 3D");
    an().property("ADBE Text Animator Properties").property("ADBE Text Position 3D").setValue([offset[0], offset[1], 0]);
    an().property("ADBE Text Animator Properties").addProperty("ADBE Text Opacity");
    an().property("ADBE Text Animator Properties").property("ADBE Text Opacity").setValue(0);
    if (blur) { an().property("ADBE Text Animator Properties").addProperty("ADBE Text Blur"); an().property("ADBE Text Animator Properties").property("ADBE Text Blur").setValue([blur, blur]); }
    return L; }
  // a revealed line leaves: its words go back the way they came, last word first, from `at`
  function exitText(L, at) { var fx = L.property("ADBE Effect Parade"), X = SIG.exit;
    fx.property("Reveal Exit").property(1).setValue(at);
    var st = fx.property("Reveal Strength").property(1);
    sigKeys(st, at, [[0, 0, .33, X.easeOut, 0, 0], [X.textFrames, 100, X.easeIn, .33, 0, 0]], 1, 0);
    // the words' delay shrinks so a long line is still gone within X.within frames
    var words = L.property("Source Text").value.text.split(/\s+/).length, d = words > 1 ? Math.min(X.wordDelay, (X.within - X.textFrames) / (words - 1)) : 0;
    fx.property("Reveal Exit Delay").property(1).setValue(d);
    var end = at + sec(X.textFrames + (words - 1) * d); L.outPoint = end; return end; }
  // a line of the triangle: one or two lines of text, shrunk to fit SIG.type.lineMax of the width, a start time per line.
  //      o = { text, lines (two strings: force the split), maxChars, at (s, or [line 1, line 2] spoken starts) }
  function textLine(comp, o, name, size0, delay) { var lines = o.lines || wrap(o.text, o.maxChars), size = size0, T = SIG.type;
    var L = AESLib.text(comp, name, lines.join("\r"), { family: FAM, style: FACE, size: size, color: o.colour || [1, 1, 1], just: "center", leading: size * T.leading, pos: [comp.width / 2, 0] });
    var r = L.sourceRectAtTime(0, false);
    if (r.width > T.lineMax * comp.width) { size *= T.lineMax * comp.width / r.width; var td = L.property("Source Text").value; td.fontSize = size; td.leading = size * T.leading; L.property("Source Text").setValue(td); }
    var at = isArr(o.at) ? o.at[0] : o.at, line2 = null;
    if (lines.length > 1 && isArr(o.at) && o.at.length > 1) { var n1 = lines[0].split(" ").length; line2 = { n1: n1, extra: o.at[1] - at - n1 * delay / 30 }; }
    return { layer: L, lines: lines, size: size, at: at, line2: line2 }; }
  // ---- lead-in line. o = { text, at (s, or one per line), colour, prefix, maxChars, lines }. Two lines when the text runs
  //      past maxChars (24): they stack upward from the lead-in's baseline, so the giant word's place does not move.
  function leadIn(comp, o) { var s = k(comp), T = SIG.type, t = textLine(comp, o, pfx(o) + "Lead-in", T.leadSize * s, SIG.leadDelay), L = t.layer;
    L.position.setValue([comp.width / 2, (o.baseline === undefined ? comp.height * T.leadBaseline : o.baseline) - t.size * T.leading * (t.lines.length - 1)]);
    reveal(L, t.at, SIG.leadStrength, SIG.leadDelay, [0, -SIG.leadDrop * s], 0, t.line2);
    return L; }
  // ---- tail line. o = { text, at (s, or one per line), colour, under (the giant word's layer, to clear its descenders),
  //      baseline (comp px; default 31.8 % of the height, below any descender), prefix, maxChars, lines }. Two lines stack
  //      downward from the tail's baseline.
  function tail(comp, o) { var s = k(comp), T = SIG.type, y = comp.height * T.tailBaseline, at0 = isArr(o.at) ? o.at[0] : o.at;
    if (o.baseline !== undefined) y = o.baseline;
    else if (o.under) { var r = o.under.sourceRectAtTime(at0, false), sz = o.under.property("Source Text").value.fontSize, below = r.top + r.height;
      var wb = o.under.position.value[1] + o.under.anchorPoint.value[1] * -1 + 0;   // the word's baseline
      if (below > .05 * sz) y = Math.max(y, wb + below + .03 * comp.height); }
    var t = textLine(comp, o, pfx(o) + "Tail", T.tailSize * s, SIG.tailDelay), L = t.layer;
    L.position.setValue([comp.width / 2, y]);
    reveal(L, t.at, SIG.tailStrength, SIG.tailDelay, [-SIG.tailSlide * s, 0], SIG.tailBlur * s, t.line2);
    return L; }

  // ---- giant word and its glow. o = { text, at (s: W, the stressed word's spoken start), colour, glow ("auto"|"deep"|"stock"),
  //      exposure (Deep Glow's peak; default the light-ground signature, SIG.deepGlow.darkGround on a dark ground), prefix }
  //      Returns { layer, glow, box (settled, comp px) }
  function heroWord(comp, o) { var s = k(comp), T = SIG.type, W = comp.width, base = comp.height * T.wordBaseline, size = T.wordSize * W, P = pfx(o);
    var L = AESLib.text(comp, P + "Word", o.text, { family: FAM, style: FACE, size: size, color: o.colour || [1, 0, 0], just: "center", pos: [W / 2, base] });
    var r = L.sourceRectAtTime(o.at + 1, false), top0 = base + r.top;
    if (r.width > T.wordMax * W) { size *= T.wordMax * W / r.width; var td = L.property("Source Text").value; td.fontSize = size; L.property("Source Text").setValue(td); r = L.sourceRectAtTime(o.at + 1, false);
      base = top0 - r.top; }   // a shrunk word keeps its tallest letters where they were: just under the lead-in's baseline
    if (o.baseline !== undefined) base = o.baseline;
    L.anchorPoint.setValue([0, -T.wordPivotUp * s]); L.position.setValue([W / 2, base - T.wordPivotUp * s]);
    sigKeys(L.scale, o.at, SIG.word, 100, dims(L.scale));
    L.inPoint = o.at;
    var mode = o.glow || "auto", used = mode === "auto" ? (hasEffect("PEDG2") ? "deep" : "stock") : mode;
    if (used === "deep") { var e = effect(L, "PEDG2"), x = e.property(25), D = SIG.deepGlow, pk = o.exposure || (o.darkGround && D.darkGround ? D.darkGround : D.keys[1][1]), t = [], v = [];
      for (var i = 0; i < D.keys.length; i++) { t.push(o.at + sec(D.keys[i][0])); v.push(D.keys[i][1] ? pk : 0); }
      x.setValuesAtTimes(t, v); var B = KeyframeInterpolationType.BEZIER;
      for (i = 0; i < t.length; i++) { var ki = x.nearestKeyIndex(t[i]); x.setInterpolationTypeAtKey(ki, B, B);
        x.setTemporalEaseAtKey(ki, [new KeyframeEase(0, D.eases[i][0])], [new KeyframeEase(0, D.eases[i][1])]); } }
    var C = null;
    if (used !== "deep") { C = L.duplicate(); C.name = P + "Word glow"; C.moveAfter(L); var S = SIG.stockGlow;
      for (var g = 0; g < S.glows.length; g++) { var gl = effect(C, "ADBE Glo2"); gl.property("Glow Threshold").setValue(S.glows[g][0]); gl.property("Glow Radius").setValue(S.glows[g][1] * s); gl.property("Glow Intensity").setValue(S.glows[g][2]); }
      var tt = [], vv = []; for (var f = 0; f < S.opacity.length; f++) { tt.push(o.at + sec(S.from + f)); vv.push(S.opacity[f]); }
      linearKeys(C.opacity, tt, vv); }
    // the settled box in comp px (anchor offset folded in)
    var box = { x0: W / 2 + r.left, x1: W / 2 + r.left + r.width, y0: base + r.top, y1: base + r.top + r.height };
    return { layer: L, glowLayer: C, glow: used, box: box, size: size }; }

  // ---- pixel blocks. A pure schedule (no AE), then one shape layer of grid squares with Hold opacity keys.
  function rng(seed) { var s = (Math.abs(Math.floor(seed || 7)) % 2147483646) + 1; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  // o = { box {x0,x1,y0,y1}, width, height (comp), seed, cell (px), lineBand [y0, y1] (keep clear until lineFree) }
  // returns [{ x, y, w, h, on, off (frames from W), opacity, d }]
  function blockSchedule(o) {
    var B = SIG.blocks, R = rng(o.seed), c = o.cell || B.cell, bx = o.box, cx = (bx.x0 + bx.x1) / 2, cy = (bx.y0 + bx.y1) / 2, hw = (bx.x1 - bx.x0) / 2, hh = (bx.y1 - bx.y0) / 2;
    var cells = [], sides = ["above", "below", "left", "right"], i, j;
    for (i = 0; i * c < o.width; i++) for (j = 1; j * c < o.height * .45; j++) {
      var x = i * c + c / 2, y = j * c + c / 2, nx = (x - cx) / hw, ny = (y - cy) / hh, d = Math.max(Math.abs(nx), Math.abs(ny));
      if (d > B.reach) continue;
      var dir = [-ny, ny, -nx, nx], best = 0; for (var q = 1; q < 4; q++) if (dir[q] > dir[best]) best = q;
      cells.push({ i: i, j: j, x: i * c, y: j * c, d: d, side: sides[best], line: o.lineBand ? (y + c / 2 > o.lineBand[0] && y - c / 2 < o.lineBand[1]) : false }); }
    var out = [];
    function run(counts, strong) {
      var act = [], taken = { above: 0, below: 0, left: 0, right: 0 }, used = {};
      for (var f = 0; f < counts.length; f++) {
        var n = counts[f], D = dist[Math.min(f, dist.length - 1)];
        // when there are too many, the ones furthest from this frame's distance go; and one block a frame that has fallen
        // behind the run (more than .35 inside it) is replaced, so the burst travels
        act.sort(function (a, b) { return Math.abs(b.d - D) - Math.abs(a.d - D); });
        while (act.length > n) { var b0 = act.shift(); b0.off = f; used[b0.i + "," + b0.j] = 0; }
        act.sort(function (a, b) { return a.d - b.d; });
        if (act.length && act[0].d < D - .35 && f - act[0].on >= B.minLife) { var b1 = act.shift(); b1.off = f; used[b1.i + "," + b1.j] = 0; }
        var guard = 0;
        while (act.length < n && guard++ < 400) {
          var tot = taken.above + taken.below + taken.left + taken.right + 1, side = "above", gap = -9;
          for (var s in B.sides) { var g = B.sides[s] - taken[s] / tot; if (g > gap) { gap = g; side = s; } }
          var pool = [];
          for (var p = 0; p < cells.length; p++) { var cc = cells[p];
            if (cc.side !== side || used[cc.i + "," + cc.j] || (cc.line && f < B.lineFree)) continue;
            if (cc.d >= D - .1 && cc.d <= D + .4) pool.push(cc); }
          if (!pool.length) { var near = 9; for (p = 0; p < cells.length; p++) { cc = cells[p]; if (cc.side === side && !used[cc.i + "," + cc.j] && !(cc.line && f < B.lineFree)) near = Math.min(near, Math.abs(cc.d - D)); }
            for (p = 0; p < cells.length; p++) { cc = cells[p]; if (cc.side === side && !used[cc.i + "," + cc.j] && !(cc.line && f < B.lineFree) && Math.abs(cc.d - D) <= near + .15) pool.push(cc); } }
          if (!pool.length) { taken[side] += 1; continue; }
          var pick = pool[Math.floor(R() * pool.length)], run1 = [pick], extra = Math.floor(R() * (B.clusterMax + 1));
          for (var e2 = 0; e2 < extra; e2++) { var last = run1[run1.length - 1], dd = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(R() * 4)];
            for (p = 0; p < cells.length; p++) if (cells[p].i === last.i + dd[0] && cells[p].j === last.j + dd[1] && !used[cells[p].i + "," + cells[p].j] && !(cells[p].line && f < B.lineFree)) { run1.push(cells[p]); break; } }
          taken[side] += 1;
          for (var r1 = 0; r1 < run1.length && act.length < n; r1++) { var cl = run1[r1], lo = strong ? B.strongOpacity : B.weakOpacity;
            var blk = { i: cl.i, j: cl.j, x: cl.x, y: cl.y, w: c, h: c, d: cl.d, on: f, off: null, opacity: lo[0] + R() * (lo[1] - lo[0]) };
            used[cl.i + "," + cl.j] = 1; act.push(blk); out.push(blk); } } }
      for (var a = 0; a < act.length; a++) act[a].off = counts.length; }
    var strongC = [], weakC = [], area = (o.width * o.height) / (REF.w * REF.h) * (o.scale === undefined ? 1 : o.scale), count = o.count || B.count, dist = o.dist || B.dist;
    for (i = 0; i < count.length; i++) { strongC.push(Math.round(count[i] * area)); weakC.push(Math.round(count[i] * area * B.weakRatio)); }
    run(strongC, true); run(weakC, false);
    return out; }
  // o = { word (heroWord's result), at (W), colour, seed, lineBand }
  function pixelBlocks(comp, o) { var blocks = blockSchedule({ box: o.word.box, width: comp.width, height: comp.height, seed: o.seed || 7, cell: SIG.blocks.cell * k(comp), lineBand: o.lineBand, count: o.count, dist: o.dist, scale: o.blockScale });
    var L = comp.layers.addShape(); L.name = pfx(o) + "Pixels"; var root = L.property("ADBE Root Vectors Group");
    for (var b = 0; b < blocks.length; b++) { var q = blocks[b], g = root.addProperty("ADBE Vector Group"); g.name = "B" + (b + 1);
      var rr = root.property(b + 1).property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Rect");
      rr.property("ADBE Vector Rect Size").setValue([q.w, q.h]); rr.property("ADBE Vector Rect Position").setValue([q.x + q.w / 2 - comp.width / 2, q.y + q.h / 2 - comp.height / 2]);
      root.property(b + 1).property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(o.colour || [1, 0, 0]);
      holdKeys(root.property(b + 1).property("ADBE Vector Transform Group").property("ADBE Vector Group Opacity"), [0, o.at + sec(q.on), o.at + sec(q.off)], [0, q.opacity, 0]); }
    return { layer: L, blocks: blocks }; }

  // ---- one card. o = { clip (FootageItem), clipStart (s in the clip at the card's first frame), at (s: F), pos [x, y], scale (S, %),
  //      name, size [w, h] (the card's inner rectangle in its own comp; default the upright 790 x 1100), width (px on screen,
  //      rim included; sets S when given) }. The upright default keeps the calibrated 106 % rim; any other shape scales the rim
  //      and the corners by its shorter side: rim 3 % of it on each edge, corner radius 7.6 % of it, rim blur 3.2 % of it.
  function card(comp, o) { var R = o.size || SIG.cardRect, nm = o.name || (pfx(o) + "Card"), up = !o.size, mn = Math.min(R[0], R[1]);
    var t = up ? 0 : SIG.cardRimShare * mn, outerR = up ? R : [R[0] + 2 * t, R[1] + 2 * t], round = up ? SIG.cardRound : SIG.cardRoundShare * mn;
    var cw = up ? REF.w : Math.ceil(outerR[0] + .2 * mn), ch = up ? REF.h : Math.ceil(outerR[1] + .2 * mn);
    var C = app.project.items.addComp(nm, cw, ch, 1, comp.duration, comp.frameRate);
    function rect(name, size, sc, rnd) { var L = C.layers.addShape(); L.name = name; var g = L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
      var gs = L.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group"); var rr = gs.addProperty("ADBE Vector Shape - Rect");
      rr.property("ADBE Vector Rect Size").setValue(size); rr.property("ADBE Vector Rect Roundness").setValue(rnd);
      L.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue([1, 1, 1]);
      L.position.setValue([cw / 2, ch / 2]); L.scale.setValue([sc, sc]); return L; }
    var outer = up ? rect("Outer", R, SIG.rimScale, round) : rect("Outer", outerR, 100, round + t);
    var rim = C.layers.addSolid([1, 1, 1], "Rim", cw, ch, 1, comp.duration); rim.adjustmentLayer = true;
    var rb = effect(rim, "ADBE Gaussian Blur 2"); rb.property("Blurriness").setValue(up ? SIG.rimBlur : SIG.rimBlurShare * mn); rb.property("Repeat Edge Pixels").setValue(1);
    effect(rim, "ADBE Exposure2").property("Exposure").setValue(SIG.rimExposure);
    var inner = rect("Inner", R, 100, round);
    var clip = C.layers.add(o.clip); clip.name = "Clip"; if (clip.hasAudio) clip.audioEnabled = false;
    var cs = 104 * Math.max(R[0] / o.clip.width, R[1] / o.clip.height);   // the clip covers the card (76 % for a 1080 x 1920 clip upright)
    clip.startTime = o.at - (o.clipStart || 0); clip.scale.setValue([cs, cs]); clip.position.setValue([cw / 2, ch / 2]);
    clip.setTrackMatte(inner, TrackMatteType.ALPHA); rim.setTrackMatte(outer, TrackMatteType.ALPHA);
    var bl = effect(clip, "ADBE Gaussian Blur 2"); bl.property("Repeat Edge Pixels").setValue(1);
    var t3 = [o.at - sec(2), o.at + sec(SIG.cardHold), o.at + sec(SIG.cardClear)];
    AESLib.ease(bl.property("Blurriness"), t3, [SIG.cardBlur * (up ? 1 : mn / SIG.cardRect[0]), SIG.cardBlur * (up ? 1 : mn / SIG.cardRect[0]), 0], "travel");
    AESLib.ease(effect(clip, "ADBE Exposure2").property("Exposure"), t3, [SIG.cardExposure, SIG.cardExposure, 0], "travel");
    var L = comp.layers.add(C); L.name = nm; if (L.hasAudio) L.audioEnabled = false; L.position.setValue(o.pos);
    var S = o.width ? 100 * o.width / (up ? R[0] * SIG.rimScale / 100 : outerR[0]) : o.scale;
    sigKeys(L.scale, o.at, SIG.card, S, dims(L.scale));
    return L; }
  // card size and positions for n cards. o = { n, side ("left"|"right"), comp size, face {x0,y0,x1,y1} }
  // returns { scale (%), w, h, pos: [[x, y]...], warnings: [] }
  function stackLayout(o) { var W = o.width, H = o.height, R = SIG.cardRect, n = o.n, warn = [];
    var w3 = SIG.card3WidthShare * W, h3 = w3 * R[1] / R[0], span = h3 * (1 + (1 - SIG.cardOverlap) * 2);
    var h = n > 0 ? span / (1 + (1 - SIG.cardOverlap) * (n - 1)) : 0, w = h * R[0] / R[1];
    var dir = o.side === "right" ? -1 : 1, x0 = o.side === "right" ? W - SIG.cardMargin * W - w / 2 : SIG.cardMargin * W + w / 2;
    var step = SIG.cardStep * W, pos = [], i;
    function place(sgn) { var p = []; for (var i = 0; i < n; i++) p.push([x0 + dir * sgn * i * step, SIG.cardTop * H + h / 2 + i * h * (1 - SIG.cardOverlap)]); return p; }
    function hitsFace(p) { if (!o.face) return false; var pk = SIG.card[1][1];
      for (var i = 0; i < p.length; i++) { var hw = w * pk / 2, hh = h * pk / 2;
        if (p[i][0] + hw > o.face.x0 && p[i][0] - hw < o.face.x1 && p[i][1] + hh > o.face.y0 && p[i][1] - hh < o.face.y1) return true; } return false; }
    function inFrame(p) { for (var i = 0; i < p.length; i++) if (p[i][0] - w / 2 < 0 || p[i][0] + w / 2 > W) return false; return true; }
    // toward the speaker (the reference); if that reaches the face, away from it; if that leaves the frame, a straight column
    pos = place(1);
    if (hitsFace(pos)) { pos = place(-1); if (!inFrame(pos)) pos = place(0);
      if (hitsFace(pos)) warn.push("cards reach the face at their peak scale; use fewer cards, the other side, or a smaller speaker"); }
    // the card layer's scale: the visible card (rim included) is w wide; the rim is SIG.rimScale % of the inner rect
    return { w: w, h: h, pos: pos, warnings: warn, cardScale: 100 * (w / (SIG.rimScale / 100)) / R[0] }; }
  // o = { clips: [{ item, start }], at (W), side, face }
  function cardStack(comp, o) { var P = pfx(o), lay = stackLayout({ n: o.clips.length, side: o.side || "left", width: comp.width, height: comp.height, face: o.face }), layers = [], F = [];
    for (var i = 0; i < o.clips.length; i++) { var Fi = o.at + sec(SIG.cardFirst + i * SIG.cardStagger); F.push(Fi);
      layers.push(card(comp, { clip: o.clips[i].item, clipStart: o.clips[i].start, at: Fi, pos: lay.pos[i], scale: lay.cardScale, name: P + "Card " + (i + 1) })); }
    return { layers: layers, first: F, layout: lay, path: linePath(comp, lay, o.side || "left", o.word) }; }
  // the drawn line's path from a stack layout: under the word, through the cards, curling toward the speaker
  function linePath(comp, lay, side, word) { var W = comp.width, H = comp.height, p = lay.pos, n = p.length, s = side === "right" ? -1 : 1, mid = p[Math.min(1, n - 1)], last = p[n - 1];
    var top = word ? word.box.y1 : H * SIG.type.wordBaseline, x1 = p[0][0] + s * .039 * W;
    return { vertices: [[x1, top], [x1, mid[1] + .025 * H], [last[0] - s * .007 * W, last[1] + .02 * H], [last[0] + s * .129 * W, last[1] + lay.h / 2 + .038 * H]],
      inTangents: [[0, 0], [0, -.083 * H], [-s * .023 * W, -.047 * H], [-s * .056 * W, -.021 * H]], outTangents: [[0, .083 * H], [0, .047 * H], [s * .037 * W, .047 * H], [0, 0]] }; }
  // o = { at (W), path, colour, cards (n, for the draw time) }
  function drawnLine(comp, o) { var L = comp.layers.addShape(); L.name = pfx(o) + "Line"; var g = L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    var gs = L.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group"), sh = new Shape(), P = o.path, v = [], i;
    for (i = 0; i < P.vertices.length; i++) v.push([P.vertices[i][0] - comp.width / 2, P.vertices[i][1] - comp.height / 2]);
    sh.vertices = v; sh.inTangents = P.inTangents; sh.outTangents = P.outTangents; sh.closed = false;
    gs.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(sh);
    var st = L.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Stroke");
    st.property("ADBE Vector Stroke Color").setValue(o.colour || [1, 0, 0]); st.property("ADBE Vector Stroke Width").setValue(SIG.line.width * k(comp));
    L.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").addProperty("ADBE Vector Filter - Trim");
    var tr = L.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property("ADBE Vector Filter - Trim");
    var extra = Math.max(0, ((o.cards || 3) - 3) * SIG.cardStagger), D = SIG.line;
    linearKeys(tr.property("ADBE Vector Trim End"), [o.at + sec(D.draw[0]), o.at + sec(D.draw[1] + extra)], [0, 100]);
    linearKeys(tr.property("ADBE Vector Trim Start"), [o.at + sec(D.wipe[0] + extra), o.at + sec(D.wipe[1] + extra)], [0, 100]);
    L.position.setValue([comp.width / 2, comp.height / 2]);
    return L; }

  // ---- a landed card moves (extended): position and scale on the push's curve, no overshoot. o = { layer or name, at (s),
  //      pos [x, y] (comp px), scale (%), dur (s; default the push's 42 frames) }. Returns when it arrives.
  function moveCard(comp, o) { var L = o.layer || comp.layer(o.name), fr = o.dur ? o.dur * REF.fps : SIG.push[1][0];
    if (o.pos) pushEase(L.position, o.at, L.position.valueAtTime(o.at, false), toParent(L, o.pos, o.at), fr);
    if (o.scale !== undefined) { var sv = L.scale.valueAtTime(o.at, false), tv = []; for (var i = 0; i < sv.length; i++) tv.push(i < 2 ? o.scale : sv[i]);
      pushEase(L.scale, o.at, sv, tv, fr); }
    return o.at + sec(fr); }

  // ---- push. o = { at (s: P), pivotY (the face's height in the settled frame), layers, sway [{ f, r }] (the speaker's own head
  //      size over the push, frames from P, as a ratio to P + 40; divided out when it moves by more than 3 %), camera (an existing
  //      null from an earlier beat: the keys are added to it, held at full frame until P), prefix }
  function push(comp, o) { var N = o.camera, fresh = !N;
    if (fresh) { N = comp.layers.addNull(comp.duration); N.name = pfx(o) + "Camera"; N.position.setValue([comp.width / 2, comp.height / 2]); }
    for (var i = 0; i < o.layers.length; i++) if (o.layers[i] && o.layers[i] !== N && o.layers[i].parent !== N) o.layers[i].parent = N;
    if (!fresh && N.scale.numKeys) holdKeys(N.scale, [o.at - sec(1)], [N.scale.valueAtTime(o.at - sec(1), false)]);
    sigKeys(N.scale, o.at, SIG.push, 100, dims(N.scale));
    var py = o.pivotY === undefined ? comp.height * .444 : o.pivotY, divided = false;
    var expr = "var s = transform.scale[1] / 100;\n[" + (comp.width / 2) + ", " + py + " + (" + (comp.height / 2) + " - " + py + ") * s];";
    if (o.sway && o.sway.length) { var dev = 0; for (i = 0; i < o.sway.length; i++) dev = Math.max(dev, Math.abs(o.sway[i].r - 1));
      if (dev > .03) { divided = true; var sl = effect(N, "ADBE Slider Control", "Speaker sway " + Math.round(o.at * 30)), t = [], v = [], last = 0;
        for (i = 0; i < o.sway.length; i++) { t.push(o.at + sec(o.sway[i].f)); v.push(100 / o.sway[i].r); last = o.sway[i].f; }
        t.push(o.at + sec(last + 10)); v.push(100); linearKeys(sl.property(1), t, v);
        var terms = [], fxs = N.property("ADBE Effect Parade");
        for (i = 1; i <= fxs.numProperties; i++) if (fxs.property(i).name.indexOf("Speaker sway") === 0) terms.push('effect("' + fxs.property(i).name + '")(1) / 100');
        N.scale.expression = "var k = " + terms.join(" * ") + ";\n[value[0] * k, value[1] * k];"; } }
    if (fresh || !N.position.expression) N.position.expression = expr;
    return { layer: N, divided: divided }; }

  // ---- a whole beat. brief = { type ("opener"|"punch"), take, takeStart, speakerScale, speakerX, face {x0,y0,x1,y1}, pivotY, sway,
  //      words: [{ text, t (s, spoken start) }], stressed (index in words), split: [leadEnd, tailStart] (default around the
  //      stressed word), clips: [{ item, start }], side, accent [r,g,b], ground [r,g,b], grade, push (bool), glow, seed, pushAt }
  function beat(comp, brief) { fontOK(); var rep = { warnings: [] }, b = brief, words = b.words, si = b.stressed, i;
    var W = words[si].t, lead = [], tl = [], lEnd = b.split ? b.split[0] : si, tStart = b.split ? b.split[1] : si + 1;
    for (i = 0; i < lEnd; i++) lead.push(words[i].text); for (i = tStart; i < words.length; i++) tl.push(words[i].text);
    var type = b.type || "opener", P = pfx(b);
    // an earlier beat's speaker (and ground) can be passed in; otherwise the stage is built here
    var st = b.speaker ? { speaker: b.speaker, ground: b.groundLayer || null } : stage(comp, { take: b.take, takeStart: b.takeStart, scale: b.speakerScale, x: b.speakerX, ground: b.ground, grade: b.grade, footageGround: b.footageGround, topShade: b.topShade, prefix: P });
    var scene = [st.speaker], stack = null, line = null, L = null, T = null;
    if (st.shade) scene.push(st.shade); if (b.shadeLayer) scene.push(b.shadeLayer);
    if (b.footageGround || b.insetGround) scene.push(b.insetGround || null);
    if (type === "opener" && b.clips && b.clips.length) { stack = cardStack(comp, { clips: b.clips, at: W, side: b.side || "left", face: b.face, prefix: P, word: { box: { y1: comp.height * SIG.type.wordBaseline } } });
      for (i = 0; i < stack.layers.length; i++) scene.push(stack.layers[i]); rep.cards = stack.first; rep.warnings = rep.warnings.concat(stack.layout.warnings); }
    if (stack) { line = drawnLine(comp, { at: W, path: stack.path, colour: b.accent, cards: b.clips.length, prefix: P }); scene.push(line); }
    if (type === "opener" && lead.length) { var ll = wrap(lead.join(" "), b.maxChars), lat = ll.length > 1 ? [words[0].t, words[ll[0].split(" ").length].t] : words[0].t;
      L = leadIn(comp, { text: lead.join(" "), at: lat, prefix: P, maxChars: b.maxChars }); scene.push(L); rep.leadAt = words[0].t; }
    var hw = heroWord(comp, { text: words[si].text, at: W, colour: b.accent, glow: b.glow, exposure: b.exposure, darkGround: b.darkGround, baseline: b.wordBaseline, prefix: P });
    var px = pixelBlocks(comp, { word: hw, at: W, colour: b.accent, seed: b.seed, prefix: P, blockScale: b.blockScale, count: b.blockCount, dist: b.blockDist, lineBand: L ? [comp.height * SIG.type.leadBaseline - 50 * k(comp), comp.height * SIG.type.leadBaseline + 8 * k(comp)] : null });
    px.layer.moveAfter(hw.glowLayer || hw.layer); scene.push(px.layer, hw.layer); if (hw.glowLayer) scene.push(hw.glowLayer);   // blocks under the word and its glow
    if (type === "opener" && tl.length) { var tw = wrap(tl.join(" "), b.maxChars), tat = tw.length > 1 ? [words[tStart].t, words[tStart + tw[0].split(" ").length].t] : words[tStart].t;
      T = tail(comp, { text: tl.join(" "), at: tat, under: hw.layer, baseline: b.tailBaseline, prefix: P, maxChars: b.maxChars }); scene.push(T); rep.tailAt = words[tStart].t; }
    var pu = null; if (b.push !== false && type === "opener") { pu = push(comp, { at: b.pushAt !== undefined ? b.pushAt : (L ? words[0].t - sec(SIG.pushLead) : W - sec(48)), pivotY: b.pivotY, layers: scene, sway: b.sway, camera: b.camera, prefix: P }); rep.pushAt = b.camera ? (b.pushAt !== undefined ? b.pushAt : (L ? words[0].t - sec(SIG.pushLead) : W - sec(48))) : pu.layer.scale.keyTime(1); rep.swayDivided = pu.divided; rep.camera = pu.layer; }
    else if (b.camera) { for (i = 0; i < scene.length; i++) if (scene[i] && scene[i].parent !== b.camera) scene[i].parent = b.camera; }
    motionBlur(comp, scene.concat([st.ground]));
    rep.speaker = st.speaker; rep.ground = st.ground; rep.shade = st.shade || b.shadeLayer || null; rep.prefix = P;
    rep.W = W; rep.glow = hw.glow; rep.wordBox = hw.box; rep.wordSize = hw.size; rep.blocks = px.blocks.length;
    if (stack) { rep.cardScale = stack.layout.cardScale; rep.cardPos = stack.layout.pos; rep.linePath = stack.path.vertices; }
    return rep; }

  // ---- one call that clears a beat (extended). o = { prefix (the beat's), at (s: when it starts to leave) }. Text leaves by
  //      word from the last word, the giant word scales away, cards go from the last one at a 2-frame stagger, each the way it
  //      came at about twice the speed with no overshoot; all within SIG.exit.within frames. Returns { end (s), layers }.
  function exitBeat(comp, o) { var P = pfx(o), X = SIG.exit, end = o.at, names = [], i, L, cards = [];
    for (i = 1; i <= comp.numLayers; i++) { L = comp.layer(i); if (L.name.indexOf(P) !== 0) continue; var rest = L.name.substring(P.length);
      if (rest === "Lead-in" || rest === "Tail") { end = Math.max(end, exitText(L, o.at)); names.push(L.name); }
      else if (rest === "Word" || rest === "Word glow") { var v = L.scale.valueAtTime(o.at, false)[0];
        sigKeys(L.scale, o.at, [[0, v / 100, .33, X.easeOut, 0, 0], [X.wordFrames, 0, X.easeIn, .33, 0, 0]], 100, dims(L.scale));
        L.outPoint = o.at + sec(X.wordFrames); end = Math.max(end, L.outPoint); names.push(L.name); }
      else if (/^Card \d+$/.test(rest)) cards.push(L);
      else if (rest === "Pixels" || rest === "Line") { if (L.outPoint > o.at + sec(X.within)) L.outPoint = o.at + sec(X.within); names.push(L.name); } }
    cards.sort(function (a, b) { return Number(b.name.substring(P.length + 5)) - Number(a.name.substring(P.length + 5)); });
    var stg = cards.length > 1 ? Math.min(X.cardStagger, (X.within - X.cardFrames) / (cards.length - 1)) : 0;
    for (i = 0; i < cards.length; i++) { var c = cards[i], t0 = o.at + sec(i * stg), sv = c.scale.valueAtTime(t0, false)[0];
      sigKeys(c.scale, t0, [[0, sv / 100, .33, X.easeOut, 0, 0], [X.cardFrames, 0, X.easeIn, .33, 0, 0]], 100, dims(c.scale));
      c.outPoint = t0 + sec(X.cardFrames); end = Math.max(end, c.outPoint); names.push(c.name); }
    return { end: end, layers: names }; }

  return { SIG: SIG, fontOK: fontOK, hasEffect: hasEffect, stage: stage, zoomOut: zoomOut, exitInset: exitInset, push: push, leadIn: leadIn, heroWord: heroWord,
    blockSchedule: blockSchedule, pixelBlocks: pixelBlocks, card: card, stackLayout: stackLayout, cardStack: cardStack, linePath: linePath, drawnLine: drawnLine,
    tail: tail, motionBlur: motionBlur, beat: beat, moveCard: moveCard, textLine: textLine, exitBeat: exitBeat, exitText: exitText, reveal: reveal, wrap: wrap };
})();
