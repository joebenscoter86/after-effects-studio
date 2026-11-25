// piece: label
// name: Flat crisp label
// does: Sets one line of flat type in the style's font, in the colour that reads on what it sits on (the ground, a surface or the accent), unlit so it keeps its exact colour.
// use it for: what a card says; a caption under a number; a short supporting line beside a lit object
// job: reveal-headline; support: make-concrete, land-number
// provides: type: label
// works with: piece-on-face, piece-plate, piece-type3d
// call: PCS.label(comp, { text, size, weight, color, on, maxWidth, anchor, pos, name })
// option text: the words
// option size: pixels, default 64; never under 44 on a phone frame
// option on: 'ground' (default), 'surface' or 'accent': picks the style colour that reads there
// option color: overrides on
// option maxWidth: shrinks the size until the line fits this width
// option anchor: 'left' sets the anchor at the line's left edge (default its centre)
// option pos: [x, y, z]
// returns: the text layer (3D, unlit)
// example:
//   var card = PCS.plate(st.comp, { name: 'card', w: 720, h: 300, round: 34, pos: [540, 600, 0] });
//   PCS.onFace(PCS.label(st.comp, { text: '42 passed, 0 failed', size: 60, on: 'surface' }), card);
// note: type on a plate is flat, never extruded; one hero word that should be an object is piece-type3d.
// ---
PCS.label = function (comp, o) {
  var S = PCS.S;
  var T = comp.layers.addText(o.text); T.name = o.name || ('label ' + o.text);
  var col = o.color || (o.on === 'surface' ? S.ink : (o.on === 'accent' ? S.onAccent : S.type));
  PCS.setText(T, { size: o.size, weight: o.weight, color: col, maxWidth: o.maxWidth, anchor: o.anchor });
  T.threeDLayer = true;
  PCS.sp(T, PCS.MG, 'ADBE Accepts Lights', 0);
  if (o.pos) { PCS.TG(T).property('ADBE Position').setValue(o.pos); }
  return PCS.seat(comp, T);
};
