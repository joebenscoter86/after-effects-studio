// Proof scene for the two-sided piece: three tiles, quiet side with a question mark and accent side with a tick: not yet turned, turning, turned.
// Run in one eval.run (rollback: false):
//   $.evalFile(File('<library>/pieces/pcs-core.jsx')); $.evalFile(File('<library>/pieces/proof/two-sided.jsx'));
//   return PCS_PROOF('house');
// Makes one new comp named 'CR PIECE PROOF two-sided <style>' (an earlier one of the same name is replaced); touches nothing else.
// Its still is the frame at PCS_PROOF(...).frame.
function PCS_PROOF(styleName) {
  var id = styleName || PCS.STYLE_DEFAULT;
  PCS.warnings = []; PCS.use(id);
  PCS.need('stage'); PCS.need('plate'); PCS.need('two-sided'); PCS.need('flip'); PCS.need('label'); PCS.need('tick'); PCS.need('on-face');
  var name = 'CR PIECE PROOF two-sided ' + id;
  var old = PCS.findItem(name); if (old) { PCS.removeComp(old); }
  var st = PCS.stage({ name: name, duration: 3 }); var c = st.comp; var S = PCS.S;
  var starts = [1.8, 1.27, 0.6];   // at 1.4 s: not yet turned, mid-turn, turned
  for (var i = 0; i < 3; i++) {
    var tile = PCS.twoSided(c, { name: 'tile ' + (i + 1), w: 280, h: 280, round: 56, color: S.quiet, backColor: S.accent, depth: 50, pos: [210 + i * 330, 640, 0] });
    PCS.onFace(PCS.label(c, { text: '?', size: 170 }), tile.front);
    PCS.onFace(PCS.tick(c, { size: 230, t: starts[i] + 0.3 }), tile.back);
    PCS.flip(tile.front, { t: starts[i] });
  }
  return { comp: name, id: c.id, frame: 1.4, warnings: PCS.warnings };
}
