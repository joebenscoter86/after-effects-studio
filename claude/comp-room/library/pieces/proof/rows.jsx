// Proof scene for the rows piece: a card filling with ticked rows, the last one still growing in.
// Run in one eval.run (rollback: false):
//   $.evalFile(File('<library>/pieces/pcs-core.jsx')); $.evalFile(File('<library>/pieces/proof/rows.jsx'));
//   return PCS_PROOF('house');
// Makes one new comp named 'CR PIECE PROOF rows <style>' (an earlier one of the same name is replaced); touches nothing else.
// Its still is the frame at PCS_PROOF(...).frame.
function PCS_PROOF(styleName) {
  var id = styleName || PCS.STYLE_DEFAULT;
  PCS.warnings = []; PCS.use(id);
  PCS.need('stage'); PCS.need('plate'); PCS.need('rows'); PCS.need('label'); PCS.need('on-face');
  var name = 'CR PIECE PROOF rows ' + id;
  var old = PCS.findItem(name); if (old) { PCS.removeComp(old); }
  var st = PCS.stage({ name: name, duration: 2 }); var c = st.comp; var S = PCS.S;
  var card = PCS.plate(c, { name: 'card', w: 780, h: 600, round: 40, pos: [540, 640, 0] });
  PCS.onFace(PCS.label(c, { text: 'Test log', size: 62, on: 'surface', anchor: 'left' }), card, [-320, -210]);
  PCS.rows(c, card, { n: 5, left: -320, top: -110, rowWidth: 560, ticks: true, t: 0.2, stagger: 0.25 });
  return { comp: name, id: c.id, frame: 1.3, warnings: PCS.warnings };
}
