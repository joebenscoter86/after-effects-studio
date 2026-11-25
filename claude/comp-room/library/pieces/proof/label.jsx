// Proof scene for the label piece: flat type on a card, on the accent and on the ground, each in the colour that reads there.
// Run in one eval.run (rollback: false):
//   $.evalFile(File('<library>/pieces/pcs-core.jsx')); $.evalFile(File('<library>/pieces/proof/label.jsx'));
//   return PCS_PROOF('house');
// Makes one new comp named 'CR PIECE PROOF label <style>' (an earlier one of the same name is replaced); touches nothing else.
// Its still is the frame at PCS_PROOF(...).frame.
function PCS_PROOF(styleName) {
  var id = styleName || PCS.STYLE_DEFAULT;
  PCS.warnings = []; PCS.use(id);
  PCS.need('stage'); PCS.need('plate'); PCS.need('label'); PCS.need('on-face');
  var name = 'CR PIECE PROOF label ' + id;
  var old = PCS.findItem(name); if (old) { PCS.removeComp(old); }
  var st = PCS.stage({ name: name, duration: 2 }); var c = st.comp; var S = PCS.S;
  var card = PCS.plate(c, { name: 'card', w: 800, h: 300, round: 40, pos: [540, 420, 0] });
  PCS.onFace(PCS.label(c, { text: '42 passed, 0 failed', size: 70, on: 'surface' }), card);
  var pill = PCS.plate(c, { name: 'pill', w: 460, h: 150, round: 75, color: S.accent, pos: [540, 760, 0] });
  PCS.onFace(PCS.label(c, { text: 'Proof', size: 80, on: 'accent' }), pill);
  PCS.label(c, { text: 'checked before release', size: 60, pos: [540, 1000, 0] });
  return { comp: name, id: c.id, frame: 1.0, warnings: PCS.warnings };
}
