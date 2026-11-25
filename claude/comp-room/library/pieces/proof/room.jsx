// Proof scene for the room piece: a card standing on the floor in its pool of light, an accent tile lying beside it and a
// quieter card further back, in the full-frame room with its wall wash and depth of field.
// Run in one eval.run (rollback: false):
//   $.evalFile(File('<library>/pieces/pcs-core.jsx')); $.evalFile(File('<library>/pieces/proof/room.jsx'));
//   return PCS_PROOF('house');
// Makes one new comp named 'CR PIECE PROOF room <style>' (an earlier one of the same name is replaced); touches nothing else.
// Its still is the frame at PCS_PROOF(...).frame.
function PCS_PROOF(styleName) {
  var id = styleName || PCS.STYLE_DEFAULT;
  PCS.warnings = []; PCS.use(id);
  PCS.need('room'); PCS.need('plate'); PCS.need('spot'); PCS.need('label'); PCS.need('on-face');
  var name = 'CR PIECE PROOF room ' + id;
  var old = PCS.findItem(name); if (old) { PCS.removeComp(old); }
  var rm = PCS.room({ name: name, duration: 3 }); var c = rm.comp; var S = PCS.S;
  var card = PCS.plate(c, { name: 'card', w: 520, h: 360, round: 30, pos: rm.stand(360, 430, 800), tilt: [0, -14] });
  PCS.onFace(PCS.label(c, { text: 'Chosen', size: 84, on: 'surface' }), card);
  var back = PCS.plate(c, { name: 'card behind', w: 420, h: 300, round: 26, color: S.quiet, pos: rm.stand(300, 860, 1700), tilt: [0, -20] });
  var tile = PCS.plate(c, { name: 'tile on the floor', w: 240, h: 240, round: 40, color: S.accent, depth: 24, pos: rm.lie(780, 620, 24), tilt: [-90, 0] });
  PCS.spot(c, { name: 'pool', on: card, from: 'above', t: 0.4, dimKey: 0.6 });
  return { comp: name, id: c.id, frame: 2.5, warnings: PCS.warnings };
}
