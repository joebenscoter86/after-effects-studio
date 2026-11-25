// piece: swap-face
// name: Change what a face says while it is turned away
// does: At one moment the old layer on a face goes and the new one shows, so an object that turns away and back comes back saying something new.
// use it for: a card that turns twice and returns with a new message; a counter that changes while edge-on; a third side on a two-sided object
// job: before-after; support: hand-over
// works with: piece-flip, piece-on-face
// call: PCS.swapFace(oldLayer, newLayer, t)
// option t: the swap time; put it where the face is edge-on or turned away (half way through a flip)
// returns: nothing
// example:
//   PCS.onFace(first, card); PCS.onFace(second, card);
//   PCS.flip(card, { t: 1.0, axis: 'x' }); PCS.flip(card, { t: 2.0, axis: 'x' });
//   PCS.swapFace(first, second, 1.7);   // while the front is turned away
// ---
PCS.swapFace = function (oldLayer, newLayer, t) {
  PCS.cutAt(PCS.TG(oldLayer).property('ADBE Opacity'), t, 0);
  PCS.showFrom(PCS.TG(newLayer).property('ADBE Opacity'), t);
};
