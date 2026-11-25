// Proof scene for the plate piece: a card, a pill, a tile and a thin bar on the stage, so thickness, bevel,
// side wall and shadow read at four sizes. Frame: PCS_PROOF.frame.
// Run: $.evalFile(File('<library>/pieces/pcs-core.jsx')); $.evalFile(File('<library>/pieces/proof/plate.jsx')); return PCS_PROOF('example-warm-paper');
// Makes one new comp named 'CR PIECE PROOF plate <style>' (an earlier one of the same name is replaced); touches nothing else.
function PCS_PROOF(styleName) {
  PCS.warnings = []; PCS.use(styleName || 'example-warm-paper');
  PCS.need('stage'); PCS.need('plate');
  var name = 'CR PIECE PROOF plate ' + (styleName || 'example-warm-paper');
  var old = PCS.findItem(name); if (old) { old.remove(); }
  var st = PCS.stage({ name: name, duration: 2 }); var c = st.comp; var S = PCS.S;
  PCS.plate(c, { name: 'pill', w: 760, h: 160, round: 80, pos: [540, 330, 0] });
  PCS.plate(c, { name: 'card', w: 560, h: 380, round: 34, pos: [430, 720, 0] });
  PCS.plate(c, { name: 'tile', w: 260, h: 260, round: 48, color: S.accent, pos: [830, 700, -60] });
  PCS.plate(c, { name: 'bar', w: 700, h: 60, round: 30, color: S.quiet, pos: [540, 1050, 0] });
  return { comp: name, id: c.id, frame: 1.0, warnings: PCS.warnings };
}
