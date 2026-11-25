// piece: words
// name: A line that builds word by word
// does: Lays out one centred line of flat words and shows each at its own time, in place, so the line never jumps as it builds.
// use it for: a phrase whose words appear one at a time as they are said; a second message that builds on the back of a card after a flip
// job: reveal-headline; support: before-after
// provides: type: reveal; motion: stagger
// works with: piece-on-face, piece-flip, piece-label
// call: PCS.words(comp, { words: [{ text, t }], size, weight, color, on, gap, name })
// option words: each { text, t }: the word and the time it appears (0 or no t: from the start)
// option size: pixels, default 64
// option on: 'ground' (default), 'surface' or 'accent', as piece-label
// option gap: space between words, default 0.28 of the size
// returns: { holder, layers, width }: the holder is a null the words hang on; seat or move it (PCS.onFace(line.holder, card))
// example:
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
  var x = -total / 2;
  for (i = 0; i < Ls.length; i++) {
    Ls[i].parent = H; PCS.zero(Ls[i]);
    PCS.TG(Ls[i]).property('ADBE Position').setValue([x, 0, 0]);
    x += ws[i] + gap;
    if (o.words[i].t !== undefined && o.words[i].t > 0) { PCS.hold(PCS.TG(Ls[i]).property('ADBE Opacity'), [[0, 0], [o.words[i].t, 100]]); }
  }
  try { PCS.TG(H).property('ADBE Anchor Point').setValue([0, 0, 0]); } catch (e) {}
  return { holder: H, layers: Ls, width: total };
};
