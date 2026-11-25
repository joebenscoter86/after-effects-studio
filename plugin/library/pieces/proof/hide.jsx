// Proof scene for the hide piece: a card with its label and tile appears at one time and goes at another, beside a bar that stays. The still is three frames of one band stacked: before, shown, gone.
// Run in one eval.run (rollback: false):
//   $.evalFile(File('<library>/pieces/pcs-core.jsx')); $.evalFile(File('<library>/pieces/proof/hide.jsx'));
//   return PCS_PROOF('house');
// Makes one new comp named 'CR PIECE PROOF hide <style>' (an earlier one of the same name is replaced); touches nothing else.
// Its still: frames PCS_PROOF(...).frames, band PCS_PROOF(...).band, stacked by tools/pieces/still.mjs.
function PCS_PROOF(styleName) {
  var id = styleName || PCS.STYLE_DEFAULT;
  PCS.warnings = []; PCS.use(id);
  PCS.need('stage'); PCS.need('plate'); PCS.need('hide'); PCS.need('label'); PCS.need('tick'); PCS.need('on-face');
  var name = 'CR PIECE PROOF hide ' + id;
  var old = PCS.findItem(name); if (old) { PCS.removeComp(old); }
  var st = PCS.stage({ name: name, duration: 2.5 }); var c = st.comp; var S = PCS.S;
  var card = PCS.plate(c, { name: 'card', w: 640, h: 260, round: 40, pos: [470, 560, 0] });
  PCS.onFace(PCS.label(c, { text: 'Ready', size: 84, on: 'surface' }), card, [-80, 0]);
  var tile = PCS.plate(c, { name: 'tile', w: 150, h: 150, round: 34, color: S.accent, depth: 20, bevel: 2, tilt: [0, 0] });
  PCS.onFace(tile, card, [200, 0], true);
  PCS.onFace(PCS.tick(c, { size: 130 }), tile);
  PCS.plate(c, { name: 'bar that stays', w: 160, h: 260, round: 40, color: S.quiet, pos: [930, 560, 0] });
  PCS.hideUntil(card, 0.6); PCS.hideAfter(card, 1.6);
  return { comp: name, id: c.id, frames: [0.3, 1.0, 1.9], band: [300, 380], warnings: PCS.warnings };
}
