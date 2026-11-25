// Proof scene for the stage piece: the stage alone with one plate resting in it, so the ground, the backplate,
// the key's soft shadow and the fill read. Frame: PCS_PROOF.frame.
// Run: $.evalFile(File('<library>/pieces/pcs-core.jsx')); $.evalFile(File('<library>/pieces/proof/stage.jsx')); return PCS_PROOF('example-warm-paper');
// Makes one new comp named 'CR PIECE PROOF stage <style>' (an earlier one of the same name is replaced); touches nothing else.
function PCS_PROOF(styleName) {
  PCS.warnings = []; PCS.use(styleName || 'example-warm-paper');
  PCS.need('stage'); PCS.need('plate');
  var name = 'CR PIECE PROOF stage ' + (styleName || 'example-warm-paper');
  var old = PCS.findItem(name); if (old) { old.remove(); }
  var st = PCS.stage({ name: name, duration: 2 });
  PCS.plate(st.comp, { name: 'card', w: 640, h: 420, round: 36, pos: [540, 700, 0] });
  return { comp: name, id: st.comp.id, frame: 1.0, warnings: PCS.warnings };
}
