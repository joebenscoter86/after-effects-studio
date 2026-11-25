// Proof scene for the land-on piece: three ticked tiles fly onto one card at staggered times: one leaving, one mid-arc, one landed on the card.
// Run in one eval.run (rollback: false):
//   $.evalFile(File('<library>/pieces/pcs-core.jsx')); $.evalFile(File('<library>/pieces/proof/land-on.jsx'));
//   return PCS_PROOF('house');
// Makes one new comp named 'CR PIECE PROOF land-on <style>' (an earlier one of the same name is replaced); touches nothing else.
// Its still is the frame at PCS_PROOF(...).frame.
function PCS_PROOF(styleName) {
  var id = styleName || PCS.STYLE_DEFAULT;
  PCS.warnings = []; PCS.use(id);
  PCS.need('stage'); PCS.need('plate'); PCS.need('land-on'); PCS.need('tick'); PCS.need('on-face'); PCS.need('label');
  var name = 'CR PIECE PROOF land-on ' + id;
  var old = PCS.findItem(name); if (old) { PCS.removeComp(old); }
  var st = PCS.stage({ name: name, duration: 3 }); var c = st.comp; var S = PCS.S;
  var card = PCS.plate(c, { name: 'card', w: 760, h: 420, round: 40, pos: [540, 860, 0] });
  PCS.onFace(PCS.label(c, { text: 'Checked', size: 76, on: 'surface', anchor: 'left' }), card, [-320, -120]);
  var starts = [1.5, 1.05, 0.3];   // at 1.4 s: one about to leave, one mid-arc, one landed
  var spots = [[250, 90], [80, 90], [-90, 90]];
  for (var i = 0; i < 3; i++) {
    var tile = PCS.plate(c, { name: 'tile ' + (i + 1), w: 200, h: 200, round: 44, color: S.accent, depth: 30, pos: [220 + i * 320, 380, -100] });
    PCS.onFace(PCS.tick(c, { size: 180 }), tile);
    PCS.landOn(tile, card, { at: spots[i], t: starts[i], dur: 0.6, scale: 60 });
  }
  return { comp: name, id: c.id, frame: 1.4, warnings: PCS.warnings };
}
