// piece: flip
// name: Flip an object over
// does: Turns an object over to its other side with a small overshoot, starting from wherever it is; call it again to turn it back.
// use it for: a question turning into its answer; a change of mind; the other side of a card; something that turns over
// job: before-after; support: fail-then-fix, reveal-headline
// provides: motion: flip
// works with: piece-plate, piece-stage
// call: PCS.flip(layer, { t, dur, axis, dir })
// option t: start time in seconds (required)
// option dur: length in seconds, default 0.42 (the overshoot peaks at 72 percent)
// option axis: 'y' turns like a page (default); 'x' tips over like a tile
// option dir: 1 or -1, which way it turns
// returns: the layer
// example:
//   var st = PCS.stage({ name: 'BEAT 3', duration: 5 });
//   var pill = PCS.plate(st.comp, { name: 'pill', w: 780, h: 160, round: 80, pos: [540, 300, 0] });
//   PCS.flip(pill, { t: 1.2, axis: 'x' });
//   PCS.flip(pill, { t: 3.0, axis: 'x' });   // and back: moves chain on one object
// note: put what the back says on the back face before the flip, the right way up for the axis it turns on.
// ---
PCS.flip = function (plate, o) {
  var axis = o.axis || 'y'; var dur = o.dur || 0.42; var dir = o.dir || 1;
  var p = PCS.TG(plate).property(axis === 'x' ? 'ADBE Rotate X' : 'ADBE Rotate Y');
  var a = p.valueAtTime(o.t, false); var b = a + 180 * dir;
  PCS.kfFrom(p, [[o.t, a], [o.t + dur * 0.72, b + 9 * dir], [o.t + dur, b]]);
  return plate;
};
