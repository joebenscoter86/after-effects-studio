// piece: move
// name: Move or grow an object to a new place
// does: Takes an object from wherever it is at a time to a new resting place, a new size, or both, eased, with an optional overshoot; it chains with the other moves on the same object (a flip, a stand-up, a landing), and its pool of light follows it and grows with it.
// use it for: an object growing and coming forward to become the hero; a carried object from the previous beat moving to its new place; a tile rising into the question while it turns over; making room for what comes next
// job: relate-things; support: hand-over, reveal-headline, add-impact
// provides: motion: bounce
// works with: piece-flip, piece-stand-up, piece-land-on, piece-spot, piece-two-sided
// call: PCS.move(layer, { t, dur, to, by, scale, overshoot })
// option t: when it starts (required)
// option dur: seconds, default 0.5
// option to: [x, y] or [x, y, z], where it comes to rest (its position: in the comp, or in its parent's space if it has one); a missing z keeps its depth
// option by: [dx, dy] or [dx, dy, dz] instead of to: how far it moves from where it is at t
// option scale: its size in percent at rest, absolute (100 is its own size, whatever scale it had before); a number, or [x, y]
// option overshoot: percent of the move it goes past before settling back, default 0 (a plain ease); 6 to 10 gives a small bounce
// returns: the layer
// example:
//   var tile = PCS.twoSided(st.comp, { name: 'tile', w: 360, h: 360, round: 64, color: PCS.S.accent, backColor: PCS.S.quiet, pos: [540, 846, 0] });
//   PCS.flip(tile.front, { t: 0.84, dur: 0.5 });
//   PCS.move(tile.front, { t: 0.84, dur: 0.5, to: [540, 560], scale: 150, overshoot: 6 });   // grows and rises into the question as it turns
// note: moves chain in time order: each one starts from where the object is at its t and drops any keys of the same kind after its t, so add an object's moves from first to last.
// note: on a two-sided object move its front; the back follows it. Start a move after a stand-up has settled.
// note: rendered positions differ from comp positions (the camera sits low and left): check where it lands with a render or PCS.onScreen.
// ---
PCS.move = function (layer, o) {
  if (o.t === undefined) { throw new Error('move: t is required'); }
  var d = o.dur || 0.5; var t = o.t; var os = (o.overshoot || 0) / 100; var T = PCS.TG(layer);
  if (o.to || o.by) {
    var P = T.property('ADBE Position'); var p0 = P.valueAtTime(t, false);
    var p1 = o.to ? [o.to[0], o.to[1], o.to.length > 2 ? o.to[2] : (p0[2] || 0)] : [p0[0] + o.by[0], p0[1] + o.by[1], (p0[2] || 0) + (o.by[2] || 0)];
    if (P.numKeys && P.keyTime(P.numKeys) > t + 0.0005 && P.keyOutInterpolationType(1) === KeyframeInterpolationType.HOLD) {
      PCS.warnings.push('move: ' + layer.name + ' is still standing up at ' + t.toFixed(2) + ' s; start the move after it settles');
    }
    PCS.moveKeys(P, t, d, p0, p1, os);
  }
  if (o.scale !== undefined) {
    var Sc = T.property('ADBE Scale'); var s0 = Sc.valueAtTime(t, false);
    var s = (o.scale instanceof Array) ? o.scale : [o.scale, o.scale];
    PCS.moveKeys(Sc, t, d, s0, [s[0], s[1], s0.length > 2 ? s0[2] : 100], os);
  }
  return layer;
};
// From a at t to b at t + d, eased, past b by the share os at 72 percent of the way when os is set. Keys of this property
// at or after t are dropped; earlier ones are kept as they are (a hold stays a hold), and only the new keys are eased.
PCS.moveKeys = function (p, t, d, a, b, os) {
  var keys = [[t, a]];
  if (os) { var over = []; for (var i = 0; i < b.length; i++) { over.push(b[i] + (b[i] - a[i]) * os); } keys.push([t + d * 0.72, over]); }
  keys.push([t + d, b]);
  for (var k = p.numKeys; k >= 1; k--) { if (p.keyTime(k) >= t - 0.0005) { p.removeKey(k); } }
  for (var j = 0; j < keys.length; j++) {
    var n = p.addKey(keys[j][0]); p.setValueAtKey(n, keys[j][1]);
    try { AE.setEase(p, n, 70, 70); } catch (e) {}
  }
  return p;
};
