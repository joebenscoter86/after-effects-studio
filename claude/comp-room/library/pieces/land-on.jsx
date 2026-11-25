// piece: land-on
// name: Carry an object onto another
// does: One object travels in an arc toward the camera and seats itself on a plate's face, taking the plate's angle, with a small settle; it can shrink as it lands.
// use it for: a seal on a result; a piece fitting into place; the thing that carried one idea arriving on the next
// job: hand-over; support: show-proof, relate-things
// provides: motion: bounce
// works with: piece-two-sided, piece-stand-up, piece-plate
// call: PCS.landOn(obj, plate, { at, t, dur, lift, scale, gap })
// option at: [x, y] on the plate's face from its centre, default [0, 0]
// option t: when it leaves (required)
// option dur: seconds, default 0.5
// option lift: how far toward the camera it comes on the way, default 260, so it never cuts through the plate
// option scale: its size in percent at landing (optional), with a small overshoot
// option gap: space in front of the face, default 4
// returns: where it lands, [x, y, z] in the comp
// example:
//   PCS.standUp(card, { t: 2.6 });
//   PCS.landOn(tile.front, card, { at: [250, 130], t: 3.3, dur: 0.6, scale: 34 });
// note: land after the plate has stopped moving: the object does not follow the plate afterwards.
// note: it keeps whichever side is showing: an object turned over lands still turned over.
// ---
PCS.landOn = function (obj, plate, o) {
  var d = o.dur || 0.5; var te = o.t + d; var at = o.at || [0, 0];
  var target = PCS.toWorld(plate, [at[0], at[1], -(PCS.depthOf(obj) + (o.gap === undefined ? 4 : o.gap))], te);
  var T = PCS.TG(obj); var pos = T.property('ADBE Position'); var p0 = pos.valueAtTime(o.t, false);
  var lift = (o.lift === undefined) ? 260 : o.lift;
  var mid = [(p0[0] + target[0]) / 2, (p0[1] + target[1]) / 2 - 30, Math.min(p0[2], target[2]) - lift];
  PCS.kfFrom(pos, [[o.t, p0], [o.t + d * 0.55, mid], [o.t + d * 0.9, [target[0], target[1], target[2] + 6]], [te, target]]);
  var PT = PCS.TG(plate); var ax = ['ADBE Rotate X', 'ADBE Rotate Y'];
  for (var i = 0; i < 2; i++) {
    var r = T.property(ax[i]); var goal = PT.property(ax[i]).valueAtTime(te, false);
    var cur = r.valueAtTime(o.t, false); var turns = Math.round((cur - goal) / 180) * 180;
    PCS.kfFrom(r, [[o.t, cur], [te, goal + turns]]);
  }
  if (o.scale !== undefined) {
    var sc = T.property('ADBE Scale'); var s0 = sc.valueAtTime(o.t, false);
    PCS.kfFrom(sc, [[o.t, s0], [o.t + d * 0.85, [o.scale * 1.08, o.scale * 1.08, 100]], [te, [o.scale, o.scale, 100]]]);
  }
  return target;
};
