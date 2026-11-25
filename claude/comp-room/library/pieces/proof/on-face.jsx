// Proof scene for the on-face piece: a card with words and a raised lit chip on its face, and the same card turned over showing what is seated on its back.
// Run in one eval.run (rollback: false):
//   $.evalFile(File('<library>/pieces/pcs-core.jsx')); $.evalFile(File('<library>/pieces/proof/on-face.jsx'));
//   return PCS_PROOF('house');
// Makes one new comp named 'CR PIECE PROOF on-face <style>' (an earlier one of the same name is replaced); touches nothing else.
// Its still is the frame at PCS_PROOF(...).frame.
function PCS_PROOF(styleName) {
  var id = styleName || PCS.STYLE_DEFAULT;
  PCS.warnings = []; PCS.use(id);
  PCS.need('stage'); PCS.need('plate'); PCS.need('on-face'); PCS.need('label');
  var name = 'CR PIECE PROOF on-face ' + id;
  var old = PCS.findItem(name); if (old) { PCS.removeComp(old); }
  var st = PCS.stage({ name: name, duration: 2 }); var c = st.comp; var S = PCS.S;
  var a = PCS.plate(c, { name: 'card front', w: 760, h: 300, round: 40, pos: [540, 420, 0] });
  PCS.onFace(PCS.label(c, { text: 'Front face', size: 76, on: 'surface' }), a, [-60, 0]);
  PCS.onFace(PCS.plate(c, { name: 'chip', w: 90, h: 90, round: 45, color: S.accent, depth: 14, bevel: 2, tilt: [0, 0] }), a, [270, 0], true);
  var b = PCS.plate(c, { name: 'card turned', w: 760, h: 300, round: 40, pos: [540, 820, 0] });
  PCS.onFace(PCS.label(c, { text: 'Front face', size: 76, on: 'surface' }), b);
  PCS.onBack(PCS.label(c, { text: 'Back face', size: 76, on: 'surface' }), b, [0, 0], 'x');
  PCS.TG(b).property('ADBE Rotate X').setValue(S.tilt[0] + 180);
  return { comp: name, id: c.id, frame: 1.0, warnings: PCS.warnings };
}
