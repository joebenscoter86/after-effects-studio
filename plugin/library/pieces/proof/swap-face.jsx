// Proof scene for the swap-face piece: a card saying Draft turns away and comes back saying Final. The still is three frames of one band stacked: before, turned away, after.
// Run in one eval.run (rollback: false):
//   $.evalFile(File('<library>/pieces/pcs-core.jsx')); $.evalFile(File('<library>/pieces/proof/swap-face.jsx'));
//   return PCS_PROOF('house');
// Makes one new comp named 'CR PIECE PROOF swap-face <style>' (an earlier one of the same name is replaced); touches nothing else.
// Its still: frames PCS_PROOF(...).frames, band PCS_PROOF(...).band, stacked by tools/pieces/still.mjs.
function PCS_PROOF(styleName) {
  var id = styleName || PCS.STYLE_DEFAULT;
  PCS.warnings = []; PCS.use(id);
  PCS.need('stage'); PCS.need('plate'); PCS.need('swap-face'); PCS.need('flip'); PCS.need('label'); PCS.need('on-face');
  var name = 'CR PIECE PROOF swap-face ' + id;
  var old = PCS.findItem(name); if (old) { PCS.removeComp(old); }
  var st = PCS.stage({ name: name, duration: 3 }); var c = st.comp; var S = PCS.S;
  var card = PCS.plate(c, { name: 'card', w: 760, h: 280, round: 40, pos: [540, 560, 0] });
  var back = PCS.plate(c, { name: 'card back', w: 760, h: 280, round: 40, color: S.accent, depth: 4, bevel: 0, tilt: [0, 0] });
  back.parent = card; PCS.zero(back);
  PCS.TG(back).property('ADBE Position').setValue([0, 0, PCS.depthOf(card) + 2 * PCS.bevelOf(card) + 2]);
  var first = PCS.onFace(PCS.label(c, { text: 'Draft', size: 96, on: 'surface' }), card);
  var second = PCS.onFace(PCS.label(c, { text: 'Final', size: 96, on: 'surface' }), card);
  PCS.flip(card, { t: 0.4, axis: 'x' });
  PCS.flip(card, { t: 1.5, axis: 'x' });
  PCS.swapFace(first, second, 1.1);
  return { comp: name, id: c.id, frames: [0.2, 1.0, 2.3], band: [300, 380], warnings: PCS.warnings };
}
