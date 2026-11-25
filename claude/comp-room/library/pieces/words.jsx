// piece: words
// name: A line that builds word by word
// does: Lays out one line of flat words and shows each at its own time; the words never slide, and the part already shown stays centred where you put the line (or under an object).
// use it for: a phrase whose words appear one at a time as they are said; a second message that builds on the back of a card after a flip
// job: reveal-headline; support: before-after
// provides: type: reveal; motion: stagger
// works with: piece-on-face, piece-flip, piece-label
// call: PCS.words(comp, { words: [{ text, t }], size, weight, color, on, gap, name, pos, under, below, centre })
// option words: each { text, t }: the word and the time it appears (0 or no t: from the start)
// option size: pixels, default 64
// option on: 'ground' (default), 'surface' or 'accent', as piece-label
// option gap: space between words, default 0.28 of the size
// option pos: [x, y, z] where the line's centre sits (default [540, 960, 0]); graphics live in about y 220 to 1180
// option under: a layer to hang the line under, centred on it (instead of pos); below: space between its bottom edge and the line, default 0.9 of the size
// option centre: 'visible' (default) keeps the words shown so far centred, easing the line over by half a word as each one appears; 'line' lays the whole line out centred from the start, so the first words sit left of centre until it is complete
// returns: { holder, layers, width }: the holder is a null the words hang on; move it with its moves (tip-away), or seat it on a face (PCS.onFace(line.holder, card))
// example:
//   var q = PCS.words(st.comp, { words: [{ text: 'is', t: 1.4 }, { text: 'it', t: 1.6 }, { text: 'right?', t: 1.9 }], size: 84, under: tile });
//   var line = PCS.words(st.comp, { words: [{ text: 'Ask', t: 1.5 }, { text: 'for', t: 1.9 }, { text: 'proof', t: 2.1 }], size: 80, on: 'surface' });
//   PCS.onFace(line.holder, card);
// note: time each word to the voice; a word that slides in makes the whole line look like it moves.
// ---
PCS.words = function (comp, o) {
  var S = PCS.S; var size = o.size || 64; var gap = (o.gap === undefined) ? size * 0.28 : o.gap;
  var H = comp.layers.addNull(); H.name = o.name || 'words'; H.threeDLayer = true; PCS.seat(comp, H);
  var col = o.color || (o.on === 'surface' ? S.ink : (o.on === 'accent' ? S.onAccent : S.type));
  var Ls = []; var ws = []; var total = 0; var i;
  for (i = 0; i < o.words.length; i++) {
    var T = comp.layers.addText(o.words[i].text); T.name = 'word ' + o.words[i].text;
    var w = PCS.setText(T, { size: size, weight: o.weight, color: col, anchor: 'left' });
    T.threeDLayer = true; PCS.sp(T, PCS.MG, 'ADBE Accepts Lights', 0); PCS.sp(T, PCS.MG, 'ADBE Casts Shadows', 0);
    PCS.seat(comp, T); Ls.push(T); ws.push(w); total += w + (i ? gap : 0);
  }
  // The words hang on an inner null that does the centring, so the holder itself stays free to place, seat or move.
  var C = comp.layers.addNull(); C.name = H.name + ' line'; C.threeDLayer = true; PCS.seat(comp, C);
  C.parent = H; PCS.zero(C); PCS.TG(C).property('ADBE Anchor Point').setValue([0, 0, 0]); PCS.TG(C).property('ADBE Position').setValue([0, 0, 0]);
  var x = -total / 2;
  for (i = 0; i < Ls.length; i++) {
    Ls[i].parent = C; PCS.zero(Ls[i]);
    PCS.TG(Ls[i]).property('ADBE Position').setValue([x, 0, 0]);
    x += ws[i] + gap;
    if (o.words[i].t !== undefined && o.words[i].t > 0) { PCS.hold(PCS.TG(Ls[i]).property('ADBE Opacity'), [[0, 0], [o.words[i].t, 100]]); }
  }
  try { PCS.TG(H).property('ADBE Anchor Point').setValue([0, 0, 0]); } catch (e) {}
  var at = o.pos || [540, 960, 0];
  if (o.under) {
    var hb = PCS.num(o.under, 'h', 0); var bl = (o.below === undefined) ? size * 0.9 : o.below;
    var ub = PCS.toWorld(o.under, [0, hb / 2, 0], o.words[0].t || 0);
    at = [ub[0], ub[1] + bl + size * 0.35, ub[2]];
  }
  PCS.TG(H).property('ADBE Position').setValue([at[0], at[1], at[2] || 0]);
  if (o.centre !== 'line') {
    // The shown part stays centred: as each word appears the line eases left by half of what it added.
    var CP = PCS.TG(C).property('ADBE Position'); var shown = 0; var keys = []; var t0 = null;
    for (i = 0; i < Ls.length; i++) {
      var ti = o.words[i].t || 0; shown += ws[i] + (i ? gap : 0);
      var v = [total / 2 - shown / 2, 0, 0];
      if (ti <= 0 || t0 === null) { keys = [[Math.max(0, ti), v]]; t0 = ti; continue; }
      keys.push([ti, keys[keys.length - 1][1]]); keys.push([ti + 0.14, v]);
    }
    if (keys.length > 1) { PCS.kf(CP, keys); } else { CP.setValue(keys[0][1]); }
  }
  return { holder: H, layers: Ls, width: total };
};
