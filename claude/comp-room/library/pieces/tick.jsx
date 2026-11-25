// piece: tick
// name: A tick that draws on
// does: Draws a round-capped tick mark stroke by stroke at a time, sized to what it sits on.
// use it for: done, passed, proven; the answer side of a tile; a checked row
// job: show-proof; support: fail-then-fix, list-items
// provides: motion: draw-on
// works with: piece-on-face, piece-two-sided, piece-rows
// call: PCS.tick(comp, { size, color, t, dur, name })
// option size: width of the thing it sits on, default 82
// option color: default the style's colour for things on the accent
// option t: when it starts drawing (without t it is drawn from the start)
// option dur: seconds to draw, default 0.18
// returns: the shape layer; seat it with PCS.onFace
// example:
//   var tile = PCS.plate(st.comp, { name: 'tile', w: 300, h: 300, round: 56, color: PCS.S.accent, pos: [540, 600, 0] });
//   PCS.onFace(PCS.tick(st.comp, { size: 260, t: 1.0 }), tile);
// ---
PCS.tick = function (comp, o) {
  var C = comp.layers.addShape(); C.name = o.name || 'tick';
  var c3 = C.property('ADBE Root Vectors Group').addProperty('ADBE Vector Group').property('ADBE Vectors Group');
  var k = (o.size || 82) / 82;
  var s = new Shape(); s.vertices = [[-26 * k, 2 * k], [-8 * k, 20 * k], [28 * k, -20 * k]]; s.closed = false;
  c3.addProperty('ADBE Vector Shape - Group').property('ADBE Vector Shape').setValue(s);
  var st = c3.addProperty('ADBE Vector Graphic - Stroke');
  st.property('ADBE Vector Stroke Color').setValue(o.color || PCS.S.onAccent);
  st.property('ADBE Vector Stroke Width').setValue(13 * k);
  try { st.property('ADBE Vector Stroke Line Cap').setValue(2); st.property('ADBE Vector Stroke Line Join').setValue(2); } catch (e) {}
  var tr = c3.addProperty('ADBE Vector Filter - Trim').property('ADBE Vector Trim End');
  if (o.t !== undefined) { PCS.kf(tr, [[o.t, 0], [o.t + (o.dur || 0.18), 100]]); }
  return PCS.seat(comp, C);
};
