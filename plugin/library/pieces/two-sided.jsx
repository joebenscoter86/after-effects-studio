// piece: two-sided
// name: One object with a different colour each side
// does: Makes one thick object whose front is one colour and whose back is another, so a flip changes its colour as well as what it says.
// use it for: a question that turns into the answer; wrong to right; a quiet tile that turns to the accent
// job: before-after; support: fail-then-fix, show-proof
// provides: depth: extrusion; depth: shadow
// works with: piece-flip, piece-on-face, piece-tick, piece-land-on
// call: PCS.twoSided(comp, { name, w, h, round, color, backColor, depth, bevel, pos, tilt, axis })
// option color: the front, default the style's surface
// option backColor: the back, default the style's quiet colour
// option axis: the axis it will flip on, 'y' (default) or 'x', so the back reads the right way up
// option w, h, round, depth, bevel, pos, tilt: as piece-plate
// returns: { front, back }: move and flip front; seat things with PCS.onFace(layer, obj.front) and PCS.onFace(layer, obj.back)
// example:
//   var tile = PCS.twoSided(st.comp, { name: 'tile', w: 330, h: 330, round: 60, color: PCS.S.quiet, backColor: PCS.S.accent, pos: [300, 640, 0] });
//   PCS.onFace(PCS.label(st.comp, { text: '?', size: 190 }), tile.front);
//   PCS.onFace(PCS.tick(st.comp, { size: 280, t: 1.0 }), tile.back);
//   PCS.flip(tile.front, { t: 0.8 });
// ---
PCS.need('plate');
PCS.twoSided = function (comp, o) {
  var d = (o.depth === undefined) ? PCS.S.depth : o.depth;
  var a = PCS.plate(comp, { name: (o.name || 'obj'), w: o.w, h: o.h, round: o.round, color: o.color, depth: d / 2, bevel: o.bevel, pos: o.pos, tilt: o.tilt });
  var b = PCS.plate(comp, { name: (o.name || 'obj') + ' back', w: o.w, h: o.h, round: o.round, color: o.backColor || PCS.S.quiet, depth: d / 2, bevel: o.bevel, tilt: [0, 0] });
  b.parent = a; PCS.zero(b);
  PCS.TG(b).property('ADBE Position').setValue([0, 0, d]);
  PCS.TG(b).property(o.axis === 'x' ? 'ADBE Rotate X' : 'ADBE Rotate Y').setValue(180);
  return { front: a, back: b };
};
