// Proof scene for the stand-up piece: a card lying flat stands up past upright and settles, its words appearing once it faces us. The still is three frames of one band stacked: rising, past upright, settled.
// Run in one eval.run (rollback: false):
//   $.evalFile(File('<library>/pieces/pcs-core.jsx')); $.evalFile(File('<library>/pieces/proof/stand-up.jsx'));
//   return PCS_PROOF('house');
// Makes one new comp named 'CR PIECE PROOF stand-up <style>' (an earlier one of the same name is replaced); touches nothing else.
// Its still: frames PCS_PROOF(...).frames, band PCS_PROOF(...).band, stacked by tools/pieces/still.mjs.
function PCS_PROOF(styleName) {
  var id = styleName || PCS.STYLE_DEFAULT;
  PCS.warnings = []; PCS.use(id);
  PCS.need('stage'); PCS.need('plate'); PCS.need('stand-up'); PCS.need('label'); PCS.need('rows'); PCS.need('on-face');
  var name = 'CR PIECE PROOF stand-up ' + id;
  var old = PCS.findItem(name); if (old) { PCS.removeComp(old); }
  var st = PCS.stage({ name: name, duration: 2 }); var c = st.comp; var S = PCS.S;
  var card = PCS.plate(c, { name: 'card', w: 720, h: 360, round: 40, pos: [540, 600, 0] });
  PCS.onFace(PCS.label(c, { text: 'Result', size: 80, on: 'surface', anchor: 'left' }), card, [-290, -90]);
  PCS.rows(c, card, { n: 2, left: -290, top: 20, rowWidth: 500 });
  PCS.standUp(card, { t: 0.3, dur: 0.6 });
  return { comp: name, id: c.id, frames: [0.46, 0.65, 1.2], band: [300, 420], warnings: PCS.warnings };
}
