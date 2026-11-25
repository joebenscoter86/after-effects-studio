// Proof scene for the tip-away piece: a lit word tips backward and falls away into the dark. The still is three frames of one band stacked: standing, tipping, falling away.
// Run in one eval.run (rollback: false):
//   $.evalFile(File('<library>/pieces/pcs-core.jsx')); $.evalFile(File('<library>/pieces/proof/tip-away.jsx'));
//   return PCS_PROOF('house');
// Makes one new comp named 'CR PIECE PROOF tip-away <style>' (an earlier one of the same name is replaced); touches nothing else.
// Its still: frames PCS_PROOF(...).frames, band PCS_PROOF(...).band, stacked by tools/pieces/still.mjs.
function PCS_PROOF(styleName) {
  var id = styleName || PCS.STYLE_DEFAULT;
  PCS.warnings = []; PCS.use(id);
  PCS.need('stage'); PCS.need('plate'); PCS.need('tip-away'); PCS.need('type3d');
  var name = 'CR PIECE PROOF tip-away ' + id;
  var old = PCS.findItem(name); if (old) { PCS.removeComp(old); }
  var st = PCS.stage({ name: name, duration: 2 }); var c = st.comp; var S = PCS.S;
  var word = PCS.type3d(c, { text: 'Maybe', size: 260, pos: [540, 600, 0] });
  PCS.tipAway(word, { t: 0.4, dur: 0.6 });
  return { comp: name, id: c.id, frames: [0.3, 0.64, 0.73], band: [300, 420], warnings: PCS.warnings };
}
