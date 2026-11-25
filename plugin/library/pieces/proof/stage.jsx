// Proof scene for the stage piece: a thick card stands in the lit set, turned enough to show its side wall, with its
// soft shadow falling on the backplate behind it, and a small tile nearer the camera; so the depth, the key's shadow,
// the fill and the dark ground all read in one frame. Frame: PCS_PROOF.frame.
// Run: $.evalFile(File('<library>/pieces/pcs-core.jsx')); $.evalFile(File('<library>/pieces/proof/stage.jsx')); return PCS_PROOF('house');
// Makes one new comp named 'CR PIECE PROOF stage <style>' (an earlier one of the same name is replaced); touches nothing else.
function PCS_PROOF(styleName) {
  PCS.warnings = []; PCS.use(styleName || 'house');
  PCS.need('stage'); PCS.need('plate');
  var name = 'CR PIECE PROOF stage ' + (styleName || 'house');
  var old = PCS.findItem(name); if (old) { PCS.removeComp(old); }
  var st = PCS.stage({ name: name, duration: 2 }); var S = PCS.S;
  PCS.plate(st.comp, { name: 'card', w: 620, h: 420, round: 36, depth: 70, pos: [560, 640, 330], tilt: [8, -26] });
  PCS.plate(st.comp, { name: 'tile', w: 220, h: 220, round: 40, color: S.accent, depth: 60, pos: [330, 1000, -260], tilt: [8, -26] });
  return { comp: name, id: st.comp.id, frame: 1.0, warnings: PCS.warnings };
}
