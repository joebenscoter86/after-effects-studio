// piece: hide
// name: Show or hide an object with what sits on it
// does: Makes an object, and everything seated on it, appear at one time (hideUntil) or vanish at one time (hideAfter), with a clean cut and no fade.
// use it for: an object that arrives with its move; one that leaves after its move; keeping type off screen until its card has turned to face us
// job: hand-over; support: reveal-headline
// works with: piece-on-face, piece-stand-up, piece-tip-away
// call: PCS.hideUntil(layer, t)  and  PCS.hideAfter(layer, t)
// option t: the time it appears (hideUntil) or goes (hideAfter)
// returns: the layer
// example:
//   var yes = PCS.type3d(st.comp, { text: 'Yes', size: 240, pos: [770, 640, 0] });
//   PCS.hideUntil(yes, 1.0);
//   PCS.hideAfter(yes, 2.9);
// note: children do not take a parent's opacity in After Effects, so hiding a plate by its own opacity leaves its labels floating; this hides them all.
// note: never fade or grey something out to dismiss it; move it away (piece-tip-away) and hide it once it is gone.
// ---
PCS.hideUntil = function (layer, t) {
  var all = [layer].concat(PCS.children(layer));
  for (var i = 0; i < all.length; i++) { try { var p = PCS.TG(all[i]).property('ADBE Opacity'); PCS.cutAt(p, 0, 0); PCS.cutAt(p, t, 100); } catch (e) {} }
  return layer;
};
PCS.hideAfter = function (layer, t) {
  var all = [layer].concat(PCS.children(layer));
  for (var i = 0; i < all.length; i++) { try { PCS.cutAt(PCS.TG(all[i]).property('ADBE Opacity'), t, 0); } catch (e) {} }
  return layer;
};
