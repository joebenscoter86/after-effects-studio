// Pixel headline style: ES3 builders, one per element, and one for a whole beat. No project mutation happens at load.
// Read styles/pixel-headline/STYLE.md first (D1 to D8 for a director). The speaker cut out on a clean ground (light, or dark:
// setPiece({ tone: "dark" })); a small lead-in line, one giant word in the
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
    // Exposure 0.64 on a light ground (calibrated); 0.14 on a dark one with a radius of 250 (the first full piece, on navy: at
    // 0.64 the Screen haze washes the word's own letters toward white and floods the top third)
    deepGlow: { keys: [[-2, 0], [0, .64], [24.26, 0]], eases: [[33, 33], [30.7, 83.3], [5, 33]], darkGround: .14 },
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
    exit: { textFrames: 6, wordDelay: 1, wordFrames: 7, cardFrames: 6, cardStagger: 2, easeOut: .75, easeIn: .1, within: 10 },
    // a dark ground (proven on the first full piece, a navy ground): the glow's peak and radius, the blocks' density and the
    // distance they keep from the word, the cards' over-bright entrance (video, and white interface pieces) and the rim
    dark: { glowExposure: .14, glowRadius: 250, blockScale: .25, blockMinDist: 1.2, entranceExposure: .5, uiEntranceExposure: .3, rimExposure: 1 },
    // what a vertical reel must keep clear (px at 1080 x 1920; scaled to the comp): the app's header, its caption and
    // buttons, the sides. A hold of at least `hold` frames before anything leaves; a line of at most `lineWords` words
    margins: { top: 220, leadTop: 190, bottom: 420, side: 60 }, hold: 10, lineWords: 5, lateStart: 8,
    // a tail of more than `words` words slides `slideEm` of its font size (its words otherwise ride over each other mid-slide)
    tailLong: { words: 3, slideEm: .34 },
    // a word tucked behind the speaker: its baseline `depth` px below the top of the hair, `widthShare` of the frame wide
    tuck: { depth: 55, widthShare: .92 },
    // the zoom that only makes room: an ease in and out over `frames`
    zoomInOut: { frames: 26 }
  };
  // one set of choices for the whole piece (setPiece): tone ("light"|"dark"), accent, tailSize, tailSlide (px: one slide for
  //      every tail, which a fast speaker's short holds may need). Builders read it when a call
  // does not say otherwise, so forty seconds stay in one accent, one tail size and one ground's settings.
  var PIECE = { tone: "light", accent: null, tailSize: null, tailSlide: null };
  function setPiece(o) { for (var q in o) if (o.hasOwnProperty(q)) PIECE[q] = o[q]; return PIECE; }
  function isDark(o) { if (o && o.darkGround !== undefined) return !!o.darkGround; if (o && o.tone) return o.tone === "dark"; return PIECE.tone === "dark"; }
  function accentOf(o, fb) { return (o && (o.colour || o.accent)) || PIECE.accent || fb; }
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
  // ---- the clean ground: the style's ground behind a cut-out speaker. It fills the frame and does not move with the push.
  //      o = { tone ("light"|"dark"), colour [r,g,b], top, bottom (dark: the ramp's ends), lift { colour, centre [x, y], radius }
  //      (dark: a soft round light behind the speaker, added), noise (%), prefix }. Light (the reference): a radial ramp from
  //      colour + .04 at 46.9 % of the height to colour - .06 past the bottom. Dark: a ramp from top to bottom (default colour
  //      x .8 and x .42) and the lift (default colour x 1, centred at 60 % of the height, radius 47 % of it), both as on the
  //      first piece. Noise 1.3 % either way, so it does not band.
  function ground(comp, o) { o = o || {}; var W = comp.width, H = comp.height, P = pfx(o), dk = isDark(o);
    var g = o.colour || o.ground || (dk ? [.078, .129, .239] : [.8, .8, .81]);
    function mul(c, m) { return [c[0] * m, c[1] * m, c[2] * m]; }
    var G = comp.layers.addSolid(g, P + "Ground", W, H, 1, comp.duration), r = effect(G, "ADBE Ramp"), Lf = null;
    if (!dk) { r.property("Start of Ramp").setValue([W / 2, H * .469]); r.property("Start Color").setValue([g[0] + .04, g[1] + .04, g[2] + .04]);
      r.property("End of Ramp").setValue([W / 2, H * 1.198]); r.property("End Color").setValue([g[0] - .06, g[1] - .06, g[2] - .06]); r.property("Ramp Shape").setValue(2); }
    else { r.property("Start of Ramp").setValue([W / 2, 0]); r.property("Start Color").setValue(o.top || mul(g, .8));
      r.property("End of Ramp").setValue([W / 2, H]); r.property("End Color").setValue(o.bottom || mul(g, .42)); r.property("Ramp Shape").setValue(1); }
    effect(G, "ADBE Noise2").property("Amount of Noise").setValue(o.noise === undefined ? 1.3 : o.noise);
    if (dk && o.lift !== false) { var lf = o.lift || {}, c = lf.centre || [W / 2, H * .6], rad = lf.radius || H * .47;
      Lf = comp.layers.addSolid([0, 0, 0], P + "Ground lift", W, H, 1, comp.duration); var r2 = effect(Lf, "ADBE Ramp");
      r2.property("Start of Ramp").setValue(c); r2.property("Start Color").setValue(lf.colour || g); r2.property("End of Ramp").setValue([c[0], c[1] + rad]);
      r2.property("End Color").setValue([0, 0, 0]); r2.property("Ramp Shape").setValue(2); Lf.blendingMode = BlendingMode.ADD; Lf.moveBefore(G); }
    return { layer: G, lift: Lf, tone: dk ? "dark" : "light", colour: g }; }
  // the project's colour settings, which carry over from the last project opened: a working space other than None changes
  // how the take renders (an ACEScg space rendered one take at a gamma of about 1.8)
  function projectSpace() { var ws = "", bpc = 8; try { ws = app.project.workingSpace; } catch (e) {} try { bpc = app.project.bitsPerChannel; } catch (e2) {}
    var warn = []; if (ws && ws !== "None") warn.push("the project's working colour space is " + ws + ", carried over from an earlier project; set it to None before building, or the take renders with the wrong gamma");
    return { workingSpace: ws === undefined ? null : ws, bitsPerChannel: bpc, warnings: warn }; }
  function stage(comp, o) {
    var W = comp.width, H = comp.height, P = pfx(o), G = null, S = null, Gr = null, sp = projectSpace(), warn = sp.warnings.slice(0);
    if (o.footageGround) warn.push("the footage as the ground is a fallback: the style is the speaker cut out on a clean ground (speaker() with a rendered cut-out)");
    if (!o.footageGround) { Gr = ground(comp, { tone: o.tone, darkGround: o.darkGround, colour: o.ground, top: o.groundTop, bottom: o.groundBottom, lift: o.lift, prefix: P }); G = Gr.layer; }
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
    return { ground: G, lift: Gr ? Gr.lift : null, speaker: S, shade: Sh, footageGround: !!o.footageGround, workingSpace: sp.workingSpace, bitsPerChannel: sp.bitsPerChannel, warnings: warn }; }

  // ---- the zoom-out inset: the footage scaled down inside the frame, its edges feathered by a mask, over a ground solid of
  //      the footage's own colour, so the speaker sits small and leaves room above. o = { speaker (layer), scale (%),
  //      position [x, y] (the inset's centre), feather (px on screen), ground [r,g,b] or "sample" (read from the footage's top
  //      edge by expression), trimTop (share of the footage's height left off its top), at (s: when given, it moves there on
  //      the push's curve over 42 frames), prefix }
  //      sampleAt [x, y] (shares of the footage: where "sample" reads; default the centre line just below the trimmed band),
  //      ease ("push" | "inOut": an ease in and out, for a zoom that only makes room; the push's curve smears a face on its
  //      first frame), dur (frames), cutout (false when the speaker is a cut-out on a clean ground: no mask, no inset ground) }
  //      The target is converted into the parent's space with the parent at rest (its last key), never mid-push.
  function zoomOut(comp, o) { var S = o.speaker, P = pfx(o), src = S.source, sc = o.scale, fe = o.feather === undefined ? 60 : o.feather, G = null, cut = o.cutout === true;
    if (!cut) { G = comp.layers.addSolid(o.ground && o.ground.length ? o.ground : [0, 0, 0], P + "Inset ground", comp.width, comp.height, 1, comp.duration); G.moveAfter(S); }
    if (!cut && o.ground === "sample") { var f = effect(G, "ADBE Fill"), sa = o.sampleAt || [.5, (o.trimTop || 0) + .03];
      f.property("Color").expression = 'var L = thisComp.layer("' + S.name + '");\nvar c = L.sampleImage([L.width * ' + sa[0] + ', L.height * ' + sa[1] + '], [L.width * .45, L.height * .02], true, time);\n[c[0], c[1], c[2], 1];'; }
    if (!cut) { var mk = S.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"); mk.name = "Inset edge";
      // trimTop: a share of the footage's height left off its top (e.g. a ceiling the top shade hid at full frame)
      var y0 = (o.trimTop || 0) * src.height, shp = new Shape(); shp.vertices = [[0, y0], [src.width, y0], [src.width, src.height], [0, src.height]]; shp.closed = true;
      S.property("ADBE Mask Parade").property("Inset edge").property("ADBE Mask Shape").setValue(shp);
      var lf = fe * 100 / sc; S.property("ADBE Mask Parade").property("Inset edge").property("ADBE Mask Feather").setValue([lf, lf]);
      S.property("ADBE Mask Parade").property("Inset edge").property("ADBE Mask Offset").setValue(-lf / 2);
      if (S.anchorPoint.value[1] !== src.height / 2) S.anchorPoint.setValue([src.width / 2, src.height / 2]); }
    var tr = o.at !== undefined ? Math.max(o.at, restTime(S)) : restTime(S), tgt = toParent(S, o.position, tr);
    if (o.at !== undefined) { var from = S.scale.valueAtTime(o.at, false), fp = S.position.valueAtTime(o.at, false), tv = [];
      for (var i = 0; i < from.length; i++) tv.push(i < 2 ? sc : from[i]);
      move(S.scale, o.at, from, tv, o.ease, o.dur); move(S.position, o.at, fp, tgt, o.ease, o.dur); }
    else { S.scale.setValue([sc, sc]); S.position.setValue(tgt); }
    return { ground: G, speaker: S, target: tgt }; }
  // when a layer's parent (the push camera) has settled: its last scale or position key (0 if it has none)
  function restTime(L) { var P = L.parent, t = 0; if (!P) return 0;
    if (P.scale.numKeys) t = Math.max(t, P.scale.keyTime(P.scale.numKeys)); if (P.position.numKeys) t = Math.max(t, P.position.keyTime(P.position.numKeys)); return t; }
  // a move on the push's curve (default) or an ease in and out ("inOut", over SIG.zoomInOut.frames unless dur is given)
  function move(prop, at, a, b, ease, dur) { if (ease === "inOut") { var fr = dur || SIG.zoomInOut.frames; return AESLib.ease(prop, [at, at + sec(fr)], [a, b], "travel"); }
    return pushEase(prop, at, a, b, dur); }
  // a comp-space point in a layer's parent space at time t (parent unrotated), so a parented layer can be sent to a place on screen
  function toParent(L, p, t) { var P = L.parent; if (!P) return p;
    var pp = P.position.valueAtTime(t, false), pa = P.anchorPoint.valueAtTime(t, false), ps = P.scale.valueAtTime(t, false);
    return [pa[0] + (p[0] - pp[0]) * 100 / ps[0], pa[1] + (p[1] - pp[1]) * 100 / ps[1]]; }
  // back to the full frame on the same ease. o = { speaker, at, cover (%), position (where it rests; default the frame's
  //      centre), ease, dur }
  function exitInset(comp, o) { var S = o.speaker, src = S.source, cv = o.cover || 100 * Math.max(comp.width / src.width, comp.height / src.height);
    var from = S.scale.valueAtTime(o.at, false), fp = S.position.valueAtTime(o.at, false), tv = [];
    for (var i = 0; i < from.length; i++) tv.push(i < 2 ? cv : from[i]);
    move(S.scale, o.at, from, tv, o.ease, o.dur); move(S.position, o.at, fp, toParent(S, o.position || [comp.width / 2, comp.height / 2], Math.max(o.at, restTime(S))), o.ease, o.dur);
    return o.at + sec(o.dur || (o.ease === "inOut" ? SIG.zoomInOut.frames : SIG.push[1][0])); }
  // a move from a to b (numbers or arrays) on the push's curve: fast out of the first frame, a long ease in, over 42 frames
  // (or `frames`: the same curve compressed or stretched in time)
  function pushEase(prop, at, a, b, frames) { var K = SIG.push, fr = frames || K[1][0], t1 = at + sec(fr), d = [], i, n = isArr(a) ? a.length : 1;
    if (isArr(a)) { var bb = []; for (i = 0; i < n; i++) bb.push(i < b.length ? b[i] : a[i]); b = bb; }   // match the layer's dimensions
    prop.setValuesAtTimes([at, t1], [a, b]);
    var spd = K[0][5] / (K[0][1] - K[1][1]) * REF.fps * K[1][0] / fr;   // the push's out speed as a share of its travel, per second
    var span = 0; for (i = 0; i < n; i++) span = Math.max(span, Math.abs((n > 1 ? b[i] - a[i] : b - a)));
    var dm = dims(prop), B = KeyframeInterpolationType.BEZIER, ea = [], eb = [], ec = [], ed = [];
    var spatial = prop.propertyValueType === PropertyValueType.TwoD_SPATIAL || prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL;
    // a spatial property's speed is along its path (never negative); any other dimension's speed carries the sign of its own
    // travel, so a value that falls (a card shrinking, a speaker scaling down) leaves its first key falling
    for (i = 0; i < dm; i++) { var tv = spatial ? span : (dm > 1 ? b[i] - a[i] : (n > 1 ? b[0] - a[0] : b - a));
      ea.push(new KeyframeEase(0, 33)); eb.push(new KeyframeEase(-spd * tv, K[0][3] * 100)); ec.push(new KeyframeEase(0, K[1][2] * 100)); ed.push(new KeyframeEase(0, 33)); }
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
    var nW = lines.join(" ").split(" ").length;
    return { layer: L, lines: lines, size: size, at: at, line2: line2, words: nW }; }
  // how long a line takes: the time (s) after its start at which its last word has landed. kind "lead" | "tail".
  //      A lead-in of n words lands (n - 1) x 4.75 + 26 frames after it starts, a tail (n - 1) x 6.4 + 26.
  function lineTime(n, kind) { var tl = kind === "tail", K = tl ? SIG.tailStrength : SIG.leadStrength;
    return sec((Math.max(1, n) - 1) * (tl ? SIG.tailDelay : SIG.leadDelay) + K[K.length - 1][0]); }
  // ---- "settled": under 2 px left to travel (the measure a hold is counted from). A signature curve is evaluated offline the
  //      way After Effects draws a bezier key pair: control points one influence along the time span at the key's speed.
  function curveAt(K, f) { if (f <= K[0][0]) return K[0][1]; var n = K.length; if (f >= K[n - 1][0]) return K[n - 1][1];
    for (var i = 0; i + 1 < n; i++) if (f <= K[i + 1][0]) break;
    var a = K[i], b = K[i + 1], dt = b[0] - a[0], x1 = a[0] + a[3] * dt, y1 = a[1] + a[5] * a[3] * dt, x2 = b[0] - b[2] * dt, y2 = b[1] - b[4] * b[2] * dt;
    function bz(u, p0, p1, p2, p3) { var v = 1 - u; return v * v * v * p0 + 3 * v * v * u * p1 + 3 * v * u * u * p2 + u * u * u * p3; }
    var lo = 0, hi = 1; for (var it = 0; it < 40; it++) { var m = (lo + hi) / 2; if (bz(m, a[0], x1, x2, b[0]) < f) lo = m; else hi = m; }
    return bz((lo + hi) / 2, a[1], y1, y2, b[1]); }
  // frames from the curve's start until what is left to travel stays under 2 px; px = pixels per unit of the curve's value
  function settleFrames(K, px) { var end = K[K.length - 1][1], f0 = K[0][0], f1 = K[K.length - 1][0], last = f0;
    for (var f = f0; f <= f1; f += .05) if (Math.abs(curveAt(K, f) - end) * px >= 2) last = f;
    return Math.min(f1, last + .05) - f0; }
  // a line of n words settles this long (s) after its start: kind "lead" | "tail"; slide (px; default the builder's own)
  function settleTime(n, kind, slide, size) { var tl = kind === "tail", K = tl ? SIG.tailStrength : SIG.leadStrength;
    var sl = slide || (tl ? tailSlide(n, size || SIG.type.tailSize, 1) : SIG.leadDrop);
    return sec((Math.max(1, n) - 1) * (tl ? SIG.tailDelay : SIG.leadDelay) + K[0][0] + settleFrames(K, sl / 100)); }
  // a popped element (the word or a card) settles this long (s) after its first key, for its half-width in px
  function popSettle(K, halfWidth) { return sec(K[0][0] + settleFrames(K, halfWidth)); }
  // the comp time at which a built line has landed (its line-2 start included)
  function lineSettle(t, kind) { return t.at + lineTime(t.words, kind) + (t.line2 ? Math.max(0, t.line2.extra) : 0); }
  // ---- lead-in line. o = { text, at (s, or one per line), colour, prefix, maxChars, lines }. Two lines when the text runs
  //      past maxChars (24): they stack upward from the lead-in's baseline, so the giant word's place does not move.
  function leadIn(comp, o) { var s = k(comp), T = SIG.type, t = textLine(comp, o, pfx(o) + "Lead-in", T.leadSize * s, SIG.leadDelay), L = t.layer;
    L.position.setValue([comp.width / 2, (o.baseline === undefined ? comp.height * T.leadBaseline : o.baseline) - t.size * T.leading * (t.lines.length - 1)]);
    reveal(L, t.at, SIG.leadStrength, SIG.leadDelay, [0, -SIG.leadDrop * s], 0, t.line2);
    return L; }
  // ---- tail line. o = { text, at (s, or one per line), colour, under (the giant word's layer, to clear its descenders),
  //      baseline (comp px; default 31.8 % of the height, below any descender), prefix, maxChars, lines }. Two lines stack
  //      downward from the tail's baseline.
  //      size (px; default the piece's tail size, setPiece({ tailSize }), else the calibrated 86 x the comp's scale), slide
  //      (px; default the piece's tailSlide, else the rule that follows). The slide
  //      is the measured 154 px (scaled with the size) for up to three words; a longer tail slides SIG.tailLong.slideEm of
  //      its size, or its words ride over each other mid-slide and read as one run-on word.
  function tail(comp, o) { var s = k(comp), T = SIG.type, y = comp.height * T.tailBaseline, at0 = isArr(o.at) ? o.at[0] : o.at;
    if (o.baseline !== undefined) y = o.baseline;
    else if (o.under) { var r = o.under.sourceRectAtTime(at0, false), sz = o.under.property("Source Text").value.fontSize, below = r.top + r.height;
      var wb = o.under.position.value[1] + o.under.anchorPoint.value[1] * -1 + 0;   // the word's baseline
      if (below > .05 * sz) y = Math.max(y, wb + below + .03 * comp.height); }
    var size0 = o.size || PIECE.tailSize || T.tailSize * s, t = textLine(comp, o, pfx(o) + "Tail", size0, SIG.tailDelay), L = t.layer;
    L.position.setValue([comp.width / 2, y]);
    reveal(L, t.at, SIG.tailStrength, SIG.tailDelay, [-(o.slide || PIECE.tailSlide || tailSlide(t.words, t.size, s)), 0], SIG.tailBlur * s * t.size / (T.tailSize * s), t.line2);
    return L; }
  function tailSlide(n, size, s) { var T = SIG.type; return n > SIG.tailLong.words ? SIG.tailLong.slideEm * size : SIG.tailSlide * s * size / (T.tailSize * s); }

  // ---- giant word and its glow. o = { text, at (s: W, the stressed word's spoken start), colour, glow ("auto"|"deep"|"stock"),
  //      exposure (Deep Glow's peak; default the light-ground signature, SIG.dark.glowExposure on a dark ground), radius
  //      (Deep Glow's; default its own, SIG.dark.glowRadius on a dark ground), tone / darkGround, baseline (comp px),
  //      widthShare (the word's width as a share of the frame; it may pass the 85 % cap), fontShare (a fixed font size as a
  //      share of the width), tuck { hairY (comp px: the top of the speaker's hair on the settled frame), depth } (the word
  //      sits behind the speaker's head: baseline hairY + depth, width SIG.tuck.widthShare unless given), behind (a layer: the
  //      word goes just under it, e.g. the speaker), prefix }
  //      Returns { layer, glow, box (settled, comp px), size, text, warnings }
  function heroWord(comp, o) { var s = k(comp), T = SIG.type, W = comp.width, base = comp.height * T.wordBaseline, size = T.wordSize * W, P = pfx(o), warn = [];
    var tk = o.tuck, ws = o.widthShare || (tk ? SIG.tuck.widthShare : 0);
    if (o.fontShare) size = o.fontShare * W;
    var L = AESLib.text(comp, P + "Word", o.text, { family: FAM, style: FACE, size: size, color: accentOf(o, [1, 0, 0]), just: "center", pos: [W / 2, base] });
    var r = L.sourceRectAtTime(o.at + 1, false), top0 = base + r.top, cap = ws || (o.fontShare ? .95 : T.wordMax);
    if (ws || r.width > cap * W) { size *= cap * W / r.width; var td = L.property("Source Text").value; td.fontSize = size; L.property("Source Text").setValue(td); r = L.sourceRectAtTime(o.at + 1, false);
      if (!ws) base = top0 - r.top; }   // a shrunk word keeps its tallest letters where they were: just under the lead-in's baseline
    if (tk) base = tk.hairY + (tk.depth === undefined ? SIG.tuck.depth : tk.depth);
    if (o.baseline !== undefined) base = o.baseline;
    if (String(o.text).indexOf(" ") >= 0 && size < .6 * T.wordSize * W) warn.push("the giant word \"" + o.text + "\" is a phrase and shrank to " + Math.round(100 * size / (T.wordSize * W)) + " % of the giant size; choose one stressed word");
    if (o.behind) L.moveAfter(o.behind);
    L.anchorPoint.setValue([0, -T.wordPivotUp * s]); L.position.setValue([W / 2, base - T.wordPivotUp * s]);
    sigKeys(L.scale, o.at, SIG.word, 100, dims(L.scale));
    L.inPoint = o.at;
    var mode = o.glow || "auto", used = mode === "auto" ? (hasEffect("PEDG2") ? "deep" : "stock") : mode;
    var dk = isDark(o);
    if (used === "deep") { var e = effect(L, "PEDG2"), x = e.property(25), D = SIG.deepGlow, pk = o.exposure || (dk ? SIG.dark.glowExposure : D.keys[1][1]), t = [], v = [];
      var rad = o.radius || (dk ? SIG.dark.glowRadius : 0); if (rad) e.property("Radius").setValue(rad);
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
    return { layer: L, glowLayer: C, glow: used, box: box, size: size, text: String(o.text), pivot: [W / 2, base - T.wordPivotUp * s], dark: dk, warnings: warn }; }

  // ---- pixel blocks. A pure schedule (no AE), then one shape layer of grid squares with Hold opacity keys.
  function rng(seed) { var s = (Math.abs(Math.floor(seed || 7)) % 2147483646) + 1; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  // o = { box {x0,x1,y0,y1}, width, height (comp), seed, cell (px), lineBand [y0, y1] (keep clear until lineFree) }
  // returns [{ x, y, w, h, on, off (frames from W), opacity, d }]
  function blockSchedule(o) {
    var B = SIG.blocks, R = rng(o.seed), c = o.cell || B.cell, bx = o.box, cx = (bx.x0 + bx.x1) / 2, cy = (bx.y0 + bx.y1) / 2, hw = (bx.x1 - bx.x0) / 2, hh = (bx.y1 - bx.y0) / 2;
    var cells = [], sides = ["above", "below", "left", "right"], i, j;
    var cb = o.clearBox;   // no block may touch this rectangle (the word's box at its peak scale, with a margin)
    for (i = 0; i * c < o.width; i++) for (j = 1; j * c < o.height; j++) {
      var x = i * c + c / 2, y = j * c + c / 2, nx = (x - cx) / hw, ny = (y - cy) / hh, d = Math.max(Math.abs(nx), Math.abs(ny));
      if (d > B.reach) continue;
      if (cb && i * c + c > cb.x0 && i * c < cb.x1 && j * c + c > cb.y0 && j * c < cb.y1) continue;
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
          for (var s in sidesW) { var g = sidesW[s] - taken[s] / tot; if (g > gap) { gap = g; side = s; } }
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
    var sidesW = o.sides || B.sides;
    var strongC = [], weakC = [], area = (o.width * o.height) / (REF.w * REF.h) * (o.scale === undefined ? 1 : o.scale), count = o.count || B.count, dist = o.dist || B.dist;
    if (o.minDist) { var dd2 = []; for (i = 0; i < dist.length; i++) dd2.push(Math.max(dist[i], o.minDist)); dist = dd2; }
    for (i = 0; i < count.length; i++) { strongC.push(Math.round(count[i] * area)); weakC.push(Math.round(count[i] * area * B.weakRatio)); }
    run(strongC, true); run(weakC, false);
    return out; }
  // o = { word (heroWord's result), at (W), colour, seed, lineBand, blockScale, clear (true: no block touches the word's box
  //      at its peak scale; default on a dark ground, where the glow and the ground let blocks show through the letters, and
  //      for a word of two or more words, whose gap would otherwise read as a hyphen) }
  //      A word wider than 75 % of the frame sends its blocks above and below only (its sides are off the frame).
  // The blocks for a word, as a pure function (no After Effects): o = { box, pivot, text, width, height, seed, cell, lineBand,
  //      count, dist, blockScale, dark, clear }. With clear, the schedule runs as calibrated (its distances floored at
  //      SIG.dark.blockMinDist half-sizes) and the blocks that touch the word's box at its peak scale are dropped afterwards:
  //      the first piece's order. Keeping them out while scheduling instead packs them against the box's edge, a dotted line.
  function blocksFor(o) { var bx = o.box, multi = o.text ? String(o.text).indexOf(" ") >= 0 : false, s = o.width / REF.w;
    var clear = o.clear !== undefined ? o.clear : (!!o.dark || multi), cb = null, sides = null, pk = SIG.word[1][1], m = 6 * s;
    if (clear) { var pv = o.pivot || [o.width / 2, (bx.y0 + bx.y1) / 2];
      cb = { x0: pv[0] + (bx.x0 - pv[0]) * pk - m, x1: pv[0] + (bx.x1 - pv[0]) * pk + m, y0: pv[1] + (bx.y0 - pv[1]) * pk - m, y1: pv[1] + (bx.y1 - pv[1]) * pk + m }; }
    if (bx.x1 - bx.x0 > .75 * o.width) sides = { above: .5, below: .5, left: 0, right: 0 };
    var bs = o.blockScale !== undefined ? o.blockScale : (o.dark ? SIG.dark.blockScale : undefined);
    var all = blockSchedule({ box: bx, width: o.width, height: o.height, seed: o.seed || 7, cell: o.cell || SIG.blocks.cell * s, lineBand: o.lineBand, count: o.count, dist: o.dist, scale: bs,
      sides: sides, minDist: clear ? SIG.dark.blockMinDist : 0 }), kept = [];
    for (var i = 0; i < all.length; i++) { var q = all[i]; if (!cb || !(q.x + q.w > cb.x0 && q.x < cb.x1 && q.y + q.h > cb.y0 && q.y < cb.y1)) kept.push(q); }
    return { blocks: kept, clearBox: cb, dropped: all.length - kept.length }; }
  function pixelBlocks(comp, o) { var wd = o.word;
    var bf = blocksFor({ box: wd.box, pivot: wd.pivot, text: wd.text, width: comp.width, height: comp.height, seed: o.seed, cell: SIG.blocks.cell * k(comp), lineBand: o.lineBand,
      count: o.count, dist: o.dist, blockScale: o.blockScale, dark: isDark(o) || !!wd.dark, clear: o.clear }), blocks = bf.blocks, cb = bf.clearBox;
    var L = comp.layers.addShape(); L.name = pfx(o) + "Pixels"; var root = L.property("ADBE Root Vectors Group");
    for (var b = 0; b < blocks.length; b++) { var q = blocks[b], g = root.addProperty("ADBE Vector Group"); g.name = "B" + (b + 1);
      var rr = root.property(b + 1).property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Rect");
      rr.property("ADBE Vector Rect Size").setValue([q.w, q.h]); rr.property("ADBE Vector Rect Position").setValue([q.x + q.w / 2 - comp.width / 2, q.y + q.h / 2 - comp.height / 2]);
      root.property(b + 1).property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(accentOf(o, [1, 0, 0]));
      holdKeys(root.property(b + 1).property("ADBE Vector Transform Group").property("ADBE Vector Group Opacity"), [0, o.at + sec(q.on), o.at + sec(q.off)], [0, q.opacity, 0]); }
    L.moveAfter(wd.glowLayer || wd.layer);   // under the word and its glow
    return { layer: L, blocks: blocks, clearBox: cb }; }

  // ---- one card. o = { clip (FootageItem), clipStart (s in the clip at the card's first frame), at (s: F), pos [x, y], scale (S, %),
  //      name, size [w, h] (the card's inner rectangle in its own comp; default the upright 790 x 1100), width (px on screen,
  //      rim included; sets S when given) }. The upright default keeps the calibrated 106 % rim; any other shape scales the rim
  //      and the corners by its shorter side: rim 3 % of it on each edge, corner radius 7.6 % of it, rim blur 3.2 % of it.
  //      radius (px: the inner corner radius, for a small interface card such as a bubble), entrance (the clip's over-bright
  //      Exposure while it is blurred; default 2 on a light ground, SIG.dark.entranceExposure on a dark one; ui: true uses
  //      SIG.dark.uiEntranceExposure there, for white interface pieces), rim (the rim's Exposure; default .15 light, 1 dark),
  //      freezeEnd (true: the clip holds its last frame if the card outlasts it), tone / darkGround, behind (a layer: the card
  //      goes just under it, e.g. the speaker) }
  function card(comp, o) { var R = o.size || SIG.cardRect, nm = o.name || (pfx(o) + "Card"), up = !o.size, mn = Math.min(R[0], R[1]), dk = isDark(o);
    var t = up ? 0 : SIG.cardRimShare * mn, outerR = up ? R : [R[0] + 2 * t, R[1] + 2 * t], round = o.radius !== undefined ? o.radius : (up ? SIG.cardRound : SIG.cardRoundShare * mn);
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
    effect(rim, "ADBE Exposure2").property("Exposure").setValue(o.rim !== undefined ? o.rim : (dk ? SIG.dark.rimExposure : SIG.rimExposure));
    var inner = rect("Inner", R, 100, round);
    var clip = C.layers.add(o.clip); clip.name = "Clip"; if (clip.hasAudio) clip.audioEnabled = false;
    var cs = 104 * Math.max(R[0] / o.clip.width, R[1] / o.clip.height);   // the clip covers the card (76 % for a 1080 x 1920 clip upright)
    clip.startTime = o.at - (o.clipStart || 0); clip.scale.setValue([cs, cs]); clip.position.setValue([cw / 2, ch / 2]);
    clip.setTrackMatte(inner, TrackMatteType.ALPHA); rim.setTrackMatte(outer, TrackMatteType.ALPHA);
    var bl = effect(clip, "ADBE Gaussian Blur 2"); bl.property("Repeat Edge Pixels").setValue(1);
    var t3 = [o.at - sec(2), o.at + sec(SIG.cardHold), o.at + sec(SIG.cardClear)];
    AESLib.ease(bl.property("Blurriness"), t3, [SIG.cardBlur * (up ? 1 : mn / SIG.cardRect[0]), SIG.cardBlur * (up ? 1 : mn / SIG.cardRect[0]), 0], "travel");
    var ent = o.entrance !== undefined ? o.entrance : (dk ? (o.ui ? SIG.dark.uiEntranceExposure : SIG.dark.entranceExposure) : SIG.cardExposure);
    AESLib.ease(effect(clip, "ADBE Exposure2").property("Exposure"), t3, [ent, ent, 0], "travel");
    if (o.freezeEnd) { clip.timeRemapEnabled = true; clip.outPoint = C.duration; }
    var L = comp.layers.add(C); L.name = nm; if (L.hasAudio) L.audioEnabled = false; L.position.setValue(o.pos);
    L.collapseTransformation = true;   // the Rim adjustment layer frosts the main comp behind the card only through a collapsed layer
    var S = o.width ? 100 * o.width / (up ? R[0] * SIG.rimScale / 100 : outerR[0]) : o.scale;
    sigKeys(L.scale, o.at, SIG.card, S, dims(L.scale));
    if (o.behind) L.moveAfter(o.behind);
    L.motionBlur = true;
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

  // ---- the speaker from a rendered cut-out: the style's speaker, lifted off the room onto the clean ground. o = { cutout
  //      (FootageItem with alpha: the cut-out operation's render, which needs the user's click: get it before they leave),
  //      take (optional FootageItem: the delivery-size take the cut-out was rendered from, frame for frame; its pixels are used
  //      under the cut-out's alpha), takeStart (s), scale (%; default fills the frame's height), x, grade { mixer, inBlack,
  //      inWhite, gamma, saturation } (on the speaker layer), look (the skin look: see look()), remnants (pieces of the room
  //      left inside the matte, each taken out by brightness and colour together: [{ box [x0, y0, x1, y1] (px in the cut-out),
  //      skinA (Lab a*: anything redder is skin and kept; default 15), lighterThan (0-255: only what is lighter goes; default
  //      35), feather (px, 3), frames [[f0, f1], ...] (comp frames when it is on; default always) }]), prefix }
  //      Inside "<prefix>Speaker comp", bottom to top: the base, the look's layers, the cut-out as Stencil Alpha (everything
  //      below keeps only the speaker), each remnant as Silhouette Alpha. Returns { layer, comp, controls, remnants }.
  function speaker(comp, o) { if (!o.cutout) throw new Error("speaker() needs a rendered cut-out (the cut-out operation's movie with alpha); its click cannot be made unattended, so get it before the user leaves");
    var P = pfx(o), cu = o.cutout, src = o.take || cu, W = comp.width, H = comp.height, i;
    var C = app.project.items.addComp(P + "Speaker comp", cu.width, cu.height, 1, comp.duration, comp.frameRate);
    function add(item, nm) { var L = C.layers.add(item); L.name = nm; if (L.hasAudio) L.audioEnabled = false; if (o.takeStart) L.startTime = -o.takeStart; return L; }
    var base = add(src, "Base"), lk = o.look ? look(comp, C, base, src, o.look, P, add) : null;
    var st = add(cu, "Cut-out alpha"); st.blendingMode = BlendingMode.STENCIL_ALPHA; st.moveToBeginning();
    var holes = [], R = o.remnants || [];
    for (i = 0; i < R.length; i++) { var q = R[i], h = add(cu, "Remnant " + (i + 1)), b = q.box;
      var mk = h.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"), sh = new Shape(); sh.vertices = [[b[0], b[1]], [b[2], b[1]], [b[2], b[3]], [b[0], b[3]]]; sh.closed = true;
      mk.property("ADBE Mask Shape").setValue(sh); mk.property("ADBE Mask Feather").setValue([q.feather === undefined ? 3 : q.feather, q.feather === undefined ? 3 : q.feather]);
      // Color Range keys out what is redder than skinA (skin), so a hand passing through the box never joins the hole;
      // Extract then keeps only what is lighter than lighterThan (the pale remnant against a dark shirt)
      var cr = effect(h, "ADBE Color Range"), lim = { "Fuzziness": 5, "Color Space": 1, "Min (L, Y, R)": 0, "Max (L, Y, R)": 255, "Min (a, U, G)": 128 + (q.skinA === undefined ? 15 : q.skinA), "Max (a, U, G)": 255, "Min (b, V, B)": 0, "Max (b, V, B)": 255 };
      for (var nm in lim) cr.property(nm).setValue(lim[nm]);
      var ex = effect(h, "ADBE Extract"); ex.property("Black Point").setValue(q.lighterThan === undefined ? 35 : q.lighterThan); ex.property("Black Softness").setValue(6);
      if (q.frames && q.frames.length) { var ht = [0], hv = [0]; for (var f = 0; f < q.frames.length; f++) { ht.push(sec(q.frames[f][0]), sec(q.frames[f][1])); hv.push(100, 0); } holdKeys(h.opacity, ht, hv); }
      h.blendingMode = BlendingMode.SILHOUETE_ALPHA || BlendingMode.SILHOUETTE_ALPHA; h.moveToBeginning(); holes.push(h); }   // After Effects spells it SILHOUETE
    var L = comp.layers.add(C); L.name = P + "Speaker"; if (L.hasAudio) L.audioEnabled = false;
    L.anchorPoint.setValue([cu.width / 2, cu.height]); L.position.setValue([o.x === undefined ? W / 2 : o.x, H]);
    var sc = o.scale || 100 * H / cu.height; L.scale.setValue([sc, sc]);
    var g = o.grade; if (g && !o.look) { var m = effect(L, "ADBE CHANNEL MIXER"); m.property("Red-Red").setValue(g.mixer[0]); m.property("Green-Green").setValue(g.mixer[1]); m.property("Blue-Blue").setValue(g.mixer[2]);
      var lv = effect(L, "ADBE Easy Levels2"); lv.property("Input Black").setValue(g.inBlack); lv.property("Input White").setValue(g.inWhite); lv.property("Gamma").setValue(g.gamma);
      if (g.saturation !== undefined) effect(L, "ADBE HUE SATURATION").property("Master Saturation").setValue(g.saturation); }
    L.motionBlur = true;
    return { layer: L, comp: C, controls: lk ? lk.controls : null, remnants: holes }; }
  // ---- the speaker's look: balance and skin, as layers with their amounts on sliders. lk = { mixer [r, g, b] (Channel Mixer
  //      %: balance solved for a skin hue, not from a "white" object in the room), gamma (Levels), contrast (a share taken off
  //      both ends; keep it small: a contrast curve over the face's own range deepens every socket and crease), colourEven
  //      (%, 70: a blurred copy in Color mode inside the skin matte evens the skin's colour, not its detail), averagePull
  //      (%, 30, toward `average` [r, g, b], the face's mean colour), lightEven (%, 30: an inverted, heavily blurred lightness in
  //      Soft Light takes out a third of the large-scale light and dark), colourBlur, lightBlur (px at the source's size;
  //      default 4.6 % and 13.2 % of its width), choke (Simple Choker on the skin matte, -3), skinRange (Color Range settings
  //      that pick the skin; default Lab, L 70-245, a 143-200) }. Sliders on "<prefix>Skin controls" in the main comp.
  function look(comp, C, base, src, lk, P, add) {
    var CTL = comp.layers.addNull(comp.duration); CTL.name = P + "Skin controls"; CTL.enabled = false;
    var names = ["Colour even", "Average pull", "Light even", "Colour blur", "Light blur", "Skin choke"], i;
    var vals = [lk.colourEven === undefined ? 70 : lk.colourEven, lk.average ? (lk.averagePull === undefined ? 30 : lk.averagePull) : 0, lk.lightEven === undefined ? 30 : lk.lightEven,
      lk.colourBlur || .046 * src.width, lk.lightBlur || .132 * src.width, lk.choke === undefined ? -3 : lk.choke];
    for (i = 0; i < names.length; i++) effect(CTL, "ADBE Slider Control", names[i]).property(1).setValue(vals[i]);
    var CR = 'comp("' + comp.name + '").layer("' + CTL.name + '").effect("';
    function grade(L) { if (lk.mixer) { var m = effect(L, "ADBE CHANNEL MIXER"); m.property("Red-Red").setValue(lk.mixer[0]); m.property("Green-Green").setValue(lk.mixer[1]); m.property("Blue-Blue").setValue(lk.mixer[2]); }
      if (lk.gamma) effect(L, "ADBE Easy Levels2").property("Gamma").setValue(lk.gamma);
      if (lk.contrast) { var c = effect(L, "ADBE Easy Levels2"); c.property("Input Black").setValue(lk.contrast); c.property("Input White").setValue(1 - lk.contrast); }
      return L; }
    grade(base);
    var SK = add(src, "Skin key"), sr = lk.skinRange || { "Fuzziness": 8, "Color Space": 1, "Min (L, Y, R)": 70, "Max (L, Y, R)": 245, "Min (a, U, G)": 143, "Max (a, U, G)": 200, "Min (b, V, B)": 0, "Max (b, V, B)": 255 };
    var cr = effect(SK, "ADBE Color Range"); for (var nm in sr) cr.property(nm).setValue(sr[nm]);
    effect(SK, "ADBE Simple Choker").property("Choke Matte").expression = CR + 'Skin choke")("Slider");';
    var lite = grade(add(src, "Light even")), lb = effect(lite, "ADBE Gaussian Blur 2"); lb.property("Repeat Edge Pixels").setValue(1); lb.property("Blurriness").expression = CR + 'Light blur")("Slider");';
    effect(lite, "ADBE Tint"); effect(lite, "ADBE Invert"); lite.blendingMode = BlendingMode.SOFT_LIGHT; lite.opacity.expression = 'Math.min(100, 2 * ' + CR + 'Light even")("Slider"));';
    var col = grade(add(src, "Colour even")), cb = effect(col, "ADBE Gaussian Blur 2"); cb.property("Repeat Edge Pixels").setValue(1); cb.property("Blurriness").expression = CR + 'Colour blur")("Slider");';
    col.blendingMode = BlendingMode.COLOR; col.opacity.expression = CR + 'Colour even")("Slider");';
    var held = [lite, col];
    if (lk.average) { var avg = C.layers.addSolid(lk.average, "Average pull", src.width, src.height, 1, comp.duration); avg.blendingMode = BlendingMode.COLOR;
      avg.opacity.expression = CR + 'Average pull")("Slider");'; held.push(avg); }
    SK.moveToBeginning();
    for (i = 0; i < held.length; i++) held[i].setTrackMatte(SK, TrackMatteType.ALPHA_INVERTED);
    SK.enabled = false;
    return { controls: CTL, skinKey: SK }; }

  // ---- small interface pieces, built as comps of native shapes and text and passed to card() as its clip (so their pop,
  //      rim and entrance are the style's). They show an action, never real content: no names, handles or addresses.
  function shapeIn(C, name, kind, size, pos, col, round) { var L = C.layers.addShape(); L.name = name; L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    var gs = L.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group");
    if (kind === "ellipse") gs.addProperty("ADBE Vector Shape - Ellipse").property("ADBE Vector Ellipse Size").setValue(size);
    else { var r = gs.addProperty("ADBE Vector Shape - Rect"); r.property("ADBE Vector Rect Size").setValue(size); r.property("ADBE Vector Rect Roundness").setValue(round || 0); }
    gs.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(col); L.position.setValue(pos); return L; }
  // a comment bubble: white, a grey avatar, a grey name bar, the comment in near-black Inter Bold. o = { text, size [w, h]
  //      (600 x 240), font (118), name }
  function bubble(comp, o) { var Z = o.size || [600, 240], pad = .077 * Z[0], av = .067 * Z[0], rowY = .233 * Z[1];
    var C = app.project.items.addComp(o.name || (pfx(o) + "Bubble"), Z[0], Z[1], 1, comp.duration, comp.frameRate);
    C.layers.addSolid([1, 1, 1], "Paper", Z[0], Z[1], 1, comp.duration);
    shapeIn(C, "Avatar", "ellipse", [av, av], [pad + av / 2, rowY], [.72, .72, .74]);
    shapeIn(C, "Name", "rect", [.25 * Z[0], .075 * Z[1]], [pad + av + .03 * Z[0] + .125 * Z[0], rowY], [.8, .8, .82], .0375 * Z[1]);
    AESLib.text(C, "Comment", o.text, { family: FAM, style: FACE, size: o.font || .49 * Z[1], color: [.09, .09, .11], just: "left", pos: [pad, .858 * Z[1]] });
    return C; }
  // a prompt bar: a dark field, pale bars where the words would be (the prompt itself is never shown), a blinking caret and a
  //      round send button in the accent. o = { size [w, h] (880 x 180), field [r, g, b], bars [px...], accent, name }
  function promptBar(comp, o) { var Z = o.size || [880, 180], pad = .3 * Z[1], bars = o.bars || [.318 * Z[0], .205 * Z[0], .127 * Z[0]], bh = .156 * Z[1], gap = .156 * Z[1], cy = Z[1] / 2, x = pad, i;
    var C = app.project.items.addComp(o.name || (pfx(o) + "Prompt bar"), Z[0], Z[1], 1, comp.duration, comp.frameRate);
    C.layers.addSolid(o.field || [.09, .11, .16], "Field", Z[0], Z[1], 1, comp.duration);
    for (i = 0; i < bars.length; i++) { shapeIn(C, "Word " + (i + 1), "rect", [bars[i], bh], [x + bars[i] / 2, cy], [.82, .84, .88], bh / 2); x += bars[i] + gap; }
    var car = shapeIn(C, "Caret", "rect", [.04 * Z[1], .44 * Z[1]], [x + 4, cy], [.95, .95, .97], 0); car.opacity.expression = 'Math.floor(time * 2) % 2 == 0 ? 100 : 0;';
    var sd = .644 * Z[1], sx = Z[0] - pad - sd / 2; shapeIn(C, "Send", "ellipse", [sd, sd], [sx, cy], accentOf(o, [1, 0, 0]));
    var ar = C.layers.addShape(); ar.name = "Send arrow"; ar.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    var st = ar.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Star");
    st.property("ADBE Vector Star Type").setValue(2); st.property("ADBE Vector Star Points").setValue(3); st.property("ADBE Vector Star Outer Radius").setValue(sd * .22);
    ar.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue([1, 1, 1]);
    ar.position.setValue([sx, cy + sd * .03]); return C; }
  // an interface card: a bubble or a prompt bar popped in as a card. o = { kind ("bubble"|"bar"), text, at, pos, width,
  //      size, radius (default half the height for a bar, 29 % of it for a bubble), name, behind, tone } Things the speaker
  //      "holds" sit on the chest, in front; the card's entrance uses the lower white-piece exposure on a dark ground.
  function uiCard(comp, o) { var bar = o.kind === "bar", Z = o.size || (bar ? [880, 180] : [600, 240]), nm = o.name || (pfx(o) + "Card 1");
    var C = bar ? promptBar(comp, { size: Z, accent: o.accent, name: nm + " piece" }) : bubble(comp, { text: o.text, size: Z, name: nm + " piece" });
    return card(comp, { clip: C, clipStart: 0, at: o.at, pos: o.pos, size: Z, width: o.width, radius: o.radius !== undefined ? o.radius : (bar ? Z[1] / 2 : .29 * Z[1]), ui: true, name: nm, behind: o.behind, tone: o.tone, darkGround: o.darkGround }); }
  // ---- a strike-through: one straight stroke in the accent, drawn on and left on. o = { from [x, y], to [x, y], at (s),
  //      frames (6), width (px, 26 at 1080 wide), colour, prefix }. Named "<prefix>Line", so exitBeat clears it with its beat.
  function strike(comp, o) { var L = comp.layers.addShape(); L.name = pfx(o) + "Line"; L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    var gs = L.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group"), sh = new Shape();
    sh.vertices = [[o.from[0] - comp.width / 2, o.from[1] - comp.height / 2], [o.to[0] - comp.width / 2, o.to[1] - comp.height / 2]]; sh.inTangents = [[0, 0], [0, 0]]; sh.outTangents = [[0, 0], [0, 0]]; sh.closed = false;
    gs.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(sh);
    var stk = gs.addProperty("ADBE Vector Graphic - Stroke"); stk.property("ADBE Vector Stroke Color").setValue(accentOf(o, [1, 0, 0])); stk.property("ADBE Vector Stroke Width").setValue(o.width || 26 * k(comp));
    gs.addProperty("ADBE Vector Filter - Trim"); var tr = L.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property("ADBE Vector Filter - Trim");
    linearKeys(tr.property("ADBE Vector Trim End"), [o.at, o.at + sec(o.frames || 6)], [0, 100]);
    L.position.setValue([comp.width / 2, comp.height / 2]); L.motionBlur = true; return L; }

  // ---- the proof: one large card per item behind the speaker, its name as the giant word above it; as the next item lands,
  //      the earlier card steps back; then all together, each clip restarted from its opening as it joins the set.
  //      o = { items: [{ clip, at (s: the card's first frame; default W + 8 frames), text (the name), W (s: the name's spoken
  //      start), seed, blockScale }],
  //      card { pos, size, width } (default centred at 42 % of the height, 1280 x 800, 96 % of the frame wide),
  //      nameBaseline (comp px), back { scale (%), pos: [[x, y], ...] (card i's place once item i + 1 has landed), scaleDur
  //      (s, .3), posDur (s, .8) }, set { at (s), pos: [[x, y], ...], scale (%), stagger (frames, 4), dur (s, .6), restart
  //      (true) }, behind (the speaker layer: cards and names go under it), colour, tone, prefix }
  //      Cards are "<prefix>Card i", leaving with exitBeat({ prefix }); name i is its own beat, prefix "<prefix>A " and on.
  //      Returns { cards, names: [{ prefix, word, blocks }], end }.
  function proof(comp, o) { var P = pfx(o), it = o.items, cd = o.card || {}, sz = cd.size || [1280, 800], cards = [], names = [], i, end = 0;
    for (i = 0; i < it.length; i++) {
      var atC = it[i].at !== undefined ? it[i].at : it[i].W + sec(SIG.cardFirst);
      var C = card(comp, { clip: it[i].clip, clipStart: it[i].clipStart || 0, at: atC, pos: cd.pos || [comp.width / 2, .42 * comp.height], size: sz, width: cd.width || .96 * comp.width,
        name: P + "Card " + (i + 1), behind: o.behind, tone: o.tone, darkGround: o.darkGround });
      cards.push(C);
      if (it[i].text) { var NP = P + String.fromCharCode(65 + i) + " ";
        var hw = heroWord(comp, { text: it[i].text, at: it[i].W, colour: o.colour, baseline: o.nameBaseline, behind: o.behind, tone: o.tone, darkGround: o.darkGround, prefix: NP });
        var px = pixelBlocks(comp, { word: hw, at: it[i].W, colour: o.colour, seed: it[i].seed || (11 + i), blockScale: it[i].blockScale !== undefined ? it[i].blockScale : o.blockScale, tone: o.tone, darkGround: o.darkGround, prefix: NP });
        names.push({ prefix: NP, word: hw, blocks: px }); } }
    var bk = o.back;
    if (bk) for (i = 0; i + 1 < it.length; i++) { var t0 = it[i + 1].text ? it[i + 1].W : (it[i + 1].at !== undefined ? it[i + 1].at : it[i + 1].W + sec(SIG.cardFirst));
      if (bk.scale !== undefined) end = Math.max(end, moveCard(comp, { layer: cards[i], at: t0, scale: bk.scale, dur: bk.scaleDur || .3 }));
      if (bk.pos && bk.pos[i]) end = Math.max(end, moveCard(comp, { layer: cards[i], at: t0, pos: bk.pos[i], dur: bk.posDur || .8 })); }
    var st = o.set;
    if (st) for (i = 0; i < cards.length; i++) { var tj = st.at + sec(i * (st.stagger === undefined ? 4 : st.stagger));
      end = Math.max(end, moveCard(comp, { layer: cards[i], at: tj, scale: st.scale, pos: st.pos ? st.pos[i] : undefined, dur: st.dur || .6 }));
      if (st.restart !== false) restartClip(cards[i], tj); }
    return { cards: cards, names: names, end: end }; }
  // a card's clip starts again from its opening at t (time remapping: plays to t, then from 0), and runs to the comp's end
  function restartClip(cardLayer, t) { var RC = cardLayer.source.layer("Clip"), F0 = Math.max(RC.inPoint, RC.startTime), cs = RC.startTime, f1 = sec(1), len = comp0(cardLayer).duration - t, src = RC.source;
    if (src && src.duration) len = Math.min(len, src.duration);
    RC.timeRemapEnabled = true; var TR = RC.property("ADBE Time Remapping"); while (TR.numKeys) TR.removeKey(1);
    var TT = [F0, t - f1, t, t + len]; TR.setValuesAtTimes(TT, [F0 - cs, t - f1 - cs, 0, len]);
    for (var j = 1; j <= TR.numKeys; j++) TR.setInterpolationTypeAtKey(j, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
    TR.setInterpolationTypeAtKey(TR.nearestKeyIndex(t - f1), KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.HOLD);
    RC.outPoint = comp0(cardLayer).duration; return TR; }
  function comp0(L) { return L.containingComp || L.comp || { duration: L.source.duration }; }

  // ---- clear what a build owns, safely, so it can be rebuilt. o = { prefix }. A layer parented to one that is about to go
  //      (the push camera) is first unparented with that parent at rest (keys and expressions gone, no rotation, scale 100,
  //      its position on its anchor), so it keeps its own values instead of having the camera's zoom baked into it; then the
  //      owned layers go, then the project's comps named with the prefix (cards, interface pieces, the speaker and look).
  function clear(comp, o) { var P = pfx(o), n = AESLib.clearOwned(comp, P), items = 0;
    try { for (var i = app.project.numItems; i >= 1; i--) { var it = app.project.item(i); if (it instanceof CompItem && it.name.indexOf(P) === 0 && it !== comp) { it.remove(); items++; } } } catch (e) {}
    return { layers: n, comps: items }; }

  // ---- what a beat must not do: a line that cannot land before the beat leaves, a hold under SIG.hold frames, a line of more
  //      than SIG.lineWords words, text inside a reel's margins (the lead-in's ink may come up to SIG.margins.leadTop). A hold
  //      is the exit's start less the latest settle (under 2 px left to travel). o = { exitAt (s), settles: [{ what, at (s) }], lines:
  //      [{ what, words }], rects: [{ what, x0, y0, x1, y1 }] }. Returns warnings (strings).
  function beatWarnings(comp, o) { var w = [], i, M = SIG.margins, kx = comp.width / REF.w, ky = comp.height / REF.h, last = 0, lastWhat = "";
    for (i = 0; i < (o.lines || []).length; i++) if (o.lines[i].words > SIG.lineWords) w.push(o.lines[i].what + " has " + o.lines[i].words + " words; keep a line to " + SIG.lineWords + " or fewer, or it will not land while the words are spoken");
    for (i = 0; i < (o.settles || []).length; i++) if (o.settles[i].at > last) { last = o.settles[i].at; lastWhat = o.settles[i].what; }
    if (o.exitAt !== undefined && o.settles && o.settles.length) { var hold = Math.round((o.exitAt - last) * REF.fps * 10) / 10;
      if (hold < 0) w.push(lastWhat + " cannot land in its window: it lands " + (-hold) + " frames after the beat starts to leave");
      else if (hold < SIG.hold) w.push("the hold is " + hold + " frames (" + lastWhat + " lands last); aim for at least " + SIG.hold); }
    for (i = 0; i < (o.rects || []).length; i++) { var r = o.rects[i], m = [];
      if (r.y0 < (r.lead ? M.leadTop : M.top) * ky) m.push("top"); if (r.y1 > comp.height - M.bottom * ky) m.push("bottom"); if (r.x0 < M.side * kx || r.x1 > comp.width - M.side * kx) m.push("side");
      if (m.length) w.push(r.what + " enters the " + m.join(" and ") + " margin"); }
    return w; }
  function textRect(L, t, what) { var r = L.sourceRectAtTime(t, false), p = L.position.value; return { what: what, x0: p[0] + r.left, y0: p[1] + r.top, x1: p[0] + r.left + r.width, y1: p[1] + r.top + r.height }; }

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
  //      stressed word), clips: [{ item, start }], side, accent [r,g,b], ground [r,g,b], grade, push (bool), glow, seed, pushAt,
  //      cutout (FootageItem: the speaker is built from it on a clean ground; the style's default), take (with cutout: the
  //      delivery-size take beside it), look, remnants, tone ("light"|"dark"), tuck { hairY, depth } (the word goes behind the
  //      speaker), tailSize, exitAt (s: when the beat starts to leave; checked for a hold), wordBaseline, tailBaseline, leadBaseline }
  //      The report's warnings name a line that cannot land before exitAt, a hold under 10 frames, a line of more than five
  //      words, text in a reel's margins, a giant phrase, and the stage's own (working space, footage as the ground).
  function beat(comp, brief) { fontOK(); var rep = { warnings: [] }, b = brief, words = b.words, si = b.stressed, i, settles = [], lines = [], rects = [];
    var W = words[si].t, lead = [], tl = [], lEnd = b.split ? b.split[0] : si, tStart = b.split ? b.split[1] : si + 1;
    for (i = 0; i < lEnd; i++) lead.push(words[i].text); for (i = tStart; i < words.length; i++) tl.push(words[i].text);
    var type = b.type || "opener", P = pfx(b);
    // an earlier beat's speaker (and ground) can be passed in; otherwise the stage is built here
    var st;
    if (b.speaker) st = { speaker: b.speaker, ground: b.groundLayer || null };
    else if (b.cutout) { var gr = ground(comp, { tone: b.tone, colour: b.ground, prefix: P }), spk = speaker(comp, { cutout: b.cutout, take: b.take, takeStart: b.takeStart, scale: b.speakerScale, x: b.speakerX, grade: b.grade, look: b.look, remnants: b.remnants, prefix: P });
      var sp0 = projectSpace(); st = { speaker: spk.layer, ground: gr.layer, warnings: sp0.warnings }; }
    else st = stage(comp, { take: b.take, takeStart: b.takeStart, scale: b.speakerScale, x: b.speakerX, ground: b.ground, tone: b.tone, grade: b.grade, footageGround: b.footageGround, topShade: b.topShade, prefix: P });
    if (st.warnings) rep.warnings = rep.warnings.concat(st.warnings);
    var scene = [st.speaker], stack = null, line = null, L = null, T = null;
    if (st.shade) scene.push(st.shade); if (b.shadeLayer) scene.push(b.shadeLayer);
    if (b.footageGround || b.insetGround) scene.push(b.insetGround || null);
    if (type === "opener" && b.clips && b.clips.length) { stack = cardStack(comp, { clips: b.clips, at: W, side: b.side || "left", face: b.face, prefix: P, word: { box: { y1: comp.height * SIG.type.wordBaseline } } });
      for (i = 0; i < stack.layers.length; i++) scene.push(stack.layers[i]); rep.cards = stack.first; rep.warnings = rep.warnings.concat(stack.layout.warnings); }
    if (stack) { line = drawnLine(comp, { at: W, path: stack.path, colour: b.accent, cards: b.clips.length, prefix: P }); scene.push(line); }
    if (type === "opener" && lead.length) { var ll = wrap(lead.join(" "), b.maxChars), lat = ll.length > 1 ? [words[0].t, words[ll[0].split(" ").length].t] : words[0].t;
      L = leadIn(comp, { text: lead.join(" "), at: lat, prefix: P, maxChars: b.maxChars, baseline: b.leadBaseline }); scene.push(L); rep.leadAt = words[0].t;
      var n2 = ll.length > 1 ? ll[1].split(" ").length : 0, sl0 = SIG.leadDrop * k(comp); settles.push({ what: "the lead-in", at: ll.length > 1 ? lat[1] + settleTime(n2, "lead", sl0) : lat + settleTime(lead.length, "lead", sl0) });
      for (i = 0; i < ll.length; i++) lines.push({ what: "lead-in line " + (i + 1), words: ll[i].split(" ").length }); }
    var hw = heroWord(comp, { text: words[si].text, at: W, colour: b.accent, glow: b.glow, exposure: b.exposure, darkGround: b.darkGround, tone: b.tone, baseline: b.wordBaseline, tuck: b.tuck, behind: b.tuck ? st.speaker : null, prefix: P });
    rep.warnings = rep.warnings.concat(hw.warnings); settles.push({ what: "the giant word", at: W + popSettle(SIG.word, (hw.box.x1 - hw.box.x0) / 2) });
    var px = pixelBlocks(comp, { word: hw, at: W, colour: b.accent, seed: b.seed, prefix: P, blockScale: b.blockScale, count: b.blockCount, dist: b.blockDist, tone: b.tone, darkGround: b.darkGround,
      lineBand: L ? [(b.leadBaseline === undefined ? comp.height * SIG.type.leadBaseline : b.leadBaseline) - 50 * k(comp), (b.leadBaseline === undefined ? comp.height * SIG.type.leadBaseline : b.leadBaseline) + 8 * k(comp)] : null });
    px.layer.moveAfter(hw.glowLayer || hw.layer); scene.push(px.layer, hw.layer); if (hw.glowLayer) scene.push(hw.glowLayer);   // blocks under the word and its glow
    if (type === "opener" && tl.length) { var tw = wrap(tl.join(" "), b.maxChars), tat = tw.length > 1 ? [words[tStart].t, words[tStart + tw[0].split(" ").length].t] : words[tStart].t;
      T = tail(comp, { text: tl.join(" "), at: tat, under: hw.layer, baseline: b.tailBaseline, size: b.tailSize, prefix: P, maxChars: b.maxChars }); scene.push(T); rep.tailAt = words[tStart].t;
      var m2 = tw.length > 1 ? tw[1].split(" ").length : 0, tsz = T.property("Source Text").value.fontSize, tsl = PIECE.tailSlide || tailSlide(tl.length, tsz, k(comp));
      settles.push({ what: "the tail", at: tw.length > 1 ? tat[1] + settleTime(m2, "tail", tsl) : tat + settleTime(tl.length, "tail", tsl) });
      for (i = 0; i < tw.length; i++) lines.push({ what: "tail line " + (i + 1), words: tw[i].split(" ").length }); }
    if (stack) settles.push({ what: "the last card", at: stack.first[stack.first.length - 1] + popSettle(SIG.card, stack.layout.w / 2) });
    if (L) { var lr = textRect(L, W + 2, "the lead-in"); lr.lead = true; rects.push(lr); } rects.push({ what: "the giant word", x0: hw.box.x0, y0: hw.box.y0, x1: hw.box.x1, y1: hw.box.y1 }); if (T) rects.push(textRect(T, W + 3, "the tail"));
    rep.warnings = rep.warnings.concat(beatWarnings(comp, { exitAt: b.exitAt, settles: settles, lines: lines, rects: rects })); rep.settles = settles;
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
    blockSchedule: blockSchedule, blocksFor: blocksFor, pixelBlocks: pixelBlocks, card: card, stackLayout: stackLayout, cardStack: cardStack, linePath: linePath, drawnLine: drawnLine,
    tail: tail, motionBlur: motionBlur, beat: beat, moveCard: moveCard, textLine: textLine, exitBeat: exitBeat, exitText: exitText, reveal: reveal, wrap: wrap,
    setPiece: setPiece, piece: function () { return PIECE; }, ground: ground, speaker: speaker, look: look, projectSpace: projectSpace, lineTime: lineTime,
    settleTime: settleTime, popSettle: popSettle, curveAt: curveAt,
    bubble: bubble, promptBar: promptBar, uiCard: uiCard, strike: strike, proof: proof, restartClip: restartClip, clear: clear, beatWarnings: beatWarnings, tailSlide: tailSlide };
})();
