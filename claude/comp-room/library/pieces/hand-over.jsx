// piece: hand-over
// name: Hand over from a face card beat to a cutaway room
// does: In one comp with one camera, turns a face card beat into a full-frame cutaway: the face card slides away, the dark backplate falls away to reveal a lit room, the stage's light gives way to the room's, the camera travels from the face-on view down into the room, and the object that carried the idea flies into the room and lands where it belongs.
// use it for: the moment the explanation leaves the speaker for a cutaway; continuity between a face card beat and the cutaway after it; a carried object from the previous beat flying into the room
// job: hand-over; support: establish-place, move-camera
// provides: camera: travel; environment: room
// works with: piece-stage, piece-room, piece-land-on, piece-tip-away, piece-stand-up
// call: PCS.handOver(st, { t, dur, carry, to, pose, leave })
// option st: what PCS.stage returned (the beat's comp, its backplate, its lights and its camera)
// option t: when the hand-over starts (required)
// option dur: seconds, default 1.0
// option carry: the layer that carries the idea into the room (optional); it keeps its colour and flies in an arc
// option to: where carry lands, [x, y, z] in the room (rm.stand(h, x, z) or rm.lie(x, z, depth) give a spot on the floor)
// option pose: carry's [x, y] rotation on landing, default [0, -12]
// option leave: layers that are finished; each tips away into the dark as the room arrives
// returns: what PCS.room returns, for the room's floor, lights and spots
// example:
//   var st = PCS.stage({ name: 'BEAT 4', duration: 6, stitch: { path: 'stitch.mp4', start: 12.4 } });
//   var tile = PCS.plate(st.comp, { name: 'tile', w: 300, h: 300, round: 56, color: PCS.S.accent, pos: [540, 560, 0] });
//   var rm = PCS.handOver(st, { t: 2.0, carry: tile, to: [540, 1349, 700] });
//   PCS.spot(rm.comp, { name: 'pool', on: tile, from: 'above', t: 3.0, dimKey: 0.5 });
// note: nothing cuts: one comp, one camera, and the carried object stays in view the whole way. The accent stays on it.
// note: the stage's key and fill are renamed 'stage key' and 'stage fill' and fade out; 'key' is the room's from then on.
// note: what is finished leaves in the same half second as the room arrives; never fade or grey it out.
// ---
PCS.need('room'); PCS.need('tip-away'); PCS.need('hide');
PCS.handOver = function (st, o) {
  var comp = st.comp; var t = o.t; var d = o.dur || 1.0; var G = 'ADBE Light Options Group';
  // the stage's lights give way
  var old = [[st.key, 'stage key'], [st.fill, 'stage fill']];
  for (var i = 0; i < old.length; i++) {
    var L = old[i][0]; if (!L) { continue; }
    L.name = old[i][1];
    var I = L.property(G).property('ADBE Light Intensity');
    PCS.kfFrom(I, [[t, I.valueAtTime(t, false)], [t + d, 0]]);
  }
  // the room, built in the same comp, takes the camera from t
  var rm = PCS.room({ comp: comp, t: t, dur: d * 0.6, cam: st.cam, camDur: d });
  // the face card slides away; the backplate falls back past the room's wall and goes
  var fc = null; try { fc = comp.layer('face card'); } catch (e) { fc = null; }
  if (fc) {
    var FP = PCS.TG(fc).property('ADBE Position'); var f0 = FP.valueAtTime(t, false);
    PCS.kfFrom(FP, [[t, f0], [t + d * 0.5, [f0[0], f0[1] + 1400]]]);
    PCS.hideAfter(fc, t + d * 0.5);
  }
  var BP = PCS.TG(st.backplate).property('ADBE Position'); var b0 = BP.valueAtTime(t, false);
  PCS.kfFrom(BP, [[t, b0], [t + d * 0.6, [b0[0], b0[1], 4200]]]);
  PCS.hideAfter(st.backplate, t + d * 0.6);
  // what is finished leaves
  var leave = o.leave || [];
  for (var j = 0; j < leave.length; j++) { PCS.tipAway(leave[j], { t: t + 0.05 * j, dur: 0.45 }); }
  // the carried object flies into the room and lands
  if (o.carry) {
    var T = PCS.TG(o.carry); var P = T.property('ADBE Position'); var p0 = P.valueAtTime(t, false); var to = o.to;
    var mid = [(p0[0] + to[0]) / 2, Math.min(p0[1], to[1]) - 160, (p0[2] + to[2]) / 2 - 200];
    PCS.kfFrom(P, [[t, p0], [t + d * 0.55, mid], [t + d * 0.9, [to[0], to[1] - 24, to[2]]], [t + d, to]]);
    var pose = o.pose || [0, -12]; var ax = ['ADBE Rotate X', 'ADBE Rotate Y'];
    for (var k = 0; k < 2; k++) {
      var R = T.property(ax[k]); var r0 = R.valueAtTime(t, false);
      var goal = pose[k] + Math.round((r0 - pose[k]) / 180) * 180;   // half turns: keeps whichever side is showing
      PCS.kfFrom(R, [[t, r0], [t + d, goal]]);
    }
  }
  return rm;
};
