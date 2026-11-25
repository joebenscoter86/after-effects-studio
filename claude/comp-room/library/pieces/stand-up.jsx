// piece: stand-up
// name: Stand an object up
// does: An object lying flat stands up past upright and settles back, from wherever its rotation is; what sits on it stays hidden until it is half way up, so no type is seen squashed edge-on.
// use it for: a pill, a card or a result arriving by standing up; the one item chosen from many standing up to be seen
// job: reveal-headline; support: show-proof, list-items
// provides: motion: bounce
// works with: piece-plate, piece-on-face, piece-flip, piece-land-on
// call: PCS.standUp(plate, { t, dur, hide })
// option t: when it starts (required)
// option dur: seconds, default 0.5 (past upright at 60 percent, settled at the end)
// option hide: false keeps it visible before t (default: hidden until t)
// returns: the layer
// example:
//   var card = PCS.plate(st.comp, { name: 'card', w: 720, h: 470, round: 34, pos: [540, 900, 0] });
//   PCS.onFace(PCS.label(st.comp, { text: '42 passed, 0 failed', size: 52, on: 'surface' }), card);
//   PCS.standUp(card, { t: 2.6 });
// note: seated layers with their own opacity timing keep it.
// ---
PCS.standUp = function (plate, o) {
  var d = o.dur || 0.5; var p = PCS.TG(plate).property('ADBE Rotate X');
  var tx = p.valueAtTime(o.t + d, false); if (p.numKeys === 0) { tx = p.value; }
  PCS.kfFrom(p, [[o.t, tx - 94], [o.t + d * 0.6, tx + 7], [o.t + d * 0.85, tx - 3], [o.t + d, tx]]);
  if (o.hide !== false) {
    try { PCS.hold(PCS.TG(plate).property('ADBE Opacity'), [[0, 0], [o.t, 100]]); } catch (e) {}
    var ch = PCS.children(plate);
    for (var i = 0; i < ch.length; i++) { try { var op = PCS.TG(ch[i]).property('ADBE Opacity'); if (op.numKeys === 0) { PCS.hold(op, [[0, 0], [o.t + d * 0.32, 100]]); } } catch (e2) {} }
  }
  return plate;
};
