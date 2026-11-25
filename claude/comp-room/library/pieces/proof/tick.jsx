// Proof scene for the tick piece: three accent tiles with the tick a third drawn, two thirds drawn and done.
// Run in one eval.run (rollback: false):
//   $.evalFile(File('<library>/pieces/pcs-core.jsx')); $.evalFile(File('<library>/pieces/proof/tick.jsx'));
//   return PCS_PROOF('house');
// Makes one new comp named 'CR PIECE PROOF tick <style>' (an earlier one of the same name is replaced); touches nothing else.
// Its still is the frame at PCS_PROOF(...).frame.
function PCS_PROOF(styleName) {
  var id = styleName || PCS.STYLE_DEFAULT;
  PCS.warnings = []; PCS.use(id);
  PCS.need('stage'); PCS.need('plate'); PCS.need('tick'); PCS.need('on-face');
  var name = 'CR PIECE PROOF tick ' + id;
  var old = PCS.findItem(name); if (old) { PCS.removeComp(old); }
  var st = PCS.stage({ name: name, duration: 2 }); var c = st.comp; var S = PCS.S;
  var starts = [0.78, 0.66, 0.2];   // drawn over 0.45 s: at 1.0 s a third, two thirds, done
  for (var i = 0; i < 3; i++) {
    var tile = PCS.plate(c, { name: 'tile ' + (i + 1), w: 290, h: 290, round: 56, color: S.accent, pos: [210 + i * 330, 640, 0] });
    PCS.onFace(PCS.tick(c, { name: 'tick ' + (i + 1), size: 250, t: starts[i], dur: 0.45 }), tile);
  }
  return { comp: name, id: c.id, frame: 1.0, warnings: PCS.warnings };
}
