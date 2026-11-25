// piece: type3d
// name: One hero word or number as a lit object
// does: Makes one word or number a solid, lit object with a shallow extrusion and no bevel, that casts a shadow and shows its side wall.
// use it for: a big word on its own (a yes, a no, a name) or a big number; the number the line lands on; the one word that is the answer; never a sentence
// job: land-number; support: reveal-headline
// provides: type: 3d; depth: extrusion; depth: shadow
// works with: piece-stage, piece-label, piece-stand-up, piece-tip-away, piece-move
// call: PCS.type3d(comp, { text, size, depth, weight, color, pos, tilt, maxWidth, name })
// option text: the word or number
// option size: pixels, default 330
// option depth: extrusion, default 12 percent of the size
// option color: default the style's type colour; the face renders as that colour under the style's light (its typeLit)
// option pos: [x, y, z]
// option tilt: [x, y] resting angle, default the style's tilt
// option maxWidth: shrinks the size until it fits, default 860
// returns: the text layer
// example:
//   var n = PCS.type3d(st.comp, { text: '42', size: 420, pos: [540, 560, 0] });
//   PCS.label(st.comp, { text: 'tests passed', size: 64, pos: [540, 860, 0] });
// note: no bevel and a shallow depth: deeper or bevelled type reads as word art. Supporting words are piece-label.
// note: its face is lit and set (the style's typeLit) to render as the cream type colour at rest in the middle and lower stage; near the top of the stage it reads a shade darker. Bring it in with piece-stand-up and take it off with piece-tip-away.
// ---
PCS.type3d = function (comp, o) {
  var T = comp.layers.addText(o.text); T.name = o.name || ('hero ' + o.text);
  PCS.setText(T, { size: o.size || 330, weight: o.weight, color: PCS.typeColor(o.color), maxWidth: o.maxWidth || 860 });
  T.threeDLayer = true;
  PCS.sp(T, PCS.GEO, 'ADBE Extrsn Depth', o.depth === undefined ? Math.round((o.size || 330) * 0.12) : o.depth);
  PCS.sp(T, PCS.MG, 'ADBE Casts Shadows', 1);
  PCS.material(T);
  if (o.pos) { PCS.TG(T).property('ADBE Position').setValue(o.pos); }
  var tilt = o.tilt || [PCS.S.tilt[0], PCS.S.tilt[1] - 1];
  PCS.TG(T).property('ADBE Rotate X').setValue(tilt[0]);
  PCS.TG(T).property('ADBE Rotate Y').setValue(tilt[1]);
  return PCS.seat(comp, T);
};
// The colour to give a lit hero word so its face renders as the colour named: the style's typeLit for its own type colour
// (set by render under its light), else the colour capped by litCap.
PCS.typeColor = function (c) {
  if (!c && PCS.S.typeLit) { return PCS.S.typeLit; }
  return PCS.lit(c || PCS.S.type);
};
