// Proof scene for the words piece: the same line on three pills at three moments of building: one word, two words, all three.
// Run in one eval.run (rollback: false):
//   $.evalFile(File('<library>/pieces/pcs-core.jsx')); $.evalFile(File('<library>/pieces/proof/words.jsx'));
//   return PCS_PROOF('house');
// Makes one new comp named 'CR PIECE PROOF words <style>' (an earlier one of the same name is replaced); touches nothing else.
// Its still is the frame at PCS_PROOF(...).frame.
function PCS_PROOF(styleName) {
  var id = styleName || PCS.STYLE_DEFAULT;
  PCS.warnings = []; PCS.use(id);
  PCS.need('stage'); PCS.need('plate'); PCS.need('words'); PCS.need('on-face');
  var name = 'CR PIECE PROOF words ' + id;
  var old = PCS.findItem(name); if (old) { PCS.removeComp(old); }
  var st = PCS.stage({ name: name, duration: 2 }); var c = st.comp; var S = PCS.S;
  var shown = [[0.2, 1.6, 1.8], [0.2, 0.5, 1.6], [0.2, 0.5, 0.8]];   // at 1.0 s: 'Ask', 'Ask for', 'Ask for proof'
  for (var i = 0; i < 3; i++) {
    var pill = PCS.plate(c, { name: 'pill ' + (i + 1), w: 760, h: 170, round: 85, pos: [540, 380 + i * 290, 0] });
    var line = PCS.words(c, { name: 'line ' + (i + 1), words: [{ text: 'Ask', t: shown[i][0] }, { text: 'for', t: shown[i][1] }, { text: 'proof', t: shown[i][2] }], size: 84, on: 'surface' });
    PCS.onFace(line.holder, pill);
  }
  return { comp: name, id: c.id, frame: 1.0, warnings: PCS.warnings };
}
