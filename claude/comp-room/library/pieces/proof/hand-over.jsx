// Proof scene for the hand-over piece: a face card beat (a title pill and an accent tile above a stand-in speaker card)
// hands over to the cutaway room: the card slides away, the pill tips away, and the tile flies down into the room and lands.
// The still is three whole frames side by side: the face card beat, the hand-over, the room.
// Run in one eval.run (rollback: false):
//   $.evalFile(File('<library>/pieces/pcs-core.jsx')); $.evalFile(File('<library>/pieces/proof/hand-over.jsx'));
//   return PCS_PROOF('house');
// Makes one new comp named 'CR PIECE PROOF hand-over <style>' (an earlier one of the same name is replaced); touches nothing else.
// Its still: frames PCS_PROOF(...).frames side by side (across), made by tools/pieces/still.mjs --across.
function PCS_PROOF(styleName) {
  var id = styleName || PCS.STYLE_DEFAULT;
  PCS.warnings = []; PCS.use(id);
  PCS.need('stage'); PCS.need('plate'); PCS.need('hand-over'); PCS.need('label'); PCS.need('tick'); PCS.need('on-face'); PCS.need('spot');
  var name = 'CR PIECE PROOF hand-over ' + id;
  var old = PCS.findItem(name); if (old) { PCS.removeComp(old); }
  var st = PCS.stage({ name: name, duration: 4 }); var c = st.comp; var S = PCS.S;
  // stand-in for the speaker's face card (the real one is the speaker's clip): a 2D rounded card with a head and shoulders
  var fc = c.layers.addShape(); fc.name = 'face card';
  var g = fc.property('ADBE Root Vectors Group');
  function part(nm, shape, col) {
    var grp = g.addProperty('ADBE Vector Group'); grp.name = nm; var v = grp.property('ADBE Vectors Group');
    v.addProperty('ADBE Vector Shape - Group').property('ADBE Vector Shape').setValue(shape);
    v.addProperty('ADBE Vector Graphic - Fill').property('ADBE Vector Fill Color').setValue(col);
  }
  part('shoulders', PCS.roundRect(540, 1650, 560, 320, 160), PCS.mix(S.quiet, S.ground, 0.35));
  part('head', PCS.roundRect(540, 1380, 230, 270, 115), PCS.mix(S.quiet, S.ground, 0.35));
  part('card', PCS.roundRect(540, 1360, 1040, 740, 56), PCS.mix(S.backplate, S.quiet, 0.25));
  PCS.TG(fc).property('ADBE Position').setValue([0, 0]); PCS.TG(fc).property('ADBE Anchor Point').setValue([0, 0]);
  fc.moveToBeginning();
  var pill = PCS.plate(c, { name: 'title pill', w: 760, h: 160, round: 80, pos: [540, 330, 0] });
  PCS.onFace(PCS.label(c, { text: 'Is it right?', size: 80, on: 'surface' }), pill);
  var tile = PCS.plate(c, { name: 'tile', w: 300, h: 300, round: 56, color: S.accent, depth: 40, pos: [540, 690, 0] });
  PCS.onFace(PCS.tick(c, { size: 260, t: 0.3 }), tile);
  var rm = PCS.handOver(st, { t: 1.2, dur: 1.0, carry: tile, to: [540, 1500 - 150 - 1, 700], leave: [pill] });
  PCS.spot(c, { name: 'pool', on: tile, from: 'above', t: 2.3, dimKey: 0.5 });
  return { comp: name, id: c.id, frames: [0.9, 1.75, 3.6], across: true, warnings: PCS.warnings };
}
