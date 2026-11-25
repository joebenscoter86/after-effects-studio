// piece: tip-away
// name: Tip an object away into the dark
// does: An object tips backward and falls away behind the backplate, then is hidden with what sits on it; type on it goes once it has tipped half way, so it is never seen squashed.
// use it for: dismissing what is finished as the next thing arrives; a wrong or hollow answer leaving (flag a problem with it); a line of words leaving; clearing the frame without a fade
// job: hand-over; support: fail-then-fix, before-after, flag-a-problem
// provides: motion: swing
// works with: piece-hide, piece-type3d, piece-plate
// call: PCS.tipAway(plate, { t, dur, down, back })
// option t: when it starts (required)
// option dur: seconds, default 0.45
// option down: how far it drops, default 200
// option back: how far it travels back from the camera, default 800 (behind the backplate)
// returns: the layer
// example:
//   var yes = PCS.type3d(st.comp, { text: 'Yes', size: 240, pos: [770, 640, 0] });
//   PCS.tipAway(yes, { t: 2.4 });
// note: it falls back, never down through the face card. Never fade or grey something out to dismiss it.
// ---
PCS.need('hide');
PCS.tipAway = function (plate, o) {
  var T = PCS.TG(plate); var d = o.dur || 0.45;
  var rx = T.property('ADBE Rotate X'); var pos = T.property('ADBE Position');
  var a = rx.valueAtTime(o.t, false); var p = pos.valueAtTime(o.t, false);
  var down = (o.down === undefined) ? 200 : o.down; var back = (o.back === undefined) ? 800 : o.back;
  PCS.kfFrom(rx, [[o.t, a], [o.t + d, a - 100]]);
  PCS.kfFrom(pos, [[o.t, p], [o.t + d * 0.35, [p[0], p[1] - 20, p[2] + back * 0.1]], [o.t + d, [p[0], p[1] + down, p[2] + back]]]);
  // What sits on it (a line's words, a card's labels) goes once it has tipped 50 degrees: thin type foreshortens badly.
  var cut = o.t + d;
  for (var f = 1; f <= 30; f++) { var tf = o.t + d * f / 30; if (Math.abs(rx.valueAtTime(tf, false) - a) >= 50) { cut = tf; break; } }
  var ch = PCS.children(plate);
  for (var i = 0; i < ch.length; i++) { try { PCS.cutAt(PCS.TG(ch[i]).property('ADBE Opacity'), cut, 0); } catch (e) {} }
  PCS.hideAfter(plate, o.t + d);
  return plate;
};
