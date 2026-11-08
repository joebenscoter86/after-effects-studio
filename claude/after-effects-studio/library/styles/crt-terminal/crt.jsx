// CRT terminal style: brand-neutral ES3 helpers. No project mutation happens at load.
// Read styles/crt-terminal/STYLE.md first. Every image is real glyphs on a monospace grid (VT323), shown through a monochrome CRT stack.
// Pictures come from tools/glyphs.mjs (ffmpeg + Node), which writes a JSON of baked glyph strings per frame; this library bakes them into
// Source Text hold keys (no live data file: aerender drops text driven by a JSON footage expression).
// Adapted from Lemo-Opuscar's ascii-crt style (MIT, LemoLab); see THIRD-PARTY-NOTICES.
var AESCrt = (function () {
  var FONT = "VT323-Regular";                    // VT323: advance 0.4 em, cell 1:2 (cw wide, 2cw tall); bundled in assets/fonts (OFL)
  var PHOSPHOR = {                               // tier colours per phosphor, tuned against the reference shader under AE Glow
    amber: { dim: [.5, .19, .01], mid: [.82, .38, .02], bold: [1, .56, .04], tag: [1, .58, .05], glowA: [1, .55, .05, 1], glowB: [.55, .16, 0, 1], glass: [.034, .024, .017], beam: [1, .82, .55] },
    green: { dim: [.06, .4, .12], mid: [.14, .7, .25], bold: [.35, 1, .45], tag: [.3, .95, .4], glowA: [.3, 1, .4, 1], glowB: [.05, .35, .1, 1], glass: [.015, .03, .02], beam: [.7, 1, .75] },
    white: { dim: [.35, .36, .38], mid: [.65, .67, .7], bold: [.95, .96, 1], tag: [.9, .92, .95], glowA: [.9, .93, 1, 1], glowB: [.3, .32, .4, 1], glass: [.025, .026, .03], beam: [1, 1, 1] }
  };
  function fontOK() { var f = app.fonts.getFontsByFamilyNameAndStyleName("VT323", "Regular"); if (!f || !f.length) throw new Error("VT323 is not installed: install assets/fonts/VT323-Regular.ttf (OFL), then retry"); return true; }
  function readJSON(path) { var f = new File(path); if (!f.exists) throw new Error("missing " + path); f.encoding = "UTF-8"; f.open("r"); var s = f.read(); f.close(); return eval("(" + s + ")"); }
  // a monospace text layer anchored at its first baseline, left edge. cw = cell width in px (font size = cw / 0.4, leading = 2 cw)
  function mono(comp, name, str, cw, color, x, row0Top) {
    var L = comp.layers.addText(str || " "); L.name = name; var sp = L.property("Source Text"), td = sp.value;
    td.font = FONT; td.fontSize = cw / .4; td.applyFill = true; td.fillColor = color; td.applyStroke = false; td.tracking = 0;
    td.justification = ParagraphJustification.LEFT_JUSTIFY; td.autoLeading = false; td.leading = 2 * cw; sp.setValue(td);
    L.anchorPoint.setValue([0, 0]); L.position.setValue([x, row0Top + .64 * cw / .4]); return L; }
  // bake one string per frame into hold keys, skipping unchanged frames. strings[k] is shown from frame k / fps
  function bake(layer, strings, fps, t0) { return AESLib.bakeText(layer, strings, fps, t0); }
  // glyph picture tiers from tools/glyphs.mjs data: dim / mid / bold in the phosphor, accent in the one second colour
  function glyphTiers(comp, data, o) {
    fontOK(); o = o || {}; var P = PHOSPHOR[o.phosphor || "amber"], pre = o.prefix || "CRT_PIC", out = {};
    var tiers = ["dim", "mid", "bold", "accent"];
    for (var i = 0; i < tiers.length; i++) { var t = tiers[i]; if (!data[t]) continue;
      var L = mono(comp, pre + "_" + t, " ", data.cw || o.cw || 8.5, t === "accent" ? (o.accent || [1, .36, .28]) : P[t], o.x || 0, o.y || 0);
      out[t] = { layer: L.name, keys: bake(L, data[t], data.fps || comp.frameRate, o.t0) }; }
    return out; }
  // typed text: str appears one character at each time in ts (machine = even, human = uneven: pass the times you want)
  function typed(layer, str, ts) { var times = [0], ss = [" "];
    for (var k = 0; k < str.length && k < ts.length; k++) { if (ts[k] <= times[times.length - 1]) continue; times.push(ts[k]); ss.push(str.slice(0, k + 1)); }
    AESLib.textKeys(layer, times, ss); return layer; }
  function evenTimes(n, t0, dt) { var r = []; for (var k = 0; k < n; k++) r.push(t0 + k * dt); return r; }
  function handTimes(str, t0, dt) { var r = [], t = t0; for (var k = 0; k < str.length; k++) { r.push(t); var h = Math.sin(k * 127.1 + t0 * 311.7) * 43758.5453; h -= Math.floor(h); t += dt * (.55 + 1.1 * h) + (str.charAt(k) === " " ? dt * .8 : 0); } return r; }
  function block(comp, name, w, h, color, pos) { var L = comp.layers.addShape(); L.name = name; var v = L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").property("ADBE Vectors Group");
    v.addProperty("ADBE Vector Shape - Rect").property("ADBE Vector Rect Size").setValue([w, h]); v.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(color); L.position.setValue(pos); return L; }
  // the LOG strip (subtitles as terminal output): separator, inverse tag, the spoken line typed word by word on the voice's word times
  // words = [[start, end, "WORD"], ...] (uppercase); cols = wrap width in cells
  function logStrip(comp, words, o) {
    fontOK(); o = o || {}; var P = PHOSPHOR[o.phosphor || "amber"], pre = o.prefix || "CRT_LOG", cw = o.cw || 17, m = o.margin || 54, y = o.y || 1430, cols = o.cols || 50;
    var sep = mono(comp, pre + "_SEP", new Array(Math.floor((comp.width - 2 * m) / 12)).join("-"), 12, P.dim, m, y - 30);
    var tag = block(comp, pre + "_TAG", 5 * cw, cw * 1.8, P.tag, [m + 2.5 * cw, y + cw]);
    var tagT = mono(comp, pre + "_TAGT", " LOG ", cw, [0, 0, 0], m, y);
    var line = mono(comp, pre + "_LINE", " ", cw, P.bold, m + 6 * cw, y);
    // bake: one key per frame while a word is typing, the full line held after
    var fps = comp.frameRate, last = "", kt = [], ks = [];
    var tEnd = words.length ? words[words.length - 1][1] + 1 : 0;
    for (var f = 0; f <= Math.ceil(tEnd * fps); f++) { var t = f / fps, rows = [""];
      for (var i = 0; i < words.length; i++) { var w = words[i]; if (t < w[0]) break; var p = Math.min(1, (t - w[0]) / Math.max(.06, w[1] - w[0])), part = w[2].slice(0, Math.ceil(w[2].length * p));
        var r = rows[rows.length - 1]; if (r.length && r.length + 1 + w[2].length > cols) { rows.push(""); r = ""; } rows[rows.length - 1] = r + (r.length ? " " : "") + part; if (p < 1) break; }
      rows[0] = "> " + rows[0]; for (var k = 1; k < rows.length; k++) rows[k] = "  " + rows[k];
      var s = rows.join("\r"); if (s !== last) { kt.push(t); ks.push(s); last = s; } }
    AESLib.textKeys(line, kt, ks);
    var cur = block(comp, pre + "_CURSOR", cw * .88, cw * 1.56, P.tag, [0, 0]);
    cur.position.expression = 'var L = thisComp.layer("' + line.name + '"), t = L.text.sourceText.value.split("\\r"), last = t[t.length - 1];\n[' + (m + 6 * cw) + ' + (last.length + .5) * ' + cw + ', ' + y + ' + (t.length - 1) * ' + (2 * cw) + ' + ' + cw + ']';
    cur.opacity.expression = "time < " + tEnd + " ? 90 : (Math.floor(time / .5) % 2 ? 15 : 70)";
    return { line: line.name, cursor: cur.name }; }
  // the CRT: glass, the screen precomp through bloom / halo / noise / flicker, scanlines, curved glass, vignette, bezel, power-on.
  // master = the output comp; screen = the precomp holding every glyph layer. o.powerOn = [t0, t1] (dot -> line -> frame), o.radius = bezel corner
  function crtStack(master, screen, o) {
    o = o || {}; var P = PHOSPHOR[o.phosphor || "amber"], pre = o.prefix || "CRT", W = master.width, H = master.height, on = o.powerOn || [0, .42];
    var glass = master.layers.addSolid(P.glass, pre + "_GLASS", W, H, 1);
    var scr = master.layers.add(screen); scr.name = pre + "_SCREEN"; scr.moveBefore(glass); scr.blendingMode = BlendingMode.ADD;
    var PW = "function ss(a, b, x) { var u = Math.max(0, Math.min(1, (x - a) / (b - a))); return u * u * (3 - 2 * u); } var p = Math.max(0, Math.min(1, (time - " + on[0] + ") / " + (on[1] - on[0]) + "));";
    scr.scale.expression = PW + " [100 * Math.max(.002, ss(0, .35, p)), 100 * Math.max(.004, ss(.35, 1, p))];";
    scr.property("ADBE Effect Parade").addProperty("ADBE Exposure2");
    scr.property("ADBE Effect Parade").property(1).property(3).expression = PW + " var sy = Math.max(.004, ss(.35, 1, p)); Math.log(1 + Math.pow(1 - sy, 3) * 1.4) / Math.log(2);";
    var beam = master.layers.addSolid(P.beam, pre + "_BEAM", W, 8, 1); beam.moveBefore(scr); beam.blendingMode = BlendingMode.ADD;
    beam.scale.expression = PW + " [100 * Math.max(.004, ss(0, .35, p)), 100];"; beam.opacity.expression = PW + " var sy = Math.max(.004, ss(.35, 1, p)); 100 * Math.min(1, Math.pow(1 - sy, 3) * 1.4);";
    var fx = master.layers.addSolid([1, 1, 1], pre + "_FX", W, H, 1); fx.adjustmentLayer = true; fx.moveBefore(beam);
    var EP = fx.property("ADBE Effect Parade"); EP.addProperty("ADBE Glo2"); EP.addProperty("ADBE Glo2"); EP.addProperty("ADBE Noise"); EP.addProperty("ADBE Exposure2");
    EP = fx.property("ADBE Effect Parade");                                   // re-fetch after adding siblings
    var glows = o.glow || [[55, 14, .7], [40, 100, .25]];                  // [threshold, radius, intensity] for the tight and wide glow
    for (var g = 0; g < 2; g++) { var G = EP.property(g + 1); G.property("Glow Threshold").setValue(glows[g][0]); G.property("Glow Radius").setValue(glows[g][1]); G.property("Glow Intensity").setValue(glows[g][2]);
      G.property("Glow Colors").setValue(2); G.property(12).setValue(P.glowA); G.property(13).setValue(P.glowB); }   // A & B colours: Original drifts to lemon as red clips
    EP.property(3).property("Amount of Noise").setValue(3);
    EP.property(4).property(3).expression = "seedRandom(Math.floor(time * " + master.frameRate + "), true); random(-.02, .02);";   // ~1% flicker
    var sl = master.layers.addSolid([0, 0, 0], pre + "_SCANLINES", W, H, 1); sl.moveBefore(fx); sl.opacity.setValue(o.scan || 32);
    var vb = sl.property("ADBE Effect Parade").addProperty("ADBE Venetian Blinds");
    vb.property("Transition Completion").setValue(60); vb.property("Direction").setValue(90); vb.property("Width").setValue(3); vb.property("Feather").setValue(.8);
    var cv = master.layers.addSolid([1, 1, 1], pre + "_CURVE", W, H, 1); cv.adjustmentLayer = true; cv.moveBefore(sl);
    cv.property("ADBE Effect Parade").addProperty("ADBE Optics Compensation"); cv.property("ADBE Effect Parade").addProperty("CC Vignette");
    var CE = cv.property("ADBE Effect Parade"); CE.property(1).property("Field Of View (FOV)").setValue(o.curve || 22); CE.property(2).property("Amount").setValue(55);
    var bz = master.layers.addSolid([.018, .015, .013], pre + "_BEZEL", W, H, 1); bz.moveBefore(cv);
    var mk = bz.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"); mk.inverted = true; mk.property("ADBE Mask Feather").setValue([3, 3]);
    var b = new Shape(), X0 = 22, Y0 = 22, X1 = W - 22, Y1 = H - 22, r = o.radius || 95, q = .55 * r;
    b.vertices = [[X0 + r, Y0], [X1 - r, Y0], [X1, Y0 + r], [X1, Y1 - r], [X1 - r, Y1], [X0 + r, Y1], [X0, Y1 - r], [X0, Y0 + r]];
    b.inTangents = [[-q, 0], [0, 0], [0, -q], [0, 0], [q, 0], [0, 0], [0, q], [0, 0]]; b.outTangents = [[0, 0], [q, 0], [0, 0], [0, q], [0, 0], [-q, 0], [0, 0], [0, -q]]; b.closed = true;
    mk.property("ADBE Mask Shape").setValue(b);
    return { layers: [glass.name, scr.name, beam.name, fx.name, sl.name, cv.name, bz.name] }; }
  function clearOwned(comp, prefix) { if (!prefix || prefix.length < 3) throw new Error("Use a prefix of at least three characters"); for (var i = comp.numLayers; i >= 1; i--) if (comp.layer(i).name.indexOf(prefix) === 0) comp.layer(i).remove(); }
  // buildScene: the shared test scene in the CRT style. comp = an empty output comp; a SCREEN precomp is made and owned here.
  // Layout follows the reference poster: a large typed title with a block cursor, the hero picture in white phosphor over an amber world
  // (the style's one second colour), the LOG strip as the subtitle, and a push into the hero that becomes the end card's ground.
  function buildScene(comp, scene, opts) {
    fontOK(); var P = opts.prefix || "CRTS", ph = opts.phosphor || "amber", PH = PHOSPHOR[ph], HOT = PHOSPHOR[opts.hero || "white"], B = scene.beat, fps = comp.frameRate, notes = [], M = 54;
    clearOwned(comp, P);
    for (var it = app.project.numItems; it >= 1; it--) { var Ii = app.project.item(it); if (Ii instanceof CompItem && Ii.name === P + "_SCREEN") Ii.remove(); }
    var scr = app.project.items.addComp(P + "_SCREEN", comp.width, comp.height, 1, comp.duration, fps); scr.bgColor = [0, 0, 0];
    function line(name, str, cw, color, x, y, t0, t1, dt) { var L = mono(scr, P + "_" + name, " ", cw, color, x, y); L.inPoint = t0; L.outPoint = t1;
      typed(L, str, evenTimes(str.length, t0, dt || .03)); return L; }
    // a block cursor after the last character of str (rows split on \r), blinking unless steady
    function cursor(name, str, cw, x, y, t0, t1, steady) { var rows = str.split("\r"), last = rows[rows.length - 1];
      var C = block(scr, P + "_" + name, cw * .88, cw * 1.56, PH.tag, [x + (last.length + .5) * cw, y + (rows.length - 1) * 2 * cw + cw]); C.inPoint = t0; C.outPoint = t1;
      if (!steady) C.opacity.expression = "Math.floor((time - " + t0 + ") / .5) % 2 ? 15 : 90"; return C; }
    // 1. title: a small context line, then the hero typed large in the bold tier; the cursor waits after it
    var ctx = "> " + B.title.context.toUpperCase(), words = B.title.hero.toUpperCase().split(" "), hero = "", rowLen = 0;
    for (var hw = 0; hw < words.length; hw++) { if (rowLen && rowLen + 1 + words[hw].length > 14) { hero += "\r"; rowLen = 0; } else if (rowLen) { hero += " "; rowLen++; } hero += words[hw]; rowLen += words[hw].length; }
    line("T1", ctx, 24, PH.mid, M, 300, B.title.t0, B.input.t0);
    var heroT0 = B.title.t0 + .25, heroDt = Math.min(.045, (B.title.t1 - heroT0) * .8 / hero.length);
    line("T2", hero, 64, PH.bold, M, 380, heroT0, B.input.t0, heroDt);
    cursor("T2C", hero, 64, M, 380, heroT0 + hero.length * heroDt, B.input.t0);
    // 2. picture: three objects as glyph drawings, typed in one after another under the title
    var ART = { person: [" .-. ", "( o )", " '-' ", "/| |\\", " | | "], document: [" ____ ", "|=== |", "|=== |", "|=== |", "|____|"], device: [" _______ ", "|       |", "|  ===  |", "|_______|", "  /___\\  "] };
    var objs = B.picture.objects, ocw = 34, ox = [1, 10, 19];
    for (var i = 0; i < objs.length && i < 3; i++) { var art = ART[objs[i]] || ART.document, t0 = B.picture.t0 + i * (B.picture.t1 - B.picture.t0) / 3;
      for (var r = 0; r < art.length; r++) line("OBJ" + i + "_" + r, art[r], ocw, r === 0 ? PH.bold : PH.mid, M + ox[i] * ocw, 860 + r * 2 * ocw, t0 + r * .05, B.input.t0, .02); }
    // 3. real input: the clip as glyphs (tools/glyphs.mjs), drawn in the hero phosphor so it reads as the one thing that matters
    var data = readJSON(opts.assets.glyphs), pw = data.cols * data.cw, px = Math.round((comp.width - pw) / 2), py = 330;
    glyphTiers(scr, data, { x: px, y: py, phosphor: opts.hero || "white", prefix: P + "_PIC", t0: B.input.t0 });
    var pics = []; for (var k = 1; k <= scr.numLayers; k++) { var Lk = scr.layer(k); if (Lk.name.indexOf(P + "_PIC") === 0) { Lk.inPoint = B.input.t0; Lk.outPoint = comp.duration; pics.push(Lk.name); } }
    // 4. number: a roller counter under the picture, fast then slowing, discrete digits
    var cnt = mono(scr, P + "_NUM", " ", 56, PH.bold, M, py + data.rows * 2 * data.cw + 70); cnt.inPoint = B.number.t0; cnt.outPoint = B.carry.t0;
    var cs = [], nf = Math.round((B.number.t1 - B.number.t0) * fps);
    for (var f = 0; f <= nf; f++) { var u = Math.min(1, f / (nf * .7)); cs.push(String(Math.round(B.number.value * (1 - Math.pow(1 - u, 3)))) + " " + B.number.label.toUpperCase()); }
    bake(cnt, cs, fps, B.number.t0);
    // 5. typed line: the LOG strip carries every spoken word (it is the style's subtitle)
    var ws = []; for (var w = 0; w < scene.wordList.length; w++) { var x = scene.wordList[w]; ws.push([x.s, x.e, String(x.text).toUpperCase()]); }
    logStrip(scr, ws, { y: 1700, cw: 17, cols: 50, phosphor: ph, prefix: P + "_LOG" });
    crtStack(comp, scr, { phosphor: ph, powerOn: [0, .42], prefix: P, glow: opts.glow || [[62, 14, .75], [40, 130, .4]] });
    // 6. carry: push into the picture about its focus (opts.focus = [col, row] in cells, default the upper middle, where a face's eyes sit)
    //    until it fills the screen, then it sinks to a dim ground for the end card
    var fc = opts.focus || [data.cols * .55, data.rows * .25], ax = fc[0] * data.cw, ay = fc[1] * 2 * data.cw;
    for (var q = 0; q < pics.length; q++) { var Lq = scr.layer(pics[q]); Lq.anchorPoint.setValue([ax, ay]); Lq.position.setValue([px + ax, py + 1.6 * data.cw + ay]);
      AESLib.ease(Lq.scale, [B.carry.t0, B.carry.t1], [[100, 100], [380, 380]], "travel");
      AESLib.ease(Lq.position, [B.carry.t0, B.carry.t1], [[px + ax, py + 1.6 * data.cw + ay], [comp.width / 2, comp.height * .46]], "travel");
      AESLib.ease(Lq.opacity, [B.carry.t1 - .2, B.end.t0 + .4], [100, 10], "settle"); }
    // 7. end card: a prompt with the end text typed by hand over the dim ground; the cursor holds steady once typing stops
    var es = "> " + B.end.text.toUpperCase(), ecw = Math.min(52, Math.floor((comp.width - 2 * M - 40) / (es.length + 1))), ey = Math.round(comp.height * .46 - ecw * 1.4);
    var eTimes = handTimes(es, B.end.t0, .05), endL = mono(scr, P + "_END", " ", ecw, PH.bold, M, ey); endL.inPoint = B.end.t0; endL.outPoint = B.end.t1; typed(endL, es, eTimes);
    cursor("ENDC", es, ecw, M, ey, eTimes[eTimes.length - 1], B.end.t1, true);
    return { layers: comp.numLayers + scr.numLayers, precomps: [scr.name], notes: notes };
  }
  return { FONT: FONT, PHOSPHOR: PHOSPHOR, fontOK: fontOK, readJSON: readJSON, mono: mono, bake: bake, glyphTiers: glyphTiers, typed: typed, evenTimes: evenTimes, handTimes: handTimes,
    logStrip: logStrip, crtStack: crtStack, clearOwned: clearOwned, buildScene: buildScene };
})();
