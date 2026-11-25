// piece: on-face
// name: Seat a layer on a face of an object
// does: Puts a layer (type, a tick, a picture, a smaller plate) on the front or the back face of a plate, so it moves, turns and stands up with it.
// use it for: words or a mark on a card, a pill or a tile; what the back says before a flip; a raised detail on a face
// job: make-concrete; support: before-after, list-items
// works with: piece-plate, piece-flip, piece-label, piece-two-sided
// call: PCS.onFace(layer, plate, at, lit)  and  PCS.onBack(layer, plate, at, axis, gap)
// option at: [x, y] from the plate's centre, default [0, 0]
// option lit: onFace only. false (default) keeps flat graphics and type their exact colour; true seats a thick detail (a smaller plate) that takes the light
// option axis: onBack only. The axis the plate will flip on ('x' or 'y'), so the back reads the right way up after the flip
// option gap: onBack only. Distance behind the plate's body, default twice the bevel plus 6
// returns: the layer
// example:
//   var card = PCS.plate(st.comp, { name: 'card', w: 600, h: 360, round: 34, pos: [540, 500, 0] });
//   PCS.onFace(PCS.label(st.comp, { text: 'Question', size: 80, on: 'surface' }), card);
//   PCS.onBack(PCS.label(st.comp, { text: 'Answer', size: 80, on: 'surface' }), card, [0, 0], 'x');
//   PCS.flip(card, { t: 1.2, axis: 'x' });
// note: children do not take a parent's opacity in After Effects: hide an object with piece-hide, which takes what sits on it too.
// ---
PCS.onFace = function (layer, plate, at, lit) {
  layer.threeDLayer = true; layer.parent = plate; PCS.zero(layer);
  PCS.TG(layer).property('ADBE Position').setValue([(at ? at[0] : 0), (at ? at[1] : 0), lit ? -(PCS.depthOf(layer)) : -3]);
  if (!lit) { PCS.sp(layer, PCS.MG, 'ADBE Accepts Lights', 0); PCS.sp(layer, PCS.MG, 'ADBE Casts Shadows', 0); }
  return layer;
};
PCS.onBack = function (layer, plate, at, axis, gap) {
  layer.threeDLayer = true; layer.parent = plate; PCS.zero(layer);
  PCS.TG(layer).property('ADBE Position').setValue([(at ? at[0] : 0), (at ? at[1] : 0), PCS.depthOf(plate) + (gap || (2 * PCS.bevelOf(plate) + 6))]);
  PCS.TG(layer).property(axis === 'x' ? 'ADBE Rotate X' : 'ADBE Rotate Y').setValue(180);
  PCS.sp(layer, PCS.MG, 'ADBE Accepts Lights', 0);
  PCS.sp(layer, PCS.MG, 'ADBE Casts Shadows', 0);
  return layer;
};
