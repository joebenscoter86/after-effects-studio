// Proof scene for the type3d piece: one large lit number with its side wall and shadow, a flat label under it.
// Run in one eval.run (rollback: false):
//   $.evalFile(File('<library>/pieces/pcs-core.jsx')); $.evalFile(File('<library>/pieces/proof/type3d.jsx'));
//   return PCS_PROOF('house');
// Makes one new comp named 'CR PIECE PROOF type3d <style>' (an earlier one of the same name is replaced); touches nothing else.
// Its still is the frame at PCS_PROOF(...).frame.
function PCS_PROOF(styleName) {
  var id = styleName || PCS.STYLE_DEFAULT;
  PCS.warnings = []; PCS.use(id);
  PCS.need('stage'); PCS.need('plate'); PCS.need('type3d'); PCS.need('label');
  var name = 'CR PIECE PROOF type3d ' + id;
  var old = PCS.findItem(name); if (old) { PCS.removeComp(old); }
  var st = PCS.stage({ name: name, duration: 2 }); var c = st.comp; var S = PCS.S;
  PCS.type3d(c, { text: '42', size: 560, pos: [540, 560, 0] });
  PCS.label(c, { text: 'tests passed', size: 72, pos: [540, 930, 0] });
  return { comp: name, id: c.id, frame: 1.0, warnings: PCS.warnings };
}
